"use client";

import { SiteHeader } from "./site-header";

type PageLayoutProps = {
  children: React.ReactNode;
  title?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function PageLayout({
  children,
  title,
  className,
  ...props
}: PageLayoutProps) {
  return (
    <>
      <SiteHeader title={title} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          {/*<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>*/}

          <main className={className} {...props}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
