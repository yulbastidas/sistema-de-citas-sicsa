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
  page = 1,
  limit = 20,
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);

  const response = await fetch(
    `${API_URL}/patients?${params.toString()}`,
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

export type PhoneVerificationStatus = {
  verified: boolean;
  maskedPhone: string | null;
  phoneVerifiedAt: string | null;
};

async function patientPhoneRequest(
  token: string,
  path: string,
  options?: RequestInit,
) {
  const response = await fetch(`${API_URL}/patients/me/phone/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    const message = Array.isArray(result.message)
      ? result.message.join(". ")
      : result.message;
    throw new Error(message || "No fue posible procesar la verificación");
  }
  return result;
}

export function getMyPhoneStatus(token: string): Promise<PhoneVerificationStatus> {
  return fetch(`${API_URL}/patients/me/phone-status`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (response) => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "No fue posible consultar la verificación");
    return result;
  });
}

export function requestPhoneVerification(token: string, phone: string) {
  return patientPhoneRequest(token, "send-code", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function verifyPhoneCode(
  token: string,
  challengeId: string,
  code: string,
) {
  return patientPhoneRequest(token, "verify-code", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}
