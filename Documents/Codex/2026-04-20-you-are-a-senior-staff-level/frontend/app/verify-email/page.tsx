"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { VypexrockLogo } from "@/components/vypexrock-logo";
import { apiFetch } from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  
  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "success">(emailParam ? "verify" : "request");
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<{ message: string; dev_code?: string; expires_in_minutes: number }>(
        "/auth/verify-email/request",
        {
          method: "POST",
          body: JSON.stringify({ email })
        }
      );
      setMessage(response.message);
      setDevCode(response.dev_code || null);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch<{ message: string }>("/auth/verify-email/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code })
      });
      setStep("success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <VypexrockLogo />

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
        <ShieldCheck className="h-4 w-4" />
        Email verification
      </div>

      <h1 className="mt-4 text-4xl font-semibold text-white">
        {step === "request"
          ? "Verify your email"
          : step === "verify"
            ? "Enter verification code"
            : "Email verified!"}
      </h1>

      <p className="mt-3 text-sm leading-7 text-white/60">
        {step === "request"
          ? "Enter your email address to receive a verification code."
          : step === "verify"
            ? "Check your Gmail inbox for the 6-digit verification code."
            : "Your email has been verified successfully. Redirecting to login..."}
      </p>

      {step === "request" && (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <Field
            icon={Mail}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your.email@gmail.com"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            disabled={loading || !email}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          {message && (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </p>
          )}
          {devCode && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Development code: <span className="font-semibold tracking-[0.24em]">{devCode}</span>
            </div>
          )}
          <Field
            icon={Mail}
            label="Verification code"
            type="text"
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            disabled={loading || code.length !== 6}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify email"}
          </button>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            Use a different email
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="mt-8 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <p className="font-semibold">Email verified successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
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
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
        />
      </div>
    </label>
  );
}
