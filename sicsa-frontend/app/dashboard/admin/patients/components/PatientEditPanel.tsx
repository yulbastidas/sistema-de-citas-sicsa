"use client";

import {
    Building2,
    CheckCircle2,
    FileText,
    HeartPulse,
    LoaderCircle,
    MapPin,
    Phone,
    Save,
    Siren,
    UserRound,
} from "lucide-react";

import { PatientFormSection } from "./PatientFormSection";

import {
    CONTACT_FIELDS,
    EMERGENCY_FIELDS,
    HEALTH_FIELDS,
    LOCATION_FIELDS,
    PERSONAL_FIELDS,
} from "../constants";

import type {
    Patient,
    PatientFormData,
} from "../types";

type PatientEditPanelProps = {
    selectedPatient: Patient | null;
    form: PatientFormData;
    saving: boolean;
    onChange: (
        field: keyof PatientFormData,
        value: string,
    ) => void;
    onSave: () => void;
};

function getPatientFullName(patient: Patient) {
    return [
        patient.primerNombre,
        patient.segundoNombre,
        patient.primerApellido,
        patient.segundoApellido,
    ]
        .filter(Boolean)
        .join(" ");
}

export function PatientEditPanel({
    selectedPatient,
    form,
    saving,
    onChange,
    onSave,
}: PatientEditPanelProps) {
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50 px-5 py-5 sm:px-6">
                <section className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
                        <FileText size={21} />
                    </span>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900">
                            Editar información
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Consulta y actualiza la información completa del
                            paciente.
                        </p>
                    </section>
                </section>
            </header>

            {!selectedPatient ? (
                <article className="flex min-h-[680px] flex-col items-center justify-center p-8 text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                        <UserRound size={36} />
                    </span>

                    <h3 className="mt-5 text-xl font-bold text-slate-900">
                        Selecciona un paciente
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                        Elige un paciente en la lista de la izquierda para
                        consultar y actualizar su información personal,
                        médica y de emergencia.
                    </p>
                </article>
            ) : (
                <section className="p-5 sm:p-6">
                    <article className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4">
                        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <section className="flex min-w-0 items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                    <UserRound size={23} />
                                </span>

                                <section className="min-w-0">
                                    <p className="truncate text-lg font-bold capitalize text-slate-900">
                                        {getPatientFullName(selectedPatient)}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                        {selectedPatient.tipoDocumento}{" "}
                                        {selectedPatient.numeroDocumento}
                                    </p>
                                </section>
                            </section>

                            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 size={15} />
                                Paciente seleccionado
                            </span>
                        </section>
                    </article>

                    <section className="mt-6">
                        <PatientFormSection
                            title="Información personal"
                            description="Documento, nombres y apellidos registrados."
                            icon={UserRound}
                            fields={PERSONAL_FIELDS}
                            form={form}
                            onChange={onChange}
                        />
                    </section>

                    <div className="my-6 h-px bg-slate-200" />

                    <PatientFormSection
                        title="Información de contacto"
                        description="Teléfono y correo electrónico del paciente."
                        icon={Phone}
                        fields={CONTACT_FIELDS}
                        form={form}
                        onChange={onChange}
                    />

                    <div className="my-6 h-px bg-slate-200" />

                    <PatientFormSection
                        title="Información de salud"
                        description="EPS, género, fecha de nacimiento, sangre, alergias y antecedentes declarados."
                        icon={HeartPulse}
                        fields={HEALTH_FIELDS}
                        form={form}
                        onChange={onChange}
                    />

                    <article className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <section className="flex items-start gap-3">
                            <HeartPulse
                                size={19}
                                className="mt-0.5 shrink-0 text-amber-700"
                            />

                            <p className="text-xs leading-5 text-amber-900">
                                La información médica registrada corresponde
                                a datos declarados por el paciente o
                                actualizados por personal autorizado. No
                                reemplaza una valoración médica profesional.
                            </p>
                        </section>
                    </article>

                    <div className="my-6 h-px bg-slate-200" />

                    <PatientFormSection
                        title="Información de ubicación"
                        description="Departamento, municipio y dirección de residencia."
                        icon={MapPin}
                        fields={LOCATION_FIELDS}
                        form={form}
                        onChange={onChange}
                    />

                    <div className="my-6 h-px bg-slate-200" />

                    <PatientFormSection
                        title="Contacto de emergencia"
                        description="Persona que debe ser contactada en caso de emergencia."
                        icon={Siren}
                        fields={EMERGENCY_FIELDS}
                        form={form}
                        onChange={onChange}
                    />

                    <footer className="mt-7 flex justify-end border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 sm:w-auto"
                        >
                            {saving ? (
                                <LoaderCircle
                                    className="animate-spin"
                                    size={18}
                                />
                            ) : (
                                <Save size={18} />
                            )}

                            {saving
                                ? "Guardando cambios..."
                                : "Guardar cambios"}
                        </button>
                    </footer>
                </section>
            )}
        </section>
    );
}