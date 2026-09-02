import {
    ShieldCheck,
} from "lucide-react";
import AdminSidebar from "@/app/components/AdminSidebar";

type AdminPatientsHeaderProps = {
    patientsCount: number;
};

export function AdminPatientsHeader({
    patientsCount,
}: AdminPatientsHeaderProps) {
    return (
        <header className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
            <AdminSidebar />
            <section className="px-6 py-6 sm:px-8">
            <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <span className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-teal-400/10 blur-3xl" />

            <section className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <section>
                    <section>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
            </section>
        </header>
    );
}
