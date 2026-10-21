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
- Visitors can open edit mode but cannot publish without your token.

## Admin panel (v3)
In edit mode click **Admin** in the toolbar, **Admin** on any section strip, or press Ctrl+Shift+A. Tabs:
- **Block**: quick actions (move, duplicate, hide, delete), layout (align, title size, width, spacing, divider), colours (background style, background and text colour), **background image (with zoom / pan / fade / drift animation, length and dimming)**, font, the type's own options (layout, columns, speed...), animation and delay, visibility (mobile/desktop), nav label, anchor id, CSS class, scoped custom CSS (`&` means this section), extras (animation duration, extra delay, padding top/bottom), and a form for every content field — including add, reorder, duplicate and delete for every card, row and button.
- **Element**: click any text on the page, then style just that element — font, size, weight, align, case, letter spacing, line height, colours, glow, margins, padding, corners, max width and opacity. Stored in `fx` in content.json and stays attached to the right item when you reorder, duplicate or delete.
- **Inline page editing**: most content is editable right on the page — hero buttons (label, link, style — add as many as you like), ticker names, stat numbers, contact form labels and its selectable chips, card texts and links, profile chip, profile badges and stats, FAQ answers, rate rows. Click and type; use the small control buttons next to each item to add, duplicate, reorder or delete. Placeholders, shared labels ("View all", form hints) and design settings are edited in the Admin panel instead.
- **Design**: one-click presets (Aurora, Emerald, Sunset, Candy, Ocean, Slate, Editorial), colours, page background image with animation (zoom, pan, fade, drift) and dimming, ambient glow blobs, three fonts, sizes, layout, motion, **visitor loader (on/off, orb or bar style, speed)**, and ticker speed.
- **Site**: brand, footer, button, nav, small texts, SEO (title, description, share image, favicon, theme colour), and integrations: **customizable Discord webhook message** (see below), any form endpoint that accepts a JSON POST body like `{name, needs, message}`, Plausible analytics. If a webhook or form endpoint is set, the contact form posts to it first and only falls back to your email app if the service is unreachable. Plausible loads on the visitor site only. Webhook URLs live in the public content.json, so use a throwaway webhook.
- **Code**: global custom CSS, and head HTML or scripts (embed pixels, widgets). These run only for visitors, never in edit mode or the preview.
- **JSON**: edit the whole content.json and apply it (undoable, invalid JSON is rejected safely).
There is a search box at the top of the panel: type "font" or "glow" to jump to those settings.

## Add Section library
"+ Add section" opens a searchable, categorized modal (All / Essential / Content / Growth / Integrations) with a mini wireframe for every type and a ✓ on types already on the page. 23 section types:
- **Essential**: Hero, Text, Buttons, Notice, Spacer, **Profile** (banner with animated background image, avatar, name, handle, bio, badge pills, location + live local time, "Open to work" status, stat icons), **Discord** (live presence, see below), **Roblox** (profile card, see below)
- **Content**: Cards, List, Feature, Gallery, Image, Embed, **Badges** (skill/role pills), **Showcase** (floating tilted project cards), Ticker
- **Growth**: Stats, **Rates** (services with prices), **FAQ** (accordion), **Testimonials** (quotes with stars and avatars), **CTA banner**

## Visitor loader
A polished loading screen (brand name, progress line, percentage, pulsing orb) shows while the page loads. Configure it in the Design panel: on/off, "orb" or minimal "bar" style, and speed. It is skipped entirely for visitors with a reduced-motion preference, and it never runs in edit mode.

## Animated background images
Three places support a background image with animation, all with reduced-motion fallbacks:
- **Page background** (Design > Colours): image + dimming + zoom / pan / fade / drift animation, direction, length, position and size (cover / contain / actual size).
- **Any section** (Admin > Block > Background image): image, animation, length, position, size (cover / contain / actual size), intensity and dimming. Fills the section behind its content; the profile card gets a more solid surface automatically so text stays readable.
- **Profile banner** (Admin > Block > type options): image, animation, length, position, size, direction and dimming for the profile card's banner. The image is clipped to the banner.

