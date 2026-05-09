"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { VypexrockLogo } from "@/components/vypexrock-logo";
import { apiFetch } from "@/lib/api";

type ResetRequestResponse = {
  message: string;
  expires_in_minutes: number;
  verification_code?: string | null;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<ResetRequestResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(response.message);
      setDevCode(response.verification_code ?? null);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    try {
      await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword
        })
      });
      setStep("done");
      window.setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <VypexrockLogo />

      <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
        <ShieldCheck className="h-4 w-4" />
        Secure password recovery
      </div>

      <h1 className="mt-4 text-4xl font-semibold text-white">
        {step === "email" ? "Reset your password" : step === "reset" ? "Enter verification code" : "Password updated"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-white/60">
        {step === "email"
          ? "Enter your account email. We will send a six-digit verification code so you can create a new password."
          : step === "reset"
            ? "Use the verification code and choose a new password with at least eight characters."
            : "Your password has been updated. Redirecting you back to login..."}
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading || !email} className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={resetPassword} className="mt-8 space-y-4">
          {message ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
          {devCode ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Development code: <span className="font-semibold tracking-[0.24em]">{devCode}</span>
            </div>
          ) : null}
          <Field icon={KeyRound} label="Verification code" type="text" value={code} onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" />
          <Field icon={KeyRound} label="New password" type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <Field icon={KeyRound} label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading || code.length !== 6 || newPassword.length < 8} className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
            {loading ? "Updating password..." : "Update password"}
          </button>
          <button type="button" onClick={() => setStep("email")} className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]">
            Use a different email
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="mt-8 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <p className="font-semibold">Password updated successfully.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  autoComplete
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm text-white/55">
      {label}
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white transition focus-within:border-cyan-300/30">
        <Icon className="h-4 w-4 text-cyan-200/80" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
        />
      </div>
    </label>
  );
}
