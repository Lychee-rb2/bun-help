import { createRedisClient } from "@/fetch/redis";
import { EXTENSION } from "@/help/const";
import { isAfter } from "date-fns";
import * as vscode from "vscode";
export interface Cache<T> {
  get: (key: string) => Promise<T>;
  remove: (key: string) => Promise<void>;
}
export const cacheClient = async <T>(
  context: vscode.ExtensionContext,
  cacheTime: number,
  fetch: () => Promise<T>,
): Promise<Cache<T>> => {
  const config = vscode.workspace.getConfiguration(EXTENSION);
  const url = config.get<string>("redisUrl");
  const token = config.get<string>("redisToken");
  if (url && token) {
    const redis = createRedisClient(url, token);
    const pingRes = await redis.ping().catch(() => null);
    if (pingRes) {
      return upstashCache<T>(cacheTime, fetch);
    }
    return vscodeCache<T>(cacheTime, fetch, context);
  }
  return vscodeCache<T>(cacheTime, fetch, context);
};

export const vscodeCache = <T>(
  cacheTime: number,
  fetch: () => Promise<T>,
  context: vscode.ExtensionContext,
): Cache<T> => {
  return {
    get: async (key: string) => {
      const cachedData = context.globalState.get<{ data: T; t: number }>(key);
      if (cachedData && isAfter(cachedData.t + cacheTime, Date.now())) {
        return cachedData.data;
      }
      const data = await fetch();
      await context.globalState.update(key, { data, t: Date.now() });
      return data;
    },
    remove: async (key: string) => {
      await context.globalState.update(key, undefined);
    },
  };
};
export const upstashCache = <T>(
  cacheTime: number,
  fetch: () => Promise<T>,
): Cache<T> => {
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
