"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastRequest = {
  id: string;
  message: string;
  tone?: ToastTone;
};

type DialogRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  resolve: (value: boolean | string | null) => void;
};

const TOAST_EVENT = "sicsa:toast";
const DIALOG_EVENT = "sicsa:dialog";

function safeMessage(value: unknown, fallback: string) {
  const message = typeof value === "string" ? value.trim() : "";
  if (!message) return fallback;

  const technical = /(axios|network error|sql|queryfailed|stack|status code|econn|fetch failed|localhost|\{\s*"|<html)/i;
  return technical.test(message) ? fallback : message;
}

function inferTone(message: string): ToastTone {
  if (/(correctamente|exit(?:oso|osa)|completad[oa]|enviad[oa]|aprobad[oa]|cancelad[oa])/i.test(message)) {
    return "success";
  }
  if (/(error|no (?:fue|se pudo|pudieron)|inválid|expirad|debes|completa|selecciona|escribe)/i.test(message)) {
    return "error";
  }
  return "info";
}

export function notifySicsa(message: unknown, fallback = "No fue posible completar la operación") {
  if (typeof window === "undefined") return;
  const safe = safeMessage(message, fallback);
  window.dispatchEvent(new CustomEvent<ToastRequest>(TOAST_EVENT, {
    detail: { id: crypto.randomUUID(), message: safe, tone: inferTone(safe) },
  }));
}

export function confirmSicsa({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Volver",
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogRequest>(DIALOG_EVENT, {
      detail: {
        title,
        message,
        confirmLabel,
        cancelLabel,
        resolve: (value) => resolve(value === true),
      },
    }));
  });
}

export function promptSicsa({
  title,
  message,
  inputLabel,
  inputPlaceholder,
  confirmLabel = "Continuar",
  cancelLabel = "Volver",
}: {
  title: string;
  message: string;
  inputLabel: string;
  inputPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return new Promise<string | null>((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogRequest>(DIALOG_EVENT, {
      detail: {
        title,
        message,
        inputLabel,
        inputPlaceholder,
        confirmLabel,
        cancelLabel,
        resolve: (value) => resolve(typeof value === "string" ? value : null),
      },
    }));
  });
}

export default function SicsaFeedback({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRequest[]>([]);
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const closeDialog = useCallback((value: boolean | string | null) => {
    setDialog((current) => {
      current?.resolve(value);
      return null;
    });
    setInputValue("");
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const toast = (event as CustomEvent<ToastRequest>).detail;
      setToasts((current) => [...current.slice(-3), toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4500);
    };
    const onDialog = (event: Event) => {
      setDialog((event as CustomEvent<DialogRequest>).detail);
      setInputValue("");
    };

    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(DIALOG_EVENT, onDialog);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(DIALOG_EVENT, onDialog);
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => (dialog.inputLabel ? inputRef.current : cancelRef.current)?.focus(), 0);
    return () => { document.body.style.overflow = ""; };
  }, [dialog]);

  return (
    <>
      {children}

      <section className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5" aria-label="Notificaciones" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertTriangle : Info;
          return (
            <article key={toast.id} role={toast.tone === "error" ? "alert" : "status"} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-cyan-100/30 bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 p-4 text-white shadow-2xl shadow-sky-950/30">
              <Icon className={toast.tone === "error" ? "mt-0.5 shrink-0 text-amber-300" : "mt-0.5 shrink-0 text-cyan-300"} size={21} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-medium leading-5">{toast.message}</p>
              <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-lg p-1 text-cyan-50/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" aria-label="Cerrar notificación">
                <X size={18} />
              </button>
            </article>
          );
        })}
      </section>

      {dialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 px-4 py-8 backdrop-blur-sm" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") closeDialog(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="sicsa-dialog-title" aria-describedby="sicsa-dialog-description" className="w-full max-w-md rounded-[1.75rem] border border-cyan-100/30 bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 p-6 text-white shadow-2xl sm:p-8">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-300/10 text-cyan-200"><AlertTriangle size={24} /></span>
            <h2 id="sicsa-dialog-title" className="text-2xl font-extrabold tracking-tight">{dialog.title}</h2>
            <p id="sicsa-dialog-description" className="mt-3 text-sm leading-6 text-cyan-50/75">{dialog.message}</p>

            {dialog.inputLabel && (
              <label className="mt-5 block text-sm font-semibold text-cyan-50">
                {dialog.inputLabel}
                <input ref={inputRef} value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder={dialog.inputPlaceholder} className="mt-2 w-full rounded-xl border border-cyan-100/25 bg-slate-950/30 px-4 py-3 text-white outline-none placeholder:text-cyan-50/40 focus:border-cyan-200 focus:ring-4 focus:ring-cyan-300/15" />
              </label>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button ref={cancelRef} type="button" onClick={() => closeDialog(null)} className="rounded-xl border border-cyan-100/30 px-5 py-3 font-semibold text-cyan-50 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/25">{dialog.cancelLabel}</button>
              <button type="button" disabled={Boolean(dialog.inputLabel && !inputValue.trim())} onClick={() => closeDialog(dialog.inputLabel ? inputValue.trim() : true)} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-400 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:from-blue-500 hover:to-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/30 disabled:cursor-not-allowed disabled:opacity-50">{dialog.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
