"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { VypexrockLogo } from "@/components/vypexrock-logo";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Authentication failed");

  useEffect(() => {
    const errorMessage = searchParams.get("message");
    if (errorMessage) {
      setMessage(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <VypexrockLogo />

        <div className="mt-8">
          <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-rose-300" />
            <div>
              <p className="font-semibold text-white">Authentication Error</p>
              <p className="mt-1 text-sm text-rose-200">{message}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Common Issues</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>• Only Gmail accounts are supported</li>
              <li>• Ensure your GitHub account has a Gmail address</li>
              <li>• Check that you granted all required permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
