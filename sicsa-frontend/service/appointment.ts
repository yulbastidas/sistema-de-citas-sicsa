const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createAppointment(
  token: string,
  data: {
    fecha: string;
    hora: string;
    motivoConsulta: string;
  }
) {
  const response = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al crear la cita"
    );
  }

  return result;
}

export async function getMyAppointments(token: string) {
  const response = await fetch(`${API_URL}/appointments/my`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al consultar mis citas"
    );
  }

  return result;
}

export async function getAvailableAppointments(
  token: string,
  fecha: string
) {
  const response = await fetch(
    `${API_URL}/appointments/available?fecha=${encodeURIComponent(fecha)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al consultar horarios disponibles"
    );
  }

  return result;
}

export async function cancelAppointment(token: string, id: number) {
  const response = await fetch(`${API_URL}/appointments/cancel`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al cancelar cita"
    );
  }

  return result;
}

export async function getAllAppointments(token: string) {
  const response = await fetch(`${API_URL}/appointments/all`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al consultar todas las citas"
    );
  }

  return result;
}

export async function approveAppointment(token: string, id: number) {
  const response = await fetch(`${API_URL}/appointments/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al aprobar la cita"
    );
  }

  return result;
}

export async function getQueueAppointments(token: string, fecha: string) {
  const response = await fetch(
    `${API_URL}/appointments/queue?fecha=${encodeURIComponent(fecha)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al consultar la cola de citas"
    );
  }

  return result;
}

export async function adminCreateAppointment(
  token: string,
  data: {
    documento: string;
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
  }
) {
  const response = await fetch(`${API_URL}/appointments/admin-create`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al crear cita manual"
    );
  }

  return result;
}