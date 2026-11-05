/*
 * Site configuration — edit this file to customise your website.
 * Schema version 2. Text values are inserted as plain text (never as HTML).
 * Template Studio on droplates.com writes this same file when you download.
 */
window.SITE_CONFIG = {
  schema: 2,
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
  seo: { siteName: "Vela", description: "Vela is a product analytics workspace for modern teams." },

  announcement: { enabled: false, text: "New: workflows are here.", linkLabel: "Read the changelog", linkUrl: "changelog.html" },
  // Lists — edit, add or remove items. Each list renders a section of the site.
  tour: [
    { title: "Install the SDK", text: "One line of code on web, mobile or server.", image: "" },
    { title: "Watch events arrive", text: "A live feed confirms tracking works.", image: "" },
    { title: "Build a funnel", text: "Pick steps and see where users drop off.", image: "" },
    { title: "Share the report", text: "Send one link to your whole team.", image: "" }
  ],
  integrations: [
    { name: "Team chat", text: "Send alerts to your team chat." },
    { name: "Payments", text: "Connect revenue data." },
    { name: "Database", text: "Query your own data source." },
    { name: "Data import", text: "Bring events from other tools." },
    { name: "Webhooks", text: "Send events anywhere." },
    { name: "API", text: "Full programmatic access." }
  ],
  plans: [
    { name: "Starter", monthly: "€0", yearly: "€0", period: "/month", features: ["1 project", "10k events / month", "Community support"], cta: "Start free", ctaUrl: "contact.html", popular: false },
    { name: "Pro", monthly: "€29", yearly: "€24", period: "/month", features: ["Unlimited projects", "1M events / month", "Alerts and exports", "Email support"], cta: "Choose Pro", ctaUrl: "contact.html", popular: true },
    { name: "Team", monthly: "€99", yearly: "€82", period: "/month", features: ["Everything in Pro", "10M events / month", "Roles and SSO", "Priority support"], cta: "Contact sales", ctaUrl: "contact.html", popular: false }
  ],
  compare: [
    { group: "Usage", rows: [{ label: "Projects", values: ["1", "Unlimited", "Unlimited"] }, { label: "Events / month", values: ["10k", "1M", "10M"] }, { label: "Data retention", values: ["30 days", "1 year", "3 years"] }] },
    { group: "Features", rows: [{ label: "Funnels and retention", values: ["✓", "✓", "✓"] }, { label: "Alerts", values: ["—", "✓", "✓"] }, { label: "Exports and API", values: ["—", "✓", "✓"] }, { label: "Roles and SSO", values: ["—", "—", "✓"] }] },
    { group: "Support", rows: [{ label: "Support", values: ["Community", "Email", "Priority"] }] }
  ],
  changelog: [
    { date: "[Date]", version: "v2.0", title: "Workflows", items: [{ type: "New", text: "Automate reports on a schedule." }, { type: "Improved", text: "Faster funnel queries." }] },
    { date: "[Date]", version: "v1.9", title: "Alert channels", items: [{ type: "New", text: "Send alerts to your team chat." }, { type: "Fixed", text: "Time zones in exports." }] },
    { date: "[Date]", version: "v1.8", title: "Team workspaces", items: [{ type: "New", text: "Invite teammates with roles." }] }
  ],

  // Overrides made in Template Studio (click-to-edit). Keys are element IDs in the HTML (data-e, data-el, data-ei, data-s).
  content: {},                 // text overrides, e.g. { "index-t3": "New heading" }
  links: {},                   // button links, e.g. { "index-l1": "pricing.html" }
  images: {},                  // image placeholders, e.g. { "index-i1": "assets/img-index-i1.jpg" }
  sections: {}                 // e.g. { "index-s3": { hidden: true } }
};
