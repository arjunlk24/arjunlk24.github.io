# Your portfolio — setup guide

This is your original galaxy-themed design, fully rebuilt with real content from your resume, working bugs fixed, and the same edit/Save/Deploy system as before.

## What's real vs. placeholder right now

**Using your real assets:**
- `galaxy.mp4` → background starfield (whole site)
- `blackhole.mp4` → glowing accent at the top
- `glob.mp4` → the "flexible with time zones" card
- `digital_brain.png` → Skills section graphic
- `grid2.png` → Tech Stack card image

**Placeholders you should replace via the editor:**
- Your logo/profile photos (currently "ARM" initials placeholders) — edit via the ✏️ next to your name, and the ✏️ on the "Hi there" card
- The "More about me" card image (currently a plain "CEH v12" placeholder)
- The 3 project cards — currently show a dashed "add media" box. Add a screenshot for each via ✏️ → Media type → Image
- Tech stack logo icons (currently empty) — add via Skills ✏️ → the tech-logo manager
- Certificates — currently empty, add via the + next to "Certificates"
- CV download link — the button is disabled until you add a link via profile ✏️

## First-time setup (same as before)

1. Create/reuse the repo `arjunlk24.github.io`
2. Unzip this folder, select everything, upload via GitHub's **Add file → Upload files** (overwrite existing)
3. Make sure GitHub Pages is on (Settings → Pages)
4. Open `arjunlk24.github.io/editor.html`, connect with your token (same one as before still works, or make a new one — see earlier instructions if needed)

## Editing day-to-day

- **✏️** on anything → edit it
- **+** next to "My Projects" / "Certificates" → add a new one
- For hero heading and project titles: wrap the part you want colored in `*asterisks*`, e.g. `Cyber *Security* Tester` — the editor turns that into the gradient effect automatically
- **Save Changes** → safe draft, live site untouched
- **Deploy** → publishes live

## A few known things worth knowing

- The 3 real project descriptions (Raspberry Spy Pi, HashPrac, Water Availability website) are pulled straight from your original text — just add screenshots/links when ready
- Video uploads aren't supported through the editor (only images) — if you want a video on a project card, upload the `.mp4` directly to `assets/media/` on GitHub, then set the card's media type to "Video" and type in that path
- Contact form uses formsubmit.co — first message ever sent will trigger a one-time confirmation email to activate it
