# DropLates

Website for DropLates, premium Shopify themes. Currently a waitlist page.

## Run locally

No install step. Serve the folder with any static server, for example:

    python3 -m http.server 8000

then open http://localhost:8000.

## Waitlist

- The form lives in `index.html` and `assets/waitlist.js`.
- Emails are saved to a Supabase table. Setup: `supabase/waitlist.sql`.
- Paste the project URL and publishable key into `window.DROPLATES_CONFIG` in `index.html`.
- Until both values are set, the form shows the success message but saves nothing.

## Deploy

GitHub Pages serves the `main` branch. `CNAME` points the site to droplates.com.
