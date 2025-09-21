import { PageLayout } from "@/components/layout/page-layout";
import { IssueItem } from "@/components/timeline/issue-item";
import { Jira } from "@/lib/jira/client";
import { jiraClientFactory } from "@/lib/jira/factory";
import { IssueStatus } from "@/lib/jira/types";
import { cn } from "@/lib/utils";
import { DateInterval } from "@/lib/utils/dateInterval";
import { addDays, format, isBefore, isSameDay, isWeekend } from "date-fns";

export default async function TimelineProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const client = await jiraClientFactory();
  const jira = new Jira(client);
  const issues = await jira.getProjectIssuesWithEstimates(project);

  const interval = DateInterval.currentMonth();
  const days = interval.createGrid();

  function isDone(issue: (typeof issues)[number]) {
    const status = issue.fields.status?.id;
    return status === IssueStatus.Done || status === IssueStatus.Publish;
  }

  function isDoing(issue: (typeof issues)[number]) {
    const status = issue.fields.status?.id;
    return (
      status === IssueStatus.Doing ||
      status === IssueStatus.InTest ||
      status === IssueStatus.ToTest
    );
  }

  function isLate(issue: (typeof issues)[number]) {
    const day = new Date();

    return (
      !isDone(issue) &&
      !isDoing(issue) &&
      isBefore(new Date(issue.fields.duedate as string), day)
    );
  }

  const issueGrid = days.map((day) => {
    const issuesFromDate = issues.filter((it) => {
      if (!it.fields.duedate) return false;
      const due = new Date(it.fields.duedate);
      return due >= day && due < addDays(day, 1);
    });

    const doneCount = issuesFromDate.filter(isDone).length;
    const doingCount = issuesFromDate.filter(isDoing).length;
    const lateCount = issuesFromDate.filter(isLate).length;

    return {
      day,
      doneCount,
      doingCount,
      lateCount,
      issues: issuesFromDate,
    };
  });

  return (
    <PageLayout title={`Timeline ${project}`} className="p-6">
      <div className="text-sm text-muted-foreground mb-4">
        Mês atual — {format(interval.from, "dd/MM/yyyy")} a{" "}
        {format(interval.to, "dd/MM/yyyy")}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max flex gap-4">
          {issueGrid.map(
            ({ day, issues, doingCount, doneCount, lateCount }) => {
              const isToday = isSameDay(day, new Date());
              const dayBorderClass = isToday
                ? "border-blue-500"
                : lateCount > 0
                ? "border-orange-500"
                : issues.length > 0 && doneCount === issues.length
                ? "border-emerald-500"
                : "border-border";

              return (
                <div
                  key={day.toISOString()}
                  className={`w-80 shrink-0 rounded-md border p-3 ${dayBorderClass}`}
                >
                  <div className="sticky top-0 z-10 pb-2 space-y-2">
                    <div className="font-medium flex items-center justify-between">
                      <span>{format(day, "dd/MM/yyyy")}</span>
                      <span className="inline-flex items-center gap-1">
                        {issues.length} issues
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                        Fazendo: {doingCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Entregues: {doneCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                        Atrasadas: {lateCount}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn("space-y-2", isWeekend(day) && "opacity-70")}
                  >
                    {issues.map((it) => {
                      const done = isDone(it);
                      const doing = isDoing(it);
                      const late = isLate(it);

                      return (
                        <IssueItem
                          key={it.key}
                          issue={it}
                          status={
                            done
                              ? "done"
                              : doing
                              ? "doing"
                              : late
                              ? "late"
                              : "doing"
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </PageLayout>
  );
}
