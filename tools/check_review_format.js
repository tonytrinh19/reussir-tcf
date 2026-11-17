// Synthetic reviews only: never publish a learner's private writing or pasted feedback as fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/writing-review.js'),'utf8'),c);
const parse=(text,task='t1',scope='task')=>JSON.parse(JSON.stringify(c.window.TCFWritingReview.parse(text,task,scope)));
const french=`## 1. Note

**9/20, B1, NCLC 6.** La structure est claire. Tu peux viser 10-11/20 avec plus de précision.

## 2. Critères

- **Cohérence et cohésion : B1.** La progression est logique.
- **Morphosyntaxe : B1-.** Revois les conjugaisons.
- **Adéquation sociolinguistique : B2.** Le ton convient.

## 3. Erreurs, par importance

1. **nous va → nous allons** (accord avec le sujet)
2. **un activité → une activité** (nom féminin)

## 4. Texte corrigé

Bonjour Camille,

Nous allons organiser une activité samedi.

À bientôt !

## 5. Trois phrases au niveau B2 et trois priorités

**Réécritures B2 :**

1. « C'est bien » → **« C'est une initiative intéressante »** [a useful initiative]
2. « Je suis content » → **« Je m'en réjouis »**

**Vocabulaire clé :** quelques mots utiles.

**Trois priorités :**

1. **Les accords.** Relis les déterminants.
2. **Les verbes.** Révise le présent.
3. **Les paragraphes.** Sépare tes idées.

Un conseil supplémentaire reste dans la réponse originale.`;
const f=parse(french);assert.equal(f.score20,9);assert.equal(f.level,'B1');assert.equal(f.criteria.length,3);assert.equal(f.criteria[1].level,'B1-');assert.equal(f.errors.length,2);assert.equal(f.errors[0].right,'nous allons');assert.equal(f.errors[0].why,'accord avec le sujet');assert.equal(f.upgrades.length,2);assert.equal(f.upgrades[0].to,'C’est une initiative intéressante'.replace('’',"'"));assert.equal(f.homework.length,3);assert.equal(f.corrected_text,'Bonjour Camille,\n\nNous allons organiser une activité samedi.\n\nÀ bientôt !');assert.equal(f.compliance,undefined);assert.equal(f.tache3,undefined);
const english=parse('**Score: 12.5/20**\n\nClear ideas.\n\n## Criteria\n| Criterion | Level | Comment |\n| --- | --- | --- |\n| Coherence | B2 | Clear progression |\n\n## Errors\n| Wrong | Right | Why |\n| --- | --- | --- |\n| je fait | je fais | Agreement |\n\n## Corrected text\nJe fais du sport.\n\n## Strengths\n- A clear argument.\n\n## Next steps\n- Revise the present tense.');
assert.equal(english.score20,12.5);assert.equal(english.criteria.length,1);assert.equal(english.errors.length,1);assert.equal(english.homework.length,1);assert.equal(english.strengths.length,1);
assert.equal(parse('Keep going. In a month, aim for 15/20.').score20,undefined,'An aspirational grade must not become a result');
assert.equal(parse('## Note\nVise 10-11/20 la prochaine fois.').score20,undefined,'Do not use the end of a score range');
assert.equal(parse('## Score\n30/20').score20,undefined,'Do not clamp an invalid grade');
assert.equal(parse('## Errors\nSome points need another look.').errors,undefined,'Missing analysis does not mean zero mistakes');
assert.deepEqual(parse('## Errors\nNo mistakes found.').errors,[]);
assert.equal(parse('## Corrected text\nUn exemple avec 12/20 dans le texte.').score20,undefined);
assert.equal(parse('## Score\n0/20').score20,0);
const structured={score20:14.5,level:'C1',summary:'Clear',criteria:[{name:'Vocabulary',level:'B2',comment:'Precise'}],errors:[{wrong:'nous va',right:'nous allons',why:'Agreement',category:'conjugaison'}],corrected_text:'Nous allons sortir.\n\nÀ demain.',upgrades:[],homework:['Practise agreement'],compliance:{on_topic:true,register_ok:false},tache3:{compared_both:false}};
const j=parse('Here is the review:\n```json\n'+JSON.stringify(structured)+'\n```');assert.equal(j.score20,14.5);assert.equal(j.errors.length,1);assert.equal(j.compliance.on_topic,true);assert.equal(j.compliance.length_ok,undefined);assert.equal(j.tache3.compared_both,false);assert.equal(j.corrected_text,structured.corrected_text);
for(const score20 of [null,true,'',-1,21,'Infinity'])assert.equal(parse(JSON.stringify({...structured,score20})).score20,undefined);
assert.equal(parse(JSON.stringify({score20:0,errors:[{wrong:'incomplete'}]})).errors,undefined,'Malformed JSON errors must not become a zero-error result');
const bundle=JSON.stringify({tasks:{t1:{score20:8,summary:'First'},t2:{score20:12,summary:'Second'},t3:{score20:16,summary:'Third'}}});for(const [i,t] of ['t1','t2','t3'].entries())assert.equal(parse(bundle,t,'mock').score20,8+i*4);
assert.equal(parse(JSON.stringify({score20:15,summary:'Overall'}),'t1','mock'),null,'Never copy an overall mock grade onto every task');
const mock='## Tâche 1\n\n## Note\n8/20\n\n## Tâche 2\n\n## Note\n12/20\n\n## Tâche 3\n\n## Note\n16/20\n\n## Note globale\n12/20';for(const [i,t] of ['t1','t2','t3'].entries())assert.equal(parse(mock,t,'mock').score20,8+i*4);
assert.equal(parse('## Tâche 1\n## Note\n8/20','t2','mock'),null);
assert.equal(parse('A full mock with no task headings.','t3','mock'),null);
assert.equal(parse('{"score20":12, broken').score20,undefined);
assert.equal(parse(''),null);assert.equal(parse('x'.repeat(60001)),null);
assert.equal(parse('## Summary\n<script>alert(1)</script>').summary,'<script>alert(1)</script>','The renderer, not the parser, must escape HTML');
console.log('Review format: French/English sections, lists/tables, grades, corrected paragraphs, priorities, JSON, partial analysis and task-specific mocks pass.');
