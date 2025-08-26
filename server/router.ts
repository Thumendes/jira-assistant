import { os } from "@orpc/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getWorklog } from "@/components/dashboard/get-worklog";
import { DateInterval } from "@/lib/jira/dateInterval";
import { Duration } from "@/lib/duration";
import { isWithinInterval, addDays, format } from "date-fns";
import { createJira } from "@/lib/jira/cache";

async function getWorklogData() {
  const worklogData = await getWorklog();

  // Criar intervalo do mês atual para ter todas as colunas
  const currentInterval = DateInterval.currentMonth();
  const allDates = currentInterval.createGrid();

  // Agrupar worklogs por dia e por issue
  const worklogByDate = new Map<string, Map<string, Duration>>();

  // Processar todos os worklogs
  worklogData.items.forEach((item) => {
    item.worklogs.forEach((worklog) => {
      const worklogDate = new Date(worklog.started!);

      // Encontrar qual dia do grid corresponde a este worklog
      const matchingDate = allDates.find((date) =>
        isWithinInterval(worklogDate, {
          start: date,
          end: addDays(date, 1),
        })
      );

      if (matchingDate) {
        const dateKey = format(matchingDate, "yyyy-MM-dd");
        const issueKey = item.issue.key!;

        if (!worklogByDate.has(dateKey)) {
          worklogByDate.set(dateKey, new Map());
        }

        const issueMap = worklogByDate.get(dateKey)!;
        const currentDuration = issueMap.get(issueKey) || Duration.seconds(0);
        const newDuration = Duration.seconds(worklog.timeSpentSeconds || 0);

        issueMap.set(
          issueKey,
          Duration.milliseconds(currentDuration.ms + newDuration.ms)
        );
      }
    });
  });

  // Calcular totais por dia
  const dailyTotals = new Map<string, Duration>();
  worklogByDate.forEach((issues, dateKey) => {
    let total = Duration.seconds(0);
    issues.forEach((duration) => {
      total = Duration.milliseconds(total.ms + duration.ms);
    });
    dailyTotals.set(dateKey, total);
  });

  // Obter todas as issues únicas
  const allIssues = new Set<string>();
  worklogData.items.forEach((item) => {
    allIssues.add(item.issue.key!);
  });

  return {
    worklogData,
    allDates,
    worklogByDate,
    dailyTotals,
    allIssues: Array.from(allIssues),
  };
}

export const router = {
  credentials: {
    get: os
      .handler(async () => {
        const cookiesStore = await cookies();
        const apiKey = cookiesStore.get("apiKey");
        const jiraApiKey = cookiesStore.get("jiraApiKey");
        const jiraBaseUrl = cookiesStore.get("jiraBaseUrl");
        const jiraEmailKey = cookiesStore.get("jiraEmailKey");

        return {
          apiKey: apiKey?.value,
          jiraApiKey: jiraApiKey?.value,
          jiraBaseUrl: jiraBaseUrl?.value,
          jiraEmailKey: jiraEmailKey?.value,
        };
      })
      .callable(),

    set: os
      .input(
        z.object({
          apiKey: z.string(),
          jiraApiKey: z.string(),
          jiraBaseUrl: z.string(),
          jiraEmailKey: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const cookiesStore = await cookies();
        cookiesStore.set("apiKey", input.apiKey);
        cookiesStore.set("jiraApiKey", input.jiraApiKey);
        cookiesStore.set("jiraBaseUrl", input.jiraBaseUrl);
        cookiesStore.set("jiraEmailKey", input.jiraEmailKey);

        return {
          apiKey: input.apiKey,
          jiraApiKey: input.jiraApiKey,
          jiraBaseUrl: input.jiraBaseUrl,
          jiraEmailKey: input.jiraEmailKey,
        };
      })
      .callable(),
  },

  worklog: {
    get: os
      .handler(async () => {
        try {
          const data = await getWorklogData();

          // Converter Maps para objetos serializáveis
          const worklogByDateObj: Record<string, Record<string, string>> = {};
          data.worklogByDate.forEach((issues, dateKey) => {
            worklogByDateObj[dateKey] = {};
            issues.forEach((duration, issueKey) => {
              worklogByDateObj[dateKey][issueKey] = duration.format();
            });
          });

          const dailyTotalsObj: Record<string, string> = {};
          data.dailyTotals.forEach((duration, dateKey) => {
            dailyTotalsObj[dateKey] = duration.format();
          });

          return {
            worklogData: {
              ...data.worklogData,
              totalTimeSpent: data.worklogData.totalTimeSpent.format(),
              items: data.worklogData.items.map((item) => ({
                ...item,
                totalTimeSpent: item.totalTimeSpent.format(),
                worklogs: item.worklogs.map((worklog) => ({
                  ...worklog,
                  started: worklog.started,
                  timeSpentSeconds: worklog.timeSpentSeconds,
                })),
              })),
            },
            allDates: data.allDates.map((date) => date.toISOString()),
            worklogByDate: worklogByDateObj,
            dailyTotals: dailyTotalsObj,
            allIssues: data.allIssues,
          };
        } catch (error) {
          throw new Error(
            `Erro ao buscar worklogs: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
        }
      })
      .callable(),

    trackTime: os
      .input(
        z.object({
          issueKey: z.string(),
          timeSpent: z.string(),
          date: z
            .string()
            .optional()
            .transform((str) => (str ? new Date(str) : new Date())),
        })
      )
      .handler(async ({ input }) => {
        try {
          const jira = await createJira();

          // Converter string para Duration
          const duration = Duration.fromExpression(input.timeSpent);

          // Definir o horário de início como meio dia da data selecionada
          const startTime = new Date(input.date);
          startTime.setHours(12, 0, 0, 0);

          // Chamar trackTime
          await jira.trackTime(input.issueKey, duration, {
            startedAt: startTime,
          });

          return { success: true };
        } catch (error) {
          throw new Error(
            `Erro ao registrar tempo: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
        }
      })
      .callable(),
  },
};
