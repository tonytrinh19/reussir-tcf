/* « Pense en français »: while it's on, the interface is shown in French. app.js draws every page in English as
   usual; this swaps each phrase on screen for its French from TCF.FR (fr.js, written by Gemini from the phrases
   tools/i18n_extract.js finds). A phrase is a text node, or a title, aria-label, placeholder, alt or data-tip.
   - Exact phrases are looked up as they are. A pattern, "{0} of {1} met", matches with its values, which are
     translated in turn when they're phrases themselves (a plan block inside a sentence); numbers stay.
   - Learning material is left in English: anything inside [lang="en"] (cards, explanations, grammar notes, the
     Fiches), inputs and textareas, and [translate="no"].
   - A MutationObserver translates what each redraw adds, before the browser paints it, so English never flashes.
     Each node keeps its English, so switching off puts it back.
   It never reads or writes progress. */
(function () {
  "use strict";
  const FR = (window.TCF && window.TCF.FR) || { exact: {}, patterns: [] };
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const exact = new Map(Object.entries(FR.exact || {}));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const words = (s) => (s.toLowerCase().match(/[a-zà-ÿ']{3,}/g) || []);
  // Patterns, indexed by each of their words, so a phrase is only tried against the patterns that share a word.
  const index = new Map();
  (FR.patterns || []).forEach(([en, fr]) => {
    const order = (en.match(/\{\d+\}/g) || []).map((p) => +p.slice(1, -1));
    // A value may be empty (a note that isn't shown). One glued to a word ("card{2}", "Start review{0}") is a plural's
    // ending, or something that starts with a space or a sign (" (119)").
    const re = new RegExp("^" + esc(en).replace(/([A-Za-z])\\\{\d+\\\}/g, "$1((?:s|es|x)(?![A-Za-z])|(?![A-Za-z]).*?)").replace(/\\\{\d+\\\}/g, "(.*?)") + "$");
    const ws = (en.replace(/\{\d+\}/g, " ").toLowerCase().match(/[a-zà-ÿ']{2,}/g) || []);
    if (!ws.length) return;
    // A pattern with no long word of its own ("{0} of {1}") only takes numbers.
    const p = { re, fr, order, size: en.replace(/\{\d+\}/g, "").length, numeric: !/[A-Za-z]{4}/.test(en.replace(/\{\d+\}/g, " ")) };
    for (const w of new Set(ws)) { if (!index.has(w)) index.set(w, []); index.get(w).push(p); }
  });
  // English words a value mustn't hold unless it's a phrase itself: "{0} days" mustn't turn "on last week, same days"
  // into "on last week, same jours".
  const EN = new Set("the and or of to in on at for with from by your you it is are be not no this that all any each more less than then when what how why which who here there now last next first same week weeks day days time card cards set sets round rounds review reviews text texts task tasks topic topics mistake mistakes word words answer answers question questions only still left about after before again done new open show start check try see keep".split(" "));
  const plain = (v) => !(v.toLowerCase().match(/[a-z']+/g) || []).some((w) => EN.has(w));

  // The French for one phrase, or null when there's none (it then stays as it is).
  function tr(text, depth) {
    const n = norm(text);
    if (!n || !/[A-Za-z]/.test(n)) return null;
    const hit = exact.get(n);
    // A pair « Français · English » that came back whole: its pieces decide.
    if (hit != null && !(hit === n && n.includes(" · "))) return hit;
    if (hit != null) { const p = pieces(n, depth); return p != null ? p : hit; }
    if ((depth || 0) > 2) return null;
    // Of the patterns that fit, the one with the most words of its own, and only if each value is a phrase itself
    // (then translated), or holds no English (a number, a date, a name, French).
    let best = null;
    const tried = new Set();
    for (const w of new Set((n.toLowerCase().match(/[a-zà-ÿ']{2,}/g) || []).flatMap((w) => [w, w.replace(/(es|s|x)$/, "")]))) {
      for (const p of index.get(w) || []) {
        if (tried.has(p) || (best && p.size <= best.p.size)) continue;
        tried.add(p);
        const m = p.re.exec(n);
        if (!m || (p.numeric && m.slice(1).some((v) => !/^[\d\s.,/:%+−–-]*$/.test(v)))) continue;
        const vals = m.slice(1).map((v) => { const t = tr(v, (depth || 0) + 1); return t != null ? keepSpace(v, t) : plain(v) ? v : null; });
        if (vals.some((v) => v == null)) continue;
        best = { p, vals };
      }
    }
    if (best) return best.p.fr.replace(/\{(\d+)\}/g, (_, k) => { const v = best.vals[best.p.order.indexOf(+k)]; return v == null ? "" : v; });
    return pieces(n, depth);
  }
  // A value keeps the spaces around it: " still to do" stays a word apart once it's French.
  const keepSpace = (v, t) => (t ? (/^\s/.test(v) ? " " : "") + t + (/\s$/.test(v) ? " " : "") : t);
  // Labels joined with « · » (a page name and its English, a date and "today", a plan's blocks in a row): each piece
  // on its own. An English piece right after a French one is its gloss, and goes; any other English piece must
  // translate, or the whole stays as it is.
  const french = (s) => plain(s) && (/[à-ÿœ’]/i.test(s) || /\b(le|la|les|des|du|une|un|est|et|pour|avec|dans|sur|de|en|au|aux|ta|ton|tes|aujourd'hui)\b/i.test(s));
  function pieces(n, depth) {
    // Punctuation around a phrase (", NCLC 6.", ": what the rubric says"): set aside, then put back.
    const pm = /^([,:;·→–—-]\s*)?(.*?)([.,:;!?…]?)$/.exec(n);
    if (pm && (pm[1] || pm[3]) && pm[2] && pm[2] !== n) {
      const t = tr(pm[2], (depth || 0) + 1);
      if (t != null) return (pm[1] || "") + t + (pm[3] || "");
    }
    const sep = n.includes(" · ") ? " · " : n.includes(" → ") ? " → " : null;
    // Sentences shown one after another in the same line: each on its own.
    if (!sep) {
      const ss = n.split(/(?<=[.!?])\s+(?=[A-Z])/);
      if (ss.length < 2) return null;
      const out = ss.map((x) => { const t = tr(x, (depth || 0) + 1); return t != null ? t : plain(x) ? x : null; });
      return out.some((x) => x == null) ? null : out.join(" ");
    }
    const out = [];
    let changed = false;
    for (const part of n.split(sep)) {
      const prev = out[out.length - 1];
      const gloss = prev != null && french(prev) && !/\d/.test(part);
      const after = prev != null && plain(prev) && !/\d/.test(part);
      const t = tr(part, (depth || 0) + 1);
      if (t != null) {
        // Its French is the piece just before it, or that piece is French and this is its English: it goes.
        if (t !== "" && !gloss && !(prev && t.toLowerCase() === prev.toLowerCase())) out.push(t);
        changed = true;
        continue;
      }
      if (plain(part)) { out.push(part); continue; }
      // An English piece no one translated, right after a French or plain one: its gloss.
      if (after) { changed = true; continue; }
      return null;
    }
    return changed ? out.join(sep) : null;
  }

  const SKIP = '[lang="en"], [translate="no"], textarea, input, select, script, style, code, [contenteditable="true"], [contenteditable=""]';
  const ATTRS = ["title", "aria-label", "placeholder", "alt", "data-tip"];
  const enText = new WeakMap(); // text node → its English
  const enAttr = new WeakMap(); // element → { attribute: English }
  const ours = new WeakMap(); // text node → the French this put there
  let on = false;

  function text(node) {
    const el = node.parentElement;
    if (!el || el.closest(SKIP)) return;
    const cur = node.nodeValue;
    // Changed by the page since (a count going up, a clock): that's its new English.
    if (ours.has(node) && ours.get(node) !== cur) { enText.delete(node); ours.delete(node); }
    const en = enText.has(node) ? enText.get(node) : cur;
    const fr = tr(en);
    if (fr == null) return;
    const lead = /^\s/.test(en) ? " " : "", trail = /\s$/.test(en) ? " " : "";
    const out = fr ? lead + fr + trail : lead || trail;
    enText.set(node, en);
    ours.set(node, out);
    if (cur !== out) node.nodeValue = out;
  }
  function attrs(el) {
    if (el.closest(SKIP)) return;
    let saved = enAttr.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a);
      if (saved && saved[a] && saved[a].fr === cur) continue;
      const fr = a === "data-tip" ? cur.split("\n").map((l) => { const t = tr(l); return t != null ? t : l; }).join("\n") : tr(cur);
      if (fr == null || fr === cur) continue;
      if (!saved) { saved = {}; enAttr.set(el, saved); }
      saved[a] = { en: cur, fr };
      el.setAttribute(a, fr);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { text(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (root.closest(SKIP)) return; attrs(root); }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.nodeType === 3) text(n); else attrs(n); }
  }
  // Puts the English back everywhere.
  function restore(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = tw.currentNode; n; n = tw.nextNode()) {
      if (n.nodeType === 3) { if (enText.has(n) && ours.get(n) === n.nodeValue) n.nodeValue = enText.get(n); enText.delete(n); ours.delete(n); continue; }
      const saved = enAttr.get(n);
      if (saved) { for (const [a, v] of Object.entries(saved)) if (n.getAttribute(a) === v.fr) n.setAttribute(a, v.en); enAttr.delete(n); }
    }
  }

  const mo = typeof MutationObserver === "function" ? new MutationObserver((records) => {
    if (!on) return;
    for (const r of records) {
      if (r.type === "childList") r.addedNodes.forEach(walk);
      else if (r.type === "characterData") text(r.target);
      else if (r.type === "attributes" && r.target.nodeType === 1) attrs(r.target);
    }
  }) : null;

  function set(v) {
    v = !!v;
    if (v === on) return;
    on = v;
    if (on) {
      walk(document.body);
      if (mo) mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    } else {
      if (mo) mo.disconnect();
      restore(document.body);
    }
  }

  window.TCFI18n = Object.freeze({ set, tr: (s) => { const t = tr(s); return t != null ? t : s; }, on: () => on });
})();
