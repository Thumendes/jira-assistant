"use client";

import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../ui/sonner";
import { ThemeProvider } from "next-themes";
import { Dialoger } from "../dialog";

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
