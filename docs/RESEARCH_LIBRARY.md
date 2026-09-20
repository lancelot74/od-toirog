# Research library: organization and integration

## Read before implementation

Source: `od-toirog-research-library-v1.zip`, containing `od-toirog-esoteric-library/`.
Reviewed the README, research report, integration guide, schemas, validation notes, and all content-authoring modules (tarot, lexicon, context, voice, readings, Mongolian candidates and sources) before designing pages. The canonical catalogue contains **518 records**; category exports, JSONL, CSV and SQLite are alternate formats, not additional records.

## Information architecture

| Main section | Collections | Records |
|---|---|---:|
| Таро / Tarot | Complete RWS deck | 78 |
| Нэр томьёо ба уламжлал / Knowledge | Terms, tradition profiles | 142 |
| Бэлгэдэл ба соёлын хүрээ / Symbols and context | Symbols, customs and claim checks | 68 |
| Тайлах арга ба жишээ / Reading practice | Spreads, methods, worked examples | 49 |
| Найруулга ба үгийн сан / Editorial voice | Vocabulary, original copy | 144 |
| Монгол нэршлийн ноорог / Localization | Mongolian translation candidates | 37 |

Total: **518**, with every original category mapped exactly once. A separate bibliography contains **117 source pages grouped into 33 works**, not 117 independent authorities.

Routes:

- `/library/`: six-section overview and reading paths.
- `/library/[section]/`: section introductions, collections and entry lists.
- `/library/collections/[category]/`: all records in one of the eleven original collections.
- `/library/entries/[id]/`: a dedicated page for every record, with complete details and source scopes.
- `/library/sources/` and `/library/sources/[id]/`: grouped bibliography and individual source pages with reverse citations.
- `/library/search/`: full-text search, collection/language/content-type filters and pagination.
- `/library/about/`: original research report and import provenance; supporting documentation is available separately.

Mongolian navigation and field labels surround the unmodified source-language text. The 37 `mn-draft` records remain visibly marked as drafts. Historical notes, original interpretations, beliefs and source limitations retain their distinct labels. This is a reference-library integration, not automatic approval of these records in the personalized interpretation engine.

## Fidelity

Import verifies all archive manifest checksums, duplicate-format consistency, IDs, citations, deck coverage, spread positions, examples and draft routing. Canonical catalogue/source JSON is stored under `content/research/`; the original ZIP is downloadable for its authoring inputs, alternate data formats, SQLite database and standalone browser.

Article pages render structured values as escaped text and internal links, not executable HTML. Every detail field is included. Tarot motifs retain Waite/Smith attribution; no deck artwork was supplied. Example cards and spread references link to their exact records. Source pages preserve author, URL, source kind, review status, support scope, limitations, work grouping and research date.

External source availability and the archive's scholarly claims are not newly certified by an import checksum. The original review dates and statuses remain visible.

## Verification

- All 40 archive-manifest files verified; alternate catalogue formats agree.
- `pnpm check:library` checks visible exported text (excluding scripts), every detail section, citations, IDs, downloadable archive hash, source records, search-index coverage, and all local links.
- Export verified: **518 complete entry pages, 117 complete source pages, 659 library routes and 17,047 internal links**.
- Browser suite: **31 passed**, including six library scenarios covering the 78-card groups, full-text and Mongolian search, filter/pagination persistence, exact card/spread links, grouped source references, JSON download, draft labels, mobile layouts, full research report, and retry after an index fetch failure.
- Production build, lint and TypeScript checks pass. Library pages are statically exported and work on GitHub Pages without a new database or API key.
