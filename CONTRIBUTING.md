# Contributing

Guidelines for manually adding and maintaining books in this repository.

---

## Adding a Book

### Via CLI (recommended)

```bash
npm run add-book -- --title "Book Title" --author "Author Name" --category <category> [options]
```

The script generates a kebab-case `id` from the title, checks for duplicates, and appends the entry to `data/books.json`.

### Directly in JSON

Add a new object to `data/books.json` following the schema below.

**Always run validate + build after editing JSON:**

```bash
npm run validate && npm run build:docs
```

---

## Field Conventions

| Field | Required | Convention |
| ----- | -------- | ---------- |
| `id` | Yes | kebab-case title slug, e.g. `managing-oneself` — must be unique |
| `title` | Yes | Exact title as on the cover |
| `author` | Yes | `First Last` or `First Last, First Last` for multiple authors |
| `category` | Yes | Single lowercase word or short phrase, e.g. `productivity`, `marketing` |
| `source` | No | Where you heard about the book, e.g. `"recommendation"`, `"blog post"` |
| `whyInteresting` | No | One sentence: why does this book catch your attention? |
| `keyPromise` | No | One sentence: what does the book promise to deliver? |
| `effortLevel` | No | `"easy"` / `"medium"` / `"hard"` (default: `"medium"`) |
| `priority` | No | `"low"` / `"maybe"` / `"high"` (default: `"maybe"`) |
| `status` | No | `"not_started"` / `"reading"` / `"finished"` / `"dropped"` |
| `useCase` | No | Comma-separated, e.g. `"negotiation, sales"` |
| `format` | No | `"book"` / `"audiobook"` / `"pdf"` |
| `estimatedHours` | No | Rough number, or `null` |
| `rating` | No | Integer 1–5, or `null` if not yet read |
| `notes` | No | Free-form notes, highlights, takeaways |
| `createdAt` | Yes (auto) | ISO 8601 timestamp, set automatically by `add-book.js` |
| `updatedAt` | Yes (auto) | ISO 8601 timestamp, update when you edit the entry |

---

## ID Rules

- Use the kebab-case title slug: `"The Art of Thinking Clearly"` → `the-art-of-thinking-clearly`
- Strip punctuation and special characters
- Keep it unique across all entries
- Do not change an id after it has been added to `reading-list.json`

---

## Categories

Use consistent lowercase category names. Current categories in use:

- `marketing`
- `productivity`
- `psychology`
- `thinking`

Add new categories as needed — no registration required, just be consistent.

---

## Reading List

Edit `data/reading-list.json` directly to move books between:

- `current` — actively reading now
- `nextUp` — planned next reads (in rough order)
- `parkingLot` — on the radar but not yet scheduled

Each entry only needs a `bookId` (the id from `books.json`) and an optional `note`.

---

## Commit Checklist

Before committing any changes:

- [ ] `npm run validate` passes with no errors
- [ ] `npm run build:docs` has been run
- [ ] Generated files in `docs/` are included in the commit
- [ ] No manually edited files in `docs/` (always regenerate, never hand-edit)
