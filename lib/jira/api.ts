import { cookies } from "next/headers";
import createClient, { Middleware } from "openapi-fetch";
import { paths } from "./schema";

const logMiddleware: Middleware = {
  onRequest: async ({ request }) => {
    const clone = request.clone();
    const body =
      request.method === "POST"
        ? JSON.stringify(await clone.json(), null, 2)
        : null;
    console.log(
      `>> ${request.method} ${request.url}${body ? `\n${body}` : ""}`
    );

    const Authorization = request.headers.get("Authorization");
    if (Authorization) console.log(`>> Authorization: ${Authorization}`);
  },
  onResponse: ({ response }) => {
    const emoji = response.ok ? "✅" : "❌";
    console.log(`<< ${emoji} ${response.status} (${response.statusText})`);
  },
};

export async function createJiraClientApi() {
  const cookiesStore = await cookies();

  const jiraApiKey = cookiesStore.get("jiraApiKey")?.value;
  const jiraEmailKey = cookiesStore.get("jiraEmailKey")?.value;
  const jiraBaseUrl = cookiesStore.get("jiraBaseUrl")?.value;

  if (!jiraApiKey || !jiraBaseUrl || !jiraEmailKey) {
    throw new Error("jiraApiKey, jiraBaseUrl and jiraEmailKey are required");
  }

  const baseUrl = jiraBaseUrl;

  const Authorization = `Basic ${Buffer.from(
    `${jiraEmailKey}:${jiraApiKey}`
  ).toString("base64")}`;

  const client = createClient<paths>({ baseUrl, headers: { Authorization } });

  client.use(logMiddleware);

  return client;
}

export type JiraClient = Awaited<ReturnType<typeof createJiraClientApi>>;
