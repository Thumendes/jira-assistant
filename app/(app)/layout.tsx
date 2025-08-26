import { ThemeSwitch } from "@/components/theme-switch";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({ children }: AppLayoutProps) {
  const cookiesStore = await cookies();

  const apiKey = cookiesStore.get("apiKey");
  const jiraApiKey = cookiesStore.get("jiraApiKey");
  const jiraBaseUrl = cookiesStore.get("jiraBaseUrl");
  const jiraEmailKey = cookiesStore.get("jiraEmailKey");

  if (!apiKey || !jiraApiKey || !jiraBaseUrl || !jiraEmailKey) {
    return redirect("/credentials");
  }

  return (
    <>
      {/* Navigation */}
      <nav className="py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Jira Utils</h3>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitch />

            <Link href="/">Home</Link>
            <Link href="/credentials">Credentials</Link>
            <Link href="/refiner">Refiner</Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            <span>Jira Utils</span>
            <span>—</span>
            <span>{new Date().getFullYear()}</span>
          </p>
        </div>
      </footer>
    </>
  );
}
