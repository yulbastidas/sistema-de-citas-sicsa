"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";

import {
    forgotPassword,
    resetPassword,
    verifyResetCode,
} from "@/service/auth";

type RecoveryStep = 1 | 2 | 3;

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<RecoveryStep>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    const handleRequestCode = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        clearMessages();

        if (!email.trim()) {
            setError("Ingresa tu correo");
            return;
        }

        try {
            setLoading(true);

            const response = await forgotPassword(email);

            setEmail(email.trim().toLowerCase());
            setMessage(response.message);
            setStep(2);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible enviar el código",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        clearMessages();

        if (!/^\d{6}$/.test(code)) {
            setError("El código debe tener seis números");
            return;
        }

        try {
            setLoading(true);

            const response = await verifyResetCode(email, code);

            if (!response.valid) {
                setError("El código no es válido");
                return;
            }

            setMessage("Código verificado correctamente");
            setStep(3);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible verificar el código",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        clearMessages();

        if (newPassword.length < 8) {
            setError("La contraseña debe tener mínimo ocho caracteres");
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            setError("La contraseña debe tener una mayúscula");
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            setError("La contraseña debe tener una minúscula");
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setError("La contraseña debe tener un número");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            setLoading(true);

            const response = await resetPassword(
                email,
                code,
                newPassword,
                confirmPassword,
            );

            alert(response.message);
            router.replace("/login?role=patient");
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible cambiar la contraseña",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        clearMessages();

        try {
            setLoading(true);

            const response = await forgotPassword(email);

            setCode("");
            setMessage(response.message);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "No fue posible reenviar el código",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl">
                <Link
                    href="/login?role=patient"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                    <ArrowLeft size={18} />
                    Volver al inicio de sesión
                </Link>

                <section className="mb-6 flex gap-2">
                    <span
                        className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-slate-200"
                            }`}
                    />
                    <span
                        className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-slate-200"
                            }`}
                    />
                    <span
                        className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-blue-600" : "bg-slate-200"
                            }`}
                    />
                </section>

                <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                    Paso {step} de 3
                </p>

                <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
                    {step === 1 && "Recuperar contraseña"}
                    {step === 2 && "Verificar código"}
                    {step === 3 && "Nueva contraseña"}
                </h1>

                {message && (
                    <section className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 size={20} />
                        <p>{message}</p>
                    </section>
                )}

                {error && (
                    <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </section>
                )}

                {step === 1 && (
                    <form
                        onSubmit={handleRequestCode}
                        className="mt-8 space-y-6"
                    >
                        <section>
                            <label className="mb-2 block font-semibold text-slate-800">
                                Correo electrónico
                            </label>

                            <section className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="tu@email.com"
                                    disabled={loading}
                                    className="input pl-12"
                                />
                            </section>
                        </section>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <KeyRound size={20} />
                            )}

                            {loading ? "Enviando..." : "Enviar código"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form
                        onSubmit={handleVerifyCode}
                        className="mt-8 space-y-6"
                    >
                        <section>
                            <label className="mb-2 block font-semibold text-slate-800">
                                Código de seis dígitos
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value.replace(/\D/g, ""))
                                }
                                placeholder="000000"
                                disabled={loading}
                                className="input text-center text-2xl font-bold tracking-[0.4em]"
                            />
                        </section>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <ShieldCheck size={20} />
                            )}

                            {loading ? "Verificando..." : "Verificar código"}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="w-full text-center text-sm font-semibold text-blue-700 hover:underline"
                        >
                            Reenviar código
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form
                        onSubmit={handleResetPassword}
                        className="mt-8 space-y-6"
                    >
                        <section>
                            <label className="mb-2 block font-semibold text-slate-800">
                                Nueva contraseña
                            </label>

                            <section className="relative">
                                <LockKeyhole
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    placeholder="Nueva contraseña"
                                    disabled={loading}
                                    className="input px-12"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword((previous) => !previous)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                                >
                                    {showNewPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </section>
                        </section>

                        <section>
                            <label className="mb-2 block font-semibold text-slate-800">
                                Confirmar contraseña
                            </label>

                            <section className="relative">
                                <LockKeyhole
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Confirma la contraseña"
                                    disabled={loading}
                                    className="input px-12"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((previous) => !previous)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </section>
                        </section>

                        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                            Mínimo ocho caracteres, una mayúscula, una minúscula y un número.
                        </section>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <LockKeyhole size={20} />
                            )}

                            {loading ? "Actualizando..." : "Cambiar contraseña"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}