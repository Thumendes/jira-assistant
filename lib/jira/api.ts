import createClient, { Middleware } from "openapi-fetch";
import { paths } from "./schema";

export type CreateJiraApiClientOptions = {
  accessToken: string;
};

const logMiddleware: Middleware = {
  onRequest: async ({ request }) => {
    const clone = request.clone();
    const body = request.method === "POST" ? JSON.stringify(await clone.json(), null, 2) : null;
    console.log(`>> ${request.method} ${request.url}${body ? `\n${body}` : ""}`);

    const Authorization = request.headers.get("Authorization");
    if (Authorization) console.log(`>> Authorization: ${Authorization}`);
  },
  onResponse: ({ response }) => {
    const emoji = response.ok ? "✅" : "🚫";
    console.log(`<< ${emoji} ${response.status} (${response.statusText})`);
  },
};

export function createJiraApiClient({ accessToken }: CreateJiraApiClientOptions) {
  const client = createClient<paths>({
    baseUrl: `https://greensignalsoftwares.atlassian.net`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  client.use(logMiddleware);

  return client;
}
