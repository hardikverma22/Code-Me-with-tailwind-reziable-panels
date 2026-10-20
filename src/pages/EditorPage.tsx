import { useEffect } from "react";
import { useParams } from "react-router";
import Header from "../components/Header";
import Workspace from "../components/Workspace";
import { decodeShare } from "../lib/share";
import { convex } from "../lib/convex";
import { api } from "../../convex/_generated/api";
import { useProject } from "../store/project";

export default function EditorPage() {
  const { slug } = useParams();

  useEffect(() => {
    document.body.classList.add("editor-bg");
    return () => document.body.classList.remove("editor-bg");
  }, []);

  // A shared link replaces whatever is saved locally.
  useEffect(() => {
    const { load } = useProject.getState();
    if (slug && convex) {
      convex
        .query(api.projects.getBySlug, { slug })
        .then((p) => p && load({ html: p.html, css: p.css, js: p.js, tailwind: p.tailwind, resources: p.resources }, p.slug, p.forkedFrom))
        .catch(() => { /* offline or backend down: keep local work */ });
      return;
    }
    const shared = decodeShare(location.hash);
    if (shared) load(shared);
  }, [slug]);

  return (
    <div className="flex h-dvh flex-col bg-bench">
      <Header />
      <main className="min-h-0 flex-1 px-2 pb-2">
        <Workspace />
      </main>
    </div>
  );
}
