"use client";

import { create } from "zustand";

import type { User } from "@/types";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (payload: { token: string; user: User | null }) => void;
  clearSession: () => void;
};

function getInitialToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function getInitialUser() {
  if (typeof window === "undefined") return null;
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  setSession: ({ token, user }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
    set({ token, user });
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null });
  }
}));
