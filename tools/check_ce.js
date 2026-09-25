// Checks the built-in Compréhension écrite content: the practice sets (data.js + comp-ce.js) and the
// practice exam (exam-ce.js). It checks the structure, that every topic has a B1 and a B2 set, that
// the exam follows TCF_CANADA.ceExam, and that option lengths don't give the right answer away.
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

// On the real test no option stands out. The right answer should be the longest, and the shortest,
// about as often as chance (1 in 4), and never much longer than the others.
const LIMITS = { longestMin: 0.15, longest: 0.3, shortestMin: 0.15, shortest: 0.35, ratioMin: 0.9, ratioMax: 1.1, maxRatio: 1.4 };
const errors = [];
const fail = (msg) => errors.push(msg);
const words = (s) => (String(s || "").match(/\S+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const pct = (x) => Math.round(x * 100) + "%";
const TOPICS = T.VOCAB.filter((t) => t.id !== "connecteurs" && t.id !== "pieges").map((t) => t.id);

function checkQuestion(where, q) {
  if (!q.q) fail(`${where}: no question`);
  if (!Array.isArray(q.options) || q.options.length !== 4) { fail(`${where}: needs exactly 4 options`); return false; }
  if (q.options.some((o) => !String(o).trim())) fail(`${where}: an option is empty`);
  if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== 4) fail(`${where}: two options are the same`);
  if (q.answer !== 0) fail(`${where}: list the correct option first (answer 0)`);
  if (!q.why) fail(`${where}: no explanation (why)`);
  return true;
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

/* ---------- practice sets ---------- */
const sets = T.COMP.ceSets;
const ids = new Set();
const setQs = [];
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
  if (!s.text || !s.title || !s.type) fail(`${where}: missing text, title or type`);
  if (!Array.isArray(s.questions) || s.questions.length !== 4) fail(`${where}: needs 4 questions`);
  (s.questions || []).forEach((q, j) => { const w = `${s.id} Q${j + 1}`; if (checkQuestion(w, q)) setQs.push({ where: w, q }); });
  if (wc[s.level]) wc[s.level].push(words(s.text));
});
TOPICS.forEach((t) => ["B1", "B2"].forEach((l) => {
  if (!sets.some((s) => s.level === l && (s.themes || []).includes(t))) fail(`topic ${t}: no ${l} set`);
}));
const range = (xs) => (xs.length ? `${Math.min(...xs)}–${Math.max(...xs)} words (average ${Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)})` : "none");
console.log(`Practice sets: ${sets.length} · B1 ${range(wc.B1)} · B2 ${range(wc.B2)}`);
lengthReport("Practice sets", setQs);

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
  items.forEach((it, i) => {
    const w = `${ex.id} item ${i + 1} (${it.level})`;
    if (!it.text || !it.type) fail(`${w}: missing text or type`);
    if (checkQuestion(w, it)) qs.push({ where: w, q: it });
    (byLvl[it.level] = byLvl[it.level] || []).push(words(it.text));
  });
  console.log(`${ex.title}: ${items.length} items · ` + Object.entries(byLvl).map(([l, xs]) => `${l} ${range(xs)}`).join(" · "));
  lengthReport(ex.title, qs);
});

if (errors.length) {
  console.log(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("\nAll checks passed.");
