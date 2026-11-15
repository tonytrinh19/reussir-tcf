// Regression checks for the PDF reader's navigation and failure handling, without browser dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const source = fs.readFileSync(path.join(site, 'pdf-viewer.js'), 'utf8')
  .replace(/^import .*;$/m, '')
  .replace('import.meta.url', '"http://localhost/pdf-viewer.js"');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function waitFor(test) { for (let i = 0; i < 100; i++) { if (test()) return; await tick(); } throw Error('Viewer state did not settle'); }
class Element {
  constructor() { this.events = {}; this.children = []; this.hidden = true; this.disabled = true; this.textContent = ''; this.clientWidth = 600; this.style = {}; this.attrs = {}; }
  addEventListener(name, fn) { this.events[name] = fn; }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attrs[name] = value; }
  getContext() { return {}; }
}
function setup(file = 'exam-sources/papers/co-paper-1.pdf', failure = false) {
  const elements = Object.fromEntries(['prev','next','page','total','download','status','sheet','text-version','page-text'].map(id => [id, new Element()]));
  const events = {}, loads = [], rendered = [];
  let hash = '#page=1', deferred;
  const pdf = { numPages: 3, getPage: async number => {
    if (number === 2 && deferred) await deferred;
    return { getViewport: ({scale}) => ({width:600*scale,height:800*scale}), getTextContent: async () => ({items:[{str:`Page ${number}`,hasEOL:true}]}), render: () => {
      rendered.push(number); return {promise:Promise.resolve(),cancel(){}};
    }};
  }};
  const context = { URL, URLSearchParams, setTimeout, clearTimeout, console,
    location: { search: '?file='+encodeURIComponent(file), get hash(){return hash}, set hash(value){ hash=value.startsWith("#")?value:"#"+value; queueMicrotask(()=>events.hashchange?.()); } },
    window: { devicePixelRatio: 1, addEventListener:(name,fn)=>{events[name]=fn} },
    document: {getElementById:id=>elements[id],createElement:()=>new Element()},
    GlobalWorkerOptions: {}, getDocument:options=>{loads.push(options);return {promise:failure?Promise.reject(Error('Offline')):Promise.resolve(pdf)}},
  };
  vm.runInNewContext(source,context);
  return {elements,context,loads,rendered,hold:promise=>{deferred=promise}};
}
(async()=>{
  const s=setup();await waitFor(()=>s.elements['page-text'].textContent==='Page 1\n');
  assert.equal(s.loads.length,1);
  assert.equal(s.elements.download.download,'co-paper-1.pdf');
  assert.equal(s.elements.prev.disabled,true);
  let release; s.hold(new Promise(r=>{release=r}));
  s.elements.next.events.click();await tick(); // page 2 is deliberately slow
  s.elements.next.events.click();await waitFor(()=>s.elements['page-text'].textContent==='Page 3\n');
  release();await tick();
  assert.equal(s.elements['page-text'].textContent,'Page 3\n','A stale page must not replace the latest page');
  assert.equal(s.loads.length,1,'Changing pages must reuse the same PDF');
  assert.equal(s.elements.next.disabled,true);
  s.elements.page.value=999;s.elements.page.events.change();await tick();assert.equal(s.elements.page.value,3);
  s.elements.page.value='';s.elements.page.events.change();await waitFor(()=>s.elements['page-text'].textContent==='Page 1\n');
  const bad=setup('https://example.com/file.pdf');await tick();assert.equal(bad.loads.length,0);assert.match(bad.elements.status.textContent,/pas disponible/);
  const offline=setup(undefined,true);await waitFor(()=>offline.elements.status.textContent.includes('Impossible'));assert.equal(offline.elements.download.hidden,false);assert.equal(offline.elements.page.disabled,true);
  for(const file of ['pdf.js','pdf.worker.js','LICENSE']) assert(fs.statSync(path.join(site,'vendor/pdfjs',file)).size>0);
  console.log('PDF reader: page navigation, stale renders, bounds, error fallback, local-only URLs pass.');
})().catch(error=>{console.error(error);process.exitCode=1});
