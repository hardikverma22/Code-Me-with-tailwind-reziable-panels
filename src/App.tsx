import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router";
import Landing from "./pages/Landing";
import EditorPage from "./pages/EditorPage";
import Gallery from "./pages/Gallery";
import Mine from "./pages/Mine";
import { templateById } from "./lib/templates";
import { useProject } from "./store/project";

/** Opens /new?template=<id> with that template loaded, then cleans the URL. */
function NewProject() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("template");

  useEffect(() => {
    const t = id ? templateById(id) : undefined;
    if (t) {
      useProject.getState().load({ html: t.html, css: t.css, js: t.js, tailwind: t.tailwind, resources: t.resources }, null);
      navigate("/new", { replace: true });
    }
  }, [id, navigate]);

  return <EditorPage />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/p/:slug" element={<EditorPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/mine" element={<Mine />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
