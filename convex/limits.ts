import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/**
 * Abuse limits for creating shares. Reads are cheap and slugs are unguessable;
 * writes are what cost storage, so they are what we meter.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per client IP: at most 10 new shares a day, and no more than 3 in a quick burst.
  // Re-sharing identical content is free: it returns the existing link before any limit runs.
  sharePerIpDay: { kind: "fixed window", rate: 10, period: 24 * HOUR },
  sharePerIpBurst: { kind: "token bucket", rate: 3, period: HOUR, capacity: 3 },
  // Whole service: a circuit breaker if something slips past the per-IP limit.
  shareGlobal: { kind: "fixed window", rate: 1500, period: HOUR },
  // Slow down repeated failed lookups from one IP.
  lookupPerIp: { kind: "token bucket", rate: 120, period: MINUTE, capacity: 60 },
});
