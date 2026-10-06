// Prints the built-in listening sets (id, level, context, lines, cast) as JSON for tools/make_audio.py.
// comp-co.js needs only window.TCF.COMP, so this runs on its own, even from a bare `git archive`.
// With --exam it prints the practice exam's items instead: an id for each (co-exam-1-07), its level, kind,
// lines, cast, recording and the length its level allows (TCF_CANADA.coLevels in data.js).
const path = require("path");
const site = path.join(__dirname, "..", "site");
if (process.argv.includes("--exam")) {
  global.window = {};
  require(path.join(site, "data.js"));
  require(path.join(site, "exam-co.js"));
  const levels = window.TCF.TCF_CANADA.coLevels;
  const items = [];
  for (const e of window.TCF.COMP.coExams || []) {
    e.items.forEach((it, i) => items.push({ id: `${e.id}-${String(i + 1).padStart(2, "0")}`, exam: e.id, level: it.level, kind: it.kind, lines: it.lines, cast: it.cast, file: it.audio, secs: levels[it.level].secs }));
  }
  process.stdout.write(JSON.stringify(items));
} else {
  global.window = { TCF: { COMP: {} } };
  require(path.join(site, "comp-co.js"));
  const sets = window.TCF.COMP.coSets.map(({ id, level, context, lines, cast }) => ({ id, level, context, lines, cast }));
  process.stdout.write(JSON.stringify(sets));
}
