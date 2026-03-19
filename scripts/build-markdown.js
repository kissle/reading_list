#!/usr/bin/env node
/**
 * build-markdown.js
 *
 * Reads data/books.json and data/reading-list.json and regenerates:
 *   docs/library.md
 *   docs/reading-list.md
 *   docs/categories.md
 *   docs/inventory.md
 *
 * Run:  node scripts/build-markdown.js
 *       npm run build:docs
 *
 * Extension point: to add new sections or change formatting, edit the
 * build* functions below. For future OCR imports, run this script after
 * appending new books to books.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BOOKS_PATH = path.join(ROOT, 'data', 'books.json');
const READING_LIST_PATH = path.join(ROOT, 'data', 'reading-list.json');
const INVENTORY_PATH = path.join(ROOT, 'data', 'inventory.json');
const DOCS_DIR = path.join(ROOT, 'docs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✔ wrote ${path.relative(ROOT, filePath)}`);
}

/** Convert a status string to a readable label. */
function statusLabel(status) {
  const map = {
    not_started: '📚 Not started',
    reading: '📖 Reading',
    finished: '✅ Finished',
    dropped: '🚫 Dropped',
  };
  return map[status] || status;
}

/** Convert a priority string to an emoji label. */
function priorityLabel(priority) {
  const map = { high: '🔴 High', maybe: '🟡 Maybe', low: '🟢 Low' };
  return map[priority] || priority;
}

/** Capitalize the first letter of a string. */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

// ---------------------------------------------------------------------------
// Build docs/library.md
// ---------------------------------------------------------------------------

function buildLibrary(books) {
  const grouped = {};
  for (const book of books) {
    const cat = capitalize(book.category || 'uncategorized');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(book);
  }

  const lines = [
    '# Library',
    '',
    '> Auto-generated from `data/books.json`. Edit the JSON file, then run `npm run build:docs`.',
    '',
    `**Total books:** ${books.length}`,
    '',
  ];

  for (const cat of Object.keys(grouped).sort()) {
    lines.push(`## ${cat}`, '');
    for (const book of grouped[cat]) {
      lines.push(`### ${book.title}`);
      lines.push('');
      lines.push(`| Field | Value |`);
      lines.push(`| ----- | ----- |`);
      lines.push(`| **Author** | ${book.author} |`);
      lines.push(`| **Priority** | ${priorityLabel(book.priority)} |`);
      lines.push(`| **Status** | ${statusLabel(book.status)} |`);
      if (book.effortLevel) lines.push(`| **Effort** | ${capitalize(book.effortLevel)} |`);
      if (book.estimatedHours != null) lines.push(`| **Est. hours** | ${book.estimatedHours} |`);
      if (book.format) lines.push(`| **Format** | ${capitalize(book.format)} |`);
      lines.push('');
      if (book.whyInteresting) lines.push(`> ${book.whyInteresting}`, '');
      if (book.notes) lines.push(`**Notes:** ${book.notes}`, '');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Build docs/reading-list.md
// ---------------------------------------------------------------------------

function buildReadingList(readingList, booksById) {
  function resolveEntry(entry) {
    const book = booksById[entry.bookId];
    if (!book) return `- ⚠️  Unknown bookId: \`${entry.bookId}\``;
    const note = entry.note ? ` — *${entry.note}*` : '';
    return `- **${book.title}** by ${book.author}${note}`;
  }

  const lines = [
    '# Reading List',
    '',
    '> Auto-generated from `data/reading-list.json`. Edit the JSON file, then run `npm run build:docs`.',
    '',
    '## 📖 Currently Reading',
    '',
  ];

  if (readingList.current.length === 0) {
    lines.push('*Nothing here yet.*', '');
  } else {
    for (const e of readingList.current) lines.push(resolveEntry(e));
    lines.push('');
  }

  lines.push('## 🔜 Next Up', '');
  if (readingList.nextUp.length === 0) {
    lines.push('*Nothing here yet.*', '');
  } else {
    for (const e of readingList.nextUp) lines.push(resolveEntry(e));
    lines.push('');
  }

  lines.push('## 🅿️ Parking Lot', '');
  if (readingList.parkingLot.length === 0) {
    lines.push('*Nothing here yet.*', '');
  } else {
    for (const e of readingList.parkingLot) lines.push(resolveEntry(e));
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Build docs/categories.md
// ---------------------------------------------------------------------------

function buildCategories(books) {
  const grouped = {};
  for (const book of books) {
    const cat = capitalize(book.category || 'uncategorized');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(book);
  }

  const lines = [
    '# Categories',
    '',
    '> Auto-generated from `data/books.json`. Edit the JSON file, then run `npm run build:docs`.',
    '',
  ];

  for (const cat of Object.keys(grouped).sort()) {
    lines.push(`## ${cat}`, '');
    for (const book of grouped[cat]) {
      lines.push(`- **${book.title}** — ${book.author} (${statusLabel(book.status)})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Build docs/inventory.md
// ---------------------------------------------------------------------------

function buildInventory(inventory, booksById) {
  const lines = [
    '# Inventory',
    '',
    '> Auto-generated from `data/inventory.json`. Edit the JSON file, then run `npm run build:docs`.',
    '',
    `**Total locations:** ${inventory.locations.length}`,
    `**Total inventory items:** ${inventory.items.length}`,
    '',
  ];

  const itemsByLocation = {};
  for (const location of inventory.locations) {
    itemsByLocation[location.id] = [];
  }

  for (const item of inventory.items) {
    if (!itemsByLocation[item.locationId]) itemsByLocation[item.locationId] = [];
    itemsByLocation[item.locationId].push(item);
  }

  for (const location of inventory.locations) {
    lines.push(`## ${location.label}`, '');
    lines.push(`Type: ${location.type}`, '');

    const items = (itemsByLocation[location.id] || []).sort((a, b) => {
      const titleA = booksById[a.bookId] ? booksById[a.bookId].title : a.bookId;
      const titleB = booksById[b.bookId] ? booksById[b.bookId].title : b.bookId;
      return titleA.localeCompare(titleB);
    });

    if (items.length === 0) {
      lines.push('*No items recorded.*', '');
      continue;
    }

    for (const item of items) {
      const book = booksById[item.bookId];
      if (!book) {
        lines.push(`- ⚠️ Unknown bookId: \`${item.bookId}\``);
        continue;
      }

      const itemNote = item.note ? ` — ${item.note}` : '';
      lines.push(`- **${book.title}** by ${book.author}${itemNote}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Building markdown docs…');

  const books = loadJSON(BOOKS_PATH);
  const readingList = loadJSON(READING_LIST_PATH);
  const inventory = loadJSON(INVENTORY_PATH);

  const booksById = {};
  for (const book of books) booksById[book.id] = book;

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

  write(path.join(DOCS_DIR, 'library.md'), buildLibrary(books));
  write(path.join(DOCS_DIR, 'reading-list.md'), buildReadingList(readingList, booksById));
  write(path.join(DOCS_DIR, 'categories.md'), buildCategories(books));
  write(path.join(DOCS_DIR, 'inventory.md'), buildInventory(inventory, booksById));

  console.log('Done.');
}

main();
