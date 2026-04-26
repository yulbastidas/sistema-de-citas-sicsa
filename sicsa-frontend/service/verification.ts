const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// 🔥 helper para evitar error de JSON vacío
async function safeJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function requestVerification(
  token: string,
  data: {
    documento: string;
    eps: string;
  }
) {
  const response = await fetch(`${API_URL}/verifications/request`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al solicitar verificación"
    );
  }

  return result;
}

export async function getAllVerifications(token: string) {
  const response = await fetch(`${API_URL}/verifications`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al consultar verificaciones"
    );
  }

  return result;
}

export async function approveVerification(token: string, id: number) {
  const response = await fetch(`${API_URL}/verifications/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al aprobar verificación"
    );
  }

  return result;
}

export async function rejectVerification(
  token: string,
  id: number,
  motivoRechazo: string
) {
  const response = await fetch(`${API_URL}/verifications/reject`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ id, motivoRechazo }),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al rechazar verificación"
    );
  }

  return result;
}

export async function getMyVerification(token: string) {
  const response = await fetch(`${API_URL}/verifications/me`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al consultar mi verificación"
    );
  }

  return result;
}

export async function expireMyVerification(token: string) {
  const response = await fetch(`${API_URL}/verifications/expire-my`, {
    method: "POST",
    headers: authHeaders(token),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Error al expirar verificación"
    );
  }

  return result;
}