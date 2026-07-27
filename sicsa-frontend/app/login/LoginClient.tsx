"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  LogIn,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { loginUser } from "@/service/auth";
import {
  logout,
  saveSession,
} from "@/service/session";

type AllowedRole =
  | "patient"
  | "doctor"
  | "admin";

const ROLE_LABELS: Record<AllowedRole, string> = {
  patient: "Paciente",
  doctor: "Médico",
  admin: "Administrador",
};

function isAllowedRole(
  value: string | null,
): value is AllowedRole {
  return (
    value === "patient" ||
    value === "doctor" ||
    value === "admin"
  );
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawRole = searchParams.get("role");

  const role = useMemo<AllowedRole>(() => {
    return isAllowedRole(rawRole)
      ? rawRole
      : "patient";
  }, [rawRole]);

  const roleLabel = ROLE_LABELS[role];

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  useEffect(() => {
    if (!rawRole || !isAllowedRole(rawRole)) {
      router.replace("/login?role=patient");
    }
  }, [rawRole, router]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isAllowedRole(rawRole)) {
      router.replace("/login?role=patient");
      return;
    }

    const email = form.email
      .trim()
      .toLowerCase();

    if (!email || !form.password) {
      alert("Completa correo y contraseña");
      return;
    }

    try {
      setLoading(true);
      logout();

      const result = await loginUser(
        email,
        form.password,
      );

      if (!result?.access_token) {
        alert(
          "El backend no devolvió un token válido",
        );
        return;
      }

      const savedUser = saveSession(
        result.access_token,
      );

      if (!savedUser) {
        alert(
          "Login exitoso, pero no se pudo guardar la sesión",
        );
        return;
      }

      if (savedUser.role !== role) {
        alert(
          "El rol seleccionado no coincide con el usuario",
        );

        logout();
        router.replace("/login?role=patient");
        return;
      }

      if (savedUser.role === "patient") {
        router.replace("/dashboard/patient");
        return;
      }

      if (savedUser.role === "doctor") {
        router.replace("/dashboard/doctor");
        return;
      }

      if (savedUser.role === "admin") {
        router.replace("/dashboard/admin");
        return;
      }

      logout();
      router.replace("/login?role=patient");
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al iniciar sesión",
      );
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

            <form
              className="space-y-6"
              onSubmit={handleLogin}
            >
              <section>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Correo electrónico
                </label>

                <input
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </section>

              <section>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Contraseña
                </label>

                <section className="relative">
                  <input
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="********"
                    autoComplete="current-password"
                    className="input pr-12"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </section>
              </section>

              <section className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <Loader2
                    size={22}
                    className="animate-spin"
                  />
                ) : (
                  <LogIn size={22} />
                )}

                {loading
                  ? "Ingresando..."
                  : "Iniciar sesión"}
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
            </section>
          </section>
        </section>

        <section className="relative hidden md:block">
          <Image
            src="/hospital.jpg"
            alt="Hospital"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />

          <section className="absolute inset-0 bg-blue-900/35" />

          <section className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <section className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <HeartPulse
                className="text-blue-600"
                size={48}
              />
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