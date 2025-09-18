import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Duration } from "@/lib/utils/duration";
import { addDays, format, isToday, isWithinInterval } from "date-fns";
import { TracktTimeButton } from "../track-time";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { getWorklog } from "./get-worklog";
import { IssueDayCell } from "./issue-day-cell";
import { getUserSettings } from "@/lib/settings/cache";
import { trytm } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

type IssueLite = { id?: string; key?: string; fields?: { summary?: string } };
type WorklogEntry = { started?: string; timeSpentSeconds?: number };
type WorklogItem = {
  issue: IssueLite;
  worklogs: WorklogEntry[];
  totalTimeSpent: Duration;
};

function secondsForIssueOnDate(item: WorklogItem, date: Date) {
  return (
    item.worklogs?.reduce((acc, log) => {
      if (!log.started) return acc;
      const started = new Date(log.started);
      const inDay = isWithinInterval(started, {
        start: date,
        end: addDays(date, 1),
      });
      return acc + (inDay ? (log.timeSpentSeconds ?? 0) : 0);
    }, 0) ?? 0
  );
}

export async function WorklogGrid() {
  const settings = await getUserSettings();
  const jiraBaseUrl = settings.get("jira-base-url");

  if (!jiraBaseUrl) {
    return (
      <Alert className="max-w-3xl" variant="destructive">
        <AlertTitle>Configuração do Jira ausente</AlertTitle>
        <AlertDescription>
          Para visualizar os worklogs, configure as credenciais do Jira em{" "}
          <Link href="/profile" className="underline font-medium">Perfil</Link>.
        </AlertDescription>
      </Alert>
    );
  }

  const [data, err] = await trytm(getWorklog());
  if (err) {
    return (
      <Alert className="max-w-3xl" variant="destructive">
        <AlertTitle>Erro ao carregar worklogs</AlertTitle>
        <AlertDescription>{err.message}</AlertDescription>
      </Alert>
    );
  }

  const days = data.grid as Array<{ date: Date; isWeekend: boolean }>;
  const items = data.items as WorklogItem[];

  return (
    <>
      <header className="flex items-center justify-between py-4">
        <h3 className="text-2xl font-bold">Worklogs por dia</h3>

        <div>
          <TracktTimeButton />
        </div>
      </header>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarefa</TableHead>
              {days.map(({ date, isWeekend }) => {
                const today = isToday(date);
                return (
                  <TableHead
                    key={date.toString()}
                    className={
                      today
                        ? "bg-blue-500/10 text-blue-600 border-t border-x border-blue-400"
                        : isWeekend
                          ? "text-muted-foreground"
                          : undefined
                    }
                  >
                    {format(date, "dd/MM")}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.issue.id ?? item.issue.key}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={`${jiraBaseUrl}/browse/${item.issue.key}`} target="_blank" rel="noopener noreferrer">
                          <div className="max-w-[22rem] truncate">
                            <span className="font-medium">{item.issue.key ?? ""}</span>
                            {item.issue.fields?.summary ? (
                              <span className="text-muted-foreground"> — {item.issue.fields.summary}</span>
                            ) : null}
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.issue.fields?.summary}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                {days.map(({ date, isWeekend }) => {
                  const seconds = secondsForIssueOnDate(item, date);
                  const value = seconds > 0 ? Duration.seconds(seconds).format() : "—";
                  const today = isToday(date);
                  return (
                    <IssueDayCell
                      key={`${item.issue.id ?? item.issue.key}-${date.toString()}`}
                      className={cn(
                        "text-center",
                        today
                          ? "bg-blue-500/10 border-x border-blue-400"
                          : isWeekend
                            ? "bg-muted/50 text-muted-foreground"
                            : undefined,
                      )}
                      issueKey={item.issue.key ?? ""}
                      issueSummary={item.issue.fields?.summary}
                      dateISO={date.toISOString()}
                      isToday={today}
                      isWeekend={isWeekend}
                      seconds={seconds}
                      displayValue={value}
                      worklogs={item.worklogs}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total do dia</TableCell>
              {days.map(({ date, isWeekend }) => {
                const totalSeconds = items.reduce((acc, item) => acc + secondsForIssueOnDate(item, date), 0);
                const value = totalSeconds > 0 ? Duration.seconds(totalSeconds).format() : "—";
                const today = isToday(date);
                return (
                  <TableCell
                    key={`total-${date.toString()}`}
                    className={
                      today
                        ? "bg-blue-500/10 border-x border-b border-blue-400"
                        : isWeekend
                          ? "bg-muted/30 text-muted-foreground"
                          : undefined
                    }
                  >
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-between py-4">
        <div className="text-muted-foreground">
          Período: {format(new Date(data.from), "dd/MM/yyyy")} — {format(new Date(data.to), "dd/MM/yyyy")}
        </div>
        <div className="font-semibold">
          Total no período: {data.totalTimeSpent?.format?.() ?? String(data.totalTimeSpent)}
        </div>
      </div>
    </>
  );
}
