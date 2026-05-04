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
    <section className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-4">
      <section className="flex items-center gap-2">
        <ClockIcon className="text-violet-700" size={18} />
        <p className="text-sm font-semibold text-violet-800">
          ¿Quieres un cupo si se libera alguno?
        </p>
      </section>
      <p className="mt-2 text-sm leading-6 text-violet-700">
        El sistema intentará asignarte automáticamente el primer cupo disponible
        según prioridad.
      </p>
      <button
        onClick={onJoin}
        disabled={disabled || savingWaitlist}
        className="mt-4 w-full rounded-3xl border border-violet-300 bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-70"
      >
        {savingWaitlist
          ? "Uniéndome..."
          : "Unirme a lista de espera para este día"}
      </button>
    </section>
  );
}
