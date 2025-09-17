export const Settings = {
  OpenaiApiKey: "openai-api-key",
  JiraBaseUrl: "jira-base-url",
  JiraEmail: "jira-email",
  JiraApiKey: "jira-api-key",
} as const;

export type Settings = (typeof Settings)[keyof typeof Settings];
