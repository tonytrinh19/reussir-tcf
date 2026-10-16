#!/usr/bin/env node
// Checks the French for « Pense en français »: every phrase of the interface (tools/i18n_extract.js) has its
// French in site/fr.js, with the same placeholders. When one is missing:
//   node tools/i18n_extract.js && python3 tools/translate_fr.py
// The learning material (explanations, rule names, grammar notes, the starter sheets) is reported, not required:
// the daily (8 AM) fr-content-gemini routine translates it on the flash models (python3 tools/translate_fr.py --content).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { extract } = require("./i18n_extract");

const ROOT = path.resolve(__dirname, "..");
const ctx = { window: { TCF: {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "site", "fr.js"), "utf8"), ctx);
const FR = ctx.window.TCF.FR || { exact: {}, patterns: [] };
const fr = new Map(Object.entries(FR.exact || {}));
(FR.patterns || []).forEach(([en, f]) => fr.set(en, f));

const all = extract();
const isContent = (u) => u.where.startsWith("content:");
const phrases = all.filter((u) => !isContent(u));
const content = all.filter(isContent);
const contentDone = content.filter((u) => (u.kind === "fiche" ? (FR.fiches || {})[u.fiche] : fr.has(u.text))).length;
const missing = phrases.filter((u) => !fr.has(u.text));
const ph = (s) => (s.match(/\{\d+\}/g) || []).sort().join(" ");
const bad = phrases.filter((u) => fr.has(u.text) && ph(u.text) !== ph(fr.get(u.text)));
const used = new Set(all.map((u) => u.text));
const stale = [...fr.keys()].filter((k) => !used.has(k));

const stored = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "fr-strings.json"), "utf8")).length; } catch (_) { return -1; } })();
let failed = false;
if (missing.length) {
  failed = true;
  console.log(`✗ ${missing.length} of ${phrases.length} phrases have no French yet: run node tools/i18n_extract.js && python3 tools/translate_fr.py`);
  missing.slice(0, 15).forEach((u) => console.log(`    ${u.text.slice(0, 100)}`));
}
if (bad.length) {
  failed = true;
  console.log(`✗ ${bad.length} translations don't keep their placeholders:`);
  bad.slice(0, 15).forEach((u) => console.log(`    ${u.text.slice(0, 70)} → ${fr.get(u.text).slice(0, 70)}`));
}
if (stored !== all.length) console.log(`  tools/fr-strings.json is out of date (${stored} phrases, there are ${all.length}): run node tools/i18n_extract.js`);
if (stale.length) console.log(`  ${stale.length} entries in site/fr.js are no longer used (a rerun of translate_fr.py drops them).`);
if (failed) process.exit(1);
console.log(`French: all ${phrases.length} phrases of the interface (${phrases.filter((u) => u.kind === "pattern").length} with values); the learning material ${contentDone} of ${content.length}.`);
