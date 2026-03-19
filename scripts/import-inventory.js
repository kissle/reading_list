#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BOOKS_PATH = path.join(ROOT, 'data', 'books.json');
const INVENTORY_PATH = path.join(ROOT, 'data', 'inventory.json');
const CSV_PATH = path.join(ROOT, 'Books.csv');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function normalize(value) {
  return slugify(value).replace(/-/g, ' ');
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = [];

  for (const line of lines.slice(2)) {
    const cols = line.split(';');
    const title = (cols[1] || '').trim();
    if (!title) continue;

    rows.push({
      sourceId: (cols[0] || '').trim() || null,
      title,
      subtitle: (cols[2] || '').trim(),
      author: (cols[3] || '').trim(),
      publisher: (cols[4] || '').trim(),
      storingLocation: (cols[5] || '').trim(),
      comment: (cols[6] || '').trim(),
    });
  }

  return rows;
}

function canonicalizeLocationLabel(label) {
  const trimmed = String(label || '').trim();
  const ikeaMatch = trimmed.match(/^ikea\s*#\s*(\d+)(.*)$/i);

  if (ikeaMatch) {
    const suffix = (ikeaMatch[2] || '').trim();
    return `IKEA #${ikeaMatch[1]}${suffix ? ` ${suffix}` : ''}`;
  }

  return trimmed;
}

function inferLocationType(label) {
  if (/box/i.test(label)) return 'box';
  if (/weinkiste/i.test(label)) return 'crate';
  if (/ikea/i.test(label)) return 'shelf';
  return 'other';
}

function fullTitle(row) {
  return row.subtitle ? `${row.title}: ${row.subtitle}` : row.title;
}

function buildImportNote(row) {
  const parts = [];
  if (row.publisher) parts.push(`Publisher: ${row.publisher}`);
  if (row.comment) parts.push(`Comment: ${row.comment}`);
  return parts.join(' | ');
}

function makeUniqueSlug(base, usedIds, fallback) {
  let candidate = slugify(base) || fallback;
  let counter = 2;
  while (usedIds.has(candidate)) {
    candidate = `${slugify(base) || fallback}-${counter}`;
    counter += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function makeBookLookup(books) {
  const byTitleAuthor = new Map();
  const byBaseTitleAuthor = new Map();

  for (const book of books) {
    const authorKey = normalize(book.author);
    byTitleAuthor.set(`${normalize(book.title)}|${authorKey}`, book);
    byBaseTitleAuthor.set(`${normalize(book.title.split(':')[0])}|${authorKey}`, book);
  }

  return { byTitleAuthor, byBaseTitleAuthor };
}

function main() {
  const books = readJSON(BOOKS_PATH);
  const importedRows = parseCsv(CSV_PATH);
  const timestamp = new Date().toISOString();
  const usedBookIds = new Set(books.map((book) => book.id));
  const { byTitleAuthor, byBaseTitleAuthor } = makeBookLookup(books);

  const locations = [];
  const locationIds = new Set();
  const locationIdByLabel = new Map();

  for (const row of importedRows) {
    const label = canonicalizeLocationLabel(row.storingLocation || 'Unknown location');
    if (locationIdByLabel.has(label)) continue;

    const locationId = makeUniqueSlug(label, locationIds, 'location');
    locationIdByLabel.set(label, locationId);
    locations.push({
      id: locationId,
      label,
      type: inferLocationType(label),
    });
  }

  const importedBooks = [];
  const bookIdByRowKey = new Map();
  const itemIds = new Set();
  const items = [];

  for (const row of importedRows) {
    const rowKey = `${normalize(fullTitle(row))}|${normalize(row.author)}`;
    let bookId = bookIdByRowKey.get(rowKey);

    if (!bookId) {
      const exactMatch = byTitleAuthor.get(`${normalize(fullTitle(row))}|${normalize(row.author)}`);
      const baseMatch = byBaseTitleAuthor.get(`${normalize(row.title)}|${normalize(row.author)}`);
      const matchedBook = exactMatch || baseMatch || null;

      if (matchedBook) {
        bookId = matchedBook.id;
      } else {
        const displayTitle = fullTitle(row);
        const baseId = slugify(displayTitle) || slugify(row.title) || 'book';
        bookId = makeUniqueSlug(baseId, usedBookIds, 'book');

        importedBooks.push({
          id: bookId,
          title: displayTitle,
          author: row.author || 'Unknown',
          category: 'uncategorized',
          source: 'inventory-import',
          priority: 'low',
          status: 'not_started',
          format: 'book',
          estimatedHours: null,
          rating: null,
          notes: buildImportNote(row),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      bookIdByRowKey.set(rowKey, bookId);
    }

    const locationLabel = canonicalizeLocationLabel(row.storingLocation || 'Unknown location');
    const locationId = locationIdByLabel.get(locationLabel);
    const itemBase = row.sourceId ? `item-${row.sourceId}` : `item-${bookId}`;
    const itemId = makeUniqueSlug(itemBase, itemIds, 'item');
    const item = {
      id: itemId,
      bookId,
      locationId,
    };

    if (row.sourceId) item.sourceId = row.sourceId;
    else item.sourceId = null;

    if (row.comment) item.note = row.comment;

    items.push(item);
  }

  writeJSON(BOOKS_PATH, books.concat(importedBooks));
  writeJSON(INVENTORY_PATH, {
    locations,
    items,
  });

  console.log(`Imported ${importedRows.length} inventory rows.`);
  console.log(`Added ${importedBooks.length} new books.`);
  console.log(`Recorded ${locations.length} locations.`);
}

main();
