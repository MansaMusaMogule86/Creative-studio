// Transparent, deterministic intent matcher for the Ask Moguls service finder.
// It scores services by keyword overlap. It is NOT a language model, and the
// UI says so. A real model can replace `match` behind a server endpoint later
// without changing the interface.
import { allServices, divisions } from '../data/divisions';

const STOP = new Set('a an the i we my our me you your to for of and or in on with how can do does need want is are be it that this get more some build make help us from at by about'.split(' '));

// Extra vocabulary people actually use, mapped to service slugs.
const SYNONYMS: Record<string, string[]> = {
  website: ['premium-websites', 'ux-ui-design'], site: ['premium-websites'], landing: ['premium-websites', 'conversion-optimization'],
  app: ['mobile-applications', 'web-applications'], ios: ['mobile-applications'], android: ['mobile-applications'],
  shop: ['e-commerce'], store: ['e-commerce'], ecommerce: ['e-commerce'], shopify: ['e-commerce'], sell: ['e-commerce', 'lead-generation'],
  saas: ['saas-platforms', 'business-model-development'], platform: ['saas-platforms', 'digital-product-development'], subscription: ['saas-platforms', 'business-model-development'],
  integrate: ['api-integrations', 'custom-ai-integrations'], api: ['api-integrations'], software: ['custom-software'], tool: ['custom-software'], dashboard: ['custom-software', 'analytics-attribution'],
  ai: ['ai-agents', 'ai-transformation', 'custom-ai-integrations'], automate: ['workflow-automation', 'business-process-automation', 'ai-agents'], automation: ['workflow-automation', 'business-process-automation'],
  chatbot: ['intelligent-chatbots'], chat: ['intelligent-chatbots'], bot: ['intelligent-chatbots', 'ai-agents'], agent: ['ai-agents'], agents: ['ai-agents'],
  voice: ['ai-voice-assistants'], phone: ['ai-voice-assistants'], calls: ['ai-voice-assistants'], support: ['intelligent-chatbots', 'knowledge-assistants'],
  crm: ['ai-crm', 'marketing-automation'], sales: ['ai-crm', 'lead-generation'], documents: ['knowledge-assistants'], knowledge: ['knowledge-assistants'],
  image: ['computer-vision'], camera: ['computer-vision'], video: ['computer-vision', 'motion-graphics', 'content-production'],
  leads: ['lead-generation', 'paid-advertising', 'conversion-optimization'], lead: ['lead-generation'], customers: ['lead-generation', 'performance-marketing'],
  seo: ['seo', 'local-seo'], google: ['seo', 'google-business-profile', 'paid-advertising'], search: ['seo', 'paid-advertising'], rank: ['seo'], local: ['local-seo', 'google-business-profile'], maps: ['google-business-profile'],
  ads: ['paid-advertising', 'performance-marketing'], advertising: ['paid-advertising'], marketing: ['performance-marketing', 'content-strategy', 'marketing-automation'],
  social: ['social-media-management', 'social-media-creative'], instagram: ['social-media-management', 'social-media-creative'], tiktok: ['social-media-creative', 'social-media-management'],
  conversion: ['conversion-optimization'], traffic: ['seo', 'paid-advertising'], visibility: ['seo', 'local-seo'], analytics: ['analytics-attribution'], revenue: ['revenue-optimization', 'performance-marketing'],
  brand: ['brand-identity', 'creative-direction'], branding: ['brand-identity'], logo: ['logo-design'], rebrand: ['brand-identity', 'logo-design'], identity: ['brand-identity'],
  animation: ['motion-graphics'], motion: ['motion-graphics'], '3d': ['3d-visual-design'], campaign: ['campaign-concepts'], content: ['content-production', 'content-strategy'], story: ['digital-storytelling'],
  strategy: ['business-consulting', 'product-strategy'], startup: ['startup-strategy', 'business-model-development'], launch: ['startup-strategy', 'campaign-concepts'],
  transform: ['digital-transformation', 'ai-transformation'], transformation: ['digital-transformation'], modernise: ['digital-transformation'], modernize: ['digital-transformation'],
  pricing: ['business-model-development', 'revenue-optimization'], architecture: ['systems-architecture'], systems: ['systems-architecture'], experience: ['cx-strategy', 'ux-ui-design'],
  premium: ['premium-websites', 'brand-identity'], custom: ['custom-software', 'custom-ai-integrations'], grow: ['performance-marketing', 'growth-experimentation'], growth: ['growth-experimentation', 'performance-marketing'],
};

const tokens = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter((w) => w && !STOP.has(w));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');

const index = allServices.map((s) => ({ s, words: new Set([...tokens(s.title), ...tokens(s.desc)].map(stem)) }));

export type Match = { services: typeof allServices; division?: (typeof divisions)[number]; confident: boolean };

export function match(input: string): Match {
  const words = tokens(input);
  const score = new Map<string, number>();
  for (const w of words) {
    for (const slug of SYNONYMS[w] ?? SYNONYMS[stem(w)] ?? []) score.set(slug, (score.get(slug) ?? 0) + 3);
    const sw = stem(w);
    if (sw.length < 3) continue;
    for (const { s, words: set } of index) if (set.has(sw)) score.set(s.slug, (score.get(s.slug) ?? 0) + (tokens(s.title).map(stem).includes(sw) ? 2 : 1));
  }
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]);
  const services = ranked.slice(0, 3).map(([slug]) => allServices.find((s) => s.slug === slug)!);
  const top = services[0];
  return {
    services,
    division: top ? divisions.find((d) => d.slug === top.division) : undefined,
    confident: (ranked[0]?.[1] ?? 0) >= 3,
  };
}
