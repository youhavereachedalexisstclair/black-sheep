const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function plot(): HTMLDivElement {
  const node = document.createElement("div");
  node.className = "cursor-plot";
  for (let index = 0; index < 4; index += 1) node.append(document.createElement("span"));
  return node;
}

export function mountCursor(reducedMotion: boolean): void {
  if (!finePointer.matches || document.querySelector(".cursor")) return;

  const root = document.createElement("div");
  root.className = "cursor is-off";
  root.setAttribute("aria-hidden", "true");

  const axisXStart = document.createElement("div");
  axisXStart.className = "cursor-axis cursor-axis-x cursor-axis-start";
  const axisXEnd = document.createElement("div");
  axisXEnd.className = "cursor-axis cursor-axis-x cursor-axis-end";
  const axisYStart = document.createElement("div");
  axisYStart.className = "cursor-axis cursor-axis-y cursor-axis-start";
  const axisYEnd = document.createElement("div");
  axisYEnd.className = "cursor-axis cursor-axis-y cursor-axis-end";

  const ghost = document.createElement("div");
  ghost.className = "cursor-ghost";
  ghost.append(plot());

  const mark = document.createElement("div");
  mark.className = "cursor-mark";
  mark.append(plot());
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  mark.append(ring);

  root.append(axisXStart, axisXEnd, axisYStart, axisYEnd, ghost, mark);
  document.body.append(root);
  document.documentElement.classList.add("has-cursor");

  let x = 0;
  let y = 0;
  let gx = 0;
  let gy = 0;
  let frame = 0;

  const follow = () => {
    gx += (x - gx) * 0.16;
    gy += (y - gy) * 0.16;
    root.style.setProperty("--gx", `${Math.round(gx)}px`);
    root.style.setProperty("--gy", `${Math.round(gy)}px`);
    if (Math.abs(x - gx) > 0.2 || Math.abs(y - gy) > 0.2) {
      frame = window.requestAnimationFrame(follow);
    } else {
      frame = 0;
    }
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    x = Math.round(event.clientX);
    y = Math.round(event.clientY);
    root.style.setProperty("--x", `${x}px`);
    root.style.setProperty("--y", `${y}px`);

    if (root.classList.contains("is-off")) {
      gx = x;
      gy = y;
      root.style.setProperty("--gx", `${x}px`);
      root.style.setProperty("--gy", `${y}px`);
      root.classList.remove("is-off");
    }

    const element = event.target instanceof Element ? event.target : null;
    root.classList.toggle("is-hot", Boolean(element?.closest("a, button")));
    root.classList.toggle("is-typing", Boolean(element?.closest("input, textarea")));

    if (!reducedMotion && !frame) frame = window.requestAnimationFrame(follow);
  });

  const release = () => root.classList.remove("is-down");

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    root.classList.add("is-down");
  });
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", () => {
    release();
    root.classList.add("is-off");
  });
  window.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) root.classList.add("is-off");
  });
}
