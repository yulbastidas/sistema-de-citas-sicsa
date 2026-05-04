import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-lg font-semibold text-slate-600">
            Cargando login...
          </p>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}