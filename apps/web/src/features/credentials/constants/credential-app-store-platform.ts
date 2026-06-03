export type AppStorePlatform = 'APPLE' | 'GOOGLE';

export const APP_STORE_PLATFORM_URL: Record<AppStorePlatform, string> = {
  APPLE: 'https://developer.apple.com/account',
  GOOGLE: 'https://play.google.com/console',
};

export function inferAppStorePlatformFromUrl(url: string): AppStorePlatform {
  const lower = url.trim().toLowerCase();
  if (lower.includes('play.google')) return 'GOOGLE';
  return 'APPLE';
}

export function urlForAppStorePlatform(platform: AppStorePlatform): string {
  return APP_STORE_PLATFORM_URL[platform];
}
