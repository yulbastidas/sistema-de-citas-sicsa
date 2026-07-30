"use client";

import type {
    PatientFieldDefinition,
    PatientFormData,
} from "../types";

type PatientFieldProps = {
    definition: PatientFieldDefinition;
    value: string;
    onChange: (
        field: keyof PatientFormData,
        value: string,
    ) => void;
};

export function PatientField({
    definition,
    value,
    onChange,
}: PatientFieldProps) {
    const {
        field,
        label,
        placeholder,
        type = "text",
        multiline = false,
    } = definition;

    const inputClassName =
        "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

    const labelClassName =
        "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600";

    return (
        <article>
            <label
                htmlFor={field}
                className={labelClassName}
            >
                {label}
            </label>

            {multiline ? (
                <textarea
                    id={field}
                    name={field}
                    value={value}
                    onChange={(event) =>
                        onChange(field, event.target.value)
                    }
                    placeholder={placeholder}
                    rows={4}
                    className={`${inputClassName} resize-y`}
                />
            ) : (
                <input
                    id={field}
                    name={field}
                    value={value}
                    onChange={(event) =>
                        onChange(field, event.target.value)
                    }
                    type={type}
                    placeholder={placeholder}
                    className={inputClassName}
                />
            )}
        </article>
    );
}