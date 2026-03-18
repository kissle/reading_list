# Workflow

This document describes how to work with this repository — manually today, automatically tomorrow.

---

## Mental Model

```
Library (books.json)          →  everything collected
Reading List (reading-list.json) →  what you actually plan to read
docs/ (generated markdown)    →  human-readable views of the above
```

The JSON files are the **source of truth**. The markdown docs are always regenerated from them.

---

## Day-to-Day Tasks

### Add a book to the library

**Option A — CLI:**

```bash
npm run add-book -- \
  --title "Thinking, Fast and Slow" \
  --author "Daniel Kahneman" \
  --category psychology \
  --source "recommendation" \
  --priority high \
  --effortLevel hard
```

**Option B — Edit JSON directly:**

Open `data/books.json` and append a new entry following the schema in `schemas/book.schema.json`.
Use a kebab-case `id` derived from the title (e.g. `thinking-fast-and-slow`).

After either option, run:

```bash
npm run validate    # check the JSON is valid
npm run build:docs  # regenerate markdown
```

### Update the reading list

Edit `data/reading-list.json` directly.
- Move a `bookId` between `current`, `nextUp`, and `parkingLot` as needed.
- Reference only ids that exist in `books.json` (the validator checks this).

Then regenerate:

```bash
npm run validate && npm run build:docs
```

### Mark a book as finished

Update the `status` field in `data/books.json` to `"finished"` and add a `rating` (1–5).
Optionally set `notes` with key takeaways.

---

## Regenerating Docs

```bash
npm run build:docs
```

This rewrites:
- `docs/library.md`
- `docs/reading-list.md`
- `docs/categories.md`

Never edit the generated files by hand — your changes will be overwritten on the next run.

---

## Validating Data

```bash
npm run validate
```

This checks:
- Schema validity of every book in `books.json`
- Schema validity of `reading-list.json`
- That every `bookId` in `reading-list.json` resolves to a real book
- No duplicate ids in `books.json`

Run this before committing any data changes.

---

## Future: Screenshot Import (Codex Skill)

### Overview

The goal is to allow adding books from screenshots with minimal manual effort:

1. Drop a screenshot into `data/imports/screenshots/` (photo of a bookshelf, a tweet, a reading list image, etc.).
2. A Codex skill processes the image using OCR / vision.
3. It extracts book titles and authors with a confidence score.
4. It appends new entries to `data/books.json`, skipping duplicates.
5. It runs `npm run validate && npm run build:docs`.

### Import Contract

```
Input:
  image: <file path to PNG / JPG / HEIC / etc.>

Output:
  candidates: [
    { title: string, author: string, confidence: number (0–1) }
  ]

Deduplication:
  A book is considered a duplicate if a book with the same
  slug(title) + slug(author) already exists in books.json.
  (slug = lowercase, alphanumeric + hyphens only)

On conflict:
  Skip the candidate and log a warning.
  Do not overwrite existing entries.

Default field values for imported books:
  source: "screenshot-import"
  status: "not_started"
  priority: "maybe"
  effortLevel: "medium"
  format: "book"
```

### Extension Points in Current Scripts

- `scripts/add-book.js` exports `addBook(fields)` and `toSlug(str)`.
  A future import script can `require('./add-book')` and call `addBook()` directly.

- `scripts/validate-data.js` can be called as a child process or `require`d after import.

- `scripts/build-markdown.js` can similarly be called after a batch import to refresh docs.

### Confidence Threshold (suggestion)

Only auto-commit books where `confidence >= 0.85`.
Below that threshold, write candidates to a review file (e.g. `data/imports/pending-review.json`)
for manual inspection before merging into `books.json`.
