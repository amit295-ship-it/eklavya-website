import "./styles.css";
import { isSupabaseConfigured, supabase } from "./supabase";
import { initChatbot } from "./chatbot";

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
  const scrollBtn = document.getElementById("scroll-to-contact");

  scrollBtn?.addEventListener("click", () => {
    document.getElementById("contact-form-anchor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initContactForm();
  initChatbot();
});
