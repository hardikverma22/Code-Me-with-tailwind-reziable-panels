import { useEffect } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import { decodeShare } from "./lib/share";
import { useProject } from "./store/project";

export default function App() {
  // A shared link (#code=...) replaces whatever is saved locally.
  useEffect(() => {
    const shared = decodeShare(location.hash);
    if (shared) useProject.getState().load(shared);
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
