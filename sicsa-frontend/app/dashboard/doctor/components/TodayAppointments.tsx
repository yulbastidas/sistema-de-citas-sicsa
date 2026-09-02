"use client";

import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  FileBadge2,
  FileText,
  UserRoundX,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AppointmentItem } from "../types";

type TodayAppointmentsProps = {
  loadingAppointments: boolean;
  appointments: AppointmentItem[];
  downloadingId: number | null;
  markingNoShowId: number | null;
  onOpenPdf: (id: number) => Promise<void>;
  onMarkNoShow: (
    appointment: AppointmentItem,
  ) => Promise<void>;
};

function getColombiaDate(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getColombiaDateTime(): Date {
  const colombiaDateTime =
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

  return new Date(
    colombiaDateTime.replace(" ", "T"),
  );
}

function getAppointmentDate(
  item: AppointmentItem,
): string {
  return String(item.fecha || "").slice(0, 10);
}

function getAppointmentDateTime(
  item: AppointmentItem,
): Date | null {
  const fecha = getAppointmentDate(item);

  let hora = String(item.hora || "").trim();

  if (!fecha || !hora) {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(hora)) {
    hora = `${hora}:00`;
  }

  const date = new Date(`${fecha}T${hora}`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatDate(fecha: string): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const parsedDate = new Date(
    `${fecha.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

export function TodayAppointments({
  loadingAppointments,
  appointments,
  downloadingId,
  markingNoShowId,
  onOpenPdf,
  onMarkNoShow,
}: TodayAppointmentsProps) {
  const router = useRouter();

  const today = getColombiaDate();
  const now = getColombiaDateTime();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <section className="flex items-start gap-3">
          <figure className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <CalendarDays size={20} />
          </figure>

          <section>
            <h2 className="text-lg font-bold text-slate-950">
              Agenda confirmada
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Citas de hoy y citas vencidas pendientes de
              clasificar.
            </p>
          </section>
        </section>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {loadingAppointments
            ? "..."
            : appointments.length}
        </span>
      </header>

      {loadingAppointments ? (
        <section className="p-6">
          <p className="text-sm font-medium text-slate-500">
            Cargando agenda...
          </p>
        </section>
      ) : appointments.length === 0 ? (
        <section className="p-6">
          <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-700">
              No hay citas confirmadas pendientes
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Las nuevas citas aparecerán automáticamente.
            </p>
          </article>
        </section>
      ) : (
        <section className="divide-y divide-slate-200">
          {appointments.map((item) => {
            const appointmentDate =
              getAppointmentDate(item);

            const appointmentDateTime =
              getAppointmentDateTime(item);

            const isPastDay =
              Boolean(appointmentDate) &&
              appointmentDate < today;

            const isToday =
              appointmentDate === today;

            const appointmentTimeReached =
              appointmentDateTime !== null &&
              appointmentDateTime.getTime() <=
              now.getTime();

            const canOpenAttention =
              isToday && !isPastDay;

            const canMarkNoShow =
              isPastDay ||
              (isToday &&
                appointmentTimeReached);

            const isMarking =
              markingNoShowId === item.id;

            return (
              <article
                key={item.id}
                className={`p-5 transition sm:p-6 ${isPastDay
                    ? "bg-amber-50/40 hover:bg-amber-50"
                    : "hover:bg-slate-50"
                  }`}
              >
                <header className="flex items-start justify-between gap-4">
                  <section className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold text-slate-950">
                        {item.patient?.nombre ||
                          "Paciente"}
                      </h3>

                      {isPastDay && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                          <AlertTriangle
                            size={12}
                          />
                          Cita vencida
                        </span>
                      )}
                    </div>

                    <section className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-cyan-800">
                        {formatDate(
                          appointmentDate,
                        )}
                      </span>

                      <span className="text-slate-300">
                        •
                      </span>

                      <span className="text-sm font-semibold text-cyan-800">
                        {item.hora ||
                          "Sin hora"}
                      </span>

                      <span className="text-slate-300">
                        •
                      </span>

                      <span className="text-sm text-slate-500">
                        Cita #{item.id}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${item.medicalReport?.exists
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                      >
                        {item.medicalReport?.exists
                          ? "Reporte listo"
                          : "Sin reporte"}
                      </span>
                    </section>
                  </section>

                  {canOpenAttention && (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(
                          `/dashboard/doctor/report/${item.id}`,
                        );
                      }}
                      aria-label={`Abrir atención de ${item.patient?.nombre ||
                        "paciente"
                        }`}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </header>

                <section className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Documento:
                    </span>{" "}
                    {item.patient?.documento ||
                      "-"}
                  </p>

                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">
                      EPS:
                    </span>{" "}
                    {item.patient?.eps || "-"}
                  </p>
                </section>

                <article className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                    {item.motivoConsulta ||
                      "Sin motivo de consulta registrado."}
                  </p>
                </article>

                {isPastDay && (
                  <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-900">
                      Esta cita ya venció
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Ya no puede abrirse una atención clínica.
                      Confirma la inasistencia para retirarla
                      de la agenda.
                    </p>
                  </section>
                )}

                <footer className="mt-4 flex flex-wrap gap-2">
                  {canOpenAttention && (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(
                          `/dashboard/doctor/report/${item.id}`,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
                    >
                      <FileText size={15} />
                      Abrir atención
                    </button>
                  )}

                  {canMarkNoShow && (
                    <button
                      type="button"
                      onClick={() => {
                        void onMarkNoShow(item);
                      }}
                      disabled={isMarking}
                      className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3.5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <UserRoundX size={15} />

                      {isMarking
                        ? "Marcando..."
                        : "Marcar inasistencia"}
                    </button>
                  )}

                  {!canMarkNoShow &&
                    isToday && (
                      <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-500">
                        La inasistencia estará disponible
                        después de la hora de la cita
                      </span>
                    )}

                  <button
                    type="button"
                    onClick={() => {
                      void onOpenPdf(item.id);
                    }}
                    disabled={
                      downloadingId === item.id ||
                      !item.medicalReport?.exists
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileBadge2 size={15} />

                    {downloadingId === item.id
                      ? "Descargando..."
                      : "PDF"}
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}
