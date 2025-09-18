import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { jiraClientFactory } from "@/lib/jira/factory";
import { Jira } from "@/lib/jira/client";

const postSchema = z.object({ transitionId: z.string().min(1) });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

    const client = await jiraClientFactory();
    const jira = new Jira(client);
    const data = await jira.getTransitions(key);

    return NextResponse.json({
      success: true,
      transitions: data.transitions ?? [],
    });
  } catch (error) {
    console.error("Erro ao buscar transições:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

    const { key } = await params;

    const json = await request.json();
    const { transitionId } = postSchema.parse(json);

    const client = await jiraClientFactory();
    const jira = new Jira(client);
    await jira.transitionIssue(key, transitionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao executar transição:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
