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

export async function getSpecialties(token: string) {
  const response = await fetch(`${API_URL}/specialties`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(result, 'Error al consultar especialidades'),
    );
  }

  return result;
}