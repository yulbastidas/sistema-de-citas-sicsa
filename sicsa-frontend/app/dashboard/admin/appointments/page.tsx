"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import {
  adminCreateAppointment,
  approveAppointment,
  cancelAppointment,
  getAllAppointments,
  getAppointmentClasses,
  getAvailableAppointments,
  getEpsCatalog,
  getQueueAppointments,
} from "@/service/appointment";
import { getToken, getUser } from "@/service/session";
import { getSpecialties } from "@/service/specialty";
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
  observaciones?: string;
  municipio?: string;
  departamento?: string;
  eps?: string;
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

type SpecialtyItem = {
  id: number;
  nombre?: string;
};

type EpsItem = {
  id: number;
  nombre?: string;
};

type AppointmentClassItem = {
  id: number;
  nombre?: string;
};

type AdminAppointmentForm = {
  documento: string;
  specialtyId: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  edad: string;
  eps: string;
  epsId: string;
  departamento: string;
  municipio: string;
  appointmentClassId: string;
  observaciones: string;
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
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [epsList, setEpsList] = useState<EpsItem[]>([]);
  const [appointmentClasses, setAppointmentClasses] = useState<
    AppointmentClassItem[]
  >([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<AdminAppointmentForm>({
    documento: "",
    specialtyId: "",
    fecha: "",
    hora: "",
    motivoConsulta: "",
    edad: "",
    eps: "",
    epsId: "",
    departamento: "Nariño",
    municipio: "",
    appointmentClassId: "",
    observaciones: "",
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
      window.location.replace("/login?role=admin");
      return;
    }

    const isAdmin =
      user.role === "admin" || user.role === 1 || user.role === "1";

    if (!isAdmin) {
      window.location.replace("/login?role=admin");
      return;
    }

    setCheckingAuth(false);
  }, []);

  const loadAppointments = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const result = await getAllAppointments(token);
      const items = Array.isArray(result) ? result : result?.data || [];
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
      const items = Array.isArray(result) ? result : result?.data || [];
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
      const hours = Array.isArray(result) ? result : result?.data || [];
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

  const loadCatalogs = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingCatalogs(true);

      const [specialtiesResult, epsResult, classesResult] = await Promise.all([
        getSpecialties(token),
        getEpsCatalog(),
        getAppointmentClasses(),
      ]);

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar catálogos");
      }
      setSpecialties([]);
      setEpsList([]);
      setAppointmentClasses([]);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    if (checkingAuth) return;
    void loadAppointments();
    void loadQueue(selectedDate);
    void loadCatalogs();
  }, [checkingAuth, selectedDate]);

  useEffect(() => {
    if (!form.fecha) {
      setAvailableHours([]);
      return;
    }

    setForm((prev) => ({ ...prev, hora: "" }));
    void loadAvailableHours(form.fecha);
  }, [form.fecha]);

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

    socket.on("queueUpdated", () => {
      void loadAppointments();
      void loadQueue(selectedDate);
      if (form.fecha) void loadAvailableHours(form.fecha);
    });

    socket.on("disconnect", () => {
      console.log("Socket admin-citas desconectado");
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
  }, [checkingAuth, selectedDate, form.fecha]);

  const handleTextChange = (
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

    if (
      !form.documento ||
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
        "Completa documento, especialidad, fecha, hora, EPS, municipio, departamento y clase de cita",
      );
      return;
    }

    try {
      setSaving(true);

      await adminCreateAppointment(token, {
        documento: form.documento,
        specialtyId: Number(form.specialtyId),
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
        documento: "",
        specialtyId: "",
        fecha: "",
        hora: "",
        motivoConsulta: "",
        edad: "",
        eps: "",
        epsId: "",
        departamento: "Nariño",
        municipio: "",
        appointmentClassId: "",
        observaciones: "",
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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return appointments.filter((item) => {
      const matchStatus =
        statusFilter === "todos"
          ? true
          : (item.estado || "").toLowerCase() === statusFilter.toLowerCase();

      const matchDate = dateFilter ? (item.fecha || "") === dateFilter : true;

      const searchableText = [
        item.patient?.nombre || "",
        item.patient?.documento || "",
        item.patient?.email || "",
        item.patient?.telefono || "",
        item.patient?.eps || "",
        item.eps || "",
        item.municipio || "",
        item.departamento || "",
        item.motivoConsulta || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = normalizedSearch
        ? searchableText.includes(normalizedSearch)
        : true;

      return matchStatus && matchDate && matchSearch;
    });
  }, [appointments, statusFilter, dateFilter, searchTerm]);

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

  const getStatusBadgeClass = (status: string | undefined) => {
    const value = (status || "").toLowerCase();

    if (value === "confirmada" || value === "aprobada") {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (value === "pendiente") {
      return "border border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value === "cancelada") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    if (value === "atendida") {
      return "border border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border border-slate-200 bg-slate-50 text-slate-700";
  };

  const today = new Date().toISOString().split("T")[0];

  const pendingCount = useMemo(() => {
    return appointments.filter(
      (item) => (item.estado || "").toLowerCase() === "pendiente",
    ).length;
  }, [appointments]);

  const confirmedCount = useMemo(() => {
    return appointments.filter((item) =>
      ["confirmada", "aprobada"].includes((item.estado || "").toLowerCase()),
    ).length;
  }, [appointments]);

  const highPriorityCount = useMemo(() => {
    return queueItems.filter((item) => {
      const value = String(item.prioridad || "").toLowerCase();
      return value.includes("alta") || value === "3";
    }).length;
  }, [queueItems]);

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
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-8 py-8 text-white shadow-xl">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <article className="flex items-start gap-4">
              <figure className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <ClipboardList className="text-white" size={30} />
              </figure>

              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Panel administrativo
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Gestión integral de citas
                </h1>
                <p className="mt-2 max-w-3xl text-slate-200">
                  Controla la agenda clínica, registra citas manuales, revisa la
                  cola priorizada y administra el estado operativo del servicio.
                </p>
              </section>
            </article>

            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Pendientes</p>
                <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Confirmadas</p>
                <p className="mt-1 text-2xl font-bold">{confirmedCount}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Prioridad alta</p>
                <p className="mt-1 text-2xl font-bold">{highPriorityCount}</p>
              </article>
            </section>
          </section>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[460px_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <header className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <FilePlus2 className="text-slate-700" size={22} />
              </span>
              <section>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Registro manual de cita
                </h2>
                <p className="mt-1 text-slate-600">
                  Completa la información clínica y administrativa.
                </p>
              </section>
            </header>

            <section className="space-y-4">
              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Documento del paciente
                </label>
                <input
                  name="documento"
                  value={form.documento}
                  onChange={handleTextChange}
                  placeholder="Número de documento"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </article>

              <section className="grid gap-4 md:grid-cols-2">
                <article>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Especialidad
                  </label>
                  <select
                    name="specialtyId"
                    value={form.specialtyId}
                    onChange={handleTextChange}
                    disabled={loadingCatalogs}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingCatalogs
                        ? "Cargando especialidades..."
                        : "Selecciona especialidad"}
                    </option>
                    {specialties.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre || `Especialidad ${item.id}`}
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
                    onChange={handleTextChange}
                    disabled={loadingCatalogs}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <article>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    min={today}
                    value={form.fecha}
                    onChange={handleTextChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </article>

                <article>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Hora disponible
                  </label>
                  <select
                    name="hora"
                    value={form.hora}
                    onChange={handleTextChange}
                    disabled={!form.fecha || loadingHours}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <article>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    EPS
                  </label>
                  <select
                    name="epsId"
                    value={form.epsId}
                    onChange={handleTextChange}
                    disabled={loadingCatalogs}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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
                    onChange={handleTextChange}
                    placeholder="Departamento"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </article>

                <article>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Municipio
                  </label>
                  <input
                    name="municipio"
                    value={form.municipio}
                    onChange={handleTextChange}
                    placeholder="Municipio"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </article>
              </section>

              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={form.edad}
                  onChange={handleTextChange}
                  placeholder="Edad"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </article>

              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Motivo de consulta
                </label>
                <textarea
                  name="motivoConsulta"
                  rows={4}
                  value={form.motivoConsulta}
                  onChange={handleTextChange}
                  placeholder="Escribe el motivo de consulta"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </article>

              <article>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  rows={3}
                  value={form.observaciones}
                  onChange={handleTextChange}
                  placeholder="Observaciones administrativas o clínicas"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </article>

              <section className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    name="embarazada"
                    checked={form.embarazada}
                    onChange={handleCheckboxChange}
                  />
                  Embarazada
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    name="discapacidad"
                    checked={form.discapacidad}
                    onChange={handleCheckboxChange}
                  />
                  Discapacidad
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    name="dolorIntenso"
                    checked={form.dolorIntenso}
                    onChange={handleCheckboxChange}
                  />
                  Dolor intenso
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    name="sangrado"
                    checked={form.sangrado}
                    onChange={handleCheckboxChange}
                  />
                  Sangrado
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    name="dificultadRespiratoria"
                    checked={form.dificultadRespiratoria}
                    onChange={handleCheckboxChange}
                  />
                  Dif. respiratoria
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
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
                className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Crear cita"}
              </button>
            </section>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <section>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Cola priorizada del día
                </h2>
                <p className="mt-1 text-slate-600">
                  Orden de atención clínica según prioridad y horario.
                </p>
              </section>

              <article className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </article>
            </header>

            {loadingQueue ? (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-slate-600">Cargando cola...</p>
              </article>
            ) : queueItems.length === 0 ? (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-slate-600">
                  No hay citas para la fecha seleccionada.
                </p>
              </article>
            ) : (
              <section className="space-y-4">
                {queueItems.map((item, index) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <section className="flex-1">
                        <section className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-semibold text-slate-900">
                            #{index + 1} {item.patient?.nombre || "Paciente"}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                              item.prioridad,
                            )}`}
                          >
                            Prioridad: {item.prioridad || "-"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              item.estado,
                            )}`}
                          >
                            {item.estado || "-"}
                          </span>
                        </section>

                        <section className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>Hora: {item.hora || "-"}</p>
                          <p>Documento: {item.patient?.documento || "-"}</p>
                          <p>EPS: {item.patient?.eps || "-"}</p>
                          <p>Teléfono: {item.patient?.telefono || "-"}</p>
                        </section>

                        <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Motivo de consulta
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {item.motivoConsulta || "Sin detalle"}
                          </p>
                        </article>
                      </section>

                      <aside className="min-w-[120px] rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Score
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {item.scorePrioridad ?? "-"}
                        </p>
                      </aside>
                    </header>
                  </article>
                ))}
              </section>
            )}
          </section>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <article>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Agenda general de citas
                </h2>
                <p className="mt-1 text-slate-600">
                  Control administrativo, operativo y seguimiento del estado.
                </p>
              </article>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_220px_220px]">
              <article className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente, documento, correo, EPS o municipio"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </article>

              <article className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </article>

              <article className="relative">
                <SlidersHorizontal
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="cancelada">Canceladas</option>
                  <option value="atendida">Atendidas</option>
                </select>
              </article>
            </section>
          </header>

          {loading ? (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-600">Cargando citas...</p>
            </article>
          ) : filteredAppointments.length === 0 ? (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-600">No hay citas para mostrar.</p>
            </article>
          ) : (
            <section className="space-y-4">
              {filteredAppointments.map((item) => {
                const status = (item.estado || "").toLowerCase();

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <section className="flex-1">
                        <section className="flex flex-wrap items-center gap-3">
                          <p className="text-2xl font-bold text-slate-900">
                            {item.patient?.nombre || "Paciente"}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              item.estado,
                            )}`}
                          >
                            {item.estado || "-"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                              item.prioridad,
                            )}`}
                          >
                            Prioridad: {item.prioridad || "-"}
                          </span>
                        </section>

                        <section className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                          <p>
                            <span className="font-medium text-slate-800">
                              Fecha:
                            </span>{" "}
                            {item.fecha || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Hora:
                            </span>{" "}
                            {item.hora || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Documento:
                            </span>{" "}
                            {item.patient?.documento || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Teléfono:
                            </span>{" "}
                            {item.patient?.telefono || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Correo:
                            </span>{" "}
                            {item.patient?.email || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              EPS:
                            </span>{" "}
                            {item.patient?.eps || item.eps || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Departamento:
                            </span>{" "}
                            {item.departamento || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800">
                              Municipio:
                            </span>{" "}
                            {item.municipio || "-"}
                          </p>
                        </section>

                        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Motivo de consulta
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.motivoConsulta || "Sin detalle"}
                          </p>
                        </article>

                        <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Observaciones
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.observaciones || "Sin observaciones"}
                          </p>
                        </article>
                      </section>

                      <aside className="w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">
                          Acciones rápidas
                        </p>

                        <section className="mt-4 flex flex-wrap gap-2">
                          {status === "pendiente" && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 size={16} />
                              Aprobar
                            </button>
                          )}

                          {status !== "cancelada" && (
                            <button
                              onClick={() => handleCancel(item.id)}
                              className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              <XCircle size={16} />
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
      </section>
    </main>
  );
}