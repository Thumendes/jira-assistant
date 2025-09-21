"use client";

import { type Project } from "@/lib/jira/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type SelectProjectProps = {
  projects: Project[];
};

import { initials } from "@/lib/utils";
import { useMemo } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import Link from "next/link";

export const SelectProjectSchema = z.object({
  search: z.string().optional(),
  project: z.string(),
});

export type SelectProjectSchema = z.infer<typeof SelectProjectSchema>;

export function SelectProject({ projects }: SelectProjectProps) {
  const form = useForm<SelectProjectSchema>({
    defaultValues: {
      search: "",
      project: "",
    },
    resolver: zodResolver(SelectProjectSchema),
  });

  async function onSubmit(data: SelectProjectSchema) {
    console.log(data);
  }

  const search = form.watch("search");

  const projectsFiltered = useMemo(() => {
    if (!search) return projects;

    return projects.filter((project) =>
      project.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, projects]);

  form.watch("project");

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pesquisar</FormLabel>
                <FormControl>
                  <Input placeholder="Pesquisar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ul className="flex flex-col gap-2 min-w-full max-w-2xl">
            {projectsFiltered.map((project) => (
              <Link href={`/timeline/${project.key}`} key={project.id}>
                <li
                  key={project.id}
                  className="cursor-pointer p-2 rounded-md hover:bg-accent flex justify-between w-full"
                  onClick={() => {
                    form.setValue("project", project.key!);
                    console.log("project", project);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={project.avatarUrls?.["24x24"]} />
                      <AvatarFallback>{initials(project.name!)}</AvatarFallback>
                    </Avatar>

                    <span className="font-medium">{project.name}</span>
                  </div>

                  <Badge variant="outline">{project.key}</Badge>
                </li>
              </Link>
            ))}
          </ul>
        </form>
      </Form>
    </div>
  );
}
