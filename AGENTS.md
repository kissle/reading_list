# Repository Guidelines

## Project Structure & Module Organization

This repository is data-first. `data/books.json` is the source of truth for the library, and `data/reading-list.json` stores curated reading priorities by `bookId`. Generated Markdown lives in `docs/` and should not be edited by hand. Utility scripts are in `scripts/`, and JSON schemas live in `schemas/`. Repo-local Codex skills live under `skills/`.

## Build, Test, and Development Commands

- `npm install`: install Node 18+ dependencies.
- `npm run validate`: validate `data/books.json` and `data/reading-list.json` against the schemas and cross-file references.
- `npm run build:docs`: regenerate `docs/library.md`, `docs/reading-list.md`, and `docs/categories.md`.
- `npm run add-book -- --title "Deep Work" --author "Cal Newport" --category productivity`: append a new book via the CLI helper.

Run `npm run validate` and `npm run build:docs` after any JSON change.

## Coding Style & Naming Conventions

Use plain JavaScript with CommonJS in `scripts/` and 2-space indentation. Prefer small, single-purpose functions and keep dependencies minimal. Book ids must be lowercase kebab-case, for example `the-art-of-thinking-clearly`. Category names should stay lowercase and consistent, such as `marketing` or `psychology`. Preserve existing JSON formatting: 2-space indentation and a trailing newline.

## Testing Guidelines

There is no separate unit test suite yet. The required verification path is:

1. `npm run validate`
2. `npm run build:docs`

Treat schema validation as the baseline quality gate. If you add logic to `scripts/`, include a manual verification note in your change or add tests if the behavior becomes non-trivial.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit messages such as `create skill` and `Build initial reading list repository structure`. Follow that pattern: concise, specific, and action-oriented.

For pull requests, include:

- a short summary of what changed
- whether `data/` or generated `docs/` changed
- confirmation that `npm run validate` and `npm run build:docs` passed
- screenshots only when the change affects screenshot-ingest workflows or generated docs presentation

## Contributor Notes

Do not manually edit generated files in `docs/`. Never change an existing book `id` if it may already be referenced from `data/reading-list.json`.
