"use client";

import {
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

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

  useEffect(() => {
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleVerify = async () => {
    if (!email) {
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

      await axios.post(`${API_URL}/auth/verify-email-code`, {
        email,
        code,
      });

      setMessageType("success");
      setMessage(
        "Correo verificado correctamente. Redirigiendo al inicio de sesión...",
      );

      setTimeout(() => {
        router.push("/login?role=patient");
      }, 1500);
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage("El código es inválido o ha expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setMessageType("error");
      setMessage("No se encontró el correo.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      await axios.post(`${API_URL}/auth/send-verification-code`, {
        email,
      });

      setCode("");

      setMessageType("info");
      setMessage("Se envió un nuevo código a tu correo.");
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage("No se pudo reenviar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center text-white">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg">
            <ShieldCheck
              className="text-blue-600"
              size={40}
            />
          </div>

          <h1 className="text-3xl font-extrabold">
            Verifica tu correo
          </h1>

          <p className="mt-3 text-blue-100">
            Hemos enviado un código de verificación a tu correo.
          </p>
        </header>

        <section className="p-8">
          <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Mail
                className="mt-1 text-blue-600"
                size={20}
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Correo electrónico
                </p>

                <p className="mt-1 break-all font-medium text-slate-800">
                  {email}
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

            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <p className="mt-2 text-center text-xs text-slate-500">
              Ingresa los 6 dígitos enviados a tu correo.
            </p>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-600 py-4 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={20} />
            Reenviar código
          </button>

          {message && (
            <section
              className={`mt-5 rounded-2xl border p-4 text-center text-sm font-medium ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : messageType === "info"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </section>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            Si no encuentras el correo, revisa la carpeta de spam o correo no deseado.
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
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
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