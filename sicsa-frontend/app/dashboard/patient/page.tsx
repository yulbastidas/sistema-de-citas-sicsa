"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  HeartPulse,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getToken, getUser, logout } from "@/service/session";
import {
  expireMyVerification,
  getMyVerification,
  requestVerification,
} from "@/service/verification";
import { getMyAppointments } from "@/service/appointment";

type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type VerificationResponse = {
  id?: number;
  estado?: string;
  status?: string;
  motivoRechazo?: string | null;
} | null;

type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado?: string;
  motivoConsulta?: string;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function PatientDashboard() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");
  const [requestLoading, setRequestLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [form, setForm] = useState({
    documento: "",
    eps: "",
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
    if (!token) return;

    try {
      const verification: VerificationResponse = await getMyVerification(token);
      applyVerificationState(verification);
    } catch (error) {
      console.error("Error cargando verificación:", error);
    }
  }, [applyVerificationState]);

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

      await Promise.all([loadVerificationStatus(), loadAppointments()]);

      if (mountedRef.current) {
        setCheckingAuth(false);
      }
    };

    void init();
  }, [router, loadVerificationStatus, loadAppointments]);

  useEffect(() => {
    if (checkingAuth) return;

    const intervalId = setInterval(() => {
      void loadVerificationStatus();
      void loadAppointments();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkingAuth, loadVerificationStatus, loadAppointments]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRequestVerification = async () => {
    const token = getToken();
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!form.documento || !form.eps) {
      alert("Completa documento y EPS");
      return;
    }

    try {
      setRequestLoading(true);

      await requestVerification(token, form);

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

  const nextActiveAppointment = useMemo(() => {
    return appointments.find(
      (item) => (item.estado || "").toLowerCase() !== "cancelada",
    );
  }, [appointments]);

  const activeAppointments = useMemo(() => {
    return appointments.filter(
      (item) => (item.estado || "").toLowerCase() !== "cancelada",
    ).length;
  }, [appointments]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  const isApproved = verificationStatus === "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";
  const hasNoRequest =
    verificationStatus === "none" || verificationStatus === "expired";

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-6 py-8">
      <header className="rounded-[2rem] bg-gradient-to-r bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-8 py-8 text-white shadow-xl">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <article className="flex items-start gap-4">
            <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
              <HeartPulse size={30} className="text-white" />
            </figure>

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Portal del paciente
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Bienvenido a SICSA
              </h1>
              <p className="mt-2 max-w-3xl text-cyan-50">
                Consulta tu estado de verificación, revisa tus citas y gestiona
                tu atención médica de forma sencilla.
              </p>
              <p className="mt-3 text-sm font-medium text-cyan-100">
                {user?.email || "Paciente"}
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
              <p className="mt-1 text-2xl font-bold">{activeAppointments}</p>
            </article>

            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Estado</p>
              <p className="mt-1 text-lg font-bold">
                {isApproved
                  ? "Aprobado"
                  : isPending
                    ? "Pendiente"
                    : isRejected
                      ? "Rechazado"
                      : "Sin solicitud"}
              </p>
            </article>
          </section>
        </section>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-cyan-100 bg-white/90 p-6 shadow-lg backdrop-blur">
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
              <ShieldCheck className="text-cyan-700" size={22} />
            </span>
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Estado de verificación
              </h2>
              <p className="text-sm text-slate-600">
                Control de acceso para habilitar el agendamiento de citas.
              </p>
            </section>
          </header>

          {hasNoRequest && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Aún no has solicitado verificación
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Debes completar este proceso para poder agendar citas médicas
                dentro del sistema.
              </p>
            </section>
          )}

          {isPending && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <section className="flex items-center gap-2">
                <ShieldAlert className="text-amber-700" size={18} />
                <p className="text-sm font-semibold text-amber-800">
                  Solicitud en revisión
                </p>
              </section>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Tu solicitud fue enviada correctamente y se encuentra pendiente
                de validación por parte del administrador.
              </p>
            </section>
          )}

          {isRejected && (
            <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <section className="flex items-center gap-2">
                <ShieldAlert className="text-rose-700" size={18} />
                <p className="text-sm font-semibold text-rose-800">
                  Solicitud rechazada
                </p>
              </section>
              <p className="mt-2 text-sm leading-6 text-rose-700">
                Debes corregir la información enviada y volver a solicitar la
                verificación.
              </p>
            </section>
          )}

          {isApproved && (
            <section className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
              <article>
                <section className="flex items-center gap-2">
                  <BadgeCheck className="text-emerald-700" size={18} />
                  <p className="text-sm font-semibold text-emerald-800">
                    Verificación aprobada
                  </p>
                </section>
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  Ya puedes gestionar tus citas médicas dentro del portal del
                  paciente.
                </p>
              </article>

              <button
                onClick={() => router.push("/dashboard/patient/appointments")}
                className="rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Ir a citas
              </button>
            </section>
          )}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg backdrop-blur">
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <CalendarDays className="text-emerald-700" size={22} />
            </span>
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Próxima cita
              </h2>
              <p className="text-sm text-slate-600">
                Resumen rápido de tu atención más cercana.
              </p>
            </section>
          </header>

          {!nextActiveAppointment ? (
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-600">
                No tienes citas activas registradas en este momento.
              </p>
            </article>
          ) : (
            <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-emerald-50 p-5">
              <p className="text-sm text-slate-500">Fecha</p>
              <p className="text-lg font-semibold text-slate-900">
                {nextActiveAppointment.fecha}
              </p>

              <p className="mt-4 text-sm text-slate-500">Hora</p>
              <p className="text-lg font-semibold text-slate-900">
                {nextActiveAppointment.hora}
              </p>

              <p className="mt-4 text-sm text-slate-500">Estado</p>
              <p className="text-lg font-semibold text-slate-900">
                {nextActiveAppointment.estado || "pendiente"}
              </p>

              <button
                onClick={() => router.push("/dashboard/patient/appointments")}
                className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Gestionar citas
              </button>
            </section>
          )}
        </section>
      </section>

      {!isApproved && (
        <section className="mt-6 rounded-[2rem] border border-cyan-100 bg-white/90 p-6 shadow-lg backdrop-blur">
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
              <Sparkles className="text-cyan-700" size={22} />
            </span>
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Solicitar verificación
              </h2>
              <p className="text-sm text-slate-600">
                Ingresa tu documento y EPS para enviar la solicitud.
              </p>
            </section>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Documento
              </label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                placeholder="Número de documento"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </article>

            <article>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                EPS
              </label>
              <input
                name="eps"
                value={form.eps}
                onChange={handleChange}
                placeholder="Nombre de la EPS"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </article>
          </section>

          <section className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleRequestVerification}
              disabled={requestLoading || isPending}
              className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
            >
              {requestLoading
                ? "Enviando..."
                : isPending
                  ? "Solicitud ya enviada"
                  : "Solicitar verificación"}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} />
                Cerrar sesión
              </span>
            </button>
          </section>
        </section>
      )}

      {isApproved && (
        <section className="mt-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} />
              Cerrar sesión
            </span>
          </button>
        </section>
      )}
    </main>
  );
}