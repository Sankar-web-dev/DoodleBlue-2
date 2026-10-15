"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <Toaster
        richColors
        position="top-center"
        offset={20}
        gap={10}
        duration={3500}
        toastOptions={{
          style: {
            // App-themed toasts — card surface, brand accents (violet
            // primary, amber secondary, cyan tertiary, red destructive).
            "--normal-bg": "oklch(var(--card) / 0.97)",
            "--normal-border": "oklch(var(--border))",
            "--normal-text": "oklch(var(--card-foreground))",
            "--success-bg": "oklch(var(--card) / 0.97)",
            "--success-border": "oklch(var(--primary) / 0.4)",
            "--success-text": "oklch(var(--primary))",
            "--error-bg": "oklch(var(--card) / 0.97)",
            "--error-border": "oklch(var(--destructive) / 0.4)",
            "--error-text": "oklch(var(--destructive))",
            "--warning-bg": "oklch(var(--card) / 0.97)",
            "--warning-border": "oklch(var(--secondary) / 0.5)",
            "--warning-text": "oklch(0.62 0.16 72)",
            "--info-bg": "oklch(var(--card) / 0.97)",
            "--info-border": "oklch(var(--tertiary) / 0.4)",
            "--info-text": "oklch(var(--tertiary))",
          } as React.CSSProperties,
          classNames: {
            toast:
              "rounded-2xl px-4 py-3.5 shadow-xl backdrop-blur-md items-start",
            title: "text-sm font-semibold leading-tight",
            description: "text-xs leading-relaxed opacity-80",
            icon: "mt-0.5",
          },
        }}
      />
    </QueryClientProvider>
  );
}
