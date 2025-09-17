import { User } from "better-auth";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export type RootLayoutProps = {
  children: React.ReactNode;
  user: User;
};

export function RootLayout({ children, user }: RootLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
