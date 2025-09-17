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
  summary: string;
  description: unknown;
  created: string;
  timeestimate?: number | null;
  aggregatetimeestimate?: number | null;
  timeoriginalestimate?: number | null;
  project?: components["schemas"]["Project"];
  priority?: components["schemas"]["Priority"];
  assignee?: components["schemas"]["User"];
  status?: components["schemas"]["Status"] & { id: string; name: string };
  issuetype?: components["schemas"]["IssueTypeDetails"];
  worklog?: components["schemas"]["PageOfWorklogs"];
  duedate?: string;
  customfield_10078?: number | null;
  customfield_10021?: object | null;
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
