# Changelog

All notable changes to Watson. One entry per public build.

## 1.6.0 — 1 November 2026

A stability release. The search flow is untouched; this build fixes the crashes and the rough edges reported since 1.5.0.

### Fixes

- The first search after boot no longer freezes for a few seconds while sources warm up.
- Sources that answer with an empty page are skipped instead of stalling the run.
- The window remembers its size between runs again.
- History entries keep their order after a restart.

### Design

- The status line clears once a search finishes, instead of keeping the last count.
- Sharper icons on high-DPI screens.

## 1.5.0 — 1 November 2026

A start-up release. The search flow is unchanged; the Windows build is the part that moved.

### Fixes

- The app installs once to `%LOCALAPPDATA%\Programs\Watson` instead of unpacking into a fresh temp folder on every run.
- Long handles no longer push the status line off its row in the result list.
- The identity score no longer counts accounts whose only match is a shared avatar.

### Design

- Query field, result list and footer share one grid.
- The status line reports how many sources answered and the identity score, instead of a spinner that stayed on screen.
- The last search is kept between runs.

## 1.4.0 — 29 October 2026

A cleanup release. Nothing about the search flow changed; what changed is everything around it.

### Fixes

- Results no longer collapse to a single row when two profiles share an avatar URL.
- Fixed the History list losing the newest search after a restart.
- Long nicknames no longer push the "Same person" badge out of the row.
- The progress bar no longer sticks at 98% when one source times out.
- Corrected the empty-state wording when a domain has no WHOIS records.
- Dismissing the Windows warning no longer leaves the app behind a blank window.

### Design

- New app icon and favicon set: the lens mark now reads clearly at 16 px.
- Search field is taller, with a calmer focus ring and a real clear button.
- Result cards use one consistent corner radius and spacing scale.
- Slightly warmer text colour in dark mode; contrast passes AA everywhere.
- Softer panel borders and shadows, no visible seams on light displays.
- Download page: version label under the button, cleaner footer.

### New tools

- **Subfinder** — passive subdomain enumeration.
- **crt.sh** — Certificate Transparency log search.
- **GLEIF** — legal entity identifiers and ownership chains.
- **Wayback Machine** — historical snapshots of any public URL.
- **GitHub Code Search** (beta) — leaked references in public repositories.

### Under the hood

- Sources screen reports per-tool status; failed lookups are retried once.
- Search history and cases are stored in one local file instead of two.
- Smaller portable build.
