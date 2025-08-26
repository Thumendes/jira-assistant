import { CredentialsForm } from "@/components/chat/credentials/form";
import { cookies } from "next/headers";

export default async function CredentialsPage() {
  const cookiesStore = await cookies();

  const apiKey = cookiesStore.get("apiKey")?.value;
  const jiraApiKey = cookiesStore.get("jiraApiKey")?.value;
  const jiraBaseUrl = cookiesStore.get("jiraBaseUrl")?.value;
  const jiraEmailKey = cookiesStore.get("jiraEmailKey")?.value;

  return (
    <main className="container mx-auto max-w-xl py-24">
      <CredentialsForm
        defaultValues={{
          apiKey,
          jiraApiKey,
          jiraBaseUrl,
          jiraEmailKey,
        }}
      />
    </main>
  );
}
