import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const MAX_REQUESTS = 3;
const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

type RateLimitEntry = {
  timestamps: number[];
};

const entries = new Map<string, RateLimitEntry>();
const redis =
  hasRedisConfig
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return "unknown";
}

function getRedisKey(ip: string): string {
  const hashedIp = createHash("sha256").update(ip).digest("hex");
  return `tu-coverify:free-ip:${hashedIp}`;
}

function checkAndRecordInMemory(ip: string): {
  allowed: boolean;
  resetHours: number;
} {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const current = entries.get(ip) ?? { timestamps: [] };
  current.timestamps = current.timestamps.filter((timestamp) => timestamp > cutoff);

  if (current.timestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = current.timestamps[0] ?? now;
    const resetHours = Math.max(
      1,
      Math.ceil((oldestTimestamp + WINDOW_MS - now) / (60 * 60 * 1000))
    );
    entries.set(ip, current);
    return { allowed: false, resetHours };
  }

  current.timestamps.push(now);
  entries.set(ip, current);
  return { allowed: true, resetHours: 24 };
}

export async function checkAndRecordIpLimit(request: Request): Promise<{
  allowed: boolean;
  resetHours: number;
}> {
  const ip = getClientIp(request);

  if (!redis) {
    return checkAndRecordInMemory(ip);
  }

  try {
    const key = getRedisKey(ip);
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    const ttlSeconds = Math.max(1, await redis.ttl(key));
    if (count > MAX_REQUESTS) {
      return {
        allowed: false,
        resetHours: Math.max(1, Math.ceil(ttlSeconds / (60 * 60))),
      };
    }

    return { allowed: true, resetHours: 24 };
  } catch (error) {
    console.error("Redis rate limiter unavailable:", error);
    return {
      allowed: false,
      resetHours: 1,
    };
  }
}
