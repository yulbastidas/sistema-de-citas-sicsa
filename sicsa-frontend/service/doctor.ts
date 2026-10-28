const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://74.161.42.39:3000";

export async function getDoctorsBySpecialty(token: string, specialtyId: number) {
  const response = await fetch(`${API_URL}/doctors?specialtyId=${specialtyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No fue posible consultar los médicos");
  return Array.isArray(result) ? result : result?.data || [];
}
