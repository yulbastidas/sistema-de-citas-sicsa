"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PlusCircle, ShieldCheck, XCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getToken, getUser } from "@/service/session";
import {
  adminCreateAppointment,
  approveAppointment,
  cancelAppointment,
  getAllAppointments,
  getAvailableAppointments,
  getQueueAppointments,
} from "@/service/appointment";
import AdminSidebar from "@/app/components/AdminSidebar";

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

type QueueItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  prioridad?: string | number;
  scorePrioridad?: number;
  patient?: PatientInfo;
};

type AdminAppointmentForm = {
  documento: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  edad: string;
  embarazada: boolean;
  discapacidad: boolean;
  dolorIntenso: boolean;
  sangrado: boolean;
  dificultadRespiratoria: boolean;
  fiebre: boolean;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [saving, setSaving] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("todos");

  const [form, setForm] = useState<AdminAppointmentForm>({
    documento: "",
    fecha: "",
    hora: "",
    motivoConsulta: "",
    edad: "",
    embarazada: false,
    discapacidad: false,
    dolorIntenso: false,
    sangrado: false,
    dificultadRespiratoria: false,
    fiebre: false,
  });

  useEffect(() => {
    const token = getToken();
    const user = getUser() as SessionUser | null;

    if (!token || !user) {
      router.replace("/login?role=admin");
      return;
    }

    const isAdmin =
      user.role === "admin" || user.role === 1 || user.role === "1";

    if (!isAdmin) {
      router.replace("/login?role=admin");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  const loadAppointments = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const result = await getAllAppointments(token);
      const items = Array.isArray(result) ? result : result.data || [];
      setAppointments(items);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar citas");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (fecha: string) => {
    const token = getToken();
    if (!token || !fecha) return;

    try {
      setLoadingQueue(true);
      const result = await getQueueAppointments(token, fecha);
      const items = Array.isArray(result) ? result : result.data || [];
      setQueueItems(items);
    } catch (error: unknown) {
      setQueueItems([]);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar cola de citas");
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadAvailableHours = async (fecha: string) => {
    const token = getToken();
    if (!token || !fecha) {
      setAvailableHours([]);
      return;
    }

    try {
      setLoadingHours(true);
      const result = await getAvailableAppointments(token, fecha);
      const hours = Array.isArray(result) ? result : result.data || [];
      setAvailableHours(hours);
    } catch (error: unknown) {
      setAvailableHours([]);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar horarios disponibles");
      }
    } finally {
      setLoadingHours(false);
    }
  };

  useEffect(() => {
    if (checkingAuth) return;
    void loadAppointments();
    void loadQueue(selectedDate);
  }, [checkingAuth, selectedDate]);

  useEffect(() => {
    if (!form.fecha) {
      setAvailableHours([]);
      return;
    }

    setForm((prev) => ({ ...prev, hora: "" }));
    void loadAvailableHours(form.fecha);
  }, [form.fecha]);

  // respaldo suave para que no dependa solo del socket
  useEffect(() => {
    if (checkingAuth) return;

    const intervalId = setInterval(() => {
      void loadAppointments();
      void loadQueue(selectedDate);

      if (form.fecha) {
        void loadAvailableHours(form.fecha);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkingAuth, selectedDate, form.fecha]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket admin-citas conectado:", socket.id);
    });

    socket.on("verificationRequested", () => {
      console.log("Nueva verificación pendiente recibida");
    });

    socket.on("verificationUpdated", () => {
      console.log("Verificación actualizada");
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();
      void loadQueue(selectedDate);
      if (form.fecha) void loadAvailableHours(form.fecha);
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();
      void loadQueue(selectedDate);
      if (form.fecha) void loadAvailableHours(form.fecha);
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();
      void loadQueue(selectedDate);
      if (form.fecha) void loadAvailableHours(form.fecha);
    });

    socket.on("queueUpdated", (payload?: { fecha?: string }) => {
      void loadAppointments();

      if (payload?.fecha) {
        if (payload.fecha === selectedDate) {
          void loadQueue(selectedDate);
        }

        if (form.fecha && payload.fecha === form.fecha) {
          void loadAvailableHours(form.fecha);
        }
      } else {
        void loadQueue(selectedDate);
        if (form.fecha) void loadAvailableHours(form.fecha);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket admin-citas desconectado");
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
  }, [checkingAuth, selectedDate, form.fecha]);

  const handleTextChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleApprove = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await approveAppointment(token, id);
      alert("Cita aprobada correctamente");
      await loadAppointments();
      await loadQueue(selectedDate);
      if (form.fecha) await loadAvailableHours(form.fecha);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al aprobar la cita");
      }
    }
  };

  const handleCancel = async (id: number) => {
    const token = getToken();
    if (!token) return;

    const confirmed = window.confirm("¿Deseas cancelar esta cita?");
    if (!confirmed) return;

    try {
      await cancelAppointment(token, id);
      alert("Cita cancelada correctamente");
      await loadAppointments();
      await loadQueue(selectedDate);
      if (form.fecha) await loadAvailableHours(form.fecha);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cancelar la cita");
      }
    }
  };

  const handleCreateAppointment = async () => {
    const token = getToken();
    if (!token) return;

    if (!form.documento || !form.fecha || !form.hora || !form.motivoConsulta) {
      alert("Completa documento, fecha, hora y motivo de consulta");
      return;
    }

    try {
      setSaving(true);
      await adminCreateAppointment(token, {
        documento: form.documento,
        fecha: form.fecha,
        hora: form.hora,
        motivoConsulta: form.motivoConsulta,
        edad: form.edad ? Number(form.edad) : undefined,
        embarazada: form.embarazada,
        discapacidad: form.discapacidad,
        dolorIntenso: form.dolorIntenso,
        sangrado: form.sangrado,
        dificultadRespiratoria: form.dificultadRespiratoria,
        fiebre: form.fiebre,
      });

      alert("Cita creada correctamente");
      setForm({
        documento: "",
        fecha: "",
        hora: "",
        motivoConsulta: "",
        edad: "",
        embarazada: false,
        discapacidad: false,
        dolorIntenso: false,
        sangrado: false,
        dificultadRespiratoria: false,
        fiebre: false,
      });

      setAvailableHours([]);
      await loadAppointments();
      await loadQueue(selectedDate);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al crear cita");
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "todos") return appointments;
    return appointments.filter(
      (item) =>
        (item.estado || "").toLowerCase() === statusFilter.toLowerCase()
    );
  }, [appointments, statusFilter]);

  const getPriorityTextClass = (priority: string | number | undefined) => {
    const value = String(priority || "").toLowerCase();
    if (value.includes("alta") || value === "3") return "text-red-700";
    if (value.includes("media") || value === "2") return "text-amber-700";
    if (value.includes("baja") || value === "1") return "text-emerald-700";
    return "text-slate-700";
  };

  const getStatusTextClass = (status: string | undefined) => {
    const value = (status || "").toLowerCase();
    if (value === "aprobada" || value === "confirmada")
      return "text-emerald-700";
    if (value === "pendiente") return "text-amber-700";
    if (value === "cancelada") return "text-red-700";
    return "text-slate-700";
  };

  const today = new Date().toISOString().split("T")[0];

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <section className="flex-1 px-6 py-8">
        <header className="border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <section className="flex items-center gap-3">
            <ShieldCheck className="text-slate-700" size={24} />
            <article>
              <h1 className="text-3xl font-bold text-slate-900">
                Gestión de citas
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Agenda clínica, registro manual y control de citas
              </p>
            </article>
          </section>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-5 flex items-center gap-2">
              <PlusCircle className="text-slate-700" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">
                Registro manual de cita
              </h2>
            </header>

            <section className="space-y-4">
              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Documento del paciente
                </label>
                <input
                  name="documento"
                  value={form.documento}
                  onChange={handleTextChange}
                  placeholder="Número de documento"
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  min={today}
                  value={form.fecha}
                  onChange={handleTextChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Hora disponible
                </label>
                <select
                  name="hora"
                  value={form.hora}
                  onChange={handleTextChange}
                  disabled={!form.fecha || loadingHours}
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingHours
                      ? "Cargando horarios..."
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
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={form.edad}
                  onChange={handleTextChange}
                  placeholder="Edad"
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Motivo de consulta
                </label>
                <textarea
                  name="motivoConsulta"
                  rows={4}
                  value={form.motivoConsulta}
                  onChange={handleTextChange}
                  placeholder="Escribe el motivo de consulta"
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>

              <section className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="embarazada"
                    checked={form.embarazada}
                    onChange={handleCheckboxChange}
                  />
                  Embarazada
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="discapacidad"
                    checked={form.discapacidad}
                    onChange={handleCheckboxChange}
                  />
                  Discapacidad
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="dolorIntenso"
                    checked={form.dolorIntenso}
                    onChange={handleCheckboxChange}
                  />
                  Dolor intenso
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="sangrado"
                    checked={form.sangrado}
                    onChange={handleCheckboxChange}
                  />
                  Sangrado
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="dificultadRespiratoria"
                    checked={form.dificultadRespiratoria}
                    onChange={handleCheckboxChange}
                  />
                  Dif. respiratoria
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="fiebre"
                    checked={form.fiebre}
                    onChange={handleCheckboxChange}
                  />
                  Fiebre
                </label>
              </section>

              <button
                onClick={handleCreateAppointment}
                disabled={saving}
                className="w-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Crear cita"}
              </button>
            </section>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between gap-4">
              <article>
                <h2 className="text-lg font-semibold text-slate-900">
                  Cola priorizada del día
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Visualización clínica por prioridad y horario
                </p>
              </article>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </header>

            {loadingQueue ? (
              <p className="text-sm text-slate-600">Cargando cola...</p>
            ) : queueItems.length === 0 ? (
              <p className="text-sm text-slate-600">
                No hay citas para la fecha seleccionada.
              </p>
            ) : (
              <section className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                      <th className="px-3 py-2">Orden</th>
                      <th className="px-3 py-2">Hora</th>
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2">Paciente</th>
                      <th className="px-3 py-2">Teléfono</th>
                      <th className="px-3 py-2">Correo</th>
                      <th className="px-3 py-2">EPS</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Prioridad</th>
                      <th className="px-3 py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 text-slate-800"
                      >
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{item.hora || "-"}</td>
                        <td className="px-3 py-2">
                          {item.patient?.documento || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.nombre || "Paciente"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.telefono || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.email || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.eps || "-"}
                        </td>
                        <td
                          className={`px-3 py-2 font-medium ${getStatusTextClass(
                            item.estado
                          )}`}
                        >
                          {item.estado || "-"}
                        </td>
                        <td
                          className={`px-3 py-2 font-medium ${getPriorityTextClass(
                            item.prioridad
                          )}`}
                        >
                          {item.prioridad || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.scorePrioridad ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </section>
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <article>
              <h2 className="text-lg font-semibold text-slate-900">
                Agenda general de citas
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Control administrativo y operativo
              </p>
            </article>

            <article>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Filtrar por estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="confirmada">Confirmadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </article>
          </header>

          {loading ? (
            <p className="text-sm text-slate-600">Cargando citas...</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-sm text-slate-600">No hay citas para mostrar.</p>
          ) : (
            <section className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Hora</th>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Teléfono</th>
                    <th className="px-3 py-2">Correo</th>
                    <th className="px-3 py-2">EPS</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Prioridad</th>
                    <th className="px-3 py-2">Motivo</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((item) => {
                    const status = (item.estado || "").toLowerCase();
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 text-slate-800"
                      >
                        <td className="px-3 py-2">{item.fecha || "-"}</td>
                        <td className="px-3 py-2">{item.hora || "-"}</td>
                        <td className="px-3 py-2">
                          {item.patient?.documento || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.nombre || "Paciente"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.telefono || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.email || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {item.patient?.eps || "-"}
                        </td>
                        <td
                          className={`px-3 py-2 font-medium ${getStatusTextClass(
                            item.estado
                          )}`}
                        >
                          {item.estado || "-"}
                        </td>
                        <td
                          className={`px-3 py-2 font-medium ${getPriorityTextClass(
                            item.prioridad
                          )}`}
                        >
                          {item.prioridad || "-"}
                        </td>
                        <td className="max-w-[280px] px-3 py-2">
                          {item.motivoConsulta || "-"}
                        </td>
                        <td className="px-3 py-2">
                          <section className="flex flex-wrap gap-2">
                            {status === "pendiente" && (
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <CheckCircle2 size={14} />
                                Aprobar
                              </button>
                            )}
                            {status !== "cancelada" && (
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="flex items-center gap-1 border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                <XCircle size={14} />
                                Cancelar
                              </button>
                            )}
                          </section>
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