"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken, getUser } from "@/service/session";
import {
  MedicalReportForm,
  SessionUser,
} from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://74.161.42.39:3000";

const initialForm: MedicalReportForm = {
  motivoConsulta: "",
  enfermedadActual: "",

  antecedentes: "",
  antecedentesPersonales: "",
  antecedentesFamiliares: "",
  antecedentesQuirurgicos: "",
  antecedentesAlergicos: "",
  antecedentesFarmacologicos: "",

  signosVitales: "",
  presionArterial: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  temperatura: "",
  saturacionOxigeno: "",
  peso: "",
  talla: "",
  imc: "",

  examenFisico: "",

  diagnostico: "",
  codigoCie10: "",

  tratamiento: "",
  recomendaciones: "",
  remision: "",
  observaciones: "",

  firmaDoctor: "",
};

function normalizeRole(
  role: string | number | undefined,
): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";

  if (typeof role === "string") {
    return role;
  }

  return undefined;
}

function calculateImc(
  peso: string,
  talla: string,
): string {
  const pesoValue = Number(
    String(peso).replace(",", "."),
  );

  const tallaValue = Number(
    String(talla).replace(",", "."),
  );

  if (
    !Number.isFinite(pesoValue) ||
    !Number.isFinite(tallaValue) ||
    pesoValue <= 0 ||
    tallaValue <= 0
  ) {
    return "";
  }

  const tallaEnMetros =
    tallaValue > 3
      ? tallaValue / 100
      : tallaValue;

  const imc =
    pesoValue /
    (tallaEnMetros * tallaEnMetros);

  return imc.toFixed(2);
}

export function useMedicalReport(
  appointmentId: number,
) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [form, setForm] =
    useState<MedicalReportForm>(
      initialForm,
    );

  useEffect(() => {
    const token = getToken();

    const savedUser =
      getUser() as SessionUser | null;

    if (!token || !savedUser) {
      router.replace(
        "/login?role=doctor",
      );

      return;
    }

    const normalizedRole =
      normalizeRole(savedUser.role);

    if (normalizedRole !== "doctor") {
      router.replace(
        "/login?role=doctor",
      );

      return;
    }

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const fetchMedicalReport =
      async (): Promise<void> => {
        try {
          setMessage("");

          const token = getToken();

          if (!token) {
            setMessage(
              "No se encontró el token de autenticación",
            );

            setLoadingData(false);
            return;
          }

          const response = await fetch(
            `${API_URL}/medical-reports/${appointmentId}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

          if (response.status === 401) {
            setMessage(
              "Sesión expirada. Inicia sesión nuevamente",
            );

            router.replace(
              "/login?role=doctor",
            );

            return;
          }

          if (response.status === 404) {
            setForm(initialForm);
            return;
          }

          if (!response.ok) {
            setMessage(
              "No se pudo cargar el reporte clínico",
            );

            return;
          }

          const text =
            await response.text();

          if (!text.trim()) {
            setForm(initialForm);
            return;
          }

          const data =
            JSON.parse(
              text,
            ) as Partial<MedicalReportForm>;

          const peso =
            data.peso ?? "";

          const talla =
            data.talla ?? "";

          setForm({
            motivoConsulta:
              data.motivoConsulta ?? "",

            enfermedadActual:
              data.enfermedadActual ?? "",

            antecedentes:
              data.antecedentes ?? "",

            antecedentesPersonales:
              data.antecedentesPersonales ??
              "",

            antecedentesFamiliares:
              data.antecedentesFamiliares ??
              "",

            antecedentesQuirurgicos:
              data.antecedentesQuirurgicos ??
              "",

            antecedentesAlergicos:
              data.antecedentesAlergicos ??
              "",

            antecedentesFarmacologicos:
              data.antecedentesFarmacologicos ??
              "",

            signosVitales:
              data.signosVitales ?? "",

            presionArterial:
              data.presionArterial ?? "",

            frecuenciaCardiaca:
              data.frecuenciaCardiaca ?? "",

            frecuenciaRespiratoria:
              data.frecuenciaRespiratoria ??
              "",

            temperatura:
              data.temperatura ?? "",

            saturacionOxigeno:
              data.saturacionOxigeno ?? "",

            peso,
            talla,

            imc:
              data.imc ??
              calculateImc(
                peso,
                talla,
              ),

            examenFisico:
              data.examenFisico ?? "",

            diagnostico:
              data.diagnostico ?? "",

            codigoCie10:
              data.codigoCie10 ?? "",

            tratamiento:
              data.tratamiento ?? "",

            recomendaciones:
              data.recomendaciones ?? "",

            remision:
              data.remision ?? "",

            observaciones:
              data.observaciones ?? "",

            firmaDoctor:
              data.firmaDoctor ?? "",
          });
        } catch (error) {
          console.error(
            "Error cargando reporte médico:",
            error,
          );

          setMessage(
            "Error al cargar el reporte clínico",
          );
        } finally {
          setLoadingData(false);
        }
      };

    if (
      !checkingAuth &&
      !Number.isNaN(appointmentId)
    ) {
      void fetchMedicalReport();
    }
  }, [
    appointmentId,
    checkingAuth,
    router,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >,
  ): void => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      if (
        name === "peso" ||
        name === "talla"
      ) {
        updatedForm.imc =
          calculateImc(
            name === "peso"
              ? value
              : updatedForm.peso,

            name === "talla"
              ? value
              : updatedForm.talla,
          );
      }

      return updatedForm;
    });
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
        setMessage(
          "No se encontró el token de autenticación",
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/medical-reports`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            appointmentId,
            ...form,
          }),
        },
      );

      if (response.status === 401) {
        setMessage(
          "Sesión expirada. Inicia sesión nuevamente",
        );

        router.replace(
          "/login?role=doctor",
        );

        return;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Error guardando reporte:",
          errorText,
        );

        setMessage(
          "No se pudo guardar el reporte clínico",
        );

        return;
      }

      setMessage(
        "Reporte clínico guardado correctamente",
      );
    } catch (error) {
      console.error(
        "Error guardando reporte médico:",
        error,
      );

      setMessage(
        "Error al guardar el reporte clínico",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf =
    async (): Promise<void> => {
      try {
        setDownloading(true);
        setMessage("");

        const token = getToken();

        if (!token) {
          setMessage(
            "No se encontró el token de autenticación",
          );

          return;
        }

        const response = await fetch(
          `${API_URL}/appointments/${appointmentId}/pdf`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          setMessage(
            "Sesión expirada. Inicia sesión nuevamente",
          );

          router.replace(
            "/login?role=doctor",
          );

          return;
        }

        if (!response.ok) {
          setMessage(
            "No se pudo descargar el PDF",
          );

          return;
        }

        const blob =
          await response.blob();

        const url =
          window.URL.createObjectURL(
            blob,
          );

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          `historia-clinica-cita-${appointmentId}.pdf`;

        document.body.appendChild(
          link,
        );

        link.click();
        link.remove();

        window.URL.revokeObjectURL(
          url,
        );
      } catch (error) {
        console.error(
          "Error descargando PDF:",
          error,
        );

        setMessage(
          "Error al descargar el PDF",
        );
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