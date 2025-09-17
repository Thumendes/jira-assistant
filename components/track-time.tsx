"use client";

import { Button } from "./ui/button";
import { useTrackTime } from "@/hooks/use-track-time";

type TracktTimeButtonProps = {
  lastIssueKey?: string;
};

export function TracktTimeButton({ lastIssueKey }: TracktTimeButtonProps) {
  const { trackTime } = useTrackTime({ lastIssueKey });

  return <Button onClick={() => trackTime()}>Registrar tempo</Button>;
}
