# Masarifi 7.3.0

A local-first expense PWA in Arabic, Turkish, English, French and Latin-script Kurmancî, with a zero-setup shared Supabase workspace. UI code, styles and artwork are bundled in the entry page. The cloud client is loaded online when available; IndexedDB remains the immediate local write path and the app continues to operate offline.


## V7.3 — WOW Shared Workspace Realtime

- Every installation silently creates an anonymous Supabase Auth identity and is automatically joined to the single **WOW Masarifi** workspace. There is no email/password, project configuration, or manual Sync button.
- All devices read the same company snapshot. A local save commits to IndexedDB first, then pushes with revision compare-and-swap; other connected devices receive Realtime notification and pull the new revision.
- Offline devices keep working locally. Reconnect uses automatic record-aware merge and retries instead of asking the user to choose a whole-device copy.
- New photos use private workspace Storage paths with RLS. Only the publishable client key is embedded; no secret/service-role key is shipped.
- The hosted production project is **Masarifi** in `eu-central-1`.

**Security model:** this build intentionally admits every copy of the app to the same WOW workspace with no user interaction. Treat the distributed app itself as the access boundary. Do not publish the app to an audience that should not see company data.

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

Google Drive remains a separate backup path. Live multi-device synchronization is now provided by Supabase WOW Shared Workspace; Drive is not part of the Realtime path. The Google schedule can still verify/refresh its last uploaded backup while the app is closed. The cloud bridge limit is 15 MiB; local complete export remains available.

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
