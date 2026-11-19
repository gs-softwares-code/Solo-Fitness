# SOLO Fitness

**SOLO** is a browser-based fitness dashboard for recording activities and reviewing training progress. It is a static web app, with its main application in `indexx.html` and a lightweight PWA shell in `index.html`.

## Features

- Dashboard with daily stats, activity history, and streak tracking
- Activity recording interface for running, walking, cycling, hiking, gym sessions, and custom activities
- Progress charts, activity heatmap, personal records, and goal tracking
- Activity details with route visualization and workout metrics
- Profile and preferences, including dark and light themes
- Responsive layout with mobile navigation and device safe-area support
- Installable progressive web app shell and a service worker for cached app loading
- Keyboard-accessible command palette and a PIN-style lock screen
- Audit/compliance-oriented interface elements

> The interface includes enterprise, privacy, and compliance language. Review the implementation and your deployment environment before treating those labels as security guarantees or storing sensitive information.

## Run locally

Serve the repository over HTTP (service workers do not work from a `file://` URL):

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000/>. The app does not require a build step or package installation.

## Install as a PWA

Deploy the repository to a web host that serves static files over HTTPS (localhost is also suitable for testing). Open the site in a supported browser and use its **Install app** or **Add to Home Screen** option. The app shell, manifest, SVG icon, and main page are cached for repeat and offline loading after the first successful visit.

The PWA uses `index.html` as its installable entry point and loads the main application from `indexx.html`. Keep both files and the `manifest.webmanifest`, `sw.js`, and `icons/` directory together at the same site path. On GitHub Pages, the default root page is `index.html`.

## Mobile

The app shell uses the dynamic viewport height (`100dvh`), `viewport-fit=cover`, and a full-screen layout to fit the phone display. The embedded application already includes responsive breakpoints and a mobile bottom navigation. For best results, test on current iOS Safari and Android Chrome, including portrait and landscape layouts and safe-area edges.

## Technology

- HTML
- CSS embedded in the application page
- Browser-side JavaScript embedded in the application page
- Web App Manifest and Service Worker (no framework or build pipeline)

## Notes

- Service workers and installation require HTTPS, except for local development on `localhost`.
- Offline support caches the static app shell; features that require device sensors or browser permissions may still depend on the browser and device.
- Before deployment, verify data persistence, network requests, and security behavior against your requirements.
- No license file is currently included. Unless a license is added, standard copyright applies and reuse is not automatically granted.
