#!/usr/bin/env node
// Copies progress from a backup or an export into the local SQLite database.
//   npm run import -- path/to/backup.json             → adds and updates, keeps everything else
//   npm run import -- --replace path/to/backup.json   → replaces everything, as the site's import does
// The file is a backup from Progrès → Sauvegarde ({ app: "reussir-tcf", data: { settings: { id: doc, … }, … } }),
// or the bare { settings: { id: doc, … }, days: { … }, … } that GET /api/data returns.
"use strict";

const fs = require("node:fs");
const { openDb, COLLS } = require("./db");

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("Usage: npm run import -- [--replace] path/to/backup.json"); process.exit(1); }

let data;
try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error(`Couldn't read ${file}: ${e.message}`); process.exit(1); }
if (data && data.app === "reussir-tcf") data = data.data;
if (!data || typeof data !== "object" || !Object.keys(data).some((c) => COLLS.includes(c))) { console.error(`${file} isn't a Réussir le TCF backup.`); process.exit(1); }
const unknown = Object.keys(data).filter((c) => !COLLS.includes(c));
if (unknown.length) console.warn(`Skipping unknown collections: ${unknown.join(", ")}`);

const db = openDb();
const n = replace ? db.replace(data) : db.bulk(data);
db.close();
console.log(`${replace ? "Replaced everything with" : "Imported"} ${n} documents into ${db.file}`);
