/*
 * Site configuration — edit this file to customise your website.
 * Schema version 1. Text values are inserted as plain text (never as HTML).
 * Template Studio on droplates.com writes this same file when you download.
 */
window.SITE_CONFIG = {
  schema: 1,
  template: "saas",
  edition: "free",
  preset: "modern",            // "minimal" | "modern" | "bold"
  theme: "dark",               // "dark" | "light"
  style: {
    accent: "",                // "" = automatic (matches the theme), or a hex colour like "#4f46e5"
    font: "Inter",             // "Inter" | "Space Grotesk" | "IBM Plex Sans" | "Manrope"
    buttons: "auto",           // "auto" (preset decides) | "pill" | "rounded" | "square"
    density: "normal"          // "compact" | "normal" | "spacious"
  },
  brand: { name: "Vela", logo: "" },          // logo: path to an image, e.g. "assets/logo.svg"
  nav: { features: "Features", pricing: "Pricing", about: "About", contact: "Contact", cta: "Get started" },
  hero: {
    title: "The analytics workspace for product teams.",
    text: "Track, explore and share product data in one place. One API for events, queries and dashboards.",
    ctaLabel: "Start free",
    ctaUrl: "pricing.html"
  },
  contact: {
    email: "hello@example.com",
    formEndpoint: ""           // e.g. a Formspree URL. Empty = form shows a setup notice and sends nothing.
  },
  social: { x: "", linkedin: "", github: "" },
  seo: { siteName: "Vela", description: "Vela is a product analytics workspace for modern teams." }
};
