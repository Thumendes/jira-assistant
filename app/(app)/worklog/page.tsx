import { PageLayout } from "@/components/layout/page-layout";
import { WorklogGrid } from "@/components/worklog/grid";
import { WorklogStats } from "@/components/worklog/stats";

type ProfilePageProps = Record<string, never>;

export default function ProfilePage({}: ProfilePageProps) {
  return (
    <PageLayout title="Worklog">
      <main className="p-6">
        <WorklogStats />
        <WorklogGrid />
      </main>
    </PageLayout>
  );
}
