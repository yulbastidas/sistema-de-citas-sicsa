"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken, getUser } from "@/service/session";
import {
  getPatients,
  updatePatientByAdmin,
} from "@/service/patient";

import { EMPTY_PATIENT_FORM } from "../constants";
import type {
  Patient,
  PatientFormData,
} from "../types";

function patientToForm(patient: Patient): PatientFormData {
  return {
    tipoDocumento: patient.tipoDocumento || "",
    numeroDocumento: patient.numeroDocumento || "",
    primerNombre: patient.primerNombre || "",
    segundoNombre: patient.segundoNombre || "",
    primerApellido: patient.primerApellido || "",
    segundoApellido: patient.segundoApellido || "",
    telefono: patient.telefono || "",
    email: patient.email || "",
    eps: patient.eps || "",
    genero: patient.genero || "",
    fechaNacimiento: patient.fechaNacimiento || "",
    departamento: patient.departamento || "",
    municipio: patient.municipio || "",
    direccion: patient.direccion || "",
    tipoSangre: patient.tipoSangre || "",
    factorRh: patient.factorRh || "",
    alergias: patient.alergias || "",
    enfermedadesCronicas:
      patient.enfermedadesCronicas || "",
    contactoEmergenciaNombre:
      patient.contactoEmergenciaNombre || "",
    contactoEmergenciaTelefono:
      patient.contactoEmergenciaTelefono || "",
    contactoEmergenciaParentesco:
      patient.contactoEmergenciaParentesco || "",
  };
}

export function useAdminPatients() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [form, setForm] = useState<PatientFormData>(
    EMPTY_PATIENT_FORM,
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(
    async (searchValue = "") => {
      const token = getToken();

      if (!token) {
        router.replace("/login?role=admin");
        return;
      }

      try {
        setLoading(true);

        const result = await getPatients(
          token,
          searchValue,
        );

        const patientList = Array.isArray(result)
          ? result
          : [];

        setPatients(patientList);
      } catch (error) {
        console.error(
          "Error cargando pacientes:",
          error,
        );

        alert("No se pudieron cargar los pacientes");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user || user.role !== "admin") {
      router.replace("/login?role=admin");
      return;
    }

    void loadPatients();
  }, [router, loadPatients]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setForm(patientToForm(patient));
  };

  const updateFormField = (
    field: keyof PatientFormData,
    value: string,
  ) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));
  };

  const searchPatients = () => {
    void loadPatients(search.trim());
  };

  const clearSearch = () => {
    setSearch("");
    void loadPatients("");
  };

  const validateForm = () => {
    if (!form.tipoDocumento.trim()) {
      alert("Selecciona o escribe el tipo de documento");
      return false;
    }

    if (!form.numeroDocumento.trim()) {
      alert("Escribe el número de documento");
      return false;
    }

    if (!form.primerNombre.trim()) {
      alert("Escribe el primer nombre");
      return false;
    }

    if (!form.primerApellido.trim()) {
      alert("Escribe el primer apellido");
      return false;
    }

    if (!form.telefono.trim()) {
      alert("Escribe el teléfono");
      return false;
    }

    if (!form.email.trim()) {
      alert("Escribe el correo electrónico");
      return false;
    }

    if (!form.eps.trim()) {
      alert("Escribe la EPS");
      return false;
    }

    if (!form.departamento.trim()) {
      alert("Escribe el departamento");
      return false;
    }

    if (!form.municipio.trim()) {
      alert("Escribe el municipio");
      return false;
    }

    return true;
  };

  const savePatient = async () => {
    const token = getToken();

    if (!token) {
      router.replace("/login?role=admin");
      return;
    }

    if (!selectedPatient) {
      alert("Selecciona un paciente");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const updatedPatient =
        await updatePatientByAdmin(
          token,
          selectedPatient.id,
          form,
        );

      setSelectedPatient(updatedPatient);

      setForm(patientToForm(updatedPatient));

      setPatients((previousPatients) =>
        previousPatients.map((patient) =>
          patient.id === updatedPatient.id
            ? updatedPatient
            : patient,
        ),
      );

      alert(
        "Datos del paciente actualizados correctamente",
      );
    } catch (error) {
      console.error(
        "Error actualizando paciente:",
        error,
      );

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error actualizando paciente");
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    patients,
    selectedPatient,
    form,
    search,
    loading,
    saving,
    setSearch,
    selectPatient,
    updateFormField,
    searchPatients,
    clearSearch,
    savePatient,
  };
}