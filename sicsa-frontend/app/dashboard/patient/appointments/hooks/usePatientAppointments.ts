"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { getToken, getUser } from "@/service/session";
import { getMyVerification } from "@/service/verification";
import { getSpecialties } from "@/service/specialty";
import {
  createAppointment,
  getAppointmentClasses,
  getAvailableAppointments,
  getEpsCatalog,
  getMyAppointments,
  cancelAppointment,
} from "@/service/appointment";

import type {
  AppointmentClassItem,
  AppointmentForm,
  AppointmentItem,
  EpsItem,
  SessionUser,
  SpecialtyItem,
  VerificationResponse,
  VerificationState,
} from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

export const getWaitlistBaseHour = (fecha: string) => {
  const [year, month, day] = fecha.split("-").map(Number);
  const weekDay = new Date(year, month - 1, day).getDay();

  if (weekDay === 2 || weekDay === 3) return "08:00";
  if (weekDay === 4 || weekDay === 5 || weekDay === 6) return "07:00";

  return "08:00";
};

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

const EMPTY_FORM: AppointmentForm = {
  specialtyId: "",
  fecha: "",
  hora: "",
  motivoConsulta: "",
  eps: "",
  epsId: "",
  departamento: "",
  municipio: "",
  appointmentClassId: "",
  observaciones: "",
};

