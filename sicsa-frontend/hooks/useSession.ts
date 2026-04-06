"use client";

import { useMemo } from "react";
import { getUser, getToken } from "@/service/session";

type SessionUser = {
  sub?: number;
  email?: string;
  role?: string;
};

export function useSession() {
  const session = useMemo(() => {
    const user = getUser() as SessionUser | null;
    const token = getToken();

    return {
      user,
      token,
      loading: false,
    };
  }, []);

  return session;
}