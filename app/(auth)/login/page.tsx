"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  async function handleLogin() {
    const data = await authClient.signIn.social({ provider: "atlassian" });

    console.log(data);
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
