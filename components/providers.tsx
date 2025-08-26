"use client";

import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./ui/sonner";
import { Dialoger } from "./dialog";
import { ThemeProvider } from "next-themes";

type RootProvidersProps = {
  children: React.ReactNode;
};

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors />
        <Dialoger />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
