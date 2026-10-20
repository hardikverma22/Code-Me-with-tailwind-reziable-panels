import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import EditorPane from "./EditorPane";
import Preview from "./Preview";
import ConsolePanel from "./ConsolePanel";
import type { Language } from "../lib/format";
import { useMediaQuery } from "../lib/useMediaQuery";

const languages: Language[] = ["html", "css", "js"];
const tabLabel: Record<Language, string> = { html: "HTML", css: "CSS", js: "JS" };

function Desktop() {
  return (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="45%" minSize="15%">
        <Group orientation="horizontal">
          {languages.map((l, i) => (
            <PanelWithSeparator key={l} first={i === 0}>
              <EditorPane language={l} />
            </PanelWithSeparator>
          ))}
        </Group>
      </Panel>
      <Separator />
      <Panel defaultSize="55%" minSize="20%">
        <Group orientation="horizontal">
          <Panel defaultSize="70%" minSize="30%">
            <div className="h-full overflow-hidden rounded-lg bg-white">
              <Preview />
            </div>
          </Panel>
          <Separator />
          <Panel defaultSize="30%" minSize="15%">
            <div className="h-full overflow-hidden rounded-lg">
              <ConsolePanel />
            </div>
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

function PanelWithSeparator({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <>
      {!first && <Separator />}
      <Panel minSize="10%">{children}</Panel>
    </>
  );
}

function Mobile() {
  const [tab, setTab] = useState<Language>("html");
  return (
    <div className="flex h-full flex-col gap-2">
      <div role="tablist" className="flex gap-1">
        {languages.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={tab === l}
            onClick={() => setTab(l)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === l ? "bg-raised text-ink" : "text-muted"
            }`}
          >
            {tabLabel[l]}
          </button>
        ))}
      </div>
      <div className="h-1/2 overflow-hidden rounded-lg">
        <EditorPane language={tab} />
      </div>
      <div className="h-1/2 overflow-hidden rounded-lg bg-white">
        <Preview />
      </div>
    </div>
  );
}

export default function Workspace() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return <div className="h-full">{isDesktop ? <Desktop /> : <Mobile />}</div>;
}
