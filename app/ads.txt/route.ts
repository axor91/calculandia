import { adsTxt } from "@/lib/ads";

export const dynamic = "force-static";

export function GET(): Response {
  if (!adsTxt) {
    return new Response("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(adsTxt, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
