import type { LucideIcon } from "lucide-react";

import { PatientField } from "./PatientField";

import type {
    PatientFieldDefinition,
    PatientFormData,
} from "../types";

type PatientFormSectionProps = {
    title: string;
    description: string;
    icon: LucideIcon;
    fields: PatientFieldDefinition[];
    form: PatientFormData;
    onChange: (
        field: keyof PatientFormData,
        value: string,
    ) => void;
    columns?: 1 | 2;
};

export function PatientFormSection({
    title,
    description,
    icon: Icon,
    fields,
    form,
    onChange,
    columns = 2,
}: PatientFormSectionProps) {
    return (
        <section>
            <header className="mb-4 flex items-start gap-2">
                <Icon
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                />

                <section>
                    <h3 className="font-bold text-slate-900">
                        {title}
                    </h3>

                    <p className="text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </section>
            </header>

            <section
                className={
                    columns === 1
                        ? "grid gap-4"
                        : "grid gap-4 md:grid-cols-2"
                }
            >
                {fields.map((definition) => (
                    <PatientField
                        key={definition.field}
                        definition={definition}
                        value={form[definition.field]}
                        onChange={onChange}
                    />
                ))}
            </section>
        </section>
    );
}