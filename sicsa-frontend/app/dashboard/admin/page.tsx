"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getToken, getUser } from "@/service/session";
import {
  approveVerification,
  getAllVerifications,
  rejectVerification,
} from "@/service/verification";
import AdminSidebar from "@/app/components/AdminSidebar";

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type VerificationItem = {
  id: number;
  documento?: string;
  eps?: string;
  estado?: string;
  status?: string;
  motivoRechazo?: string | null;
  patient?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    epsPaciente?: string;
  } | null;
  user?: {
    email?: string;
  };
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function AdminDashboard() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VerificationItem[]>([]);

  useEffect(() => {
    const token = getToken();
    const user = getUser() as SessionUser | null;

    if (!token || !user) {
      router.replace("/login?role=admin");
      return;
    }

    const isAdmin =
      user.role === "admin" || user.role === 1 || user.role === "1";

    if (!isAdmin) {
      router.replace("/login?role=admin");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  const loadVerifications = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);

      const result = await getAllVerifications(token);
      const allItems = Array.isArray(result) ? result : result.data || [];
      setItems(allItems);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al cargar verificaciones");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkingAuth) return;
    void loadVerifications();
  }, [checkingAuth]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket admin conectado:", socket.id);
    });

    socket.on("verificationRequested", () => {
      void loadVerifications();
    });

    socket.on("verificationUpdated", () => {
      void loadVerifications();
    });

    socket.on("disconnect", () => {
      console.log("Socket admin desconectado");
    });

    return () => {
      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [checkingAuth]);

  const handleApprove = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await approveVerification(token, id);
      alert("Verificación aprobada correctamente");
      await loadVerifications();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al aprobar verificación");
      }
    }
  };

  const handleReject = async (id: number) => {
    const token = getToken();
    if (!token) return;

    const motivoRechazo = prompt("Escribe el motivo del rechazo:");
    if (!motivoRechazo) return;

    try {
      await rejectVerification(token, id, motivoRechazo);
      alert("Verificación rechazada correctamente");
      await loadVerifications();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al rechazar verificación");
      }
    }
  };

  const pendingItems = useMemo(() => {
    return items.filter(
      (item) => (item.estado || item.status || "").toLowerCase() === "pendiente",
    );
  }, [items]);

  const approvedItems = useMemo(() => {
    return items.filter(
      (item) => (item.estado || item.status || "").toLowerCase() === "aprobado",
    );
  }, [items]);

  const rejectedItems = useMemo(() => {
    return items.filter(
      (item) => (item.estado || item.status || "").toLowerCase() === "rechazado",
    );
  }, [items]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <section className="flex-1 px-8 py-10">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-8 py-8 text-white shadow-xl">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <article className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck size={30} className="text-white" />
              </span>

              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Panel administrativo
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Supervisión de verificaciones
                </h1>
                <p className="mt-2 max-w-3xl text-slate-200">
                  Revisa solicitudes enviadas por los pacientes y decide su
                  aprobación o rechazo.
                </p>
              </section>
            </article>

            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Pendientes</p>
                <p className="mt-1 text-2xl font-bold">{pendingItems.length}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Aprobadas</p>
                <p className="mt-1 text-2xl font-bold">{approvedItems.length}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Rechazadas</p>
                <p className="mt-1 text-2xl font-bold">{rejectedItems.length}</p>
              </article>
            </section>
          </section>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <article>
              <h2 className="text-2xl font-semibold text-slate-900">
                Solicitudes pendientes
              </h2>
              <p className="mt-1 text-slate-600">
                Revisa y decide el estado de las verificaciones enviadas.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Actualización en tiempo real
            </article>
          </header>

          {loading ? (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-600">Cargando verificaciones...</p>
            </article>
          ) : pendingItems.length === 0 ? (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Clock3 className="mx-auto text-slate-400" size={32} />
              <p className="mt-3 font-medium text-slate-700">
                No hay solicitudes pendientes
              </p>
              <p className="mt-1 text-sm text-slate-500">
                En este momento no hay verificaciones por revisar.
              </p>
            </article>
          ) : (
            <section className="space-y-5">
              {pendingItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <section className="flex-1">
                      <section className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-bold text-slate-900">
                          {item.patient?.nombre || "Paciente"}
                        </p>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pendiente
                        </span>
                      </section>

                      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-500">Correo</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {item.patient?.email ||
                              item.user?.email ||
                              "No disponible"}
                          </p>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-500">Documento</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {item.documento || "Sin documento"}
                          </p>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-500">EPS</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {item.eps || item.patient?.epsPaciente || "Sin EPS"}
                          </p>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-500">Teléfono</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {item.patient?.telefono || "No disponible"}
                          </p>
                        </article>
                      </section>

                      {item.motivoRechazo && (
                        <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                          <header className="flex items-center gap-2">
                            <FileText size={18} className="text-red-700" />
                            <p className="text-sm font-semibold text-red-700">
                              Motivo de rechazo
                            </p>
                          </header>
                          <p className="mt-2 text-red-800">
                            {item.motivoRechazo}
                          </p>
                        </section>
                      )}
                    </section>

                    <aside className="w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <header className="flex items-center gap-2">
                        <Users size={18} className="text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Acciones
                        </p>
                      </header>

                      <section className="mt-4 flex flex-col gap-3">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                        >
                          <CheckCircle2 size={18} />
                          Aprobar
                        </button>

                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <XCircle size={18} />
                          Rechazar
                        </button>
                      </section>
                    </aside>
                  </header>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}