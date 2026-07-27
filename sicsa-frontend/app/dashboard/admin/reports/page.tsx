"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    BarChart3,
    CalendarCheck2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ShieldAlert,
    UsersRound,
    XCircle,
} from "lucide-react";
import AdminSidebar from "@/app/components/AdminSidebar";
import {
    getToken,
    getUser,
    type SessionUser,
} from "@/service/session";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://74.161.42.39:3000";

type PermissionTestResponse = {
    success?: boolean;
    message?: string;
};

export default function ReportsPage() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [testingPermission, setTestingPermission] = useState(false);
    const [permissionMessage, setPermissionMessage] = useState("");

    useEffect(() => {
        const token = getToken();
        const user = getUser() as SessionUser | null;

        if (!token || !user) {
            router.replace("/login?role=admin");
            return;
        }

        const isAdmin =
            user.role === "admin" ||
            user.role === 1 ||
            user.role === "1";

        /*
         * Esta página exige dos condiciones:
         * 1. El usuario debe ser administrador.
         * 2. Debe tener permiso para visualizar reportes.
         */
        if (!isAdmin || user.canViewReports !== true) {
            router.replace("/dashboard/admin");
            return;
        }

        setCheckingAuth(false);
    }, [router]);

    const testBackendPermission = async () => {
        const token = getToken();

        if (!token) {
            router.replace("/login?role=admin");
            return;
        }

        try {
            setTestingPermission(true);
            setPermissionMessage("");

            const response = await fetch(`${API_URL}/reports/test`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const result =
                (await response.json()) as PermissionTestResponse;

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "No tienes autorización para consultar reportes",
                );
            }

            setPermissionMessage(
                result.message ||
                "Permiso de reportes verificado correctamente",
            );
        } catch (error: unknown) {
            if (error instanceof Error) {
                setPermissionMessage(error.message);
            } else {
                setPermissionMessage(
                    "No fue posible verificar el permiso",
                );
            }
        } finally {
            setTestingPermission(false);
        }
    };

    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <section className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
                    <p className="font-semibold text-slate-600">
                        Verificando permisos...
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen bg-slate-100">
            <AdminSidebar />

            <section className="min-w-0 flex-1 px-8 py-10">
                <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-8 py-8 text-white shadow-xl">
                    <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                        <article className="flex items-start gap-4">
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                                <BarChart3 size={30} />
                            </span>

                            <section>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                                    Módulo exclusivo
                                </p>

                                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                                    Reportes y estadísticas
                                </h1>

                                <p className="mt-2 max-w-3xl text-slate-200">
                                    Consulta indicadores de citas, pacientes,
                                    atención y comportamiento operativo del
                                    sistema SICSA.
                                </p>
                            </section>
                        </article>

                        <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                            <p className="text-sm text-blue-100">
                                Acceso autorizado
                            </p>

                            <p className="mt-1 font-semibold text-white">
                                Ingeniero del sistema
                            </p>
                        </article>
                    </section>
                </header>

                <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <header className="flex items-center justify-between">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <CalendarDays size={23} />
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                General
                            </span>
                        </header>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Total de citas
                        </p>

                        <p className="mt-2 text-4xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Citas registradas en el sistema
                        </p>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <header className="flex items-center justify-between">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <CalendarCheck2 size={23} />
                            </span>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Atención
                            </span>
                        </header>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Citas atendidas
                        </p>

                        <p className="mt-2 text-4xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Pacientes atendidos correctamente
                        </p>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <header className="flex items-center justify-between">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                                <UsersRound size={23} />
                            </span>

                            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                Usuarios
                            </span>
                        </header>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Total de pacientes
                        </p>

                        <p className="mt-2 text-4xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Pacientes registrados en SICSA
                        </p>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <header className="flex items-center justify-between">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                <Clock3 size={23} />
                            </span>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Mensual
                            </span>
                        </header>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Citas del mes
                        </p>

                        <p className="mt-2 text-4xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Actividad registrada este mes
                        </p>
                    </article>
                </section>

                <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <header className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <Activity size={23} />
                            </span>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Indicadores del sistema
                                </h2>

                                <p className="mt-1 text-slate-600">
                                    Aquí se visualizarán las estadísticas
                                    obtenidas directamente desde la base de datos.
                                </p>
                            </section>
                        </header>

                        <section className="mt-7 grid gap-4 md:grid-cols-3">
                            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                <CheckCircle2
                                    size={22}
                                    className="text-emerald-700"
                                />

                                <p className="mt-4 text-sm font-medium text-emerald-800">
                                    Confirmadas
                                </p>

                                <p className="mt-1 text-3xl font-bold text-emerald-900">
                                    0
                                </p>
                            </article>

                            <article className="rounded-2xl border border-red-200 bg-red-50 p-5">
                                <XCircle
                                    size={22}
                                    className="text-red-700"
                                />

                                <p className="mt-4 text-sm font-medium text-red-800">
                                    Canceladas
                                </p>

                                <p className="mt-1 text-3xl font-bold text-red-900">
                                    0
                                </p>
                            </article>

                            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                <ShieldAlert
                                    size={22}
                                    className="text-amber-700"
                                />

                                <p className="mt-4 text-sm font-medium text-amber-800">
                                    Inasistencias
                                </p>

                                <p className="mt-1 text-3xl font-bold text-amber-900">
                                    0
                                </p>
                            </article>
                        </section>

                        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <BarChart3
                                className="mx-auto text-slate-400"
                                size={36}
                            />

                            <p className="mt-3 font-semibold text-slate-700">
                                Próximamente: gráficos estadísticos
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                En el siguiente paso conectaremos las tarjetas
                                con datos reales y agregaremos gráficos.
                            </p>
                        </section>
                    </article>

                    <aside className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Verificar seguridad
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Esta prueba consulta el endpoint protegido del
                            backend y confirma que tu JWT contiene el permiso
                            para visualizar reportes.
                        </p>

                        <button
                            type="button"
                            onClick={testBackendPermission}
                            disabled={testingPermission}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <ShieldAlert size={18} />

                            {testingPermission
                                ? "Verificando..."
                                : "Probar acceso al backend"}
                        </button>

                        {permissionMessage && (
                            <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                <p className="text-sm font-medium leading-6 text-blue-900">
                                    {permissionMessage}
                                </p>
                            </section>
                        )}

                        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm font-semibold text-slate-900">
                                Estado actual
                            </p>

                            <ul className="mt-3 space-y-3 text-sm text-slate-600">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={17}
                                        className="text-emerald-600"
                                    />
                                    Menú exclusivo configurado
                                </li>

                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={17}
                                        className="text-emerald-600"
                                    />
                                    Ruta protegida en frontend
                                </li>

                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={17}
                                        className="text-emerald-600"
                                    />
                                    Endpoint protegido en backend
                                </li>
                            </ul>
                        </section>
                    </aside>
                </section>
            </section>
        </main>
    );
}