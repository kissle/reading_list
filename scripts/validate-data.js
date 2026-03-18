#!/usr/bin/env node
/**
 * validate-data.js
 *
 * Validates data/books.json and data/reading-list.json against their
 * respective JSON schemas using the Ajv library.
 *
 * Run:  node scripts/validate-data.js
 *       npm run validate
 *
 * Exit codes:
 *   0 — all data is valid
 *   1 — one or more validation errors found
 *
 * Extension point: add more data files / schemas to the FILES array below.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ROOT = path.join(__dirname, '..');

const FILES = [
  {
    dataPath: path.join(ROOT, 'data', 'books.json'),
    schemaPath: path.join(ROOT, 'schemas', 'book.schema.json'),
    isArray: true,           // books.json is an array of book objects
    label: 'books.json',
  },
  {
    dataPath: path.join(ROOT, 'data', 'reading-list.json'),
    schemaPath: path.join(ROOT, 'schemas', 'reading-list.schema.json'),
    isArray: false,
    label: 'reading-list.json',
  },
];

// ---------------------------------------------------------------------------
// Additional cross-file checks
// ---------------------------------------------------------------------------

/**
 * Verify that every bookId referenced in reading-list.json exists in books.json.
 */
function checkReadingListRefs(books, readingList) {
  const errors = [];
  const ids = new Set(books.map((b) => b.id));
  const sections = ['current', 'nextUp', 'parkingLot'];

  for (const section of sections) {
    for (const entry of readingList[section] || []) {
      if (!ids.has(entry.bookId)) {
        errors.push(`reading-list.json [${section}]: bookId "${entry.bookId}" not found in books.json`);
      }
    }
  }
  return errors;
}

/**
 * Check for duplicate ids in books.json.
 */
function checkDuplicateIds(books) {
  const errors = [];
  const seen = new Set();
  for (const book of books) {
    if (seen.has(book.id)) {
      errors.push(`books.json: duplicate id "${book.id}"`);
    }
    seen.add(book.id);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  let hasErrors = false;

  // Load all data files first (needed for cross-file checks).
  const loaded = {};
  for (const file of FILES) {
    try {
      loaded[file.label] = JSON.parse(fs.readFileSync(file.dataPath, 'utf8'));
    } catch (err) {
      console.error(`✖ Could not read ${file.label}: ${err.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) process.exit(1);

  // Schema validation.
  for (const file of FILES) {
    const schema = JSON.parse(fs.readFileSync(file.schemaPath, 'utf8'));
    const validate = ajv.compile(schema);
    const data = loaded[file.label];

    const itemsToValidate = file.isArray ? data : [data];
    let fileErrors = 0;

    for (let i = 0; i < itemsToValidate.length; i++) {
      const valid = validate(itemsToValidate[i]);
      if (!valid) {
        const prefix = file.isArray ? `${file.label}[${i}] (id: ${itemsToValidate[i].id})` : file.label;
        for (const err of validate.errors) {
          console.error(`✖ ${prefix} — ${err.instancePath} ${err.message}`);
          fileErrors++;
        }
      }
    }

    if (fileErrors === 0) {
      console.log(`✔ ${file.label} — schema valid`);
    } else {
      hasErrors = true;
    }
  }

  // Cross-file checks.
  const books = loaded['books.json'];
  const readingList = loaded['reading-list.json'];

  if (books && readingList) {
    const duplicateErrors = checkDuplicateIds(books);
    const refErrors = checkReadingListRefs(books, readingList);
    const crossErrors = [...duplicateErrors, ...refErrors];

    if (crossErrors.length === 0) {
      console.log('✔ Cross-file references valid');
    } else {
      for (const err of crossErrors) {
        console.error(`✖ ${err}`);
      }
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\nValidation failed. Fix the errors above before committing.');
    process.exit(1);
  } else {
    console.log('\nAll data is valid. ✅');
  }
}

main();
