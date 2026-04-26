"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!email || !code) {
      setMessage("❌ Ingresa el correo y el código.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await axios.post("http://localhost:3000/auth/verify-email-code", {
        email,
        code,
      });

      setMessage("✅ Correo verificado correctamente. Redirigiendo al login...");

      setTimeout(() => {
        router.push("/login?role=patient");
      }, 1500);
    } catch {
      setMessage("❌ Código inválido o correo incorrecto.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setMessage("❌ Ingresa el correo para reenviar el código.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await axios.post("http://localhost:3000/auth/send-verification-code", {
        email,
      });

      setMessage("📩 Código reenviado al correo.");
    } catch {
      setMessage("❌ No se pudo reenviar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-slate-900">
          Verificación de correo
        </h1>

        <p className="mb-6 text-center text-slate-600">
          Ingresa el código que enviamos a tu correo.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mb-4"
        />

        <input
          type="text"
          placeholder="Código de verificación"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input mb-4"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Procesando..." : "Verificar código"}
        </button>

        <button
          onClick={handleResendCode}
          disabled={loading || !email}
          className="mt-3 w-full rounded-2xl border border-blue-600 py-3 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reenviar código
        </button>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-slate-700">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <VerifyContent />
    </Suspense>
  );
}