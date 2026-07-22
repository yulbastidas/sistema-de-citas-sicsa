"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPatient } from "@/service/auth";
import type {
  CityItem,
  DepartmentItem,
  EpsItem,
  PatientRegisterFormData,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const COLOMBIA_API = "https://api-colombia.com/api/v1";

const EMPTY_FORM: PatientRegisterFormData = {
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
  };

  const handleSubmit = async () => {
    const credentials = localStorage.getItem("register_credentials");

    if (!credentials) {
      alert("Primero completa el paso de correo y contraseña");
      router.push("/register");
      return;
    }

    let parsedCredentials: {
      email: string;
      password: string;
    };

    try {
      parsedCredentials = JSON.parse(credentials) as {
        email: string;
        password: string;
      };
    } catch {
      localStorage.removeItem("register_credentials");
      alert("Los datos del primer paso no son válidos. Intenta nuevamente.");
      router.push("/register");
      return;
    }

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

    /*
     * Validación de la fecha de nacimiento.
     * Se agrega T00:00:00 para evitar diferencias por zona horaria.
     */
    const birthDate = new Date(`${form.fechaNacimiento}T00:00:00`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(birthDate.getTime())) {
      alert("Ingresa una fecha de nacimiento válida");
      return;
    }

    if (birthDate > today) {
      alert("La fecha de nacimiento no puede ser futura");
      return;
    }

    const oldestAllowedDate = new Date(today);
    oldestAllowedDate.setFullYear(today.getFullYear() - 120);

    if (birthDate < oldestAllowedDate) {
      alert("La fecha de nacimiento no puede superar los 120 años");
      return;
    }

    try {
      setLoading(true);

      await registerPatient({
        email: parsedCredentials.email,
        password: parsedCredentials.password,
        role: "patient",
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
      });

      localStorage.removeItem("register_credentials");

      alert(
        "Registro completado con éxito. Revisa tu correo e ingresa el código de verificación.",
      );

      router.push(
        `/verify?email=${encodeURIComponent(parsedCredentials.email)}`,
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
    handleChange,
    handleSubmit,
  };
}