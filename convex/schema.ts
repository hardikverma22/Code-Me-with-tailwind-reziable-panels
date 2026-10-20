import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Each share is an immutable snapshot. Forks point at their parent's slug.
  projects: defineTable({
    slug: v.string(),
    html: v.string(),
    css: v.string(),
    js: v.string(),
    tailwind: v.optional(v.boolean()),
    resources: v.optional(v.array(v.object({ kind: v.union(v.literal("script"), v.literal("style")), url: v.string() }))),
    forkedFrom: v.optional(v.string()),
    // SHA-256 of the content, so sharing identical code twice returns the same link.
    hash: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_hash", ["hash"]),
});
