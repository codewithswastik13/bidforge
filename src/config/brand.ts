/**
 * Single source of truth for brand-level constants on the auth screens.
 * Swap the name, tagline or video asset here without touching components.
 */
export const brand = {
  name: 'BidForge',
  tagline: 'The auction moves in real time',
  authSubline: 'Sign in to enter the live auction house.',
  signupSubline: 'Create your bidding account.',
  rabbitVideoUrl:
    'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4',
  links: {
    terms: '#',
    privacy: '#',
  },
} as const;

/** localStorage flag marking that the visitor has seen the cinematic intro. */
export const INTRO_FLAG = 'bidforge.hasSeenLoginIntro';
