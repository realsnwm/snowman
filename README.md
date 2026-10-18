# Snowman — Advanced editable portfolio

This repository hosts a single-page portfolio that includes a powerful in-browser editor. The editor is intentionally feature-rich: everything in content.json is editable, you can upload images and fonts, tweak layout, colors, theme, and publish changes directly to this repository.

IMPORTANT: this project uses plain HTML, CSS and vanilla JavaScript. No build step, no CDNs.

How to enable GitHub Pages
- Go to the repository Settings → Pages
- Branch: `main` and folder: `/ (root)`
- Save. Wait ~60 seconds after publishing for Pages to redeploy.

Entering edit mode
- Open the site and add `#edit` to the URL, or press Ctrl+Shift+E. The editor toolbar will appear.
- In edit mode every text field is editable in-place. Hidden blocks become visible but dimmed.

Key editor features
- Everything editable: titles, paragraphs, cards, lists, contact rows, CTA buttons, section visibility, and more.
- Deep customization: accent colour, theme (auto/light/dark), font choices, layout width, card radius, animations, and spotlight/background glow.
- Upload fonts (woff/woff2/ttf) and images. Uploaded images are resized to a max width of 1200px and stored as compressed JPEG data URLs in content.json. Uploaded fonts are embedded via @font-face and stored in data.assets.fonts.
- Undo/Redo with history saved to localStorage (many steps).
- Export downloads the current content.json. Import validates a JSON file.
- Publish commits the content.json to this repository using the GitHub REST API. You will be prompted for a fine-grained personal access token (Contents: read & write for this repo). The token is stored only in `sessionStorage` for the current tab.

Publishing (high level)
1. In edit mode click Publish. Paste a fine-grained token created in GitHub Settings → Developer settings → Personal access tokens (fine-grained). Set repository access to this repo and enable Contents read & write.
2. The editor will GET `/repos/{owner}/{repo}/contents/content.json` to obtain the file SHA and then PUT the updated file as base64 content with a commit message.
3. On success, you will see a confirmation. Pages usually takes ~1 minute to redeploy.

Export & Import
- Export: downloads the current content.json.
- Import: choose a valid content.json and the editor will validate it before loading.

Assumptions & notes
- No external fonts or CDNs are used. Fonts can be uploaded to the editor and embedded into the page.
- Uploaded images and fonts increase content.json size; GitHub has file size limits — keep large media usage minimal.
- The editor stores drafts in localStorage under `portfolio-draft-v2` until you publish.
- The token for publishing is stored only in sessionStorage and is cleared if GitHub responds with Bad credentials.

If you want a narrower feature set or a more opinionated editor UI (instead of the "everything is editable" approach), tell me which areas to focus on and I will simplify or extend accordingly.
