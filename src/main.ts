import "./styles.css";
import { isSupabaseConfigured, supabase } from "./supabase";
import { initChatbot } from "./chatbot";
import { initVoiceCall } from "./voice-call";

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

function initLightbox(): void {
  const lightbox = document.getElementById("media-lightbox");
  const lightboxImg = document.getElementById("lightbox-img") as HTMLImageElement | null;
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");

  if (!lightbox || !lightboxImg || !lightboxCaption || !closeBtn) return;

  const triggerElements = document.querySelectorAll(".zoomable-gallery-img");
  triggerElements.forEach((el) => {
    el.addEventListener("click", () => {
      const img = el.querySelector("img") as HTMLImageElement | null;
      const captionText = el.getAttribute("data-caption") || "";
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = captionText;
        lightbox.classList.remove("hidden");
        // Disable body scroll when lightbox is open
        document.body.style.overflow = "hidden";
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === closeBtn) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initContactForm();
  initLightbox();
  initChatbot();
  initVoiceCall();
});
