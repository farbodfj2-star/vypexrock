"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MobileNavigation } from "@/components/mobile-navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div id="theme-app-shell" className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-70" aria-hidden>
        <div className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-teal-400/[0.05] blur-[100px]" />
        <div className="absolute right-[-8rem] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-violet-500/[0.06] blur-[110px]" />
      </div>
      <Navbar />
      <main className={cn("vx-app-main", isLanding && "vx-app-main--landing")}>
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
      <MobileNavigation />
    </div>
  );
}
