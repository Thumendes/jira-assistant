"use client";

import { Issue, IssuesSchema } from "@/app/api/chat/issues/schema";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { DeepPartial } from "ai";
import { Loader2, LogOut, Pencil, StopCircle, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { dialog } from "../dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const ProblemFormValues = z.object({
  description: z.string(),
});

export type ProblemFormValues = z.infer<typeof ProblemFormValues>;

export function Chat() {
  const [issues, setIssues] = useState<Issue[]>([]);

  const form = useForm<ProblemFormValues>({
    defaultValues: {
      description: "",
    },
    resolver: zodResolver(ProblemFormValues),
  });

  const { object, isLoading, stop, submit } = useObject({
    schema: IssuesSchema,
    api: "/api/chat/issues",
    onFinish: (result) => {
      if (result.object?.issues) {
        console.log(result.object.issues);
        setIssues(result.object.issues);
      }
    },
  });

  async function onSubmit(data: ProblemFormValues) {
    submit({
      description: data.description,
      issues,
    });
  }

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col p-4 sm:p-6 lg:p-8 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h1 className="text-2xl font-bold">Jira AI</h1>

          <Button variant="outline" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {isLoading && (
          <div className="flex items-center justify-between gap-2 bg-muted p-4 rounded-md">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">Gerando tarefas...</p>
            </div>

            <Button variant="outline" size="icon" onClick={stop}>
              <StopCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do problema</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do problema" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Descreva o problema que você está enfrentando.
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button type="submit">Enviar</Button>
          </form>
        </Form>

        {issues.length > 0 && (
          <div className="flex items-center justify-between gap-2 bg-muted p-4 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-sm">Tarefas geradas</p>
            </div>

            <Button variant="outline">Publicar no Jira</Button>
          </div>
        )}
      </div>

      <div className="bg-muted p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {object?.issues?.map((issue, index) => (
              <IssueCard key={index} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {issues.map((issue, index) => (
              <IssueCard
                key={index}
                issue={issue}
                onDelete={() => {
                  setIssues(issues.filter((_, i) => i !== index));
                }}
                onEdit={(data) => {
                  setIssues(
                    issues.map((_, i) =>
                      i === index ? { ..._, ...data } : _
                    ) as Issue[]
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

type IssueCardProps = {
  issue?: DeepPartial<Issue>;
  onDelete?: () => void;
  onEdit?: (data: DeepPartial<Issue>) => void;
};

export function IssueCard({ issue, onDelete, onEdit }: IssueCardProps) {
  const description = useMemo(() => {
    return `**O que fazer?**\n
${issue?.description?.steps
  ?.map((step) => `- ${step?.description}`)
  .join("\n")}\n
**Resultado esperado**\n
${issue?.description?.expectedResult}`;
  }, [issue?.description]);

  async function handleEdit() {
    const result = await dialog.form("Editar tarefa", {
      schema: Issue,
      defaultValues: issue,
      form: (form) => (
        <div className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Título" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storyPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontos</FormLabel>
                <FormControl>
                  <Input placeholder="Pontos" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <IssueStepsForm control={form.control} />
        </div>
      ),
    });

    if (!result) return;

    onEdit?.(result);
  }

  return (
    <Card className="p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <p className="text-sm font-semibold break-words">{issue?.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{issue?.type}</Badge>
          {onEdit && (
            <Button variant="outline" size="icon" onClick={handleEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="icon" onClick={onDelete}>
              <Trash className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
      </p>
    </Card>
  );
}

type IssueStepsFormProps = {
  control: Control<Issue>;
};

export function IssueStepsForm({ control }: IssueStepsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "description.steps",
  });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <FormField
            control={control}
            name={`description.steps.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passo {index + 1}</FormLabel>
                <FormControl>
                  <Input className="w-full sm:w-auto flex-1" placeholder="Passo {index + 1}" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button variant="outline" size="icon" onClick={() => remove(index)}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" onClick={() => append({ description: "" })}>
        Adicionar passo
      </Button>
    </div>
  );
}
