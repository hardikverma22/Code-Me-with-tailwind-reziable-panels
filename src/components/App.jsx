import Panels from "./Panels/Panels";
import NavigationBar from "./NavigationBar";

import "./App.css";
import useLocalStorage from "../hooks/useLocalStorage";
import { useEffect, useState } from "react";

function App() {
  const [html, setHtml] = useLocalStorage("html", "");
  const [css, setCss] = useLocalStorage("css", "");
  const [javascript, setJavascript] = useLocalStorage("javascript", "");
  const [srcDoc, setSrcDoc] = useState("");

  const handleTryExample = () => {
    setHtml(`
      <main> 
      <div class="scene">
        <div class="wrapper">
          <div id="sphere" class="sphere">
          </div>
        </div>
      </div>
    </main>
  `);

    setCss(`
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
    }

    html {
      background: #141414;
    }

    body {
      display: flex;
      flex-direction: column;
      background: #141414;
      background: linear-gradient(147deg, rgb(18 34 42) 9%, #040404 53%);
      color: #fff;
      overflow: auto;
    }

    main {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      flex: 1 1 auto;
      overflow: auto;
    }

    .scene {
      width: 600px;
      height: 600px;
      margin: 2% auto;
      perspective: 1000px;
    }

    .wrapper {
      width: 100%;
      height: 100%;
      transform: rotateX(45deg) rotateY(45deg);
      transform-style: preserve-3d;
    }

    .sphere {
      position: relative;
      width: 70%;
      height: 70%;
      margin: 0 auto;
      transform-style:  preserve-3d;
      animation: rotate 100s infinite linear;
    }

    .line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px; 
      border-style: dotted;
      border-color: #06e0fd;
      box-shadow: 1px 0px 20px -2px rgba(0,0,0), 1px 0px 50px -2px #06fdd4; 
    }


    @keyframes rotate {
      to {
        transform: rotateX(360deg) rotateY(360deg);
      }
    }
  `);

    setJavascript(`
    const sphere = document.getElementById('sphere');
    const rows = []

    for(i = 0; i < 180; i += 9) {
      rows.push(\`<div class="line" style="transform: rotateY(\${i}\deg);"></div>\`)
    }

    sphere.innerHTML = rows.join("");
  `);
  };

  const handleNew = () => {
    setHtml("");
    setCss("");
    setJavascript("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const srcDoc = `<html>
            <style>${css}</style>
            <body>${html}</body>
             <script>${javascript}</script>
            </html>`;
      setSrcDoc(srcDoc);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [html, css, javascript]);

  const props = {
    html,
    setHtml,
    css,
    setCss,
    javascript,
    setJavascript,
    srcDoc,
  };

  return (
    <div className="w-full md:h-screen h-fit flex flex-col bg-gray-950">
      <header>
        <NavigationBar handleNew={handleNew} handleTryExample={handleTryExample}/>
      </header>
      <main>
        <div className="w-full h-full p-2">
          <Panels {...props} />
        </div>
      </main>
    </div>
  );
}

export default App;
