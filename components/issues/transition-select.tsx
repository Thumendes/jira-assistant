"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Transition = { id: string; name: string };

type Props = {
  issueKey: string;
};

export function TransitionSelectClient({ issueKey }: Props) {
  const [value, setValue] = useState<string | undefined>(undefined);
  const transitionsQuery = useQuery<{ transitions: Transition[] }>({
    queryKey: ["issue-transitions", issueKey],
    queryFn: async () => {
      const res = await fetch(`/api/jira/issue/${issueKey}/transitions`);
      if (!res.ok) throw new Error("Falha ao buscar transições");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (transitionId: string) => {
      const res = await fetch(`/api/jira/issue/${issueKey}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transitionId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Falha ao mudar status");
      }
      return res.json().catch(() => ({}));
    },
    onSuccess: async () => {
      toast.success("Status atualizado");
      await transitionsQuery.refetch();
      setValue(undefined);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    },
  });

  if (transitionsQuery.isLoading) {
    return null;
  }

  const transitions = transitionsQuery.data?.transitions ?? [];
  if (!transitions.length) return null;

  return (
    <Select
      value={value}
      onValueChange={(id) => {
        setValue(id);
        mutation.mutate(id);
      }}
      disabled={mutation.isPending}
    >
      <SelectTrigger size="default">
        <SelectValue
          placeholder={mutation.isPending ? "Mudando..." : "Mudar status"}
        />
      </SelectTrigger>
      <SelectContent>
        {transitions.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
