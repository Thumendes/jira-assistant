import { PageLayout } from "@/components/layout/page-layout";
import { Badge } from "@/components/ui/badge";
import { TransitionSelectClient } from "@/components/issues/transition-select";
import { Button } from "@/components/ui/button";
import { AtlassianLogo } from "@/components/logos/Atlassian";
import { jiraClientFactory } from "@/lib/jira/factory";
import { Jira } from "@/lib/jira/client";
import { IssueFields } from "@/lib/jira/types";
import { TracktTimeButton } from "@/components/track-time";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { getUserSettings } from "@/lib/settings/cache";
import { adfToMarkdown } from "@/lib/utils/adf";
import { WorklogList } from "@/components/issues/worklog-list";

type PageProps = { params: Promise<{ key: string }> };

export default async function IssueDetailPage({ params }: PageProps) {
  const { key } = await params;
  const client = await jiraClientFactory();
  const jira = new Jira(client);
  const settings = await getUserSettings();
  const jiraBaseUrl = settings.get("jira-base-url");

  const issue = await jira.getIssue(key, {
    fields: [
      "summary",
      "description",
      "priority",
      "status",
      "created",
      "duedate",
      "timeoriginalestimate",
      "customfield_10078",
    ],
  });

  if (!issue) return notFound();

  const fields = issue.fields as IssueFields | undefined;
  const priorityName = fields?.priority?.name ?? "—";
  const order = String(fields?.customfield_10078 ?? "—");
  const dueDateISO = fields?.duedate;
  const dueDate = dueDateISO ? new Date(dueDateISO) : undefined;
  const originalEstimateSeconds = fields?.timeoriginalestimate ?? undefined;
  const descriptionMarkdown = adfToMarkdown(fields?.description as unknown);

  return (
    <PageLayout title={`Tarefa ${issue.key}`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-xl">
              {issue.key} — {fields?.summary}
            </h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Ordem: {order}</Badge>
              <Badge variant="outline">Prioridade: {priorityName}</Badge>
              <Badge className="border" variant="secondary">
                Status: {fields?.status?.name ?? "—"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TracktTimeButton lastIssueKey={String(issue.key)} />
            <TransitionSelectClient issueKey={key} />
            {jiraBaseUrl ? (
              <Button asChild variant="outline">
                <a
                  href={`${jiraBaseUrl}/browse/${issue.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <AtlassianLogo className="h-4 w-4" />
                  Ver no Jira
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-md border p-4">
            <h2 className="text-sm font-medium mb-2">Descrição</h2>
            <pre className="whitespace-pre-wrap text-sm">
              {descriptionMarkdown || "—"}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Criação:{" "}
                  {fields?.created
                    ? format(new Date(fields.created), "dd/MM/yyyy")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Data fixa: {dueDate ? format(dueDate, "dd/MM/yyyy") : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Estimativa original:{" "}
                  {originalEstimateSeconds
                    ? `${Math.round(originalEstimateSeconds / 3600)}h`
                    : "—"}
                </span>
              </div>
            </div>
            <WorklogList issueKey={issue.key as string} originalEstimateSeconds={originalEstimateSeconds} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
