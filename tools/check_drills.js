// Checks the grammar drills (drills.js): every topic in data.js has well-formed drill sets, with enough in them
// to keep practising without repeating:
//  - a set holds at least three rounds of sentences (3 × take), so a learner who needs more rounds than
//    planned still gets new sentences;
//  - every point (the rule a sentence tests) has at least 4 sentences, so "Retry the misses" can ask a new
//    sentence on the rule that was missed;
//  - no sentence appears twice in a topic, because the app recognises a sentence it has asked by its wording;
//  - the answer fits the elision around the gap (j'___ needs a vowel, je ___ can't take one).
// It also checks that the plan's grammar blocks and the mixed review point at sets that exist.
// Run: node tools/check_drills.js   (prints a line per set; exits 1 if anything fails)
const fs = require("fs");
const path = require("path");
global.window = {};
const site = path.join(__dirname, "..", "site");
require(path.join(site, "data.js"));
require(path.join(site, "drills.js"));
const T = window.TCF;

const ROUNDS = 3;
const PER_POINT = 4;
const LEVELS = ["B1", "B1+", "B2"];
const errors = [];
const fail = (msg) => errors.push(msg);
// The page compares typed answers after this clean-up (norm in app.js), so answers equal here are the same answer.
const norm = (s) => String(s || "").normalize("NFC").toLowerCase()
  .replace(/[’‘ʼ`´]/g, "'").replace(/[«»“”"]/g, "").replace(/[,;:]/g, " ")
  .replace(/\s*'\s*/g, "'").replace(/\s*-\s*/g, "-")
  .replace(/\s+/g, " ").replace(/^[\s.!?;:,¡¿]+|[\s.!?;:,]+$/g, "").trim();
const text = (x) => typeof x === "string" && x.trim() !== "";
const gaps = (s) => String(s).split("___").length - 1;
// After j', qu', l'… the answer must start with a vowel or h. After je, que, le… it mustn't start with a vowel
// (h can be aspirated). Si only elides before il and ils.
const VOWEL = /^[aeiouyâàéèêëîïôûùœ]/i;
function checkElision(w, q, answers) {
  if (/['’]___/.test(q) && answers.some((a) => !VOWEL.test(a) && !/^h/i.test(a))) fail(`${w}: the gap follows an elided word, so every answer must start with a vowel or h`);
  if (/(^|[\s«(])(je|que|de|ne|me|te|se|le|la|lorsque|puisque|jusque) ___/i.test(q) && answers.some((a) => VOWEL.test(a))) fail(`${w}: an answer starts with a vowel after a word that elides before one`);
  if (/(^|[\s«(])si ___/i.test(q) && answers.some((a) => /^ils?\b/i.test(a))) fail(`${w}: si before il is written s'il`);
}

let total = 0;
for (const tp of T.TOPICS) {
  const sets = Array.isArray(tp.sets) ? tp.sets : [];
  if (!sets.length) { fail(`${tp.id}: no drill sets`); continue; }
  if (tp.criterion && tp.criterion.set && !sets.some((s) => s.id === tp.criterion.set)) fail(`${tp.id}: the mastery criterion counts set ${tp.criterion.set}, which doesn't exist`);
  const ids = new Set();
  const keys = new Map();
  for (const s of sets) {
    const where = `${tp.id}.${s.id}`;
    if (ids.has(s.id)) fail(`${where}: two sets with this id`);
    ids.add(s.id);
    if (!text(s.title)) fail(`${where}: no title`);
    if (s.kind !== "type" && s.kind !== "choice") fail(`${where}: kind must be type or choice`);
    if (!LEVELS.includes(s.level)) fail(`${where}: level must be one of ${LEVELS.join(", ")}`);
    if (!text(s.ask)) fail(`${where}: no instruction (ask)`);
    if (!Number.isInteger(s.take) || s.take < 1) fail(`${where}: take must be a positive whole number`);
    const items = Array.isArray(s.items) ? s.items : [];
    const points = Array.isArray(s.points) ? s.points : [];
    if (!points.length) fail(`${where}: no points`);
    if (new Set(points).size !== points.length) fail(`${where}: two points with the same name`);
    if (items.length < ROUNDS * s.take) fail(`${where}: ${items.length} sentences, fewer than ${ROUNDS} rounds of ${s.take} (${ROUNDS * s.take})`);
    // A set either gaps every question or none (conditionnel.uses asks about a whole sentence).
    const gapless = s.kind === "choice" && items.every((r) => Array.isArray(r) && !String(r[0]).includes("___"));
    items.forEach((r, i) => {
      const w = `${where} #${i + 1}`;
      const point = r[r.length - 1];
      if (!points.includes(point)) fail(`${w}: point "${point}" isn't one of the set's points`);
      if (s.kind === "choice") {
        const [q, options, why] = r;
        if (!text(q)) { fail(`${w}: no question`); return; }
        if (!gapless && gaps(q) !== 1) fail(`${w}: the question needs exactly one ___`);
        if (!Array.isArray(options) || options.length < 2) fail(`${w}: needs at least 2 options`);
        else {
          if (!options.every(text)) fail(`${w}: an option is empty`);
          if (new Set(options.map(norm)).size !== options.length) fail(`${w}: two options are the same`);
          checkElision(w, q, [options[0]]);
        }
        if (!text(why)) fail(`${w}: no explanation`);
      } else {
        const [src, q, answers, why] = r;
        if (typeof src !== "string") fail(`${w}: the cue must be a string ("" for none)`);
        if (!text(q)) { fail(`${w}: no question`); return; }
        if (gaps(q) !== 1) fail(`${w}: the question needs exactly one ___`);
        if (!Array.isArray(answers) || !answers.length) fail(`${w}: no accepted answers`);
        else {
          if (!answers.every(text)) fail(`${w}: an accepted answer is empty`);
          if (answers.some((a) => String(a) !== String(a).trim() || String(a).includes("___"))) fail(`${w}: an accepted answer has stray spaces or a ___`);
          if (new Set(answers.map(norm)).size !== answers.length) fail(`${w}: the same answer is listed twice`);
          checkElision(w, q, answers);
        }
        if (!text(why)) fail(`${w}: no explanation`);
      }
      // The same key as itemKey in app.js: topic, cue, question.
      const key = `${norm(s.kind === "choice" ? "" : r[0])}|${norm(s.kind === "choice" ? r[0] : r[1])}`;
      if (keys.has(key)) fail(`${w}: the same sentence as ${keys.get(key)}`);
      else keys.set(key, w);
    });
    const per = points.map((p) => items.filter((r) => r[r.length - 1] === p).length);
    points.forEach((p, k) => { if (per[k] < PER_POINT) fail(`${where}: point "${p}" has ${per[k]} sentences, fewer than ${PER_POINT}`); });
    total += items.length;
    console.log(`${where.padEnd(24)} ${String(s.level).padEnd(3)} ${String(items.length).padStart(3)} sentences = ${(items.length / s.take).toFixed(1)} rounds of ${s.take} · points ${per.join("/")}`);
  }
}

// The plan links each grammar block to a topic (grammar.<topic>) or one of its sets (grammar.<topic>.<set>).
for (const [phase, p] of Object.entries(T.PLAN)) {
  p.days.forEach((day, d) => day.forEach((b) => {
    const route = b[5] || "";
    if (!route.startsWith("grammar.")) return;
    const [, tid, sid] = route.split(".");
    if (tid === "mixed") return;
    const tp = T.TOPICS.find((t) => t.id === tid);
    if (!tp) fail(`plan phase ${phase}, day ${d + 1}: ${route} names no topic`);
    else if (sid && !(tp.sets || []).some((s) => s.id === sid)) fail(`plan phase ${phase}, day ${d + 1}: ${route} names no set`);
  }));
}
// The mixed review's topics and sets are listed in app.js (startDrill).
const app = fs.readFileSync(path.join(site, "app.js"), "utf8");
const m = app.match(/const pick = (\[\[[^;]*\]\]);/);
if (!m) fail("app.js: couldn't find the mixed review's list of sets");
else JSON.parse(m[1]).forEach(([tid, sid]) => {
  const tp = T.TOPICS.find((t) => t.id === tid);
  if (!tp || !(tp.sets || []).some((s) => s.id === sid)) fail(`mixed review: ${tid}.${sid} doesn't exist`);
});

console.log(`\n${T.TOPICS.length} topics · ${total} sentences`);
if (errors.length) {
  console.log(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("All checks passed.");
