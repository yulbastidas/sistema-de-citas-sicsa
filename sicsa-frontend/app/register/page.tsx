"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartPulse, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (!form.email || !form.password || !form.confirmPassword) {
      alert("Completa todos los campos");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    localStorage.setItem(
      "register_credentials",
      JSON.stringify({
        email: form.email.trim(),
        password: form.password,
      }),
    );

    router.push("/register/patient-profile");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <section className="mx-auto grid min-h-[95vh] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex items-center justify-center px-8 py-12 md:px-16">
          <article className="w-full max-w-md">
            <h1 className="mb-2 text-5xl font-extrabold text-slate-900">
              Crear Cuenta
            </h1>
            <p className="mb-10 text-lg text-slate-600">
              Regístrate para comenzar
            </p>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="Correo electrónico"
                className="input"
                value={form.email}
                onChange={handleChange}
              />

              <input
                name="password"
                type="password"
                placeholder="Contraseña"
                className="input"
                value={form.password}
                onChange={handleChange}
              />

              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirmar contraseña"
                className="input"
                value={form.confirmPassword}
                onChange={handleChange}
              />

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={22} />
                Continuar
              </button>
            </form>

            <p className="mt-8 text-center text-base text-slate-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login?role=patient"
                className="font-semibold text-blue-600 hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </article>
        </section>

        <section className="relative hidden md:block">
          <Image
            src="/hospital.jpg"
            alt="Hospital"
            fill
            className="object-cover"
          />
          <section className="absolute inset-0 bg-blue-900/40" />

          <section className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <figure className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <HeartPulse className="text-blue-600" size={48} />
            </figure>

            <h2 className="text-5xl font-extrabold">
              Sistema de Gestión Hospitalaria
            </h2>

            <p className="mt-6 text-xl">
              Cuidando tu salud con tecnología de vanguardia
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}