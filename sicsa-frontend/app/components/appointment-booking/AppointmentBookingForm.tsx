"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";
import AppointmentPriorityFields from "@/app/components/AppointmentPriorityFields";
import { getAppointmentDateRestriction } from "@/utils/colombian-holidays";
import { getClinicalOptions } from "./clinical-options";
import type { AppointmentBookingFormValue, BookingCatalogItem, BookingDoctor, BookingPatientSummary, BookingPriorityResult } from "./types";

type Props = {
  mode: "patient" | "admin";
  patient: BookingPatientSummary | null;
  patientSelector?: ReactNode;
  form: AppointmentBookingFormValue;
  specialties: BookingCatalogItem[];
  doctors: BookingDoctor[];
  appointmentClasses: BookingCatalogItem[];
  availableHours: string[];
  today: string;
  disabled?: boolean;
  loadingCatalogs?: boolean;
  loadingDoctors?: boolean;
  loadingHours?: boolean;
  saving?: boolean;
  savingWaitlist?: boolean;
  showWaitlist?: boolean;
  result?: BookingPriorityResult | null;
  onChange: <K extends keyof AppointmentBookingFormValue>(name: K, value: AppointmentBookingFormValue[K]) => void;
  onSubmit: () => void;
  onJoinWaitlist?: () => void;
};

const STEPS = ["Paciente", "Atención", "Disponibilidad", "Prioridad", "Confirmación"];
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

