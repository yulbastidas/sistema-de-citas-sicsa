"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Clock3,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getAllAppointments, getQueueAppointments } from "@/service/appointment";
import { getToken, getUser, logout } from "@/service/session";

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type PatientInfo = {
  documento?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  eps?: string;
} | null;

type AppointmentItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  prioridad?: string | number;
  scorePrioridad?: number;
  patient?: PatientInfo;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<AppointmentItem[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const loadAppointments = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingAppointments(true);
      const result = await getAllAppointments(token);
      const items = Array.isArray(result) ? result : result.data || [];

      const confirmedAppointments = items.filter(
        (item: AppointmentItem) =>
          (item.estado || "").toLowerCase() === "confirmada"
      );

      setAppointments(confirmedAppointments);
    } catch (error: unknown) {
      setAppointments([]);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar citas del doctor");
      }
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadQueue = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingQueue(true);
      const result = await getQueueAppointments(token, today);
      const items = Array.isArray(result) ? result : result.data || [];
      setQueueItems(items);
    } catch (error: unknown) {
      setQueueItems([]);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar cola priorizada");
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token || !savedUser) {
      router.replace("/login?role=doctor");
      return;
    }

    const normalizedRole = normalizeRole(savedUser.role);

    if (normalizedRole !== "doctor") {
      router.replace("/login?role=doctor");
      return;
    }

    setUser({
      ...savedUser,
      role: normalizedRole,
    });

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    void loadAppointments();
    void loadQueue();
  }, [checkingAuth]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket doctor conectado:", socket.id);
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
      console.log("Socket doctor desconectado");
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
  }, [checkingAuth]);

  const handleLogout = () => {
    logout();
    router.push("/login?role=doctor");
  };

  const totalConfirmed = appointments.length;
  const totalQueue = queueItems.length;

  const highPriorityCount = useMemo(() => {
    return queueItems.filter((item) => {
      const value = String(item.prioridad || "").toLowerCase();
      return value.includes("alta") || value === "3";
    }).length;
  }, [queueItems]);

  const nextAppointment = useMemo(() => {
    return appointments[0] || null;
  }, [appointments]);

  const getPriorityBadgeClass = (priority: string | number | undefined) => {
    const value = String(priority || "").toLowerCase();

    if (value.includes("alta") || value === "3") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    if (value.includes("media") || value === "2") {
      return "border border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value.includes("baja") || value === "1") {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border border-slate-200 bg-slate-50 text-slate-700";
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <article className="flex items-start gap-4">
            <section className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Stethoscope className="text-slate-700" size={28} />
            </section>

            <article>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Panel del doctor
              </h1>
              <p className="mt-2 text-slate-600">
                Seguimiento clínico, agenda médica y visualización en tiempo real
              </p>

              <section className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <article className="flex items-center gap-2">
                  <UserRound size={16} />
                  <span>{user?.email || "Doctor"}</span>
                </article>

                <article className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>Rol médico activo</span>
                </article>

                <article className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  <span>Fecha: {today}</span>
                </article>
              </section>
            </article>
          </article>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </section>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Citas confirmadas</p>
            <CalendarDays className="text-slate-500" size={18} />
          </header>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingAppointments ? "..." : totalConfirmed}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Total de citas listas para atención
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pacientes en cola</p>
            <ClipboardList className="text-slate-500" size={18} />
          </header>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingQueue ? "..." : totalQueue}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Cola priorizada del día actual
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Prioridad alta
            </p>
            <Activity className="text-slate-500" size={18} />
          </header>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingQueue ? "..." : highPriorityCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Casos de atención preferente
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Próxima cita</p>
            <Clock3 className="text-slate-500" size={18} />
          </header>
          <p className="mt-3 text-xl font-bold text-slate-900">
            {loadingAppointments
              ? "..."
              : nextAppointment?.hora || "Sin horario"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {loadingAppointments
              ? "Cargando..."
              : nextAppointment?.patient?.nombre || "Sin próxima cita"}
          </p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6 flex items-center gap-3">
            <ClipboardList className="text-slate-700" size={22} />
            <article>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cola priorizada del día
              </h2>
              <p className="mt-1 text-slate-600">
                Orden clínico de atención según prioridad y horario
              </p>
            </article>
          </header>

          {loadingQueue ? (
            <p className="text-slate-600">Cargando cola...</p>
          ) : queueItems.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-600">No hay pacientes en la cola de hoy.</p>
            </section>
          ) : (
            <section className="space-y-4">
              {queueItems.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <article>
                      <section className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-slate-900">
                          #{index + 1} {item.patient?.nombre || "Paciente"}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                            item.prioridad
                          )}`}
                        >
                          Prioridad: {item.prioridad || "-"}
                        </span>
                      </section>

                      <section className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p>Hora: {item.hora || "-"}</p>
                        <p>Documento: {item.patient?.documento || "-"}</p>
                        <p>EPS: {item.patient?.eps || "-"}</p>
                        <p>Teléfono: {item.patient?.telefono || "-"}</p>
                      </section>

                      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-500">
                          Motivo de consulta
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {item.motivoConsulta || "Sin detalle"}
                        </p>
                      </section>
                    </article>

                    <article className="min-w-[120px] rounded-2xl border border-slate-200 bg-white p-4 text-center">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Score
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {item.scorePrioridad ?? "-"}
                      </p>
                    </article>
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6 flex items-center gap-3">
            <CalendarDays className="text-slate-700" size={22} />
            <article>
              <h2 className="text-2xl font-semibold text-slate-900">
                Citas confirmadas
              </h2>
              <p className="mt-1 text-slate-600">
                Pacientes listos para atención médica
              </p>
            </article>
          </header>

          {loadingAppointments ? (
            <p className="text-slate-600">Cargando citas...</p>
          ) : appointments.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-600">
                No hay citas confirmadas disponibles.
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              {appointments.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-semibold text-slate-900">
                    {item.patient?.nombre || "Paciente"}
                  </p>

                  <section className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p>Fecha: {item.fecha || "-"}</p>
                    <p>Hora: {item.hora || "-"}</p>
                    <p>Documento: {item.patient?.documento || "-"}</p>
                    <p>EPS: {item.patient?.eps || "-"}</p>
                    <p>Correo: {item.patient?.email || "-"}</p>
                  </section>

                  <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">
                      Motivo de consulta
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.motivoConsulta || "Sin detalle"}
                    </p>
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}