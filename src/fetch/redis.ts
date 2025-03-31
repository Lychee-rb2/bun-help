import { Redis } from "@upstash/redis";
let redis: Redis | null = null;
export const createRedisClient = (url: string, token: string) => {
  if (redis) return redis;
  redis = new Redis({ url, token });
  return redis;
};
