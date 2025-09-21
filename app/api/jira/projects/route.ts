import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { jiraClientFactory } from "@/lib/jira/factory";
import { Jira } from "@/lib/jira/client";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const client = await jiraClientFactory();
  const jira = new Jira(client);
  const projects = await jira.listProjects();
  return NextResponse.json({ projects });
}


