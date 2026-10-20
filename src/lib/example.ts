import type { Sources } from "./buildSrcDoc";

export const exampleSources: Sources = {
  html: `<main>
  <div class="scene">
    <div id="sphere" class="sphere"></div>
  </div>
</main>
`,
  css: `html, body { margin: 0; height: 100%; }
body {
  display: grid;
  place-items: center;
  background: linear-gradient(147deg, #12222a 9%, #040404 53%);
}
.scene { width: 480px; height: 480px; perspective: 1000px; }
.sphere {
  position: relative;
  width: 100%; height: 100%;
  transform: rotateX(45deg) rotateY(45deg);
  transform-style: preserve-3d;
  animation: spin 100s infinite linear;
}
.ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 1px dotted #06e0fd;
  box-shadow: 0 0 50px -2px #06fdd4;
}
@keyframes spin { to { transform: rotateX(405deg) rotateY(405deg); } }
`,
  js: `const sphere = document.getElementById("sphere");
for (let deg = 0; deg < 180; deg += 9) {
  const ring = document.createElement("div");
  ring.className = "ring";
  ring.style.transform = \`rotateY(\${deg}deg)\`;
  sphere.append(ring);
}
console.log("Rendered 20 rings");
`,
};
