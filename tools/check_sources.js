// Validate the imported collection, including deliberate gaps in the supplied material.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const json = file => JSON.parse(fs.readFileSync(path.join(site, file), 'utf8'));
const asset = file => {
  assert.equal(typeof file, 'string');
  assert(file.startsWith('exam-sources/') && !file.includes('..'), file);
  assert(fs.statSync(path.join(site, file)).size > 0, file);
};
const catalog = json('exam-sources/catalog.json');
assert.equal(new Set(catalog.map(e => e.id)).size, catalog.length);
assert.deepEqual(['co', 'eo', 'ee'].map(skill => catalog.filter(e => e.skill === skill).length), [24, 25, 61]);
const audio = new Set(), pictures = new Set(), missingAudio = [], missingKeys = [], papers = new Map();
for (const paper of catalog) {
  asset(paper.pdf);
  if (paper.skill !== 'co') continue;
  asset(paper.file);
  const items = json(paper.file);
  papers.set(paper.id, items);
  assert.equal(items.length, 39, paper.id);
  items.forEach((item, index) => {
    const ref = `${paper.id}/${index + 1}`;
    assert(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(item.level), ref);
    assert(['pic', 'reply', 'doc'].includes(item.kind), ref);
    assert.equal(item.options.length, 4, ref);
    assert(item.options.every(o => typeof o === 'string' && o.trim()), ref);
    assert(Number.isInteger(item.page) && item.page > 0, ref);
    if (item.answer === null) missingKeys.push(ref);
    else assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4, ref);
    if (item.audio) {
      asset(item.audio); audio.add(item.audio);
      assert(item.secs > 0, ref);
      assert(item.lines.length && item.lines.every(l => typeof l.text === 'string' && l.text.trim()), `Missing transcript: ${ref}`);
      assert(['source-match', 'automatic'].includes(item.transcriptKind), ref);
      assert(item.transcriptSource, `Missing transcript provenance: ${ref}`);
      if (item.transcriptKind === 'source-match') assert(Number.isInteger(item.transcriptPage) && item.transcriptPage > 0 && item.transcriptPage <= 301, ref);
      else assert(!item.transcriptPage && item.transcriptSource.includes('automatique'), ref);
    } else missingAudio.push(ref);
    if (item.image) { asset(item.image); pictures.add(item.image); assert.equal(item.kind, 'pic', ref); }
    assert(Array.isArray(item.lines), ref);
  });
  assert.deepEqual(paper.missingAudio, items.flatMap((it, i) => it.audio ? [] : [i + 1]));
}
assert.deepEqual(missingAudio.sort(), ['co-paper-20/18', 'co-paper-20/4', 'co-paper-27/2']);
assert.deepEqual(missingKeys.sort(), ['co-paper-3/15', ...Array.from({length:39}, (_, i) => `co-paper-4/${i + 1}`)].sort());
assert.equal(audio.size, 907);
assert.equal(pictures.size, 57);
asset('exam-sources/papers/transcripts.pdf');
global.window = {};
require(path.join(site, 'data.js'));
require(path.join(site, 'exam-sources.js'));
const timed = window.TCF.COMP.listeningPapers, spec = window.TCF.TCF_CANADA.coExam;
assert.equal(timed.length, 20);
assert.equal(new Set(timed.map(p => p.id)).size, timed.length);
for (const paper of timed) {
  const items = papers.get(paper.id);
  assert(items && items.every(it => it.audio && Number.isInteger(it.answer)), paper.id);
  const duration = items.reduce((s, it) => s + it.secs + (it.kind === 'reply' ? spec.read.reply : spec.read[it.level]) + spec.answer[it.level], 0);
  assert(paper.minutes * 60 >= duration && paper.minutes * 60 < duration + 61, paper.id);
}
console.log(`Annales: ${catalog.length} papers, ${audio.size} recordings, ${pictures.size} pictures; ${timed.length} complete timed exams. Known source gaps preserved.`);
