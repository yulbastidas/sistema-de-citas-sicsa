'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { getToken, getUser } from '@/service/session';

type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

type MedicalReportForm = {
  enfermedadActual: string;
  antecedentes: string;
  signosVitales: string;
  examenFisico: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
};

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === '1') return 'admin';
  if (role === 2 || role === '2') return 'patient';
  if (role === 3 || role === '3') return 'doctor';
  if (typeof role === 'string') return role;
  return undefined;
}

export default function DoctorMedicalReportPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = Number(params.id);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<MedicalReportForm>({
    enfermedadActual: '',
    antecedentes: '',
    signosVitales: '',
    examenFisico: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
  });

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser() as SessionUser | null;

    if (!token || !savedUser) {
      router.replace('/login?role=doctor');
      return;
    }

    const normalizedRole = normalizeRole(savedUser.role);

    if (normalizedRole !== 'doctor') {
      router.replace('/login?role=doctor');
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const fetchMedicalReport = async (): Promise<void> => {
      try {
        setMessage('');

        const token = getToken();

        if (!token) {
          setMessage('No se encontró el token de autenticación');
          setLoadingData(false);
          return;
        }

        const response = await fetch(
          `http://localhost:3000/medical-reports/${appointmentId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          setMessage('Sesión expirada. Inicia sesión nuevamente');
          router.replace('/login?role=doctor');
          return;
        }

        if (response.status === 404) {
          setLoadingData(false);
          return;
        }

        if (!response.ok) {
          setMessage('No se pudo cargar el reporte clínico');
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
          enfermedadActual: data.enfermedadActual ?? '',
          antecedentes: data.antecedentes ?? '',
          signosVitales: data.signosVitales ?? '',
          examenFisico: data.examenFisico ?? '',
          diagnostico: data.diagnostico ?? '',
          tratamiento: data.tratamiento ?? '',
          observaciones: data.observaciones ?? '',
        });
      } catch (error) {
        console.error('Error cargando reporte médico:', error);
        setMessage('Error al cargar el reporte clínico');
      } finally {
        setLoadingData(false);
      }
    };

    if (!checkingAuth && !Number.isNaN(appointmentId)) {
      void fetchMedicalReport();
    }
  }, [appointmentId, checkingAuth, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
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
      setMessage('');

      const token = getToken();

      if (!token) {
        setMessage('No se encontró el token de autenticación');
        return;
      }

      const response = await fetch('http://localhost:3000/medical-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId,
          ...form,
        }),
      });

      if (response.status === 401) {
        setMessage('Sesión expirada. Inicia sesión nuevamente');
        router.replace('/login?role=doctor');
        return;
      }

      if (!response.ok) {
        setMessage('No se pudo guardar el reporte clínico');
        return;
      }

      setMessage('Reporte clínico guardado correctamente');
    } catch (error) {
      console.error('Error guardando reporte médico:', error);
      setMessage('Error al guardar el reporte clínico');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    try {
      setDownloading(true);
      setMessage('');

      const token = getToken();

      if (!token) {
        setMessage('No se encontró el token de autenticación');
        return;
      }

      const response = await fetch(
        `http://localhost:3000/appointments/${appointmentId}/pdf`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        setMessage('Sesión expirada. Inicia sesión nuevamente');
        router.replace('/login?role=doctor');
        return;
      }

      if (!response.ok) {
        setMessage('No se pudo descargar el PDF');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `reporte-cita-${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      setMessage('Error al descargar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (checkingAuth || loadingData) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8">
        <p className="text-lg font-semibold text-slate-600">
          Cargando reporte clínico...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <header className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <h1 className="text-3xl font-bold text-slate-900">
              Reporte clínico
            </h1>
            <p className="mt-2 text-slate-600">
              Cita #{appointmentId}. Completa la información médica y luego
              guarda o descarga el PDF.
            </p>
          </section>

          <button
            type="button"
            onClick={() => router.push('/dashboard/doctor')}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </section>
      </header>

      <form
        onSubmit={handleSave}
        className="mx-auto mt-6 max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <fieldset className="rounded-2xl border border-slate-200 p-6">
          <legend className="px-2 text-lg font-semibold text-slate-900">
            Formato clínico de atención
          </legend>

          <Field
            label="Enfermedad actual"
            name="enfermedadActual"
            value={form.enfermedadActual}
            onChange={handleChange}
          />

          <Field
            label="Antecedentes"
            name="antecedentes"
            value={form.antecedentes}
            onChange={handleChange}
          />

          <Field
            label="Signos vitales"
            name="signosVitales"
            value={form.signosVitales}
            onChange={handleChange}
          />

          <Field
            label="Examen físico"
            name="examenFisico"
            value={form.examenFisico}
            onChange={handleChange}
          />

          <Field
            label="Diagnóstico"
            name="diagnostico"
            value={form.diagnostico}
            onChange={handleChange}
          />

          <Field
            label="Tratamiento"
            name="tratamiento"
            value={form.tratamiento}
            onChange={handleChange}
          />

          <Field
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
          />
        </fieldset>

        <footer className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar reporte'}
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={() => {
              void handleDownloadPdf();
            }}
            className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            <FileText size={16} />
            {downloading ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </footer>

        {message ? (
          <section className="mt-5" aria-live="polite">
            <p className="text-sm text-slate-700">{message}</p>
          </section>
        ) : null}
      </form>
    </main>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function Field({ label, name, value, onChange }: FieldProps) {
  return (
    <section className="mt-5">
      <label htmlFor={name} className="mb-2 block font-semibold text-slate-900">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-slate-500"
      />
    </section>
  );
}