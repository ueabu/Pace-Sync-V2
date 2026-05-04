import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "pacelist_session";

export type PacelistSession = {
  accessToken: string;
  user: {
    id: string;
    display_name?: string;
  };
};

export async function getSession(): Promise<PacelistSession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PacelistSession;
    if (
      typeof parsed.accessToken !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
