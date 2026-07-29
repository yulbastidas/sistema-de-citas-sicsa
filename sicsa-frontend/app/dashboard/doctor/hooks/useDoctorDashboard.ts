"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

import {
  downloadAppointmentPdf,
  getDoctorAppointments,
  getQueueAppointments,
  markAppointmentNoShow,
} from "@/service/appointment";
import {
  getToken,
  getUser,
  logout,
} from "@/service/session";
import {
  AppointmentItem,
  SessionUser,
} from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "http://74.161.42.39:3000";

/**
 * Obtiene la fecha actual de Colombia en formato YYYY-MM-DD.
 *
 * Evita usar toISOString(), porque trabaja en UTC y puede
 * cambiar el día durante la noche en Colombia.
 */
function getColombiaDate(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function normalizeRole(
  role: string | number | undefined,
): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";

  if (typeof role === "string") {
    return role;
  }

  return undefined;
}

export function useDoctorDashboard() {
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [user, setUser] =
    useState<SessionUser | null>(null);

  const [
    loadingAppointments,
    setLoadingAppointments,
  ] = useState(true);

  const [loadingQueue, setLoadingQueue] =
    useState(true);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [
    markingNoShowId,
    setMarkingNoShowId,
  ] = useState<number | null>(null);

  const [appointments, setAppointments] =
    useState<AppointmentItem[]>([]);

  const [queueItems, setQueueItems] =
    useState<AppointmentItem[]>([]);

  const today = getColombiaDate();

  const handleSessionError = useCallback(
    (error: Error): boolean => {
      const message = error.message.toLowerCase();

      const sessionExpired =
        message.includes("unauthorized") ||
        message.includes("no autorizado") ||
        message.includes("jwt") ||
        message.includes("token") ||
        message.includes("sesión") ||
        message.includes("sesion");

      if (sessionExpired) {
        logout();
        window.location.href =
          "/login?role=doctor";

        return true;
      }

      return false;
    },
    [],
  );

  const loadAppointments = useCallback(
    async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        setLoadingAppointments(true);

        const savedUser =
          getUser() as SessionUser | null;

        if (!savedUser?.sub) {
          throw new Error(
            "No se encontró el identificador del doctor",
          );
        }

        const result =
          await getDoctorAppointments(
            token,
            savedUser.sub,
          );

        const items = Array.isArray(result)
          ? result
          : result?.data || [];

        /*
         * Se conservan las citas confirmadas:
         *
         * - Las de hoy podrán atenderse.
         * - Las anteriores podrán marcarse como inasistencia.
         * - Las futuras no se muestran todavía en la agenda
         *   operativa del día.
         */
        const confirmedAppointments = items
          .filter(
            (item: AppointmentItem) =>
              String(item.estado || "")
                .trim()
                .toLowerCase() ===
                "confirmada",
          )
          .filter(
            (item: AppointmentItem) =>
              !item.fecha ||
              String(item.fecha).slice(0, 10) <=
                today,
          )
          .sort(
            (
              first: AppointmentItem,
              second: AppointmentItem,
            ) => {
              const firstValue = `${String(
                first.fecha || "",
              ).slice(0, 10)} ${first.hora || ""}`;

              const secondValue = `${String(
                second.fecha || "",
              ).slice(0, 10)} ${second.hora || ""}`;

              return firstValue.localeCompare(
                secondValue,
              );
            },
          );

        setAppointments(
          confirmedAppointments,
        );
      } catch (error: unknown) {
        setAppointments([]);

        if (error instanceof Error) {
          if (handleSessionError(error)) {
            return;
          }

          alert(error.message);
        } else {
          alert(
            "Error al cargar citas del doctor",
          );
        }
      } finally {
        setLoadingAppointments(false);
      }
    },
    [handleSessionError, today],
  );

  const loadQueue = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      setLoadingQueue(true);

      const savedUser =
        getUser() as SessionUser | null;

      if (!savedUser?.sub) {
        throw new Error(
          "No se encontró el identificador del doctor",
        );
      }

      const result =
        await getQueueAppointments(
          token,
          today,
          savedUser.sub,
        );

      const items = Array.isArray(result)
        ? result
        : result?.data || [];

      setQueueItems(items);
    } catch (error: unknown) {
      setQueueItems([]);

      if (error instanceof Error) {
        if (handleSessionError(error)) {
          return;
        }

        alert(error.message);
      } else {
        alert(
          "Error al cargar cola priorizada",
        );
      }
    } finally {
      setLoadingQueue(false);
    }
  }, [handleSessionError, today]);

  useEffect(() => {
    const token = getToken();

    const savedUser =
      getUser() as SessionUser | null;

    if (!token || !savedUser) {
      window.location.href =
        "/login?role=doctor";

      return;
    }

    const normalizedRole =
      normalizeRole(savedUser.role);

    if (normalizedRole !== "doctor") {
      window.location.href =
        "/login?role=doctor";

      return;
    }

    setUser({
      ...savedUser,
      role: normalizedRole,
    });

    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    void loadAppointments();
    void loadQueue();
  }, [
    checkingAuth,
    loadAppointments,
    loadQueue,
  ]);

  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "Socket doctor conectado:",
        socket.id,
      );
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("queueUpdated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket doctor desconectado",
      );
    });

    return () => {
      socket.off("connect");
      socket.off("appointmentCreated");
      socket.off("appointmentUpdated");
      socket.off("appointmentCancelled");
      socket.off("queueUpdated");
      socket.off("disconnect");

      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    checkingAuth,
    loadAppointments,
    loadQueue,
  ]);

  const handleLogout = () => {
    logout();

    window.location.href =
      "/login?role=doctor";
  };

  const handleMarkNoShow = async (
    appointment: AppointmentItem,
  ): Promise<void> => {
    const patientName =
      appointment.patient?.nombre ||
      "este paciente";

    const confirmed = window.confirm(
      `¿Confirmas que ${patientName} no asistió a la cita?\n\nEsta acción cambiará el estado de la cita a "No asistida".`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMarkingNoShowId(appointment.id);

      const token = getToken();

      if (!token) {
        logout();

        window.location.href =
          "/login?role=doctor";

        return;
      }

      await markAppointmentNoShow(
        token,
        appointment.id,
      );

      /*
       * La quitamos inmediatamente de la agenda para que
       * el cambio se vea sin esperar otra consulta.
       */
      setAppointments(
        (currentAppointments) =>
          currentAppointments.filter(
            (item) =>
              item.id !== appointment.id,
          ),
      );

      setQueueItems((currentQueue) =>
        currentQueue.filter(
          (item) =>
            item.id !== appointment.id,
        ),
      );

      await Promise.all([
        loadAppointments(),
        loadQueue(),
      ]);

      alert(
        "La cita fue marcada como inasistencia correctamente.",
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (handleSessionError(error)) {
          return;
        }

        alert(error.message);
      } else {
        alert(
          "No fue posible marcar la inasistencia",
        );
      }
    } finally {
      setMarkingNoShowId(null);
    }
  };

  const openMedicalReportPdf = async (
    appointmentId: number,
  ): Promise<void> => {
    try {
      setDownloadingId(appointmentId);

      const token = getToken();

      if (!token) {
        logout();

        window.location.href =
          "/login?role=doctor";

        return;
      }

      const blob =
        await downloadAppointmentPdf(
          token,
          appointmentId,
        );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `reporte-cita-${appointmentId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (handleSessionError(error)) {
          return;
        }

        alert(error.message);
      } else {
        alert(
          "Error al abrir el reporte",
        );
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    user,
    today,
    checkingAuth,
    loadingAppointments,
    loadingQueue,
    downloadingId,
    markingNoShowId,
    appointments,
    queueItems,
    handleLogout,
    handleMarkNoShow,
    openMedicalReportPdf,
  };
}