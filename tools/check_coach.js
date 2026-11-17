// Shorter plans must never shift the IDs behind saved ticks, minutes or unfinished work.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'), source=fs.readFileSync(path.join(root,'site/app.js'),'utf8');
const content={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'site/data.js'),'utf8'),content);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze)}return x};
const T=freeze(content.window.TCF),days=new Map();
const context={T,S:{days},settings:()=>({phase:3}),Date,dow:d=>(new Date(d+'T12:00:00Z').getUTCDay()+6)%7};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  const LIGHT_PLAN_FROM'),source.indexOf('  function setBlock('))+'\nthis.planAPI={planFor,originalPlan,blockKey,keepPlan,dayStats};',context);
const {planFor,originalPlan,blockKey,keepPlan,dayStats}=context.planAPI;
const dateAt=(n)=>new Date(Date.UTC(2026,10,16+n)).toISOString().slice(0,10);
for(let phase=1;phase<=5;phase++)for(let offset=0;offset<14;offset++){
 const date=dateAt(offset),old=originalPlan(phase,date),plan=planFor(phase,date);
 if(!old){assert.equal(plan,null);continue;}
 const optional=phase===5&&context.dow(date)===5;
 assert.equal(plan.length,old.length-(optional?0:1),`phase ${phase}, ${date}`);
 assert.deepEqual(Array.from(plan.filter(b=>b[5].startsWith('comp.free.')),b=>b[5]),Array.from(old.filter(b=>b[5].startsWith('comp.free.')),b=>b[5]));
 for(const route of ['writing.mock','comp.co.exam','comp.ce.exam'])assert.equal(plan.filter(b=>b[5]===route).length,old.filter(b=>b[5]===route).length,'Keep full mocks intact');
 for(const [i,b] of plan.entries())assert.equal(blockKey(phase,i,plan),`p${phase}b${b[6]}`);
}
// Every writing task and core grammar topic still appears during Phase 3's two-week rotation.
const routes=new Set(Array.from({length:14},(_,i)=>planFor(3,dateAt(i))||[]).flat().map(b=>b[5]));
for(const route of ['writing.t1','writing.t2','writing.t3','grammar.subjonctif.contraste','grammar.concession','grammar.discours','grammar.conditionnel','grammar.gerondif','grammar.hunt','grammar.mine','comp.ce','comp.co'])assert(routes.has(route),route);
const legacy=freeze({phase:3,total:5,done:{p3b0:true,p3b1:true,p3b4:true},went:{p3b0:{at:1},p3b1:{at:2},p3b2:{at:3}},min:{p3b0:8,p3b1:6,p3b4:20}});
days.set('2026-11-16',legacy);
let plan=planFor(3,'2026-11-16');assert.deepEqual(Array.from(plan,b=>b[6]),[0,1,2,4],'Keep the started listening exercise; drop untouched writing');
assert.equal(dayStats('2026-11-16').n,3);assert.equal(dayStats('2026-11-16').total,4);
const kept=JSON.parse(JSON.stringify(legacy));keepPlan(kept,plan,'2026-11-16');delete kept.done.p3b1;days.set('2026-11-16',freeze(kept));
assert.deepEqual(Array.from(planFor(3,'2026-11-16'),b=>b[6]),[0,1,2,4],'Unchecking an earlier block must not reshuffle the saved plan');
assert.equal(kept.min.p3b4,20);assert.equal(legacy.total,5,'Never mutate the original document');
days.set('2026-11-09',legacy);assert.equal(planFor(3,'2026-11-09').length,5);assert.equal(dayStats('2026-11-09').total,5);assert.equal(dayStats('2026-11-09').n,3);
days.set('2026-11-16',freeze({phase:3,total:5,done:Object.fromEntries([0,1,2,3,4].map(i=>['p3b'+i,true]))}));assert.equal(dayStats('2026-11-16').n,5);assert.equal(dayStats('2026-11-16').total,5,'Already completed days stay completed');
// Test the actual comprehension coach: a passed first set completes new sessions, including auto-tick's zero-time start.
Object.assign(context,{wentOf:()=>context.went,compLadder:()=>({level:'B1',up:.75,have:.6}),phaseInfo:()=>({level:'B1'}),list:()=>context.attempts,firstTries:x=>x,avg:x=>x.reduce((a,b)=>a+b,0)/x.length,CE_SET_SIZE:4,CE_PACE:{B1:90,B2:105},CO_WPM:{B1:160,B2:185},SWITCH_MIN:2,LADDER_DOWN:.5,PACE_STEPS:[[1.5,'relaxed'],[1.25,'practice'],[1,'exam']],cePace:()=>({clock:360,k:2}),paceClock:l=>l==='B1'?360:420,samplesFor:()=>[{id:'sample',level:'B1',lines:[]}],findSample:()=>0,coWords:()=>360,chip:t=>({t}),pct:x=>Math.round(x*100)+'%',fmtClock:x=>String(x)});
vm.runInContext(source.slice(source.indexOf('  function compStep('),source.indexOf('  function examStep('))+'\nthis.compTest=compStep;',context);
context.attempts=[];context.went=null;let step=context.compTest('ce',[], 'p3b2','2026-11-17');assert.equal(step.parts.length,1);
context.attempts=[{skill:'ce',date:'2026-11-17',ts:100,total:4,score:4,level:'B1',timed:true,clock:360,secs:350}];
step=context.compTest('ce',[],'p3b2','2026-11-17');assert.equal(step.parts.length,1);assert(step.parts.every(p=>p.done));
context.went={at:0,singleSet:true};assert.equal(context.compTest('ce',[],'p3b2','2026-11-17').parts.length,1);
context.went={at:1};assert.equal(context.compTest('ce',[],'p3b2','2026-11-17').parts.length,2,'A legacy session already started retains its second part');
context.attempts=[{skill:'co',date:'2026-11-17',ts:100,total:6,score:6,level:'B1'}];context.went={at:1,singleSet:true};step=context.compTest('co',[],'p3b2','2026-11-17');assert.equal(step.parts.length,1);assert(step.parts.every(p=>p.done));
console.log('Coach: two-week rotation, one fewer block, preserved free practice/mocks, stable IDs, frozen history, completed days and single-set sessions pass.');
