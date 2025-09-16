import { betterAuth, generateId } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { createJiraApiClient } from "./jira/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  socialProviders: {
    atlassian: {
      clientId: process.env.ATLASSIAN_CLIENT_ID as string,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET as string,
      scopes: ["read:jira-user", "read:jira-work", "write:jira-work", "offline_access"],
      async getUserInfo(token) {
        if (!token.accessToken) {
          throw new Error("No access token provided");
        }

        const client = createJiraApiClient({ accessToken: token.accessToken });
        const response = await client.GET("/rest/api/3/myself");

        if (response.error || !response.data) {
          throw new Error("Failed to fetch user info from Atlassian");
        }

        return {
          user: {
            id: generateId(),
            emailVerified: true,
            email: response.data.emailAddress,
            name: response.data.displayName,
            image: response.data.avatarUrls?.["48x48"],
          },
          data: {},
        };
      },
    },
  },
});
