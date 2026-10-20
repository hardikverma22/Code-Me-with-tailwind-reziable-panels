import { useEffect } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import { decodeShare } from "./lib/share";
import { slugFromPath } from "./lib/route";
import { convex } from "./lib/convex";
import { api } from "../convex/_generated/api";
import { useProject } from "./store/project";

// A shared link replaces whatever is saved locally.
async function loadFromUrl() {
  const { load } = useProject.getState();
  const slug = slugFromPath(location.pathname);
  if (slug && convex) {
    try {
      const project = await convex.query(api.projects.getBySlug, { slug });
      if (project) return load({ html: project.html, css: project.css, js: project.js }, project.slug);
    } catch {
      /* offline or backend down: keep local work */
    }
    return;
  }
  const shared = decodeShare(location.hash);
  if (shared) load(shared);
}

export default function App() {
  useEffect(() => {
    void loadFromUrl();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <main className="min-h-0 flex-1 px-2 pb-2">
        <Workspace />
      </main>
    </div>
  );
}
