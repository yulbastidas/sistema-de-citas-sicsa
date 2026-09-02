"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Phone, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    getMyPatient,
    getMyPhoneStatus,
    requestPhoneVerification,
    updateMyPatient,
    verifyPhoneCode,
    type PhoneVerificationStatus,
} from "@/service/patient";
import { getToken } from "@/service/session";

type PatientProfile = {
    id: number;
    userId: number;
    tipoDocumento?: string;
    numeroDocumento?: string;
    primerNombre?: string;
    segundoNombre?: string;
    primerApellido?: string;
    segundoApellido?: string;
    telefono?: string;
    email?: string;
    eps?: string;
    genero?: string;
    fechaNacimiento?: string;
    departamento?: string;
    municipio?: string;
};

export default function PatientProfilePage() {
    const router = useRouter();

    const [patient, setPatient] =
        useState<PatientProfile | null>(null);

    const [telefono, setTelefono] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [municipio, setMunicipio] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [phoneStatus, setPhoneStatus] = useState<PhoneVerificationStatus | null>(null);
    const [challengeId, setChallengeId] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [phoneActionLoading, setPhoneActionLoading] = useState(false);
    const [phoneMessage, setPhoneMessage] = useState("");
    const [phoneResendSeconds, setPhoneResendSeconds] = useState(0);

    useEffect(() => {
        if (phoneResendSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setPhoneResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [phoneResendSeconds]);

    useEffect(() => {
        async function loadPatient() {
            try {
                setLoading(true);
                setError("");

                const token = getToken();

                if (!token) {
                    router.push("/login?role=patient");
                    return;
                }

                const data = await getMyPatient(token);

                setPatient(data);
                setTelefono(data.telefono || "");
                setDepartamento(data.departamento || "");
                setMunicipio(data.municipio || "");
                try {
                    setPhoneStatus(await getMyPhoneStatus(token));
                } catch {
                    // Compatibilidad temporal con el backend remoto anterior.
                    setPhoneStatus(null);
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "No fue posible cargar el perfil";

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        loadPatient();
    }, [router]);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const token = getToken();

            if (!token) {
                router.push("/login?role=patient");
                return;
            }

            const result = await updateMyPatient(token, {
                telefono,
                departamento,
                municipio,
            });

            setPatient(result.patient);
            setMessage(
                result.message || "Perfil actualizado correctamente",
            );
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "No fue posible actualizar el perfil";

            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    }

    async function handleRequestPhoneCode() {
        const token = getToken();
        if (!token) return router.push("/login?role=patient");
        try {
            setPhoneActionLoading(true);
            setPhoneMessage("");
            const result = await requestPhoneVerification(token, telefono);
            setChallengeId(result.challengeId);
            setPhoneResendSeconds(60);
            setPhoneMessage(`Código enviado a ${result.maskedPhone}`);
        } catch (err) {
            setPhoneMessage(err instanceof Error ? err.message : "No fue posible enviar el código");
        } finally {
            setPhoneActionLoading(false);
        }
    }

    async function handleVerifyPhoneCode() {
        const token = getToken();
        if (!token) return router.push("/login?role=patient");
        try {
            setPhoneActionLoading(true);
            const result = await verifyPhoneCode(token, challengeId, otpCode);
            setPhoneStatus({ verified: true, maskedPhone: result.maskedPhone, phoneVerifiedAt: result.phoneVerifiedAt });
            setChallengeId("");
            setOtpCode("");
            setPhoneMessage(result.message);
        } catch (err) {
            setPhoneMessage(err instanceof Error ? err.message : "Código inválido o vencido");
        } finally {
            setPhoneActionLoading(false);
        }
    }

    const fullName = [
        patient?.primerNombre,
        patient?.segundoNombre,
        patient?.primerApellido,
        patient?.segundoApellido,
    ]
        .filter(Boolean)
        .join(" ");

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <section className="flex items-center gap-3 rounded-3xl bg-white px-8 py-6 shadow-lg">
                    <Loader2 className="animate-spin text-cyan-600" />
                    <p className="font-medium text-slate-700">
                        Cargando perfil...
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-10">
            <section className="mx-auto max-w-5xl">
                <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 px-6 py-6 text-white shadow-xl sm:px-8">
                    <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <section className="flex items-center gap-4">
                        <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-inner">
                            <UserRound size={32} />
                        </figure>

                        <section>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                Portal del paciente
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                                Mi perfil
                            </h1>

                            <p className="mt-2 text-cyan-50">
                                Consulta tus datos personales y actualiza la
                                información permitida.
                            </p>
                        </section>
                      </section>

                      <button
                          type="button"
                          onClick={() => router.push("/dashboard/patient")}
                          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 sm:self-auto"
                      >
                          <ArrowLeft size={17} />
                          Volver al panel
                      </button>
                    </section>
                </header>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <article className="rounded-[2rem] bg-white p-7 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800">
                            Datos personales
                        </h2>

                        <section className="mt-6 space-y-5">
                            <ProfileItem
                                label="Nombre completo"
                                value={fullName || "No registrado"}
                            />

                            <ProfileItem
                                label="Documento"
                                value={`${patient?.tipoDocumento || ""} ${patient?.numeroDocumento || ""
                                    }`.trim()}
                            />

                            <ProfileItem
                                label="Correo electrónico"
                                value={patient?.email || "No registrado"}
                            />

                            <ProfileItem
                                label="EPS"
                                value={patient?.eps || "No registrada"}
                            />

                            <ProfileItem
                                label="Género"
                                value={patient?.genero || "No registrado"}
                            />

                            <ProfileItem
                                label="Fecha de nacimiento"
                                value={
                                    patient?.fechaNacimiento || "No registrada"
                                }
                            />
                        </section>
                    </article>

                    <article className="rounded-[2rem] bg-white p-7 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800">
                            Información editable
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Puedes modificar tu teléfono y ubicación.
                        </p>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 space-y-5"
                        >
                            <Field
                                label="Teléfono"
                                value={telefono}
                                onChange={setTelefono}
                                placeholder="Ejemplo: 3001234567"
                            />

                            <Field
                                label="Departamento"
                                value={departamento}
                                onChange={setDepartamento}
                                placeholder="Ejemplo: Nariño"
                            />

                            <Field
                                label="Municipio"
                                value={municipio}
                                onChange={setMunicipio}
                                placeholder="Ejemplo: Pasto"
                            />

                            {message && (
                                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                    {message}
                                </p>
                            )}

                            {error && (
                                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2
                                        size={19}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={19} />
                                )}

                                {saving
                                    ? "Guardando..."
                                    : "Guardar cambios"}
                            </button>
                        </form>

                        {phoneStatus && (
                            <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                                <div className="flex items-start gap-3">
                                    {phoneStatus.verified ? <CheckCircle2 className="text-emerald-600" /> : <Phone className="text-cyan-700" />}
                                    <div>
                                        <h3 className="font-bold text-slate-800">Verificación del celular</h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {phoneStatus.verified
                                                ? `Celular verificado ${phoneStatus.maskedPhone}`
                                                : `Para utilizar tu celular como método de acceso debes verificarlo. Celular ******${telefono.replace(/\D/g, "").slice(-4)}`}
                                        </p>
                                    </div>
                                </div>

                                {!challengeId ? (
                                    <button type="button" onClick={handleRequestPhoneCode} disabled={phoneActionLoading || !telefono} className="mt-4 w-full rounded-xl border border-cyan-600 px-4 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-50">
                                        {phoneStatus.verified ? "Verificar un nuevo número" : "Verificar celular"}
                                    </button>
                                ) : (
                                    <div className="mt-4 space-y-3">
                                        <OtpCodeFields value={otpCode} onChange={setOtpCode} />
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <button type="button" onClick={handleVerifyPhoneCode} disabled={phoneActionLoading || otpCode.length !== 6} className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Confirmar código</button>
                                            <button type="button" onClick={handleRequestPhoneCode} disabled={phoneActionLoading || phoneResendSeconds > 0} className="rounded-xl border border-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-800 disabled:opacity-50">
                                                {phoneResendSeconds > 0 ? `Reenviar en ${phoneResendSeconds} s` : "Reenviar código"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {phoneMessage && <p className="mt-3 text-sm font-medium text-slate-700">{phoneMessage}</p>}
                            </section>
                        )}
                    </article>
                </section>
            </section>
        </main>
    );
}

type ProfileItemProps = {
    label: string;
    value: string;
};

function ProfileItem({
    label,
    value,
}: ProfileItemProps) {
    return (
        <section className="border-b border-slate-100 pb-4">
            <p className="text-sm font-medium text-slate-500">
                {label}
            </p>

            <p className="mt-1 font-semibold text-slate-800">
                {value || "No registrado"}
            </p>
        </section>
    );
}

type FieldProps = {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
};

function Field({
    label,
    value,
    placeholder,
    onChange,
}: FieldProps) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-slate-700">
                {label}
            </span>

            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
        </label>
    );
}

function OtpCodeFields({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
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
            className="grid grid-cols-6 gap-2"
            role="group"
            aria-label="Código de verificación de seis dígitos"
            onPaste={(event) => {
                const pasted = event.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);
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
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Backspace" && !value[index] && index > 0) {
                            refs.current[index - 1]?.focus();
                        }
                    }}
                    aria-label={`Dígito ${index + 1} de 6`}
                    className="aspect-square min-w-0 rounded-xl border border-cyan-200 bg-white text-center text-lg font-bold text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
            ))}
        </div>
    );
}
