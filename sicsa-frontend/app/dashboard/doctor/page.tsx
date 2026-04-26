'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileBadge2,
  FileText,
  FolderOpen,
  LogOut,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Phone,
  Mail,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

import {
  downloadAppointmentPdf,
  getDoctorAppointments,
  getQueueAppointments,
} from '@/service/appointment';
import { getToken, getUser, logout } from '@/service/session';

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type PatientInfo = {
  documento?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  eps?: string;
} | null;

type AppointmentItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  prioridad?: string | number;
  scorePrioridad?: number;
  patient?: PatientInfo;
  medicalReport?: {
    exists?: boolean;
    id?: number | null;
  };
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === '1') return 'admin';
  if (role === 2 || role === '2') return 'patient';
  if (role === 3 || role === '3') return 'doctor';
  if (typeof role === 'string') return role;
  return undefined;
}

export default function DoctorDashboardPage() {
  const socketRef = useRef<Socket | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueItems, setQueueItems] = useState<AppointmentItem[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const loadAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingAppointments(true);

      const savedUser = getUser() as SessionUser | null;

      if (!savedUser?.sub) {
        throw new Error('No se encontró el identificador del doctor');
      }

      const result = await getDoctorAppointments(token, savedUser.sub);
      const items = Array.isArray(result) ? result : result?.data || [];

      const confirmedAppointments = items.filter(
        (item: AppointmentItem) =>
          String(item.estado || '').toLowerCase() === 'confirmada',
      );

      setAppointments(confirmedAppointments);
    } catch (error: unknown) {
      setAppointments([]);

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (
          message.includes('unauthorized') ||
          message.includes('no autorizado') ||
          message.includes('jwt') ||
          message.includes('token')
        ) {
          logout();
          window.location.href = '/login?role=doctor';
          return;
        }

        alert(error.message);
      } else {
        alert('Error al cargar citas del doctor');
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
        throw new Error('No se encontró el identificador del doctor');
      }

      const result = await getQueueAppointments(token, today, savedUser.sub);
      const items = Array.isArray(result) ? result : result?.data || [];
      setQueueItems(items);
    } catch (error: unknown) {
      setQueueItems([]);

      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (
          message.includes('unauthorized') ||
          message.includes('no autorizado') ||
          message.includes('jwt') ||
          message.includes('token')
        ) {
          logout();
          window.location.href = '/login?role=doctor';
          return;
        }

        alert(error.message);
      } else {
        alert('Error al cargar cola priorizada');
      }
    } finally {
      setLoadingQueue(false);
    }
  }, [today]);

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token || !savedUser) {
      window.location.href = '/login?role=doctor';
      return;
    }

    const normalizedRole = normalizeRole(savedUser.role);

    if (normalizedRole !== 'doctor') {
      window.location.href = '/login?role=doctor';
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
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket doctor conectado:', socket.id);
    });

    socket.on('appointmentCreated', () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on('appointmentUpdated', () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on('appointmentCancelled', () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on('queueUpdated', () => {
      void loadAppointments();
      void loadQueue();
    });

    socket.on('disconnect', () => {
      console.log('Socket doctor desconectado');
    });

    return () => {
      socket.off('connect');
      socket.off('appointmentCreated');
      socket.off('appointmentUpdated');
      socket.off('appointmentCancelled');
      socket.off('queueUpdated');
      socket.off('disconnect');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [checkingAuth, loadAppointments, loadQueue]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login?role=doctor';
  };

  const openMedicalReportPdf = async (
    appointmentId: number,
  ): Promise<void> => {
    try {
      setDownloadingId(appointmentId);

      const token = getToken();

      if (!token) {
        logout();
        window.location.href = '/login?role=doctor';
        return;
      }

      const blob = await downloadAppointmentPdf(token, appointmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

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
          message.includes('unauthorized') ||
          message.includes('no autorizado') ||
          message.includes('jwt') ||
          message.includes('token')
        ) {
          logout();
          window.location.href = '/login?role=doctor';
          return;
        }

        alert(error.message);
      } else {
        alert('Error al abrir el reporte');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const totalConfirmed = appointments.length;
  const totalQueue = queueItems.length;

  const highPriorityCount = useMemo(() => {
    return queueItems.filter((item) => {
      const value = String(item.prioridad || '').toLowerCase();
      return value.includes('alta') || value === '3';
    }).length;
  }, [queueItems]);

  const savedReportsCount = useMemo(() => {
    return appointments.filter((item) => item.medicalReport?.exists).length;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    return appointments[0] || null;
  }, [appointments]);

  const getPriorityBadgeClass = (priority: string | number | undefined) => {
    const value = String(priority || '').toLowerCase();

    if (value.includes('alta') || value === '3') {
      return 'border border-red-200 bg-red-50 text-red-700';
    }

    if (value.includes('media') || value === '2') {
      return 'border border-amber-200 bg-amber-50 text-amber-700';
    }

    if (value.includes('baja') || value === '1') {
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    return 'border border-slate-200 bg-slate-50 text-slate-700';
  };

  const getReportBadgeClass = (exists: boolean | undefined) => {
    if (exists) {
      return 'border border-cyan-200 bg-cyan-50 text-cyan-700';
    }

    return 'border border-amber-200 bg-amber-50 text-amber-700';
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 lg:px-8">
      <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-8 py-8 text-white">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <article className="flex items-start gap-4">
              <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur">
                <Stethoscope size={30} className="text-white" />
              </figure>

              <section>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                  <Sparkles size={14} />
                  Jornada médica activa
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
                  Panel del doctor
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-200 lg:text-base">
                  Agenda del día, priorización clínica, citas activas y acceso
                  a reportes en PDF.
                </p>

                <section className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <UserRound size={15} />
                    <span>{user?.email || 'Doctor'}</span>
                  </p>

                  <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <ShieldCheck size={15} />
                    <span>Rol médico activo</span>
                  </p>

                  <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                    <CalendarDays size={15} />
                    <span>{today}</span>
                  </p>
                </section>
              </section>
            </article>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </section>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <nav className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <CalendarDays size={16} />
              Agenda del día
            </button>

            <a
              href="/dashboard/doctor/history"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FolderOpen size={16} />
              Historial de atenciones
            </a>
          </nav>
        </section>

        <section className="grid gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Citas confirmadas
              </p>
              <span className="rounded-2xl bg-cyan-50 p-2 text-cyan-700">
                <CalendarDays size={18} />
              </span>
            </header>

            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {loadingAppointments ? '...' : totalConfirmed}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Pacientes listos para atención médica.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Pacientes en cola
              </p>
              <span className="rounded-2xl bg-violet-50 p-2 text-violet-700">
                <ClipboardList size={18} />
              </span>
            </header>

            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {loadingQueue ? '...' : totalQueue}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Cola clínica priorizada del día.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Prioridad alta
              </p>
              <span className="rounded-2xl bg-red-50 p-2 text-red-700">
                <Activity size={18} />
              </span>
            </header>

            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {loadingQueue ? '...' : highPriorityCount}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Casos que requieren atención preferente.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Reportes guardados
              </p>
              <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <FileBadge2 size={18} />
              </span>
            </header>

            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {loadingAppointments ? '...' : savedReportsCount}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Reportes clínicos ya diligenciados.
            </p>
          </article>
        </section>
      </header>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-start justify-between gap-4">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Resumen del turno
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Próxima atención
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vista rápida del siguiente paciente confirmado.
              </p>
            </section>

            <figure className="rounded-3xl bg-slate-100 p-3 text-slate-700">
              <Clock3 size={22} />
            </figure>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Hora</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loadingAppointments ? '...' : nextAppointment?.hora || 'Sin horario'}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Paciente</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {loadingAppointments
                  ? 'Cargando...'
                  : nextAppointment?.patient?.nombre || 'Sin próxima cita'}
              </p>
            </article>
          </section>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-start justify-between gap-4">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                Estado general
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Actividad del día
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Control visual del flujo clínico actual.
              </p>
            </section>

            <figure className="rounded-3xl bg-slate-100 p-3 text-slate-700">
              <Sparkles size={22} />
            </figure>
          </header>

          <section className="mt-6 space-y-4">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Pendientes de reporte
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loadingAppointments ? '...' : totalConfirmed - savedReportsCount}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Correo de sesión
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {user?.email || 'No disponible'}
              </p>
            </article>
          </section>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <header className="mb-6 flex items-start gap-3">
            <figure className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <ClipboardList size={22} />
            </figure>

            <section>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Cola priorizada del día
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Orden clínico de atención según prioridad y horario.
              </p>
            </section>
          </header>

          {loadingQueue ? (
            <p className="text-slate-600">Cargando cola...</p>
          ) : queueItems.length === 0 ? (
            <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-700">
                No hay pacientes en la cola de hoy.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Cuando existan citas confirmadas del día aparecerán aquí.
              </p>
            </article>
          ) : (
            <section className="space-y-5">
              {queueItems.map((item, index) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
                >
                  <header className="border-b border-slate-200 bg-white px-5 py-4">
                    <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <section className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          #{index + 1} {item.patient?.nombre || 'Paciente'}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                            item.prioridad,
                          )}`}
                        >
                          Prioridad: {item.prioridad || '-'}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getReportBadgeClass(
                            item.medicalReport?.exists,
                          )}`}
                        >
                          {item.medicalReport?.exists
                            ? 'Reporte guardado'
                            : 'Sin reporte'}
                        </span>
                      </section>

                      <aside className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Score
                        </p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">
                          {item.scorePrioridad ?? '-'}
                        </p>
                      </aside>
                    </section>
                  </header>

                  <section className="grid gap-5 p-5 xl:grid-cols-[1fr_0.9fr]">
                    <section className="space-y-4">
                      <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Hora:</span>{' '}
                          {item.hora || '-'}
                        </p>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Documento:</span>{' '}
                          {item.patient?.documento || '-'}
                        </p>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">EPS:</span>{' '}
                          {item.patient?.eps || '-'}
                        </p>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Teléfono:</span>{' '}
                          {item.patient?.telefono || '-'}
                        </p>
                      </article>

                      <article className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-500">
                          Motivo de consulta
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {item.motivoConsulta || 'Sin detalle'}
                        </p>
                      </article>
                    </section>

                    <section className="space-y-4">
                      <article className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-500">
                          Contacto rápido
                        </p>

                        <section className="mt-3 space-y-3">
                          <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <Phone size={15} className="text-slate-400" />
                            {item.patient?.telefono || 'Sin teléfono'}
                          </p>

                          <p className="inline-flex items-center gap-2 break-all text-sm text-slate-700">
                            <Mail size={15} className="text-slate-400" />
                            {item.patient?.email || 'Sin correo'}
                          </p>
                        </section>
                      </article>

                      <footer className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            void openMedicalReportPdf(item.id);
                          }}
                          disabled={
                            downloadingId === item.id ||
                            !item.medicalReport?.exists
                          }
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          <FileText size={16} />
                          {downloadingId === item.id
                            ? 'Abriendo reporte...'
                            : 'Ver reporte'}
                        </button>

                        <button
                          onClick={() => {
                            void openMedicalReportPdf(item.id);
                          }}
                          disabled={
                            downloadingId === item.id ||
                            !item.medicalReport?.exists
                          }
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                        >
                          <FileBadge2 size={16} />
                          {downloadingId === item.id
                            ? 'Descargando PDF...'
                            : 'Descargar PDF'}
                        </button>
                      </footer>
                    </section>
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <header className="mb-6 flex items-start gap-3">
            <figure className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
              <CalendarDays size={22} />
            </figure>

            <section>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Citas confirmadas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pacientes listos para atención médica.
              </p>
            </section>
          </header>

          {loadingAppointments ? (
            <p className="text-slate-600">Cargando citas...</p>
          ) : appointments.length === 0 ? (
            <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-700">
                No hay citas confirmadas disponibles.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Las citas aprobadas aparecerán automáticamente aquí.
              </p>
            </article>
          ) : (
            <section className="space-y-5">
              {appointments.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <section className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {item.patient?.nombre || 'Paciente'}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getReportBadgeClass(
                          item.medicalReport?.exists,
                        )}`}
                      >
                        {item.medicalReport?.exists
                          ? 'Reporte guardado'
                          : 'Sin reporte'}
                      </span>
                    </section>

                    <p className="text-sm font-medium text-slate-500">
                      Cita #{item.id}
                    </p>
                  </header>

                  <section className="mt-4 grid gap-4">
                    <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Fecha:</span>{' '}
                        {item.fecha || '-'}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Hora:</span>{' '}
                        {item.hora || '-'}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Documento:</span>{' '}
                        {item.patient?.documento || '-'}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">EPS:</span>{' '}
                        {item.patient?.eps || '-'}
                      </p>
                      <p className="text-sm text-slate-700 md:col-span-2">
                        <span className="font-semibold text-slate-900">Correo:</span>{' '}
                        {item.patient?.email || '-'}
                      </p>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">
                        Motivo de consulta
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.motivoConsulta || 'Sin detalle'}
                      </p>
                    </article>

                    <footer className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          void openMedicalReportPdf(item.id);
                        }}
                        disabled={
                          downloadingId === item.id || !item.medicalReport?.exists
                        }
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        <FileText size={16} />
                        {downloadingId === item.id
                          ? 'Abriendo reporte...'
                          : 'Ver reporte'}
                      </button>

                      <button
                        onClick={() => {
                          void openMedicalReportPdf(item.id);
                        }}
                        disabled={
                          downloadingId === item.id || !item.medicalReport?.exists
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        <FileBadge2 size={16} />
                        {downloadingId === item.id
                          ? 'Descargando PDF...'
                          : 'Descargar PDF'}
                      </button>
                    </footer>
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}