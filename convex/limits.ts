import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/**
 * Abuse limits for creating shares. Reads are cheap and slugs are unguessable;
 * writes are what cost storage, so they are what we meter.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per client IP: a small burst, then one share every five minutes.
  sharePerIp: { kind: "token bucket", rate: 12, period: HOUR, capacity: 5 },
  // Whole service: a circuit breaker if something slips past the per-IP limit.
  shareGlobal: { kind: "fixed window", rate: 1500, period: HOUR },
  // Slow down repeated failed lookups from one IP.
  lookupPerIp: { kind: "token bucket", rate: 120, period: MINUTE, capacity: 60 },
});
