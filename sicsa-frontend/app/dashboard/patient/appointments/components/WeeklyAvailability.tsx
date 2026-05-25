"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

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

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

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
  const currentDate = new Date();

  const [visibleMonth, setVisibleMonth] = useState(currentDate.getMonth());
  const [visibleYear, setVisibleYear] = useState(currentDate.getFullYear());

  const formatDateToYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return [currentYear, currentYear + 1];
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleYear, visibleMonth, 1);

    const lastDay = new Date(visibleYear, visibleMonth + 1, 0);

    const daysInMonth = lastDay.getDate();

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: {
      date: string;
      dayNumber: number | null;
      disabled: boolean;
      isToday: boolean;
      isClosedDay: boolean;
      isPast: boolean;
    }[] = [];

    for (let i = 0; i < startDay; i += 1) {
      days.push({
        date: "",
        dayNumber: null,
        disabled: true,
        isToday: false,
        isClosedDay: false,
        isPast: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(visibleYear, visibleMonth, day);

      const ymd = formatDateToYMD(date);

      const weekDay = date.getDay();

      const isSunday = weekDay === 0;
      const isMonday = weekDay === 1;

      const isClosedDay = isSunday || isMonday;

      const isPast = ymd < today;

      days.push({
        date: ymd,
        dayNumber: day,
        disabled: !canCreateAppointment || isClosedDay || isPast,
        isToday: ymd === today,
        isClosedDay,
        isPast,
      });
    }

    return days;
  }, [visibleMonth, visibleYear, today, canCreateAppointment]);

  const waitlistDisabled =
    !form.specialtyId ||
    !form.fecha ||
    !form.motivoConsulta ||
    !form.epsId ||
    !form.departamento ||
    !form.municipio ||
    !form.appointmentClassId;

  const selectedDateText = useMemo(() => {
    if (!form.fecha) return null;

    const date = new Date(`${form.fecha}T00:00:00`);

    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [form.fecha]);

  const previousMonth = () => {
    if (visibleMonth === 0) {
      setVisibleMonth(11);
      setVisibleYear((prev) => prev - 1);
    } else {
      setVisibleMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (visibleMonth === 11) {
      setVisibleMonth(0);
      setVisibleYear((prev) => prev + 1);
    } else {
      setVisibleMonth((prev) => prev + 1);
    }
  };

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-8 shadow-lg backdrop-blur">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
          <Sparkles className="text-emerald-700" size={22} />
        </span>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Calendario de citas
          </h2>

          <p className="mt-1 text-slate-600">
            Los lunes y domingos no tienen atención disponible.
          </p>
        </section>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <section className="flex items-center gap-2">
            <CalendarDays className="text-cyan-700" size={20} />

            <p className="font-semibold text-slate-900">
              Selecciona una fecha
            </p>
          </section>

          <section className="flex items-center gap-2">
            <button
              type="button"
              onClick={previousMonth}
              className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-100"
            >
              <ChevronLeft size={18} />
            </button>

            <select
              value={visibleMonth}
              onChange={(event) =>
                setVisibleMonth(Number(event.target.value))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={visibleYear}
              onChange={(event) =>
                setVisibleYear(Number(event.target.value))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-100"
            >
              <ChevronRight size={18} />
            </button>
          </section>
        </section>

        <section className="grid grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => (
            <p
              key={day}
              className="rounded-xl bg-slate-200 py-2 text-center text-xs font-bold text-slate-700"
            >
              {day}
            </p>
          ))}

          {calendarDays.map((day, index) => {
            if (!day.dayNumber) {
              return <div key={index} className="h-12" />;
            }

            const isSelected = form.fecha === day.date;

            return (
              <button
                key={day.date}
                type="button"
                disabled={day.disabled}
                onClick={() => onSelectDay(day.date)}
                className={`h-12 rounded-2xl border text-sm font-semibold transition ${isSelected
                    ? "border-cyan-600 bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-md"
                    : day.disabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50"
                  }`}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </section>

        <section className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-1 text-slate-600">
            Disponible
          </span>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-500">
            No disponible
          </span>

          <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">
            Fecha seleccionada
          </span>
        </section>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        {!canCreateAppointment ? (
          <p className="text-sm text-slate-600">
            Tu verificación debe estar aprobada para solicitar citas.
          </p>
        ) : !form.fecha ? (
          <p className="text-sm text-slate-600">
            Selecciona una fecha para visualizar horarios disponibles.
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold capitalize text-slate-900">
              {selectedDateText}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Horarios disponibles para esta fecha.
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
                      className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${isSelectedHour
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