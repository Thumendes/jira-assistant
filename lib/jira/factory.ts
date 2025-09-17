import { cache } from "react";
import { getUserSettings } from "../settings/cache";
import { UserSettings } from "../settings/user-settings";
import { createJiraApiClient } from "./api";

export const jiraClientFactory = cache(async (settings?: UserSettings) => {
  settings = settings ?? (await getUserSettings());

  const jiraBaseUrl = settings.get("jira-base-url");
  const jiraEmail = settings.get("jira-email");
  const jiraApiKey = settings.get("jira-api-key");

  if (!jiraBaseUrl) {
    throw new Error("Jira base URL is not configured");
  }

  if (!jiraEmail || !jiraApiKey) {
    throw new Error("Jira credentials are not configured");
  }

  return createJiraApiClient({
    baseUrl: jiraBaseUrl,
    apiToken: jiraApiKey,
    email: jiraEmail,
  });
});
