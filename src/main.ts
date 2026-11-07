import logo from "./logo.svg?raw";

const slot = document.querySelector("#flock-slot");
if (slot) {
  slot.innerHTML = logo;
}

const form = document.querySelector<HTMLFormElement>("#contact-form");
const error = document.querySelector<HTMLElement>("#form-error");
const thanks = document.querySelector<HTMLElement>("#thanks");

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

  error.hidden = true;
  form.hidden = true;
  thanks.hidden = false;
});
