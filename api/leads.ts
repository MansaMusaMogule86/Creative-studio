// Vercel Function: POST /api/leads (Node runtime, Web-standard signature).
// The Astro site stays fully static; Vercel deploys files in /api alongside it.
// All logic lives in src/lib/leads/handler.ts (unit-tested in tests/).
import { handleLeadRequest } from '../src/lib/leads/handler';
import { readConfig } from '../src/lib/leads/config';

export async function POST(request: Request): Promise<Response> {
  return handleLeadRequest(request, { config: readConfig() });
}

export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ ok: false, code: 'method_not_allowed' }), { status: 405, headers: { Allow: 'POST', 'Content-Type': 'application/json' } });
}
