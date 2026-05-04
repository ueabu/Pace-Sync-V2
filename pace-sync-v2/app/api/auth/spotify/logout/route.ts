import { NextResponse } from "next/server";
import { revokeAllSpotifyCookiesJar } from "@/lib/spotify/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  revokeAllSpotifyCookiesJar(res.cookies);
  return res;
}
