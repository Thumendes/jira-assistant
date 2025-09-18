import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { jiraClientFactory } from "@/lib/jira/factory";
import { Jira } from "@/lib/jira/client";
import { Duration } from "@/lib/utils/duration";

const bodySchema = z.object({
  issueKey: z.string().min(1),
  timeSpent: z.string().min(1),
  date: z.iso.datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const json = await request.json();
    const { issueKey, timeSpent, date } = bodySchema.parse(json);

    const client = await jiraClientFactory();
    const jira = new Jira(client);

    const duration = Duration.fromExpression(timeSpent);
    await jira.trackTime(issueKey, duration, {
      startedAt: date ? new Date(date) : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao registrar horas:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
