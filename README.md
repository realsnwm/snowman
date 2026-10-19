# Portfolio

Static site: index.html, styles.css, app.js, admin.js, content.json. No build step.

## Deploy
Repo Settings > Pages > Deploy from a branch > main, folder / (root). Keep the .nojekyll file.

## Edit
Open your site with `#edit` at the end of the URL (or press Ctrl+Shift+E). Click any text to change it. Use the toolbar for accent colour, default theme, section visibility, undo and redo. Changes autosave in this browser only until you publish. **Ctrl+Shift+A** opens the admin panel.

## Publish
1. GitHub > Settings > Developer settings > Fine-grained tokens > Generate new token.
2. Repository access: only this repo. Permissions: Contents, Read and write.
3. In edit mode click Publish and paste the token. It stays in the tab (sessionStorage) and is never written to the repo.
4. The editor commits content.json, saves uploaded images to `assets/` (each image gets a stable name derived from its content, so republishing never overwrites a different picture with the same name), and writes your SEO tags (title, description, share image, favicon, theme colour) into index.html so Discord and Google can read them. Pages redeploys in about a minute.

Owner and repo are detected from the Pages URL. Use the Repo button to override.

## Export and import
Export downloads content.json. Import loads one back after a validity check. You can also commit a downloaded file by hand.

## Assumptions
- Vanilla JS, no framework.
- Uploaded images are resized to 1200px wide JPEGs/PNGs. When you publish they are committed to `assets/` and content.json keeps only the path; while editing they live inside the draft in your browser.
- Sections are About me, Current positions, Former positions and Contact. Hero and Contact are hidden by default; turn them on in edit mode (Sections menu).
- Visitors can open edit mode but cannot publish without your token.

## Admin panel (v3)
In edit mode click **Admin** in the toolbar, **Admin** on any section strip, or press Ctrl+Shift+A. Tabs:
- **Block**: quick actions (move, duplicate, hide, delete), layout (align, title size, width, spacing, divider), colours (background style, background and text colour), font, the type's own options (layout, columns, speed...), animation and delay, visibility (mobile/desktop), nav label, anchor id, CSS class, scoped custom CSS (`&` means this section), extras (animation duration, extra delay, padding top/bottom), and a form for every content field — including add, reorder, duplicate and delete for every card, row and button.
- **Element**: click any text on the page, then style just that element — font, size, weight, align, case, letter spacing, line height, colours, glow, margins, padding, corners, max width and opacity. Stored in `fx` in content.json and stays attached to the right item when you reorder, duplicate or delete.
- **Inline page editing**: most content is editable right on the page — hero buttons (label, link, style — add as many as you like), ticker names, stat numbers, contact form labels and its selectable chips, card texts and links, profile chip. Click and type; use the small control buttons next to each item to add, duplicate, reorder or delete. Placeholders, shared labels ("View all", form hints) and design settings are edited in the Admin panel instead.
- **Design**: one-click presets (Aurora, Emerald, Sunset, Candy, Ocean, Slate, Editorial), colours, three fonts, sizes, layout, motion and ticker speed.
- **Site**: brand, footer, button, nav, small texts, SEO (title, description, share image, favicon, theme colour), and integrations: Discord webhook, any form endpoint that accepts a JSON POST body like `{name, needs, message}`, Plausible analytics. If a webhook or form endpoint is set, the contact form posts to it first and only falls back to your email app if the service is unreachable. Plausible loads on the visitor site only. Webhook URLs live in the public content.json, so use a throwaway webhook.
- **Code**: global custom CSS, and head HTML or scripts (embed pixels, widgets). These run only for visitors, never in edit mode or the preview.
- **JSON**: edit the whole content.json and apply it (undoable, invalid JSON is rejected safely).
There is a search box at the top of the panel: type "font" or "glow" to jump to those settings.

## Preview
The Preview button (or 📱 Preview in the admin panel) opens the phone, tablet and desktop preview. It shows your current draft, not the published version. The draft is passed to the preview directly from the editor, so it also works where browser storage is unavailable.

## What was repaired (v7)
The previous edit session had disconnected the admin panel (admin.js was never loaded, its CSS and helpers were missing) and content.json was losing data on every load: the heading font, per-element styles, SEO settings and integrations were silently dropped. This version restores all of it, keeps old content.json files working (old design keys like hsize, bsize, sg, spd, mqs are migrated automatically), and keeps element styles attached to the right items when lists are reordered.

Add an **Embed** section for YouTube, Spotify, maps or any raw HTML. Run locally with a simple static file server, open `/#edit`, and Export or Publish when done. Old section styles from the previous editor keep working: if you change the animation or colours in the new panel, the old override is cleared automatically, and Reset style puts the section back to its defaults.
