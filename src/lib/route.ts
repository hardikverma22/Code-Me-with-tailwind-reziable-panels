/** Returns the slug from a `/p/<slug>` path, or null. */
export function slugFromPath(pathname: string): string | null {
  return /^\/p\/([a-z0-9]{4,32})\/?$/i.exec(pathname)?.[1] ?? null;
}
