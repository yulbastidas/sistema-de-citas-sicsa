"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
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

      const pendingItems = allItems.filter(
        (item: VerificationItem) =>
          (item.estado || item.status || "").toLowerCase() === "pendiente"
      );

      setItems(pendingItems);
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
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <section className="flex items-center gap-3">
            <ShieldCheck className="text-blue-800" size={28} />
            <article>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Panel administrativo
              </h1>
              <p className="mt-2 text-slate-600">
                Supervisión de verificaciones de pacientes
              </p>
            </article>
          </section>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Solicitudes pendientes
            </h2>
            <p className="mt-2 text-slate-600">
              Revisa y decide el estado de las verificaciones enviadas.
            </p>
          </header>

          {loading ? (
            <p className="text-slate-600">Cargando verificaciones...</p>
          ) : items.length === 0 ? (
            <p className="text-slate-600">No hay solicitudes pendientes.</p>
          ) : (
            <section className="space-y-5">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article>
                      <p className="text-sm text-slate-500">Paciente</p>
                      <p className="font-semibold text-slate-900">
                        {item.patient?.nombre || "Paciente"}
                      </p>
                    </article>

                    <article>
                      <p className="text-sm text-slate-500">Correo</p>
                      <p className="font-semibold text-slate-900">
                        {item.patient?.email ||
                          item.user?.email ||
                          "No disponible"}
                      </p>
                    </article>

                    <article>
                      <p className="text-sm text-slate-500">Documento</p>
                      <p className="font-semibold text-slate-900">
                        {item.documento || "Sin documento"}
                      </p>
                    </article>

                    <article>
                      <p className="text-sm text-slate-500">EPS</p>
                      <p className="font-semibold text-slate-900">
                        {item.eps || item.patient?.epsPaciente || "Sin EPS"}
                      </p>
                    </article>
                  </section>

                  {item.patient?.telefono && (
                    <section className="mt-4">
                      <p className="text-sm text-slate-500">Teléfono</p>
                      <p className="font-semibold text-slate-900">
                        {item.patient.telefono}
                      </p>
                    </section>
                  )}

                  {item.motivoRechazo && (
                    <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <header className="flex items-center gap-2">
                        <FileText size={18} className="text-red-700" />
                        <p className="text-sm font-semibold text-red-700">
                          Motivo de rechazo
                        </p>
                      </header>
                      <p className="mt-2 text-red-800">{item.motivoRechazo}</p>
                    </section>
                  )}

                  <footer className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                    >
                      <CheckCircle2 size={18} />
                      Aprobar
                    </button>

                    <button
                      onClick={() => handleReject(item.id)}
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <XCircle size={18} />
                      Rechazar
                    </button>
                  </footer>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}