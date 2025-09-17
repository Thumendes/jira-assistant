import createClient, { Middleware } from "openapi-fetch";
import { paths } from "./schema";
import { match, P } from "ts-pattern";

export type CreateJiraApiClientOptions =
  | { baseUrl: string; accessToken: string }
  | { baseUrl: string; apiToken: string; email: string };

const logMiddleware: Middleware = {
  onRequest: async ({ request }) => {
    const clone = request.clone();
    const body = request.method === "POST" ? JSON.stringify(await clone.json(), null, 2) : null;
    console.log(`>> ${request.method} ${request.url}${body ? `\n${body}` : ""}`);

    // const Authorization = request.headers.get("Authorization");
    // if (Authorization) console.log(`>> Authorization: ${Authorization}`);
  },
  onResponse: ({ response }) => {
    const emoji = response.ok ? "✅" : "🚫";
    console.log(`<< ${emoji} ${response.status} (${response.statusText})`);
  },
};

export function createJiraApiClient(options: CreateJiraApiClientOptions) {
  const Authorization = match(options)
    .with({ apiToken: P.string }, ({ apiToken, email }) => {
      return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
    })
    .with({ accessToken: P.string }, ({ accessToken }) => {
      return `Bearer ${accessToken}`;
    })
    .exhaustive();

  const client = createClient<paths>({ baseUrl: options.baseUrl, headers: { Authorization } });
  client.use(logMiddleware);

  return client;
}

export type JiraClient = Awaited<ReturnType<typeof createJiraApiClient>>;
