import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Graceful no-op se Upstash non è configurato (sviluppo locale)
const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      analytics: false,
    })
  : null;

// Endpoint VAPI hanno limiti più alti (chiamati dai server VAPI, non utenti)
const vapiRatelimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, "10 s"),
      analytics: false,
    })
  : null;

export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(identifier);
  return success;
}

export async function checkVapiRateLimit(identifier: string): Promise<boolean> {
  if (!vapiRatelimit) return true;
  const { success } = await vapiRatelimit.limit(`vapi:${identifier}`);
  return success;
}
