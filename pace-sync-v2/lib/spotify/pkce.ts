import "server-only";
import { randomBytes } from "node:crypto";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createPkceChallengePair() {
  const codeVerifier = base64url(randomBytes(48));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = base64url(Buffer.from(new Uint8Array(digest)));
  return { codeVerifier, codeChallenge };
}

export function randomOAuthState() {
  return base64url(randomBytes(24));
}
