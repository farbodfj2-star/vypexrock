import { appConfig } from "@/lib/config";
import type { User } from "@/types";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export function resolveApiAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const origin = appConfig.apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function uploadUserAvatar(file: File, token?: string | null): Promise<User> {
  const headers = new Headers();
  const authToken =
    token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${appConfig.apiUrl}/auth/me/avatar`, {
      method: "POST",
      headers,
      body: form
    });
  } catch (err) {
    throw new Error(
      "Vypexrock service is currently unreachable. The backend may be restarting — please retry in a moment.",
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Avatar upload failed" }));
    throw new Error(payload.detail ?? "Avatar upload failed");
  }

  return response.json() as Promise<User>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token =
    options.token ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${appConfig.apiUrl}${path}`, {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch (err) {
    // Network-level failure: backend unreachable, CORS preflight failed, etc.
    // Browser shows "Failed to fetch" by default — replace with something useful.
    const isOnline = typeof navigator === "undefined" || navigator.onLine;
    if (!isOnline) {
      throw new Error("You appear to be offline. Check your connection and try again.");
    }
    throw new Error(
      "Vypexrock service is currently unreachable. The backend may be restarting — please retry in a moment.",
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    if (response.status === 401 && payload.detail === "Could not validate credentials") {
      throw new Error("Your session expired. Please sign in again, then save Telegram settings.");
    }
    throw new Error(payload.detail ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
