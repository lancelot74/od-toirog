# Od Toirog — Esoteric Research Library

Version 1.0 · 19 September 2026 · **518 entries**

Open **od-toirog-archive.html** in a browser for offline search, filters, entry details and source links. No server or API key is required. The source links themselves require an internet connection.

Start with **docs/research-report.md** for findings, voice direction and the proposed reading workflow. **docs/integration.md** explains the schema and import options.

## Contents

| Collection | Records |
|---|---:|
| Complete RWS tarot card records | 78 |
| Researched terms | 118 |
| Tradition profiles | 24 |
| Symbol and design notes | 40 |
| Taboos, customs and claim checks | 28 |
| Atmospheric words with original examples | 96 |
| Original copy snippets | 48 |
| Reading layouts | 25 |
| Reading and integration methods | 18 |
| Complete sample readings | 6 |
| Mongolian translation candidates | 37 |

The reference register contains **117 linked pages grouped into 33 works or reference articles**. Multiple Waite chapters are one work. These counts do not imply that all books were read in full or that every page is an independent authority.

## Importable formats

- `data/catalog.json` — all records as an array.
- `data/catalog.jsonl` — one complete record per line.
- `data/catalog.csv` — spreadsheet-friendly export; structured cells contain JSON.
- `data/knowledge.sqlite` — entries, sources, citations, tags and full-text search.
- `data/sources.json` and `data/sources.csv` — attribution and review scopes.
- Category-specific JSON files — convenient subsets of the same records.
- `data/entry.schema.json`, `data/source.schema.json`, `data/metadata.json`, `data/validation.json` — structure, counts and checks.

## Use and scope

The first edition emphasizes Western esotericism and RWS tarot. It also includes limited comparative context and a specifically sourced Mongolian sacred-landscape reference. It is not an exhaustive global encyclopedia.

Historical descriptions and beliefs are separated from original editorial interpretations. Source links support only the scope stated in each citation. Original spreads, copy and reading examples were newly authored for this collection. The 37 Mongolian entries are drafts requiring native review.

No source books, modern deck artwork or user birth records are included. External sources and any artwork selected later have their own terms. This is a research and writing database, not a trained model, an ephemeris or a validated prediction system.

## Rebuild and search

Requires Python 3.9+ with SQLite FTS5 enabled; no third-party Python packages.

```bash
python3 build.py
python3 examples/search.py lantern
python3 examples/search.py --category tarot relationship
python3 examples/search.py --category translation Сар --json
```

The authoring modules under `authoring/` are the editable inputs. Rebuilding overwrites generated exports. The browser is generated from the same catalog to prevent content drift.

Validation covers record uniqueness, citation integrity, 78-card coverage, suit and rank coverage, spread positions, example references, SQLite integrity and multilingual full-text retrieval. See `docs/validation.md` for browser checks and the remaining review boundaries.
