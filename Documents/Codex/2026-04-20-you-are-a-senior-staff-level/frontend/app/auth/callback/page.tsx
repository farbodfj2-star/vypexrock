"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { VypexrockLogo } from "@/components/vypexrock-logo";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing authentication...");

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");

    if (!token) {
      setStatus("error");
      setMessage("No authentication token received");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    // Fetch user data with token
    apiFetch<User>("/auth/me", { token })
      .then((user) => {
        setSession({ token, user });
        setStatus("success");
        setMessage(`Successfully signed in with ${provider || "OAuth"}!`);
        setTimeout(() => router.push("/terminal"), 1500);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      });
  }, [searchParams, router, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <VypexrockLogo />

        <div className="mt-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-300" />
              <p className="mt-4 text-lg font-medium text-white">{message}</p>
              <p className="mt-2 text-sm text-white/50">Please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-4 text-lg font-medium text-white">{message}</p>
              <p className="mt-2 text-sm text-white/50">Redirecting to terminal...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-400/20">
                <span className="text-2xl">✕</span>
              </div>
              <p className="mt-4 text-lg font-medium text-white">Authentication Failed</p>
              <p className="mt-2 text-sm text-rose-300">{message}</p>
              <p className="mt-4 text-sm text-white/50">Redirecting to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
