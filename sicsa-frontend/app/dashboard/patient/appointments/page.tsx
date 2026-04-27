"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  HeartPulse,
  MapPin,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  ClockIcon,
} from "lucide-react";
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

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type VerificationResponse = {
  id?: number;
  estado?: string;
  status?: string;
} | null;

type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado?: string;
  motivoConsulta?: string;
  eps?: string;
  departamento?: string;
  municipio?: string;
  observaciones?: string;
};

type SpecialtyItem = {
  id: number;
  nombre?: string;
  descripcion?: string;
};

type EpsItem = {
  id: number;
  nombre?: string;
};

type AppointmentClassItem = {
  id: number;
  nombre?: string;
};

type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

const getWaitlistBaseHour = (fecha: string) => {
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

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [, setUser] = useState<SessionUser | null>(null);
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

  // ── LISTA DE ESPERA: estado nuevo ──
  const [savingWaitlist, setSavingWaitlist] = useState(false);

  const [form, setForm] = useState({
    specialtyId: "",
    fecha: "",
    hora: "",
    motivoConsulta: "",
    eps: "",
    epsId: "",
    departamento: "Nariño",
    municipio: "",
    appointmentClassId: "",
    observaciones: "",
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  const loadVerificationStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const verification: VerificationResponse = await getMyVerification(token);
      applyVerificationState(verification);
    } catch (error) {
      console.error("Error al consultar verificación:", error);
    }
  }, [applyVerificationState]);

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingAppointments(true);
      const result = await getMyAppointments(token);
      const items = Array.isArray(result) ? result : result?.data || [];

      if (mountedRef.current) {
        setAppointments(items);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar tus citas");
      }

      if (mountedRef.current) {
        setAppointments([]);
      }
    } finally {
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
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar catálogos");
      }

      if (mountedRef.current) {
        setSpecialties([]);
        setEpsList([]);
        setAppointmentClasses([]);
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
      if (mountedRef.current) {
        setAvailableHours([]);
      }
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
      if (mountedRef.current) {
        setAvailableHours([]);
      }

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
        setUser({
          ...savedUser,
          role: normalizedRole,
        });
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
  }, [router, loadVerificationStatus, loadAppointments, loadCatalogs]);

  useEffect(() => {
    if (checkingAuth) return;

    const intervalId = setInterval(() => {
      void loadVerificationStatus();
      void loadAppointments();

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [
    checkingAuth,
    form.fecha,
    loadVerificationStatus,
    loadAppointments,
    loadAvailableHours,
  ]);

  useEffect(() => {
    if (verificationStatus !== "approved") {
      setAvailableHours([]);
      return;
    }

    if (!form.fecha) {
      setAvailableHours([]);
      return;
    }

    setForm((prev) => ({ ...prev, hora: "" }));
    void loadAvailableHours(form.fecha);
  }, [form.fecha, verificationStatus, loadAvailableHours]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket paciente-citas conectado:", socket.id);
    });

    socket.on("verificationRequested", () => {
      void loadVerificationStatus();
    });

    socket.on("verificationUpdated", () => {
      void loadVerificationStatus();
      void loadAppointments();

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    });

    socket.on("queueUpdated", () => {
      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }

      void loadAppointments();
    });

    socket.on("disconnect", () => {
      console.log("Socket paciente-citas desconectado");
    });

    return () => {
      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");
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
    form.fecha,
    loadVerificationStatus,
    loadAppointments,
    loadAvailableHours,
  ]);

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
        eps: selectedEps?.nombre || "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
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
      !form.epsId ||
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
        appointmentClassId: form.appointmentClassId
          ? Number(form.appointmentClassId)
          : undefined,
        observaciones: form.observaciones,
      });

      alert("Cita creada correctamente");

      setForm({
        specialtyId: "",
        fecha: "",
        hora: "",
        motivoConsulta: "",
        eps: "",
        epsId: "",
        departamento: "Nariño",
        municipio: "",
        appointmentClassId: "",
        observaciones: "",
      });

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

  // ── LISTA DE ESPERA: handler nuevo ──
  const handleJoinWaitlist = async () => {
    const token = getToken();
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (verificationStatus !== "approved") {
      alert("Debes tener la verificación aprobada para unirte a la lista de espera");
      return;
    }

    if (
      !form.specialtyId ||
      !form.fecha ||
      !form.motivoConsulta ||
      !form.epsId ||
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
        appointmentClassId: form.appointmentClassId
          ? Number(form.appointmentClassId)
          : undefined,
        observaciones: form.observaciones,
      });

      alert(
        "Te has unido a la lista de espera para este día. Serás notificado cuando se libere un horario.",
      );

      setForm({
        specialtyId: "",
        fecha: "",
        hora: "",
        motivoConsulta: "",
        eps: "",
        epsId: "",
        departamento: "Nariño",
        municipio: "",
        appointmentClassId: "",
        observaciones: "",
      });

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

  const getStatusBadgeClass = (status: string | undefined) => {
    const value = (status || "").toLowerCase();

    if (value === "confirmada" || value === "aprobada") {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (value === "pendiente") {
      return "border border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value === "cancelada") {
      return "border border-rose-200 bg-rose-50 text-rose-700";
    }

    if (value === "atendida") {
      return "border border-sky-200 bg-sky-50 text-sky-700";
    }

    // ── LISTA DE ESPERA: badge nuevo ──
    if (value === "lista_espera") {
      return "border border-violet-200 bg-violet-50 text-violet-700";
    }

    return "border border-slate-200 bg-slate-50 text-slate-700";
  };

  const activeAppointments = useMemo(() => {
    return appointments.filter(
      (item) => (item.estado || "").toLowerCase() !== "cancelada",
    );
  }, [appointments]);

  const canCreateAppointment = verificationStatus === "approved";
  const today = new Date().toISOString().split("T")[0];

  const formatDateToYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const weekDays = useMemo(() => {
    const base = new Date();
    const days: {
      label: string;
      shortLabel: string;
      date: string;
      dayNumber: string;
      isToday: boolean;
      disabled: boolean;
    }[] = [];

    for (let i = 0; i < 7; i += 1) {
      const current = new Date(base);
      current.setDate(base.getDate() + i);

      const weekday = current.toLocaleDateString("es-CO", {
        weekday: "short",
      });

      const shortWeekday = current.toLocaleDateString("es-CO", {
        weekday: "long",
      });

      const dayNumber = current.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
      });

      const ymd = formatDateToYMD(current);

      days.push({
        label: weekday.replace(".", "").toUpperCase(),
        shortLabel:
          shortWeekday.charAt(0).toUpperCase() + shortWeekday.slice(1),
        date: ymd,
        dayNumber,
        isToday: ymd === today,
        disabled: !canCreateAppointment,
      });
    }

    return days;
  }, [today, canCreateAppointment]);

  const selectedDayMeta = useMemo(() => {
    return weekDays.find((day) => day.date === form.fecha) || null;
  }, [weekDays, form.fecha]);

  const handleSelectWeekDay = (date: string) => {
    if (!canCreateAppointment) return;

    setForm((prev) => ({
      ...prev,
      fecha: date,
      hora: "",
    }));
  };

  const handleSelectHour = (hour: string) => {
    if (!canCreateAppointment) return;

    setForm((prev) => ({
      ...prev,
      hora: hour,
    }));
  };

  // ── LISTA DE ESPERA: computed para saber si mostrar el botón ──
  const showWaitlistButton =
    canCreateAppointment &&
    form.fecha &&
    !loadingHours &&
    availableHours.length === 0;

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-6 py-8">
      <header className="rounded-[2rem] bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-8 py-8 text-white shadow-xl">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <article className="flex items-start gap-4">
            <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
              <Stethoscope className="text-white" size={30} />
            </figure>

            <section>
              <button
                onClick={() => router.push("/dashboard/patient")}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-50 transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Volver al panel
              </button>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Agenda del paciente
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Gestión de citas
              </h1>
              <p className="mt-2 max-w-3xl text-cyan-50">
                Consulta tus citas activas, revisa disponibilidad semanal y
                agenda una nueva solicitud cuando tu verificación esté aprobada.
              </p>
            </section>
          </article>

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Mis citas</p>
              <p className="mt-1 text-2xl font-bold">{appointments.length}</p>
            </article>

            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Citas activas</p>
              <p className="mt-1 text-2xl font-bold">
                {activeAppointments.length}
              </p>
            </article>

            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Horarios visibles</p>
              <p className="mt-1 text-2xl font-bold">
                {canCreateAppointment ? availableHours.length : 0}
              </p>
            </article>
          </section>
        </section>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[470px_1fr]">
        <section className="rounded-[2rem] border border-cyan-100 bg-white/90 p-8 shadow-lg backdrop-blur">
          <header className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
              <PlusCircle className="text-cyan-700" size={22} />
            </span>
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Nueva cita
              </h2>
              <p className="mt-1 text-slate-600">
                Completa la solicitud con datos administrativos y clínicos.
              </p>
            </section>
          </header>

          {!canCreateAppointment && (
            <section className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <section className="flex items-center gap-2">
                <ShieldAlert className="text-amber-700" size={18} />
                <p className="text-sm font-semibold text-amber-800">
                  Agendamiento bloqueado
                </p>
              </section>

              <p className="mt-2 text-sm leading-6 text-amber-700">
                Debes tener la verificación aprobada para crear una nueva cita.
                Sí puedes consultar y cancelar tus citas existentes.
              </p>
            </section>
          )}

          <section className="space-y-4">
            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Especialidad
              </label>

              <select
                name="specialtyId"
                value={form.specialtyId}
                onChange={handleChange}
                disabled={!canCreateAppointment || loadingCatalogs}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              >
                <option value="">
                  {loadingCatalogs
                    ? "Cargando especialidades..."
                    : "Selecciona una especialidad"}
                </option>

                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.nombre || `Especialidad ${specialty.id}`}
                  </option>
                ))}
              </select>
            </article>

            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Clase de cita
              </label>

              <select
                name="appointmentClassId"
                value={form.appointmentClassId}
                onChange={handleChange}
                disabled={!canCreateAppointment || loadingCatalogs}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              >
                <option value="">
                  {loadingCatalogs
                    ? "Cargando clases..."
                    : "Selecciona clase de cita"}
                </option>

                {appointmentClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre || `Clase ${item.id}`}
                  </option>
                ))}
              </select>
            </article>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  EPS
                </label>

                <select
                  name="epsId"
                  value={form.epsId}
                  onChange={handleChange}
                  disabled={!canCreateAppointment || loadingCatalogs}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingCatalogs ? "Cargando EPS..." : "Selecciona EPS"}
                  </option>

                  {epsList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre || `EPS ${item.id}`}
                    </option>
                  ))}
                </select>
              </article>

              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  EPS seleccionada
                </label>

                <input
                  value={form.eps}
                  readOnly
                  placeholder="EPS seleccionada"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Departamento
                </label>

                <input
                  name="departamento"
                  value={form.departamento}
                  onChange={handleChange}
                  placeholder="Departamento"
                  disabled={!canCreateAppointment}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
                />
              </article>

              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Municipio
                </label>

                <input
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  placeholder="Municipio"
                  disabled={!canCreateAppointment}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
                />
              </article>
            </section>

            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Motivo de consulta
              </label>

              <textarea
                name="motivoConsulta"
                value={form.motivoConsulta}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el motivo de la cita"
                disabled={!canCreateAppointment}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              />
            </article>

            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Observaciones
              </label>

              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones adicionales"
                disabled={!canCreateAppointment}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              />
            </article>

            <button
              onClick={handleCreateAppointment}
              disabled={saving || !canCreateAppointment}
              className="w-full rounded-2xl bg-gradient-to-r bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Crear cita"}
            </button>
          </section>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-8 shadow-lg backdrop-blur">
          <header className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <Sparkles className="text-emerald-700" size={22} />
            </span>
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Disponibilidad semanal
              </h2>
              <p className="mt-1 text-slate-600">
                Vista rápida de los próximos días y horarios disponibles.
              </p>
            </section>
          </header>

          <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            {weekDays.map((day) => {
              const isSelected = form.fecha === day.date;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleSelectWeekDay(day.date)}
                  disabled={day.disabled}
                  className={`rounded-3xl border px-3 py-4 text-left transition ${
                    isSelected
                      ? "border-cyan-600 bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-white"
                  } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                >
                  <p className="text-xs font-semibold tracking-wide">
                    {day.label}
                  </p>
                  <p className="mt-1 text-sm">{day.dayNumber}</p>

                  {day.isToday && (
                    <p
                      className={`mt-2 text-[11px] ${
                        isSelected ? "text-cyan-50" : "text-slate-500"
                      }`}
                    >
                      Hoy
                    </p>
                  )}
                </button>
              );
            })}
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {!canCreateAppointment ? (
              <p className="text-sm text-slate-600">
                La vista semanal estará disponible cuando tu verificación haya
                sido aprobada.
              </p>
            ) : !form.fecha ? (
              <p className="text-sm text-slate-600">
                Selecciona un día de la semana para ver sus horarios
                disponibles.
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedDayMeta?.shortLabel || "Día seleccionado"}{" "}
                  {selectedDayMeta ? `(${selectedDayMeta.dayNumber})` : ""}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Horarios disponibles para la fecha seleccionada.
                </p>

                {loadingHours ? (
                  <p className="mt-4 text-sm text-slate-600">
                    Cargando horarios...
                  </p>
                ) : availableHours.length === 0 ? (
                  <>
                    <p className="mt-4 text-sm text-slate-600">
                      No hay horarios disponibles para este día.
                    </p>

                    {/* ── LISTA DE ESPERA: botón que aparece cuando no hay horarios ── */}
                    {showWaitlistButton && (
                      <section className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-4">
                        <section className="flex items-center gap-2">
                          <ClockIcon className="text-violet-700" size={18} />
                          <p className="text-sm font-semibold text-violet-800">
                            ¿Quieres un cupo si se libera alguno?
                          </p>
                        </section>
                        <p className="mt-2 text-sm leading-6 text-violet-700">
                          El sistema intentará asignarte automáticamente el
                          primer cupo disponible según prioridad.
                        </p>
                        <button
                          onClick={handleJoinWaitlist}
                          disabled={
                            savingWaitlist ||
                            !form.specialtyId ||
                            !form.fecha ||
                            !form.motivoConsulta ||
                            !form.epsId ||
                            !form.departamento ||
                            !form.municipio ||
                            !form.appointmentClassId
                          }
                          className="mt-4 w-full rounded-3xl border border-violet-300 bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-70"
                        >
                          {savingWaitlist
                            ? "Uniéndome..."
                            : "Unirme a lista de espera para este día"}
                        </button>
                      </section>
                    )}
                  </>
                ) : (
                  <section className="mt-4 flex flex-wrap gap-2">
                    {availableHours.map((hour) => {
                      const isSelectedHour = form.hora === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => handleSelectHour(hour)}
                          className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                            isSelectedHour
                              ? "border-cyan-600 bg-cyan-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </section>
                )}
              </>
            )}
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Total de citas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {appointments.length}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Citas activas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {activeAppointments.length}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Horarios visibles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {canCreateAppointment ? availableHours.length : 0}
              </p>
            </article>
          </section>
        </section>
      </section>

      <section className="mt-6 rounded-[2rem] border border-cyan-100 bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
            <HeartPulse className="text-cyan-700" size={22} />
          </span>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">
              Mis citas
            </h2>
            <p className="mt-1 text-slate-600">
              Consulta el estado de tus solicitudes y cancela una cita si aún
              está activa.
            </p>
          </section>
        </header>

        {loadingAppointments ? (
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-slate-600">Cargando citas...</p>
          </article>
        ) : appointments.length === 0 ? (
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-slate-600">Aún no tienes citas registradas.</p>
          </article>
        ) : (
          <section className="space-y-4">
            {appointments.map((item) => {
              const status = (item.estado || "").toLowerCase();

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <section className="flex-1">
                      <section className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-bold text-slate-900">
                          Solicitud #{item.id}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            item.estado,
                          )}`}
                        >
                          {/* ── LISTA DE ESPERA: label amigable ── */}
                          {status === "lista_espera"
                            ? "En lista de espera"
                            : item.estado || "pendiente"}
                        </span>
                      </section>

                      <section className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                        <p className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-cyan-600" />
                          {item.fecha}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock3 size={16} className="text-cyan-600" />
                          {/* ── LISTA DE ESPERA: no mostrar 00:00 ── */}
                          {status === "lista_espera"
                            ? "Hora por asignar"
                            : item.hora}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={16} className="text-cyan-600" />
                          {item.municipio || "Municipio no registrado"}
                        </p>
                        <p>EPS: {item.eps || "No registrada"}</p>
                        <p>Departamento: {item.departamento || "-"}</p>
                      </section>

                      {/* ── LISTA DE ESPERA: banner informativo ── */}
                      {status === "lista_espera" && (
                        <section className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-4">
                          <section className="flex items-center gap-2">
                            <ClockIcon className="text-violet-600" size={16} />
                            <p className="text-sm font-semibold text-violet-800">
                              Estás en lista de espera
                            </p>
                          </section>
                          <p className="mt-1 text-sm text-violet-700">
                            Cuando alguien cancele un horario para este día, se
                            te asignará automáticamente según tu prioridad y
                            recibirás una notificación por correo.
                          </p>
                        </section>
                      )}

                      <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-500">
                          Motivo de consulta
                        </p>

                        <p className="mt-2 text-sm text-slate-700">
                          {item.motivoConsulta || "Sin detalle"}
                        </p>
                      </article>

                      <article className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-500">
                          Observaciones
                        </p>

                        <p className="mt-2 text-sm text-slate-700">
                          {item.observaciones || "Sin observaciones"}
                        </p>
                      </article>
                    </section>

                    <aside className="w-full max-w-[220px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">
                        Acción disponible
                      </p>

                      <section className="mt-4 flex flex-wrap gap-2">
                        {status !== "cancelada" && (
                          <button
                            onClick={() => handleCancelAppointment(item.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Cancelar
                          </button>
                        )}
                      </section>
                    </aside>
                  </header>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}