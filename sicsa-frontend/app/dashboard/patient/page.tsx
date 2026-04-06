"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getToken, getUser, logout } from "@/service/session";
import {
  expireMyVerification,
  getMyVerification,
  requestVerification,
} from "@/service/verification";
import { getMyAppointments } from "@/service/appointment";

type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type VerificationResponse = {
  id?: number;
  estado?: string;
  status?: string;
  motivoRechazo?: string | null;
} | null;

type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado?: string;
  motivoConsulta?: string;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function PatientDashboard() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationState>("none");
  const [requestLoading, setRequestLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [form, setForm] = useState({
    documento: "",
    eps: "",
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyVerificationState = useCallback(
    (verification: VerificationResponse) => {
      if (!mountedRef.current) return;

      if (!verification) {
        setVerificationStatus("none");
        return;
      }

      const estado = (
        verification.estado ||
        verification.status ||
        ""
      ).toLowerCase();

      if (estado === "pendiente") {
        setVerificationStatus("pending");
      } else if (estado === "aprobado") {
        setVerificationStatus("approved");
      } else if (estado === "rechazado") {
        setVerificationStatus("rejected");
      } else if (estado === "expirado") {
        setVerificationStatus("expired");
      } else {
        setVerificationStatus("none");
      }
    },
    []
  );

  const loadVerificationStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const verification: VerificationResponse = await getMyVerification(token);
      applyVerificationState(verification);
    } catch (error) {
      console.error("Error cargando verificación:", error);
    }
  }, [applyVerificationState]);

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const result = await getMyAppointments(token);
      const items = Array.isArray(result) ? result : result.data || [];

      if (mountedRef.current) {
        setAppointments(items);
      }
    } catch (error) {
      console.error("Error cargando citas:", error);

      if (mountedRef.current) {
        setAppointments([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      const savedUser = getUser() as SessionUser | null;

      if (!token || !savedUser) {
        router.replace("/login?role=patient");
        return;
      }

      const isPatient =
        savedUser.role === "patient" ||
        savedUser.role === 2 ||
        savedUser.role === "2";

      if (!isPatient) {
        router.replace("/login?role=patient");
        return;
      }

      setUser(savedUser);

      await Promise.all([loadVerificationStatus(), loadAppointments()]);

      if (mountedRef.current) {
        setCheckingAuth(false);
      }
    };

    void init();
  }, [router, loadVerificationStatus, loadAppointments]);

  useEffect(() => {
    if (checkingAuth) return;

    const intervalId = setInterval(() => {
      void loadVerificationStatus();
      void loadAppointments();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [checkingAuth, loadVerificationStatus, loadAppointments]);

  useEffect(() => {
    if (checkingAuth) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket paciente-dashboard conectado:", socket.id);
    });

    socket.on("verificationRequested", () => {
      void loadVerificationStatus();
    });

    socket.on("verificationUpdated", () => {
      void loadVerificationStatus();
    });

    socket.on("appointmentCreated", () => {
      void loadAppointments();
    });

    socket.on("appointmentUpdated", () => {
      void loadAppointments();
    });

    socket.on("appointmentCancelled", () => {
      void loadAppointments();
    });

    socket.on("disconnect", () => {
      console.log("Socket paciente-dashboard desconectado");
    });

    return () => {
      socket.off("connect");
      socket.off("verificationRequested");
      socket.off("verificationUpdated");
      socket.off("appointmentCreated");
      socket.off("appointmentUpdated");
      socket.off("appointmentCancelled");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [checkingAuth, loadVerificationStatus, loadAppointments]);

  const handleLogout = async () => {
    const token = getToken();

    try {
      if (token) {
        await expireMyVerification(token);
      }
    } catch (error) {
      console.error("Error expirando verificación al cerrar sesión:", error);
    } finally {
      logout();
      router.push("/login?role=patient");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRequestVerification = async () => {
    const token = getToken();
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!form.documento || !form.eps) {
      alert("Completa documento y EPS");
      return;
    }

    try {
      setRequestLoading(true);

      await requestVerification(token, form);

      if (mountedRef.current) {
        setVerificationStatus("pending");
      }

      await loadVerificationStatus();
      alert("Solicitud de verificación enviada correctamente");
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al solicitar verificación");
      }
    } finally {
      if (mountedRef.current) {
        setRequestLoading(false);
      }
    }
  };

  const nextActiveAppointment = useMemo(() => {
    return appointments.find(
      (item) => (item.estado || "").toLowerCase() !== "cancelada"
    );
  }, [appointments]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  const isApproved = verificationStatus === "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";
  const hasNoRequest =
    verificationStatus === "none" || verificationStatus === "expired";

  return (
    <main className="flex min-h-screen bg-slate-100">
      <section className="flex-1 px-6 py-8">
        <header className="border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <section className="flex items-center justify-between gap-4">
            <article>
              <h1 className="text-3xl font-bold text-slate-900">
                Panel del paciente
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Seguimiento de verificación y gestión de citas
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {user?.email || "Paciente"}
              </p>
            </article>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </section>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center gap-2">
              <ShieldCheck className="text-slate-700" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">
                Estado de verificación
              </h2>
            </header>

            {hasNoRequest && (
              <section className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Aún no has solicitado verificación
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Debes completar este proceso para poder agendar citas médicas.
                </p>
              </section>
            )}

            {isPending && (
              <section className="border border-amber-200 bg-amber-50 p-4">
                <section className="flex items-center gap-2">
                  <ShieldAlert className="text-amber-700" size={18} />
                  <p className="text-sm font-semibold text-amber-800">
                    Solicitud en revisión
                  </p>
                </section>
                <p className="mt-1 text-sm text-amber-700">
                  Tu solicitud fue enviada y está pendiente de validación.
                </p>
              </section>
            )}

            {isRejected && (
              <section className="border border-red-200 bg-red-50 p-4">
                <section className="flex items-center gap-2">
                  <ShieldAlert className="text-red-700" size={18} />
                  <p className="text-sm font-semibold text-red-800">
                    Solicitud rechazada
                  </p>
                </section>
                <p className="mt-1 text-sm text-red-700">
                  Debes corregir tus datos y volver a solicitar la verificación.
                </p>
              </section>
            )}

            {isApproved && (
              <section className="flex flex-col gap-4 border border-emerald-200 bg-emerald-50 p-4 md:flex-row md:items-center md:justify-between">
                <article>
                  <section className="flex items-center gap-2">
                    <BadgeCheck className="text-emerald-700" size={18} />
                    <p className="text-sm font-semibold text-emerald-800">
                      Verificación aprobada
                    </p>
                  </section>
                  <p className="mt-1 text-sm text-emerald-700">
                    Ya puedes gestionar tus citas médicas.
                  </p>
                </article>

                <button
                  onClick={() => router.push("/dashboard/patient/appointments")}
                  className="border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Ir a citas
                </button>
              </section>
            )}
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center gap-2">
              <CalendarDays className="text-slate-700" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">
                Próxima cita
              </h2>
            </header>

            {!nextActiveAppointment ? (
              <p className="text-sm text-slate-600">
                No tienes citas activas registradas.
              </p>
            ) : (
              <section className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha</p>
                <p className="font-semibold text-slate-900">
                  {nextActiveAppointment.fecha}
                </p>

                <p className="mt-3 text-sm text-slate-500">Hora</p>
                <p className="font-semibold text-slate-900">
                  {nextActiveAppointment.hora}
                </p>

                <p className="mt-3 text-sm text-slate-500">Estado</p>
                <p className="font-semibold text-slate-900">
                  {nextActiveAppointment.estado || "pendiente"}
                </p>

                <button
                  onClick={() => router.push("/dashboard/patient/appointments")}
                  className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Gestionar citas
                </button>
              </section>
            )}
          </section>
        </section>

        {!isApproved && (
          <section className="mt-6 border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Solicitar verificación
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Ingresa tu documento y tu EPS para enviar la solicitud.
              </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Documento
                </label>
                <input
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>

              <article>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  EPS
                </label>
                <input
                  name="eps"
                  value={form.eps}
                  onChange={handleChange}
                  placeholder="Nombre de la EPS"
                  className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </article>
            </section>

            <button
              onClick={handleRequestVerification}
              disabled={requestLoading || isPending}
              className="mt-4 border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {requestLoading
                ? "Enviando..."
                : isPending
                ? "Solicitud ya enviada"
                : "Solicitar verificación"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}