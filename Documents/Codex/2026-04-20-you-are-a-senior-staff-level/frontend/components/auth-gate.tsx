"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { useAuthStore } from "@/lib/store";
import { VypexrockLogo } from "@/components/vypexrock-logo";

const publicRoutes = ["/login", "/register"];

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [ready, setReady] = useState(false);

  const isPublicRoute = useMemo(() => publicRoutes.includes(pathname), [pathname]);

  useEffect(() => {
    const bootToken = localStorage.getItem("token");
    if (!bootToken && !isPublicRoute) {
      router.replace("/login");
    }
    setReady(true);
  }, [isPublicRoute, router]);

  if (!ready) {
    return <div className="min-h-[70vh]" />;
  }

  if (!token && !isPublicRoute) {
    return (
      <div className="flex min-h-[78vh] items-center justify-center px-4">
        <div className="max-w-xl rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 text-center shadow-[0_26px_90px_rgba(0,0,0,0.42)]">
          <VypexrockLogo className="justify-center" />
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
            Private platform access
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-white">Sign in to enter the workspace</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Vypexrock is now fully gated. Dashboard access, AI, charts, alerts, and community features require an account before use.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              <LockKeyhole className="h-4 w-4" />
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/78"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
