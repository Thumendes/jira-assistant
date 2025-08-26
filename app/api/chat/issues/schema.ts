import { z } from "zod";

export const Issue = z.object({
  summary: z.string().describe("The summary of the issue"),
  type: z.enum(["bug", "task", "story"]).describe("The type of the issue"),
  storyPoints: z.number().optional().describe("The story points of the issue"),
  description: z.object({
    steps: z
      .array(z.object({ description: z.string() }))
      .describe("The steps to reproduce the issue"),
    expectedResult: z.string().describe("The expected result of the issue"),
  }),
});

export type Issue = z.infer<typeof Issue>;

export const IssuesSchema = z.object({
  issues: z.array(Issue),
});

export type IssuesSchema = z.infer<typeof IssuesSchema>;
