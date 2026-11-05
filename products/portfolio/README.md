# Droplates Free — Portfolio & Personal Brand

A complete multi-page website template. Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Quick start
1. Unzip the folder.
2. Open `index.html` in your browser to preview.
3. Edit `config.js` to change your brand, text, colours and style.

## Customise
All settings live in `config.js`:
- `preset`: one of the three style presets listed in the file
- `theme`: `"light"` or `"dark"`
- `style`: accent colour, fonts, button shape, spacing
- `brand`, `nav`, `hero`, `contact`, `social`, `seo`: your text and links

Page content that is not in `config.js` (projects, team, testimonials, pricing) is plain HTML in each page. Search for "demo" to find the sample content you should replace.

Replace grey image placeholders (elements with the text "Replace image") with your own images.

## Contact form
The form validates input but does not send anything until you set `contact.formEndpoint` in `config.js` to a form service URL (for example a Formspree or Basin endpoint, or your own server). It submits a standard `FormData` POST.

## Deploy
Upload the whole folder to any static host:
- **GitHub Pages:** push to a repository, then Settings → Pages → deploy from branch.
- **Netlify / Cloudflare Pages:** drag and drop the folder.
- **Any web host:** upload the files by FTP.

## Fonts
Fonts load from Google Fonts (free, open licence). To self-host, download the fonts and replace the font loading in `assets/site.js`.

## Licence
See `LICENSE.txt`.
