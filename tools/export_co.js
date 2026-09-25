// Prints the built-in listening sets (id, level, lines) as JSON for tools/make_audio.py.
const path = require("path");
global.window = {};
const site = path.join(__dirname, "..", "site");
require(path.join(site, "data.js"));
require(path.join(site, "comp-co.js"));
const sets = window.TCF.COMP.coSets.filter((s) => s.id).map((s) => ({ id: s.id, level: s.level, lines: s.lines }));
process.stdout.write(JSON.stringify(sets));
