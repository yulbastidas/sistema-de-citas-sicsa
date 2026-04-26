'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  FileBadge2,
  FileText,
  Filter,
  FolderOpen,
  Search,
  Clock3,
  UserRound,
} from 'lucide-react';

import {
  downloadAppointmentPdf,
  getDoctorAppointments,
} from '@/service/appointment';
import { getToken, getUser, logout } from '@/service/session';

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type HistoryAppointmentItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  patient?: {
    nombre?: string;
    documento?: string;
    email?: string;
    eps?: string;
  } | null;
  medicalReport?: {
    exists?: boolean;
    id?: number | null;
  };
};

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === '1') return 'admin';
  if (role === 2 || role === '2') return 'patient';
  if (role === 3 || role === '3') return 'doctor';
  if (typeof role === 'string') return role;
  return undefined;
}

export default function DoctorHistoryPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [appointments, setAppointments] = useState<HistoryAppointmentItem[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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

    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      try {
        setErrorMessage('');

        const token = getToken();
        const savedUser = getUser() as SessionUser | null;

        if (!token || !savedUser?.sub) {
          logout();
          window.location.href = '/login?role=doctor';
          return;
        }

        const result = await getDoctorAppointments(token, savedUser.sub);
        const items = Array.isArray(result) ? result : result?.data || [];

        const historyItems = items.filter((item: HistoryAppointmentItem) => {
          const estado = String(item.estado || '').toLowerCase();
          return estado === 'atendida' || !!item.medicalReport?.exists;
        });

        setAppointments(historyItems);
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

          setErrorMessage(error.message);
        } else {
          setErrorMessage('No se pudo cargar el historial clínico');
        }
      } finally {
        setLoading(false);
      }
    };

    if (checkingAuth) return;

    void loadHistory();
  }, [checkingAuth]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const patientName = item.patient?.nombre?.toLowerCase() || '';
      const patientDocument = item.patient?.documento?.toLowerCase() || '';
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
        alert('Error al descargar el PDF');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const totalHistory = appointments.length;
  const totalWithReport = appointments.filter(
    (item) => item.medicalReport?.exists,
  ).length;

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
          <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                MÓDULO CLÍNICO
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Historial de atenciones
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Consulta atenciones registradas, filtra por paciente o fecha y
                accede a los reportes en PDF.
              </p>
            </section>

            <a
              href="/dashboard/doctor"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <ArrowLeft size={16} />
              Volver al panel
            </a>
          </section>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <nav className="flex flex-wrap gap-3">
            <a
              href="/dashboard/doctor"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <CalendarDays size={16} />
              Agenda del día
            </a>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              <FolderOpen size={16} />
              Historial de atenciones
            </button>
          </nav>
        </section>

        <section className="grid gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Atenciones registradas
              </p>
              <CalendarDays size={18} className="text-slate-500" />
            </header>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? '...' : totalHistory}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Reportes disponibles
              </p>
              <FileBadge2 size={18} className="text-slate-500" />
            </header>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? '...' : totalWithReport}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <header className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <p className="text-sm font-medium text-slate-500">Filtros</p>
            </header>

            <section className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o documento"
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
              </label>

              <label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
              </label>
            </section>
          </article>
        </section>
      </header>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Listado histórico
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Citas del doctor con atención registrada o con reporte clínico
            guardado.
          </p>
        </header>

        {loading ? (
          <p className="text-slate-600">Cargando historial...</p>
        ) : errorMessage ? (
          <article className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-700">
              No se pudo cargar el historial.
            </p>
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          </article>
        ) : filteredAppointments.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">
              No hay resultados para los filtros seleccionados.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ajusta el nombre del paciente o la fecha para ampliar la búsqueda.
            </p>
          </article>
        ) : (
          <section className="space-y-5">
            {filteredAppointments.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
              >
                <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <section className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {item.patient?.nombre || 'Paciente'}
                    </h3>

                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {item.medicalReport?.exists
                        ? 'Reporte guardado'
                        : 'Atención registrada'}
                    </span>
                  </section>

                  <p className="text-sm font-medium text-slate-500">
                    Cita #{item.id}
                  </p>
                </header>

                <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                  <section className="space-y-4">
                    <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <CalendarDays size={15} className="text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-900">
                            Fecha:
                          </span>{' '}
                          {item.fecha || '-'}
                        </span>
                      </p>

                      <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <Clock3 size={15} className="text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-900">
                            Hora:
                          </span>{' '}
                          {item.hora || '-'}
                        </span>
                      </p>

                      <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <UserRound size={15} className="text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-900">
                            Documento:
                          </span>{' '}
                          {item.patient?.documento || '-'}
                        </span>
                      </p>

                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">
                          Estado:
                        </span>{' '}
                        {item.estado || '-'}
                      </p>

                      <p className="text-sm text-slate-700 md:col-span-2">
                        <span className="font-semibold text-slate-900">
                          EPS:
                        </span>{' '}
                        {item.patient?.eps || '-'}
                      </p>

                      <p className="break-all text-sm text-slate-700 md:col-span-2">
                        <span className="font-semibold text-slate-900">
                          Correo:
                        </span>{' '}
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
                  </section>

                  <aside className="space-y-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">
                        Acciones rápidas
                      </p>

                      <section className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            void handleDownloadPdf(item.id);
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
                          type="button"
                          onClick={() => {
                            void handleDownloadPdf(item.id);
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
                      </section>
                    </article>
                  </aside>
                </section>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}