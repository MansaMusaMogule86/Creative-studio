// Localization scaffold. Only English is published. Add a dictionary per
// locale once translations are supplied; Arabic switches the document to RTL.
export const locales = ['en', 'fr', 'ar', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const published: Locale[] = ['en'];

const rtl = new Set<Locale>(['ar']);
export const dirFor = (l: Locale) => (rtl.has(l) ? 'rtl' : 'ltr');
export const langTag: Record<Locale, string> = { en: 'en', fr: 'fr', ar: 'ar', zh: 'zh-Hans' };

const en = {
  skip: 'Skip to content',
  nav: { home: 'Home', universe: 'Universe', services: 'Services', about: 'About', contact: 'Contact' },
  cta: { create: 'Let’s create', explore: 'Explore our universe', start: 'Start a project' },
};
export type Dict = typeof en;
const dictionaries: Partial<Record<Locale, Dict>> = { en };
export const t = (l: Locale = defaultLocale): Dict => dictionaries[l] ?? en;
