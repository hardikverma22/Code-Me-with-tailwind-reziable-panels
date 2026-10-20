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
    forkedFrom: v.optional(v.string()),
  }).index("by_slug", ["slug"]),
});
