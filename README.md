# Masarifi 7.0.0

A portable expense PWA in Arabic, Turkish, English, French and Latin-script Kurmancî. The entry page bundles its UI code, styles and artwork; no npm install or online script CDN is needed to run it.

## Publish on GitHub Pages

Unzip the package and upload the files, not the ZIP. Replace these **seven files together in the repository root**:

`index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`, `release.json`.

Keep your existing Pages URL and browser storage to retain local records. Upload the included source folders too if you want editable source on GitHub. Upload `google-drive/` to make the in-app setup guide available; its files contain no account credentials. `.nojekyll` disables Jekyll processing.

Open online once and wait for “Ready for offline use”. Install from the app card or your browser menu; on iPhone use Safari → Share → Add to Home Screen. Browser installation prompts remain browser-controlled. The card disappears in standalone mode or after a supported installation event. A downloaded standalone HTML file is a portable local edition, not an installable PWA.

## V7 changes

- Gentle daylight mint/blue/lilac surfaces; V6 night palette retained. Brief motion respects reduced-motion preferences.
- Persistent raised circular navigation indicator moving with the selected section, mirrored correctly in RTL.
- Settings → Customize home: nine independent saved widget toggles; customization remains reachable with everything hidden.
- One swipeable cashbox card with manual controls, decorative chip/contactless artwork and an All accounts footer.
- Dedicated full-page account directory and account overview/activity/dated-statement pages with the existing ledger and PDF/Excel export.
- Currency-only primary expense account; explicit transaction account/currency wins, metals remain usable explicitly, existing records are never reassigned.
- Full-page notes reader/editor with titles, tags, pins, archive, checklists, photos, session drafts and existing report/share/trash support.
- Broader five-language local assistant: period comparisons, primary account queries, navigation, notes/checklist drafts, search and corrections to the last unsaved financial draft.
- V6 PIN/session behavior, browser installation, white icons, local/Drive backups, release notices and all five languages retained.

Notes drafts are held in the current session until Save or Discard. They are cleared by locking or reloading; browser leave warnings are requested for unsaved changes. They do not constitute saved records or backups. The assistant uses local rules, not a general language model; voice recognition remains browser-dependent.

## Google Drive

Follow [the setup guide](google-drive/README.md), or [Arabic instructions](google-drive/README_AR.md). Deploy the included Apps Script and Bridge in your own Google account, authorize it, then pair the app once. No Google account has been connected by this package.

The Google schedule verifies/refreshes the **last uploaded snapshot** while the app is closed. It cannot fetch unsynchronized data from a closed device. This is a single latest backup, not live multi-device sync or version history. The cloud bridge limit is 15 MiB; local complete export remains available.

## Update the version

Edit only `release.json`: change `version`, `date`, and `changes` for **ar/tr/en/fr/ku**. Then run:

```bash
python3 tools/build.py
```

This regenerates the embedded release metadata, package version, self-contained entry and hashed service worker. Publish all seven root files together. A newer version is announced with its localized changes; worker activation requires confirmation and refuses to interrupt an open financial dialog. Do not upload only `release.json` without the matching build.

## Development and verification

```bash
npm install
npm run build
npm test
npm start
```

Source modules are under `assets/`; `google-drive/` holds server source, and `tests/` covers the actual generated entry and isolated financial/security/transport logic. The build also emits `../Masarifi_V7_Standalone.html`.

See [README_AR.md](README_AR.md) for detailed Arabic usage and [QA_REPORT.md](QA_REPORT.md) for measured coverage and limitations. The local PIN is a privacy lock, not database encryption. Voice/browser installation and a real Google deployment require validation on the target device/account.
