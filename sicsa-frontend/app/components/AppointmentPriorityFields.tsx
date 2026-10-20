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
  showAge = true,
  onTextChange,
  onCheckboxChange,
}: {
  value: PriorityFormValue;
  disabled?: boolean;
  showAge?: boolean;
  onTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

      {showAge && <div>
        <label htmlFor="appointment-priority-age" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Edad del paciente
        </label>
        <input
          id="appointment-priority-age"
          type="number"
          name="edad"
          min={0}
          max={120}
          value={value.edad}
          onChange={onTextChange}
          disabled={disabled}
          placeholder="Edad"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 sm:max-w-48"
        />
        {isOlderAdult && (
          <p className="mt-2 text-xs font-semibold text-blue-800" aria-live="polite">
            Adulto mayor: el sistema lo considera automáticamente como factor prioritario.
          </p>
        )}
      </div>}

      {!showAge && isOlderAdult && (
        <p className="text-xs font-semibold text-blue-800">
          Adulto mayor: la edad registrada se aplicará automáticamente como factor prioritario.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FACTORS.map(({ name, label, icon: Icon }) => {
          const checked = value[name];
          return (
            <label key={name} className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${checked ? "border-blue-400 bg-white text-blue-900 ring-2 ring-blue-100" : "border-slate-200 bg-white/70 text-slate-700 hover:border-blue-200"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
              <input type="checkbox" name={name} checked={checked} onChange={onCheckboxChange} disabled={disabled} className="h-4 w-4 rounded border-slate-300" />
              <Icon size={17} aria-hidden="true" />
              {label}
            </label>
          );
        })}
      </div>
    </section>
  );
}
