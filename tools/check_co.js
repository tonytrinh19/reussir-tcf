// Checks the built-in Compréhension orale sets (comp-co.js) and their recordings: the structure, a B1
// and a B2 set for every topic, 6 questions per set, a cast for every speaker, the script length,
// option lengths that don't give the right answer away, and that every set has an up-to-date
// recording of 1:45 to 4 minutes, with no audio file left over.
// Script length is a word count: enough for about 2:15 at Gemini's pace for the level, as learned by
// tools/make_audio.py and saved in tools/word-targets.json. A set not yet recorded with Gemini that is
// too short is listed for rewriting (the recorder skips it) but doesn't fail the check, so a small
// change in the learned pace never blocks the nightly push.
// It also checks the practice exam (exam-co.js): 39 items in the level blocks and kinds of TCF_CANADA.coExam,
// pictures and spoken replies with every letter right at least once, a question at the end of each document,
// the spoken words and recording lengths of TCF_CANADA.coLevels, the option lengths and word matching of the
// sets and CE, and a total, with the pauses to read and answer, that fits the real test's 35 minutes.
// Run: node tools/check_co.js   (prints stats; exits 1 if anything fails)
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
global.window = {};
const root = path.join(__dirname, "..");
const site = path.join(root, "site");
require(path.join(site, "data.js"));
require(path.join(site, "comp-co.js"));
require(path.join(site, "exam-co.js"));
const T = window.TCF;

// The same option limits as tools/check_ce.js: on the real test no option stands out.
const LIMITS = { longestMin: 0.15, longest: 0.3, shortestMin: 0.15, shortest: 0.35, ratioMin: 0.9, ratioMax: 1.1, maxRatio: 1.4 };
const QUESTIONS = 6;
const targetsFile = path.join(root, "tools", "word-targets.json");
// The sets' targets by level, and under "exam" the exam's word ranges (shown, not checked: coLevels.words is).
const { exam: EXAM_TARGETS = {}, ...TARGETS } = JSON.parse(fs.readFileSync(targetsFile, "utf8"));
// Spoken words (numbers spelled out, l'homme as two), counted by the recorder that learned the targets.
const spoken = JSON.parse(require("child_process").execFileSync("python3", ["-B", path.join(root, "tools", "make_audio.py"), "--word-counts"], { encoding: "utf8" }));
const MIN_SECONDS = 105, MAX_SECONDS = 240; // a recording outside 1:45–4:00 means something went wrong
// Same as LENGTH_TOLERANCE in tools/make_audio.py: an exam item's recording may run over its level's length,
// fails only when more than this under the minimum, and is listed to rewrite when more than this over the maximum.
const LENGTH_TOLERANCE = 0.15;
const MS_VOICES = ["vivienne", "remy"];
const errors = [];
const fail = (msg) => errors.push(msg);
const pct = (x) => Math.round(x * 100) + "%";
const TOPICS = T.VOCAB.filter((t) => t.id !== "connecteurs" && t.id !== "pieges" && !t.own).map((t) => t.id);

