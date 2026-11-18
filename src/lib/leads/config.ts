// Server-only configuration for lead delivery. Read from environment variables
// (Vercel → Project → Settings → Environment Variables). Nothing here is ever
// exposed to the browser: none of these names start with PUBLIC_.
export type LeadsConfig = {
  siteUrl: string | null;
  rateLimitPerMinute: number;
  ipSalt: string;
  supabase: { url: string; serviceRoleKey: string; table: string } | null;
  highlevel: {
    token: string; locationId: string; apiVersion: string; baseUrl: string;
    pipelineId: string | null; pipelineStageId: string | null;
  } | null;
  odoo: { baseUrl: string; apiKey: string; database: string | null } | null;
};

export const DEFAULT_ODOO_BASE_URL = 'https://crm.mansasmoguls.com';

/** HTTPS only (the API key travels in a header); plain http is allowed for local testing. */
function odooBaseUrl(value: string | null): string | null {
  try {
    const u = new URL(value ?? DEFAULT_ODOO_BASE_URL);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return null;
    return `${u.origin}${u.pathname}`.replace(/\/+$/, '');
  } catch { return null; }
}

type Env = Record<string, string | undefined>;

export function readConfig(env: Env = process.env): LeadsConfig {
  const v = (k: string) => (env[k] ?? '').trim() || null;
  const supaUrl = v('SUPABASE_URL'), supaKey = v('SUPABASE_SERVICE_ROLE_KEY');
  const ghlToken = v('HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN'), ghlLocation = v('HIGHLEVEL_LOCATION_ID');
  const rate = Number(v('LEADS_RATE_LIMIT_PER_MINUTE') ?? 5);
  const odooKey = v('ODOO_API_KEY'), odooUrl = odooBaseUrl(v('ODOO_BASE_URL'));
  return {
    siteUrl: v('SITE_URL'),
    rateLimitPerMinute: Number.isFinite(rate) && rate > 0 ? Math.floor(rate) : 5,
    ipSalt: v('LEADS_IP_SALT') ?? 'mansas-moguls',
    supabase: supaUrl && supaKey ? { url: supaUrl.replace(/\/+$/, ''), serviceRoleKey: supaKey, table: v('SUPABASE_LEADS_TABLE') ?? 'leads' } : null,
    highlevel: ghlToken && ghlLocation ? {
      token: ghlToken, locationId: ghlLocation,
      apiVersion: v('HIGHLEVEL_API_VERSION') ?? '2021-07-28',
      baseUrl: (v('HIGHLEVEL_BASE_URL') ?? 'https://services.leadconnectorhq.com').replace(/\/+$/, ''),
      pipelineId: v('HIGHLEVEL_PIPELINE_ID'), pipelineStageId: v('HIGHLEVEL_PIPELINE_STAGE_ID'),
    } : null,
    odoo: odooKey && odooUrl ? { baseUrl: odooUrl, apiKey: odooKey, database: v('ODOO_DATABASE') } : null,
  };
}
