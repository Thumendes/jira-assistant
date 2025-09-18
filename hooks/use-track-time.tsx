import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { dialog } from "@/components/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DateTimePicker from "@/components/ui/date-time-picker";

type TrackTimeMutation = {
  issueKey: string;
  timeSpent: string;
  date?: string;
};

type UseTrackTimeProps = {
  lastIssueKey?: string;
  onSuccess?: () => void;
};

export function useTrackTime({ lastIssueKey, onSuccess }: UseTrackTimeProps) {
  const trackTimeMutation = useMutation({
    mutationFn: async (data: TrackTimeMutation) => {
      const res = await fetch("/api/jira/track-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Erro ao registrar horas");
      }

      return json;
    },
    onSuccess: () => {
      toast.success("Horas registradas com sucesso");
      onSuccess?.();
    },
    onError: (error) => toast.error(`Houve um erro: ${error.message}`),
  });

  async function trackTime(options?: { issueKey?: string; date?: string }) {
    await dialog.form(`Registrar horas`, {
      schema: z.object({
        issueKey: z.string(),
        timeSpent: z.string(),
        date: z.iso.datetime().optional(),
      }),
      defaultValues: {
        issueKey: options?.issueKey ?? lastIssueKey,
        date: options?.date ?? new Date().toISOString(),
      },
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    labelDate="Data"
                    labelTime="Hora"
                  />
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
        });

        console.log(response);
      },
    });
  }

  return { trackTime };
}
