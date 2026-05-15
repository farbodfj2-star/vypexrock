import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

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
  themeColor: "#030405"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-theme="dark">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
