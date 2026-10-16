#!/usr/bin/env node
// Finds the interface's English for « Pense en français »: every phrase the site shows, as the browser will see it,
// from app.js, index.html and the instructions in the data. Learning material (cards, explanations, the grammar
// notes, the Fiches) is left out: it stays as it is, and the site marks it lang="en".
//   node tools/i18n_extract.js            → writes tools/fr-strings.json
//   node tools/i18n_extract.js --print    → also prints the counts and a sample
// A phrase with no ${…} is exact; one with them is a pattern, "{0} of {1} met", whose values are filled in on the page.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(__dirname, "fr-strings.json");
const SKIP = (() => { try { return new Set(JSON.parse(fs.readFileSync(path.join(__dirname, "i18n-skip.json"), "utf8"))); } catch (_) { return new Set(); } })();
const PH = "\u0001"; // where a ${…} was

/* ---------- a small JavaScript tokenizer: string and template literals, with ${…} nested to any depth ---------- */
function literals(src) {
  const out = [];
  let i = 0, prev = "(";
  const regexAfter = /[(,=:[!&|?{};+\-*%<>~^]$/;
  const kw = /\b(return|typeof|case|in|of|new|delete|void|throw|else|do|yield|await)$/;
  function readQuoted(q) {
    let s = "", j = i + 1;
    while (j < src.length && src[j] !== q) {
      if (src[j] === "\\") { s += unescape(src[j + 1]); j += 2; continue; }
      s += src[j++];
    }
    i = j + 1;
    return s;
  }
  function unescape(c) { return c === "n" ? "\n" : c === "t" ? "\t" : c; }
  function readTemplate() {
    const parts = [];
    let s = "", j = i + 1;
    while (j < src.length && src[j] !== "`") {
      if (src[j] === "\\") { s += unescape(src[j + 1]); j += 2; continue; }
      if (src[j] === "$" && src[j + 1] === "{") {
        s += PH;
        i = j + 2;
        code(true);
        j = i;
        continue;
      }
      s += src[j++];
    }
    i = j + 1;
    parts.push(s);
    return s;
  }
  function readRegex() {
    let j = i + 1, cls = false;
    while (j < src.length) {
      const c = src[j];
      if (c === "\\") { j += 2; continue; }
      if (c === "[") cls = true; else if (c === "]") cls = false; else if (c === "/" && !cls) break; else if (c === "\n") break;
      j++;
    }
    j++;
    while (/[a-z]/i.test(src[j] || "")) j++;
    i = j;
  }
  // Code up to the } closing a ${ (or to the end): literals inside are collected too.
  function code(untilBrace) {
    let depth = 0;
    while (i < src.length) {
      const c = src[i], n = src[i + 1];
      if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
      if (c === "/" && n === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? src.length : e + 2; continue; }
      if (c === '"' || c === "'") { const start = i; const v = readQuoted(c); out.push({ kind: "str", text: v, at: start }); prev = "a"; continue; }
      if (c === "`") { const start = i; const v = readTemplate(); out.push({ kind: "tpl", text: v, at: start }); prev = "a"; continue; }
      if (c === "/") {
        const before = src.slice(Math.max(0, i - 12), i).replace(/\s+$/, "");
        if (regexAfter.test(before) || kw.test(before) || !before) { readRegex(); prev = "a"; continue; }
      }
      if (c === "{") depth++;
      if (c === "}") { if (untilBrace && depth === 0) { i++; return; } depth--; }
      if (!/\s/.test(c)) prev = c;
      i++;
    }
  }
  code(false);
  return out;
}

/* ---------- what the browser shows: text between tags, and the readable attributes ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", rarr: "→", larr: "←", middot: "·", hellip: "…", mdash: "—", ndash: "–" };
const decode = (s) => s.replace(/&(#?\w+);/g, (m, e) => (e in ENT ? ENT[e] : /^#\d+$/.test(e) ? String.fromCharCode(+e.slice(1)) : m));
const norm = (s) => s.replace(/\s+/g, " ").trim();
const ATTR = /\b(title|aria-label|placeholder|alt)="([^"]*)"/g;
function runs(text, isTemplate) {
  const found = [];
  // A tooltip's lines are shown, and translated, one by one.
  if (!/[<>]/.test(text)) { text.split("\n").forEach((line) => found.push({ text: line, where: isTemplate ? "template" : "string" })); return found; }
  // Tags, then the text between them.
  const re = /<[^<>]*>/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) found.push({ text: text.slice(last, m.index), where: "html" });
    let a;
    ATTR.lastIndex = 0;
    while ((a = ATTR.exec(m[0]))) found.push({ text: a[2], where: "attr:" + a[1] });
    last = re.lastIndex;
  }
  if (last < text.length) found.push({ text: text.slice(last), where: "html" });
  return found;
}

/* ---------- which runs are English interface text ---------- */
// Common English words (none of them also French), to tell English from French.
const EN = new Set("the a an and or of to in on at for with from by your you it is are be not no this that these those all any every each more less than then when what how why which who here there now today tomorrow week day days cards card review reviews start show check next back done open close save delete add edit new set sets round rounds answer answers practice practise learn learned mistakes mistake error errors words word text texts task tasks topic topics block blocks only one two three first last latest still left about after before until again hard good easy try yet so as if but do does did has have had will would can could should may might must get got make made take see shows shown keep kept nothing something anything up out off over under per most least best".split(" "));
const FRW = /\b(le|la|les|des|du|une|un|est|et|pour|avec|dans|sur|pas|ton|ta|tes|tu|vos|votre|nous|vous|ce|cette|ces|aux|au|qui|que|ne|se|en|sont|être|avoir|fait|faire|encore|déjà|aujourd'hui|demain|semaine|jour|jours)\b/i;
const english = (s) => {
  const ws = (s.toLowerCase().match(/[a-z']+/g) || []);
  if (!ws.length) return false;
  const en = ws.filter((w) => EN.has(w)).length;
  if (en) return true;
  if (/[à-ÿœ]/i.test(s) || FRW.test(s)) return false; // French, or a French name
  return true;
};
function keep(r) {
  let t = norm(decode(r.text));
  if (!t || SKIP.has(t)) return null;
  const bare = t.split(PH).join(" ");
  if (!/[A-Za-z]{2}/.test(bare)) return null;
  // Claude's prompts and other long instructions to a model.
  if (/JSON|Reply with|You are |\bReply in\b|LEARNER PROFILE|TCF CANADA —|ABOUT ME:|\blearner\b|THE [A-Z]{3,}|"\w+": ?["{\[]|^- |^, "|Each item:/.test(t) || t.length > 2500) return null;
  // CSS: transforms, selectors, selector lists.
  if (/^(rotate|scale|translate)\(|^([a-z][a-z0-9]*, )+[a-z][a-z0-9]*$|^[.#][\w-]|:not\(|\[data-|::/.test(t)) return null;
  // One common English word ("tomorrow", "new") is shown, not a key.
  const word = !/\s/.test(bare) && (EN.has(bare) || /^(tomorrow|yesterday|today)$/.test(bare));
  if (!word && (r.where === "string" || r.where === "template")) {
    // Code: classes, keys, ids, selectors, paths, CSS, URLs, data attributes. One word: only a capitalised label.
    if (!/\s/.test(bare) && !/^[A-Z][a-z]+[.!?…]?$/.test(bare)) return null;
    if (/^[\w.#:\-\[\]="'>~*+ ()]+$/.test(bare) && /[-_#=\[\]]|^\w+(\s\w+)*$/.test(bare) && !/[A-Z]/.test(bare) && !/\s/.test(bare)) return null;
    if (/(^|\s)(var\(|--|#[0-9a-f]{3,6}\b|data-|class=|https?:)/i.test(bare)) return null;
    if (/^[a-z0-9-]+( [a-z0-9-]+)*$/.test(bare) && bare.split(" ").every((w) => /-/.test(w) || !EN.has(w)) && !/ /.test(bare)) return null;
  }
  if (!english(bare)) return null;
  // A pattern needs a word of its own, so it can't match the material it holds.
  if (t.includes(PH) && !/[A-Za-z]{3}/.test(bare.replace(/\s+/g, "")) && !(bare.toLowerCase().match(/[a-z]+/g) || []).some((w) => EN.has(w))) return null;
  let k = 0;
  const key = t.replace(new RegExp(PH, "g"), () => `{${k++}}`);
  if (/^\{\d+\}([\s·:,.;\-–—/()]*\{\d+\})*[\s·:,.;\-–—/()]*$/.test(key)) return null;
  return key;
}

// The forms of a phrase the page may show: as written; without the values at either end (a ${ico()} there is an
// element, so the text node starts after it); and each piece between « · », which the page translates one by one
// when the whole doesn't match.
const renumber = (k) => { let i = 0; return k.replace(/\{\d+\}/g, () => `{${i++}}`); };
function variants(key) {
  const out = new Set([key]);
  const bare = renumber(key.replace(/^(\{\d+\}\s*)+/, "").replace(/(\s*\{\d+\})+$/, "").replace(/^[\s·,:;→]+|[\s·]+$/g, "").trim());
  if (bare !== key && /[A-Za-z]{3}/.test(bare.replace(/\{\d+\}/g, ""))) out.add(bare);
  if (key.includes(" · ")) key.split(" · ").forEach((p) => { p = renumber(p.replace(/^[\s·]+|[\s·]+$/g, "")); if (p && /[A-Za-z]{3}/.test(p.replace(/\{\d+\}/g, "")) && english(p.replace(/\{\d+\}/g, " "))) out.add(p); });
  return [...out];
}

/* ---------- the data's instructions ---------- */
function dataPhrases() {
  const ctx = { console };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["data.js", "drills.js"]) vm.runInContext(fs.readFileSync(path.join(SITE, f), "utf8"), ctx);
  const T = ctx.TCF, out = [];
  const add = (s, where) => { if (typeof s === "string" && s.trim()) out.push({ text: s, where }); };
  Object.values(T.PLAN || {}).forEach((P) => (P.days || []).forEach((d) => d.forEach((b) => { add(b[2], "plan"); add(b[3], "plan"); add(b[4], "plan"); })));
  Object.values(T.PLAN || {}).forEach((P) => add(P.note, "plan"));
  Object.values(T.CRITERIA || {}).forEach((cs) => cs.forEach((c) => add(c.text, "criteria")));
  (T.PHASES || []).forEach((p) => { add(p.goal, "phase"); add(p.level, "phase"); add(p.name, "phase"); add(p.weeks, "phase"); });
  Object.values(T.CATEGORIES || {}).forEach((v) => add(typeof v === "string" ? v : v && v.label, "category"));
  (T.EXAM || []).forEach((e) => { add(e.fmt, "exam"); add(e.note, "exam"); });
  (T.AUTOFAIL || []).forEach((x) => add(x, "exam"));
  const TC = T.TCF_CANADA || {};
  ["ee", "eo"].forEach((k) => ((TC[k] || {}).criteria || []).forEach(([n, d]) => { add(n, "rubric"); add(d, "rubric"); }));
  add(TC.source, "rubric");
  ["ceExam", "coExam"].forEach((k) => add((TC[k] || {}).note, "exam"));
  Object.values(T.WRITING || {}).forEach((W) => ["name", "kind", "expected", "exam"].forEach((f) => add(W[f], "writing")));
  (T.TOPICS || []).forEach((tp) => {
    if (tp.prod) { add(tp.prod.prompt, "production"); add(tp.prod.check, "production"); }
    add(tp.exercise, "production");
    if (tp.criterion) add(tp.criterion.text, "criteria");
    (tp.sets || []).forEach((s) => { add(s.ask, "drill"); add(s.title, "drill"); });
  });
  Object.values(T.WRITING || {}).forEach((W) => (W.structure || []).forEach((x) => add(x, "writing")));
  // The practice resources and the easy-practice sources: what each one is (not its name or address).
  const C = T.COMP || {};
  const sources = (xs) => (Array.isArray(xs) ? xs : []).forEach((x) => x && typeof x === "object" && ["what", "how", "note", "tip"].forEach((k) => add(x[k], "free")));
  sources(C.resources);
  Object.values(C.free || {}).forEach((x) => { if (Array.isArray(x)) sources(x); else if (x && typeof x === "object") Object.values(x).forEach((v) => (typeof v === "string" ? add(v, "free") : sources(v))); });
  return out;
}

/* ---------- the learning material's English (the user asked on 2026-10-16 for it in French too) ---------- */
// Explanations after an answer, drill rule names, the grammar topics' notes, Find the mistakes' explanations, and
// the starter sheets whole (their markup splits a line across elements, so a sheet is translated as one). Cards,
// example translations and « Quelle phrase est correcte ? »'s meanings stay English: they're the prompts.
function contentPhrases() {
  const ctx = { console };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ["data.js", "drills.js", "proofread.js", "fiches.js", "comp-ce.js", "exam-ce.js", "exam-co.js", "comp-co.js"]) vm.runInContext(fs.readFileSync(path.join(SITE, f), "utf8"), ctx);
  const T = ctx.TCF, out = [];
  const add = (s, kind, extra) => { if (typeof s === "string" && s.trim() && english(s)) out.push(Object.assign({ text: s.trim(), where: "content:" + kind }, extra || {})); };
  (T.TOPICS || []).forEach((tp) => {
    ["why", "know", "master"].forEach((k) => add(tp[k], "topic"));
    (tp.sets || []).forEach((st) => {
      st.points.forEach((p) => add(p, "rule"));
      st.items.forEach((it) => add(st.kind === "choice" ? it[2] : it[3], "drill"));
    });
  });
  (T.LOW_PRIORITY || []).forEach((x) => add(x[1], "topic"));
  (T.PROOFREAD || []).forEach((t) => (t.mistakes || []).forEach((m) => add(m[3], "hunt")));
  const whys = (o) => { if (Array.isArray(o)) o.forEach(whys); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (k === "why" && typeof v === "string") add(v, "comp"); else whys(v); } };
  whys([(T.COMP || {}).ceSets, (T.COMP || {}).coSets, (T.COMP || {}).ceExams, (T.COMP || {}).coExams]);
  (T.FICHES || []).forEach((f) => { if (typeof f.body === "string") out.push({ text: f.body, where: "content:fiche", fiche: f.id }); });
  return out;
}

/* ---------- run ---------- */
// Every phrase, sorted. tools/check_fr.js uses this too.
function extract() {
  const units = new Map();
  function collect(text, where, ctx, isTemplate) {
    for (const r of runs(text, isTemplate)) {
      const first = keep(r);
      if (!first) continue;
      for (const key of variants(first)) {
        if (SKIP.has(key)) continue;
        const u = units.get(key);
        if (u) { if (u.ctx.length < 3 && ctx && !u.ctx.includes(ctx)) u.ctx.push(ctx); continue; }
        units.set(key, { id: crypto.createHash("sha1").update(key).digest("hex").slice(0, 12), text: key, kind: key.includes("{0}") ? "pattern" : "exact", where: r.where.startsWith("attr") ? r.where : where, ctx: ctx ? [ctx] : [] });
      }
    }
  }
  const app = fs.readFileSync(path.join(SITE, "app.js"), "utf8");
  for (const l of literals(app)) {
    // The phrase's template, with each tag reduced to its name (so a <small> subtitle reads as one) and ${…} as « … ».
    const ctx = norm(decode(l.text.replace(new RegExp(PH, "g"), "…").replace(/<(\/?)([a-z0-9]+)[^>]*>/gi, (m, c, t) => (/^(b|i|small|em|strong|a|p|li|h\d|button|span|summary)$/i.test(t) ? `<${c}${t.toLowerCase()}>` : " ")))).slice(0, 260);
    collect(l.text, "app", ctx, l.kind === "tpl");
  }
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const body = html.slice(html.indexOf("<body") >= 0 ? html.indexOf("<body") : html.indexOf("</style>")).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "");
  collect(body, "index.html", "", false);
  for (const d of dataPhrases()) collect(d.text, d.where, "", false);
  // The learning material goes in as it is: whole explanations, and whole sheets.
  for (const c of contentPhrases()) {
    if (units.has(c.text)) continue;
    units.set(c.text, Object.assign({ id: crypto.createHash("sha1").update(c.text).digest("hex").slice(0, 12), text: c.text, kind: c.fiche ? "fiche" : "exact", where: c.where, ctx: [] }, c.fiche ? { fiche: c.fiche } : {}));
  }
  return [...units.values()].sort((a, b) => a.text.localeCompare(b.text));
}
module.exports = { extract };

if (require.main === module) {
  const list = extract();
  fs.writeFileSync(OUT, JSON.stringify(list, null, 1) + "\n");
  const by = {};
  list.forEach((u) => { by[u.kind] = (by[u.kind] || 0) + 1; by[u.where] = (by[u.where] || 0) + 1; });
  console.log(`${list.length} phrases → ${path.relative(ROOT, OUT)} · ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  if (process.argv.includes("--print")) list.filter((_, i) => i % Math.max(1, Math.floor(list.length / 40)) === 0).forEach((u) => console.log(`  [${u.kind}/${u.where}] ${u.text.slice(0, 110)}`));
}
