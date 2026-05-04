import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils/cn";

type AppShellProps = {
  authenticated: boolean;
  children: React.ReactNode;
  mainClassName?: string;
};

export function AppShell({
  authenticated,
  children,
  mainClassName,
}: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="font-semibold tracking-tight text-foreground"
          >
            Pacelist
          </Link>
          {authenticated ? <LogoutButton /> : null}
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6", mainClassName)}>
        {children}
      </main>
    </div>
  );
}
