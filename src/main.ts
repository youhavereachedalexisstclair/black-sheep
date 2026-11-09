import { mountCursor } from "./cursor";
import logo from "./logo.svg?raw";

const slot = document.querySelector("#flock-slot");
if (slot) {
  slot.innerHTML = logo;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
mountCursor(reducedMotion.matches);

const COLUMNS = 6;
const ROWS = 4;
const CHOSEN_PLOT = 16;

const plat = document.querySelector("#plat");
if (plat) {
  for (let index = 0; index < COLUMNS * ROWS; index += 1) {
    if (index === CHOSEN_PLOT) {
      const link = document.createElement("a");
      link.className = "plot plot-chosen";
      link.id = "plot-chosen";
      link.href = "#contact";
      link.setAttribute("aria-label", "The parcel they walked past");
      const fill = document.createElement("span");
      fill.className = "plot-fill";
      link.append(fill);
      plat.append(link);
    } else {
      const plot = document.createElement("div");
      plot.className = "plot";
      plot.setAttribute("aria-hidden", "true");
      plat.append(plot);
    }
  }
}

function clamp(value: number, limit = 1): number {
  return Math.max(-limit, Math.min(limit, value));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function parcelPath(note: string): string {
  const random = mulberry32(hashString(note));
  const sides = 5 + Math.floor(random() * 3);
  const points: string[] = [];
  for (let index = 0; index < sides; index += 1) {
    const angle = -Math.PI / 2 + (index / sides) * Math.PI * 2;
    const radius = 27 + random() * 15;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.78;
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

if (!reducedMotion.matches) {
  const flock = document.querySelector("#flock");
  const shy = [...document.querySelectorAll<SVGGElement>("#sheep-left .notice, #sheep-right .notice")];
  const lean = document.querySelector<SVGGElement>("#sheep-center .notice");
  const glint = document.querySelector<SVGGElement>(".glint-track");
  const sheet = document.querySelector<HTMLElement>(".sheet");
  const chosen = document.querySelector<HTMLElement>("#plot-chosen");

  const pointer = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const plotTarget = { x: 0, y: 0 };
  const plotCurrent = { x: 0, y: 0 };
  let awake = false;

  window.setTimeout(() => {
    awake = true;
  }, 2600);

  window.addEventListener("pointermove", (event) => {
    if (!flock || !awake) return;
    const rect = flock.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const radius = Math.max(rect.width, rect.height) * 0.85;
    const influence = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
    pointer.x = clamp(dx / (rect.width / 2)) * influence;
    pointer.y = clamp(dy / (rect.height / 2)) * influence;
  });

  window.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) {
      pointer.x = 0;
      pointer.y = 0;
    }
  });

  sheet?.addEventListener("pointermove", (event) => {
    const rect = sheet.getBoundingClientRect();
    plotTarget.x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 8;
    plotTarget.y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 6;
  });

  sheet?.addEventListener("pointerleave", () => {
    plotTarget.x = 0;
    plotTarget.y = 0;
  });

  const follow = () => {
    current.x += (pointer.x - current.x) * 0.08;
    current.y += (pointer.y - current.y) * 0.08;
    plotCurrent.x += (plotTarget.x - plotCurrent.x) * 0.12;
    plotCurrent.y += (plotTarget.y - plotCurrent.y) * 0.12;

    const shyX = `${(-current.x * 18).toFixed(2)}px`;
    const shyY = `${(-current.y * 10).toFixed(2)}px`;
    for (const sheep of shy) {
      sheep.style.transform = `translate(${shyX}, ${shyY})`;
    }
    if (lean) {
      lean.style.transform = `translate(${(current.x * 14).toFixed(2)}px, ${(current.y * 8).toFixed(2)}px)`;
    }
    if (glint) {
      glint.style.transform = `translate(${(current.x * 11).toFixed(2)}px, ${(current.y * 6).toFixed(2)}px)`;
    }
    if (chosen) {
      chosen.style.transform = `translate(${plotCurrent.x.toFixed(2)}px, ${plotCurrent.y.toFixed(2)}px)`;
    }
    window.requestAnimationFrame(follow);
  };

  window.requestAnimationFrame(follow);
}

const form = document.querySelector<HTMLFormElement>("#contact-form");
const error = document.querySelector<HTMLElement>("#form-error");
const thanks = document.querySelector<HTMLElement>("#thanks");
const outline = document.querySelector<SVGPathElement>("#parcel-outline");
const mark = document.querySelector<SVGSVGElement>(".parcel-mark");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(name: string): HTMLInputElement | HTMLTextAreaElement | null {
  const element = form?.elements.namedItem(name);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element;
  }
  return null;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form || !error || !thanks) return;

  const name = field("name");
  const email = field("email");
  const note = field("note");
  const nameValue = name?.value.trim() ?? "";
  const emailValue = email?.value.trim() ?? "";
  const noteValue = note?.value.trim() ?? "";

  if (!nameValue || !emailValue || !noteValue) {
    error.textContent = "Add your name, email, and a note.";
    error.hidden = false;
    (nameValue ? (emailValue ? note : email) : name)?.focus();
    return;
  }

  if (!emailPattern.test(emailValue)) {
    error.textContent = "That email doesn't look right.";
    error.hidden = false;
    email?.focus();
    return;
  }

  if (outline && mark) {
    outline.setAttribute("d", parcelPath(noteValue));
    mark.classList.remove("is-drawn");
    void mark.getBoundingClientRect();
    mark.classList.add("is-drawn");
  }

  error.hidden = true;
  form.hidden = true;
  thanks.hidden = false;
});
