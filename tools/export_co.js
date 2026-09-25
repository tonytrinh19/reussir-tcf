// Prints the built-in listening sets (id, level, context, lines, cast) as JSON for tools/make_audio.py.
// comp-co.js needs only window.TCF.COMP, so this runs on its own, even from a bare `git archive`.
const path = require("path");
global.window = { TCF: { COMP: {} } };
require(path.join(__dirname, "..", "site", "comp-co.js"));
const sets = window.TCF.COMP.coSets.map(({ id, level, context, lines, cast }) => ({ id, level, context, lines, cast }));
process.stdout.write(JSON.stringify(sets));
