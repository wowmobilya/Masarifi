# مصاريفي / Masarifi V5

Static personal-finance app. Arabic, Turkish, English, French, and Latin Kurmanji. No runtime npm install, backend, build, API secret, or CDN script is needed.

Upload the contents of this directory to the repository root. Enable GitHub Pages from `main` → `/(root)`. Keep `index.html`, `assets/`, `sw.js`, and `manifest.webmanifest` together. Open once online to cache the application; install from the browser menu.

Read [README_AR.md](README_AR.md) for migration, security, exchange rates, reports, and installation. Read [QA_REPORT.md](QA_REPORT.md) for verification and limits.

The assistant is a deterministic offline assistant, not a hosted general-purpose LLM. Rates are daily reference rates, not live trading prices. The local password gate does not encrypt the database. Never commit private JSON backups.

Development only: `npm install`, `npm test`, then `python3 tools/build.py` after changing sources.
