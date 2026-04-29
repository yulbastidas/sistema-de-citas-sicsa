const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function registerPatient(data: {
  email: string;
  password: string;
  role: "patient";
  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  eps?: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
}) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      primerNombre: data.primerNombre,
      segundoNombre: data.segundoNombre,
      primerApellido: data.primerApellido,
      segundoApellido: data.segundoApellido,
      telefono: data.telefono,
      eps: data.eps,
      epsId: data.epsId,
      genero: data.genero,
      fechaNacimiento: data.fechaNacimiento,
      departamento: data.departamento,
      municipio: data.municipio,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al registrar paciente",
    );
  }

  return result;
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message || "Error al iniciar sesión",
    );
  }

  return result;
}
