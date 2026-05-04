"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/spotify/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-sm text-stone-700"
      onClick={handleLogout}
    >
      Log out
    </Button>
  );
}
