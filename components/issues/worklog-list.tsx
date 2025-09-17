"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTrackTime } from "@/hooks/use-track-time";
import { format } from "date-fns";

type Worklog = {
  id?: string;
  timeSpent?: string;
  timeSpentSeconds?: number;
  started?: string;
  author?: { displayName?: string };
  comment?: unknown;
};

type Props = {
  issueKey: string;
  originalEstimateSeconds?: number;
};

export function WorklogList({ issueKey, originalEstimateSeconds }: Props) {
  const query = useQuery<{ worklogs?: Worklog[] }>({
    queryKey: ["issue-worklogs", issueKey],
    queryFn: async () => {
      const res = await fetch(`/api/jira/issue/${issueKey}/worklogs`);
      if (!res.ok) throw new Error("Falha ao buscar worklogs");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { trackTime } = useTrackTime({
    lastIssueKey: issueKey,
    onSuccess: () => query.refetch(),
  });

  const worklogs = query.data?.worklogs ?? [];
  const totalSpentSeconds = worklogs.reduce((acc, w) => acc + (w.timeSpentSeconds ?? 0), 0);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Worklogs</h3>
        <div className="flex items-center gap-3 text-sm">
          {typeof originalEstimateSeconds === "number" ? (
            <span className="text-muted-foreground">
              Estimado: {formatHours(originalEstimateSeconds)}
            </span>
          ) : null}
          <span className="text-muted-foreground">Executado: {formatHours(totalSpentSeconds)}</span>
          <Button size="sm" variant="outline" onClick={() => trackTime({ issueKey })}>
            Adicionar worklog
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-2 font-medium">Data</th>
              <th className="text-left p-2 font-medium">Autor</th>
              <th className="text-left p-2 font-medium">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {worklogs.map((w) => (
              <tr key={w.id} className="border-b last:border-0">
                <td className="p-2">{w.started ? format(new Date(w.started), "dd/MM/yyyy HH:mm") : "—"}</td>
                <td className="p-2">{w.author?.displayName ?? "—"}</td>
                <td className="p-2">{formatHours(w.timeSpentSeconds ?? 0)}</td>
              </tr>
            ))}
            {!worklogs.length ? (
              <tr>
                <td className="p-2 text-muted-foreground" colSpan={3}>
                  Nenhum worklog encontrado
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [] as string[];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(" ") || "0m";
}


