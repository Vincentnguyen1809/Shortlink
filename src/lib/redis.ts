import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;

export const redis =
  global.redisGlobal ??
  new Redis(redisUrl ?? "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.redisGlobal = redis;
}

export async function ensureRedisConnected(): Promise<void> {
  if (redis.status === "ready" || redis.status === "connecting") return;
  await redis.connect();
}
