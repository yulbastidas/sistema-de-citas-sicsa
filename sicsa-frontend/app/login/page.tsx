"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartPulse, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { loginUser } from "@/service/auth";
import { logout, saveSession } from "@/service/session";

const ALLOWED_ROLES = ["patient", "doctor", "admin"] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

const ROLE_LABELS: Record<AllowedRole, string> = {
  patient: "Paciente",
  doctor: "Médico",
  admin: "Administrador",
};

function isAllowedRole(value: string | null): value is AllowedRole {
  return value === "patient" || value === "doctor" || value === "admin";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawRole = searchParams.get("role");

  const role = useMemo<AllowedRole>(() => {
    return isAllowedRole(rawRole) ? rawRole : "patient";
  }, [rawRole]);

  const roleLabel = ROLE_LABELS[role];

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rawRole || !isAllowedRole(rawRole)) {
      router.replace("/login?role=patient");
    }
  }, [rawRole, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAllowedRole(rawRole)) {
      router.replace("/login?role=patient");
      return;
    }

    if (!form.email || !form.password) {
      alert("Completa correo y contraseña");
      return;
    }

    try {
      setLoading(true);
      logout();

      const result = await loginUser(form.email, form.password);

      if (!result?.access_token) {
        alert("El backend no devolvió un token válido");
        return;
      }

      const savedUser = saveSession(result.access_token);

      if (!savedUser) {
        alert("Login exitoso, pero no se pudo guardar la sesión");
        return;
      }

      if (savedUser.role !== role) {
        alert("El rol seleccionado no coincide con el usuario");
        logout();
        router.replace("/login?role=patient");
        return;
      }

      if (savedUser.role === "patient") {
        router.replace("/dashboard/patient");
      } else if (savedUser.role === "doctor") {
        router.replace("/dashboard/doctor");
      } else if (savedUser.role === "admin") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/login?role=patient");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <section className="mx-auto grid min-h-[95vh] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex items-center justify-center px-8 py-12 md:px-16">
          <section className="w-full max-w-md">
            <p className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Rol seleccionado: {roleLabel}
            </p>

            <h1 className="mb-2 text-5xl font-extrabold text-slate-900">
              Bienvenido
            </h1>

            <p className="mb-10 text-lg text-slate-600">
              Inicia sesión como {roleLabel}
            </p>

            <form className="space-y-6" onSubmit={handleLogin}>
              <section>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Correo Electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                />
              </section>

              <section>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="********"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                />
              </section>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogIn size={22} />
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </button>
            </form>

            <section className="mt-8 space-y-2 text-center text-base text-slate-600">
              {role === "patient" && (
                <p>
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              )}

              <p>
                <Link
                  href="/select-role"
                  className="font-semibold text-slate-700 hover:underline"
                >
                  Cambiar rol
                </Link>
              </p>
            </section>
          </section>
        </section>

        <section className="relative hidden md:block">
          <Image
            src="/hospital.jpg"
            alt="Hospital"
            fill
            sizes="50vw"
            className="object-cover"
          />

          <section className="absolute inset-0 bg-blue-900/35" />

          <section className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <section className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <HeartPulse className="text-blue-600" size={48} />
            </section>

            <h2 className="text-5xl font-extrabold leading-tight drop-shadow-lg">
              Sistema de Gestión
              <br />
              Hospitalaria
            </h2>

            <p className="mt-6 max-w-lg text-2xl text-white/95">
              Cuidando tu salud con tecnología de vanguardia
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}