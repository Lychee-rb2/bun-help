import { isAfter } from "date-fns";
import { CacheProvider } from "@/help/cache.ts";

export const vscodeCache = <T>(
  cacheTime: number,
  fetch: () => Promise<T>,
): CacheProvider<T> => {
  const cache: Record<string, { data: T; t: number }> = {};
  return {
    get: async (key: string) => {
      const cachedData = cache[key];
      if (cachedData && isAfter(cachedData.t + cacheTime, Date.now())) {
        return cachedData.data;
      }
      const data = await fetch();
      cachedData.data = data;
      cachedData.t = Date.now();
      return data;
    },
    remove: async (key: string) => {
      cache[key] = undefined;
    },
  };
};
