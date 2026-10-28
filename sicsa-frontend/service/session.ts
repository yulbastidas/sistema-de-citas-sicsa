export type SessionUser = {
  sub?: number;
  id?: number;
  email?: string;
  role?: string | number;
  emailVerified?: boolean;
  canViewReports?: boolean;
  exp?: number;
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

export function decodeJwt(token: string): SessionUser | null {
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
    sessionStorage.setItem(key, value);
  } catch {}

  try {
    localStorage.removeItem(key);
  } catch {}
}

function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const sessionValue = sessionStorage.getItem(key);

    if (sessionValue) {
      return sessionValue;
    }
  } catch {}

  // Migra sesiones antiguas persistidas antes del endurecimiento.
  try {
    const legacyValue = localStorage.getItem(key);
    if (legacyValue) {
      sessionStorage.setItem(key, legacyValue);
      localStorage.removeItem(key);
      return legacyValue;
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

  const decoded = decodeJwt(token);

  if (!decoded || isTokenExpired(token)) {
    removeStorageItem("access_token");
    removeStorageItem("user");
    return null;
  }

  const normalizedUser: SessionUser = {
    ...decoded,
    id: decoded.id ?? decoded.sub,
    role: normalizeRole(decoded.role),
    canViewReports: decoded.canViewReports === true,
  };

  setStorageItem("access_token", token);

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

  const token = getStorageItem("access_token");

  if (token && isTokenExpired(token)) {
    logout();
    return null;
  }

  return token;
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const decoded = decodeJwt(token);
  return !decoded?.exp || decoded.exp * 1000 <= now;
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

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

export function getValidSession(): {
  token: string;
  user: SessionUser;
} | null {
  const token = getToken();
  const user = token ? getUser() : null;

  if (!token || !user) {
    logout();
    return null;
  }

  return { token, user };
}
