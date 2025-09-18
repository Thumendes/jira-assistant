import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { jiraClientFactory } from "@/lib/jira/factory";
import { Jira } from "@/lib/jira/client";

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
    const data = await jira.getIssueWorklogs(key);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Erro ao buscar worklogs:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
