const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type PatientUpdateData = {
  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  email?: string;
  eps?: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
};

export async function getPatients(token: string, search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  const response = await fetch(`${API_URL}/patients${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Error cargando pacientes");
  }

  return result;
}

export async function updatePatientByAdmin(
  token: string,
  id: number,
  data: PatientUpdateData,
) {
  const response = await fetch(`${API_URL}/patients/admin/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Error actualizando paciente");
  }

  return result;
}
