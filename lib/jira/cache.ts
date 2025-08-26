import { cache } from "react";
import { Jira } from "./client";

export const createJira = cache(() => Jira.get());
