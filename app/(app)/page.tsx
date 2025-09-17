import { PageLayout } from "@/components/layout/page-layout";
import { Jira } from "@/lib/jira/client";
import { jiraClientFactory } from "@/lib/jira/factory";
import { IssueFields, IssueStatus } from "@/lib/jira/types";
import { Duration } from "@/lib/utils/duration";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ExternalLink, Lock } from "lucide-react";
import { format, isBefore } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUserSettings } from "@/lib/settings/cache";
import { TracktTimeButton } from "@/components/track-time";

export default async function HomePage() {
  const settings = await getUserSettings();
  const jiraClient = await jiraClientFactory(settings);
  const jiraBaseUrl = settings.get("jira-base-url");

  const jira = new Jira(jiraClient);

  const issues = await jira.getMyWorkingIssues([IssueStatus.Refinement, IssueStatus.Todo, IssueStatus.Doing]);

  type Issue = { id?: string; key?: string; fields?: IssueFields };

  const sortedIssues = ([...issues] as Issue[]).sort((a, b) => {
    const aPriority = a.fields?.priority?.id ? Number(a.fields.priority.id as unknown as number) : 100;

    const bPriority = b.fields?.priority?.id ? Number(b.fields.priority.id as unknown as number) : 100;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const aPoints = a.fields?.customfield_10078 ?? 0;
    const bPoints = b.fields?.customfield_10078 ?? 0;
    return Number(aPoints) - Number(bPoints);
  });

  const totalEstimative = sortedIssues.reduce(
    (acc, issue) =>
      acc.add(
        issue.fields?.timeoriginalestimate ? Duration.seconds(issue.fields.timeoriginalestimate) : Duration.seconds(0),
      ),
    Duration.seconds(0),
  );

  return (
    <PageLayout title="Home">
      {/* Header */}
      <header className="p-6 flex justify-between">
        <div>
          <h1 className="font-semibold text-xl">Veja o seu trabalho</h1>
          <p className="text-muted-foreground">Acompanhe suas tarefas atuais e registre o tempo diretamente do Jira</p>
        </div>

        <div className="flex items-center gap-4">
          <Badge>Total estimativa: {totalEstimative.format()} </Badge>

          <TracktTimeButton />
        </div>
      </header>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarefa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Data fixa</TableHead>
              <TableHead>Estimativa</TableHead>
              <TableHead>Registrar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => {
              const fields: IssueFields | object = issue.fields ?? ({} as object);
              const key = issue.key ?? issue.id;
              const summary: string | undefined = (fields as IssueFields).summary;
              const statusName: string | undefined = (fields as IssueFields).status?.name;
              const statusId: string | undefined = (fields as IssueFields).status?.id;
              const isBlocked = Boolean((fields as IssueFields).customfield_10021);
              const dueDateISO: string | undefined = (fields as IssueFields).duedate;
              const dueDate = dueDateISO ? new Date(dueDateISO) : undefined;
              const overdue = Boolean(dueDate && isBefore(dueDate, new Date()) && statusId !== IssueStatus.Done);
              const originalEstimateSeconds: number | undefined =
                (fields as IssueFields).timeoriginalestimate ?? undefined;
              const originalEstimate = originalEstimateSeconds
                ? Duration.seconds(originalEstimateSeconds).format()
                : "—";

              function statusBadgeClass(name?: string) {
                switch ((name ?? "").toLowerCase()) {
                  case "doing":
                    return "bg-blue-500/10 text-blue-700 border-blue-400";
                  case "todo":
                  case "ready":
                    return "bg-slate-500/10 text-slate-700 border-slate-400";
                  case "refinement":
                  case "prioritized":
                    return "bg-amber-500/10 text-amber-700 border-amber-400";
                  case "to test":
                  case "in test":
                    return "bg-purple-500/10 text-purple-700 border-purple-400";
                  case "customer approval":
                  case "publish":
                    return "bg-emerald-500/10 text-emerald-700 border-emerald-400";
                  case "done":
                    return "bg-green-500/10 text-green-700 border-green-400";
                  default:
                    return "bg-muted text-foreground";
                }
              }

              return (
                <TableRow key={issue.id ?? key} className={isBlocked ? "bg-muted/30 text-muted-foreground" : undefined}>
                  <TableCell>
                    {jiraBaseUrl ? (
                      <a
                        href={`${jiraBaseUrl}/browse/${key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        <div className="max-w-[26rem] truncate flex items-center gap-1">
                          {isBlocked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                          <span className="font-medium">{key}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          {summary ? <span className="text-muted-foreground"> — {summary}</span> : null}
                        </div>
                      </a>
                    ) : (
                      <div className="max-w-[26rem] truncate flex items-center gap-1">
                        <span className="font-medium">{key}</span>
                        {summary ? <span className="text-muted-foreground"> — {summary}</span> : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${statusBadgeClass(statusName)}`}>{statusName ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>{(fields as IssueFields).priority?.name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className={overdue ? "text-red-600" : undefined}>
                        {dueDate ? format(dueDate, "dd/MM/yyyy") : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{originalEstimate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TracktTimeButton lastIssueKey={String(key)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </PageLayout>
  );
}
