import { Link } from "react-router";
import SiteNav from "../components/SiteNav";
import Aurora from "../components/Aurora";
import TemplateThumb from "../components/TemplateThumb";
import { templates } from "../lib/templates";

const tagInk = { html: "bg-coral", css: "bg-aqua", js: "bg-violet" } as const;

export default function Gallery() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Aurora strength={0.35} />
      <SiteNav />
      <main className="relative mx-auto max-w-[1320px] px-5 pb-28 pt-8 md:px-8">
        <h1 className="display text-[clamp(3rem,8vw,5.75rem)]">Templates</h1>
        <p className="mt-4 max-w-[46ch] text-xl text-muted">Open one in the editor and make it yours. The original stays as it is.</p>
        <ul className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Link to={`/new?template=${t.id}`} className="group block text-ink no-underline">
                <TemplateThumb sources={t} title={t.title} />
                <div className="mt-4 flex items-center gap-3">
                  <h2 className="text-xl font-extrabold group-hover:underline">{t.title}</h2>
                  <span className="flex gap-1.5" aria-label={`Uses ${t.tags.join(", ")}`}>
                    {t.tags.map((tag) => (
                      <span key={tag} className={`${tagInk[tag]} size-2.5 rounded-full`} title={tag.toUpperCase()} />
                    ))}
                  </span>
                </div>
                {t.badge && <p className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{t.badge}</p>}
                <p className="mt-1 max-w-[44ch] text-muted">{t.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
