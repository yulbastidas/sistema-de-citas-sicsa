import {
    CheckCircle2,
    HeartPulse,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from "lucide-react";

import type { Patient } from "../types";

type PatientListItemProps = {
    patient: Patient;
    selected: boolean;
    onSelect: (patient: Patient) => void;
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

export function PatientListItem({
    patient,
    selected,
    onSelect,
}: PatientListItemProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(patient)}
            className={`group w-full rounded-2xl border p-3.5 text-left transition ${selected
                    ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                    : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-sm"
                }`}
        >
            <header className="flex items-start justify-between gap-3">
                <section className="flex min-w-0 items-center gap-3">
                    <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-500 shadow-sm"
                            }`}
                    >
                        <UserRound size={20} />
                    </span>

                    <section className="min-w-0">
                        <p className="truncate font-bold capitalize text-slate-900">
                            {getPatientFullName(patient)}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {patient.tipoDocumento}{" "}
                            {patient.numeroDocumento}
                        </p>
                    </section>
                </section>

                {selected && (
                    <CheckCircle2
                        size={20}
                        className="shrink-0 text-blue-600"
                    />
                )}
            </header>

            <section className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail
                        size={15}
                        className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                        {patient.email || "Correo no registrado"}
                    </span>
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone
                        size={15}
                        className="shrink-0 text-slate-400"
                    />

                    <span>
                        {patient.telefono ||
                            "Teléfono no registrado"}
                    </span>
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <HeartPulse
                        size={15}
                        className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                        {patient.eps || "EPS no registrada"}
                    </span>
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin
                        size={15}
                        className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                        {patient.municipio || "Sin municipio"},{" "}
                        {patient.departamento ||
                            "Sin departamento"}
                    </span>
                </p>
            </section>
        </button>
    );
}
