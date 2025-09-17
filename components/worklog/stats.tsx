import { getWorklog } from "./get-worklog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, isAfter } from "date-fns";

type Props = {
  targetHours?: number;
};

function formatHours(value: number) {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export async function WorklogStats({ targetHours = 160 }: Props) {
  const data = await getWorklog();

  const today = new Date();
  const monthFrom = new Date(data.from);
  const monthTo = new Date(data.to);

  const days = data.grid as Array<{ date: Date; isWeekend: boolean }>;

  const workingDays = days.filter((d) => !d.isWeekend);
  const totalWorkingDays = workingDays.length;

  const elapsedWorkingDays = workingDays.filter((d) => !isAfter(d.date, today)).length;
  const remainingWorkingDays = Math.max(0, totalWorkingDays - elapsedWorkingDays);

  const loggedHours = (data.totalTimeSpent?.hours as number) ?? 0;

  const remainingHours = Math.max(0, targetHours - loggedHours);

  const baselineDailyHours = totalWorkingDays > 0 ? targetHours / totalWorkingDays : 0;
  const requiredDailyHours = remainingWorkingDays > 0 ? remainingHours / remainingWorkingDays : 0;

  const monthProgressPct =
    totalWorkingDays > 0 ? Math.min(100, Math.max(0, (elapsedWorkingDays / totalWorkingDays) * 100)) : 0;
  const hoursProgressPct = targetHours > 0 ? Math.min(100, Math.max(0, (loggedHours / targetHours) * 100)) : 0;

  const expectedHoursByNow = elapsedWorkingDays * baselineDailyHours;
  const deviation = loggedHours - expectedHoursByNow;
  const status: {
    label: string;
    tone: "default" | "secondary" | "destructive";
  } =
    deviation < -1
      ? { label: "Atrasado", tone: "destructive" }
      : deviation > 1
        ? { label: "Adiantado", tone: "secondary" }
        : { label: "No ritmo", tone: "default" };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Resumo do mês</CardTitle>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Dias úteis no mês</div>
            <div className="text-2xl font-semibold">{totalWorkingDays}</div>
            <div className="text-xs text-muted-foreground">
              {format(monthFrom, "dd/MM")} — {format(monthTo, "dd/MM")}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Dias úteis decorridos</div>
            <div className="text-2xl font-semibold">{elapsedWorkingDays}</div>
            <div className="text-xs text-muted-foreground">Faltam {remainingWorkingDays}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Ritmo necessário (restante)</div>
            <div className="text-2xl font-semibold">{formatHours(requiredDailyHours)}</div>
            <div className="text-xs text-muted-foreground">Média alvo: {formatHours(baselineDailyHours)}/dia</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-end justify-between">
              <div className="text-sm text-muted-foreground">Horas registradas</div>
              <div className="text-sm font-medium">
                {formatHours(loggedHours)} / {targetHours}h
              </div>
            </div>
            <Progress value={hoursProgressPct} />
          </div>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <div className="text-sm text-muted-foreground">Progresso do mês (dias úteis)</div>
              <div className="text-sm font-medium">{Math.round(monthProgressPct)}%</div>
            </div>
            <Progress value={monthProgressPct} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Esperado até agora</div>
            <div className="text-xl font-medium">{formatHours(expectedHoursByNow)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Faltando para meta</div>
            <div className={`text-xl font-medium ${remainingHours > 0 ? "" : "text-muted-foreground"}`}>
              {formatHours(remainingHours)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Desvio</div>
            <div
              className={`text-xl font-medium ${
                deviation < -1 ? "text-destructive" : deviation > 1 ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {deviation >= 0 ? "+" : ""}
              {formatHours(Math.abs(deviation))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t">
        <div className="text-sm text-muted-foreground">Meta mensal</div>
        <div className="text-sm font-medium">{targetHours} horas</div>
      </CardFooter>
    </Card>
  );
}
