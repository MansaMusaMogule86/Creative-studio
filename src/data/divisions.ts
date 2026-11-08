// Single source of truth for the five divisions and their services.
// Copy is benefit-focused and deliberately free of client names, metrics or
// claims that have not been verified.

export type Service = { slug: string; title: string; desc: string };

export type Division = {
  slug: 'digital' | 'ai' | 'growth' | 'creative' | 'strategy';
  index: string;
  name: string;
  short: string;
  tagline: string;
  intro: string;
  /** Three accent stops used by the division artwork and UI. */
  palette: [string, string, string];
  /** Readable accent for text on light backgrounds (AA on #FFFFFF). */
  ink: string;
  artwork: string;
  services: Service[];
};

export const divisions: Division[] = [
  {
    slug: 'digital',
    index: '01',
    name: 'Moguls Digital',
    short: 'Digital',
    tagline: 'Websites. Applications. Digital Platforms.',
    intro:
      'We design and engineer the platforms your business runs on: fast, accessible, and built to keep evolving after launch.',
    palette: ['#8EE7E8', '#C9D6E3', '#7FB4FF'],
    ink: '#0F5F6B',
    artwork: 'Floating translucent architecture',
    services: [
      { slug: 'premium-websites', title: 'Premium websites', desc: 'Editorial-grade sites that load fast, rank well and make the first impression count.' },
      { slug: 'web-applications', title: 'Web applications', desc: 'Browser-based products with the responsiveness people expect from native software.' },
      { slug: 'mobile-applications', title: 'Mobile applications', desc: 'iOS and Android apps shaped around how your customers actually use their phones.' },
      { slug: 'e-commerce', title: 'E-commerce development', desc: 'Storefronts that make browsing effortless and checkout feel like nothing at all.' },
      { slug: 'saas-platforms', title: 'SaaS platforms', desc: 'Multi-tenant products with billing, roles and onboarding designed in from day one.' },
      { slug: 'ux-ui-design', title: 'UX/UI design', desc: 'Interfaces grounded in research, prototyped early and tested before a line of production code.' },
      { slug: 'custom-software', title: 'Custom software', desc: 'Internal tools that replace spreadsheets and workarounds with one dependable system.' },
      { slug: 'api-integrations', title: 'API integrations', desc: 'Your tools talking to each other reliably, so data moves without manual copying.' },
      { slug: 'digital-product-development', title: 'Digital product development', desc: 'From first sketch to shipped product, with a team that owns the whole path.' },
    ],
  },
  {
    slug: 'ai',
    index: '02',
    name: 'Moguls AI',
    short: 'AI',
    tagline: 'Intelligence. Automation. Future Systems.',
    intro:
      'We put intelligence to work where it earns its place: removing repetitive effort, answering faster and surfacing what matters.',
    palette: ['#B9A5FF', '#8C6CF2', '#E4E2F2'],
    ink: '#5A3FC0',
    artwork: 'An evolving organism of luminous particles',
    services: [
      { slug: 'ai-agents', title: 'AI agents', desc: 'Task-focused agents that research, draft and act inside the guardrails you define.' },
      { slug: 'ai-voice-assistants', title: 'AI voice assistants', desc: 'Natural phone and voice experiences that answer, route and book around the clock.' },
      { slug: 'intelligent-chatbots', title: 'Intelligent chatbots', desc: 'Conversational help grounded in your own content, with a clear hand-off to people.' },
      { slug: 'workflow-automation', title: 'Workflow automation', desc: 'Repetitive steps handled automatically, so your team spends time on judgement calls.' },
      { slug: 'business-process-automation', title: 'Business process automation', desc: 'End-to-end processes mapped, simplified and automated with full audit trails.' },
      { slug: 'ai-crm', title: 'AI-powered CRM systems', desc: 'A CRM that summarises, prioritises and reminds, instead of waiting to be updated.' },
      { slug: 'knowledge-assistants', title: 'Knowledge assistants', desc: 'Your documents and policies, searchable in plain language with cited answers.' },
      { slug: 'computer-vision', title: 'Computer vision', desc: 'Systems that read images and video to inspect, count, verify or classify.' },
      { slug: 'custom-ai-integrations', title: 'Custom AI integrations', desc: 'The right models connected securely to the systems you already rely on.' },
      { slug: 'ai-transformation', title: 'AI business transformation', desc: 'A practical roadmap for where AI helps your business, and where it does not.' },
    ],
  },
  {
    slug: 'growth',
    index: '03',
    name: 'Moguls Growth',
    short: 'Growth',
    tagline: 'Marketing. Visibility. Revenue.',
    intro:
      'We help the right people find you, trust you and choose you, then measure every step so growth compounds.',
    palette: ['#FFC6AC', '#FF9B85', '#F3DDBF'],
    ink: '#A23F22',
    artwork: 'Organic structures in expanding motion',
    services: [
      { slug: 'seo', title: 'Search engine optimization', desc: 'Technical, content and authority work that earns durable organic visibility.' },
      { slug: 'local-seo', title: 'Local SEO', desc: 'Show up when nearby customers search for exactly what you offer.' },
      { slug: 'google-business-profile', title: 'Google Business Profile optimization', desc: 'A complete, active profile that turns map searches into calls and visits.' },
      { slug: 'social-media-management', title: 'Social media management', desc: 'Consistent, on-brand presence with a calendar, community care and reporting.' },
      { slug: 'paid-advertising', title: 'Paid advertising', desc: 'Search, social and display campaigns structured around cost per outcome.' },
      { slug: 'performance-marketing', title: 'Performance marketing', desc: 'Channels managed as one system and budgets moved toward what works.' },
      { slug: 'conversion-optimization', title: 'Conversion optimization', desc: 'Fewer drop-offs through research, clearer journeys and disciplined testing.' },
      { slug: 'lead-generation', title: 'Lead generation', desc: 'Qualified enquiries delivered with the context your sales team needs.' },
      { slug: 'marketing-automation', title: 'Marketing automation', desc: 'Timely, relevant follow-ups that nurture interest without manual effort.' },
      { slug: 'analytics-attribution', title: 'Analytics and attribution', desc: 'Clean tracking and honest reporting, so decisions rest on real numbers.' },
      { slug: 'content-strategy', title: 'Content strategy', desc: 'What to publish, where and why, tied to questions your buyers already ask.' },
      { slug: 'growth-experimentation', title: 'Growth experimentation', desc: 'A steady cadence of small, measurable bets that reveal what moves the needle.' },
    ],
  },
  {
    slug: 'creative',
    index: '04',
    name: 'Moguls Creative',
    short: 'Creative',
    tagline: 'Identity. Storytelling. Experiences.',
    intro:
      'We give brands a recognisable voice and visual world, then carry it consistently across every surface and story.',
    palette: ['#E8C8FF', '#FFB8DC', '#F4F0FA'],
    ink: '#8A2E73',
    artwork: 'A sculpture that keeps changing shape and material',
    services: [
      { slug: 'brand-identity', title: 'Brand identity', desc: 'A complete identity system that stays coherent from favicon to billboard.' },
      { slug: 'logo-design', title: 'Logo design', desc: 'Distinctive marks drawn to work at every size, in every medium.' },
      { slug: 'creative-direction', title: 'Creative direction', desc: 'One clear point of view guiding every shoot, campaign and release.' },
      { slug: 'motion-graphics', title: 'Motion graphics', desc: 'Movement that explains, delights and gives your brand a rhythm.' },
      { slug: '3d-visual-design', title: '3D visual design', desc: 'Sculptural renders and product visuals that photography cannot reach.' },
      { slug: 'campaign-concepts', title: 'Campaign concepts', desc: 'Big ideas with the legs to run across channels and seasons.' },
      { slug: 'digital-storytelling', title: 'Digital storytelling', desc: 'Narratives built for scrolling attention spans without losing depth.' },
      { slug: 'content-production', title: 'Content production', desc: 'Photo, video and written content produced to a consistent standard.' },
      { slug: 'social-media-creative', title: 'Social media creative', desc: 'Native-feeling formats designed to stop the scroll and stay on brand.' },
      { slug: 'brand-experiences', title: 'Brand experiences', desc: 'Physical and digital moments that let people feel what your brand stands for.' },
      { slug: 'interactive-experiences', title: 'Interactive experiences', desc: 'Playful, immersive web and installation work people remember and share.' },
    ],
  },
  {
    slug: 'strategy',
    index: '05',
    name: 'Moguls Strategy',
    short: 'Strategy',
    tagline: 'Business. Systems. Transformation.',
    intro:
      'We connect ambition to architecture: clarifying where to go, what to build and how the pieces work together.',
    palette: ['#F1E2C4', '#FBF6EC', '#5B5A66'],
    ink: '#5B4A26',
    artwork: 'Interconnected architecture of nodes',
    services: [
      { slug: 'business-consulting', title: 'Business consulting', desc: 'An outside view that sharpens priorities and unblocks hard decisions.' },
      { slug: 'digital-transformation', title: 'Digital transformation', desc: 'Modernising how work gets done, sequenced so the business keeps running.' },
      { slug: 'product-strategy', title: 'Product strategy', desc: 'Clear bets on what to build next, grounded in customer and market evidence.' },
      { slug: 'technology-consulting', title: 'Technology consulting', desc: 'Platform, vendor and architecture choices made with the long term in mind.' },
      { slug: 'startup-strategy', title: 'Startup strategy', desc: 'Focus for founders: positioning, sequencing and the smallest viable launch.' },
      { slug: 'business-model-development', title: 'Business model development', desc: 'Pricing, packaging and revenue models designed and pressure-tested.' },
      { slug: 'cx-strategy', title: 'Customer experience strategy', desc: 'Every touchpoint mapped, so the journey feels intentional end to end.' },
      { slug: 'revenue-optimization', title: 'Revenue optimization', desc: 'Find the leaks and levers across acquisition, retention and pricing.' },
      { slug: 'systems-architecture', title: 'Systems architecture', desc: 'A blueprint for how your tools, data and teams fit together.' },
      { slug: 'digital-ecosystem-planning', title: 'Digital ecosystem planning', desc: 'A connected roadmap for channels, platforms and partners.' },
    ],
  },
];

export const allServices = divisions.flatMap((d) =>
  d.services.map((s) => ({ ...s, division: d.slug, divisionName: d.name, ink: d.ink })),
);

export const getDivision = (slug: string) => divisions.find((d) => d.slug === slug);
