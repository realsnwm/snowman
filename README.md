# Portfolio

Static site: index.html, styles.css, app.js, content.json. No build step.

## Deploy
Repo Settings > Pages > Deploy from a branch > main, folder / (root). Keep the .nojekyll file.

## Edit
Open your site with `#edit` at the end of the URL (or press Ctrl+Shift+E). Click any text to change it. Use the toolbar for accent colour, default theme, section visibility, undo and redo. Changes autosave in this browser only until you publish.

## Publish
1. GitHub > Settings > Developer settings > Fine-grained tokens > Generate new token.
2. Repository access: only this repo. Permissions: Contents, Read and write.
3. In edit mode click Publish and paste the token. It stays in the tab (sessionStorage) and is never written to the repo.
4. The editor commits content.json. Pages redeploys in about a minute.

Owner and repo are detected from the Pages URL. Use the Repo button to override.

## Export and import
Export downloads content.json. Import loads one back after a validity check. You can also commit a downloaded file by hand.

## Assumptions
- Vanilla JS, no framework.
- Uploaded images are resized to 1200px wide JPEGs and stored inside content.json, so keep them few.
- Sections are About me, Current positions, Former positions and Contact. Hero and Contact are hidden by default; turn them on in edit mode (Sections menu).
- Visitors can open edit mode but cannot publish without your token.

## Admin panel (v5)
In edit mode click **Admin** (or **Style** on any section). Tabs:
- **Block**: per-section padding, background, text colour, alignment, font (any Google Font name), animation (fade, up, zoom, left, none) with duration and delay, CSS class and scoped custom CSS (`&` means this section), plus a form for every content field including each card, row and button.
- **Design**: theme, accent, fonts, radius, glow, heading and body scale, section spacing, animation speed, ticker speed, columns.
- **Site**: brand, footer, top button, and integrations: Discord webhook, any form endpoint (Formspree, Web3Forms), Plausible analytics. Webhook URLs live in the public content.json, so use a throwaway webhook.
- **Code**: global custom CSS, heading font, and head HTML or scripts (embed pixels, widgets). These run only for visitors, never in edit mode.
- **JSON**: edit the whole content.json and apply it.
Add an **Embed** section for YouTube, Spotify, maps or any raw HTML. Run locally with `python -m http.server`, open `/#edit`, and Export or Publish when done.

## v6
- **Element tab**: click any text, open Admin > Element, and set its colour, size, weight, font, alignment, letter spacing, case, margins and opacity. Stored in `fx` in content.json.
- **Images on publish**: uploaded images are committed to `assets/` and content.json keeps only the path.
