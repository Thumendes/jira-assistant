import { AppNavbar } from "@/components/layout/nav";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return redirect("/login");
  }

  return (
    <>
      <AppNavbar user={session.user} />
      {children}
    </>
  );
}
