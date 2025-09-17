"use client";

import { useTrackTime } from "@/hooks/use-track-time";
import { cn } from "@/lib/utils";
import { addDays, format, isWithinInterval } from "date-fns";
import { dialog } from "../dialog";
import { Button } from "../ui/button";
import { TableCell } from "../ui/table";

type WorklogEntry = { started?: string; timeSpentSeconds?: number };

type IssueDayCellProps = {
  className?: string;
  issueKey: string;
  issueSummary?: string;
  dateISO: string;
  isToday: boolean;
  isWeekend: boolean;
  seconds: number;
  displayValue: string;
  worklogs: WorklogEntry[];
};

function IssueLogsModalContent(props: {
  issueKey: string;
  issueSummary?: string;
  dateISO: string;
  worklogs: WorklogEntry[];
}) {
  const { issueKey, dateISO, worklogs } = props;
  const { trackTime } = useTrackTime({ lastIssueKey: issueKey });

  const selectedDate = new Date(dateISO);

  const sortedLogs = [...(worklogs ?? [])].sort((a, b) => {
    const da = a.started ? new Date(a.started).getTime() : 0;
    const db = b.started ? new Date(b.started).getTime() : 0;
    return db - da;
  });

  function isSameGridDay(dateStr?: string) {
    if (!dateStr) return false;
    const started = new Date(dateStr);
    return isWithinInterval(started, {
      start: selectedDate,
      end: addDays(selectedDate, 1),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">Worklogs</div>
        </div>

        <Button onClick={() => trackTime({ issueKey, date: dateISO })} variant="default">
          Registrar tempo
        </Button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {sortedLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum log encontrado para esta tarefa.</div>
        ) : (
          sortedLogs.map((log, idx) => {
            const highlight = isSameGridDay(log.started);
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between rounded-md border p-2",
                  highlight ? "bg-blue-50 border-blue-200" : "",
                )}
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {log.started ? format(new Date(log.started), "dd/MM/yyyy HH:mm") : "Sem data"}
                  </div>
                  <div className="text-muted-foreground">{highlight ? "Neste dia" : "Outro dia"}</div>
                </div>
                <div className="text-sm font-mono">
                  {(log.timeSpentSeconds ?? 0) / 3600 > 0
                    ? `${Math.floor((log.timeSpentSeconds ?? 0) / 3600)}h ${
                        Math.round((((log.timeSpentSeconds ?? 0) % 3600) / 60) * 10) / 10
                      }m`
                    : `${Math.round(((log.timeSpentSeconds ?? 0) / 60) * 10) / 10}m`}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function IssueDayCell(props: IssueDayCellProps) {
  const { className, issueKey, issueSummary, dateISO, displayValue, worklogs } = props;

  async function openModal() {
    await dialog.info(`${issueKey} — Logs`, {
      description: issueSummary,
      info: () => (
        <IssueLogsModalContent issueKey={issueKey} issueSummary={issueSummary} dateISO={dateISO} worklogs={worklogs} />
      ),
      contentClassname: "sm:max-w-2xl",
      closeText: "Fechar",
    });
  }

  return (
    <TableCell
      onClick={openModal}
      className={cn("cursor-pointer hover:bg-accent/40 transition-colors text-center", className)}
    >
      {displayValue}
    </TableCell>
  );
}
