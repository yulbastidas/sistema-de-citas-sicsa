const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type AuthenticatedLoginResponse = {
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

export type MfaChallengeResponse = {
  requiresTwoFactor: true;
  enrollmentRequired: boolean;
  challengeToken: string;
  expiresInSeconds: number;
  qrCodeDataUrl?: string;
  manualKey?: string;
};

export type LoginResponse = AuthenticatedLoginResponse | MfaChallengeResponse;

export type PhoneRegistrationResponse = {
  registrationId: number;
  challengeId: string;
  maskedPhone: string;
  expiresAt: string;
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

export type PhonePasswordRecoveryResponse = {
  message: string;
  challengeId: string;
  maskedPhone: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message;

    const retryAfter = Number(response.headers.get("Retry-After"));
    throw new ApiRequestError(
      backendMessage ||
        "Ocurrió un error al procesar la solicitud",
      response.status,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  return data as T;
}

/* =========================================================
   INICIAR SESIÓN
========================================================= */

export async function loginUser(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: identifier.trim().toLowerCase(),
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

export async function completeMfaLogin(
  challengeToken: string,
  method: "totp" | "recovery",
  code: string,
): Promise<AuthenticatedLoginResponse & { recoveryCodes?: string[] }> {
  const response = await fetch(`${API_URL}/auth/mfa/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeToken, method, code }),
  });
  return parseApiResponse(response);
}

export async function registerPatientByPhone(
  patientData: unknown,
): Promise<PhoneRegistrationResponse> {
  const response = await fetch(`${API_URL}/auth/register/phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData),
  });
  return parseApiResponse<PhoneRegistrationResponse>(response);
}

export async function verifyPhoneRegistration(
  registrationId: number,
  challengeId: string,
  code: string,
): Promise<{ message: string; phoneVerified: boolean }> {
  const response = await fetch(`${API_URL}/auth/register/phone/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registrationId, challengeId, code }),
  });
  return parseApiResponse(response);
}

export async function resendPhoneRegistration(
  registrationId: number,
): Promise<PhoneRegistrationResponse> {
  const response = await fetch(`${API_URL}/auth/register/phone/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registrationId }),
  });
  return parseApiResponse<PhoneRegistrationResponse>(response);
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

export async function forgotPasswordByPhone(
  phone: string,
): Promise<PhonePasswordRecoveryResponse> {
  const response = await fetch(`${API_URL}/auth/forgot-password/phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  return parseApiResponse<PhonePasswordRecoveryResponse>(response);
}

export async function verifyPhoneResetCode(
  phone: string,
  challengeId: string,
  code: string,
): Promise<{ message: string; valid: boolean; resetToken: string }> {
  const response = await fetch(`${API_URL}/auth/verify-reset-code/phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim(), challengeId, code }),
  });
  return parseApiResponse(response);
}

export async function resetPasswordByPhone(
  phone: string,
  resetToken: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_URL}/auth/reset-password/phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: phone.trim(),
      resetToken,
      newPassword,
      confirmPassword,
    }),
  });
  return parseApiResponse<ResetPasswordResponse>(response);
}
