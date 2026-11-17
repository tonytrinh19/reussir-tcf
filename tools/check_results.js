// The results view must group mock tasks without changing the underlying attempts or scoring.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../site/app.js'), 'utf8');
const writing = [
  {id:'w1', task:'t1', date:'2026-11-12', ts:30, prompt:'Un été à Montréal', fb:{score20:12}, mock:{id:'mock1',paperTitle:'Sujet été',min:58}},
  {id:'w2', task:'t2', date:'2026-11-12', ts:31, prompt:'Une lettre', fb:{score20:15}, mock:{id:'mock1',paperTitle:'Sujet été',min:58}},
  {id:'w3', task:'t3', date:'2026-11-12', ts:32, prompt:'Les transports', fb:null, mock:{id:'mock1',paperTitle:'Sujet été',min:58}},
  {id:'w4', task:'t1', date:'2026-11-13', ts:40, prompt:'Texte individuel', fb:null},
  {id:'w5', task:'t1', date:'2026-11-11', ts:20, prompt:'Ancien examen', fb:{score20:0}, mock:{id:'mock0',min:60}},
];
const attempts = writing.map(doc=>({kind:'writing',id:doc.id,ts:doc.ts,date:doc.date,title:doc.prompt,doc})).concat([
  {kind:'exam',id:'co1',ts:50,date:'2026-11-14',title:'CO · Sujet 1',doc:{skill:'co',score:25,total:39,est:458}},
  {kind:'comp',id:'ce1',ts:10,date:'2026-11-10',title:'CE · Bibliothèque',doc:{skill:'ce'}},
]);
const before = JSON.stringify({writing,attempts});
const context = {list:()=>writing,EE_TASKS:['t1','t2','t3'],finishedAttempts:()=>attempts,str:v=>v==null?'':String(v),shortDate:v=>v==='2026-11-10'?'10 nov.':v,SECTION:{writing:'Écrit',eemock:'Écrit',exam:'Compréhension',comp:'Compréhension',drill:'Grammaire'},sectionOf:kind=>['drill','prod'].includes(kind)?'grammar':kind==='exam'?'comp':kind==='eemock'?'writing':kind};
const mocks = source.slice(source.indexOf('  function eeMocks()'), source.indexOf('  // Claude corrects the mock',source.indexOf('  function eeMocks()')));
const model = source.slice(source.indexOf('  function resultEntries()'),source.indexOf('  function resultsLink('));
vm.createContext(context); vm.runInContext(mocks+model+'\nthis.results = {resultEntries,resultMatches,resultType,resultSkill};',context);
const {resultEntries,resultMatches,resultType} = context.results;
const entries = resultEntries();
assert.deepEqual(Array.from(entries,x=>x.id),['co1','w4','eemock-mock1','eemock-mock0','ce1']);
assert.equal(entries.find(x=>x.id==='eemock-mock1').doc.score,null,'Uncorrected writing must not look like a zero score');
assert.equal(entries.find(x=>x.id==='eemock-mock0').doc.score,0,'A real zero and blank tasks remain zero');
assert.equal(entries.filter(x=>resultType(x)==='exam').length,3);
assert.equal(entries.filter(x=>resultMatches(x,{filter:'co',type:'exam'})).length,1);
assert.equal(entries.filter(x=>resultMatches(x,{filter:'comp'})).length,2,'Keep compatibility with existing comprehension links');
assert(resultMatches(entries[2],{filter:'writing',type:'exam',query:'ete montreal'}),'Search must ignore accents and include full prompts');
assert(!resultMatches(entries[2],{filter:'writing',type:'exercise'}));
assert(resultMatches(entries[4],{query:'bibliotheque 2026-11-10'}));
assert(resultMatches(entries[4],{query:'10 nov.'}),'Dates shown on the cards must be searchable');
assert(resultMatches({kind:'eemock',prompts:{t1:{q:'Réunion des voisins'}}},{query:'reunion voisins'}),'Search includes unfinished mock prompts');
assert(resultMatches({kind:'eemock',paperTitle:'Sujet du mois',title:'Examen blanc EE',texts:{}},{filter:'writing',type:'exam',query:'sujet mois'}),'Unfinished exams must use the same filters');
assert(resultMatches({kind:'comp',skill:'co',title:'Entretien'},{filter:'co',type:'exercise'}));
assert.equal(JSON.stringify({writing,attempts}),before,'Browsing results must not mutate any stored attempt');
console.log('Results: grouped writing mocks, incomplete corrections, zero scores, accent-insensitive search, skill/type filters and immutable records pass.');
