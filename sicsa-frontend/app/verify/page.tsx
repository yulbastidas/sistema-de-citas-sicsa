"use client";

import {
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  ApiRequestError,
  resendPhoneRegistration,
  verifyPhoneRegistration,
} from "@/service/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const channel = searchParams.get("channel");
  const isPhoneRegistration = channel === "phone";
  const registrationId = Number(searchParams.get("registrationId"));
  const [challengeId, setChallengeId] = useState(
    searchParams.get("challengeId") ?? "",
  );
  const maskedPhone = searchParams.get("phone") ?? "";
  const [resendSeconds, setResendSeconds] = useState(
    isPhoneRegistration ? 60 : 0,
  );
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const setDigit = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = code.padEnd(6, " ").split("");
    next[index] = digit || " ";
    setCode(next.join("").trimEnd());
    if (digit && index < 5) digitRefs.current[index + 1]?.focus();

    if (messageType === "error") {
      setMessage("");
      setMessageType("");
    }
  };

  const handleCodePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setCode(pasted);
    digitRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const publicError = (error: unknown, resend = false): string => {
    if (error instanceof ApiRequestError) {
      const message = error.message.toLowerCase();
      if (error.status === 429) {
        return resend
          ? "Espera unos segundos antes de solicitar otro código."
          : "Superaste el número permitido de intentos. Solicita un nuevo código.";
      }
      if (message.includes("expir")) return "El código expiró. Solicita uno nuevo.";
      if (message.includes("código") || message.includes("codigo")) {
        return "El código ingresado no es correcto.";
      }
      if (message.includes("registro") || message.includes("utilizar")) {
        return "Los datos ingresados no pueden utilizarse para este registro.";
      }
      return resend
        ? "No pudimos enviar el código en este momento. Inténtalo nuevamente más tarde."
        : "No fue posible verificar el código. Inténtalo nuevamente.";
    }
    if (!axios.isAxiosError(error) || !error.response) {
      return "No fue posible conectar con el servidor. Inténtalo nuevamente.";
    }
    if (error.response.status === 429) {
      return resend
        ? "Espera unos segundos antes de solicitar otro código."
        : "Superaste el número permitido de intentos. Solicita un nuevo código.";
    }
    const message = Array.isArray(error.response.data?.message)
      ? error.response.data.message.join(" ")
      : String(error.response.data?.message ?? "").toLowerCase();
    if (message.includes("expir")) return "El código expiró. Solicita uno nuevo.";
    if (message.includes("código") || message.includes("codigo")) {
      return "El código ingresado no es correcto.";
    }
    if (message.includes("registro") || message.includes("utilizar")) {
      return "Los datos ingresados no pueden utilizarse para este registro.";
    }
    return resend
      ? "No pudimos enviar el código en este momento. Inténtalo nuevamente más tarde."
      : "No fue posible verificar el código. Inténtalo nuevamente.";
  };

  const handleVerify = async () => {
    if (!isPhoneRegistration && !email) {
      setMessageType("error");
      setMessage("No se encontró el correo electrónico.");
      return;
    }

    if (!code) {
      setMessageType("error");
      setMessage("Ingresa el código de verificación.");
      return;
    }

    if (code.length !== 6) {
      setMessageType("error");
      setMessage("El código debe tener 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      if (isPhoneRegistration) {
        await verifyPhoneRegistration(registrationId, challengeId, code);
      } else {
        await axios.post(`${API_URL}/auth/verify-email-code`, { email, code });
      }

      setMessageType("success");
      setMessage(
        `${isPhoneRegistration ? "Celular" : "Correo"} verificado correctamente. Redirigiendo al inicio de sesión...`,
      );

      setTimeout(() => {
        router.push("/login?role=patient");
      }, 1500);
    } catch (error) {
      setMessageType("error");
      setMessage(publicError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isPhoneRegistration && !email) {
      setMessageType("error");
      setMessage("No se encontró el correo.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      if (isPhoneRegistration) {
        const result = await resendPhoneRegistration(registrationId);
        setChallengeId(result.challengeId);
        setResendSeconds(60);
      } else {
        await axios.post(`${API_URL}/auth/send-verification-code`, { email });
      }

      setCode("");

      setMessageType("info");
      setMessage(`Se envió un nuevo código a tu ${isPhoneRegistration ? "celular" : "correo"}.`);
    } catch (error) {
      setMessageType("error");
      if (error instanceof ApiRequestError && error.retryAfterSeconds) {
        setResendSeconds(error.retryAfterSeconds);
      }
      setMessage(publicError(error, true));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617_0%,#082f49_48%,#0c4a6e_100%)] px-4 py-8">
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-100/25 bg-white shadow-[0_32px_90px_-28px_rgba(2,132,199,0.42)]">
        <header className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 px-7 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <ShieldCheck
              className="text-blue-600"
              size={34}
            />
          </div>

          <h1 className="text-3xl font-extrabold">
            Verifica tu {isPhoneRegistration ? "celular" : "correo"}
          </h1>

          <p className="mt-3 text-blue-100">
            Hemos enviado un código de verificación a tu {isPhoneRegistration ? "celular" : "correo"}.
          </p>
        </header>

        <section className="p-6 sm:p-7">
          <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              {isPhoneRegistration ? <Phone
                className="mt-1 text-blue-600"
                size={20}
              /> : <Mail
                className="mt-1 text-blue-600"
                size={20}
              />}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {isPhoneRegistration ? "Celular" : "Correo electrónico"}
                </p>

                <p className="mt-1 break-all font-medium text-slate-800">
                  {isPhoneRegistration ? maskedPhone : email}
                </p>
              </div>
            </div>
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleVerify();
            }}
          >
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Código de verificación
            </label>

            <div
              className="grid grid-cols-6 gap-2 sm:gap-3"
              onPaste={handleCodePaste}
              role="group"
              aria-label="Código de verificación de seis dígitos"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => { digitRefs.current[index] = element; }}
                  id={index === 0 ? "code" : undefined}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={code[index] ?? ""}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !code[index] && index > 0) {
                      digitRefs.current[index - 1]?.focus();
                    }
                  }}
                  aria-label={`Dígito ${index + 1} de 6`}
                  className="aspect-square min-w-0 rounded-xl border-2 border-slate-200 bg-white text-center text-xl font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-2xl"
                />
              ))}
            </div>

            <p className="mt-2 text-center text-xs text-slate-500">
              Ingresa los 6 dígitos enviados a tu {isPhoneRegistration ? "celular" : "correo"}.
            </p>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={20} />

              {loading
                ? "Verificando..."
                : "Verificar código"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void handleResendCode()}
            disabled={loading || (isPhoneRegistration && resendSeconds > 0)}
            className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={20} />
            {isPhoneRegistration && resendSeconds > 0
              ? `Podrás reenviar en ${resendSeconds} s`
              : "Reenviar código"}
          </button>

          {message && (
            <section
              className={`mt-5 rounded-2xl border p-4 text-center text-sm font-medium ${
                messageType === "success"
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : messageType === "info"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </section>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            {isPhoneRegistration
              ? "El código vence pronto y solo puede utilizarse una vez."
              : "Si no encuentras el correo, revisa la carpeta de spam o correo no deseado."}
          </p>
        </section>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900">
          <p className="font-semibold text-slate-600">
            Cargando...
          </p>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
