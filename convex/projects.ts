import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_BYTES = 200_000;
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function randomSlug(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export const create = mutation({
  args: {
    html: v.string(),
    css: v.string(),
    js: v.string(),
    forkedFrom: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const size = args.html.length + args.css.length + args.js.length;
    if (size > MAX_BYTES) {
      throw new ConvexError("This project is too large to share (limit is 200 KB).");
    }

    let slug = randomSlug();
    while (await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) {
      slug = randomSlug();
    }
    await ctx.db.insert("projects", { slug, ...args });
    return slug;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({ slug: v.string(), html: v.string(), css: v.string(), js: v.string() })
  ),
  handler: async (ctx, { slug }) => {
    const p = await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    return p && { slug: p.slug, html: p.html, css: p.css, js: p.js };
  },
});
