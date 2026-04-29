"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { WaitlistCard } from "./WaitlistCard";
import type { AppointmentItem } from "../types";

type WeeklyAvailabilityProps = {
  form: {
    fecha: string;
    hora: string;
    specialtyId: string;
    motivoConsulta: string;
    epsId: string;
    departamento: string;
    municipio: string;
    appointmentClassId: string;
  };
  availableHours: string[];
  loadingHours: boolean;
  canCreateAppointment: boolean;
  showWaitlistButton: boolean;
  savingWaitlist: boolean;
  activeAppointments: AppointmentItem[];
  appointments: AppointmentItem[];
  today: string;
  onSelectDay: (date: string) => void;
  onSelectHour: (hour: string) => void;
  onJoinWaitlist: () => void;
};

export function WeeklyAvailability({
  form,
  availableHours,
  loadingHours,
  canCreateAppointment,
  showWaitlistButton,
  savingWaitlist,
  activeAppointments,
  appointments,
  today,
  onSelectDay,
  onSelectHour,
  onJoinWaitlist,
}: WeeklyAvailabilityProps) {
  const formatDateToYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const weekDays = useMemo(() => {
    const base = new Date();
    const days: {
      label: string;
      shortLabel: string;
      date: string;
      dayNumber: string;
      isToday: boolean;
      disabled: boolean;
    }[] = [];

    for (let i = 0; i < 7; i += 1) {
      const current = new Date(base);
      current.setDate(base.getDate() + i);

      const weekday = current.toLocaleDateString("es-CO", {
        weekday: "short",
      });

      const shortWeekday = current.toLocaleDateString("es-CO", {
        weekday: "long",
      });

      const dayNumber = current.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
      });

      const ymd = formatDateToYMD(current);

      days.push({
        label: weekday.replace(".", "").toUpperCase(),
        shortLabel:
          shortWeekday.charAt(0).toUpperCase() + shortWeekday.slice(1),
        date: ymd,
        dayNumber,
        isToday: ymd === today,
        disabled: !canCreateAppointment,
      });
    }

    return days;
  }, [today, canCreateAppointment]);

  const selectedDayMeta = useMemo(
    () => weekDays.find((day) => day.date === form.fecha) || null,
    [weekDays, form.fecha],
  );

  const waitlistDisabled =
    !form.specialtyId ||
    !form.fecha ||
    !form.motivoConsulta ||
    !form.epsId ||
    !form.departamento ||
    !form.municipio ||
    !form.appointmentClassId;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-8 shadow-lg backdrop-blur">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
          <Sparkles className="text-emerald-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Disponibilidad semanal
          </h2>
          <p className="mt-1 text-slate-600">
            Vista rápida de los próximos días y horarios disponibles.
          </p>
        </section>
      </header>

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {weekDays.map((day) => {
          const isSelected = form.fecha === day.date;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day.date)}
              disabled={day.disabled}
              className={`rounded-3xl border px-3 py-4 text-left transition ${
                isSelected
                  ? "border-cyan-600 bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-white"
              } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <p className="text-xs font-semibold tracking-wide">{day.label}</p>
              <p className="mt-1 text-sm">{day.dayNumber}</p>

              {day.isToday && (
                <p
                  className={`mt-2 text-[11px] ${
                    isSelected ? "text-cyan-50" : "text-slate-500"
                  }`}
                >
                  Hoy
                </p>
              )}
            </button>
          );
        })}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        {!canCreateAppointment ? (
          <p className="text-sm text-slate-600">
            La vista semanal estará disponible cuando tu verificación haya sido
            aprobada.
          </p>
        ) : !form.fecha ? (
          <p className="text-sm text-slate-600">
            Selecciona un día de la semana para ver sus horarios disponibles.
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">
              {selectedDayMeta?.shortLabel || "Día seleccionado"}{" "}
              {selectedDayMeta ? `(${selectedDayMeta.dayNumber})` : ""}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Horarios disponibles para la fecha seleccionada.
            </p>

            {loadingHours ? (
              <p className="mt-4 text-sm text-slate-600">
                Cargando horarios...
              </p>
            ) : availableHours.length === 0 ? (
              <>
                <p className="mt-4 text-sm text-slate-600">
                  No hay horarios disponibles para este día.
                </p>

                {showWaitlistButton && (
                  <WaitlistCard
                    savingWaitlist={savingWaitlist}
                    disabled={waitlistDisabled}
                    onJoin={onJoinWaitlist}
                  />
                )}
              </>
            ) : (
              <section className="mt-4 flex flex-wrap gap-2">
                {availableHours.map((hour) => {
                  const isSelectedHour = form.hora === hour;

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onSelectHour(hour)}
                      className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                        isSelectedHour
                          ? "border-cyan-600 bg-cyan-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {hour}
                    </button>
                  );
                })}
              </section>
            )}
          </>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Total de citas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {appointments.length}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Citas activas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {activeAppointments.length}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Horarios visibles</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {canCreateAppointment ? availableHours.length : 0}
          </p>
        </article>
      </section>
    </section>
  );
}
