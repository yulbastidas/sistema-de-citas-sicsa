"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

import type {
  AdminAppointmentForm,
  AppointmentClassItem,
  AppointmentItem,
  EpsItem,
  QueueItem,
  SessionUser,
  SpecialtyItem,
} from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

const EMPTY_FORM: AdminAppointmentForm = {
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
};

export function useAdminAppointments() {
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

  const [form, setForm] = useState<AdminAppointmentForm>(EMPTY_FORM);

  // ── Auth ──
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

  // ── Loaders ──
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
      setEpsList(Array.isArray(epsResult) ? epsResult : epsResult?.data || []);
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

  // ── Effects ──
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

  // ── Socket (fuente de verdad para actualizaciones en tiempo real) ──
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

  // ── Handlers ──
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
      setForm(EMPTY_FORM);
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

  // ── Computed ──
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

  const pendingCount = useMemo(
    () =>
      appointments.filter(
        (item) => (item.estado || "").toLowerCase() === "pendiente",
      ).length,
    [appointments],
  );

  const confirmedCount = useMemo(
    () =>
      appointments.filter((item) =>
        ["confirmada", "aprobada"].includes((item.estado || "").toLowerCase()),
      ).length,
    [appointments],
  );

  const highPriorityCount = useMemo(
    () =>
      queueItems.filter((item) => {
        const value = String(item.prioridad || "").toLowerCase();
        return value.includes("alta") || value === "3";
      }).length,
    [queueItems],
  );

  const today = new Date().toISOString().split("T")[0];

  return {
    // estado
    checkingAuth,
    loading,
    loadingQueue,
    loadingHours,
    loadingCatalogs,
    saving,
    appointments,
    queueItems,
    availableHours,
    specialties,
    epsList,
    appointmentClasses,
    selectedDate,
    statusFilter,
    dateFilter,
    searchTerm,
    form,
    // computed
    filteredAppointments,
    pendingCount,
    confirmedCount,
    highPriorityCount,
    today,
    // setters de filtros
    setSelectedDate,
    setStatusFilter,
    setDateFilter,
    setSearchTerm,
    // handlers
    handleTextChange,
    handleCheckboxChange,
    handleApprove,
    handleCancel,
    handleCreateAppointment,
  };
}