export type SessionUser = {
  sub?: number;
  id?: number;
  email?: string;
  role?: string | number;
  emailVerified?: boolean;
  canViewReports?: boolean;
};

function normalizeRole(
  role: string | number | undefined,
): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";

  if (typeof role === "string") {
    return role;
  }

  return undefined;
}

function decodeJwt(token: string): SessionUser | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    /*
     * Convierte Base64URL a Base64 normal.
     * Esto evita errores con algunos JWT.
     */
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(paddedBase64)) as SessionUser;
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {}

  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const localValue = localStorage.getItem(key);

    if (localValue) {
      return localValue;
    }
  } catch {}

  try {
    const sessionValue = sessionStorage.getItem(key);

    if (sessionValue) {
      return sessionValue;
    }
  } catch {}

  return null;
}

function removeStorageItem(key: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {}

  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function saveSession(token: string): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  setStorageItem("access_token", token);

  const decoded = decodeJwt(token);

  if (!decoded) {
    removeStorageItem("access_token");
    return null;
  }

  const normalizedUser: SessionUser = {
    ...decoded,
    id: decoded.id ?? decoded.sub,
    role: normalizeRole(decoded.role),
    canViewReports: decoded.canViewReports === true,
  };

  setStorageItem(
    "user",
    JSON.stringify(normalizedUser),
  );

  return normalizedUser;
}

export function logout() {
  if (typeof window === "undefined") return;

  removeStorageItem("access_token");
  removeStorageItem("user");
  removeStorageItem("verification_status");
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getStorageItem("access_token");
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = getStorageItem("user");

  if (savedUser) {
    try {
      const parsed = JSON.parse(
        savedUser,
      ) as SessionUser;

      return {
        ...parsed,
        id: parsed.id ?? parsed.sub,
        role: normalizeRole(parsed.role),
        canViewReports:
          parsed.canViewReports === true,
      };
    } catch {
      removeStorageItem("user");
    }
  }

  /*
   * Si no encuentra el usuario guardado, intenta
   * recuperarlo directamente desde el JWT.
   */
  const token = getToken();

  if (!token) {
    return null;
  }

  const decoded = decodeJwt(token);

  if (!decoded) {
    logout();
    return null;
  }

  const recoveredUser: SessionUser = {
    ...decoded,
    id: decoded.id ?? decoded.sub,
    role: normalizeRole(decoded.role),
    canViewReports: decoded.canViewReports === true,
  };

  setStorageItem(
    "user",
    JSON.stringify(recoveredUser),
  );

  return recoveredUser;
}