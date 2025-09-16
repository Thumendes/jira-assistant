import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  socialProviders: {
    atlassian: {
      clientId: process.env.ATLASSIAN_CLIENT_ID as string,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET as string,
      scopes: ["read:jira-user", "read:jira-work", "write:jira-work", "offline_access"],
    },
  },
});
