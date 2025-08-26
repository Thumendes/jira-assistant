"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/orpc";
import { trytm } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const CredentialsSchema = z.object({
  apiKey: z.string(),
  jiraApiKey: z.string(),
  jiraBaseUrl: z.string(),
  jiraEmailKey: z.string(),
});

export type CredentialsSchema = z.infer<typeof CredentialsSchema>;

type CredentialsFormProps = {
  defaultValues?: Partial<CredentialsSchema>;
};

export function CredentialsForm({ defaultValues }: CredentialsFormProps) {
  const router = useRouter();

  const form = useForm<CredentialsSchema>({
    defaultValues: {
      apiKey: defaultValues?.apiKey ?? "",
      jiraApiKey: defaultValues?.jiraApiKey ?? "",
      jiraBaseUrl: defaultValues?.jiraBaseUrl ?? "",
      jiraEmailKey: defaultValues?.jiraEmailKey ?? "",
    },
    resolver: zodResolver(CredentialsSchema),
  });

  async function onSubmit(data: CredentialsSchema) {
    const [response, error] = await trytm(client.credentials.set(data));

    if (error) {
      toast.error("Failed to save credentials", {
        description: error.message,
      });
    }

    if (response) {
      toast.success("Credentials saved");
      router.push("/");
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Credentials</h1>
          <p className="text-sm text-muted-foreground">
            Enter your OpenAI API Key and Jira API Key to get started.
          </p>
        </div>

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OpenAI API Key</FormLabel>
              <FormControl>
                <Input placeholder="OpenAI API Key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jiraApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira API Key</FormLabel>
              <FormControl>
                <Input placeholder="Jira API Key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jiraEmailKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Email Key</FormLabel>
              <FormControl>
                <Input placeholder="Jira Email Key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jiraBaseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Base URL</FormLabel>
              <FormControl>
                <Input placeholder="Jira Base URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
