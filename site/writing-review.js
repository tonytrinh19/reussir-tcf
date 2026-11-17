/* Read external writing feedback locally. Unrecognized material stays in the original response. */
(function () {
  "use strict";
  const str = x => typeof x === "string" ? x : "";
  const object = x => x && typeof x === "object" && !Array.isArray(x);
  const plain = text => str(text).replace(/\r\n?/g, "\n").replace(/\*\*([^]*?)\*\*/g, "$1").replace(/__([^]*?)__/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1").replace(/\*([^*\n]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^>\s?/gm, "").trim();
  const key = text => plain(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^\s*\d+[.)]\s*/, "").replace(/[:.\s]+$/, "");
  const score = x => {
    if (typeof x !== "number" && typeof x !== "string") return null;
    const s = String(x).trim();
    if (!/^\d{1,2}(?:[.,]\d+)?$/.test(s)) return null;
    const n = Number(s.replace(",", "."));
    return n >= 0 && n <= 20 ? n : null;
  };
  const level = x => /^(?:A[12]|B[12]|C[12])(?:[+−-]|[–-]C2)?$/.test(str(x).trim()) ? x.trim() : "";
  function kind(title) {
    const k = key(title);
    if (/^(?:texte corrige|version corrigee|texte ameliore|corrected (?:text|version)|improved (?:text|version))/.test(k)) return "corrected_text";
    if (/^(?:criteres|criteria|tcf .*criteria|evaluation par critere)/.test(k)) return "criteria";
    if (/^(?:erreurs|fautes|corrections|mistakes|errors)/.test(k)) return "errors";
    if (/^(?:reecritures|reformulations|upgrades|b1\s*[→-].*b2|b2 (?:phrases|upgrades)|(?:trois|3) phrases)/.test(k)) return "upgrades";
    if (/^(?:(?:trois|3) )?(?:priorites|priorities|homework|follow.up|next steps|conseils|axes d.amelioration|devoirs)/.test(k)) return "homework";
    if (/^(?:points forts|strengths|what worked)/.test(k)) return "strengths";
    if (/^(?:bilan|resume|summary|overall feedback|commentaire general)/.test(k)) return "summary";
    if (/^(?:note|score|grade|evaluation globale)(?:\b|\s)/.test(k)) return "grade";
    return "";
  }
  function heading(line) {
    const hash = /^\s*#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (hash) return plain(hash[1]);
    const bold = /^\s*\*\*(.+?)\*\*\s*$/.exec(line);
    if (bold && (kind(bold[1]) || /[:：]$/.test(bold[1]) || /^(?:tache|task) [123]\b/.test(key(bold[1])))) return plain(bold[1]);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (numbered && kind(numbered[1]) && plain(numbered[1]).length < 90 && !/[→]/.test(line)) return plain(numbered[1]);
    return null;
  }
  function taskText(text, task, scope) {
    const lines = text.split("\n"), starts = [];
    lines.forEach((line, i) => {
      const h = heading(line), m = h && /^(?:tache|task)\s*([123])\b/.exec(key(h));
      if (m) starts.push({ i, task: "t" + m[1] });
    });
    if (!starts.length) return scope === "mock" ? "" : text;
    const n = starts.findIndex(x => x.task === task);
    if (n < 0) return "";
    let end = starts[n + 1]?.i ?? lines.length;
    for (let i = starts[n].i + 1; i < end; i++) {
      const h = heading(lines[i]);
      if (h && /^(?:note globale|score global|overall (?:score|grade)|bilan global)/.test(key(h))) { end = i; break; }
    }
    return lines.slice(starts[n].i + 1, end).join("\n");
  }
  function bullets(text) {
    const items = [];
    let current = null;
    for (const line of text.split("\n")) {
      const m = /^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+)$/.exec(line);
      if (m) { current = { text: m[1] }; items.push(current); }
      else if (!line.trim()) current = null;
      else if (current) current.text += " " + line.trim();
    }
    return items.map(x => plain(x.text));
  }
  function table(text) {
    return text.split("\n").filter(line => /^\s*\|/.test(line)).map(line => line.trim().replace(/^\||\|$/g, "").split("|").map(plain));
  }
  const unquote = s => plain(s).replace(/^[«“"]\s*/, "").replace(/\s*[»”"]$/, "").trim();
  function pair(line, upgrade) {
    const m = /^(.*?)\s*(?:→|->|=>)\s*(.+)$/.exec(line);
    if (!m) return null;
    let right = m[2], why = "";
    const explanation = /\s+\(([^]*)\)\s*$/.exec(right);
    if (explanation) { why = explanation[1]; right = right.slice(0, explanation.index); }
    if (upgrade) right = right.replace(/\s*\[[^]*\]\s*$/, "");
    const from = unquote(m[1]), to = unquote(right);
    return from && to ? upgrade ? { from, to } : { wrong: from, right: to, why, category: "other" } : null;
  }
  function jsonFeedback(value, task, scope) {
    let o = value;
    if (object(o?.tasks)) o = o.tasks[task];
    else if (Array.isArray(o?.tasks)) o = o.tasks.find(x => x?.task === task);
    else if (scope === "mock") return null; // an overall grade is not a task grade
    if (!object(o) || !["score20", "summary", "criteria", "errors", "corrected_text", "corrected", "strengths", "homework"].some(k => Object.hasOwn(o, k))) return null;
    const out = { format: "json" };
    const n = score(o.score20); if (n != null) out.score20 = n;
    if (level(o.level)) out.level = level(o.level);
    for (const k of ["summary", "corrected_text"]) if (typeof o[k] === "string") out[k] = o[k];
    if (!out.corrected_text && typeof o.corrected === "string") out.corrected_text = o.corrected;
    if (Array.isArray(o.criteria)) out.criteria = o.criteria.filter(object).filter(x => str(x.name)).map(x => ({ name: str(x.name), level: level(x.level), comment: str(x.comment) }));
    if (Array.isArray(o.errors) && o.errors.every(x => object(x) && str(x.wrong) && str(x.right))) out.errors = o.errors.map(x => ({ wrong: x.wrong, right: x.right, why: str(x.why), category: str(x.category) }));
    if (Array.isArray(o.upgrades)) out.upgrades = o.upgrades.filter(object).filter(x => str(x.from) && str(x.to)).map(x => ({ from: x.from, to: x.to }));
    for (const k of ["strengths", "homework"]) if (Array.isArray(o[k])) out[k] = o[k].filter(x => typeof x === "string");
    for (const [name, fields] of [["compliance", ["on_topic", "length_ok", "register_ok"]], ["tache3", ["compared_both", "opinion_after_comparison"]]]) {
      if (!object(o[name])) continue;
      const obj = {};
      fields.forEach(k => { if (typeof o[name][k] === "boolean") obj[k] = o[name][k]; });
      if (str(o[name].notes)) obj.notes = o[name].notes;
      if (Object.keys(obj).length) out[name] = obj;
    }
    return out;
  }
  function parse(text, task = "t1", scope = "task") {
    text = str(text).replace(/\r\n?/g, "\n").trim();
    if (!text || text.length > 60000) return null;
    const fenced = /```(?:json)?\s*\n?([\s\S]*?)```/i.exec(text);
    try {
      const result = jsonFeedback(JSON.parse(fenced ? fenced[1] : text), task, scope);
      if (result) return result;
    } catch (_) { /* A normal prose response does not need to be JSON. */ }
    const selected = taskText(text, task, scope);
    if (!selected) return null;
    const sections = [];
    let section = { kind: "intro", lines: [] }; sections.push(section);
    for (const line of selected.split("\n")) {
      const h = heading(line);
      if (h != null) { section = { kind: kind(h), title: h, lines: [] }; sections.push(section); }
      else section.lines.push(line);
    }
    const out = { format: "markdown" };
    for (const s of sections) {
      const body = s.lines.join("\n").trim(), value = plain(body);
      if (s.kind === "grade" || s.kind === "intro") {
        const titleScore = s.kind === "grade" && /\d\s*(?:\/|sur\s+|out of\s+)20/i.test(s.title || "") ? s.title : "";
        const first = plain(titleScore || body.split("\n\n")[0] || "");
        const m = /(?:^|[^\d–−-])(\d{1,2}(?:[.,]\d+)?)\s*(?:\/\s*20\b|sur\s+20\b|out of\s+20\b)/i.exec(first);
        if (m && out.score20 == null && (s.kind === "grade" || /^(?:(?:note|score|grade)\s*[:：]?\s*)?\d{1,2}(?:[.,]\d+)?\s*\//i.test(first))) {
          const n = score(m[1]); if (n != null) out.score20 = n;
          const l = /\b(A[12]|B[12]|C[12])\b/.exec(first); if (l) out.level = l[1];
        }
        if (s.kind === "grade" && (value || titleScore)) out.summary = value || plain(titleScore);
      } else if (s.kind === "summary" && value) out.summary = value;
      else if (s.kind === "corrected_text" && value) out.corrected_text = value.replace(/^```[^\n]*\n?|\n?```$/g, "").trim();
      else if (s.kind === "criteria") {
        const list = bullets(body).map(line => {
          const m = /^(.+?)\s*[:–—]\s*(A[12]|B[12]|C[12])([+−-]?)\s*[.:–—]?\s*(.*)$/.exec(line);
          return m && { name: m[1], level: m[2] + m[3], comment: m[4] };
        }).filter(Boolean);
        for (const row of table(body)) if (row.length >= 2 && level(row[1])) list.push({ name: row[0], level: row[1], comment: row.slice(2).join(" · ") });
        if (list.length) out.criteria = [...(out.criteria || []), ...list];
      } else if (s.kind === "errors" || s.kind === "upgrades") {
        const list = bullets(body).map(line => pair(line, s.kind === "upgrades")).filter(Boolean);
        for (const row of table(body)) {
          if (row.length < 2 || /^(?:erreur|incorrect|wrong|original|avant|from|[-: ]+$)/i.test(row[0])) continue;
          list.push(s.kind === "errors" ? { wrong: row[0], right: row[1], why: row.slice(2).join(" · "), category: "other" } : { from: row[0], to: row[1] });
        }
        if (list.length) out[s.kind] = [...(out[s.kind] || []), ...list];
        else if (s.kind === "errors" && /^(?:aucune (?:erreur|faute)|no (?:errors|mistakes))\b/i.test(value)) out.errors = [];
      } else if (["homework", "strengths"].includes(s.kind)) {
        const list = bullets(body); if (list.length) out[s.kind] = [...(out[s.kind] || []), ...list];
      }
    }
    if (!out.summary && sections[0].lines.some(x => x.trim())) out.summary = plain(sections[0].lines.join("\n"));
    if (Object.keys(out).length === 1) return { format: "text", summary: plain(selected) };
    if (out.score20 == null && !sections.some(s => s.kind && s.kind !== "intro")) out.format = "text";
    return out;
  }
  window.TCFWritingReview = { parse };
})();
