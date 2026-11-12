import { activeProviders } from "@/lib/ai";

// Names of the AI services this deployment sends data to. Public and holds no secrets:
// the iOS consent screen reads it so the disclosure always matches the server.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(activeProviders(), { headers: { "Cache-Control": "no-store" } });
}
