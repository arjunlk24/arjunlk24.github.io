# Your portfolio — setup guide (no coding needed)

This is a one-time setup. After this, updating your portfolio forever = clicking + and ✏️ buttons, then "Save Changes" or "Deploy". No terminal, no git, no installing anything on your computer.

---

## Step 1 — Create the repository

1. Go to https://github.com/new (make sure you're logged in as **arjunlk24**).
2. **Repository name:** type exactly `arjunlk24.github.io` (this exact name is what makes GitHub host it for free at `https://arjunlk24.github.io`).
3. Set it to **Public**.
4. Do **not** check "Add a README" — leave everything else unchecked.
5. Click **Create repository**.

## Step 2 — Upload these files

1. On your new (empty) repo page, click **"uploading an existing file"** (a blue link in the middle of the page).
2. Open the folder I gave you on your computer. Select **everything inside it** (all files and folders: `index.html`, `editor.html`, `data.json`, `data-draft.json`, `assets`, `images`, `.nojekyll`, `README.md`) and drag them all into the browser upload box at once.
   - Tip: in the folder, press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select everything, then drag.
3. Scroll down, click **Commit changes**.

## Step 3 — Turn on GitHub Pages

1. In your repo, click **Settings** (top menu) → **Pages** (left sidebar).
2. Under "Build and deployment" → Source, make sure it says **Deploy from a branch**, Branch = **main**, folder = **/(root)**. Click **Save** if you changed anything.
3. Wait 1–2 minutes. Your live site will be at:
   👉 **https://arjunlk24.github.io**

## Step 4 — Create your access token (this is what lets the editor publish for you)

This token is like a special password that only lets the editor update *this one repository* — nothing else on your account.

1. Go to https://github.com/settings/personal-access-tokens/new
2. **Token name:** `portfolio-editor`
3. **Expiration:** pick 90 days or 1 year (you can always make a new one later — I'll remind you if it ever expires).
4. **Repository access:** choose **"Only select repositories"** → pick `arjunlk24.github.io`.
5. Scroll to **Permissions → Repository permissions** → find **"Contents"** → set it to **"Read and write"**.
6. Scroll down, click **Generate token**.
7. **Copy the token now** (it looks like `github_pat_...`) — GitHub only shows it once. Paste it somewhere safe temporarily (like a Notes app) — you'll paste it into the editor in the next step.

## Step 5 — Open your editor and connect

1. Go to: **https://arjunlk24.github.io/editor.html**
2. Paste your token into the box, click **Connect**.
3. That's it — you're in edit mode. This token stays saved in this browser only, so you won't need to paste it again on this device.

---

## How to use it day-to-day

- **Pencil icon (✏️)** on anything → edit that item.
- **Plus icon (+)** next to a section heading → add a new item to that section (new job, new project, new skill category, etc).
- **"+ Add a new section"** at the bottom → create a whole new section (e.g. "Publications", "Volunteering") with your own items in it.
- **Save Changes** → stores your edits safely on GitHub as a draft. Your *live* site is untouched — nothing visitors see changes yet. Safe to do anytime, as often as you like.
- **Deploy** → publishes your current edits to the real, live site. Takes about a minute to go live.
- **Preview** → opens your live-look page in a new tab so you can check things before deploying.
- **Theme dots** (bottom of the left sidebar) → switch color themes instantly.
- **⏻ button** → disconnects this browser from GitHub (use if you're on a shared/public computer).

## Adding your photo or project screenshots

Click the pencil on your profile photo (top-left) or open/add a project and use the image field — pick a photo from your computer, save the form, and it uploads automatically. No resizing needed, just keep images under a few MB.

## If something goes wrong

- **"Could not connect" when pasting token:** double check you copied the whole token, and that under Step 4.5 you set Contents to "Read and write" for the right repository.
- **Site shows old content after Deploy:** GitHub Pages can take up to ~60 seconds, sometimes a couple of minutes. Hard-refresh your browser (Ctrl+Shift+R / Cmd+Shift+R).
- **Token expired:** repeat Step 4 to make a new one, then paste it in at the editor's connect screen again.
- **Want a different look entirely later:** just tell me — I can design a brand new template while keeping all your content exactly as it is, since your content (`data.json`) and design (the `assets` folder) are kept separate on purpose.

## What's in this folder (for your reference — you never need to edit these by hand)

| File | What it is |
|---|---|
| `index.html` | Your live, public portfolio page |
| `editor.html` | Your private editing tool |
| `data.json` | Your **live** content (what visitors currently see) |
| `data-draft.json` | Your **draft** content (what you're currently working on) |
| `assets/css/` | Design/theme files |
| `assets/js/` | The logic that powers rendering, editing, and publishing |
| `images/` | Your uploaded photos |
