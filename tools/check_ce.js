// Checks the built-in Compréhension écrite content: the practice sets (comp-ce.js) and the practice exam
// (exam-ce.js). It checks the structure, that every topic has a B1 and a B2 set, that the exam follows
// TCF_CANADA.ceExam, and that B1 and B2 items are pitched like the real test's:
//  - each document keeps to its level's length in TCF_CANADA.ceLevels;
//  - option lengths don't give the right answer away;
//  - the right answer can't be found by matching words. In France Éducation International's sample items
//    the right answer rewords the document while the wrong options reuse its words, so the right answer
//    should share the most words with the document no more often than chance, and no more on average.
//    It shouldn't share the fewest too often either, or avoiding the text's words would find it.
// Run: node tools/check_ce.js   (prints stats; exits 1 if anything fails)
const fs = require("fs");
const path = require("path");
global.window = {};
const site = path.join(__dirname, "..", "site");
require(path.join(site, "data.js"));
require(path.join(site, "comp-ce.js"));
const examFile = path.join(site, "exam-ce.js");
if (fs.existsSync(examFile)) require(examFile);
const T = window.TCF;
const LEVELS = T.TCF_CANADA.ceLevels;
const SET_SIZE = 4;

// On the real test no option stands out. The right answer should be the longest, and the shortest,
// about as often as chance (1 in 4), and never much longer than the others.
const LIMITS = { longestMin: 0.15, longest: 0.3, shortestMin: 0.15, shortest: 0.35, ratioMin: 0.9, ratioMax: 1.1, maxRatio: 1.4 };
// Word matching: the share of questions where the right answer shares the most words with the document,
// the share where it shares the fewest, and how far its average overlap may go above the wrong options'.
const MATCH = { topMax: 0.3, bottomMax: 0.4, margin: 0.05 };
const errors = [];
const fail = (msg) => errors.push(msg);
const words = (s) => (String(s || "").match(/\S+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const pct = (x) => Math.round(x * 100) + "%";
const TOPICS = T.VOCAB.filter((t) => !t.general && !t.own).map((t) => t.id);

function checkQuestion(where, q) {
  if (!q.q) fail(`${where}: no question`);
  else if (/\b(PAS|SAUF|NON)\b/.test(q.q)) fail(`${where}: the TCF doesn't ask which option is NOT true`);
  if (!Array.isArray(q.options) || q.options.length !== 4) { fail(`${where}: needs exactly 4 options`); return false; }
  if (q.options.some((o) => !String(o).trim())) fail(`${where}: an option is empty`);
  if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== 4) fail(`${where}: two options are the same`);
  if (q.answer !== 0) fail(`${where}: list the correct option first (answer 0)`);
  if (!q.why) fail(`${where}: no explanation (why)`);
  return true;
}

function checkLength(where, level, text) {
  const L = LEVELS[level];
  const n = words(text);
  if (L && (n < L.words[0] || n > L.words[1])) fail(`${where}: ${n} words, ${level} documents have ${L.words[0]}–${L.words[1]}`);
  return n;
}

function lengthReport(label, qs) {
  if (!qs.length) return;
  let longest = 0, shortest = 0, sum = 0;
  const over = [];
  for (const { where, q } of qs) {
    const L = q.options.map((o) => String(o).length);
    const others = L.filter((_, j) => j !== q.answer);
    const ratio = L[q.answer] / (others.reduce((a, b) => a + b, 0) / others.length);
    if (L[q.answer] > Math.max(...others)) longest++;
    if (L[q.answer] < Math.min(...others)) shortest++;
    sum += ratio;
    if (ratio > LIMITS.maxRatio) over.push(`${where} (${ratio.toFixed(2)}×)`);
  }
  const n = qs.length, mean = sum / n;
  console.log(`${label}: ${n} questions · right answer longest ${longest} (${pct(longest / n)}) · shortest ${shortest} (${pct(shortest / n)}) · mean length ratio ${mean.toFixed(2)}`);
  if (longest / n > LIMITS.longest || longest / n < LIMITS.longestMin) fail(`${label}: the right answer is the longest option in ${pct(longest / n)} of questions (keep it between ${pct(LIMITS.longestMin)} and ${pct(LIMITS.longest)})`);
  if (shortest / n > LIMITS.shortest || shortest / n < LIMITS.shortestMin) fail(`${label}: the right answer is the shortest option in ${pct(shortest / n)} of questions (keep it between ${pct(LIMITS.shortestMin)} and ${pct(LIMITS.shortest)})`);
  if (mean < LIMITS.ratioMin || mean > LIMITS.ratioMax) fail(`${label}: mean length ratio ${mean.toFixed(2)} is outside ${LIMITS.ratioMin}–${LIMITS.ratioMax}`);
  over.forEach((w) => fail(`${w}: the right answer is more than ${LIMITS.maxRatio}× the average length of the others`));
}

/* ---------- word matching ---------- */
// Content words, compared by their first five letters so that « installés » matches « s'installer ».
const STOP = new Set("les des une aux que qui quoi dont cet cette ces cela ceci elle ils elles nous vous leur leurs son ses mon mes ton tes notre nos votre vos pas plus moins tres trop tout tous toute toutes est sont etre ete avoir ont avait etait sera fait faire par pour sur sous dans avec sans entre chez vers comme aussi bien meme autre autres peu deja encore toujours jamais rien personne chaque quand comment pourquoi quel quelle quels quelles selon apres avant mais donc car ainsi alors lui ceux celle celles dun dune".split(" "));
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");
const stems = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)).map((w) => w.slice(0, 5));
function overlap(option, text) {
  const inText = new Set(stems(text));
  const o = stems(option);
  return o.length ? o.filter((w) => inText.has(w)).length / o.length : 0;
}
function matchReport(label, items) {
  if (!items.length) return;
  let top = 0, bottom = 0, right = 0, wrong = 0;
  const tops = [], bottoms = [];
  for (const { where, text, q } of items) {
    const ov = q.options.map((o) => overlap(o, text));
    const others = ov.filter((_, j) => j !== q.answer);
    if (ov[q.answer] > Math.max(...others)) { top++; tops.push(where); }
    if (ov[q.answer] < Math.min(...others)) { bottom++; bottoms.push(where); }
    right += ov[q.answer];
    wrong += others.reduce((a, b) => a + b, 0) / others.length;
  }
  const n = items.length;
  console.log(`${label}: right answer shares the most words with the document in ${top} of ${n} (${pct(top / n)}), the fewest in ${bottom} (${pct(bottom / n)}) · words found in the document: right answers ${pct(right / n)}, wrong ones ${pct(wrong / n)}`);
  if (top / n > MATCH.topMax) fail(`${label}: the right answer is the option closest to the document's words in ${pct(top / n)} of questions (keep it at ${pct(MATCH.topMax)} or less; reword it, or make the wrong options reuse the text): ${tops.join(", ")}`);
  if (bottom / n > MATCH.bottomMax) fail(`${label}: the right answer is the option furthest from the document's words in ${pct(bottom / n)} of questions (keep it at ${pct(MATCH.bottomMax)} or less; let it keep a key word, or reword a wrong option): ${bottoms.join(", ")}`);
  if (right / n > wrong / n + MATCH.margin) fail(`${label}: right answers reuse the document's words more than wrong ones (${pct(right / n)} against ${pct(wrong / n)})`);
}

