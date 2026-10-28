"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import { getToken, getUser } from "@/service/session";
import { getMyPatient } from "@/service/patient";
import { getDoctorsBySpecialty } from "@/service/doctor";
import { getMyVerification } from "@/service/verification";
import { getSpecialties } from "@/service/specialty";
import {
  createAppointment,
  getAppointmentClasses,
  getAvailableAppointments,
  getMyAppointments,
  cancelAppointment,
} from "@/service/appointment";

import type {
  AppointmentClassItem,
  AppointmentForm,
  AppointmentItem,
  SessionUser,
  SpecialtyItem,
  VerificationResponse,
  VerificationState,
  BookingDoctor,
  BookingPatientSummary,
} from "../types";
import { EMPTY_BOOKING_FORM, calculateAge, getWaitlistBaseHour, validateBookingForm, type BookingPriorityResult } from "@/app/components/appointment-booking/types";

import { isAppointmentUpcoming } from "@/utils/appointment-date";
import { confirmSicsa, notifySicsa as alert } from "@/app/components/SicsaFeedback";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

function normalizeRole(
  role: string | number | undefined,
): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";

  if (typeof role === "string") return role;

  return undefined;
}

const EMPTY_FORM: AppointmentForm = EMPTY_BOOKING_FORM;

export function usePatientAppointments() {
  const router = useRouter();

  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const fechaRef = useRef<string>("");
  const specialtyIdRef = useRef<string>("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [appointmentClasses, setAppointmentClasses] = useState<
    AppointmentClassItem[]
  >([]);

  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<BookingDoctor[]>([]);
  const [patientProfile, setPatientProfile] = useState<BookingPatientSummary | null>(null);
  const [lastResult, setLastResult] = useState<BookingPriorityResult | null>(null);

  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savingWaitlist, setSavingWaitlist] = useState(false);

  const [form, setForm] = useState<AppointmentForm>(EMPTY_FORM);

  useEffect(() => {
    fechaRef.current = form.fecha;
  }, [form.fecha]);

  useEffect(() => {
    specialtyIdRef.current = form.specialtyId;
  }, [form.specialtyId]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fillFormWithPatientData = useCallback(
    (
      verification: VerificationResponse,
      savedUser?: SessionUser | null,
    ) => {
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

  const loadVerificationStatus = useCallback(async () => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token) return;

    try {
      const verification: VerificationResponse =
        await getMyVerification(token);

      if (!mountedRef.current) return;

      applyVerificationState(verification);
      fillFormWithPatientData(verification, savedUser);
    } catch (error) {
      console.error("Error al consultar verificación:", error);
    }
  }, [applyVerificationState, fillFormWithPatientData]);

  const loadAppointments = useCallback(async () => {
    const token = getToken();

    if (!token) return;

    setLoadingAppointments(true);

    try {
      const result = await getMyAppointments(token, 1, 100);
      const items = Array.isArray(result)
        ? result
        : result?.data || [];

      if (mountedRef.current) {
        setAppointments(items);
      }
    } catch (error: unknown) {
      if (mountedRef.current) {
        setAppointments([]);
      }

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al consultar tus citas");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingAppointments(false);
      }
    }
  }, []);

  const loadPatientProfile = useCallback(async () => {
    const token = getToken();

    if (!token) return;

    try {
      const result = await getMyPatient(token);
      const patient = result?.data || result;

      if (!mountedRef.current || !patient) return;

      const age = calculateAge(patient.fechaNacimiento);
      const patientName = [patient.primerNombre, patient.segundoNombre, patient.primerApellido, patient.segundoApellido].filter(Boolean).join(" ") || patient.nombre || "Paciente";
      setPatientProfile({ id: patient.id, documento: patient.numeroDocumento || patient.documento || "", nombre: patientName, eps: typeof patient.eps === "string" ? patient.eps : patient.eps?.nombre || "", fechaNacimiento: patient.fechaNacimiento, edad: age, departamento: patient.departamento, municipio: patient.municipio });

      setForm((previous) => ({
        ...previous,
        eps: typeof patient.eps === "string" ? patient.eps : "",
        epsId: patient.epsId ? String(patient.epsId) : "",
        departamento: patient.departamento || previous.departamento,
        municipio: patient.municipio || previous.municipio,
        edad: age === undefined ? "" : String(age),
      }));
    } catch (error: unknown) {
      if (!mountedRef.current) return;

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la EPS de tu perfil",
      );
    }
  }, []);

  const loadCatalogs = useCallback(async () => {
    const token = getToken();

    if (!token) return;

    try {
      setLoadingCatalogs(true);

      const [specialtiesResult, classesResult] = await Promise.all([
        getSpecialties(token),
        getAppointmentClasses(),
      ]);

      if (mountedRef.current) {
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
      }
    } catch (error: unknown) {
      if (mountedRef.current) {
        setSpecialties([]);
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

  const loadAvailableHours = useCallback(
    async (fecha: string, specialtyId: string, doctorId?: string) => {
      const token = getToken();

      if (!token || !fecha || !specialtyId) {
        if (mountedRef.current) {
          setAvailableHours([]);
        }

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

        const hours = Array.isArray(result)
          ? result
          : result?.data || [];

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
    },
    [],
  );

  const loadDoctors = useCallback(async (specialtyId: string) => {
    const token = getToken();
    if (!token || !specialtyId) { setDoctors([]); return; }
    try { setLoadingDoctors(true); setDoctors(await getDoctorsBySpecialty(token, Number(specialtyId))); }
    catch (error) { setDoctors([]); alert(error instanceof Error ? error.message : "No fue posible consultar los médicos"); }
    finally { setLoadingDoctors(false); }
  }, []);

  // ── Init (solo una vez) ──
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

      await loadPatientProfile();

      if (mountedRef.current) {
        setCheckingAuth(false);
      }
    };

    void init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Socket ──
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

    const debouncedRefresh = (fn: () => void) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(fn, 500);
    };

    const refreshAvailableHours = () => {
      if (fechaRef.current && specialtyIdRef.current) {
        void loadAvailableHours(
          fechaRef.current,
          specialtyIdRef.current,
        );
      }
    };

    socket.on("connect", () => {
      console.log(
        "Socket paciente-citas conectado:",
        socket.id,
      );
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
        refreshAvailableHours();
      });
    });

    const refreshAppointmentsAndHours = () => {
      debouncedRefresh(() => {
        void loadAppointments();
        refreshAvailableHours();
      });
    };

    socket.on(
      "appointmentCreated",
      refreshAppointmentsAndHours,
    );

    socket.on(
      "appointmentCancelled",
      refreshAppointmentsAndHours,
    );

    socket.on(
      "queueUpdated",
      refreshAppointmentsAndHours,
    );

    socket.on("disconnect", () => {
      console.log("Socket paciente-citas desconectado");
    });

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");

      socket.off(
        "appointmentCreated",
        refreshAppointmentsAndHours,
      );

      socket.off(
        "appointmentCancelled",
        refreshAppointmentsAndHours,
      );

      socket.off(
        "queueUpdated",
        refreshAppointmentsAndHours,
      );

      socket.off("disconnect");

      socket.disconnect();
      socketRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

  // ── Horarios al cambiar fecha o especialidad ──
  useEffect(() => {
    if (verificationStatus !== "approved") {
      setAvailableHours([]);
      return;
    }

    if (!form.fecha || !form.specialtyId || !form.doctorId) {
      setAvailableHours([]);
      return;
    }

    setForm((prev) =>
      prev.hora === ""
        ? prev
        : {
            ...prev,
            hora: "",
          },
    );

    void loadAvailableHours(
      form.fecha,
      form.specialtyId,
      form.doctorId,
    );
  }, [
    form.fecha,
    form.specialtyId,
    form.doctorId,
    verificationStatus,
    loadAvailableHours,
  ]);

  useEffect(() => { void loadDoctors(form.specialtyId); }, [form.specialtyId, loadDoctors]);

  // ── Handlers ──
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextValue =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "specialtyId"
        ? { doctorId: "", appointmentClassId: "", fecha: "", hora: "" }
        : {}),
      ...(name === "doctorId" || name === "fecha" ? { hora: "" } : {}),
    }));
  };

  const handleFieldChange = <K extends keyof AppointmentForm>(name: K, value: AppointmentForm[K]) => {
    setLastResult(null);
    setForm((prev) => ({ ...prev, [name]: value, ...(name === "specialtyId" ? { doctorId: "", appointmentClassId: "", fecha: "", hora: "" } : {}), ...(name === "doctorId" || name === "fecha" ? { hora: "" } : {}) }));
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
      alert(
        "Debes tener la verificación aprobada para agendar citas",
      );
      return;
    }

    const validationError = validateBookingForm(form, patientProfile);
    if (validationError) { alert(validationError); return; }

    try {
      setSaving(true);

      const created = await createAppointment(token, {
        specialtyId: Number(form.specialtyId),
        doctorId: Number(form.doctorId),
        fecha: form.fecha,
        hora: form.hora,
        motivoConsulta: form.motivoConsulta,
        eps: form.eps,
        epsId: form.epsId
          ? Number(form.epsId)
          : undefined,
        departamento: form.departamento,
        municipio: form.municipio,
        appointmentClassId: Number(
          form.appointmentClassId,
        ),
        observaciones: form.observaciones,
        edad: form.edad ? Number(form.edad) : undefined,
        embarazada: form.embarazada,
        discapacidad: form.discapacidad,
        dolorIntenso: form.dolorIntenso,
        sangrado: form.sangrado,
        dificultadRespiratoria: form.dificultadRespiratoria,
        fiebre: form.fiebre,
        selectedSymptoms: form.selectedSymptoms,
        painLevel: form.painLevel || undefined,
        symptomOnset: form.symptomOnset || undefined,
      });

      setLastResult(created);

      alert("Cita creada correctamente");

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

    const validationError = validateBookingForm(form, patientProfile, false);
    if (validationError) { alert(validationError); return; }

    try {
      setSavingWaitlist(true);

      await createAppointment(token, {
        specialtyId: Number(form.specialtyId),
        doctorId: Number(form.doctorId),
        fecha: form.fecha,
        hora: getWaitlistBaseHour(form.fecha),
        motivoConsulta: form.motivoConsulta,
        eps: form.eps,
        epsId: form.epsId
          ? Number(form.epsId)
          : undefined,
        departamento: form.departamento,
        municipio: form.municipio,
        appointmentClassId: Number(
          form.appointmentClassId,
        ),
        observaciones: form.observaciones,
        edad: form.edad ? Number(form.edad) : undefined,
        embarazada: form.embarazada,
        discapacidad: form.discapacidad,
        dolorIntenso: form.dolorIntenso,
        sangrado: form.sangrado,
        dificultadRespiratoria: form.dificultadRespiratoria,
        fiebre: form.fiebre,
        selectedSymptoms: form.selectedSymptoms,
        painLevel: form.painLevel || undefined,
        symptomOnset: form.symptomOnset || undefined,
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

      if (form.fecha && form.specialtyId) {
        await loadAvailableHours(
          form.fecha,
          form.specialtyId,
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cancelar cita");
      }
    }
  };

  const canCreateAppointment =
    verificationStatus === "approved";

  const activeAppointments = useMemo(
    () =>
      appointments.filter((item) => {
        const status = (item.estado || "")
          .trim()
          .toLowerCase();

        const isInactiveStatus = [
          "cancelada",
          "atendida",
          "no_asistida",
          "no asistida",
        ].includes(status);

        return (
          !isInactiveStatus &&
          isAppointmentUpcoming(item)
        );
      }),
    [appointments],
  );

  const showWaitlistButton =
    canCreateAppointment &&
    !!form.fecha &&
    !loadingHours &&
    availableHours.length === 0;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  return {
    checkingAuth,
    user,
    verificationStatus,
    appointments,
    specialties,
    doctors,
    patientProfile,
    lastResult,
    appointmentClasses,
    availableHours,
    loadingAppointments,
    loadingHours,
    loadingDoctors,
    loadingCatalogs,
    saving,
    savingWaitlist,
    form,
    canCreateAppointment,
    activeAppointments,
    showWaitlistButton,
    today,
    handleChange,
    handleFieldChange,
    handleSelectWeekDay,
    handleSelectHour,
    handleCreateAppointment,
    handleJoinWaitlist,
    handleCancelAppointment,
  };
}
