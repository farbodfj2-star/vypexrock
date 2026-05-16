"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { VypexrockLogo } from "@/components/vypexrock-logo";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [fullName, setFullName] = useState("");
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

    // Validate Gmail
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Currently only Gmail accounts are supported");
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password })
      });
      // Redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.12),_transparent_22%),radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <VypexrockLogo />
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-white/40">Create account</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">
        Create your private Vypexrock workspace
      </h1>
      <p className="mt-3 text-sm leading-7 text-white/60">
        Register first to use the dashboard, live prices, Vypexrock AI, community features, and your personal trading tools.
      </p>

      {!showEmailForm ? (
        <div className="mt-8">
          <SocialAuthButtons onEmailClick={() => setShowEmailForm(true)} mode="register" />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Full name" type="text" value={fullName} onChange={setFullName} />
            <Field
              label="Gmail address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your.email@gmail.com"
            />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
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
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-300">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-xs text-white/40">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-white/55">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30"
      />
    </label>
  );
}

