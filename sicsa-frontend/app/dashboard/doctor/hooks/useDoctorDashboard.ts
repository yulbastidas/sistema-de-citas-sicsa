"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import {
  downloadAppointmentPdf,
  getDoctorAppointments,
  getQueueAppointments,
} from "@/service/appointment";
import { getToken, getUser, logout } from "@/service/session";
import { AppointmentItem, SessionUser } from "../types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export function normalizeRole(
  role: string | number | undefined,
): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

export function useDoctorDashboard() {
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<AppointmentItem[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingAppointments(true);

      const savedUser = getUser() as SessionUser | null;

      if (!savedUser?.sub) {
        throw new Error("No se encontró el identificador del doctor");
      }

      const result = await getDoctorAppointments(token, savedUser.sub);
      const items = Array.isArray(result) ? result : result?.data || [];

      const confirmedAppointments = items.filter(
        (item: AppointmentItem) =>
          String(item.estado || "").toLowerCase() === "confirmada",
      );

      setAppointments(confirmedAppointments);
    } catch (error: unknown) {
      setAppointments([]);

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
        alert("Error al cargar citas del doctor");
      }
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingQueue(true);

      const savedUser = getUser() as SessionUser | null;

      if (!savedUser?.sub) {
        throw new Error("No se encontró el identificador del doctor");
      }

      const result = await getQueueAppointments(token, today, savedUser.sub);
      const items = Array.isArray(result) ? result : result?.data || [];
      setQueueItems(items);
    } catch (error: unknown) {
      setQueueItems([]);

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
        alert("Error al cargar cola priorizada");
      }
    } finally {
      setLoadingQueue(false);
    }
  }, [today]);

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

    setUser({
      ...savedUser,
      role: normalizedRole,
    });

    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (checkingAuth) return;

    void loadAppointments();
    void loadQueue();
  }, [checkingAuth, loadAppointments, loadQueue]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket doctor conectado:", socket.id);
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("queueUpdated", () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on("disconnect", () => {
      console.log("Socket doctor desconectado");
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
  }, [checkingAuth, loadAppointments, loadQueue]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login?role=doctor";
  };

  const openMedicalReportPdf = async (appointmentId: number): Promise<void> => {
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
        alert("Error al abrir el reporte");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    user,
    today,
    checkingAuth,
    loadingAppointments,
    loadingQueue,
    downloadingId,
    appointments,
    queueItems,
    handleLogout,
    openMedicalReportPdf,
  };
}
