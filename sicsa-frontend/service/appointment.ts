const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildErrorMessage(result: unknown, fallback: string): string {
  if (
    result &&
    typeof result === 'object' &&
    'message' in result &&
    Array.isArray((result as { message?: unknown }).message)
  ) {
    return ((result as { message: string[] }).message).join(', ');
  }

  if (
    result &&
    typeof result === 'object' &&
    'message' in result &&
    typeof (result as { message?: unknown }).message === 'string'
  ) {
    return (result as { message: string }).message;
  }

  return fallback;
}

export async function createAppointment(
  token: string,
  data: {
    specialtyId: number;
    fecha: string;
    hora: string;
    motivoConsulta: string;
    eps?: string;
    epsId?: number;
    departamento?: string;
    municipio?: string;
    appointmentClassId?: number;
    observaciones?: string;
  },
) {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al crear la cita'));
  }

  return result;
}

export async function getMyAppointments(token: string) {
  const response = await fetch(`${API_URL}/appointments/my`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al consultar mis citas'));
  }

  return result;
}

export async function getAvailableAppointments(
  token: string,
  fecha: string,
) {
  const response = await fetch(
    `${API_URL}/appointments/available?fecha=${encodeURIComponent(fecha)}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar horarios disponibles'),
    );
  }

  return result;
}

export async function cancelAppointment(token: string, id: number) {
  const response = await fetch(`${API_URL}/appointments/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al cancelar cita'));
  }

  return result;
}

export async function getAllAppointments(token: string) {
  const response = await fetch(`${API_URL}/appointments/all`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar todas las citas'),
    );
  }

  return result;
}

export async function getDoctorAppointments(
  token: string,
  doctorId: number,
) {
  const response = await fetch(`${API_URL}/appointments/doctor/${doctorId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar las citas del doctor'),
    );
  }

  return result;
}

export async function approveAppointment(token: string, id: number) {
  const response = await fetch(`${API_URL}/appointments/approve`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al aprobar la cita'));
  }

  return result;
}

export async function getQueueAppointments(
  token: string,
  fecha: string,
  doctorId?: number,
) {
  const params = new URLSearchParams();
  params.set('fecha', fecha);

  if (typeof doctorId === 'number') {
    params.set('doctorId', String(doctorId));
  }

  const response = await fetch(`${API_URL}/appointments/queue?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar la cola de citas'),
    );
  }

  return result;
}

export async function adminCreateAppointment(
  token: string,
  data: {
    documento: string;
    specialtyId: number;
    fecha: string;
    hora: string;
    motivoConsulta: string;
    edad?: number;
    embarazada?: boolean;
    discapacidad?: boolean;
    dolorIntenso?: boolean;
    sangrado?: boolean;
    dificultadRespiratoria?: boolean;
    fiebre?: boolean;
    eps?: string;
    epsId?: number;
    departamento?: string;
    municipio?: string;
    appointmentClassId?: number;
    observaciones?: string;
  },
) {
  const response = await fetch(`${API_URL}/appointments/admin-create`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al crear cita manual'));
  }

  return result;
}

export async function getMedicalReport(
  token: string,
  appointmentId: number,
) {
  const response = await fetch(`${API_URL}/medical-reports/${appointmentId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar el reporte clínico'),
    );
  }

  return result;
}

export async function saveMedicalReport(
  token: string,
  data: {
    appointmentId: number;
    enfermedadActual: string;
    antecedentes: string;
    signosVitales: string;
    examenFisico: string;
    diagnostico: string;
    tratamiento: string;
    observaciones: string;
  },
) {
  const response = await fetch(`${API_URL}/medical-reports`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al guardar el reporte clínico'),
    );
  }

  return result;
}

export async function downloadAppointmentPdf(
  token: string,
  appointmentId: number,
) {
  const response = await fetch(`${API_URL}/appointments/${appointmentId}/pdf`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await parseResponse(response);

    throw new Error(buildErrorMessage(result, 'Error al descargar el PDF'));
  }

  return response.blob();
}

export async function getEpsCatalog() {
  const response = await fetch(`${API_URL}/eps`, {
    method: 'GET',
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(result, 'Error al consultar EPS'));
  }

  return result;
}

export async function getAppointmentClasses() {
  const response = await fetch(`${API_URL}/appointment-class`, {
    method: 'GET',
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar clases de cita'),
    );
  }

  return result;
}