## Discord presence (live)
Add a **Discord** section and paste your Discord user ID (Admin > Block > Content, or the "Discord user ID" line under the section). The card shows your avatar, display name, @handle, online / idle / do-not-disturb / offline status with a coloured dot, your custom status, and the current activity with details and elapsed time ("Not playing anything right now" otherwise). It refreshes every 30 seconds and when the tab becomes visible again.

**How it works**: it uses the free [Lanyard](https://lanyard.rest) API (`api.lanyard.rest`), the same method used by the reference site. Lanyard can only see users who have joined the **Lanyard Discord server** (`discord.gg/lanyard`) — join it once and your presence becomes public. If Lanyard is unreachable, the card shows "status unavailable" instead of breaking the page. This is a documented limitation of Discord's API: websites cannot read arbitrary users' presence directly from Discord.

## Roblox presence
Add a **Roblox** section for a profile card: name, handle, avatar (upload or URL), description, stats with icons, and a link to your Roblox profile (auto-built from your user ID). 

**Limitation**: in our tests, Roblox's public endpoints (user lookup, thumbnails, presence) sent no `Access-Control-Allow-Origin` headers, so a browser page cannot call them, and live status is only available to authenticated clients. So this section is a manually-configured profile card with a direct profile link; it never fabricates online status or current game data.

## Customizable Discord webhook message
Admin > Site > Integrations > **Webhook message**. Customize exactly what the contact form sends:
- **Message content** with placeholders filled from the form: `{name}` `{needs}` `{message}` `{date}` `{time}` `{page}` `{brand}`. Discord Markdown works (**bold**, *italic*, blank lines).
- **Embed** (toggle): title, description, colour, footer, and up to 25 name/value fields (inline or stacked). Placeholders work in every field. Discord's size limits are enforced when sending (content 2000, description 4096 characters, 25 fields, 6000 characters total per embed; anything over is trimmed and flagged in the editor), and mentions are disabled so the form cannot be used to ping anyone.
- A **Discord-style live preview** updates as you type.
- **Send test message** posts one sample request to your webhook so you can check the result in Discord.
The message is saved in content.json and reused by the contact form. Keep using a throwaway webhook: the URL is public in content.json. No other credentials are needed or requested.

## Preview
The Preview button (or 📱 Preview in the admin panel) opens the phone, tablet and desktop preview. It shows your current draft, not the published version. The draft is passed to the preview directly from the editor, so it also works where browser storage is unavailable.

## What was repaired (v7)
The previous edit session had disconnected the admin panel (admin.js was never loaded, its CSS and helpers were missing) and content.json was losing data on every load: the heading font, per-element styles, SEO settings and integrations were silently dropped. This version restores all of it, keeps old content.json files working (old design keys like hsize, bsize, sg, spd, mqs are migrated automatically), and keeps element styles attached to the right items when lists are reordered.

## What was added (v8)
- Visitor loader (Caesrov-style: orb, progress line, percentage), configurable in Design.
- Ambient glow blobs and the existing cursor glow / card spotlight / hover glow options.
- Animated background images: page-level, per-section, and profile banner (zoom / pan / fade / drift, speed, direction, dimming, reduced-motion fallbacks).
- Add Section modal with search, categories and wireframes; 9 new section types (Profile, Discord, Roblox, Rates, FAQ, Testimonials, CTA banner, Badges, Showcase).
- Live Discord presence via Lanyard; Roblox profile card (documented API limitations).
- Fully customizable Discord webhook messages with embed, fields, placeholders, live preview and a test send.
- Fixed a latent positioning bug: the Add Section modal and the Design drawer were rendered inside the toolbar, whose backdrop-filter capped their fixed positioning; they are now attached to the page body and cover the full viewport.

Run locally with a simple static file server, open `/#edit`, and Export or Publish when done. Old section styles from the previous editor keep working: if you change the animation or colours in the new panel, the old override is cleared automatically, and Reset style puts the section back to its defaults.
