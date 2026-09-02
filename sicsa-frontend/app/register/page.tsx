"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HeartPulse,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifySicsa as alert } from "@/app/components/SicsaFeedback";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "email" && emailError) {
      setEmailError("");
    }
  };

  const handleNext = () => {
    const normalizedEmail = form.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (channel === "email" && !normalizedEmail) {
      setEmailError("Ingresa tu correo electrónico.");
      return;
    }

    if (channel === "email" && (
      normalizedEmail.length > 150 ||
      form.email.includes(" ") ||
      !emailPattern.test(normalizedEmail)
    )) {
      setEmailError("Ingresa un correo electrónico válido, sin espacios.");
      return;
    }

    const normalizedPhone = form.phone.replace(/\D/g, "");
    if (channel === "phone" && !/^3\d{9}$/.test(normalizedPhone)) {
      setPhoneError("Ingresa un celular colombiano válido de 10 dígitos.");
      return;
    }

    if (!form.password || !form.confirmPassword) {
      alert("Completa los campos de contraseña");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    localStorage.setItem(
      "register_credentials",
      JSON.stringify({
        channel,
        ...(channel === "email"
          ? { email: normalizedEmail }
          : { phone: normalizedPhone }),
        password: form.password,
      }),
    );

    router.push("/register/patient-profile");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_12%_85%,rgba(8,145,178,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#082f49_48%,#0c4a6e_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full border border-cyan-300/10 bg-cyan-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-16 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />

      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-white/[0.04] shadow-[0_32px_90px_-28px_rgba(2,132,199,0.42)] backdrop-blur-xl md:min-h-[650px] md:grid-cols-[0.92fr_1.08fr] lg:min-h-[690px]">
        <section className="relative flex min-h-[300px] overflow-hidden px-7 py-7 text-white sm:min-h-[330px] sm:px-10 md:min-h-full md:px-12 md:py-9">
          <div className="pointer-events-none absolute left-1/2 top-[46%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-3xl" />

          <section className="relative z-10 flex w-full flex-col gap-5 md:gap-8">
            <header className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                <HeartPulse size={25} className="text-cyan-200" />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-wide">SICSA</p>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-100/80">
                  Gestión hospitalaria
                </p>
              </div>
            </header>

            <section className="grid items-center gap-5 sm:grid-cols-[145px_1fr] md:grid-cols-1 md:gap-5">
              <figure className="relative h-28 w-[58%] max-w-[230px] justify-self-center overflow-hidden rounded-3xl drop-shadow-[0_18px_24px_rgba(34,211,238,0.18)] sm:h-32 sm:w-full md:h-56 md:w-[68%] md:max-w-[300px]">
                <Image
                  src="/hospital.jpg"
                  alt="Logo de la E.S.E. Hospital Clarita Santos"
                  fill
                  priority
                  sizes="(max-width: 767px) 150px, 300px"
                  className="object-contain mix-blend-multiply brightness-125 contrast-125 saturate-150"
                />
              </figure>

              <div className="md:text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:text-sm">
                  E.S.E. Hospital Clarita Santos
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:mx-auto md:max-w-sm md:text-[1.8rem]">
                  Sistema de Gestión Hospitalaria
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-cyan-50/85 sm:text-base md:mx-auto">
                  Cuidando tu salud con tecnología de vanguardia
                </p>
              </div>
            </section>

            <footer className="mt-auto hidden items-center gap-2 text-xs text-cyan-100/70 md:flex">
              <ShieldCheck size={14} />
              Plataforma institucional SICSA
            </footer>
          </section>
        </section>

        <section className="relative m-3 flex items-center justify-center overflow-hidden rounded-[1.75rem] border border-cyan-100/25 bg-gradient-to-br from-white/20 via-sky-200/10 to-cyan-950/15 px-6 py-9 text-white shadow-[0_24px_70px_-30px_rgba(34,211,238,0.65)] backdrop-blur-2xl sm:m-5 sm:px-10 sm:py-10 lg:m-7 lg:px-14">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/15 blur-2xl" />

          <article className="relative w-full max-w-md">
            <section className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold sm:text-sm">
                <span className="text-cyan-100">1. Crear cuenta</span>
                <span className="text-cyan-50/45">2. Datos personales</span>
              </div>

              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" />
              </div>

              <p className="mt-2 text-xs text-cyan-50/55">Paso 1 de 2</p>
            </section>

            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/35 bg-cyan-100/10 px-3 py-1.5 text-sm font-semibold text-cyan-100 backdrop-blur-sm">
              <UserRound size={17} />
              Registro de paciente
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Crear cuenta
            </h1>

            <p className="mt-2 text-sm leading-6 text-cyan-50/75 sm:text-base">
              Ingresa tus datos de acceso para comenzar el registro.
            </p>

            <form
              className="mt-7 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
            >
              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-cyan-50">
                  ¿Cómo deseas registrarte?
                </legend>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-100/20 bg-slate-950/20 p-1.5">
                  {(["email", "phone"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={channel === option}
                      onClick={() => {
                        setChannel(option);
                        setEmailError("");
                        setPhoneError("");
                      }}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${channel === option ? "bg-cyan-400 text-slate-950 shadow" : "text-cyan-50/75 hover:bg-white/10"}`}
                    >
                      {option === "email" ? "Correo electrónico" : "Número de celular"}
                    </button>
                  ))}
                </div>
              </fieldset>

              {channel === "email" ? (
              <section>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-cyan-50"
                >
                  Correo electrónico
                </label>

                <section className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    maxLength={150}
                    aria-invalid={Boolean(emailError)}
                    className={`w-full rounded-xl border py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-cyan-50/45 focus:ring-4 ${
                      emailError
                        ? "border-red-300/70 bg-red-950/25 focus:border-red-200 focus:ring-red-300/15"
                        : "border-cyan-100/25 bg-slate-950/20 hover:border-cyan-100/40 focus:border-cyan-200/70 focus:bg-slate-950/30 focus:ring-cyan-300/15"
                    }`}
                    value={form.email}
                    onChange={handleChange}
                  />
                </section>
                {emailError && (
                  <p className="mt-2 text-sm text-red-200">{emailError}</p>
                )}
              </section>
              ) : (
                <section>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-cyan-50">
                    Número de celular
                  </label>
                  <section className="relative">
                    <Phone size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="3001234567"
                      maxLength={10}
                      value={form.phone}
                      onChange={(event) => {
                        setForm((previous) => ({ ...previous, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }));
                        setPhoneError("");
                      }}
                      aria-invalid={Boolean(phoneError)}
                      className={`w-full rounded-xl border py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-cyan-50/45 focus:ring-4 ${phoneError ? "border-red-300/70 bg-red-950/25 focus:ring-red-300/15" : "border-cyan-100/25 bg-slate-950/20 focus:border-cyan-200/70 focus:ring-cyan-300/15"}`}
                    />
                  </section>
                  {phoneError && <p className="mt-2 text-sm text-red-200">{phoneError}</p>}
                </section>
              )}

              <section>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-cyan-50">
                  Contraseña
                </label>
                <section className="relative">
                  <LockKeyhole size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ingresa una contraseña"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-cyan-100/25 bg-slate-950/20 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-cyan-50/45 hover:border-cyan-100/40 focus:border-cyan-200/70 focus:bg-slate-950/30 focus:ring-4 focus:ring-cyan-300/15"
                    value={form.password}
                    onChange={handleChange}
                  />
                </section>
              </section>

              <section>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-cyan-50"
                >
                  Confirmar contraseña
                </label>

                <section className="relative">
                  <Check
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-cyan-100/25 bg-slate-950/20 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-cyan-50/45 hover:border-cyan-100/40 focus:border-cyan-200/70 focus:bg-slate-950/30 focus:ring-4 focus:ring-cyan-300/15"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </section>
              </section>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-400/20 transition hover:from-blue-500 hover:via-sky-400 hover:to-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
              >
                Continuar
                <ArrowRight
                  size={20}
                  className="transition group-hover:translate-x-0.5"
                />
              </button>
            </form>

            <p className="mt-6 border-t border-cyan-100/20 pt-5 text-center text-sm text-cyan-50/75">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login?role=patient"
                className="font-semibold text-cyan-200 hover:text-white hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>

            <p className="mt-5 text-center text-xs text-cyan-50/45">
              Tus datos serán utilizados únicamente para gestionar tus citas.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
