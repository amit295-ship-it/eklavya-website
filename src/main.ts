import "./styles.css";
import { isSupabaseConfigured, supabase } from "./supabase";

function initScrollAnimations(): void {
  const observerOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }
    }
  }, observerOptions);

  document.querySelectorAll(".program-card").forEach((card) => {
    const el = card as HTMLElement;
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    observer.observe(el);
  });

  document.querySelectorAll(".feature-card").forEach((card) => {
    const el = card as HTMLElement;
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
}

function initContactForm(): void {
  const form = document.getElementById("eklavya-contact-form");
  const statusEl = document.getElementById("contact-form-status");
  const scrollBtn = document.getElementById("scroll-to-contact");

  scrollBtn?.addEventListener("click", () => {
    document.getElementById("contact-form-anchor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    form?.querySelector<HTMLInputElement>("input[name='name']")?.focus();
  });

  if (!(form instanceof HTMLFormElement) || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "form-status";

    if (!isSupabaseConfigured() || !supabase) {
      statusEl.textContent =
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server.";
      statusEl.classList.add("error");
      return;
    }

    const fd = new FormData(form);
    const name = (fd.get("name") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim() || null;
    const programInterest =
      (fd.get("program_interest") as string)?.trim() || null;
    const message = (fd.get("message") as string)?.trim() || null;

    if (!name || !email) {
      statusEl.textContent = "Please enter your name and email.";
      statusEl.classList.add("error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = true;

    const { error } = await supabase.from("eklavya_inquiries").insert({
      name,
      email,
      phone,
      program_interest: programInterest,
      message,
    });

    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = false;

    if (error) {
      statusEl.textContent =
        error.message || "Something went wrong. Please try again.";
      statusEl.classList.add("error");
      return;
    }

    statusEl.textContent = "Thank you! We will get back to you soon.";
    statusEl.classList.add("success");
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initContactForm();
});
