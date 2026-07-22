"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { getToken, getUser, logout } from "@/service/session";
import {
  expireMyVerification,
  getMyVerification,
  requestVerification,
} from "@/service/verification";
import { getMyAppointments } from "@/service/appointment";
import { getMyPatient } from "@/service/patient";
import { isAppointmentUpcoming } from '@/utils/appointment-date';

import type {
  AppointmentItem,
  SessionUser,
  VerificationForm,
  VerificationResponse,
  VerificationState,
} from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

export function usePatientDashboard() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");
  const [requestLoading, setRequestLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [form, setForm] = useState<VerificationForm>({
    documento: "",
    eps: "",
    epsId: "",
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fillVerificationForm = useCallback(
    (verification: VerificationResponse | null, savedUser?: SessionUser | null) => {
      if (!mountedRef.current) return;

      setForm((prev) => ({
        documento:
          verification?.documento ||
          savedUser?.documento ||
          prev.documento ||
          "",
        eps: verification?.eps || savedUser?.eps || prev.eps || "",
        epsId:
          verification?.epsId?.toString() ||
          savedUser?.epsId?.toString() ||
          prev.epsId ||
          "",
      }));
    },
    [],
  );

  const loadPatientData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const patient = await getMyPatient(token);

      if (!mountedRef.current) return;

      setForm((prev) => ({
        documento: patient?.numeroDocumento || prev.documento || "",
        eps: patient?.eps || prev.eps || "",
        epsId: patient?.epsId?.toString() || prev.epsId || "",
      }));
    } catch (error) {
      console.error("Error cargando paciente:", error);
    }
  }, []);

  const applyVerificationState = useCallback(
    (verification: VerificationResponse | null) => {
      if (!mountedRef.current) return;

      if (!verification) {
        setVerificationStatus("none");
        return;
      }

      const estado = (
        verification.estado ||
        verification.status ||
        ""
      ).toLowerCase();

      if (estado === "pendiente") {
        setVerificationStatus("pending");
      } else if (estado === "aprobado") {
        setVerificationStatus("approved");
      } else if (estado === "rechazado") {
        setVerificationStatus("rejected");
      } else if (estado === "expirado") {
        setVerificationStatus("expired");
      } else {
        setVerificationStatus("none");
      }
    },
    [],
  );

  const loadVerificationStatus = useCallback(async () => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token) return;

    try {
      const verification: VerificationResponse = await getMyVerification(token);

      console.log("VERIFICATION DASHBOARD:", verification);

      applyVerificationState(verification);
      fillVerificationForm(verification, savedUser);
    } catch (error) {
      console.error("Error cargando verificación:", error);
      fillVerificationForm(null, savedUser);
    }
  }, [applyVerificationState, fillVerificationForm]);

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const result = await getMyAppointments(token);
      const items = Array.isArray(result) ? result : result.data || [];

      if (mountedRef.current) {
        setAppointments(items);
      }
    } catch (error) {
      console.error("Error cargando citas:", error);

      if (mountedRef.current) {
        setAppointments([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      const savedUser = getUser() as SessionUser | null;

      if (!token || !savedUser) {
        router.replace("/login?role=patient");
        return;
      }

      const isPatient =
        savedUser.role === "patient" ||
        savedUser.role === 2 ||
        savedUser.role === "2";

      if (!isPatient) {
        router.replace("/login?role=patient");
        return;
      }

      setUser(savedUser);

      await Promise.all([
        loadPatientData(),
        loadVerificationStatus(),
        loadAppointments(),
      ]);

      if (mountedRef.current) {
        setCheckingAuth(false);
      }
    };

    void init();
  }, [router, loadPatientData, loadVerificationStatus, loadAppointments]);

  useEffect(() => {
    if (checkingAuth) return;

    const intervalId = setInterval(() => {
      void loadPatientData();
      void loadVerificationStatus();
      void loadAppointments();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkingAuth, loadPatientData, loadVerificationStatus, loadAppointments]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket paciente-dashboard conectado:", socket.id);
    });

    socket.on("verificationRequested", () => {
      void loadVerificationStatus();
    });

    socket.on("verificationUpdated", () => {
      void loadVerificationStatus();
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();
    });

    socket.on("disconnect", () => {
      console.log("Socket paciente-dashboard desconectado");
    });

    return () => {
      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");
      socket.off("appointmentCreated");
      socket.off("appointmentUpdated");
      socket.off("appointmentCancelled");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [checkingAuth, loadVerificationStatus, loadAppointments]);

  const handleLogout = async () => {
    const token = getToken();

    try {
      if (token) {
        await expireMyVerification(token);
      }
    } catch (error) {
      console.error("Error expirando verificación al cerrar sesión:", error);
    } finally {
      logout();
      router.push("/login?role=patient");
    }
  };

  const handleRequestVerification = async () => {
    const token = getToken();

    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!form.documento || !form.eps) {
      alert("No se pudieron cargar automáticamente el documento y la EPS");
      return;
    }

    try {
      setRequestLoading(true);

      await requestVerification(token, {
        documento: form.documento,
        eps: form.eps,
      });

      if (mountedRef.current) {
        setVerificationStatus("pending");
      }

      await loadVerificationStatus();
      alert("Solicitud de verificación enviada correctamente");
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al solicitar verificación");
      }
    } finally {
      if (mountedRef.current) {
        setRequestLoading(false);
      }
    }
  };

  const futureActiveAppointments = useMemo(() => {
    return appointments
      .filter((item) => {
        const status = (item.estado || "").trim().toLowerCase();

        const isInactiveStatus = [
          "cancelada",
          "atendida",
          "no_asistida",
          "no asistida",
        ].includes(status);

        return !isInactiveStatus && isAppointmentUpcoming(item);
      })
      .sort((a, b) => {
        const dateA = new Date(
          `${a.fecha}T${a.hora.length === 5 ? `${a.hora}:00` : a.hora}-05:00`,
        );

        const dateB = new Date(
          `${b.fecha}T${b.hora.length === 5 ? `${b.hora}:00` : b.hora}-05:00`,
        );

        return dateA.getTime() - dateB.getTime();
      });
  }, [appointments]);

  const nextActiveAppointment = futureActiveAppointments[0];

  const activeAppointments = futureActiveAppointments.length;

    const isApproved = verificationStatus === "approved";
    const isPending = verificationStatus === "pending";
    const isRejected = verificationStatus === "rejected";
    const hasNoRequest =
      verificationStatus === "none" || verificationStatus === "expired";

  return {
    checkingAuth,
    user,
    form,
    appointments,
    activeAppointments,
    nextActiveAppointment,
    verificationStatus,
    requestLoading,
    isApproved,
    isPending,
    isRejected,
    hasNoRequest,
    handleLogout,
    handleRequestVerification,
  };
}