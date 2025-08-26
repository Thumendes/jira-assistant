import { router } from "@/server/router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { Issue, IssuesSchema } from "./schema";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type RequestBody = { description: string; issues: Issue[] };

export async function POST(req: Request) {
  const { description, issues }: RequestBody = await req.json();

  const credentials = await router.credentials.get();

  const openai = createOpenAI({ apiKey: credentials.apiKey });

  const prompt = `Dado o seguinte problema: ${description}
Crie tarefas no Jira que resolvam o problema descrito acima.
${
  issues.length > 0
    ? `As tarefas já criadas são: ${JSON.stringify(issues, null, 2)}`
    : ""
}`;

  console.log(prompt);

  const result = streamObject({
    model: openai("gpt-4o"),
    schema: IssuesSchema,
    prompt,
    system: `Você é um analista de sistemas e precisa criar tarefas no Jira para resolver um problema descrito.`,

    onError(error) {
      console.error(error);
    },
  });

  return result.toTextStreamResponse();
}
