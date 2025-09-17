import { Jira } from "@/lib/jira/client";
import { jiraClientFactory } from "@/lib/jira/factory";
import { DateInterval } from "@/lib/utils/dateInterval";
import { cache } from "react";

export const getWorklog = cache(async () => {
  const jiraClient = await jiraClientFactory();
  const jira = new Jira(jiraClient);

  const worklog = await jira.getWorklog(DateInterval.currentMonth());

  return worklog;
});
