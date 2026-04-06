"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getToken, getUser } from "@/service/session";
import { getMyVerification } from "@/service/verification";
import {
  createAppointment,
  getAvailableAppointments,
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
};

type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    motivoConsulta: "",
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
    []
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
      const items = Array.isArray(result) ? result : result.data || [];

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
      const hours = Array.isArray(result) ? result : result.data || [];

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

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkingAuth, form.fecha, loadVerificationStatus, loadAppointments, loadAvailableHours]);

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

    socket.on("queueUpdated", (payload?: { fecha?: string }) => {
      if (payload?.fecha && form.fecha && payload.fecha === form.fecha) {
        void loadAvailableHours(form.fecha);
      } else if (form.fecha) {
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
    >
  ) => {
    const { name, value } = e.target;

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

    if (!form.fecha || !form.hora || !form.motivoConsulta) {
      alert("Completa fecha, hora y motivo de consulta");
      return;
    }

    try {
      setSaving(true);

      await createAppointment(token, {
        fecha: form.fecha,
        hora: form.hora,
        motivoConsulta: form.motivoConsulta,
      });

      alert("Cita creada correctamente");

      setForm({
        fecha: "",
        hora: "",
        motivoConsulta: "",
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

  const getStatusTextClass = (status: string | undefined) => {
    const value = (status || "").toLowerCase();

    if (value === "confirmada" || value === "aprobada") return "text-emerald-700";
    if (value === "pendiente") return "text-amber-700";
    if (value === "cancelada") return "text-red-700";
    return "text-slate-700";
  };

  const activeAppointments = useMemo(() => {
    return appointments.filter(
      (item) => (item.estado || "").toLowerCase() !== "cancelada"
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

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-100">
      <section className="flex-1 px-6 py-8">
        <header className="border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <article>
              <button
                onClick={() => router.push("/dashboard/patient")}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Volver al panel
              </button>

              <h1 className="text-3xl font-bold text-slate-900">
                Gestión de citas
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Consulta tus citas y agenda una nueva cuando tu verificación esté
                aprobada
              </p>
            </article>

            <article className="text-sm text-slate-500">
              Paciente: {user?.email || "Paciente"}
            </article>
          </section>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Nueva cita
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Selecciona fecha, hora disponible y motivo de consulta.
              </p>
            </header>

            {!canCreateAppointment && (
              <section className="mb-4 border border-amber-200 bg-amber-50 p-4">
                <section className="flex items-center gap-2">
                  <ShieldAlert className="text-amber-700" size={18} />
                  <p className="text-sm font-semibold text-amber-800">
                    Agendamiento bloqueado
                  </p>
                </section>
                <p className="mt-1 text-sm text-amber-700">
                  Debes tener la verificación aprobada para crear una nueva cita.
                  Sí puedes consultar y cancelar tus citas existentes.
                </p>
              </section>
            )}

            <section className="space-y-4">
              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  min={today}
                  value={form.fecha}
                  onChange={handleChange}
                  disabled={!canCreateAppointment}
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                />
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Hora disponible
                </label>
                <select
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  disabled={!canCreateAppointment || !form.fecha || loadingHours}
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {!canCreateAppointment
                      ? "Verificación requerida"
                      : loadingHours
                      ? "Cargando horarios..."
                      : availableHours.length === 0 && form.fecha
                      ? "No hay horarios disponibles"
                      : "Selecciona una hora"}
                  </option>

                  {availableHours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Motivo de consulta
                </label>
                <textarea
                  name="motivoConsulta"
                  value={form.motivoConsulta}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe el motivo de la cita"
                  disabled={!canCreateAppointment}
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                />
              </article>

              <button
                onClick={handleCreateAppointment}
                disabled={saving || !canCreateAppointment}
                className="w-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Crear cita"}
              </button>
            </section>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Disponibilidad semanal
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Vista rápida de los próximos días y sus horarios disponibles en
                tiempo real.
              </p>
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
                    className={`border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                  >
                    <p className="text-xs font-semibold tracking-wide">
                      {day.label}
                    </p>
                    <p className="mt-1 text-sm">{day.dayNumber}</p>
                    {day.isToday && (
                      <p
                        className={`mt-2 text-[11px] ${
                          isSelected ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        Hoy
                      </p>
                    )}
                  </button>
                );
              })}
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total de citas</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {appointments.length}
                </p>
              </article>

              <article className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Citas activas</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {activeAppointments.length}
                </p>
              </article>

              <article className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Horarios visibles</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {canCreateAppointment ? availableHours.length : 0}
                </p>
              </article>
            </section>

            <section className="mt-6 border border-slate-200 bg-slate-50 p-4">
              {!canCreateAppointment ? (
                <p className="text-sm text-slate-600">
                  La vista semanal está disponible cuando la verificación haya
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
                    <p className="mt-4 text-sm text-slate-600">
                      No hay horarios disponibles para este día.
                    </p>
                  ) : (
                    <section className="mt-4 flex flex-wrap gap-2">
                      {availableHours.map((hour) => {
                        const isSelectedHour = form.hora === hour;

                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => handleSelectHour(hour)}
                            className={`border px-3 py-2 text-sm font-medium transition ${
                              isSelectedHour
                                ? "border-blue-600 bg-blue-600 text-white"
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
          </section>
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Mis citas
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Consulta el estado de tus solicitudes y cancela una cita si aún
              está activa.
            </p>
          </header>

          {loadingAppointments ? (
            <p className="text-sm text-slate-600">Cargando citas...</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-slate-600">
              Aún no tienes citas registradas.
            </p>
          ) : (
            <section className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Hora</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Motivo</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => {
                    const status = (item.estado || "").toLowerCase();

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 text-slate-800"
                      >
                        <td className="px-3 py-2">
                          <section className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-slate-500" />
                            <span>{item.fecha}</span>
                          </section>
                        </td>

                        <td className="px-3 py-2">
                          <section className="flex items-center gap-2">
                            <Clock3 size={16} className="text-slate-500" />
                            <span>{item.hora}</span>
                          </section>
                        </td>

                        <td
                          className={`px-3 py-2 font-medium ${getStatusTextClass(
                            item.estado
                          )}`}
                        >
                          {item.estado || "pendiente"}
                        </td>

                        <td className="px-3 py-2">
                          <section className="flex items-start gap-2">
                            <FileText
                              size={16}
                              className="mt-0.5 text-slate-500"
                            />
                            <span>{item.motivoConsulta || "Sin detalle"}</span>
                          </section>
                        </td>

                        <td className="px-3 py-2">
                          {status !== "cancelada" && (
                            <button
                              onClick={() => handleCancelAppointment(item.id)}
                              className="border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}