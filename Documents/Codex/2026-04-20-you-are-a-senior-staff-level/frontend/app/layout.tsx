import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/mobile-navigation";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vypexrock",
  description: "Premium crypto AI signal and chart analysis platform."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#040711"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-theme="dark">
        <Providers>
          <div id="theme-app-shell" className="relative">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              <div className="absolute left-[-12rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[120px]" />
              <div className="absolute right-[-10rem] top-[4rem] h-[30rem] w-[30rem] rounded-full bg-violet-500/12 blur-[130px]" />
              <div className="absolute bottom-[-8rem] left-[22%] h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/8 blur-[120px]" />
            </div>
            <Navbar />
            <main className="mobile-safe-content mx-auto flex w-full max-w-none gap-4 px-3 py-4 lg:px-4 lg:py-5 xl:gap-5 xl:px-5 2xl:px-6">
              <Sidebar />
              <div className="min-w-0 flex-1">{children}</div>
            </main>
            <MobileNavigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
