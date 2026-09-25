#!/usr/bin/env node
// Copies progress from a JSON export into the local SQLite database.
//   npm run import -- path/to/export.json
// The file holds { settings: { id: doc, … }, days: { … }, … }, the same shape GET /api/data returns.
// Documents with the same collection and id are replaced; everything else is kept.
"use strict";

const fs = require("node:fs");
const { openDb, COLLS } = require("./db");

const file = process.argv[2];
if (!file) { console.error("Usage: npm run import -- path/to/export.json"); process.exit(1); }

let data;
try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error(`Couldn't read ${file}: ${e.message}`); process.exit(1); }
const unknown = Object.keys(data).filter((c) => !COLLS.includes(c));
if (unknown.length) console.warn(`Skipping unknown collections: ${unknown.join(", ")}`);

const db = openDb();
const n = db.bulk(data);
db.close();
console.log(`Imported ${n} documents into ${db.file}`);
