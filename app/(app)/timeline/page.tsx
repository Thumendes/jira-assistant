import { PageLayout } from "@/components/layout/page-layout";
import { SelectProject } from "@/components/timeline/select-project";
import { Card, CardContent } from "@/components/ui/card";
import { Jira } from "@/lib/jira/client";
import { jiraClientFactory } from "@/lib/jira/factory";

export default async function TimelinePage() {
  const client = await jiraClientFactory();
  const jira = new Jira(client);
  const projects = await jira.listProjects();

  return (
    <PageLayout title="Timeline">
      <div className="p-4 space-y-6 h-full">
        <div className="flex flex-col">
          <header className="py-6">
            <h1 className="text-2xl font-bold">Selecione um projeto</h1>
            <p className="text-sm text-muted-foreground">
              Selecione um projeto para ver o timeline
            </p>
          </header>

          {projects && (
            <Card>
              <CardContent className="h-[50vh] overflow-y-auto">
                <SelectProject projects={projects} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
