"use client";

import { LogOut, Sparkles } from "lucide-react";
import type { VerificationForm } from "../types";

type Props = {
  form: VerificationForm;
  requestLoading: boolean;
  isPending: boolean;
  onSubmit: () => void;
  onLogout: () => void;
};

export function VerificationRequestForm({
  form,
  requestLoading,
  isPending,
  onSubmit,
  onLogout,
}: Props) {
  return (
    <section className="mt-6 rounded-[2rem] border border-cyan-100 bg-white/90 p-6 shadow-lg backdrop-blur">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
          <Sparkles className="text-cyan-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Solicitar verificación
          </h2>
          <p className="text-sm text-slate-600">
            Tu documento y EPS se cargan automáticamente desde tus datos
            registrados.
          </p>
        </section>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Documento
          </label>
          <input
            value={form.documento}
            readOnly
            placeholder="Documento cargado automáticamente"
            className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
          />
        </article>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            EPS
          </label>
          <input
            value={form.eps}
            readOnly
            placeholder="EPS cargada automáticamente"
            className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
          />
        </article>
      </section>

      <section className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onSubmit}
          disabled={requestLoading || isPending || !form.documento || !form.eps}
          className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
        >
          {requestLoading
            ? "Enviando..."
            : isPending
              ? "Solicitud ya enviada"
              : "Solicitar verificación"}
        </button>

        <button
          onClick={onLogout}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <span className="inline-flex items-center gap-2">
            <LogOut size={16} />
            Cerrar sesión
          </span>
        </button>
      </section>
    </section>
  );
}