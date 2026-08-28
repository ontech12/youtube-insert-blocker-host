# YouTube insert blocker — install instructions

Parental-control Chrome/Edge extension that disables YouTube insert/search in Google Slides and PowerPoint for the web.

This repo is a **GitHub Pages host** (`.crx` + `updates.xml`). It is not a Chrome Web Store listing.

**Pages URL:** https://ontech12.github.io/youtube-insert-blocker-host/

Extension ID: `jhnfgifegdmhefpkbpnefelblhgipfjf`

---

## End-to-end (Chrome Enterprise enrollment + GitHub force-install)

Chrome will not auto-install a GitHub `.crx` unless the browser is **enterprise enrolled**. A registry policy by itself is not enough.

### 1. Sign up for Chrome Enterprise Core (once)

1. Open [Chrome Enterprise Core signup](https://enterprise.google.com/signup/chrome-browser/email?origin=cbcm).
2. Use a **work/domain email**, not a normal `@gmail.com`.
3. Finish signup and accept the terms.
4. Sign in at [admin.google.com](https://admin.google.com).

### 2. Get the enrollment token (once)

1. In Admin console: **Chrome browser** → **Managed browsers** (or **Devices** → **Chrome** → **Managed browsers**).
2. Click **Enroll**.
3. **Download .reg file** and keep it **private**. Do not put that file on GitHub or a public clipboard. It can enroll browsers into *your* Admin console.

### 3. Enroll each Windows PC

Use Chrome from [google.com/chrome](https://www.google.com/chrome/) (system install), as Administrator. Kids should be **standard** Windows users.

1. Run Google’s enrollment `.reg`.
2. Fully quit Chrome and open it again.
3. In Admin console → **Managed browsers**, confirm the PC appears.
4. On the PC, open `chrome://policy`. You should see `CloudManagementEnrollmentToken`.
5. The warning *this computer is not detected as enterprise managed so policy can only auto install extensions hosted on chrome webstore* should be gone.

### 4. Force-install the extension from GitHub Pages

In **Administrator** PowerShell:

```powershell
irm https://ontech12.github.io/youtube-insert-blocker-host/install-policy.reg -OutFile install-policy.reg
reg import install-policy.reg
```

Direct file: [install-policy.reg](https://ontech12.github.io/youtube-insert-blocker-host/install-policy.reg)

Fully quit Chrome and open it again. Wait a minute if needed.

The policy also unpins the icon and blocks `chrome://extensions` / `edge://extensions` so kids are less likely to see it. Chrome will not let an extension vanish from that page entirely if someone can still open it.

### 5. Confirm

- `chrome://policy` should list `ExtensionInstallForcelist` with `jhnfgifegdmhefpkbpnefelblhgipfjf` and `ontech12.github.io`.
- `chrome://extensions` should show **Block YouTube Insert in Slides & PowerPoint**, installed by policy, Remove grayed out.
- Open a Google Slides tab and check that Insert → Video / YouTube search is blocked.

### Optional: force-install from Admin console instead of step 4

**Apps and extensions** → add ID `jhnfgifegdmhefpkbpnefelblhgipfjf` with update URL  
`https://ontech12.github.io/youtube-insert-blocker-host/updates.xml`  
and set it to force-install.

Do **not** turn on Developer mode for this path.

### If it is already installed via Google Admin

GitHub Pages will **not** push toolbar-hide or extensions-page blocking. Those are Admin policies, not part of the `.crx`. You must set them once in Admin; enrolled PCs then pick them up after a Chrome restart.

1. Sign in at [admin.google.com](https://admin.google.com).
2. **Chrome browser** → **Apps and extensions** (or **Devices** → **Chrome** → **Apps and extensions**).
3. Open **Block YouTube Insert in Slides & PowerPoint** (`jhnfgifegdmhefpkbpnefelblhgipfjf`).
4. Installation stays **Force install**. Do **not** pin it to the toolbar.
5. **Chrome browser** → **Settings** (User & browser settings) → find **URL blocking** / **Block access to a list of URLs**.
6. Add:
   - `chrome://extensions`
   - `chrome://extensions-internals`
7. Save. On each enrolled PC, fully quit Chrome and reopen it (wait a few minutes if needed).
8. Confirm: the toolbar icon is not pinned, and `chrome://extensions` is blocked. The extension keeps working in Slides.

Later **code** updates: bump `version` in the extension, replace `youtube-insert-blocker.crx` and `updates.xml` on this repo. Enrolled PCs download that themselves. No Admin re-add.

---

## Alternate: Developer mode (no enrollment)

This shows the extension immediately, but kids can remove it.

1. Download [unpacked.zip](https://ontech12.github.io/youtube-insert-blocker-host/unpacked.zip).
2. Unzip somewhere permanent (not Downloads).
3. `chrome://extensions` → turn **Developer mode** on → **Load unpacked** → select the folder that contains `manifest.json`.
4. Leave Developer mode on. Do not move or delete that folder.

---

## Hosted files

| File | Purpose |
|------|---------|
| [youtube-insert-blocker.crx](youtube-insert-blocker.crx) | Packed extension |
| [updates.xml](updates.xml) | Chrome update manifest |
| [install-policy.reg](install-policy.reg) | Chrome + Edge force-install policy |
| [unpacked.zip](unpacked.zip) | Load unpacked (Developer mode) |

Do not publish `*.pem` signing keys or Google’s enrollment `.reg`.
