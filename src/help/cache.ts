import { createRedisClient } from "@/fetch/redis";
import { EXTENSION } from "@/help/const";
import { isAfter } from "date-fns";
import * as vscode from "vscode";

export interface CacheProvider<T> {
  get: (key: string) => Promise<T>;
  remove: (key: string) => Promise<void>;
}
export interface Cache<T> {
  get: () => Promise<T>;
  remove: () => Promise<void>;
}
export const cacheClient = async <T>(
  cacheTime: number,
  fetch: () => Promise<T>,
): Promise<CacheProvider<T>> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const url = config.get<string>("redisUrl");
  const token = config.get<string>("redisToken");
  if (url && token) {
    const redis = createRedisClient(url, token);
    const pingRes = await redis.ping().catch(() => null);
    if (pingRes) {
      return upstashCache<T>(cacheTime, fetch);
    }
    return vscodeCache<T>(cacheTime, fetch);
  }
  return vscodeCache<T>(cacheTime, fetch);
};

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
export const upstashCache = <T>(
  cacheTime: number,
  fetch: () => Promise<T>,
): CacheProvider<T> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const url = config.get<string>("redisUrl");
  const token = config.get<string>("redisToken");
  const redis = createRedisClient(url, token);
  return {
    get: async (key: string) => {
      const value = await redis.get<T>(key);
      if (value) {
        return value;
      }
      const data = await fetch();
      await redis.set(key, data, { px: cacheTime });
      return data;
    },
    remove: async (key: string) => {
      await redis.del(key);
    },
  };
};
