---
name: book-screenshot-library-intake
description: Process one or more screenshots for a personal book library repo by detecting books, extracting reliable metadata, checking data/books.json for duplicates, adding only clearly new books, validating data, and rebuilding markdown docs. Use when the user wants to save books from screenshots, book-cover images, carousels, or social posts into this repository.
---

# Book screenshot library intake

Use this skill when the user provides screenshots and wants book entries added to this repository.

## Scope

- Treat `data/books.json` as the source of truth for the library.
- Treat `data/reading-list.json` as separate. Do not add books there unless the user explicitly asks.
- Treat `docs/library.md`, `docs/reading-list.md`, and `docs/categories.md` as generated outputs.
- After any `books.json` change, run:
  - `node scripts/validate-data.js`
  - `node scripts/build-markdown.js`

## When to use

- The user shares one or more screenshots and wants books captured.
- The screenshots may be book covers, social media recommendation carousels, shelf photos, or mixed-content posts.
- The task is to detect books, avoid duplicates, and update the repo carefully.

## Be conservative

- Do not invent books.
- Do not over-guess title or author text from partial images.
- If a screenshot is ambiguous, say exactly what is unclear.
- If confidence is low, do not add the item automatically. Report it as `needs review`.

## Image handling

- Inspect every screenshot before touching data.
- If the screenshot is attached in the thread, inspect it directly.
- If the user provides a local image path, use the image-view tool.
- A screenshot may contain zero, one, or many books.
- A screenshot may also contain non-book content such as quote cards, course pages, articles, or unrelated images. Only treat items as books when the evidence is strong enough.

## Detection workflow

### Step 1: Inspect screenshots

For each screenshot, determine:

- whether a book is present
- how many likely books are visible
- your confidence level
- any OCR ambiguity that matters

### Step 2: Build candidate list

For each identifiable book candidate, capture:

- `title`
- `author`
- `confidence`
- `sourceScreenshot`
- `notes`

Only include `title` or `author` when supported by the image. If author is missing or unclear, say so.

### Step 3: Compare against existing books

Open `data/books.json` and compare each candidate against the current library.

Use conservative deduplication:

- exact title + author match: duplicate
- normalized comparison: lowercase, trimmed, collapse punctuation and repeated whitespace
- small punctuation differences may still be the same book
- author name variants like `Peter F. Drucker` vs `Peter Drucker` may be probable matches

If the match is very clear, skip it as a duplicate.

If the match is only probable, do not add automatically. Report it as `possible duplicate`.

## Repository-specific data rules

The current repo schema requires:

- `category` as a string
- `createdAt` and `updatedAt` as ISO 8601 date-time strings, not plain dates

When adding a new book and the user does not provide more metadata, use:

- `source`: `screenshot`
- `category`: prefer an existing repo category if confidently inferable; otherwise use `uncategorized`
- `whyInteresting`: `""`
- `keyPromise`: `""`
- `effortLevel`: `medium`
- `priority`: `maybe`
- `status`: `not_started`
- `useCase`: `""`
- `format`: `book`
- `estimatedHours`: `null`
- `rating`: `null`
- `notes`: `""`
- `createdAt`: current timestamp in ISO 8601 UTC form
- `updatedAt`: current timestamp in ISO 8601 UTC form

Do not fabricate summaries, promises, use cases, or reading estimates from a screenshot alone.

## Category guidance

- Prefer existing repo-style categories such as `marketing`, `productivity`, `psychology`, `thinking`.
- If the screenshot or user context does not justify a category and asking would slow down a straightforward import, use `uncategorized`.
- If several books are found and category would materially improve the library, ask one grouped follow-up question.

## ID generation

Generate a stable slug id:

- lowercase
- kebab-case
- based mainly on title
- append a short author slug only if needed to avoid collisions

Examples:

- `building-a-storybrand`
- `managing-oneself`
- `yes-cialdini`

Before writing, confirm the id is not already present in `data/books.json`.

## When to ask follow-up questions

Only ask when the answer improves the collection materially or resolves ambiguity.

Good grouped questions:

- whether any new books should also go into `data/reading-list.json`
- short reasons for collecting them
- category or use case for several books at once
- confirmation of a low-confidence title or author

If the screenshot clearly identifies the book and the extra fields are optional, proceed with defaults.

If the user does not answer optional metadata questions, continue with defaults.

## Writing rules

- Add only clearly new books to `data/books.json`.
- Do not overwrite existing user-entered fields for current books.
- Do not remove books.
- Keep JSON formatting consistent with the existing file.
- Do not edit `data/reading-list.json` unless explicitly requested.

## Validation and rebuild

After editing `data/books.json`:

1. Run `node scripts/validate-data.js`
2. Run `node scripts/build-markdown.js`
3. If validation fails, fix the data before finishing

## Response format

Always return a compact summary with:

- screenshots processed
- books detected
- added
- skipped as duplicates
- possible duplicates
- needs review

Then list the affected titles in short form.

Example:

- Screenshots processed: 4
- Books detected: 5
- Added: 3
- Skipped as duplicates: 1
- Possible duplicates: 0
- Needs review: 1

Added:

- Building a StoryBrand - Donald Miller
- Managing Oneself - Peter F. Drucker
- The Art of Thinking Clearly - Rolf Dobelli

Skipped:

- Pre-Suasion - duplicate already in repository

Needs review:

- Yes! - author list partially unclear in screenshot
