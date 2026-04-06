type SessionUser = {
  sub?: number;
  email?: string;
  role?: string | number;
};

function normalizeRole(role: string | number | undefined): string | undefined {
  if (role === 1 || role === "1") return "admin";
  if (role === 2 || role === "2") return "patient";
  if (role === 3 || role === "3") return "doctor";
  if (typeof role === "string") return role;
  return undefined;
}

function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
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

function getStorageItem(key: string) {
  if (typeof window === "undefined") return null;

  try {
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
  } catch {}

  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
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

export function saveSession(token: string) {
  if (typeof window === "undefined") return null;

  setStorageItem("access_token", token);

  const decoded = decodeJwt(token);
  if (!decoded) return null;

  const normalizedUser: SessionUser = {
    ...decoded,
    role: normalizeRole(decoded.role),
  };

  setStorageItem("user", JSON.stringify(normalizedUser));
  return normalizedUser;
}

export function logout() {
  if (typeof window === "undefined") return;

  removeStorageItem("access_token");
  removeStorageItem("user");
  removeStorageItem("verification_status");
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return getStorageItem("access_token");
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const savedUser = getStorageItem("user");

  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser) as SessionUser;

      return {
        ...parsed,
        role: normalizeRole(parsed.role),
      };
    } catch {
      removeStorageItem("user");
    }
  }

  const token = getToken();
  if (!token) return null;

  const decoded = decodeJwt(token);
  if (!decoded) return null;

  const recoveredUser: SessionUser = {
    ...decoded,
    role: normalizeRole(decoded.role),
  };

  setStorageItem("user", JSON.stringify(recoveredUser));
  return recoveredUser;
}