import { PageLayout } from "@/components/layout/page-layout";
import { Jira } from "@/lib/jira/client";
import { jiraClientFactory } from "@/lib/jira/factory";
import { IssueFields, IssueStatus } from "@/lib/jira/types";
import { Duration } from "@/lib/utils/duration";
import { getUserSettings } from "@/lib/settings/cache";
import { IssuesTable } from "@/components/issues/issues-table";
import { trytm } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TracktTimeButton } from "@/components/track-time";

export default async function HomePage() {
  const settings = await getUserSettings();
  const jiraBaseUrl = settings.get("jira-base-url");

  if (!jiraBaseUrl) {
    return (
      <PageLayout title="Home">
        <main className="p-6">
          <Alert className="max-w-3xl" variant="destructive">
            <AlertTitle>Configuração do Jira ausente</AlertTitle>
            <AlertDescription>
              Para visualizar suas tarefas, configure as credenciais do Jira em{" "}
              <Link href="/profile" className="underline font-medium">
                Perfil
              </Link>
              .
            </AlertDescription>
          </Alert>
        </main>
      </PageLayout>
    );
  }

  const [client, clientErr] = await trytm(jiraClientFactory(settings));
  if (clientErr) {
    return (
      <PageLayout title="Home">
        <main className="p-6">
          <Alert className="max-w-3xl" variant="destructive">
            <AlertTitle>Falha ao inicializar cliente do Jira</AlertTitle>
            <AlertDescription>{clientErr.message}</AlertDescription>
          </Alert>
        </main>
      </PageLayout>
    );
  }

  const jira = new Jira(client);

  const [issues, issuesErr] = await trytm(
    jira.getMyWorkingIssues([
      IssueStatus.Refinement,
      IssueStatus.Todo,
      IssueStatus.Doing,
    ])
  );

  if (issuesErr) {
    return (
      <PageLayout title="Home">
        <main className="p-6">
          <Alert className="max-w-3xl" variant="destructive">
            <AlertTitle>Erro ao buscar tarefas no Jira</AlertTitle>
            <AlertDescription>{issuesErr.message}</AlertDescription>
          </Alert>
        </main>
      </PageLayout>
    );
  }

  type Issue = { id?: string; key?: string; fields?: IssueFields };

  const totalEstimative = (issues as Issue[]).reduce(
    (acc, issue) =>
      acc.add(
        issue.fields?.timeoriginalestimate
          ? Duration.seconds(issue.fields.timeoriginalestimate)
          : Duration.seconds(0)
      ),
    Duration.seconds(0)
  );

  return (
    <PageLayout title="Home">
      {/* Header */}
      <header className="p-6 flex justify-between">
        <div>
          <h1 className="font-semibold text-xl">Veja o seu trabalho</h1>
          <p className="text-muted-foreground">
            Acompanhe suas tarefas atuais e registre o tempo diretamente do Jira
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge>Total estimativa: {totalEstimative.format()} </Badge>

          <TracktTimeButton />
        </div>
      </header>

      <main className="p-6">
        <IssuesTable issues={issues as Issue[]} jiraBaseUrl={jiraBaseUrl} />
      </main>
    </PageLayout>
  );
}
