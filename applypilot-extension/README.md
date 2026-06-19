# ApplyPilot Extension MVP

ApplyPilot is a personal job-search organizer. The Chrome extension turns job-related posts that are currently visible in your active LinkedIn tab into structured leads, scores them for relevance, stores them locally, and exports them as CSV.

This MVP has no hosted backend and no build step. It uses plain JavaScript, Manifest V3, and Chrome local storage.

## Setup

1. Clone or download this project folder.
2. Open Chrome.
3. Go to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the `applypilot-extension` folder.
7. Open LinkedIn and sign in normally.
8. Search for posts such as `"Data Engineer" AND "hiring" AND "Gurgaon"`.
9. Filter posts by the past 24 hours or latest results if LinkedIn provides that filter.
10. Click the ApplyPilot extension icon.
11. Click **Extract Visible Leads**.
12. Review the lead preview and click **Download CSV**.

If the LinkedIn tab was already open when the extension was installed or reloaded, refresh that tab once before extracting.

## Compliance and privacy

- ApplyPilot never asks for or stores LinkedIn credentials.
- It does not bypass login, captchas, rate limits, or security controls.
- It processes only content rendered and visible to the logged-in user in the active browser tab.
- Extraction starts only after the user clicks **Extract Visible Leads**.
- It does not crawl LinkedIn in the background or navigate pages automatically.
- It is intended for personal job-search organization, not scraping, outreach automation, or spam.
- Leads remain in `chrome.storage.local` unless the user clears the extension's data.

Users are responsible for following LinkedIn's terms and applicable privacy laws when using or exporting information.

## How it works

- `content.js` inspects visible, rendered candidate cards only after a popup request.
- `parser.js` extracts job fields with conservative regex and keyword heuristics.
- `scorer.js` applies the MVP Data Engineering relevance score.
- `storage.js` deduplicates and persists leads in Chrome local storage.
- `csv_exporter.js` creates a local CSV download without a server.
- `popup.js` coordinates extraction and renders the preview.

## Testing checklist

1. Load the extension successfully from `chrome://extensions` with no manifest errors.
2. Open a LinkedIn search results or feed page containing visible job-related posts.
3. Click **Extract Visible Leads** and confirm the counters update.
4. Confirm the preview table shows parsed fields for saved leads.
5. Click **Extract Visible Leads** again and confirm repeated leads are counted as duplicates rather than stored again.
6. Click **Download CSV**, open the downloaded file, and confirm all columns and multiline message drafts are valid.
7. Click **Clear Stored Leads** and confirm the table and stored count reset.
8. Open a non-LinkedIn tab and confirm the popup displays **Please open LinkedIn first**.
9. Reload the extension while LinkedIn remains open, then extract before refreshing LinkedIn and confirm the popup displays **Refresh LinkedIn and try again**.
10. Open a LinkedIn page without matching visible posts and confirm the popup displays **No visible job posts found**.

## Limitations

- LinkedIn changes its DOM frequently, so selectors may require maintenance.
- Only cards intersecting the current viewport are considered visible. Scroll manually and extract again to organize more posts.
- Parsing is heuristic. Ambiguous company names, dates, or titles are intentionally left blank instead of guessed.
- The MVP does not sync across browsers, enrich profiles, send messages, or change lead status in the UI.
- The first 50 stored leads are shown in the popup; CSV export includes all stored leads.

## Future SaaS backend plan

The modules are separated so local persistence can later be replaced or supplemented by a FastAPI API. A future version can add explicit user authentication, encrypted server-side lead storage, status workflows, saved searches, analytics, and opt-in cross-device sync. The browser extension should continue to collect only user-visible content after an explicit click; the backend should receive only leads the user chooses to save or sync.
