"use client";

import { ClockIcon } from "lucide-react";

type WaitlistCardProps = {
  savingWaitlist: boolean;
  disabled: boolean;
  onJoin: () => void;
};

export function WaitlistCard({
  savingWaitlist,
  disabled,
  onJoin,
}: WaitlistCardProps) {
  return (
    <section className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
      <section className="flex items-center gap-2">
        <ClockIcon className="text-blue-700" size={18} />
        <p className="text-sm font-semibold text-blue-800">
          ¿Quieres un cupo si se libera alguno?
        </p>
      </section>
      <p className="mt-2 text-sm leading-6 text-blue-700">
        El sistema intentará asignarte automáticamente el primer cupo disponible
        según prioridad.
      </p>
      <button
        onClick={onJoin}
        disabled={disabled || savingWaitlist}
        className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
      >
        {savingWaitlist
          ? "Uniéndome..."
          : "Unirme a lista de espera para este día"}
      </button>
    </section>
  );
}