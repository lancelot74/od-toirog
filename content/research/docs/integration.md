# Integration guide

## Files and authority

`data/catalog.json` is the complete generated collection. `data/catalog.jsonl` provides one record per line. Category-specific JSON files contain the same records, not extra entries. CSV cells containing lists or objects use JSON text. `data/sources.json` contains source metadata. `data/knowledge.sqlite` offers relational joins and full-text search.

The editable authoring modules generate these files through `python3 build.py`. Edit an authoring module, increment the version as appropriate, rebuild and inspect the changed records. Do not edit an export and assume rebuilding will preserve it.

Each entry has a stable `id`, `category`, `title`, `summary`, `traditions`, `evidence_status`, `source_refs`, `details`, `tags`, `product_use`, `locale`, and `version`. The category determines the structure of `details`; the common schema is in `data/entry.schema.json`. The source schema is in `data/source.schema.json`.

`product_use` distinguishes `educational`, `editorial`, and `review_required`. It is an editorial routing hint, not an assertion that anything is already published or professionally approved. All `mn-draft` records require native review. `source_refs.scope` is essential: sources often support only a historical note or observed motif, not the original application.

## Retrieval instead of opaque training

For a tarot request, retrieve exact card IDs and the selected spread. Add user-provided context only if needed. A language model may phrase a reading from those records, but card selection, version tracking and source routing should remain explicit application logic.

Example input:

```json
{
  "schema_version": "1.0",
  "mode": "daily_reflection",
  "deck_system": "rws",
  "spread_id": "spread-daily-lantern",
  "draw": [
    {"card_id": "tarot-ace-of-wands", "orientation": "upright", "position": 1},
    {"card_id": "tarot-ten-of-wands", "orientation": "upright", "position": 2},
    {"card_id": "tarot-temperance", "orientation": "upright", "position": 3}
  ],
  "context": {"user_supplied": "I have a new idea and a full task list."},
  "content_version": "1.0"
}
```

The example is synthetic. Do not embed real birth details or private journal entries in the shared research database. Store user records separately with the application's chosen access and retention rules.

Recommended response fields: `reading_id`, `draw`, `spread_id`, `content_version`, `summary`, `interpretation`, `reflection_question`, `practical_action`, and `source_ids`. If chart data is present, use a separate `astrology_context` object with calculation metadata. Missing time or unsupported features must remain explicit rather than being invented by the writing layer.

## A useful generation instruction

Use the selected records' original interpretations as editorial options. State a theme, connect it to a visible motif, relate it to the supplied question, and end with one practical prompt. Treat a reversal as the selected optional lens, not an automatic negative. Do not state hidden facts about people, guaranteed events, diagnoses or numerical probabilities that are absent from the supplied data. Keep historical notes separate from the user's reading. Do not invent a tradition or source for newly authored text.

## Database queries

```sql
-- Exact retrieval; bind a parameter in application code.
SELECT payload_json FROM entries WHERE id = ?;

-- Educational terms and their sources.
SELECT e.title, s.title AS source, s.url, c.scope
FROM entries e
JOIN citations c ON c.entry_id = e.id
JOIN sources s ON s.id = c.source_id
WHERE e.category = 'term'
ORDER BY e.title;

-- All tarot relationship interpretations.
SELECT id, title,
       json_extract(payload_json, '$.details.original_interpretation.relationship') AS reading
FROM entries
WHERE category = 'tarot';

-- Full text: MATCH queries are parameters, never interpolated SQL.
SELECT e.id, e.title, e.summary
FROM entries_fts f JOIN entries e ON e.id = f.id
WHERE entries_fts MATCH ?
ORDER BY bm25(entries_fts) LIMIT 20;
```

Run `python3 examples/search.py lantern`, `python3 examples/search.py --category tarot relationship`, or `python3 examples/search.py --category translation Сар --json` from the package folder. The search example quotes individual tokens rather than accepting raw FTS operators.

## Explicit conventions

- Canonical card identifiers are English-based and stable across localized display titles.
- Major Arcana numbers are 0–21 in RWS order. Minor `number` is a rank index: Ace=1, Two=2 through Ten=10, Page=11, Knight=12, Queen=13, King=14. This does not mean that a court card has that number printed on it.
- The astrology layer must have its own identifiers. This release intentionally supplies no authoritative tarot/planet correspondence table.
- `evidence_status` classifies the claim or content type. It is not a probability that a reading is true.
- Array order in a spread is position order. Card draws should reference both an ID and a position.
- Citation dates record when the web research was performed, not necessarily a page's publication date.
- `independent_work_id` groups multiple pages from one source work, preventing inflated source counts.

## Extending the collection

Add a source before adding a historical claim; record exactly what it supports. New original layouts or wording need no invented citation. If a term has competing definitions, add the relevant tradition to the record instead of overwriting the difference. For translations, preserve the English concept, candidate wording and review history. For a new deck, build a separate card set with explicit semantic mappings rather than translating titles and joining numbers.

Artwork is a separate asset project. This release includes no deck images and no assumption that a modern scan, recoloring or edition can be freely reused. Credit both visual and textual contributors when selecting art.
