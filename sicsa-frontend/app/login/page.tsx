import Image from "next/image";
import Link from "next/link";
import { HeartPulse, LogIn } from "lucide-react";

type LoginPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const role = params?.role || "patient";

  const roleLabel =
    role === "doctor"
      ? "Médico"
      : role === "admin"
      ? "Administrador"
      : "Paciente";

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto grid min-h-[95vh] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="flex items-center justify-center px-8 py-12 md:px-16">
          <div className="w-full max-w-md">
            <p className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Rol seleccionado: {roleLabel}
            </p>

            <h1 className="mb-2 text-5xl font-extrabold text-slate-900">
              Bienvenido
            </h1>
            <p className="mb-10 text-lg text-slate-600">
              Inicia sesión como {roleLabel}
            </p>

            <form className="space-y-6">
              <div>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-lg font-semibold text-slate-800">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="********"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={22} />
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-8 space-y-2 text-center text-base text-slate-600">
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
            </div>
          </div>
        </div>

        <div className="relative hidden md:block">
          <Image
            src="/hospital.jpg"
            alt="Hospital"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/35" />

          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <HeartPulse className="text-blue-600" size={48} />
            </div>

            <h2 className="text-5xl font-extrabold leading-tight drop-shadow-lg">
              Sistema de Gestión
              <br />
              Hospitalaria
            </h2>

            <p className="mt-6 max-w-lg text-2xl text-white/95">
              Cuidando tu salud con tecnología de vanguardia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}