# 📚 Reading List

A personal book collection and reading list — markdown-first for human browsing, JSON-backed for automation.

---

## Purpose

This repository serves two related but distinct goals:

1. **Library** — A catalogue of books I've come across that might be worth reading one day.
2. **Reading List** — A curated, prioritised list of books I actually plan to read.

Not every book in the library belongs on the reading list. The library is the inbox; the reading list is the commitment.

---

## Repository Structure

```
.
├── README.md               ← you are here
├── data/
│   ├── books.json          ← source of truth for the full book collection
│   ├── reading-list.json   ← source of truth for the reading list (references bookIds)
│   └── imports/
│       └── screenshots/    ← drop screenshots here for future automated import
├── docs/
│   ├── library.md          ← generated: all books grouped by category
│   ├── reading-list.md     ← generated: current / next-up / parking-lot view
│   ├── categories.md       ← generated: category index
│   └── workflow.md         ← how this repo is used and extended
├── scripts/
│   ├── build-markdown.js   ← regenerates all docs/ markdown from JSON
│   ├── add-book.js         ← CLI helper to append a book to books.json
│   └── validate-data.js    ← validates JSON files against their schemas
├── schemas/
│   ├── book.schema.json    ← JSON Schema for a single book entry
│   └── reading-list.schema.json
├── CONTRIBUTING.md         ← conventions for manual data entry
├── package.json
└── .gitignore
```

---

## Data vs. Docs

| Layer | Path | Role |
| ----- | ---- | ---- |
| **Source of truth** | `data/*.json` | Edit these by hand or via scripts |
| **Human navigation** | `docs/*.md` | Auto-generated; never edit directly |

After changing any JSON file, regenerate the docs:

```bash
npm run build:docs
```

---

## Quick Start

```bash
npm install          # install dev dependencies (Ajv for validation)

# Add a new book
npm run add-book -- --title "Deep Work" --author "Cal Newport" --category productivity --source "recommendation"

# Validate all JSON data
npm run validate

# Regenerate markdown docs
npm run build:docs
```

---

## Browse the Collection

| What | Link |
| ---- | ---- |
| Full library by category | [docs/library.md](docs/library.md) |
| Active reading list | [docs/reading-list.md](docs/reading-list.md) |
| Category index | [docs/categories.md](docs/categories.md) |
| Workflow & conventions | [docs/workflow.md](docs/workflow.md) |

---

## Future: Screenshot Import (Codex Skill)

A planned Codex skill will allow adding books directly from screenshots (e.g. a photo of a bookshelf, a Twitter thread, a book recommendation image).

**Intended flow:**

1. Drop a screenshot into `data/imports/screenshots/`.
2. A Codex skill reads the image and extracts visible book titles and authors.
3. It appends candidate entries to `data/books.json`, skipping duplicates.
4. It runs `npm run build:docs` to regenerate markdown navigation.

**Import contract (future):**

- **Input:** image file (PNG, JPG, HEIC, etc.)
- **Output:** array of candidate books `{ title, author, confidence }`
- **Deduplication:** by normalised `title + author` slug (same logic as `add-book.js`)

See [docs/workflow.md](docs/workflow.md) for more detail on how this fits into the overall workflow.
