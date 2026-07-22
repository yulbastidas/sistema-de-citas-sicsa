"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
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

    const startDay =
      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

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
    <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl">
      <header className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-6 py-6">
        <section className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
            <Sparkles className="text-white" size={22} />
          </span>

          <section>
            <h2 className="text-2xl font-bold text-slate-900">
              Calendario de citas
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Selecciona una fecha y luego elige uno de los horarios
              disponibles.
            </p>
          </section>
        </section>
      </header>

      <section className="p-6">
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
            <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <section className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <CalendarDays className="text-blue-600" size={20} />
                </span>

                <section>
                  <p className="font-bold text-slate-900">
                    Selecciona una fecha
                  </p>
                  <p className="text-xs text-slate-500">
                    Los lunes y domingos no hay atención.
                  </p>
                </section>
              </section>

              <section className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ChevronLeft size={18} />
                </button>

                <select
                  value={visibleMonth}
                  onChange={(event) =>
                    setVisibleMonth(Number(event.target.value))
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
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
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ChevronRight size={18} />
                </button>
              </section>
            </header>

            <section className="grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day) => (
                <p
                  key={day}
                  className="rounded-xl bg-slate-200/80 py-2 text-center text-xs font-bold text-slate-600"
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
                    className={`relative h-12 rounded-2xl border text-sm font-bold transition ${
                      isSelected
                        ? "border-blue-600 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-100"
                        : day.disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : day.isToday
                            ? "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                    }`}
                  >
                    {day.dayNumber}

                    {day.isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </section>

            <section className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
                Disponible
              </span>

              <span className="rounded-full bg-slate-200 px-3 py-1.5 font-medium text-slate-500">
                No disponible
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
                Fecha seleccionada
              </span>
            </section>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
              <section className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Clock3 className="text-blue-600" size={20} />
                </span>

                <section>
                  <p className="text-sm font-semibold text-slate-500">
                    Fecha elegida
                  </p>
                  <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                    {selectedDateText || "Sin seleccionar"}
                  </p>
                </section>
              </section>
            </article>

            <section className="grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Total de citas
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {appointments.length}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Citas activas
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {activeAppointments.length}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Horarios disponibles
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {canCreateAppointment ? availableHours.length : 0}
                </p>
              </article>
            </section>
          </aside>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
          {!canCreateAppointment ? (
            <section className="flex items-start gap-3">
              <Info className="mt-0.5 text-amber-600" size={18} />
              <p className="text-sm leading-6 text-slate-600">
                Tu verificación debe estar aprobada para solicitar citas.
              </p>
            </section>
          ) : !form.fecha ? (
            <section className="flex items-start gap-3">
              <Info className="mt-0.5 text-blue-600" size={18} />
              <p className="text-sm leading-6 text-slate-600">
                Selecciona una fecha en el calendario para consultar los
                horarios disponibles.
              </p>
            </section>
          ) : (
            <>
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <section>
                  <p className="text-base font-bold capitalize text-slate-900">
                    {selectedDateText}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Elige el horario que más te convenga.
                  </p>
                </section>

                {form.hora && (
                  <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">
                    Hora seleccionada: {form.hora}
                  </span>
                )}
              </header>

              {loadingHours ? (
                <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-600">
                    Cargando horarios disponibles...
                  </p>
                </article>
              ) : availableHours.length === 0 ? (
                <>
                  <article className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-800">
                      No hay horarios disponibles para este día.
                    </p>
                  </article>

                  {showWaitlistButton && (
                    <WaitlistCard
                      savingWaitlist={savingWaitlist}
                      disabled={waitlistDisabled}
                      onJoin={onJoinWaitlist}
                    />
                  )}
                </>
              ) : (
                <section className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                  {availableHours.map((hour) => {
                    const isSelectedHour = form.hora === hour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => onSelectHour(hour)}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          isSelectedHour
                            ? "border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
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
      </section>
    </section>
  );
}