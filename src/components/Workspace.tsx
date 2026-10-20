import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import EditorPane from "./EditorPane";
import Preview from "./Preview";
import ConsolePanel from "./ConsolePanel";
import type { Language } from "../lib/format";
import { useMediaQuery } from "../lib/useMediaQuery";

const languages: Language[] = ["html", "css", "js"];

function Desktop() {
  return (
    <Group orientation="vertical" className="h-full">
      <Panel defaultSize="46%" minSize="15%">
        <Group orientation="horizontal">
          {languages.map((l, i) => (
            <Fragment2 key={l} first={i === 0}>
              <EditorPane language={l} />
            </Fragment2>
          ))}
        </Group>
      </Panel>
      <Separator />
      <Panel defaultSize="54%" minSize="20%">
        <Group orientation="horizontal">
          <Panel defaultSize="70%" minSize="30%">
            <div className="h-full pb-1"><Preview /></div>
          </Panel>
          <Separator />
          <Panel defaultSize="30%" minSize="15%">
            <ConsolePanel />
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

function Fragment2({ first, children }: { first: boolean; children: React.ReactNode }) {
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
    <div className="flex h-full flex-col">
      <div role="tablist" className="flex">
        {languages.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={tab === l}
            onClick={() => setTab(l)}
            className={`flex-1 rounded-t-lg py-2.5 text-sm font-bold ${tab === l ? "bg-bed text-paper" : "text-fade"}`}
          >
            {l === "js" ? "JS" : l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="h-1/2 min-h-0"><EditorPane language={tab} /></div>
      <div className="h-1/2 min-h-0 pt-2"><Preview /></div>
    </div>
  );
}

export default function Workspace() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return <div className="h-full">{isDesktop ? <Desktop /> : <Mobile />}</div>;
}
