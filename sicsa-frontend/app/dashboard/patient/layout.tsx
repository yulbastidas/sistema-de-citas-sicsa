import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute role="patient">{children}</ProtectedRoute>;
}
