import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute role="doctor">{children}</ProtectedRoute>;
}
