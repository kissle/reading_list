# Screenshot Import — Future Codex Skill

Drop screenshot images into this directory. A future Codex skill will:

1. Read the image using OCR / vision.
2. Extract visible book titles and authors.
3. Append new books to `data/books.json` (skipping duplicates).
4. Regenerate markdown docs.

## File Naming

Use descriptive names so the source is traceable:

```
<YYYY-MM-DD>-<description>.<ext>
```

Examples:
- `2026-03-18-bookshelf-photo.jpg`
- `2026-03-20-twitter-recommendation.png`

## What Gets Added Automatically

Each extracted book that passes the confidence threshold (≥ 0.85) will be appended to
`data/books.json` with these defaults:

| Field | Default value |
| ----- | ------------- |
| source | `"screenshot-import"` |
| status | `"not_started"` |
| priority | `"maybe"` |
| effortLevel | `"medium"` |
| format | `"book"` |

You can always edit `data/books.json` afterwards to fill in more detail.

## Deduplication

A book is considered a duplicate if a book with the same normalised
`slug(title) + slug(author)` already exists in `books.json`.
The slug function lowercases, strips punctuation, and replaces spaces with hyphens.

## Low-Confidence Candidates

Books extracted with `confidence < 0.85` will be written to
`data/imports/pending-review.json` for manual review before merging.
