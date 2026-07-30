import {
    ShieldCheck,
    UsersRound,
} from "lucide-react";

type AdminPatientsHeaderProps = {
    patientsCount: number;
};

export function AdminPatientsHeader({
    patientsCount,
}: AdminPatientsHeaderProps) {
    return (
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
            <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

            <span className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-indigo-400/10 blur-3xl" />

            <section className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <section className="flex items-start gap-4">
                    <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur sm:h-16 sm:w-16">
                        <UsersRound size={30} />
                    </figure>

                    <section>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-sm">
                            Gestión administrativa
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Actualización de pacientes
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
                            Busca pacientes registrados y actualiza su
                            información personal, datos de contacto,
                            ubicación, información médica y contacto de
                            emergencia.
                        </p>
                    </section>
                </section>

                <article className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                        <ShieldCheck size={22} />
                    </span>

                    <section>
                        <p className="text-sm text-slate-300">
                            Pacientes encontrados
                        </p>

                        <p className="mt-0.5 text-2xl font-bold">
                            {patientsCount}
                        </p>
                    </section>
                </article>
            </section>
        </header>
    );
}