// Same as content_hash in tools/make_audio.py: it changes whenever the script or the cast changes.
const stable = (x) => (Array.isArray(x) ? `[${x.map(stable).join(",")}]`
  : x && typeof x === "object" ? `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${stable(x[k])}`).join(",")}}`
  : JSON.stringify(x));
const hashOf = (s) => crypto.createHash("sha1").update(stable(JSON.parse(JSON.stringify({ level: s.level, lines: s.lines, cast: s.cast })))).digest("hex").slice(0, 12);

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

/* ---------- sets ---------- */
const sets = T.COMP.coSets || [];
const ids = new Set();
const setQs = [];
const wc = { B1: [], B2: [] };
const short = [];
const manifestFile = path.join(root, "tools", "recordings.json");
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
sets.forEach((s, i) => {
  const where = `set ${s.id || "#" + i} (${s.title})`;
  if (!s.id) fail(`${where}: no id`);
  else if (ids.has(s.id)) fail(`${where}: duplicate id`);
  ids.add(s.id);
  if (!["B1", "B2"].includes(s.level)) fail(`${where}: level must be B1 or B2`);
  const th = Array.isArray(s.themes) ? s.themes : [];
  if (!th.length) fail(`${where}: no topic`);
  th.filter((t) => !TOPICS.includes(t)).forEach((t) => fail(`${where}: unknown topic ${t}`));
  if (!s.title || !s.context) fail(`${where}: missing title or context`);
  const lines = Array.isArray(s.lines) ? s.lines : [];
  if (!lines.length || lines.some((l) => !l.text)) fail(`${where}: empty lines`);
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  if (speakers.length > 2) fail(`${where}: ${speakers.length} speakers; Gemini reads at most 2 in one request`);
  const cast = s.cast || {};
  if (!cast.scene) fail(`${where}: the cast needs a scene note`);
  speakers.forEach((sp) => {
    const c = cast[sp];
    if (!c) { fail(`${where}: speaker ${sp} has no cast entry`); return; }
    if (!/^fr-(fr|ca)-[a-z]+-\d+$/.test(c.gemini || "")) fail(`${where}: speaker ${sp} needs a Gemini voice id`);
    if (!MS_VOICES.includes(c.ms)) fail(`${where}: speaker ${sp} needs a Microsoft voice (${MS_VOICES.join(" or ")})`);
    if (!c.style) fail(`${where}: speaker ${sp} needs a delivery note`);
  });
  const t = TARGETS[s.level], sw = spoken[s.id];
  const m = manifest[s.id];
  const onGemini = m && m.engine === "gemini" && m.hash === hashOf(s);
  if (!t) fail(`${where}: tools/word-targets.json has no ${s.level} target`);
  else if (sw > t.maxWords) fail(`${where}: ${sw} spoken words, at most ${t.maxWords} to stay under 4 minutes`);
  else if (sw < t.minWords && !onGemini) short.push(`${s.id} (${sw} spoken words, needs ${t.minWords})`);
  if (wc[s.level]) wc[s.level].push(sw);
  if (!Array.isArray(s.questions) || s.questions.length !== QUESTIONS) fail(`${where}: needs ${QUESTIONS} questions`);
  (s.questions || []).forEach((q, j) => { const w = `${s.id} Q${j + 1}`; if (checkQuestion(w, q)) setQs.push({ where: w, q }); });
});
TOPICS.forEach((t) => ["B1", "B2"].forEach((l) => {
  if (!sets.some((s) => s.level === l && (s.themes || []).includes(t))) fail(`topic ${t}: no ${l} set`);
}));
const range = (xs) => (xs.length ? `${Math.min(...xs)}–${Math.max(...xs)} words (average ${Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)})` : "none");
console.log(`Listening sets: ${sets.length} · spoken words B1 ${range(wc.B1)} · B2 ${range(wc.B2)}`);
lengthReport("Questions", setQs);

/* ---------- recordings ---------- */
const audioDir = path.join(site, "audio");
const files = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter((f) => f.endsWith(".mp4")) : [];
const secs = [];
const engines = {};
sets.forEach((s) => {
  const m = manifest[s.id];
  if (!files.includes(s.id + ".mp4")) fail(`${s.id}: no recording (run python3 tools/make_audio.py)`);
  else if (!m) fail(`${s.id}: missing from tools/recordings.json (run python3 tools/make_audio.py)`);
  else {
    if (m.hash !== hashOf(s)) fail(`${s.id}: the recording is older than the script (run python3 tools/make_audio.py)`);
    if (!(m.seconds >= MIN_SECONDS && m.seconds <= MAX_SECONDS)) fail(`${s.id}: the recording lasts ${m.seconds} s; it must last 1:45 to 4 minutes`);
    secs.push(m.seconds);
    engines[m.engine] = (engines[m.engine] || 0) + 1;
  }
});
files.filter((f) => !ids.has(f.replace(/\.mp4$/, ""))).forEach((f) => fail(`site/audio/${f}: no set uses this file`));
const clock = (x) => { const t = Math.round(x); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

/* ---------- the practice exam ---------- */
// The same word matching as tools/check_ce.js: the right answer rewords what was said, so it mustn't be the
// option closest to the recording's words too often, nor the furthest, nor reuse more of them than the others.
const MATCH = { topMax: 0.3, bottomMax: 0.4, margin: 0.05 };
const STOP = new Set("les des une aux que qui quoi dont cet cette ces cela ceci elle ils elles nous vous leur leurs son ses mon mes ton tes notre nos votre vos pas plus moins tres trop tout tous toute toutes est sont etre ete avoir ont avait etait sera fait faire par pour sur sous dans avec sans entre chez vers comme aussi bien meme autre autres peu deja encore toujours jamais rien personne chaque quand comment pourquoi quel quelle quels quelles selon apres avant mais donc car ainsi alors lui ceux celle celles dun dune".split(" "));
const fold = (x) => String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ");
const stems = (x) => fold(x).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)).map((w) => w.slice(0, 5));
const overlap = (option, text) => { const inText = new Set(stems(text)); const o = stems(option); return o.length ? o.filter((w) => inText.has(w)).length / o.length : 0; };
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
  console.log(`${label}: right answer shares the most words with the recording in ${top} of ${n} (${pct(top / n)}), the fewest in ${bottom} (${pct(bottom / n)}) · words heard: right answers ${pct(right / n)}, wrong ones ${pct(wrong / n)}`);
  if (top / n > MATCH.topMax) fail(`${label}: the right answer is the option closest to the recording's words in ${pct(top / n)} of questions (keep it at ${pct(MATCH.topMax)} or less): ${tops.join(", ")}`);
  if (bottom / n > MATCH.bottomMax) fail(`${label}: the right answer is the option furthest from the recording's words in ${pct(bottom / n)} of questions (keep it at ${pct(MATCH.bottomMax)} or less): ${bottoms.join(", ")}`);
  if (right / n > wrong / n + MATCH.margin) fail(`${label}: right answers reuse the recording's words more than wrong ones (${pct(right / n)} against ${pct(wrong / n)})`);
}
const CX = T.TCF_CANADA.coExam, CL = T.TCF_CANADA.coLevels;
const EXAM_VOICES = ["vivienne", "remy", "sylvie", "jean"];
const examIds = new Set();
const longItems = [];
(T.COMP.coExams || []).forEach((ex) => {
  const items = ex.items || [];
  const levels = CX.blocks.flatMap(([l, n]) => Array(n).fill(l));
  const kinds = CX.kinds.flatMap(([k, n]) => Array(n).fill(k));
  if (items.length !== levels.length) fail(`${ex.id}: needs ${levels.length} items, has ${items.length}`);
  const qs = [], mid = [], spokenRight = new Set();
  let total = 0, missing = false;
  const used = new Set();
  items.forEach((it, i) => {
    const id = `${ex.id}-${String(i + 1).padStart(2, "0")}`;
    const where = `${id} (${it.kind}, ${it.level})`;
    examIds.add(id);
    if (it.level !== levels[i]) fail(`${where}: item ${i + 1} should be ${levels[i]}`);
    if (it.kind !== kinds[i]) fail(`${where}: item ${i + 1} should be a ${kinds[i]} item`);
    const lines = Array.isArray(it.lines) ? it.lines : [];
    if (!lines.length || lines.some((l) => !String(l.text || "").trim())) fail(`${where}: empty lines`);
    const talkers = [...new Set(lines.map((l) => l.speaker).filter((sp) => sp !== "Q"))];
    if (talkers.length > 2) fail(`${where}: ${talkers.length} speakers besides the narrator; Gemini reads at most 2 in one request`);
    const cast = it.cast || {};
    if (!cast.scene) fail(`${where}: the cast needs a scene note`);
    [...new Set(lines.map((l) => l.speaker))].forEach((sp) => {
      const c = cast[sp];
      if (!c) { fail(`${where}: speaker ${sp} has no cast entry`); return; }
      if (!/^fr-(fr|ca)-[a-z]+-\d+$/.test(c.gemini || "")) fail(`${where}: speaker ${sp} needs a Gemini voice id`);
      if (!EXAM_VOICES.includes(c.ms)) fail(`${where}: speaker ${sp} needs a Microsoft voice (${EXAM_VOICES.join(", ")})`);
      if (/^fr-ca/.test(c.gemini || "") && !["sylvie", "jean"].includes(c.ms)) fail(`${where}: speaker ${sp} mixes a Québec Gemini voice with a Paris Microsoft one`);
      if (!c.style) fail(`${where}: speaker ${sp} needs a delivery note`);
    });
    const opts = Array.isArray(it.options) ? it.options : [];
    if (opts.length !== 4 || opts.some((o) => !String(o).trim())) fail(`${where}: needs 4 options`);
    if (new Set(opts.map((o) => String(o).trim().toLowerCase())).size !== opts.length) fail(`${where}: two options are the same`);
    if (!it.why) fail(`${where}: no explanation (why)`);
    if (it.kind === "pic" || it.kind === "reply") {
      // Nothing is written: the options are read in order, each after its letter, and the right letter varies.
      if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer > 3) fail(`${where}: answer must be 0–3`);
      else spokenRight.add(it.answer);
      const read = lines.slice(it.kind === "reply" ? 1 : 0);
      if (read.length !== 4 || read.some((l, k) => l.text !== `${"ABCD"[k]}. ${opts[k]}`)) fail(`${where}: the recording must read the 4 options in order, each after its letter`);
      opts.forEach((o) => { if (spoken[id] != null && String(o).split(/\s+/).length > 10) fail(`${where}: « ${o} » is too long to hear as an option (10 words at most)`); });
      if (it.kind === "pic" && (!it.pic || !it.alt)) fail(`${where}: a picture item needs its drawing and a description`);
      if (it.kind === "reply" && (lines[0].text !== it.q)) fail(`${where}: the recording must start with the question`);
    } else {
      if (it.answer !== 0) fail(`${where}: list the right option first (answer 0)`);
      if (!it.q || !it.situation || !it.type) fail(`${where}: needs a question, a situation and a type`);
      const last = lines[lines.length - 1] || {};
      if (last.speaker !== "Q" || last.text !== it.q) fail(`${where}: the narrator (Q) must read the question at the end`);
      qs.push({ where, q: it });
      if (it.level === "B1" || it.level === "B2") mid.push({ where, q: it, text: lines.filter((l) => l.speaker !== "Q").map((l) => l.text).join(" ") });
    }
    const lv = CL[it.level], sw = spoken[id];
    if (!lv) fail(`${where}: TCF_CANADA.coLevels has no ${it.level}`);
    else if (!(sw >= lv.words[0] && sw <= lv.words[1])) fail(`${where}: ${sw} spoken words; ${it.level} takes ${lv.words[0]}–${lv.words[1]}`);
    // The recording, up to date and as long as its level allows.
    const m = manifest[id];
    used.add(path.basename(it.audio || ""));
    if (!it.audio || !fs.existsSync(path.join(site, it.audio))) { fail(`${id}: no recording (run python3 tools/make_audio.py)`); missing = true; }
    else if (!m) { fail(`${id}: missing from tools/recordings.json (run python3 tools/make_audio.py)`); missing = true; }
    else {
      if (m.hash !== hashOf(it)) fail(`${id}: the recording is older than the script (run python3 tools/make_audio.py)`);
      if (lv && m.seconds < lv.secs[0] * (1 - LENGTH_TOLERANCE)) fail(`${id}: the recording lasts ${m.seconds} s; ${it.level} takes ${lv.secs[0]}–${lv.secs[1]} s, and at least ${+(lv.secs[0] * (1 - LENGTH_TOLERANCE)).toFixed(1)} s is kept`);
      else if (lv && m.seconds > lv.secs[1] * (1 + LENGTH_TOLERANCE)) longItems.push(`${id} (${m.engine}, ${m.seconds} s, ${pct(m.seconds / lv.secs[1] - 1)} over the ${lv.secs[1]} s ${it.level} allows)`);
      total += m.seconds;
    }
    total += (it.kind === "reply" ? CX.read.reply : CX.read[it.level]) + CX.answer[it.level];
  });
  if (spokenRight.size < 4) fail(`${ex.id}: across the picture and spoken-reply items, every letter from A to D should be right at least once`);
  const folder = path.join(site, "audio", ex.id);
  (fs.existsSync(folder) ? fs.readdirSync(folder) : []).filter((f) => f.endsWith(".mp4") && !used.has(f)).forEach((f) => fail(`site/audio/${ex.id}/${f}: no exam item uses this file`));
  console.log(`${ex.title} (CO): ${items.length} items · ${items.filter((x) => x.kind === "pic").length} pictures, ${items.filter((x) => x.kind === "reply").length} spoken replies, ${qs.length} documents · ${clock(total)} with the pauses to read and answer`);
  // About 32 minutes on the real test: 35 with the instructions.
  if (!missing && (total < 30 * 60 || total > 34 * 60)) fail(`${ex.id}: the exam runs ${clock(total)} with its pauses; keep it between 30:00 and 34:00, inside the real test's 35 minutes`);
  lengthReport(`${ex.title} (CO) questions`, qs);
  matchReport(`${ex.title} (CO) B1–B2`, mid);
});
Object.keys(manifest).filter((id) => !ids.has(id) && !examIds.has(id)).forEach((id) => fail(`tools/recordings.json: ${id} is not a set or an exam item`));
console.log(`Recordings: ${secs.length} · ${Object.entries(engines).map(([e, n]) => `${e} ${n}`).join(" · ") || "none"}${secs.length ? ` · ${clock(Math.min(...secs))}–${clock(Math.max(...secs))}` : ""}`);

console.log(`Script targets for about 2:15: ${Object.entries(TARGETS).map(([l, t]) => `${l} ${t.minWords}+ words (${Math.round(t.wpm)} a minute, ${t.reads} reads)`).join(" · ")}`);
if (short.length) console.log(`\nToo short for Gemini, rewrite before it records them (${short.length}):\n  - ${short.join("\n  - ")}`);
const KIND_NAMES = { pic: "picture", reply: "reply", doc: "document" };
if (Object.keys(EXAM_TARGETS).length) console.log(`Exam words for each level's length at Gemini's pace: ${Object.entries(EXAM_TARGETS).map(([l, t]) => `${l} ${Object.entries(t.words).map(([k, [a, b]]) => `${KIND_NAMES[k] || k} ${a}–${b}`).join(", ")}`).join(" · ")}`);
if (longItems.length) console.log(`\nMore than ${pct(LENGTH_TOLERANCE)} over their level's length, kept but worth shortening (${longItems.length}):\n  - ${longItems.join("\n  - ")}`);

if (errors.length) {
  console.log(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("\nAll checks passed.");
