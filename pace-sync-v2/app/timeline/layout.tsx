import { redirect } from "next/navigation";

import { isLoggedIn } from "@/lib/auth/session";

export default async function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    redirect("/");
  }

  return children;
}
