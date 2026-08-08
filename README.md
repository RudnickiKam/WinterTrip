# Winter Trip Planner

This is a static trip planning page for GitHub Pages.

## Files

- `index.html` — main page and UI
- `styles.css` — basic layout and responsive styling
- `script.js` — loads trip and destination data and renders the page
- `data/destinations.json` — destination records, accommodations, and cost data
- `data/trips.json` — trip definitions and selected destination IDs

## How to use

1. Open `index.html` in a browser.
2. If the page fails to load data locally, run a simple local server in the folder, for example:
   - `python -m http.server` (Python 3)
   - or use any static file server
3. Edit `data/destinations.json` to add or update resorts and accommodation options.
4. Edit `data/trips.json` to add new upcoming trips or change defaults.
5. Update styles in `styles.css` as needed.

## GitHub Pages

To publish:
1. Create a GitHub repository named `WinterTrip`
2. Commit these files to the repository root
3. In repository settings, enable GitHub Pages from the `main` branch root
4. The page will be available at `https://<username>.github.io/WinterTrip/`