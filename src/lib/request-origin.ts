import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

/**
 * Accept state-changing browser requests from the page's own origin only.
 *
 * `request.nextUrl.origin` can reflect the server bind address (for example
 * `0.0.0.0`) instead of the browser host in a self-hosted or proxied setup.
 * Comparing Origin with the forwarded host/protocol keeps the CSRF check valid
 * for localhost, Vercel previews, and reverse proxies alike.
 */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host = firstHeaderValue(request.headers.get("x-forwarded-host")) || request.headers.get("host") || "";
    const protocol = firstHeaderValue(request.headers.get("x-forwarded-proto")) || request.nextUrl.protocol.replace(/:$/, "");
    if (!host) return originUrl.origin === request.nextUrl.origin;
    return originUrl.protocol === `${protocol.toLowerCase()}:` && originUrl.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
