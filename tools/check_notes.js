// Checks the reference content: the cards' example sentences (examples.js, with the examples already in data.js
// and anki.js) and the starter revision sheets (fiches.js).
//  - Every built-in card has at least 2 examples, each written "French — English", the French at most 26 words,
//    and no example sentence appears twice across the decks. Every key in examples.js names a real card, so a
//    card whose French side was reworded doesn't silently lose its examples.
//  - No French side is on two cards (give or take capitals, brackets and the final stop): one copy of each word
//    across all decks. No two cards of a deck share an id (app.js makes it from the French side), so a card's
//    progress and the links to it (the expression of the day's) find the right one.
//  - Every expression (EXPRESSIONS, the expression of the day and the Expressions deck) has its French and its
//    meaning, and a register, if it has one, of Québec, familier or soutenu.
//  - Every sheet has a unique id, a title, a known tag, and a "for" that names a grammar topic or a writing task.
//    Its markup is well formed: each order chain has at least 2 slots (one of them a word slot), every {n:word}
//    names a slot of the chain above it, every table row has as many cells as its header, and every **, ~~,
//    ++ and == is closed.
// Run: node tools/check_notes.js   (exits 1 if anything fails)
const path = require("path");
global.window = {};
const site = path.join(__dirname, "..", "site");
["data.js", "anki.js", "examples.js", "fiches.js"].forEach((f) => require(path.join(site, f)));
const T = window.TCF;
const errors = [];
const fail = (msg) => errors.push(msg);

/* ---------- card examples ---------- */
let cards = 0, lines = 0;
const seen = new Map();
for (const th of T.VOCAB) {
  const fr = new Set(th.cards.map((c) => c[0]));
  for (const k of Object.keys((T.EXAMPLES || {})[th.id] || {})) if (!fr.has(k)) fail(`examples.js: ${th.id} has examples for "${k}", which isn't a card in that deck`);
  for (const c of th.cards) {
    cards++;
    const ls = String(c[2] || "").split("\n").map((l) => l.trim()).filter(Boolean);
    lines += ls.length;
    if (ls.length < 2) fail(`${th.id}: "${c[0]}" has ${ls.length} example${ls.length === 1 ? "" : "s"} (at least 2)`);
    for (const l of ls) {
      const parts = l.split(" — ");
      if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) { fail(`${th.id}: "${c[0]}": not "French — English": ${l}`); continue; }
      const w = parts[0].trim().split(/\s+/).length;
      if (w > 26) fail(`${th.id}: "${c[0]}": ${w} words, over 26: ${parts[0]}`);
      const key = parts[0].trim().toLowerCase();
      if (seen.has(key)) fail(`${th.id}: "${c[0]}": the same sentence is also on "${seen.get(key)}": ${parts[0]}`);
      else seen.set(key, `${th.id}: ${c[0]}`);
    }
  }
}
console.log(`Examples: ${lines} on ${cards} cards (${(lines / cards).toFixed(1)} a card)`);

/* ---------- one copy of each card, and an id for each ---------- */
const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "x";
const sameFr = (s) => String(s).normalize("NFC").toLowerCase().replace(/[’]/g, "'").replace(/\(.*?\)/g, "").replace(/[.!?…\s]+$/, "").replace(/\s+/g, " ").trim();
const frSeen = new Map();
for (const th of T.VOCAB) {
  const ids = new Map();
  for (const c of th.cards) {
    const k = sameFr(c[0]);
    if (frSeen.has(k)) fail(`${th.id}: "${c[0]}" is also a card in ${frSeen.get(k)}`);
    else frSeen.set(k, `${th.id} ("${c[0]}")`);
    const id = slug(c[0]);
    if (ids.has(id)) fail(`${th.id}: "${c[0]}" and "${ids.get(id)}" would get the same card id (${th.id}--${id})`);
    else ids.set(id, c[0]);
  }
}
const REGS = ["Québec", "familier", "soutenu"];
for (const x of T.EXPRESSIONS || []) {
  if (!x || !String(x.fr || "").trim() || !String(x.en || "").trim()) { fail(`EXPRESSIONS: an entry without its French or its meaning: ${JSON.stringify(x)}`); continue; }
  if (x.reg && !REGS.includes(x.reg)) fail(`EXPRESSIONS: "${x.fr}" has the register "${x.reg}" (${REGS.join(", ")})`);
}

/* ---------- the sheets ---------- */
const TAGS = ["grammaire", "ecrit", "oral", "vocabulaire", "examen"];
const ROUTES = new Set(T.TOPICS.map((tp) => `grammar.${tp.id}`).concat(["t1", "t2", "t3"].map((k) => `writing.${k}`)));
const ids = new Set();
// The same reading of a chain as app.js (fxChainParse): "*" is the verb, "#n " sets the colour, else its place.
function chainSlots(src) {
  let auto = 0;
  return src.split("|").map((p) => p.trim()).filter(Boolean).map((p) => {
    if (p.startsWith("*")) return { verb: true };
    let n = 0;
    const m = p.match(/^#([1-6])\s+/);
    if (m) { n = Number(m[1]); p = p.slice(m[0].length); }
    auto++;
    const w = p.split("::")[0].trim();
    return { n: n || Math.min(auto, 6), words: w ? w.split(/[\s,]+/).filter(Boolean).length : 0 };
  });
}
for (const f of T.FICHES || []) {
  const at = `fiche ${f.id || "(no id)"}`;
  if (!f.id || !/^[a-z0-9-]+$/.test(f.id)) fail(`${at}: the id must be lowercase letters, digits and hyphens`);
  if (ids.has(f.id)) fail(`${at}: id used twice`);
  ids.add(f.id);
  if (!String(f.title || "").trim()) fail(`${at}: no title`);
  if (!TAGS.includes(f.tag)) fail(`${at}: tag "${f.tag}" isn't one of ${TAGS.join(", ")}`);
  if (f.for && !ROUTES.has(f.for)) fail(`${at}: for "${f.for}" isn't a grammar topic or writing task`);
  let slots = null, cols = 0;
  String(f.body || "").split("\n").forEach((raw, i) => {
    const t = raw.trim(), where = `${at}, line ${i + 1}`;
    if (!t.startsWith("|")) cols = 0;
    if (t.startsWith(">>")) {
      const ss = chainSlots(t.slice(2));
      if (ss.length < 2 || !ss.some((s) => !s.verb)) fail(`${where}: an order chain needs at least 2 slots`);
      ss.forEach((s, k) => { if (!s.verb && !s.words) fail(`${where}: slot ${k + 1} has no words`); });
      slots = new Set(ss.filter((s) => !s.verb).map((s) => s.n));
      return;
    }
    if (t.startsWith("|") && !/^\|[\s:|-]+\|?$/.test(t)) {
      const n = t.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").length;
      if (!cols) cols = n;
      else if (n !== cols) fail(`${where}: ${n} cells, but the table's header has ${cols}`);
    }
    for (const m of t.matchAll(/\{(\d):[^{}]+\}/g)) {
      if (!slots) fail(`${where}: {${m[1]}:…} with no order chain above it`);
      else if (!slots.has(Number(m[1]))) fail(`${where}: {${m[1]}:…} names a slot the chain above doesn't have`);
    }
    const plain = t.replace(/\{\d:[^{}]+\}/g, "");
    for (const mk of ["**", "~~", "++", "=="]) {
      const n = plain.split(mk).length - 1;
      if (n % 2) fail(`${where}: an unclosed ${mk}`);
    }
  });
}
console.log(`Fiches: ${(T.FICHES || []).length} starter sheets`);

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("All good.");
