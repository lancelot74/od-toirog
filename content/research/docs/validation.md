# Validation and editorial status

Validated 19 September 2026.

## Data checks — passed

- 518 unique entry IDs and 117 unique source IDs.
- Every citation resolves to a source record; all research-report links appear in that register.
- Exactly 78 RWS cards: Major Arcana 0–21, and four suits with 14 ranks each.
- All spread position sequences and declared card counts agree.
- All cards cited in worked examples resolve to actual card records.
- Every Mongolian draft is routed to `review_required`.
- SQLite integrity and foreign-key checks pass.
- Full-text retrieval works for English and Mongolian examples.
- JSON, JSONL, CSV and SQLite entry counts agree. Structured CSV fields reconstruct the original data.

The supplied JSON Schemas document the common structures. This run used explicit structural and relational assertions in the build script; it did not run a separate third-party JSON Schema validator.

## Browser checks — passed

The standalone HTML was exercised in Chromium 153 at desktop and mobile viewport sizes. Checks covered all-entry and tarot counts, modal details, source links, Escape dismissal, empty results, English search, Mongolian search, draft labels, source-mode filters, pagination and export of 25 filtered spread records. No JavaScript errors were observed.

Desktop and mobile screenshots were visually inspected. The mobile page and detail dialog showed no horizontal overflow. The file works locally without a server; following an external source link still requires internet access. Testing covered Chromium, not every browser or assistive-technology combination.

## Review boundaries

These checks establish data and interface consistency. They do not establish supernatural efficacy, predictive accuracy, scholarly completeness or professionally approved Mongolian translation. Source summaries and selected historical passages were reviewed during research; external links can change after the recorded access date.

The source register identifies secondary orientation articles, practitioner self-descriptions and historical primary texts. Treat a source's account of its own beliefs as such. Detailed living-tradition content, native localization and any future deck artwork should receive the relevant editorial review before publication.
