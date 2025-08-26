import { WorklogGrid } from "@/components/dashboard/grid";
import { WorklogStats } from "@/components/dashboard/stats";

export default async function AppPage() {
  return (
    <main className="container mx-auto">
      <WorklogStats />

      <WorklogGrid />
    </main>
  );
}