/* ---------- practice sets ---------- */
const sets = T.COMP.ceSets;
const ids = new Set();
const setQs = [];
const match = { B1: [], B2: [] };
const wc = { B1: [], B2: [] };
sets.forEach((s, i) => {
  const where = `set ${s.id || "#" + i} (${s.title})`;
  if (!s.id) fail(`${where}: no id`);
  else if (ids.has(s.id)) fail(`${where}: duplicate id`);
  ids.add(s.id);
  if (!["B1", "B2"].includes(s.level)) fail(`${where}: level must be B1 or B2`);
  const th = Array.isArray(s.themes) ? s.themes : [];
  if (!th.length) fail(`${where}: no topic`);
  th.filter((t) => !TOPICS.includes(t)).forEach((t) => fail(`${where}: unknown topic ${t}`));
  if (!s.title || !s.type) fail(`${where}: missing title or type`);
  if (s.text) fail(`${where}: a set is separate documents, each on its question (doc), not one text`);
  if (!Array.isArray(s.questions) || s.questions.length !== SET_SIZE) fail(`${where}: needs ${SET_SIZE} documents, one question each`);
  const types = new Set();
  (s.questions || []).forEach((q, j) => {
    const w = `${s.id} doc ${j + 1}`;
    const d = q.doc || {};
    if (!d.text || !d.type) { fail(`${w}: needs a document with a type and a text`); return; }
    types.add(d.type);
    if (wc[s.level]) wc[s.level].push(checkLength(w, s.level, d.text));
    if (checkQuestion(w, q)) { setQs.push({ where: w, q }); if (match[s.level]) match[s.level].push({ where: w, text: `${d.title || ""}\n${d.text}`, q }); }
  });
  if (s.questions && types.size < Math.min(3, s.questions.length)) fail(`${where}: use at least three kinds of document`);
});
TOPICS.forEach((t) => ["B1", "B2"].forEach((l) => {
  if (!sets.some((s) => s.level === l && (s.themes || []).includes(t))) fail(`topic ${t}: no ${l} set`);
}));
const range = (xs) => (xs.length ? `${Math.min(...xs)}–${Math.max(...xs)} words (average ${Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)})` : "none");
console.log(`Practice sets: ${sets.length} · B1 documents ${range(wc.B1)} · B2 documents ${range(wc.B2)}`);
lengthReport("Practice sets", setQs);
matchReport("Practice sets B1", match.B1);
matchReport("Practice sets B2", match.B2);

