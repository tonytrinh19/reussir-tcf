// Checks the built-in Compréhension orale sets (comp-co.js) and their recordings: the structure, a B1
// and a B2 set for every topic, 6 questions per set, a cast for every speaker, the script length,
// option lengths that don't give the right answer away, and that every set has an up-to-date
// recording of 1:45 to 4 minutes, with no audio file left over.
// Script length is a word count: enough for about 2:15 at Gemini's pace for the level, as learned by
// tools/make_audio.py and saved in tools/word-targets.json. A set not yet recorded with Gemini that is
// too short is listed for rewriting (the recorder skips it) but doesn't fail the check, so a small
// change in the learned pace never blocks the nightly push.
// Run: node tools/check_co.js   (prints stats; exits 1 if anything fails)
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
global.window = {};
const root = path.join(__dirname, "..");
const site = path.join(root, "site");
require(path.join(site, "data.js"));
require(path.join(site, "comp-co.js"));
const T = window.TCF;

// The same option limits as tools/check_ce.js: on the real test no option stands out.
const LIMITS = { longestMin: 0.15, longest: 0.3, shortestMin: 0.15, shortest: 0.35, ratioMin: 0.9, ratioMax: 1.1, maxRatio: 1.4 };
const QUESTIONS = 6;
const targetsFile = path.join(root, "tools", "word-targets.json");
const TARGETS = JSON.parse(fs.readFileSync(targetsFile, "utf8"));
// Spoken words (numbers spelled out, l'homme as two), counted by the recorder that learned the targets.
const spoken = JSON.parse(require("child_process").execFileSync("python3", ["-B", path.join(root, "tools", "make_audio.py"), "--word-counts"], { encoding: "utf8" }));
const MIN_SECONDS = 105, MAX_SECONDS = 240; // a recording outside 1:45–4:00 means something went wrong
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
Object.keys(manifest).filter((id) => !ids.has(id)).forEach((id) => fail(`tools/recordings.json: ${id} is not a set`));
const clock = (x) => { const t = Math.round(x); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
console.log(`Recordings: ${secs.length} · ${Object.entries(engines).map(([e, n]) => `${e} ${n}`).join(" · ") || "none"}${secs.length ? ` · ${clock(Math.min(...secs))}–${clock(Math.max(...secs))}` : ""}`);

console.log(`Script targets for about 2:15: ${Object.entries(TARGETS).map(([l, t]) => `${l} ${t.minWords}+ words (${Math.round(t.wpm)} a minute, ${t.reads} reads)`).join(" · ")}`);
if (short.length) console.log(`\nToo short for Gemini, rewrite before it records them (${short.length}):\n  - ${short.join("\n  - ")}`);

if (errors.length) {
  console.log(`\n${errors.length} problem${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("\nAll checks passed.");
