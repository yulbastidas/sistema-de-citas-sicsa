"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getValidSession, logout, type SessionUser } from "@/service/session";

type AppRole = "patient" | "doctor" | "admin";

const HOME_BY_ROLE: Record<AppRole, string> = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
};

function isAppRole(role: SessionUser["role"]): role is AppRole {
  return role === "patient" || role === "doctor" || role === "admin";
}

export default function ProtectedRoute({ role, children }: {
  role: AppRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verify = () => {
      const session = getValidSession();

      if (!session) {
        setAuthorized(false);
        router.replace(`/login?role=${role}`);
        return;
      }

      if (!isAppRole(session.user.role)) {
        logout();
        setAuthorized(false);
        router.replace("/login?role=patient");
        return;
      }

      if (session.user.role !== role) {
        setAuthorized(false);
        router.replace(HOME_BY_ROLE[session.user.role]);
        return;
      }

      setAuthorized(true);
    };

    verify();
    const interval = window.setInterval(verify, 30_000);
    const onStorage = () => verify();
    const onVisibility = () => {
      if (document.visibilityState === "visible") verify();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, role, router]);

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-semibold text-slate-600">Validando sesión…</p>
      </main>
    );
  }

  return children;
}
