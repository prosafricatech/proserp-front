import { anonymousPaths, publicPaths } from '@/config/routes/path';
import { match } from 'path-to-regexp';

function matchPathname(pathArray: string[], pathname: string, locale?: string) {
  return pathArray.some((path) => {
    const pathMatcher = match(locale ? `/${locale}${path}` : path, {
      decode: decodeURIComponent,
    });
    return pathMatcher(pathname);
  });
}

export function isPublicPath(pathname: string, locale?: string) {
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/firebase-messaging-sw.js')
  ) {
    return true;
  }

  return matchPathname(publicPaths, pathname, locale);
}

// utilities/helpers/path.ts
export function isAnonymousPath(path: string) {
  const parts = path.split('/');
  const possibleLocale = parts[1];
  const pathWithoutLocale = parts.length > 2 && possibleLocale.length === 5
    ? '/' + parts.slice(2).join('/')
    : path;

  return anonymousPaths.includes(pathWithoutLocale);
}