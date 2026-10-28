"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  adminCreateAppointment,
  approveAppointment,
  cancelAppointment,
  getAllAppointments,
  getAppointmentClasses,
  getAvailableAppointments,
  getQueueAppointments,
} from "@/service/appointment";
import { getDoctorsBySpecialty } from "@/service/doctor";
import { getPatients } from "@/service/patient";
import { getToken, getUser } from "@/service/session";
import { getSpecialties } from "@/service/specialty";
import { confirmSicsa, notifySicsa as alert } from "@/app/components/SicsaFeedback";
import { EMPTY_BOOKING_FORM, calculateAge, getWaitlistBaseHour, validateBookingForm, type BookingPriorityResult } from "@/app/components/appointment-booking/types";
import type { Patient } from "@/app/dashboard/admin/patients/types";

import type {
  AdminAppointmentForm,
  AppointmentClassItem,
  AppointmentItem,
  BookingDoctor,
  BookingPatientSummary,
  QueueItem,
  SessionUser,
  SpecialtyItem,
} from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

const EMPTY_FORM: AdminAppointmentForm = EMPTY_BOOKING_FORM;

export function useAdminAppointments() {
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingWaitlist, setSavingWaitlist] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [doctors, setDoctors] = useState<BookingDoctor[]>([]);
  const [patientOptions, setPatientOptions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<BookingPatientSummary | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [lastResult, setLastResult] = useState<BookingPriorityResult | null>(null);
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
  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const result = await getAllAppointments(token, {
        limit: 100,
        status: statusFilter,
        date: dateFilter,
        search: searchTerm,
      });
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
  }, [dateFilter, searchTerm, statusFilter]);

  const loadAppointmentsRef = useRef(loadAppointments);

  useEffect(() => {
    loadAppointmentsRef.current = loadAppointments;
  }, [loadAppointments]);

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

  const loadAvailableHours = useCallback(async (fecha: string, specialtyId: string, doctorId?: string) => {
    const token = getToken();
    if (!token || !fecha || !specialtyId) {
      setAvailableHours([]);
      return;
    }

    try {
      setLoadingHours(true);
      const result = await getAvailableAppointments(
        token,
        fecha,
        Number(specialtyId),
        doctorId ? Number(doctorId) : undefined,
      );
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
  }, []);

  const loadCatalogs = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingCatalogs(true);

      const [specialtiesResult, classesResult] = await Promise.all([
        getSpecialties(token),
        getAppointmentClasses(),
      ]);

      setSpecialties(
        Array.isArray(specialtiesResult)
          ? specialtiesResult
          : specialtiesResult?.data || [],
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
      setAppointmentClasses([]);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const loadDoctors = useCallback(async (specialtyId: string) => {
    const token = getToken();
    if (!token || !specialtyId) { setDoctors([]); return; }
    try { setLoadingDoctors(true); setDoctors(await getDoctorsBySpecialty(token, Number(specialtyId))); }
    catch (error) { setDoctors([]); alert(error instanceof Error ? error.message : "No fue posible consultar los médicos"); }
    finally { setLoadingDoctors(false); }
  }, []);

  const searchPatients = useCallback(async (search: string) => {
    const token = getToken();
    if (!token || search.trim().length < 2) { setPatientOptions([]); return; }
    try { setLoadingPatients(true); const result = await getPatients(token, search.trim(), 1, 8); setPatientOptions(Array.isArray(result) ? result : result?.data || []); }
    catch (error) { setPatientOptions([]); alert(error instanceof Error ? error.message : "No fue posible buscar pacientes"); }
    finally { setLoadingPatients(false); }
  }, []);

  // ── Effects ──
  useEffect(() => {
    if (checkingAuth) return;
    void loadQueue(selectedDate);
    void loadCatalogs();
  }, [checkingAuth, selectedDate]);

  useEffect(() => { const timeout = window.setTimeout(() => void searchPatients(patientSearch), 300); return () => window.clearTimeout(timeout); }, [patientSearch, searchPatients]);
  useEffect(() => { void loadDoctors(form.specialtyId); }, [form.specialtyId, loadDoctors]);

  useEffect(() => {
    if (checkingAuth) return;
    const timeout = window.setTimeout(() => void loadAppointments(), 300);
    return () => window.clearTimeout(timeout);
  }, [checkingAuth, loadAppointments]);

  useEffect(() => {
    if (!form.fecha || !form.specialtyId || !form.doctorId) {
      setAvailableHours([]);
      return;
    }
    setForm((prev) => ({ ...prev, hora: "" }));
    void loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
  }, [form.fecha, form.specialtyId, form.doctorId, loadAvailableHours]);

  // ── Socket (fuente de verdad para actualizaciones en tiempo real) ──
  useEffect(() => {
    if (checkingAuth) return;
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: `Bearer ${token}` },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket admin-citas conectado:", socket.id);
    });

    socket.on("appointmentCreated", () => {
      void loadAppointmentsRef.current();
      void loadQueue(selectedDate);
      if (form.fecha && form.specialtyId) void loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointmentsRef.current();
      void loadQueue(selectedDate);
      if (form.fecha && form.specialtyId) void loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointmentsRef.current();
      void loadQueue(selectedDate);
      if (form.fecha && form.specialtyId) void loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
    });

    socket.on("queueUpdated", () => {
      void loadAppointmentsRef.current();
      void loadQueue(selectedDate);
      if (form.fecha && form.specialtyId) void loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
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
  }, [checkingAuth, selectedDate, form.fecha, form.specialtyId, form.doctorId, loadAvailableHours]);

  // ── Handlers ──
  const handleTextChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "specialtyId"
        ? { doctorId: "", appointmentClassId: "", fecha: "", hora: "" }
        : {}),
      ...(name === "doctorId" || name === "fecha" ? { hora: "" } : {}),
    }));
  };

  const handleFieldChange = <K extends keyof AdminAppointmentForm>(name: K, value: AdminAppointmentForm[K]) => { setLastResult(null); setForm((prev) => ({ ...prev, [name]: value, ...(name === "specialtyId" ? { doctorId: "", appointmentClassId: "", fecha: "", hora: "" } : {}), ...(name === "doctorId" || name === "fecha" ? { hora: "" } : {}) })); };

  const handleSelectPatient = (patient: Patient) => {
    setLastResult(null);
    const age = calculateAge(patient.fechaNacimiento);
    const summary = { id: patient.id, documento: patient.numeroDocumento, nombre: [patient.primerNombre, patient.segundoNombre, patient.primerApellido, patient.segundoApellido].filter(Boolean).join(" "), eps: patient.eps || "", fechaNacimiento: patient.fechaNacimiento, edad: age, departamento: patient.departamento, municipio: patient.municipio };
    setSelectedPatient(summary);
    setForm((prev) => ({ ...prev, eps: patient.eps || "", epsId: patient.epsId ? String(patient.epsId) : "", departamento: patient.departamento || "", municipio: patient.municipio || "", edad: age === undefined ? "" : String(age) }));
    setPatientOptions([]); setPatientSearch(summary.nombre);
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
      if (form.fecha && form.specialtyId) await loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
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

    const confirmed = await confirmSicsa({
      title: "Cancelar cita",
      message: "¿Estás seguro de que deseas cancelar esta cita?",
      confirmLabel: "Sí, cancelar",
    });
    if (!confirmed) return;

    try {
      await cancelAppointment(token, id);
      alert("Cita cancelada correctamente");
      await loadAppointments();
      await loadQueue(selectedDate);
      if (form.fecha && form.specialtyId) await loadAvailableHours(form.fecha, form.specialtyId, form.doctorId);
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

    const validationError = validateBookingForm(form, selectedPatient);
    if (validationError) { alert(validationError); return; }

    try {
      setSaving(true);

      const created = await adminCreateAppointment(token, {
        documento: selectedPatient!.documento,
        specialtyId: Number(form.specialtyId),
        doctorId: Number(form.doctorId),
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
        appointmentClassId: Number(form.appointmentClassId),
        observaciones: form.observaciones,
        selectedSymptoms: form.selectedSymptoms,
        painLevel: form.painLevel || undefined,
        symptomOnset: form.symptomOnset || undefined,
      });

      setLastResult(created);

      alert("Cita creada correctamente");
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

  const handleJoinWaitlist = async () => {
    const token = getToken();
    if (!token) return;
    const validationError = validateBookingForm(form, selectedPatient, false);
    if (validationError) { alert(validationError); return; }
    try {
      setSavingWaitlist(true);
      const created = await adminCreateAppointment(token, {
        documento: selectedPatient!.documento,
        specialtyId: Number(form.specialtyId),
        doctorId: Number(form.doctorId),
        fecha: form.fecha,
        hora: getWaitlistBaseHour(form.fecha),
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
        appointmentClassId: Number(form.appointmentClassId),
        observaciones: form.observaciones,
        selectedSymptoms: form.selectedSymptoms,
        painLevel: form.painLevel || undefined,
        symptomOnset: form.symptomOnset || undefined,
      });
      setLastResult(created);
      alert("Paciente registrado en la lista de espera");
      await loadAppointments(); await loadQueue(selectedDate);
    } catch (error) { alert(error instanceof Error ? error.message : "No fue posible registrar la lista de espera"); }
    finally { setSavingWaitlist(false); }
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
    savingWaitlist,
    appointments,
    queueItems,
    availableHours,
    specialties,
    doctors,
    patientOptions,
    selectedPatient,
    patientSearch,
    lastResult,
    loadingDoctors,
    loadingPatients,
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
    setPatientSearch,
    // handlers
    handleTextChange,
    handleCheckboxChange,
    handleFieldChange,
    handleSelectPatient,
    handleApprove,
    handleCancel,
    handleCreateAppointment,
    handleJoinWaitlist,
  };
}
