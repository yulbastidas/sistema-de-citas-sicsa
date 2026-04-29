"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken, getUser } from "@/service/session";
import { MedicalReportForm, SessionUser } from "../types";

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

export function useMedicalReport(appointmentId: number) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<MedicalReportForm>({
    enfermedadActual: "",
    antecedentes: "",
    signosVitales: "",
    examenFisico: "",
    diagnostico: "",
    tratamiento: "",
    observaciones: "",
  });

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

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const fetchMedicalReport = async (): Promise<void> => {
      try {
        setMessage("");

        const token = getToken();

        if (!token) {
          setMessage("No se encontró el token de autenticación");
          setLoadingData(false);
          return;
        }

        const response = await fetch(
          `http://localhost:3000/medical-reports/${appointmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          setMessage("Sesión expirada. Inicia sesión nuevamente");
          router.replace("/login?role=doctor");
          return;
        }

        if (response.status === 404) {
          setLoadingData(false);
          return;
        }

        if (!response.ok) {
          setMessage("No se pudo cargar el reporte clínico");
          setLoadingData(false);
          return;
        }

        const text = await response.text();

        if (!text.trim()) {
          setLoadingData(false);
          return;
        }

        const data = JSON.parse(text) as Partial<MedicalReportForm>;

        setForm({
          enfermedadActual: data.enfermedadActual ?? "",
          antecedentes: data.antecedentes ?? "",
          signosVitales: data.signosVitales ?? "",
          examenFisico: data.examenFisico ?? "",
          diagnostico: data.diagnostico ?? "",
          tratamiento: data.tratamiento ?? "",
          observaciones: data.observaciones ?? "",
        });
      } catch (error) {
        console.error("Error cargando reporte médico:", error);
        setMessage("Error al cargar el reporte clínico");
      } finally {
        setLoadingData(false);
      }
    };

    if (!checkingAuth && !Number.isNaN(appointmentId)) {
      void fetchMedicalReport();
    }
  }, [appointmentId, checkingAuth, router]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage("No se encontró el token de autenticación");
        return;
      }

      const response = await fetch("http://localhost:3000/medical-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId,
          ...form,
        }),
      });

      if (response.status === 401) {
        setMessage("Sesión expirada. Inicia sesión nuevamente");
        router.replace("/login?role=doctor");
        return;
      }

      if (!response.ok) {
        setMessage("No se pudo guardar el reporte clínico");
        return;
      }

      setMessage("Reporte clínico guardado correctamente");
    } catch (error) {
      console.error("Error guardando reporte médico:", error);
      setMessage("Error al guardar el reporte clínico");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    try {
      setDownloading(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage("No se encontró el token de autenticación");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/appointments/${appointmentId}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        setMessage("Sesión expirada. Inicia sesión nuevamente");
        router.replace("/login?role=doctor");
        return;
      }

      if (!response.ok) {
        setMessage("No se pudo descargar el PDF");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `reporte-cita-${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      setMessage("Error al descargar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  return {
    checkingAuth,
    loadingData,
    saving,
    downloading,
    message,
    form,
    handleChange,
    handleSave,
    handleDownloadPdf,
    router,
  };
}
