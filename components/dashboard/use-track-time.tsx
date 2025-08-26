import { client } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { dialog } from "../dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

type TrackTimeMutation = {
  issueKey: string;
  timeSpent: string;
  date?: string;
};

type UseTrackTimeProps = {
  lastIssueKey?: string;
};

export function useTrackTime({ lastIssueKey }: UseTrackTimeProps) {
  const trackTimeMutation = useMutation({
    mutationFn: (data: TrackTimeMutation) => client.worklog.trackTime(data),
    onSuccess: () => toast.success("Horas registradas com sucesso"),
    onError: (error) => toast.error(`Houve um erro: ${error.message}`),
  });

  async function trackTime(options?: { issueKey?: string; date?: string }) {
    await dialog.form(`Registrar horas`, {
      schema: z.object({ issueKey: z.string(), timeSpent: z.string() }),
      defaultValues: { issueKey: options?.issueKey ?? lastIssueKey },
      form: (form) => (
        <>
          <FormField
            control={form.control}
            name="issueKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarefa</FormLabel>
                <FormControl>
                  <Input placeholder="PROJ-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo</FormLabel>
                <FormControl>
                  <Input placeholder="1h 30m" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ),
      async handler({ data }) {
        const response = await trackTimeMutation.mutateAsync({
          ...data,
          date: options?.date,
        });

        console.log(response);
      },
    });
  }

  return { trackTime };
}
