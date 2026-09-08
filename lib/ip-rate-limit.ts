import { createHash } from "crypto";
import { Redis } from "@upstash/redis";
import { isIP } from "net";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const MAX_REQUESTS = 3;
const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isIP(realIp.trim())) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0].trim();
  if (forwardedIp && isIP(forwardedIp)) return forwardedIp;

  return "unknown";
}

function getRedisKey(ip: string): string {
  const hashedIp = createHash("sha256").update(ip).digest("hex");
  return `tu-coverify:free-ip:${hashedIp}`;
}

export async function checkAndRecordIpLimit(request: Request): Promise<{
  allowed: boolean;
  resetHours: number;
}> {
  const ip = getClientIp(request);

  if (!hasRedisConfig) {
    console.error("IP rate limiter is unavailable: Upstash Redis is not configured.");
    return {
      allowed: false,
      resetHours: 1,
    };
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
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
