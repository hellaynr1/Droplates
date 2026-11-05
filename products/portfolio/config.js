/*
 * Site configuration — edit this file to customise your website.
 * Schema version 2. Text values are inserted as plain text (never as HTML).
 * Template Studio on droplates.com writes this same file when you download.
 */
window.SITE_CONFIG = {
  schema: 2,
  template: "portfolio",
  edition: "free",
  preset: "editorial",         // "editorial" | "gallery" | "contemporary"
  theme: "light",              // "light" | "dark"
  style: {
    accent: "",                // "" = automatic, or a hex colour like "#b4532a"
    font: "Inter",             // body font: "Inter" | "IBM Plex Sans" | "Manrope" | "Space Grotesk"
    headFont: "",              // "" = preset decides, or "Instrument Serif" | "Fraunces" | "Inter"
    buttons: "auto",           // "auto" | "pill" | "rounded" | "square"
    density: "normal"          // "compact" | "normal" | "spacious"
  },
  brand: { name: "Mara Lind", logo: "" },         // logo: path to an image, e.g. "assets/logo.svg". Shown next to the name.
  nav: { work: "Work", about: "About", contact: "Contact" },
  hero: {
    title: "Design that feels",
    titleEm: "quietly certain.",
    text: "Mara Lind is an independent designer working on brands, products and printed matter."
  },
  contact: { email: "hello@example.com", location: "Antwerp, Belgium", availability: "From January", formEndpoint: "" },
  social: { instagram: "", linkedin: "", dribbble: "" },
  seo: { siteName: "Mara Lind", description: "Portfolio of Mara Lind, independent designer." },

  // Overrides made in Template Studio (click-to-edit). Keys are element IDs in the HTML (data-e, data-el, data-ei, data-s).
  content: {},                 // text overrides, e.g. { "index-t3": "New heading" }
  links: {},                   // button links, e.g. { "index-l1": "pricing.html" }
  images: {},                  // image placeholders, e.g. { "index-i1": "assets/img-index-i1.jpg" }
  sections: {}                 // e.g. { "index-s3": { hidden: true } }
};
