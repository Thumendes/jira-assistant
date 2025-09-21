"use client";

import { components } from "@/lib/jira/schema";
import { IssueFields } from "@/lib/jira/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, Clock, ExternalLink } from "lucide-react";
import { match } from "ts-pattern";
import { dialog } from "../dialog";
import { TransitionSelectClient } from "../issues/transition-select";
import { TracktTimeButton } from "../track-time";
import { Badge } from "../ui/badge";
import Link from "next/link";

type IssueItemProps = {
  issue: components["schemas"]["IssueBean"] & { fields: IssueFields };
  status: "done" | "doing" | "late";
};

export function IssueItem({ issue, status }: IssueItemProps) {
  async function seeDetails() {
    const f = issue.fields as IssueFields | undefined;
    const priority = f?.priority?.name ?? "—";
    const dueDate = f?.duedate ? new Date(f.duedate) : undefined;
    const estimate = f?.timeoriginalestimate ?? undefined;

    await dialog.info("Detalhes", {
      contentClassname: "max-w-lg",
      info() {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-semibold text-lg flex items-center justify-between">
                  <span>
                    {issue.key} — {f?.summary}
                  </span>

                  <Link href={`/issues/${issue.key}`} target="_blank" className="ml-2 text-sm text-blue-500 underline">
                    <ExternalLink className="inline-block w-4 h-4" />
                  </Link>
                </h1>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Prioridade: {priority}</Badge>
                  <Badge className="border" variant="secondary">
                    Status: {f?.status?.name ?? "—"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TracktTimeButton lastIssueKey={String(issue.key)} />
              <TransitionSelectClient issueKey={issue.key as string} />
            </div>

            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Criação: {f?.created ? format(new Date(f.created), "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Data fixa: {dueDate ? format(dueDate, "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimativa original: {estimate ? `${Math.round(estimate / 3600)}h` : "—"}</span>
              </div>
            </div>
          </div>
        );
      },
    });
  }

  return (
    <div key={issue.key} onClick={seeDetails} className="flex items-start gap-2 border p-2 rounded-md">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="text-xs font-medium truncate text-muted-foreground">{issue.key}</div>

          <span
            className={cn(
              `mt-1 inline-block h-2.5 w-2.5 rounded-full`,
              match(status)
                .with("done", () => "bg-emerald-500")
                .with("doing", () => "bg-red-500")
                .with("late", () => "bg-red-500")
                .exhaustive(),
            )}
          />
        </div>
        <div className="text-sm font-medium truncate">{issue.fields.summary}</div>
        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
          {issue.fields.issuetype && <Badge variant="outline">{issue.fields.issuetype.name}</Badge>}
          {issue.fields.status && <Badge variant="secondary">{issue.fields.status.name}</Badge>}
        </div>
      </div>
    </div>
  );
}