export function usePatientAppointments() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  // Ref para acceder a form.fecha dentro del socket sin recrearlo
  const fechaRef = useRef<string>("");

  // Debounce ref para agrupar ráfagas de eventos del socket en una sola llamada
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [epsList, setEpsList] = useState<EpsItem[]>([]);
  const [appointmentClasses, setAppointmentClasses] = useState<
    AppointmentClassItem[]
  >([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWaitlist, setSavingWaitlist] = useState(false);

  const [form, setForm] = useState<AppointmentForm>(EMPTY_FORM);

  // Mantener fechaRef sincronizado con form.fecha para usarlo en el socket
  // sin necesidad de recrear los listeners cada vez que cambia la fecha.
  useEffect(() => {
    fechaRef.current = form.fecha;
  }, [form.fecha]);

  // Ref para evitar re-ejecutar el efecto de horas si la fecha no cambió realmente
  const prevFechaRef = useRef<string>("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const fillFormWithPatientData = useCallback(
    (verification: VerificationResponse, savedUser?: SessionUser | null) => {
      if (!verification || !mountedRef.current) return;

      const verificationData = verification as VerificationResponse & {
        department?: string;
        departamentoNombre?: string;
        municipioNombre?: string;
        city?: string;
      };

      const epsName =
        typeof verification.eps === "string"
          ? verification.eps
          : verification.eps?.nombre || savedUser?.eps || "";

      const epsId =
        typeof verification.eps === "object"
          ? verification.eps?.id?.toString() || ""
          : verification.epsId?.toString() ||
            savedUser?.epsId?.toString() ||
            "";

      setForm((prev) => {
        const nextDep =
          verificationData.departamento ||
          verificationData.departamentoNombre ||
          verificationData.department ||
          savedUser?.departamento ||
          prev.departamento ||
          "Nariño";

        const nextMun =
          verificationData.municipio ||
          verificationData.municipioNombre ||
          verificationData.city ||
          savedUser?.municipio ||
          prev.municipio ||
          "Pasto";

        const nextEps = epsName || prev.eps;
        const nextEpsId = epsId || prev.epsId;

        // Si nada cambió, devolver la misma referencia → React no agenda re-render
        if (
          prev.departamento === nextDep &&
          prev.municipio === nextMun &&
          prev.eps === nextEps &&
          prev.epsId === nextEpsId
        ) {
          return prev;
        }

        return {
          ...prev,
          departamento: nextDep,
          municipio: nextMun,
          eps: nextEps,
          epsId: nextEpsId,
        };
      });
    },
    [],
  );

  const applyVerificationState = useCallback(
    (verification: VerificationResponse) => {
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

      if (estado === "aprobado") {
        setVerificationStatus("approved");
      } else if (estado === "pendiente") {
        setVerificationStatus("pending");
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

  const loadingVerificationRef = useRef(false);

  const loadVerificationStatus = useCallback(async () => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token) return;

    // Guard: si ya hay una petición en curso, no lanzar otra
    if (loadingVerificationRef.current) return;

    loadingVerificationRef.current = true;

    try {
      const verification: VerificationResponse = await getMyVerification(token);

      applyVerificationState(verification);
      fillFormWithPatientData(verification, savedUser);
    } catch (error) {
      console.error("Error al consultar verificación:", error);
    } finally {
      loadingVerificationRef.current = false;
    }
  }, [applyVerificationState, fillFormWithPatientData]);

  const loadingAppointmentsRef = useRef(false);

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    // Guard: si ya hay una petición en curso, no lanzar otra
    if (loadingAppointmentsRef.current) return;

    loadingAppointmentsRef.current = true;
    setLoadingAppointments(true);

    try {
      const result = await getMyAppointments(token);
      const items = Array.isArray(result) ? result : result?.data || [];

      if (mountedRef.current) {
        setAppointments(items);
      }
    } catch (error: unknown) {
      if (mountedRef.current) setAppointments([]);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar tus citas");
      }
    } finally {
      loadingAppointmentsRef.current = false;

      if (mountedRef.current) {
        setLoadingAppointments(false);
      }
    }
  }, []);

  const loadCatalogs = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingCatalogs(true);

      const [specialtiesResult, epsResult, classesResult] = await Promise.all([
        getSpecialties(token),
        getEpsCatalog(),
        getAppointmentClasses(),
      ]);

      if (mountedRef.current) {
        setSpecialties(
          Array.isArray(specialtiesResult)
            ? specialtiesResult
            : specialtiesResult?.data || [],
        );

        setEpsList(
          Array.isArray(epsResult) ? epsResult : epsResult?.data || [],
        );

        setAppointmentClasses(
          Array.isArray(classesResult)
            ? classesResult
            : classesResult?.data || [],
        );
      }
    } catch (error: unknown) {
      if (mountedRef.current) {
        setSpecialties([]);
        setEpsList([]);
        setAppointmentClasses([]);
      }

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar catálogos");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingCatalogs(false);
      }
    }
  }, []);

  const loadAvailableHours = useCallback(async (fecha: string) => {
    const token = getToken();

    if (!token || !fecha) {
      if (mountedRef.current) setAvailableHours([]);
      return;
    }

    try {
      setLoadingHours(true);

      const result = await getAvailableAppointments(token, fecha);
      const hours = Array.isArray(result) ? result : result?.data || [];

      if (mountedRef.current) {
        setAvailableHours(hours);
      }
    } catch (error: unknown) {
      if (mountedRef.current) setAvailableHours([]);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar horarios disponibles");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingHours(false);
      }
    }
  }, []);

  // ─── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      const savedUser = getUser() as SessionUser | null;

      if (!token || !savedUser) {
        router.replace("/login?role=patient");
        return;
      }

      const normalizedRole = normalizeRole(savedUser.role);

      if (normalizedRole !== "patient") {
        router.replace("/login?role=patient");
        return;
      }

      if (mountedRef.current) {
        setUser({ ...savedUser, role: normalizedRole });
      }

      await Promise.all([
        loadVerificationStatus(),
        loadAppointments(),
        loadCatalogs(),
      ]);

      if (mountedRef.current) {
        setCheckingAuth(false);
      }
    };

    void init();
    // Solo se ejecuta al montar — las dependencias son estables (useCallback sin deps cambiantes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Socket ──────────────────────────────────────────────────────────────────
  // Se crea UNA sola vez cuando termina la autenticación.
  // Usa fechaRef para leer form.fecha sin necesitar recrear los listeners.
  // debouncedRefresh agrupa ráfagas de eventos del socket (500ms) para evitar
  // que el backend dispare eventos en respuesta a cada GET, generando un loop.

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Helper: agrupa llamadas en una ventana de 500ms
    const debouncedRefresh = (fn: () => void) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fn, 500);
    };

    socket.on("connect", () => {
      console.log("Socket paciente-citas conectado:", socket.id);
    });

    // DEBUG: loguear todos los eventos entrantes para detectar loops desde el servidor
    socket.onAny((event: string, ...args: unknown[]) => {
      console.log("[SOCKET EVENT]", event, args);
    });

    socket.on("verificationRequested", () => {
      debouncedRefresh(() => {
        void loadVerificationStatus();
      });
    });

    socket.on("verificationUpdated", () => {
      debouncedRefresh(() => {
        void loadVerificationStatus();
        void loadAppointments();
        if (fechaRef.current) void loadAvailableHours(fechaRef.current);
      });
    });

    const refreshAppointmentsAndHours = () => {
      debouncedRefresh(() => {
        void loadAppointments();
        if (fechaRef.current) void loadAvailableHours(fechaRef.current);
      });
    };

    socket.on("appointmentCreated", refreshAppointmentsAndHours);
    socket.on("appointmentUpdated", refreshAppointmentsAndHours);
    socket.on("appointmentCancelled", refreshAppointmentsAndHours);
    socket.on("queueUpdated", refreshAppointmentsAndHours);

    socket.on("disconnect", () => {
      console.log("Socket paciente-citas desconectado");
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      socket.offAny();
      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");
      socket.off("appointmentCreated", refreshAppointmentsAndHours);
      socket.off("appointmentUpdated", refreshAppointmentsAndHours);
      socket.off("appointmentCancelled", refreshAppointmentsAndHours);
      socket.off("queueUpdated", refreshAppointmentsAndHours);
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
    // Solo depende de checkingAuth y de los loaders (estables por useCallback)
  }, [checkingAuth, loadVerificationStatus, loadAppointments, loadAvailableHours]);

  // ─── Efectos de formulario ───────────────────────────────────────────────────

  // Recargar horas disponibles cuando cambia la fecha (solo si está aprobado)
  useEffect(() => {
    if (verificationStatus !== "approved") {
      setAvailableHours([]);
      return;
    }

    if (!form.fecha) {
      setAvailableHours([]);
      return;
    }

    // Guard: solo actuar si la fecha realmente cambió
    if (form.fecha === prevFechaRef.current) return;
    prevFechaRef.current = form.fecha;

    // Solo limpiar hora si realmente tiene un valor, para no generar re-render innecesario
    setForm((prev) =>
      prev.hora === "" ? prev : { ...prev, hora: "" },
    );

    void loadAvailableHours(form.fecha);
  }, [form.fecha, verificationStatus, loadAvailableHours]);

  // Resolver epsId a partir del nombre eps cuando llega de la verificación
  useEffect(() => {
    if (!form.eps || form.epsId || epsList.length === 0) return;

    const normalizedFormEps = form.eps.trim().toLowerCase();

    const selectedEps = epsList.find(
      (item) => item.nombre?.trim().toLowerCase() === normalizedFormEps,
    );

    if (!selectedEps) return;

    setForm((prev) => ({
      ...prev,
      epsId: String(selectedEps.id),
    }));
  }, [form.eps, form.epsId, epsList]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "epsId") {
      const selectedEps = epsList.find((item) => String(item.id) === value);

      setForm((prev) => ({
        ...prev,
        epsId: value,
        eps: selectedEps?.nombre || prev.eps,
      }));

      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectWeekDay = (date: string) => {
    if (verificationStatus !== "approved") return;

    setForm((prev) => ({
      ...prev,
      fecha: date,
      hora: "",
    }));
  };

  const handleSelectHour = (hour: string) => {
    if (verificationStatus !== "approved") return;

    setForm((prev) => ({
      ...prev,
      hora: hour,
    }));
  };

  const resetFormKeepingPatientData = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      departamento: prev.departamento,
      municipio: prev.municipio,
      eps: prev.eps,
      epsId: prev.epsId,
    }));
  };

  const handleCreateAppointment = async () => {
    const token = getToken();

    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (verificationStatus !== "approved") {
      alert("Debes tener la verificación aprobada para agendar citas");
      return;
    }

    if (
      !form.specialtyId ||
      !form.fecha ||
      !form.hora ||
      !form.motivoConsulta ||
      !form.eps ||
      !form.departamento ||
      !form.municipio ||
      !form.appointmentClassId
    ) {
      alert(
        "Completa especialidad, fecha, hora, motivo, EPS, municipio, departamento y clase de cita",
      );
      return;
    }

    try {
      setSaving(true);

      await createAppointment(token, {
        specialtyId: Number(form.specialtyId),
        fecha: form.fecha,
        hora: form.hora,
        motivoConsulta: form.motivoConsulta,
        eps: form.eps,
        epsId: form.epsId ? Number(form.epsId) : undefined,
        departamento: form.departamento,
        municipio: form.municipio,
        appointmentClassId: Number(form.appointmentClassId),
        observaciones: form.observaciones,
      });

      alert("Cita creada correctamente");

      resetFormKeepingPatientData();
      setAvailableHours([]);

      await loadAppointments();
      await loadVerificationStatus();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al crear la cita");
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleJoinWaitlist = async () => {
    const token = getToken();

    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (verificationStatus !== "approved") {
      alert(
        "Debes tener la verificación aprobada para unirte a la lista de espera",
      );
      return;
    }

    if (
      !form.specialtyId ||
      !form.fecha ||
      !form.motivoConsulta ||
      !form.eps ||
      !form.departamento ||
      !form.municipio ||
      !form.appointmentClassId
    ) {
      alert(
        "Completa especialidad, fecha, motivo, EPS, municipio, departamento y clase de cita antes de unirte a la lista de espera",
      );
      return;
    }

    try {
      setSavingWaitlist(true);

      await createAppointment(token, {
        specialtyId: Number(form.specialtyId),
        fecha: form.fecha,
        hora: getWaitlistBaseHour(form.fecha),
        motivoConsulta: form.motivoConsulta,
        eps: form.eps,
        epsId: form.epsId ? Number(form.epsId) : undefined,
        departamento: form.departamento,
        municipio: form.municipio,
        appointmentClassId: Number(form.appointmentClassId),
        observaciones: form.observaciones,
      });

      alert(
        "Te has unido a la lista de espera para este día. Serás notificado cuando se libere un horario.",
      );

      resetFormKeepingPatientData();
      setAvailableHours([]);

      await loadAppointments();
      await loadVerificationStatus();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al unirte a la lista de espera");
      }
    } finally {
      if (mountedRef.current) {
        setSavingWaitlist(false);
      }
    }
  };

  const handleCancelAppointment = async (id: number) => {
    const token = getToken();
    if (!token) return;

    const confirmed = window.confirm("¿Deseas cancelar esta cita?");
    if (!confirmed) return;

    try {
      await cancelAppointment(token, id);

      alert("Cita cancelada correctamente");

      await loadAppointments();

      if (form.fecha) {
        await loadAvailableHours(form.fecha);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cancelar cita");
      }
    }
  };

  // ─── Derivados ───────────────────────────────────────────────────────────────

  const canCreateAppointment = verificationStatus === "approved";

  const activeAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => (item.estado || "").toLowerCase() !== "cancelada",
      ),
    [appointments],
  );

  const showWaitlistButton =
    canCreateAppointment &&
    !!form.fecha &&
    !loadingHours &&
    availableHours.length === 0;

  const today = new Date().toISOString().split("T")[0];

  return {
    checkingAuth,
    user,
    verificationStatus,
    appointments,
    specialties,
    epsList,
    appointmentClasses,
    availableHours,
    loadingAppointments,
    loadingHours,
    loadingCatalogs,
    saving,
    savingWaitlist,
    form,
    canCreateAppointment,
    activeAppointments,
    showWaitlistButton,
    today,
    handleChange,
    handleSelectWeekDay,
    handleSelectHour,
    handleCreateAppointment,
    handleJoinWaitlist,
    handleCancelAppointment,
  };
}