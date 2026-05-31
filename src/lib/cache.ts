import { getCache } from "@vercel/functions";

export async function getOrInsertCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    ttl: number;
    tags?: string[];
  },
): Promise<T> {
  const { ttl, tags } = options;
  const cache = getCache();

  const cached = (await cache.get(key)) as T | undefined;
  if (cached) return cached;

  const result = await fn();
  await cache.set(key, result, { ttl, tags });

  return result;
}
