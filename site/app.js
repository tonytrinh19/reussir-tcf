/* Réussir le TCF — app logic. Curriculum content lives in data.js. */
(function () {
  "use strict";
  const T = window.TCF;
  const viewEl = document.getElementById("view");
  const footEl = document.getElementById("rail-foot");
  const toastEl = document.getElementById("toast");

  /* =============== helpers =============== */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NB = " ";
  const typo = (s) => esc(s).replace(/ ([?!:;»])/g, NB + "$1").replace(/« /g, "«" + NB);
  const arr = (x) => (Array.isArray(x) ? x : []);
  const str = (x) => (x == null ? "" : String(x));
  const clone = (o) => JSON.parse(JSON.stringify(o || {}));
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => ymd(new Date());
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const dow = (s) => (parse(s).getDay() + 6) % 7;
  const mondayOf = (s) => addDays(s, -dow(s));
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const DAYS_SHORT = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
  const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const frDate = (s) => { const d = parse(s); const n = d.getDate(); return `${DAYS[dow(s)]} ${n === 1 ? "1er" : n} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const shortDate = (s) => { if (!s) return ""; const d = parse(s); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "x";
  const norm = (s) => String(s || "").normalize("NFC").toLowerCase()
    .replace(/[’‘ʼ`´]/g, "'").replace(/[«»“”"]/g, "").replace(/[,;:]/g, " ")
    .replace(/\s*'\s*/g, "'").replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ").replace(/^[\s.!?;:,¡¿]+|[\s.!?;:,]+$/g, "").trim();
  const bare = (s) => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe");
  const countWords = (s) => (String(s || "").match(/\S+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const paragraphs = (s) => String(s || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const pct = (x) => Math.round(x * 100) + "%";
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3600);
  }

  /* =============== light / dark (white by default; the choice stays in this browser) =============== */
  const ICON_MOON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.2 14.6A8.5 8.5 0 0 1 9.4 3.8a8.5 8.5 0 1 0 10.8 10.8z"/></svg>`;
  const ICON_SUN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>`;
  const isDark = () => document.documentElement.classList.contains("dark");
  function paintTheme() {
    const dark = isDark();
    document.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.innerHTML = dark ? `${ICON_SUN}<span>Light mode</span>` : `${ICON_MOON}<span>Dark mode</span>`;
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    });
  }
  function toggleTheme() {
    const dark = !isDark();
    document.documentElement.classList.toggle("dark", dark);
    lsSet("tcf-theme", dark ? "dark" : "light");
    paintTheme();
  }

  /* =============== store (claude.ai db, or this browser as a fallback) =============== */
  const COLLS = ["settings", "days", "drills", "srs", "cards", "writing", "errors", "homework", "speaking", "comp", "mocks"];
  const S = {};
  COLLS.forEach((c) => { S[c] = new Map(); });
  const LS_KEY = "tcf-reussir-data-v1";
  let backend = { kind: "loading" };
  let loaded = false;
  const pendingOps = [];
  const chains = new Map();

  function queue(key, fn) {
    const p = (chains.get(key) || Promise.resolve()).then(fn, fn);
    chains.set(key, p.catch(() => {}));
    return p;
  }
  function run(op) {
    const [kind, coll, id, data] = op;
    const key = coll + "/" + id;
    return queue(key, () => (kind === "set" ? backend.set(coll, id, data) : backend.del(coll, id))).catch((e) => {
      console.warn("Save failed", coll, id, e);
      toast(e && e.code === "quota_exceeded" ? "Storage is full. Delete old entries to keep saving." : "Couldn't save that change. Check your connection and try again.");
    });
  }
  function put(coll, id, data) {
    S[coll].set(id, data);
    scheduleRender();
    const op = ["set", coll, id, data];
    if (backend.kind === "loading") { pendingOps.push(op); return Promise.resolve(); }
    return run(op);
  }
  function remove(coll, id) {
    S[coll].delete(id);
    scheduleRender();
    const op = ["del", coll, id];
    if (backend.kind === "loading") { pendingOps.push(op); return Promise.resolve(); }
    return run(op);
  }
  const list = (coll) => [...S[coll].entries()].map(([id, v]) => Object.assign({ id }, v));
  function flushPending() { while (pendingOps.length) run(pendingOps.shift()); }

  function useLocal() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (_) { data = {}; }
    for (const c of COLLS) for (const [id, v] of Object.entries(data[c] || {})) if (!S[c].has(id)) S[c].set(id, v);
    const save = () => {
      try {
        const out = {};
        for (const c of COLLS) out[c] = Object.fromEntries(S[c]);
        localStorage.setItem(LS_KEY, JSON.stringify(out));
      } catch (_) {}
      return Promise.resolve();
    };
    backend = { kind: "local", set: save, del: save };
    loaded = true;
    flushPending();
    render(false);
  }

  function useDb(db) {
    let first = 0;
    for (const c of COLLS) {
      db.collection(c).onSnapshot((snap) => {
        const m = new Map();
        snap.docs.forEach((d) => { if (d.exists) m.set(d.id, d.data()); });
        S[c] = m;
        if (!loaded && ++first >= COLLS.length) loaded = true;
        scheduleRender();
      }, (err) => {
        console.warn("Subscription ended", c, err);
        if (err && err.code === "revoked") toast("This page lost access to its saved data. Reload to reconnect.");
      });
    }
    backend = {
      kind: "db",
      set: (c, id, data) => db.collection(c).doc(id).set(data),
      del: (c, id) => db.collection(c).doc(id).delete(),
    };
    flushPending();
    setTimeout(() => { if (!loaded) { loaded = true; scheduleRender(); } }, 6000);
    render(false);
  }

  /* =============== settings & derived state =============== */
  const DEFAULTS = { phase: 1, startDate: "", rate: 0.9, voice: "", fixes: {}, criteria: {} };
  function settings() {
    const s = S.settings.get("main") || {};
    const out = Object.assign({}, DEFAULTS, s);
    out.phase = Math.min(5, Math.max(1, Number(out.phase) || 1));
    out.startDate = out.startDate || todayStr();
    out.fixes = Object.assign({}, s.fixes || {});
    out.criteria = Object.assign({}, s.criteria || {});
    return out;
  }
  function saveSettings(patch) {
    const cur = clone(S.settings.get("main") || {});
    put("settings", "main", Object.assign(cur, patch));
  }
  function weekNo() {
    const s = settings();
    return Math.max(1, Math.floor(daysBetween(mondayOf(s.startDate), mondayOf(todayStr())) / 7) + 1);
  }
  const phaseInfo = () => T.PHASES[settings().phase - 1];

  const TOPIC = Object.fromEntries(T.TOPICS.map((t) => [t.id, t]));
  const THEME = Object.fromEntries(T.VOCAB.map((t) => [t.id, t]));
  const CAT = T.CATEGORIES;
  const catOf = (c) => (CAT[c] ? c : "autre");

  // Every Claude request starts from the TCF Canada spec in data.js, so grading and generated material follow TCF Canada.
  const TC = T.TCF_CANADA;
  const EXAM_BRIEF = "EXAM: " + TC.brief + " Score bands: " + TC.bands;
  const EE_RUBRIC = "TCF CANADA WRITING RULES: " + TC.ee.rules + " Correctors mark with standardized grids; the published criteria are: " + TC.ee.criteria.map(([n, d]) => `${n} (${d})`).join("; ") + ".";
  const EO_RUBRIC = "TCF CANADA SPEAKING RULES: " + TC.eo.rules + " Criteria: " + TC.eo.criteria.map(([n, d]) => `${n} (${d})`).join("; ") + ".";
  const PROFILE = EXAM_BRIEF + "\nLEARNER PROFILE: adult B1 learner of French preparing the TCF Canada, target NCLC 7 (B2) in all four skills. Write explanations in English. Known recurring errors: " + T.KNOWN_ERRORS.join("; ") + ".";

  /* =============== UI state =============== */
  const dayIndex = daysBetween("2026-01-01", todayStr());
  const ui = {
    day: null,
    drill: null,
    gen: {},
    prod: {},
    vocab: null,
    vDir: lsGet("tcf-vdir", "en-fr"),
    vTheme: "",
    vCount: 10,
    w: {
      task: "t1",
      idx: { t1: dayIndex, t2: dayIndex, t3: dayIndex },
      gen: {},
      text: { t1: lsGet("tcf-draft-t1", ""), t2: lsGet("tcf-draft-t2", ""), t3: lsGet("tcf-draft-t3", "") },
      checks: { t1: {}, t2: {}, t3: {} },
      viewing: null,
    },
    sp: {
      task: "t1",
      t2: dayIndex, t3: dayIndex,
      rubric: { t1: {}, t2: {}, t3: {} },
      notes: { t1: "", t2: "", t3: "" },
      trans: { t1: "", t2: "", t3: "" },
      fb: { t1: null, t2: null, t3: null },
      chat: null,
      chatIn: "",
      covered: {},
    },
    c: { skill: "ce", level: "", theme: "", set: { ce: null, co: null }, ans: { ce: {}, co: {} }, submitted: { ce: false, co: false }, saved: { ce: null, co: null }, plays: 0, playing: false, exam: false, script: false, cache: {}, failed: {}, inflight: {}, queued: false },
    form: {},
    confirm: "",
  };

  /* =============== Claude (sample capability) =============== */
  let sample = null;
  let claudeState = "pending"; // pending | ready | none | off
  const busy = {};
  const SAMPLE_COPY = {
    not_granted: "Claude isn't allowed on this page. Reload the page and choose Allow to use it.",
    sampling_disabled: "Claude isn't available for this account.",
    rate_limited: "Claude is busy or you've reached a usage limit. Try again in a minute.",
    session_expired: "Your claude.ai session expired. Sign in again, then reload.",
    refused: "Claude declined that request. Try rephrasing it.",
    invalid_json: "Claude's answer came back in the wrong shape. Try again.",
    prompt_too_large: "That's too much text for one request. Shorten it and try again.",
    empty_completion: "Claude returned nothing. Try again.",
  };
  async function ask(key, input, opts) {
    const o = opts || {};
    if (!sample) {
      toast(claudeState === "pending" ? "Still connecting to Claude. Try again in a moment." : "Claude features work when this page is opened on claude.ai.");
      return null;
    }
    if (busy[key]) return null;
    const ctl = new AbortController();
    busy[key] = ctl;
    render(true);
    try {
      const so = { signal: ctl.signal, cache: o.cache === undefined ? false : o.cache };
      if (o.tier) so.modelTier = o.tier;
      if (o.json === false) return (await sample(input, so)).text;
      return await sample.json(input, so);
    } catch (e) {
      const code = e && e.code;
      if (code !== "cancelled") toast(SAMPLE_COPY[code] || "Claude couldn't answer. Try again.");
      if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) { claudeState = "off"; sample = null; }
      return null;
    } finally {
      delete busy[key];
      render(true);
    }
  }
  const claudeOn = () => claudeState !== "off" && claudeState !== "none";
  // Claude buttons simply don't appear where Claude can't run (a copy opened outside claude.ai, or permission declined).
  function claudeBtn(key, act, label, attrs, cls) {
    if (busy[key]) return `<span class="row"><span class="small thinking">Claude is thinking</span><button class="btn sm" data-act="stop" data-key="${esc(key)}">Stop</button></span>`;
    if (!claudeOn()) return "";
    return `<button class="${cls || "btn"}" data-act="${act}" ${attrs || ""}>${label}</button>`;
  }

  /* =============== timer =============== */
  const timer = { total: 0, left: 0, base: 0, t0: 0, running: false, label: "", home: "", iv: 0, alerted: false };
  const timerRemaining = () => (timer.running ? timer.base - (Date.now() - timer.t0) / 1000 : timer.left);
  const timerStarted = () => timer.running || (timer.total > 0 && Math.abs(timer.left - timer.total) > 0.5);
  function fmtClock(sec) { const neg = sec < -0.5; const s = Math.abs(Math.round(sec)); return (neg ? "+" : "") + Math.floor(s / 60) + ":" + pad(s % 60); }
  function timerSet(sec, label, home) { timerPause(); timer.total = timer.left = sec; timer.label = label; timer.home = home; timer.alerted = false; }
  function timerStart() { if (timer.running || !timer.total) return; timer.base = timer.left; timer.t0 = Date.now(); timer.running = true; clearInterval(timer.iv); timer.iv = setInterval(paintTimer, 250); }
  function timerPause() { if (!timer.running) return; timer.left = timerRemaining(); timer.running = false; clearInterval(timer.iv); }
  function timerElapsedMin(home) { return timer.home === home && timerStarted() ? Math.max(1, Math.round((timer.total - timerRemaining()) / 60)) : null; }
  function paintTimer() {
    const r = timerRemaining();
    document.querySelectorAll("[data-timer]").forEach((el) => { el.textContent = fmtClock(r); el.classList.toggle("over", r < 0); });
    document.querySelectorAll("[data-timer-btn]").forEach((b) => { b.textContent = timer.running ? "Pause" : timerStarted() ? "Resume" : "Start"; });
    if (timer.running && r <= 0 && !timer.alerted) { timer.alerted = true; toast(`Time's up: ${timer.label}. The clock keeps counting overtime.`); }
    const steps = document.querySelectorAll(".steps li[data-until]");
    if (steps.length && timer.home === "speaking.t3") {
      const el = timer.total - r;
      const on = timerStarted();
      steps.forEach((li) => {
        const f = +li.dataset.from, u = +li.dataset.until;
        li.classList.toggle("active", on && el >= f && el < u);
        li.classList.toggle("past", on && el >= u);
      });
    }
  }
  function timerUI(home, label, presets) {
    const mine = timer.home === home;
    const cur = mine ? timer.total : presets[0][0];
    const clock = mine ? fmtClock(timerRemaining()) : fmtClock(presets[0][0]);
    const btn = mine && timer.running ? "Pause" : mine && timerStarted() ? "Resume" : "Start";
    return `<div class="timer">
      <span class="clock" ${mine ? "data-timer" : ""}>${clock}</span>
      <button class="btn sm primary" data-act="timer-toggle" data-home="${home}" data-sec="${cur}" data-label="${esc(label)}" ${mine ? "data-timer-btn" : ""}>${btn}</button>
      <button class="btn sm" data-act="timer-reset" data-home="${home}" data-sec="${cur}" data-label="${esc(label)}">Reset</button>
      <div class="seg" role="group" aria-label="Timer length">${presets.map((p) => `<button data-act="timer-preset" data-home="${home}" data-sec="${p[0]}" data-label="${esc(label)}" aria-pressed="${cur === p[0]}">${esc(p[1])}</button>`).join("")}</div>
    </div>`;
  }

  /* =============== plan helpers =============== */
  function planFor(phase, date) {
    const P = T.PLAN[phase];
    const d = dow(date);
    if (!P || d === 6) return null;
    return P.days[d] || null;
  }
  const blockKey = (phase, i) => `p${phase}b${i}`;
  // A day is judged against its plan as it was when ticked (doc.total), so later edits to the templates don't rewrite past days.
  function dayStats(date) {
    const doc = S.days.get(date);
    const phase = (doc && doc.phase) || settings().phase;
    const plan = planFor(phase, date);
    if (!plan) return null;
    const done = (doc && doc.done) || {};
    const total = (doc && doc.total) || plan.length;
    let n = 0;
    for (let i = 0; i < total; i++) if (done[blockKey(phase, i)]) n++;
    return { n, total, phase };
  }
  function setBlock(date, key, val) {
    const cur = S.days.get(date);
    const doc = cur ? clone(cur) : { phase: settings().phase, done: {} };
    doc.done = doc.done || {};
    if (val) doc.done[key] = true; else delete doc.done[key];
    doc.phase = doc.phase || settings().phase;
    const plan = planFor(doc.phase, date);
    if (plan) doc.total = plan.length;
    put("days", date, doc);
  }
  function autoTick(token) {
    const s = settings();
    const t = todayStr();
    const plan = planFor(s.phase, t);
    if (!plan) return;
    const cur = S.days.get(t);
    const doc = cur ? clone(cur) : { phase: s.phase, done: {} };
    doc.done = doc.done || {};
    const head = token.split(".")[0];
    for (let i = 0; i < plan.length; i++) {
      const go = plan[i][5];
      const key = blockKey(s.phase, i);
      if (doc.done[key]) continue;
      const loose = head === "vocab" && go.split(".")[0] === "vocab";
      if (loose || token === go || token.startsWith(go + ".")) {
        doc.done[key] = true;
        doc.phase = s.phase;
        doc.total = plan.length;
        put("days", t, doc);
        toast(`Ticked off in today's plan: ${plan[i][2]}.`);
        return;
      }
    }
  }
  // A day counts toward the streak only when every block in its plan is ticked.
  function dayComplete(date) { const st = dayStats(date); return !!(st && st.total && st.n >= st.total); }
  function streak() {
    let d = todayStr();
    if (!dayComplete(d)) d = addDays(d, -1);
    let n = 0;
    for (let k = 0; k < 400; k++) {
      if (dayComplete(d)) n++;
      else if (dow(d) !== 6) break;
      d = addDays(d, -1);
    }
    return n;
  }

  /* =============== errors =============== */
  function allErrors() {
    const out = [];
    for (const w of list("writing")) {
      const W = T.WRITING[w.task];
      arr(w.fb && w.fb.errors).forEach((e) => out.push(Object.assign({}, e, { date: w.date, ts: w.ts || 0, src: (W ? W.name : "Écrit") + " écrit" })));
    }
    for (const sp of list("speaking")) {
      const P = T.SPEAKING[sp.task];
      arr(sp.fb && sp.fb.errors).forEach((e) => out.push(Object.assign({}, e, { date: sp.date, ts: sp.ts || 0, src: (P ? P.name : "Oral") + " oral" })));
    }
    for (const e of list("errors")) out.push(Object.assign({}, e, { src: "Logged by you", manual: true }));
    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  function errorCounts(days) {
    const since = days ? addDays(todayStr(), -days) : "";
    const m = {};
    for (const e of allErrors()) {
      if (since && (e.date || "") < since) continue;
      const c = catOf(e.category);
      if (!m[c]) m[c] = { n: 0, ex: e };
      m[c].n++;
    }
    return Object.entries(m).sort((a, b) => b[1].n - a[1].n);
  }
  function top3() { const r = errorCounts(21); return (r.length ? r : errorCounts(0)).slice(0, 3); }

  /* =============== drills: data =============== */
  function normItem(raw, kind, topic) {
    if (kind === "choice") return { kind, topic, q: raw[0], options: raw[1].slice(), a: [raw[1][0]], why: raw[2] || "" };
    return { kind: "type", topic, src: raw[0] || "", q: raw[1], a: Array.isArray(raw[2]) ? raw[2] : [raw[2]], why: raw[3] || "" };
  }
  function drillsFor(topic, set) {
    return list("drills").filter((d) => d.topic === topic && (!set || d.set === set) && d.src !== "retry").sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }
  function bestPct(topic, set) { const xs = drillsFor(topic, set).filter((d) => d.total); return xs.length ? Math.max(...xs.map((d) => d.score / d.total)) : 0; }
  function perfectDays(topic, set, p) { return new Set(drillsFor(topic, set).filter((d) => d.total && d.score / d.total >= p - 1e-9).map((d) => d.date)).size; }
  function writingZero(cat) {
    const ws = list("writing").filter((w) => w.fb && Array.isArray(w.fb.errors)).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 2);
    if (ws.length < 2) return { ok: false, note: `${ws.length}/2 corrected writing submissions so far` };
    const bad = ws.reduce((n, w) => n + w.fb.errors.filter((e) => e.category === cat).length, 0);
    return { ok: bad === 0, note: bad ? `${bad} ${CAT[cat].toLowerCase()} error${bad > 1 ? "s" : ""} in your last 2 submissions` : "Clean in your last 2 submissions" };
  }
  const prodMet = (topic) => list("drills").some((d) => d.topic === topic && d.set === "prod" && d.score >= 1);
  function topicMastery(tp) {
    const c = tp.criterion;
    const parts = [];
    if (c.set) {
      const n = drillsFor(tp.id, c.set).length;
      if (c.days) {
        const k = perfectDays(tp.id, c.set, c.pct);
        parts.push({ ok: k >= c.days, note: `${k}/${c.days} separate days at ${pct(c.pct)}` });
      } else {
        const b = bestPct(tp.id, c.set);
        parts.push({ ok: n > 0 && b >= c.pct - 1e-9, note: n ? `Best ${pct(b)} (target ${pct(c.pct)})` : "No attempts yet" });
      }
    }
    if (c.writing) parts.push(writingZero(c.writing));
    if (c.prod) parts.push({ ok: prodMet(tp.id), note: prodMet(tp.id) ? "Production task passed" : "Production task not passed yet" });
    return { ok: parts.every((p) => p.ok), parts, started: drillsFor(tp.id).length > 0 };
  }
  function checkAnswer(it, given) {
    const g = norm(given);
    if (it.a.some((a) => norm(a) === g)) return "ok";
    if (it.a.some((a) => bare(a) === bare(given))) return "accent";
    return "bad";
  }

  /* =============== drills: actions =============== */
  function startDrill(topicId, setId, opts) {
    const o = opts || {};
    let items, title, set;
    if (topicId === "mixed") {
      // Difficulty follows the phase: B1 in Phase 1, B1 + B1+ in Phase 2, B1+ and B2 from Phase 3.
      const phase = settings().phase;
      const allowed = phase <= 1 ? ["B1"] : phase === 2 ? ["B1", "B1+"] : ["B1+", "B2"];
      const pick = [["pronominaux", "pc", 4], ["imperatif", "main", 4], ["interrogative", "main", 4], ["subjonctif", "formation", 3]];
      items = [];
      pick.forEach(([tid, sid, n]) => {
        const sets = TOPIC[tid].sets;
        let pool = sets.filter((x) => allowed.includes(x.level));
        if (!pool.length) pool = [sets.find((x) => x.id === sid)];
        const all = pool.flatMap((st) => st.items.map((r) => normItem(r, st.kind, tid)));
        items.push(...shuffle(all).slice(0, n));
      });
      items = shuffle(items);
      title = "Mixed review · " + allowed.join(" and ");
      setId = "main";
    } else {
      const tp = TOPIC[topicId];
      set = tp.sets.find((x) => x.id === setId) || tp.sets[0];
      setId = set.id;
      title = set.title;
      if (o.items) items = o.items;
      else if (o.gen && ui.gen[tp.id + "." + set.id]) items = ui.gen[tp.id + "." + set.id].slice();
      else items = shuffle(set.items.map((r) => normItem(r, set.kind, tp.id))).slice(0, set.take);
    }
    items = items.map((it) => Object.assign({}, it, it.kind === "choice" ? { order: shuffle(it.options.map((_, k) => k)) } : {}));
    ui.drill = { topic: topicId, set: setId, title, items, i: 0, results: [], given: "", checked: false, verdict: null, done: false, src: o.src || (o.gen ? "claude" : "bank"), saved: null };
    render(true);
    const el = document.getElementById("drill-area");
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function drillCheck() {
    const d = ui.drill;
    if (!d || d.checked || d.done) return;
    const it = d.items[d.i];
    const input = document.getElementById("drill-in");
    const given = input ? input.value : d.given;
    if (!given.trim()) { toast("Type your answer first."); return; }
    d.given = given;
    d.verdict = checkAnswer(it, given);
    d.checked = true;
    d.results[d.i] = { given, ok: d.verdict === "ok", verdict: d.verdict };
    render(true);
  }
  function drillPick(k) {
    const d = ui.drill;
    if (!d || d.checked || d.done) return;
    const it = d.items[d.i];
    d.given = it.options[k];
    d.verdict = k === 0 ? "ok" : "bad";
    d.checked = true;
    d.results[d.i] = { given: d.given, ok: k === 0, verdict: d.verdict };
    render(true);
  }
  function drillNext() {
    const d = ui.drill;
    if (!d || !d.checked) return;
    if (d.i + 1 >= d.items.length) { drillFinish(); return; }
    d.i++;
    d.given = "";
    d.checked = false;
    d.verdict = null;
    render(true);
  }
  function drillFinish() {
    const d = ui.drill;
    d.done = true;
    const score = d.results.filter((r) => r && r.ok).length;
    const id = uid();
    d.saved = id;
    const misses = d.items.map((it, k) => ({ it, r: d.results[k] || {} })).filter((x) => !x.r.ok).slice(0, 20)
      .map((x) => ({ q: x.it.q, src: x.it.src || "", given: str(x.r.given), a: x.it.a[0], topic: x.it.topic || d.topic }));
    put("drills", id, { topic: d.topic, set: d.set, date: todayStr(), ts: Date.now(), score, total: d.items.length, src: d.src, misses });
    if (d.src !== "retry") autoTick(`grammar.${d.topic}.${d.set}`);
    render(true);
  }
  function drillRetry() {
    const d = ui.drill;
    const items = d.items.filter((it, k) => !(d.results[k] && d.results[k].ok)).map((it) => Object.assign({}, it));
    if (!items.length) return;
    if (d.topic === "mixed") {
      ui.drill = { topic: "mixed", set: "main", title: "Retry misses", items: items.map((it) => Object.assign({}, it, it.kind === "choice" ? { order: shuffle(it.options.map((_, k) => k)) } : {})), i: 0, results: [], given: "", checked: false, verdict: null, done: false, src: "retry", saved: null };
      render(true);
      return;
    }
    startDrill(d.topic, d.set, { items, src: "retry" });
  }
  async function drillDispute(k) {
    const d = ui.drill;
    const it = d.items[k];
    const r = d.results[k];
    if (!it || !r) return;
    const prompt = `A French grammar drill item.\nCue shown to the learner: ${it.src || "(none)"}\nSentence with the gap: ${it.q}\nExpected answer(s) for the gap: ${it.a.join(" | ")}\nLearner's answer: ${r.given}\n\nIs the learner's answer also fully correct, natural French for this gap, given the cue? Be strict about accents, agreement and mood. Reply with only JSON: {"correct": true or false, "explanation": "one or two sentences in English"}`;
    const out = await ask("dispute-" + k, prompt, { tier: "quick" });
    if (!out) return;
    r.claude = { correct: !!out.correct, explanation: str(out.explanation) };
    if (out.correct && !r.ok) {
      r.ok = true;
      r.overturned = true;
      const cur = S.drills.get(d.saved);
      if (cur) put("drills", d.saved, Object.assign(clone(cur), { score: d.results.filter((x) => x && x.ok).length }));
    }
    render(true);
  }
  async function drillGenerate(topicId, setId) {
    const tp = TOPIC[topicId];
    const set = tp.sets.find((s) => s.id === setId) || tp.sets[0];
    const ex = set.items[0];
    const fmt = set.kind === "choice"
      ? `Each item: {"q": "French sentence with ___ for the gap", "options": ["the correct option", "distractor", "distractor"], "why": "short English explanation"}. The FIRST option must be the correct one.`
      : `Each item: {"src": "optional cue or source sentence shown above the question (can be empty)", "q": "French sentence with exactly one ___ gap, with the infinitive or cue in parentheses when needed", "a": ["every acceptable answer for the gap, exactly as it should be typed"], "why": "short English explanation"}.`;
    const example = set.kind === "choice" ? JSON.stringify({ q: ex[0], options: ex[1], why: ex[2] }) : JSON.stringify({ src: ex[0], q: ex[1], a: ex[2], why: ex[3] });
    const avoid = set.items.slice(0, 8).map((x) => (set.kind === "choice" ? x[0] : x[1] === "___" ? x[0] : x[1])).join(" / ");
    const lvl = set.level || "B1";
    const levelNote = lvl === "B2"
      ? "Target level B2: longer sentences with subordinate clauses, compound tenses and TCF-register vocabulary (work, housing, immigration, environment, public debate). Include the traps a B2 grader looks for."
      : lvl === "B1+" ? "Target level B1+: everyday sentences, each with one genuinely tricky point." : "Target level B1: short, clear sentences that isolate the structure, but not trivial.";
    const prompt = `Write ${set.take} NEW practice items for a French grammar drill.\nTopic: ${tp.title} (${tp.en}). What to master: ${tp.master}\nDrill: ${set.title}.\n${levelNote}\n${PROFILE}\nRules: use TCF Canada-style contexts (work, housing, immigration paperwork, transit, environment, daily life in Canada). Vary persons and verbs. Every item must have one clearly correct answer; list every acceptable variant. Don't reuse these sentences: ${avoid}.\n${fmt}\n${set.hint ? "Item format note: " + set.hint + "\n" : ""}Example item: ${example}\nReply with only JSON: {"items": [ ... ]}`;
    const out = await ask("gen-" + topicId + "." + setId, prompt);
    if (!out) return;
    const items = arr(out.items).map((x) => {
      if (!x || typeof x.q !== "string") return null;
      if (set.kind === "choice") return Array.isArray(x.options) && x.options.length >= 2 ? { kind: "choice", topic: topicId, q: x.q, options: x.options.map(str), a: [str(x.options[0])], why: str(x.why) } : null;
      return x.q.includes("___") && Array.isArray(x.a) && x.a.length ? { kind: "type", topic: topicId, src: str(x.src), q: x.q, a: x.a.map(str), why: str(x.why) } : null;
    }).filter(Boolean);
    if (!items.length) { toast("Claude's items didn't come back in a usable shape. Try again."); return; }
    ui.gen[topicId + "." + set.id] = items;
    startDrill(topicId, set.id, { gen: true });
  }
  async function prodCheck(topicId) {
    const tp = TOPIC[topicId];
    const st = ui.prod[topicId] || { text: "" };
    const text = str(st.text).trim();
    if (text.length < 10) { toast("Write your answer first."); return; }
    const prompt = `You are a French teacher checking a B1→B2 learner's production exercise.\nExercise: ${tp.prod.prompt}\nPass criterion: ${tp.prod.check}.\n${PROFILE}\nLearner's answer:\n"""\n${text}\n"""\nReply with only JSON: {"pass": true or false, "comment": "2–3 sentences in English on whether the criterion is met and why", "errors": [{"wrong": "exact excerpt", "right": "correction", "why": "short English explanation"}], "improved": "a corrected, improved version in French"}`;
    const out = await ask("prod-" + topicId, prompt);
    if (!out) return;
    const fb = { pass: !!out.pass, comment: str(out.comment), errors: arr(out.errors).filter((e) => e && e.wrong).slice(0, 15).map((e) => ({ wrong: str(e.wrong), right: str(e.right), why: str(e.why) })), improved: str(out.improved) };
    ui.prod[topicId] = { text, fb };
    put("drills", uid(), { topic: topicId, set: "prod", date: todayStr(), ts: Date.now(), score: fb.pass ? 1 : 0, total: 1, src: "claude" });
    if (fb.pass) autoTick(`grammar.${topicId}`);
    render(true);
  }

  /* =============== vocabulary =============== */
  const IV = [1, 2, 4, 7, 14, 30];
  const DECK = new Map();
  T.VOCAB.forEach((th) => th.cards.forEach((c) => {
    const base = th.id + "--" + slug(c[0]);
    let id = base, k = 2;
    while (DECK.has(id)) id = base + "-" + k++;
    DECK.set(id, { id, fr: c[0], en: c[1], ex: c[2] || "", theme: th.id });
  }));
  function allCards() {
    const m = new Map(DECK);
    for (const [id, c] of S.cards) if (c && c.fr) m.set(id, Object.assign({ id }, c));
    return m;
  }
  const themeCards = (th, cards) => [...(cards || allCards()).values()].filter((c) => c.theme === th);
  function dueIds(cards) {
    const t = todayStr();
    const m = cards || allCards();
    return [...S.srs.entries()].filter(([id, st]) => m.has(id) && st && st.due && st.due <= t).map(([id]) => id);
  }
  function srsGrade(id, ok) {
    const t = todayStr();
    const st = clone(S.srs.get(id) || { stage: 0, lapses: 0, reps: 0 });
    st.reps = (st.reps || 0) + 1;
    st.last = t;
    if (!ok) { st.lapses = (st.lapses || 0) + 1; st.pri = true; st.pStreak = 0; st.stage = 0; st.due = addDays(t, 1); }
    else if (st.pri) {
      st.pStreak = (st.pStreak || 0) + 1;
      if (st.pStreak >= 2) { st.pri = false; st.stage = 1; st.due = addDays(t, IV[1]); } else st.due = addDays(t, 1);
    } else { st.stage = Math.min((st.stage || 0) + 1, IV.length - 1); st.due = addDays(t, IV[st.stage]); }
    put("srs", id, st);
  }
  function srsLearn(id, known) {
    const t = todayStr();
    put("srs", id, { stage: known ? 2 : 0, due: addDays(t, known ? IV[2] : IV[0]), lapses: 0, reps: 1, last: t, pri: false, learned: t });
  }
  function vocabStart(mode) {
    const cards = allCards();
    let ids;
    if (mode === "review") {
      ids = shuffle(dueIds(cards));
      const pri = ids.filter((id) => S.srs.get(id).pri);
      ids = pri.concat(ids.filter((id) => !S.srs.get(id).pri)).slice(0, 100);
      if (!ids.length) { toast("Nothing is due today."); return; }
    } else {
      const th = ui.vTheme || defaultTheme();
      ids = themeCards(th, cards).filter((c) => !S.srs.has(c.id)).slice(0, ui.vCount).map((c) => c.id);
      if (!ids.length) { toast("No new cards left in this theme. Build more with Claude, or pick another theme."); return; }
    }
    ui.vocab = { mode, queue: ids, i: 0, shown: mode === "new", ok: 0, miss: 0, requeued: {}, finished: false };
    render(true);
    window.scrollTo(0, 0);
  }
  function vocabAdvance() {
    const v = ui.vocab;
    v.i++;
    v.shown = v.mode === "new";
    if (v.i >= v.queue.length) { v.finished = true; autoTick(v.mode === "review" ? "vocab.review" : "vocab.new"); }
    render(true);
  }
  function vocabGrade(ok) {
    const v = ui.vocab;
    if (!v || v.finished) return;
    const id = v.queue[v.i];
    if (v.mode === "new") { srsLearn(id, !ok); v.ok++; vocabAdvance(); return; }
    if (!v.shown) return;
    srsGrade(id, ok);
    if (ok) v.ok++; else { v.miss++; if (!v.requeued[id]) { v.requeued[id] = true; v.queue.push(id); } }
    vocabAdvance();
  }
  function defaultTheme() {
    const s = settings();
    const cards = allCards();
    const order = T.PHASES[s.phase - 1].vocab.concat(T.VOCAB.map((t) => t.id));
    return order.find((th) => THEME[th] && themeCards(th, cards).some((c) => !S.srs.has(c.id))) || order[0] || T.VOCAB[0].id;
  }
  async function vocabBuild(theme) {
    const th = THEME[theme];
    if (!th) return;
    const have = themeCards(theme).map((c) => c.fr);
    const prompt = `Create 20 French vocabulary flashcards for the TCF Canada theme "${th.label}" (${th.en}) for a B1→B2 learner.\nPrioritize collocations and verb + preposition pairs over isolated nouns. Include 2–3 connectors or linking phrases useful for arguing about this topic, 1–2 idiomatic expressions, and 2 B1→B2 "sophistication swaps" (for those, the English side reads "B2 upgrade of: <the plain B1 phrase in French>").\nDon't repeat any of: ${have.join("; ")}.\nEach card: {"fr": "French, with the article or preposition when useful", "en": "short English meaning", "ex": "one natural French example sentence, max 18 words"}.\nReply with only JSON: {"cards": [ ... ]}`;
    const out = await ask("build-" + theme, prompt);
    if (!out) return;
    const seen = new Set(have.map((s) => norm(s)));
    let n = 0;
    for (const c of arr(out.cards).slice(0, 30)) {
      if (!c || !c.fr || !c.en || seen.has(norm(c.fr))) continue;
      seen.add(norm(c.fr));
      put("cards", "c-" + uid(), { fr: str(c.fr), en: str(c.en), ex: str(c.ex), theme, created: todayStr(), by: "claude" });
      n++;
    }
    toast(n ? `Added ${n} cards to ${th.label}.` : "No new cards came back. Try again.");
  }

  /* =============== writing =============== */
  function wPrompt(task) {
    const W = T.WRITING[task];
    if (ui.w.gen[task]) return ui.w.gen[task];
    const p = W.prompts[((ui.w.idx[task] % W.prompts.length) + W.prompts.length) % W.prompts.length];
    return typeof p === "string" ? { q: p } : p;
  }
  let draftTimer = 0;
  function onWText(el) {
    const task = ui.w.task;
    ui.w.text[task] = el.value;
    updateMeters();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => lsSet("tcf-draft-" + task, ui.w.text[task]), 400);
  }
  function meterHTML(words, min, max, label) {
    const top = Math.max(max * 1.25, words, 1);
    const st = words === 0 ? "" : words < min ? "under" : words > max ? "over" : "in";
    return { cls: st, html: `<div class="lab"><span>${label}</span><span><b>${words}</b> / ${min}–${max}</span></div><div class="track"><div class="zone" style="left:${(min / top) * 100}%;width:${((max - min) / top) * 100}%"></div><div class="fill" style="width:${Math.min(100, (words / top) * 100)}%"></div></div>` };
  }
  function updateMeters() {
    const el = document.getElementById("w-meter");
    if (!el) return;
    const task = ui.w.task, W = T.WRITING[task];
    const text = ui.w.text[task] || "";
    const n = countWords(text);
    const m = meterHTML(n, W.min, W.max, "Words");
    el.className = "meter " + m.cls;
    el.innerHTML = m.html;
    const pe = document.getElementById("w-paras");
    if (pe && W.paras) {
      // TCF Canada marks Tâche 3 in two parts: the first paragraph is Partie 1, the rest is Partie 2.
      const ps = paragraphs(text);
      const counts = [ps[0] ? countWords(ps[0]) : 0, ps.slice(1).reduce((n2, x) => n2 + countWords(x), 0)];
      pe.innerHTML = W.paras.map((P, k) => { const mm = meterHTML(counts[k] || 0, P.min, P.max, P.label); return `<div class="meter ${mm.cls}">${mm.html}</div>`; }).join("")
        + `<p class="small muted" style="grid-column:1/-1">Your first paragraph is Partie 1. Everything after it counts as Partie 2: in your template, the opinion paragraph plus a short conclusion.</p>`;
    }
    const wc = document.getElementById("chk-words");
    if (wc) wc.checked = n >= W.min && n <= W.max;
  }
  function cleanCriteria(xs) {
    return arr(xs).filter((c) => c && c.name).slice(0, 8).map((c) => ({ name: str(c.name), level: str(c.level).slice(0, 6), comment: str(c.comment) }));
  }
  function criteriaTable(list, note) {
    if (!list || !list.length) return "";
    return `<div class="stack tight"><p class="h3">TCF Canada criteria</p><div class="table-wrap"><table class="crit"><tbody>${list.map((c) => `<tr><th>${esc(c.name)}</th><td><span class="lvl ${/^(B2|C)/.test(c.level) ? "b2" : ""}">${esc(c.level || "—")}</span></td><td>${esc(c.comment)}</td></tr>`).join("")}</tbody></table></div>${note ? `<p class="small muted">${esc(note)}</p>` : ""}</div>`;
  }
  function cleanErrors(xs) {
    return arr(xs).filter((e) => e && e.wrong).slice(0, 30).map((e) => ({ wrong: str(e.wrong), right: str(e.right), category: catOf(e.category), why: str(e.why) }));
  }
  function cleanFb(o, task) {
    const c = o.compliance || {};
    const sc = Number(o.score20);
    const score20 = Number.isFinite(sc) ? Math.max(0, Math.min(20, Math.round(sc))) : null;
    const fb = {
      level: str(o.level).slice(0, 8), score20, nclc: score20 != null ? nclcLabel(nclcOf("ee", score20)) : str(o.nclc).slice(0, 10), summary: str(o.summary),
      criteria: cleanCriteria(o.criteria),
      compliance: { on_topic: c.on_topic !== false, length_ok: c.length_ok !== false, register_ok: c.register_ok !== false, notes: str(c.notes) },
      errors: cleanErrors(o.errors),
      corrected: str(o.corrected_text),
      upgrades: arr(o.upgrades).filter((u) => u && u.from && u.to).slice(0, 6).map((u) => ({ from: str(u.from), to: str(u.to) })),
      strengths: arr(o.strengths).map(str).filter(Boolean).slice(0, 4),
      homework: arr(o.homework).map(str).filter(Boolean).slice(0, 3),
    };
    if (task === "t3") { const t3 = o.tache3 || {}; fb.tache3 = { compared_both: !!t3.compared_both, opinion_after_comparison: !!t3.opinion_after_comparison, notes: str(t3.notes) }; }
    return fb;
  }
  async function writingCorrect() {
    const task = ui.w.task, W = T.WRITING[task];
    const text = ui.w.text[task] || "";
    const words = countWords(text);
    if (words < 20) { toast("Write at least a few sentences first."); return; }
    const p = wPrompt(task);
    const docs = task === "t3" && p.docs ? `\nDOCUMENT 1 (${p.docs[0].who}): ${p.docs[0].text}\nDOCUMENT 2 (${p.docs[1].who}): ${p.docs[1].text}` : "";
    const ps = paragraphs(text);
    const parts = task === "t3" ? `\nLearner's part 1 (first paragraph): ${ps[0] ? countWords(ps[0]) : 0} words (TCF Canada: 40–60). Part 2 (everything after it): ${ps.slice(1).reduce((n, x) => n + countWords(x), 0)} words (TCF Canada: 80–120).` : "";
    const t3 = task === "t3" ? `"tache3": {"compared_both": true or false (part 1 presents and compares BOTH documents' viewpoints), "opinion_after_comparison": true or false (the learner's own position comes in part 2, after the comparison), "notes": "one sentence"}, ` : "";
    const critNames = TC.ee.criteria.map(([n]) => n);
    const prompt = `You are a certified TCF Canada Expression écrite corrector (France Éducation International) and a French teacher. Correct the learner's text and grade it strictly the way the TCF Canada does, using the TCF Canada rules, criteria and score bands below. Don't use DELF, TEF or TCF tout public grading.\n\n${EE_RUBRIC}\n\nTASK: ${W.name}, ${W.kind}. ${W.expected} Required length: ${W.min}–${W.max} words. Learner's word count (anything between two spaces): ${words}.${parts}\nPROMPT: ${p.q}${docs}\n\n${PROFILE}\n\nLEARNER'S TEXT:\n"""\n${text}\n"""\n\nGrade this task on the TCF Canada 0–20 scale. If the word count is outside the range, the text is off-topic or the instructions are ignored, cap the score accordingly (it can be A1 non atteint). List every grammar, spelling, agreement and word-choice error, most important first (max 25). Quote "wrong" exactly as it appears in the text, just enough to locate it. Error categories (use the id): ${Object.keys(CAT).join(", ")}.\nReply with only JSON:\n{"score20": integer from 0 to 20 for this task on the TCF Canada scale, "level": "A1 | A2 | B1 | B2 | C1 | C2 (the level that score corresponds to)", "summary": "2–3 sentences in English", "criteria": [{"name": "one of: ${critNames.join(" | ")}", "level": "A1 | A2 | B1 | B2 | C1 | C2", "comment": "one sentence in English"}] (one entry per criterion, in that order), "compliance": {"on_topic": true or false, "length_ok": true or false, "register_ok": true or false, "notes": "one sentence"}, ${t3}"errors": [{"wrong": "...", "right": "...", "category": "...", "why": "short English explanation"}], "corrected_text": "the full corrected text, keeping the learner's ideas and paragraph breaks", "upgrades": [{"from": "a B1 phrase from the text", "to": "a B2 alternative"}], "strengths": ["up to 3"], "homework": ["1–3 short, concrete follow-up tasks for tomorrow"]}`;
    const out = await ask("w-correct", prompt);
    if (!out) return;
    const fb = cleanFb(out, task);
    const id = uid();
    put("writing", id, { task, date: todayStr(), ts: Date.now(), prompt: p.q, docs: p.docs || null, text, words, minutes: timerElapsedMin("writing." + task), fb });
    fb.homework.forEach((h) => put("homework", uid(), { text: h, created: todayStr(), ts: Date.now(), done: false, src: `${W.name} correction` }));
    ui.w.viewing = id;
    autoTick("writing." + task);
    render(true);
    const fe = document.getElementById("w-fb");
    if (fe) fe.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function writingSave() {
    const task = ui.w.task;
    const text = ui.w.text[task] || "";
    if (countWords(text) < 5) { toast("There's nothing to save yet."); return; }
    const p = wPrompt(task);
    const id = uid();
    put("writing", id, { task, date: todayStr(), ts: Date.now(), prompt: p.q, docs: p.docs || null, text, words: countWords(text), minutes: timerElapsedMin("writing." + task), fb: null });
    ui.w.viewing = id;
    autoTick("writing." + task);
    toast("Saved to your writing history.");
    render(true);
  }
  async function writingGenPrompt() {
    const task = ui.w.task, W = T.WRITING[task];
    let prompt;
    if (task === "t3") {
      prompt = `${EXAM_BRIEF}\n${EE_RUBRIC}\n\nCreate one TCF Canada Expression écrite Tâche 3 subject: a debatable "fait de société" question and two short, simple opinion documents of about 90 words each (80–100), in French, taking clearly opposing views, each signed by a plausible person or organization. TCF Canada subjects often touch on life in Canada, work, immigration or expatriation. Avoid these topics: ${W.prompts.map((x) => x.q).join(" / ")}.\nReply with only JSON: {"q": "the question in French", "en": "the question in English", "docs": [{"who": "author, role", "text": "document 1"}, {"who": "author, role", "text": "document 2"}]}`;
    } else {
      prompt = `${EXAM_BRIEF}\n${EE_RUBRIC}\n\nCreate one new TCF Canada Expression écrite ${W.name} prompt in French, following the official task description exactly (${W.kind}; ${W.expected} ${W.min}–${W.max} words). Name the recipient(s) and their status${task === "t2" ? " and state the objective (for example complain, persuade, reconcile, recommend)" : ""}. Everyday context, often life in Canada or settling in a new country. Avoid repeating: ${W.prompts.slice(0, 5).join(" / ")}.\nReply with only JSON: {"q": "the prompt in French", "en": "short English gloss"}`;
    }
    const out = await ask("w-gen", prompt);
    if (!out || !out.q) return;
    const g = { q: str(out.q), en: str(out.en) };
    if (task === "t3") {
      const d = arr(out.docs);
      if (d.length < 2 || !d[0].text || !d[1].text) { toast("The documents didn't come back complete. Try again."); return; }
      g.docs = [{ who: str(d[0].who), text: str(d[0].text) }, { who: str(d[1].who), text: str(d[1].text) }];
    }
    ui.w.gen[task] = g;
    render(true);
  }

  /* =============== speaking =============== */
  function spPrompt(task) {
    const P = T.SPEAKING[task];
    if (task === "t2") return P.scenarios[ui.sp.t2 % P.scenarios.length];
    if (task === "t3") return P.prompts[ui.sp.t3 % P.prompts.length][0];
    return "Présentez-vous.";
  }
  function spSave(task) {
    const P = T.SPEAKING[task];
    const rub = ui.sp.rubric[task] || {};
    const doc = { task, date: todayStr(), ts: Date.now(), prompt: spPrompt(task), rubric: Object.assign({}, rub), score: P.rubric ? P.rubric.filter((r) => rub[r[0]]).length : null, of: P.rubric ? P.rubric.length : null, notes: ui.sp.notes[task] || "", transcript: ui.sp.trans[task] || "", fb: ui.sp.fb[task] || null };
    if (task === "t2" && ui.sp.chat) doc.transcript = ui.sp.chat.turns.filter((t) => t.role === "user" && !t.rules).map((t) => t.content).join("\n");
    put("speaking", uid(), doc);
    autoTick("speaking." + task);
    ui.sp.rubric[task] = {};
    ui.sp.notes[task] = "";
    ui.sp.trans[task] = "";
    ui.sp.fb[task] = null;
    if (task === "t2") { ui.sp.chat = null; ui.sp.covered = {}; }
    toast("Attempt saved.");
    render(true);
  }
  async function spFeedback(task) {
    const P = T.SPEAKING[task];
    const text = str(ui.sp.trans[task]).trim();
    if (text.length < 20) { toast("Paste or type what you said first."); return; }
    const structure = (P.steps ? P.steps.map((s) => s.label) : P.structure).join(" → ");
    const crit = TC.eo.criteria.filter(([n]) => task === "t2" || n !== "Interaction").map(([n]) => n);
    const prompt = `You are a certified TCF Canada Expression orale examiner (France Éducation International). Grade strictly the way the TCF Canada does, using the rules and criteria below; don't use DELF, TEF or TCF tout public grading. The learner practised ${P.name} (${P.kind}) and pasted a transcript of what they said. It may come from phone dictation, so ignore punctuation and capitalization, and don't judge pronunciation, which a transcript can't show.\n\n${EO_RUBRIC}\n\nPrompt: ${spPrompt(task)}\nExpected structure: ${structure}\n${PROFILE}\nTranscript:\n"""\n${text}\n"""\nReply with only JSON: {"level": "A1 | A2 | B1 | B2 | C1 | C2", "summary": "2–3 sentences in English", "criteria": [{"name": "one of: ${crit.join(" | ")}", "level": "A1 | A2 | B1 | B2 | C1 | C2", "comment": "one sentence in English"}] (one entry per criterion, in that order), "structure": [{"step": "step name", "done": true or false, "comment": "short"}], "errors": [{"wrong": "...", "right": "...", "category": "one of: ${Object.keys(CAT).join(", ")}", "why": "short English explanation"}], "next_time": ["2–3 concrete things to do differently"]}`;
    const out = await ask("sp-fb-" + task, prompt);
    if (!out) return;
    ui.sp.fb[task] = { level: str(out.level), summary: str(out.summary), criteria: cleanCriteria(out.criteria), structure: arr(out.structure).filter((s) => s && s.step).map((s) => ({ step: str(s.step), done: !!s.done, comment: str(s.comment) })), errors: cleanErrors(out.errors), next: arr(out.next_time).map(str).filter(Boolean) };
    render(true);
  }
  function chatRules() {
    return `You are the examiner in the TCF Canada Expression orale (France Éducation International), Tâche 2, exercice en interaction: after 2 minutes of preparation the candidate has 3 min 30 to obtain information from you by asking questions, in an everyday situation where the prompt sets both roles. You play this role: ${spPrompt("t2")} The candidate asks you questions to get information. Stay in role for the whole conversation. Answer in natural spoken French, 1–3 sentences, inventing consistent, realistic details (prices in dollars, Canadian places). Don't correct the candidate or comment on their French during the role-play. If they write in English, answer in French anyway. Begin now with one short greeting in role, and nothing else.`;
  }
  async function chatCall() {
    const c = ui.sp.chat;
    const turns = c.turns.map((t) => ({ role: t.role, content: t.content }));
    const text = await ask("chat", turns, { json: false, tier: "quick", cache: false });
    if (text == null || ui.sp.chat !== c) return;
    c.turns.push({ role: "assistant", content: text });
    render(true);
    scrollChat();
  }
  function chatStart() {
    ui.sp.chat = { turns: [{ role: "user", content: chatRules(), rules: true }] };
    ui.sp.fb.t2 = null;
    chatCall();
  }
  function chatSend() {
    const c = ui.sp.chat;
    const el = document.getElementById("chat-in");
    const v = str(el ? el.value : ui.sp.chatIn).trim();
    if (!c || !v || busy.chat) return;
    c.turns.push({ role: "user", content: v });
    if (c.turns.length > 40) c.turns.splice(1, 2);
    ui.sp.chatIn = "";
    chatCall();
  }
  function scrollChat() { const el = document.getElementById("chat-log"); if (el) el.scrollTop = el.scrollHeight; }
  async function chatEnd() {
    const c = ui.sp.chat;
    const qs = c ? c.turns.filter((t) => t.role === "user" && !t.rules).map((t) => t.content) : [];
    if (!qs.length) { toast("Ask at least one question first."); return; }
    const crit = TC.eo.criteria.map(([n]) => n);
    const prompt = `You are a certified TCF Canada Expression orale examiner (France Éducation International). Evaluate the candidate's questions from a TCF Canada Tâche 2 (exercice en interaction) role-play, strictly by TCF Canada standards.\n\n${EO_RUBRIC}\n\nScenario: ${spPrompt("t2")}\nCandidate's messages, in order:\n${qs.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\n${PROFILE}\nCheck the number of questions (aim for 5–6 or more), variety (open vs yes/no), register (vouvoiement), correct question formation (especially embedded questions: no inversion, conjugated verb; and correct inversion in direct questions), and coverage of price, place, schedule and conditions. The exchange was typed, so don't judge pronunciation or fluency.\nReply with only JSON: {"count": number, "coverage": {"prix": true or false, "lieu": true or false, "horaires": true or false, "conditions": true or false}, "summary": "2–3 sentences in English", "criteria": [{"name": "one of: ${crit.join(" | ")}", "level": "A1 | A2 | B1 | B2 | C1 | C2", "comment": "one sentence in English"}] (one entry per criterion except Aisance, in that order), "errors": [{"wrong": "...", "right": "...", "category": "interrogative, or another id from: ${Object.keys(CAT).join(", ")}", "why": "short English explanation"}], "better_questions": ["3 stronger B2-level questions they could have asked"]}`;
    const out = await ask("chat-end", prompt);
    if (!out) return;
    const cov = out.coverage || {};
    ui.sp.fb.t2 = { level: "", summary: str(out.summary), criteria: cleanCriteria(out.criteria), count: Number(out.count) || qs.length, coverage: { prix: !!cov.prix, lieu: !!cov.lieu, horaires: !!cov.horaires, conditions: !!cov.conditions }, errors: cleanErrors(out.errors), next: arr(out.better_questions).map(str).filter(Boolean), better: true };
    render(true);
  }

  /* =============== comprehension =============== */
  const synth = (() => { try { return window.speechSynthesis || null; } catch (_) { return null; } })();
  // macOS novelty and Eloquence voices sound robotic: rank them last. Neural voices (Edge "Natural"),
  // Apple Premium/Enhanced and Chrome's Google voices sound far more human.
  const ROBOTIC = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|eddy|flo|fred|good news|grandma|grandpa|jester|junior|kathy|organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox)\b|eloquence|compact|espeak/i;
  function voiceScore(v) {
    const n = v.name;
    let s = 0;
    if (/natural|neural/i.test(n)) s += 60;
    if (/premium/i.test(n)) s += 50;
    if (/enhanced|amélior/i.test(n)) s += 40;
    if (/google/i.test(n)) s += 30;
    if (/online/i.test(n)) s += 5;
    if (ROBOTIC.test(n)) s -= 60;
    return s;
  }
  function voiceTag(v) {
    const n = v.name;
    if (/natural|neural/i.test(n)) return "natural";
    if (/premium/i.test(n)) return "premium";
    if (/enhanced|amélior/i.test(n)) return "enhanced";
    if (/google/i.test(n)) return "good";
    if (ROBOTIC.test(n)) return "robotic";
    return "basic";
  }
  function frVoices() {
    try {
      return synth ? synth.getVoices().filter((v) => /^fr([-_]|$)/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name)) : [];
    } catch (_) { return []; }
  }
  if (synth) { try { synth.addEventListener("voiceschanged", () => { if (routeView() === "comp") render(false); }); } catch (_) {} }
  const isCA = (v) => /[-_]CA$/i.test(v.lang);
  // One voice for everything: the most natural French voice this browser offers (France French wins a tie).
  function bestVoice() {
    const vs = frVoices().slice().sort((x, y) => voiceScore(y) - voiceScore(x) || (isCA(x) ? 1 : 0) - (isCA(y) ? 1 : 0) || x.name.localeCompare(y.name));
    return vs[0] || null;
  }
  // Spell out what text-to-speech reads badly (times, prices, abbreviations).
  function ttsText(s) {
    return String(s)
      .replace(/(\d{1,2})\s?h\s?(\d{2})(?!\d)/g, "$1 heures $2")
      .replace(/(\d{1,2})\s?h(?![a-zà-ÿ\d])/gi, "$1 heures")
      .replace(/\b1 heures\b/g, "une heure")
      .replace(/(\d+(?:[.,]\d+)?)\s?\$/g, "$1 dollars")
      .replace(/(\d+)\s?%/g, "$1 pour cent")
      .replace(/\b1er\b/g, "premier").replace(/\b1re\b/g, "première")
      .replace(/\bM\.(?=\s)/g, "Monsieur").replace(/\bMme(?=\s)/g, "Madame").replace(/\bDr\.?(?=\s)/g, "Docteur")
      .replace(/\betc\./g, "et cetera")
      .replace(/\s+/g, " ").trim();
  }
  let playToken = 0;
  let audioEl = null;
  function stopAudio() {
    playToken++;
    try { if (synth) synth.cancel(); } catch (_) {}
    if (audioEl) { try { audioEl.pause(); } catch (_) {} audioEl = null; }
    ui.c.playing = false;
  }
  function donePlaying(token) { if (token !== playToken) return; audioEl = null; ui.c.playing = false; if (routeView() === "comp") render(false); }
  // Built-in sets play their recording (one natural neural voice). Sets without one, like Claude's extra
  // sets, fall back to the browser's best French voice.
  function coPlay() {
    const set = ui.c.set.co;
    if (!set) return;
    if (ui.c.exam && ui.c.plays >= 1) { toast("Exam mode: one listen only, like the real test."); return; }
    stopAudio();
    const token = playToken;
    ui.c.playing = true;
    ui.c.plays++;
    render(true);
    if (set.audio) {
      const a = new Audio(set.audio);
      audioEl = a;
      a.playbackRate = Number(settings().rate) || 0.9;
      try { a.preservesPitch = true; } catch (_) {}
      let fell = false;
      const fallback = () => { if (fell || token !== playToken) return; fell = true; audioEl = null; speakSet(set, token); };
      a.onended = () => donePlaying(token);
      a.onerror = fallback;
      const pr = a.play();
      if (pr && pr.catch) pr.catch(fallback);
      return;
    }
    speakSet(set, token);
  }
  function speakSet(set, token) {
    if (!synth) { toast("This browser can't read text aloud. Use the transcript instead."); donePlaying(token); return; }
    const v = bestVoice();
    const rate = Number(settings().rate) || 0.9;
    let k = 0;
    // One line at a time, one voice, with a longer pause when the speaker changes.
    const next = () => {
      if (token !== playToken) return;
      if (k >= set.lines.length) { donePlaying(token); return; }
      const ln = set.lines[k++];
      const turn = k < set.lines.length && set.lines[k].speaker !== ln.speaker;
      const u = new SpeechSynthesisUtterance(ttsText(ln.text));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "fr-FR";
      u.rate = rate;
      let done = false;
      const go = () => { if (done) return; done = true; setTimeout(next, turn ? 700 : 300); };
      u.onend = go;
      u.onerror = go;
      synth.speak(u);
    };
    next();
  }

  const samplesFor = (skill) => (skill === "ce" ? T.COMP.ceSets : T.COMP.coSets);
  // Topics for comprehension sets: the vocabulary themes, minus the two that are language lists rather than topics.
  const COMP_TOPICS = T.VOCAB.filter((t2) => t2.id !== "connecteurs" && t2.id !== "pieges");
  function compLevel() { return ui.c.level || phaseInfo().level; }
  const compKey = (skill) => `${skill}|${compLevel()}|${ui.c.theme || ""}`;
  const themeLabel = (id) => (THEME[id] ? THEME[id].label : "");
  function prepSet(set) { set.questions.forEach((q) => { q.order = shuffle(q.options.map((_, j) => j)); }); return set; }
  function sampleSet(skill, i, key) {
    const all = samplesFor(skill);
    const k = ((i % all.length) + all.length) % all.length;
    const s = prepSet(clone(all[k]));
    s.src = "sample";
    s.sampleIdx = k;
    s.key = key;
    return s;
  }
  function findSample(skill, lvl, theme, after) {
    const all = samplesFor(skill);
    for (let k = 1; k <= all.length; k++) {
      const i = (((after + k) % all.length) + all.length) % all.length;
      if (i !== after && all[i].level === lvl && (!theme || arr(all[i].themes).includes(theme))) return i;
    }
    return -1;
  }
  function compReset(skill) {
    ui.c.ans[skill] = {};
    ui.c.submitted[skill] = false;
    ui.c.saved[skill] = null;
    if (skill === "co") { ui.c.plays = 0; ui.c.script = false; stopAudio(); }
  }
  // Keep the tab showing a set for the current level and theme: one already made for it, a matching
  // built-in set, or a new one from Claude. Switching theme or level therefore reloads the set in place.
  function ensureCompSet(skill) {
    const key = compKey(skill);
    const cur = ui.c.set[skill];
    if (cur && cur.key === key) return;
    if (busy["c-gen-" + skill] || ui.c.inflight[key]) return;
    compReset(skill);
    if (ui.c.cache[key]) { ui.c.set[skill] = prepSet(ui.c.cache[key]); return; }
    const lvl = compLevel(), th = ui.c.theme;
    const i = findSample(skill, lvl, th, -1);
    if (i >= 0) { ui.c.set[skill] = sampleSet(skill, i, key); return; }
    if (th && claudeOn() && !ui.c.failed[key]) {
      ui.c.set[skill] = null;
      if (!ui.c.queued) { ui.c.queued = true; setTimeout(() => { ui.c.queued = false; compGenerate(skill); }, 0); }
      return;
    }
    const j = findSample(skill, lvl, "", -1);
    ui.c.set[skill] = sampleSet(skill, j < 0 ? 0 : j, key);
    ui.c.set[skill].fallback = !!th;
  }
  async function compGenerate(skill) {
    if (busy["c-gen-" + skill]) return;
    const key = compKey(skill);
    if (ui.c.inflight[key]) return;
    const lvl = compLevel();
    const themeId = ui.c.theme;
    const th = THEME[themeId];
    const theme = th ? `${th.label} (${th.en})` : "any everyday or social topic typical of the TCF Canada (work, housing, services, health, environment, technology, culture, settling in Canada)";
    let prompt;
    if (skill === "ce") {
      prompt = `${EXAM_BRIEF}\n${TC.comp}\n\nWrite one TCF Canada Compréhension écrite item set at CEFR ${lvl}. Theme: ${theme}. Choose a realistic document type for that level (notice, email, advertisement, article, opinion piece, regulation). Length: ${lvl === "B1" ? "130–180" : "220–300"} words in French, with paragraph breaks as \\n\\n. Then 4 multiple-choice questions in French, 4 options each, exactly one correct, testing gist, specific details and inference${lvl === "B2" ? ", including the writer's intention or opinion" : ""}. Distractors must be plausible and reuse words from the text in misleading ways, as on the real test.\nReply with only JSON: {"title": "...", "type": "document type", "text": "...", "questions": [{"q": "...", "options": ["A", "B", "C", "D"], "answer": 0, "why": "English explanation quoting the text"}]}`;
    } else {
      prompt = `${EXAM_BRIEF}\n${TC.comp}\n\nWrite one TCF Canada Compréhension orale item set at CEFR ${lvl}. Theme: ${theme}. Write the script of a realistic recording of a kind the TCF Canada uses (${lvl === "B1" ? "a phone message, a public announcement or an everyday dialogue" : "a radio interview, a news report or a discussion"}): ${lvl === "B1" ? "90–150" : "160–230"} words of natural spoken French, with speakers labelled A and B (or A alone). The TCF Canada includes Canadian contexts, so make roughly one set in three Canadian (Québec places and vocabulary). The script will be read by text-to-speech, so write times, prices and numbers in words (« neuf heures et demie », « trente dollars ») and avoid abbreviations. Then 4 multiple-choice questions in French, 4 options each, exactly one correct, testing gist, details and inference, with plausible distractors.\nReply with only JSON: {"title": "short title", "context": "one French sentence describing the situation, shown before listening", "lines": [{"speaker": "A", "text": "..."}], "questions": [{"q": "...", "options": ["A", "B", "C", "D"], "answer": 0, "why": "English explanation quoting the script"}]}`;
    }
    ui.c.inflight[key] = true;
    const out = await ask("c-gen-" + skill, prompt);
    let set = null;
    if (out) {
      const qs = arr(out.questions).filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
        .map((q) => ({ q: str(q.q), options: q.options.map(str), answer: q.answer, why: str(q.why) }));
      const lines = arr(out.lines).filter((l) => l && l.text).map((l) => ({ speaker: str(l.speaker || "A").slice(0, 3), text: str(l.text) }));
      if (qs.length >= 2 && (skill === "ce" ? !!out.text : lines.length > 0)) {
        set = prepSet({ level: lvl, title: str(out.title), type: str(out.type), text: str(out.text), context: str(out.context), lines, questions: qs, src: "claude", theme: themeId, themes: themeId ? [themeId] : [], key });
      } else toast("The set didn't come back complete. Try again.");
    }
    delete ui.c.inflight[key];
    if (set) {
      delete ui.c.failed[key];
      ui.c.cache[key] = set;
      if (compKey(skill) === key) { compReset(skill); ui.c.set[skill] = set; }
    } else ui.c.failed[key] = true;
    render(true);
  }
  function compSubmit(skill) {
    const set = ui.c.set[skill];
    if (!set) return;
    const ans = ui.c.ans[skill];
    if (Object.keys(ans).length < set.questions.length) { toast("Answer every question first. On the real test a blank is simply wrong."); return; }
    const score = set.questions.filter((q, i) => ans[i] === q.answer).length;
    ui.c.submitted[skill] = true;
    const id = uid();
    ui.c.saved[skill] = id;
    put("comp", id, { skill, level: set.level || compLevel(), title: set.title, theme: set.theme || "", date: todayStr(), ts: Date.now(), score, total: set.questions.length, src: set.src || "sample", gaps: {} });
    autoTick("comp." + skill);
    if (skill === "co") ui.c.script = true;
    render(true);
  }
  function compGap(skill, i, kind) {
    const id = ui.c.saved[skill];
    const cur = id && S.comp.get(id);
    if (!cur) return;
    const doc = clone(cur);
    doc.gaps = doc.gaps || {};
    doc.gaps[i] = kind;
    put("comp", id, doc);
  }

  /* =============== criteria & scores =============== */
  function criterionStatus(c) {
    if (!c.auto) return { manual: true, ok: !!settings().criteria[c.id] };
    const [kind, a, b, x] = c.auto.split(":");
    if (kind === "writingZero") return writingZero(a);
    if (kind === "drill") {
      const n = drillsFor(a, b).length, best = bestPct(a, b);
      return { ok: n > 0 && best >= Number(x) - 1e-9, note: n ? `Best so far ${pct(best)}` : "No attempts yet" };
    }
    if (kind === "baseline") {
      const eo = list("speaking").some((s) => s.task === "t1");
      const co = list("comp").some((c2) => c2.skill === "co");
      const ce = list("comp").some((c2) => c2.skill === "ce");
      return { ok: eo && co && ce, note: `Tâche 1 ${eo ? "✓" : "—"} · CO ${co ? "✓" : "—"} · CE ${ce ? "✓" : "—"}` };
    }
    if (kind === "t3ok") {
      const ok = list("writing").some((w) => w.task === "t3" && w.fb && w.fb.tache3 && w.fb.tache3.compared_both && w.fb.tache3.opinion_after_comparison && w.words >= 120 && w.words <= 180);
      return { ok, note: ok ? "Done" : "Needs a corrected Tâche 3 that passes both structure checks and the word count" };
    }
    if (kind === "comp") {
      const th = Number(b);
      const res = ["co", "ce"].map((sk) => {
        const xs = list("comp").filter((c2) => c2.skill === sk && c2.level === a && c2.total).sort((p, q) => (q.ts || 0) - (p.ts || 0)).slice(0, 3);
        return [sk, xs.length ? xs.reduce((s2, c2) => s2 + c2.score / c2.total, 0) / xs.length : null];
      });
      return { ok: res.every(([, v]) => v != null && v >= th), note: res.map(([sk, v]) => `${sk.toUpperCase()} ${v == null ? "—" : pct(v)}`).join(" · ") + ` (last 3 sets at ${a})` };
    }
    if (kind === "eoT3") {
      const ok = list("speaking").some((s2) => s2.task === "t3" && s2.rubric && s2.rubric.full);
      return { ok, note: ok ? "Logged" : "Tick “Spoke 3+ minutes” on a saved Tâche 3 attempt" };
    }
    if (kind === "mocks") {
      const ms = list("mocks").sort((p, q) => str(p.date).localeCompare(str(q.date)));
      if (a === "coce2") {
        const co = ms.filter((m) => m.co >= 458).length, ce = ms.filter((m) => m.ce >= 453).length;
        return { ok: co >= 2 && ce >= 2, note: `CO ${Math.min(co, 2)}/2 · CE ${Math.min(ce, 2)}/2` };
      }
      let runN = 0, best = 0;
      for (const m of ms) { const all = m.co >= 458 && m.ce >= 453 && m.ee >= 10 && m.eo >= 10; runN = all ? runN + 1 : 0; best = Math.max(best, runN); }
      return { ok: best >= 2, note: `${Math.min(best, 2)}/2 consecutive` };
    }
    return { ok: false };
  }
  function nclcOf(skill, v) {
    if (v == null || v === "" || isNaN(v)) return null;
    for (const r of T.NCLC) if (Number(v) >= r[skill]) return r.n;
    return 0;
  }
  const nclcLabel = (n) => (n == null ? "—" : n >= 10 ? "10+" : n === 0 ? "<4" : String(n));
  function latestScores() {
    const ms = list("mocks").sort((p, q) => str(q.date).localeCompare(str(p.date)) || (q.ts || 0) - (p.ts || 0));
    const out = {};
    for (const k of ["co", "ce", "ee", "eo"]) { const m = ms.find((x) => x[k] != null && x[k] !== ""); if (m) out[k] = { v: m[k], date: m.date }; }
    return out;
  }

  /* =============== render plumbing =============== */
  const VIEWS = {};
  let route = { view: "today", args: [] };
  function parseRoute(h) {
    const t = str(h).replace(/^#/, "") || "today";
    const parts = t.split(".");
    return { view: VIEWS[parts[0]] ? parts[0] : "today", args: parts.slice(1) };
  }
  const routeView = () => route.view;
  let pendingRender = false, raf = 0, pointerDown = false;
  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; render(false); });
  }
  function isTyping(el) {
    return !!el && (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|reset)$/i.test(el.type)));
  }
  function render(force) {
    const ae = document.activeElement;
    const typing = isTyping(ae) && viewEl.contains(ae);
    if (typing && !force) { pendingRender = true; paintFoot(); return; }
    pendingRender = false;
    const fid = ae && viewEl.contains(ae) ? ae.id : "";
    const sel = typing && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd, ae.scrollTop] : null;
    const v = VIEWS[route.view];
    let html;
    try { html = v.render(route.args); } catch (e) { console.error(e); html = `<div class="wrap"><div class="notice warn">Something went wrong drawing this page: ${esc(e && e.message)}</div></div>`; }
    viewEl.innerHTML = html;
    if (fid) {
      const el = document.getElementById(fid);
      if (el) { try { el.focus({ preventScroll: true }); if (sel && typeof el.setSelectionRange === "function") { el.setSelectionRange(sel[0], sel[1]); el.scrollTop = sel[2]; } } catch (_) {} }
    }
    try { if (v.after) v.after(route.args); } catch (e) { console.error(e); }
    paintNav();
    paintFoot();
    paintTimer();
  }
  function paintNav() {
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === route.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }
  function paintFoot() {
    const s = settings(), P = T.PHASES[s.phase - 1];
    const store = backend.kind === "db" ? `<span class="status-dot on"></span>Progress saved on claude.ai` : backend.kind === "local" ? `<span class="status-dot warn"></span>Progress saved in this browser only` : `<span class="status-dot"></span>Loading your progress…`;
    const cl = sample ? `<span class="status-dot on"></span>Claude ready` : claudeState === "pending" ? `<span class="status-dot"></span>Connecting to Claude…` : claudeState === "off" ? `<span class="status-dot"></span>Claude off (reload to allow)` : "";
    const tm = timer.total && (timer.running || timerStarted()) ? `<a class="mini-timer" href="#${esc(timer.home)}"><span>${esc(timer.label)}</span><b data-timer>${fmtClock(timerRemaining())}</b></a>` : "";
    footEl.innerHTML = `<div class="phase"><b>Phase ${s.phase} · ${esc(P.name)}</b>Semaine ${weekNo()} · ${esc(P.weeks)}</div>${tm}<div>${store}</div>${cl ? `<div>${cl}</div>` : ""}<button type="button" class="theme-btn" data-act="theme" data-theme-btn></button>`;
    paintTheme();
  }
  function confirmBtn(key, label, act, attrs) {
    if (ui.confirm === key) return `<button class="btn sm danger" data-act="${act}" ${attrs}>Confirm</button><button class="btn sm ghost" data-act="confirm-cancel">Cancel</button>`;
    return `<button class="x" data-act="confirm" data-key="${esc(key)}" title="${esc(label)}" aria-label="${esc(label)}">×</button>`;
  }

  /* shared bits */
  const skChip = (k) => `<span class="sk ${k}">${T.SKILLS[k].code}</span>`;
  function errList(errs, withCat) {
    if (!errs || !errs.length) return `<p class="pen-ok">Aucune faute relevée.</p>`;
    return `<ul class="errs">${errs.map((e) => `<li><div class="fix"><span class="pen-wrong">${esc(e.wrong)}</span><span class="pen-right">${esc(e.right)}</span>${withCat && e.category ? `<span class="pill">${esc(CAT[catOf(e.category)])}</span>` : ""}</div>${e.why ? `<p class="why">${esc(e.why)}</p>` : ""}</li>`).join("")}</ul>`;
  }
  const accentBar = () => `<div class="accents" aria-label="Accented letters">${["é", "è", "ê", "ë", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "œ", "É", "À", "’"].map((c) => `<button type="button" data-act="accent" data-ch="${c}" tabindex="-1">${c}</button>`).join("")}</div>`;
  const formVal = (k) => esc(ui.form[k] || "");

  /* =============== view: today =============== */
  VIEWS.today = {
    render() {
      const s = settings(), P = T.PHASES[s.phase - 1];
      const t = todayStr(), mon = mondayOf(t);
      const sel = ui.day && ui.day >= mon && ui.day <= addDays(mon, 6) ? ui.day : t;
      const chips = [0, 1, 2, 3, 4, 5, 6].map((k) => {
        const d = addDays(mon, k), st = dayStats(d);
        const dot = !st || st.n === 0 ? "" : st.n >= st.total ? "full" : "part";
        return `<button class="daychip ${d === t ? "is-today" : ""}" data-act="day" data-date="${d}" aria-pressed="${d === sel}"><span>${DAYS_SHORT[k]}</span><b>${parse(d).getDate()}</b><i class="${dot}"></i></button>`;
      }).join("");
      const plan = planFor(s.phase, sel);
      const doc = S.days.get(sel);
      const done = (doc && doc.done) || {};
      let body;
      if (!plan) {
        body = `<div class="panel stack"><h2 class="h2">Repos</h2><p class="lede">Sunday is a rest day in every phase. If you want something light, review your due cards or reread this week's corrections, but it isn't on the plan.</p><div class="row"><a class="btn" href="#vocab">Due cards</a><a class="btn" href="#progress.errors">This week's errors</a></div></div>`;
      } else {
        const mins = plan.reduce((a, b) => a + b[1], 0);
        const doneN = plan.filter((b, i) => done[blockKey(s.phase, i)]).length;
        const doneMin = plan.reduce((a, b, i) => a + (done[blockKey(s.phase, i)] ? b[1] : 0), 0);
        const pnote = T.PLAN[s.phase].note;
        body = `<div class="stack">
          <div class="progress-line"><span class="num"><b>${doneN}</b> of ${plan.length} blocks · ${doneMin} of ${mins} min</span><div class="bar"><i style="width:${(doneN / plan.length) * 100}%"></i></div></div>
          <ol class="blocks">${plan.map((b, i) => {
            const key = blockKey(s.phase, i), isDone = !!done[key];
            return `<li class="block ${isDone ? "done" : ""}">
              <span class="tick"><input type="checkbox" data-change="tick" data-date="${sel}" data-key="${key}" ${isDone ? "checked" : ""} aria-label="Mark “${esc(b[2])}” done"></span>
              <div>
                <div class="block-top">${skChip(b[0])}<h3>${esc(b[2])}</h3><span class="min">${b[1]} min</span></div>
                ${b[3] ? `<p class="detail">${typo(b[3])}</p>` : ""}
                ${b[4] ? `<p class="check"><span>Check</span>${typo(b[4])}</p>` : ""}
              </div>
              <a class="btn sm" href="#${b[5]}">Start</a>
            </li>`;
          }).join("")}</ol>
          ${pnote ? `<p class="small muted">${esc(pnote)}</p>` : ""}
        </div>`;
      }
      return `<div class="wrap">
        <header class="cahier-head seyes">
          <p class="date-hand">${frDate(sel)}</p>
          <div class="meta"><b>Phase ${s.phase} · ${esc(P.name)}</b><span>Semaine ${weekNo()}</span><span>${esc(P.weeks)}</span>${sel !== t ? `<button class="btn ghost sm" data-act="day" data-date="${t}">Back to today</button>` : ""}</div>
        </header>
        <div class="daychips" role="group" aria-label="This week">${chips}</div>
        <div class="grid-side">
          ${body}
          <aside class="side">${homeworkCard()}${watchCard()}${streakCard()}</aside>
        </div>
      </div>`;
    },
  };
  function homeworkCard() {
    const t = todayStr();
    const hw = list("homework").filter((h) => !h.done || (h.doneOn && h.doneOn >= addDays(t, -2)))
      .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.ts || 0) - (a.ts || 0));
    const items = hw.length ? `<ul class="hw">${hw.map((h) => `<li class="${h.done ? "done" : ""}">
        <input type="checkbox" data-change="hw-done" data-id="${esc(h.id)}" ${h.done ? "checked" : ""} aria-label="Done">
        <span>${esc(h.text)}${h.src || h.go ? `<small>${esc(h.src || "")}${h.go ? ` · <a href="#${esc(h.go)}">Open</a>` : ""}</small>` : ""}</span>
        <button class="x" data-act="hw-del" data-id="${esc(h.id)}" aria-label="Remove">×</button>
      </li>`).join("")}</ul>` : `<p class="small muted">No homework yet. Corrections from Claude add follow-up tasks here, or add your own.</p>`;
    return `<section class="panel stack tight">
      <div class="row between"><h2 class="h3">Devoirs · Homework</h2></div>
      ${items}
      <div class="row"><input type="text" id="hw-new" data-input="form" data-k="hw" value="${formVal("hw")}" placeholder="Add a task…" style="flex:1"><button class="btn sm" data-act="hw-add">Add</button></div>
      <div>${claudeBtn("hw-suggest", "hw-suggest", "Suggest 3 from my error log", "", "btn ghost sm")}</div>
    </section>`;
  }
  function watchCard() {
    const t3 = top3();
    if (!t3.length) return `<section class="panel stack tight"><h2 class="h3">Watch for today</h2><p class="small muted">Your most frequent error categories show up here once corrections start coming in. From your history so far: pronominal verbs, imperative + pronoun, elision.</p></section>`;
    return `<section class="panel stack tight"><h2 class="h3">Watch for today</h2><ul class="hw">${t3.map(([c, v]) => {
      const tp = TOPIC[c];
      return `<li style="grid-template-columns:minmax(0,1fr) auto"><span><b>${esc(CAT[c])}</b> <span class="muted">×${v.n}</span><small><span class="pen-wrong">${esc(v.ex.wrong)}</span> → ${esc(v.ex.right)}</small></span>${tp ? `<a class="btn ghost sm" href="#grammar.${c}">Drill</a>` : ""}</li>`;
    }).join("")}</ul></section>`;
  }
  function heatmap(weeks) {
    const t = todayStr();
    const start = addDays(mondayOf(t), -(weeks - 1) * 7);
    let cells = "";
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const st = dayStats(date);
        let cls = "";
        if (date > t) cls = "";
        else if (st && st.n) cls = st.n >= st.total ? "l3" : st.n / st.total >= 0.5 ? "l2" : "l1";
        cells += `<i class="${cls}${date === t ? " now" : ""}" title="${shortDate(date)}${st ? ` · ${st.n}/${st.total}` : ""}"></i>`;
      }
    }
    return `<div class="heat" aria-label="Last ${weeks} weeks of practice">${cells}</div>`;
  }
  function streakCard() {
    const n = streak();
    return `<section class="panel stack tight"><div class="row between"><h2 class="h3">Régularité</h2><span class="pill ${n ? "ok" : ""}">${n}-day streak</span></div>${heatmap(8)}<p class="small muted">A day counts once every block in its plan is ticked. Sundays don't break a streak.</p></section>`;
  }
  async function suggestHomework() {
    const s = settings(), P = T.PHASES[s.phase - 1];
    const counts = errorCounts(21).slice(0, 5).map(([c, v]) => `${CAT[c]}: ${v.n}`).join("; ") || "nothing logged yet";
    const open = list("homework").filter((h) => !h.done).map((h) => h.text);
    const routes = T.TOPICS.map((tp) => "grammar." + tp.id).concat(["vocab", "writing.t1", "writing.t2", "writing.t3", "speaking.t1", "speaking.t2", "speaking.t3", "comp.co", "comp.ce"]);
    const prompt = `You set daily homework for a TCF Canada learner.\n${PROFILE}\nCurrent phase: ${s.phase}, ${P.name}: ${P.goal}\nMost frequent error categories over the last 3 weeks: ${counts}.\nOpen homework already assigned: ${open.join(" | ") || "none"}.\nSuggest 3 short, concrete homework tasks for tomorrow (5–15 minutes each), each aimed at one weakness, and say where to do it in the app, using one of: ${routes.join(", ")}.\nReply with only JSON: {"homework": [{"text": "task in English, with French examples if useful", "go": "one of the routes"}]}`;
    const out = await ask("hw-suggest", prompt);
    if (!out) return;
    let n = 0;
    arr(out.homework).slice(0, 3).forEach((h) => {
      if (!h || !h.text) return;
      const go = routes.includes(str(h.go)) ? str(h.go) : "";
      put("homework", uid(), { text: str(h.text), go, created: todayStr(), ts: Date.now(), done: false, src: "Suggested by Claude" });
      n++;
    });
    toast(n ? `Added ${n} tasks to your homework.` : "No suggestions came back. Try again.");
  }

  /* =============== view: grammar =============== */
  VIEWS.grammar = {
    render(args) {
      const id = args[0];
      if (id === "mixed") return grammarMixed();
      const tp = id && TOPIC[id];
      return tp ? grammarTopic(tp, args[1]) : grammarIndex();
    },
    after() {
      const d = ui.drill;
      const el = document.getElementById("drill-in");
      if (el && d && !d.checked && document.activeElement !== el) el.focus({ preventScroll: true });
    },
  };
  function statusPill(m) {
    if (m.ok) return `<span class="pill ok">Mastered</span>`;
    if (m.started) return `<span class="pill warn">In progress</span>`;
    return `<span class="pill">Not started</span>`;
  }
  function grammarIndex() {
    const s = settings();
    return `<div class="wrap">
      <header class="stack tight"><h1 class="title">Grammaire<small>Ordered by priority for you, from your own error history. Topics marked for Phase ${s.phase} are this phase's focus.</small></h1></header>
      <div class="row"><a class="btn primary" href="#grammar.mixed">Mixed review · 15 items</a><span class="small muted">Pronominal verbs, imperative, embedded questions and subjonctif together.</span></div>
      <ol class="topics">${T.TOPICS.map((tp) => {
        const m = topicMastery(tp);
        const last = drillsFor(tp.id).filter((d) => d.set !== "prod").slice(-1)[0];
        return `<li><a href="#grammar.${tp.id}">
          <span class="n">${tp.n}</span>
          <span class="t"><b>${esc(tp.title)}</b><small>${esc(tp.en)}</small></span>
          <span class="meta">${tp.phase === s.phase ? `<span class="pill info">Phase ${tp.phase}</span>` : ""}${last ? `<span class="small muted num">${last.score}/${last.total}</span>` : ""}${statusPill(m)}</span>
        </a></li>`;
      }).join("")}</ol>
      <section class="sec"><h2 class="h2">Low priority: don't spend production time here</h2>
        <ul class="hw">${T.LOW_PRIORITY.map(([a, b]) => `<li style="grid-template-columns:minmax(0,1fr)"><span><b>${esc(a)}</b> · <span class="muted">${esc(b)}</span></span></li>`).join("")}</ul>
      </section>
    </div>`;
  }
  function drillBox(topicId) {
    const d = ui.drill;
    if (!d || d.topic !== topicId) return "";
    return d.done ? drillDone(d) : drillCard(d);
  }
  function drillCard(d) {
    const it = d.items[d.i], n = d.items.length;
    let q, extra = "";
    if (it.kind === "type") {
      const parts = typo(it.q).split("___");
      const cls = d.checked ? (d.verdict === "ok" ? "ok" : "bad") : "";
      const full = parts.length === 2 && !parts[0].trim() && !parts[1].trim();
      const w = Math.max(8, Math.min(34, Math.max(...it.a.map((a) => a.length)) + 3));
      const input = `<input id="drill-in" class="blank ${cls} ${full ? "blank-full" : ""}" type="text" data-input="drill" value="${esc(d.given)}" size="${w}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="fr" ${d.checked ? "readonly" : ""} aria-label="Your answer">`;
      q = parts.length === 2 ? parts[0] + input + parts[1] : typo(it.q) + " " + input;
      if (!d.checked) extra = accentBar();
    } else {
      q = typo(it.q).replace("___", "_____");
      extra = `<div class="choices">${it.order.map((k, pos) => {
        const opt = it.options[k];
        const st = d.checked ? (k === 0 ? "ok" : d.given === opt ? "bad" : "") : "";
        return `<button data-act="drill-pick" data-k="${k}" class="${st}" ${d.checked ? "disabled" : ""}><span class="kbd">${pos + 1}</span><span>${typo(opt)}</span></button>`;
      }).join("")}</div>`;
    }
    let foot;
    if (d.checked) {
      const alts = it.a.length > 1 ? `<p class="small muted">Accepted: ${it.a.map(esc).join(" · ")}</p>` : "";
      const verdict = d.verdict === "ok"
        ? `<p class="pen-ok">Très bien !</p>`
        : `<p>${d.verdict === "accent" ? "<b>Almost: check your accents.</b> " : ""}${it.kind === "type" ? `<span class="pen-wrong">${esc(d.given)}</span> ` : ""}<span class="pen-right">${esc(it.a[0])}</span></p>`;
      foot = `<div class="verdict ${d.verdict === "ok" ? "ok" : "bad"}">${verdict}${it.why ? `<p class="why">${typo(it.why)}</p>` : ""}${alts}</div>
        <div class="row"><button class="btn primary" data-act="drill-next">${d.i + 1 >= n ? "See results" : "Next"} <span class="kbd">Enter</span></button></div>`;
    } else {
      foot = it.kind === "type"
        ? `<div class="row"><button class="btn primary" data-act="drill-check">Check <span class="kbd">Enter</span></button><button class="btn ghost sm" data-act="drill-quit">Quit</button></div>`
        : `<div class="row"><span class="small muted">Pick an answer, or press 1–${it.options.length}.</span><button class="btn ghost sm" data-act="drill-quit">Quit</button></div>`;
    }
    const done = d.results.filter((r) => r && r.ok).length;
    return `<section class="panel drill" id="drill-area">
      <div class="drill-head"><span class="eyebrow">${esc(d.title)}${d.src === "claude" ? " · new items from Claude" : d.src === "retry" ? " · retrying misses" : ""}</span><span class="small muted num">${d.i + 1} / ${n} · ${done} correct</span></div>
      <div class="bar"><i style="width:${(d.i / n) * 100}%"></i></div>
      ${it.src ? `<p class="src">${typo(it.src)}</p>` : ""}
      <p class="q">${q}</p>
      ${extra}
      ${foot}
    </section>`;
  }
  function drillDone(d) {
    const n = d.items.length;
    const score = d.results.filter((r) => r && r.ok).length;
    const tp = TOPIC[d.topic];
    const c = tp && tp.criterion;
    const target = c && c.set === d.set ? c.pct : null;
    const met = target != null && score / n >= target - 1e-9;
    const misses = d.items.map((it, k) => ({ it, k, r: d.results[k] || {} })).filter((x) => !x.r.ok || x.r.overturned);
    let breakdown = "";
    if (d.topic === "mixed") {
      const by = {};
      d.items.forEach((it, k) => { const b = by[it.topic] || (by[it.topic] = { ok: 0, n: 0 }); b.n++; if (d.results[k] && d.results[k].ok) b.ok++; });
      const rows = Object.entries(by).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
      breakdown = `<div class="stack tight"><p class="h3">By topic</p>${rows.map(([t2, b]) => `<div class="row between"><span>${esc(TOPIC[t2].title)}</span><span class="num">${b.ok}/${b.n}</span></div>`).join("")}<p class="small muted">Weakest: <b>${esc(TOPIC[rows[0][0]].title)}</b>. Make it next week's extra focus.</p></div>`;
    }
    return `<section class="panel drill" id="drill-area">
      <div class="row between"><span class="eyebrow">${esc(d.title)} · results</span>${target != null && d.src !== "retry" ? `<span class="pill ${met ? "ok" : "warn"}">${met ? "Target met" : `Target ${pct(target)}`}</span>` : ""}</div>
      <div class="row"><span class="scorebig">${score}/${n}</span><span class="muted">${pct(score / n)}${d.src === "retry" ? " · retry rounds don't count toward mastery" : ""}</span></div>
      ${breakdown}
      ${misses.length ? `<div class="stack tight"><p class="h3">Review</p><ul class="misses">${misses.map(({ it, k, r }) => `<li>
          ${it.src ? `<p class="small muted fr">${typo(it.src)}</p>` : ""}
          <p class="fr">${typo(it.q).replace("___", "<b>___</b>")}</p>
          <p><span class="pen-wrong">${esc(r.given)}</span> <span class="pen-right">${esc(it.a[0])}</span></p>
          ${it.why ? `<p class="small muted">${typo(it.why)}</p>` : ""}
          ${r.claude ? `<p class="small ${r.claude.correct ? "" : "muted"}"><b>${r.claude.correct ? "Claude: your answer works too. Counted as correct." : "Claude: not quite."}</b> ${esc(r.claude.explanation)}</p>` : it.kind === "type" && !r.ok ? `<div>${claudeBtn("dispute-" + k, "drill-dispute", "Is my answer also correct?", `data-k="${k}"`, "btn ghost sm")}</div>` : ""}
        </li>`).join("")}</ul></div>` : `<p class="pen-ok">Sans faute !</p>`}
      <div class="row">
        ${misses.some((x) => !x.r.ok) ? `<button class="btn primary" data-act="drill-retry">Retry the misses</button>` : ""}
        ${d.topic !== "mixed" ? `<button class="btn" data-act="drill-start" data-topic="${d.topic}" data-set="${d.set}">New round</button>` : `<button class="btn" data-act="drill-start" data-topic="mixed" data-set="main">New round</button>`}
        <button class="btn ghost" data-act="drill-close">Close</button>
      </div>
    </section>`;
  }
  function grammarTopic(tp, setArg) {
    const s = settings();
    const m = topicMastery(tp);
    const hist = drillsFor(tp.id).filter((d) => d.set !== "prod").slice(-8).reverse();
    const active = ui.drill && ui.drill.topic === tp.id;
    // Build up: the set that counts toward mastery comes first; once it's mastered, the B2 set is next.
    const coreSet = tp.criterion.set;
    const b2Set = tp.sets.find((x) => x.level === "B2");
    const nextSet = m.ok && b2Set ? b2Set.id : coreSet;
    const sets = tp.sets.map((st) => {
      const n = drillsFor(tp.id, st.id).length;
      const best = n ? pct(bestPct(tp.id, st.id)) : "—";
      const isNext = st.id === nextSet;
      return `<div class="set-row">
        <div class="stack tight" style="gap:4px">
          <span class="row" style="gap:8px"><span class="lvl ${st.level === "B2" ? "b2" : ""}">${esc(st.level)}</span><b>${esc(st.title)}</b>${isNext ? `<span class="pill info">Up next</span>` : ""}</span>
          <span class="small muted">${Math.min(st.take, st.items.length)} per round from ${st.items.length} · ${st.kind === "choice" ? "multiple choice" : "type the answer"} · best ${best}${st.id === coreSet ? " · counts toward mastery" : ""}</span>
        </div>
        <span class="row"><button class="btn ${isNext ? "primary" : ""} sm" data-act="drill-start" data-topic="${tp.id}" data-set="${st.id}">Start</button>${claudeBtn("gen-" + tp.id + "." + st.id, "drill-gen", "New items from Claude", `data-topic="${tp.id}" data-set="${st.id}"`, "btn sm")}</span>
      </div>`;
    }).join("");
    const pr = tp.prod ? prodPanel(tp) : "";
    return `<div class="wrap">
      <div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Topic ${tp.n} · Phase ${tp.phase} focus${tp.phase === s.phase ? " · this phase" : ""}</p><h1 class="title">${esc(tp.title)}<small>${esc(tp.en)}</small></h1></header>
      <div class="grid-side">
        <div class="stack">
          ${active ? drillBox(tp.id) : `<section class="panel stack tight" id="drill-area"><p class="h3">Drill</p><p class="small muted">${esc(tp.exercise)}</p>${sets}</section>`}
          ${pr}
          <section class="stack tight"><p class="h3">History</p>${hist.length ? `<div class="history">${hist.map((d) => `<span class="pill ${d.total && d.score / d.total >= tp.criterion.pct - 1e-9 && tp.criterion.set === d.set ? "ok" : ""}">${shortDate(d.date)} · ${d.score}/${d.total}${d.src === "claude" ? " · Claude" : ""}</span>`).join("")}</div>` : `<p class="small muted">No sessions yet.</p>`}</section>
        </div>
        <aside class="side">
          <section class="panel stack tight"><p class="h3">Mastery</p><p class="small">${esc(tp.criterion.text)}</p>${m.parts.map((p2) => `<p class="small"><b style="color:var(${p2.ok ? "--green" : "--ink-3"})">${p2.ok ? "✓" : "○"}</b> ${esc(p2.note)}</p>`).join("")}</section>
          <section class="panel stack tight"><p class="h3">Why it matters</p><p class="small">${typo(tp.why)}</p>${tp.know ? `<p class="small muted"><b>Already know:</b> ${typo(tp.know)}</p>` : ""}<p class="small"><b>Master:</b> ${typo(tp.master)}</p></section>
          ${tp.mistakes.length ? `<section class="panel stack tight"><p class="h3">Your mistakes</p><ul class="mistakes">${tp.mistakes.map(([w, r]) => `<li><span class="pen-wrong">${typo(w)}</span><span class="pen-right">${typo(r)}</span></li>`).join("")}</ul></section>` : ""}
          <section class="panel stack tight"><p class="h3">Examples</p><div class="examples">${tp.examples.map(([f, e]) => `<div><p>${typo(f)}</p><p>${esc(e)}</p></div>`).join("")}</div></section>
        </aside>
      </div>
    </div>`;
  }
  function prodPanel(tp) {
    const st = ui.prod[tp.id] || { text: "" };
    const fb = st.fb;
    const passed = prodMet(tp.id);
    return `<section class="panel stack">
      <div class="row between"><p class="h3">${esc(tp.prod.title)}</p>${passed ? `<span class="pill ok">Passed before</span>` : ""}</div>
      <p class="fr" style="white-space:pre-line">${typo(tp.prod.prompt)}</p>
      <textarea id="prod-in" data-input="prod" data-topic="${tp.id}" rows="6" lang="fr" spellcheck="false" placeholder="Écrivez ici…">${esc(st.text)}</textarea>
      ${accentBar()}
      <div class="row">${claudeBtn("prod-" + tp.id, "prod-check", "Check with Claude", `data-topic="${tp.id}"`, "btn primary")}</div>
      ${fb ? `<div class="verdict ${fb.pass ? "ok" : "bad"}"><p><b>${fb.pass ? "Criterion met." : "Not yet."}</b> ${esc(fb.comment)}</p></div>${errList(fb.errors)}${fb.improved ? `<div class="stack tight"><p class="eyebrow">Improved version</p><p class="fr" style="white-space:pre-line">${typo(fb.improved)}</p></div>` : ""}` : ""}
    </section>`;
  }
  function grammarMixed() {
    const active = ui.drill && ui.drill.topic === "mixed";
    const hist = drillsFor("mixed").slice(-8).reverse();
    return `<div class="wrap">
      <div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Friday review</p><h1 class="title">Mixed review<small>15 items across pronominal verbs, imperative + pronoun, embedded questions and subjonctif. The difficulty follows your phase: B1 in Phase 1, up to B1+ in Phase 2, B1+ and B2 from Phase 3. The results tell you which topic is still weakest.</small></h1></header>
      ${active ? drillBox("mixed") : `<section class="panel stack tight" id="drill-area"><p class="small muted">A fresh random mix every round.</p><div class="row"><button class="btn primary" data-act="drill-start" data-topic="mixed" data-set="main">Start mixed review</button></div></section>`}
      <section class="stack tight"><p class="h3">History</p>${hist.length ? `<div class="history">${hist.map((d) => `<span class="pill">${shortDate(d.date)} · ${d.score}/${d.total}</span>`).join("")}</div>` : `<p class="small muted">No sessions yet.</p>`}</section>
    </div>`;
  }

  /* =============== view: vocab =============== */
  VIEWS.vocab = {
    render(args) {
      const tok = args.join(".");
      if (args[0] === "new" && THEME[args[1]] && ui.applied !== tok) { ui.vTheme = args[1]; ui.applied = tok; }
      if (ui.vocab) return ui.vocab.finished ? vocabDone() : vocabCard();
      return vocabHome(args);
    },
  };
  function vocabHome(args) {
    const s = settings();
    const cards = allCards();
    const due = dueIds(cards);
    const pri = due.filter((id) => S.srs.get(id).pri).length;
    const learned = [...S.srs.keys()].filter((id) => cards.has(id)).length;
    const theme = ui.vTheme && THEME[ui.vTheme] ? ui.vTheme : (args[0] === "new" && THEME[args[1]] ? args[1] : defaultTheme());
    const phaseThemes = T.PHASES[s.phase - 1].vocab;
    const opts = T.VOCAB.slice().sort((a, b) => (phaseThemes.includes(b.id) ? 1 : 0) - (phaseThemes.includes(a.id) ? 1 : 0))
      .map((th) => { const left = themeCards(th.id, cards).filter((c) => !S.srs.has(c.id)).length; return `<option value="${th.id}" ${th.id === theme ? "selected" : ""}>${phaseThemes.includes(th.id) ? "★ " : ""}${esc(th.label)} · ${left} new</option>`; }).join("");
    const left = themeCards(theme, cards).filter((c) => !S.srs.has(c.id)).length;
    const rows = T.VOCAB.map((th) => {
      const cs = themeCards(th.id, cards);
      const lr = cs.filter((c) => S.srs.has(c.id)).length;
      const ms = cs.filter((c) => (S.srs.get(c.id) || {}).stage >= 5).length;
      return `<tr>
        <td><b class="fr">${esc(th.label)}</b><br><span class="small muted">${esc(th.en)}${phaseThemes.includes(th.id) ? " · this phase" : ""}</span></td>
        <td class="n">${lr} / ${cs.length}</td><td class="n">${ms}</td>
        <td>${claudeBtn("build-" + th.id, "v-build", cs.length < 10 ? "Build this theme" : "+20 with Claude", `data-theme="${th.id}"`, "btn sm")}</td>
      </tr><tr><td colspan="4" style="padding-top:0"><details class="fold"><summary class="small">${cs.length} cards</summary><ul class="cards-list">${cs.map((c) => { const st = S.srs.get(c.id); return `<li><span>${typo(c.fr)}</span><span class="muted small">${st ? (st.pri ? "priority" : st.stage >= 5 ? "mastered" : "due " + shortDate(st.due)) : "new"}</span></li>`; }).join("")}</ul></details></td></tr>`;
    }).join("");
    return `<div class="wrap">
      <header class="stack tight"><h1 class="title">Vocabulaire<small>Spaced repetition: a new card comes back after 1, 2, 4, 7, then 14 days. Anything you miss joins a priority pile reviewed daily until you get it right twice.</small></h1></header>
      <div class="grid2">
        <section class="panel stack">
          <div class="row between"><p class="h3">Review</p><span class="pill ${due.length ? "warn" : "ok"}">${due.length} due${pri ? ` · ${pri} priority` : ""}</span></div>
          <p class="small muted">${due.length ? "Recall each card cold before you flip it. No peeking." : "Nothing due right now. Come back tomorrow."}</p>
          <div class="row"><button class="btn primary" data-act="v-start" data-mode="review" ${due.length ? "" : "disabled"}>Start review${due.length ? ` (${due.length})` : ""}</button></div>
          <p class="small muted num">${learned} cards learned · ${cards.size} in the deck</p>
        </section>
        <section class="panel stack">
          <p class="h3">New cards</p>
          <label class="field">Theme<select id="v-theme" data-change="v-theme">${opts}</select></label>
          <div class="row"><div class="seg" role="group" aria-label="How many">${[10, 15].map((n) => `<button data-act="v-count" data-n="${n}" aria-pressed="${ui.vCount === n}">${n}</button>`).join("")}</div>
          <button class="btn primary" data-act="v-start" data-mode="new" ${left ? "" : "disabled"}>Learn ${Math.min(left, ui.vCount)} new</button></div>
          ${left ? "" : `<p class="small muted">No new cards left in this theme. ${claudeBtn("build-" + theme, "v-build", "Build 20 more with Claude", `data-theme="${theme}"`, "btn ghost sm")}</p>`}
        </section>
      </div>
      <div class="row"><span class="small muted">Card direction</span><div class="seg" role="group" aria-label="Card direction"><button data-act="v-dir" data-dir="en-fr" aria-pressed="${ui.vDir === "en-fr"}">English → French</button><button data-act="v-dir" data-dir="fr-en" aria-pressed="${ui.vDir === "fr-en"}">French → English</button></div><span class="small muted">English → French trains the words you'll need to produce.</span></div>
      <section class="sec"><div class="sec-head"><h2 class="h2">Deck by theme</h2><span class="small muted">Collocations and connectors are worth more than isolated nouns.</span></div>
        <div class="table-wrap"><table class="deck"><thead><tr><th>Theme</th><th>Learned</th><th>Mastered</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>
      <section class="panel stack"><p class="h3">Add your own card</p>
        <div class="grid2">
          <label class="field">French<input type="text" id="card-fr" data-input="form" data-k="card-fr" value="${formVal("card-fr")}" lang="fr" placeholder="s'engager à faire qqch"></label>
          <label class="field">English<input type="text" id="card-en" data-input="form" data-k="card-en" value="${formVal("card-en")}" placeholder="to commit to doing something"></label>
          <label class="field">Example (optional)<input type="text" id="card-ex" data-input="form" data-k="card-ex" value="${formVal("card-ex")}" lang="fr"></label>
          <label class="field">Theme<select id="card-th" data-change="form" data-k="card-th">${T.VOCAB.map((th) => `<option value="${th.id}" ${(ui.form["card-th"] || theme) === th.id ? "selected" : ""}>${esc(th.label)}</option>`).join("")}</select></label>
        </div>
        <div class="row"><button class="btn" data-act="v-add">Add card</button></div>
      </section>
    </div>`;
  }
  function vocabCard() {
    const v = ui.vocab;
    const cards = allCards();
    const id = v.queue[v.i];
    const c = cards.get(id) || { fr: "?", en: "?", theme: "" };
    const st = S.srs.get(id);
    const th = THEME[c.theme];
    const enFirst = ui.vDir === "en-fr";
    const front = enFirst ? `<p class="prompt">${esc(c.en)}</p>` : `<p class="answer">${typo(c.fr)}</p>`;
    const back = enFirst ? `<p class="answer">${typo(c.fr)}</p>` : `<p class="prompt">${esc(c.en)}</p>`;
    let buttons;
    if (v.mode === "new") buttons = `<button class="btn primary" data-act="v-grade" data-ok="1">Got it, next <span class="kbd">2</span></button><button class="btn" data-act="v-grade" data-ok="0">I already know this <span class="kbd">3</span></button>`;
    else if (!v.shown) buttons = `<button class="btn primary" data-act="v-show">Show answer <span class="kbd">Space</span></button>`;
    else buttons = `<button class="btn" data-act="v-grade" data-ok="0">Missed <span class="kbd">1</span></button><button class="btn primary" data-act="v-grade" data-ok="1">Got it <span class="kbd">2</span></button>`;
    return `<div class="wrap">
      <div class="row between"><span class="eyebrow">${v.mode === "new" ? "Learning new cards" : "Review"} · ${v.i + 1} / ${v.queue.length}</span><button class="btn ghost sm" data-act="v-quit">End session</button></div>
      <div class="bar"><i style="width:${(v.i / v.queue.length) * 100}%"></i></div>
      <section class="panel flash">
        <p class="eyebrow">${th ? esc(th.label) : ""}${st && st.pri ? " · priority" : ""}</p>
        ${front}
        ${v.shown ? back + (c.ex ? `<p class="ex">${typo(c.ex)}</p>` : "") : `<p class="muted small">Say it out loud before you flip.</p>`}
        <div class="row">${buttons}</div>
      </section>
    </div>`;
  }
  function vocabDone() {
    const v = ui.vocab;
    const due = dueIds().length;
    return `<div class="wrap"><section class="panel stack">
      <p class="eyebrow">Session complete</p>
      <p class="scorebig">${v.mode === "new" ? v.queue.length + " new" : v.ok + " / " + (v.ok + v.miss)}</p>
      <p class="lede">${v.mode === "new" ? "These come back tomorrow for their first review." : v.miss ? `${v.miss} miss${v.miss > 1 ? "es" : ""} went to the priority pile for daily review.` : "Clean session."}${due ? ` ${due} card${due > 1 ? "s are" : " is"} still due.` : ""}</p>
      <div class="row"><button class="btn primary" data-act="v-close">Back to the deck</button>${due ? `<button class="btn" data-act="v-start" data-mode="review">Review the rest</button>` : ""}</div>
    </section></div>`;
  }

  /* =============== view: writing =============== */
  const W_CHECKS = {
    all: [["elision", "Elision pass: read once hunting only for missed elisions"], ["pron", "Pronominal verbs: être + agreement checked"]],
    t1: [["imp", "Imperatives and embedded questions checked"]],
    t2: [["opinion", "My opinion is woven in, not a neutral recount"], ["goal", "The conclusion ties back to the task's objective"]],
    t3: [["both", "Paragraph 1 states BOTH documents' positions"], ["order", "My opinion comes after the comparison"], ["concede", "I concede the other side before pivoting (Certes… mais)"]],
  };
  VIEWS.writing = {
    render(args) {
      if (args[0] && T.WRITING[args[0]]) ui.w.task = args[0];
      const task = ui.w.task, W = T.WRITING[task];
      const p = wPrompt(task);
      const text = ui.w.text[task] || "";
      const s = settings();
      const presets = s.phase >= 3 ? [[W.exam * 60, `${W.exam} min exam`], [35 * 60, "35 min"], [60 * 60, "60 min mock"]] : [[35 * 60, "35 min practice"], [W.exam * 60, `${W.exam} min exam`], [60 * 60, "60 min mock"]];
      const docs = task === "t3" && p.docs ? `<div class="docs">${p.docs.map((d, k) => `<div class="doc"><p class="eyebrow">Document ${k + 1}</p><p class="fr">${typo(d.text)}</p><p class="who">${esc(d.who)}</p></div>`).join("")}</div>` : "";
      const checks = W_CHECKS.all.concat(W_CHECKS[task]);
      const ch = ui.w.checks[task];
      const viewing = ui.w.viewing && S.writing.get(ui.w.viewing);
      const hist = list("writing").sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 25);
      return `<div class="wrap">
        <header class="stack tight"><h1 class="title">Expression écrite<small>TCF Canada format and grading. Spellcheck is off, like on exam day, and your draft saves in this browser as you type.</small></h1></header>
        <nav class="tabs" role="tablist">${["t1", "t2", "t3"].map((k) => `<a href="#writing.${k}" role="tab" aria-selected="${k === task}">${T.WRITING[k].name}<small>${T.WRITING[k].min}–${T.WRITING[k].max} mots</small></a>`).join("")}</nav>
        <section class="panel prompt-card">
          <div class="row between"><span class="eyebrow">${esc(W.kind)} · ${W.min}–${W.max} words${ui.w.gen[task] ? " · from Claude" : ""}</span>
            <span class="row"><button class="btn sm" data-act="w-next">Another prompt</button>${claudeBtn("w-gen", "w-gen", "New prompt from Claude", "", "btn sm")}</span></div>
          <p class="fr">${typo(p.q)}</p>
          ${p.en ? `<p class="small muted">${esc(p.en)}</p>` : ""}
          ${docs}
        </section>
        <details class="fold"><summary>Structure and template</summary>
          <div class="stack tight" style="margin-top:10px">
            <p class="small">${esc(W.expected)}</p>
            <ol class="small" style="margin:0;padding-left:20px">${W.structure.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
            <p class="fr small">${typo(W.template)}</p>
            ${task === "t3" ? `<p class="small"><b>Word-count discipline (TCF Canada):</b> Partie 1 is 40–60 words and Partie 2 is 80–120, for 120–180 in total. In your template, Partie 2 is the opinion paragraph (60–90) plus a short conclusion (20–30). Count as you write, not only at the end: the meters under the page track both parts.</p>` : ""}
            <div><button class="btn sm" data-act="w-skeleton">Insert the skeleton</button></div>
          </div>
        </details>
        <section class="panel editor">
          <div class="ed-bar"><div class="meter" id="w-meter"></div>${timerUI("writing." + task, W.name + " écrit", presets)}</div>
          <textarea id="w-text" class="seyes" data-input="w-text" spellcheck="false" autocomplete="off" autocorrect="off" lang="fr" placeholder="Écrivez ici…" aria-label="Your text">${esc(text)}</textarea>
          ${task === "t3" ? `<div class="paras" id="w-paras"></div>` : ""}
        </section>
        ${accentBar()}
        <section class="stack tight">
          <p class="h3">Before you submit</p>
          <label class="check"><input type="checkbox" id="chk-words" disabled><span>Word count inside ${W.min}–${W.max}. Outside the range, a task can be marked “A1 non atteint” however good the French.</span></label>
          ${checks.map(([k, l]) => `<label class="check"><input type="checkbox" data-change="w-check" data-k="${k}" ${ch[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
        </section>
        <div class="row">${claudeBtn("w-correct", "w-correct", "Correct with Claude", "", "btn primary")}<button class="btn" data-act="w-save">Save without correction</button>${ui.confirm === "w-clear" ? `<button class="btn danger" data-act="w-clear">Clear the draft</button><button class="btn ghost" data-act="confirm-cancel">Keep it</button>` : `<button class="btn ghost" data-act="confirm" data-key="w-clear">Clear draft</button>`}</div>
        ${viewing ? writingFb(ui.w.viewing, viewing) : ""}
        <section class="sec"><div class="sec-head"><h2 class="h2">History</h2><span class="small muted">${hist.length ? `${hist.length} most recent` : ""}</span></div>
          ${hist.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Date</th><th>Task</th><th>Words</th><th>Level</th><th></th></tr></thead><tbody>${hist.map((w) => {
            const WW = T.WRITING[w.task] || W;
            const ok = w.words >= WW.min && w.words <= WW.max;
            return `<tr><td class="n">${shortDate(w.date)}</td><td>${esc(WW.name)}</td><td class="n"><span class="tag7 ${ok ? "ok" : "no"}">${w.words}</span></td><td>${w.fb && w.fb.score20 != null ? `${w.fb.score20}/20 · ${esc(w.fb.level)}` : w.fb && w.fb.level ? esc(w.fb.level) : `<span class="muted small">not corrected</span>`}</td>
              <td><span class="row" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn ghost sm" data-act="w-open" data-id="${esc(w.id)}">${ui.w.viewing === w.id ? "Showing" : "Open"}</button>${confirmBtn("w-del-" + w.id, "Delete this entry", "w-del", `data-id="${esc(w.id)}"`)}</span></td></tr>`;
          }).join("")}</tbody></table></div>` : `<p class="small muted">Corrected and saved drafts collect here, with their word counts.</p>`}
        </section>
      </div>`;
    },
    after() { updateMeters(); },
  };
  function writingFb(id, doc) {
    const W = T.WRITING[doc.task] || T.WRITING.t1;
    const fb = doc.fb;
    const inRange = doc.words >= W.min && doc.words <= W.max;
    const head = `<div class="row between"><h2 class="h2">${esc(W.name)} · ${shortDate(doc.date)}</h2><button class="btn ghost sm" data-act="w-close">Close</button></div>
      <p class="small muted fr">${typo(doc.prompt || "")}</p>`;
    if (!fb) return `<section class="panel fb" id="w-fb">${head}<div class="flags"><span class="pill ${inRange ? "ok" : "bad"}">${doc.words} words</span><span class="pill">Not corrected</span></div><p class="corrected seyes">${esc(doc.text)}</p></section>`;
    const flag = (ok, yes, no) => `<span class="pill ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${esc(ok ? yes : no)}</span>`;
    const t3 = fb.tache3;
    return `<section class="panel fb" id="w-fb">
      ${head}
      <div class="fb-head"><span class="level">${fb.score20 != null ? `${fb.score20}<small>/20</small>` : esc(fb.level || "—")}</span><div class="stack tight"><span class="small muted">${fb.score20 != null ? `${esc(fb.level)} · about NCLC ${esc(fb.nclc)} · ` : fb.nclc ? `About NCLC ${esc(fb.nclc)} · ` : ""}Claude's estimate on the TCF Canada scale, not an official score.</span><p>${esc(fb.summary)}</p></div></div>
      <div class="flags">
        ${flag(inRange, `${doc.words} words, inside ${W.min}–${W.max}`, `${doc.words} words, outside ${W.min}–${W.max}`)}
        ${flag(fb.compliance.on_topic, "On topic", "Off topic")}
        ${flag(fb.compliance.register_ok, "Register fits", "Register off")}
        ${t3 ? flag(t3.compared_both, "Compared both documents", "Didn't compare both documents") + flag(t3.opinion_after_comparison, "Opinion after comparison", "Opinion before or instead of comparison") : ""}
        ${doc.minutes ? `<span class="pill">${doc.minutes} min on the clock</span>` : ""}
      </div>
      ${fb.compliance.notes || (t3 && t3.notes) ? `<p class="small">${esc([fb.compliance.notes, t3 && t3.notes].filter(Boolean).join(" "))}</p>` : ""}
      ${criteriaTable(fb.criteria, "Graded against the criteria France Éducation International publishes for the TCF Canada. Its internal marking grids aren't public, so treat the score as an estimate.")}
      <div class="stack tight"><p class="h3">Corrections <span class="muted small">· ${fb.errors.length}</span></p>${errList(fb.errors, true)}</div>
      ${fb.upgrades.length ? `<div class="stack tight"><p class="h3">B1 → B2 upgrades</p><ul class="upgrades">${fb.upgrades.map((u) => `<li><span>${typo(u.from)}</span><span class="arrow">→</span><b>${typo(u.to)}</b></li>`).join("")}</ul></div>` : ""}
      ${fb.strengths.length ? `<div class="stack tight"><p class="h3">What worked</p><ul class="small" style="margin:0;padding-left:20px">${fb.strengths.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${fb.corrected ? `<details class="fold"><summary>Corrected text</summary><p class="corrected seyes" style="margin-top:10px">${esc(fb.corrected)}</p></details>` : ""}
      <details class="fold"><summary>Your original</summary><p class="corrected seyes" style="margin-top:10px">${esc(doc.text)}</p></details>
      ${fb.homework.length ? `<p class="small muted">Follow-up tasks went to today's homework: ${fb.homework.map(esc).join(" · ")}</p>` : ""}
    </section>`;
  }

  /* =============== view: speaking =============== */
  VIEWS.speaking = {
    render(args) {
      if (args[0] && T.SPEAKING[args[0]]) ui.sp.task = args[0];
      const task = ui.sp.task, P = T.SPEAKING[task];
      const tabs = `<nav class="tabs" role="tablist">${["t1", "t2", "t3"].map((k) => `<a href="#speaking.${k}" role="tab" aria-selected="${k === task}">${T.SPEAKING[k].name}<small>${esc(T.SPEAKING[k].kind)}</small></a>`).join("")}</nav>`;
      const body = task === "t1" ? speakT1(P) : task === "t2" ? speakT2(P) : speakT3(P);
      const hist = list("speaking").filter((x) => x.task === task).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 12);
      return `<div class="wrap">
        <header class="stack tight"><h1 class="title">Expression orale<small>This page can't use your microphone. Record yourself with your phone's voice memos while the timer runs, then listen back once.${claudeOn() ? " Paste a transcript (phone dictation works) if you want Claude's feedback." : ""}</small></h1></header>
        ${tabs}
        <p class="small muted">${esc(P.tests)}</p>
        ${body}
        <section class="sec"><h2 class="h2">Attempts</h2>${hist.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Date</th><th>Prompt</th><th>Self-score</th><th>Notes</th><th></th></tr></thead><tbody>${hist.map((h) => `<tr><td class="n">${shortDate(h.date)}</td><td class="small fr">${typo(h.prompt || "")}</td><td class="n">${h.of ? `${h.score}/${h.of}` : "—"}</td><td class="small">${esc(h.notes || "")}${h.fb && h.fb.level ? ` <span class="pill">${esc(h.fb.level)}</span>` : ""}</td><td>${confirmBtn("sp-del-" + h.id, "Delete this attempt", "sp-del", `data-id="${esc(h.id)}"`)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="small muted">Saved attempts collect here, so you can compare this week's recording notes with last week's.</p>`}</section>
      </div>`;
    },
    after() { scrollChat(); },
  };
  function rubricBlock(task, P) {
    const r = ui.sp.rubric[task] || {};
    return `<section class="stack tight"><p class="h3">Self-review</p>
      ${P.rubric ? P.rubric.map(([k, l]) => `<label class="check"><input type="checkbox" data-change="sp-rubric" data-k="${k}" ${r[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("") : ""}
      <label class="field">2–3 concrete fixes for next time<textarea id="sp-notes" data-input="sp-notes" rows="3" placeholder="e.g. vary connectors: d'ailleurs, en plus; add one past-tense detail">${esc(ui.sp.notes[task])}</textarea></label>
    </section>`;
  }
  function transcriptBlock(task) {
    const fb = ui.sp.fb[task];
    return `<section class="stack tight"><p class="h3">Transcript <span class="small muted">· optional</span></p>
      <textarea id="sp-trans" data-input="sp-trans" rows="5" lang="fr" spellcheck="false" placeholder="Paste what you said, from your phone's dictation or typed from the recording.">${esc(ui.sp.trans[task])}</textarea>
      <div class="row">${claudeBtn("sp-fb-" + task, "sp-fb", "Get feedback from Claude", `data-task="${task}"`, "btn")}</div>
      ${fb ? spFbHTML(fb) : ""}
    </section>`;
  }
  function spFbHTML(fb) {
    return `<div class="panel flat stack">
      ${fb.level ? `<div class="fb-head"><span class="level">${esc(fb.level)}</span><p>${esc(fb.summary)}</p></div>` : `<p>${esc(fb.summary)}</p>`}
      ${criteriaTable(fb.criteria, "TCF Canada speaking criteria. Pronunciation can't be judged from a transcript.")}
      ${fb.coverage ? `<div class="flags">${fb.count ? `<span class="pill">${fb.count} questions</span>` : ""}${Object.entries(fb.coverage).map(([k, v]) => `<span class="pill ${v ? "ok" : "bad"}">${v ? "✓" : "✗"} ${esc(k)}</span>`).join("")}</div>` : ""}
      ${fb.structure && fb.structure.length ? `<ul class="hw">${fb.structure.map((st) => `<li style="grid-template-columns:auto minmax(0,1fr)"><b style="color:var(${st.done ? "--green" : "--red"})">${st.done ? "✓" : "✗"}</b><span>${esc(st.step)}${st.comment ? `<small>${esc(st.comment)}</small>` : ""}</span></li>`).join("")}</ul>` : ""}
      <div class="stack tight"><p class="h3">Corrections</p>${errList(fb.errors, true)}</div>
      ${fb.next && fb.next.length ? `<div class="stack tight"><p class="h3">${fb.better ? "Stronger questions" : "Next time"}</p><ul class="small" style="margin:0;padding-left:20px">${fb.next.map((x) => `<li class="${fb.better ? "fr" : ""}">${typo(x)}</li>`).join("")}</ul></div>` : ""}
      <p class="small muted">Save the attempt to add these corrections to your error log.</p>
    </div>`;
  }
  function speakT1(P) {
    return `<div class="grid2">
      <section class="panel stack">
        <div class="row between"><p class="h3">Timer</p><span class="small muted">2 min on exam day, no preparation</span></div>
        ${timerUI("speaking.t1", "Tâche 1 oral", [[120, "2:00 exam"], [60, "1:00"]])}
        <p class="h3">Structure</p>
        <ol class="steps">${P.structure.map((x) => `<li style="grid-template-columns:minmax(0,1fr)"><b>${esc(x)}</b></li>`).join("")}</ol>
      </section>
      <section class="panel stack">
        <p class="h3">The examiner may ask</p>
        <ul class="phrases">${arr(P.questions).map((x) => `<li>${typo(x)}</li>`).join("")}</ul>
        <p class="h3">Useful phrases</p>
        <ul class="phrases">${P.phrases.map((x) => `<li>${typo(x)}</li>`).join("")}</ul>
        <p class="small"><b>Plateau mistake:</b> ${esc(P.mistake)}</p>
      </section>
    </div>
    <section class="panel stack">${rubricBlock("t1", P)}${transcriptBlock("t1")}<div class="row"><button class="btn primary" data-act="sp-save" data-task="t1">Save this attempt</button></div></section>`;
  }
  function speakT2(P) {
    const sc = spPrompt("t2");
    const c = ui.sp.chat;
    const cov = ui.sp.covered;
    const chat = c ? `<div class="chat" id="chat-log">${c.turns.filter((t) => !t.rules).map((t) => `<div class="msg ${t.role === "user" ? "me" : "them"}"><small>${t.role === "user" ? "Vous" : "Examinateur"}</small>${typo(t.content)}</div>`).join("")}${busy.chat ? `<div class="msg them"><small>Examinateur</small><span class="thinking">…</span></div>` : ""}</div>
      <div class="row"><input type="text" id="chat-in" data-input="chat-in" value="${esc(ui.sp.chatIn)}" lang="fr" spellcheck="false" autocomplete="off" placeholder="Posez votre question…" style="flex:1"><button class="btn primary" data-act="chat-send" ${busy.chat ? "disabled" : ""}>Send</button></div>
      ${accentBar()}
      <div class="row">${claudeBtn("chat-end", "chat-end", "End and get feedback", "", "btn")}<button class="btn ghost sm" data-act="chat-reset">Start over</button></div>`
      : claudeOn()
        ? `<p class="small muted">Claude plays the examiner in role. Type your questions in French. Aim for 5–6 well-formed ones, broad first, then specifics, then logistics.</p><div>${claudeBtn("chat", "chat-start", "Start the role-play", "", "btn primary")}</div>`
        : `<p class="small muted">Say your questions out loud to an imaginary examiner. Aim for 5–6 well-formed ones: broad first, then specifics, then logistics. Tap each topic above as you cover it.</p>`;
    return `<section class="panel prompt-card">
        <div class="row between"><span class="eyebrow">Scénario</span><button class="btn sm" data-act="sp-next" data-task="t2">Another scenario</button></div>
        <p class="fr">${typo(sc)}</p>
        <div class="chips">${P.checklist.map((k) => `<button class="chip" data-act="chip" data-k="${esc(k)}" aria-pressed="${!!cov[k]}">${esc(k)}</button>`).join("")}</div>
        <p class="small muted">Tap each topic as you cover it: your mental checklist for any scenario.</p>
      </section>
      <div class="grid2">
        <section class="panel stack">
          <div class="row between"><p class="h3">Timer</p><span class="small muted">2 min prep, then 3 min 30</span></div>
          ${timerUI("speaking.t2", "Tâche 2 oral", [[120, "2:00 prep"], [210, "3:30 talk"]])}
          <p class="h3">Useful phrases</p>
          <ul class="phrases">${P.phrases.map((x) => `<li>${typo(x)}</li>`).join("")}</ul>
          <p class="small"><b>Watch:</b> ${esc(P.mistake)}</p>
        </section>
        <section class="panel stack"><p class="h3">${c || claudeOn() ? "Role-play with Claude" : "Your questions"}</p>${chat}${ui.sp.fb.t2 ? spFbHTML(ui.sp.fb.t2) : ""}</section>
      </div>
      <section class="panel stack">${rubricBlock("t2", P)}<div class="row"><button class="btn primary" data-act="sp-save" data-task="t2">Save this attempt</button></div></section>`;
  }
  function speakT3(P) {
    const pr = P.prompts[ui.sp.t3 % P.prompts.length];
    let from = 0;
    const steps = P.steps.map((st) => { const li = `<li data-from="${from}" data-until="${st.until}"><span class="t">${fmtClock(from)}</span><b>${esc(st.label)}</b><small>${typo(st.hint)}</small></li>`; from = st.until; return li; }).join("");
    return `<section class="panel prompt-card">
        <div class="row between"><span class="eyebrow">Sujet · no preparation</span><button class="btn sm" data-act="sp-next" data-task="t3">Another prompt</button></div>
        <p class="fr" style="font-size:22px">${typo(pr[0])}</p>
        <p class="small muted">${esc(pr[1])}</p>
      </section>
      <div class="grid2">
        <section class="panel stack">
          <div class="row between"><p class="h3">Guided timer</p><span class="small muted">4 min 30</span></div>
          ${timerUI("speaking.t3", "Tâche 3 oral", [[270, "4:30 exam"]])}
          <ol class="steps">${steps}</ol>
          <p class="small muted">The highlighted step moves with the clock, so you can hear whether your shape holds for the full 4:30.</p>
        </section>
        <section class="panel stack">
          <p class="h3">Phrases</p>
          <ul class="phrases">${P.phrases.map(([k, v]) => `<li><b>${esc(k)}</b>${typo(v)}</li>`).join("")}</ul>
          <p class="small"><b>Plateau mistakes:</b> ${esc(P.mistake)}</p>
        </section>
      </div>
      <section class="panel stack">${rubricBlock("t3", P)}${transcriptBlock("t3")}<div class="row"><button class="btn primary" data-act="sp-save" data-task="t3">Save this attempt</button></div></section>`;
  }

  /* =============== view: comprehension =============== */
  VIEWS.comp = {
    render(args) {
      if (args[0] === "co" || args[0] === "ce") ui.c.skill = args[0];
      const skill = ui.c.skill;
      ensureCompSet(skill);
      const lvl = compLevel();
      const key = compKey(skill);
      const th = ui.c.theme;
      const loading = !!busy["c-gen-" + skill] || !!ui.c.inflight[key] || !ui.c.set[skill];
      const set = loading ? null : ui.c.set[skill];
      const submitted = ui.c.submitted[skill];
      const ans = ui.c.ans[skill];
      const score = set && submitted ? set.questions.filter((q, i) => ans[i] === q.answer).length : 0;
      const savedDoc = ui.c.saved[skill] && S.comp.get(ui.c.saved[skill]);
      const gaps = (savedDoc && savedDoc.gaps) || {};
      const tabs = `<nav class="tabs" role="tablist"><a href="#comp.co" role="tab" aria-selected="${skill === "co"}">CO · Écoute<small>listening</small></a><a href="#comp.ce" role="tab" aria-selected="${skill === "ce"}">CE · Lecture<small>reading</small></a></nav>`;
      const newBtn = claudeBtn("c-gen-" + skill, "c-new", th ? `New ${esc(themeLabel(th))} set from Claude` : "New set from Claude", `data-skill="${skill}"`, "btn ghost");
      // Offer "another built-in set" only when there is one to switch to at this level (and topic).
      const matching = samplesFor(skill).filter((x) => x.level === lvl && (!th || arr(x.themes).includes(th))).length;
      const nextBtn = !th || matching > 1 ? `<button class="btn" data-act="c-next" data-skill="${skill}" ${loading ? "disabled" : ""}>Another built-in set</button>` : "";
      const controls = `<div class="row">
        <div class="seg" role="group" aria-label="Level">${["B1", "B2"].map((l) => `<button data-act="c-level" data-l="${l}" aria-pressed="${lvl === l}">${l}</button>`).join("")}</div>
        <select id="c-theme" data-change="c-theme" aria-label="Topic"><option value="">Any topic</option>${COMP_TOPICS.map((t2) => `<option value="${t2.id}" ${th === t2.id ? "selected" : ""}>${esc(t2.label)}</option>`).join("")}</select>
        ${nextBtn}${newBtn}
      </div>`;
      const tagLine = (kind) => `${kind} · ${esc((set && set.level) || lvl)}${set && set.theme ? " · " + esc(themeLabel(set.theme)) : ""}${set && set.src === "sample" ? " · built-in set" : " · from Claude"}`;
      let material;
      if (loading) {
        material = `<article class="sheet"><p class="eyebrow">${skill === "co" ? "Enregistrement" : "Document"} · ${esc(lvl)}${th ? " · " + esc(themeLabel(th)) : ""}</p><h3 class="thinking">Claude is writing a new ${skill === "co" ? "listening" : "reading"} set${th ? " on " + esc(themeLabel(th)) : ""}</h3><p class="small muted">This usually takes 10–40 seconds. It stays here if you switch back to this theme later.</p></article>`;
      } else if (skill === "ce") {
        material = `<article class="sheet"><p class="eyebrow">${tagLine(esc(set.type || "Document"))}</p><h3>${typo(set.title)}</h3><p class="fr">${typo(set.text)}</p></article>`;
      } else {
        const s = settings();
        const va = bestVoice();
        const recorded = !!set.audio;
        const canPlay = recorded || !!synth;
        const weak = !recorded && (!va || voiceScore(va) < 30);
        const multi = new Set(set.lines.map((l) => l.speaker)).size > 1;
        material = `<article class="sheet"><p class="eyebrow">${tagLine("Enregistrement")}</p><h3>${typo(set.title)}</h3>${set.context ? `<p class="fr" style="font-style:italic">${typo(set.context)}</p>` : ""}
          ${canPlay ? `<div class="row">${ui.c.playing ? `<button class="btn" data-act="c-stop">Stop</button>` : `<button class="btn primary" data-act="c-play" ${ui.c.exam && ui.c.plays >= 1 ? "disabled" : ""}>${ui.c.plays ? "Play again" : "Play"}</button>`}
            <label class="field inline">Speed<select data-change="rate" id="c-rate">${[[0.8, "Slow"], [0.9, "Steady"], [1, "Natural"]].map(([r, l]) => `<option value="${r}" ${Number(s.rate) === r ? "selected" : ""}>${l}</option>`).join("")}</select></label>
            <label class="check small"><input type="checkbox" data-change="c-exam" ${ui.c.exam ? "checked" : ""}><span>Exam mode: one listen</span></label>
            <span class="small muted num">Played ${ui.c.plays}×</span></div>
            <p class="small muted">${recorded ? "Voice: Denise, a natural Microsoft neural voice, recorded for this set." : va ? `Voice: ${esc(va.name)} (${voiceTag(va)}), your browser's best French voice.` : "Voice: the browser's default."}</p>
            ${weak ? `<p class="notice small">This browser only offers basic French voices, so the audio can sound robotic. For more natural voices, open this page in Microsoft Edge (its French “Natural” voices) or Chrome (“Google français”). On a Mac you can also add an Enhanced or Premium French voice: System Settings → Accessibility → Spoken Content → System voice → Manage voices. For real recordings, use the official practice below.</p>` : ""}`
          : `<p class="notice warn small">This browser can't read text aloud. Use the transcript as a reading exercise, and the official recordings below.</p>`}
          ${ui.c.script || !canPlay ? `<div class="transcript">${set.lines.map((l) => `<p>${multi ? `<b>${esc(l.speaker)}</b>` : ""}${typo(l.text)}</p>`).join("")}</div>` : `<button class="btn ghost sm" data-act="c-script">Show the transcript</button>`}
        </article>`;
      }
      const fallback = set && set.fallback ? `<p class="notice small">There's no built-in ${esc(lvl)} set on ${esc(themeLabel(th))} yet${claudeOn() ? ", and Claude couldn't write one just now" : ""}, so here's another set.</p>` : "";
      const qs = set ? `<ol class="qs">${set.questions.map((q, i) => {
        const miss = submitted && ans[i] !== q.answer;
        return `<li><p class="fr">${typo(q.q)}</p><div class="opts">${q.order.map((k) => {
          const st = submitted ? (k === q.answer ? "ok" : ans[i] === k ? "bad" : "") : "";
          return `<label class="opt ${st}"><input type="radio" name="q${i}" data-change="c-ans" data-i="${i}" data-k="${k}" ${ans[i] === k ? "checked" : ""} ${submitted ? "disabled" : ""}><span>${typo(q.options[k])}</span></label>`;
        }).join("")}</div>
        ${submitted && q.why ? `<p class="small">${typo(q.why)}</p>` : ""}
        ${miss ? `<div class="row"><span class="small muted">This miss was a…</span><div class="seg">${[["vocab", "Vocabulary gap"], ["comp", "Comprehension gap"]].map(([k, l]) => `<button data-act="c-gap" data-i="${i}" data-k="${k}" aria-pressed="${gaps[i] === k}">${l}</button>`).join("")}</div></div>` : ""}
        </li>`;
      }).join("")}</ol>
        <div class="row">${submitted ? `<span class="scorebig">${score}/${set.questions.length}</span><button class="btn" data-act="c-reset" data-skill="${skill}">Try this set again</button>` : `<button class="btn primary" data-act="c-submit" data-skill="${skill}">Check my answers</button>`}</div>` : "";
      const res = T.COMP.resources.filter((r) => arr(r.skills).includes(skill));
      const hist = list("comp").filter((x) => x.skill === skill).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 10);
      return `<div class="wrap">
        <header class="stack tight"><h1 class="title">Compréhension<small>TCF Canada-style sets: four options, one right answer. Every topic has a built-in B1 and B2 set for both reading and listening, so switching topics is instant, and the listening sets are recorded in one natural voice. On the real test each recording plays once.</small></h1></header>
        ${tabs}
        ${controls}
        <div class="stack">${fallback}${material}${qs}</div>
        <div class="grid2">
          <section class="panel stack"><p class="h3">${skill === "co" ? "Real recordings: official practice" : "Official practice"}</p>
            <p class="small muted">${skill === "co" ? "Real voices at exam speed. Past papers aren't published, so the closest thing is practice written by the test's own designers at France Éducation International and its partners." : "Practice questions written by the test's designers and France Éducation International."} Log your scores here to keep them with the rest.</p>
            <ul class="links">${res.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a><span class="small muted">${esc(r.what)}</span></li>`).join("")}</ul></section>
          <section class="panel stack"><p class="h3">Log a score from elsewhere</p>
            <div class="grid2"><label class="field">Score<input type="number" id="cl-score" data-input="form" data-k="cl-score" value="${formVal("cl-score")}" min="0"></label><label class="field">Out of<input type="number" id="cl-total" data-input="form" data-k="cl-total" value="${formVal("cl-total")}" min="1"></label></div>
            <label class="field">Source<input type="text" id="cl-src" data-input="form" data-k="cl-src" value="${formVal("cl-src")}" placeholder="TV5MONDE TCF training, set 3"></label>
            <div class="row"><button class="btn" data-act="c-log" data-skill="${skill}">Log ${skill.toUpperCase()} score at ${esc(lvl)}</button></div>
          </section>
        </div>
        <section class="sec"><h2 class="h2">Recent ${skill.toUpperCase()} scores</h2>${hist.length ? `<div class="history">${hist.map((h) => `<span class="pill ${h.total && h.score / h.total >= 0.7 ? "ok" : ""}">${shortDate(h.date)} · ${esc(h.level || "")}${h.theme ? " · " + esc(themeLabel(h.theme)) : ""} · ${h.score}/${h.total}</span>`).join("")}</div>` : `<p class="small muted">Your first set becomes your baseline.</p>`}</section>
      </div>`;
    },
  };

  /* =============== view: progress =============== */
  VIEWS.progress = {
    render() {
      const s = settings();
      const P = T.PHASES[s.phase - 1];
      const crit = T.CRITERIA[s.phase] || [];
      const critHTML = crit.map((c) => {
        const st = criterionStatus(c);
        return `<li><span class="mark ${st.ok ? "ok" : "no"}">${st.ok ? "✓" : "○"}</span><span>${esc(c.text)}<small>${st.manual ? "Tick it yourself when it's true." : esc(st.note || "")}</small></span>${st.manual ? `<input type="checkbox" data-change="crit" data-id="${c.id}" ${st.ok ? "checked" : ""} aria-label="Done" style="width:18px;height:18px;accent-color:var(--green)">` : `<span class="pill ${st.ok ? "ok" : ""}">${st.ok ? "Met" : "Auto"}</span>`}</li>`;
      }).join("");
      const allMet = crit.length && crit.every((c) => criterionStatus(c).ok);
      const counts = errorCounts(0);
      const max = counts.length ? counts[0][1].n : 1;
      const t3 = top3();
      const recent = allErrors().slice(0, 12);
      const latest = latestScores();
      const skills = [["co", "CO · Listening"], ["ce", "CE · Reading"], ["ee", "EE · Writing"], ["eo", "EO · Speaking"]];
      const withN = skills.filter(([k]) => latest[k]).map(([k, l]) => [k, l, nclcOf(k, latest[k].v)]);
      const weakest = withN.length ? withN.slice().sort((a, b) => a[2] - b[2])[0] : null;
      const mocks = list("mocks").sort((a, b) => str(b.date).localeCompare(str(a.date)) || (b.ts || 0) - (a.ts || 0));
      const stats = [
        [list("drills").filter((d) => d.set !== "prod").length, "drill rounds"],
        [[...S.srs.keys()].length, "cards learned"],
        [list("writing").length, "writing tasks"],
        [list("speaking").length, "speaking attempts"],
        [list("comp").length, "CO / CE sets"],
      ];
      return `<div class="wrap">
        <header class="stack tight"><h1 class="title">Progrès<small>Advance on the exit criteria, not on the calendar. If a phase runs long, that tells you where the real bottleneck is.</small></h1></header>

        <section class="panel stack">
          <div class="row between"><p class="h3">Phase ${s.phase} · ${esc(P.name)} <span class="muted">· ${esc(P.weeks)}</span></p><span class="small muted">Semaine ${weekNo()}</span></div>
          <p class="small">${esc(P.goal)}</p>
          <div class="row"><div class="seg" role="group" aria-label="Phase">${T.PHASES.map((ph) => `<button data-act="p-phase" data-n="${ph.n}" aria-pressed="${ph.n === s.phase}">${ph.n}</button>`).join("")}</div>
            <label class="field" style="grid-auto-flow:column;align-items:center;gap:8px">Week 1 started<input type="date" id="p-start" data-change="start-date" value="${esc(s.startDate)}"></label></div>
          <ul class="criteria">${critHTML}</ul>
          ${allMet && s.phase < 5 ? `<div class="notice"><b>Every Phase ${s.phase} criterion is met.</b> Move to Phase ${s.phase + 1} when you're ready. <button class="btn sm primary" data-act="p-phase" data-n="${s.phase + 1}">Start Phase ${s.phase + 1}</button></div>` : ""}
        </section>

        <section class="sec" id="sec-errors">
          <div class="sec-head"><h2 class="h2">Error log</h2><span class="small muted">From Claude's corrections of your writing and speaking, plus anything you add.</span></div>
          ${counts.length ? `<div class="bars">${counts.map(([c, v]) => `<div class="b"><span>${esc(CAT[c])}</span><span class="track"><i style="width:${(v.n / max) * 100}%"></i></span><span class="c">${v.n}</span></div>`).join("")}</div>` : `<p class="empty">No errors logged yet. Correct a writing task with Claude, or add one below.</p>`}
          ${t3.length ? `<div class="panel stack"><p class="h3">Top 3 recurring issues <span class="small muted">· last 3 weeks</span></p><p class="small muted">Saturday capstone: for each, one sentence naming exactly what goes wrong and the fix. If you can't write it in one sentence, that item needs another week.</p>
            ${t3.map(([c, v]) => `<label class="field">${esc(CAT[c])} · ×${v.n} <span class="small muted" style="font-weight:400">e.g. <span class="pen-wrong">${esc(v.ex.wrong)}</span> → ${esc(v.ex.right)}</span><input type="text" id="fix-${c}" data-change="fix" data-k="${c}" value="${esc(s.fixes[c] || "")}" placeholder="What goes wrong, and the fix, in one sentence"></label>`).join("")}</div>` : ""}
          ${recent.length ? `<div class="stack tight"><p class="h3">Recent</p><ul class="errs">${recent.map((e) => `<li><div class="fix"><span class="pen-wrong">${esc(e.wrong)}</span><span class="pen-right">${esc(e.right)}</span><span class="pill">${esc(CAT[catOf(e.category)])}</span><span class="small muted">${esc(e.src)} · ${shortDate(e.date)}</span>${e.manual ? confirmBtn("e-del-" + e.id, "Delete this error", "e-del", `data-id="${esc(e.id)}"`) : ""}</div>${e.why ? `<p class="why">${esc(e.why)}</p>` : ""}</li>`).join("")}</ul></div>` : ""}
          <div class="panel stack"><p class="h3">Log an error yourself</p>
            <div class="grid2">
              <label class="field">What you wrote<input type="text" id="e-wrong" data-input="form" data-k="e-wrong" value="${formVal("e-wrong")}" lang="fr" placeholder="je achèterai"></label>
              <label class="field">Correct form<input type="text" id="e-right" data-input="form" data-k="e-right" value="${formVal("e-right")}" lang="fr" placeholder="j'achèterai"></label>
              <label class="field">Category<select id="e-cat" data-change="form" data-k="e-cat">${Object.entries(CAT).map(([k, l]) => `<option value="${k}" ${(ui.form["e-cat"] || "elision") === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
              <label class="field">Note (optional)<input type="text" id="e-why" data-input="form" data-k="e-why" value="${formVal("e-why")}"></label>
            </div>
            <div class="row"><button class="btn" data-act="e-add">Add to the log</button></div>
          </div>
        </section>

        <section class="sec" id="sec-scores">
          <div class="sec-head"><h2 class="h2">Scores and NCLC</h2><span class="small muted">IRCC scores each skill on its own and never averages. Your weakest skill is your real result for that skill.</span></div>
          ${weakest ? `<div class="notice ${weakest[2] >= 7 ? "" : "warn"}"><b>Weakest right now: ${esc(weakest[1])}</b>, NCLC ${nclcLabel(weakest[2])}. ${weakest[2] >= 7 ? "Every logged skill is at NCLC 7 or above." : "Spend most of your spare time here, not on your strongest skill."}</div>` : ""}
          <div class="table-wrap"><table class="nclc"><thead><tr><th>NCLC</th><th>CEFR</th><th>CO</th><th>CE</th><th>EE</th><th>EO</th></tr></thead><tbody>${T.NCLC.map((r) => `<tr class="${r.n === 7 ? "target" : ""}"><td>${r.nclc}${r.n === 7 ? " · your target" : ""}</td><td>${r.cefr}</td><td>${r.coR}</td><td>${r.ceR}</td><td>${r.eR}</td><td>${r.eR}</td></tr>`).join("")}</tbody></table></div>
          <div class="panel stack"><p class="h3">Log a mock or real test</p>
            <div class="grid2">
              <label class="field">Date<input type="date" id="m-date" data-input="form" data-k="m-date" value="${esc(ui.form["m-date"] || todayStr())}"></label>
              <label class="field">What was it<input type="text" id="m-label" data-input="form" data-k="m-label" value="${formVal("m-label")}" placeholder="Full mock, official sample…"></label>
              <label class="field">CO (0–699)<input type="number" id="m-co" data-input="form" data-k="m-co" value="${formVal("m-co")}" min="0" max="699"></label>
              <label class="field">CE (0–699)<input type="number" id="m-ce" data-input="form" data-k="m-ce" value="${formVal("m-ce")}" min="0" max="699"></label>
              <label class="field">EE (0–20)<input type="number" id="m-ee" data-input="form" data-k="m-ee" value="${formVal("m-ee")}" min="0" max="20"></label>
              <label class="field">EO (0–20)<input type="number" id="m-eo" data-input="form" data-k="m-eo" value="${formVal("m-eo")}" min="0" max="20"></label>
            </div>
            <p class="small muted">Leave a skill blank if you didn't sit it.</p>
            <div class="row"><button class="btn" data-act="m-add">Save scores</button></div>
          </div>
          ${mocks.length ? `<div class="table-wrap"><table class="nclc"><thead><tr><th>Date</th><th>Test</th><th>CO</th><th>CE</th><th>EE</th><th>EO</th><th></th></tr></thead><tbody>${mocks.map((m) => `<tr><td>${shortDate(m.date)}</td><td>${esc(m.label || "")}</td>${["co", "ce", "ee", "eo"].map((k) => { const n = nclcOf(k, m[k]); return `<td>${m[k] == null || m[k] === "" ? "—" : `${m[k]} <span class="tag7 ${n >= 7 ? "ok" : "no"}">${nclcLabel(n)}</span>`}</td>`; }).join("")}<td>${confirmBtn("m-del-" + m.id, "Delete this entry", "m-del", `data-id="${esc(m.id)}"`)}</td></tr>`).join("")}</tbody></table></div>` : ""}
        </section>

        <section class="sec"><h2 class="h2">Activity</h2>
          <div class="stats">${stats.map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("")}</div>
          <div class="row" style="align-items:flex-start;gap:20px"><div class="stack tight"><p class="small muted">Last 12 weeks · ${streak()}-day streak</p>${heatmap(12)}</div></div>
        </section>

        <section class="sec"><h2 class="h2">The exam, cold</h2>
          <div class="exam">${T.EXAM.map((e) => `<div><span class="sk ${e.code.toLowerCase()}">${e.code}</span><b>${esc(e.name)}</b><span class="small">${esc(e.fmt)}</span><span class="small muted">${esc(e.note)}</span></div>`).join("")}</div>
          <p class="small">A writing task can be marked <b>“A1 non atteint”</b> regardless of grammar if: ${T.AUTOFAIL.map(esc).join(" · ")}. About 2 h 47 in total.</p>
          <div class="grid2">
            <div class="stack tight"><p class="h3">How writing is graded</p><ul class="small" style="margin:0;padding-left:20px">${TC.ee.criteria.map(([n, d]) => `<li><b>${esc(n)}</b>: ${esc(d)}</li>`).join("")}</ul></div>
            <div class="stack tight"><p class="h3">How speaking is graded</p><ul class="small" style="margin:0;padding-left:20px">${TC.eo.criteria.map(([n, d]) => `<li><b>${esc(n)}</b>: ${esc(d)}</li>`).join("")}</ul></div>
          </div>
          <p class="small muted">Source: ${esc(TC.source)}. Everything on this site, including Claude's corrections and scores, follows these TCF Canada rules. Scores out of 20: B1 6–9, B2 10–13, C1 14–15, C1–C2 16–20.</p>
          <p class="small muted">From your roadmap notes: for sessions from September 1, 2026, re-marking requests for Expression écrite and orale aren't being accepted for about a year. Treat every mock as the one real attempt.</p>
        </section>

        <p class="small muted">${backend.kind === "db" ? "Everything here is saved to this page on claude.ai, so it follows you to any device where you open it." : backend.kind === "local" ? "Everything here is saved in this browser only. Open the page on claude.ai to keep it with your account." : ""}</p>
      </div>`;
    },
    after(args) {
      const tok = args.join(".");
      if (args[0] && ui.applied !== "progress." + tok) {
        ui.applied = "progress." + tok;
        const el = document.getElementById("sec-" + args[0]);
        if (el) el.scrollIntoView({ block: "start" });
      }
    },
  };

  /* =============== events =============== */
  function addHomework() {
    const v = str(ui.form.hw).trim();
    if (!v) { toast("Type a task first."); return; }
    put("homework", uid(), { text: v, created: todayStr(), ts: Date.now(), done: false, src: "Added by you" });
    ui.form.hw = "";
    render(true);
  }
  let lastField = null;
  function insertAccent(ch) {
    const el = lastField && document.body.contains(lastField) ? lastField : null;
    if (!el) return;
    const a = el.selectionStart == null ? el.value.length : el.selectionStart;
    const b = el.selectionEnd == null ? a : el.selectionEnd;
    el.setRangeText(ch, a, b, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  }
  function timerAct(el, kind) {
    const home = el.dataset.home, sec = Number(el.dataset.sec), label = el.dataset.label;
    if (kind === "preset") { timerSet(sec, label, home); }
    else if (kind === "reset") { timerSet(timer.home === home ? timer.total : sec, label, home); }
    else {
      if (timer.home !== home) timerSet(sec, label, home);
      if (timer.running) timerPause(); else timerStart();
    }
    render(true);
  }

  const ACTS = {
    day: (el) => { ui.day = el.dataset.date; render(true); },
    theme: toggleTheme,
    stop: (el) => { const c = busy[el.dataset.key]; if (c) c.abort(); },
    confirm: (el) => { ui.confirm = el.dataset.key; render(true); },
    "confirm-cancel": () => { ui.confirm = ""; render(true); },
    "hw-add": addHomework,
    "hw-suggest": suggestHomework,
    "hw-del": (el) => remove("homework", el.dataset.id),
    "drill-start": (el) => startDrill(el.dataset.topic, el.dataset.set),
    "drill-gen": (el) => drillGenerate(el.dataset.topic, el.dataset.set),
    "drill-check": drillCheck,
    "drill-next": drillNext,
    "drill-pick": (el) => drillPick(Number(el.dataset.k)),
    "drill-quit": () => { ui.drill = null; render(true); },
    "drill-close": () => { ui.drill = null; render(true); },
    "drill-retry": drillRetry,
    "drill-dispute": (el) => drillDispute(Number(el.dataset.k)),
    accent: (el) => insertAccent(el.dataset.ch),
    "prod-check": (el) => prodCheck(el.dataset.topic),
    "v-start": (el) => { if (el.dataset.mode === "new") ui.vTheme = (document.getElementById("v-theme") || {}).value || ui.vTheme; vocabStart(el.dataset.mode); },
    "v-show": () => { if (ui.vocab) { ui.vocab.shown = true; render(true); } },
    "v-grade": (el) => vocabGrade(el.dataset.ok === "1"),
    "v-quit": () => { ui.vocab = null; render(true); },
    "v-close": () => { ui.vocab = null; render(true); },
    "v-count": (el) => { ui.vCount = Number(el.dataset.n); render(true); },
    "v-dir": (el) => { ui.vDir = el.dataset.dir; lsSet("tcf-vdir", ui.vDir); render(true); },
    "v-build": (el) => vocabBuild(el.dataset.theme),
    "v-add": () => {
      const fr = str(ui.form["card-fr"]).trim(), en = str(ui.form["card-en"]).trim();
      if (!fr || !en) { toast("Fill in both the French and the English."); return; }
      const th = ui.form["card-th"] || (document.getElementById("card-th") || {}).value || "quotidien";
      put("cards", "c-" + uid(), { fr, en, ex: str(ui.form["card-ex"]).trim(), theme: th, created: todayStr(), by: "you" });
      ui.form["card-fr"] = ui.form["card-en"] = ui.form["card-ex"] = "";
      toast("Card added. It shows up under New cards for its theme.");
      render(true);
    },
    "w-next": () => { const t = ui.w.task; ui.w.gen[t] = null; ui.w.idx[t]++; render(true); },
    "w-gen": writingGenPrompt,
    "w-skeleton": () => {
      const t = ui.w.task, W = T.WRITING[t];
      const cur = ui.w.text[t] || "";
      ui.w.text[t] = cur.trim() ? cur.replace(/\s*$/, "\n\n") + W.skeleton : W.skeleton;
      lsSet("tcf-draft-" + t, ui.w.text[t]);
      render(true);
      const ta = document.getElementById("w-text");
      if (ta) ta.focus();
    },
    "w-correct": writingCorrect,
    "w-save": writingSave,
    "w-clear": () => { const t = ui.w.task; ui.w.text[t] = ""; lsSet("tcf-draft-" + t, ""); ui.w.checks[t] = {}; ui.confirm = ""; render(true); },
    "w-open": (el) => { ui.w.viewing = el.dataset.id; render(true); const fe = document.getElementById("w-fb"); if (fe) fe.scrollIntoView({ block: "start", behavior: "smooth" }); },
    "w-close": () => { ui.w.viewing = null; render(true); },
    "w-del": (el) => { if (ui.w.viewing === el.dataset.id) ui.w.viewing = null; ui.confirm = ""; remove("writing", el.dataset.id); },
    "timer-toggle": (el) => timerAct(el, "toggle"),
    "timer-reset": (el) => timerAct(el, "reset"),
    "timer-preset": (el) => timerAct(el, "preset"),
    "sp-next": (el) => { ui.sp[el.dataset.task]++; if (el.dataset.task === "t2") { ui.sp.chat = null; ui.sp.covered = {}; ui.sp.fb.t2 = null; } render(true); },
    "sp-save": (el) => spSave(el.dataset.task),
    "sp-fb": (el) => spFeedback(el.dataset.task),
    "sp-del": (el) => { ui.confirm = ""; remove("speaking", el.dataset.id); },
    chip: (el) => { const k = el.dataset.k; ui.sp.covered[k] = !ui.sp.covered[k]; render(true); },
    "chat-start": chatStart,
    "chat-send": chatSend,
    "chat-end": chatEnd,
    "chat-reset": () => { const c = busy.chat; if (c) c.abort(); ui.sp.chat = null; ui.sp.fb.t2 = null; render(true); },
    "c-level": (el) => { ui.c.level = el.dataset.l; render(true); },
    "c-next": (el) => {
      const sk = el.dataset.skill, key = compKey(sk), cur = ui.c.set[sk];
      const after = cur && cur.src === "sample" ? cur.sampleIdx : -1;
      let i = findSample(sk, compLevel(), ui.c.theme, after);
      if (i < 0) i = findSample(sk, compLevel(), "", after);
      if (i < 0) i = after + 1;
      compReset(sk);
      ui.c.set[sk] = sampleSet(sk, i, key);
      if (ui.c.theme && !arr(ui.c.set[sk].themes).includes(ui.c.theme)) ui.c.set[sk].fallback = true;
      render(true);
    },
    "c-new": (el) => { const sk = el.dataset.skill; const key = compKey(sk); delete ui.c.cache[key]; delete ui.c.failed[key]; compReset(sk); ui.c.set[sk] = null; compGenerate(sk); },
    "c-submit": (el) => compSubmit(el.dataset.skill),
    "c-reset": (el) => { const sk = el.dataset.skill; compReset(sk); if (ui.c.set[sk]) prepSet(ui.c.set[sk]); render(true); },
    "c-play": coPlay,
    "c-stop": () => { stopAudio(); render(true); },
    "c-script": () => { ui.c.script = true; render(true); },
    "c-gap": (el) => compGap(ui.c.skill, el.dataset.i, el.dataset.k),
    "c-log": (el) => {
      const sc = Number(ui.form["cl-score"]), tot = Number(ui.form["cl-total"]);
      if (!(tot > 0) || !(sc >= 0) || sc > tot) { toast("Enter a score and a total, with the score no higher than the total."); return; }
      put("comp", uid(), { skill: el.dataset.skill, level: compLevel(), title: str(ui.form["cl-src"]).trim() || "Outside practice", date: todayStr(), ts: Date.now(), score: sc, total: tot, src: "logged", gaps: {} });
      ui.form["cl-score"] = ui.form["cl-total"] = ui.form["cl-src"] = "";
      toast("Score logged.");
      render(true);
    },
    "p-phase": (el) => { saveSettings({ phase: Number(el.dataset.n) }); toast(`Phase ${el.dataset.n}: ${T.PHASES[Number(el.dataset.n) - 1].name}.`); },
    "m-add": () => {
      const f = ui.form;
      const val = (k, max) => { const v = str(f[k]).trim(); if (v === "") return null; const n = Number(v); return n >= 0 && n <= max ? n : NaN; };
      const m = { co: val("m-co", 699), ce: val("m-ce", 699), ee: val("m-ee", 20), eo: val("m-eo", 20) };
      if (Object.values(m).some((v) => Number.isNaN(v))) { toast("Check the ranges: CO and CE go to 699, EE and EO to 20."); return; }
      if (Object.values(m).every((v) => v == null)) { toast("Enter at least one score."); return; }
      const doc = { date: f["m-date"] || todayStr(), ts: Date.now(), label: str(f["m-label"]).trim() };
      Object.entries(m).forEach(([k, v]) => { if (v != null) doc[k] = v; });
      put("mocks", uid(), doc);
      ["m-co", "m-ce", "m-ee", "m-eo", "m-label"].forEach((k) => { f[k] = ""; });
      toast("Scores saved.");
      render(true);
    },
    "m-del": (el) => { ui.confirm = ""; remove("mocks", el.dataset.id); },
    "e-add": () => {
      const f = ui.form;
      const wrong = str(f["e-wrong"]).trim(), right = str(f["e-right"]).trim();
      if (!wrong || !right) { toast("Fill in what you wrote and the correct form."); return; }
      put("errors", uid(), { wrong, right, why: str(f["e-why"]).trim(), category: f["e-cat"] || (document.getElementById("e-cat") || {}).value || "autre", date: todayStr(), ts: Date.now() });
      f["e-wrong"] = f["e-right"] = f["e-why"] = "";
      render(true);
    },
    "e-del": (el) => { ui.confirm = ""; remove("errors", el.dataset.id); },
  };
  const CHANGES = {
    tick: (el) => setBlock(el.dataset.date, el.dataset.key, el.checked),
    "hw-done": (el) => { const cur = S.homework.get(el.dataset.id); if (cur) put("homework", el.dataset.id, Object.assign(clone(cur), { done: el.checked, doneOn: el.checked ? todayStr() : null })); },
    "w-check": (el) => { ui.w.checks[ui.w.task][el.dataset.k] = el.checked; },
    "sp-rubric": (el) => { const t = ui.sp.task; ui.sp.rubric[t] = ui.sp.rubric[t] || {}; ui.sp.rubric[t][el.dataset.k] = el.checked; },
    crit: (el) => { const s = settings(); s.criteria[el.dataset.id] = el.checked; saveSettings({ criteria: s.criteria }); },
    "start-date": (el) => { if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) saveSettings({ startDate: el.value }); },
    fix: (el) => { const s = settings(); s.fixes[el.dataset.k] = el.value.trim(); saveSettings({ fixes: s.fixes }); },
    form: (el) => { ui.form[el.dataset.k] = el.value; },
    "v-theme": (el) => { ui.vTheme = el.value; render(true); },
    "c-theme": (el) => { ui.c.theme = el.value; render(true); },
    "c-ans": (el) => { ui.c.ans[ui.c.skill][Number(el.dataset.i)] = Number(el.dataset.k); },
    "c-exam": (el) => { ui.c.exam = el.checked; render(true); },
    rate: (el) => { saveSettings({ rate: Number(el.value) }); if (audioEl) audioEl.playbackRate = Number(el.value); },
  };
  const INPUTS = {
    drill: (el) => { if (ui.drill) ui.drill.given = el.value; },
    "w-text": onWText,
    prod: (el) => { const t = el.dataset.topic; ui.prod[t] = Object.assign({}, ui.prod[t] || {}, { text: el.value }); },
    "sp-notes": (el) => { ui.sp.notes[ui.sp.task] = el.value; },
    "sp-trans": (el) => { ui.sp.trans[ui.sp.task] = el.value; },
    "chat-in": (el) => { ui.sp.chatIn = el.value; },
    form: (el) => { ui.form[el.dataset.k] = el.value; },
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = ACTS[el.dataset.act];
    if (!fn) return;
    if (el.tagName === "A") e.preventDefault();
    fn(el, e);
  });
  document.addEventListener("mousedown", (e) => { if (e.target.closest("[data-act='accent']")) e.preventDefault(); });
  document.addEventListener("change", (e) => {
    const el = e.target;
    const fn = el.dataset && CHANGES[el.dataset.change];
    if (fn) fn(el, e);
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    const fn = el.dataset && INPUTS[el.dataset.input];
    if (fn) fn(el, e);
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text"))) lastField = el;
  });
  document.addEventListener("pointerdown", () => { pointerDown = true; }, true);
  document.addEventListener("pointerup", () => { pointerDown = false; }, true);
  document.addEventListener("focusout", () => {
    if (!pendingRender) return;
    const retry = () => {
      if (!pendingRender) return;
      if (pointerDown || isTyping(document.activeElement)) { setTimeout(retry, 500); return; }
      render(false);
    };
    setTimeout(retry, 300);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && t.id === "drill-in" && e.key === "Enter") { e.preventDefault(); if (ui.drill && ui.drill.checked) drillNext(); else drillCheck(); return; }
    if (t && t.id === "hw-new" && e.key === "Enter") { e.preventDefault(); addHomework(); return; }
    if (t && t.id === "chat-in" && e.key === "Enter") { e.preventDefault(); chatSend(); return; }
    if (t && t.closest && t.closest("input, textarea, select, button, a, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (route.view === "grammar" && ui.drill && !ui.drill.done) {
      const it = ui.drill.items[ui.drill.i];
      if (e.key === "Enter" && ui.drill.checked) { e.preventDefault(); drillNext(); }
      else if (!ui.drill.checked && it.kind === "choice" && /^[1-9]$/.test(e.key)) { const pos = Number(e.key) - 1; if (pos < it.order.length) { e.preventDefault(); drillPick(it.order[pos]); } }
      return;
    }
    if (route.view === "vocab" && ui.vocab && !ui.vocab.finished) {
      const v = ui.vocab;
      if (v.mode === "new") { if (e.key === "2" || e.key === "Enter") { e.preventDefault(); vocabGrade(true); } else if (e.key === "3") { e.preventDefault(); vocabGrade(false); } return; }
      if (!v.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); v.shown = true; render(true); }
      else if (v.shown && e.key === "1") { e.preventDefault(); vocabGrade(false); }
      else if (v.shown && (e.key === "2" || e.key === "Enter")) { e.preventDefault(); vocabGrade(true); }
    }
  });
  window.addEventListener("hashchange", () => {
    const r = parseRoute(location.hash);
    const same = r.view === route.view && r.args.join(".") === route.args.join(".");
    route = r;
    ui.confirm = "";
    ui.applied = "";
    render(true);
    if (!same && !(r.view === "progress" && r.args[0])) window.scrollTo(0, 0);
  });

  /* =============== boot =============== */
  function boot() {
    route = parseRoute(location.hash);
    render(true);
    const c = window.claude;
    if (!c || typeof c.use !== "function") { claudeState = "none"; useLocal(); return; }
    c.use("sample").then((s) => { sample = s || null; claudeState = s ? "ready" : "none"; render(false); }, () => { claudeState = "none"; render(false); });
    c.use("db").then((db) => { if (db) useDb(db); else useLocal(); }, () => useLocal());
  }
  boot();
})();
