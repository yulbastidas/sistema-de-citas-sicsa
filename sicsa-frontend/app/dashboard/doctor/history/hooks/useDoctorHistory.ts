"use client";

import { useEffect, useMemo, useState } from "react";

import {
  downloadAppointmentPdf,
  getDoctorHistory,
} from "@/service/appointment";
import { getToken, getUser, logout } from "@/service/session";
import { notifySicsa as alert } from "@/app/components/SicsaFeedback";
import { HistoryAppointmentItem, SessionUser } from "../types";

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

export function useDoctorHistory() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [appointments, setAppointments] = useState<HistoryAppointmentItem[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token || !savedUser) {
      window.location.href = "/login?role=doctor";
      return;
    }

    const normalizedRole = normalizeRole(savedUser.role);

    if (normalizedRole !== "doctor") {
      window.location.href = "/login?role=doctor";
      return;
    }

    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      try {
        setErrorMessage("");

        const token = getToken();
        const savedUser = getUser() as SessionUser | null;

        if (!token || !savedUser?.sub) {
          logout();
          window.location.href = "/login?role=doctor";
          return;
        }

        const result = await getDoctorHistory(token, savedUser.sub, {
          search,
          date: dateFilter,
        });
        const items = Array.isArray(result) ? result : result?.data || [];

        setAppointments(items);
      } catch (error: unknown) {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          if (
            message.includes("unauthorized") ||
            message.includes("no autorizado") ||
            message.includes("jwt") ||
            message.includes("token")
          ) {
            logout();
            window.location.href = "/login?role=doctor";
            return;
          }

          setErrorMessage(error.message);
        } else {
          setErrorMessage("No se pudo cargar el historial clínico");
        }
      } finally {
        setLoading(false);
      }
    };

    if (checkingAuth) return;

    void loadHistory();
  }, [checkingAuth, search, dateFilter]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const patientName = item.patient?.nombre?.toLowerCase() || "";
      const patientDocument = item.patient?.documento?.toLowerCase() || "";
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        patientName.includes(searchValue) ||
        patientDocument.includes(searchValue);

      const matchesDate = !dateFilter || item.fecha === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [appointments, search, dateFilter]);

  const handleDownloadPdf = async (appointmentId: number): Promise<void> => {
    try {
      setDownloadingId(appointmentId);

      const token = getToken();

      if (!token) {
        logout();
        window.location.href = "/login?role=doctor";
        return;
      }

      const blob = await downloadAppointmentPdf(token, appointmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `reporte-cita-${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (
          message.includes("unauthorized") ||
          message.includes("no autorizado") ||
          message.includes("jwt") ||
          message.includes("token")
        ) {
          logout();
          window.location.href = "/login?role=doctor";
          return;
        }

        alert(error.message);
      } else {
        alert("Error al descargar el PDF");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const totalHistory = appointments.length;
  const totalWithReport = appointments.filter(
    (item) => item.medicalReport?.exists,
  ).length;

  return {
    checkingAuth,
    loading,
    downloadingId,
    errorMessage,
    filteredAppointments,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    totalHistory,
    totalWithReport,
    handleDownloadPdf,
  };
}
