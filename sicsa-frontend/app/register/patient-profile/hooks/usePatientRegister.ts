"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPatient, registerPatientByPhone } from "@/service/auth";
import { notifySicsa as alert } from "@/app/components/SicsaFeedback";
import type {
  CityItem,
  DepartmentItem,
  EpsItem,
  PatientRegisterErrors,
  PatientRegisterFormData,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const COLOMBIA_API = "https://api-colombia.com/api/v1";
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;

const DOCUMENT_RULES: Record<
  string,
  { min: number; max: number; pattern: RegExp; message: string }
> = {
  CC: { min: 3, max: 10, pattern: /^\d+$/, message: "La cédula debe contener entre 3 y 10 dígitos." },
  TI: { min: 10, max: 11, pattern: /^\d+$/, message: "La tarjeta de identidad debe contener entre 10 y 11 dígitos." },
  CE: { min: 4, max: 10, pattern: /^\d+$/, message: "La cédula de extranjería debe contener entre 4 y 10 dígitos." },
  RC: { min: 10, max: 11, pattern: /^\d+$/, message: "El registro civil debe contener entre 10 y 11 dígitos." },
  PASAPORTE: { min: 5, max: 20, pattern: /^[A-Z0-9]+$/, message: "El pasaporte debe contener entre 5 y 20 letras o números." },
};

const EMPTY_FORM: PatientRegisterFormData = {
  email: "",
  tipoDocumento: "",
  numeroDocumento: "",
  primerNombre: "",
  segundoNombre: "",
  primerApellido: "",
  segundoApellido: "",
  telefono: "",
  eps: "",
  epsId: "",
  genero: "",
  fechaNacimiento: "",
  departamento: "",
  departamentoId: "",
  municipio: "",
  municipioId: "",
};

export function usePatientRegister() {
  const router = useRouter();

  const [form, setForm] = useState<PatientRegisterFormData>(EMPTY_FORM);
  const [epsList, setEpsList] = useState<EpsItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [loadingEps, setLoadingEps] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<PatientRegisterErrors>({});
  const [registrationChannel, setRegistrationChannel] = useState<"email" | "phone">("email");

  useEffect(() => {
    const raw = localStorage.getItem("register_credentials");
    if (!raw) return;
    try {
      const credentials = JSON.parse(raw) as { channel?: "email" | "phone"; phone?: string };
      if (credentials.channel === "phone" && credentials.phone) {
        setRegistrationChannel("phone");
        setForm((previous) => ({ ...previous, telefono: credentials.phone ?? "" }));
      }
    } catch {
      // handleSubmit conserva la validación y limpieza del estado inválido.
    }
  }, []);

  const clearError = (field: keyof PatientRegisterErrors) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    const loadEps = async () => {
      try {
        const response = await fetch(`${API_URL}/eps`);

        if (!response.ok) {
          throw new Error("No se pudo cargar la lista de EPS");
        }

        const data = (await response.json()) as EpsItem[];
        setEpsList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert("Error al cargar EPS");
      } finally {
        setLoadingEps(false);
      }
    };

    void loadEps();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch(`${COLOMBIA_API}/Department`);

        if (!response.ok) {
          throw new Error("No se pudieron cargar los departamentos");
        }

        const data = (await response.json()) as DepartmentItem[];
        setDepartments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert("Error al cargar departamentos");
      } finally {
        setLoadingDepartments(false);
      }
    };

    void loadDepartments();
  }, []);

  const loadCitiesByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setCities([]);
      return;
    }

    try {
      setLoadingCities(true);

      const response = await fetch(
        `${COLOMBIA_API}/Department/${departmentId}/cities`,
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los municipios");
      }

      const data = (await response.json()) as CityItem[];
      setCities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Error al cargar municipios");
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "tipoDocumento") {
      const isPassport = value === "PASAPORTE";

      setForm((prev) => ({
        ...prev,
        tipoDocumento: value,
        numeroDocumento: isPassport
          ? prev.numeroDocumento
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 20)
          : prev.numeroDocumento.replace(/\D/g, "").slice(0, 11),
      }));
      clearError("tipoDocumento");
      clearError("numeroDocumento");
      return;
    }

    if (name === "numeroDocumento") {
      const normalized =
        form.tipoDocumento === "PASAPORTE"
          ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20)
          : value.replace(/\D/g, "").slice(0, 11);

      setForm((prev) => ({ ...prev, numeroDocumento: normalized }));
      clearError("numeroDocumento");
      return;
    }

    if (name === "telefono") {
      if (registrationChannel === "phone") return;
      setForm((prev) => ({
        ...prev,
        telefono: value.replace(/\D/g, "").slice(0, 10),
      }));
      clearError("telefono");
      return;
    }

    if (name === "epsId") {
      const selectedEps = epsList.find((item) => String(item.id) === value);

      setForm((prev) => ({
        ...prev,
        epsId: value,
        eps: selectedEps?.nombre || "",
      }));

      return;
    }

    if (name === "departamentoId") {
      const selectedDepartment = departments.find(
        (item) => String(item.id) === value,
      );

      setForm((prev) => ({
        ...prev,
        departamentoId: value,
        departamento: selectedDepartment?.name || "",
        municipioId: "",
        municipio: "",
      }));

      await loadCitiesByDepartment(value);
      return;
    }

    if (name === "municipioId") {
      const selectedCity = cities.find((item) => String(item.id) === value);

      setForm((prev) => ({
        ...prev,
        municipioId: value,
        municipio: selectedCity?.name || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      [
        "primerNombre",
        "email",
        "segundoNombre",
        "primerApellido",
        "segundoApellido",
        "fechaNacimiento",
      ].includes(name)
    ) {
      clearError(name as keyof PatientRegisterErrors);
    }
  };

  const validateRegistrationFields = () => {
    const nextErrors: PatientRegisterErrors = {};
    const documentRule = DOCUMENT_RULES[form.tipoDocumento];
    if (registrationChannel === "phone") {
      const email = form.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
        nextErrors.email = "Ingresa un correo electrónico válido.";
      }
    }

    if (!documentRule) {
      nextErrors.tipoDocumento = "Selecciona un tipo de documento válido.";
    }

    const document = form.numeroDocumento.trim();
    if (!document) {
      nextErrors.numeroDocumento = "Ingresa el número de documento.";
    } else if (
      !documentRule ||
      !documentRule.pattern.test(document) ||
      document.length < documentRule.min ||
      document.length > documentRule.max
    ) {
      nextErrors.numeroDocumento =
        documentRule?.message || "Ingresa un documento válido.";
    }

    const validateName = (
      field:
        | "primerNombre"
        | "segundoNombre"
        | "primerApellido"
        | "segundoApellido",
      value: string,
      required: boolean,
      label: string,
    ) => {
      const normalized = value.trim();

      if (!normalized && required) {
        nextErrors[field] = `${label} es obligatorio.`;
      } else if (
        normalized &&
        (normalized.length < 2 ||
          normalized.length > 60 ||
          !NAME_PATTERN.test(normalized))
      ) {
        nextErrors[field] =
          `${label} debe tener entre 2 y 60 caracteres y usar solo letras, espacios, guiones o apóstrofes.`;
      }
    };

    validateName("primerNombre", form.primerNombre, true, "El primer nombre");
    validateName("segundoNombre", form.segundoNombre, false, "El segundo nombre");
    validateName("primerApellido", form.primerApellido, true, "El primer apellido");
    validateName("segundoApellido", form.segundoApellido, false, "El segundo apellido");

    if (!/^3\d{9}$/.test(form.telefono)) {
      nextErrors.telefono =
        "Ingresa un celular colombiano válido de 10 dígitos que comience por 3.";
    }

    if (!form.fechaNacimiento) {
      nextErrors.fechaNacimiento = "Selecciona el día, mes y año de nacimiento.";
    } else {
      const [year, month, day] = form.fechaNacimiento.split("-").map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oldestAllowedDate = new Date(today);
      oldestAllowedDate.setFullYear(today.getFullYear() - 120);

      const isRealDate =
        birthDate.getFullYear() === year &&
        birthDate.getMonth() === month - 1 &&
        birthDate.getDate() === day;

      if (!isRealDate) {
        nextErrors.fechaNacimiento = "Ingresa una fecha de nacimiento válida.";
      } else if (birthDate > today) {
        nextErrors.fechaNacimiento = "La fecha de nacimiento no puede ser futura.";
      } else if (birthDate < oldestAllowedDate) {
        nextErrors.fechaNacimiento =
          "La fecha de nacimiento no puede superar los 120 años.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    const credentials = localStorage.getItem("register_credentials");

    if (!credentials) {
      alert("Primero completa el paso de correo y contraseña");
      router.push("/register");
      return;
    }

    let parsedCredentials: {
      channel?: "email" | "phone";
      email?: string;
      phone?: string;
      password: string;
    };

    try {
      parsedCredentials = JSON.parse(credentials);
    } catch {
      localStorage.removeItem("register_credentials");
      alert("Los datos del primer paso no son válidos. Intenta nuevamente.");
      router.push("/register");
      return;
    }

    if (!validateRegistrationFields()) return;

    if (
      !form.tipoDocumento ||
      !form.numeroDocumento ||
      !form.primerNombre ||
      !form.primerApellido ||
      !form.telefono ||
      !form.eps ||
      !form.genero ||
      !form.fechaNacimiento ||
      !form.departamento ||
      !form.municipio
    ) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: registrationChannel === "phone" ? form.email.trim().toLowerCase() : parsedCredentials.email,
        password: parsedCredentials.password,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        primerNombre: form.primerNombre,
        segundoNombre: form.segundoNombre,
        primerApellido: form.primerApellido,
        segundoApellido: form.segundoApellido,
        telefono: form.telefono,
        eps: form.eps,
        epsId: form.epsId ? Number(form.epsId) : undefined,
        genero: form.genero,
        fechaNacimiento: form.fechaNacimiento,
        departamento: form.departamento,
        municipio: form.municipio,
      };

      if (registrationChannel === "phone") {
        const result = await registerPatientByPhone(payload);
        localStorage.removeItem("register_credentials");
        router.push(`/verify?channel=phone&registrationId=${result.registrationId}&challengeId=${encodeURIComponent(result.challengeId)}&phone=${encodeURIComponent(result.maskedPhone)}`);
        return;
      }

      await registerPatient(payload);

      localStorage.removeItem("register_credentials");

      alert(
        "Registro completado con éxito. Revisa tu correo e ingresa el código de verificación.",
      );

      router.push(
        `/verify?email=${encodeURIComponent(parsedCredentials.email ?? "")}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al completar el registro");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    epsList,
    departments,
    cities,
    loading,
    loadingEps,
    loadingDepartments,
    loadingCities,
    errors,
    registrationChannel,
    handleChange,
    handleSubmit,
  };
}
