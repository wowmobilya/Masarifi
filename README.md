# Masarifi 5.0.1

Offline expense tracker in Arabic, Turkish, English, French and Kurmancî.

Upload these six files together to your GitHub Pages repository root:
`index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`.

The entry HTML embeds all scripts, styles and interface images. It starts even if a browser upload omits every folder. The other five files enable installation and offline caching. Start online once, wait for “Ready for offline use”, then install from the home card or browser menu.

`assets/`, `tools/` and `tests/` contain editable source and tests. Run `python3 tools/build.py` after changes and upload the six generated files together. No build or npm installation is needed to run the published app.

See README_AR.md for publishing instructions and QA_REPORT.md for test coverage and limitations.
