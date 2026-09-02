"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RoleProfileMenuProps = {
  name?: string;
  roleLabel: string;
  onLogout: () => void;
};

export function RoleProfileMenu({
  name,
  roleLabel,
  onLogout,
}: RoleProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = name?.trim() || roleLabel;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-16 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-cyan-200/25 bg-slate-950/35 px-4 py-3 text-left shadow-lg backdrop-blur transition hover:border-cyan-200/50 hover:bg-slate-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:min-w-64"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menú de usuario de ${displayName}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-900">
            <UserRound size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">{displayName}</span>
            <span className="block text-xs text-cyan-100/75">{roleLabel}</span>
          </span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-cyan-100 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="text-xs text-slate-500">Sesión {roleLabel.toLowerCase()}</p>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <LogOut className="mt-0.5 text-rose-600" size={18} />
            <span>
              <span className="block text-sm font-bold">Cerrar sesión</span>
              <span className="block text-xs text-slate-500">Salir de la cuenta</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