export function AppointmentBookingForm(props: Props) {
  const [step, setStep] = useState(1);
  const [dateError, setDateError] = useState("");
  const specialty = props.specialties.find((item) => String(item.id) === props.form.specialtyId);
  const doctor = props.doctors.find((item) => String(item.id) === props.form.doctorId);
  const appointmentClass = props.appointmentClasses.find((item) => String(item.id) === props.form.appointmentClassId);
  const clinicalOptions = useMemo(() => getClinicalOptions(props.form.specialtyId, props.specialties), [props.form.specialtyId, props.specialties]);
  const urgent = props.form.dificultadRespiratoria || props.form.sangrado || props.form.selectedSymptoms.some((item) => /pecho|desmayo|convul/i.test(item));

  const toggleSymptom = (symptom: string) => {
    const selected = props.form.selectedSymptoms.includes(symptom);
    props.onChange("selectedSymptoms", selected ? props.form.selectedSymptoms.filter((item) => item !== symptom) : [...props.form.selectedSymptoms, symptom]);
  };

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 sm:p-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Agendamiento SICSA</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">{props.mode === "admin" ? "Registrar cita presencial" : "Solicitar una nueva cita"}</h2>
        <p className="mt-1 text-sm text-slate-600">El mismo flujo, disponibilidad y priorización se aplican en ambos canales.</p>
      </header>

      <nav aria-label="Progreso del agendamiento" className="mb-7 grid grid-cols-5 gap-1">
        {STEPS.map((label, index) => {
          const number = index + 1;
          return <button key={label} type="button" onClick={() => setStep(number)} className={`min-w-0 rounded-xl px-1 py-2 text-center text-[10px] font-bold sm:text-xs ${step === number ? "bg-blue-700 text-white" : step > number ? "bg-cyan-50 text-cyan-800" : "bg-slate-100 text-slate-500"}`}><span className="block text-sm">{step > number ? "✓" : number}</span><span className="hidden sm:block">{label}</span></button>;
        })}
      </nav>

      {step === 1 && <div className="space-y-4">
        {props.patientSelector}
        {props.patient ? <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-700 p-2 text-white"><UserRound size={20} /></span><div><h3 className="font-bold text-blue-950">{props.patient.nombre || "Paciente registrado"}</h3><p className="text-sm text-blue-800">Documento {props.patient.documento}</p></div></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">EPS</dt><dd className="font-semibold">{props.patient.eps || "Sin registrar"}</dd></div><div><dt className="text-slate-500">Edad</dt><dd className="font-semibold">{props.patient.edad ?? "No disponible"}</dd></div><div><dt className="text-slate-500">Ubicación</dt><dd className="font-semibold">{[props.patient.municipio, props.patient.departamento].filter(Boolean).join(", ") || "Sin registrar"}</dd></div></dl>
        </article> : <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{props.mode === "admin" ? "Busca y selecciona un paciente registrado para continuar." : "No fue posible cargar el perfil del paciente."}</p>}
      </div>}

      {step === 2 && <div className="grid gap-4 md:grid-cols-3">
        <label><span className={labelClass}>Especialidad *</span><select className={inputClass} value={props.form.specialtyId} disabled={props.disabled || props.loadingCatalogs} onChange={(e) => props.onChange("specialtyId", e.target.value)}><option value="">Selecciona</option>{props.specialties.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label><span className={labelClass}>Médico *</span><select className={inputClass} value={props.form.doctorId} disabled={props.disabled || !props.form.specialtyId || props.loadingDoctors} onChange={(e) => props.onChange("doctorId", e.target.value)}><option value="">{props.loadingDoctors ? "Cargando..." : "Selecciona"}</option>{props.doctors.map((item) => <option key={item.id} value={item.id}>{item.nombre || `Médico ${item.id}`}</option>)}</select></label>
        <label><span className={labelClass}>Clase de cita *</span><select className={inputClass} value={props.form.appointmentClassId} disabled={props.disabled || !props.form.specialtyId || props.loadingCatalogs} onChange={(e) => props.onChange("appointmentClassId", e.target.value)}><option value="">Selecciona</option>{props.appointmentClasses.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
      </div>}

      {step === 3 && <div className="space-y-5">
        <label className="block"><span className={labelClass}>Fecha *</span><input type="date" min={props.today} className={inputClass} value={props.form.fecha} disabled={props.disabled || !props.form.doctorId} onChange={(e) => { const restriction = getAppointmentDateRestriction(e.target.value); setDateError(restriction || ""); props.onChange("fecha", restriction ? "" : e.target.value); }} />{dateError && <span className="mt-2 block text-sm font-semibold text-amber-800">{dateError}</span>}</label>
        <div><p className={labelClass}>Horarios realmente disponibles *</p>{props.loadingHours ? <p className="text-sm text-slate-500">Consultando agenda...</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{props.availableHours.map((hour) => <button key={hour} type="button" onClick={() => props.onChange("hora", hour)} className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${props.form.hora === hour ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}><Clock3 size={14} className="mr-1 inline" />{hour}</button>)}</div>}{props.form.fecha && !props.loadingHours && props.availableHours.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No hay horarios disponibles para la selección actual.</p>}</div>
      </div>}

      {step === 4 && <div className="space-y-5">
        <label className="block"><span className={labelClass}>Motivo de consulta *</span><textarea rows={3} className={inputClass} value={props.form.motivoConsulta} onChange={(e) => props.onChange("motivoConsulta", e.target.value)} placeholder="Describe brevemente qué necesitas, sin intentar establecer un diagnóstico." /></label>
        <div><p className={labelClass}>Síntomas o condiciones actuales</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{clinicalOptions.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${props.form.selectedSymptoms.includes(option) ? "border-blue-500 bg-blue-50 text-blue-950" : "border-slate-200"}`}><input type="checkbox" checked={props.form.selectedSymptoms.includes(option)} onChange={() => toggleSymptom(option)} />{option}</label>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>Intensidad del dolor</span><select className={inputClass} value={props.form.painLevel} onChange={(e) => props.onChange("painLevel", e.target.value as AppointmentBookingFormValue["painLevel"])}><option value="">Selecciona</option><option value="none">Sin dolor</option><option value="mild">Leve</option><option value="moderate">Moderado</option><option value="severe">Intenso</option></select></label><label><span className={labelClass}>Inicio de los síntomas</span><select className={inputClass} value={props.form.symptomOnset} onChange={(e) => props.onChange("symptomOnset", e.target.value as AppointmentBookingFormValue["symptomOnset"])}><option value="">Selecciona</option><option value="today">Hoy</option><option value="2-3-days">Hace 2 a 3 días</option><option value="less-than-week">Hace menos de una semana</option><option value="week-or-more">Hace una semana o más</option></select></label></div>
        <AppointmentPriorityFields value={props.form} disabled={props.disabled} onChange={(name, value) => props.onChange(name, value as never)} />
        <label className="block"><span className={labelClass}>Observaciones adicionales</span><textarea rows={2} className={inputClass} value={props.form.observaciones} onChange={(e) => props.onChange("observaciones", e.target.value)} /></label>
        {urgent && <div role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-900">Algunos datos pueden corresponder a una urgencia. Si hay peligro inmediato, dificultad respiratoria marcada, dolor fuerte en el pecho o sangrado abundante, busca atención de urgencias; no esperes esta cita.</div>}
      </div>}

      {step === 5 && <div className="space-y-4"><h3 className="text-lg font-bold text-slate-950">Revisa antes de confirmar</h3><div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><b>Paciente:</b> {props.patient?.nombre}</p><p><b>EPS:</b> {props.patient?.eps}</p><p><b>Especialidad:</b> {specialty?.nombre}</p><p><b>Médico:</b> {doctor?.nombre}</p><p><b>Clase:</b> {appointmentClass?.nombre}</p><p><b>Fecha y hora:</b> {props.form.fecha} {props.form.hora}</p><p className="sm:col-span-2"><b>Motivo:</b> {props.form.motivoConsulta}</p></div>{props.result && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4"><p className="font-bold text-cyan-950">Cita registrada · prioridad administrativa: {props.result.prioridad || "registrada"}</p><p className="mt-1 text-sm text-cyan-900">{props.result.explicacionPrioridad}</p></div>}<button type="button" disabled={props.disabled || props.saving || !!props.result} onClick={props.onSubmit} className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 font-bold text-white disabled:opacity-50">{props.saving ? "Registrando..." : props.result ? "Cita registrada" : "Confirmar cita"}</button>{props.showWaitlist && props.onJoinWaitlist && !props.result && <button type="button" disabled={props.savingWaitlist} onClick={props.onJoinWaitlist} className="w-full rounded-xl border border-blue-700 px-5 py-3 font-bold text-blue-800">{props.savingWaitlist ? "Registrando..." : "Unirme a la lista de espera"}</button>}</div>}

      <footer className="mt-7 flex justify-between border-t border-slate-100 pt-4"><button type="button" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-40"><ChevronLeft size={16} />Atrás</button>{step < STEPS.length && <button type="button" onClick={() => setStep((value) => Math.min(STEPS.length, value + 1))} className="flex items-center gap-1 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Siguiente<ChevronRight size={16} /></button>}</footer>
    </section>
  );
}
