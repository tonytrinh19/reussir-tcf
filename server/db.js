"use strict";
// The progress store: one SQLite table holding every document as JSON, keyed by collection and id.
// The collections match the ones the site keeps on claude.ai (see CLAUDE.md → Publishing).

const fs = require("node:fs");
const path = require("node:path");

const COLLS = ["settings", "days", "drills", "srs", "cards", "writing", "errors", "homework", "speaking", "comp", "mocks", "inprogress"];
const DEFAULT_FILE = path.resolve(__dirname, "..", "data", "tcf.sqlite");

function loadSqlite() {
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 22 || (maj === 22 && min < 13)) {
    console.error(`Node ${process.versions.node} is too old: this needs Node 22.13 or later (built-in SQLite). Update with \`brew upgrade node\`.`);
    process.exit(1);
  }
  // node:sqlite prints an "experimental" warning once; it's stable enough for this.
  const emit = process.emitWarning;
  process.emitWarning = (w, ...rest) => { if (!/SQLite/.test(String(w))) emit.call(process, w, ...rest); };
  try { return require("node:sqlite"); } finally { process.emitWarning = emit; }
}

function openDb(file) {
  const { DatabaseSync } = loadSqlite();
  file = file || process.env.TCF_DB || DEFAULT_FILE;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS docs (
      coll    TEXT NOT NULL,
      id      TEXT NOT NULL,
      data    TEXT NOT NULL,
      updated INTEGER NOT NULL,
      PRIMARY KEY (coll, id)
    );
  `);
  const qAll = db.prepare("SELECT coll, id, data FROM docs");
  const qSet = db.prepare(`INSERT INTO docs (coll, id, data, updated) VALUES (?, ?, ?, ?)
    ON CONFLICT (coll, id) DO UPDATE SET data = excluded.data, updated = excluded.updated`);
  const qDel = db.prepare("DELETE FROM docs WHERE coll = ? AND id = ?");

  return {
    file,
    all() {
      const out = {};
      for (const c of COLLS) out[c] = {};
      for (const r of qAll.all()) if (out[r.coll]) out[r.coll][r.id] = JSON.parse(r.data);
      return out;
    },
    set(coll, id, data) { qSet.run(coll, id, JSON.stringify(data), Date.now()); },
    del(coll, id) { qDel.run(coll, id); },
    // Writes many documents in one transaction: { coll: { id: doc } }.
    bulk(byColl) {
      let n = 0;
      db.exec("BEGIN");
      try {
        for (const [coll, docs] of Object.entries(byColl || {})) {
          if (!COLLS.includes(coll)) continue;
          for (const [id, data] of Object.entries(docs || {})) { this.set(coll, id, data); n++; }
        }
        db.exec("COMMIT");
      } catch (e) { db.exec("ROLLBACK"); throw e; }
      return n;
    },
    close() { db.close(); },
  };
}

module.exports = { openDb, COLLS, DEFAULT_FILE };
