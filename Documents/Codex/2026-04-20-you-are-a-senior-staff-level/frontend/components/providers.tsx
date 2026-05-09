"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

import { AuthGate } from "@/components/auth-gate";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  );
}
