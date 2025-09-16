"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function LoginPage() {
  async function handleLogin() {
    toast.promise(authClient.signIn.social({ provider: "atlassian" }), {
      loading: "Redirecting to Atlassian...",
      success: "Authentication successful! Redirecting...",
      error: (error) => `Error: ${error.message}`,
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <header>
        <h1>Login Page</h1>
      </header>

      <Button onClick={handleLogin}>Login with Atlassian</Button>
    </main>
  );
}
