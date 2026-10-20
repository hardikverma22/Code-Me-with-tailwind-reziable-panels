import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import SiteNav from "../components/SiteNav";
import Aurora from "../components/Aurora";
import TemplateThumb from "../components/TemplateThumb";
import { useMine } from "../store/mine";

export default function Mine() {
  const items = useMine((s) => s.items);
  const remove = useMine((s) => s.remove);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Aurora strength={0.35} />
      <SiteNav />
      <main className="relative mx-auto max-w-[1320px] px-5 pb-28 pt-8 md:px-8">
        <h1 className="display text-[clamp(3rem,8vw,5.75rem)]">My work</h1>
        <p className="mt-4 max-w-[46ch] text-xl text-muted">Everything you've shared from this browser. The links keep working for anyone you sent them to.</p>

        {items.length === 0 ? (
          <div className="lift mt-14 max-w-[46ch] rounded-2xl bg-white p-8">
            <p className="text-2xl font-extrabold">Nothing shared yet.</p>
            <p className="mt-2 text-muted">Press Share in the editor and your project shows up here.</p>
            <Link to="/new" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-bold text-white no-underline">Start coding</Link>
          </div>
        ) : (
          <ul className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.slug}>
                <Link to={`/p/${p.slug}`} className="group block text-ink no-underline">
                  <TemplateThumb sources={p} title={p.title} />
                  <h2 className="mt-4 text-xl font-extrabold group-hover:underline">{p.title}</h2>
                </Link>
                <div className="mt-1 flex items-center justify-between text-sm text-muted">
                  <span className="tnum font-mono">/p/{p.slug} · {new Date(p.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => remove(p.slug)} className="flex items-center gap-1 hover:text-ink" aria-label={`Remove ${p.title} from this list`}>
                    <Trash2 size={14} aria-hidden /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
