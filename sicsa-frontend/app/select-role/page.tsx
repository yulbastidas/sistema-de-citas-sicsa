import Link from "next/link";
import { ShieldCheck, Stethoscope } from "lucide-react";

const roles = [
  {
    title: "Médico",
    description: "Gestiona pacientes, citas y expedientes",
    icon: <Stethoscope size={42} className="text-green-600" />,
    bg: "bg-green-100",
    href: "/login?role=doctor",
  },
  {
    title: "Administrador",
    description: "Administra usuarios, especialidades y sistema",
    icon: <ShieldCheck size={42} className="text-red-600" />,
    bg: "bg-red-100",
    href: "/login?role=admin",
  },
];

export default function StaffAccessPage() {
  return (
    <main className="min-h-screen bg-blue-50 px-6 py-16">
      <section className="mx-auto max-w-5xl">
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-extrabold text-slate-900">
            Acceso Interno
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Solo personal autorizado
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          {roles.map((role) => (
            <Link
              key={role.title}
              href={role.href}
              className="rounded-3xl bg-white p-10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <section
                className={`mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full ${role.bg}`}
              >
                {role.icon}
              </section>

              <h2 className="mb-4 text-center text-4xl font-bold text-slate-900">
                {role.title}
              </h2>

              <p className="text-center text-xl text-slate-600">
                {role.description}
              </p>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}