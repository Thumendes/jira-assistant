"use client";

import { authClient } from "@/lib/auth-client";
import { User } from "better-auth";
import { Button } from "../ui/button";

type AppNavbarProps = {
  user: User;
};

export function AppNavbar({ user }: AppNavbarProps) {
  async function handleLogout() {
    await authClient.signOut();
  }

  return (
    <nav>
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="text-lg font-bold">Jira Assistant</div>

        <div className="flex items-center space-x-4">
          <span>Welcome, {user.name || "User"}</span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
