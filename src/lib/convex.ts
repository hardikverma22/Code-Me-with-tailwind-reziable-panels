import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

/** Null when no backend is configured; sharing then falls back to the URL hash. */
export const convex = url ? new ConvexReactClient(url) : null;
