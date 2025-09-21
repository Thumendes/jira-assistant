import { Duration } from "../utils/duration";
import type { components } from "./schema";

export const IssueType = {
  Bug: "10004",
  Improvement: "10015",
  Task: "10002",
  Story: "10001",
  Meeting: "10019",
  Refinement: "10021",
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const IssueTypeLabel = {
  [IssueType.Bug]: "Bug",
  [IssueType.Improvement]: "Melhoria",
  [IssueType.Task]: "Tarefa",
  [IssueType.Story]: "História",
  [IssueType.Meeting]: "Reunião",
  [IssueType.Refinement]: "Refinamento",
} satisfies Record<IssueType, string>;

export const IssueStatus = {
  Backlog: "10000",
  Prioritized: "10020",
  Refinement: "10021",
  Ready: "10022",
  Todo: "10023",
  Doing: "3",
  ToTest: "10003",
  InTest: "10004",
  CustomerApproval: "10005",
  Publish: "10006",
  Done: "10002",
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export type IssueFields = {
  // Core
  summary: string;
  // Jira Cloud uses ADF (Atlassian Document Format); keep as unknown to avoid tight coupling
  description?: unknown;
  created: string; // ISO date-time string

  // Time tracking (top-level numeric aggregations)
  timeestimate?: number | null;
  aggregatetimeestimate?: number | null;
  timeoriginalestimate?: number | null;
  aggregatetimeoriginalestimate?: number | null;
  timespent?: number | null;
  aggregatetimespent?: number | null;
  timetracking?: components["schemas"]["TimeTrackingDetails"];

  // Relations & metadata
  project?: components["schemas"]["Project"];
  priority?: components["schemas"]["Priority"];
  assignee?: components["schemas"]["User"];
  reporter?: components["schemas"]["User"];
  creator?: components["schemas"]["User"];
  status?: components["schemas"]["StatusDetails"];
  issuetype?: components["schemas"]["IssueTypeDetails"];
  parent?: components["schemas"]["IssueBean"] | null;
  labels?: string[];
  components?: components["schemas"]["ProjectComponent"][];
  issuelinks?: components["schemas"]["IssueLink"][];
  fixVersions?: components["schemas"]["Version"][];
  versions?: components["schemas"]["Version"][];
  watches?: components["schemas"]["Watchers"];
  votes?: components["schemas"]["Votes"];
  worklog?: components["schemas"]["PageOfWorklogs"];
  comment?: components["schemas"]["PageOfComments"];

  // Dates & resolution
  duedate?: string | null; // yyyy-MM-dd
  resolutiondate?: string | null;
  resolution?: components["schemas"]["Resolution"] | null;
  lastViewed?: string | null;
  statuscategorychangedate?: string | null;

  // Custom fields present in the real sample
  customfield_10016?: number | null; // Story Points
  customfield_10014?: string | null; // Epic Link (issue key)
  customfield_10078?: number | null;
  customfield_10021?: object | null;

  // Misc
  environment?: string | null;
  // Subtasks are represented as IssueBean in many responses; keep loose typing here
  subtasks?: components["schemas"]["IssueBean"][];
};

export const StoryPoint = {
  Simple: "1",
  Medium: "2",
  Complex: "3",
} as const;

export type StoryPoint = (typeof StoryPoint)[keyof typeof StoryPoint];

export const TimeEstimate = {
  [StoryPoint.Simple]: Duration.hours(3),
  [StoryPoint.Medium]: Duration.hours(6),
  [StoryPoint.Complex]: Duration.hours(10),
} satisfies Record<StoryPoint, Duration>;
