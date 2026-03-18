#!/usr/bin/env node
/**
 * add-book.js
 *
 * CLI helper to append a new book to data/books.json.
 *
 * Usage:
 *   node scripts/add-book.js --title "Deep Work" --author "Cal Newport" \
 *       --category productivity --source "recommendation"
 *
 *   npm run add-book -- --title "Deep Work" --author "Cal Newport" \
 *       --category productivity --source "recommendation"
 *
 * All flags:
 *   --title           (required)
 *   --author          (required)
 *   --category        (required)
 *   --source
 *   --whyInteresting
 *   --keyPromise
 *   --effortLevel     easy | medium | hard  (default: medium)
 *   --priority        low | maybe | high    (default: maybe)
 *   --status          not_started | reading | finished | dropped (default: not_started)
 *   --useCase
 *   --format          book | audiobook | pdf (default: book)
 *   --estimatedHours  number
 *   --notes
 *   --id              override the auto-generated slug
 *
 * Extension point: plug in an OCR / screenshot parser in front of this script
 * and call addBook() directly with the extracted fields.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BOOKS_PATH = path.join(__dirname, '..', 'data', 'books.json');

// ---------------------------------------------------------------------------
// Slug generator
// ---------------------------------------------------------------------------

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-');           // collapse repeated hyphens
}

// ---------------------------------------------------------------------------
// Parse CLI arguments  (minimal, no external deps)
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Core function — can be called programmatically by future import scripts
// ---------------------------------------------------------------------------

function addBook(fields) {
  if (!fields.title) throw new Error('--title is required');
  if (!fields.author) throw new Error('--author is required');
  if (!fields.category) throw new Error('--category is required');

  const books = JSON.parse(fs.readFileSync(BOOKS_PATH, 'utf8'));

  const id = fields.id || toSlug(fields.title);

  // Deduplication: warn if a book with the same id or same title+author already exists.
  const duplicate = books.find(
    (b) =>
      b.id === id ||
      (toSlug(b.title) === toSlug(fields.title) && toSlug(b.author) === toSlug(fields.author))
  );
  if (duplicate) {
    console.error(`⚠️  A book with id "${duplicate.id}" already exists: "${duplicate.title}" by ${duplicate.author}`);
    console.error('   Use --id to force a different id, or edit books.json directly.');
    process.exit(1);
  }

  const now = new Date().toISOString();

  const book = {
    id,
    title: fields.title,
    author: fields.author,
    category: fields.category,
    source: fields.source || '',
    whyInteresting: fields.whyInteresting || '',
    keyPromise: fields.keyPromise || '',
    effortLevel: fields.effortLevel || 'medium',
    priority: fields.priority || 'maybe',
    status: fields.status || 'not_started',
    useCase: fields.useCase || '',
    format: fields.format || 'book',
    estimatedHours: fields.estimatedHours != null ? Number(fields.estimatedHours) : null,
    rating: null,
    notes: fields.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  books.push(book);
  // Keep alphabetical order by title for readability.
  books.sort((a, b) => a.title.localeCompare(b.title));

  fs.writeFileSync(BOOKS_PATH, JSON.stringify(books, null, 2) + '\n', 'utf8');
  console.log(`✔ Added "${book.title}" (id: ${book.id}) to data/books.json`);
  console.log('  Run `npm run build:docs` to regenerate markdown.');

  return book;
}

// ---------------------------------------------------------------------------
// Main (CLI entry point)
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));

  if (!args.title || !args.author || !args.category) {
    console.error('Usage: node scripts/add-book.js --title "..." --author "..." --category "..." [options]');
    console.error('');
    console.error('Options: --source --whyInteresting --keyPromise --effortLevel --priority');
    console.error('         --status --useCase --format --estimatedHours --notes --id');
    process.exit(1);
  }

  addBook(args);
}

module.exports = { addBook, toSlug };
