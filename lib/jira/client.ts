import { addDays, format, isWeekend, isWithinInterval } from "date-fns";
import { JiraClient } from "./api";
import { components } from "./schema";
import { IssueStatus } from "./types";
import { DateInterval } from "../utils/dateInterval";
import { Duration } from "../utils/duration";

type JQLOptions = {
  fields?: string[];
  maxResults?: number;
};

type WorklogOptions =
  | {
      from: string | Date;
      to: string | Date;
    }
  | DateInterval;

export class Jira {
  constructor(private readonly client: JiraClient) {}

  async jql(jql: string, { fields = ["*all"], maxResults }: JQLOptions = {}) {
    console.log(`JQL: ${jql}`);

    const data = await this.try(
      this.client.POST("/rest/api/3/search/jql", {
        body: { fields, maxResults: maxResults ?? 1000, jql },
      })
    );

    if (!data.issues) return [];

    console.log(data);

    return data.issues;
  }

  async getWorklog(options: WorklogOptions) {
    const interval =
      options instanceof DateInterval
        ? options
        : DateInterval.builder().from(options.from).to(options.to).build();

    const { from, to } = interval.formatted();

    const me = await this.me();

    const jql = `worklogDate >= "${from}" and worklogDate <= "${to}" and worklogAuthor=currentUser()`;

    const data = await this.jql(jql, {
      fields: [
        "worklog",
        "parent",
        "priority",
        "summary",
        "status",
        "project",
        "issuetype",
      ],
    });

    // Calcula o total de tempo gasto em cada issue
    const items = data.map((issue) => {
      const worklog = issue.fields
        ?.worklog as components["schemas"]["PageOfWorklogs"];

      const worklogs =
        worklog.worklogs?.filter((worklog) => {
          return worklog.author?.accountId === me.accountId;
        }) ?? [];

      const totalTimeSpent = worklogs.reduce((acc, worklog) => {
        const seconds = worklog.timeSpentSeconds ?? 0;
        return acc + seconds;
      }, 0);

      return {
        issue,
        worklogs,
        totalTimeSpent: Duration.seconds(totalTimeSpent ?? 0),
      };
    });

    // Calcula o total de tempo gasto em todas as issues
    const totalTimeSpent = items.reduce((acc, item) => {
      return acc.add(item.totalTimeSpent);
    }, Duration.seconds(0));

    // Cria o grid de datas com os itens de cada dia
    const grid = interval.createGrid().map((date) => {
      const dateItems = items.filter((item) => {
        return item.worklogs.some((worklog) => {
          return isWithinInterval(new Date(worklog.started!), {
            start: date,
            end: addDays(date, 1),
          });
        });
      });

      return {
        date,
        items: dateItems,
        isWeekend: isWeekend(date),
      };
    });

    return {
      from,
      to,
      items,
      totalTimeSpent,
      grid,
    };
  }

  async getIssue(
    issueIdOrKey: string,
    { fields = ["*all"] }: { fields?: string[] } = {}
  ) {
    const data = await this.try(
      this.client.GET("/rest/api/3/issue/{issueIdOrKey}", {
        params: { path: { issueIdOrKey }, query: { fields: fields } },
      })
    );

    return data;
  }

  async getTransitions(issueIdOrKey: string) {
    const data = await this.try(
      this.client.GET("/rest/api/3/issue/{issueIdOrKey}/transitions", {
        params: { path: { issueIdOrKey } },
      })
    );

    return data;
  }

  async getIssueWorklogs(issueIdOrKey: string) {
    const data = await this.try(
      this.client.GET("/rest/api/3/issue/{issueIdOrKey}/worklog", {
        params: { path: { issueIdOrKey } },
      })
    );

    console.log(JSON.stringify(data, null, 2));

    return data;
  }

  async transitionIssue(issueIdOrKey: string, transitionId: string) {
    const body = { transition: { id: transitionId } } as const;

    const data = await this.try(
      this.client.POST("/rest/api/3/issue/{issueIdOrKey}/transitions", {
        params: { path: { issueIdOrKey } },
        body,
      })
    );

    return data;
  }

  async trackTime(
    issueIdOrKey: string,
    timeSpentSeconds: number | Duration,
    { startedAt }: { startedAt?: Date } = {}
  ) {
    const seconds =
      typeof timeSpentSeconds === "number"
        ? timeSpentSeconds
        : timeSpentSeconds.seconds;

    const started = startedAt ?? new Date(Date.now() - seconds * 1000);

    const body = {
      timeSpentSeconds: seconds,
      started: format(started, "yyyy-MM-dd'T'HH:mm:ss.SSSXX"),
    };

    console.log(body);

    const data = await this.try(
      this.client.POST("/rest/api/3/issue/{issueIdOrKey}/worklog", {
        params: { path: { issueIdOrKey } },
        body,
      })
    );

    console.log(data);

    return data;
  }

  async getMyWorkingIssues(status?: IssueStatus | IssueStatus[]) {
    const filter: string[] = [`assignee=currentUser()`];

    if (status) {
      if (Array.isArray(status)) {
        filter.push(`status in (${status.join(",")})`);
      } else {
        filter.push(`status = ${status}`);
      }
    }

    const jql = filter.join(" and ");

    return this.jql(jql);
  }

  async me() {
    const data = await this.try(this.client.GET("/rest/api/3/myself"));
    return data;
  }

  private async try<
    Value extends
      | { data: unknown; error?: never; response: Response }
      | { data?: never; error: unknown; response: Response }
  >(promise: Promise<Value>): Promise<NonNullable<Value["data"]>> {
    const { data, error, response } = await promise;

    if (response.ok && !data) {
      return {} as NonNullable<Value["data"]>;
    }

    if (error || !data) {
      const context = JSON.stringify(error, null, 2);
      throw new Error(`Jira API Error (${response.status})\n${context}`);
    }

    return data;
  }
}
