"use client";

import { Accessibility, Activity, Droplets, Flame, HeartPulse, ShieldAlert } from "lucide-react";

export type PriorityFormValue = {
  edad: string;
  embarazada: boolean;
  discapacidad: boolean;
  dolorIntenso: boolean;
  sangrado: boolean;
  dificultadRespiratoria: boolean;
  fiebre: boolean;
};

const FACTORS = [
  { name: "embarazada", label: "Embarazo", icon: HeartPulse },
  { name: "discapacidad", label: "Discapacidad", icon: Accessibility },
  { name: "dolorIntenso", label: "Dolor intenso", icon: Activity },
  { name: "sangrado", label: "Sangrado", icon: Droplets },
  { name: "dificultadRespiratoria", label: "Dificultad respiratoria", icon: Activity },
  { name: "fiebre", label: "Fiebre", icon: Flame },
] as const;

export default function AppointmentPriorityFields({
  value,
  disabled = false,
  onChange,
}: {
  value: PriorityFormValue;
  disabled?: boolean;
  onChange: (name: keyof PriorityFormValue, value: boolean) => void;
}) {
  const age = value.edad === "" ? null : Number(value.edad);
  const isOlderAdult = age !== null && Number.isFinite(age) && age >= 65;

  return (
    <section className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <header className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 shrink-0 text-blue-700" size={20} />
        <div>
          <h4 className="font-bold text-blue-950">Factores para prioridad administrativa</h4>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Marca solo condiciones actuales. Esto organiza solicitudes; no realiza diagnósticos ni reemplaza la valoración médica.
          </p>
        </div>
      </header>

      <div>
        <p className="text-sm font-semibold text-slate-700">Edad registrada: {age ?? "No disponible"}</p>
        <label className={`mt-3 flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium ${isOlderAdult ? "border-blue-400 bg-white text-blue-900 ring-2 ring-blue-100" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          <input type="checkbox" checked={isOlderAdult} disabled className="h-4 w-4 rounded border-slate-300" />
          <Accessibility size={17} aria-hidden="true" />
          <span>Adulto mayor <span className="block text-xs font-normal">Se determina automáticamente desde los 65 años.</span></span>
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FACTORS.map(({ name, label, icon: Icon }) => {
          const checked = value[name];
          return (
            <label key={name} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${checked ? "border-blue-400 bg-white text-blue-900 ring-2 ring-blue-100" : "border-slate-200 bg-white/70 text-slate-700 hover:border-blue-200"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
              <input type="checkbox" name={name} checked={checked} onChange={(event) => onChange(name, event.target.checked)} disabled={disabled} className="h-4 w-4 rounded border-slate-300" />
              <Icon size={17} aria-hidden="true" />
              {label}
            </label>
          );
        })}
      </div>
    </section>
  );
}
