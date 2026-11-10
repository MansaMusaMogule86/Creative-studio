// All brand strings and brand asset paths live here.
// The golden crowned M is the official master emblem (owner-approved).
// Production files are generated from brand-source/crowned-m-master.png by
// `pnpm brand:assets`; the master itself is never modified.
export const brand = {
  name: 'Mansas Moguls',
  nameDisplay: 'MANSAS MOGULS',
  tagline: 'We architect what’s next.',
  taglineDisplay: 'WE ARCHITECT WHAT’S NEXT',
  city: 'Dubai',
  description:
    'Mansas Moguls is a Dubai-based digital innovation company uniting design, intelligence, technology and growth across five divisions.',
  emblem: {
    /** Light-background emblem; heights in px. Aspect 1273:1200. */
    light: { 44: '/brand/emblem-44.webp', 88: '/brand/emblem-88.webp', 132: '/brand/emblem-132.webp', 160: '/brand/emblem-160.webp', 320: '/brand/emblem-320.webp', 720: '/brand/emblem-720.webp' },
    dark: { 160: '/brand/emblem-dark-160.webp', 320: '/brand/emblem-dark-320.webp', 720: '/brand/emblem-dark-720.webp' },
    png: '/brand/emblem-512.png',
    ratio: 1273 / 1200,
  },
  // Contact details and social profiles have not been provided. Leave empty
  // rather than inventing them; the UI hides anything that is empty.
  email: '',
  social: [] as { label: string; href: string }[],
} as const;
