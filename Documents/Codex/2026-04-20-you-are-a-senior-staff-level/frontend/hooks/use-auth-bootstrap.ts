"use client";

import { useEffect } from "react";

import { appConfig } from "@/lib/config";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

export function useAuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (!token) return;

    let cachedUser: User | null = null;
    try {
      cachedUser = rawUser ? (JSON.parse(rawUser) as User) : null;
    } catch {
      localStorage.removeItem("user");
    }

    setSession({ token, user: cachedUser });

    fetch(`${appConfig.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          clearSession();
          return;
        }
        const user = (await response.json()) as User;
        setSession({ token, user });
      })
      .catch(() => undefined);
  }, [clearSession, setSession]);
}
