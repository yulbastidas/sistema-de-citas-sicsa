"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
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
import { notifySicsa as alert, promptSicsa } from "@/app/components/SicsaFeedback";

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

type EpsPortal = {
  label: string;
  url: string;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://74.161.42.39:3000";

/*
 * Portales utilizados por el administrador para verificar
 * la afiliación antes de aprobar o rechazar la solicitud.
 */
const EPS_PORTALS: Record<string, EpsPortal> = {
  emssanar: {
    label: "Abrir portal de Emssanar",
    url: "https://emssanarlazos.org/cas/login?service=https%3A%2F%2Femssanarlazos.org%2Fweb%2Fj_spring_cas_security_check",
  },

  asmet: {
    label: "Abrir oficina virtual de Asmet Salud",
    url: "https://oficinavirtual.asmetsalud.com/#/ov/afiliados",
  },

  nuevaeps: {
    label: "Abrir portal de Nueva EPS",
    url: "https://portal.nuevaeps.com.co/Portal/home.jspx",
  },

  adres: {
    label: "Consultar afiliación en ADRES",
    url: "https://www.adres.gov.co/consulte-su-eps",
  },
};

/**
 * Limpia el nombre de la EPS para reconocer variaciones como:
 * - Emssanar
 * - Emssanar EPS
 * - ASMET SALUD EPS
 * - Policía Nacional
 */
function normalizeEpsName(value?: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Devuelve el portal correspondiente a la EPS.
 *
 * Emssanar -> portal Emssanar
 * Asmet Salud -> oficina virtual Asmet
 * Nueva EPS -> portal Nueva EPS
 * Sanitas, Policía, Fomag y Mallamas -> ADRES
 */
function getEpsPortal(epsName?: string): EpsPortal | null {
  const normalizedEps = normalizeEpsName(epsName);

  if (!normalizedEps) {
    return null;
  }

  if (normalizedEps.includes("emssanar")) {
    return EPS_PORTALS.emssanar;
  }

  if (
    normalizedEps.includes("asmetsalud") ||
    normalizedEps.includes("asmet")
  ) {
    return EPS_PORTALS.asmet;
  }

  if (
    normalizedEps.includes("nuevaeps") ||
    normalizedEps.includes("nueva")
  ) {
    return EPS_PORTALS.nuevaeps;
  }

  if (
    normalizedEps.includes("sanitas") ||
    normalizedEps.includes("policianacional") ||
    normalizedEps.includes("policia") ||
    normalizedEps.includes("fomag") ||
    normalizedEps.includes("mallamas")
  ) {
    return EPS_PORTALS.adres;
  }

  return null;
}

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
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: `Bearer ${token}` },
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

    const motivoRechazo = await promptSicsa({
      title: "Rechazar verificación",
      message: "Indica el motivo que se asociará a esta solicitud.",
      inputLabel: "Motivo del rechazo",
      inputPlaceholder: "Escribe un motivo claro",
      confirmLabel: "Sí, rechazar",
    });

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
      (item) =>
        (item.estado || item.status || "").toLowerCase() === "pendiente",
    );
  }, [items]);

  const approvedItems = useMemo(() => {
    return items.filter(
      (item) =>
        (item.estado || item.status || "").toLowerCase() === "aprobado",
    );
  }, [items]);

  const rejectedItems = useMemo(() => {
    return items.filter(
      (item) =>
        (item.estado || item.status || "").toLowerCase() === "rechazado",
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
    <main className="min-h-screen bg-slate-100">
      <section className="px-4 pb-5 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-[1600px]">
        <header className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
          <AdminSidebar />
          <section className="px-6 py-7 sm:px-8">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <article>
              <section>
                <h1 className="text-4xl font-bold tracking-tight">
                  Supervisión de verificaciones
                </h1>

                <p className="mt-2 max-w-3xl text-slate-200">
                  Revisa solicitudes enviadas por los pacientes y decide su
                  aprobación o rechazo.
                </p>
              </section>
            </article>

            <section className="flex w-full flex-col gap-4 xl:max-w-2xl xl:items-end">
              <section className="grid w-full gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Pendientes</p>

                <p className="mt-1 text-2xl font-bold">
                  {pendingItems.length}
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Aprobadas</p>

                <p className="mt-1 text-2xl font-bold">
                  {approvedItems.length}
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Rechazadas</p>

                <p className="mt-1 text-2xl font-bold">
                  {rejectedItems.length}
                </p>
              </article>
              </section>
            </section>
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
                Revisa la afiliación en el portal de la EPS antes de aprobar o
                rechazar cada solicitud.
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
              {pendingItems.map((item) => {
                const epsName =
                  item.eps || item.patient?.epsPaciente || "Sin EPS";

                const epsPortal = getEpsPortal(epsName);

                return (
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
                          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm text-slate-500">Correo</p>

                            <p className="mt-1 break-all font-semibold text-slate-900">
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

                          <article className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                            <p className="text-sm text-slate-500">EPS</p>

                            {epsPortal ? (
                              <>
                                <a
                                  href={epsPortal.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={epsPortal.label}
                                  className="mt-2 flex w-fit items-center gap-2 font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 transition hover:text-blue-900 hover:decoration-blue-700"
                                >
                                  <span>{epsName}</span>
                                  <ExternalLink size={16} />
                                </a>

                                <p className="mt-2 text-xs leading-5 text-blue-700">
                                  Haz clic para verificar la afiliación antes de
                                  aprobar o rechazar.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {epsName}
                                </p>

                                <p className="mt-2 text-xs text-amber-700">
                                  No hay un portal configurado para esta EPS.
                                </p>
                              </>
                            )}
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

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Verifica primero la afiliación en el portal de la EPS.
                        </p>

                        <section className="mt-4 flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                          >
                            <CheckCircle2 size={18} />
                            Aprobar
                          </button>

                          <button
                            type="button"
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
                );
              })}
            </section>
          )}
        </section>
        </section>
      </section>
    </main>
  );
}
