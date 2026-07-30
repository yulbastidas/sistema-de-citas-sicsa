const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://74.161.42.39:3000";

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
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

export type UpdateMyPatientData = {
  telefono?: string;
  email?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

export async function getMyPatient(token: string) {
  const response = await fetch(`${API_URL}/patients/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Error cargando datos del paciente",
    );
  }

  return result;
}

export async function getPatients(
  token: string,
  search = "",
) {
  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : "";

  const response = await fetch(
    `${API_URL}/patients${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Error cargando pacientes",
    );
  }

  return result;
}

export async function updatePatientByAdmin(
  token: string,
  id: number,
  data: PatientUpdateData,
) {
  const response = await fetch(
    `${API_URL}/patients/admin/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Error actualizando paciente",
    );
  }

  return result;
}

export async function updateMyPatient(
  token: string,
  data: UpdateMyPatientData,
) {
  const response = await fetch(`${API_URL}/patients/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Error actualizando el perfil",
    );
  }

  return result;
}