/* ---------- practice exams ---------- */
const spec = T.TCF_CANADA.ceExam;
const exams = T.COMP.ceExams || [];
if (!spec) fail("TCF_CANADA.ceExam is missing from data.js");
if (!exams.length) fail("no practice exam (site/exam-ce.js)");
exams.forEach((ex) => {
  const where = `exam ${ex.id || "?"}`;
  if (!ex.id || !ex.title) fail(`${where}: needs an id and a title`);
  else if (ids.has(ex.id)) fail(`${where}: id already used`);
  ids.add(ex.id);
  const items = Array.isArray(ex.items) ? ex.items : [];
  if (spec) {
    const want = spec.blocks.flatMap(([lvl, n]) => Array(n).fill(lvl));
    if (items.length !== want.length) fail(`${where}: ${items.length} items, needs ${want.length}`);
    items.forEach((it, i) => { if (want[i] && it.level !== want[i]) fail(`${where} item ${i + 1}: level ${it.level}, expected ${want[i]}`); });
  }
  const qs = [];
  const byLvl = {};
  const mid = [];
  items.forEach((it, i) => {
    const w = `${ex.id} item ${i + 1} (${it.level})`;
    if (!it.text || !it.type) fail(`${w}: missing text or type`);
    // The B1 and B2 blocks follow the calibrated lengths; the others keep the lengths they were written at.
    const n = it.level === "B1" || it.level === "B2" ? checkLength(w, it.level, it.text) : words(it.text);
    (byLvl[it.level] = byLvl[it.level] || []).push(n);
    if (checkQuestion(w, it)) { qs.push({ where: w, q: it }); if (it.level === "B1" || it.level === "B2") mid.push({ where: w, text: `${it.title || ""}\n${it.text}`, q: it }); }
  });
  console.log(`${ex.title}: ${items.length} items · ` + Object.entries(byLvl).map(([l, xs]) => `${l} ${range(xs)}`).join(" · "));
  lengthReport(ex.title, qs);
  matchReport(`${ex.title} B1–B2`, mid);
});

/* ---------- no document twice ---------- */
// A title used twice across the practice sets and the exams usually means the same document came back.
const seenTitles = new Map();
const titleOf = (t) => norm(t).replace(/[^a-z0-9]+/g, " ").trim();
sets.forEach((s) => (s.questions || []).forEach((q, j) => { const t = q.doc && q.doc.title; if (t) seenTitles.set(titleOf(t), (seenTitles.get(titleOf(t)) || []).concat(`${s.id} doc ${j + 1}`)); }));
exams.forEach((ex) => (ex.items || []).forEach((it, i) => { if (it.title) seenTitles.set(titleOf(it.title), (seenTitles.get(titleOf(it.title)) || []).concat(`${ex.id} item ${i + 1}`)); }));
[...seenTitles.values()].filter((w) => w.length > 1).forEach((w) => fail(`the same document title appears in ${w.join(" and ")}`));

/* ---------- the kinds of question in the newer exams ---------- */
// Exams written to the October 2026 research (v: 2) ask, as prep guides describe the real test, at least two
// vocabulary-in-context questions at B2–C1 (« Dans le texte, l'expression « … » signifie… ») and at least two
// about a document's purpose at A2–B1 (« Quel est le but de ce … ? »).
exams.filter((ex) => ex.v >= 2).forEach((ex) => {
  const its = ex.items || [];
  const vocab = its.filter((it) => (it.level === "B2" || it.level === "C1") && /signifi|veut dire|sens/i.test(it.q)).length;
  const goal = its.filter((it) => (it.level === "A2" || it.level === "B1") && /\b(but|objectif)\b/i.test(it.q)).length;
  if (vocab < 2) fail(`${ex.id}: ${vocab} vocabulary-in-context question${vocab === 1 ? "" : "s"} at B2–C1, needs at least 2`);
  if (goal < 2) fail(`${ex.id}: ${goal} question${goal === 1 ? "" : "s"} about a document's purpose at A2–B1, needs at least 2`);
});

if (errors.length) {
  console.log(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("\nAll checks passed.");
