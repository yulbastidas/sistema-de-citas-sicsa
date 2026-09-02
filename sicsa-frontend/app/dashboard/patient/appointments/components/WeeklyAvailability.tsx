"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
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
  today,
  onSelectDay,
  onSelectHour,
  onJoinWaitlist,
}: WeeklyAvailabilityProps) {
  const currentDate = new Date();

  const [visibleMonth, setVisibleMonth] = useState(currentDate.getMonth());
  const [visibleYear, setVisibleYear] = useState(currentDate.getFullYear());
  const [isChoosingDate, setIsChoosingDate] = useState(!form.fecha);

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

  const handleSelectDay = (date: string) => {
    onSelectDay(date);
    setIsChoosingDate(false);
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl shadow-slate-200/60">
      <header className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-5 py-4">
        <section className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <CalendarDays className="text-blue-700" size={21} />
          </span>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Calendario de citas
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Selecciona una fecha y luego elige uno de los horarios
              disponibles.
            </p>
          </section>
        </section>
      </header>

      <section className="p-4">
        {!form.fecha || isChoosingDate ? (
          <>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <header className="mb-4 space-y-4">
              <section className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <CalendarDays className="text-blue-600" size={20} />
                </span>

                <section>
                  <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                    Paso 1 de 2
                  </p>
                  <p className="font-bold text-slate-900">
                    Selecciona una fecha
                  </p>
                  <p className="text-xs text-slate-500">
                    Los lunes y domingos no hay atención.
                  </p>
                </section>
              </section>

              <section className="grid grid-cols-[40px_minmax(0,1fr)_88px_40px] items-center gap-2">
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
                  className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
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
                  className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
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

            <section className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((day) => (
                <p
                  key={day}
                  className="py-1.5 text-center text-xs font-bold text-slate-500"
                >
                  {day}
                </p>
              ))}

              {calendarDays.map((day, index) => {
                if (!day.dayNumber) {
                  return <div key={index} className="h-10" />;
                }

                const isSelected = form.fecha === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={day.disabled}
                    onClick={() => handleSelectDay(day.date)}
                    className={`relative h-10 rounded-xl border text-xs font-bold transition ${
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

            <section className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Disponible
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                No disponible
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Fecha seleccionada
              </span>
            </section>
          </article>

          <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            {!canCreateAppointment ? (
            <section className="flex items-start gap-3">
              <Info className="mt-0.5 text-amber-600" size={18} />
              <p className="text-sm leading-6 text-slate-600">
                Tu verificación debe estar aprobada para solicitar citas.
              </p>
            </section>
            ) : (
            <section className="flex items-start gap-3">
              <Info className="mt-0.5 text-blue-600" size={18} />
              <p className="text-sm leading-6 text-slate-600">
                Selecciona una fecha en el calendario para consultar los
                horarios disponibles.
              </p>
            </section>
            )}
          </section>
          </>
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            {!canCreateAppointment ? (
              <section className="flex items-start gap-3">
                <Info className="mt-0.5 text-amber-600" size={18} />
                <p className="text-sm leading-6 text-slate-600">
                  Tu verificación debe estar aprobada para solicitar citas.
                </p>
              </section>
            ) : (
            <>
              <header className="space-y-3">
                <section className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                    Paso 2 de 2
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsChoosingDate(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <ChevronLeft size={15} />
                    Cambiar fecha
                  </button>
                </section>

                <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
                </section>
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
                <section className="mt-4 max-h-64 overflow-y-auto pr-1 [scrollbar-color:#bfdbfe_transparent] [scrollbar-width:thin]">
                  <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {availableHours.map((hour) => {
                      const isSelectedHour = form.hora === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => onSelectHour(hour)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
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
                </section>
              )}
            </>
            )}
          </article>
        )}
      </section>
    </section>
  );
}
