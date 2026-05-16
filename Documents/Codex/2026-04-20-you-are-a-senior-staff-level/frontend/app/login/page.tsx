"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { VypexrockLogo } from "@/components/vypexrock-logo";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [router, token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokenResponse = await apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      const user = await apiFetch<User>("/auth/me", { token: tokenResponse.access_token });
      setSession({ token: tokenResponse.access_token, user });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.12),_transparent_22%),radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <VypexrockLogo />
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-white/40">Members access</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back to Vypexrock</h1>
      <p className="mt-3 text-sm leading-7 text-white/60">
        Sign in to unlock the private crypto workspace, live dashboards, Vypexrock AI, alerts, and premium analysis tools.
      </p>

      {!showEmailForm ? (
        <div className="mt-8">
          <SocialAuthButtons onEmailClick={() => setShowEmailForm(true)} mode="login" />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-cyan-300 transition hover:text-cyan-200">
                Forgot password?
              </Link>
            </div>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <button
            onClick={() => setShowEmailForm(false)}
            className="mt-4 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            Back to social options
          </button>
        </>
      )}

      <p className="mt-5 text-sm text-white/55">
        New here?{" "}
        <Link href="/register" className="text-cyan-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-white/55">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white"
      />
    </label>
  );
}
