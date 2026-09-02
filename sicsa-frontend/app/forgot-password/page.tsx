"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
} from "lucide-react";

import {
    forgotPassword,
    forgotPasswordByPhone,
    resetPassword,
    resetPasswordByPhone,
    verifyPhoneResetCode,
    verifyResetCode,
    ApiRequestError,
} from "@/service/auth";
import { notifySicsa as alert } from "@/app/components/SicsaFeedback";

type RecoveryStep = 1 | 2 | 3;
type RecoveryChannel = "email" | "phone";

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get("role");
    const selectedRole = role === "doctor" || role === "admin" ? role : "patient";
    const patientRecovery = selectedRole === "patient";

    const [step, setStep] = useState<RecoveryStep>(1);
    const [channel, setChannel] = useState<RecoveryChannel>("email");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [maskedPhone, setMaskedPhone] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);
    const [resendSeconds, setResendSeconds] = useState(0);

    useEffect(() => {
        if (resendSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendSeconds]);

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    const handleRequestCode = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        clearMessages();

        if (channel === "email" && !/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError("Ingresa un correo electrónico válido");
            return;
        }

        if (channel === "phone" && !/^3\d{9}$/.test(phone.trim())) {
            setError("Ingresa un celular colombiano válido de 10 dígitos");
            return;
        }

        try {
            setLoading(true);

            let responseMessage: string;
            if (channel === "email") {
                const response = await forgotPassword(email);
                setEmail(email.trim().toLowerCase());
                responseMessage = response.message;
            } else {
                const response = await forgotPasswordByPhone(phone);
                setPhone(phone.trim());
                setChallengeId(response.challengeId);
                setMaskedPhone(response.maskedPhone);
                setResendSeconds(60);
                responseMessage = response.message;
            }
            setMessage(responseMessage);
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

            const response = channel === "email"
                ? await verifyResetCode(email, code)
                : await verifyPhoneResetCode(phone, challengeId, code);

            if (!response.valid) {
                setError("El código no es válido");
                return;
            }

            if (channel === "phone") {
                const phoneResponse = response as Awaited<
                    ReturnType<typeof verifyPhoneResetCode>
                >;
                setResetToken(phoneResponse.resetToken);
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

            const response = channel === "email"
                ? await resetPassword(
                    email,
                    code,
                    newPassword,
                    confirmPassword,
                )
                : await resetPasswordByPhone(
                    phone,
                    resetToken,
                    newPassword,
                    confirmPassword,
                );

            alert(response.message);
            router.replace(`/login?role=${selectedRole}`);
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

            setCode("");
            if (channel === "email") {
                const response = await forgotPassword(email);
                setMessage(response.message);
            } else {
                const response = await forgotPasswordByPhone(phone);
                setChallengeId(response.challengeId);
                setMaskedPhone(response.maskedPhone);
                setResendSeconds(60);
                setMessage(response.message);
            }
        } catch (requestError: unknown) {
            if (requestError instanceof ApiRequestError && requestError.retryAfterSeconds) {
                setResendSeconds(requestError.retryAfterSeconds);
            }
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
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_12%_85%,rgba(8,145,178,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#082f49_48%,#0c4a6e_100%)] px-4 py-8 sm:py-10">
            <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <section className="relative mx-auto max-w-xl rounded-[2rem] border border-cyan-100/25 bg-white p-6 shadow-[0_32px_90px_-28px_rgba(2,132,199,0.42)] sm:p-8">
                <header className="mb-7 flex items-center gap-3 border-b border-sky-100 pb-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/20">
                        <ShieldCheck size={23} />
                    </span>
                    <div>
                        <p className="font-extrabold tracking-wide text-slate-950">SICSA</p>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Recuperación segura</p>
                    </div>
                </header>
                <Link
                    href={`/login?role=${selectedRole}`}
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
                        {patientRecovery && (
                            <section>
                                <p className="mb-3 font-semibold text-slate-800">
                                    ¿Cómo deseas recuperar tu contraseña?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setChannel("email"); clearMessages(); }}
                                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${channel === "email" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                                    >
                                        Correo electrónico
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setChannel("phone"); clearMessages(); }}
                                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${channel === "phone" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                                    >
                                        Número de celular
                                    </button>
                                </div>
                            </section>
                        )}
                        <section>
                            <label className="mb-2 block font-semibold text-slate-800">
                                {channel === "email" ? "Correo electrónico" : "Número de celular"}
                            </label>

                            <section className="relative">
                                {channel === "email" ? <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={20}
                                /> : <Phone
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={20}
                                />}

                                <input
                                    type={channel === "email" ? "email" : "tel"}
                                    inputMode={channel === "phone" ? "numeric" : "email"}
                                    value={channel === "email" ? email : phone}
                                    onChange={(event) => channel === "email"
                                        ? setEmail(event.target.value)
                                        : setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder={channel === "email" ? "Correo electrónico" : "Número de celular"}
                                    disabled={loading}
                                    className="input input-with-leading-icon"
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
                            {channel === "phone" && maskedPhone && (
                                <p className="mb-4 rounded-xl bg-blue-50 p-3 text-center text-sm text-blue-800">
                                    Código enviado a {maskedPhone}
                                </p>
                            )}
                            <label className="mb-2 block font-semibold text-slate-800">
                                Código de seis dígitos
                            </label>

                            <RecoveryCodeFields value={code} onChange={setCode} disabled={loading} />
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
                            disabled={loading || (channel === "phone" && resendSeconds > 0)}
                            className="w-full text-center text-sm font-semibold text-blue-700 hover:underline"
                        >
                            {channel === "phone" && resendSeconds > 0
                                ? `Podrás reenviar en ${resendSeconds} s`
                                : "Reenviar código"}
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
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                                    className="input input-with-leading-icon input-with-trailing-action"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword((previous) => !previous)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                                    className="input input-with-leading-icon input-with-trailing-action"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((previous) => !previous)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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

function RecoveryCodeFields({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);
    const setDigit = (index: number, rawValue: string) => {
        const digit = rawValue.replace(/\D/g, "").slice(-1);
        const digits = value.padEnd(6, " ").split("");
        digits[index] = digit || " ";
        onChange(digits.join("").trimEnd());
        if (digit && index < 5) refs.current[index + 1]?.focus();
    };

    return (
        <div
            className="grid grid-cols-6 gap-2 sm:gap-3"
            role="group"
            aria-label="Código de recuperación de seis dígitos"
            onPaste={(event) => {
                const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!pasted) return;
                event.preventDefault();
                onChange(pasted);
                refs.current[Math.min(pasted.length, 6) - 1]?.focus();
            }}
        >
            {Array.from({ length: 6 }, (_, index) => (
                <input
                    key={index}
                    ref={(element) => { refs.current[index] = element; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={value[index] ?? ""}
                    disabled={disabled}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Backspace" && !value[index] && index > 0) {
                            refs.current[index - 1]?.focus();
                        }
                    }}
                    aria-label={`Dígito ${index + 1} de 6`}
                    className="aspect-square min-w-0 rounded-xl border-2 border-slate-200 text-center text-xl font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            ))}
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900" />}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
