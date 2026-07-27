const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type LoginResponse = {
  message: string;
  access_token: string;
  user: {
    id: number;
    email: string;
    role: "patient" | "doctor" | "admin";
    emailVerified: boolean;
  };
};

type ApiMessageResponse = {
  message: string;
};

type RegisterResponse = {
  message: string;
  userId: number;
  email: string;
  emailVerified: boolean;
};

type VerifyEmailResponse = {
  message: string;
  emailVerified: boolean;
};

type VerifyResetCodeResponse = {
  message: string;
  valid: boolean;
};

type ResetPasswordResponse = {
  message: string;
  passwordUpdated: boolean;
};

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message;

    throw new Error(
      backendMessage ||
        "Ocurrió un error al procesar la solicitud",
    );
  }

  return data as T;
}

/* =========================================================
   INICIAR SESIÓN
========================================================= */

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  return parseApiResponse<LoginResponse>(response);
}

/* =========================================================
   REGISTRO DEL PACIENTE
========================================================= */

export async function registerPatient(
  patientData: unknown,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patientData),
  });

  return parseApiResponse<RegisterResponse>(response);
}

/* =========================================================
   VERIFICACIÓN DEL CORREO
========================================================= */

export async function sendVerificationCode(
  email: string,
): Promise<ApiMessageResponse> {
  const response = await fetch(
    `${API_URL}/auth/send-verification-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    },
  );

  return parseApiResponse<ApiMessageResponse>(response);
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyEmailResponse> {
  const response = await fetch(
    `${API_URL}/auth/verify-email-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    },
  );

  return parseApiResponse<VerifyEmailResponse>(response);
}

/* =========================================================
   RECUPERACIÓN DE CONTRASEÑA
========================================================= */

export async function forgotPassword(
  email: string,
): Promise<ApiMessageResponse> {
  const response = await fetch(
    `${API_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    },
  );

  return parseApiResponse<ApiMessageResponse>(response);
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<VerifyResetCodeResponse> {
  const response = await fetch(
    `${API_URL}/auth/verify-reset-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    },
  );

  return parseApiResponse<VerifyResetCodeResponse>(
    response,
  );
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ResetPasswordResponse> {
  const response = await fetch(
    `${API_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      }),
    },
  );

  return parseApiResponse<ResetPasswordResponse>(
    response,
  );
}