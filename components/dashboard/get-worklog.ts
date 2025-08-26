import { createJira } from "@/lib/jira/cache";
import { DateInterval } from "@/lib/jira/dateInterval";
import { cache } from "react";

export const getWorklog = cache(async () => {
  const jira = await createJira();

  const worklog = await jira.getWorklog(DateInterval.currentMonth());

  return worklog;
});
