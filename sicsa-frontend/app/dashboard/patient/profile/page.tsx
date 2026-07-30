"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    getMyPatient,
    updateMyPatient,
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
                <button
                    type="button"
                    onClick={() => router.push("/dashboard/patient")}
                    className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-700 shadow transition hover:bg-slate-50"
                >
                    <ArrowLeft size={19} />
                    Volver al inicio
                </button>

                <header className="rounded-[2rem] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-8 py-8 text-white shadow-xl">
                    <section className="flex items-center gap-4">
                        <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
                            <UserRound size={32} />
                        </figure>

                        <section>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                Portal del paciente
                            </p>

                            <h1 className="mt-2 text-3xl font-bold">
                                Mi perfil
                            </h1>

                            <p className="mt-2 text-cyan-50">
                                Consulta tus datos personales y actualiza la
                                información permitida.
                            </p>
                        </section>
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