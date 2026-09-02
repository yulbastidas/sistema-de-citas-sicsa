"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Loader2,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { completeMfaLogin, loginUser, type AuthenticatedLoginResponse, type MfaChallengeResponse } from "@/service/auth";
import { notifySicsa as alert } from "@/app/components/SicsaFeedback";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOMBIAN_PHONE_PATTERN = /^(?:3\d{9}|573\d{9}|\+573\d{9})$/;

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
  const [mfa, setMfa] = useState<MfaChallengeResponse | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [mfaAuthenticatedResult, setMfaAuthenticatedResult] = useState<AuthenticatedLoginResponse | null>(null);
  const mfaInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

    const identifier = form.email
      .trim()
      .toLowerCase();

    if (!identifier || !form.password) {
      alert(
        role === "patient"
          ? "Completa correo o celular y contraseña"
          : "Completa correo y contraseña",
      );
      return;
    }

    const validIdentifier =
      role === "patient"
        ? EMAIL_PATTERN.test(identifier) ||
          COLOMBIAN_PHONE_PATTERN.test(identifier)
        : EMAIL_PATTERN.test(identifier);

    if (!validIdentifier) {
      alert(
        role === "patient"
          ? "Ingresa un correo válido o un celular colombiano de 10 dígitos que comience por 3"
          : "Ingresa un correo electrónico válido",
      );
      return;
    }

    try {
      setLoading(true);
      logout();

      const result = await loginUser(
        identifier,
        form.password,
      );

      if ("requiresTwoFactor" in result) {
        setMfa(result);
        return;
      }
      finishLogin(result);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error al iniciar sesión");
    } finally { setLoading(false); }
  };

  const finishLogin = (result: AuthenticatedLoginResponse) => {
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
  };

  const handleMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfa) return;
    try {
      setLoading(true);
      const result = await completeMfaLogin(mfa.challengeToken, useRecoveryCode ? "recovery" : "totp", mfaCode);
      if (result.recoveryCodes?.length) { setRecoveryCodes(result.recoveryCodes); setMfaAuthenticatedResult(result); }
      else finishLogin(result);
    } catch (error) { alert(error instanceof Error ? error.message : "Código de verificación inválido o expirado"); }
    finally { setLoading(false); }
  };

  const updateMfaDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = mfaCode.padEnd(6, " ").split("");
    next[index] = digit || " ";
    setMfaCode(next.join("").trimEnd());
    if (digit && index < 5) mfaInputRefs.current[index + 1]?.focus();
  };

  const handleMfaPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault(); setMfaCode(digits); mfaInputRefs.current[Math.min(digits.length, 6) - 1]?.focus();
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

          <section className="relative w-full max-w-md">
            <header>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/35 bg-cyan-100/10 px-3 py-1.5 text-sm font-semibold text-cyan-100 backdrop-blur-sm">
                  {role === "patient" && <UserRound size={16} />}
                  {role === "doctor" && <Stethoscope size={16} />}
                  {role === "admin" && <ShieldCheck size={16} />}
                  {roleLabel}
                </span>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Iniciar sesión
              </h1>
              <p className="mt-2 text-sm leading-6 text-cyan-50/75 sm:text-base">
                Accede a SICSA con tus credenciales institucionales.
              </p>
            </header>

            {recoveryCodes ? (
              <section className="mt-8 space-y-5" aria-live="polite">
                <h2 className="text-xl font-bold">Guarda tus códigos de recuperación</h2>
                <p className="text-sm text-cyan-50/75">Se mostrarán una sola vez. Guárdalos en un lugar seguro.</p>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/25 p-4 font-mono text-sm">{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div>
                <button type="button" onClick={() => mfaAuthenticatedResult && finishLogin(mfaAuthenticatedResult)} className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold">Continuar</button>
              </section>
            ) : mfa ? (
              <form className="mt-8 space-y-5" onSubmit={handleMfa}>
                <h2 className="text-xl font-bold">{mfa.enrollmentRequired ? "Configura la verificación en dos pasos" : "Verificación en dos pasos"}</h2>
                {mfa.enrollmentRequired && mfa.qrCodeDataUrl && <div className="rounded-xl bg-white p-4"><Image src={mfa.qrCodeDataUrl} alt="Código QR para configurar SICSA en la aplicación autenticadora" width={208} height={208} unoptimized className="mx-auto h-52 w-52" /></div>}
                {mfa.enrollmentRequired && <p className="break-all text-sm text-cyan-50/80">Clave manual: <strong>{mfa.manualKey}</strong></p>}
                <label className="block text-sm font-semibold" htmlFor="mfa-code">{useRecoveryCode ? "Código de recuperación" : "Código de 6 dígitos"}</label>
                {useRecoveryCode ? <input id="mfa-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.toUpperCase())} autoComplete="one-time-code" className="w-full rounded-xl border border-cyan-100/25 bg-slate-950/20 px-4 py-3.5 text-center font-mono text-xl outline-none focus:border-cyan-200" required /> : <div className="grid grid-cols-6 gap-2" onPaste={handleMfaPaste}>{Array.from({ length: 6 }, (_, index) => <input key={index} ref={(node) => { mfaInputRefs.current[index] = node; }} aria-label={`Dígito ${index + 1} del código`} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} value={mfaCode[index] ?? ""} onChange={(e) => updateMfaDigit(index, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !mfaCode[index] && index > 0) mfaInputRefs.current[index - 1]?.focus(); }} className="min-w-0 rounded-lg border border-cyan-100/25 bg-slate-950/20 py-3 text-center text-xl font-bold outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-300/20" maxLength={1} required />)}</div>}
                <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-3.5 font-semibold disabled:opacity-60">{loading ? "Verificando..." : "Verificar"}</button>
                {!mfa.enrollmentRequired && <button type="button" onClick={() => { setUseRecoveryCode((v) => !v); setMfaCode(""); }} className="w-full text-sm text-cyan-200 hover:underline">{useRecoveryCode ? "Usar aplicación autenticadora" : "Usar código de recuperación"}</button>}
              </form>
            ) : <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <section>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-cyan-50"
                >
                  {role === "patient"
                    ? "Correo electrónico o celular"
                    : "Correo electrónico"}
                </label>

                <section className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
                  />
                  <input
                    id="login-email"
                    name="email"
                    type={role === "patient" ? "text" : "email"}
                    inputMode={role === "patient" ? "text" : undefined}
                    placeholder={
                      role === "patient"
                        ? "Correo o celular"
                        : "Correo electrónico"
                    }
                    autoComplete="username"
                    className="w-full rounded-xl border border-cyan-100/25 bg-slate-950/20 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-cyan-50/45 hover:border-cyan-100/40 focus:border-cyan-200/70 focus:bg-slate-950/30 focus:ring-4 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-70"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </section>
              </section>

              <section>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-semibold text-cyan-50"
                >
                  Contraseña
                </label>

                <section className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
                  />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-cyan-100/25 bg-slate-950/20 py-3.5 pl-12 pr-12 text-white outline-none transition placeholder:text-cyan-50/45 hover:border-cyan-100/40 focus:border-cyan-200/70 focus:bg-slate-950/30 focus:ring-4 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-70"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-cyan-50/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </section>
              </section>

              <section className="flex justify-end">
                <Link
                  href={`/forgot-password?role=${role}`}
                  className="rounded-md text-sm font-semibold text-cyan-200 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-400/20 transition hover:from-blue-500 hover:via-sky-400 hover:to-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader2 size={21} className="animate-spin" />}
                {loading ? "Ingresando..." : "Iniciar sesión"}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>}

            {role === "patient" && (
              <section className="mt-7 border-t border-cyan-100/20 pt-6 text-center text-sm text-cyan-50/75">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-cyan-200 transition hover:text-white hover:underline"
                >
                  Regístrate aquí
                </Link>
              </section>
            )}

            <p className="mt-7 text-center text-xs text-cyan-50/45">
              E.S.E. Hospital Clarita Santos · SICSA
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}
