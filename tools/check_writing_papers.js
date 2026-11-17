// Imported writing subjects must keep complete task groups and both T3 documents.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const data = JSON.parse(fs.readFileSync(path.join(site, 'exam-sources/writing.json')));
const catalog = new Map(JSON.parse(fs.readFileSync(path.join(site, 'exam-sources/catalog.json'))).filter(p=>p.skill==='ee').map(p=>[p.id,p]));
const counts = {}, ids = new Set(), tasks = new Map();
assert.equal(Object.keys(data.sources).length,61);
for(const [task,items] of Object.entries(data.tasks)) {
  counts[task]=items.length;
  for(const item of items) {
    assert(!ids.has(item.id),item.id);ids.add(item.id);tasks.set(item.id,{task,item});
    assert(item.q.trim(),item.id);
    assert(catalog.has(item.source.id),item.id);
    assert.equal(item.source.pdf,catalog.get(item.source.id).pdf);
    assert(fs.existsSync(path.join(site,item.source.pdf)));
    assert(Number.isInteger(item.source.page)&&item.source.page>0);
    const text=item.q+' '+(item.docs||[]).map(d=>d.text).join(' ');
    assert(!/Correction Tâche|VIETPHAPAAU|Combinaison\s*\d/i.test(text),`Non-prompt text: ${item.id}`);
    if(task==='t3')assert(item.docs?.length===2&&item.docs.every(d=>d.text.trim()),item.id);
    else assert(!item.docs,item.id);
  }
}
assert.deepEqual(counts,{t1:214,t2:215,t3:202});
assert.equal(data.papers.length,177);
assert.equal(new Set(data.papers.map(p=>p.id)).size,data.papers.length);
for(const paper of data.papers){
  const sources=[];
  for(const task of ['t1','t2','t3']){const found=tasks.get(paper.tasks[task]);assert(found,paper.id);assert.equal(found.task,task);sources.push(found.item.source.id);}
  assert.equal(new Set(sources).size,1,'A complete source exam cannot mix PDFs');
}
assert(!data.papers.some(p=>p.id.startsWith('ee-2e5ded795f8bb09e-')),'Paper 2 is incomplete in the original');
assert(data.tasks.t2.some(p=>p.source.id==='ee-2e5ded795f8bb09e'),'Its usable T2 remains selectable');
assert.equal(data.gaps.length,13);
console.log('Writing PDFs: 177 complete mocks, 631 usable prompts, both T3 documents and 13 source gaps checked.');
