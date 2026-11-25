// Centralised site URLs. Defaults target the free Vercel deployments.
// Override via environment (Expo inlines EXPO_PUBLIC_* at build time) so a
// future custom-domain migration is a config change, not a code change.
export const SITE_URLS = {
  marketing: (process.env.EXPO_PUBLIC_MARKETING_URL ?? 'https://velyqua-website.vercel.app/').trim(),
} as const;
