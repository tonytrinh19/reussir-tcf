/* Réussir le TCF — app logic. Curriculum content lives in data.js. */
(function () {
  "use strict";
  const T = window.TCF;
  const viewEl = document.getElementById("view");
  const footEl = document.getElementById("rail-foot");
  const toastEl = document.getElementById("toast");
  // On phones the navigation sticks to the top of the screen; --rail-h lets the listening controls stick just below it.
  const railEl = document.querySelector(".rail");
  if (railEl && window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty("--rail-h", railEl.offsetHeight + "px")).observe(railEl);

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
  const ICON_PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.2v13.6L18.8 12z"/></svg>`;
  const ICON_PAUSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>`;
  const ICON_STOP = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="6" y="6" width="12" height="12" rx="1.5"/></svg>`;
  const ICON_REPLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M5.4 9.6A7 7 0 1 0 12 5"/><path fill="currentColor" d="M8.3 5l4.3-3.2v6.4z"/></svg>`;
  const ICON_BACK = ICON_REPLAY;
  const ICON_FWD = `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="matrix(-1 0 0 1 24 0)"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M5.4 9.6A7 7 0 1 0 12 5"/><path fill="currentColor" d="M8.3 5l4.3-3.2v6.4z"/></g></svg>`;
  const isDark = () => document.documentElement.classList.contains("dark");
  // The theme follows the sun (theme.js): dark from sunset to sunrise, and your switch holds until the next one.
  const TH = window.TCFTheme || null;
  const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function paintTheme() {
    const dark = isDark();
    const nx = TH && TH.nextSwitch(), mine = TH && TH.override();
    const line = !nx ? "" : mine ? `ton choix · auto à ${hhmm(nx.at)}` : `auto · ${nx.mode === "dark" ? "sombre" : "clair"} à ${hhmm(nx.at)}`;
    const sun = TH && TH.sun();
    const tip = sun ? `Automatic: dark from sunset (${hhmm(sun.set)}) to sunrise (${hhmm(sun.rise)}).${mine ? ` Your choice holds until ${hhmm(nx.at)}, then it's automatic again.` : " Switch it and your choice holds until the next sunset or sunrise."}` : "";
    document.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.innerHTML = `${dark ? ICON_SUN : ICON_MOON}<span class="tb-l"><span>${dark ? "Light mode" : "Dark mode"}</span>${line ? `<small>${line}</small>` : ""}</span>`;
      b.setAttribute("aria-label", dark ? (line ? `Switch to light mode (${line})` : "Switch to light mode") : line ? `Switch to dark mode (${line})` : "Switch to dark mode");
      if (tip) b.title = tip;
    });
  }
  function toggleTheme() {
    if (TH) TH.toggle();
    else document.documentElement.classList.toggle("dark", !isDark());
    paintTheme();
  }
  document.addEventListener("tcf:theme", () => paintTheme());

  /* =============== « Pense en français »: full immersion =============== */
  // The interface in French only (i18n.js swaps each phrase on screen for Gemini's French from fr.js). It's saved in
  // your settings, so every device follows, with a copy in this browser for the first draw. Cards and the
  // explanations after an answer stay as they are: they're the learning material.
  const I18N = window.TCFI18n || null;
  let frShown = null;
  function immersion() {
    const f = loaded ? settings().fr : undefined;
    return f != null ? !!f : lsGet("tcf-fr", "") === "on";
  }
  // What Claude writes its explanations and comments in: French in immersion.
  const replyLang = () => (immersion() ? "French" : "English");
  function paintLang() {
    const on = immersion();
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.innerHTML = `<span class="fr-mark" aria-hidden="true">FR</span><span class="tb-l"><span lang="fr">Pense en français</span><small>${on ? "tout en français" : "French only, everywhere"}</small></span>`;
      b.setAttribute("aria-pressed", String(on));
      b.title = on ? "Immersion: tout le site en français. Touche pour revenir à l'anglais." : "Full immersion: the whole interface in French, no English.";
    });
  }
  // Puts the language on the page: <html lang>, data-fr (which hides the English glosses), and i18n.js.
  function applyLang() {
    const on = immersion();
    if (on === frShown) return;
    frShown = on;
    const root = document.documentElement;
    root.lang = on ? "fr" : "en";
    root.toggleAttribute("data-fr", on);
    lsSet("tcf-fr", on ? "on" : "off");
    if (I18N) I18N.set(on);
    paintLang();
  }
  function toggleLang() {
    const on = !immersion();
    lsSet("tcf-fr", on ? "on" : "off");
    if (loaded) saveSettings({ fr: on });
    applyLang();
    render(true);
    document.dispatchEvent(new CustomEvent("tcf:lang", { detail: { on, changed: true } }));
  }

  /* =============== store (claude.ai db, or this browser as a fallback) =============== */
  // "speaking" holds the attempts saved before the Oral page was removed. The site no longer reads it, but it
  // stays in the list so a save to this browser's storage keeps them.
  const COLLS = ["settings", "days", "drills", "srs", "cards", "writing", "errors", "homework", "speaking", "comp", "mocks", "inprogress", "fiches", "mistakes"];
  const S = {};
  COLLS.forEach((c) => { S[c] = new Map(); });
  const LS_KEY = "tcf-reussir-data-v1";
  let backend = { kind: "loading" };
  let loaded = false;
  let hydrated = false;
  // Every collection has arrived (loaded can also be set by the 6 s fallback, with some still on their way), and a
  // count of the changes to your progress, so the stamps are only worked out again after something changed.
  let allIn = false, dataRev = 0;
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
    dataRev++;
    scheduleRender();
    const op = ["set", coll, id, data];
    if (backend.kind === "loading") { pendingOps.push(op); return Promise.resolve(); }
    return run(op);
  }
  function remove(coll, id) {
    S[coll].delete(id);
    dataRev++;
    scheduleRender();
    const op = ["del", coll, id];
    if (backend.kind === "loading") { pendingOps.push(op); return Promise.resolve(); }
    return run(op);
  }
  // Records the site keeps but no longer reads: the rounds of the typed Your mistakes and its unfinished round,
  // replaced on 2026-10-09 by the hunt in your own text (only its rounds have src "text").
  const retired = (coll, id, v) => (coll === "drills" && !!v && v.topic === "mine" && v.set === "errors" && v.src !== "text") || (coll === "inprogress" && id === "drill--mine--errors");
  const list = (coll) => [...S[coll].entries()].filter(([id, v]) => !retired(coll, id, v)).map(([id, v]) => Object.assign({ id }, v));
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
    loaded = allIn = true;
    flushPending();
    render(false);
  }

  // Run locally with `npm start`: progress lives in the server's SQLite file (see server/).
  async function tryServer() {
    if (!/^https?:$/.test(location.protocol)) return false;
    let data;
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (!r.ok || !/json/.test(r.headers.get("content-type") || "")) return false;
      data = await r.json();
    } catch (_) { return false; }
    const req = (method, c, id, body) => fetch(`/api/data/${encodeURIComponent(c)}/${encodeURIComponent(id)}`, {
      method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined,
    }).then((r) => { if (!r.ok) throw Object.assign(new Error("HTTP " + r.status), { code: r.status === 413 ? "quota_exceeded" : "http" }); });
    // First run on the server: bring over anything this browser had saved on its own.
    const empty = COLLS.every((c) => !Object.keys(data[c] || {}).length);
    let carried = [];
    if (empty) {
      try {
        const old = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        for (const c of COLLS) for (const [id, v] of Object.entries(old[c] || {})) { (data[c] = data[c] || {})[id] = v; carried.push([c, id, v]); }
      } catch (_) { carried = []; }
    }
    for (const c of COLLS) for (const [id, v] of Object.entries(data[c] || {})) if (!S[c].has(id)) S[c].set(id, v);
    backend = { kind: "server", set: (c, id, d) => req("PUT", c, id, d), del: (c, id) => req("DELETE", c, id) };
    carried.forEach(([c, id, v]) => run(["set", c, id, v]));
    loaded = allIn = true;
    flushPending();
    render(false);
    return true;
  }

  function useDb(db) {
    let first = 0;
    const arrived = new Set();
    for (const c of COLLS) {
      db.collection(c).onSnapshot((snap) => {
        const m = new Map();
        snap.docs.forEach((d) => { if (d.exists) m.set(d.id, d.data()); });
        S[c] = m;
        dataRev++;
        if (!arrived.has(c)) { arrived.add(c); if (arrived.size >= COLLS.length) allIn = true; }
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

  /* =============== unfinished attempts =============== */
  // One `inprogress` record per unfinished activity: a drill round, a comprehension set, the practice exam,
  // a writing draft. It's written at the first real answer or keystroke, never when
  // something is only opened or generated, and it's deleted when the attempt is submitted or discarded.
  const ipPending = new Map();
  const ipLast = new Map();
  const ipGet = (id) => (retired("inprogress", id) ? null : S.inprogress.get(id) || null);
  function ipSave(id, doc, delay) {
    const prev = ipPending.get(id);
    if (prev) clearTimeout(prev.t);
    const write = () => {
      ipPending.delete(id);
      const body = JSON.stringify(doc);
      if (ipLast.get(id) === body && S.inprogress.has(id)) return;
      ipLast.set(id, body);
      const cur = S.inprogress.get(id);
      put("inprogress", id, Object.assign(JSON.parse(body), { started: (cur && cur.started) || Date.now(), updated: Date.now() }));
    };
    if (delay) ipPending.set(id, { t: setTimeout(write, delay), write }); else write();
  }
  function ipDrop(id) {
    const prev = ipPending.get(id);
    if (prev) clearTimeout(prev.t);
    ipPending.delete(id);
    ipLast.delete(id);
    if (S.inprogress.has(id)) remove("inprogress", id);
  }
  // Typing is saved 1.5 s after it stops; save it at once if the page is hidden or closed meanwhile, along with
  // this tab's copy of what's on screen (for a refresh).
  function ipFlush() {
    [...ipPending.values()].forEach((p) => { clearTimeout(p.t); p.write(); });
    examKeep();
    tabSave();
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { if (examRunning() && skillOf(ui.cx) === "co") coxPause(); ipFlush(); } });
  window.addEventListener("pagehide", ipFlush);

  /* =============== settings & derived state =============== */
  const DEFAULTS = { phase: 1, startDate: "", fixes: {}, criteria: {} };
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

  // Mon carnet: the words and phrases you save from any page (select them, then "Save to cards"). It has no
  // built-in cards. It's your own deck, like Mes cartes Anki, so it's starred in every phase.
  T.VOCAB.unshift({ id: "carnet", label: "Mon carnet", en: "What you saved from the site: select a word or phrase on any page", own: true, cards: [] });
  T.PHASES.forEach((p) => p.vocab.unshift("carnet"));
  const TOPIC = Object.fromEntries(T.TOPICS.map((t) => [t.id, t]));
  const THEME = Object.fromEntries(T.VOCAB.map((t) => [t.id, t]));
  const CAT = T.CATEGORIES;
  const catOf = (c) => (CAT[c] ? c : "autre");

  // Every Claude request starts from the TCF Canada spec in data.js, so grading and generated material follow TCF Canada.
  const TC = T.TCF_CANADA;
  const EXAM_BRIEF = "EXAM: " + TC.brief + " Score bands: " + TC.bands;
  const EE_RUBRIC = "TCF CANADA WRITING RULES: " + TC.ee.rules + " Correctors mark with standardized grids; the published criteria are: " + TC.ee.criteria.map(([n, d]) => `${n} (${d})`).join("; ") + ".";
  // For generated reading questions: on the real test the right answer doesn't stand out by its length.
  const OPTIONS_RULE = "Make the four options parallel: similar length, the same grammatical form and the same amount of detail. The correct option must not be the longest or the most precise one, and which option is longest should vary from question to question. Distractors must be plausible and reuse words from the text in misleading ways, as on the real test.";
  // A reading item at one level, as on the real test: the document, its length, what the question asks and how the options work.
  const ceLevelBrief = (lvl) => { const L = TC.ceLevels[lvl]; return `On the real test, ${lvl} items are questions ${L.items}. Each document is ${L.docs}, ${L.words[0]}–${L.words[1]} words. Its question asks ${L.asks}. ${TC.ceItemRule}`; };
  // A built-in or Claude reading set is this many documents, one question each.
  const CE_SET_SIZE = 4;
  // Exam pace for one reading question, in seconds: 60 minutes for 39 items is quicker at A1–A2 and slower at C1–C2.
  const CE_PACE = { B1: 90, B2: 105 };
  const profile = (lang) => EXAM_BRIEF + "\nLEARNER PROFILE: adult B1 learner of French preparing the TCF Canada, target NCLC 7 (B2) in all four skills. Write explanations in " + (lang || replyLang()) + ". Known recurring errors: " + T.KNOWN_ERRORS.join("; ") + "." + watchBrief();

  /* =============== UI state =============== */
  const dayIndex = daysBetween("2026-01-01", todayStr());
  const ui = {
    bento: null, // the overview's open tile
    watchPick: null, // the two mistakes being picked for a week (À surveiller), before they're kept
    day: null,
    drill: null,
    hunt: null, // the Find the mistakes text being done: its id, the words tapped, then what was found and typed
    mh: null, // a Your mistakes round: your text with your mistakes back in it, the words tapped, then each card's pick
    huntLevel: "",
    gen: {},
    prod: {},
    vocab: null,
    vTheme: "",
    vCount: 10,
    w: {
      task: "t1",
      idx: { t1: dayIndex, t2: dayIndex, t3: dayIndex },
      gen: {},
      text: { t1: lsGet("tcf-draft-t1", ""), t2: lsGet("tcf-draft-t2", ""), t3: lsGet("tcf-draft-t3", "") },
      checks: { t1: {}, t2: {}, t3: {} },
      viewing: null,
      copyOut: null, // the copied prompt, shown to copy by hand when the browser blocks the clipboard
    },
    hist: { filter: "all", limit: 30, open: null },
    rep: { open: null },
    hwSug: null,
    c: { skill: "ce", lv: { ce: "", co: "" }, theme: "", set: { ce: null, co: null }, ans: { ce: {}, co: {} }, submitted: { ce: false, co: false }, saved: { ce: null, co: null }, plays: 0, player: "idle", script: false, cache: {}, failed: {}, inflight: {}, queued: false, open: {}, t0: { ce: 0, co: 0 }, review: { ce: null, co: null }, shown: {} },
    cx: null, // the CE practice exam being taken or reviewed
    cxGen: null, // progress while Claude writes a practice exam
    cxReady: null, // a practice exam from Claude, ready to start
    form: {},
    fx: { tag: "all", q: "", cacher: false, note: "", edit: null },
    confirm: "",
    thunk: null, // a day whose stamp should land with a thunk on the next Today render
    grab: null, // the "Save to your cards" panel, while it's open
    nextUp: null, // the next bar: the block just ticked (or whose first part was just done), so it can say what's next
    xp: null, // the day L'expression du jour was turned over to its meaning
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
      if (!o.quiet) toast(claudeState === "pending" ? "Still connecting to Claude. Try again in a moment." : "Claude features work when this page is opened on claude.ai.");
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
      if (code !== "cancelled" && !o.quiet) toast(SAMPLE_COPY[code] || "Claude couldn't answer. Try again.");
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
  const timer = { total: 0, left: 0, base: 0, t0: 0, running: false, label: "", home: "", iv: 0, alerted: false, done: false };
  // After 0:00 the clock counts overtime, but only up to half the time that was set (at least 1 minute, at
  // most 10), so a clock left running in a tab you've left doesn't count on for hours. It's worked out from
  // the time it started, so it stops at the same point even if the page was in the background.
  const timerCap = () => Math.min(600, Math.max(60, Math.round(timer.total / 2)));
  let overTick = -1; // the second of overtime last ticked
  const timerRemaining = () => (timer.running ? Math.max(-timerCap(), timer.base - (Date.now() - timer.t0) / 1000) : timer.left);
  const timerStarted = () => timer.running || (timer.total > 0 && Math.abs(timer.left - timer.total) > 0.5);
  const timerCapped = () => timer.total > 0 && timerRemaining() <= -timerCap() + 0.5;
  const timerBtnLabel = () => (timer.running ? "Pause" : timer.done || timerCapped() ? "Restart" : timerStarted() ? "Resume" : "Start");
  function fmtClock(sec) { const neg = sec < -0.5; const s = Math.abs(Math.round(sec)); return (neg ? "+" : "") + Math.floor(s / 60) + ":" + pad(s % 60); }
  function timerSet(sec, label, home) { timerPause(); timer.total = timer.left = sec; timer.label = label; timer.home = home; timer.alerted = false; timer.done = false; overTick = -1; }
  function timerStart() {
    if (timer.running || !timer.total) return;
    // A clock that stopped at the end of its overtime, or because you finished, starts again from the full time.
    if (timer.done || timerCapped()) { timer.left = timer.total; timer.alerted = false; timer.done = false; }
    timer.base = timer.left; timer.t0 = Date.now(); timer.running = true;
    clearInterval(timer.iv); timer.iv = setInterval(paintTimer, 250);
  }
  function timerPause() { if (!timer.running) return; timer.left = timerRemaining(); timer.running = false; clearInterval(timer.iv); }
  // Finishing a task (Finish, Correct, Copy for another AI, Check answers) stops its clock where it is: the time
  // taken stays on the page and is what's saved with the attempt, and the sidebar's clock goes away. Returns
  // whether it was running, so a request that fails can start it again.
  function timerFinish(home) {
    if (timer.home !== home || timer.done || !timerStarted()) return false;
    const was = timer.running;
    tone("stop");
    timerPause();
    timer.done = true;
    paintTimer();
    return was;
  }
  function timerUnfinish(home, was) {
    if (timer.home !== home || !timer.done) return;
    timer.done = false;
    if (was) timerStart();
  }
  const timerTaken = () => Math.max(1, Math.round((timer.total - timerRemaining()) / 60));
  function timerElapsedMin(home) { return timer.home === home && timerStarted() ? Math.max(1, Math.round((timer.total - timerRemaining()) / 60)) : null; }
  function paintTimer() {
    const r = timerRemaining();
    // The practice exam is handed in at 0:00, as on the real test, with the bell.
    if (timer.running && r <= 0 && ui.cx && !ui.cx.done && timer.home === XSPEC[skillOf(ui.cx)].home) { timerRing("bell"); examSubmit("time"); return; }
    if (timer.running && r <= 0 && eeRunning() && timer.home === EE_HOME) { timerRing("bell"); eeHandIn("time"); return; }
    const cap = timerCap(), capMin = Math.round(cap / 60);
    if (timer.running && r <= -cap) {
      timerPause();
      toast(timer.alerted ? `${timer.label}: the clock stopped after ${capMin} min of overtime.` : `Time's up: ${timer.label}. The clock stopped after ${capMin} min of overtime.`);
      timer.alerted = true;
      timerRing("low");
    } else if (timer.running && r <= 0 && !timer.alerted) {
      timer.alerted = true;
      toast(`Time's up: ${timer.label}. The clock counts overtime for up to ${capMin} min, then stops.`);
      timerRing("bell");
    } else if (timer.running && r < -1) {
      // Overtime: a quiet tick-tock, once a second (the bell has the first second to itself).
      const k = Math.floor(-r);
      if (k !== overTick) { overTick = k; tone(k % 2 ? "tick" : "tock"); }
    }
    document.querySelectorAll("[data-timer]").forEach((el) => { el.textContent = fmtClock(r); el.classList.toggle("over", r < 0); });
    document.querySelectorAll("[data-timer-btn]").forEach((b) => { b.textContent = timerBtnLabel(); });
  }
  // At 0:00 the desk bell rings and the clock shakes like an alarm clock (motion.js, on "tcf:ring"); at the end of
  // the overtime, one low strike. The clock's own Sound button (or a card session's) turns the bell off.
  function timerRing(kind) {
    tone(kind);
    document.dispatchEvent(new CustomEvent("tcf:ring", { detail: { kind } }));
  }
  const soundBtn = (act, off, on) => `<button class="btn ghost sm v-sound" data-act="${act}" aria-pressed="${soundOn()}" title="${soundOn() ? off : on}">${ico(soundOn() ? "sound" : "mute")}${soundOn() ? "Sound" : "Muted"}</button>`;
  function timerUI(home, label, presets, def) {
    const mine = timer.home === home;
    const first = def || presets[0][0];
    const cur = mine ? timer.total : first;
    const clock = mine ? fmtClock(timerRemaining()) : fmtClock(first);
    const btn = mine ? timerBtnLabel() : "Start";
    const done = mine && timer.done;
    return `<div class="timer${done ? " done" : ""}">
      <span class="clock" ${mine ? "data-timer" : ""}>${clock}</span>${done ? `<span class="pill ok timer-done" data-m="pop" data-k="tdone-${esc(home)}-${timer.total}-${Math.round(timer.left)}">Terminé · ${timerTaken()} min</span>` : ""}
      <button class="btn sm primary" data-act="timer-toggle" data-home="${home}" data-sec="${cur}" data-label="${esc(label)}" ${mine ? "data-timer-btn" : ""}>${btn}</button>
      <button class="btn sm" data-act="timer-reset" data-home="${home}" data-sec="${cur}" data-label="${esc(label)}">Reset</button>
      <div class="seg" role="group" aria-label="Timer length">${presets.map((p) => `<button data-act="timer-preset" data-home="${home}" data-sec="${p[0]}" data-label="${esc(label)}" aria-pressed="${cur === p[0]}">${esc(p[1])}</button>`).join("")}</div>
      ${soundBtn("timer-sound", "Turn the bell off", "Turn the bell on")}
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
    // A block ticked by hand today keeps the coach's minutes for it, as one the app ticks keeps what was done.
    doc.min = Object.assign({}, doc.min);
    if (!val) delete doc.min[key];
    else if (plan && date === todayStr() && doc.min[key] == null && doc.phase === settings().phase) { const i = plan.findIndex((b, k) => blockKey(doc.phase, k) === key); if (i >= 0) doc.min[key] = coach(plan[i], i, date).min; }
    put("days", date, doc);
  }
  // Start on a block of today's plan (or in the next bar): what it opened is kept on the day, so the block knows its
  // parts, then the exercise is presented, set up, with no clock running. A block with nothing to do (no cards due)
  // is simply ticked.
  function startBlock(i) {
    const s = settings(), t = todayStr(), plan = planFor(s.phase, t), b = plan && plan[i];
    if (!b) return;
    const st = coach(b, i, t), key = st.key, cur = S.days.get(t);
    ui.nextUp = null;
    if (cur && cur.done && cur.done[key]) { goTo("#" + st.go); return; }
    if (st.empty) { setBlock(t, key, true); if (dayComplete(t)) ui.thunk = t; toast(`Nothing to do there today, so it's ticked: ${b[2]}.`); render(true); return; }
    const doc = cur ? clone(cur) : { phase: s.phase, done: {} };
    doc.went = Object.assign({}, doc.went);
    const w = doc.went[key] || {}, part = st.parts.find((x) => !x.done);
    doc.went[key] = Object.assign({ at: Date.now() }, w, { go: st.go }, part && part.clock && !w.clock ? { clock: part.clock } : {});
    doc.phase = doc.phase || s.phase;
    put("days", t, doc);
    st.launch();
  }
  // Finishing an exercise ticks off the block of today's plan it was for, once its last part is done (a block can
  // have two), with the minutes of what was done (info.min, when the exercise measured them). The next bar then
  // says what's next. See tickPart in the coach.
  function autoTick(token, info) { tickPart(token, info); }
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

  /* =============== the coach =============== */
  // Each block of today's plan becomes the exercise you need now, worked out from your progress only. Start
  // presents it set up (the level, the set, the topic, the clock's length) and starts no clock. A block's minutes
  // are its exercise's own: each part at your measured pace, plus a couple of minutes between parts. What Start
  // opened, and the parts done since, are kept on the day (days.went), so a block ticks once its last part is done;
  // the minutes of what was done are kept with the tick (days.min) for the study-time charts.
  const PACE_STEPS = [[1.5, "relaxed pace"], [1.25, "practice pace"], [1, "exam pace"]];
  const LADDER_UP = { co: 0.7, ce: 0.75, hunt: 0.75 }; // your last 3 first tries at B1 average this: B2 next
  const LADDER_DOWN = 0.5; // your last 3 at B2 average under this: back to B1
  const BACKLOG = 60; // this many cards due: today's cards are review only
  const SWITCH_MIN = 2; // between the two parts of a block: a change of task, a short break
  const CO_WPM = { B1: 160, B2: 185 }; // how fast the recordings speak (Gemini's pace at each level)
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const median = (xs) => { const s = xs.filter((x) => x > 0).sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
  const rmin = (x) => Math.max(1, Math.round(x));
  // Time spent on an activity, counted between your answers with each gap capped, so a round left open over
  // lunch doesn't count the lunch.
  function activeTick(o, cap) { const now = Date.now(); o.secs = (o.secs || 0) + Math.min(cap || 180, Math.max(0, (now - (o.lastT || now)) / 1000)); o.lastT = now; }

  // A level from first tries, oldest first, judged on the latest ones: B2 once your last 3 at B1 average `up`, and
  // B1 again when they slip under it. Your last 3 at B2 averaging under 50% bring you back to B1 too, until 3 B1
  // ones newer than them clear the bar again. From Phase 3 it's B2 unless your B2 sets say otherwise.
  function ladder(xs, up, fromB2) {
    const at = (l) => xs.filter((x) => x.level === l), b1 = at("B1").slice(-3), b2 = at("B2").slice(-3);
    const a1 = b1.length === 3 ? avg(b1.map((x) => x.r)) : null, a2 = b2.length === 3 ? avg(b2.map((x) => x.r)) : null;
    // B2 sets that went badly count until 3 B1 sets after them have cleared the bar.
    const b2Bad = a2 != null && a2 < LADDER_DOWN && !(b1.length === 3 && b1[0].i > b2[2].i);
    const level = b2Bad ? "B1" : fromB2 || (a1 != null && a1 >= up - 1e-9) ? "B2" : "B1";
    // The day you moved up: the B1 set that brought the average over the bar.
    let upDate = "";
    if (level === "B2" && !fromB2 && b1.length === 3) {
      const before = at("B1").slice(-4, -1);
      if (before.length < 3 || avg(before.map((x) => x.r)) < up - 1e-9) upDate = b1[2].date;
    }
    const w = level === "B1" ? b1 : b2;
    return { level, have: w.length ? avg(w.map((x) => x.r)) : null, n: w.length, up, upDate, a1, a2 };
  }
  function compLadder(skill) {
    const xs = firstTries(list("comp").filter((c) => c.skill === skill && c.kind !== "exam" && c.total && (c.level === "B1" || c.level === "B2")));
    return ladder(xs.map((c, i) => ({ i, level: c.level, r: c.score / c.total, date: c.date })), LADDER_UP[skill], settings().phase >= 3);
  }
  function huntLadder() {
    const seen = new Set();
    const xs = list("drills").filter((d) => d.topic === "hunt" && d.total).sort((a, b) => (a.ts || 0) - (b.ts || 0)).filter((d) => !seen.has(d.text) && seen.add(d.text));
    return ladder(xs.map((d, i) => ({ i, level: d.level, r: d.score / d.total, date: d.date })), LADDER_UP.hunt, settings().phase >= 3);
  }
  // The reading clock: relaxed, practice or exam pace (150%, 125% and 100% of exam pace). It starts at exam pace
  // (or wherever `start` says) and moves after each timed first try at that level: a step faster for 3/4 or better
  // inside the clock, a step slower for one more than 15% over it or under 2/4. A time that can't be right (a set
  // left open for hours) is skipped.
  function cePace(level, start) {
    const per = CE_PACE[level] || 90;
    let k = start == null ? 2 : start, last = null;
    for (const c of firstTries(list("comp").filter((x) => x.skill === "ce" && x.kind !== "exam" && x.total))) {
      if (c.level !== level || !c.timed || !(c.secs > 0) || c.secs > 3 * per * c.total) continue;
      const clock = PACE_STEPS[k][0] * per * c.total, r = c.score / c.total;
      if (c.secs <= clock + 5 && r >= 0.75 - 1e-9) k = Math.min(2, k + 1);
      else if (c.secs > clock * 1.15 || r < 0.5) k = Math.max(0, k - 1);
      last = c;
    }
    return { k, label: PACE_STEPS[k][1], clock: Math.round(PACE_STEPS[k][0] * per * CE_SET_SIZE), last };
  }
  const paceClock = (level, k) => Math.round(PACE_STEPS[k][0] * (CE_PACE[level] || 90) * CE_SET_SIZE);
  // Error categories in your last n corrected texts, with an example of each.
  function recentCats(n) {
    const ws = list("writing").filter((w) => w.fb && Array.isArray(w.fb.errors)).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, n);
    const counts = new Map(), ex = new Map();
    ws.forEach((w) => w.fb.errors.forEach((e) => { const c = catOf(e.category); counts.set(c, (counts.get(c) || 0) + 1); if (!ex.has(c)) ex.set(c, e); }));
    return { n: ws.length, counts, ex, top: [...counts.entries()].sort((a, b) => b[1] - a[1]) };
  }
  // A topic is done once its mastery criterion is met and its B2 set is too.
  function topicDone(tp) {
    if (!topicMastery(tp).ok) return false;
    const b2 = tp.sets.find((x) => x.level === "B2");
    return !b2 || coldMet(tp.id, b2.id, tp.criterion.pct, tp.criterion.days || 2).ok;
  }
  // How much each grammar topic up to your phase needs you: 2 points for each error in its category in your last
  // 3 corrected texts, 1 for each error-log entry in the last 21 days, 1 for each miss on its sentences in the
  // last 14 days. Most needed first.
  function gramNeed() {
    const phase = settings().phase, rc = recentCats(3), since = addDays(todayStr(), -21), from = Date.now() - 14 * 864e5;
    const logN = new Map(), miss = new Map();
    list("errors").forEach((e) => { if ((e.date || "") >= since) { const c = catOf(e.category); logN.set(c, (logN.get(c) || 0) + 1); } });
    list("drills").forEach((d) => {
      if (d.set === "prod") return;
      // A copy: on claude.ai saved progress is read-only, and the round's own list mustn't change anyway.
      const its = (d.ts || 0) >= from ? arr(d.items).slice() : [];
      retriesOf(d).forEach((r) => { if ((r.ts || 0) >= from) its.push(...arr(r.items)); });
      its.forEach((it) => { const k = it.topic || d.topic; if (!it.ok && TOPIC[k]) miss.set(k, (miss.get(k) || 0) + 1); });
    });
    return T.TOPICS.filter((tp) => tp.phase <= phase).map((tp) => {
      const w = rc.counts.get(tp.id) || 0, l = logN.get(tp.id) || 0, m = miss.get(tp.id) || 0;
      return { tp, need: 2 * w + l + m, w, l, m, ex: rc.ex.get(tp.id) };
    }).sort((a, b) => b.need - a.need);
  }
  // The topics this phase's week already gives a slot to.
  const weekTopics = (phase) => new Set(arr((T.PLAN[phase] || {}).days).flat().map((b) => b[5]).filter((g) => /^grammar\.[a-z]/.test(g)).map((g) => g.split(".")[1]).filter((id) => TOPIC[id]));
  // Your own pace: seconds a drill question (your last 5 rounds that kept their time), seconds a review card and
  // a new card (your last 5 sessions), and minutes for each writing task (your last 3 on the clock).
  function myPace() {
    const rounds = list("drills").filter((d) => d.secs > 0 && d.total && d.set !== "prod" && d.topic !== "hunt" && d.topic !== "mine").sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5);
    const p = settings().pace || {};
    // Kept within believable bounds, so one rushed round or a session left open doesn't skew the plan.
    const within = (x, lo, hi, d) => (x ? Math.min(hi, Math.max(lo, x)) : d);
    // Seconds a review card (its repeats after a miss included) and a new card (its checks included). Sessions
    // before the checks kept seconds an answer (rev) and seconds to read a new card (nw), used until there are new
    // figures: a new card's two checks come to about one review answer, as you saw it a minute before.
    const rev = within(median(arr(p.rev)), 3, 40, 8), nw = within(median(arr(p.nw)), 8, 90, 25);
    return { q: within(median(rounds.map((d) => d.secs / d.total)), 15, 120, 30), rc: within(median(arr(p.rc)), 3, 60, rev * 1.1), nc: within(median(arr(p.nc)), 10, 150, nw + rev) };
  }
  const writeMin = (task) => median(list("writing").filter((w) => w.task === task && w.minutes > 0).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 3).map((w) => w.minutes));
  const coWords = (set) => arr(set && set.lines).reduce((n, l) => n + countWords(l.text), 0);
  // The clock is set for a task without starting it, unless another task's clock is already going.
  function presetClock(sec, label, home) {
    const going = timer.total && !timer.done && (timer.running || timerStarted());
    if (going && timer.home !== home) { toast(`Your ${timer.label} clock is still going, so this one wasn't set.`); return; }
    if (going) return;
    timerSet(sec, label, home);
  }
  const wentOf = (date, key) => { const d = S.days.get(date); return (d && d.went && d.went[key]) || null; };
  const didOf = (w) => (w && w.did) || {};
  const partHit = (p, token) => (p.exact ? token === p.tok : token === p.tok || token.startsWith(p.tok + "."));
  const chip = (t, cls) => ({ t, cls: cls || "" });

  // Listening and reading: one set at your level (reading's clock at your pace), your misses gone over, and a pass
  // adds a stretch set: one pace step faster, or at exam pace already, the next level at relaxed pace.
  function compStep(skill, b, key, date) {
    const w = wentOf(date, key), lad = compLadder(skill), P = phaseInfo();
    const done = list("comp").filter((c) => c.skill === skill && c.kind !== "exam" && c.date === date && (c.ts || 0) >= ((w && w.at) || 0)).sort((a, b2) => (a.ts || 0) - (b2.ts || 0));
    const first = firstTries(list("comp").filter((c) => c.skill === skill && c.kind !== "exam" && c.total));
    const accAt = (lvl) => { const xs = first.filter((c) => c.level === lvl).slice(-3); return xs.length ? avg(xs.map((c) => c.score / c.total)) : 0.7; };
    const passOf = (c, clock) => c.score / c.total >= (skill === "ce" ? 0.75 : 5 / 6) - 1e-9 && (skill !== "ce" || !c.timed || !(c.clock || clock) || c.secs <= (c.clock || clock) + 5);
    const pPass = (lvl) => { const xs = first.filter((c) => c.level === lvl).slice(-3); return xs.length ? xs.filter((c) => passOf(c)).length / xs.length : 0; };
    const nextSet = (lvl) => { const all = samplesFor(skill), i = findSample(skill, lvl, "", -1); return i >= 0 ? all[i] : null; };
    const n = skill === "ce" ? CE_SET_SIZE : 6;
    // A set's minutes: reading, its clock and about 2 min a miss; listening, the recording, a minute to answer, and
    // with any misses the recording again with the transcript and about a minute on each miss.
    const setMin = (lvl, clock, att) => {
      const misses = att ? att.total - att.score : n * (1 - accAt(lvl));
      if (skill === "ce") return (att && att.timed && att.secs > 0 && att.secs <= 3 * (CE_PACE[lvl] || 90) * att.total ? att.secs : clock || paceClock(lvl, 0)) / 60 + 2 * misses;
      const set = (att && samplesFor("co").find((s) => s.id === att.setId)) || nextSet(lvl);
      const rec = set ? coWords(set) / (CO_WPM[lvl] || 160) : 3;
      return rec + 1 + (misses > 0.5 ? rec + misses : 0);
    };
    const lvl = done[0] ? done[0].level : lad.level;
    const pace = skill === "ce" ? cePace(lvl) : null;
    // Phase 1's reading sets are untimed diagnostics.
    const untimed = skill === "ce" && settings().phase === 1;
    const clock1 = skill === "ce" && !untimed ? (done[0] && done[0].clock) || (w && w.clock) || pace.clock : 0;
    // The stretch: a step faster at the same level, or the next level at relaxed pace once at exam pace (another
    // B2 set at B2). Listening has no clock, so its stretch is a B2 set.
    const stretchOf = (lvl0, k0) => {
      if (skill === "co") return { level: "B2", clock: 0 };
      if (k0 < 2) return { level: lvl0, clock: paceClock(lvl0, k0 + 1), k: k0 + 1 };
      if (lvl0 === "B1") { const p2 = cePace("B2", 0); return { level: "B2", clock: p2.clock, k: p2.k }; }
      return { level: "B2", clock: paceClock("B2", 2), k: 2 };
    };
    const k1 = skill === "ce" ? PACE_STEPS.findIndex((s) => Math.round(s[0] * (CE_PACE[lvl] || 90) * CE_SET_SIZE) === clock1) : -1;
    const st = stretchOf(lvl, k1 < 0 ? (pace ? pace.k : 2) : k1);
    const passed = done[0] ? passOf(done[0], clock1) : false;
    const parts = [{ kind: "set", tok: "comp." + skill, exact: true, done: !!done[0], level: lvl, clock: clock1, min: setMin(lvl, clock1, done[0]) }];
    if (passed && !untimed) parts.push({ kind: "stretch", tok: "comp." + skill, exact: true, done: !!done[1], level: st.level, clock: st.clock, min: setMin(st.level, st.clock, done[1]) });
    const expect = done[0] || untimed ? 0 : pPass(lvl) * (SWITCH_MIN + setMin(st.level, st.clock));
    const min = parts.reduce((a, p) => a + p.min, 0) + (parts.length > 1 ? SWITCH_MIN : 0) + expect;
    const cl = (c) => `${fmtClock(c)} clock`;
    const kName = (c, l) => { const k = PACE_STEPS.findIndex((s) => Math.round(s[0] * (CE_PACE[l] || 90) * CE_SET_SIZE) === c); return k >= 0 ? PACE_STEPS[k][1] : ""; };
    const passTxt = skill === "ce" ? "3/4 in time" : "5/6+";
    const stTxt = skill === "ce" ? (st.level !== lvl ? `a ${st.level} set at ${fmtClock(st.clock)}` : `a second set at ${fmtClock(st.clock)}`) : (st.level === lvl ? "a second B2 set" : "a B2 set");
    let line1, line2, chips = [];
    const cur = parts.find((p) => !p.done);
    if (!done[0]) {
      line1 = untimed ? `${lvl} set, untimed, then your misses.` : skill === "ce" ? `${lvl} set · ${cl(clock1)} (${kName(clock1, lvl)}), then your misses.` : `${lvl} set: once through, then your misses with the transcript.`;
      line2 = untimed ? "A baseline: no clock yet." : `${passTxt} → ${stTxt}.`;
      chips = skill === "ce" && !untimed ? [chip(lvl, "lvl"), chip(fmtClock(clock1) + " · " + kName(clock1, lvl))] : [chip(lvl, "lvl")];
    } else if (cur) {
      line1 = skill === "ce" ? `Part 2 · ${cur.level} set · ${cl(cur.clock)} (${kName(cur.clock, cur.level)}).` : `Part 2 · ${cur.level} set: once through, then your misses.`;
      line2 = `Part 1: ${done[0].score}/${done[0].total}${skill === "ce" && done[0].timed ? ` in ${fmtClock(done[0].secs)}` : ""}. Well done.`;
      chips = [chip(cur.level, "lvl")].concat(skill === "ce" ? [chip(fmtClock(cur.clock) + " · " + kName(cur.clock, cur.level))] : []);
    } else {
      line1 = `Done: ${done.slice(0, parts.length).map((c) => `${c.score}/${c.total}`).join(" then ")}.`;
      line2 = passed || !done[0] ? "" : `${passTxt} adds a stretch set next time.`;
    }
    const meter = lad.level === "B1" ? { label: `B2 at ${pct(lad.up)}`, have: lad.have, need: lad.up } : { label: "B2 · stay above 50%", have: lad.have, need: LADDER_DOWN };
    let adapted = "";
    if (lad.level !== P.level) adapted = lad.level === "B2" ? `Your last 3 B1 ${skill === "co" ? "listening" : "reading"} sets averaged ${pct(lad.a1)}: B2 from now on.` : `Your last 3 B2 sets averaged ${pct(lad.a2)}: B1 until 3 B1 sets average ${pct(lad.up)}.`;
    if (skill === "ce" && !adapted && !untimed && pace.k < 2) adapted = pace.last ? `Last set: ${pace.last.score}/${pace.last.total} in ${fmtClock(pace.last.secs)}, so a little more time: accuracy first, then speed.` : "";
    const launch = () => {
      const p = cur || parts[parts.length - 1];
      ui.c.skill = skill;
      ui.c.lv[skill] = p.level;
      ui.c.theme = "";
      if (skill === "ce" && !untimed) presetClock(p.clock || paceClock(p.level, 2), "Lecture CE", "comp.ce");
      // A set already checked gives way to the next one.
      const key2 = compKey(skill), last = ui.c.shown[key2], cs = ui.c.set[skill];
      if (last && last.saved) delete ui.c.shown[key2];
      if (cs && cs.key === key2 && ui.c.submitted[skill]) ACTS["c-next"]({ dataset: { skill } });
      goTo("#comp." + skill);
    };
    return { go: "comp." + skill, line1, line2, chips, meter, adapted, stamp: lad.upDate === date && lad.level === "B2" ? "B2 débloqué" : "", parts, min, launch };
  }
  // A practice exam: the next built-in one not done yet. Start opens the exam page; the exam's own clock starts
  // only when you start it there.
  function examStep(skill, merged, key, date) {
    const X = XSPEC[skill], doneIds = new Set(list("comp").filter((c) => c.kind === "exam" && skillOf(c) === skill && c.date < date).map((c) => c.setId));
    const w = wentOf(date, key), handed = list("comp").some((c) => c.kind === "exam" && skillOf(c) === skill && c.date === date && (c.ts || 0) >= ((w && w.at) || 0)) || !!didOf(w).exam;
    const ex = X.bank().find((e) => !doneIds.has(e.id));
    const mins = X.spec.minutes || (skill === "co" ? 35 : 60);
    const line1 = ex ? `${ex.title} · ${skill === "co" ? "each recording once" : "39 questions"}, ${mins} min, nothing blank.` : skill === "ce" && claudeOn() ? "Every built-in exam done: Claude writes you a new one." : `Every built-in exam done: a retake is practice, and its score won't count.`;
    return { go: X.home, title: merged ? `Examen blanc ${skill.toUpperCase()}` : null, line1: handed ? "Handed in: go over the questions you missed." : line1, line2: "Then go over the questions you missed.", chips: [chip(ex ? ex.title : "Examen blanc")], parts: [{ kind: "exam", tok: X.home, exact: true, done: handed, min: mins + 10 }], min: mins + 10, launch: () => goTo("#" + X.home) };
  }
  // A grammar topic block: the set that counts toward mastery, then its B2 set; once both are mastered, the slot
  // goes to your biggest grammar blocker not already in this week's plan.
  function grammarStep(b, key, date) {
    const parts0 = b[5].split("."), phase = settings().phase, pace = myPace();
    let tp = TOPIC[parts0[1]], setId = parts0[2] || "", adapted = "", title = null;
    const needs = gramNeed();
    if (!tp || topicDone(tp)) {
      const wk = weekTopics(phase), was = tp;
      const pick = needs.find((x) => x.need > 0 && (!wk.has(x.tp.id) || !was) && !topicDone(x.tp)) || needs.find((x) => !wk.has(x.tp.id) && !topicMastery(x.tp).ok && x.tp.phase === phase);
      if (pick) {
        const why = [pick.w ? `${CAT[pick.tp.id] || pick.tp.title} ×${pick.w} in your last texts` : "", pick.m ? `${pick.m} misses in drills` : ""].filter(Boolean).join(", ");
        adapted = was ? `${was.title} is mastered, so the slot goes to ${pick.tp.title}${why ? ` (${why})` : ""}.` : `Your biggest blocker: ${pick.tp.title}${why ? ` (${why})` : ""}.`;
        tp = pick.tp; setId = ""; title = tp.title;
      } else if (!tp) { tp = (needs[0] || {}).tp || T.TOPICS[0]; title = tp.title; }
    }
    const m = topicMastery(tp), b2 = tp.sets.find((x) => x.level === "B2");
    if (!setId || !tp.sets.some((x) => x.id === setId)) setId = m.ok && b2 ? b2.id : tp.criterion.set;
    const set = tp.sets.find((x) => x.id === setId) || tp.sets[0];
    const n = Math.min(set.take, set.items.length);
    const w = wentOf(date, key), did = didOf(w);
    const firsts = drillsFor(tp.id, set.id).filter((d) => d.total), last = firsts[firsts.length - 1];
    const acc = last ? last.score / last.total : 0.7;
    const est = (n + n * (1 - acc)) * pace.q / 60;
    const cm = coldMet(tp.id, set.id, tp.criterion.pct, tp.criterion.days || 2);
    const ipId = `drill--${tp.id}--${set.id}`;
    const roundDone = typeof did.round === "number" ? did.round : did.round ? est : 0;
    const today = drillsFor(tp.id).filter((d) => d.date === date && (d.ts || 0) >= ((w && w.at) || 0)).pop();
    return {
      go: "grammar." + tp.id, title, adapted,
      line1: today && did.round ? `Done: ${today.score}/${today.total}${retriesOf(today).length ? `, then retried ${retryScores(today)}` : ""}.` : `${set.level === "B2" ? "B2 set · " : ""}${n} questions, then retry your misses.`,
      line2: cm.ok ? (m.ok && !b2 ? "Mastered: a round keeps it fresh." : "This set is mastered: a round keeps it fresh.") : `Mastered at ${pct(cm.p)} on ${cm.need} days a week apart (${Math.min(cm.n, cm.need)}/${cm.need}).`,
      chips: [chip(set.level, "lvl"), chip(`${n} questions`)],
      meter: null,
      parts: [{ kind: "round", tok: "grammar." + tp.id, done: !!did.round, min: roundDone || est }],
      min: roundDone || est,
      launch: () => {
        if (ipGet(ipId) && !(ui.drill && ui.drill.topic === tp.id && !ui.drill.done)) { ipResume(ipId); return; }
        if (!(ui.drill && ui.drill.topic === tp.id && ui.drill.set === set.id && !ui.drill.done)) startDrill(tp.id, set.id);
        goTo("#grammar." + tp.id);
      },
    };
  }
  function mixedStep(key, date) {
    const pace = myPace(), did = didOf(wentOf(date, key));
    const est = (15 + 15 * 0.3) * pace.q / 60;
    return {
      go: "grammar.mixed", line1: did.round ? "Done." : "15 questions from every topic so far, most missed first.", line2: "Then retry your misses.",
      chips: [chip("15 questions")], parts: [{ kind: "round", tok: "grammar.mixed", done: !!did.round, min: typeof did.round === "number" ? did.round : est }], min: typeof did.round === "number" ? did.round : est,
      launch: () => {
        if (ipGet("drill--mixed") && !(ui.drill && ui.drill.topic === "mixed" && !ui.drill.done)) { ipResume("drill--mixed"); return; }
        if (!(ui.drill && ui.drill.topic === "mixed" && !ui.drill.done)) startDrill("mixed", "main");
        goTo("#grammar.mixed");
      },
    };
  }
  // Find the mistakes at your level: B2 texts once your last 3 B1 texts average 75% caught.
  function huntStep(key, date, adapted) {
    const lad = huntLadder(), lvl = lad.level, pr = huntNext(lvl), did = didOf(wentOf(date, key));
    const est = pr ? countWords(pr.text.replace(/\{\d+\}/g, " x ")) / 120 + pr.mistakes.length * 0.75 : 6;
    const min = typeof did.text === "number" ? did.text : est;
    return {
      go: "grammar.hunt", title: adapted ? "Find the mistakes" : null, adapted: adapted || (lvl !== (settings().phase <= 2 ? "B1" : "B2") ? `Your last 3 B1 texts averaged ${pct(lad.up)}+: B2 texts now.` : ""),
      line1: did.text ? "Done." : `${lvl} text · ${pr ? pr.mistakes.length : 4} mistakes to find, then correct.`,
      line2: lvl === "B1" ? `B2 texts at ${pct(lad.up)} caught${lad.have != null ? ` · now ${pct(lad.have)}` : ""}.` : "",
      chips: [chip(lvl, "lvl")], meter: lvl === "B1" ? { label: `B2 at ${pct(lad.up)}`, have: lad.have, need: lad.up } : null,
      parts: [{ kind: "text", tok: "grammar.hunt", exact: true, done: !!did.text, min }], min,
      launch: () => { ui.huntLevel = lvl; if (!(ui.hunt && !ui.hunt.verdicts)) huntStart(); goTo("#grammar.hunt"); },
    };
  }
  // Your mistakes: the next of your texts, or the « Hors texte » cards. With nothing left to practise, the block
  // becomes Find the mistakes.
  function mineStep(key, date) {
    const all = mineAll(), pr = mineNextText(all), did = didOf(wentOf(date, key));
    const loose = mineLoose(all.filter((m) => m.kind === "error" || m.kind === "pending"), 3, new Set(pr ? pr.mistakes.map((x) => norm(x[4])) : []));
    if (!did.text && !pr && !loose.length) {
      if (mineBacklog().length && claudeOn()) return { go: "grammar.mine", line1: `${mineBacklog().length} of your texts to prepare first.`, line2: "Prepare them with Claude on the page.", chips: [], parts: [{ kind: "text", tok: "grammar.mine", min: 2 }], min: 2, launch: () => goTo("#grammar.mine") };
      return huntStep(key, date, "No mistakes of yours left to practise, so it's Find the mistakes today.");
    }
    const errs = all.filter((m) => m.kind === "error"), fixed = errs.filter((m) => m.state === "fixed").length;
    const nCards = (pr ? pr.mistakes.length : 0) + loose.length;
    const est = (pr ? countWords(pr.text.replace(/\{\d+\}/g, " x ")) / 120 : 0) + nCards * 0.5;
    const min = typeof did.text === "number" ? did.text : est;
    return {
      go: "grammar.mine", line1: did.text ? "Done." : pr ? `Your text « ${clip(pr.title, 52)} » · ${pr.mistakes.length} mistakes to find, then fix.` : `${loose.length} of your mistakes, one card each.`,
      line2: `Fixed once caught twice in a row · ${fixed} of ${errs.length} so far.`,
      chips: [chip(`${nCards} mistakes`)], parts: [{ kind: "text", tok: "grammar.mine", done: !!did.text, min }], min,
      launch: () => { if (!(ui.mh && !ui.mh.done)) mhStart(); goTo("#grammar.mine"); },
    };
  }
  // Cards: the due ones first, then new ones, from (first that applies, while it has new cards) a topic whose
  // reading or listening misses you tagged as vocabulary gaps lately, Pièges once a week while word choice or
  // micro-errors lead your mistakes, the planned theme, or the phase's next theme. 60+ due: review only.
  function vocabStep(b, key, date) {
    const cards = allCards(), due = dueIds(cards).length, pace = myPace(), w = wentOf(date, key), did = didOf(w);
    const planned = b[5].split(".")[2] || "";
    const hasNew = (th) => THEME[th] && themeCards(th, cards).some(isNew);
    let theme = "", why = "";
    if (planned) {
      const since = addDays(date, -14), gapTh = new Map();
      list("comp").forEach((c) => { if ((c.date || "") >= since && c.theme) Object.values(c.gaps || {}).forEach((g) => { if (g === "vocab") gapTh.set(c.theme, (gapTh.get(c.theme) || 0) + 1); }); });
      const gap = [...gapTh.entries()].sort((a, b2) => b2[1] - a[1]).find(([th]) => hasNew(th));
      const top2 = recentCats(3).top.slice(0, 2).map(([c]) => c);
      const mon = mondayOf(date);
      const piegesWeek = [...S.srs.entries()].some(([id, st]) => st && st.learned >= mon && id.startsWith("pieges--"));
      if (gap) { theme = gap[0]; why = `You tagged ${gap[1]} ${THEME[theme].label} miss${gap[1] > 1 ? "es" : ""} as vocabulary gaps.`; }
      else if ((top2.includes("lexique") || top2.includes("micro")) && hasNew("pieges") && !piegesWeek) { theme = "pieges"; why = `Pièges this week: ${top2.includes("lexique") ? "word choice" : "micro-errors"} lead your last texts' mistakes.`; }
      else if (hasNew(planned)) theme = planned;
      else { theme = defaultTheme(); if (theme !== planned) why = `${(THEME[planned] || {}).label || planned} has no new cards left, so ${THEME[theme].label}.`; }
    }
    const backlog = due >= BACKLOG;
    const newOn = !!planned && !backlog && hasNew(theme);
    const nNew = newOn ? Math.min(ui.vCount, themeCards(theme, cards).filter(isNew).length) : 0;
    const parts = [];
    if (due > 0 || did.review) parts.push({ kind: "review", tok: planned ? "vocab.review" : "vocab", exact: !!planned, done: !!did.review, min: typeof did.review === "number" ? did.review : Math.min(due, 100) * pace.rc / 60 });
    if (newOn || did.new) parts.push({ kind: "new", tok: "vocab.new", exact: true, done: !!did.new, min: typeof did.new === "number" ? did.new : nNew * pace.nc / 60 });
    const min = parts.reduce((a, p) => a + p.min, 0) + (parts.length > 1 ? SWITCH_MIN : 0);
    const cur = parts.find((p) => !p.done);
    const lbl = THEME[theme] ? THEME[theme].label : "";
    const line1 = !parts.length ? "Nothing due today: tick it off." : !cur ? "Done." : cur.kind === "new" ? `${nNew} new · ${lbl}.` : newOn ? `${due} due, then ${nNew} new · ${lbl}.` : `${due} due card${due === 1 ? "" : "s"}${planned && !backlog ? " · no new ones left to learn" : ""}.`;
    const adapted = backlog && planned ? `${due} cards due: new cards wait until fewer than ${BACKLOG} are due.` : why;
    return {
      go: "vocab", title: backlog && planned ? "Cards: review only today" : newOn && theme !== planned ? `Cards + ${nNew} new: ${lbl}` : null, adapted, line1, line2: cur && cur.kind === "new" ? "Each new card comes back twice in the session, to check you can recall it." : "Recall each card before you flip it. A miss comes back until you get it.",
      chips: [due ? chip(`${due} due`) : null, nNew ? chip(`${nNew} new`) : null].filter(Boolean), parts, min: parts.length ? min : 1, empty: !parts.length,
      launch: () => {
        if (ui.vocab && !ui.vocab.finished) { goTo("#vocab"); return; }
        const p = cur || parts[0];
        if (p && p.kind === "new") { ui.vTheme = theme; vocabStart("new"); } else if (p) vocabStart("review");
        goTo("#vocab");
      },
    };
  }
  // A writing task: a prompt you haven't written yet (or your draft), with the task's exam clock set, not started.
  function writingStep(b, key, date) {
    const task = b[5].split(".")[1], did = didOf(wentOf(date, key));
    // The Examen blanc EE: Start opens its page, where its own Start runs the 60-minute clock.
    if (task === "mock") {
      const last = eeMocks()[0];
      const off = last ? EE_TASKS.filter((t) => { const w = last.tasks[t], W = T.WRITING[t]; return !w || w.words < W.min || w.words > W.max; }).length : 0;
      const line2 = !last ? "Then Claude corrects all three, and the mock gets a score out of 20." : last.score != null ? `Last mock, ${shortDate(last.date)}: ${last.score}/20${off ? `, ${off} task${off > 1 ? "s" : ""} outside the word range` : ""}.` : `Last mock, ${shortDate(last.date)}: not corrected yet.`;
      const min = typeof did.write === "number" ? did.write + 10 : EE_MIN + 10;
      return { go: EE_HOME, line1: did.write ? "Done: read the three corrections." : "All three tasks on one 60:00 clock, as on the real test.", line2, chips: [chip("3 tâches · 60 min")], parts: [{ kind: "write", tok: EE_HOME, exact: true, done: !!did.write, min }], min, launch: () => goTo("#" + EE_HOME) };
    }
    if (!T.WRITING[task]) {
      // Rewrite from memory: this week's best-scored correction (or the latest one).
      const mon = mondayOf(date), ws = list("writing").filter((x) => x.fb).sort((a, b2) => (b2.ts || 0) - (a.ts || 0));
      const best = ws.filter((x) => x.date >= mon).sort((a, b2) => (Number(b2.fb.score20) || 0) - (Number(a.fb.score20) || 0))[0] || ws[0];
      const WW = best && T.WRITING[best.task];
      return { go: "writing", line1: best ? `Your ${WW ? WW.name : "text"} of ${shortDate(best.date)}: reread the correction, close it, write it again.` : "No corrected text yet this week.", line2: "Then compare: are the corrected forms in it?", chips: [], parts: [{ kind: "write", tok: "writing", done: !!did.write, min: b[1] }], min: b[1],
        launch: () => { if (best) { ui.w.task = best.task; ui.w.viewing = best.id; goTo("#writing." + best.task); } else goTo("#writing"); } };
    }
    const W = T.WRITING[task], own = writeMin(task);
    const est = (own || W.exam + 3) + 5;
    const lastC = list("writing").filter((x) => x.task === task && x.fb).sort((a, b2) => (b2.ts || 0) - (a.ts || 0))[0];
    let line2 = "";
    if (lastC) {
      const wc = lastC.words, out = wc < W.min || wc > W.max, slow = lastC.minutes > W.exam;
      const top = errorCountsOf(lastC.fb.errors)[0];
      line2 = out ? `Last time: ${wc} words (${W.min}–${W.max}).` : slow ? `Last time: ${lastC.minutes} min for a ${W.exam}-minute task.` : top ? `Last time: ${CAT[top[0]].toLowerCase()} ×${top[1]}.` : `Last time: ${wc} words, in range.`;
    }
    const min = typeof did.write === "number" ? did.write + 5 : est;
    return {
      go: "writing." + task, line1: did.write ? "Done: read your correction." : `${W.name} · ${W.exam}:00 clock, then 3 min proofreading.`, line2,
      chips: [chip(`${W.min}–${W.max} words`)], parts: [{ kind: "write", tok: "writing." + task, exact: true, done: !!did.write, min }], min,
      launch: () => {
        ui.w.task = task;
        const draft = str(ui.w.text[task]).trim() || ipGet("writing--" + task);
        if (!draft) {
          // The first prompt you haven't written yet, or the one written longest ago.
          const lastAt = new Map();
          list("writing").filter((x) => x.task === task).forEach((x) => lastAt.set(x.prompt, Math.max(lastAt.get(x.prompt) || 0, x.ts || 0)));
          const ps = W.prompts.map((p, i) => ({ i, q: typeof p === "string" ? p : p.q }));
          const pick = ps.find((p) => !lastAt.has(p.q)) || ps.sort((a, b2) => lastAt.get(a.q) - lastAt.get(b2.q))[0];
          if (pick) { ui.w.gen[task] = null; ui.w.idx[task] = pick.i; }
        } else if (!str(ui.w.text[task]).trim()) writingRestore(task);
        ui.w.viewing = null;
        presetClock(W.exam * 60, W.name + " écrit", "writing." + task);
        goTo("#writing." + task);
      },
    };
  }

  // What a block of the day's plan is today. Only today's blocks are coached; other days show the plan.
  function coach(b, i, date) {
    const key = blockKey(settings().phase, i), go = b[5];
    const plain = (tok) => ({ go, line1: b[3] || "", line2: "", chips: [], parts: tok ? [{ kind: "free", tok, exact: true, done: !!didOf(wentOf(date, key)).free, min: b[1] }] : [], min: b[1], launch: () => goTo("#" + go) });
    let st;
    // Saturdays in Phase 2: until the CO Examen blanc is done, it replaces the two timed sets.
    const coExamDay = settings().phase === 2 && dow(date) === 5 && !list("comp").some((c) => c.kind === "exam" && skillOf(c) === "co" && c.date < date) && (T.COMP.coExams || []).length;
    if (coExamDay && (go === "comp.co" || go === "comp.ce")) {
      const ex = examStep("co", true, key, date);
      st = go === "comp.co" ? ex : { go: XSPEC.co.home, title: "Replaced by the Examen blanc", line1: "The CO Examen blanc stands in for both timed sets today.", line2: "", chips: [], parts: [{ kind: "exam", tok: XSPEC.co.home, exact: true, done: ex.parts[0].done, min: 0 }], min: 0, launch: () => goTo("#" + XSPEC.co.home) };
      st.merge = true;
      st.adapted = "As the phase note says: the CO Examen blanc once, instead of Saturday's timed sets.";
    } else if (go === "comp.co" || go === "comp.ce") st = compStep(go.split(".")[1], b, key, date);
    else if (go === "comp.co.exam" || go === "comp.ce.exam") st = examStep(go.split(".")[1], false, key, date);
    else if (go.startsWith("comp.free.")) st = plain(go);
    else if (go === "grammar.mixed") st = mixedStep(key, date);
    else if (go === "grammar.mine") st = mineStep(key, date);
    else if (go === "grammar.hunt") st = huntStep(key, date);
    else if (go === "grammar" || go.startsWith("grammar.")) st = grammarStep(b, key, date);
    else if (go.startsWith("vocab")) st = vocabStep(b, key, date);
    else if (go.startsWith("writing")) st = writingStep(b, key, date);
    else if (go === "progress.week") st = watchStep(b, key, date);
    else st = plain("");
    st.min = st.min > 0 ? rmin(st.min) : 0;
    st.key = key;
    st.adapted = st.adapted || "";
    return st;
  }
  // « Plan next week »: the coach's two for the week ahead (or the two you've kept), and Start opens the planner.
  function watchStep(b, key, date) {
    const target = watchTarget(date), saved = watchOf(target), C = watchChoices(date), name = (k) => (C.rows.find((r) => r.key === k) || { label: CAT[k] || k }).label;
    const kept = saved ? saved.picks.map((p) => p.label) : [];
    const line2 = kept.length === 2 ? `Kept: ${kept[0]} and ${kept[1]}. Change them if you like.` : C.rec.length === 2 ? `The coach suggests ${name(C.rec[0])} and ${name(C.rec[1])}.` : "";
    return { go: b[5], line1: b[3] || "", line2, chips: [], parts: [], min: b[1], launch: () => goTo("#" + b[5]) };
  }
  // The block a token finishes a part of, among today's unticked blocks: the first whose next part it matches,
  // or, failing that, the first whose route it matches as before.
  function tickPart(token, info) {
    const s = settings(), t = todayStr(), plan = planFor(s.phase, t);
    if (!plan) return;
    const cur = S.days.get(t);
    const doc = cur ? clone(cur) : { phase: s.phase, done: {} };
    doc.done = doc.done || {};
    doc.went = doc.went || {};
    doc.min = doc.min || {};
    doc.phase = s.phase;
    doc.total = plan.length;
    let hit = -1, merge = false;
    for (let i = 0; i < plan.length; i++) {
      const key = blockKey(s.phase, i);
      if (doc.done[key]) continue;
      const st = coach(plan[i], i, t);
      // A part the token finishes: the first not done yet, or one already counted as done from what was saved
      // just now (a reading or listening set is done as soon as its attempt is saved).
      const hits = st.parts.filter((x) => partHit(x, token));
      const p = hits.find((x) => !x.done) || hits[0] || (!st.parts.length && (token === plan[i][5] || token.startsWith(plan[i][5] + ".")) ? {} : null);
      if (!p) continue;
      const w = Object.assign({ go: st.go, at: 0 }, doc.went[key] || {});
      if (p.kind && p.kind !== "set" && p.kind !== "stretch") w.did = Object.assign({}, w.did, { [p.kind]: info && info.min > 0 ? Math.round(info.min * 10) / 10 : true });
      doc.went[key] = w;
      put("days", t, doc);
      const after = coach(plan[i], i, t);
      if (after.parts.every((x) => x.done)) {
        doc.done[key] = true;
        doc.min[key] = after.min;
        put("days", t, doc);
        merge = !!st.merge;
        hit = i;
        // The CO Examen blanc that stands in for Saturday's timed sets ticks them both.
        if (merge) for (let j = i + 1; j < plan.length; j++) { const kj = blockKey(s.phase, j); if (!doc.done[kj] && coach(plan[j], j, t).merge) { doc.done[kj] = true; doc.min[kj] = 0; put("days", t, doc); } }
        if (dayComplete(t)) ui.thunk = t;
        ui.nextUp = { date: t, from: key };
      } else ui.nextUp = { date: t, from: key, part: true };
      return;
    }
  }

  /* =============== brand kit (the "Réussir le TCF Brand Kit" design) =============== */
  // The shapes live in index.html's sprite: the icons (#i-…), the maple leaf (#leaf), the stamp ring and its ink.
  // Everything here is worked out from progress already saved: the kit adds no data of its own.
  const ico = (name, cls) => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const leafSvg = (cls) => `<svg class="${cls || ""}" viewBox="0 0 24 26" aria-hidden="true"><use href="#leaf" width="24" height="26"/></svg>`;
  const SK_ICON = { voc: "vocab", gra: "grammar", co: "listen", ce: "read", ee: "writing", bil: "bilan" };
  // Numbers in words, the way Rémy says them (digits from 100).
  const FR_UNITS = "zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize dix-sept dix-huit dix-neuf".split(" ");
  const FR_TENS = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };
  function frNum(n) {
    if (n < 20) return FR_UNITS[n];
    if (n < 70) { const u = n % 10; return FR_TENS[Math.floor(n / 10)] + (u === 0 ? "" : u === 1 ? " et un" : "-" + FR_UNITS[u]); }
    if (n < 80) return "soixante" + (n === 71 ? " et onze" : "-" + FR_UNITS[n - 60]);
    if (n < 100) return "quatre-vingt" + (n === 80 ? "s" : "-" + FR_UNITS[n - 80]);
    return String(n);
  }
  const EN_ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
  const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const enNum = (n) => (n < 20 ? EN_ONES[n] : n < 100 ? EN_TENS[Math.floor(n / 10)] + (n % 10 ? "-" + EN_ONES[n % 10] : "") : String(n));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // The streak leaf turns like a Québec autumn the longer the streak runs.
  const TIERS = [null, { name: "Pousse", to: 6 }, { name: "Doré", to: 13 }, { name: "Orangé", to: 29 }, { name: "Rouge érable", to: Infinity }];
  const tierOf = (n) => (n >= 30 ? 4 : n >= 14 ? 3 : n >= 7 ? 2 : n >= 1 ? 1 : 0);
  const streakPill = (n) => { const t = tierOf(n); return t ? `<span class="streak t${t}" title="Série : ${TIERS[t].name}">${leafSvg()}${n} jour${n > 1 ? "s" : ""}</span>` : ""; };
  // The sidebar's streak: the pill with the last seven days as dots (full, part done, nothing, Sunday's rest, today
  // still open). With no streak it asks for a new one, over the same dots, and links to today's plan.
  function streakFoot(n) {
    const t = tierOf(n), today = todayStr();
    const dots = [6, 5, 4, 3, 2, 1, 0].map((k) => {
      const d = addDays(today, -k), st = dayStats(d);
      const cls = dayComplete(d) ? "l3" : st && st.n ? "l1" : !st ? "rest" : "";
      return `<i class="${cls}${d === today ? " now" : ""}"></i>`;
    }).join("");
    const days = `<span class="sf-days" aria-hidden="true">${dots}</span>`;
    return t ? `<a class="streak sf t${t}" href="#today" title="Série : ${TIERS[t].name}">${leafSvg()}${n} jour${n > 1 ? "s" : ""}${days}</a>`
      : `<a class="streak sf t0" href="#today" title="Finish today's plan to start a streak">${leafSvg()}Nouvelle série ?${days}</a>`;
  }
  // The longest run of complete days so far (Sundays neither count nor break it; today can't break it), for the stamps.
  function longestStreak() {
    const dates = [...S.days.keys()].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    const end = todayStr();
    let best = 0, run = 0;
    for (let d = dates[0], k = 0; d && d <= end && k < 3000; d = addDays(d, 1), k++) {
      if (dayComplete(d)) best = Math.max(best, ++run);
      else if (dow(d) !== 6 && d !== end) run = 0;
    }
    return best;
  }

  // Rémy, le petit chef: a little Paris rat in a chef's toque, with a maple leaf pinned on for Canada. Five moods.
  const REMY_BODY = `<path class="r-tail" d="M82 124C100 132 114 120 108 106C104 96 110 88 117 90"/><ellipse class="r-fur" cx="60" cy="113" rx="26" ry="24"/><ellipse class="r-belly" cx="60" cy="117" rx="16" ry="15.5"/><ellipse class="r-feet" cx="48" cy="136" rx="8" ry="4"/><ellipse class="r-feet" cx="72" cy="136" rx="8" ry="4"/><path class="r-scarf" d="M43 88.5Q60 94 77 88.5L62.5 105Q60 108 57.5 105z"/><g class="r-ear r-ear-l"><circle class="r-fur" cx="27" cy="38" r="15"/><circle class="r-earin" cx="27" cy="38" r="9.5"/></g><g class="r-ear r-ear-r"><circle class="r-fur" cx="93" cy="38" r="15"/><circle class="r-earin" cx="93" cy="38" r="9.5"/></g><path class="r-fur" d="M60 34C79 34 91 47 90 62C89 77 76 89 60 91C44 89 31 77 30 62C29 47 41 34 60 34z"/><ellipse class="r-belly" cx="60" cy="77" rx="15" ry="11"/><ellipse class="r-blush" cx="39.5" cy="70.5" rx="5" ry="3"/><ellipse class="r-blush" cx="80.5" cy="70.5" rx="5" ry="3"/>`;
  const REMY_EYES = `<g class="r-eyes"><ellipse class="r-eye" cx="48" cy="58.5" rx="5" ry="6"/><ellipse class="r-eye" cx="72" cy="58.5" rx="5" ry="6"/><circle class="r-glint" cx="49.9" cy="56.2" r="1.9"/><circle class="r-glint" cx="73.9" cy="56.2" r="1.9"/></g>`;
  const REMY_SMILE = `<rect class="r-tooth" x="57.3" y="78.6" width="2.6" height="4.4" rx=".8"/><rect class="r-tooth" x="60.1" y="78.6" width="2.6" height="4.4" rx=".8"/><path class="r-line" d="M60 75.2v3M54.5 78q2.8 2.6 5.5.2q2.7 2.4 5.5-.2"/>`;
  const REMY_NOSE = `<ellipse class="r-nose" cx="60" cy="71.5" rx="5.2" ry="3.8"/><ellipse class="r-noseshine" cx="58.3" cy="70.4" rx="1.8" ry="1"/><path class="r-whisk" d="M45.5 74.5 31 70.5M45 77.5 30 77.5M45.5 80.5 31 84.5M74.5 74.5 89 70.5M75 77.5 90 77.5M74.5 80.5 89 84.5"/>`;
  const REMY_TOQUE = `<path class="r-toque" d="M42 36V27.5C36 26 33.5 21 35.5 16.5C37.5 12 43 10.5 47 12.5C48.5 6.5 54 3 60 3C66 3 71.5 6.5 73 12.5C77 10.5 82.5 12 84.5 16.5C86.5 21 84 26 78 27.5V36z"/><path class="r-toqueline" d="M42 30H78M49.5 26.5V30M60 25.5V30M70.5 26.5V30"/><use class="r-pin" href="#leaf" x="66" y="30.8" width="6.4" height="6.9"/>`;
  const REMY_ARM_L = `<ellipse class="r-dark" cx="37.5" cy="112" rx="6" ry="10" transform="rotate(18 37.5 112)"/>`;
  const REMY = {
    bonjour: { label: "Rémy the rat, waving hello", face: REMY_EYES + REMY_SMILE,
      extra: `${REMY_ARM_L}<ellipse class="r-dark" cx="91" cy="93" rx="6" ry="10.5" transform="rotate(38 91 93)"/><path class="k-motion" d="M101.5 79q4.5 4.5 2.8 10.5M106.5 74.5q7 6.5 4.2 16"/>` },
    bravo: { label: "Rémy the rat, cheering",
      face: `<path class="r-line r-thick" d="M42.5 60Q48 53.5 53.5 60M66.5 60Q72 53.5 77.5 60"/><path class="r-mouth" d="M53.8 78.2Q60 90 66.2 78.2Q60 81 53.8 78.2z"/><rect class="r-tooth" x="57.4" y="78.9" width="2.5" height="3.6" rx=".7"/><rect class="r-tooth" x="60.1" y="78.9" width="2.5" height="3.6" rx=".7"/><path class="r-line" d="M60 75.2v3.2"/>`,
      extra: `<ellipse class="r-dark" cx="29" cy="93" rx="6" ry="10.5" transform="rotate(-38 29 93)"/><ellipse class="r-dark" cx="91" cy="93" rx="6" ry="10.5" transform="rotate(38 91 93)"/><use class="k-c1" href="#leaf" x="2" y="6" width="12" height="13" transform="rotate(-28 8 12.5)"/><use class="k-c2" href="#leaf" x="102" y="4" width="12" height="13" transform="rotate(22 108 10.5)"/><use class="k-c3" href="#leaf" x="1" y="62" width="10" height="11" transform="rotate(35 6 67.5)"/><use class="k-c4" href="#leaf" x="109" y="62" width="10" height="11" transform="rotate(-18 114 67.5)"/>` },
    ecoute: { label: "Rémy the rat, listening with headphones",
      face: `<g class="r-eyes"><ellipse class="r-eye" cx="49.6" cy="58" rx="5" ry="6"/><ellipse class="r-eye" cx="73.6" cy="58" rx="5" ry="6"/><circle class="r-glint" cx="51.5" cy="55.6" r="1.9"/><circle class="r-glint" cx="75.5" cy="55.6" r="1.9"/></g>${REMY_SMILE}`,
      top: `<path class="k-hp" d="M31 52C27 14 93 14 89 52"/>`,
      extra: `${REMY_ARM_L}<ellipse class="r-dark" cx="82.5" cy="112" rx="6" ry="10" transform="rotate(-18 82.5 112)"/><rect class="k-hpc" x="23" y="45" width="11" height="20" rx="5"/><rect class="k-hpc" x="86" y="45" width="11" height="20" rx="5"/>` },
    correction: { label: "Rémy the rat, with glasses and a red pen", face: REMY_EYES + REMY_SMILE,
      extra: `<g class="k-glass"><circle cx="48" cy="58.5" r="8.6"/><circle cx="72" cy="58.5" r="8.6"/><path d="M56.6 57.4q3.4-2.2 6.8 0M39.4 57l-5-2M80.6 57l5-2" fill="none"/></g>${REMY_ARM_L}<g transform="rotate(-32 88 106)"><rect class="k-penbody" x="84.8" y="86" width="6.4" height="28" rx="2.2"/><rect class="k-pencap" x="84.8" y="86" width="6.4" height="8.5" rx="2"/><path class="k-pentip" d="M85.1 113.6 88 121 90.9 113.6z"/></g><ellipse class="r-dark" cx="84" cy="108" rx="6" ry="9.5" transform="rotate(-20 84 108)"/>` },
    cafe: { label: "Rémy the rat, holding a coffee",
      face: `<path class="r-line r-thick" d="M42.5 58Q48 62.5 53.5 58M66.5 58Q72 62.5 77.5 58"/>${REMY_SMILE}`,
      extra: `<path class="k-steam" d="M55 104q-2.2-2.6 0-5.2M65 104q-2.2-2.6 0-5.2"/><rect class="k-mug" x="48" y="107" width="24" height="20" rx="4.2"/><path class="k-mugh" d="M72 111.5h3a4.6 4.6 0 0 1 0 9.2h-3"/><use class="k-mugleaf" href="#leaf" x="54.6" y="111" width="10.8" height="11.7"/><ellipse class="r-dark" cx="47" cy="118" rx="5.6" ry="8" transform="rotate(28 47 118)"/><ellipse class="r-dark" cx="73.5" cy="120" rx="5.6" ry="7.5" transform="rotate(-28 73.5 120)"/>` },
  };
  function remy(mood) {
    const k = REMY[mood] ? mood : "bonjour", m = REMY[k];
    return `<svg class="mascot m-${k}" viewBox="0 0 120 140" role="img" aria-label="${m.label}">${REMY_BODY}${m.face}${REMY_NOSE}${m.top || ""}${REMY_TOQUE}${m.extra}</svg>`;
  }
  // What Rémy says over a score: a line for how it went (perfect, the target met or 80%+, half or more, less),
  // fitted to the exercise. Each band has a few wordings, picked by the attempt's key, so the line stays the same
  // on every redraw and changes from one attempt to the next.
  function remyScore(kind, score, total, o) {
    const x = o || {}, r = total ? score / total : 0;
    // A text with every mistake caught but fine words marked too isn't a clean sheet.
    const band = total && score >= total && !x.flawed ? "perfect" : x.met || r >= 0.8 ? "good" : r >= 0.5 ? "ok" : "low";
    const pick = (lines) => lines[parseInt(hk(x.key || ""), 36) % lines.length];
    const mood = { perfect: "bravo", good: "bravo", ok: "bonjour", low: "cafe" }[band];
    if (kind === "exam") {
      if (x.retake) return ["bonjour", "Un nouvel essai : il ne compte pas dans l'estimation.", "A retake: it doesn't count toward your estimate."];
      if (x.nclc >= 7) return ["bravo", "NCLC 7 atteint ! Quel examen !", "NCLC 7 reached! What an exam!"];
      if (x.nclc === 6) return ["bonjour", "Si près du NCLC 7 ! Encore un effort.", "So close to NCLC 7! One more push."];
      return ["cafe", "Un examen blanc de plus : c'est comme ça qu'on progresse.", "One more practice exam: that's how you improve."];
    }
    if (x.retry) return score >= total ? ["bravo", "Ces fautes-là sont corrigées !", "Those mistakes are fixed now!"] : ["bonjour", "Encore un petit effort sur celles-ci.", "A little more work on these."];
    const L = {
      perfect: [["Sans faute ! Chapeau.", "Not a single mistake! Hats off."], ["Parfait ! Rien à corriger.", "Perfect! Nothing to correct."], ["Un sans-faute, bravo !", "A clean sheet, well done!"]],
      good: [["Très bien ! Presque tout juste.", "Very good! Nearly all right."], ["Beau travail, ça rentre !", "Nice work, it's sinking in!"]],
      ok: [["Pas mal ! Revois les ratées ci-dessous.", "Not bad! Go over the misses below."], ["On progresse. Un coup d'œil aux corrections ?", "Getting there. A look at the corrections?"]],
      low: [["Ça viendra. On reprend demain, ça va rentrer.", "It'll come. We'll pick it up tomorrow, it'll sink in."], ["Courage ! Relis la règle, puis réessaie les ratées.", "Chin up! Reread the rule, then retry the misses."]],
    };
    if (kind === "drill" && x.met && band === "good") L.good = [["Objectif atteint ! Bravo.", "Target met! Well done."], ["Tu as atteint l'objectif. Bien joué !", "You've hit the target. Nice work!"]];
    if (kind === "hunt" || kind === "mine") {
      L.perfect = [["Parfait ! Rien ne t'a échappé.", "Perfect! Nothing got past you."], ["Pas une faute ne t'a échappé. Chapeau !", "Not one mistake got past you. Hats off!"]];
      L.good = [[`Œil de lynx ! ${score} sur ${total}, trouvées et corrigées.`, `Eagle eye! ${score} of ${total}, found and fixed.`]];
      L.ok = [[`${score} sur ${total}. Les autres sont soulignées en rouge.`, `${score} of ${total}. The others are underlined in red.`]];
      L.low = [["Relire, ça s'apprend. On s'entraîne, ça vient !", "Proofreading takes practice. Keep at it, it comes!"]];
    }
    if (kind === "ce" || kind === "co") {
      if (kind === "ce" && band === "perfect" && x.inClock) return ["bravo", "Tout juste, et dans les temps !", "All right, and inside the clock!"];
      if (kind === "ce" && (band === "good" || band === "perfect") && x.inClock === false) return ["bonjour", "C'est juste, mais un peu lent : attention au chrono.", "Right, but a little slow: mind the clock."];
      L.good = kind === "co" ? [["Bien entendu ! Tu as l'oreille.", "Well heard! You've got the ear for it."]] : [["Bien lu ! Les pièges ne t'ont pas eu.", "Well read! The traps didn't catch you."]];
      L.ok = [["Pas mal ! Les explications disent où était le piège.", "Not bad! The explanations show where the trap was."]];
      L.low = kind === "co" ? [["Réécoute avec la transcription, ça aide.", "Listen again with the transcript, it helps."]] : [["Un texte coriace ? Relis-le avec les réponses.", "A tough one? Read it again with the answers."]];
    }
    const [fr, en] = pick(L[band]);
    return [mood, fr, en];
  }
  // Rémy and his line: always in French, with the English underneath.
  const greet = (mood, fr, en, cls) => `<div class="greet${cls ? " " + cls : ""}">${remy(mood)}<p class="bubble" data-m="pop" data-k="${esc(mood + "|" + fr)}"><span lang="fr">${typo(fr)}</span><small class="en-gloss">${esc(en)}</small></p></div>`;
  // The last day before `date` with anything done: a ticked block or a finished attempt.
  function lastActive(date) {
    let last = "";
    const see = (d) => { if (d && d < date && d > last) last = d; };
    for (const d of S.days.keys()) { const st = dayStats(d); if (st && st.n) see(d); }
    ["drills", "comp", "writing"].forEach((c) => list(c).forEach((x) => see(x.date)));
    return last;
  }
  // What Rémy says on Aujourd'hui: first visit of the day, halfway, plan finished, or back after a break.
  function remyToday(plan, doneN, left) {
    const t = todayStr();
    if (!plan) return ["bonjour", "Dimanche, c'est repos. Quelques cartes, si tu veux.", "Sunday is a rest day. A few cards, if you like."];
    if (doneN >= plan.length) {
      const n = streak();
      return n > 1 ? ["bravo", `Journée validée ! ${cap(frNum(n))} jours d'affilée.`, `Day done! ${cap(enNum(n))} days in a row.`]
        : ["bravo", "Journée validée ! Premier jour de la série.", "Day done! Day one of a streak."];
    }
    const ups = ["co", "ce"].filter((sk) => { const l = compLadder(sk); return l.level === "B2" && l.upDate === t; });
    if (ups.length) return ["bravo", `Tu passes au B2 en ${ups.map((sk) => (sk === "co" ? "écoute" : "lecture")).join(" et en ")} !`, `You're moving up to B2 in ${ups.map((sk) => (sk === "co" ? "listening" : "reading")).join(" and ")}!`];
    if (doneN > 0) return ["bonjour", `Bonjour ! Encore ${left} minutes aujourd'hui.`, `Hello! ${left} minutes to go today.`];
    const last = lastActive(t);
    if (last && daysBetween(last, t) >= 4) return ["cafe", "Un petit café, et on s'y remet ?", "A quick coffee, and back to it?"];
    return ["bonjour", "Bonjour ! Ta séance du jour t'attend.", "Hello! Today's session is waiting."];
  }
  // "Journée validée": the teacher's stamp on the day's header once every block is ticked.
  const tbStamp = (date) => `<svg class="tb-stamp" id="tb-stamp" data-date="${date}" viewBox="0 0 176 66" role="img" aria-label="Stamp: Très bien !"><g filter="url(#ink)"><rect class="tb-o" x="2.5" y="2.5" width="171" height="61" rx="11"/><rect class="tb-i" x="8.5" y="8.5" width="159" height="49" rx="7"/><use class="tb-leaf" href="#leaf" x="18" y="17" width="29" height="31.5" transform="rotate(-8 32.5 32.75)"/><text x="109" y="39.5" text-anchor="middle">TRÈS BIEN&#160;!</text></g></svg>`;

  // Tampons: a teacher's rubber stamp for each milestone, from the first day to NCLC 7 in all four skills, in
  // families (STAMP_FAM), each in its own ink. Stamps added later carry their batch (set), so the ones you'd already
  // earned by then are recorded without a celebration (see stampCheck). A stamp with a count to reach has `prog`
  // ([what you have, what it takes]), shown under it until it's earned.
  const STAMP_SET = 3;
  const STAMP_FAM = [
    ["streak", "Régularité", "keeping at it", "--sk-eo"],
    ["endu", "Endurance", "hours and exercises", "--sk-bil"],
    ["gram", "Grammaire", "grammar", "--sk-gra"],
    ["fix", "Fautes", "your mistakes", "--red"],
    ["voc", "Vocabulaire", "vocabulary", "--sk-voc"],
    ["comp", "Compréhension", "listening and reading", "--sk-ce"],
    ["write", "Écrit", "writing", "--sk-ee"],
    ["exam", "Examens blancs", "practice exams", "--sk-co"],
    ["goal", "Objectifs", "the big goals", "--amber"],
    ["bonus", "Bonus", "the little extras", "--accent"],
  ];
  // Your status grows with your stamps, along the road to Canada.
  const RANKS = [[0, "Visa de visiteur", "visitor visa"], [5, "Permis d'études", "study permit"], [12, "Permis de travail", "work permit"], [24, "Résidence permanente", "permanent residence"], [38, "Citoyenneté", "citizenship"], [52, "Passeport canadien", "Canadian passport"]];
  const rankOf = (n) => { let i = 0; RANKS.forEach(([k], j) => { if (n >= k) i = j; }); return i; };
  const PHASE_OK = (n) => { const c = T.CRITERIA[n] || []; return c.length > 0 && c.every((x) => criterionStatus(x).ok); };
  const phaseProg = (n) => { const c = T.CRITERIA[n] || []; return [c.filter((x) => criterionStatus(x).ok).length, c.length]; };
  const builtCleared = (x, sets, level, share) => { const ss = sets.filter((s2) => s2.level === level); return [ss.filter((s2) => (x.bestOf.get(s2.id) || 0) >= share - 1e-9).length, ss.length]; };
  const proofDone = (x, level) => { const ids = PR.filter((p) => p.level === level).map((p) => p.id), done = new Set(x.hunts.map((d) => d.text)); return [ids.filter((i) => done.has(i)).length, ids.length]; };
  const atLeast = (have, need) => [Math.min(have, need), need];
  const STAMPS = [
    // Régularité
    { id: "first", fam: "streak", name: "Première séance", ring: "PREMIÈRE SÉANCE ★ ", reps: 3, icon: "today", rot: -8, got: "Your first full day's plan", todo: "To earn: a full day's plan", earned: (x) => x.full.length > 0 },
    { id: "d7", fam: "streak", name: "7 jours d'affilée", ring: "7 JOURS D'AFFILÉE ★ ", reps: 3, num: "7", rot: 7, got: "Seven days in a row", todo: "To earn: seven days in a row", earned: (x) => x.best >= 7, prog: (x) => atLeast(x.best, 7) },
    { id: "comeback", set: 3, fam: "streak", name: "Retour gagnant", ring: "RETOUR GAGNANT ★ ", icon: "today", got: "A full day after four days or more away", todo: "To earn: a full day after a break of four days or more", earned: (x) => x.full.some((d) => { const l = lastActive(d); return !!l && daysBetween(l, d) >= 4; }) },
    { id: "week", set: 3, fam: "streak", name: "Semaine parfaite", ring: "SEMAINE PARFAITE ★ ", icon: "ahead", got: "Every day from Monday to Saturday", todo: "To earn: every day of one week, Monday to Saturday", earned: (x) => x.weekBest >= 6, prog: (x) => atLeast(x.weekBest, 6) },
    { id: "d14", set: 2, fam: "streak", name: "14 jours d'affilée", ring: "14 JOURS D'AFFILÉE ★ ", reps: 3, num: "14", rot: -5, got: "Fourteen days in a row", todo: "To earn: fourteen days in a row", earned: (x) => x.best >= 14, prog: (x) => atLeast(x.best, 14) },
    { id: "d30", fam: "streak", name: "30 jours", ring: "30 JOURS D'AFFILÉE ★ ", reps: 3, num: "30", rot: 5, got: "Thirty days in a row", todo: "To earn: thirty days in a row", earned: (x) => x.best >= 30, prog: (x) => atLeast(x.best, 30) },
    { id: "d60", set: 3, fam: "streak", name: "60 jours", ring: "60 JOURS D'AFFILÉE ★ ", num: "60", got: "Sixty days in a row", todo: "To earn: sixty days in a row", earned: (x) => x.best >= 60, prog: (x) => atLeast(x.best, 60) },
    // Endurance
    { id: "e10", set: 3, fam: "endu", name: "10 exercices", ring: "10 EXERCICES ★ ", icon: "homework", got: "Ten exercises finished", todo: "To earn: ten exercises finished (drills, sets, texts)", earned: (x) => x.done >= 10, prog: (x) => atLeast(x.done, 10) },
    { id: "e50", set: 3, fam: "endu", name: "50 exercices", ring: "50 EXERCICES ★ ", icon: "homework", got: "Fifty exercises finished", todo: "To earn: fifty exercises finished", earned: (x) => x.done >= 50, prog: (x) => atLeast(x.done, 50) },
    { id: "e100", set: 3, fam: "endu", name: "100 exercices", ring: "100 EXERCICES ★ ", icon: "homework", got: "A hundred exercises finished", todo: "To earn: a hundred exercises finished", earned: (x) => x.done >= 100, prog: (x) => atLeast(x.done, 100) },
    { id: "h10", set: 3, fam: "endu", name: "10 heures de vol", ring: "10 HEURES DE VOL ★ ", num: "10", got: "Ten hours of study ticked", todo: "To earn: ten hours of study ticked", earned: (x) => x.mins >= 600, prog: (x) => atLeast(Math.floor(x.mins / 60), 10) },
    { id: "h50", set: 3, fam: "endu", name: "50 heures de vol", ring: "50 HEURES DE VOL ★ ", num: "50", got: "Fifty hours of study ticked", todo: "To earn: fifty hours of study ticked", earned: (x) => x.mins >= 3000, prog: (x) => atLeast(Math.floor(x.mins / 60), 50) },
    { id: "h100", set: 3, fam: "endu", name: "100 heures de vol", ring: "100 HEURES DE VOL ★ ", num: "100", got: "A hundred hours of study ticked", todo: "To earn: a hundred hours of study ticked", earned: (x) => x.mins >= 6000, prog: (x) => atLeast(Math.floor(x.mins / 60), 100) },
    // Grammaire
    { id: "zero", fam: "gram", name: "Zéro faute", ring: "ZÉRO FAUTE ★ ", reps: 4, icon: "bilan", rot: -4, got: "A drill round with no misses", todo: "To earn: a drill round with no misses", earned: (x) => x.rounds.some((d) => d.score >= d.total) },
    { id: "mixed", set: 3, fam: "gram", name: "Tout-terrain", ring: "TOUT-TERRAIN ★ ", icon: "grammar", got: "A mixed review at 90% or more", todo: "To earn: a mixed review at 90% or more", earned: (x) => x.gram.some((d) => d.topic === "mixed" && d.score / d.total >= 0.9 - 1e-9) },
    { id: "retry", set: 3, fam: "gram", name: "Deuxième chance", ring: "DEUXIÈME CHANCE ★ ", icon: "grammar", got: "Every miss of a round fixed on a retry", todo: "To earn: retry today's misses and get them all right", earned: (x) => x.rounds.some((d) => retriesOf(d).some((r) => r.total > 0 && r.score >= r.total)) },
    { id: "rule", set: 2, fam: "gram", name: "Règle maîtrisée", ring: "RÈGLE MAÎTRISÉE ★ ", reps: 3, icon: "grammar", rot: 11, got: "A grammar topic mastered", todo: "To earn: a grammar topic's target, twice a week apart", earned: (x) => x.mastered >= 1 },
    { id: "crack", set: 3, fam: "gram", name: "Sujet bouclé", ring: "SUJET BOUCLÉ ★ ", icon: "grammar", got: "Every set of one topic at 90% or more", todo: "To earn: every set of one grammar topic at 90% or more", earned: (x) => x.crack[0] >= x.crack[1], prog: (x) => x.crack },
    { id: "rule5", set: 3, fam: "gram", name: "5 règles", ring: "5 RÈGLES MAÎTRISÉES ★ ", num: "5", got: "Five grammar topics mastered", todo: "To earn: five grammar topics mastered", earned: (x) => x.mastered >= 5, prog: (x) => atLeast(x.mastered, 5) },
    { id: "all90", set: 3, fam: "gram", name: "90 % partout", ring: "90 % PARTOUT ★ ", num: "90", got: "Your latest round of every topic at 90% or more", todo: "To earn: your latest round of every grammar topic at 90% or more", earned: (x) => x.at90 >= T.TOPICS.length, prog: (x) => [x.at90, T.TOPICS.length] },
    { id: "ruleall", set: 3, fam: "gram", name: "Toute la grammaire", ring: "TOUTE LA GRAMMAIRE ★ ", icon: "target", got: "Every grammar topic mastered", todo: "To earn: every grammar topic mastered", earned: (x) => x.mastered >= T.TOPICS.length, prog: (x) => [x.mastered, T.TOPICS.length] },
    // Fautes
    { id: "lynx", set: 3, fam: "fix", name: "Œil de lynx", ring: "ŒIL DE LYNX ★ ", icon: "eye", got: "Every mistake of a text found and fixed, nothing else marked", todo: "To earn: a Find the mistakes text with everything caught", earned: (x) => x.hunts.some((d) => d.score >= d.total && !d.extra) },
    { id: "fix10", set: 3, fam: "fix", name: "10 fautes corrigées", ring: "10 FAUTES CORRIGÉES ★ ", icon: "errors", got: "Ten of your own mistakes fixed", todo: "To earn: ten of your own mistakes fixed (caught twice in a row)", earned: (x) => x.fixed >= 10, prog: (x) => atLeast(x.fixed, 10) },
    { id: "watch", set: 3, fam: "fix", name: "Sous surveillance", ring: "SOUS SURVEILLANCE ★ ", icon: "eye", got: "A week with both watched mistakes kept at bay", todo: "To earn: a week where your two mistakes to watch don't come back", earned: (x) => x.watchKept },
    { id: "proof1", set: 3, fam: "fix", name: "Relecture B1", ring: "RELECTURE B1 ★ ", num: "B1", got: "Every B1 text of Find the mistakes done", todo: "To earn: every B1 text of Find the mistakes", earned: (x) => { const p = proofDone(x, "B1"); return p[1] > 0 && p[0] >= p[1]; }, prog: (x) => proofDone(x, "B1") },
    { id: "proof2", set: 3, fam: "fix", name: "Relecture B2", ring: "RELECTURE B2 ★ ", num: "B2", got: "Every B2 text of Find the mistakes done", todo: "To earn: every B2 text of Find the mistakes", earned: (x) => { const p = proofDone(x, "B2"); return p[1] > 0 && p[0] >= p[1]; }, prog: (x) => proofDone(x, "B2") },
    // Vocabulaire
    { id: "c100", fam: "voc", name: "100 cartes", ring: "100 CARTES ★ ", reps: 4, icon: "vocab", rot: 10, got: "100 cards reviewed", todo: "To earn: 100 cards reviewed", earned: (x) => x.cards >= 100, prog: (x) => atLeast(x.cards, 100) },
    { id: "c300", set: 2, fam: "voc", name: "300 cartes", ring: "300 CARTES ★ ", reps: 4, icon: "vocab", rot: -7, got: "300 cards reviewed", todo: "To earn: 300 cards reviewed", earned: (x) => x.cards >= 300, prog: (x) => atLeast(x.cards, 300) },
    { id: "c500", set: 3, fam: "voc", name: "500 cartes", ring: "500 CARTES ★ ", icon: "vocab", got: "500 cards reviewed", todo: "To earn: 500 cards reviewed", earned: (x) => x.cards >= 500, prog: (x) => atLeast(x.cards, 500) },
    { id: "m50", set: 3, fam: "voc", name: "50 maîtrisées", ring: "50 CARTES MAÎTRISÉES ★ ", num: "50", got: "Fifty cards mastered", todo: "To earn: fifty cards mastered (three weeks or more between reviews)", earned: (x) => x.masteredCards >= 50, prog: (x) => atLeast(x.masteredCards, 50) },
    { id: "m150", set: 3, fam: "voc", name: "150 maîtrisées", ring: "150 CARTES MAÎTRISÉES ★ ", num: "150", got: "150 cards mastered", todo: "To earn: 150 cards mastered", earned: (x) => x.masteredCards >= 150, prog: (x) => atLeast(x.masteredCards, 150) },
    { id: "marathon", set: 3, fam: "voc", name: "Marathon", ring: "MARATHON ★ ", icon: "timer", got: "Fifty card reviews in one day", todo: "To earn: fifty card reviews in one day", earned: (x) => x.dayReviews >= 50, prog: (x) => atLeast(x.dayReviews, 50) },
    { id: "carnet", set: 3, fam: "voc", name: "Mon carnet", ring: "MON CARNET ★ ", icon: "fiches", got: "Ten words saved from the pages to your cards", todo: "To earn: ten words saved to Mon carnet from the pages", earned: (x) => x.carnet >= 10, prog: (x) => atLeast(x.carnet, 10) },
    { id: "idioms", set: 3, fam: "voc", name: "Belles expressions", ring: "BELLES EXPRESSIONS ★ ", icon: "comp", got: "Twenty expressions learned", todo: "To earn: twenty cards of the Expressions deck learned", earned: (x) => x.idioms >= 20, prog: (x) => atLeast(x.idioms, 20) },
    // Compréhension
    { id: "ear", set: 2, fam: "comp", ink: "--sk-co", name: "Oreille fine", ring: "OREILLE FINE ★ ", reps: 4, icon: "listen", rot: -9, got: "A listening set without a miss", todo: "To earn: a listening set without a miss, first try", earned: (x) => x.firsts("co").some((c) => c.score >= c.total) },
    { id: "ce4", set: 3, fam: "comp", name: "Lecture parfaite", ring: "LECTURE PARFAITE ★ ", icon: "read", got: "A reading set without a miss", todo: "To earn: a reading set without a miss, first try", earned: (x) => x.firsts("ce").some((c) => c.score >= c.total) },
    { id: "pace", set: 2, fam: "comp", name: "Au chrono", ring: "AU CHRONO ★ ", reps: 4, icon: "timer", rot: 8, got: "A reading set at exam pace, 3 of 4 or better", todo: "To earn: a reading set at exam pace, 3 of 4 or better", earned: (x) => x.firsts("ce").some((c) => c.secs > 0 && c.secs <= (CE_PACE[c.level] || 90) * c.total && c.score / c.total >= 0.75 - 1e-9) },
    { id: "cob1", set: 3, fam: "comp", ink: "--sk-co", name: "Écoute B1", ring: "TOUTE L'ÉCOUTE B1 ★ ", num: "B1", got: "Every B1 listening set at 5 of 6 or better", todo: "To earn: every B1 listening set at 5 of 6 or better", earned: (x) => { const p = builtCleared(x, T.COMP.coSets, "B1", 0.75); return p[0] >= p[1]; }, prog: (x) => builtCleared(x, T.COMP.coSets, "B1", 0.75) },
    { id: "ceb1", set: 3, fam: "comp", name: "Lecture B1", ring: "TOUTE LA LECTURE B1 ★ ", num: "B1", got: "Every B1 reading set at 3 of 4 or better", todo: "To earn: every B1 reading set at 3 of 4 or better", earned: (x) => { const p = builtCleared(x, T.COMP.ceSets, "B1", 0.75); return p[0] >= p[1]; }, prog: (x) => builtCleared(x, T.COMP.ceSets, "B1", 0.75) },
    { id: "b2", set: 2, fam: "comp", name: "Niveau B2", ring: "NIVEAU B2 ★ ", reps: 4, num: "B2", rot: 4, got: "Ready for B2 in listening or reading", todo: "To earn: your last 3 B1 sets in listening (70%) or reading (75%)", earned: () => ["co", "ce"].some((sk) => { const l = compLadder(sk); return l.a1 != null && l.a1 >= LADDER_UP[sk] - 1e-9; }) },
    { id: "cob2", set: 3, fam: "comp", ink: "--sk-co", name: "Écoute B2", ring: "TOUTE L'ÉCOUTE B2 ★ ", num: "B2", got: "Every B2 listening set at 5 of 6 or better", todo: "To earn: every B2 listening set at 5 of 6 or better", earned: (x) => { const p = builtCleared(x, T.COMP.coSets, "B2", 0.75); return p[0] >= p[1]; }, prog: (x) => builtCleared(x, T.COMP.coSets, "B2", 0.75) },
    { id: "ceb2", set: 3, fam: "comp", name: "Lecture B2", ring: "TOUTE LA LECTURE B2 ★ ", num: "B2", got: "Every B2 reading set at 3 of 4 or better", todo: "To earn: every B2 reading set at 3 of 4 or better", earned: (x) => { const p = builtCleared(x, T.COMP.ceSets, "B2", 0.75); return p[0] >= p[1]; }, prog: (x) => builtCleared(x, T.COMP.ceSets, "B2", 0.75) },
    { id: "tour", set: 3, fam: "comp", name: "Tour des sujets", ring: "TOUR DES SUJETS ★ ", icon: "plane", got: "A listening or reading set in every topic", todo: "To earn: a listening or reading set in every topic", earned: (x) => x.topics[0] >= x.topics[1], prog: (x) => x.topics },
    // Écrit
    { id: "copy", set: 2, fam: "write", name: "Première copie", ring: "PREMIÈRE COPIE ★ ", reps: 3, icon: "writing", rot: 6, got: "Your first text corrected", todo: "To earn: a text corrected by Claude", earned: (x) => x.texts.length > 0 },
    { id: "tasks3", set: 3, fam: "write", name: "Les trois tâches", ring: "LES TROIS TÂCHES ★ ", num: "3", got: "A corrected text for Tâches 1, 2 and 3", todo: "To earn: a corrected text for each of the three tasks", earned: (x) => x.tasks >= 3, prog: (x) => [x.tasks, 3] },
    { id: "intime", set: 3, fam: "write", name: "Dans les temps", ring: "DANS LES TEMPS ★ ", icon: "timer", got: "A text finished inside its exam clock", todo: "To earn: a text finished inside its task's exam time", earned: () => list("writing").some((w) => w.minutes > 0 && T.WRITING[w.task] && w.minutes <= T.WRITING[w.task].exam) },
    { id: "clean", set: 3, fam: "write", name: "Copie propre", ring: "COPIE PROPRE ★ ", icon: "writing", got: "A corrected text with under 5 mistakes per 100 words", todo: "To earn: a corrected text with under 5 mistakes per 100 words", earned: (x) => x.per100 < 5 },
    { id: "ee7", set: 3, fam: "write", name: "Plume NCLC 7", ring: "PLUME NCLC 7 ★ ", num: "10", got: "A text scored 10/20 or more (NCLC 7)", todo: "To earn: a text scored 10/20 or more by Claude", earned: (x) => x.score20 >= 10 },
    { id: "w10", set: 3, fam: "write", name: "Dix copies", ring: "DIX COPIES ★ ", num: "10", got: "Ten texts corrected", todo: "To earn: ten texts corrected", earned: (x) => x.texts.length >= 10, prog: (x) => atLeast(x.texts.length, 10) },
    { id: "neat", set: 3, fam: "write", name: "Copie impeccable", ring: "COPIE IMPECCABLE ★ ", icon: "bilan", got: "A corrected text with under 2 mistakes per 100 words", todo: "To earn: a corrected text with under 2 mistakes per 100 words", earned: (x) => x.per100 < 2 },
    { id: "ee9", set: 3, fam: "write", name: "Plume d'or", ring: "PLUME D'OR ★ ", num: "14", got: "A text scored 14/20 or more (NCLC 9)", todo: "To earn: a text scored 14/20 or more by Claude", earned: (x) => x.score20 >= 14 },
    // Examens blancs
    { id: "exam", fam: "exam", name: "Examen blanc", ring: "EXAMEN BLANC ★ ", reps: 3, icon: "exam", rot: -6, got: "Your first practice exam", todo: "To earn: first practice exam, CE or CO", earned: (x) => x.exams.length > 0 },
    { id: "examfull", set: 3, fam: "exam", name: "Jusqu'au bout", ring: "JUSQU'AU BOUT ★ ", icon: "exam", got: "A practice exam with every question answered in time", todo: "To earn: a practice exam with every question answered in time", earned: (x) => x.exams.some((c) => !c.timeUp && arr(c.answers).length && arr(c.answers).every((v) => v != null)) },
    { id: "both", set: 3, fam: "exam", name: "Les deux épreuves", ring: "CE ET CO ★ ", icon: "listen", got: "A reading and a listening practice exam", todo: "To earn: a practice exam in reading and one in listening", earned: (x) => ["ce", "co"].every((sk) => x.exams.some((c) => skillOf(c) === sk)), prog: (x) => [["ce", "co"].filter((sk) => x.exams.some((c) => skillOf(c) === sk)).length, 2] },
    { id: "exams5", set: 3, fam: "exam", name: "Cinq examens", ring: "CINQ EXAMENS BLANCS ★ ", num: "5", got: "All five reading practice exams", todo: "To earn: all five reading practice exams", earned: (x) => x.ceExams >= T.COMP.ceExams.length, prog: (x) => [x.ceExams, T.COMP.ceExams.length] },
    // Objectifs
    { id: "p1", fam: "goal", name: "Phase 1 validée", ring: "PHASE 1 VALIDÉE ★ ", reps: 3, icon: "progress", rot: -12, got: "Phase 1 exit criteria met", todo: "To earn: the Phase 1 exit criteria", earned: () => PHASE_OK(1), prog: () => phaseProg(1) },
    { id: "p2", set: 3, fam: "goal", name: "Phase 2 validée", ring: "PHASE 2 VALIDÉE ★ ", num: "2", got: "Phase 2 exit criteria met", todo: "To earn: the Phase 2 exit criteria", earned: () => PHASE_OK(2), prog: () => phaseProg(2) },
    { id: "p3", set: 3, fam: "goal", name: "Phase 3 validée", ring: "PHASE 3 VALIDÉE ★ ", num: "3", got: "Phase 3 exit criteria met", todo: "To earn: the Phase 3 exit criteria", earned: () => PHASE_OK(3), prog: () => phaseProg(3) },
    { id: "p4", set: 3, fam: "goal", name: "Phase 4 validée", ring: "PHASE 4 VALIDÉE ★ ", num: "4", got: "Phase 4 exit criteria met", todo: "To earn: the Phase 4 exit criteria", earned: () => PHASE_OK(4), prog: () => phaseProg(4) },
    { id: "nclc7", fam: "goal", name: "NCLC 7", ring: "NCLC 7 ATTEINT ★ ", reps: 3, icon: "target", rot: 9, got: "The target, reached in a skill", todo: "To earn: the target, in any skill", earned: () => scoredMocks().some((m) => ["co", "ce", "ee", "eo"].some((k) => (nclcOf(k, m[k]) || 0) >= 7)) },
    { id: "nclc7all", set: 2, fam: "goal", name: "NCLC 7 partout", ring: "NCLC 7 PARTOUT ★ ", reps: 3, icon: "plane", rot: -10, got: "NCLC 7 in all four skills, on one test", todo: "To earn: NCLC 7 in all four skills, on one test", earned: () => scoredMocks().some((m) => ["co", "ce", "ee", "eo"].every((k) => (nclcOf(k, m[k]) || 0) >= 7)) },
    // Bonus
    { id: "immersion", set: 3, fam: "bonus", name: "Pense en français", ring: "PENSE EN FRANÇAIS ★ ", num: "FR", got: "The site switched to French only", todo: "To earn: turn on « Pense en français »", earned: () => settings().fr === true },
    { id: "fiche", set: 3, fam: "bonus", name: "Ma fiche", ring: "MA PREMIÈRE FICHE ★ ", icon: "fiches", got: "Your own revision sheet", todo: "To earn: write a revision sheet of your own", earned: () => list("fiches").some((f) => f.kind !== "note" && /^f-/.test(f.id)) },
    { id: "notes", set: 3, fam: "bonus", name: "Pense-bête", ring: "PENSE-BÊTE ★ ", icon: "fiches", got: "Three notes on your Pense-bête", todo: "To earn: three notes on the Pense-bête", earned: () => fxNotes().length >= 3, prog: () => atLeast(fxNotes().length, 3) },
    { id: "homework", set: 3, fam: "bonus", name: "Devoirs faits", ring: "DEVOIRS FAITS ★ ", icon: "homework", got: "Five homework tasks done", todo: "To earn: five homework tasks done", earned: () => list("homework").filter((h) => h.done).length >= 5, prog: () => atLeast(list("homework").filter((h) => h.done).length, 5) },
  ];
  const STAMP_INK = (st) => st.ink || (STAMP_FAM.find((f) => f[0] === st.fam) || [])[3] || "--accent";
  // A tilt for each stamp, as if pressed by hand: its own, or one worked out from its id.
  const stampRot = (st) => (st.rot != null ? st.rot : (parseInt(hk(st.id), 36) % 23) - 11);
  // What the stamps are worked out from, gathered once for each check.
  function stampCtx() {
    const drills = list("drills"), comp = list("comp").filter((c) => c.total);
    const rounds = drills.filter((d) => d.total > 0 && d.set !== "prod");
    const gram = rounds.filter((d) => (TOPIC[d.topic] || d.topic === "mixed") && d.src !== "retry");
    const texts = list("writing").filter((w) => w.fb && Array.isArray(w.fb.errors));
    const days = [...S.days.keys()].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    const full = days.filter((d) => dayComplete(d));
    // The most days done in one week, Monday to Saturday.
    const perWeek = new Map();
    full.forEach((d) => { if (dow(d) < 6) { const m = mondayOf(d); perWeek.set(m, (perWeek.get(m) || 0) + 1); } });
    // The best share right on each set, any try.
    const bestOf = new Map();
    comp.filter((c) => c.kind !== "exam" && c.setId).forEach((c) => bestOf.set(c.setId, Math.max(bestOf.get(c.setId) || 0, c.score / c.total)));
    const firsts = (sk) => firstTries(comp.filter((c) => c.skill === sk && c.kind !== "exam"));
    // A grammar topic's sets at 90%+: the closest topic to having all of them.
    const at90 = (tp, set) => gram.some((d) => d.topic === tp.id && d.set === set && d.score / d.total >= 0.9 - 1e-9);
    const crack = T.TOPICS.map((tp) => [tp.sets.filter((s2) => at90(tp, s2.id)).length, tp.sets.length]).sort((a, b) => b[0] / b[1] - a[0] / a[1])[0] || [0, 1];
    const latest90 = T.TOPICS.filter((tp) => { const ds = gram.filter((d) => d.topic === tp.id).sort((a, b) => (a.ts || 0) - (b.ts || 0)); const l = ds[ds.length - 1]; return !!l && l.score / l.total >= 0.9 - 1e-9; }).length;
    // The topics with a listening or reading set done.
    const themeOf = new Map(T.COMP.ceSets.concat(T.COMP.coSets).map((s2) => [s2.id, arr(s2.themes)[0]]));
    const seen = new Set(comp.filter((c) => c.kind !== "exam").map((c) => c.theme || themeOf.get(c.setId)).filter(Boolean));
    // The most card reviews in one day, from the grades kept on the cards.
    const perDay = new Map();
    S.srs.forEach((st) => arr(st.log).forEach((g) => { const d = Array.isArray(g) ? g[0] : null; if (d) perDay.set(d, (perDay.get(d) || 0) + 1); }));
    const watch = settings().watch || {};
    const exams = comp.filter((c) => c.kind === "exam");
    return {
      best: longestStreak(), full, weekBest: Math.max(0, ...perWeek.values()), rounds, gram, hunts: rounds.filter((d) => d.topic === "hunt"), texts, bestOf, firsts, exams,
      mins: days.reduce((a, d) => a + minTotal(dayMinutes(d)), 0),
      done: rounds.length + comp.filter((c) => c.kind !== "exam").length + list("writing").length,
      mastered: T.TOPICS.filter((tp) => topicMastery(tp).ok).length, crack, at90: latest90,
      fixed: mineStatus().filter((m) => m.kind === "error" && m.state === "fixed").length,
      watchKept: Object.entries(watch).some(([mon, v]) => addDays(mon, 6) < todayStr() && arr(v && v.picks).length === 2 && v.picks.every((p) => { const w = watchCount(p.key, mon); return w.texts > 0 && w.n === 0; })),
      cards: S.srs.size, masteredCards: [...S.srs.values()].filter((st) => !st.pri && st.stage >= 5).length, dayReviews: Math.max(0, ...perDay.values()),
      carnet: list("cards").filter((c) => c.theme === "carnet").length, idioms: [...S.srs.keys()].filter((k) => k.startsWith("expressions--")).length,
      topics: [COMP_TOPICS.filter((t2) => seen.has(t2.id)).length, COMP_TOPICS.length],
      tasks: new Set(texts.map((w) => w.task).filter((t2) => T.WRITING[t2])).size,
      per100: Math.min(Infinity, ...texts.filter((w) => w.words >= 60).map((w) => (w.fb.errors.length / w.words) * 100)),
      score20: Math.max(0, ...texts.map((w) => Number(w.fb.score20) || 0)),
      ceExams: new Set(exams.filter((c) => skillOf(c) === "ce").map((c) => c.setId).filter((id) => T.COMP.ceExams.some((e) => e.id === id))).size,
    };
  }
  function stampSVG(st, on, bare) {
    const n = str(st.num), small = n.length > 2 ? 9.5 : n.length > 1 ? 11 : 0;
    const center = st.icon ? `<svg class="st-ic" x="35" y="35" width="30" height="30" viewBox="0 0 24 24"><use href="#i-${st.icon}"/></svg>`
      : `<use class="st-leaf" href="#leaf" x="35.5" y="33" width="29" height="31.5"/><text class="st-n" x="50" y="${small ? 54.5 : 55}" text-anchor="middle"${small ? ` style="font-size:${small}px"` : ""}>${esc(n)}</text>`;
    const reps = st.reps || Math.max(2, Math.round(56 / st.ring.length));
    const inner = `<circle class="st-o" cx="50" cy="50" r="46"/><circle class="st-i" cx="50" cy="50" r="30.5"/><text class="st-t"><textPath href="#ring34" lengthAdjust="spacing" textLength="211.6">${esc(st.ring.repeat(reps))}</textPath></text>${center}`;
    return `<svg class="stamp ${on ? "on" : "off"}"${on && !bare ? ` data-m="press" data-k="stamp-${esc(st.id)}"` : ""} viewBox="0 0 100 100" role="img" aria-label="${on ? `${esc(st.name)}, earned` : `${esc(st.name)}, still to earn`}" style="color:var(${on ? STAMP_INK(st) : "--ink-3"});transform:rotate(${on ? stampRot(st) : 0}deg)"><g${on ? ' filter="url(#ink)"' : ""}>${inner}</g></svg>`;
  }
  // The collection: which stamps you have (a stamp once earned stays, even if a level slips back), when you got
  // them, and how far you are from each of the others.
  function stampBook() {
    const x = stampCtx(), when = (S.settings.get("main") || {}).stamps || {}, wk = addDays(todayStr(), -6);
    const rows = STAMPS.map((st) => {
      const got = !!when[st.id] || !!st.earned(x);
      const pr = !got && st.prog ? st.prog(x) : null;
      return { st, got, day: typeof when[st.id] === "string" ? when[st.id] : "", isNew: got && typeof when[st.id] === "string" && when[st.id] >= wk, pr: pr && pr[1] > 0 ? pr : null };
    });
    return { rows, n: rows.filter((r) => r.got).length };
  }
  const stampCell = (r) => `<figure class="stamp-cell" style="--fc:var(${STAMP_INK(r.st)})">${stampSVG(r.st, r.got)}<figcaption><b>${esc(r.st.name)}</b>${r.isNew ? `<span class="st-new">nouveau</span>` : ""}<small>${esc(r.got ? r.st.got : r.st.todo)}</small>${r.pr ? `<span class="st-prog" title="${r.pr[0]} of ${r.pr[1]}"><i style="width:${Math.round((r.pr[0] / r.pr[1]) * 100)}%"></i></span><small class="num">${r.pr[0]}/${r.pr[1]}</small>` : ""}</figcaption></figure>`;
  // The tile's face: your status on the road to Canada, the stamps you're closest to, and your latest ones.
  function stampsFace(B) {
    const N = STAMPS.length, ri = rankOf(B.n), [k0, name, en] = RANKS[ri], nx = RANKS[ri + 1];
    const fill = nx ? (B.n - k0) / (nx[0] - k0) : 1;
    const track = RANKS.map(([k, nm, e2], i) => { const f = i < ri ? 1 : i > ri ? 0 : fill; return `<span class="pp-seg${i <= ri ? " on" : ""}${i === ri ? " cur" : ""}" data-tip="${esc(nm)}\n${esc(e2)} · from ${k} stamps"><span class="pp-bar"><i style="width:${Math.round(f * 100)}%"${i === ri ? ` data-tween="pp-rank" data-tw="width" data-to="${Math.round(f * 100)}"` : ""}></i></span><small>${esc(nm)}</small></span>`; }).join("");
    const near = B.rows.filter((r) => !r.got && r.pr && r.pr[0] > 0).sort((a, b) => b.pr[0] / b.pr[1] - a.pr[0] / a.pr[1] || (a.pr[1] - a.pr[0]) - (b.pr[1] - b.pr[0])).slice(0, 4);
    const last = B.rows.filter((r) => r.got && r.day).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 6);
    return `${tileHero(`${B.n}<small>/${N}</small>`, "stamps collected · open the tile for the whole collection")}
      <div class="pp-top"><div class="pp-rank" style="--rk:var(${["--sk-eo", "--sk-ce", "--sk-co", "--sk-gra", "--sk-ee", "--red"][ri]})">
        <p class="pp-k">Statut · status</p>
        <p class="pp-r"><b>${esc(name)}</b><small class="en-gloss">${esc(en)}</small></p>
        <div class="pp-track" role="img" aria-label="Status ${ri + 1} of ${RANKS.length}: ${esc(name)}">${track}</div>
        <p class="small muted">${nx ? `${nx[0] - B.n} more stamp${nx[0] - B.n > 1 ? "s" : ""} for ${esc(nx[1])}` : "You've reached the last status on the road."}</p>
      </div>
      ${near.length ? `<div class="pp-near"><p class="h3">Presque · nearly there</p><ul>${near.map((r) => `<li style="--fc:var(${STAMP_INK(r.st)})">${stampSVG(r.st, false)}<span><b>${esc(r.st.name)}</b><small>${esc(r.st.todo)}</small><span class="st-prog"><i data-tween="pp-n-${r.st.id}" data-tw="width" data-to="${Math.round((r.pr[0] / r.pr[1]) * 100)}" style="width:${Math.round((r.pr[0] / r.pr[1]) * 100)}%"></i></span></span><b class="num">${r.pr[0]}/${r.pr[1]}</b></li>`).join("")}</ul></div>` : ""}</div>
      ${last.length ? `<div class="pp-last"><p class="h3">Derniers tampons · latest</p><div class="stamps">${last.map(stampCell).join("")}</div></div>` : ""}`;
  }
  // The whole collection, family by family.
  const stampsMore = (B) => `<div class="pp-fams">${STAMP_FAM.map(([f, name, en, ink]) => { const rs = B.rows.filter((r) => r.st.fam === f); return `<section class="pp-fam" style="--fc:var(${ink})"><h4 class="pp-fh"><span>${esc(name)}</span><small class="en-gloss">${esc(en)}</small><b class="num">${rs.filter((r) => r.got).length}/${rs.length}</b></h4><div class="stamps">${rs.map(stampCell).join("")}</div></section>`; }).join("")}</div>`;

  // A stamp earned gets its moment: the first time it's earned, it's pressed onto the page with a thud and a burst
  // of leaves (#award; motion.js moves it). Which stamps have had theirs is kept in settings.main.stamps (the day of
  // each), so it happens once, on every device. The very first check records what was already earned, quietly, as
  // true rather than a day, so none of those is tagged new. Stamps added to the site since your last check
  // (settings.main.stampSet, the batch you've seen) that you'd already earned are recorded quietly too, but with the
  // day, so they're tagged new on the Tampons tile instead of each taking a turn at the top of the page.
  // It's worked out again only after your progress has changed, and never before all of it has arrived.
  const awardEl = document.getElementById("award");
  let stampRev = -1, awardT = 0, awardAt = 0;
  const awardQ = [];
  function stampCheck() {
    if (!allIn || !hydrated || !awardEl || dataRev === stampRev) return;
    stampRev = dataRev;
    const main = S.settings.get("main") || {}, had = main.stamps, seen = had ? Number(main.stampSet) || 1 : 0;
    const x = stampCtx();
    const fresh = STAMPS.filter((st) => !(had && had[st.id]) && st.earned(x));
    if (had && !fresh.length && seen >= STAMP_SET) return;
    const t = todayStr(), added = (st) => (st.set || 1) > seen;
    saveSettings({ stampSet: STAMP_SET, stamps: Object.assign({}, had || {}, Object.fromEntries(fresh.map((st) => [st.id, had ? t : true]))) });
    if (!had) return;
    // Each award knows how many stamps you have with it, so the one that brings a new status says so.
    let n = STAMPS.filter((st) => had[st.id]).length + fresh.filter(added).length;
    fresh.filter((st) => !added(st)).forEach((st) => awardQ.push({ id: st.id, n: ++n }));
    awardNext();
  }
  function awardNext() {
    if (!awardEl || !awardEl.hidden || !awardQ.length) return;
    const q = awardQ.shift(), st = STAMPS.find((x) => x.id === q.id), rk = RANKS.find(([k]) => k > 0 && k === q.n);
    if (!st) { awardNext(); return; }
    awardEl.innerHTML = `<div class="aw-stamp">${stampSVG(st, true, true)}</div>
      <div class="aw-txt"><p class="aw-kick">Nouveau tampon !</p><b>${esc(st.name)}</b><span>${esc(st.got)}</span>${rk ? `<span class="aw-rank">Nouveau statut : <b>${esc(rk[1])}</b></span>` : ""}<a class="aw-go" href="#progress.stamps">Voir mes tampons</a></div>
      ${remy("bravo")}<button type="button" class="btn ghost sm aw-x" aria-label="Dismiss">×</button>`;
    awardEl.hidden = false;
    awardAt = Date.now();
    // The thud as the stamp meets the page (motion.js presses it on, and it lands about a third of a second in).
    tone("thunk", 0.33);
    clearTimeout(awardT);
    awardT = setTimeout(awardClose, 6500);
  }
  function awardClose() {
    if (!awardEl || awardEl.hidden) return;
    clearTimeout(awardT);
    awardEl.hidden = true;
    awardEl.innerHTML = "";
    if (awardQ.length) awardT = setTimeout(awardNext, 400);
  }
  if (awardEl) {
    awardEl.addEventListener("click", (e) => { if (e.target.closest(".aw-x, a")) awardClose(); });
    // A click anywhere else, once it has been seen for a moment, puts it away; so does Esc (and only that, then).
    document.addEventListener("pointerdown", (e) => { if (!awardEl.hidden && !awardEl.contains(e.target) && Date.now() - awardAt > 900) awardClose(); }, true);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !awardEl.hidden) { e.stopImmediatePropagation(); awardClose(); } }, true);
  }

  // Carte d'embarquement: the five phases as one flight from B1 to NCLC 7. The plane flies in your current phase's
  // stretch of the route and moves on each week, and the gate is today's first open block. A small version sits at
  // the foot of the sidebar.
  function passWeeks() {
    const starts = T.PHASES.map((p) => Number((String(p.weeks).match(/\d+/) || [1])[0]));
    const total = Number((String(T.PHASES[T.PHASES.length - 1].weeks).match(/(\d+)\D*$/) || [0, 21])[1]);
    return { starts, total };
  }
  // Where the plane is: this week when it falls in your phase's weeks, else the phase's first week when you're ahead
  // of the plan, or its last when you're behind. So switching phase moves the plane to that phase.
  function passAt() {
    const s = settings(), w = weekNo(), { starts, total } = passWeeks(), i = s.phase - 1;
    const first = starts[i] || 1, last = i + 1 < starts.length ? starts[i + 1] - 1 : total;
    return Math.min(Math.max(w, first), Math.max(first, last));
  }
  function flightSVG(mini) {
    const s = settings(), w = weekNo(), { starts, total } = passWeeks(), at = passAt();
    const X = (k) => +(10 + ((Math.min(Math.max(k, 1), total + 1) - 1) / total) * 274).toFixed(2);
    const x = X(at);
    const dots = starts.map((k, i) => {
      const n = i + 1, past = n < s.phase, cur = n === s.phase, cx = X(k);
      return `<circle cx="${cx}" cy="20" r="4.2" style="fill:var(${past ? "--accent" : "--surface"});stroke:var(${past || cur ? "--accent" : "--rule-2"})" stroke-width="2"/>${mini ? "" : `<text x="${cx}" y="37" text-anchor="middle" style="font:${cur ? 700 : 500} 10px var(--f-ui);fill:var(${cur ? "--ink" : "--ink-3"})">${n}</text>`}`;
    }).join("");
    return `<svg class="flight" viewBox="0 0 300 ${mini ? 30 : 40}" role="img" aria-label="Week ${w} of ${total}: Phase ${s.phase} of ${T.PHASES.length}"><path d="M${x} 20H284" style="stroke:var(--rule-2)" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 6"/><path d="M10 20H${x}" style="stroke:var(--accent)" stroke-width="2.4" stroke-linecap="round"${mini ? "" : ` data-m="draw" data-k="route-${at}" data-fly="route"`}/>${dots}<use href="#leaf" x="285" y="11.5" width="15" height="16.3" style="fill:var(--leaf-4)"/><g${mini ? "" : ` data-m="fly" data-k="plane-${at}" data-dx="${+(x - 10).toFixed(2)}" data-fly="plane"`}><g transform="translate(${+(x - 10).toFixed(2)} 10) rotate(45 10 10)"><svg class="ico" width="20" height="20" viewBox="0 0 24 24" style="color:var(--accent)"><use href="#i-plane" style="fill:var(--surface)"/></svg></g></g></svg>`;
  }
  const BARCODE = `<svg class="barcode" viewBox="0 0 118 46" preserveAspectRatio="none" aria-hidden="true">${[[0, 1], [2, 2], [5, 3], [10, 4], [16, 1], [18, 2], [21, 3], [27, 4], [34, 1], [37, 2], [41, 3], [47, 4], [54, 1], [57, 2], [61, 3], [65, 4], [70, 1], [74, 2], [79, 3], [83, 4], [88, 1], [92, 2], [97, 3], [102, 4], [108, 1], [110, 2], [113, 3]].map(([x, w]) => `<rect x="${x}" y="0" width="${w}" height="46"/>`).join("")}</svg>`;
  // Check-in: the phase's exit criteria, each met or not. Worked out again only when your progress changes, since
  // the sidebar's small pass shows the count on every redraw.
  let ckMemo = null;
  function checkIn(phase) {
    const k = `${dataRev}|${phase}|${todayStr()}`;
    if (ckMemo && ckMemo.k === k) return ckMemo.v;
    const crit = arr(T.CRITERIA[phase]), ok = crit.map((c) => !!criterionStatus(c).ok), n = ok.filter(Boolean).length;
    ckMemo = { k, v: { crit, ok, n, all: crit.length > 0 && n === crit.length } };
    return ckMemo.v;
  }
  const TICK_PATH = `<path d="M6.5 12.5l3.6 3.6 7.4-8"/>`;
  // Once every criterion is met, the pass is stamped « Prêt à embarquer ».
  const boardStamp = (phase) => `<svg class="board-stamp" viewBox="0 0 214 56" role="img" aria-label="Stamp: Prêt à embarquer" data-m="press" data-k="board-${phase}"><g filter="url(#ink)"><rect class="tb-o" x="2.5" y="2.5" width="209" height="51" rx="10"/><rect class="tb-i" x="8" y="8" width="198" height="40" rx="6"/><svg class="bs-plane" x="16" y="14" width="28" height="28" viewBox="0 0 24 24"><use href="#i-plane"/></svg><text x="128" y="34.5" text-anchor="middle">PRÊT À EMBARQUER</text></g></svg>`;
  function passHTML() {
    const s = settings(), P = T.PHASES[s.phase - 1], { total } = passWeeks();
    const ck = checkIn(s.phase);
    // One box per criterion, ticked in blue ink when it's met; they're pressed in, one after another, as the page opens.
    const boxes = ck.crit.length ? `<div class="checkin"><small>Enregistrement · Check-in</small><span class="ck-row" role="img" aria-label="${ck.n} of ${ck.crit.length} exit criteria met">${ck.crit.map((c, i) => `<i class="ck${ck.ok[i] ? " on" : ""}" data-tip="${esc(c.text)}\n${ck.ok[i] ? "Met" : "Not met yet"}"${ck.ok[i] ? ` data-m="press" data-k="ck-${s.phase}-${esc(c.id)}"` : ""}>${ck.ok[i] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${TICK_PATH}</svg>` : ""}</i>`).join("")}</span></div>` : "";
    const t = todayStr(), plan = planFor(s.phase, t), done = (S.days.get(t) || {}).done || {};
    const open = plan ? plan.findIndex((b, k) => !done[blockKey(s.phase, k)]) : -1;
    const gate = !plan ? "Repos · Rest day" : open < 0 ? "Journée validée" : `${T.SKILLS[plan[open][0]].code} · ${plan[open][2]}`;
    const mins = plan ? `${planMins(t, s.phase)} min` : "Repos";
    return `<div class="pass${ck.all ? " boarded" : ""}"><div class="pass-main"><div class="pass-band"><span>Carte d'embarquement · Boarding pass</span><span>Vol TCF-7</span></div>
      <div class="route"><div class="city"><small>Départ · From</small><b>B1</b><span>Where you started</span></div>${flightSVG(false)}<div class="city r"><small>Arrivée · To</small><b>NCLC&#160;7</b><span>All four skills</span></div></div>
      <dl class="fields"><div><dt>Phase</dt><dd>${s.phase} · ${esc(P.name)}</dd></div><div><dt>Semaine · Week</dt><dd>${weekNo()} sur ${total}</dd></div><div><dt>Porte · Gate</dt><dd>${esc(gate)}</dd></div><div><dt>Aujourd'hui · Today</dt><dd>${mins}</dd></div></dl>${ck.all ? boardStamp(s.phase) : ""}</div>
      <div class="pass-stub"><div class="seat"><small>Siège · Seat</small><b>7A</b></div>${boxes}${BARCODE}</div></div>`;
  }
  const miniPass = () => {
    const s = settings(), P = T.PHASES[s.phase - 1], ck = checkIn(s.phase);
    const n = ck.crit.length ? `<span class="mp-ck${ck.all ? " all" : ""}" title="${ck.n} of ${ck.crit.length} exit criteria met"><svg viewBox="0 0 24 24" aria-hidden="true">${TICK_PATH}</svg>${ck.n}/${ck.crit.length}</span>` : "";
    return `<a class="mini-pass" href="#progress"><span class="top"><span>Vol TCF-7</span><span>B1 → NCLC 7</span></span><b>Phase ${s.phase} · ${esc(P.name)}</b>${flightSVG(true)}<span class="bot"><span>Semaine ${weekNo()} · ${esc(P.weeks)}</span>${n}</span></a>`;
  };

  // L'expression du jour: a new saying every morning, on a scrap of notebook paper. Each one is a card in the
  // Expressions deck. The scrap shows the saying, for you to guess what it means; a tap turns it over to its meaning,
  // where you are with its card and a link to the deck. It stays turned for the day (ui.xp, kept in the tab). The
  // list is grouped by use, so the days step through it several places at a time and the groups take turns.
  const XP_REG = { "Québec": "Québec. ", familier: "Informal. ", soutenu: "Formal. " };
  function expressionCard() {
    const xs = arr(T.EXPRESSIONS);
    if (!xs.length) return "";
    const n = xs.length, d = ((daysBetween("2026-01-01", todayStr()) % n) + n) % n;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const x = xs[(d * [17, 13, 11, 7, 1].find((k) => gcd(k, n) === 1)) % n];
    const say = /[.!?…)]$/.test(x.fr) ? x.fr : x.fr + (/ (que|à)$/.test(x.fr) ? "…" : ".");
    const mean = x.lit ? `Literally “${x.lit}”: ${x.en}` : cap(x.en);
    const line = (XP_REG[x.reg] || "") + mean + (/[.!?]$/.test(mean) ? "" : ".");
    const id = "expressions--" + slug(x.fr), st = S.srs.get(id);
    const where = !DECK.has(id) ? "" : !st ? "nouvelle · new card" : !st.pri && st.stage >= 5 ? "maîtrisée · mastered"
      : st.due <= todayStr() ? "à revoir aujourd'hui · due today" : `à revoir le ${shortDate(st.due)} · due ${shortDate(st.due)}`;
    const on = ui.xp === todayStr(), fr = `<p class="eyebrow">Expression du jour</p><p class="fr" lang="fr">${typo(cap(say))}</p>`;
    const turn = (label, back) => `<button type="button" class="xp-btn" data-act="xp-flip" aria-label="${label}">${back ? "↺" : `<span aria-hidden="true">↻</span> ${label}`}</button>`;
    return `<figure class="note-card xp${on ? " turned" : ""}" data-act="xp-flip"><span class="tape" aria-hidden="true"></span><div class="xp-in">
      <div class="xp-face xp-front seyes"${on ? " inert" : ""}>${fr}<p class="xp-hint">Guess the meaning, then turn it over.</p>${turn("Turn over")}</div>
      <div class="xp-face xp-back seyes"${on ? "" : " inert"}>${fr}<p class="en">${esc(line)}</p><div class="xp-foot">${where ? `<a class="xp-deck" href="#vocab.new.expressions">${ico("vocab")}<span>Expressions · ${where}</span></a>` : "<span></span>"}${turn("Turn back", true)}</div></div>
    </div></figure>`;
  }

  /* =============== errors =============== */
  function allErrors() {
    const out = [];
    for (const w of list("writing")) {
      const W = T.WRITING[w.task];
      arr(w.fb && w.fb.errors).forEach((e) => out.push(Object.assign({}, e, { date: w.date, ts: w.ts || 0, src: (W ? W.name : "Écrit") + " écrit" })));
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
  // Each item carries its set's instruction, so it still says what to do in the mixed review and retries,
  // and its set and point (the rule it tests, from drills.js), so a retry can find another sentence on that rule.
  function normItem(raw, kind, topic, ask, set) {
    if (kind === "choice") return { kind, topic, set, ask: ask || "", q: raw[0], options: raw[1].slice(), a: [raw[1][0]], why: raw[2] || "", point: raw[3] || "" };
    return { kind: "type", topic, set, ask: ask || "", src: raw[0] || "", q: raw[1], a: Array.isArray(raw[2]) ? raw[2] : [raw[2]], why: raw[3] || "", point: raw[4] || "" };
  }
  const setItems = (tid, st) => st.items.map((r) => normItem(r, st.kind, tid, st.ask, st.id));
  // A sentence's identity across rounds: its topic, cue and question. One of your own mistakes is known by
  // what you wrote alone (mk), since the sentence shown around it can change.
  const itemKey = (topic, it) => (topic === "mine" ? `mine|${norm(it.mk || it.src)}` : `${topic}|${norm(it.src)}|${norm(it.q)}`);
  // Names for the drill records that aren't one topic's set.
  const DRILL_NAMES = { mixed: "Mixed review", mine: "Your mistakes", hunt: "Find the mistakes" };
  let BANK = null;
  // The built-in sentence a saved question was, if it's still in a set, with its set and point.
  function bankItem(topic, it) {
    if (!BANK) BANK = new Map(T.TOPICS.flatMap((tp) => tp.sets.flatMap((st) => setItems(tp.id, st).map((x) => [itemKey(tp.id, x), x]))));
    return BANK.get(itemKey(topic, it)) || null;
  }
  // A round's retries, oldest first. A round can be retried more than once in a day, so they're a list
  // (retries); rounds saved before that keep a single retry.
  const retriesOf = (d) => (Array.isArray(d.retries) ? d.retries : d.retry ? [d.retry] : []);
  const retryScores = (d) => retriesOf(d).map((r) => `${r.score}/${r.total}`).join(" · ");
  // Every answer to a drill sentence, oldest first, from finished rounds and their retries. A retry's answers are
  // marked: the same sentence right a few minutes after its correction shows memory more than the rule.
  function drillLog() {
    const log = [];
    for (const d of list("drills")) {
      if (d.set === "prod") continue;
      arr(d.items).forEach((it) => log.push({ key: itemKey(it.topic || d.topic, it), ts: d.ts || 0, ok: !!it.ok }));
      retriesOf(d).forEach((r) => arr(r.items).forEach((it) => log.push({ key: itemKey(it.topic || d.topic, it), ts: r.ts || d.ts || 0, ok: !!it.ok, retry: true })));
    }
    return log.sort((a, b) => a.ts - b.ts);
  }
  // When each sentence was last asked, and whether it was right then.
  const drillSeen = (log) => new Map((log || drillLog()).map((e) => [e.key, e]));
  // Oldest first: sentences never asked, then the ones asked longest ago. Ties are in random order.
  const byAge = (items, seen) => shuffle(items).sort((a, b) => ((seen.get(itemKey(a.topic, a)) || {}).ts || 0) - ((seen.get(itemKey(b.topic, b)) || {}).ts || 0));
  // A round's sentences. Nothing repeats until the set is used up, because the ones not asked yet come first.
  // Rules missed in the last two weeks (a miss on a retry counts, a right answer on one doesn't) get extra
  // sentences, up to 40% of the round in all: one for each such
  // rule, then a second for those with two or more misses among their last five answers, then a third. They're
  // sentences other than the missed ones, so a rule that keeps tripping you up comes back worded differently,
  // and the extra practice fades once you get it right again. The rest of the round takes the rules in turn,
  // so each gets its share on top.
  function pickRound(pool, n, log) {
    const seen = drillSeen(log);
    const since = Date.now() - 14 * 864e5;
    const pointOf = new Map(pool.map((it) => [itemKey(it.topic, it), it.point]));
    const last = new Map();
    // A right answer on a retry doesn't clear a rule: it's the same sentence just after its correction.
    log.forEach((e) => { const p = pointOf.get(e.key); if (p && e.ts >= since && !(e.retry && e.ok)) last.set(p, (last.get(p) || []).concat(e.ok).slice(-5)); });
    const weak = [...last.entries()].map(([p, oks]) => [p, oks.filter((ok) => !ok).length]).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
    const missed = (it) => { const s = seen.get(itemKey(it.topic, it)); return s && !s.ok && s.ts >= since; };
    const order = byAge(pool, seen);
    const out = new Set();
    let room = Math.floor(n * 0.4);
    for (let pass = 0; pass < 3 && room > 0; pass++) {
      for (const [point, misses] of weak) {
        if (room <= 0 || misses <= pass) continue;
        const it = order.find((x) => x.point === point && !out.has(x) && !missed(x));
        if (it) { out.add(it); room--; }
      }
    }
    const rules = shuffle([...new Set(order.map((x) => x.point))]);
    for (const fresh of [true, false]) {
      for (let added = true; added && out.size < n;) {
        added = false;
        for (const p of rules) {
          const it = out.size < n && order.find((x) => x.point === p && !out.has(x) && !(fresh && seen.has(itemKey(x.topic, x))));
          if (it) { out.add(it); added = true; }
        }
      }
    }
    return shuffle([...out]);
  }
  // Today's rounds of a set, oldest first. The mixed review (main) and Your mistakes (errors) are a set each.
  const todayRounds = (topic, set) => list("drills").filter((d) => d.topic === topic && d.set === set && d.set !== "prod" && d.src !== "retry" && d.date === todayStr()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // Retry the misses: every sentence missed today on this set, from every round and retry, whose latest answer
  // today is still wrong, asked exactly as it was. A built-in sentence comes back from its set, with its rule
  // and explanation; Claude's sentences from what was saved with the round; your own mistakes as a choice in
  // their sentence, with Claude's options (mineChoice).
  function todayMisses(topic, set) {
    const ev = [];
    for (const d of todayRounds(topic, set)) {
      arr(d.items).forEach((it) => ev.push([d.ts || 0, it, it.topic || d.topic]));
      retriesOf(d).forEach((r) => arr(r.items).forEach((it) => ev.push([r.ts || d.ts || 0, it, it.topic || d.topic])));
    }
    const last = new Map();
    ev.sort((a, b) => a[0] - b[0]).forEach(([, it, tid]) => last.set(itemKey(tid, it), { it, tid }));
    const mine = topic === "mine" ? new Map(mineAll().map((m) => ["mine|" + m.key, m])) : null;
    const out = [];
    for (const [key, { it, tid }] of last) {
      if (it.ok) continue;
      if (mine) { const m = mine.get(key); if (m && m.kind !== "skip") out.push(mineChoice(m)); continue; } // a mistake you've since hidden stays out
      const b = bankItem(tid, it);
      out.push(b ? Object.assign({}, b) : { kind: it.kind || "type", topic: tid, ask: it.ask || "", src: it.src || "", q: it.q, options: it.options ? it.options.slice() : undefined, a: arr(it.a).slice(), why: it.why || "" });
    }
    return shuffle(out);
  }
  // "Retry today's misses" wherever the set can be started, once there's something to retry.
  function retryBtn(topic, set, cls) {
    const n = todayMisses(topic, set).length;
    return n ? `<button class="${cls || "btn"}" data-act="drill-retry" data-topic="${esc(topic)}" data-set="${esc(set)}" title="The sentences you missed today, exactly as they were">Retry today's ${n === 1 ? "miss" : `${n} misses`}</button>` : "";
  }
  /* =============== your own mistakes =============== */
  // Every mistake from Claude's corrections of your writing and production checks, and from the error log. A
  // mistake made again counts once: it's known by what you wrote (mk), with every correction given for it.
  // Claude prepares each corrected text once (the mistakes collection, minePrep): for each correction, whether
  // it's a real mistake, a style tip or not a point of French; the excerpt of the corrected text that holds it;
  // that excerpt with your mistake put back; and near-misses that are each wrong. A round is then one of your
  // texts with every mistake back in it, to find, and a choice with exactly one right answer to fix each one.
  // "arrivé(e)" → arrivé, arrivée (at most two such brackets).
  function variants(s) {
    let out = [str(s).trim()];
    for (let k = 0; k < 2; k++) out = out.flatMap((x) => { const m = x.match(/\(([^()\s]{1,3})\)/); return m ? [x.replace(m[0], ""), x.replace(m[0], m[1])] : [x]; });
    return out;
  }
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordRe = (w, flags) => new RegExp(`(?<![\\p{L}\\p{N}])${reEsc(w)}(?![\\p{L}\\p{N}])`, "u" + (flags || ""));
  const unbracket = (x) => str(x).replace(/\(([^()\s]{1,3})\)/g, "");
  const sentencesOf = (t) => str(t).split(/\n+|(?<=[.!?…])\s+/).filter((x) => x.trim());
  const overlap = (a, b) => { const A = new Set(norm(a).split(" ")); return norm(b).split(" ").filter((x) => A.has(x)).length; };
  const apo = (s) => str(s).replace(/[’‘ʼ]/g, "'");
  // Where an excerpt is in a text, as whole words (not glued to a letter, a digit, an apostrophe or a hyphen on
  // either side): [start, end], or null. Curly and straight apostrophes match each other.
  function spanAt(text, span) {
    if (!span) return null;
    const m = new RegExp(`(?<![\\p{L}\\p{N}'-])${reEsc(apo(span))}(?![\\p{L}\\p{N}'-])`, "u").exec(apo(text));
    return m ? [m.index, m.index + span.length] : null;
  }
  // A sentence with a gap in it, cut to about ten words on each side of the gap.
  function cutGap(gapped) {
    const ws = str(gapped).trim().split(/\s+/);
    const i = ws.findIndex((x) => x.includes("___"));
    if (i < 0) return "___";
    const from = Math.max(0, i - 10), to = Math.min(ws.length, i + 11);
    return (from ? "… " : "") + ws.slice(from, to).join(" ") + (to < ws.length ? " …" : "");
  }
  // The sentence of a text an excerpt is in, with a gap in its place.
  function gapIn(text, span) {
    for (const sen of sentencesOf(text)) {
      const at = spanAt(sen, span);
      if (at) return cutGap(sen.slice(0, at[0]) + "___" + sen.slice(at[1]));
    }
    return "";
  }
  // Before Claude has prepared a text: the sentence a mistake was in, with a gap where the correction goes. It
  // comes from Claude's corrected text when the correction is there (exact: every word around the gap is
  // right). Otherwise it's your sentence with the draft's other corrections applied.
  function mistakeContext(text, corrected, wrong, a, errs) {
    const re = wordRe(wrong);
    const orig = sentencesOf(text).find((x) => re.test(x)) || "";
    let gapped = "", best = -1;
    for (const sen of sentencesOf(unbracket(corrected))) {
      for (const r of a) {
        const m = wordRe(r).exec(sen);
        const score = m ? overlap(orig, sen) : -1;
        if (score > best) { best = score; gapped = sen.slice(0, m.index) + "___" + sen.slice(m.index + r.length); }
      }
    }
    if (!gapped && orig) {
      const m = re.exec(orig);
      let before = orig.slice(0, m.index), after = orig.slice(m.index + wrong.length);
      for (const e of arr(errs)) {
        const w = str(e.wrong).trim(), r = variants(str(e.right).split(/\s+\/\s+/)[0])[0];
        if (!w || !r || w.includes(wrong) || wrong.includes(w)) continue;
        before = before.replace(wordRe(w, "g"), () => r);
        after = after.replace(wordRe(w, "g"), () => r);
      }
      gapped = unbracket(before) + "___" + unbracket(after);
    }
    return gapped ? cutGap(gapped) : "___";
  }
  // The texts your mistakes come from: each corrected writing task (EE) and production check.
  function mineSources() {
    const out = [];
    for (const w of list("writing")) {
      if (!w.fb || !arr(w.fb.errors).length) continue;
      const W = T.WRITING[w.task];
      out.push({ ref: "w-" + w.id, ee: true, ts: w.ts || 0, text: str(w.text), corrected: str(w.fb.corrected), errs: arr(w.fb.errors), sujet: str(w.prompt), title: `${W ? `${W.name} · ${W.kind}` : "Écrit"} · ${shortDate(w.date)}`, from: `your ${W ? W.name : "writing"} of ${shortDate(w.date)}` });
    }
    for (const d of list("drills")) {
      if (d.set !== "prod" || !d.fb || !arr(d.fb.errors).length) continue;
      const tp = TOPIC[d.topic];
      out.push({ ref: "p-" + d.id, ee: false, ts: d.ts || 0, cat: d.topic, text: str(d.text), corrected: str(d.fb.improved), errs: arr(d.fb.errors), sujet: tp && tp.prod ? str(tp.prod.prompt) : "", title: `${tp ? tp.title : "Production"} · ${shortDate(d.date)}`, from: `your ${tp ? tp.title : "production"} check of ${shortDate(d.date)}` });
    }
    return out.sort((a, b) => b.ee - a.ee || b.ts - a.ts);
  }
  // What Claude prepared, by text: w-<writing id>, p-<production check id>, and "log" for the error log (by entry).
  const PREP_V = 1;
  const prepDoc = (ref) => { const p = S.mistakes.get(ref); return p && p.v === PREP_V ? p : null; };
  // The preparation of correction n of a text, if it's still for that same mistake.
  const prepFor = (src, n, e) => { const p = prepDoc(src.ref), x = p && arr(p.items).find((y) => y.n === n); return x && norm(x.mk) === norm(e.wrong) ? x : null; };
  const prepLog = (e) => { const p = prepDoc("log"), x = p && p.items && p.items[e.id]; return x && norm(x.mk) === norm(e.wrong) ? x : null; };
  const KIND_RANK = { error: 3, style: 2, skip: 1 };
  function myMistakes() {
    const hidden = new Set(arr(settings().mineHidden));
    const found = new Map();
    const add = (e, src, prep) => {
      const wrong = str(e.wrong).trim(), key = norm(wrong);
      const a = [...new Set(str(e.right).split(/\s+\/\s+/).flatMap(variants).filter((r) => r && norm(r) !== key))];
      if (!key || hidden.has(key) || !a.length) return;
      const C = src.corrected ? unbracket(src.corrected) : "";
      const fallbackQ = () => (src.text ? mistakeContext(src.text, src.corrected, wrong, a, src.errs) : "___");
      // How it's asked: with Claude's excerpt and options; or, from a text Claude prepared without this one, as
      // the correction or what you wrote.
      let use = null;
      if (prep) {
        const span = unbracket(prep.span), placed = !!(C && span && spanAt(C, span));
        use = { kind: prep.kind, ref: src.ref, right: span || a[0], yours: str(prep.wrong) || wrong, near: arr(prep.near), why: str(prep.why), q: prep.q || (placed ? gapIn(C, span) : "") || fallbackQ(), placed };
      } else if (src.ref !== "log" && prepDoc(src.ref)) use = { kind: "error", ref: src.ref, right: a[0], yours: wrong, near: [], why: str(e.why), q: fallbackQ(), placed: false };
      const cur = found.get(key);
      if (!cur) {
        found.set(key, { key, wrong, a, n: 1, ts: src.ts || 0, from: src.from, cat: catOf(e.category || src.cat), why: str(e.why), kind: use ? use.kind : "pending", use, q: use ? use.q : fallbackQ(), uses: use ? [use] : [] });
        return;
      }
      cur.n++;
      cur.ts = Math.max(cur.ts, src.ts || 0);
      a.forEach((r) => { if (!cur.a.some((x) => norm(x) === norm(r))) cur.a.push(r); });
      if (!cur.why && e.why) cur.why = str(e.why);
      if (!use) return;
      cur.uses.push(use);
      // The strongest verdict wins (a real mistake in one text is a mistake), and an excerpt that's in its text
      // beats one that isn't.
      if (!cur.use || KIND_RANK[use.kind] > KIND_RANK[cur.kind] || (use.kind === cur.kind && use.placed && !cur.use.placed)) Object.assign(cur, { use, kind: use.kind, q: use.q });
    };
    for (const src of mineSources()) src.errs.forEach((e, n) => add(e, src, prepFor(src, n, e)));
    for (const e of list("errors")) add(e, { ref: "log", ts: e.ts, from: "your error log" }, prepLog(e));
    return [...found.values()];
  }
  // Where each one stands: new (never practised), missed last time, right once, or fixed (right the last two times).
  function mineAll() {
    const hist = new Map();
    // A right answer on a retry doesn't move a mistake toward fixed; a miss on one does count.
    drillLog().forEach((e) => { if (e.key.startsWith("mine|") && !(e.retry && e.ok)) hist.set(e.key, (hist.get(e.key) || []).concat(e)); });
    return myMistakes().map((m) => {
      const h = hist.get("mine|" + m.key) || [], last = h[h.length - 1], prev = h[h.length - 2];
      return Object.assign(m, { state: !last ? "new" : !last.ok ? "missed" : prev && prev.ok ? "fixed" : "once", seen: last ? last.ts : 0 });
    });
  }
  // The mistakes to practise (real ones, and ones Claude hasn't prepared yet), and the style tips apart.
  const mineStatus = () => mineAll().filter((m) => m.kind === "error" || m.kind === "pending");
  const styleStatus = () => mineAll().filter((m) => m.kind === "style");
  // New ones first (the ones made most often, then the newest), then the ones missed last time, then the ones
  // right once, then fixed ones, longest ago first, so they come back to check they stay fixed.
  const TIER = { new: 0, missed: 1, once: 2, fixed: 3 };
  const byNeed = (a, b) => TIER[a.state] - TIER[b.state] || (a.state === "new" ? b.n - a.n || b.ts - a.ts : a.seen - b.seen);
  // A mistake as a choice in its sentence (Retry today's misses, the style tips, « Hors texte » cards): the
  // correction, what you wrote and Claude's near-misses. There's no « what you wrote » above it, since that would
  // say which option is yours.
  function mineOptions(m, n) {
    const u = m.use || {}, seen = new Set();
    return [u.right || m.a[0], u.yours || m.wrong].concat(arr(u.near)).filter((o) => { const k = norm(o); if (!o || !k || seen.has(k)) return false; seen.add(k); return true; }).slice(0, n);
  }
  function mineChoice(m) {
    const style = m.kind === "style", u = m.use || {};
    return { kind: "choice", topic: "mine", set: style ? "style" : "errors", ask: style ? "Which sounds more natural?" : "Which is correct here?", mk: m.wrong, q: m.q || "___", options: mineOptions(m, style ? 3 : 4), a: [u.right || m.a[0]], why: u.why || m.why || `${CAT[m.cat]}.`, point: style ? "Conseil de style" : CAT[m.cat] };
  }
  const styleRound = (n) => shuffle(styleStatus().filter((m) => m.use).sort(byNeed).slice(0, n)).map(mineChoice);

  /* ----- Claude prepares each corrected text, once ----- */
  function minePrompt(src) {
    const log = src.ref === "log";
    const fixes = src.errs.map((e, n) => `${n + 1}. « ${str(e.wrong)} » → « ${str(e.right)} »${e.why ? ` (${str(e.why)})` : ""}`).join("\n");
    const texts = log ? "" : `THE LEARNER'S TEXT:\n"""\n${src.text}\n"""\n\nTHE CORRECTED TEXT:\n"""\n${src.corrected}\n"""\n\n`;
    return `You are preparing a French learner's own mistakes for an exercise. The learner (adult, B1, aiming for B2, NCLC 7, at the TCF Canada) ${log ? "sees each mistake as a sentence with a gap and picks the right version from 4 options" : "sees their text again as the teacher corrected it, with their mistakes put back as they wrote them, taps the mistakes, then picks each correction from 4 options"}. Every question must have exactly one right answer, so be strict.\n\n${texts}THE TEACHER'S CORRECTIONS (what the learner wrote → the correction):\n${fixes}\n\nFor each correction, give:\n- "n": its number.\n- "kind": "error" if what the learner wrote is incorrect French (grammar, spelling, accents, agreement, elision, mood or tense, a wrong word, preposition or construction); "style" if it was already correct French and the correction only sounds more natural or more formal; "skip" if it isn't a point of French (a person's name, punctuation or capital letters only, a missing sentence, or no real change).\n- "span": ${log ? "the correction, written as it should be in a sentence" : `the shortest excerpt of THE CORRECTED TEXT that holds the whole correction, copied exactly, character for character, in whole words (at most 10 words). Use "" if the correction isn't in the corrected text`}.\n- "wrong": the same excerpt with only this mistake in it, the way the learner wrote it${log ? "" : `. It replaces "span" in the corrected text, so it has to fit the words around it`}.\n- "near": for "error", 3 other versions of the excerpt, each with one real mistake of the same kind as the learner's that a B1 learner might make (gender, agreement, accent, mood, preposition, word order…). Each must be wrong French, and different from "span", from "wrong" and from each other. For "style", 1 version with a real grammar or spelling mistake. For "skip", [].\n- "why": one short sentence in ${replyLang()} giving the rule, for the learner.${log ? `\n- "sentence": a natural B1–B2 sentence on a TCF Canada theme (settling in Canada, work, housing, studies) that uses the correction, with ___ in place of exactly "span".` : ""}\nReply with only JSON: {"items": [{"n": 1, "kind": "error", "span": "...", "wrong": "...", "near": ["...", "...", "..."], "why": "..."${log ? `, "sentence": "..."` : ""}}]}`;
  }
  // Claude's answer, checked: the excerpt has to be in the corrected text as whole words (if it isn't, the
  // correction itself is looked for), the options all different, and a correction that changes nothing isn't a mistake.
  function minePrepClean(src, out) {
    const C = src.corrected ? unbracket(src.corrected) : "";
    const items = [];
    for (const x of arr(out && out.items)) {
      const n = Number(x && x.n) - 1, e = src.errs[n];
      if (!e || items.some((y) => y.n === n)) continue;
      let kind = ["error", "style", "skip"].includes(x.kind) ? x.kind : "error";
      const right = str(e.right).split(/\s+\/\s+/)[0].trim();
      let span = unbracket(str(x.span).trim());
      if (C && span && !spanAt(C, span)) span = "";
      if (C && !span) span = variants(right).map(unbracket).find((r) => spanAt(C, r)) || "";
      if (!C && !span) span = unbracket(right);
      if (countWords(span) > 16) span = "";
      const wrong = str(x.wrong).trim() || str(e.wrong).trim();
      if (span && norm(span) === norm(wrong)) kind = "skip";
      const seen = new Set([norm(span), norm(wrong)]);
      const near = arr(x.near).map((s) => str(s).trim()).filter((s) => { const k = norm(s); if (!s || !k || seen.has(k)) return false; seen.add(k); return true; }).slice(0, kind === "style" ? 1 : 3);
      const q = !C && str(x.sentence).split("___").length === 2 ? cutGap(str(x.sentence)) : "";
      items.push(Object.assign({ n, mk: str(e.wrong).trim(), kind, span, wrong, near, why: str(x.why).trim() || str(e.why) }, q ? { q } : {}));
    }
    return items;
  }
  // The texts Claude hasn't prepared yet (your EE drafts first, newest first), then the error-log entries that
  // aren't in any of your texts, all together.
  function mineBacklog() {
    const srcs = mineSources(), out = srcs.filter((s) => !prepDoc(s.ref));
    const p = prepDoc("log"), hidden = new Set(arr(settings().mineHidden));
    const inText = new Set(srcs.flatMap((s) => s.errs.map((e) => norm(e.wrong))));
    const errs = list("errors").filter((e) => { const k = norm(e.wrong); return k && str(e.right).trim() && k !== norm(e.right) && !hidden.has(k) && !inText.has(k) && !(p && p.items && p.items[e.id]); });
    if (errs.length) out.push({ ref: "log", ee: false, errs, ids: errs.map((e) => e.id), text: "", corrected: "" });
    return out;
  }
  async function minePrep(src, quiet) {
    const out = await ask("mine-prep-" + src.ref, minePrompt(src), { quiet });
    if (!out) return false;
    const items = minePrepClean(src, out);
    if (src.ref !== "log") { put("mistakes", src.ref, { ref: src.ref, v: PREP_V, ts: Date.now(), items }); return true; }
    // An entry Claude left out is still marked as prepared, so it's asked as the correction or what you wrote.
    const cur = prepDoc("log"), all = Object.assign({}, cur ? cur.items : {});
    src.errs.forEach((e, n) => { all[src.ids[n]] = items.find((x) => x.n === n) || { n, mk: str(e.wrong).trim(), kind: "error", span: str(e.right).trim(), wrong: str(e.wrong).trim(), near: [], why: str(e.why) }; });
    put("mistakes", "log", { ref: "log", v: PREP_V, ts: Date.now(), items: all });
    return true;
  }
  let prepRun = null; // { done, total, ref, stop } while Claude prepares your texts one after another
  async function minePrepAll() {
    if (prepRun || !claudeOn()) return;
    const todo = mineBacklog().filter((s) => !busy["mine-prep-" + s.ref]);
    if (!todo.length) return;
    prepRun = { done: 0, total: todo.length, ref: "", stop: false };
    render(true);
    for (const src of todo) {
      if (prepRun.stop) break;
      prepRun.ref = src.ref;
      if (!(await minePrep(src))) break;
      prepRun.done++;
    }
    const { done, total } = prepRun;
    prepRun = null;
    if (done) toast(done === total ? `Ready: ${done === 1 ? "your text" : `all ${done} texts`}.` : `${done} of ${total} texts are ready.`);
    render(true);
  }
  function minePrepStop() {
    if (!prepRun) return;
    prepRun.stop = true;
    const c = busy["mine-prep-" + prepRun.ref];
    if (c) c.abort();
  }
  // Right after a correction, its mistakes are prepared in the background, without a word unless you look.
  function minePrepSoon(ref) {
    if (!sample || prepRun || prepDoc(ref)) return;
    const src = mineSources().find((s) => s.ref === ref);
    if (src) minePrep(src, true);
  }

  /* ----- a round: your text with your mistakes back in it ----- */
  // Mistakes on overlapping words can't all be put back. A correction that rewrites a whole clause often holds
  // smaller ones, so the choice is the one that puts the most mistakes back, and on a tie the one that brings
  // back more of what you wrote (the longer excerpts). The same mistake twice in a text: its longest excerpt.
  function mineFit(spots) {
    const one = new Map();
    spots.forEach((s) => { const c = one.get(s.m.key); if (!c || s.at[1] - s.at[0] > c.at[1] - c.at[0]) one.set(s.m.key, s); });
    const xs = [...one.values()].sort((a, b) => a.at[1] - b.at[1]);
    const best = [{ w: 0, set: [] }];
    xs.forEach((s, i) => {
      let j = i - 1;
      while (j >= 0 && xs[j].at[1] > s.at[0]) j--;
      const take = { w: best[j + 1].w + 1000 + (s.at[1] - s.at[0]), set: best[j + 1].set.concat(s) };
      best.push(take.w > best[i].w ? take : best[i]);
    });
    return best[xs.length].set;
  }
  // A corrected text with every real mistake Claude found in it put back, as you wrote it (as many as fit, see
  // mineFit). Each one needs at least two near-misses, so its choice is a real one; one without stays corrected
  // in the text and can come as a « Hors texte » card instead.
  const NEED = { new: 3, missed: 3, once: 1, fixed: 0 };
  function mineTextFor(src, byKey) {
    if (!prepDoc(src.ref) || !src.corrected) return null;
    const C = unbracket(src.corrected).replace(/[{}]/g, "");
    const spots = [];
    src.errs.forEach((e, n) => {
      const x = prepFor(src, n, e), m = byKey.get(norm(e.wrong));
      if (!x || x.kind !== "error" || !m || m.kind !== "error") return;
      const at = spanAt(C, unbracket(x.span).replace(/[{}]/g, ""));
      const wrong = str(x.wrong).replace(/[{}]/g, "").trim(), near = arr(x.near).filter((s) => str(s).trim());
      if (!at || !wrong || near.length < 2) return;
      spots.push({ at, m, span: C.slice(at[0], at[1]), wrong, near: near.slice(0, 3), why: str(x.why) || m.why });
    });
    const kept = mineFit(spots);
    if (!kept.length) return null;
    let text = "", pos = 0;
    kept.forEach((s, k) => { text += C.slice(pos, s.at[0]) + `{${k}}`; pos = s.at[1]; });
    text += C.slice(pos);
    return { id: src.ref, ref: src.ref, title: src.title, sujet: src.sujet, ee: src.ee, text, corrected: C, mistakes: kept.map((s) => [s.wrong, [s.span], s.m.cat, s.why, s.m.wrong, s.near]), need: kept.reduce((t, s) => t + NEED[s.m.state], 0) };
  }
  // The next text: your EE drafts first (production checks are a sentence or two, so they come when no EE draft
  // has anything left to practise), the one with the most mistakes not fixed yet, then the one done longest ago,
  // and never the text you've just done while there's another.
  function mineNextText(all) {
    const byKey = new Map((all || mineAll()).map((m) => [m.key, m]));
    const last = new Map();
    let lastRef = "", lastTs = -1;
    list("drills").forEach((d) => {
      if (d.topic !== "mine" || d.src !== "text" || !d.text) return;
      last.set(d.text, Math.max(last.get(d.text) || 0, d.ts || 0));
      if ((d.ts || 0) > lastTs) { lastTs = d.ts || 0; lastRef = d.text; }
    });
    const texts = mineSources().map((s) => mineTextFor(s, byKey)).filter(Boolean);
    const pool = texts.length > 1 ? texts.filter((t) => t.ref !== lastRef) : texts;
    const best = (xs) => xs.sort((a, b) => b.need - a.need || (last.get(a.ref) || 0) - (last.get(b.ref) || 0))[0];
    return best(pool.filter((t) => t.ee && t.need)) || best(pool.filter((t) => t.need)) || best(pool.slice()) || null;
  }
  // Mistakes that can't be in a text (an error-log entry, or one whose correction isn't in its corrected text),
  // asked on their own: up to 3 a round, the ones that need it most first. Without Claude, as on the local site,
  // mistakes nobody has prepared are asked this way too, as the correction or what you wrote.
  const inAText = (m) => m.uses.some((u) => u.kind === "error" && u.placed && u.near.length >= 2);
  const mineLoose = (all, n, placed) => all.filter((m) => !placed.has(m.key) && (m.kind === "error" ? !inAText(m) : m.kind === "pending" && !claudeOn())).sort(byNeed).slice(0, n);
  function mineCards(pr, loose) {
    const cards = pr ? pr.mistakes.map(([wrong, [right], cat, why, mk, near], k) => ({ k, mk, wrong, q: prSentence(pr, k), options: [right].concat(near), why, cat })) : [];
    loose.forEach((m) => cards.push({ k: -1, mk: m.wrong, wrong: (m.use && m.use.yours) || m.wrong, q: m.q || "___", options: mineOptions(m, 4), why: (m.use && m.use.why) || m.why, cat: m.cat }));
    return cards.map((c) => Object.assign(c, { order: shuffle(c.options.map((_, i) => i)) }));
  }
  // The cards on screen: one for each mistake you found, and the « Hors texte » ones.
  const mhShown = (h) => (h.found ? h.cards.map((_, ci) => ci).filter((ci) => h.cards[ci].k < 0 || h.found[h.cards[ci].k]) : []);
  let mhScroll = ""; // where to bring the page after the next redraw: the cards after Check, the next card after a pick
  function mhStart() {
    const all = mineAll(), pr = mineNextText(all);
    const loose = mineLoose(all.filter((m) => m.kind === "error" || m.kind === "pending"), 3, new Set(pr ? pr.mistakes.map((x) => norm(x[4])) : []));
    if (!pr && !loose.length) { toast(mineBacklog().length ? "Your texts aren't prepared yet." : "No mistakes to practise yet."); return; }
    if (ui.drill && ui.drill.topic === "mine") ui.drill = null;
    ui.mh = { pr, cards: mineCards(pr, loose), picks: [], found: pr ? null : [], extra: 0, pick: {}, saved: null, done: false, at: Date.now(), secs: 0, lastT: Date.now() };
    render(true);
    const el = document.getElementById("drill-area");
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function mhTap(i) {
    const h = ui.mh;
    if (!h || h.found) return;
    h.picks = h.picks.includes(i) ? h.picks.filter((x) => x !== i) : h.picks.concat(i);
    activeTick(h);
    render(true);
  }
  function mhCheck() {
    const h = ui.mh;
    if (!h || !h.pr || h.found) return;
    if (!h.picks.length) { toast("Tap the words you think are wrong first."); return; }
    const toks = prTokens(h.pr);
    activeTick(h);
    h.found = h.pr.mistakes.map((_, k) => h.picks.some((i) => toks[i] && toks[i].k === k));
    h.extra = h.picks.filter((i) => toks[i] && toks[i].k < 0).length;
    if (!mhShown(h).length) { mhFinish(); h.done = true; }
    mhScroll = "top";
    render(true);
  }
  function mhPick(ci, oi) {
    const h = ui.mh;
    if (!h || h.done || h.pick[ci] != null || !mhShown(h).includes(ci)) return;
    h.pick[ci] = oi;
    activeTick(h);
    // The text is saved as soon as the last card is answered, so leaving then loses nothing.
    if (mhShown(h).every((x) => h.pick[x] != null)) mhFinish();
    mhScroll = "next";
    render(true);
  }
  // Each mistake is caught when it's both found and fixed, as in Find the mistakes. The text is a finished
  // round of Your mistakes, with every mistake as a choice, so Retry today's misses can ask the ones missed.
  function mhFinish() {
    const h = ui.mh;
    if (!h || h.saved) return;
    const items = h.cards.map((c, ci) => {
      const found = c.k < 0 || !!h.found[c.k], p = h.pick[ci];
      return { kind: "choice", mk: c.mk, q: c.q, options: c.options, a: [c.options[0]], why: str(c.why), given: found && p != null ? c.options[p] : "", ok: found && p === 0, found, k: c.k, wrong: c.wrong, cat: c.cat || "" };
    });
    const id = uid();
    h.saved = id;
    activeTick(h);
    put("drills", id, { topic: "mine", set: "errors", name: `Your mistakes · ${h.pr ? h.pr.title : "Hors texte"}`, text: h.pr ? h.pr.ref : "", date: todayStr(), ts: Date.now(), score: items.filter((x) => x.ok).length, total: items.length, found: items.filter((x) => x.found).length, extra: h.extra, src: "text", secs: Math.round(h.secs || 0), items, picks: h.picks.slice(), ...(h.pr ? { para: { text: h.pr.text, wrong: h.pr.mistakes.map((x) => x[0]) } } : {}) });
    autoTick("grammar.mine.errors", { min: (h.secs || 0) / 60 });
  }
  // A finished text round as it was when you finished it, to look at again from the history: the text with your
  // marks and corrections, and the cards. A round keeps its text (`para`) since 2026-10-22; an older one is rebuilt
  // from the draft as it's prepared now, with the mistakes of the round that are still in it, the others coming
  // after it like « Hors texte » cards. Null when there's no text to show.
  function mineRebuild(d) {
    if (!d || d.topic !== "mine" || d.src !== "text" || !d.text) return null;
    const items = arr(d.items), src = mineSources().find((s) => s.ref === d.text);
    let pr, ks;
    if (d.para && d.para.text) {
      ks = items.map((it) => (Number.isInteger(it.k) ? it.k : -1));
      pr = { text: d.para.text, mistakes: arr(d.para.wrong).map((w, k) => { const it = items[ks.indexOf(k)] || {}; return [w, [arr(it.a)[0] || ""], it.cat, it.why, it.mk, []]; }) };
    } else {
      const cur = src && mineTextFor(src, new Map(mineAll().map((m) => [m.key, m])));
      if (!cur) return null;
      const kOf = new Map(cur.mistakes.map((m, k) => [norm(m[4]), k]));
      const was = items.map((it) => (kOf.has(norm(it.mk)) ? kOf.get(norm(it.mk)) : -1));
      const keep = [...new Set(was.filter((k) => k >= 0))].sort((a, b) => a - b);
      if (!keep.length) return null;
      // The mistakes the round didn't have go back to their corrected form, and the others are numbered again.
      const at = new Map(keep.map((k, j) => [k, j]));
      pr = { text: cur.text.replace(/\{(\d+)\}/g, (_, k) => (at.has(Number(k)) ? `{${at.get(Number(k))}}` : cur.mistakes[Number(k)][1][0])), mistakes: keep.map((k) => cur.mistakes[k]) };
      ks = was.map((k) => (k < 0 ? -1 : at.get(k)));
    }
    if (!pr.mistakes.length || pr.mistakes.some((m) => !m[1][0])) return null;
    Object.assign(pr, { id: d.text, ref: d.text, title: src ? src.title : str(d.name).replace(/^Your mistakes · /, ""), sujet: src ? src.sujet : "", corrected: pr.text.replace(/\{(\d+)\}/g, (_, k) => pr.mistakes[Number(k)][1][0]) });
    const cats = new Map(mineAll().map((m) => [m.key, m.cat]));
    const cards = items.map((it, ci) => ({ k: ks[ci], mk: it.mk, wrong: ks[ci] >= 0 ? pr.mistakes[ks[ci]][0] : it.wrong || it.mk, q: it.q, options: arr(it.options), why: it.why, cat: it.cat || cats.get(norm(it.mk)) || "", found: !!it.found, order: arr(it.options).map((_, i) => i) }));
    const pick = {};
    items.forEach((it, ci) => { const p = arr(it.options).indexOf(it.given); if (it.found && it.given && p >= 0) pick[ci] = p; });
    const found = pr.mistakes.map((_, k) => { const ci = ks.indexOf(k); return ci >= 0 && !!items[ci].found; });
    return { pr, cards, picks: arr(d.picks).slice(), found, extra: d.extra || 0, pick, saved: d.id, done: true, at: d.ts || 0, secs: d.secs || 0, lastT: Date.now(), review: { date: d.date, score: d.score, total: d.total } };
  }

  function drillsFor(topic, set) {
    return list("drills").filter((d) => d.topic === topic && (!set || d.set === set) && d.src !== "retry").sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }
  function bestPct(topic, set) { const xs = drillsFor(topic, set).filter((d) => d.total); return xs.length ? Math.max(...xs.map((d) => d.score / d.total)) : 0; }
  // Mastery is judged on what you still know a week later. A round right after another mostly shows what's
  // fresh in memory, so only the first round of the set each day counts, and it has to reach the target on
  // `need` days, the first and last at least a week apart.
  function coldMet(topic, set, p, need) {
    const firsts = new Map();
    drillsFor(topic, set).forEach((d) => { if (d.total && !firsts.has(d.date)) firsts.set(d.date, d); });
    const days = [...firsts.values()].filter((d) => d.score / d.total >= p - 1e-9).map((d) => d.date).sort();
    const n = days.length;
    return { ok: n >= need && daysBetween(days[0], days[n - 1]) >= 7, n, need, p, tried: firsts.size };
  }
  function coldNote(m) {
    if (!m.tried) return "No attempts yet";
    if (m.ok) return `Done: the day's first round at ${pct(m.p)} on ${m.need} days, a week apart`;
    if (m.n >= m.need) return `${m.n} days at ${pct(m.p)}, but less than a week apart: try again next week`;
    return `${m.n} of ${m.need} days so far: the day's first round at ${pct(m.p)}, a week apart`;
  }
  // The first try at each comprehension set, oldest first. A set logged from elsewhere counts on its own.
  function firstTries(xs) {
    const seen = new Set();
    return xs.slice().sort((p, q) => (p.ts || 0) - (q.ts || 0)).filter((c2) => { const k = c2.setId || c2.id; if (seen.has(k)) return false; seen.add(k); return true; });
  }
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
      const m = coldMet(tp.id, c.set, c.pct, c.days || 2);
      parts.push({ ok: m.ok, note: coldNote(m) });
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
      // Every topic of this phase and the earlier ones that you've drilled (Phase 1's four until you have), so
      // what you learned weeks ago keeps coming back. The topics missed most in the last two weeks come first,
      // then the ones practised longest ago, and the 15 questions are dealt among them in turn.
      // Difficulty follows the phase: B1 in Phase 1, B1 + B1+ in Phase 2, B1+ and B2 from Phase 3.
      const phase = settings().phase;
      const allowed = phase <= 1 ? ["B1"] : phase === 2 ? ["B1", "B1+"] : ["B1+", "B2"];
      const log = drillLog();
      const since = Date.now() - 14 * 864e5;
      const missed = new Map();
      for (const d of list("drills")) {
        if (d.set === "prod" || (d.ts || 0) < since) continue;
        arr(d.items).concat(retriesOf(d).flatMap((r) => arr(r.items))).forEach((it) => { if (!it.ok) { const k = it.topic || d.topic; missed.set(k, (missed.get(k) || 0) + 1); } });
      }
      const lastTs = (id) => { const ds = drillsFor(id); return ds.length ? ds[ds.length - 1].ts || 0 : 0; };
      let tps = T.TOPICS.filter((tp) => tp.phase <= phase && drillsFor(tp.id).some((d) => d.set !== "prod"));
      if (!tps.length) tps = ["pronominaux", "imperatif", "interrogative", "subjonctif"].map((id) => TOPIC[id]);
      tps.sort((p, q) => (missed.get(q.id) || 0) - (missed.get(p.id) || 0) || lastTs(p.id) - lastTs(q.id));
      const share = new Map();
      for (let k = 0; k < 15; k++) { const id = tps[k % tps.length].id; share.set(id, (share.get(id) || 0) + 1); }
      items = [];
      tps.forEach((tp) => {
        if (!share.get(tp.id)) return;
        let pool = tp.sets.filter((x) => allowed.includes(x.level));
        if (!pool.length) pool = [tp.sets.find((x) => x.id === tp.criterion.set) || tp.sets[0]];
        items.push(...pickRound(pool.flatMap((st) => setItems(tp.id, st)), share.get(tp.id), log));
      });
      items = shuffle(items);
      title = "Mixed review · " + allowed.join(" and ");
      setId = "main";
    } else if (topicId === "mine") {
      // Your mistakes are practised in your own text (mhStart); the drill engine plays their retries and the
      // style tips, as choices.
      const style = setId === "style";
      items = o.items || (style ? styleRound(10) : []);
      if (!items.length) { toast(style ? "No style tips to practise yet." : "Nothing to retry."); return; }
      title = style ? "Your mistakes · Conseils de style" : "Your mistakes";
      setId = style ? "style" : "errors";
      ui.mh = null;
    } else {
      const tp = TOPIC[topicId];
      set = tp.sets.find((x) => x.id === setId) || tp.sets[0];
      setId = set.id;
      title = set.title;
      if (o.items) items = o.items;
      else if (o.gen && ui.gen[tp.id + "." + set.id]) items = ui.gen[tp.id + "." + set.id].slice();
      else items = pickRound(setItems(tp.id, set), set.take, drillLog());
    }
    items = items.map((it) => Object.assign({}, it, it.kind === "choice" ? { order: shuffle(it.options.map((_, k) => k)) } : {}));
    ui.drill = { topic: topicId, set: setId, title, items, i: 0, results: [], given: "", checked: false, verdict: null, done: false, src: o.src || (o.gen ? "claude" : "bank"), saved: null, parent: o.parent || null, secs: 0, lastT: Date.now() };
    render(true);
    const el = document.getElementById("drill-area");
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  // An unfinished round is kept from its first checked answer, with its items (Claude's too), so it can be
  // picked up later. Retry rounds are short and belong to the round they came from, so they aren't kept.
  const drillIpId = (d) => (d.topic === "mixed" ? "drill--mixed" : `drill--${d.topic}--${d.set}`);
  function drillKeep() {
    const d = ui.drill;
    if (!d || d.done || d.src === "retry" || !d.results.some(Boolean)) return;
    const tp = TOPIC[d.topic];
    ipSave(drillIpId(d), { kind: "drill", title: tp ? `${tp.title} · ${d.title}` : d.title, route: "grammar." + d.topic, topic: d.topic, set: d.set, name: d.title, src: d.src, items: d.items, results: d.results, i: d.i, secs: Math.round(d.secs || 0) });
  }
  function drillResume(ip) {
    const items = arr(ip.items);
    const results = arr(ip.results).map((r) => r || undefined);
    const i = Math.max(0, Math.min(Number(ip.i) || 0, items.length - 1));
    const r = results[i];
    ui.drill = { topic: ip.topic, set: ip.set, title: ip.name || ip.title, items, i, results, given: r ? r.given : "", checked: !!r, verdict: r ? r.verdict : null, done: false, src: ip.src || "bank", saved: null, parent: null, secs: Number(ip.secs) || 0, lastT: Date.now() };
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
    activeTick(d);
    d.results[d.i] = { given, ok: d.verdict === "ok", verdict: d.verdict };
    drillKeep();
    render(true);
  }
  function drillPick(k) {
    const d = ui.drill;
    if (!d || d.checked || d.done) return;
    const it = d.items[d.i];
    d.given = it.options[k];
    d.verdict = k === 0 ? "ok" : "bad";
    d.checked = true;
    activeTick(d);
    d.results[d.i] = { given: d.given, ok: k === 0, verdict: d.verdict };
    drillKeep();
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
    drillKeep();
    render(true);
  }
  function drillFinish() {
    const d = ui.drill;
    d.done = true;
    const score = d.results.filter((r) => r && r.ok).length;
    // A retry goes on today's latest round of the set rather than into a record of its own, added to its list of
    // retries, with every question and answer, so it counts as asked and today's misses know what's left.
    if (d.src === "retry") {
      const cur = d.parent && S.drills.get(d.parent);
      if (cur) {
        const doc = clone(cur), rs = retriesOf(doc).slice();
        rs.push({ score, total: d.items.length, date: todayStr(), ts: Date.now(), secs: Math.round(d.secs || 0), items: roundItems(d) });
        doc.retries = rs;
        delete doc.retry;
        d.retryIdx = rs.length - 1;
        put("drills", d.parent, doc);
      }
      render(true);
      return;
    }
    const id = uid();
    d.saved = id;
    put("drills", id, { topic: d.topic, set: d.set, name: d.title, date: todayStr(), ts: Date.now(), score, total: d.items.length, src: d.src, secs: Math.round(d.secs || 0), items: roundItems(d) });
    ipDrop(drillIpId(d));
    // The style tips are a few quick questions, not the day's Your mistakes block.
    if (!(d.topic === "mine" && d.set === "style")) autoTick(`grammar.${d.topic}.${d.set}`, { min: (d.secs || 0) / 60 });
    render(true);
  }
  // Every question is kept with the answer given, so the round can be reviewed from the history.
  function roundItems(d) {
    return d.items.map((it, k) => {
      const r = d.results[k] || {};
      const o = { kind: it.kind, q: it.q, a: it.a, why: it.why || "", given: str(r.given), ok: !!r.ok };
      if (it.src) o.src = it.src;
      if (it.mk) o.mk = it.mk;
      if (it.ask) o.ask = it.ask;
      if (it.kind === "choice") o.options = it.options;
      if (it.topic && it.topic !== d.topic) o.topic = it.topic;
      return o;
    });
  }
  // From the results screen, or from a set's row on its page later in the day.
  function drillRetry(el) {
    const d = ui.drill;
    const topic = (el && el.dataset && el.dataset.topic) || (d && d.topic), set = (el && el.dataset && el.dataset.set) || (d && d.set);
    if (!topic || !set) return;
    const items = todayMisses(topic, set);
    if (!items.length) { toast("Nothing left to retry today."); render(true); return; }
    const rounds = todayRounds(topic, set);
    const parent = rounds.length ? rounds[rounds.length - 1].id : null;
    if (topic === "mixed") {
      ui.drill = { topic: "mixed", set: "main", title: "Mixed review", items: items.map((it) => Object.assign({}, it, it.kind === "choice" ? { order: shuffle(it.options.map((_, k) => k)) } : {})), i: 0, results: [], given: "", checked: false, verdict: null, done: false, src: "retry", saved: null, parent };
      render(true);
      return;
    }
    startDrill(topic, set, { items, src: "retry", parent });
  }
  async function drillDispute(k) {
    const d = ui.drill;
    const it = d.items[k];
    const r = d.results[k];
    if (!it || !r) return;
    const prompt = `A French grammar drill item.\nCue shown to the learner: ${it.src || "(none)"}\nSentence with the gap: ${it.q}\nExpected answer(s) for the gap: ${it.a.join(" | ")}\nLearner's answer: ${r.given}\n\nIs the learner's answer also fully correct, natural French for this gap, given the cue? Be strict about accents, agreement and mood. Reply with only JSON: {"correct": true or false, "explanation": "one or two sentences in ${replyLang()}"}`;
    const out = await ask("dispute-" + k, prompt, { tier: "quick" });
    if (!out) return;
    r.claude = { correct: !!out.correct, explanation: str(out.explanation) };
    if (out.correct && !r.ok) {
      r.ok = true;
      r.overturned = true;
      const score = d.results.filter((x) => x && x.ok).length;
      const rid = d.src === "retry" ? d.parent : d.saved;
      const cur = rid && S.drills.get(rid);
      if (cur) {
        const doc = clone(cur);
        if (d.src === "retry") {
          const rs = retriesOf(doc).slice(), at = d.retryIdx != null ? d.retryIdx : rs.length - 1, rt = rs[at];
          if (rt) {
            rt.score = score;
            if (Array.isArray(rt.items) && rt.items[k]) Object.assign(rt.items[k], { ok: true, overturned: true });
            doc.retries = rs;
            delete doc.retry;
          }
        } else {
          doc.score = score;
          if (Array.isArray(doc.items) && doc.items[k]) Object.assign(doc.items[k], { ok: true, overturned: true });
        }
        put("drills", rid, doc);
      }
    }
    render(true);
  }
  async function drillGenerate(topicId, setId) {
    const tp = TOPIC[topicId];
    const set = tp.sets.find((s) => s.id === setId) || tp.sets[0];
    const ex = set.items[0];
    // A choice set either gaps every question or asks about whole sentences, with no ___ anywhere.
    const gapless = set.kind === "choice" && set.items.every((x) => !String(x[0]).includes("___"));
    const fmt = set.kind === "choice"
      ? `Each item: {"q": "${gapless ? "the question, with no ___ gap" : "French sentence with ___ for the gap"}", "options": ["the correct option", "distractor", "distractor"], "why": "short English explanation"}. The FIRST option must be the correct one.`
      : `Each item: {"src": "optional cue or source sentence shown above the question (can be empty)", "q": "French sentence with exactly one ___ gap, with the infinitive or cue in parentheses when needed", "a": ["every acceptable answer for the gap, exactly as it should be typed"], "why": "short English explanation"}.`;
    const example = set.kind === "choice" ? JSON.stringify({ q: ex[0], options: ex[1], why: ex[2] }) : JSON.stringify({ src: ex[0], q: ex[1], a: ex[2], why: ex[3] });
    const avoid = shuffle(set.items).slice(0, 12).map((x) => (set.kind === "choice" ? x[0] : x[1] === "___" ? x[0] : x[1])).join(" / ");
    const lvl = set.level || "B1";
    const levelNote = lvl === "B2"
      ? "Target level B2: longer sentences with subordinate clauses, compound tenses and TCF-register vocabulary (work, housing, immigration, environment, public debate). Include the traps a B2 grader looks for."
      : lvl === "B1+" ? "Target level B1+: everyday sentences, each with one genuinely tricky point." : "Target level B1: short, clear sentences that isolate the structure, but not trivial.";
    const prompt = `Write ${set.take} NEW practice items for a French grammar drill.\nTopic: ${tp.title} (${tp.en}). What to master: ${tp.master}\nDrill: ${set.title}.\n${levelNote}\n${profile("English")}\nRules: use TCF Canada-style contexts (work, housing, immigration paperwork, transit, environment, daily life in Canada). Vary persons and verbs. Every item must have one clearly correct answer; list every acceptable variant. Don't reuse these sentences: ${avoid}.\n${fmt}\n${set.ask ? `The learner sees this instruction above every item, so each item must fit it: "${set.ask}"\n` : ""}${set.hint ? "Item format note: " + set.hint + "\n" : ""}Example item: ${example}\nReply with only JSON: {"items": [ ... ]}`;
    const out = await ask("gen-" + topicId + "." + setId, prompt);
    if (!out) return;
    const items = arr(out.items).map((x) => {
      if (!x || typeof x.q !== "string") return null;
      if (set.kind === "choice") return Array.isArray(x.options) && x.options.length >= 2 ? { kind: "choice", topic: topicId, ask: set.ask, q: x.q, options: x.options.map(str), a: [str(x.options[0])], why: str(x.why) } : null;
      return x.q.includes("___") && Array.isArray(x.a) && x.a.length ? { kind: "type", topic: topicId, ask: set.ask, src: str(x.src), q: x.q, a: x.a.map(str), why: str(x.why) } : null;
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
    const prompt = `You are a French teacher checking a B1→B2 learner's production exercise.\nExercise: ${tp.prod.prompt}\nPass criterion: ${tp.prod.check}.\n${profile()}\nLearner's answer:\n"""\n${text}\n"""\nReply with only JSON: {"pass": true or false, "comment": "2–3 sentences in ${replyLang()} on whether the criterion is met and why", "errors": [{"wrong": "exact excerpt", "right": "correction", "why": "short ${replyLang()} explanation"}], "improved": "a corrected, improved version in French"}`;
    const out = await ask("prod-" + topicId, prompt);
    if (!out) return;
    const fb = { pass: !!out.pass, comment: str(out.comment), errors: arr(out.errors).filter((e) => e && e.wrong).slice(0, 15).map((e) => ({ wrong: str(e.wrong), right: str(e.right), why: str(e.why) })), improved: str(out.improved) };
    ui.prod[topicId] = { text, fb };
    const pid = uid();
    put("drills", pid, { topic: topicId, set: "prod", date: todayStr(), ts: Date.now(), score: fb.pass ? 1 : 0, total: 1, src: "claude", text, fb });
    ipDrop("prod--" + topicId);
    minePrepSoon("p-" + pid);
    if (fb.pass) autoTick(`grammar.${topicId}`);
    render(true);
  }
  // The production answer is kept as you type, until Claude checks it.
  function prodKeep(topicId) {
    const text = str((ui.prod[topicId] || {}).text);
    if (!text.trim()) { ipDrop("prod--" + topicId); return; }
    const tp = TOPIC[topicId];
    ipSave("prod--" + topicId, { kind: "prod", title: `${tp.title} · ${tp.prod.title}`, route: "grammar." + topicId, topic: topicId, text }, 1500);
  }

  /* =============== vocabulary =============== */
  const IV = [1, 2, 4, 7, 14, 30];
  const DECK = new Map();
  T.VOCAB.forEach((th) => th.cards.forEach((c) => {
    const base = th.id + "--" + slug(c[0]);
    let id = base, k = 2;
    while (DECK.has(id)) id = base + "-" + k++;
    DECK.set(id, Object.assign({ id, fr: c[0], en: c[1], ex: c[2] || "", theme: th.id }, c[3] ? { frNote: c[3] } : {}));
  }));
  function allCards() {
    const m = new Map(DECK);
    for (const [id, c] of S.cards) if (c && c.fr) m.set(id, Object.assign({ id }, c));
    return m;
  }
  const themeCards = (th, cards) => [...(cards || allCards()).values()].filter((c) => c.theme === th);
  // A card you haven't started yet. One saved without a meaning waits under À chercher instead.
  const isNew = (c) => !S.srs.has(c.id) && !!str(c.en).trim();
  function dueIds(cards) {
    const t = todayStr();
    const m = cards || allCards();
    return [...S.srs.entries()].filter(([id, st]) => m.has(id) && st && st.due && st.due <= t).map(([id]) => id);
  }
  // The review schedule is FSRS, the scheduler Anki offers (ts-fsrs 5.4.2, FSRS-6, in ts-fsrs.js; the user asked for
  // it on 2026-10-15). Each card has a memory state: its stability (s, the days until your chance of recalling it
  // falls to 90%) and its difficulty (d, 1 to 10). Each review is graded Again, Hard, Good or Easy; FSRS works out
  // the new state and brings the card back when its chance of recall falls to 90% (Anki's default), never more than
  // 30 days away (the cap suits a test a few months away). Only English → French moves the schedule.
  // Days are whole: FSRS's short-term steps are off, since the session's own checks stand in for them, and a day is
  // that date at noon UTC, as ts-fsrs counts elapsed days by UTC calendar day.
  const SRS = { retention: 0.9, cap: 30, logMax: 100 };
  const G = { again: 1, hard: 2, good: 3, easy: 4 };
  const FS = window.FSRS;
  const FSR = FS && FS.fsrs({ request_retention: SRS.retention, maximum_interval: SRS.cap, enable_fuzz: true, enable_short_term: false });
  const dayDate = (s) => new Date(s + "T12:00:00Z");
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  // A gap as FSRS sets it, back under the cap: ts-fsrs spaces Hard, Good and Easy at least a day apart, which can
  // take them a day or two past it.
  const capped = (n) => Math.max(1, Math.min(SRS.cap, Math.round(n) || 1));
  // The stage a gap belongs to: 1 day, 2, 3–6, 7–13, 14–20, then 21 or more (mastered, Anki's "mature").
  const stageOf = (ivl) => (ivl >= 21 ? 5 : ivl >= 14 ? 4 : ivl >= 7 ? 3 : ivl >= 3 ? 2 : ivl >= 2 ? 1 : 0);
  // The gap of a schedule from before FSRS: its ivl, or from its stage on the old ladder of 1, 2, 4, 7, 14 and 30 days.
  function srsOf(st) {
    const s = Object.assign({ stage: 0, lapses: 0, reps: 0 }, st);
    if (!(s.ivl > 0)) s.ivl = s.pri ? 1 : IV[Math.max(0, Math.min(IV.length - 1, s.stage || 0))];
    s.ivl = Math.min(SRS.cap, s.ivl);
    return s;
  }
  // The ts-fsrs card for a saved schedule (a new object: saved progress is frozen on claude.ai). One saved before
  // FSRS (no st) starts from its gap as its stability, the gap at which recall is 90%, and from its misses: FSRS's
  // difficulty after a Good, raised by its rule for Again once per miss. Its SM-2 ease isn't used: it was a day old
  // when FSRS came, and mostly came from the misses anyway.
  function srsCard(doc, now) {
    if (!doc || doc.st === FS.State.New) return FS.createEmptyCard(now);
    if (doc.st != null) return { due: dayDate(doc.due), stability: doc.s, difficulty: doc.d, elapsed_days: 0, scheduled_days: doc.ivl || 0, learning_steps: 0, reps: doc.reps || 0, lapses: doc.lapses || 0, state: doc.st, last_review: dayDate(doc.last || doc.due) };
    const o = srsOf(doc);
    let d = FSR.init_difficulty(G.good);
    for (let k = 0; k < Math.min(o.lapses || 0, 10); k++) d = FSR.next_difficulty(d, G.again);
    const last = o.last || (o.due ? addDays(o.due, -o.ivl) : o.learned) || todayStr();
    return { due: dayDate(o.due || last), stability: o.ivl, difficulty: d, elapsed_days: 0, scheduled_days: o.ivl, learning_steps: 0, reps: Math.max(1, o.reps || 0), lapses: o.lapses || 0, state: FS.State.Review, last_review: dayDate(last) };
  }
  // The schedule to save after a grade: FSRS's new card as the site keeps it, with the grade added to the card's
  // history (log, its last 100 grades, so FSRS could one day be tuned to you). A copy; the SM-2 fields go.
  function srsDoc(prev, c, g, t, log) {
    const ivl = capped(c.scheduled_days);
    const doc = Object.assign({}, prev, { due: addDays(t, ivl), ivl, s: r4(c.stability), d: r4(c.difficulty), st: c.state, reps: c.reps, lapses: c.lapses, last: t, learned: (prev && prev.learned) || t, pri: g === G.again, stage: g === G.again ? 0 : stageOf(ivl), log: log.slice(-SRS.logMax) });
    delete doc.ease;
    delete doc.pStreak;
    return doc;
  }
  const srsMissing = () => { if (!FSR) toast("The card scheduler didn't load. Reload the page to try again."); return !FSR; };
  // One review of a card, graded 1–4. A card shown again in the same session doesn't come here.
  function srsGrade(id, g) {
    if (srsMissing()) return;
    const t = todayStr(), now = dayDate(t), prev = S.srs.get(id);
    const { card } = FSR.next(srsCard(prev, now), now, g);
    put("srs", id, srsDoc(prev, card, g, t, arr(prev && prev.log).concat([[t, g]])));
  }
  // A new card's first rating, from an empty card: Good when it's shown, so ending a session early loses nothing
  // (not in its history, since you haven't recalled it yet), then the grade of its first check.
  function srsStart(id, g, shown) {
    if (srsMissing()) return;
    const t = todayStr(), now = dayDate(t);
    const { card } = FSR.next(FS.createEmptyCard(now), now, g);
    put("srs", id, srsDoc({ learned: t }, card, g, t, shown ? [] : [[t, g]]));
  }
  // A card saved from a page joins the reviews tomorrow, still new: its first review is its first rating.
  function srsLearn(id) {
    const t = todayStr();
    put("srs", id, { st: 0, due: addDays(t, 1), ivl: 1, stage: 0, reps: 0, lapses: 0, learned: t, pri: false });
  }
  // The gap each grade would give a card today, for its buttons: a review's, or a new card's first check's.
  function srsPreview(id, fresh) {
    if (!FSR) return null;
    const now = dayDate(todayStr());
    const p = FSR.repeat(fresh ? FS.createEmptyCard(now) : srsCard(S.srs.get(id), now), now);
    return [G.again, G.hard, G.good, G.easy].map((g) => capped(p[g].card.scheduled_days));
  }
  // Your chance of recalling a card today, as FSRS reckons it, for a card it has scheduled.
  function srsRecall(st) {
    if (!FSR || !st || st.st == null || st.st === FS.State.New || !(st.s > 0)) return null;
    const now = dayDate(todayStr());
    return FSR.get_retrievability(srsCard(st, now), now, false);
  }
  // French → English practice only keeps the day a card was last practised (rec), so the next practice starts
  // with the cards practised longest ago. Its schedule stays as it was.
  function srsPractised(id, t) {
    const st = S.srs.get(id);
    if (st && st.rec !== t) put("srs", id, Object.assign({}, st, { rec: t }));
  }

  // A session is a queue of steps, each { id, k }:
  // - show: a new card, with its answer. Got it, next → checked a few cards later (learn 1), then further on
  //   (learn 2), then it leaves the session, as Anki's learning steps do. I already know this → one check further on
  //   (known). Either way the card's first check is its first rating, which FSRS schedules from (Easy on learn 1
  //   also ends its checks).
  // - learn, known: recall a new card, graded 1–4. Again starts its checks again (learn 1, a few cards later).
  // - rev: a review, which moves the schedule. Again comes back a few cards later (re) until it's passed; those
  //   repeats don't move the schedule again.
  // - prac: French → English practice, which never moves the schedule. Again comes back the same way.
  const VOCAB_V = 2; // the session's shape: one saved in the tab before it changed is dropped
  const GAP = { soon: 3, again: 4, later: 6 };
  const PRACTICE_N = 20;
  // Puts a step back in the queue, gap steps after the current one (or at the end).
  const vocabAgain = (v, e, gap) => v.queue.splice(Math.min(v.i + 1 + gap, v.queue.length), 0, e);
  // Your learned cards, the ones practised French → English longest ago (or never) first, and of those the ones
  // reviewed longest ago, so the cards you saw today come last.
  function practiceIds(cards) {
    return [...S.srs.entries()].filter(([id, st]) => st && cards.has(id) && str(cards.get(id).en).trim())
      .sort((a, b) => str(a[1].rec).localeCompare(str(b[1].rec)) || str(a[1].last).localeCompare(str(b[1].last)))
      .map(([id]) => id);
  }
  function vocabStart(mode) {
    const cards = allCards();
    let ids;
    if (mode === "review") {
      ids = shuffle(dueIds(cards));
      const pri = ids.filter((id) => S.srs.get(id).pri);
      ids = pri.concat(ids.filter((id) => !S.srs.get(id).pri)).slice(0, 100);
      if (!ids.length) { toast("Nothing is due today."); return; }
    } else if (mode === "practice") {
      ids = shuffle(practiceIds(cards).slice(0, PRACTICE_N));
      if (!ids.length) { toast("Learn some cards first."); return; }
    } else {
      mode = "new";
      const th = ui.vTheme || defaultTheme();
      ids = themeCards(th, cards).filter(isNew).slice(0, ui.vCount).map((c) => c.id);
      if (!ids.length) { toast("No new cards left in this theme. Build more with Claude, or pick another theme."); return; }
    }
    const k = mode === "new" ? "show" : mode === "practice" ? "prac" : "rev";
    ui.vocab = { v: VOCAB_V, mode, queue: ids.map((id) => ({ id, k })), i: 0, total: ids.length, shown: k === "show", ok: 0, miss: 0, known: 0, first: {}, finished: false, edit: false, secs: 0, lastT: Date.now() };
    lastGrade = 0;
    render(true);
    window.scrollTo(0, 0);
  }
  function vocabAdvance() {
    const v = ui.vocab;
    v.i++;
    const e = v.queue[v.i];
    v.shown = !!e && e.k === "show";
    if (!e) {
      v.finished = true;
      vocabPace(v);
      if (v.mode !== "practice") autoTick(v.mode === "review" ? "vocab.review" : "vocab.new", { min: (v.secs || 0) / 60 });
    }
    render(true);
  }
  // A new card shown with its answer: Got it, next (two checks) or I already know this (one).
  function vocabLearn(path) {
    const v = ui.vocab;
    if (!v || v.finished) return;
    const e = v.queue[v.i];
    if (!e || e.k !== "show") return;
    activeTick(v, 90);
    srsStart(e.id, G.good, true);
    if (path === "known") vocabAgain(v, { id: e.id, k: "known" }, GAP.later);
    else vocabAgain(v, { id: e.id, k: "learn", n: 1 }, GAP.soon);
    vocabAdvance();
  }
  // A recall, graded 1–4 (Again, Hard, Good, Easy). A new card's first check is its first rating and a review moves
  // its schedule; a repeat or practice only decides whether the card comes back in the session (Again) or is done.
  function vocabGrade(g) {
    const v = ui.vocab;
    if (!v || v.finished || !(g >= G.again && g <= G.easy)) return;
    const e = v.queue[v.i];
    if (!e || e.k === "show" || !v.shown) return;
    activeTick(v, 90);
    const pass = g !== G.again;
    if (e.k === "learn" || e.k === "known") {
      // Each card's first check is its score for the session, and its first rating.
      if (!(e.id in v.first)) {
        v.first[e.id] = pass ? 1 : 0;
        if (pass) v.ok++; else v.miss++;
        if (pass && e.k === "known") v.known++;
        srsStart(e.id, g, false);
      }
      if (!pass) vocabAgain(v, { id: e.id, k: "learn", n: 1 }, GAP.soon);
      else if (e.k === "learn" && e.n === 1 && g !== G.easy) vocabAgain(v, { id: e.id, k: "learn", n: 2 }, GAP.later);
    } else if (e.k === "rev" || e.k === "prac") {
      if (e.k === "rev") srsGrade(e.id, g); else srsPractised(e.id, todayStr());
      if (pass) v.ok++; else { v.miss++; vocabAgain(v, { id: e.id, k: "re" }, GAP.again); }
    } else if (!pass) vocabAgain(v, { id: e.id, k: "re" }, GAP.again);
    vocabAdvance();
  }
  // The last grade given in a card session, so a milestone leaf passed on an Again stays silent.
  let lastGrade = 0;
  // A grade's feedback: a soft tone, and motion.js's light halo from the button (told before the next card is drawn).
  function gradeFx(g) {
    tone(g !== G.again ? "pass" : "again");
    lastGrade = g;
    const btn = document.querySelector(`.grade4 [data-g="${g}"]`), card = document.querySelector("section.flash");
    if (btn) document.dispatchEvent(new CustomEvent("tcf:grade", { detail: { g, btn, card } }));
  }
  // The site's sounds, made on the spot with Web Audio (no files): for a grade, a light two-note chime for Hard, Good
  // or Easy and a soft low bump for Again; a third, higher note when a card session passes a milestone leaf
  // ("leaf"); a soft rubber-stamp thud when a stamp lands ("thunk"). For the clock: a stopwatch click and two rising
  // notes when it starts or resumes ("start"), two falling ones when it's paused ("pause"), a click and a low note
  // when it's reset or the task is finished ("stop"), two gentle desk-bell strikes at 0:00 ("bell"), a quiet
  // tick-tock once a second in overtime ("tick", "tock") and one low strike when the overtime ends ("low"); the beep that
  // starts each listening exam question ("beep"). Browsers only let a page start sound
  // from a click or a key, so the first one on the page wakes the audio up, and later sounds (a stamp, the clock)
  // can then play by themselves. The sound button in a card session's header or by a clock (or M in a session)
  // turns them all off on this device (tcf-sound, like the theme).
  // One audio context can go quiet for good and still say "running": after the computer sleeps, or when the speakers
  // or headphones change, it may keep playing to a device that's gone. So a click or key after a few quiet minutes, or
  // after the devices changed, starts a new one (closing the old), and one that's "suspended" (before the first click)
  // or "interrupted" (Safari, after a call, another app's sound or a tab in the background) is woken up.
  let AC = null, acUsed = 0;
  const AC_FRESH = 3 * 60 * 1000;
  const soundOn = () => lsGet("tcf-sound", "on") !== "off";
  function audioCtx(gesture) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const now = Date.now();
      if (AC && (AC.state === "closed" || (gesture && now - acUsed > AC_FRESH))) {
        if (AC.state !== "closed") { try { const p = AC.close(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
        AC = null;
      }
      if (!AC) AC = new Ctx();
      if (AC.state !== "running") { const p = AC.resume(); if (p && p.catch) p.catch(() => {}); }
      acUsed = now;
      return AC;
    } catch (_) { return null; }
  }
  const audioPrime = () => { if (!soundOn()) return; toneUnlock(); if (AC || Object.keys(toneClip).length < Object.keys(TONE_LEN).length) audioCtx(true); };
  // Touch screens only allow sound from the end of a tap, so the lift wakes it too.
  ["pointerdown", "pointerup", "touchend", "keydown"].forEach((ev) => document.addEventListener(ev, audioPrime, { capture: true, passive: true }));
  try { navigator.mediaDevices.addEventListener("devicechange", () => { acUsed = 0; }); } catch (_) {}
  // Each sound's recipe, drawn on an audio context from time t0.
  function toneRecipe(ac, kind, t0) {
    const note = (f, at, dur, peak, type, to) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, at);
      if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
      gn.gain.setValueAtTime(0.0001, at);
      gn.gain.exponentialRampToValueAtTime(peak, at + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(gn);
      gn.connect(ac.destination);
      o.start(at);
      o.stop(at + dur + 0.02);
    };
    // A bell: the strike and a quieter, higher partial, both ringing on.
    const strike = (f, at, dur, peak) => { note(f, at, dur, peak); note(f * 2.76, at, dur * 0.45, peak * 0.28); };
    // A stopwatch's click: a few milliseconds of filtered noise.
    const click = (at, peak, hz) => {
      const n = Math.floor(ac.sampleRate * 0.012), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), gn = ac.createGain();
      src.buffer = buf;
      bp.type = "bandpass";
      bp.frequency.value = hz || 3200;
      bp.Q.value = 1.2;
      gn.gain.value = peak;
      src.connect(bp);
      bp.connect(gn);
      gn.connect(ac.destination);
      src.start(at);
    };
    if (kind === "pass") { note(880, t0, 0.2, 0.1); note(1318.5, t0 + 0.07, 0.26, 0.07); }
    else if (kind === "again") note(240, t0, 0.2, 0.11, "triangle", 170);
    else if (kind === "leaf") note(1760, t0 + 0.14, 0.34, 0.06);
    else if (kind === "thunk") {
      // A low thud, with a brush of paper as the stamp meets the page.
      note(150, t0, 0.22, 0.15, "triangle", 62);
      const n = Math.floor(ac.sampleRate * 0.06), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const src = ac.createBufferSource(), lp = ac.createBiquadFilter(), gn = ac.createGain();
      src.buffer = buf;
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      gn.gain.value = 0.12;
      src.connect(lp);
      lp.connect(gn);
      gn.connect(ac.destination);
      src.start(t0);
    } else if (kind === "bell") { strike(1046.5, t0, 1.3, 0.085); strike(1046.5, t0 + 0.42, 1.6, 0.075); }
    else if (kind === "low") strike(523.25, t0, 1.4, 0.08);
    else if (kind === "start") { click(t0, 0.3); note(659.25, t0 + 0.03, 0.14, 0.07); note(987.77, t0 + 0.11, 0.2, 0.065); }
    else if (kind === "pause") { click(t0, 0.25); note(880, t0 + 0.03, 0.14, 0.06); note(587.33, t0 + 0.11, 0.22, 0.055); }
    else if (kind === "stop") { click(t0, 0.28); click(t0 + 0.07, 0.22); note(392, t0 + 0.1, 0.32, 0.07, "triangle"); }
    else if (kind === "tick") { click(t0, 0.2, 3600); note(2093, t0, 0.03, 0.012); }
    else if (kind === "tock") { click(t0, 0.17, 2400); note(1568, t0, 0.03, 0.01); }
    else if (kind === "beep") note(1000, t0, 0.22, 0.07);
  }
  // Each sound is also rendered once into a short clip (an offline context, which needs no click) and played by a
  // plain audio player, as the recordings are: on claude.ai the page's live Web Audio can stay silent while its
  // players are heard. A few players are woken by the first click or key, like the exam's, so a stamp or a clock
  // can sound later by itself; the live context is the fallback until the clips are ready.
  const SILENT = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
  const TONE_LEN = { pass: 0.36, again: 0.24, leaf: 0.5, thunk: 0.27, bell: 2.05, low: 1.43, start: 0.34, pause: 0.36, stop: 0.45, tick: 0.05, tock: 0.05, beep: 0.25 };
  const toneClip = {};
  // A clip as a WAV file in a data: address (16-bit mono), which the page may play.
  function wavURI(d, sr) {
    const n = d.length, v = new DataView(new ArrayBuffer(44 + n * 2));
    const tag = (o, t) => { for (let i = 0; i < 4; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    tag(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); tag(8, "WAVE"); tag(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); tag(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    const u = new Uint8Array(v.buffer);
    let bin = "";
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return "data:audio/wav;base64," + btoa(bin);
  }
  function toneRender() {
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Off) return;
    const sr = 22050;
    Object.keys(TONE_LEN).forEach((kind) => {
      try {
        const oac = new Off(1, Math.ceil(sr * (TONE_LEN[kind] + 0.03)), sr);
        const done = (buf) => { if (buf && !toneClip[kind]) toneClip[kind] = wavURI(buf.getChannelData(0), sr); };
        oac.oncomplete = (e) => done(e.renderedBuffer);
        toneRecipe(oac, kind, 0.005);
        const p = oac.startRendering();
        if (p && p.then) p.then(done, () => {});
      } catch (_) {}
    });
  }
  toneRender();
  // Each player is woken once (`ok`): Safari on iPhone allows a player only after it has played inside a tap. A play
  // carries a token (`tok`), so the end of one that a newer sound replaced changes nothing.
  const tonePool = [];
  let toneNext = 0;
  function tonePlayOn(a, src, failed) {
    const t = (a.tok = (a.tok || 0) + 1);
    const end = (ok) => { if (a.tok !== t) return false; a.busy = false; if (ok) a.ok = true; return true; };
    a.busy = true;
    try {
      a.src = src;
      const p = a.play();
      if (p && p.then) p.then(() => end(true), () => { if (end(false) && failed) failed(); });
      else end(true);
    } catch (_) { if (end(false) && failed) failed(); }
  }
  function toneUnlock() {
    try {
      while (tonePool.length < 3) tonePool.push(new Audio());
      tonePool.forEach((a) => { if (!a.ok && !a.busy) tonePlayOn(a, SILENT); });
    } catch (_) {}
  }
  function liveTone(kind) {
    const ac = audioCtx();
    if (!ac) return;
    try { toneRecipe(ac, kind, ac.currentTime + 0.01); } catch (_) {}
  }
  function tone(kind, delay) {
    if (!soundOn()) return;
    if (delay) { setTimeout(() => tone(kind), delay * 1000); return; }
    const uri = toneClip[kind];
    if (!uri || !tonePool.length) { liveTone(kind); return; }
    // A free player first, so one sound doesn't cut another short.
    const ok = tonePool.filter((x) => x.ok), free = ok.filter((x) => x.paused || x.ended);
    const list = free.length ? free : ok.length ? ok : tonePool;
    tonePlayOn(list[toneNext++ % list.length], uri, () => liveTone(kind));
  }
  function soundToggle() {
    const on = !soundOn();
    lsSet("tcf-sound", on ? "on" : "off");
    if (on) tone("pass");
    render(true);
  }
  // Your seconds a card, its checks or repeats included, kept for the last 5 sessions of each kind, so the plan's
  // minutes follow your own pace. Practice isn't in the plan, so it isn't kept.
  function vocabPace(v) {
    const n = v.total || 0;
    if (!n || !(v.secs > 0) || v.mode === "practice") return;
    const k = v.mode === "new" ? "nc" : "rc", p = Object.assign({}, settings().pace || {});
    p[k] = arr(p[k]).concat(Math.round((v.secs / n) * 10) / 10).slice(-5);
    saveSettings({ pace: p });
  }
  function defaultTheme() {
    const s = settings();
    const cards = allCards();
    const order = T.PHASES[s.phase - 1].vocab.concat(T.VOCAB.map((t) => t.id));
    return order.find((th) => THEME[th] && themeCards(th, cards).some(isNew)) || order[0] || T.VOCAB[0].id;
  }
  async function vocabBuild(theme) {
    const th = THEME[theme];
    if (!th) return;
    const have = themeCards(theme).map((c) => c.fr);
    const prompt = `Create 20 French vocabulary flashcards for the TCF Canada theme "${th.label}" (${th.en}) for a B1→B2 learner.\n${th.brief || `Prioritize collocations and verb + preposition pairs over isolated nouns. Include 2–3 connectors or linking phrases useful for arguing about this topic, 1–2 idiomatic expressions, and 2 B1→B2 "sophistication swaps" (for those, the English side reads "B2 upgrade of: <the plain B1 phrase in French>").`}\nDon't repeat any of: ${have.join("; ")}.\nEach card: {"fr": "French, with the article or preposition when useful", "en": "short English meaning",${th.brief ? ` "note": "Literally “its word-for-word meaning”. when it's figurative, else empty",` : ""} "ex": "two natural French example sentences that show the word in real use (a TCF Canada situation: settling in Canada, work, housing, health, the environment, public life), each followed by \" — \" and its English, on two lines separated by \\n, max 20 words each"}.\nReply with only JSON: {"cards": [ ... ]}`;
    const out = await ask("build-" + theme, prompt);
    if (!out) return;
    const seen = new Set([...allCards().values()].map((c) => norm(c.fr)));
    let n = 0;
    for (const c of arr(out.cards).slice(0, 30)) {
      if (!c || !c.fr || !c.en || seen.has(norm(c.fr))) continue;
      seen.add(norm(c.fr));
      put("cards", "c-" + uid(), Object.assign({ fr: str(c.fr), en: str(c.en), ex: str(c.ex), theme, created: todayStr(), by: "claude" }, str(c.note).trim() ? { frNote: str(c.note).trim() } : {}));
      n++;
    }
    toast(n ? `Added ${n} cards to ${th.label}.` : "No new cards came back. Try again.");
  }
  // Deleting one of your own cards also drops its review progress. Built-in and Anki cards can't be deleted.
  function cardDelete(id) {
    if (DECK.has(id) || !S.cards.has(id)) return;
    remove("cards", id);
    if (S.srs.has(id)) remove("srs", id);
    ui.confirm = "";
    toast("Card deleted.");
  }

  /* =============== saving words from any page =============== */
  // Select a word or phrase on any page (a reading document, a transcript, a correction…) and a "Save to
  // cards" button appears under it. The card keeps the sentence it came from as its example, the words as you
  // saw them (seen) and where they were (src). It goes to Mon carnet, Mes cartes Anki or any theme. With a
  // meaning it joins your reviews from tomorrow; without one it waits under "À chercher" on Vocabulaire.
  const GRAB_WORDS = 12; // the longest selection the button offers to save
  const grabBtn = document.getElementById("grab-btn");
  const grabEl = document.getElementById("grab");
  const GRAB_PAGES = { today: "Aujourd'hui", grammar: "Grammaire", vocab: "Vocabulaire", writing: "Écrit", comp: "Compréhension", progress: "Progrès" };
  let grabSel = null; // what the button would save, read from the selection when the button appeared
  let grabT = 0, grabHold = 0, grabHtml = "";
  // The words selected, without the spaces, quotes and punctuation around them.
  const grabClean = (s) => str(s).replace(/\s+/g, " ").replace(/^[\s.,;:!?…«»“”"'’()[\]–—-]+|[\s.,;:!?…«»“”"'’()[\]–—-]+$/g, "");
  // The text of part of a page without the speaker names, and with a space where one block ends and the next begins.
  function textOf(frag) {
    frag.querySelectorAll(".who").forEach((x) => x.remove());
    frag.querySelectorAll("p, li, div, br, td, th, h1, h2, h3, h4, dd, dt").forEach((x) => x.after(" "));
    return frag.textContent;
  }
  // The sentence a selection sits in, within its paragraph. A very long one is cut to the words around it.
  function grabSentence(r) {
    const start = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    const block = start && start.closest("p, li, td, th, dd, dt, blockquote, figcaption, h1, h2, h3, h4, label, summary");
    if (!block || !viewEl.contains(block) || !block.contains(r.endContainer)) return "";
    const pre = document.createRange();
    pre.setStart(block, 0);
    pre.setEnd(r.startContainer, r.startOffset);
    const text = textOf(block.cloneNode(true));
    const a = textOf(pre.cloneContents()).length, b = a + textOf(r.cloneContents()).length;
    // A sentence ends at . ! ? or … (and any closing quote) before a space, or at a line break.
    let s = 0, e = text.length;
    const re = /[.!?…]+(?:\s?[»”"’)\]])*(?=\s|$)|\n/g;
    for (let m; (m = re.exec(text));) {
      const x = m.index + m[0].length;
      if (x <= a) s = x;
      else if (x >= b) { e = x; break; }
    }
    let before = text.slice(s, a), after = text.slice(b, e);
    if (countWords(text.slice(s, e)) > 40) {
      const wb = before.trim().split(/\s+/), wa = after.trim().split(/\s+/);
      if (wb.length > 15) before = "… " + wb.slice(-15).join(" ") + (/\s$/.test(before) ? " " : "");
      if (wa.length > 15) after = (/^\s/.test(after) ? " " : "") + wa.slice(0, 15).join(" ") + " …";
    }
    return (before + text.slice(a, b) + after).replace(/\s+/g, " ").trim();
  }
  // Where a selection was made: the page, then the title of the document it's in.
  function grabSource(host) {
    const v = route.view;
    let page = GRAB_PAGES[v] || "";
    if (v === "comp") {
      const set = ui.c.set[ui.c.skill];
      if (route.args[1] === "exam") page = (ui.cx ? ui.cx.exam.title : "Examen blanc") + (ui.c.skill === "co" ? " · Compréhension orale" : "");
      else page = (ui.c.skill === "co" ? "Compréhension orale" : "Compréhension écrite") + (set && set.title && !set.questions.some((q) => q.doc) ? " · " + grabClean(set.title) : "");
    } else if (v === "grammar" && TOPIC[route.args[0]]) page += " · " + TOPIC[route.args[0]].title;
    const sheet = host.closest(".sheet, .doc");
    const h = sheet && sheet.querySelector("h3");
    const doc = h ? grabClean(h.textContent) : "";
    return doc && !page.includes(doc) ? `${page} · ${doc}` : page;
  }
  // Shows the button under a selection of a few words on the page, and hides it otherwise.
  function grabCheck() {
    clearTimeout(grabT);
    grabT = 0;
    if (!grabBtn || Date.now() - grabHold < 1000) return; // no button in an older page shell, or it's being pressed
    const sel = window.getSelection ? window.getSelection() : null;
    const r = sel && sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : null;
    const node = r && r.commonAncestorContainer;
    const host = node && (node.nodeType === 1 ? node : node.parentElement);
    const ok = host && viewEl.contains(host) && !host.closest("input, textarea, select, button, [contenteditable], .who");
    const text = ok ? grabClean(textOf(r.cloneContents())) : "";
    if (!text || !/\p{L}/u.test(text) || countWords(text) > GRAB_WORDS) { grabBtn.hidden = true; grabSel = null; return; }
    grabSel = { text, ex: grabSentence(r), src: grabSource(host) };
    const rects = r.getClientRects();
    const box = rects.length ? rects[rects.length - 1] : r.getBoundingClientRect();
    grabBtn.hidden = false;
    const left = Math.max(8, Math.min(box.left, document.documentElement.clientWidth - grabBtn.offsetWidth - 8));
    grabBtn.style.left = Math.round(left + window.scrollX) + "px";
    grabBtn.style.top = Math.round(box.bottom + window.scrollY + 10) + "px";
  }
  // The same French as a card's, give or take an article, the notes in brackets, or the other half of "amener / emmener".
  const cardKeys = (fr) => str(fr).replace(/\([^)]*\)/g, " ").split(/\s\/\s|;/).map((p) => norm(p).replace(/^(?:(?:les|le|la|une|un) |l')/, "")).filter(Boolean);
  function grabFind(fr) {
    const want = new Set(cardKeys(fr));
    if (!want.size) return null;
    for (const c of allCards().values()) if (cardKeys(c.fr).concat(cardKeys(c.seen)).some((k) => want.has(k))) return c;
    return null;
  }
  function grabOpen() {
    const g = grabSel;
    grabHold = 0;
    if (grabBtn) grabBtn.hidden = true;
    if (!g) return;
    const dup = grabFind(g.text), th = settings().grabTheme;
    ui.grab = { fr: g.text, seen: g.text, en: "", note: "", ex: norm(g.ex) === norm(g.text) ? "" : g.ex, src: g.src, theme: THEME[th] ? th : "carnet", dup: dup ? dup.id : "", force: false };
    paintGrab(true);
    // Straight to the meaning with a mouse; on a phone the keyboard waits until you tap a field.
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) { const el = document.getElementById(dup ? "grab-add" : "grab-en"); if (el) el.focus({ preventScroll: true }); }
  }
  function grabClose() {
    ui.grab = null;
    paintGrab(true);
  }
  const exLines = (ex) => str(ex).split("\n").map((l) => l.trim()).filter(Boolean);
  function grabHTML() {
    const g = ui.grab;
    const dup = g.dup && !g.force ? allCards().get(g.dup) : null;
    const head = `<div class="row between"><p class="h3 with-ico">${ico("vocab")}Save to your cards</p><button class="x" data-act="grab-close" title="Close" aria-label="Close">×</button></div>`;
    if (dup) {
      const has = !g.ex || exLines(dup.ex).some((l) => norm(l) === norm(g.ex));
      return `${head}
        <p class="small">It's already in <b>${esc(themeLabel(dup.theme))}</b>:</p>
        <div class="grab-dup"><p class="fr">${typo(dup.fr)}</p><p class="small">${dup.en ? esc(dup.en) : `<span class="muted">No meaning yet</span>`}</p></div>
        ${g.ex ? `<p class="small muted">${has ? "This sentence is already one of its examples." : "You can add the sentence you found it in to that card's examples."}</p>` : ""}
        <div class="row">${has ? "" : `<button class="btn primary" id="grab-add" data-act="grab-add-ex">Add the sentence to it</button>`}<button class="btn" data-act="grab-force">Make a new card anyway</button><button class="btn ghost" data-act="grab-close">Cancel</button></div>`;
    }
    const label = (k, more) => `<span>${k}${more ? ` <span class="muted" style="font-weight:400">· ${more}</span>` : ""}</span>`;
    return `${head}
      <label class="field">${label("French")}<input type="text" id="grab-fr" data-input="grab" data-k="fr" value="${esc(g.fr)}" lang="fr" autocomplete="off" spellcheck="false"></label>
      <label class="field">${label("English", "or leave it for later")}<input type="text" id="grab-en" data-input="grab" data-k="en" value="${esc(g.en)}" autocomplete="off"></label>
      ${claudeOn() ? `<div class="row">${claudeBtn("grab", "grab-claude", "Fill in with Claude", "", "btn sm")}<span class="small muted">the meaning in this sentence</span></div>` : ""}
      <label class="field">${label("Note", "optional, shown with the English")}<input type="text" id="grab-note" data-input="grab" data-k="note" value="${esc(g.note)}" autocomplete="off"></label>
      <label class="field">${label("Example", "the sentence it came from")}<textarea id="grab-ex" data-input="grab" data-k="ex" rows="3" lang="fr" spellcheck="false">${esc(g.ex)}</textarea></label>
      <label class="field">${label("Deck")}<select id="grab-th" data-change="grab-theme">${T.VOCAB.map((th) => `<option value="${th.id}" ${th.id === g.theme ? "selected" : ""}>${esc(th.label)}</option>`).join("")}</select></label>
      ${g.src ? `<p class="small muted">From ${esc(g.src)}</p>` : ""}
      <div class="row"><button class="btn primary" data-act="grab-save">Save <span class="kbd">↵</span></button><button class="btn ghost" data-act="grab-close">Cancel <span class="kbd">Esc</span></button></div>`;
  }
  // The panel sits outside the page, so drawing the page leaves it alone. It isn't redrawn while you type in it;
  // when it is, the field you're in keeps its focus and caret.
  function paintGrab(force) {
    if (!grabEl) return;
    if (!ui.grab) { if (!grabEl.hidden || grabHtml) { grabEl.hidden = true; grabEl.innerHTML = grabHtml = ""; } return; }
    const ae = document.activeElement;
    const inside = !!ae && grabEl.contains(ae);
    if (!force && inside && isTyping(ae)) return;
    const html = grabHTML();
    if (html === grabHtml && !grabEl.hidden) return;
    const fid = inside ? ae.id : "";
    const sel = fid && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd] : null;
    grabEl.innerHTML = grabHtml = html;
    grabEl.hidden = false;
    const el = fid && document.getElementById(fid);
    if (el) { try { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) el.setSelectionRange(sel[0], sel[1]); } catch (_) {} }
  }
  // The next bar: once a block is ticked (or its first part done), it says what's next, wherever you are, with a
  // Start that presents it as Aujourd'hui does. It sits outside the page, like the Save to cards panel.
  const nextEl = document.getElementById("nextup");
  let nextHtml = "";
  function nextUpHTML() {
    const nu = ui.nextUp, t = todayStr(), s = settings(), plan = planFor(s.phase, t);
    if (!nu || nu.date !== t || !plan) return "";
    const done = (S.days.get(t) || {}).done || {};
    const fromI = plan.findIndex((b, k) => blockKey(s.phase, k) === nu.from);
    // A block with a part still to do comes first; otherwise the next block not ticked.
    const i = fromI >= 0 && !done[nu.from] ? fromI : plan.findIndex((b, k) => !done[blockKey(s.phase, k)]);
    const was = fromI >= 0 ? `<span class="nu-was"><svg class="nu-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.6 3.6 7.4-8"/></svg>${i === fromI ? "Part 1 · " : ""}${esc(plan[fromI][2])}</span>` : "";
    const x = `<button class="btn ghost sm nu-x" data-act="nextup-close" aria-label="Dismiss">×</button>`;
    if (i < 0) return `<div class="nu-in nu-day">${was}<span class="nu-next"><b class="nu-hand">Journée terminée&#160;!</b></span><a class="btn sm primary" href="#today">See the stamp</a>${x}</div>`;
    const st = coach(plan[i], i, t), left = i === fromI ? rmin(st.parts.filter((p) => !p.done).reduce((a, p) => a + p.min, 0)) : st.min;
    return `<div class="nu-in">${was}<span class="nu-next"><small>${i === fromI ? "Part 2" : "Next"}</small><b>${esc(st.title || plan[i][2])}</b><span class="nu-min">${left}&#8201;min</span></span><button class="btn sm primary" data-act="plan-start" data-i="${i}">Start</button>${x}</div>`;
  }
  function paintNextUp() {
    if (!nextEl) return;
    if (route.view === "today" && ui.nextUp) ui.nextUp = null;
    const html = nextUpHTML();
    if (html === nextHtml) return;
    nextHtml = html;
    nextEl.innerHTML = html;
    nextEl.hidden = !html;
    const day = html && nextEl.querySelector(".nu-hand");
    if (day && window.TCFMotion) setTimeout(() => window.TCFMotion.burst(day), 200);
  }
  // What Claude is told when it fills in a card: the French side in the decks' style, and the meaning in that sentence.
  const GRAB_BRIEF = `You're making French flashcards for a B1 learner preparing the TCF Canada (aiming for B2). The learner selected each word or phrase on a practice page, in the sentence given.
- "fr": the French side in dictionary form. A verb in the infinitive, with its usual preposition and "(+ inf.)", "(+ subj.)", "qqch" or "qqn" when useful. An adjective in the masculine singular, adding the feminine when it's irregular. A noun with its article, adding "(nm)" or "(nf)" after an elided "l'". Keep a fixed expression whole. Keep the learner's words when they're already in this form.
- "en": a short English meaning, the one used in that sentence, at most 8 words.
- "note": at most 12 words in English, only when useful: the register (familiar, formal), Québec usage, a false friend, or a grammar point. Don't repeat the French. Otherwise "".`;
  async function grabClaude() {
    const g = ui.grab;
    if (!g || !str(g.fr).trim()) return;
    const out = await ask("grab", `${GRAB_BRIEF}\n\nSelected: «${str(g.fr).trim()}»\nSentence: «${str(g.ex).trim() || str(g.fr).trim()}»\nReply with only JSON: {"fr": "...", "en": "...", "note": "..."}`);
    if (!out || ui.grab !== g) return;
    if (str(out.fr).trim()) g.fr = str(out.fr).trim();
    if (str(out.en).trim()) g.en = str(out.en).trim();
    g.note = str(out.note).trim();
    const dup = grabFind(g.fr);
    if (dup && !g.force) g.dup = dup.id;
    paintGrab(true);
    tabSoon();
  }
  function grabSave() {
    const g = ui.grab;
    if (!g) return;
    const fr = str(g.fr).replace(/\s+/g, " ").trim(), en = str(g.en).trim(), note = str(g.note).trim(), ex = str(g.ex).trim();
    if (!fr) { toast("The French side needs some text."); return; }
    const dup = g.force ? null : grabFind(fr);
    if (dup) { g.dup = dup.id; paintGrab(true); return; }
    const theme = THEME[g.theme] ? g.theme : "carnet";
    const id = "c-" + uid();
    const doc = { fr, en, theme, created: todayStr(), ts: Date.now(), by: "you", seen: g.seen };
    if (ex && norm(ex) !== norm(fr)) doc.ex = ex;
    if (note) doc.enNote = note;
    if (g.src) doc.src = g.src;
    put("cards", id, doc);
    if (en) srsLearn(id);
    if (settings().grabTheme !== theme) saveSettings({ grabTheme: theme });
    grabClose();
    toast(en ? `Saved to ${THEME[theme].label}. It comes up in your reviews from tomorrow.` : `Saved to ${THEME[theme].label}. Give it a meaning under À chercher on Vocabulaire.`);
  }
  // The words were already on a card: the sentence joins its examples, and a card you weren't reviewing yet joins your reviews.
  function grabAddEx() {
    const g = ui.grab;
    const c = g && allCards().get(g.dup);
    if (!c) return;
    const exs = exLines(c.ex);
    if (g.ex && !exs.some((l) => norm(l) === norm(g.ex))) exs.push(str(g.ex).trim());
    const doc = Object.assign({}, c, { ex: exs.join("\n"), edited: todayStr() });
    delete doc.id;
    if (!doc.seen) doc.seen = g.seen;
    put("cards", c.id, doc);
    const joins = !!str(c.en).trim() && !S.srs.has(c.id);
    if (joins) srsLearn(c.id);
    grabClose();
    toast(`Added to « ${c.fr} » in ${themeLabel(c.theme)}.${joins ? " It comes up in your reviews from tomorrow." : ""}`);
  }

  // Words you saved from a page are marked wherever they come up, with the CSS Custom Highlight API, which leaves
  // the page itself unchanged. Browsers without it just don't mark them. Not on Vocabulaire, where the cards are.
  let markKey = "", markRe = null;
  const markPat = (s) => reEsc(s).replace(/['’]/g, "['’]").replace(/ /g, "\\s+");
  function paintMarks() {
    const H = window.CSS && CSS.highlights;
    if (!H || typeof Highlight !== "function") return;
    const forms = route.view === "vocab" ? [] : [...new Set(list("cards").map((c) => grabClean(c.seen)).filter((s) => s.length > 1))].sort((a, b) => b.length - a.length);
    if (!forms.length) { H.delete("saved"); return; }
    const key = forms.join("|");
    if (key !== markKey) { markKey = key; markRe = new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.map(markPat).join("|")})(?![\\p{L}\\p{N}])`, "giu"); }
    const ranges = [];
    const walk = document.createTreeWalker(viewEl, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest("button, select, textarea, input, script, style, .who") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n; (n = walk.nextNode()) && ranges.length < 500;) {
      markRe.lastIndex = 0;
      for (let m; (m = markRe.exec(n.data));) { const r = new Range(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); ranges.push(r); }
    }
    H.set("saved", new Highlight(...ranges));
  }
  // A line's French and its English, from "French — English" or "French [English]". A line with neither is all French.
  function exSplit(l) {
    const i = l.indexOf(" — ");
    if (i > 0) return [l.slice(0, i).trim(), l.slice(i + 3).trim()];
    const m = l.match(/^(.*\S)\s*\[([^\]]+)\]\s*$/);
    return m ? [m[1], m[2].trim()] : [l, ""];
  }
  // A card's examples, one per line with its English underneath, and the words you saved in bold.
  function exHTML(c) {
    const re = grabClean(c.seen).length > 1 ? new RegExp(`(?<![\\p{L}\\p{N}])${markPat(grabClean(c.seen))}(?![\\p{L}\\p{N}])`, "giu") : null;
    const bold = (l) => {
      if (!re) return typo(l);
      let out = "", at = 0;
      for (const m of l.matchAll(re)) { out += typo(l.slice(at, m.index)) + `<b>${typo(m[0])}</b>`; at = m.index + m[0].length; }
      return out + typo(l.slice(at));
    };
    return exLines(c.ex).map((l) => {
      const [fr, en] = exSplit(l);
      return `<span class="ex-l"><span class="ex-fr" lang="fr">${bold(fr)}</span>${en ? `<span class="ex-en">${esc(en)}</span>` : ""}</span>`;
    }).join("");
  }

  // Cards saved without a meaning wait on Vocabulaire, out of your reviews, until they have one. Newest first.
  const waitingCards = () => list("cards").filter((c) => c.fr && !str(c.en).trim()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const waitVal = (id, k) => str(ui.form[`wt-${k}-${id}`]);
  function waitPanel() {
    const ws = waitingCards();
    if (!ws.length) return "";
    const filled = ws.filter((c) => waitVal(c.id, "en").trim()).length;
    const rows = ws.map((c) => {
      const f = (k, label, extra) => `<label class="field">${label}<input type="text" id="wt-${k}-${c.id}" data-input="form" data-k="wt-${k}-${c.id}" value="${esc(ui.form[`wt-${k}-${c.id}`] != null ? ui.form[`wt-${k}-${c.id}`] : k === "fr" ? c.fr : "")}" autocomplete="off" ${extra || ""}></label>`;
      return `<li class="stack tight">
        <div class="wait-fields">${f("fr", "French", `lang="fr" spellcheck="false"`)}${f("en", "English")}${f("note", `<span>Note <span class="muted" style="font-weight:400">· optional</span></span>`)}</div>
        ${c.ex ? `<p class="fr small">${exHTML(c)}</p>` : ""}
        <div class="row between"><span class="small muted">${esc(themeLabel(c.theme))}${c.src ? ` · from ${esc(c.src)}` : ""}</span><span class="row"><button class="btn sm" data-act="wt-save" data-id="${esc(c.id)}">Save</button>${confirmBtn("wt-del-" + c.id, "Delete this card", "wt-del", `data-id="${esc(c.id)}"`)}</span></div>
      </li>`;
    }).join("");
    return `<section class="panel stack">
      <div class="row between"><p class="h3">À chercher · ${ws.length} saved without a meaning</p><span class="row">${claudeBtn("wt-fill", "wt-fill", "Fill them in with Claude", "", "btn sm")}${filled ? `<button class="btn sm primary" data-act="wt-save-all">Save the ${filled} with a meaning</button>` : ""}</span></div>
      <p class="small muted">They stay out of your reviews until they have a meaning. Once you save one, it comes up in your reviews from tomorrow.</p>
      <ul class="wait-list">${rows}</ul>
    </section>`;
  }
  async function waitFill() {
    const ws = waitingCards().filter((c) => !waitVal(c.id, "en").trim()).slice(0, 25);
    if (!ws.length) { toast("They all have a meaning already. Check them, then save."); return; }
    const items = ws.map((c, i) => ({ i, selected: grabClean(c.seen) || c.fr, sentence: str(c.ex).split("\n")[0] || c.fr }));
    const out = await ask("wt-fill", `${GRAB_BRIEF}\n\nThe items:\n${JSON.stringify(items)}\nReply with only JSON: {"cards": [{"i": the item's i, "fr": "...", "en": "...", "note": "..."}]}`);
    if (!out) return;
    let n = 0;
    for (const r of arr(out.cards)) {
      const c = r && ws[Number(r.i)];
      if (!c || !str(r.en).trim()) continue;
      if (str(r.fr).trim()) ui.form[`wt-fr-${c.id}`] = str(r.fr).trim();
      ui.form[`wt-en-${c.id}`] = str(r.en).trim();
      ui.form[`wt-note-${c.id}`] = str(r.note).trim();
      n++;
    }
    toast(n ? `Claude filled in ${n}. Check each one, then save it.` : "No meanings came back. Try again.");
    render(true);
  }
  // Saving a meaning puts the card in your reviews. If its French is now word for word the same as another
  // card's, the sentence goes to that card instead, so each word keeps one card.
  function waitSave(id) {
    const c = S.cards.get(id);
    if (!c) return false;
    const fr = waitVal(id, "fr").trim() || c.fr, en = waitVal(id, "en").trim(), note = waitVal(id, "note").trim();
    if (!en) return false;
    ["fr", "en", "note"].forEach((k) => { delete ui.form[`wt-${k}-${id}`]; });
    const same = [...allCards().values()].find((x) => x.id !== id && x.en && norm(x.fr) === norm(fr));
    if (same) {
      const exs = exLines(same.ex);
      exLines(c.ex).forEach((l) => { if (!exs.some((x) => norm(x) === norm(l))) exs.push(l); });
      const doc = Object.assign({}, same, { ex: exs.join("\n"), edited: todayStr() });
      delete doc.id;
      if (!doc.seen) doc.seen = c.seen;
      put("cards", same.id, doc);
      if (!S.srs.has(same.id)) srsLearn(same.id);
      remove("cards", id);
      return "merged";
    }
    const doc = Object.assign({}, c, { fr, en });
    if (note) doc.enNote = note; else delete doc.enNote;
    put("cards", id, doc);
    if (!S.srs.has(id)) srsLearn(id);
    return true;
  }

  // Your own cards with fewer than 2 examples. Claude can write them; they're saved only when you press Save.
  const thinCards = () => [...allCards().values()].filter((c) => !DECK.has(c.id) && c.fr && str(c.en).trim() && exLines(c.ex).length < 2);
  const exDraft = (id) => ui.form["exf-" + id];
  function exPanel() {
    const ws = thinCards();
    if (!ws.length) return "";
    const ready = ws.filter((c) => exDraft(c.id) != null);
    const rows = ready.map((c) => `<li class="stack tight">
        <p><b class="fr">${typo(c.fr)}</b> <span class="small muted">· ${esc(c.en)}</span></p>
        <label class="field">Examples <span class="muted" style="font-weight:400">one per line, French — English</span><textarea id="exf-${esc(c.id)}" data-input="form" data-k="exf-${esc(c.id)}" rows="3" lang="fr" spellcheck="false">${esc(exDraft(c.id))}</textarea></label>
        <div class="row"><button class="btn sm" data-act="exf-save" data-id="${esc(c.id)}">Save</button><button class="btn ghost sm" data-act="exf-skip" data-id="${esc(c.id)}">Not now</button></div>
      </li>`).join("");
    return `<section class="panel stack">
      <div class="row between"><p class="h3">Exemples · ${ws.length} of your cards ${ws.length === 1 ? "has" : "have"} fewer than 2</p><span class="row">${ready.length < ws.length ? claudeBtn("ex-fill", "ex-fill", "Write them with Claude", "", "btn sm") : ""}${ready.length > 1 ? `<button class="btn sm primary" data-act="exf-save-all">Save all ${ready.length}</button>` : ""}</span></div>
      <p class="small muted">Seeing a word in real sentences is what makes it stick. Claude writes two for each card, in TCF Canada situations; check them, then save.</p>
      ${rows ? `<ul class="wait-list">${rows}</ul>` : ""}
    </section>`;
  }
  async function exFill() {
    const ws = thinCards().filter((c) => exDraft(c.id) == null).slice(0, 25);
    if (!ws.length) return;
    const items = ws.map((c, i) => ({ i, fr: c.fr, en: c.en, has: exLines(c.ex) }));
    const out = await ask("ex-fill", `You're writing example sentences for a B1 learner's French flashcards, for the TCF Canada (aiming for NCLC 7, about B2).\nFor each card, write 2 natural French sentences that use the word or phrase in real use, with the prepositions and collocations it actually takes, in situations the TCF Canada writes about (settling in Canada, work, housing, health, the environment, studies, public life). B1–B2, at most 20 words each. Make at least one a sentence the learner could write in a Tâche 2 or 3 or say in an oral Tâche 3. Follow each with " — " and its English. Don't repeat a sentence the card already has ("has").\nThe cards:\n${JSON.stringify(items)}\nReply with only JSON: {"cards": [{"i": the card's i, "ex": ["French — English", "French — English"]}]}`);
    if (!out) return;
    let n = 0;
    for (const r of arr(out.cards)) {
      const c = r && ws[Number(r.i)];
      const lines = arr(r && r.ex).map((l) => str(l).replace(/\s+/g, " ").trim()).filter(Boolean);
      if (!c || !lines.length) continue;
      const have = exLines(c.ex);
      lines.forEach((l) => { if (!have.some((h) => norm(exSplit(h)[0]) === norm(exSplit(l)[0]))) have.push(l); });
      ui.form["exf-" + c.id] = have.join("\n");
      n++;
    }
    toast(n ? `Claude wrote examples for ${n}. Check them, then save.` : "No examples came back. Try again.");
    render(true);
  }
  function exSave(id) {
    const c = S.cards.get(id), text = exDraft(id);
    if (!c || text == null) return false;
    delete ui.form["exf-" + id];
    const ex = exLines(text).join("\n");
    put("cards", id, Object.assign({}, c, { ex, edited: todayStr() }));
    return true;
  }

  /* =============== writing =============== */
  function wPrompt(task) {
    const W = T.WRITING[task];
    if (ui.w.gen[task]) return ui.w.gen[task];
    const p = W.prompts[((ui.w.idx[task] % W.prompts.length) + W.prompts.length) % W.prompts.length];
    return typeof p === "string" ? { q: p } : p;
  }
  function onWText(el) {
    const task = ui.w.task;
    ui.w.text[task] = el.value;
    updateMeters();
    writingKeep(task, 1500);
  }
  // The draft is kept with its prompt (Claude's and the Tâche 3 documents too), so it comes back as it was.
  function writingKeep(task, delay) {
    const text = ui.w.text[task] || "";
    if (!text.trim()) { ipDrop("writing--" + task); return; }
    const W = T.WRITING[task], p = wPrompt(task);
    ipSave("writing--" + task, { kind: "writing", title: W.name + " écrit", route: "writing." + task, task, prompt: { q: p.q, en: p.en || "", docs: p.docs || null }, gen: !!(ui.w.gen[task] && !ui.w.gen[task].kept), idx: ui.w.idx[task], text, checks: ui.w.checks[task] || {} }, delay);
  }
  function writingRestore(task) {
    const ip = ipGet("writing--" + task);
    if (!ip) return false;
    ui.w.text[task] = str(ip.text);
    ui.w.checks[task] = Object.assign({}, ip.checks);
    if (Number.isFinite(ip.idx)) ui.w.idx[task] = ip.idx;
    ui.w.gen[task] = ip.gen ? ip.prompt : null;
    // If a built-in prompt has changed since, keep the one the draft answers.
    if (!ip.gen && ip.prompt && wPrompt(task).q !== ip.prompt.q) ui.w.gen[task] = Object.assign({}, ip.prompt, { kept: true });
    return true;
  }
  // A new prompt would leave the draft answering the wrong question, so ask before throwing it away.
  function wDraftGuard(act) {
    const t = ui.w.task;
    if (!str(ui.w.text[t]).trim()) return false;
    if (ui.confirm !== "w-switch-" + act) { ui.confirm = "w-switch-" + act; render(true); return true; }
    ui.confirm = "";
    ipDrop("writing--" + t);
    ui.w.text[t] = "";
    ui.w.checks[t] = {};
    return false;
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
  // The correction request for one text: the TCF Canada rules, criteria and score bands, the task and its subject,
  // the learner, the text, and the JSON to send back. The writing page and the Examen blanc EE both send it.
  function wCorrectPrompt(task, p, text) {
    const W = T.WRITING[task], words = countWords(text);
    const docs = task === "t3" && p.docs ? `\nDOCUMENT 1 (${p.docs[0].who}): ${p.docs[0].text}\nDOCUMENT 2 (${p.docs[1].who}): ${p.docs[1].text}` : "";
    const ps = paragraphs(text);
    const parts = task === "t3" ? `\nLearner's part 1 (first paragraph): ${ps[0] ? countWords(ps[0]) : 0} words (TCF Canada: 40–60). Part 2 (everything after it): ${ps.slice(1).reduce((n, x) => n + countWords(x), 0)} words (TCF Canada: 80–120).` : "";
    const t3 = task === "t3" ? `"tache3": {"compared_both": true or false (part 1 presents and compares BOTH documents' viewpoints), "opinion_after_comparison": true or false (the learner's own position comes in part 2, after the comparison), "notes": "one sentence"}, ` : "";
    const critNames = TC.ee.criteria.map(([n]) => n);
    return `You are a certified TCF Canada Expression écrite corrector (France Éducation International) and a French teacher. Correct the learner's text and grade it strictly the way the TCF Canada does, using the TCF Canada rules, criteria and score bands below. Don't use DELF, TEF or TCF tout public grading.\n\n${EE_RUBRIC}\n\nTASK: ${W.name}, ${W.kind}. ${W.expected} Required length: ${W.min}–${W.max} words. Learner's word count (anything between two spaces): ${words}.${parts}\nPROMPT: ${p.q}${docs}\n\n${profile()}\n\nLEARNER'S TEXT:\n"""\n${text}\n"""\n\nGrade this task on the TCF Canada 0–20 scale. If the word count is outside the range, the text is off-topic or the instructions are ignored, cap the score accordingly (it can be A1 non atteint). List every grammar, spelling, agreement and word-choice error, most important first (max 25). Quote "wrong" exactly as it appears in the text, just enough to locate it. Error categories (use the id): ${Object.keys(CAT).join(", ")}.\nReply with only JSON:\n{"score20": integer from 0 to 20 for this task on the TCF Canada scale, "level": "A1 | A2 | B1 | B2 | C1 | C2 (the level that score corresponds to)", "summary": "2–3 sentences in ${replyLang()}", "criteria": [{"name": "one of: ${critNames.join(" | ")}", "level": "A1 | A2 | B1 | B2 | C1 | C2", "comment": "one sentence in ${replyLang()}"}] (one entry per criterion, in that order), "compliance": {"on_topic": true or false, "length_ok": true or false, "register_ok": true or false, "notes": "one sentence"}, ${t3}"errors": [{"wrong": "...", "right": "...", "category": "...", "why": "short ${replyLang()} explanation"}], "corrected_text": "the full corrected text, keeping the learner's ideas and paragraph breaks", "upgrades": [{"from": "a B1 phrase from the text", "to": "a B2 alternative"}], "strengths": ["up to 3"], "homework": ["1–3 short, concrete follow-up tasks for tomorrow"]}`;
  }
  async function writingCorrect() {
    const task = ui.w.task;
    const text = ui.w.text[task] || "";
    const words = countWords(text);
    if (words < 20) { toast("Write at least a few sentences first."); return; }
    // The clock stops as you hand the text in, so Claude's time doesn't count as writing time.
    const clockWas = timerFinish("writing." + task);
    const p = wPrompt(task);
    const out = await ask("w-correct", wCorrectPrompt(task, p, text));
    if (!out) { timerUnfinish("writing." + task, clockWas); render(true); return; }
    const fb = cleanFb(out, task);
    const id = uid();
    // Claude's follow-up tasks stay suggestions on the correction until you add them to your homework.
    put("writing", id, { task, date: todayStr(), ts: Date.now(), prompt: p.q, docs: p.docs || null, text, words, minutes: timerElapsedMin("writing." + task), fb });
    ipDrop("writing--" + task);
    minePrepSoon("w-" + id);
    ui.w.viewing = id;
    autoTick("writing." + task, { min: timerElapsedMin("writing." + task) || 0 });
    render(true);
    const fe = document.getElementById("w-fb");
    if (fe) fe.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  // Everything another AI needs to correct a draft the way the TCF Canada would: the official rules,
  // criteria and score bands, the task and its subject, the learner, the draft, and what to send back.
  // For when Claude can't correct it (unavailable, or out of usage).
  function wCopyPrompt(task) {
    const W = T.WRITING[task], p = wPrompt(task);
    const text = str(ui.w.text[task]).trim();
    const docs = task === "t3" && p.docs ? p.docs.map((d, k) => `\n\nDOCUMENT ${k + 1} (${d.who}) :\n${d.text}`).join("") : "";
    const ps = paragraphs(text);
    const parts = task === "t3" ? ` Part 1 (my first paragraph): ${ps[0] ? countWords(ps[0]) : 0} words (TCF Canada: 40–60). Part 2 (everything after it): ${ps.slice(1).reduce((n, x) => n + countWords(x), 0)} words (TCF Canada: 80–120).` : "";
    const asks = [
      "A score out of 20 on the TCF Canada scale, with the CEFR and NCLC levels it corresponds to. If the word count is outside the range, the text is off-topic or the instructions aren't followed, cap the score as the TCF Canada would.",
      `A level and one sentence for each criterion: ${TC.ee.criteria.map(([n]) => n).join(", ")}.`,
      ...(task === "t3" ? ["Whether part 1 compares both documents' viewpoints, and whether my own position comes only in part 2."] : []),
      "Every grammar, spelling, agreement and word-choice mistake, most important first, as: wrong → right (why).",
      "My whole text corrected, keeping my ideas and paragraph breaks.",
      "Three phrases from my text rewritten at B2 level, and the three things I should work on first.",
    ];
    return [
      "You are a certified TCF Canada Expression écrite corrector (France Éducation International) and a French teacher. Correct my text and grade it strictly the way the TCF Canada does, using the rules, criteria and score bands below. Don't use DELF, TEF or TCF tout public grading.",
      `${EE_RUBRIC}\nSCORE BANDS: ${TC.bands}`,
      `TASK: ${W.name}, ${W.kind}. ${W.expected} Required length: ${W.min}–${W.max} words. My word count: ${countWords(text)}.${parts}`,
      `SUBJECT:\n${p.q}${docs}`,
      `ABOUT ME: an adult B1 learner of French preparing the TCF Canada, aiming for NCLC 7 (B2). Mistakes I often make: ${T.KNOWN_ERRORS.join("; ")}.${watchBrief(true)}`,
      `MY TEXT:\n"""\n${text}\n"""`,
      `Reply in ${replyLang()} with:\n${asks.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
    ].join("\n\n");
  }
  // Copy to the clipboard. The page can run in a frame where the Clipboard API is blocked, so fall back
  // to a hidden text box; if that fails too, the caller shows the text to copy by hand.
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) { return false; }
  }
  async function writingCopy() {
    const task = ui.w.task;
    if (!str(ui.w.text[task]).trim()) { toast("Write your text first: there's nothing to evaluate yet."); return; }
    const text = wCopyPrompt(task);
    // Copying the draft out for marking hands it in, so its clock stops; Resume starts it again.
    timerFinish("writing." + task);
    const stopped = timer.home === "writing." + task && timer.done;
    if (await copyText(text)) {
      ui.w.copyOut = null;
      toast(`Copied: the task, the TCF Canada rules and your draft (${countWords(ui.w.text[task])} words). Paste it into any AI chat.${stopped ? ` The clock stopped at ${timerTaken()} min.` : ""}`);
      render(true);
      return;
    }
    ui.w.copyOut = { task, text };
    render(true);
    const el = document.getElementById("w-copy-out");
    if (el) { el.focus(); el.select(); }
  }
  function writingSave() {
    const task = ui.w.task;
    const text = ui.w.text[task] || "";
    if (countWords(text) < 5) { toast("There's nothing to hand in yet."); return; }
    timerFinish("writing." + task);
    const stopped = timer.home === "writing." + task && timer.done;
    const p = wPrompt(task);
    const id = uid();
    put("writing", id, { task, date: todayStr(), ts: Date.now(), prompt: p.q, docs: p.docs || null, text, words: countWords(text), minutes: timerElapsedMin("writing." + task), fb: null });
    ipDrop("writing--" + task);
    ui.w.viewing = id;
    autoTick("writing." + task, { min: timerElapsedMin("writing." + task) || 0 });
    toast(`Finished. It's in your writing history.${stopped ? ` The clock stopped at ${timerTaken()} min.` : ""}`);
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
  // The listening player: ui.c.player is "idle" (ready to play from the start), "playing", "paused" or
  // "ended" (played to the end, so the main button offers a replay). ui.c.plays still counts listens from
  // the start, which is what makes a set count as started, but it isn't shown. A recording can be moved
  // 5 seconds back or forward, or along its position bar; the browser voice can't, so those stay off.
  let playToken = 0;
  let audioEl = null;
  let ttsNext = null; // the browser voice's next line, when a pause fell between two lines
  function stopAudio() {
    playToken++;
    ttsNext = null;
    try { if (synth) { synth.cancel(); if (synth.paused) synth.resume(); } } catch (_) {}
    if (audioEl) { try { audioEl.pause(); } catch (_) {} audioEl = null; }
    ui.c.player = "idle";
  }
  // A recording that has ended stays loaded, so it can still be wound back from the end.
  function donePlaying(token) { if (token !== playToken) return; ui.c.player = "ended"; if (routeView() === "comp") render(false); }
  function coPause() {
    if (ui.c.player !== "playing") return;
    if (audioEl) { try { audioEl.pause(); } catch (_) {} }
    else if (synth) { try { synth.pause(); } catch (_) {} }
    ui.c.player = "paused";
    render(true);
  }
  function coResume() {
    if (ui.c.player !== "paused") return;
    ui.c.player = "playing";
    if (audioEl) { const pr = audioEl.play(); if (pr && pr.catch) pr.catch(() => {}); }
    else if (synth) {
      try { synth.resume(); } catch (_) {}
      if (ttsNext) { const f = ttsNext; ttsNext = null; f(); }
    }
    render(true);
  }
  // Play from the start (Play, or Replay once it has ended). Built-in sets play their recording; sets
  // without one, like Claude's extra sets, fall back to the browser's best French voice.
  function coPlay() {
    const set = ui.c.set.co;
    if (!set) return;
    stopAudio();
    const token = playToken;
    ui.c.player = "playing";
    ui.c.plays++;
    compKeep("co");
    if (set.audio) {
      const a = new Audio(set.audio);
      audioEl = a;
      let fell = false;
      // A recording that can't play falls back to the browser's voice, which can't skip. A play()
      // interrupted by Pause (AbortError) isn't a failure.
      const fallback = (e) => { if (fell || token !== playToken || (e && e.name === "AbortError")) return; fell = true; audioEl = null; if (routeView() === "comp") render(false); speakSet(set, token); };
      a.onended = () => donePlaying(token);
      a.onerror = fallback;
      a.ontimeupdate = a.onloadedmetadata = a.ondurationchange = paintPlayer;
      // Drawn only now that the recording is set, so the 5-second buttons are on from the start. Before,
      // they waited for some other redraw, and after the answers were checked none came.
      render(true);
      const pr = a.play();
      if (pr && pr.catch) pr.catch(fallback);
      return;
    }
    render(true);
    speakSet(set, token);
  }
  // After a refresh: the recording is loaded again, paused where it was (or at its end), so Resume carries on
  // from there. It doesn't play by itself. One that can't load goes back to Play.
  function coRemount(pos) {
    const set = ui.c.set.co;
    if (!set || !set.audio || set.id !== pos.id) return;
    stopAudio();
    const token = playToken;
    const a = new Audio(set.audio);
    audioEl = a;
    a.preload = "auto";
    a.onended = () => donePlaying(token);
    a.onerror = () => { if (token !== playToken) return; audioEl = null; ui.c.player = "idle"; if (routeView() === "comp") render(false); };
    a.ontimeupdate = a.ondurationchange = paintPlayer;
    a.onloadedmetadata = () => {
      if (token === playToken && isFinite(a.duration)) { try { a.currentTime = Math.max(0, Math.min(Number(pos.t) || 0, a.duration - 0.1)); } catch (_) {} }
      paintPlayer();
    };
    ui.c.player = pos.ended ? "ended" : "paused";
  }
  // Play ▸ Pause ▸ Resume, then Replay once the recording has ended; Stop goes back to the start.
  // 5 seconds back and forward, and the position bar, work once a recording has started.
  function playerHTML() {
    const st = ui.c.player;
    const [act, icon, label] = st === "playing" ? ["c-pause", ICON_PAUSE, "Pause"] : st === "paused" ? ["c-resume", ICON_PLAY, "Resume"]
      : st === "ended" ? ["c-play", ICON_REPLAY, "Replay"] : ["c-play", ICON_PLAY, "Play"];
    const a = audioEl, dur = a && isFinite(a.duration) ? a.duration : 0, cur = a ? a.currentTime || 0 : 0;
    const off = a ? "" : `disabled title="${ui.c.set.co && !ui.c.set.co.audio ? "The browser voice can't skip" : "Press Play first"}"`;
    const skip = (d, ic, txt, name) => `<button class="btn skip" data-act="c-skip" data-d="${d}" aria-label="${name}" ${off}>${ic}${txt}</button>`;
    return `<div class="player" role="group" aria-label="Recording">
      ${skip(-5, ICON_BACK, "−5 s", "5 seconds back")}<button class="btn primary" data-act="${act}">${icon}${label}</button>${skip(5, ICON_FWD, "+5 s", "5 seconds forward")}
      <button class="btn" data-act="c-stop" ${st === "playing" || st === "paused" ? "" : "disabled"}>${ICON_STOP}Stop</button>
      <div class="seek"><input type="range" min="0" max="${dur.toFixed(1)}" step="0.1" value="${cur.toFixed(1)}" data-input="c-seek" data-change="c-seek" data-player-seek aria-label="Position in the recording" ${dur ? "" : "disabled"}><span class="num small" data-player-time>${fmtClock(cur)} / ${dur ? fmtClock(dur) : "–:––"}</span></div>
    </div>`;
  }
  // The position bar and the time follow the recording without redrawing the page. A bar being dragged is left alone.
  function paintPlayer() {
    const a = audioEl;
    if (!a) return;
    const dur = isFinite(a.duration) ? a.duration : 0, cur = a.currentTime || 0;
    document.querySelectorAll("[data-player-seek]").forEach((el) => {
      if (dur) { el.max = dur.toFixed(1); el.disabled = false; }
      if (!(pointerDown && document.activeElement === el)) el.value = cur.toFixed(1);
    });
    document.querySelectorAll("[data-player-time]").forEach((el) => { el.textContent = `${fmtClock(cur)} / ${dur ? fmtClock(dur) : "–:––"}`; });
  }
  // Move within the recording. Going back from the end turns the main button into Resume.
  function coSeek(t) {
    const a = audioEl;
    if (!a) return;
    const dur = isFinite(a.duration) ? a.duration : Infinity;
    a.currentTime = Math.max(0, Math.min(dur - 0.1, t));
    paintPlayer();
  }
  function coSeekDone() {
    if (ui.c.player === "ended" && audioEl && !audioEl.ended) { ui.c.player = "paused"; render(true); }
  }
  function speakSet(set, token) {
    if (!synth) { toast("This browser can't read text aloud. Use the transcript instead."); donePlaying(token); return; }
    const v = bestVoice();
    let k = 0;
    // One line at a time, one voice, with a longer pause when the speaker changes.
    const next = () => {
      if (token !== playToken) return;
      if (ui.c.player === "paused") { ttsNext = next; return; }
      if (k >= set.lines.length) { donePlaying(token); return; }
      const ln = set.lines[k++];
      const turn = k < set.lines.length && set.lines[k].speaker !== ln.speaker;
      const u = new SpeechSynthesisUtterance(ttsText(ln.text));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "fr-FR";
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
  // Compréhension's topics are the theme decks: not the ones for every topic (general) or your own.
  const COMP_TOPICS = T.VOCAB.filter((t2) => !t2.general && !t2.own);
  // The level a skill's sets are at: the one you picked on the page, or else where your progress puts you (the coach's ladder).
  function compLevel(skill) { const sk = skill || ui.c.skill; return (ui.c.lv && ui.c.lv[sk]) || compLadder(sk).level; }
  const compKey = (skill) => `${skill}|${compLevel(skill)}|${ui.c.theme || ""}`;
  const themeLabel = (id) => (THEME[id] ? THEME[id].label : "");
  function prepSet(set) { set.questions.forEach((q) => { q.order = shuffle(q.options.map((_, j) => j)); }); return set; }
  function sampleSet(skill, i, key) {
    const all = samplesFor(skill);
    const k = ((i % all.length) + all.length) % all.length;
    const s = prepSet(clone(all[k]));
    s.src = "sample";
    s.sampleIdx = k;
    s.key = key;
    // Built-in sets list their topics in themes; the heading and the saved attempt use the one being practised.
    s.theme = arr(s.themes).includes(ui.c.theme) ? ui.c.theme : arr(s.themes)[0] || "";
    return s;
  }
  // Every saved attempt for one skill, newest first. Attempts saved before sets had ids are matched to
  // their built-in set by title; older Claude attempts are grouped by title.
  function compAttempts(skill) {
    const byTitle = new Map(samplesFor(skill).map((s) => [s.title, s]));
    return list("comp").filter((c2) => c2.skill === skill).map((c2) => {
      const b = !c2.setId && c2.src === "sample" ? byTitle.get(c2.title) : null;
      const setId = c2.setId || (b && b.id) || (c2.src === "claude" ? "claude-t-" + slug(c2.title) : "");
      return Object.assign({}, c2, { setId, theme: c2.theme || (b && arr(b.themes)[0]) || "" });
    }).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }
  // Per set: its attempts (newest first), the best one and when it was last done.
  function compStats(skill, attempts) {
    const m = new Map();
    for (const a of attempts || compAttempts(skill)) {
      if (!a.setId || a.src === "logged") continue;
      const s = m.get(a.setId) || { attempts: [], best: null, last: 0 };
      s.attempts.push(a);
      if (a.total && (!s.best || a.score / a.total > s.best.score / s.best.total)) s.best = a;
      s.last = Math.max(s.last, a.ts || 0);
      m.set(a.setId, s);
    }
    return m;
  }
  // The next built-in set at this level (and topic): one not done yet, going on from the current set,
  // or else the one done longest ago.
  function findSample(skill, lvl, theme, after) {
    const all = samplesFor(skill), stats = compStats(skill);
    let pick = -1, oldest = Infinity;
    for (let k = 1; k <= all.length; k++) {
      const i = (((after + k) % all.length) + all.length) % all.length;
      const s = all[i];
      if (i === after || s.level !== lvl || (theme && !arr(s.themes).includes(theme))) continue;
      const st = s.id && stats.get(s.id);
      if (!st) return i;
      if (st.last < oldest) { oldest = st.last; pick = i; }
    }
    return pick;
  }
  function compReset(skill) {
    ui.c.ans[skill] = {};
    ui.c.submitted[skill] = false;
    ui.c.saved[skill] = null;
    ui.c.review[skill] = null;
    ui.c.t0[skill] = Date.now();
    if (skill === "co") { ui.c.plays = 0; ui.c.script = false; stopAudio(); }
  }
  // Keep the tab showing a set for the current level and theme: one already made for it, a matching
  // built-in set, or a new one from Claude. Switching theme or level therefore reloads the set in place.
  function ensureCompSet(skill) {
    const key = compKey(skill);
    const cur = ui.c.set[skill];
    // A set picked before the saved history loaded is picked again once it has, unless it's been started.
    const untouched = !Object.keys(ui.c.ans[skill]).length && !ui.c.submitted[skill] && !(skill === "co" && ui.c.plays);
    if (cur && cur.key === key && !(cur.early && loaded && untouched)) {
      if (cur.id && (loaded || !cur.early)) ui.c.shown[key] = { id: cur.id, saved: ui.c.submitted[skill] ? ui.c.saved[skill] : null };
      return;
    }
    if (busy["c-gen-" + skill] || ui.c.inflight[key]) return;
    compReset(skill);
    if (compBack(skill, key)) return;
    const lvl = compLevel(skill), th = ui.c.theme;
    // A set you started at this level and topic comes back first, with your answers.
    const ip = compUnfinished(skill, lvl, th);
    if (ip && compLoad(skill, ip.setId, ip)) { ui.c.set[skill].early = !loaded; return; }
    if (ui.c.cache[key]) { ui.c.set[skill] = prepSet(ui.c.cache[key]); compRestore(skill); return; }
    const i = findSample(skill, lvl, th, -1);
    if (i >= 0) { ui.c.set[skill] = sampleSet(skill, i, key); ui.c.set[skill].early = !loaded; compRestore(skill); return; }
    if (th && claudeOn() && !ui.c.failed[key]) {
      ui.c.set[skill] = null;
      if (!ui.c.queued) { ui.c.queued = true; setTimeout(() => { ui.c.queued = false; compGenerate(skill); }, 0); }
      return;
    }
    const j = findSample(skill, lvl, "", -1);
    ui.c.set[skill] = sampleSet(skill, j < 0 ? 0 : j, key);
    ui.c.set[skill].fallback = !!th;
    ui.c.set[skill].early = !loaded;
    compRestore(skill);
  }
  // Switching level or topic and back brings back the set you had open there, as you left it: with your
  // answers so far, or checked, with its results.
  function compBack(skill, key) {
    const last = ui.c.shown[key];
    if (!last) return false;
    const i = samplesFor(skill).findIndex((s) => s.id === last.id);
    const cached = ui.c.cache[key];
    const set = i >= 0 ? sampleSet(skill, i, key) : cached && cached.id === last.id ? prepSet(cached) : null;
    if (!set) return false;
    ui.c.set[skill] = set;
    const a = last.saved && S.comp.get(last.saved);
    if (a) {
      arr(a.answers).forEach((k, j) => { if (k != null) ui.c.ans[skill][j] = k; });
      ui.c.submitted[skill] = true;
      ui.c.saved[skill] = last.saved;
      if (skill === "co") ui.c.script = !ansHidden(set.id);
    } else compRestore(skill);
    return true;
  }
  // A set is kept from its first answer (or first listen), so switching topic or reloading keeps the answers.
  // Claude's sets exist only in memory, so their record keeps a copy of the set.
  const compIpId = (skill, setId) => `${skill}--${setId}`;
  function compKeep(skill) {
    const set = ui.c.set[skill];
    if (!set || !set.id || ui.c.submitted[skill] || ui.c.review[skill]) return;
    const answers = ui.c.ans[skill] || {};
    const plays = skill === "co" ? ui.c.plays : 0;
    if (!Object.keys(answers).length && !plays) return;
    const doc = { kind: "comp", title: set.title, route: "comp." + skill, skill, setId: set.id, level: set.level || compLevel(skill), theme: set.theme || "", themes: arr(set.themes), src: set.src || "sample", total: set.questions.length, answers, plays };
    if (set.src === "claude") doc.snap = snapOf(set);
    ipSave(compIpId(skill, set.id), doc);
  }
  function compRestore(skill) {
    const set = ui.c.set[skill];
    const ip = set && set.id && !ui.c.submitted[skill] && ipGet(compIpId(skill, set.id));
    if (!ip) return;
    ui.c.ans[skill] = Object.assign({}, ip.answers);
    if (skill === "co") ui.c.plays = Number(ip.plays) || 0;
  }
  // The most recent unfinished set at this level and topic. Under "Any topic" that's only Claude's
  // topic-less sets, so the topic picker doesn't jump; the others stay one click away on Today and History.
  function compUnfinished(skill, lvl, theme) {
    return list("inprogress").filter((x) => x.kind === "comp" && x.skill === skill && x.level === lvl && (theme ? x.theme === theme || arr(x.themes).includes(theme) : !x.theme && !arr(x.themes).length))
      .sort((a, b) => (b.updated || 0) - (a.updated || 0))[0] || null;
  }
  async function compGenerate(skill) {
    if (busy["c-gen-" + skill]) return;
    const key = compKey(skill);
    if (ui.c.inflight[key]) return;
    const lvl = compLevel(skill);
    const themeId = ui.c.theme;
    const th = THEME[themeId];
    const theme = th ? `${th.label} (${th.en})` : "any everyday or social topic typical of the TCF Canada (work, housing, services, health, environment, technology, culture, settling in Canada)";
    let prompt;
    if (skill === "ce") {
      prompt = `${EXAM_BRIEF}\n${TC.comp}\n\nWrite one TCF Canada Compréhension écrite practice set at CEFR ${lvl}. Theme: ${theme}. As on the real test, the set is ${CE_SET_SIZE} separate documents, each followed by ONE question, all in French, with paragraph breaks as \\n\\n. ${ceLevelBrief(lvl)} Give each document a different type and a different angle on the theme, and set one or two of them in Canada (Québec places, dollars, Canadian vocabulary). Each question has 4 options in French, exactly one correct. ${OPTIONS_RULE} Explain each answer in English, quoting the document.\nReply with only JSON: {"title": "short French title for the set", "items": [{"type": "document type in French", "title": "short title", "text": "...", "q": "...", "options": ["A", "B", "C", "D"], "answer": 0, "why": "..."}]}`;
    } else {
      prompt = `${EXAM_BRIEF}\n${TC.comp}\n\nWrite one TCF Canada Compréhension orale item set at CEFR ${lvl}. Theme: ${theme}. Write the script of a realistic recording of a kind the TCF Canada uses (${lvl === "B1" ? "a phone call, a series of public announcements or an everyday conversation" : "a radio interview, a report or a chronicle"}) that lasts 2 to 4 minutes when read aloud: ${lvl === "B1" ? "300–340" : "380–430"} words of natural spoken French, with at most two speakers, labelled A and B (or A alone). The TCF Canada includes Canadian contexts, so make roughly one set in three Canadian (Québec places and vocabulary). The script will be read by text-to-speech, so write times, prices and numbers in words (« neuf heures et demie », « trente dollars ») and avoid abbreviations. Then 6 multiple-choice questions in French, in the order the answers come up in the recording, 4 options each, exactly one correct, testing gist, details and inference. ${OPTIONS_RULE}\nReply with only JSON: {"title": "short title", "context": "one French sentence describing the situation, shown before listening", "lines": [{"speaker": "A", "text": "..."}], "questions": [{"q": "...", "options": ["A", "B", "C", "D"], "answer": 0, "why": "English explanation quoting the script"}]}`;
    }
    ui.c.inflight[key] = true;
    const out = await ask("c-gen-" + skill, prompt);
    let set = null;
    if (out) {
      // A reading set is a list of documents, each with its question; a listening set is one script with its questions.
      const raw = skill === "ce" ? arr(out.items).filter((x) => x && x.text).map((x) => Object.assign({}, x, { doc: { type: str(x.type), title: str(x.title), text: str(x.text) } })) : arr(out.questions);
      const qs = raw.filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
        .map((q) => Object.assign({ q: str(q.q), options: q.options.map(str), answer: q.answer, why: str(q.why) }, q.doc ? { doc: q.doc } : {}));
      const lines = arr(out.lines).filter((l) => l && l.text).map((l) => ({ speaker: str(l.speaker || "A").slice(0, 3), text: str(l.text) }));
      if (skill === "ce" ? qs.length >= 3 : qs.length >= 2 && lines.length > 0) {
        set = prepSet({ id: "claude-" + uid(), level: lvl, title: str(out.title), type: skill === "ce" ? `${qs.length} documents` : str(out.type), text: "", context: str(out.context), lines, questions: qs, src: "claude", theme: themeId, themes: themeId ? [themeId] : [], key });
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
  // A checked set's or exam's right answers stay hidden until you show them, so you can think again about the
  // ones you missed and trying it again isn't spoiled: the score and your misses show, the right answers and the
  // explanations wait. Shown ones are kept by set or exam id (settings.main.ansShown) until the next check. Before
  // your progress has loaded, they stay hidden too.
  const ansHidden = (id) => !loaded || !(id && (settings().ansShown || {})[id]);
  function ansHide(id, hide) {
    if (!id || !loaded || !(settings().ansShown || {})[id] === !!hide) return;
    const m = Object.assign({}, settings().ansShown || {});
    if (hide) delete m[id]; else m[id] = true;
    saveSettings({ ansShown: m });
  }
  function compSubmit(skill) {
    const set = ui.c.set[skill];
    if (!set) return;
    const ans = ui.c.ans[skill];
    if (Object.keys(ans).length < set.questions.length) { toast("Answer every question first. On the real test a blank is simply wrong."); return; }
    const score = set.questions.filter((q, i) => ans[i] === q.answer).length;
    // A clock already finished on an earlier set doesn't time this one.
    const timed = timer.home === "comp." + skill && timerStarted() && !timer.done;
    timerFinish("comp." + skill);
    ui.c.submitted[skill] = true;
    const id = uid();
    ui.c.saved[skill] = id;
    const doc = {
      skill, level: set.level || compLevel(skill), title: set.title, theme: set.theme || "", date: todayStr(), ts: Date.now(), score, total: set.questions.length, src: set.src || "sample", gaps: {},
      setId: set.id || "", answers: set.questions.map((q, i) => (ans[i] == null ? null : ans[i])),
      secs: timed ? Math.round(timer.total - timerRemaining()) : Math.round((Date.now() - (ui.c.t0[skill] || Date.now())) / 1000), timed,
    };
    // On the clock, the time saved is the clock's (pauses left out), with the clock's length, so the pace ladder
    // can tell whether the set was done inside it.
    if (timed) doc.clock = timer.total;
    // Claude's sets exist only in this page's memory, so the attempt keeps a copy to reopen from the history.
    if (set.src === "claude") doc.snap = snapOf(set);
    put("comp", id, doc);
    ipDrop(compIpId(skill, set.id));
    ui.c.open[doc.theme ? `${skill}:t:${doc.theme}` : `${skill}:g:mixed`] = true;
    ui.c.open[`${skill}:s:${doc.setId}`] = true;
    autoTick("comp." + skill);
    // Every check starts with the right answers hidden, and the transcript closed with them.
    ansHide(set.id, true);
    if (skill === "co") ui.c.script = false;
    render(true);
  }
  // Shows or hides a checked set's answers (and, for listening, the transcript with them).
  function compAnsToggle(skill, show) {
    const set = ui.c.set[skill];
    if (!set || !ui.c.submitted[skill]) return;
    ansHide(set.id, !show);
    if (skill === "co") ui.c.script = show;
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
  // What an attempt keeps of a Claude set so it can be opened again later.
  const snapOf = (set) => ({
    level: set.level, type: set.type || "", title: set.title, text: set.text || "", context: set.context || "", lines: arr(set.lines), theme: set.theme || "", themes: arr(set.themes),
    questions: set.questions.map((q) => Object.assign({ q: q.q, options: q.options, answer: q.answer, why: q.why }, q.doc ? { doc: q.doc } : {})),
  });
  // Put a set from the history tree back on the page: a built-in set by id, or a Claude set from the copy
  // saved with an attempt. The level and topic follow the set, so ensureCompSet keeps it.
  function compLoad(skill, setId, attempt) {
    const all = samplesFor(skill);
    const i = all.findIndex((s) => s.id === setId);
    const snap = i >= 0 ? null : (attempt && attempt.snap) || (compAttempts(skill).find((a) => a.setId === setId && a.snap) || {}).snap;
    const base = i >= 0 ? all[i] : snap;
    if (!base) { toast("This set's text wasn't saved, so it can't be opened again."); return false; }
    ui.c.skill = skill;
    ui.c.lv[skill] = base.level || ui.c.lv[skill];
    ui.c.theme = arr(base.themes).includes(ui.c.theme) ? ui.c.theme : base.theme || arr(base.themes)[0] || "";
    const key = compKey(skill);
    compReset(skill);
    ui.c.set[skill] = i >= 0 ? sampleSet(skill, i, key) : prepSet(Object.assign(clone(snap), { id: setId, src: "claude", key }));
    compRestore(skill);
    return true;
  }
  // Show a past attempt: its set, the answers given, the right ones and the explanations.
  function compReview(skill, attemptId) {
    const a = compAttempts(skill).find((x) => x.id === attemptId);
    if (!a || !compLoad(skill, a.setId, a)) return;
    ui.c.ans[skill] = {};
    arr(a.answers).forEach((k, i) => { if (k != null) ui.c.ans[skill][i] = k; });
    ui.c.submitted[skill] = true;
    ui.c.saved[skill] = a.id;
    ui.c.review[skill] = a;
    if (skill === "co") ui.c.script = !ansHidden(a.setId);
  }

  // After a reading set: the last three sets at its level, next to the phase goal of 70%, and where that
  // level sits on the real test. One set is too short for a 100–699 score; the Examen blanc estimates one.
  function ceTrend(lvl) {
    const L = TC.ceLevels[lvl];
    const xs = list("comp").filter((c2) => c2.skill === "ce" && c2.level === lvl && c2.total).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 3);
    const right = xs.reduce((n, c2) => n + c2.score, 0), total = xs.reduce((n, c2) => n + c2.total, 0);
    const pc = Math.round((100 * right) / total);
    const trend = !total ? "" : xs.length > 1 ? `Your last ${xs.length} ${lvl} sets: ${pc}% right, and the phase goal is 70%. ` : `Your last ${lvl} set: ${pc}% right, and the phase goal is 70%. `;
    return `${trend}${L ? `${lvl} items are questions ${L.items} on the real test. ` : ""}One set is too short for a 100–699 score; the Examen blanc estimates one.`;
  }

  /* =============== comprehension history =============== */
  const mins = (secs) => (secs > 0 && secs < 7200 ? `${Math.max(1, Math.round(secs / 60))} min` : "");
  const cefrOf = (v) => ["A1", "A2", "B1", "B2", "C1", "C2"][Math.max(0, Math.min(5, Math.floor((v - 100) / 100)))];
  const scorePill = (a) => `<span class="pill ${a.total && a.score / a.total >= 0.7 ? "ok" : ""}">${a.score}/${a.total}</span>`;
  const nclcTag = (v, skill) => { const n = nclcOf(skill || "ce", v); return `<span class="tag7 ${n >= 7 ? "ok" : "no"}">NCLC ${nclcLabel(n)}</span>`; };
  const levelCounts = (b) => (b ? Object.entries(b).map(([l, v]) => `${l} ${v[0]}/${v[1]}`).join(" · ") : "");
  // A branch of the tree. Its open state lives in ui.c.open, because render() replaces the whole view.
  const branch = (id, summary, body) => `<details class="h-node" data-node="${esc(id)}" ${ui.c.open[id] ? "open" : ""}><summary>${summary}</summary><div class="h-kids">${body}</div></details>`;

  // One attempt at a set: date, score, time taken, and the questions missed with their gap tags.
  function attemptRow(skill, a, qs) {
    const gaps = a.gaps || {};
    const hasAns = !!qs && Array.isArray(a.answers);
    const missed = hasAns ? qs.map((q, i) => (a.answers[i] === q.answer ? -1 : i)).filter((i) => i >= 0) : Object.keys(gaps).map(Number);
    const tags = missed.map((i) => `<span class="miss">Q${i + 1} ✗${gaps[i] ? " · " + (gaps[i] === "vocab" ? "vocabulary" : "comprehension") : ""}</span>`).join("");
    return `<div class="h-att"><span class="num">${shortDate(a.date)}</span>${scorePill(a)}${mins(a.secs) ? `<span class="small muted">${mins(a.secs)}</span>` : ""}${a.timed ? `<span class="pill info">timed</span>` : ""}${tags}${hasAns ? `<button class="btn ghost sm" data-act="c-review" data-skill="${skill}" data-id="${esc(a.id)}">Review</button>` : ""}</div>`;
  }
  // A set: started and not finished yet (with Resume), or its attempts, newest first.
  function setBranch(skill, set, st) {
    const head = `<span class="lv">${esc(set.level || "")}</span><span class="h-name">${typo(set.title)}</span>${set.type ? `<span class="small muted">${esc(set.type)}</span>` : ""}${set.src === "claude" ? `<span class="pill info">from Claude</span>` : set.src === "retired" ? `<span class="pill">earlier version</span>` : ""}`;
    const open = `data-act="c-open" data-skill="${skill}" data-set="${esc(set.id)}"`;
    // A set you've started but not submitted says so, and opening it brings your answers back. Resuming
    // goes through its in-progress record, which also holds the copy of a Claude set never finished.
    const ip = ipGet(compIpId(skill, set.id));
    const going = ip ? `<span class="pill warn">In progress · ${Object.keys(ip.answers || {}).length}/${ip.total || arr(set.questions).length}</span>` : "";
    if (!st) return `<div class="h-row">${head}${going}<span class="h-meta"></span>${ip ? `<button class="btn sm primary" data-act="ip-resume" data-id="${esc(compIpId(skill, set.id))}">Resume</button>` : `<button class="btn sm" ${open}>Open</button>`}</div>`;
    const n = st.attempts.length;
    const meta = `${n} attempt${n > 1 ? "s" : ""} · best ${st.best ? `${st.best.score}/${st.best.total}` : "—"} · last ${shortDate(st.attempts[0].date)}`;
    const body = st.attempts.map((a) => attemptRow(skill, a, set.questions)).join("")
      + (set.questions ? `<div class="row"><button class="btn sm ${ip ? "primary" : ""}" ${open}>${ip ? "Resume your new attempt" : "Retake this set"}</button></div>`
        : `<p class="small muted">${set.src === "retired" ? "This set has since been replaced, so it can't be opened again." : "This set's text wasn't saved, so it can't be opened again."}</p>`);
    return branch(`${skill}:s:${set.id}`, `${head}${going}<span class="h-meta">${meta}</span>`, body);
  }
  // When a set was last touched: its latest attempt, or your latest answer if it's in progress. The tree is
  // ordered by it, newest first, like every history on the site.
  const setLast = (skill, s, stats) => Math.max((stats.get(s.id) || {}).last || 0, (ipGet(compIpId(skill, s.id)) || {}).updated || 0);
  const byLast = (skill, stats) => (a, b) => setLast(skill, b, stats) - setLast(skill, a, stats);
  // A topic: the sets finished or started, with a badge for each level that has one finished (✓ all of
  // that level, 1/2 some). A topic with nothing to list is left out.
  function topicBranch(skill, t, sets, stats) {
    const shown = sets.filter((s) => stats.has(s.id) || ipGet(compIpId(skill, s.id))).sort(byLast(skill, stats));
    if (!shown.length) return null;
    const lv = ["B1", "B2"].map((l) => {
      const at = sets.filter((s) => s.level === l && s.src === "sample");
      const done = at.filter((s) => stats.has(s.id));
      if (!done.length) return "";
      const best = at.length === 1 ? stats.get(done[0].id).best : null;
      const txt = done.length < at.length ? `${l} ${done.length}/${at.length}` : (best ? `${l} ✓ best ${best.score}/${best.total}` : `${l} ✓`);
      return `<span class="lv ${done.length === at.length ? "done" : ""}">${txt}</span>`;
    }).join("");
    const n = sets.reduce((x, s) => x + (stats.has(s.id) ? stats.get(s.id).attempts.length : 0), 0);
    return { html: branch(`${skill}:t:${t.id}`, `<span class="h-name">${esc(t.label)}</span>${lv}<span class="h-meta">${n ? `${n} attempt${n > 1 ? "s" : ""}` : "in progress"}</span>`, shown.map((s) => setBranch(skill, s, stats.get(s.id))).join("")), last: setLast(skill, shown[0], stats) };
  }
  // Practice exams done or in progress: the built-in ones and Claude's.
  function examsBranch(attempts, skill) {
    const X = XSPEC[skill];
    const done = attempts.filter((a) => a.kind === "exam");
    const builtIn = X.bank();
    const paused = ipGet(X.ip);
    const lastOf = (id) => Math.max((done.find((a) => a.setId === id) || {}).ts || 0, paused && paused.examId === id ? paused.updated || 0 : 0);
    const ids = [...new Set(done.map((a) => a.setId).concat(paused ? [paused.examId] : []))].sort((a, b) => lastOf(b) - lastOf(a));
    if (!ids.length) return null;
    const rows = ids.map((id) => {
      const ex = builtIn.find((e) => e.id === id);
      const as = done.filter((a) => a.setId === id);
      const title = ex ? ex.title : as.length ? as[0].title : paused.title;
      const src = ex ? "" : /claude/.test(str((as[0] || paused).src)) ? `<span class="pill info">from Claude</span>` : `<span class="pill">earlier version</span>`;
      const head = `<span class="lv">A1–C2</span><span class="h-name">${esc(title)}</span>${src}`;
      const going = paused && paused.examId === id ? `<span class="pill warn">In progress · ${esc(ipProgress(paused))}</span>` : "";
      if (!as.length) return `<div class="h-row">${head}${going}<span class="h-meta"></span><button class="btn sm primary" data-act="ip-resume" data-id="${X.ip}">Resume</button></div>`;
      const R = retakeIds(), first = as.find((a) => !R.has(a.id)) || as[as.length - 1];
      const body = as.map((a) => `<div class="h-att"><span class="num">${shortDate(a.date)}</span><span class="pill">≈${a.est}</span>${nclcTag(a.est, skill)}${R.has(a.id) ? `<span class="pill info">retake · not counted</span>` : ""}<span class="small muted">${a.score}/${a.total}${mins(a.secs) ? " · " + mins(a.secs) : ""}${a.timeUp ? " · time ran out" : ""}</span><span class="small muted">${levelCounts(a.byLevel)}</span>${ex || a.snap ? `<button class="btn ghost sm" data-act="x-review" data-id="${esc(a.id)}">Review</button>` : ""}</div>`).join("");
      return branch(`${skill}:x:${id}`, `${head}${going}<span class="h-meta">${as.length > 1 ? `${as.length} attempts · ≈${first.est} on the first try` : `1 attempt · ≈${first.est}`} · last ${shortDate(as[0].date)}</span>`, body);
    }).join("");
    const last = done[0];
    return { html: branch(`${skill}:g:exams`, `<span class="h-name">Examens blancs</span><span class="h-meta">${last ? `${done.length} exam${done.length > 1 ? "s" : ""} · last ≈${last.est}, NCLC ${nclcLabel(nclcOf(skill, last.est))}${retakeIds().has(last.id) ? " (a retake)" : ""}` : "in progress"}</span>`, rows), last: lastOf(ids[0]) };
  }
  // Everything done in one skill, as a tree: topic → set → attempt, with practice exams, Claude sets with no
  // topic, built-in sets since replaced and scores logged from elsewhere alongside. Only sets you've finished
  // or started are listed, and every level of the tree is newest first.
  function historyTree(skill) {
    const attempts = compAttempts(skill);
    const stats = compStats(skill, attempts);
    const builtins = samplesFor(skill).map((s) => Object.assign({}, s, { src: "sample" }));
    // Claude's sets, taken from their attempts: the newest title and level, and the saved text if there is one.
    // A built-in set that has since been replaced keeps its attempts, without its text.
    const claude = new Map(), retired = new Map();
    for (const a of attempts) {
      if (a.kind === "exam" || !a.setId) continue;
      if (a.src === "claude") {
        const c = claude.get(a.setId) || { id: a.setId, level: a.level, title: a.title, theme: a.theme || "", src: "claude", type: "", questions: null };
        if (!c.questions && a.snap) Object.assign(c, { type: a.snap.type || "", questions: arr(a.snap.questions) });
        claude.set(a.setId, c);
      } else if (a.src === "sample" && !builtins.some((s) => s.id === a.setId) && !retired.has(a.setId)) {
        retired.set(a.setId, { id: a.setId, level: a.level, title: a.title, src: "retired", type: "", questions: null });
      }
    }
    // A Claude set started but never finished exists only in its in-progress record, which keeps a copy of it.
    for (const ip of list("inprogress")) {
      if (ip.kind !== "comp" || ip.skill !== skill || ip.src !== "claude" || !ip.setId || claude.has(ip.setId)) continue;
      const snap = ip.snap || {};
      claude.set(ip.setId, { id: ip.setId, level: ip.level, title: ip.title, theme: ip.theme || "", src: "claude", type: snap.type || "", questions: arr(snap.questions) });
    }
    const claudeSets = [...claude.values()];
    const done = builtins.filter((s) => stats.has(s.id)).length;
    const practice = attempts.filter((a) => a.src !== "logged" && a.kind !== "exam").length;
    const groups = COMP_TOPICS.map((t) => topicBranch(skill, t, builtins.filter((s) => arr(s.themes).includes(t.id)).concat(claudeSets.filter((c) => c.theme === t.id)), stats)).filter(Boolean);
    const exams = examsBranch(attempts, skill);
    if (exams) groups.push(exams);
    // A group of sets: listed newest first, and placed by its newest.
    const setGroup = (id, name, meta, sets) => { const xs = sets.slice().sort(byLast(skill, stats)); groups.push({ html: branch(id, `<span class="h-name">${name}</span><span class="h-meta">${meta}</span>`, xs.map((s) => setBranch(skill, s, stats.get(s.id))).join("")), last: setLast(skill, xs[0], stats) }); };
    const mixed = claudeSets.filter((c) => !COMP_TOPICS.some((t) => t.id === c.theme));
    if (mixed.length) setGroup(`${skill}:g:mixed`, "Sujets variés", "Claude sets with no topic", mixed);
    if (retired.size) setGroup(`${skill}:g:retired`, "Earlier sets", "built-in sets since replaced", [...retired.values()]);
    const logged = attempts.filter((a) => a.src === "logged");
    if (logged.length) groups.push({ html: branch(`${skill}:g:logged`, `<span class="h-name">Logged from elsewhere</span><span class="h-meta">${logged.length} score${logged.length > 1 ? "s" : ""}</span>`, logged.map((a) => `<div class="h-att"><span class="num">${shortDate(a.date)}</span>${scorePill(a)}<span>${esc(a.title)}</span><span class="lv">${esc(a.level || "")}</span></div>`).join("")), last: logged[0].ts || 0 });
    groups.sort((a, b) => b.last - a.last);
    return `<section class="sec" id="c-hist">
      <div class="sec-head"><h2 class="h2">Your ${skill === "ce" ? "reading" : "listening"} history</h2><span class="small muted">${done} of ${builtins.length} built-in sets done · ${practice} attempt${practice === 1 ? "" : "s"}, newest first</span></div>
      ${groups.length ? "" : `<p class="small muted">Nothing yet. Your first set becomes your baseline.</p>`}
      <div class="tree">${groups.map((g) => g.html).join("")}</div>
    </section>`;
  }

  /* =============== practice exams (Examens blancs) =============== */
  // CE: 39 items in 60 minutes, one document each, in the level blocks of TCF_CANADA.ceExam. CO: 39 items in
  // 35 minutes that run by themselves, each recording heard once (TCF_CANADA.coExam, and the CO exam below).
  // The estimate adds the points of the items answered correctly; the official scale starts at 100. One exam
  // is taken at a time (ui.cx, with its skill), and each skill keeps its own unfinished record.
  const goTo = (hash) => { if (location.hash === hash) render(true); else location.hash = hash; };
  const XSPEC = {
    ce: { spec: TC.ceExam, bank: () => T.COMP.ceExams || [], home: "comp.ce.exam", label: "Examen blanc CE", ip: "exam--ce" },
    co: { spec: TC.coExam, bank: () => T.COMP.coExams || [], home: "comp.co.exam", label: "Examen blanc CO", ip: "exam--co" },
  };
  // Exams and records from before the CO exam have no skill: they're reading exams.
  const skillOf = (x) => (x && x.skill === "co" ? "co" : "ce");
  const examRunning = () => !!(ui.cx && !ui.cx.done);
  // Options read aloud keep the order they're heard in; written ones are shuffled.
  const examOrder = (it) => (it.kind === "pic" || it.kind === "reply" ? [0, 1, 2, 3] : shuffle(it.options.map((_, j) => j)));
  // Claude's exams exist only in this page's memory, so their attempts and records keep a copy.
  const examSnap = (ex) => ({ id: ex.id, title: ex.title, src: "claude", items: ex.items.map((it) => { const o = Object.assign({}, it); delete o.order; return o; }) });
  function examScore(exam, ans, skill) {
    const pts = Object.fromEntries(XSPEC[skill].spec.blocks.map(([l, , p]) => [l, p]));
    const byLevel = {};
    let correct = 0, raw = 0;
    exam.items.forEach((it, i) => {
      const b = (byLevel[it.level] = byLevel[it.level] || [0, 0]);
      b[1]++;
      if (ans[i] === it.answer) { b[0]++; correct++; raw += pts[it.level] || 0; }
    });
    return { correct, total: exam.items.length, byLevel, est: Math.min(699, Math.max(100, raw)) };
  }
  function examStart(exam, skill) {
    skill = skill || "ce";
    if (examRunning()) { goTo("#" + XSPEC[skillOf(ui.cx)].home); return; }
    const X = XSPEC[skill];
    const ex = clone(exam);
    ex.src = ex.src || "built-in";
    ex.items.forEach((it) => { it.order = examOrder(it); });
    ui.cx = { skill, exam: ex, i: 0, ans: {}, done: false, confirm: false, quit: false, attemptId: null, result: null, t0: Date.now() };
    if (exam === ui.cxReady) ui.cxReady = null;
    timerSet(X.spec.minutes * 60, X.label, X.home);
    tone("start");
    timerStart();
    if (skill === "co") { stopAudio(); ui.cx.play = coxFresh(ex.items[0]); coxUnlock(); coxDurations(ex); examKeep(); tone("beep", 0.35); }
    goTo("#" + X.home);
    window.scrollTo(0, 0);
    if (skill === "co") coxRun();
  }
  function examSubmit(reason) {
    const cx = ui.cx;
    if (!cx || cx.done) return;
    const skill = skillOf(cx), X = XSPEC[skill];
    const secs = timer.home === X.home ? Math.round(timer.total - timerRemaining()) : Math.round((Date.now() - cx.t0) / 1000);
    timerSet(0, "", ""); // stops the exam clock and hides it from the sidebar
    if (skill === "co") coxStop();
    const r = examScore(cx.exam, cx.ans, skill);
    const id = uid();
    Object.assign(cx, { done: true, confirm: false, quit: false, attemptId: id, result: Object.assign(r, { secs, timeUp: reason === "time", date: todayStr() }) });
    const doc = {
      skill, kind: "exam", level: "A1–C2", title: cx.exam.title, theme: "", date: todayStr(), ts: Date.now(),
      score: r.correct, total: r.total, src: cx.exam.src === "claude" ? "exam-claude" : "exam", gaps: {},
      setId: cx.exam.id, answers: cx.exam.items.map((_, i) => (cx.ans[i] == null ? null : cx.ans[i])),
      secs, timed: true, timeUp: reason === "time", est: r.est, byLevel: r.byLevel,
    };
    if (cx.exam.src === "claude") doc.snap = examSnap(cx.exam);
    put("comp", id, doc);
    // Every practice exam goes into the score log that the Phase 4–5 criteria read, labelled as an estimate.
    put("mocks", uid(), { date: todayStr(), ts: Date.now(), label: `${cx.exam.title} · ${skill.toUpperCase()} (site estimate)`, [skill]: r.est, compId: id });
    ipDrop(X.ip);
    ui.c.open[`${skill}:g:exams`] = true;
    ui.c.open[`${skill}:x:${cx.exam.id}`] = true;
    autoTick(X.home);
    ansHide(cx.exam.id, true); // its right answers wait until you show them, like a set's
    toast(reason === "time" ? "Time's up: your exam was handed in, and its estimated score added to Progress."
      : reason === "end" ? "That was the last question. The estimated score is also in Progress → Scores and NCLC."
      : "Handed in. The estimated score is also in Progress → Scores and NCLC.");
    render(true);
    window.scrollTo(0, 0);
  }
  // A reading exam is kept from its first answer, with the time left on its clock. A listening exam runs by
  // itself, so it's kept from its start, with its phase and how far into the recording it was.
  function examKeep() {
    const cx = ui.cx;
    if (!cx || cx.done) return;
    const skill = skillOf(cx), X = XSPEC[skill];
    if (skill === "ce" && !Object.keys(cx.ans).length) return;
    const left = timer.home === X.home ? Math.max(0, Math.round(timerRemaining())) : null;
    const doc = { kind: "exam", skill, title: cx.exam.title, route: X.home, examId: cx.exam.id, src: cx.exam.src, total: cx.exam.items.length, ans: cx.ans, i: cx.i, left };
    if (skill === "co" && cx.play) Object.assign(doc, { phase: cx.play.phase, phaseLeft: Math.round(cx.play.left * 10) / 10, pos: Math.round(coxPos() * 10) / 10 });
    if (cx.exam.src === "claude") doc.snap = examSnap(cx.exam);
    ipSave(X.ip, doc);
  }
  // Pick the exam up again; the clock carries on from the time that was left, and a listening exam from its phase.
  function examResume(ip) {
    if (examRunning()) { goTo("#" + XSPEC[skillOf(ui.cx)].home); return; }
    const skill = skillOf(ip), X = XSPEC[skill];
    const base = X.bank().find((e) => e.id === ip.examId) || ip.snap;
    if (!base) { toast("This exam's text wasn't saved, so it can't be picked up again."); return; }
    const ex = clone(base);
    ex.src = ex.src || ip.src || "built-in";
    ex.items.forEach((it) => { it.order = examOrder(it); });
    ui.cx = { skill, exam: ex, i: Math.max(0, Math.min(Number(ip.i) || 0, ex.items.length - 1)), ans: Object.assign({}, ip.ans), done: false, confirm: false, quit: false, attemptId: null, result: null, t0: Date.now() };
    const full = X.spec.minutes * 60;
    timerSet(full, X.label, X.home);
    if (ip.left != null) timer.left = Math.min(full, Math.max(0, Number(ip.left)));
    tone("start");
    timerStart();
    if (skill === "co") {
      stopAudio();
      const p = coxFresh(ex.items[ui.cx.i]);
      if (["read", "listen", "answer"].includes(ip.phase)) Object.assign(p, { phase: ip.phase, left: Number(ip.phaseLeft) > 0 ? Number(ip.phaseLeft) : p.left, pos: Number(ip.pos) || 0 });
      ui.cx.play = p;
      coxUnlock();
      coxDurations(ex);
    }
    goTo("#" + X.home);
    window.scrollTo(0, 0);
    if (skill === "co") coxRun();
  }
  function examReview(attemptId) {
    if (examRunning()) { toast("Finish or quit the exam in progress first."); return; }
    const a = list("comp").find((x) => x.id === attemptId && x.kind === "exam");
    const skill = skillOf(a), X = XSPEC[skill];
    const exam = a && (X.bank().find((e) => e.id === a.setId) || a.snap);
    if (!exam) { toast("This exam's text wasn't saved, so it can't be reviewed."); return; }
    const ex = clone(exam);
    ex.items.forEach((it) => { it.order = it.options.map((_, j) => j); });
    const ans = {};
    arr(a.answers).forEach((k, i) => { if (k != null) ans[i] = k; });
    ui.cx = { skill, exam: ex, i: 0, ans, done: true, confirm: false, quit: false, attemptId: a.id, result: { correct: a.score, total: a.total, est: a.est, byLevel: a.byLevel, secs: a.secs, timeUp: a.timeUp, date: a.date, review: true } };
    goTo("#" + X.home);
  }

  /* ---------- the CO exam, item by item ---------- */
  // As on the real test, each item runs by itself and takes its own fixed time: a beep, a pause to read (the
  // picture or the written options), the recording once (a document's ends with its question, read by the
  // narrator), then a short window to answer. When the window ends the next item starts, whether you've answered
  // or not: no going back and no going faster. The clock on screen is the item's (the 35 minutes still run behind
  // it, and the schedule fits inside them). Pause stops the clock, the countdown and the recording together;
  // leaving the page or the tab pauses too, and a refresh brings the exam back paused.
  let coxAudio = null, coxSrc = "", coxTick = 0, coxToken = 0;
  const coxReadSecs = (it) => (it.kind === "reply" ? TC.coExam.read.reply : TC.coExam.read[it.level]);
  const coxFresh = (it) => ({ phase: "read", left: coxReadSecs(it), pos: 0, paused: false });
  // Each recording's length, read from its file's header when the exam starts, so an item's clock is known from
  // its first second. Until it's in (or for the browser's voice), the middle of the level's range stands in.
  const coxDur = {};
  function coxDurations(exam) {
    exam.items.forEach((it) => {
      if (!it.audio || coxDur[it.audio]) return;
      try { const a = new Audio(); a.preload = "metadata"; a.onloadedmetadata = () => { if (isFinite(a.duration)) coxDur[it.audio] = a.duration; }; a.src = it.audio; } catch (_) {}
    });
  }
  const coxLen = (it) => (it.audio && coxSrc === it.audio && coxAudio && isFinite(coxAudio.duration) && coxAudio.duration) || coxDur[it.audio] || (() => { const r = (TC.coLevels[it.level] || {}).secs || [20, 40]; return (r[0] + r[1]) / 2; })();
  // What's left of the current item: its reading pause, the rest of the recording and the window to answer.
  function coxItemLeft(cx) {
    const p = cx.play, it = cx.exam.items[cx.i], ans = TC.coExam.answer[it.level], len = coxLen(it);
    if (p.phase === "read") return { left: p.left + len + ans, all: coxReadSecs(it) + len + ans };
    if (p.phase === "listen") return { left: Math.max(0, len - coxPos()) + ans, all: coxReadSecs(it) + len + ans };
    return { left: p.left, all: coxReadSecs(it) + len + ans };
  }
  const coxPos = () => { const p = ui.cx && ui.cx.play; if (!p || p.phase !== "listen") return 0; return coxAudio && coxSrc && !p.paused ? coxAudio.currentTime || 0 : p.pos || 0; };
  // How much of the recording has played, in %, so a redraw (an answer saved, a pause) draws the bar where it is.
  const coxHeardPct = (it) => { const len = coxLen(it); return len ? Math.min(100, (coxPos() / len) * 100) : 0; };
  // One Audio element plays the whole exam. Playing it once inside the click that starts or resumes the exam
  // lets the later items play by themselves, which Safari on iPhone would otherwise block.
  function coxUnlock() {
    if (!coxAudio) coxAudio = new Audio();
    if (coxSrc) return;
    try { coxAudio.src = SILENT; const pr = coxAudio.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (_) {}
  }
  function coxStop() {
    clearInterval(coxTick);
    coxTick = 0;
    coxToken++;
    if (coxAudio) { try { coxAudio.pause(); } catch (_) {} }
    try { if (synth) synth.cancel(); } catch (_) {}
  }
  // Starts, or carries on, the current item's phase.
  function coxRun() {
    clearInterval(coxTick);
    coxTick = 0;
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co" || !cx.play || cx.play.paused) return;
    const p = cx.play;
    if (p.phase === "listen") { coxListen(); return; }
    let last = Date.now();
    coxTick = setInterval(() => {
      const now = Date.now();
      p.left -= (now - last) / 1000;
      last = now;
      if (p.left > 0) { paintCox(); return; }
      clearInterval(coxTick);
      coxTick = 0;
      if (p.phase === "read") { p.phase = "listen"; p.pos = 0; render(true); coxListen(); } else coxNext();
    }, 200);
    paintCox();
  }
  function coxListen() {
    const cx = ui.cx, p = cx.play, it = cx.exam.items[cx.i];
    const token = ++coxToken;
    if (!coxAudio) coxAudio = new Audio();
    const a = coxAudio;
    a.onended = () => { if (token === coxToken) coxHeard(); };
    a.ontimeupdate = () => { if (token === coxToken) paintCox(); };
    // A recording that can't load is read by the browser's French voice instead.
    a.onerror = () => { if (token !== coxToken || !coxSrc) return; coxSrc = ""; coxSpeak(it, token); };
    const at = p.pos || 0;
    if (coxSrc !== it.audio) {
      coxSrc = it.audio;
      a.onloadedmetadata = at ? () => { if (token === coxToken) { try { a.currentTime = at; } catch (_) {} } } : null;
      a.src = it.audio;
    } else if (at) { try { a.currentTime = at; } catch (_) {} }
    const pr = a.play();
    if (pr && pr.catch) pr.catch((e) => {
      if (token !== coxToken || (e && e.name === "AbortError")) return;
      // Not allowed to play by itself (after a refresh, say): the exam waits for Resume.
      if (e && e.name === "NotAllowedError") { coxPause(); return; }
      a.onerror();
    });
  }
  function coxSpeak(it, token) {
    if (!synth) { coxHeard(); return; }
    const v = bestVoice();
    let k = 0;
    const next = () => {
      if (token !== coxToken) return;
      if (k >= it.lines.length) { coxHeard(); return; }
      const u = new SpeechSynthesisUtterance(ttsText(it.lines[k++].text));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "fr-FR";
      let done = false;
      const go = () => { if (done) return; done = true; setTimeout(next, 600); };
      u.onend = go;
      u.onerror = go;
      synth.speak(u);
    };
    next();
  }
  // The recording has ended: a few seconds to answer.
  function coxHeard() {
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co") return;
    cx.play = { phase: "answer", left: TC.coExam.answer[cx.exam.items[cx.i].level], pos: 0, paused: false };
    examKeep();
    render(true);
    coxRun();
  }
  // On to the next item, or hand in after the last one.
  function coxNext() {
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co") return;
    coxStop();
    if (cx.i >= cx.exam.items.length - 1) { examSubmit("end"); return; }
    cx.i++;
    cx.play = coxFresh(cx.exam.items[cx.i]);
    examKeep();
    tone("beep");
    render(true);
    window.scrollTo(0, 0);
    coxRun();
  }
  function coxPause(quiet) {
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co" || !cx.play || cx.play.paused) return;
    cx.play.pos = coxPos();
    cx.play.paused = true;
    coxStop();
    timerPause();
    examKeep();
    if (!quiet) render(true);
  }
  function coxResume() {
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co" || !cx.play || !cx.play.paused) return;
    cx.play.paused = false;
    coxUnlock();
    timerStart();
    render(true);
    coxRun();
  }
  // The countdown and the recording's progress change in place, without redrawing the page.
  function paintCox() {
    const cx = ui.cx;
    if (!cx || cx.done || cx.skill !== "co" || !cx.play) return;
    const left = Math.max(0, Math.ceil(cx.play.left)) + " s";
    document.querySelectorAll("[data-cox-left]").forEach((el) => { el.textContent = left; });
    const w = coxHeardPct(cx.exam.items[cx.i]);
    document.querySelectorAll("[data-cox-bar]").forEach((el) => { el.style.width = w + "%"; });
    const q = coxItemLeft(cx), qw = Math.max(0, Math.min(100, (q.left / q.all) * 100));
    document.querySelectorAll("[data-cox-q]").forEach((el) => { el.textContent = fmtClock(Math.max(0, q.left)); });
    document.querySelectorAll("[data-cox-qbar]").forEach((el) => { el.style.width = qw + "%"; });
  }
  // A drawing from exam-co.js, in the page's ink. During the exam it's hidden from screen readers, since a
  // description would give the answer away; the review describes it.
  const sceneSvg = (art, label) => `<svg class="scene" viewBox="0 0 320 200" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${esc(label)}"` : `aria-hidden="true"`}>${art}</svg>`;
  const COX_CONSIGNE = {
    pic: "Écoutez les quatre propositions. Choisissez celle qui correspond à l'image.",
    reply: "Écoutez la question et les quatre réponses. Choisissez la réponse qui convient.",
    doc: "Écoutez le document et la question. Choisissez la bonne réponse.",
  };
  function coxView(cx, back) {
    const it = cx.exam.items[cx.i], n = cx.exam.items.length, p = cx.play || coxFresh(it);
    const paused = !!p.paused;
    const q = coxItemLeft(Object.assign({}, cx, { play: p }));
    const clock = `<div class="timer cox-clock" title="This question's time: reading, the recording and the answer. The next one starts by itself when it runs out."><span class="clock" data-cox-q>${fmtClock(Math.max(0, q.left))}</span><button class="btn sm" data-act="${paused ? "cox-resume" : "cox-pause"}">${paused ? "Resume" : "Pause"}</button><div class="bar cox-qbar" aria-hidden="true"><i data-cox-qbar style="width:${Math.max(0, Math.min(100, (q.left / q.all) * 100))}%"></i></div></div>`;
    const strip = `<div class="qnav cox-strip" aria-label="Progress: question ${cx.i + 1} of ${n}">${cx.exam.items.map((x, j) => `<span class="${cx.ans[j] != null ? "done" : ""}"${cx.ans[j] != null ? ` data-m="pop" data-k="xs-${esc(cx.exam.id)}-${j}"` : ""} ${j === cx.i ? `aria-current="true"` : ""}>${j + 1}</span>`).join("")}</div>`;
    const phase = p.phase === "read" ? `<span class="pill">Lecture</span><span class="small muted">The recording starts in <b class="num" data-cox-left>${Math.ceil(p.left)} s</b></span>`
      : p.phase === "listen" ? `<span class="pill info">Écoute</span><div class="bar cox-bar" aria-hidden="true"><i data-cox-bar style="width:${coxHeardPct(it)}%"></i></div>`
      : `<span class="pill warn">Réponse</span><span class="small muted">Time left to answer: <b class="num" data-cox-left>${Math.ceil(p.left)} s</b></span>`;
    const pick = (k, label) => `<label class="opt${it.kind === "doc" ? "" : " letter"}"><input type="radio" name="x${cx.i}" data-change="x-ans" data-k="${k}" ${cx.ans[cx.i] === k ? "checked" : ""}><span>${label}</span></label>`;
    const body = it.kind === "doc"
      ? `${p.phase === "answer" ? `<p class="fr"><b>${typo(it.q)}</b></p>` : ""}<div class="opts">${it.order.map((k) => pick(k, typo(it.options[k]))).join("")}</div>`
      : `<div class="letters" role="group" aria-label="Your answer">${it.order.map((k) => pick(k, "ABCD"[k])).join("")}</div>`;
    return `${back}
      <div class="row between"><p class="h3">Question ${cx.i + 1} of ${n} <span class="lv">${esc(it.level)}</span></p>${clock}</div>
      ${strip}
      ${paused ? `<div class="notice">Paused, with the clock. Resume to carry on${p.phase === "listen" ? " from where the recording stopped" : ""}.</div>` : ""}
      <section class="panel stack cox" data-m="slide" data-k="cox-${esc(cx.exam.id)}-${cx.i}">
        <div class="row cox-phase">${phase}</div>
        <p class="small muted">${COX_CONSIGNE[it.kind]}</p>
        ${it.kind === "pic" ? `<figure class="pic-card seyes">${sceneSvg(it.pic, "")}</figure>` : ""}
        ${body}
        <p class="small muted">Choose at any time${it.kind === "doc" ? "" : " (A–D on the keyboard)"}. When this question's time runs out, the next one starts by itself, as on the real test.</p>
      </section>
      <div class="row">${cx.quit ? `<span class="small">Quit and lose these answers?</span><button class="btn sm danger" data-act="x-quit-yes">Quit the exam</button><button class="btn sm ghost" data-act="x-keep">Keep going</button>` : `<button class="btn ghost sm" data-act="x-quit">Quit without saving</button>`}</div>`;
  }
  // An item's mark in the results: ✓, ✗ or blank. While the answers are hidden only the misses are marked.
  const xMark = (ok, a, hid) => (ok ? (hid ? "" : ` · <span class="ok-t">✓</span>`) : ` · <span class="miss">${a == null ? "blank" : "✗"}</span>`);
  // An item's options in the results: the right one and yours, or while the answers are hidden only yours, in the
  // blue of a selected option.
  const xOpt = (k, it, a, hid, label) => `<div class="opt ${hid ? (k === a ? "picked" : "") : k === it.answer ? "ok" : k === a ? "bad" : ""}"><span>${label}</span></div>`;
  // One item in the results: the drawing or the situation, the transcript, the options with the right one and
  // yours, why, and the recording to play again. While the answers are hidden: the drawing (without the
  // description, which would give the answer away), the question, your pick and the recording.
  function coxReviewItem(it, j, a, hid) {
    const ok = a === it.answer;
    const lettered = it.kind !== "doc";
    const opts = (lettered ? [0, 1, 2, 3] : it.order).map((k) => xOpt(k, it, a, hid, `${lettered ? `<b>${"ABCD"[k]}.</b> ` : ""}${typo(it.options[k])}`)).join("");
    const said = it.lines.filter((l) => l.speaker !== "Q");
    const multi = new Set(said.map((l) => l.speaker)).size > 1;
    const title = it.kind === "pic" ? "Image" : it.kind === "reply" ? "Question et réponses" : esc(it.type || "Document");
    return `<details class="fold"><summary>${j + 1} · ${esc(it.level)}${xMark(ok, a, hid)} · ${title}</summary><div class="stack tight" style="margin-top:10px">
      ${it.kind === "pic" ? `<figure class="pic-card seyes">${sceneSvg(it.pic, hid ? "" : it.alt)}</figure>${hid ? "" : `<p class="small muted fr">${typo(it.alt)}</p>`}` : ""}
      ${it.kind === "doc" && !hid ? `<p class="small muted fr" style="font-style:italic">${typo(it.situation)}</p><div class="transcript">${said.map((l) => `<p>${multi ? `<b class="who">${esc(l.speaker)}</b>` : ""}${typo(l.text)}</p>`).join("")}</div>` : ""}
      ${it.kind !== "pic" ? `<p class="fr"><b>${typo(it.q)}</b></p>` : ""}
      <div class="opts">${opts}</div>
      ${it.why && !hid ? `<p class="small">${typo(it.why)}</p>` : ""}
      ${it.audio ? `<audio class="cox-audio" controls preload="none" src="${esc(it.audio)}"></audio>` : ""}
    </div></details>`;
  }
  // Claude writes a fresh exam in six batches, one per level, each checked before it's kept.
  function examPrompt(lvl, n) {
    return `${EXAM_BRIEF}\n${TC.comp}\n\nWrite ${n} TCF Canada Compréhension écrite items at CEFR ${lvl} for a full practice exam. Each item is its own document in French, with paragraph breaks as \\n\\n, followed by ONE question in French with 4 options in French and exactly one correct. ${ceLevelBrief(lvl)} Vary the topics (daily life, work, housing, health, environment, society, culture, science, education, immigration) and the document types, and set about a third of them in Canada (Québec places, dollars, Canadian vocabulary). ${OPTIONS_RULE} Explain each answer in English, quoting the document.\nReply with only JSON: {"items": [{"type": "document type in French", "title": "short title", "text": "...", "q": "...", "options": ["A", "B", "C", "D"], "answer": 0, "why": "..."}]}`;
  }
  async function examGenerate() {
    if (ui.cxGen || (ui.cx && !ui.cx.done)) return;
    ui.cx = null; // results asked for a new exam close, so its progress and "ready" notice show
    ui.cxGen = { step: 0, total: TC.ceExam.blocks.length, lvl: "", items: [] };
    render(true);
    for (const [lvl, n] of TC.ceExam.blocks) {
      Object.assign(ui.cxGen, { step: ui.cxGen.step + 1, lvl });
      let got = [];
      for (let tries = 0; tries < 2 && got.length < n; tries++) {
        const out = await ask("cx-gen", examPrompt(lvl, n), lvl[0] === "C" ? { tier: "complex" } : undefined);
        if (!ui.cxGen) return; // stopped
        if (!out) { ui.cxGen = null; render(true); return; } // ask() has said why
        got = arr(out.items).filter((x) => x && x.text && x.q && Array.isArray(x.options) && x.options.length === 4 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4)
          .map((x) => ({ level: lvl, type: str(x.type), title: str(x.title), text: str(x.text), q: str(x.q), options: x.options.map(str), answer: x.answer, why: str(x.why) }));
      }
      if (got.length < n) { ui.cxGen = null; toast(`Claude didn't finish the ${lvl} questions. Try again.`); render(true); return; }
      ui.cxGen.items.push(...got.slice(0, n));
    }
    ui.cxReady = { id: "cx-" + uid(), title: `Examen de Claude · ${shortDate(todayStr())}`, src: "claude", items: ui.cxGen.items };
    ui.cxGen = null;
    render(true);
  }
  // A slim panel on each practice page that leads to its exam.
  function examCta(skill) {
    const X = XSPEC[skill];
    // An older copy of data.js or of the page (from the browser's cache) has no listening exam yet.
    if (!X.spec || !X.bank().length) return "";
    const last = compAttempts(skill).find((a) => a.kind === "exam");
    const running = examRunning() && skillOf(ui.cx) === skill;
    const paused = !running && ipGet(X.ip);
    const what = skill === "co" ? "The full listening test: 39 questions in about 35 minutes, from A1 to C2, each recording heard once" : "The full reading test: 39 questions in 60 minutes, from A1 to C2";
    return `<section class="panel flat row between"><div class="stack tight"><p class="h3 with-ico">${ico("exam")}Examen blanc</p><p class="small muted">${what}, with an estimated score and NCLC level.${last ? ` Last one, ${shortDate(last.date)}: ≈${last.est}, NCLC ${nclcLabel(nclcOf(skill, last.est))}${retakeIds().has(last.id) ? " (a retake, not counted)" : ""}.` : ""}</p></div>${paused ? `<button class="btn primary" data-act="ip-resume" data-id="${X.ip}">Resume the exam</button>` : `<a class="btn ${running ? "primary" : ""}" href="#${X.home}">${running ? "Back to the exam" : "Go to the exam"}</a>`}</section>`;
  }
  // While a set is in progress its card steps aside, so the exam stays one tap away beside the tabs.
  function examLink(skill) {
    const X = XSPEC[skill];
    if (!X.spec || !X.bank().length) return "";
    const running = examRunning() && skillOf(ui.cx) === skill;
    const paused = !running && ipGet(X.ip);
    const what = skill === "co" ? "The full listening test: 39 questions in about 35 minutes, from A1 to C2, each recording heard once" : "The full reading test: 39 questions in 60 minutes, from A1 to C2";
    return paused ? `<button class="btn sm" data-act="ip-resume" data-id="${X.ip}" title="${what}" data-m="pop" data-k="exl-${skill}">${ico("exam")}Resume the exam</button>` : `<a class="btn sm${running ? " primary" : ""}" href="#${X.home}" title="${what}" data-m="pop" data-k="exl-${skill}">${ico("exam")}${running ? "Back to the exam" : "Examen blanc"}</a>`;
  }
  // The exam page: Claude writing an exam, an exam in progress, a result (or a past attempt), or the start screen.
  function examView(skill) {
    const X = XSPEC[skill], spec = X.spec;
    const cx = ui.cx && skillOf(ui.cx) === skill ? ui.cx : null;
    const back = `<div><a class="btn ghost sm" href="#comp.${skill}">← ${skill === "co" ? "Listening" : "Practice"} sets</a></div>`;
    if (!spec || !X.bank().length) return `${back}<div class="notice">This exam needs the latest version of the page. Reload it to load the exam.</div>`;
    if (skill === "ce" && ui.cxGen) {
      const g = ui.cxGen;
      return `${back}<section class="panel stack"><p class="h3 thinking">Claude is writing your exam: the ${esc(g.lvl)} questions (${g.step} of ${g.total})</p><p class="small muted">Six batches, from A1 to C2. It usually takes one to three minutes, and you can practise on another page meanwhile.</p><div><button class="btn sm" data-act="x-gen-stop">Stop</button></div></section>`;
    }
    if (cx && !cx.done && skill === "co") return coxView(cx, back);
    if (cx && !cx.done) {
      const it = cx.exam.items[cx.i], n = cx.exam.items.length;
      const answered = Object.keys(cx.ans).length, blanks = n - answered;
      const mine = timer.home === X.home;
      const clock = `<div class="timer"><span class="clock" ${mine ? "data-timer" : ""}>${mine ? fmtClock(timerRemaining()) : "—"}</span>${mine ? `<button class="btn sm" data-act="timer-toggle" data-home="${X.home}" data-sec="${spec.minutes * 60}" data-label="${X.label}" data-timer-btn>${timer.running ? "Pause" : "Resume"}</button>` : ""}</div>`;
      const nav = `<nav class="qnav" aria-label="Questions">${cx.exam.items.map((x, j) => `<button data-act="x-go" data-i="${j}" class="${cx.ans[j] != null ? "done" : ""}"${cx.ans[j] != null ? ` data-m="pop" data-k="xn-${esc(cx.exam.id)}-${j}"` : ""} aria-current="${j === cx.i}" aria-label="Question ${j + 1}${cx.ans[j] != null ? ", answered" : ""}">${j + 1}</button>`).join("")}</nav>`;
      return `${back}
        <div class="row between"><p class="h3">Question ${cx.i + 1} of ${n} <span class="lv">${esc(it.level)}</span></p>${clock}</div>
        ${nav}
        <div class="stack" data-m="slide" data-k="xq-${esc(cx.exam.id)}-${cx.i}"><article class="sheet"><p class="eyebrow">${esc(it.type || "Document")}</p>${it.title ? `<h3>${typo(it.title)}</h3>` : ""}<p class="fr">${typo(it.text)}</p></article>
        <div class="stack tight"><p class="fr"><b>${typo(it.q)}</b></p><div class="opts">${it.order.map((k) => `<label class="opt"><input type="radio" name="x${cx.i}" data-change="x-ans" data-k="${k}" ${cx.ans[cx.i] === k ? "checked" : ""}><span>${typo(it.options[k])}</span></label>`).join("")}</div></div></div>
        <div class="row between"><div class="row"><button class="btn" data-act="x-prev" ${cx.i === 0 ? "disabled" : ""}>← Previous</button><button class="btn" data-act="x-next" ${cx.i === n - 1 ? "disabled" : ""}>Next →</button></div><span class="small muted" id="x-count">${answered} of ${n} answered</span><button class="btn primary" data-act="x-finish">Hand in</button></div>
        ${cx.confirm ? `<div class="notice warn">${blanks} question${blanks > 1 ? "s are" : " is"} still blank and will count as wrong.<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="x-submit">Hand in anyway</button><button class="btn sm" data-act="x-keep">Keep going</button></div></div>` : ""}
        <div class="row">${cx.quit ? `<span class="small">Quit and lose these answers?</span><button class="btn sm danger" data-act="x-quit-yes">Quit the exam</button><button class="btn sm ghost" data-act="x-keep">Keep going</button>` : `<button class="btn ghost sm" data-act="x-quit">Quit without saving</button>`}</div>`;
    }
    if (cx && cx.done) {
      const r = cx.result, retake = retakeIds().has(cx.attemptId);
      const rows = spec.blocks.map(([l, cnt, p]) => { const b = (r.byLevel || {})[l] || [0, cnt]; return `<tr><td>${l}</td><td>${b[0]} / ${b[1]}</td><td>${b[0] * p} / ${b[1] * p}</td></tr>`; }).join("");
      // Every question with your answer. The right ones and why wait until you show them (ansHidden).
      const xhid = ansHidden(cx.exam.id);
      const review = cx.exam.items.map((it, j) => {
        const a = cx.ans[j];
        if (skill === "co") return coxReviewItem(it, j, a, xhid);
        const opts = it.order.map((k) => xOpt(k, it, a, xhid, typo(it.options[k]))).join("");
        return `<details class="fold"><summary>${j + 1} · ${esc(it.level)}${xMark(a === it.answer, a, xhid)} · ${typo(it.title || it.type)}</summary><div class="stack tight" style="margin-top:10px"><article class="sheet"><p class="eyebrow">${esc(it.type || "Document")}</p><p class="fr">${typo(it.text)}</p></article><p class="fr"><b>${typo(it.q)}</b></p><div class="opts">${opts}</div>${it.why && !xhid ? `<p class="small">${typo(it.why)}</p>` : ""}</div></details>`;
      }).join("");
      // What to do next, right from the results: the built-in exams not done yet, a retake, a new one from Claude, or the list.
      const doneIds = new Set(compAttempts(skill).filter((a) => a.kind === "exam").map((a) => a.setId));
      const fresh = X.bank().filter((e) => e.id !== cx.exam.id && !doneIds.has(e.id));
      const next = fresh.map((e) => `<button class="btn primary" data-act="x-start" data-id="${esc(e.id)}">Start ${esc(e.title)}</button>`).join("")
        + `<button class="btn" data-act="x-retake">Retake ${esc(cx.exam.title)}</button>${skill === "ce" ? claudeBtn("cx-gen", "x-gen", "New exam from Claude", "", "btn") : ""}`
        + `<button class="btn ghost" data-act="x-close">All exams</button><a class="btn ghost" href="#progress.scores">Scores and NCLC</a>`;
      return `${back}
        <section class="panel stack" data-m="pop" data-k="xr-${esc(cx.exam.id)}-${esc(r.date)}">
          <p class="eyebrow">${esc(cx.exam.title)} · ${skill === "co" ? "Compréhension orale" : "Compréhension écrite"} · ${r.review ? `your attempt of ${shortDate(r.date)}` : "handed in"}${r.timeUp ? " when time ran out" : ""}</p>
          <div class="row"><span class="scorebig"${!r.review && !retake && (nclcOf(skill, r.est) || 0) >= 7 ? ` data-m="burst" data-k="x7-${esc(cx.exam.id)}-${esc(r.date)}-${r.est}"` : ""}>≈ <span data-tween="xest-${esc(cx.exam.id)}-${esc(r.date)}" data-tw="count" data-to="${r.est}">${r.est}</span></span>${nclcTag(r.est, skill)}<span class="pill">${cefrOf(r.est)}</span>${retake ? `<span class="pill info">retake · not counted</span>` : ""}</div>
          <p class="small">${r.correct} of ${r.total} correct${mins(r.secs) ? ` in ${mins(r.secs)}` : ""}. NCLC 7 in ${skill === "co" ? "listening is 458–502" : "reading is 453–498"}.</p>
          ${greet(...remyScore("exam", r.correct, r.total, { retake, nclc: nclcOf(skill, r.est) || 0 }), "sm")}
          <div class="table-wrap"><table class="nclc"><thead><tr><th>Level</th><th>Correct</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table></div>
          <p class="small muted">${esc(spec.note)}${retake ? " You'd taken this exam before, so you'll have remembered some answers: this score is kept as a retake and doesn't count toward your NCLC estimate." : r.review ? "" : " It has been added to Progress → Scores and NCLC."}</p>
          <div class="row">${next}</div>
          ${retake ? "" : `<p class="small muted">A retake is good practice, but you'll remember some answers, so its score won't count toward your NCLC estimate.</p>`}
        </section>
        <section class="sec"><div class="sec-head"><h2 class="h2">Every question</h2>${xhid ? `<button class="btn primary sm" data-act="x-show">Show the answers</button>` : `<button class="btn ghost sm" data-act="x-hide">Hide the answers</button>`}</div>
          <p class="small muted">${xhid ? `In exam order, with the ones you missed marked. Open one to see ${skill === "co" ? "the question and your answer, with the recording to play again" : "the document, the question and your answer"}. The right answers stay hidden until you show them.` : `In exam order. Open one to see ${skill === "co" ? "what you heard, with the recording to play again" : "the document"}, your answer, the right one and why.`}</p>
          <div class="stack tight">${review}</div></section>`;
    }
    const exams = compAttempts(skill).filter((a) => a.kind === "exam"), retakes = retakeIds();
    // One row per built-in exam, so each note sits by its own exam. The ones not done yet are the primary choice.
    const starts = X.bank().map((e) => { const prev = exams.find((a) => a.setId === e.id); return `<div class="row"><button class="btn ${prev ? "" : "primary"}" data-act="x-start" data-id="${esc(e.id)}">Start ${esc(e.title)}</button>${prev ? `<span class="small muted">Done on ${shortDate(prev.date).replace(/\.$/, "")}. A retake is good practice, but you'll remember some answers, so its score won't count toward your NCLC estimate.</span>` : ""}</div>`; }).join("");
    const paused = ipGet(X.ip);
    // The other skill's exam is still going: one exam at a time.
    const other = examRunning() && skillOf(ui.cx) !== skill;
    const rules = skill === "co"
      ? `<p>39 questions in about 35 minutes, getting harder from A1 to C2, as on the TCF Canada. Each recording plays once, and the exam moves on by itself.</p>
        ${fold("x-rules-co", "Comment ça se passe · How it works", `<div class="stack tight"><ul class="small" style="margin:0;padding-left:20px">
          <li>As on the real test, each question starts with a beep and has its own fixed time: a few seconds to read, the recording, then a few seconds to answer. The clock shows this question's time. When it runs out, the next question starts by itself, answered or not: no going back, no going faster, and a blank counts as wrong.</li>
          <li>Questions 1–4: look at the picture and listen to four statements, then choose the one that matches it. Questions 5–7: listen to a question and four replies, then choose the right reply. From question 8: read the four options, listen to the document and its question, then choose.</li>
          <li>Use headphones if you can. If you're interrupted, Pause stops everything; the real test doesn't stop.</li>
          <li>You get an estimated score out of 699 with its NCLC level, added to Progress → Scores and NCLC.</li>
        </ul>
        <p class="small muted">Unlike the real test, the pictures are drawings, and the recordings use Microsoft's voices for now: mostly from France, with a few from Québec, as on the real test.</p></div>`)}`
      : `<p>39 questions in 60 minutes, one document each, getting harder from A1 to C2, as on the TCF Canada.</p>
        ${fold("x-rules-ce", "Comment ça se passe · How it works", `<ul class="small" style="margin:0;padding-left:20px"><li>Answers stay hidden until you hand in, and a blank counts as wrong.</li><li>At 0:00 the exam is handed in for you. You can pause the clock if you're interrupted.</li><li>You get an estimated score out of 699 with its NCLC level, added to Progress → Scores and NCLC.</li></ul>`)}`;
    return `${back}
      <section class="panel stack">
        <p class="h3">Examen blanc · ${skill === "co" ? "Compréhension orale" : "Compréhension écrite"}</p>
        ${rules}
        <p class="small muted">${esc(spec.note)}</p>
        ${other ? `<div class="notice">Your ${skillOf(ui.cx) === "co" ? "listening" : "reading"} exam is still going. Finish it or quit it before starting this one.<div class="row" style="margin-top:8px"><a class="btn sm primary" href="#${XSPEC[skillOf(ui.cx)].home}">Back to that exam</a></div></div>`
          : paused ? `<div class="notice"><b>You have an unfinished exam:</b> ${esc(paused.title)}, ${esc(ipProgress(paused))}. Pick it up where you stopped, or discard it to start another.<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="ip-resume" data-id="${X.ip}">Resume</button>${discardBtn(X.ip)}</div></div>`
          : `<div class="stack tight">${starts}${skill === "ce" ? `<div class="row">${claudeBtn("cx-gen", "x-gen", "New exam from Claude", "", "btn")}</div>` : ""}</div>`}
        ${skill === "ce" && ui.cxReady ? `<div class="notice">Claude's exam is ready: 39 new documents. The clock starts when you do.<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="x-start-ready">Start it now</button></div></div>` : ""}
      </section>
      ${exams.length ? `<section class="sec"><h2 class="h2">Your exams</h2><div class="stack tight">${exams.slice(0, 8).map((a) => `<div class="h-att"><span class="num">${shortDate(a.date)}</span><span>${esc(a.title)}</span><span class="pill">≈${a.est}</span>${nclcTag(a.est, skill)}${retakes.has(a.id) ? `<span class="pill info">retake · not counted</span>` : ""}<span class="small muted">${a.score}/${a.total}</span>${X.bank().some((e) => e.id === a.setId) || a.snap ? `<button class="btn ghost sm" data-act="x-review" data-id="${esc(a.id)}">Review</button>` : ""}</div>`).join("")}</div></section>` : ""}`;
  }

  /* =============== criteria & scores =============== */
  function criterionStatus(c) {
    if (!c.auto) return { manual: true, ok: !!settings().criteria[c.id] };
    const [kind, a, b, x] = c.auto.split(":");
    if (kind === "writingZero") return writingZero(a);
    if (kind === "drill") {
      const m = coldMet(a, b, Number(x), 2);
      return { ok: m.ok, note: coldNote(m) };
    }
    if (kind === "baseline") {
      const co = list("comp").some((c2) => c2.skill === "co");
      const ce = list("comp").some((c2) => c2.skill === "ce");
      return { ok: co && ce, note: `CO ${co ? "✓" : "—"} · CE ${ce ? "✓" : "—"}` };
    }
    if (kind === "t3ok") {
      const ok = list("writing").some((w) => w.task === "t3" && w.fb && w.fb.tache3 && w.fb.tache3.compared_both && w.fb.tache3.opinion_after_comparison && w.words >= 120 && w.words <= 180);
      return { ok, note: ok ? "Done" : "Needs a corrected Tâche 3 that passes both structure checks and the word count" };
    }
    // eemock:b2: an Examen blanc EE with two of its three tasks at B2 (10/20) or better.
    // eemock:3: your last 3 Examens blancs EE each with all three tasks inside their word ranges and Tâche 3's
    // part 1 comparing both documents.
    if (kind === "eemock") {
      const ms = eeMocks();
      if (a === "b2") {
        const best = Math.max(0, ...ms.map((m) => m.scores.filter((v) => v != null && v >= 10).length));
        return { ok: best >= 2, note: !ms.length ? "No Examen blanc EE yet" : best >= 2 ? "Done" : `Best so far: ${best} of 3 tasks at B2` };
      }
      const full = (m) => EE_TASKS.every((t) => { const w = m.tasks[t], W = T.WRITING[t]; return w && w.words >= W.min && w.words <= W.max; }) && !!(m.tasks.t3 && m.tasks.t3.fb && m.tasks.t3.fb.tache3 && m.tasks.t3.fb.tache3.compared_both);
      let run = 0;
      for (const m of ms) { if (!full(m)) break; run++; }
      return { ok: run >= 3, note: !ms.length ? "No Examen blanc EE yet" : `${Math.min(run, 3)} of 3 in a row so far` };
    }
    // comp:<level>:<share>[:timed]: your first try at each of the last 3 sets at that level, in CO and in CE
    // (with "timed", CE only counts sets done on the clock). A retake mostly shows what you remember of the set.
    if (kind === "comp") {
      const th = Number(b), clock = x === "timed";
      const res = ["co", "ce"].map((sk) => {
        const xs = firstTries(list("comp").filter((c2) => c2.skill === sk && c2.level === a && c2.total && c2.kind !== "exam" && (!clock || sk !== "ce" || c2.timed))).slice(-3);
        return [sk, xs.length ? xs.reduce((s2, c2) => s2 + c2.score / c2.total, 0) / xs.length : null];
      });
      return { ok: res.every(([, v]) => v != null && v >= th), note: res.map(([sk, v]) => `${sk.toUpperCase()} ${v == null ? "—" : pct(v)}`).join(" · ") + ` (first tries, last 3 sets at ${a}${clock ? ", CE on the clock" : ""})` };
    }
    // pace:<skill>:<level>:<share>: one set at that level answered at exam pace (CE_PACE seconds a question) with that share right.
    if (kind === "pace") {
      const per = CE_PACE[b] || 90, th = Number(x);
      const xs = list("comp").filter((c2) => c2.skill === a && c2.level === b && c2.total && c2.kind !== "exam" && c2.secs > 0);
      const ok = xs.some((c2) => c2.secs <= per * c2.total && c2.score / c2.total >= th - 1e-9);
      const quick = xs.slice().sort((p, q) => p.secs / p.total - q.secs / q.total)[0];
      return { ok, note: ok ? "Done" : quick ? `Your quickest set: ${Math.round(quick.secs / quick.total)} s a question (exam pace: ${per} s)` : "No attempts yet" };
    }
    // examFull:<skill>: a practice exam with every question answered before the time ran out.
    if (kind === "examFull") {
      const exams = list("comp").filter((c2) => c2.kind === "exam" && c2.skill === a);
      const ok = exams.some((c2) => !c2.timeUp && arr(c2.answers).length && arr(c2.answers).every((v) => v != null));
      return { ok, note: ok ? "Done" : exams.length ? "Not yet: answer every question, guessing the last ones if time runs short" : "No practice exam yet" };
    }
    if (kind === "mocks") {
      const ms = scoredMocks().sort((p, q) => str(p.date).localeCompare(str(q.date)));
      if (a === "coce2") {
        const co = ms.filter((m) => m.co >= 458).length, ce = ms.filter((m) => m.ce >= 453).length;
        return { ok: co >= 2 && ce >= 2, note: `CO ${Math.min(co, 2)}/2 · CE ${Math.min(ce, 2)}/2` };
      }
      // Only entries with all four skills are full mocks, so a partial entry (a CE practice exam, say) doesn't break a run.
      const full = ms.filter((m) => ["co", "ce", "ee", "eo"].every((k) => m[k] != null && m[k] !== ""));
      let runN = 0, best = 0;
      for (const m of full) { const all = m.co >= 458 && m.ce >= 453 && m.ee >= 10 && m.eo >= 10; runN = all ? runN + 1 : 0; best = Math.max(best, runN); }
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
  // A practice exam taken again asks questions you've already seen, so its score reads high. It's kept and shown
  // as a retake, but no estimate, stamp or phase criterion counts it, nor its copy in the score log.
  function retakeIds() {
    const seen = new Set(), out = new Set();
    list("comp").filter((c) => c.kind === "exam" && c.setId).sort((a, b) => str(a.date).localeCompare(str(b.date)) || (a.ts || 0) - (b.ts || 0))
      .forEach((c) => { const k = skillOf(c) + ":" + c.setId; if (seen.has(k)) out.add(c.id); else seen.add(k); });
    return out;
  }
  const scoredMocks = () => { const R = retakeIds(); return list("mocks").filter((m) => !(m.compId && R.has(m.compId))); };

  /* =============== render plumbing =============== */
  const VIEWS = {};
  let route = { view: "today", args: [] };
  function parseRoute(h) {
    const t = str(h).replace(/^#/, "") || "today";
    const parts = t.split(".");
    return { view: VIEWS[parts[0]] ? parts[0] : "today", args: parts.slice(1) };
  }
  // On claude.ai the page runs in a frame that reloads without the part after #, so a refresh always landed
  // on Aujourd'hui. The page is remembered for this tab and reopened when the address names none; a new tab
  // still starts on Aujourd'hui. Storage can be blocked, so this is only a convenience.
  const PAGE_KEY = "tcf-reussir-page";
  function rememberPage() { try { sessionStorage.setItem(PAGE_KEY, [route.view].concat(route.args).join(".")); } catch (_) {} }
  function rememberedPage() { try { return sessionStorage.getItem(PAGE_KEY) || ""; } catch (_) { return ""; } }

  // A refresh used to drop whatever was on screen: the drill question you were on, a text half proofread, a
  // vocabulary session, the clock, where the recording was. So the page's working state (ui, the clock and the
  // recording's position) is also kept in this tab's sessionStorage, saved as you go, and put back when the
  // page loads, before anything is drawn. It's only saved once your progress has loaded, so it never holds the
  // empty page from before. Unfinished attempts stay the record: one changed since this copy was saved (on
  // another device, say) wins over it in hydrate(). Bump TAB_V when the shape of ui changes, so an older copy
  // is dropped rather than misread.
  const TAB_KEY = "tcf-reussir-tab", TAB_V = 4;
  const TAB_UI = ["bento", "day", "drill", "hunt", "huntLevel", "mh", "gen", "prod", "vocab", "vTheme", "vCount", "w", "hist", "rep", "hwSug", "c", "cx", "cxReady", "form", "applied", "grab", "fx", "nextUp", "xp", "ee"];
  let tabAt = 0; // when the copy put back was saved; 0 when there was none
  let tabCheck = false; // a copy was put back and hasn't been drawn with your progress loaded yet
  let tabUndo = null; // ui as it was before, in case the copy can't be drawn
  let tabY = null; // where the page was scrolled
  let tabSaveT = 0;
  function tabSave() {
    clearTimeout(tabSaveT);
    tabSaveT = 0;
    if (!hydrated) return;
    try {
      const u = {};
      TAB_UI.forEach((k) => { u[k] = ui[k]; });
      // The player and Claude's requests in flight don't survive a reload.
      u.c = Object.assign({}, ui.c);
      ["player", "inflight", "queued", "failed"].forEach((k) => delete u.c[k]);
      u.w = Object.assign({}, ui.w, { copyOut: null });
      if (examRunning() && skillOf(ui.cx) === "co" && ui.cx.play) ui.cx.play.pos = coxPos();
      const set = ui.c.set.co;
      const audio = audioEl && set && set.audio ? { id: set.id, t: audioEl.currentTime || 0, ended: ui.c.player === "ended" } : null;
      const tm = timer.total ? { total: timer.total, left: timer.left, base: timer.base, t0: timer.t0, running: timer.running, label: timer.label, home: timer.home, alerted: timer.alerted, done: timer.done } : null;
      sessionStorage.setItem(TAB_KEY, JSON.stringify({ v: TAB_V, at: Date.now(), y: window.scrollY, ui: u, timer: tm, audio }));
    } catch (_) {
      // A copy that can't be updated would bring back an older state, so drop it.
      try { sessionStorage.removeItem(TAB_KEY); } catch (_2) {}
    }
  }
  const tabSoon = () => { if (!tabSaveT) tabSaveT = setTimeout(tabSave, 400); };
  function tabRestore() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(TAB_KEY) || "null"); } catch (_) { s = null; }
    if (!s || s.v !== TAB_V || !s.ui) return;
    tabUndo = clone(Object.fromEntries(TAB_UI.map((k) => [k, ui[k]])));
    try {
      for (const k of TAB_UI) {
        const v = s.ui[k];
        if (v === undefined) continue;
        // Objects are merged, so a key added since keeps its default.
        if (ui[k] && typeof ui[k] === "object" && !Array.isArray(ui[k]) && v && typeof v === "object") Object.assign(ui[k], v);
        else ui[k] = v;
      }
      if (s.timer) {
        Object.assign(timer, s.timer);
        // A running clock carries on from when it started, so the time spent reloading counts, as on the real test.
        if (timer.running) { clearInterval(timer.iv); timer.iv = setInterval(paintTimer, 250); }
      }
      // A card session saved before its steps changed shape can't be read: it's dropped, and the cards keep their schedule.
      if (ui.vocab && ui.vocab.v !== VOCAB_V) ui.vocab = null;
      if (s.audio) coRemount(s.audio);
      // A listening exam can't play again by itself after a refresh, so it comes back paused, clock included.
      if (examRunning() && skillOf(ui.cx) === "co" && ui.cx.play) { ui.cx.play.paused = true; if (timer.home === XSPEC.co.home) timerPause(); }
      tabAt = Number(s.at) || 0;
      tabY = Number.isFinite(s.y) ? s.y : null;
      tabCheck = true;
      try { history.scrollRestoration = "manual"; } catch (_) {}
    } catch (e) {
      console.warn("Couldn't restore this tab", e);
      tabDrop();
    }
  }
  // The copy put back couldn't be used: start from a clean page instead, and forget it. Your drafts and
  // unfinished attempts are then put back from your progress, as on a first visit, by hydrating again.
  function tabDrop() {
    if (tabUndo) TAB_UI.forEach((k) => { ui[k] = tabUndo[k]; });
    timerSet(0, "", "");
    stopAudio();
    tabAt = 0;
    tabY = null;
    tabCheck = false;
    hydrated = false;
    try { sessionStorage.removeItem(TAB_KEY); } catch (_) {}
  }
  const routeView = () => route.view;
  // The folds you've opened or closed (a block's details, "Comment ça marche"…), for this visit only. One you
  // haven't touched shows its default: open for the block that's next, closed otherwise.
  const FOLD = {};
  const foldOpen = (key, dflt) => (key in FOLD ? FOLD[key] : !!dflt);
  const foldAttr = (key, dflt) => `data-fold="${esc(key)}"${foldOpen(key, dflt) ? " open" : ""}`;
  // A fold of extra text: the page's explanation, a checklist, the rules. `body` is its HTML.
  const fold = (key, label, body, dflt) => `<details class="fold-x" ${foldAttr(key, dflt)}><summary>${label}</summary>${body}</details>`;
  // A short, stable key for motion.js (data-k) from any text: the same round or set gives the same key.
  const hk = (s) => { let h = 0; for (const ch of String(s)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
  let pendingRender = false, raf = 0, pointerDown = false, holdH = false;
  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; render(false); });
  }
  function isTyping(el) {
    return !!el && (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|reset)$/i.test(el.type)));
  }
  function render(force) {
    // The first draw with your progress loaded can change what's on screen (a newer copy of the round, say),
    // so it isn't put off while a field has focus; the field, its text and the caret are kept.
    if (loaded && !hydrated) { hydrate(); force = true; }
    // The language: from this browser's copy until your settings load (or change on another device).
    applyLang();
    const ae = document.activeElement;
    const typing = isTyping(ae) && viewEl.contains(ae);
    if (typing && !force) { pendingRender = true; paintFoot(); return; }
    pendingRender = false;
    const fid = ae && viewEl.contains(ae) ? ae.id : "";
    const sel = typing && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd, ae.scrollTop] : null;
    const v = VIEWS[route.view];
    let html;
    try { html = v.render(route.args); } catch (e) {
      console.error(e);
      // A state brought back from before the refresh that can't be drawn is dropped, rather than coming back on every refresh.
      if (tabCheck) { tabDrop(); render(force); return; }
      html = `<div class="wrap"><div class="notice warn">Something went wrong drawing this page: ${esc(e && e.message)}</div></div>`;
    }
    // Safari, laying out a redraw, first measures the parts with container queries (Progrès's tiles, the Fiches) as
    // empty, so a page scrolled further down than that jumped to the top. The view keeps its height until the new
    // page has been laid out once, after i18n.js has put in its French (in immersion), so it's measured only then.
    if (!holdH) {
      holdH = true;
      viewEl.style.minHeight = viewEl.offsetHeight + "px";
      queueMicrotask(() => { void viewEl.offsetHeight; viewEl.style.minHeight = ""; holdH = false; });
    }
    viewEl.innerHTML = html;
    if (fid) {
      const el = document.getElementById(fid);
      if (el) { try { el.focus({ preventScroll: true }); if (sel && typeof el.setSelectionRange === "function") { el.setSelectionRange(sel[0], sel[1]); el.scrollTop = sel[2]; } } catch (_) {} }
    }
    try { if (v.after) v.after(route.args); } catch (e) { console.error(e); }
    if (hydrated) {
      tabCheck = false;
      // Back where the page was before the refresh, once everything on it has loaded.
      if (tabY != null) { window.scrollTo(0, tabY); tabY = null; }
    }
    paintNav();
    paintFoot();
    paintTimer();
    paintGrab();
    paintNextUp();
    stampCheck();
    paintMarks();
    grabCheck();
    tabSoon();
    // motion.js animates what's new on the page after each redraw. It only listens; nothing here depends on it.
    document.dispatchEvent(new CustomEvent("tcf:render", { detail: { page: [route.view].concat(route.args).join("."), ready: hydrated } }));
  }
  function paintNav() {
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === route.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }
  function paintFoot() {
    const s = settings(), P = T.PHASES[s.phase - 1];
    const store = backend.kind === "db" ? `<span class="status-dot on"></span>Progress saved on claude.ai` : backend.kind === "server" ? `<span class="status-dot on"></span>Progress saved on this computer` : backend.kind === "local" ? `<span class="status-dot warn"></span>Progress saved in this browser only` : `<span class="status-dot"></span>Loading your progress…`;
    const cl = sample ? `<span class="status-dot on"></span>Claude ready` : claudeState === "pending" ? `<span class="status-dot"></span>Connecting to Claude…` : claudeState === "off" ? `<span class="status-dot"></span>Claude off (reload to allow)` : "";
    // The listening exam paces itself question by question, so the sidebar shows where it is rather than its 35 minutes.
    const coQ = timer.home === XSPEC.co.home && examRunning() && skillOf(ui.cx) === "co" ? `${ui.cx.i + 1}/${ui.cx.exam.items.length}` : "";
    const tm = timer.total && !timer.done && (timer.running || timerStarted()) ? `<a class="mini-timer" href="#${esc(timer.home)}">${ico("timer")}<span>${esc(timer.label)}</span><b ${coQ ? "" : "data-timer"}>${coQ ? `Q ${coQ}` : fmtClock(timerRemaining())}</b></a>` : "";
    // Where your progress is saved, on one line; that and whether Claude is ready open with a tap.
    const saved = backend.kind === "db" ? "Saved on claude.ai" : backend.kind === "server" ? "Saved on this computer" : backend.kind === "local" ? "Saved in this browser only" : "Loading your progress…";
    const dot = backend.kind === "local" ? "warn" : backend.kind === "loading" ? "" : "on";
    footEl.innerHTML = `${miniPass()}${tm}${streakFoot(streak())}<details class="status" ${foldAttr("foot-status")}><summary><span class="status-dot ${dot}"></span>${saved}</summary><div><div>${store}</div>${cl ? `<div>${cl}</div>` : ""}</div></details><button type="button" class="theme-btn" data-act="theme" data-theme-btn></button><button type="button" class="theme-btn fr-btn" data-act="lang" data-lang-btn></button>`;
    paintTheme();
    paintLang();
  }
  function confirmBtn(key, label, act, attrs) {
    if (ui.confirm === key) return `<button class="btn sm danger" data-act="${act}" ${attrs}>Confirm</button><button class="btn sm ghost" data-act="confirm-cancel">Cancel</button>`;
    return `<button class="x" data-act="confirm" data-key="${esc(key)}" title="${esc(label)}" aria-label="${esc(label)}">×</button>`;
  }
  // Throwing away an unfinished attempt always asks first.
  function discardBtn(id) {
    const key = "ip-del-" + id;
    if (ui.confirm === key) return `<button class="btn sm danger" data-act="ip-discard" data-id="${esc(id)}">Discard it</button><button class="btn sm ghost" data-act="confirm-cancel">Keep it</button>`;
    return `<button class="btn sm ghost" data-act="confirm" data-key="${esc(key)}">Discard</button>`;
  }

  /* shared bits */
  const skChip = (k) => `<span class="sk ${k}">${SK_ICON[k] ? ico(SK_ICON[k]) : ""}${T.SKILLS[k].code}</span>`;
  function errList(errs, withCat) {
    if (!errs || !errs.length) return `<p class="pen-ok">Aucune faute relevée.</p>`;
    return `<ul class="errs">${errs.map((e) => `<li><div class="fix"><span class="pen-wrong">${esc(e.wrong)}</span><span class="pen-right">${esc(e.right)}</span>${withCat && e.category ? `<span class="pill">${esc(CAT[catOf(e.category)])}</span>` : ""}</div>${e.why ? `<p class="why">${esc(e.why)}</p>` : ""}</li>`).join("")}</ul>`;
  }
  const accentBar = () => `<div class="accents" aria-label="Accented letters">${["é", "è", "ê", "ë", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "œ", "É", "À", "’"].map((c) => `<button type="button" data-act="accent" data-ch="${c}" tabindex="-1">${c}</button>`).join("")}</div>`;
  const formVal = (k) => esc(ui.form[k] || "");

  /* =============== view: today =============== */
  /* =============== charts (charts.js) =============== */
  // The chart kit, and what more than one page charts: study minutes, cards due, and cards by stage. Every chart
  // is worked out from progress already saved.
  const CH = window.TCFCharts;
  // The skills in the charts' order (bottom to top in a stack), checked for colour-blind readers in both modes.
  const SK_ORDER = ["co", "voc", "ee", "ce", "gra", "bil"];
  const skColor = (k) => `var(--c-${k})`;
  const hm = (m) => { m = Math.round(m); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + pad(m % 60) : ""}`; };
  const dayLabel = (d) => `${DAYS_SHORT[dow(d)]} ${shortDate(d)}`;
  // Each block's minutes: what was saved with its tick (the minutes of what was done), else today's coach
  // estimate (the exercise's own), else the plan's.
  function blockMins(date, plan, phase, steps) {
    const saved = (S.days.get(date) || {}).min || {};
    const st = steps || (date === todayStr() && phase === settings().phase ? plan.map((b, i) => coach(b, i, date)) : null);
    return plan.map((b, i) => { const k = blockKey(phase, i); return saved[k] != null ? saved[k] : st ? st[i].min : b[1]; });
  }
  const planMins = (date, phase) => { const plan = planFor(phase, date); return plan ? blockMins(date, plan, phase).reduce((a, x) => a + x, 0) : 0; };
  // The minutes of each skill in a day's ticked blocks: what was saved with each tick, or for days ticked before
  // that, the minutes of the plan the day was ticked against.
  function dayMinutes(date) {
    const doc = S.days.get(date);
    if (!doc || !doc.done) return {};
    const phase = doc.phase || settings().phase, plan = planFor(phase, date), by = {}, saved = doc.min || {};
    if (plan) plan.forEach((b, i) => { const k = blockKey(phase, i); if (doc.done[k]) by[b[0]] = (by[b[0]] || 0) + (saved[k] != null ? saved[k] : b[1]); });
    return by;
  }
  const minTotal = (by) => Object.values(by).reduce((a, b) => a + b, 0);
  // This week day by day: the minutes ticked (filled) against the minutes planned (the outline behind).
  function weekChart() {
    const s = settings(), t = todayStr(), mon = mondayOf(t);
    const days = [0, 1, 2, 3, 4, 5, 6].map((k) => addDays(mon, k));
    const done = days.map((d) => minTotal(dayMinutes(d)));
    const plan = days.map((d) => { const doc = S.days.get(d); return planMins(d, (doc && doc.phase) || s.phase); });
    const sum = (xs) => xs.reduce((a, b) => a + b, 0);
    return { done: sum(done), plan: sum(plan), html: CH.cols({
      key: "week-" + mon, h: 64, legend: false, ghost: plan, series: [{ id: "done", label: "Minutes ticked", color: "var(--accent)" }], data: done.map((v) => [v]),
      label: `This week: ${hm(sum(done))} ticked of about ${hm(sum(plan))} planned`,
      x: days.map((d, k) => ({ label: DAYS_SHORT[k].charAt(0).toUpperCase(), today: d === t, rest: k === 6, tip: `${dayLabel(d)}${d === t ? " · today" : ""}\n${k === 6 ? (done[k] ? `Rest day · ${hm(done[k])} anyway` : "Rest day") : `${hm(done[k])} of about ${hm(plan[k])} planned`}` })),
    }) };
  }
  // Learned cards, as [id, state] pairs.
  const learnedCards = (cards) => [...S.srs.entries()].filter(([id, st]) => cards.has(id) && st);
  // The cards due on each of the next seven days, today's with any overdue.
  function dueChart(srs, key, h) {
    const t = todayStr(), days = Array.from({ length: 7 }, (_, i) => addDays(t, i));
    const n = days.map((d, i) => srs.filter(([, st]) => st.due && (i ? st.due === d : st.due <= d)).length);
    return { n, days, html: CH.cols({ key, h, legend: false, series: [{ id: "due", label: "Cards due", color: "var(--c-voc)" }], data: n.map((v) => [v]), label: "Cards due each day this week",
      x: days.map((d, i) => ({ label: i ? DAYS_SHORT[dow(d)] : "auj.", today: !i, tip: `${i ? dayLabel(d) : "Today"} · ${n[i]} card${n[i] === 1 ? "" : "s"}${i ? "" : " (with any overdue)"}` })) }) };
  }
  // Cards by the gap to their next review, on the ordered blue scale (stageOf: 3–13 days is stages 2 and 3).
  const STAGES = [["1–2 days", (st) => st.pri || (st.stage || 0) <= 1], ["3–13 days", (st) => !st.pri && (st.stage === 2 || st.stage === 3)], ["14–20 days", (st) => !st.pri && st.stage === 4], ["21–30 days · mastered", (st) => !st.pri && st.stage >= 5]];
  const stageChart = (srs, key, compact) => CH.stack(STAGES.map(([l, f], i) => ({ label: l, value: srs.filter(([, st]) => f(st)).length, color: `var(--o-${i + 1})` })), { key, compact, label: "Your cards by the gap to their next review" });

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
      let body, rm = null, ring = "";
      if (!plan) {
        body = `<div class="panel stack"><h2 class="h2">Repos</h2><p class="lede">Sunday is a rest day in every phase. If you want something light, review your due cards or reread this week's corrections, but it isn't on the plan.</p><div class="row"><a class="btn" href="#vocab">Due cards</a><a class="btn" href="#progress.errors">This week's errors</a></div></div>`;
      } else {
        // Today's minutes are the coach's (each exercise's own); other days, the plan's, or what was saved with each tick.
        const steps = sel === t ? plan.map((b, i) => coach(b, i, t)) : null;
        const bm = blockMins(sel, plan, s.phase, steps);
        const mins = bm.reduce((a, x) => a + x, 0);
        const doneN = plan.filter((b, i) => done[blockKey(s.phase, i)]).length;
        const doneMin = bm.reduce((a, x, i) => a + (done[blockKey(s.phase, i)] ? x : 0), 0);
        const pnote = T.PLAN[s.phase].note;
        const next = plan.findIndex((b, i) => !done[blockKey(s.phase, i)]);
        if (sel === t) rm = remyToday(plan, doneN, mins - doneMin);
        ring = dayRing(sel, doneN, plan.length, doneMin, mins);
        body = `<div class="stack">
          <ol class="blocks">${plan.map((b, i) => todayBlock(b, i, sel, s.phase, done, i === next, steps && steps[i])).join("")}</ol>
          ${pnote ? `<details class="fold-x" ${foldAttr("pnote-" + s.phase)}><summary>Notes de la phase · Phase notes</summary><p class="small muted">${esc(pnote)}</p></details>` : ""}
        </div>`;
      }
      if (!plan && sel === t) rm = remyToday(null);
      const side = dayComplete(sel) ? tbStamp(sel) : ring;
      return `<div class="wrap">
        <header class="cahier-head seyes">
          <div class="head-main">
            <p class="date-hand">${frDate(sel)}</p>
            <div class="meta"><b>Phase ${s.phase} · ${esc(P.name)}</b><span>Semaine ${weekNo()}</span><span>${esc(P.weeks)}</span>${sel !== t ? `<button class="btn ghost sm" data-act="day" data-date="${t}">Back to today</button>` : ""}</div>
          </div>
          ${side || rm ? `<div class="head-side">${side}${rm ? greet(rm[0], rm[1], rm[2]) : ""}</div>` : ""}
        </header>
        <div class="daychips" role="group" aria-label="This week">${chips}</div>
        <div class="grid-side">
          ${body}
          <aside class="side">${expressionCard()}${continueCard()}${sel === t ? watchCard() + blockersCard() : ""}${homeworkCard()}${streakCard()}</aside>
        </div>
      </div>`;
    },
    // The day's stamp lands with a thunk right after its last block is ticked (not on every redraw).
    after() {
      const el = ui.thunk && document.getElementById("tb-stamp");
      if (!el || el.dataset.date !== ui.thunk) return;
      ui.thunk = null;
      // The stamp's thud as it lands (with reduced motion too: the sound follows its own switch).
      tone("thunk", 0.26);
      if (typeof el.animate !== "function" || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
      el.animate([{ transform: "rotate(-11deg) scale(1.4)", opacity: 0.3 }, { transform: "rotate(-11deg) scale(.95)", opacity: 1, offset: 0.55 }, { transform: "rotate(-11deg) scale(1)", opacity: 1 }], { duration: 500, easing: "cubic-bezier(.2, .8, .3, 1.25)" });
      // …and a handful of maple leaves fly off it as it lands (motion.js; without it, nothing happens).
      if (window.TCFMotion) setTimeout(() => window.TCFMotion.burst(el), 240);
    },
  };
  // One block of the day's plan. The next one to do is open, with its details and a big Start; the others show
  // their title and open with a tap; done ones shrink to a ticked line. Today's blocks are the coach's: what Start
  // presents, in two short lines, its own minutes and, when the plan was changed for you, why.
  function todayBlock(b, i, sel, phase, done, isNext, st) {
    const key = blockKey(phase, i), isDone = !!done[key], fk = `blk-${sel}-${key}`;
    const tick = `<label class="tick"><input type="checkbox" data-change="tick" data-date="${sel}" data-key="${key}" ${isDone ? "checked" : ""} aria-label="Mark “${esc((st && st.title) || b[2])}” done"><svg class="tick-mark" viewBox="0 0 24 24" aria-hidden="true"${isDone ? ` data-m="tick" data-k="t-${sel}-${key}"` : ""}><path d="M6.5 12.5l3.6 3.6 7.4-8"/></svg></label>`;
    const cls = `block${isDone ? " done" : ""}${isNext ? " next" : ""}`;
    if (st) {
      // The chips, the minutes and the tag are keyed by what they say, so each pops in when the plan changes it.
      const min = isDone && ((S.days.get(sel) || {}).min || {})[key] != null ? S.days.get(sel).min[key] : st.min;
      const sig = hk([st.line1, st.chips.map((c) => c.t).join("|"), st.adapted].join("~"));
      const tag = st.adapted ? `<span class="adapt" title="${esc(st.adapted)}">adapté<i class="adapt-ink" data-m="ink" data-k="ad-${sel}-${key}-${sig}"></i></span>` : "";
      const m = st.meter && st.meter.have != null ? `<span class="cmeter" title="${esc(st.meter.label)}"><span class="cm-bar"><i data-tween="cm-${key}" data-tw="width" data-to="${Math.min(100, Math.round((st.meter.have / st.meter.need) * 100))}" style="width:${Math.min(100, Math.round((st.meter.have / st.meter.need) * 100))}%"></i></span><small>${esc(st.meter.label)} · now ${pct(st.meter.have)}</small></span>` : st.meter ? `<span class="cmeter"><small>${esc(st.meter.label)}</small></span>` : "";
      const chips = st.chips.length || m ? `<div class="cchips">${st.chips.map((c, k) => `<span class="cchip ${c.cls}" data-m="pop" data-k="cc-${key}-${sig}-${k}">${esc(c.t)}</span>`).join("")}${m}</div>` : "";
      const stamp = st.stamp ? `<span class="lvl-up" data-m="press" data-k="lvlup-${sel}-${key}"><span data-m="burst" data-k="lvlb-${sel}-${key}">${esc(st.stamp)}</span></span>` : "";
      const open = foldOpen(fk, isNext);
      const top = `${skChip(b[0])}<h3>${esc(st.title || b[2])}${tag}</h3>${stamp}<span class="min"><span><span data-tween="bm-${sel}-${key}" data-tw="count" data-to="${min}">${min}</span>&#8201;min</span><span class="chev" aria-hidden="true"></span></span><p class="coach-l1">${typo(st.line1)}</p>`;
      const more = `<div class="block-more"${open ? ` data-m="rise" data-k="${fk}"` : ""}>${st.line2 ? `<p class="coach-l2">${typo(st.line2)}</p>` : ""}${chips}${st.adapted ? `<p class="adapt-why">${typo(st.adapted)}</p>` : ""}</div>`;
      return `<li class="${cls}" data-m="rise" data-k="b-${sel}-${key}">${tick}
        <details class="block-main" ${foldAttr(fk, isNext)}><summary class="block-top">${top}</summary>${more}</details>
        <button class="btn ${isNext ? "primary" : isDone ? "ghost sm" : "sm"}" data-act="plan-start" data-i="${i}">${isDone ? "Open" : "Start"}</button>
      </li>`;
    }
    const more = b[3] || b[4], open = more && foldOpen(fk, isNext);
    const top = `${skChip(b[0])}<h3>${esc(b[2])}</h3><span class="min">${b[1]} min${more ? `<span class="chev" aria-hidden="true"></span>` : ""}</span>`;
    const main = more
      ? `<details class="block-main" ${foldAttr(fk, isNext)}><summary class="block-top">${top}</summary>
          <div class="block-more"${open ? ` data-m="rise" data-k="${fk}"` : ""}>${b[3] ? `<p class="detail">${typo(b[3])}</p>` : ""}${b[4] ? `<p class="check"><span>Check</span>${typo(b[4])}</p>` : ""}</div></details>`
      : `<div class="block-main"><div class="block-top">${top}</div></div>`;
    return `<li class="${cls}" data-m="rise" data-k="b-${sel}-${key}">
      ${tick}
      ${main}
      <a class="btn ${isNext ? "primary" : isDone ? "ghost sm" : "sm"}" href="#${b[5]}">Start</a>
    </li>`;
  }
  // The day's ring in the notebook header: the blocks ticked out of the plan, and the minutes still to go.
  function dayRing(sel, n, total, doneMin, mins) {
    const p = total ? Math.round((n / total) * 100) : 0, C = 113.1;
    return `<div class="day-ring" role="img" aria-label="${n} of ${total} blocks done, ${doneMin} of ${mins} minutes">
      <span class="ring"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="rg-track" cx="22" cy="22" r="18"/><circle class="rg-fill${p ? "" : " empty"}" cx="22" cy="22" r="18" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - p / 100)).toFixed(1)}" data-tween="ring-${sel}" data-tw="ring" data-to="${p}" data-c="${C}"/></svg><span class="rg-n"><span><b>${n}</b><small>/${total}</small></span></span></span>
      <small>${mins - doneMin > 0 ? `${mins - doneMin} min to go` : "All done"}</small>
    </div>`;
  }
  function homeworkCard() {
    const t = todayStr();
    const hw = list("homework").filter((h) => !h.done || (h.doneOn && h.doneOn >= addDays(t, -2)))
      .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.ts || 0) - (a.ts || 0));
    const items = hw.length ? `<ul class="hw">${hw.map((h) => `<li class="${h.done ? "done" : ""}">
        <input type="checkbox" data-change="hw-done" data-id="${esc(h.id)}" ${h.done ? "checked" : ""} aria-label="Done">
        <span>${esc(h.text)}${h.src || h.go ? `<small>${esc(h.src || "")}${h.go ? ` · <a href="#${esc(h.go)}">Open</a>` : ""}</small>` : ""}</span>
        <button class="x" data-act="hw-del" data-id="${esc(h.id)}" aria-label="Remove">×</button>
      </li>`).join("")}</ul>` : `<p class="small muted">No homework yet. Add your own, or take the follow-up tasks Claude suggests with a correction.</p>`;
    // Claude's suggestions live only on the page until you add the ones you want.
    const sug = arr(ui.hwSug);
    const suggestions = sug.length ? `<div class="stack tight"><p class="small muted">Claude's suggestions. Nothing is saved unless you add it.</p><ul class="hw">${sug.map((h, i) => `<li style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(h.text)}${h.go ? `<small><a href="#${esc(h.go)}">Open</a></small>` : ""}</span><button class="btn sm" data-act="hw-sug-add" data-i="${i}">Add</button></li>`).join("")}</ul><div><button class="btn ghost sm" data-act="hw-sug-clear">Dismiss</button></div></div>` : "";
    return `<section class="panel stack tight" data-spot>
      <div class="row between"><h2 class="h3 with-ico">${ico("homework")}Devoirs · Homework</h2></div>
      ${items}
      <div class="row"><input type="text" id="hw-new" data-input="form" data-k="hw" value="${formVal("hw")}" placeholder="Add a task…" style="flex:1"><button class="btn sm" data-act="hw-add">Add</button></div>
      ${suggestions || `<div>${claudeBtn("hw-suggest", "hw-suggest", "Suggest 3 from my error log", "", "btn ghost sm")}</div>`}
    </section>`;
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
    const n = streak(), t = tierOf(n);
    const next = t === 4 ? "Rouge érable from day 30: the leaf stays red. " : t ? `${TIERS[t].name} until day ${TIERS[t].to}, then ${TIERS[t + 1].name.toLowerCase()}. ` : "";
    const wk = weekChart();
    // The longest run so far, to beat: on it, or how far there is to go to equal it.
    const best = longestStreak();
    const rec = best < 2 ? "" : n >= best ? `<p class="small sc-rec on" data-m="pop" data-k="rec-${n}">${leafSvg("leaf-ico t" + t)}<b>Record run: ${n} days in a row!</b></p>`
      : `<p class="small sc-rec">${leafSvg("leaf-ico t" + tierOf(best))}Record: ${best} days · ${best - n} more to equal it.</p>`;
    return `<section class="panel stack tight" data-spot><div class="row between"><h2 class="h3 with-ico">${leafSvg("leaf-ico t" + t)}Régularité</h2>${streakPill(n) || `<span class="pill">No streak yet</span>`}</div>${rec}
      <div class="mini-week"><p class="small muted">Cette semaine · <b>${hm(wk.done)}</b> of about ${hm(wk.plan)}</p>${wk.html}</div>${heatmap(8)}
      <details class="fold-x" ${foldAttr("streak-how")}><summary>Comment ça marche · How it works</summary><p class="small muted">${esc(next)}A day counts once every block in its plan is ticked. Sundays don't break a streak.</p></details></section>`;
  }
  // Ce qui te freine: what's holding you back, worked out from your progress, each with its evidence, how far
  // you are from the bar, and where the plan deals with it. Most serious first, four at most.
  function blockers() {
    const s = settings(), rc = recentCats(3), out = [];
    const week = arr((T.PLAN[s.phase] || {}).days);
    const dayOf = (tid) => week.findIndex((d) => d.some((b) => b[5] === "grammar." + tid || b[5].startsWith("grammar." + tid + ".")));
    const mixedDay = week.findIndex((d) => d.some((b) => b[5] === "grammar.mixed"));
    const EN_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const ex = (e) => (e && e.wrong ? `<span class="pen-wrong">${esc(e.wrong)}</span> → ${esc(e.right)}` : "");
    gramNeed().filter((x) => x.w >= 2 || x.need >= 4).slice(0, 2).forEach((x) => {
      const d = dayOf(x.tp.id), cm = coldMet(x.tp.id, x.tp.criterion.set, x.tp.criterion.pct, x.tp.criterion.days || 2);
      out.push({ sev: x.need, ico: "grammar", label: x.tp.title, ev: [x.w ? `×${x.w} in your last ${rc.n} texts` : "", x.l ? `×${x.l} logged` : "", x.m ? `${x.m} drill misses` : ""].filter(Boolean).join(" · "), ex: ex(x.ex),
        fix: d >= 0 ? `${EN_DAYS[d]}'s grammar slot` : mixedDay >= 0 ? `${EN_DAYS[mixedDay]}'s mixed review, most-missed first` : "the mixed review, most-missed first", go: "grammar." + x.tp.id, have: cm.n / cm.need, label2: `mastered ${Math.min(cm.n, cm.need)}/${cm.need} days` });
    });
    const lex = (rc.counts.get("lexique") || 0), mic = (rc.counts.get("micro") || 0);
    if (lex + mic >= 2) out.push({ sev: 2 * (lex + mic), ico: "vocab", label: lex >= mic ? "Word choice" : "Micro-errors", ev: `×${Math.max(lex, mic)} in your last ${rc.n} texts${lex && mic ? (lex >= mic ? `, and micro-errors ×${Math.min(lex, mic)}` : `, and word choice ×${Math.min(lex, mic)}`) : ""}`, ex: ex(rc.ex.get(lex >= mic ? "lexique" : "micro")), fix: "Pièges cards this week, and Your mistakes", go: "grammar.mine" });
    const acc = (rc.counts.get("accord") || 0) + (rc.counts.get("elision") || 0);
    if (acc >= 2) out.push({ sev: 2 * acc, ico: "errors", label: "Agreement & elision", ev: `×${acc} in your last ${rc.n} texts`, ex: ex(rc.ex.get("accord") || rc.ex.get("elision")), fix: "Find the mistakes, and the 3-minute proofreading pass", go: "grammar.hunt" });
    const lastW = list("writing").filter((w) => w.fb).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0], LW = lastW && T.WRITING[lastW.task];
    if (LW && (lastW.words < LW.min || lastW.words > LW.max || (lastW.task === "t3" && lastW.fb.tache3 && !lastW.fb.tache3.compared_both))) out.push({ sev: 5, ico: "writing", label: "Task structure", ev: lastW.words < LW.min || lastW.words > LW.max ? `last ${LW.name}: ${lastW.words} words (${LW.min}–${LW.max})` : "last Tâche 3 didn't compare both documents", fix: "the writing blocks' second line", go: "writing." + lastW.task });
    for (const sk of ["ce", "co"]) {
      const lad = compLadder(sk), name = sk === "ce" ? "Reading" : "Listening";
      if (lad.have != null && lad.n >= 2 && lad.have < 0.6) out.push({ sev: 10 * (0.75 - lad.have), ico: sk === "ce" ? "read" : "listen", label: `${name} at ${lad.level}`, ev: `your last ${lad.n} sets: ${pct(lad.have)}`, fix: sk === "ce" ? "more time on the clock, and each miss gone over" : "each miss replayed with the transcript", go: "comp." + sk, have: lad.have / lad.up, label2: `${pct(lad.up)} for B2` });
    }
    const pace = cePace(compLadder("ce").level);
    if (pace.k < 2 && pace.last) out.push({ sev: 3 + (2 - pace.k), ico: "timer", label: "Reading speed", ev: `last set: ${pace.last.score}/${pace.last.total} in ${fmtClock(pace.last.secs)}`, fix: `the clock at ${fmtClock(pace.clock)} (${pace.label}) until 3/4 inside it`, go: "comp.ce", have: (pace.k + 1) / 3, label2: "toward exam pace" });
    const due = dueIds().length;
    if (due >= BACKLOG) out.push({ sev: 4, ico: "vocab", label: "Cards piling up", ev: `${due} due`, fix: "review only until fewer than " + BACKLOG + " are due", go: "vocab" });
    const since = addDays(todayStr(), -14), untagged = list("comp").filter((c) => c.kind !== "exam" && (c.date || "") >= since && c.total > c.score && !Object.keys(c.gaps || {}).length).length;
    return { rows: out.sort((a, b) => b.sev - a.sev).slice(0, 4), untagged };
  }
  function blockersCard() {
    const { rows, untagged } = blockers();
    const body = rows.length ? `<ul class="blk-list">${rows.map((r, k) => `<li data-m="rise" data-k="blk-${hk(r.label + r.ev)}">
        <span class="blk-ico">${ico(r.ico)}</span>
        <span class="blk-main"><b>${esc(r.label)}</b><small>${esc(r.ev)}</small>${r.ex ? `<small class="blk-ex">${r.ex}</small>` : ""}
          ${r.have != null ? `<span class="cm-bar" title="${esc(r.label2 || "")}"><i data-tween="blk-${k}-${hk(r.label)}" data-tw="width" data-to="${Math.round(Math.min(1, r.have) * 100)}" style="width:${Math.round(Math.min(1, r.have) * 100)}%"></i></span>` : ""}
          <a class="blk-fix" href="#${esc(r.go)}">→ ${esc(r.fix)}</a></span></li>`).join("")}</ul>`
      : `<p class="small muted">Nothing stands out right now. Your corrections, drills and sets will show here what's holding you back.</p>`;
    return `<section class="panel stack tight" data-spot><h2 class="h3 with-ico">${ico("target")}Ce qui te freine<small class="muted"> · What's holding you back</small></h2>${body}${untagged ? `<p class="small muted">Tag your reading and listening misses (vocabulary or comprehension gap) so the plan can pick the words you need: ${untagged} set${untagged > 1 ? "s" : ""} untagged lately.</p>` : ""}</section>`;
  }
  /* =============== À surveiller: the two mistakes you watch for in a week's writing =============== */
  // Picked on Friday's « Plan next week » block (#progress.week) for the week ahead (the user asked for this on
  // 2026-10-16, with the choices calibrated like the coach's). The choices are the kinds of mistake in your
  // writing, weighed as gramNeed weighs a grammar topic: 2 for each error in your last 3 corrected texts, 1 for
  // each error-log entry in 21 days, 1 for each miss on the topic's drills in 14 days. The coach's bar for a
  // blocker (twice in your last texts, or 4 points) makes a choice « conseil du coach »; a pick of the week now
  // ending that still shows up counts its misses again, so it stays on top. They show on Aujourd'hui and while you
  // write, and Claude checks them first in your corrections. Kept in settings.main.watch by the week's Monday.
  const WATCH_WEEKS = 8;
  const watchOf = (mon) => { const w = settings().watch; return (w && w[mon] && arr(w[mon].picks).length) ? w[mon] : null; };
  const watchNow = () => watchOf(mondayOf(todayStr()));
  // The week a plan made today is for: from Friday, the next one; earlier in the week, this one (a block caught up).
  const watchTarget = (t) => (dow(t) >= 4 ? addDays(mondayOf(t), 7) : mondayOf(t));
  // How often a kind of mistake came back in a week: in the texts corrected then, and the errors you logged.
  function watchCount(cat, mon) {
    const end = addDays(mon, 6), inWeek = (d) => d >= mon && d <= end;
    let n = 0, texts = 0;
    list("writing").forEach((w) => { if (w.fb && Array.isArray(w.fb.errors) && inWeek(str(w.date))) { texts++; w.fb.errors.forEach((e) => { if (catOf(e.category) === cat) n++; }); } });
    list("errors").forEach((e) => { if (inWeek(str(e.date)) && catOf(e.category) === cat) n++; });
    return { n, texts };
  }
  function watchChoices(t) {
    const rc = recentCats(3), since = addDays(t, -21), logN = new Map(), exLog = new Map();
    list("errors").forEach((e) => { if (str(e.date) >= since) { const c = catOf(e.category); logN.set(c, (logN.get(c) || 0) + 1); if (!exLog.has(c)) exLog.set(c, e); } });
    const gn = new Map(gramNeed().map((x) => [x.tp.id, x]));
    // When planning next week, the week now ending is the one to look back on.
    const back = watchTarget(t) > mondayOf(t) ? mondayOf(t) : addDays(mondayOf(t), -7), was = watchOf(back);
    const prev = was ? was.picks.map((p) => p.key) : [];
    const keys = new Set([...rc.counts.keys(), ...logN.keys(), ...[...gn.values()].filter((x) => x.m).map((x) => x.tp.id), ...prev]);
    const rows = [...keys].filter((k) => CAT[k] && k !== "autre").map((k) => {
      const w = rc.counts.get(k) || 0, l = logN.get(k) || 0, g = gn.get(k), m = g ? g.m : 0;
      const last = prev.includes(k) ? watchCount(k, back) : null;
      const score = 2 * w + l + m + (last ? last.n : 0);
      const ex = rc.ex.get(k) || exLog.get(k) || (g && g.ex) || null;
      return { key: k, label: CAT[k], w, l, m, score, ex: ex && ex.wrong ? { wrong: str(ex.wrong), right: str(ex.right) } : null, blocker: w >= 2 || score >= 4, last, texts: rc.n };
    }).filter((r) => r.score > 0 || r.last);
    rows.sort((a, b) => b.blocker - a.blocker || b.score - a.score || b.w - a.w);
    // Nothing to go on yet (no corrected text, nothing logged or missed): the recurring errors from your profile.
    if (!rows.length) T.KNOWN_ERRORS.slice(0, 6).forEach((x, i) => rows.push({ key: "known-" + i, label: x, w: 0, l: 0, m: 0, score: 0, ex: null, blocker: false, last: null, texts: 0, profile: true }));
    const rec = rows.slice(0, 2).map((r) => r.key);
    return { rows: rows.slice(0, 6), rec, back, was };
  }
  const watchEv = (r) => [r.w ? `×${r.w} in your last ${r.texts} texts` : "", r.l ? `×${r.l} logged` : "", r.m ? `${r.m} drill misses` : "", r.last ? (r.last.n ? `still ×${r.last.n} this week` : r.last.texts ? "kept at bay this week" : "") : "", r.profile ? "From your recurring errors" : ""].filter(Boolean).join(" · ");
  const watchEx = (ex) => (ex ? `<span class="pen-wrong">${esc(ex.wrong)}</span> → ${esc(ex.right)}` : "");
  // A pick's week so far: kept at bay (no text yet, or none of it in them), or how often it came back.
  function watchState(p, mon) {
    if (/^known-/.test(p.key)) return "";
    const c = watchCount(p.key, mon);
    return !c.texts && !c.n ? `<span class="pill">no text yet</span>` : c.n ? `<span class="pill bad">×${c.n} this week</span>` : `<span class="pill ok">✓ kept at bay</span>`;
  }
  const watchRows = (w, mon) => `<ul class="wt-list">${w.picks.map((p) => `<li><b>${esc(p.label)}</b>${p.ex ? `<small class="blk-ex">${watchEx(p.ex)}</small>` : ""}${watchState(p, mon)}</li>`).join("")}</ul>`;
  // For Claude: this week's two, checked first in a correction.
  function watchBrief(first) {
    const w = watchNow();
    if (!w) return "";
    const list2 = w.picks.map((p) => `${p.label}${p.ex ? ` (e.g. « ${p.ex.wrong} » → « ${p.ex.right} »)` : ""}`).join("; ");
    return first ? ` This week I'm watching for two mistakes in my writing: ${list2}. Check these first, and tell me whether each one appears.` : ` This week the learner is watching for two mistakes in their writing: ${list2}. When you correct a text, check these first and say in the summary whether each one appears.`;
  }
  function watchSave() {
    const t = todayStr(), mon = watchTarget(t), C = watchChoices(t), pick = arr(ui.watchPick || C.rec);
    if (pick.length !== 2) { toast("Pick two: the two mistakes you'll watch for."); return; }
    const picks = pick.map((k) => { const r = C.rows.find((x) => x.key === k) || { key: k, label: CAT[k] || k }; return { key: r.key, label: r.label, ex: r.ex || null }; });
    const all = Object.assign({}, settings().watch);
    all[mon] = { picks, at: t, rec: C.rec };
    // The last few weeks only.
    Object.keys(all).sort().slice(0, -WATCH_WEEKS).forEach((k) => delete all[k]);
    saveSettings({ watch: all });
    ui.watchPick = null;
    autoTick("progress.week");
    toast(`Kept for the week of ${shortDate(mon)}: ${picks[0].label} and ${picks[1].label}.`);
    render(true);
  }
  function watchToggle(k) {
    const t = todayStr(), C = watchChoices(t), saved = watchOf(watchTarget(t));
    let pick = arr(ui.watchPick || (saved ? saved.picks.map((p) => p.key) : C.rec)).slice();
    if (pick.includes(k)) pick = pick.filter((x) => x !== k);
    else { pick.push(k); if (pick.length > 2) pick.shift(); }
    ui.watchPick = pick;
    render(true);
  }
  // The tile's face: this week's two and how they're doing, or what to do.
  function watchFace() {
    const t = todayStr(), now = watchNow(), mon = mondayOf(t), target = watchTarget(t), next = target > mon ? watchOf(target) : null;
    const cs = now ? now.picks.filter((p) => !/^known-/.test(p.key)).map((p) => watchCount(p.key, mon)) : [], texts = cs.length ? cs[0].texts : 0, total = cs.reduce((a, c) => a + c.n, 0);
    const head = !now ? tileHero("—", "None picked for this week yet") : texts ? tileHero(String(total), total === 1 ? `time they came back this week, in ${texts} corrected text${texts === 1 ? "" : "s"}` : `times they came back this week, in ${texts} corrected text${texts === 1 ? "" : "s"}`) : tileHero("—", "No corrected text this week yet");
    const body = now ? watchRows(now, mon) : `<p class="small muted">Friday's « Plan next week » block picks the two for the week ahead, from the coach's suggestions.</p>`;
    const cta = target > mon ? (next ? `<p class="small muted">Next week's two are kept: ${esc(next.picks[0].label)} and ${esc((next.picks[1] || {}).label || "")}.</p>` : `<p class="small"><b>Next week's two aren't picked yet.</b> Open this to choose them.</p>`) : "";
    return head + body + cta;
  }
  // The planner: the choices for the week ahead, the coach's two first.
  function watchMore() {
    const t = todayStr(), target = watchTarget(t), C = watchChoices(t), saved = watchOf(target);
    const pick = arr(ui.watchPick || (saved ? saved.picks.map((p) => p.key) : C.rec));
    const opts = C.rows.map((r) => `<button type="button" class="wt-opt${pick.includes(r.key) ? " on" : ""}" data-act="watch-pick" data-k="${esc(r.key)}" aria-pressed="${pick.includes(r.key)}">
        <span class="wt-tick" aria-hidden="true">${pick.includes(r.key) ? "✓" : ""}</span>
        <span class="wt-main"><b>${esc(r.label)}</b>${C.rec.includes(r.key) && !r.profile ? `<span class="pill info">conseil du coach</span>` : ""}<small>${esc(watchEv(r))}</small>${r.ex ? `<small class="blk-ex">${watchEx(r.ex)}</small>` : ""}</span></button>`).join("");
    const look = C.was ? `<article class="dash-card"><div class="dash-ch"><h3 class="h3">${C.back === mondayOf(t) ? "Cette semaine · this week" : "La semaine dernière · last week"}</h3><span class="small muted">Your two, and how often they came back</span></div>${watchRows(C.was, C.back)}</article>` : "";
    return `${look}<article class="dash-card">
        <div class="dash-ch"><h3 class="h3">Pour la semaine du ${shortDate(target)}</h3><span class="small muted">${saved ? "Kept: change them if you like" : "Pick two"}</span></div>
        <p class="small muted">Look at your exit criteria and this week's misses, then keep the two mistakes you'll watch for in next week's writing. The coach's two come first: the ones that came back most in your last corrected texts, your error log and your drills.</p>
        <div class="wt-opts">${opts}</div>
        <div class="row"><button class="btn primary" data-act="watch-save" ${pick.length === 2 ? "" : "disabled"}>${saved ? "Keep these two" : "Watch these two"}</button><span class="small muted">${pick.length}/2 picked</span></div>
      </article>`;
  }
  // Aujourd'hui and the writing page: this week's two, a glance.
  function watchCard() {
    const w = watchNow();
    if (!w) return "";
    return `<section class="panel stack tight" data-spot><div class="row between"><h2 class="h3 with-ico">${ico("eye")}À surveiller<small class="muted"> · this week</small></h2><a class="small" href="#progress.week">Change</a></div>${watchRows(w, mondayOf(todayStr()))}</section>`;
  }
  function watchStrip() {
    const w = watchNow();
    if (!w) return "";
    return `<div class="wt-strip">${ico("eye")}<span><b>À surveiller cette semaine :</b> ${w.picks.map((p) => `<span class="wt-chip" title="${esc(p.ex ? `${p.ex.wrong} → ${p.ex.right}` : p.label)}">${esc(p.label)}</span>`).join("")}</span></div>`;
  }

  async function suggestHomework() {
    const s = settings(), P = T.PHASES[s.phase - 1];
    const counts = errorCounts(21).slice(0, 5).map(([c, v]) => `${CAT[c]}: ${v.n}`).join("; ") || "nothing logged yet";
    const open = list("homework").filter((h) => !h.done).map((h) => h.text);
    const routes = T.TOPICS.map((tp) => "grammar." + tp.id).concat(["vocab", "writing.t1", "writing.t2", "writing.t3", "comp.co", "comp.ce", "comp.ce.exam", "comp.co.exam"]);
    const prompt = `You set daily homework for a TCF Canada learner.\n${profile()}\nCurrent phase: ${s.phase}, ${P.name}: ${P.goal}\nMost frequent error categories over the last 3 weeks: ${counts}.\nOpen homework already assigned: ${open.join(" | ") || "none"}.\nSuggest 3 short, concrete homework tasks for tomorrow (5–15 minutes each), each aimed at one weakness, and say where to do it in the app, using one of: ${routes.join(", ")}.\nReply with only JSON: {"homework": [{"text": "task in ${replyLang()}, with French examples if useful", "go": "one of the routes"}]}`;
    const out = await ask("hw-suggest", prompt);
    if (!out) return;
    ui.hwSug = arr(out.homework).slice(0, 3).filter((h) => h && h.text).map((h) => ({ text: str(h.text), go: routes.includes(str(h.go)) ? str(h.go) : "" }));
    if (!ui.hwSug.length) toast("No suggestions came back. Try again.");
    render(true);
  }

  /* =============== view: grammar =============== */
  VIEWS.grammar = {
    render(args) {
      const id = args[0];
      if (id === "mixed") return grammarMixed();
      if (id === "mine") return grammarMine();
      if (id === "hunt") return grammarHunt();
      const tp = id && TOPIC[id];
      return tp ? grammarTopic(tp, args[1]) : grammarIndex();
    },
    after() {
      const d = ui.drill;
      const el = document.getElementById("drill-in");
      if (el && d && !d.checked && document.activeElement !== el) el.focus({ preventScroll: true });
      // Your mistakes: after Check, the text with what you found, and after each pick, the next card.
      if (mhScroll) {
        const go = mhScroll === "top" ? document.getElementById("drill-area") : document.querySelector(".mh-card.cur") || document.querySelector('[data-act="mh-results"]');
        mhScroll = "";
        if (go) go.scrollIntoView({ block: go.id === "drill-area" ? "start" : "nearest", behavior: "smooth" });
      }
      const h = ui.hunt;
      if (h && h.found && !h.verdicts && !isTyping(document.activeElement)) {
        const fix = [...document.querySelectorAll('[data-input="pr-fix"]')].find((x) => !x.value);
        if (fix) fix.focus({ preventScroll: true });
      }
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
      <header class="stack tight"><h1 class="title">Grammaire</h1>${fold("intro-grammar", "Comment ça marche · How it works", `<p class="small muted">Ordered by priority for you, from your own error history. Topics marked for Phase ${s.phase} are this phase's focus.</p>`)}</header>
      ${practiceRows()}
      <ol class="topics" data-m="chart" data-k="topics-list">${T.TOPICS.map((tp) => {
        const m = topicMastery(tp);
        const last = drillsFor(tp.id).filter((d) => d.set !== "prod" && d.total).slice(-1)[0];
        const p = tp.criterion.pct || null, v = last ? last.score / last.total : null;
        // The latest round as a ring, green once it reaches the target the tick marks.
        const ring = last ? CH.ring(v, { size: 34, stroke: 4, color: m.ok || (p && v >= p - 1e-9) ? "var(--green)" : "var(--accent)", target: p, text: String(Math.round(v * 100)), tip: `Latest round ${last.score}/${last.total} · ${shortDate(last.date)}${p ? `\nTarget ${Math.round(p * 100)} % on the day's first round` : ""}` }) : "";
        return `<li><a href="#grammar.${tp.id}">
          <span class="n">${tp.n}</span>
          <span class="t"><b>${esc(tp.title)}</b><small class="en-gloss">${esc(tp.en)}</small></span>
          <span class="meta">${tp.phase === s.phase ? `<span class="pill info">Phase ${tp.phase}</span>` : ""}${ring}${statusPill(m)}</span>
        </a></li>`;
      }).join("")}</ol>
      ${fold("low-priority", "Low priority: don't spend production time here", `<ul class="hw">${T.LOW_PRIORITY.map(([a, b]) => `<li style="grid-template-columns:minmax(0,1fr)"><span><b>${esc(a)}</b> · <span class="muted">${esc(b)}</span></span></li>`).join("")}</ul>`)}
    </div>`;
  }
  function drillBox(topicId) {
    const d = ui.drill;
    if (!d || d.topic !== topicId) return "";
    return d.done ? drillDone(d) : drillCard(d);
  }
  // The same round keeps the same key across redraws and a refresh, so its animations play once (motion.js).
  const roundKey = (d) => hk([d.topic, d.set, d.src, d.items.length, (d.items[0] || {}).q].join("|"));
  function drillCard(d) {
    const it = d.items[d.i], n = d.items.length, rk = roundKey(d), at = `${rk}-${d.i}`;
    // A right answer pops; a wrong one gives a small shake before the red-pen correction.
    const mark = (ok) => (d.checked ? (ok ? ` data-m="pop" data-k="ok-${at}"` : ` data-m="shake" data-k="no-${at}"`) : "");
    let q, extra = "";
    if (it.kind === "type") {
      const parts = typo(it.q).split("___");
      const cls = d.checked ? (d.verdict === "ok" ? "ok" : "bad") : "";
      const full = parts.length === 2 && !parts[0].trim() && !parts[1].trim();
      const w = Math.max(8, Math.min(34, Math.max(...it.a.map((a) => a.length)) + 3));
      const input = `<input id="drill-in" class="blank ${cls} ${full ? "blank-full" : ""}" type="text" data-input="drill" value="${esc(d.given)}" size="${w}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="fr" ${d.checked ? "readonly" : ""} aria-label="Your answer"${mark(d.verdict === "ok")}>`;
      q = parts.length === 2 ? parts[0] + input + parts[1] : typo(it.q) + " " + input;
      if (!d.checked) extra = accentBar();
    } else {
      q = typo(it.q).replace("___", "_____");
      extra = `<div class="choices">${it.order.map((k, pos) => {
        const opt = it.options[k];
        const st = d.checked ? (k === 0 ? "ok" : d.given === opt ? "bad" : "") : "";
        return `<button data-act="drill-pick" data-k="${k}" class="${st}" ${d.checked ? "disabled" : ""}${st ? mark(st === "ok") : ""}><span class="kbd">${pos + 1}</span><span>${typo(opt)}</span></button>`;
      }).join("")}</div>`;
    }
    let foot;
    if (d.checked) {
      const alts = it.a.length > 1 ? `<p class="small muted">Accepted: ${it.a.map(esc).join(" · ")}</p>` : "";
      const verdict = d.verdict === "ok"
        ? `<p class="pen-ok">Très bien !</p>`
        : `<p>${d.verdict === "accent" ? "<b>Almost: check your accents.</b> " : ""}${it.kind === "type" ? `<span class="pen-wrong">${esc(d.given)}</span> ` : ""}<span class="pen-right">${esc(it.a[0])}</span></p>`;
      foot = `<div class="verdict ${d.verdict === "ok" ? "ok" : "bad"}" data-m="pop" data-k="v-${at}">${verdict}${it.why ? `<p class="why">${typo(it.why)}</p>` : ""}${alts}</div>
        <div class="row"><button class="btn primary" data-act="drill-next">${d.i + 1 >= n ? "See results" : "Next"} <span class="kbd">Enter</span></button></div>`;
    } else {
      foot = it.kind === "type"
        ? `<div class="row"><button class="btn primary" data-act="drill-check">Check <span class="kbd">Enter</span></button><button class="btn ghost sm" data-act="drill-quit" title="Your answers so far are kept">Pause</button></div>`
        : `<div class="row"><span class="small muted">Pick an answer, or press 1–${it.options.length}.</span><button class="btn ghost sm" data-act="drill-quit" title="Your answers so far are kept">Pause</button></div>`;
    }
    const done = d.results.filter((r) => r && r.ok).length, w = (d.i / n) * 100;
    return `<section class="panel drill" id="drill-area">
      <div class="drill-head"><span class="eyebrow">${esc(d.title)}${d.src === "claude" ? " · new items from Claude" : d.src === "retry" ? " · retrying today's misses" : ""}</span><span class="small muted num">${d.i + 1} / ${n} · ${done} correct</span></div>
      <div class="bar"><i style="width:${w}%" data-tween="bar-${rk}" data-tw="width" data-to="${w}"></i></div>
      <div class="drill-q" data-m="slide" data-k="q-${at}">
        ${drillAsk(d, it)}
        ${it.src ? `<p class="src">${typo(it.src)}</p>` : ""}
        <p class="q">${q}</p>
        ${extra}
      </div>
      ${foot}
    </section>`;
  }
  // What the question asks you to do. In the mixed review it also says which topic the question is from.
  function drillAsk(d, it) {
    const tp = TOPIC[it.topic || d.topic];
    const ask = it.ask || (tp && (tp.sets.find((x) => x.id === d.set) || {}).ask) || "";
    const cat = d.topic === "mixed" && tp ? `<span class="pill info">${esc(tp.title)}</span>` : "";
    return ask || cat ? `<div class="row" style="gap:8px">${cat}<span class="h3">${esc(ask)}</span></div>` : "";
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
    const rk = roundKey(d);
    return `<section class="panel drill" id="drill-area" data-m="pop" data-k="done-${rk}">
      <div class="row between"><span class="eyebrow">${esc(d.title)} · results</span>${target != null && d.src !== "retry" ? `<span class="pill ${met ? "ok" : "warn"}"${met ? ` data-m="pop" data-k="met-${rk}"` : ""}>${met ? "Target met" : `Target ${pct(target)}`}</span>` : ""}</div>
      <div class="row"><span class="scorebig"><span data-tween="score-${rk}" data-tw="count" data-to="${score}">${score}</span>/${n}</span><span class="muted">${pct(score / n)}${d.src === "retry" ? " · retry rounds don't count toward mastery" : ""}</span></div>
      ${greet(...remyScore("drill", score, n, { key: rk, met: met && d.src !== "retry", retry: d.src === "retry" }), "sm")}
      ${breakdown}
      ${misses.length ? `<div class="stack tight"><p class="h3">Review</p><ul class="misses">${misses.map(({ it, k, r }) => `<li>
          ${it.point ? `<p><span class="pill">${esc(it.point)}</span></p>` : ""}
          ${it.ask ? `<p class="small muted">${esc(it.ask)}</p>` : ""}
          ${it.src ? `<p class="small muted fr">${typo(it.src)}</p>` : ""}
          <p class="fr">${typo(it.q).replace("___", "<b>___</b>")}</p>
          <p><span class="pen-wrong">${esc(r.given)}</span> <span class="pen-right">${esc(it.a[0])}</span></p>
          ${it.why ? `<p class="small muted">${typo(it.why)}</p>` : ""}
          ${r.claude ? `<p class="small ${r.claude.correct ? "" : "muted"}"><b>${r.claude.correct ? "Claude: your answer works too. Counted as correct." : "Claude: not quite."}</b> ${esc(r.claude.explanation)}</p>` : it.kind === "type" && !r.ok ? `<div>${claudeBtn("dispute-" + k, "drill-dispute", "Is my answer also correct?", `data-k="${k}"`, "btn ghost sm")}</div>` : ""}
        </li>`).join("")}</ul></div>` : `<p class="pen-ok" data-m="burst" data-k="perfect-${rk}">Sans faute !</p>`}
      <div class="row">
        ${retryBtn(d.topic, d.set, "btn primary")}
        ${d.topic !== "mixed" ? `<button class="btn" data-act="drill-start" data-topic="${d.topic}" data-set="${d.set}">New round</button>` : `<button class="btn" data-act="drill-start" data-topic="mixed" data-set="main">New round</button>`}
        <button class="btn ghost" data-act="drill-close">Close</button>
      </div>
      ${misses.some((x) => !x.r.ok) ? `<p class="small muted">Retrying asks the sentences you missed today, exactly as they were, until you get each one right. A new round starts with sentences you haven't had yet and gives extra room to the rules you keep missing.</p>` : ""}
    </section>`;
  }
  function grammarTopic(tp, setArg) {
    const s = settings();
    const m = topicMastery(tp);
    const active = ui.drill && ui.drill.topic === tp.id;
    // Build up: the set that counts toward mastery comes first; once it's mastered, the B2 set is next.
    const coreSet = tp.criterion.set;
    const b2Set = tp.sets.find((x) => x.level === "B2");
    const nextSet = m.ok && b2Set ? b2Set.id : coreSet;
    const seen = drillSeen();
    const sets = tp.sets.map((st) => {
      const unseen = setItems(tp.id, st).filter((x) => !seen.has(itemKey(tp.id, x))).length;
      const n = drillsFor(tp.id, st.id).length;
      const best = n ? pct(bestPct(tp.id, st.id)) : "—";
      const isNext = st.id === nextSet;
      const ipId = `drill--${tp.id}--${st.id}`, ip = ipGet(ipId);
      const startBtns = ip
        ? `<button class="btn primary sm" data-act="ip-resume" data-id="${esc(ipId)}">Resume · ${arr(ip.results).filter(Boolean).length}/${arr(ip.items).length}</button><button class="btn sm" data-act="drill-start" data-topic="${tp.id}" data-set="${st.id}" data-fresh="1">Start over</button>`
        : `<button class="btn ${isNext ? "primary" : ""} sm" data-act="drill-start" data-topic="${tp.id}" data-set="${st.id}">Start</button>`;
      const retry = active ? "" : retryBtn(tp.id, st.id, "btn sm");
      return `<div class="set-row">
        <div class="stack tight" style="gap:4px">
          <span class="row" style="gap:8px"><span class="lvl ${st.level === "B2" ? "b2" : ""}">${esc(st.level)}</span><b>${esc(st.title)}</b>${isNext ? `<span class="pill info">Up next</span>` : ""}</span>
          <span class="small muted">${Math.min(st.take, st.items.length)} per round · ${unseen ? `${unseen} of ${st.items.length} sentences not had yet` : `all ${st.items.length} sentences had, oldest first`} · ${st.kind === "choice" ? "multiple choice" : "type the answer"} · best ${best}${st.id === coreSet ? " · counts toward mastery" : ""}</span>
        </div>
        <span class="row">${startBtns}${retry}${claudeBtn("gen-" + tp.id + "." + st.id, "drill-gen", "New items from Claude", `data-topic="${tp.id}" data-set="${st.id}"`, "btn sm")}</span>
      </div>`;
    }).join("");
    const pr = tp.prod ? prodPanel(tp) : "";
    const head = `<div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Topic ${tp.n} · Phase ${tp.phase} focus${tp.phase === s.phase ? " · this phase" : ""}</p><h1 class="title">${esc(tp.title)}<small class="en-gloss">${esc(tp.en)}</small></h1>${fxTabs("grammar." + tp.id)}</header>`;
    // During a round: the question, with the notes a tap away. History and mastery come back with the results.
    if (active && !ui.drill.done) return `<div class="wrap focus">${head}${drillBox(tp.id)}${fold("notes-" + tp.id, "Notes · L'essentiel, tes erreurs, des exemples", `<div class="notes">${topicNotes(tp)}</div>`)}</div>`;
    return `<div class="wrap">
      ${head}
      <div class="grid-side">
        <div class="stack">
          ${active ? drillBox(tp.id) : `<section class="panel stack tight" id="drill-area"><p class="h3">Drill</p><p class="small muted">${esc(tp.exercise)}</p>${sets}</section>`}
          ${pr}
          <section class="stack tight"><p class="h3">History</p>${recentRounds(tp.id)}</section>
        </div>
        <aside class="side">
          <section class="panel stack tight"><p class="h3">Mastery</p><p class="small">${esc(tp.criterion.text)}</p>${m.parts.map((p2) => `<p class="small"><b style="color:var(${p2.ok ? "--green" : "--ink-3"})">${p2.ok ? "✓" : "○"}</b> ${esc(p2.note)}</p>`).join("")}</section>
          <section class="panel stack tight notes"><p class="h3">Notes</p>${topicNotes(tp)}</section>
        </aside>
      </div>
    </div>`;
  }
  // A topic's notes, each a fold: what to master and why, your own mistakes on it, and examples.
  function topicNotes(tp) {
    return `${fold("why-" + tp.id, "L'essentiel · Why it matters", `<div class="stack tight"><p class="small">${typo(tp.why)}</p>${tp.know ? `<p class="small muted"><b>Already know:</b> ${typo(tp.know)}</p>` : ""}<p class="small"><b>Master:</b> ${typo(tp.master)}</p></div>`)}
      ${tp.mistakes.length ? fold("mist-" + tp.id, "Tes erreurs · Your mistakes", `<ul class="mistakes">${tp.mistakes.map(([w, r]) => `<li><span class="pen-wrong">${typo(w)}</span><span class="pen-right">${typo(r)}</span></li>`).join("")}</ul>`) : ""}
      ${fold("ex-" + tp.id, "Exemples · Examples", `<div class="examples">${tp.examples.map(([f, e]) => `<div><p>${typo(f)}</p><p>${esc(e)}</p></div>`).join("")}</div>`)}`;
  }
  // A topic's last five finished rounds; the full list, with every question, is in Progrès → Historique.
  function recentRounds(topicId) {
    const rounds = drillsFor(topicId).filter((d) => d.set !== "prod").slice(-5).reverse();
    if (!rounds.length) return `<p class="small muted">No finished rounds yet.</p>`;
    const tp = TOPIC[topicId];
    return `<ul class="hw">${rounds.map((d) => {
      const st = tp && tp.sets.find((x) => x.id === d.set);
      return `<li style="grid-template-columns:auto minmax(0,1fr) auto"><span class="num small">${shortDate(d.date)}</span><span>${esc(d.name || (st ? st.title : "Mixed review"))} · <b>${d.score}/${d.total}</b>${retriesOf(d).length ? ` <span class="small muted">· retry ${retryScores(d)}</span>` : ""}</span><button class="btn ghost sm" data-act="h-show" data-id="${esc(d.id)}" data-f="grammar">Review</button></li>`;
    }).join("")}</ul><a class="small" href="#progress.history">All your history →</a>`;
  }
  function prodPanel(tp) {
    // Your saved answer comes back after a reload or on another device.
    if (!ui.prod[tp.id]) { const ip = ipGet("prod--" + tp.id); if (ip) ui.prod[tp.id] = { text: str(ip.text) }; }
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
    const ip = ipGet("drill--mixed");
    const startBtns = ip
      ? `<button class="btn primary" data-act="ip-resume" data-id="drill--mixed">Resume · ${arr(ip.results).filter(Boolean).length}/${arr(ip.items).length}</button><button class="btn" data-act="drill-start" data-topic="mixed" data-set="main" data-fresh="1">Start over</button>`
      : `<button class="btn primary" data-act="drill-start" data-topic="mixed" data-set="main">Start mixed review</button>`;
    const focus = active && !ui.drill.done;
    return `<div class="wrap${focus ? " focus" : ""}">
      <div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Révision mixte</p><h1 class="title">Mixed review<small>15 items from the topics you've drilled, up to this phase</small></h1>${focus ? "" : fold("intro-mixed", "Comment ça marche · How it works", `<p class="small muted">It takes every topic of this phase and the earlier ones that you've drilled (Phase 1's four until you have), so what you learned weeks ago keeps coming back. The topics you missed most in the last two weeks come first, then the ones practised longest ago. The difficulty follows your phase: B1 in Phase 1, up to B1+ in Phase 2, B1+ and B2 from Phase 3. The results tell you which topic is still weakest.</p>`)}</header>
      ${active ? drillBox("mixed") : `<section class="panel stack tight" id="drill-area"><p class="small muted">A fresh mix every round.</p><div class="row">${startBtns}${retryBtn("mixed", "main")}</div></section>`}
      ${focus ? "" : `<section class="stack tight"><p class="h3">History</p>${recentRounds("mixed")}</section>`}
    </div>`;
  }

  // The ways to practise across topics, as three tiles above the topic list.
  function practiceRows() {
    const ms = mineStatus(), todo = ms.filter((m) => m.state !== "fixed").length;
    const tile = (href, icon, title, note, primary) => `<a class="tile-card${primary ? " primary" : ""}" href="${href}" data-spot><span class="tile-ico">${ico(icon)}</span><b>${title}</b><span class="small muted">${note}</span><span class="tile-go" aria-hidden="true">→</span></a>`;
    return `<div class="tiles">
      ${tile("#grammar.mixed", "grammar", "Mixed review", "15 items from the topics you've drilled, the most missed first.", true)}
      ${tile("#grammar.mine", "errors", "Your mistakes", ms.length ? `${todo} of your ${ms.length} mistakes to practise, back in your own texts: find them, then pick the fix.` : "Your own texts with your mistakes put back: find them, then pick the fix.")}
      ${tile("#grammar.hunt", "bilan", "Find the mistakes", "Proofread a short text: tap the mistakes, then correct them.")}
    </div>`;
  }
  const MINE_STATE = { missed: ["Missed last time", "bad"], new: ["New", "info"], once: ["Right once", ""], fixed: ["Fixed", "ok"] };
  // Over a text opened again from the history: which attempt it is.
  const textReviewNote = (rv, picksLost) => `<p class="notice small">You're looking at your attempt from ${shortDate(rv.date)} (${rv.score}/${rv.total}).${picksLost ? " The words you marked that were fine weren't kept back then." : ""}</p>`;
  function grammarMine() {
    const all = mineAll();
    const ms = all.filter((m) => m.kind === "error" || m.kind === "pending"), tips = all.filter((m) => m.kind === "style"), skips = all.filter((m) => m.kind === "skip");
    const hidden = arr(settings().mineHidden).length;
    const drillOn = ui.drill && ui.drill.topic === "mine", h = !drillOn && ui.mh;
    const focus = drillOn ? !ui.drill.done : !!h && !h.done;
    const body = drillOn ? drillBox("mine") : h ? mineBox(h, all) : mineIntro(all, ms, tips);
    const order = Object.keys(MINE_STATE);
    const row = (m, pill, hide) => {
      const why = (m.use && m.use.why) || m.why;
      return `<li><div class="fix"><span class="pen-wrong">${esc(m.wrong)}</span><span class="pen-right">${esc((m.use && m.use.right) || m.a[0])}</span>${pill}${m.n > 1 ? `<span class="pill warn">made ${m.n}×</span>` : ""}<span class="pill">${esc(CAT[m.cat])}</span>${hide ? `<button class="btn ghost sm" data-act="mine-hide" data-k="${esc(m.key)}" title="Not a real mistake? Leave it out of Your mistakes">Hide</button>` : ""}</div>${why ? `<p class="why">${esc(why)}</p>` : ""}</li>`;
    };
    const statePill = (m) => (m.kind === "pending" ? `<span class="pill">Not prepared yet</span>` : `<span class="pill ${MINE_STATE[m.state][1]}">${MINE_STATE[m.state][0]}</span>`);
    const lists = [
      ms.length ? `<details class="fold"><summary>All your mistakes · ${ms.length}</summary><ul class="errs" style="margin-top:10px">${ms.slice().sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state) || b.n - a.n || b.ts - a.ts).map((m) => row(m, statePill(m), true)).join("")}</ul></details>` : "",
      tips.length ? `<details class="fold"><summary>Conseils de style · ${tips.length} style tip${tips.length > 1 ? "s" : ""}</summary><p class="small muted" style="margin-top:8px">What you wrote was already correct French; Claude's version sounds more natural. They're practised apart (« Which sounds more natural? ») and never counted as mistakes.</p><ul class="errs" style="margin-top:10px">${tips.map((m) => row(m, `<span class="pill tip">Style</span>`, true)).join("")}</ul></details>` : "",
      skips.length ? `<details class="fold"><summary>Pas une faute · ${skips.length} left out</summary><p class="small muted" style="margin-top:8px">Claude found these aren't points of French (a name, punctuation, a missing sentence), so they're not practised.</p><ul class="errs" style="margin-top:10px">${skips.map((m) => row(m, "", false)).join("")}</ul></details>` : "",
    ].join("");
    return `<div class="wrap${focus ? " focus" : ""}">
      <div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Mes erreurs</p><h1 class="title">Your mistakes<small>Your own text with your mistakes back in it: find them, then pick the fix</small></h1>${focus ? "" : fold("intro-mine", "Where they come from", `<p class="small muted">Every mistake from Claude's corrections of your writing and production checks, and from your error log.</p>`)}</header>
      ${body}
      ${focus ? "" : `${lists}
      ${hidden ? `<p class="small muted">${hidden} hidden from Your mistakes. <button class="btn ghost sm" data-act="mine-unhide">Show them again</button></p>` : ""}
      <section class="stack tight"><p class="h3">History</p>${recentRounds("mine")}</section>`}
    </div>`;
  }
  // Before a round: where your mistakes stand, the next text (as a scrap of your notebook), and Claude's preparation.
  function mineIntro(all, ms, tips) {
    if (!all.length) return `<section class="panel stack tight" id="drill-area"><div class="empty">${greet("bonjour", "Rien pour l'instant.", "Nothing yet. When Claude corrects a writing task or a production check, or you log an error in Progrès, the mistakes come here.", "sm")}</div></section>`;
    const count = (st) => ms.filter((m) => m.state === st).length, fixed = count("fixed");
    const next = mineNextText(all);
    const loose = mineLoose(ms, 3, new Set(next ? next.mistakes.map((x) => norm(x[4])) : []));
    const byKey = new Map(all.map((m) => [m.key, m]));
    const inNext = (st) => (next ? next.mistakes.filter((x) => (byKey.get(norm(x[4])) || {}).state === st).length : 0);
    const n = next ? next.mistakes.length : 0;
    const card = next ? `<button class="mh-next seyes" data-act="mh-start" data-spot data-m="rise" data-k="mhnext-${esc(next.ref)}">
        <span class="mh-next-tape" aria-hidden="true"></span>
        <span class="eyebrow">Prochain texte · next text</span>
        <b class="mh-next-title">${esc(next.title)}</b>
        ${next.sujet ? `<span class="mh-next-sujet">${typo(clip(next.sujet, 150))}</span>` : ""}
        <span class="mh-next-chips"><span class="pill bad">${n} faute${n > 1 ? "s" : ""} to find</span>${inNext("new") ? `<span class="pill info">${inNext("new")} new</span>` : ""}${inNext("missed") ? `<span class="pill warn">${inNext("missed")} missed last time</span>` : ""}${loose.length ? `<span class="pill">+ ${loose.length} hors texte</span>` : ""}</span>
        <span class="mh-next-go" aria-hidden="true">→</span>
      </button>` : "";
    const backlog = mineBacklog(), bg = backlog.some((s) => busy["mine-prep-" + s.ref]);
    const p = prepRun ? (prepRun.done / prepRun.total) * 100 : 0;
    const prep = !backlog.length ? "" : prepRun
      ? `<div class="mh-prep" data-m="rise" data-k="mhprep-run"><div class="row between"><span class="small"><span class="thinking">Claude is preparing your texts</span> · <b class="num">${prepRun.done} of ${prepRun.total}</b> ready</span><button class="btn ghost sm" data-act="mine-prep-stop">Stop</button></div><div class="bar"><i style="width:${p}%" data-tween="mhprep" data-tw="width" data-to="${p}"></i></div></div>`
      : claudeOn()
        ? `<div class="mh-prep" data-m="rise" data-k="mhprep-${backlog.length}"><p class="small"><b>${backlog.length} ${backlog.length === 1 ? "text" : "texts"} to prepare.</b> Claude reads each corrected text once, puts your mistakes back in it and writes the options, so every question has exactly one right answer.${bg ? " <span class=\"thinking\">Your latest correction is being prepared</span>" : ""}</p><div class="row"><button class="btn sm" data-act="mine-prep">Prepare ${backlog.length === 1 ? "it" : `all ${backlog.length}`} with Claude</button></div></div>`
        : `<p class="small muted">${backlog.length} ${backlog.length === 1 ? "text is" : "texts are"} waiting for Claude, which prepares them when this page is opened on claude.ai. Until then their mistakes are asked as a choice between the correction and what you wrote.</p>`;
    const tipsReady = tips.filter((m) => m.use).length, styleIp = ipGet("drill--mine--style");
    const style = !tipsReady ? "" : styleIp
      ? `<button class="btn" data-act="ip-resume" data-id="drill--mine--style">Resume the style tips · ${arr(styleIp.results).filter(Boolean).length}/${arr(styleIp.items).length}</button>`
      : `<button class="btn" data-act="drill-start" data-topic="mine" data-set="style" title="Where what you wrote was already correct: which sounds more natural?">Conseils de style · ${Math.min(10, tipsReady)}</button>`;
    const start = next ? `<button class="btn primary" data-act="mh-start">Start this text</button>` : loose.length ? `<button class="btn primary" data-act="mh-start">Practise ${loose.length}</button>` : "";
    const counts = ms.length ? `<p><b>${ms.length - fixed} of your ${ms.length} mistakes</b> to practise${count("new") ? `, ${count("new")} of them new` : ""}${fixed ? ` · ${fixed} fixed` : ""}${tips.length ? ` · ${tips.length} style tip${tips.length > 1 ? "s" : ""}` : ""}.</p>` : `<p>${tips.length} style tip${tips.length > 1 ? "s" : ""} to practise.</p>`;
    return `<section class="panel stack tight mh-intro" id="drill-area">
      ${counts}
      ${card}
      ${prep}
      <div class="row">${start}${retryBtn("mine", "errors")}${style}${retryBtn("mine", "style")}</div>
      ${fold("how-mine", "Comment ça marche · How it works", `<p class="small muted">A round is one of your corrected texts with every mistake Claude found in it put back, exactly as you wrote it; the rest is the corrected version. Tap the words that look wrong and check, then pick the right version of each mistake you found, from four. A mistake is caught when it's found and fixed, and fixed once you've caught it twice in a row. Your EE drafts come first, the one with the most mistakes not fixed yet. Mistakes that aren't in a text (from your error log) come as « Hors texte » cards, and style tips, where what you wrote was already correct, are practised apart.</p>`)}
    </section>`;
  }
  // A round: the text to proofread, then a card for each mistake found, then the results.
  function mineBox(h, all) {
    const pr = h.pr, key = hk((pr ? pr.ref : "loose") + "|" + h.at), n = pr ? pr.mistakes.length : 0;
    const head = `<div class="drill-head"><span class="eyebrow">Mes erreurs · ${pr ? esc(pr.title) : "Hors texte"}</span>${pr ? `<span class="small muted num">${n} faute${n > 1 ? "s" : ""}</span>` : ""}</div>${pr && pr.sujet ? `<p class="mh-sujet"><b>Sujet :</b> ${typo(clip(pr.sujet, 220))}</p>` : ""}`;
    if (pr && !h.found) {
      return `<section class="panel drill mh" id="drill-area">${head}
        <p class="small muted">Your text is back with all ${n} of your mistakes in it, as you wrote them; everything else is corrected. Tap each word that looks wrong (tap it again to unmark it), then check.</p>
        ${mhText(pr, h, key)}
        <div class="row"><button class="btn primary" data-act="mh-check">Check · ${h.picks.length} marked</button><button class="btn ghost sm" data-act="mh-close">Close</button></div>
      </section>`;
    }
    const shown = mhShown(h), found = pr ? h.found.filter(Boolean).length : 0;
    const extra = h.extra ? `${h.extra} word${h.extra > 1 ? "s" : ""} marked that ${h.extra > 1 ? "were" : "was"} fine` : "";
    if (!h.done) {
      const picked = shown.filter((ci) => h.pick[ci] != null).length, w = shown.length ? (picked / shown.length) * 100 : 100;
      const cur = shown.find((ci) => h.pick[ci] == null);
      const said = pr ? `<p>You found <b>${found} of ${n}</b>${extra ? `, and ${extra}` : ""}.${found ? " Now pick the right version of each one." : ""}${found < n ? " The ones you missed are underlined in red; their corrections come with the results." : ""}</p>` : `<p>Mistakes that aren't in one of your texts. Pick the right version of each.</p>`;
      return `<section class="panel drill mh" id="drill-area">${head}
        ${said}
        ${pr ? mhText(pr, h, key) : ""}
        ${shown.length ? `<div class="mh-progress"><span class="small muted num">Corrigées ${picked} / ${shown.length}</span><div class="bar"><i style="width:${w}%" data-tween="mhbar-${key}" data-tw="width" data-to="${w}"></i></div></div>
        <ol class="mh-cards" id="mh-cards">${shown.map((ci) => mhCard(h, ci, key, ci === cur)).join("")}</ol>` : ""}
        <div class="row">${cur == null ? `<button class="btn primary" data-act="mh-results">See results <span class="kbd">Enter</span></button>` : `<span class="small muted">Pick an option, or press 1–${h.cards[cur].order.length}.</span>`}<button class="btn ghost sm" data-act="mh-close" title="${cur == null ? "Your text is saved" : "This text isn't kept until every card is answered"}">Close</button></div>
      </section>`;
    }
    // A card off the text is found by being there, unless it's a mistake of an older round no longer in its text.
    const rows = h.cards.map((c, ci) => ({ c, found: c.k < 0 ? c.found !== false : !!h.found[c.k], p: h.pick[ci] })).map((x) => Object.assign(x, { ok: x.found && x.p === 0 }));
    const caught = rows.filter((x) => x.ok).length, misses = rows.filter((x) => !x.ok), perfect = !misses.length && !h.extra;
    const next = !!mineNextText(all);
    const rv = h.review;
    return `<section class="panel drill mh" id="drill-area" data-m="pop" data-k="mhdone-${key}">${head}
      ${rv ? textReviewNote(rv, h.extra && !h.picks.length) : ""}
      <div class="row mh-score"><span class="scorebig"><span data-tween="mhs-${key}" data-tw="count" data-to="${caught}">${caught}</span>/${rows.length}</span><span class="muted">caught: found and fixed${pr ? ` · found ${found} of ${n}` : ""}${extra ? ` · ${extra}` : ""}</span></div>
      ${greet(...remyScore("mine", caught, rows.length, { key }), "sm")}
      ${pr ? mhText(pr, h, key) : ""}
      ${misses.length ? `<div class="stack tight"><p class="h3">À revoir · to look at again</p><ul class="misses">${misses.map(({ c, found: f }, i) => `<li data-m="rise" data-k="mhmiss-${key}-${i}">
          <p class="row" style="gap:6px">${c.k >= 0 ? `<span class="pr-n bad">${c.k + 1}</span>` : `<span class="pill">Hors texte</span>`}<span class="pill bad">${f ? "Wrong fix" : "Not spotted"}</span><span class="pill">${esc(CAT[catOf(c.cat)])}</span></p>
          <p class="pd" data-m="pen" data-k="mhrd-${key}-${i}">${penDiff(c.wrong, c.options[0])}</p>
          ${c.why ? `<p class="small muted">${typo(c.why)}</p>` : ""}
        </li>`).join("")}</ul></div>` : ""}
      ${perfect ? `<p class="pen-ok mh-perfect" data-m="burst" data-k="mhperfect-${key}">Sans faute !</p>` : ""}
      ${pr ? `<details class="fold"><summary>The corrected text</summary><div class="pr-text" lang="fr"><p>${typo(pr.corrected).replace(/\n+/g, "</p><p>")}</p></div></details>` : ""}
      <div class="row">${rv ? "" : retryBtn("mine", "errors", "btn primary")}${next ? `<button class="btn${rv ? " primary" : ""}" data-act="mh-start">Next text</button>` : ""}<button class="btn ghost" data-act="mh-close">Close</button></div>
    </section>`;
  }
  // Your text in a round: words to tap while you look for the mistakes; then the ones found in blue ink and the
  // ones missed underlined in red, each numbered; and, as you fix each one (and for all of them once the round is
  // over), your words struck out in red pen with the correction written in.
  function mhText(pr, h, key) {
    const toks = prTokens(pr), picks = new Set(h.picks), ciOf = new Map();
    h.cards.forEach((c, ci) => { if (c.k >= 0) ciOf.set(c.k, ci); });
    const state = (k) => (!h.found[k] ? "missed" : h.pick[ciOf.get(k)] == null ? "open" : h.pick[ciOf.get(k)] === 0 ? "ok" : "bad");
    const rewritten = (k) => { const s = state(k); return s === "ok" || s === "bad" || (h.done && s === "missed"); };
    const cls = (k) => (state(k) === "open" ? "mh-found" : "pr-missed");
    const drawn = new Set();
    let html = "";
    toks.forEach((t, i) => {
      const prev = toks[i - 1] || {}, next = toks[i + 1] || {};
      if (t.sp) {
        if (/\n/.test(t.sp)) html += "</p><p>";
        else if (h.found && prev.k >= 0 && prev.k === next.k) html += rewritten(prev.k) ? "" : `<span class="pr-w ${cls(prev.k)}"> </span>`;
        else html += /^[?!:;»]/.test(next.w || "") || /«$/.test(prev.w || "") ? NB : " ";
        return;
      }
      const word = /[\p{L}\p{N}]/u.test(t.w);
      if (!h.found) {
        html += word ? `<span class="pr-w${picks.has(i) ? " sel" : ""}"${picks.has(i) ? ` data-m="pop" data-k="mhsel-${key}-${i}"` : ""} data-act="mh-tok" data-i="${i}">${esc(t.w)}</span>` : esc(t.w);
        return;
      }
      if (t.k < 0) { html += word && picks.has(i) ? `<span class="pr-w pr-false">${esc(t.w)}</span>` : esc(t.w); return; }
      const k = t.k, s = state(k), first = !drawn.has(k);
      drawn.add(k);
      const badge = first ? `<sup class="pr-n${s === "ok" ? " ok" : s === "open" ? "" : " bad"}">${k + 1}</sup>` : "";
      if (rewritten(k)) {
        if (first) html += `${badge}<span class="mh-fixed ${s}" data-m="pen" data-k="mhfix-${key}-${k}"><del>${esc(pr.mistakes[k][0])}</del><ins>${typo(pr.mistakes[k][1][0])}</ins></span>`;
        return;
      }
      html += `${badge}<span class="pr-w ${cls(k)}">${esc(t.w)}</span>`;
    });
    return `<div class="pr-text mh-text seyes" lang="fr"><p>${html}</p></div>`;
  }
  // One mistake's card: the words in the text (or, off the text, its sentence) and four versions to pick from.
  // Once picked: the right one pops, a wrong one shakes, and the red pen shows exactly what changed.
  function mhCard(h, ci, key, cur) {
    const c = h.cards[ci], p = h.pick[ci], done = p != null;
    const head = c.k >= 0
      ? `<span class="pr-n">${c.k + 1}</span><span class="mh-was">« ${typo(c.wrong)} »</span>`
      : `<span class="pill">Hors texte</span>${c.q && c.q !== "___" ? `<span class="mh-q">${typo(c.q).replace("___", "<b>_____</b>")}</span>` : ""}`;
    const opts = c.order.map((oi, pos) => {
      const st = done ? (oi === 0 ? "ok" : oi === p ? "bad" : "dim") : "";
      const anim = !done ? "" : oi === p ? (oi === 0 ? ` data-m="pop" data-k="mhok-${key}-${ci}"` : ` data-m="shake" data-k="mhno-${key}-${ci}"`) : oi === 0 ? ` data-m="pop" data-k="mhright-${key}-${ci}"` : "";
      return `<button data-act="mh-pick" data-c="${ci}" data-o="${oi}"${st ? ` class="${st}"` : ""}${done ? " disabled" : ""}${anim}><span class="kbd">${pos + 1}</span><span>${typo(c.options[oi])}</span></button>`;
    }).join("");
    const after = done ? `<div class="mh-after">${p === 0 ? `<p class="pen-ok" data-m="pop" data-k="mhtb-${key}-${ci}">Très bien !</p>` : ""}<p class="pd" data-m="pen" data-k="mhd-${key}-${ci}">${penDiff(c.wrong, c.options[0])}</p>${c.why ? `<p class="why">${typo(c.why)}</p>` : ""}</div>` : "";
    return `<li class="mh-card${done ? (p === 0 ? " ok" : " bad") : cur ? " cur" : ""}" data-m="rise" data-k="mhc-${key}-${ci}"><div class="mh-card-head">${head}</div><div class="choices">${opts}</div>${after}</li>`;
  }
  // What changed between what you wrote and the correction, in red pen: the words taken out struck through and
  // the words put in written in; a word changed by a letter or two shows just those letters.
  function lcsOps(A, B) {
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push(["=", A[i]]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) ops.push(["-", A[i++]]);
      else ops.push(["+", B[j++]]);
    }
    while (i < n) ops.push(["-", A[i++]]);
    while (j < m) ops.push(["+", B[j++]]);
    return ops;
  }
  function letterDiff(x, y) {
    let html = "", mode = "=", buf = "";
    const flush = () => { if (buf) html += mode === "=" ? esc(buf) : `<${mode === "-" ? "del" : "ins"}>${esc(buf)}</${mode === "-" ? "del" : "ins"}>`; buf = ""; };
    for (const [m, ch] of lcsOps([...x], [...y])) { if (m !== mode) { flush(); mode = m; } buf += ch; }
    flush();
    return html;
  }
  function penDiff(a, b) {
    const A = str(a).trim().split(/\s+/).filter(Boolean), B = str(b).trim().split(/\s+/).filter(Boolean);
    const ops = lcsOps(A, B), out = [];
    for (let i = 0; i < ops.length;) {
      if (ops[i][0] === "=") { out.push(typo(ops[i][1])); i++; continue; }
      const del = [], ins = [];
      while (i < ops.length && ops[i][0] !== "=") { (ops[i][0] === "-" ? del : ins).push(ops[i][1]); i++; }
      const same = del.length === 1 && ins.length === 1 ? lcsOps([...del[0]], [...ins[0]]).filter((o) => o[0] === "=").length : 0;
      if (same && same >= Math.max(del[0].length, ins[0].length) / 2) out.push(letterDiff(del[0], ins[0]));
      else out.push([del.length ? `<del>${typo(del.join(" "))}</del>` : "", ins.length ? `<ins>${typo(ins.join(" "))}</ins>` : ""].filter(Boolean).join(" "));
    }
    return out.join(" ");
  }

  /* =============== find the mistakes =============== */
  // A text from proofread.js as tokens: words (with any punctuation attached) and the spaces between them. Each
  // word knows the mistake it belongs to (-1 for none), so a tap on any word of a mistake finds it without the
  // page showing where the mistake starts or ends.
  const PR = T.PROOFREAD || [];
  function prTokens(pr) {
    const out = [];
    pr.text.split(/(\{\d+\})/).forEach((part) => {
      const m = part.match(/^\{(\d+)\}$/), k = m ? Number(m[1]) : -1;
      (m ? pr.mistakes[k][0] : part).split(/(\s+)/).forEach((w) => { if (w) out.push(/^\s+$/.test(w) ? { sp: w } : { w, k }); });
    });
    return out;
  }
  // The text: tappable while looking for mistakes, then marked: mistakes found, mistakes missed (numbered) and
  // words tapped that were fine.
  function prText(pr, h) {
    const toks = prTokens(pr), picks = new Set(h.picks), numbered = new Set();
    const cls = (k, i) => (k >= 0 ? (h.found[k] ? "pr-found" : "pr-missed") : picks.has(i) ? "pr-false" : "");
    let html = "";
    toks.forEach((t, i) => {
      const prev = toks[i - 1] || {}, next = toks[i + 1] || {};
      if (t.sp) {
        if (/\n/.test(t.sp)) html += "</p><p>";
        else if (/^[?!:;»]/.test(next.w || "") || /«$/.test(prev.w || "")) html += NB;
        else if (h.found && prev.k >= 0 && prev.k === next.k) html += `<span class="pr-w ${cls(prev.k)}"> </span>`;
        else html += " ";
        return;
      }
      if (!/[\p{L}\p{N}]/u.test(t.w)) { html += esc(t.w); return; }
      if (!h.found) { html += `<span class="pr-w${picks.has(i) ? " sel" : ""}"${picks.has(i) ? ` data-m="pop" data-k="sel-${pr.id}-${i}"` : ""} data-act="pr-tok" data-i="${i}">${esc(t.w)}</span>`; return; }
      const num = t.k >= 0 && !numbered.has(t.k) ? (numbered.add(t.k), `<sup class="pr-n">${t.k + 1}</sup>`) : "";
      html += `${num}<span class="pr-w ${cls(t.k, i)}">${esc(t.w)}</span>`;
    });
    return `<div class="pr-text" lang="fr"><p>${html}</p></div>`;
  }
  const prCorrected = (pr) => `<div class="pr-text" lang="fr"><p>${pr.text.split(/(\{\d+\})/).map((part) => { const m = part.match(/^\{(\d+)\}$/); return m ? `<b class="pr-fix">${typo(pr.mistakes[Number(m[1])][1][0])}</b>` : typo(part).replace(/\n+/g, "</p><p>"); }).join("")}</p></div>`;
  // The sentence a mistake is in, with a gap in its place and the other mistakes corrected, for the history.
  function prSentence(pr, k) {
    const full = pr.text.replace(/\{(\d+)\}/g, (_, j) => (Number(j) === k ? "\u0000" : pr.mistakes[Number(j)][1][0]));
    return (full.split(/\n+|(?<=[.!?…])\s+/).find((x) => x.includes("\u0000")) || "\u0000").replace("\u0000", "___").trim();
  }
  const huntLevel = () => ui.huntLevel || huntLadder().level;
  // The next text at a level: the first not done yet, or else the one done longest ago.
  function huntNext(level) {
    const last = new Map();
    list("drills").forEach((d) => { if (d.topic === "hunt") last.set(d.text, Math.max(last.get(d.text) || 0, d.ts || 0)); });
    const pool = PR.filter((p) => p.level === level);
    return pool.find((p) => !last.has(p.id)) || pool.slice().sort((a, b) => last.get(a.id) - last.get(b.id))[0] || null;
  }
  function huntStart(again) {
    const pr = again || huntNext(huntLevel());
    if (!pr) return;
    ui.hunt = { id: pr.id, picks: [], found: null, extra: 0, fixes: {}, verdicts: null, secs: 0, lastT: Date.now() };
    render(true);
    const el = document.getElementById("drill-area");
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function huntTap(i) {
    const h = ui.hunt;
    if (!h || h.found) return;
    h.picks = h.picks.includes(i) ? h.picks.filter((x) => x !== i) : h.picks.concat(i);
    activeTick(h);
    render(true);
  }
  function huntCheck() {
    const h = ui.hunt, pr = h && PR.find((x) => x.id === h.id);
    if (!pr || h.found) return;
    if (!h.picks.length) { toast("Tap the words you think are wrong first."); return; }
    const toks = prTokens(pr);
    h.found = pr.mistakes.map((_, k) => h.picks.some((i) => toks[i] && toks[i].k === k));
    h.extra = h.picks.filter((i) => toks[i] && toks[i].k < 0).length;
    if (h.found.some(Boolean)) render(true); else huntFinish();
  }
  // Scores each mistake (caught = found and corrected) and saves the text as a finished round in drills.
  function huntFinish() {
    const h = ui.hunt, pr = h && PR.find((x) => x.id === h.id);
    if (!pr || !h.found || h.verdicts) return;
    document.querySelectorAll('[data-input="pr-fix"]').forEach((el) => { h.fixes[el.dataset.k] = el.value; });
    if (h.found.some((f, k) => f && !str(h.fixes[k]).trim())) { toast("Type a correction for each mistake you found."); return; }
    h.verdicts = pr.mistakes.map(([, a], k) => (h.found[k] ? checkAnswer({ a }, str(h.fixes[k])) : "missed"));
    activeTick(h, 300);
    const items = pr.mistakes.map(([wrong, a, , why], k) => ({ kind: "type", src: `« ${wrong} »`, q: prSentence(pr, k), a, why: (h.found[k] ? "" : "Not spotted. ") + why, given: h.found[k] ? str(h.fixes[k]) : "", ok: h.verdicts[k] === "ok" }));
    put("drills", uid(), { topic: "hunt", set: "main", name: pr.title, text: pr.id, level: pr.level, date: todayStr(), ts: Date.now(), score: items.filter((x) => x.ok).length, total: items.length, found: h.found.filter(Boolean).length, extra: h.extra, src: "bank", secs: Math.round(h.secs || 0), items, picks: h.picks.slice() });
    autoTick("grammar.hunt", { min: (h.secs || 0) / 60 });
    render(true);
  }
  // A finished text as it was when you checked it, to look at again from the history: the mistakes you found and
  // missed, your corrections and, since 2026-10-22, the fine words you marked. Null when the text has changed since.
  function huntRebuild(d) {
    const pr = d && d.topic === "hunt" && PR.find((x) => x.id === d.text), items = arr(d && d.items);
    if (!pr || items.length !== pr.mistakes.length || items.some((it, k) => it.src && it.src !== `« ${pr.mistakes[k][0]} »`)) return null;
    const fixes = {};
    const found = items.map((it, k) => { const f = !!str(it.given).trim(); if (f) fixes[k] = str(it.given); return f; });
    const verdicts = items.map((it, k) => { if (!found[k]) return "missed"; if (it.ok) return "ok"; const v = checkAnswer({ a: pr.mistakes[k][1] }, fixes[k]); return v === "ok" ? "bad" : v; });
    return { id: pr.id, picks: arr(d.picks).slice(), found, extra: d.extra || 0, fixes, verdicts, secs: d.secs || 0, lastT: Date.now(), review: { id: d.id, date: d.date, score: d.score, total: d.total } };
  }
  function grammarHunt() {
    const lvl = huntLevel(), h = ui.hunt, pr = h && PR.find((x) => x.id === h.id);
    const done = new Set(list("drills").filter((d) => d.topic === "hunt").map((d) => d.text));
    const pool = PR.filter((p) => p.level === lvl), left = pool.filter((p) => !done.has(p.id)).length;
    const levels = `<div class="seg" role="group" aria-label="Level">${[["B1", "B1 · messages"], ["B2", "B2 · letters and articles"]].map(([l, label]) => `<button data-act="pr-level" data-l="${l}" aria-pressed="${lvl === l}">${label}</button>`).join("")}</div>`;
    const focus = !!pr && !h.verdicts;
    return `<div class="wrap${focus ? " focus" : ""}">
      <div><a class="btn ghost sm" href="#grammar">← All topics</a></div>
      <header class="stack tight"><p class="eyebrow">Relecture</p><h1 class="title">Find the mistakes<small>Tap the words that look wrong, then correct them</small></h1>${focus ? "" : fold("intro-hunt", "Comment ça marche · How it works", `<p class="small muted">A short text like the ones the TCF asks you to write, with a few mistakes of the kinds you make. It's the proofreading pass to do on every draft before you hand it in.</p>`)}</header>
      ${pr ? huntBox(pr, h) : `<section class="panel stack tight" id="drill-area"><div class="row">${levels}<span class="small muted">${left ? `${left} of ${pool.length} texts not done yet` : `All ${pool.length} done: the one done longest ago comes back`}</span></div><div class="row"><button class="btn primary" data-act="pr-start">Start a text</button></div></section>`}
      ${focus ? "" : `<section class="stack tight"><p class="h3">History</p>${recentRounds("hunt")}</section>`}
    </div>`;
  }
  function huntBox(pr, h) {
    const n = pr.mistakes.length;
    const head = `<div class="drill-head"><span class="eyebrow">${esc(pr.kind)} · ${esc(pr.level)}</span><span class="small muted num">${n} mistakes</span></div><p class="h3">${typo(pr.title)}</p>`;
    if (!h.found) {
      return `<section class="panel drill" id="drill-area">${head}
        <p class="small muted">This text has ${n} mistakes. Tap each word that looks wrong (tap it again to unmark it), then check.</p>
        ${prText(pr, h)}
        <div class="row"><button class="btn primary" data-act="pr-check">Check · ${h.picks.length} marked</button><button class="btn ghost sm" data-act="pr-close">Close</button></div>
      </section>`;
    }
    const fk = pr.mistakes.map((_, k) => k).filter((k) => h.found[k]);
    const extra = h.extra ? `${h.extra} word${h.extra > 1 ? "s" : ""} marked that ${h.extra > 1 ? "were" : "was"} fine` : "";
    if (!h.verdicts) {
      return `<section class="panel drill" id="drill-area">${head}
        <p>You found <b>${fk.length} of ${n}</b>${extra ? `, and ${extra}` : ""}. Now correct the ones you found. The ones you missed are in red; their corrections come after.</p>
        ${prText(pr, h)}
        <ol class="pr-fixes">${fk.map((k) => `<li><span class="pr-n">${k + 1}</span><span class="src">« ${typo(pr.mistakes[k][0])} »</span><input class="blank" type="text" data-input="pr-fix" data-k="${k}" value="${esc(str(h.fixes[k]))}" size="${Math.max(10, Math.min(34, pr.mistakes[k][0].length + 6))}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="fr" aria-label="Correction for mistake ${k + 1}"></li>`).join("")}</ol>
        ${accentBar()}
        <div class="row"><button class="btn primary" data-act="pr-finish">Check my corrections</button></div>
      </section>`;
    }
    const caught = h.verdicts.filter((v) => v === "ok").length;
    const LABEL = { ok: ["Caught", "ok"], accent: ["Check the accents", "bad"], bad: ["Not quite", "bad"], missed: ["Not spotted", "bad"] };
    // Opened again from the history: that attempt, with a way to try the text again.
    const rv = h.review, rk = rv ? rv.id : `${pr.id}-${list("drills").filter((d) => d.topic === "hunt").length}`;
    return `<section class="panel drill" id="drill-area">${head}
      ${rv ? textReviewNote(rv, h.extra && !h.picks.length) : ""}
      <div class="row"><span class="scorebig"><span data-tween="hunt-${pr.id}" data-tw="count" data-to="${caught}">${caught}</span>/${n}</span><span class="muted">caught: found and corrected · found ${fk.length} of ${n}${extra ? ` · ${extra}` : ""}</span></div>
      ${greet(...remyScore("hunt", caught, n, { flawed: !!h.extra, key: rk }), "sm")}
      ${prText(pr, h)}
      <ul class="misses">${pr.mistakes.map(([wrong, a, cat, why], k) => `<li>
        <p class="row" style="gap:6px"><span class="pr-n">${k + 1}</span><span class="pill ${LABEL[h.verdicts[k]][1]}">${LABEL[h.verdicts[k]][0]}</span><span class="pill">${esc(CAT[catOf(cat)])}</span></p>
        <p><span class="pen-wrong">${esc(wrong)}</span> <span class="pen-right">${esc(a[0])}</span></p>
        ${h.found[k] && h.verdicts[k] !== "ok" ? `<p class="small">You wrote: ${esc(str(h.fixes[k]))}</p>` : ""}
        ${a.length > 1 ? `<p class="small muted">Also accepted: ${a.slice(1).map(esc).join(" · ")}</p>` : ""}
        <p class="small muted">${typo(why)}</p>
      </li>`).join("")}</ul>
      ${caught === n && !h.extra ? `<p class="pen-ok" data-m="burst" data-k="hunt-${rk}">Sans faute !</p>` : ""}
      <details class="fold"><summary>The corrected text</summary>${prCorrected(pr)}</details>
      <div class="row">${rv ? `<button class="btn primary" data-act="pr-again" data-id="${esc(pr.id)}">Try this text again</button><button class="btn" data-act="pr-start">Next text</button>` : `<button class="btn primary" data-act="pr-start">Next text</button>`}<button class="btn ghost" data-act="pr-close">Close</button></div>
    </section>`;
  }

  /* =============== fiches =============== */
  // Revision sheets: the starters in fiches.js and your own, with the Pense-bête notes above them. All of it is in
  // the fiches collection: your sheets as f-…, your notes as n-… (kind "note"), an edited starter under its own id
  // (so it replaces the original until you restore it), and a hidden starter with hidden: true.
  const FX_TAGS = { grammaire: ["Grammaire", "grammar"], ecrit: ["Écrit", "writing"], oral: ["Oral", "listen"], vocabulaire: ["Vocabulaire", "vocab"], examen: ["Examen", "exam"] };
  const FX_BASE = new Map((T.FICHES || []).map((f) => [f.id, f]));
  // A starter sheet in French in immersion (Gemini's, from fr.js), unless you've edited it: your text stays yours.
  const fxBody = (f) => { const fr = immersion() && T.FR && T.FR.fiches && T.FR.fiches[f.id], base = FX_BASE.get(f.id); return fr && base && base.body === f.body ? fr : f.body; };
  const fxTagOf = (f) => (FX_TAGS[f.tag] ? f.tag : "grammaire");
  // A name the View Transitions API accepts, so a card can grow into its sheet.
  const fxVt = (id) => "fx-" + String(id).replace(/[^A-Za-z0-9_-]/g, "_");
  // Each card and note sits slightly askew, always the same way: the angle comes from its id.
  const fxTilt = (id, max) => ((parseInt(hk(id), 36) % 9) - 4) * ((max || 1.6) / 4);
  function allFiches() {
    const out = [];
    for (const [id, f] of S.fiches) if (f && !FX_BASE.has(id) && f.kind !== "note" && str(f.title).trim()) out.push(Object.assign({ id }, f, { mine: true }));
    out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    for (const f of FX_BASE.values()) {
      const mine = S.fiches.get(f.id);
      if (mine && mine.hidden) continue;
      out.push(Object.assign({}, f, mine || {}, { id: f.id, starter: true, changed: !!mine }));
    }
    return out;
  }
  const fxGet = (id) => allFiches().find((f) => f.id === id) || null;
  const fxHidden = () => [...FX_BASE.keys()].filter((id) => (S.fiches.get(id) || {}).hidden);
  const fxNotes = () => list("fiches").filter((n) => n.kind === "note" && str(n.text).trim()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const fxFor = (route) => allFiches().filter((f) => f.for === route);
  // Everything a sheet can link to: the grammar topics and the writing tasks.
  const fxRoutes = () => T.TOPICS.map((tp) => [`grammar.${tp.id}`, `Grammaire · ${tp.title}`]).concat(["t1", "t2", "t3"].map((k) => [`writing.${k}`, `Écrit · ${T.WRITING[k].name}`]));
  const fxRouteLabel = (r) => (fxRoutes().find(([k]) => k === r) || [, ""])[1];

  // The sheet markup (fiches.js lists it). Everything is escaped and given French spacing first.
  function fxInline(s) {
    return typo(s)
      .replace(/\{([1-6]):([^{}]+?)\}/g, '<span class="sw s$1" data-n="$1">$2</span>')
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/~~(.+?)~~/g, '<s class="pen-wrong">$1</s>')
      .replace(/\+\+(.+?)\+\+/g, '<span class="pen-right">$1</span>')
      .replace(/==(.+?)==/g, '<mark class="hl">$1</mark>');
  }
  // An order chain: ">> me te se :: label | le la les | *verbe". A slot's colour is its place among the slots,
  // or "#n" to keep a kind of pronoun the same colour in another chain; "*" is the verb.
  function fxChainParse(src) {
    let auto = 0;
    return src.split("|").map((p) => p.trim()).filter(Boolean).map((p) => {
      if (p.startsWith("*")) return { verb: true, text: p.slice(1).trim() || "verbe" };
      let n = 0;
      const m = p.match(/^#([1-6])\s+/);
      if (m) { n = Number(m[1]); p = p.slice(m[0].length); }
      auto++;
      const [w, lab] = p.split("::").map((x) => x.trim());
      const words = (w.includes(",") ? w.split(",") : w.split(/\s+/)).map((x) => x.trim()).filter(Boolean);
      return { n: n || Math.min(auto, 6), pos: auto, words, lab: lab || "" };
    });
  }
  function fxChain(src, mk) {
    const slots = fxChainParse(src);
    return `<div class="fx-chain"${mk("slots")}>${slots.map((s, i) => {
      const arrow = i ? `<span class="fx-arrow" aria-hidden="true">→</span>` : "";
      if (s.verb) return arrow + `<div class="fx-slot verb"><span>${typo(s.text)}</span></div>`;
      return arrow + `<button type="button" class="fx-slot s${s.n}" data-act="fx-slot" data-n="${s.n}"${s.lab ? ` aria-label="${esc(`${s.pos}: ${s.words.join(" ")}, ${s.lab}`)}"` : ""}><span class="num">${s.pos}</span><span class="chips">${s.words.map((w) => `<span class="chip">${typo(w)}</span>`).join("")}</span>${s.lab ? `<span class="lab">${typo(s.lab)}</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function fxTable(rows, mk) {
    const cells = rows.filter((r) => !/^\|[\s:|-]+\|?$/.test(r)).map((r) => r.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()));
    if (!cells.length) return "";
    const [head, ...body] = cells;
    return `<div class="table-wrap fx-tw"><table class="fx-table"${mk("rows")}><thead><tr>${head.map((h) => `<th>${fxInline(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${head.map((_, j) => `<td>${fxInline(r[j] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  // The whole sheet. Each order chain starts a section of its own, so its slots light up only the words below it.
  // o.key gives the blocks their animation keys (motion.js); a preview has none, so it doesn't flicker as you type.
  function ficheHTML(body, o) {
    o = o || {};
    let k = 0;
    const mk = (kind) => (o.key ? ` data-m="${kind}" data-k="fx-${esc(o.key)}-${k++}"` : "");
    const scopes = [];
    let blocks = [], acc = [], cur = "";
    const heads = [];
    const flush = () => {
      if (!acc.length) { cur = ""; return; }
      const L = acc;
      acc = [];
      if (cur === "p") blocks.push(`<p>${L.map(fxInline).join("<br>")}</p>`);
      else if (cur === "li") blocks.push(`<ul class="fx-list">${L.map((l) => `<li>${fxInline(l)}</li>`).join("")}</ul>`);
      else if (cur === "tr") blocks.push(fxTable(L, mk));
      else if (cur === "note") blocks.push(`<aside class="fx-note" style="--tilt:${fxTilt(L[0], 1.4)}deg"${mk("pin")}><i class="tape" aria-hidden="true"></i><p>${L.map(fxInline).join("<br>")}</p></aside>`);
      else if (cur === "warn") blocks.push(`<aside class="fx-warn"><p class="fx-warn-h"><span>Attention</span><svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path${mk("draw")} d="M14 24C12 10 104 4 112 17c6 11-34 18-62 18C22 35 6 30 8 21 10 13 30 8 48 7"/></svg></p><p>${L.map(fxInline).join("<br>")}</p></aside>`);
      else if (cur === "ex") blocks.push(`<div class="fx-exs">${L.map((l) => { const [fr, en] = exSplit(l); return `<p class="fx-ex" data-act="fx-line"><span class="fr" lang="fr">${fxInline(fr)}</span>${en ? `<span class="en">${esc(en)}</span>` : ""}</p>`; }).join("")}</div>`);
      cur = "";
    };
    const endScope = () => { flush(); if (blocks.length) scopes.push(`<section class="fx-scope">${blocks.join("")}</section>`); blocks = []; };
    for (const raw of str(body).replace(/\r/g, "").split("\n")) {
      const t = raw.trim();
      let type, text = t;
      if (!t) { flush(); continue; }
      if (t.startsWith(">>")) {
        // The heading just above a chain belongs with it.
        flush();
        const tail = [];
        while (blocks.length && /^<h[23]/.test(blocks[blocks.length - 1])) tail.unshift(blocks.pop());
        endScope();
        blocks = tail;
        blocks.push(fxChain(t.slice(2), mk));
        continue;
      }
      const h = t.match(/^(#{1,2})\s+(.*)$/);
      if (h) {
        flush();
        if (h[1] === "#") { const id = `fx-h-${heads.length}`; heads.push([id, h[2]]); blocks.push(`<h2 class="fx-h" id="${id}"><span>${fxInline(h[2])}</span><i class="ink" aria-hidden="true"${mk("ink")}></i></h2>`); }
        else blocks.push(`<h3 class="fx-h3">${fxInline(h[2])}</h3>`);
        continue;
      }
      if (t.startsWith("|")) type = "tr";
      else if (/^>\s/.test(t)) { type = "note"; text = t.slice(1).trim(); }
      else if (/^!\s/.test(t)) { type = "warn"; text = t.slice(1).trim(); }
      else if (/^[-•]\s/.test(t)) { type = "li"; text = t.slice(1).trim(); }
      else if (/^=\s/.test(t)) { type = "ex"; text = t.slice(1).trim(); }
      else type = "p";
      if (type !== cur) flush();
      cur = type;
      acc.push(text);
    }
    endScope();
    return { html: scopes.join(""), heads };
  }
  // Plain text for search: the markup's signs taken out.
  const fxPlain = (f) => bare([f.title, f.en, str(f.body).replace(/[#|>!=*~+{}]|\d:/g, " ")].join(" "));

  VIEWS.fiches = {
    render(args) {
      const id = args[0];
      if (id === "new") return fxEditor(null);
      const f = id && fxGet(id);
      if (f && args[1] === "edit") return fxEditor(f);
      if (f) return fxSheet(f);
      return fxHome();
    },
    after(args) {
      if (!args[0]) fxFilter(false);
      fxPill();
      if (document.getElementById("fx-body")) fxPreview();
    },
  };

  function fxCard(f) {
    const tag = fxTagOf(f), [label, icon] = FX_TAGS[tag];
    const prev = str(fxBody(f)).split("\n").map((l) => l.trim()).filter((l) => l && !/^(>>|#|\||!)/.test(l)).slice(0, 3)
      .map((l) => typo(l.replace(/^[-=>•]\s*/, "").replace(/\{\d:([^}]*)\}/g, "$1").replace(/\*\*|~~|\+\+|==/g, "").split(" — ")[0])).join(" · ");
    return `<a class="fx-card t-${tag}" href="#fiches.${esc(f.id)}" data-tag="${tag}" data-text="${esc(fxPlain(f))}" data-tilt data-spot data-m="deal" data-k="fxc-${esc(f.id)}" style="--tilt:${fxTilt(f.id)}deg;view-transition-name:${fxVt(f.id)}">
      <span class="fx-band">${ico(icon)}<span>${label}</span>${f.mine ? `<span class="fx-mine">à moi</span>` : ""}</span>
      <span class="fx-paper">
        <b class="fx-title" style="view-transition-name:${fxVt(f.id)}-t">${typo(f.title)}</b>
        ${f.en ? `<span class="fx-en">${esc(f.en)}</span>` : ""}
        <span class="fx-prev">${prev}</span>
      </span>
      <span class="fx-foot">${f.for ? `<span>${esc(fxRouteLabel(f.for))}</span>` : "<span></span>"}<span>${f.edited ? "modifiée le " + shortDate(f.edited) : f.starter ? "fiche de départ" : ""}</span></span>
    </a>`;
  }
  function fxNote(n) {
    return `<div class="fx-pin t${(parseInt(hk(n.id), 36) % 4) + 1}" style="--tilt:${fxTilt(n.id, 2.4)}deg" data-m="pin" data-k="fxn-${esc(n.id)}" data-note="${esc(n.id)}">
      <i class="tape" aria-hidden="true"></i>
      <p lang="fr">${fxInline(n.text)}</p>
      <span class="fx-pin-acts"><button type="button" class="btn ghost sm" data-act="fx-note-up" data-id="${esc(n.id)}" title="Make it a fiche">→ fiche</button><button type="button" class="btn ghost sm" data-act="fx-note-del" data-id="${esc(n.id)}" aria-label="Remove this note">×</button></span>
    </div>`;
  }
  function fxHome() {
    const fs = allFiches(), notes = fxNotes(), hidden = fxHidden();
    const counts = {};
    fs.forEach((f) => { const t = fxTagOf(f); counts[t] = (counts[t] || 0) + 1; });
    const tag = ui.fx.tag;
    const chips = [["all", "Toutes", fs.length]].concat(Object.keys(FX_TAGS).filter((t) => counts[t]).map((t) => [t, FX_TAGS[t][0], counts[t]]));
    const own = fs.filter((f) => f.mine).length;
    return `<div class="wrap fx-home">
      <header class="fx-head">
        <div class="stack tight"><h1 class="title">Fiches</h1><p class="fx-hand" lang="fr">fiches de révision</p></div>
        <span class="row"><span class="small muted num">${fs.length} fiches${own ? ` · ${own} à toi` : ""}</span><a class="btn primary" href="#fiches.new">${ico("writing")}Nouvelle fiche</a></span>
      </header>
      <section class="fx-board" aria-label="Pense-bête">
        <div class="row between"><p class="h3">Pense-bête</p><span class="small muted">One line worth remembering. ↵ to pin it.</span></div>
        <div class="fx-pins">
          ${notes.map(fxNote).join("")}
          <label class="fx-pin fx-pin-new t${(notes.length % 4) + 1}"><i class="tape" aria-hidden="true"></i><textarea id="fx-note-in" data-input="fx-note" rows="3" lang="fr" spellcheck="false" placeholder="se rendre compte garde toujours son se…">${esc(ui.fx.note)}</textarea></label>
        </div>
      </section>
      <div class="fx-tools">
        <div class="fx-chips" role="group" aria-label="Filter by kind">${chips.map(([k, l, n]) => `<button type="button" data-act="fx-tag" data-tag="${k}" aria-pressed="${tag === k}">${l} <span class="num">${n}</span></button>`).join("")}</div>
        <label class="fx-search">${ico("target")}<input type="search" id="fx-q" data-input="fx-q" value="${esc(ui.fx.q)}" placeholder="Chercher : pronoms, subjonctif, Tâche 3…" autocomplete="off" aria-label="Search the sheets"></label>
      </div>
      ${own ? "" : greet("correction", "Écris ta première fiche : une règle que tu oublies, un tableau à retenir.", "Write your first sheet: a rule you keep forgetting, a table to remember.", "sm")}
      <div class="fx-grid" id="fx-grid">${fs.map(fxCard).join("")}</div>
      <p class="small muted" id="fx-none" hidden>No sheet matches. Try another word, or write it: <a href="#fiches.new">Nouvelle fiche</a>.</p>
      ${hidden.length ? `<p class="small muted">${hidden.length} starter sheet${hidden.length > 1 ? "s" : ""} hidden · <button type="button" class="btn ghost sm" data-act="fx-unhide">Show ${hidden.length > 1 ? "them" : "it"}</button></p>` : ""}
    </div>`;
  }
  // The filter and the search hide the cards in place, so typing keeps its focus, and the cards that stay slide
  // to their new places (motion.js) instead of jumping.
  function fxFilter(animate) {
    const grid = document.getElementById("fx-grid");
    if (!grid) return;
    const q = bare(ui.fx.q), tag = ui.fx.tag;
    const cards = [...grid.querySelectorAll(".fx-card")];
    const apply = () => {
      let n = 0;
      cards.forEach((c) => { const ok = (tag === "all" || c.dataset.tag === tag) && (!q || c.dataset.text.includes(q)); c.hidden = !ok; if (ok) n++; });
      const none = document.getElementById("fx-none");
      if (none) none.hidden = n > 0 || !cards.length;
    };
    const M = window.TCFMotion;
    if (animate && M && M.flip) M.flip(cards, apply); else apply();
    document.querySelectorAll(".fx-chips [data-tag]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tag === tag)));
    fxPill();
  }
  // The chips' highlight glides to the one chosen.
  function fxPill() {
    const box = document.querySelector(".fx-chips");
    if (!box) return;
    let pill = box.querySelector(".fx-chip-pill");
    const first = !pill;
    if (!pill) { pill = document.createElement("span"); pill.className = "fx-chip-pill"; pill.setAttribute("aria-hidden", "true"); box.prepend(pill); }
    const cur = box.querySelector('[aria-pressed="true"]');
    if (!cur) { pill.style.opacity = "0"; return; }
    if (first) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.width = cur.offsetWidth + "px";
    pill.style.height = cur.offsetHeight + "px";
    pill.style.transform = `translate(${cur.offsetLeft}px, ${cur.offsetTop}px)`;
    if (first) { void pill.offsetWidth; pill.style.transition = ""; }
  }
  function fxSheet(f) {
    const tag = fxTagOf(f), [label, icon] = FX_TAGS[tag];
    const { html, heads } = ficheHTML(fxBody(f), { key: f.id });
    const topic = f.for && f.for.startsWith("grammar.") ? TOPIC[f.for.split(".")[1]] : null;
    const practise = f.for ? `<a class="btn primary sm" href="#${esc(f.for)}">${ico(topic ? "grammar" : "writing")}S'entraîner : ${esc(topic ? topic.title : fxRouteLabel(f.for).replace(/^Écrit · /, ""))}</a>` : "";
    const restore = f.starter && f.changed ? (ui.confirm === "fx-restore" ? `<button class="btn danger sm" data-act="fx-restore" data-id="${esc(f.id)}">Restore the original</button><button class="btn ghost sm" data-act="confirm-cancel">Keep my edits</button>` : `<button class="btn ghost sm" data-act="confirm" data-key="fx-restore">Restore the original</button>`) : "";
    const remove = f.starter ? `<button class="btn ghost sm" data-act="fx-hide" data-id="${esc(f.id)}">Hide</button>` : confirmBtn("fx-del-" + f.id, "Delete", "fx-del", `data-id="${esc(f.id)}"`);
    return `<div class="wrap fx-view">
      <div class="row between"><a class="btn ghost sm" href="#fiches">← Fiches</a><span class="row">${practise}</span></div>
      <article class="fx-sheet t-${tag}${ui.fx.cacher ? " cacher" : ""}" id="fx-sheet" style="view-transition-name:${fxVt(f.id)}">
        <header class="fx-sheet-head">
          <span class="fx-band">${ico(icon)}<span>${label}</span>${f.mine ? `<span class="fx-mine">à moi</span>` : ""}</span>
          <div class="fx-sheet-title">
            <h1 class="fx-h1" style="view-transition-name:${fxVt(f.id)}-t">${typo(f.title)}</h1>
            ${f.en ? `<p class="fx-en">${esc(f.en)}</p>` : ""}
          </div>
          <div class="fx-sheet-acts">
            <button type="button" class="btn sm${ui.fx.cacher ? " primary" : ""}" data-act="fx-cacher" aria-pressed="${!!ui.fx.cacher}" title="Hide the answers and test yourself">${ui.fx.cacher ? "Tout montrer" : "Cacher"}</button>
            <a class="btn ghost sm" href="#fiches.${esc(f.id)}.edit">Edit</a>${restore}${remove}
          </div>
        </header>
        ${ui.fx.cacher ? `<p class="fx-cacher-tip small">Cache-réponses : tap a dotted blank to check yourself.</p>` : ""}
        ${heads.length > 1 ? `<nav class="dash-nav fx-toc" aria-label="Sections of this sheet">${heads.map(([hid, t]) => `<button type="button" data-goto="${hid}">${fxInline(t)}</button>`).join("")}</nav>` : ""}
        <div class="fx-body">${html}</div>
        <footer class="fx-sheet-foot small muted">${f.starter ? (f.changed ? `Fiche de départ, modifiée le ${shortDate(f.edited || todayStr())}` : "Fiche de départ") : `Ta fiche${f.edited ? ` · modifiée le ${shortDate(f.edited)}` : ""}`} · select any line, then “Save to cards” to drill it.</footer>
      </article>
    </div>`;
  }
  // A tab on a grammar topic or a writing task, for each sheet that belongs there. It grows into the sheet.
  function fxTabs(route) {
    const fs = fxFor(route);
    if (!fs.length) return "";
    return `<div class="fx-tabs">${fs.map((f) => `<a class="fx-tab t-${fxTagOf(f)}" href="#fiches.${esc(f.id)}" style="view-transition-name:${fxVt(f.id)}">${ico("vocab")}<span>Fiche : <b>${typo(f.title)}</b></span></a>`).join("")}</div>`;
  }

  /* ---------- the editor ---------- */
  const FX_SNIPS = {
    h: ["Titre", "\n# Titre de la section\n"],
    li: ["Liste", "\n- premier point\n- deuxième point\n"],
    tr: ["Tableau", "\n| Quand | Quoi | Exemple |\n|---|---|---|\n| … | … | … |\n"],
    chain: ["Ordre", "\n>> me te se :: 1re et 2e pers. | le la les :: COD | lui leur :: COI | *verbe\n= Je {2:le} {3:lui} donne. — I give it to him.\n"],
    note: ["Note", "\n> L'astuce pour s'en souvenir.\n"],
    warn: ["Attention", "\n! ~~la faute~~ ++la bonne forme++\n"],
    ex: ["Exemple", "\n= Phrase en français. — English translation.\n"],
  };
  function fxDraft(f) {
    const e = ui.fx.edit;
    const id = f ? f.id : "";
    if (e && e.id === id) return e;
    ui.fx.edit = f ? { id, title: str(f.title), en: str(f.en), tag: fxTagOf(f), for: str(f.for), body: str(f.body), topic: "" }
      : { id: "", title: "", en: "", tag: "grammaire", for: "", body: "", topic: "", fromNote: "" };
    return ui.fx.edit;
  }
  function fxEditor(f) {
    const d = fxDraft(f);
    const back = f ? `#fiches.${esc(f.id)}` : "#fiches";
    return `<div class="wrap fx-edit">
      <div class="row between"><a class="btn ghost sm" href="${back}" data-act="fx-cancel">← ${f ? "Back to the sheet" : "Fiches"}</a><span class="small muted">${f ? (f.starter ? "Editing a starter sheet: your copy replaces it, and you can restore the original." : "Editing your sheet") : "Nouvelle fiche"}</span></div>
      <div class="fx-edit-grid">
        <section class="panel stack fx-form">
          <div class="grid2">
            <label class="field">Titre<input type="text" id="fx-title" data-input="fx-f" data-k="title" value="${esc(d.title)}" lang="fr" placeholder="L'ordre des pronoms" autocomplete="off"></label>
            <label class="field"><span>In English <span class="muted" style="font-weight:400">· optional</span></span><input type="text" id="fx-en" data-input="fx-f" data-k="en" value="${esc(d.en)}" placeholder="Where object pronouns go" autocomplete="off"></label>
          </div>
          <div class="row"><span class="small muted">Kind</span><div class="fx-etags" role="group" aria-label="Kind">${Object.keys(FX_TAGS).map((t) => `<button type="button" class="t-${t}" data-act="fx-etag" data-tag="${t}" aria-pressed="${d.tag === t}">${ico(FX_TAGS[t][1])}${FX_TAGS[t][0]}</button>`).join("")}</div></div>
          <label class="field"><span>Linked page <span class="muted" style="font-weight:400">· optional: that page shows a tab to this sheet</span></span><select id="fx-for" data-change="fx-for"><option value="">None</option>${fxRoutes().map(([k, l]) => `<option value="${k}" ${d.for === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
          <div class="fx-bar" role="toolbar" aria-label="Insert a block">${Object.entries(FX_SNIPS).map(([k, [l]]) => `<button type="button" class="btn sm" data-act="fx-ins" data-b="${k}">${l}</button>`).join("")}</div>
          <label class="field">La fiche<textarea id="fx-body" data-input="fx-f" data-k="body" rows="16" lang="fr" spellcheck="false" placeholder="# L'essentiel&#10;- …">${esc(d.body)}</textarea></label>
          ${fold("fx-format", "Format · how to write a sheet", `<div class="table-wrap"><table class="fx-help"><tbody>
            <tr><td><code># Titre</code></td><td>a section heading</td></tr>
            <tr><td><code>- point</code></td><td>a bullet</td></tr>
            <tr><td><code>| a | b |</code></td><td>a table: the first row is the header</td></tr>
            <tr><td><code>&gt; …</code></td><td>a taped note, for the memory trick</td></tr>
            <tr><td><code>! …</code></td><td>a red-pen “Attention” box</td></tr>
            <tr><td><code>= Phrase — English</code></td><td>an example</td></tr>
            <tr><td><code>&gt;&gt; me te :: label | le la | *verbe</code></td><td>an order chain: numbered, coloured slots; <code>*</code> is the verb, <code>#2</code> keeps slot colour 2</td></tr>
            <tr><td><code>{2:le}</code></td><td>colours a word like slot 2 of the chain above it</td></tr>
            <tr><td><code>**gras**  ~~faux~~  ++juste++</code></td><td>bold, a red-pen crossing-out, the red-pen correction</td></tr>
            <tr><td><code>==caché==</code></td><td>highlighted, and hidden when you press Cacher</td></tr>
          </tbody></table></div>`)}
          <div class="row">${claudeOn() ? `<input type="text" id="fx-topic" data-input="fx-f" data-k="topic" value="${esc(d.topic)}" lang="fr" placeholder="Sujet : les prépositions de lieu" aria-label="What the sheet should be about" style="flex:1;min-width:180px">${claudeBtn("fx-claude", "fx-claude", "Rédiger avec Claude", "", "btn sm")}` : ""}</div>
          <div class="row"><button class="btn primary" data-act="fx-save">Save <span class="kbd">⌘↵</span></button><a class="btn ghost" href="${back}" data-act="fx-cancel">Cancel <span class="kbd">Esc</span></a></div>
        </section>
        <section class="fx-prev-wrap" aria-label="Preview">
          <p class="eyebrow">Aperçu</p>
          <article class="fx-sheet t-${d.tag} fx-preview" id="fx-prev-sheet">
            <header class="fx-sheet-head"><span class="fx-band">${ico(FX_TAGS[d.tag][1])}<span>${FX_TAGS[d.tag][0]}</span></span><div class="fx-sheet-title"><h1 class="fx-h1" id="fx-prev-title">${typo(d.title || "Titre de la fiche")}</h1><p class="fx-en" id="fx-prev-en">${esc(d.en)}</p></div></header>
            <div class="fx-body" id="fx-prev"></div>
          </article>
        </section>
      </div>
    </div>`;
  }
  let fxPrevT = 0;
  function fxPreview() {
    clearTimeout(fxPrevT);
    fxPrevT = 0;
    const d = ui.fx.edit, box = document.getElementById("fx-prev");
    if (!d || !box) return;
    box.innerHTML = ficheHTML(d.body).html || `<p class="muted">Start typing, or insert a block from the bar.</p>`;
    const t = document.getElementById("fx-prev-title"), en = document.getElementById("fx-prev-en");
    if (t) t.innerHTML = typo(d.title || "Titre de la fiche");
    if (en) en.textContent = d.en;
  }
  function fxInsert(kind) {
    const d = ui.fx.edit, ta = document.getElementById("fx-body"), snip = FX_SNIPS[kind];
    if (!d || !ta || !snip) return;
    const a = ta.selectionStart != null ? ta.selectionStart : ta.value.length, b = ta.selectionEnd != null ? ta.selectionEnd : a;
    let text = snip[1];
    if (a === 0 || ta.value[a - 1] === "\n") text = text.replace(/^\n/, "");
    ta.value = ta.value.slice(0, a) + text + ta.value.slice(b);
    d.body = ta.value;
    ta.focus();
    ta.setSelectionRange(a + text.length, a + text.length);
    fxPreview();
  }
  function fxSave() {
    const d = ui.fx.edit;
    if (!d) return;
    const title = str(d.title).trim(), body = str(d.body).replace(/\s+$/, "");
    if (!title) { toast("Give the sheet a title."); const el = document.getElementById("fx-title"); if (el) el.focus(); return; }
    if (!body.trim()) { toast("The sheet is empty: write something first."); return; }
    const id = d.id || "f-" + uid();
    const was = S.fiches.get(id) || {};
    const doc = { title, en: str(d.en).trim(), tag: FX_TAGS[d.tag] ? d.tag : "grammaire", for: str(d.for), body, created: was.created || todayStr(), edited: todayStr(), ts: Date.now() };
    if (!doc.for) delete doc.for;
    if (!doc.en) delete doc.en;
    put("fiches", id, doc);
    if (d.fromNote && S.fiches.has(d.fromNote)) remove("fiches", d.fromNote);
    ui.fx.edit = null;
    toast(d.id ? "Sheet saved." : "Sheet saved. It's on your desk.");
    goTo("#fiches." + id);
  }
  // Whether the draft differs from the sheet it started from (or from an empty one).
  function fxDirty() {
    const d = ui.fx.edit;
    if (!d) return false;
    const f = d.id ? fxGet(d.id) : null;
    return ["title", "en", "for", "body"].some((k) => str(d[k]).trim() !== str(f ? f[k] : k === "body" && d.fromNote ? `> ${str((S.fiches.get(d.fromNote) || {}).text)}` : "").trim()) || (f ? fxTagOf(f) : "grammaire") !== d.tag;
  }
  function fxCancel() {
    const d = ui.fx.edit;
    ui.fx.edit = null;
    goTo(d && d.id ? "#fiches." + d.id : "#fiches");
  }
  async function fxClaude() {
    const d = ui.fx.edit;
    if (!d) return;
    const topic = str(d.topic).trim() || str(d.title).trim();
    if (!topic) { toast("Say what the sheet should be about first."); const el = document.getElementById("fx-topic"); if (el) el.focus(); return; }
    const out = await ask("fx-claude", `${EXAM_BRIEF}\n\nWrite a French revision sheet (fiche de révision) on: «${topic}». The learner is B1, aiming for NCLC 7 (about B2) on the TCF Canada. Their recurring errors: ${T.KNOWN_ERRORS.join("; ")}. Mention one of these where it fits the subject.\nMake it short and easy to remember: a table or an order chain for the rule, a memory trick, one "Attention" warning with the classic mistake, and 3–5 example sentences in TCF Canada situations. French throughout; examples carry their English.\nUse exactly this markup, one block per line: "# Heading", "- bullet", "| a | b |" table rows (first row the header), "> memory trick", "! warning", "= French sentence — English", and inline **bold**, ~~wrong~~ ++right++, ==hidden answer==. For a word order, use a chain: ">> words :: label | words :: label | *verbe", then colour words in the examples below it with {n:word} (n = the slot's place).\nReply with only JSON: {"title": "short French title", "en": "short English subtitle", "tag": "grammaire" | "ecrit" | "oral" | "vocabulaire" | "examen", "body": "the sheet"}`);
    if (!out || !str(out.body).trim()) return;
    if (!str(d.title).trim()) d.title = str(out.title).trim();
    if (!str(d.en).trim()) d.en = str(out.en).trim();
    if (FX_TAGS[out.tag]) d.tag = out.tag;
    d.body = str(out.body).replace(/\r/g, "").trim();
    toast("Claude drafted it. Check it, then save.");
    render(true);
    fxPreview();
  }

  /* ---------- Pense-bête ---------- */
  function fxNoteAdd() {
    const text = str(ui.fx.note).replace(/\s+/g, " ").trim();
    if (!text) return;
    put("fiches", "n-" + uid(), { kind: "note", text, ts: Date.now(), created: todayStr() });
    ui.fx.note = "";
    render(true);
    const el = document.getElementById("fx-note-in");
    if (el) el.focus();
  }
  async function fxNoteDel(id) {
    const el = document.querySelector(`[data-note="${CSS.escape(id)}"]`);
    const M = window.TCFMotion;
    if (el && M && M.peel) await M.peel(el);
    remove("fiches", id);
  }
  function fxNoteUp(id) {
    const n = S.fiches.get(id);
    if (!n) return;
    ui.fx.edit = { id: "", title: "", en: "", tag: "grammaire", for: "", body: `> ${n.text}`, topic: "", fromNote: id };
    goTo("#fiches.new");
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
  // One card in Deck by theme: tap it to see its meaning, notes and examples without starting a review.
  function cardPeek(c) {
    const st = S.srs.get(c.id);
    const state = st ? (st.pri ? "priority" : st.stage >= 5 ? "mastered" : "due " + shortDate(st.due)) : c.en ? "new" : "needs a meaning";
    const notes = [c.frNote, c.enNote].map((n) => str(n).trim()).filter(Boolean);
    const rc = srsRecall(st), sd = st && Math.max(1, Math.round(st.s || 0));
    return `<li><details class="peek" ${foldAttr("peek-" + c.id)}><summary><span class="peek-fr">${typo(c.fr)}${c.src ? `<small class="muted"> · ${esc(c.src)}</small>` : ""}</span><span class="muted small">${state}</span></summary>
      <div class="peek-body">
        <p class="peek-en">${esc(c.en || "")}</p>
        ${notes.length ? `<p class="small muted">${notes.map(esc).join("<br>")}</p>` : ""}
        ${rc != null ? `<p class="small muted num">Mémoire · Memory: ${Math.round(rc * 100)}% chance of recall today · stability ${sd} day${sd === 1 ? "" : "s"} · difficulty ${st.d.toFixed(1)}/10</p>` : ""}
        ${c.ex ? `<p class="ex-list">${exHTML(c)}</p>` : `<p class="small muted">No examples yet.</p>`}
        ${DECK.has(c.id) ? "" : `<div class="row">${confirmBtn("card-del-" + c.id, "Delete this card", "card-del", `data-id="${esc(c.id)}"`)}</div>`}
      </div></details></li>`;
  }
  function vocabHome(args) {
    const s = settings();
    const cards = allCards();
    const due = dueIds(cards);
    const pri = due.filter((id) => S.srs.get(id).pri).length;
    const learned = [...S.srs.keys()].filter((id) => cards.has(id)).length;
    const srs = learnedCards(cards), week = dueChart(srs, "v-due", 58);
    const theme = ui.vTheme && THEME[ui.vTheme] ? ui.vTheme : (args[0] === "new" && THEME[args[1]] ? args[1] : defaultTheme());
    const phaseThemes = T.PHASES[s.phase - 1].vocab;
    const opts = T.VOCAB.slice().sort((a, b) => (phaseThemes.includes(b.id) ? 1 : 0) - (phaseThemes.includes(a.id) ? 1 : 0))
      .map((th) => { const left = themeCards(th.id, cards).filter(isNew).length; return `<option value="${th.id}" ${th.id === theme ? "selected" : ""}>${phaseThemes.includes(th.id) ? "★ " : ""}${esc(th.label)} · ${left} new</option>`; }).join("");
    const left = themeCards(theme, cards).filter(isNew).length;
    const rows = T.VOCAB.map((th) => {
      const cs = themeCards(th.id, cards);
      const lr = cs.filter((c) => S.srs.has(c.id)).length;
      const ms = cs.filter((c) => (S.srs.get(c.id) || {}).stage >= 5).length;
      return `<tr>
        <td><b class="fr">${esc(th.label)}</b><br><span class="small muted en-gloss">${esc(th.en)}${phaseThemes.includes(th.id) ? " · this phase" : ""}</span></td>
        <td class="n">${lr} / ${cs.length}</td><td class="n">${ms}</td>
        <td>${th.own ? "" : claudeBtn("build-" + th.id, "v-build", cs.length < 10 ? "Build this theme" : "+20 with Claude", `data-theme="${th.id}"`, "btn sm")}</td>
      </tr><tr><td colspan="4" style="padding-top:0"><details class="fold"><summary class="small">${cs.length} cards</summary><ul class="cards-list">${cs.map(cardPeek).join("")}</ul></details></td></tr>`;
    }).join("");
    return `<div class="wrap">
      <header class="stack tight"><h1 class="title">Vocabulaire</h1>${fold("intro-vocab", "Comment ça marche · How it works", `<p class="small muted">Spaced repetition with FSRS, the scheduler Anki offers. Each card has a memory state: how long it holds (its stability) and how hard it is for you (its difficulty). After you recall it, grade it Again, Hard, Good or Easy, and it comes back when your chance of remembering it falls to 90%, never more than 30 days away; each button shows when that would be. Again also brings it back later in the session, and makes it count as harder. A soft tone marks each grade; the sound button in a session (or M) turns it off. A new card is shown with its answer, then checked in the session, and your first check's grade sets when it comes back: Again tomorrow, Hard in 2 days, Good in 3, Easy in about a week. Reviews ask English → French, the direction you need for writing; French → English is practice and doesn't change the schedule. To save a word or phrase from any page, select it, then press “Save to cards”.</p>`)}</header>
      ${waitPanel()}
      ${exPanel()}
      <div class="grid2 v-home">
        <section class="panel stack" data-spot>
          <div class="row between"><p class="h3">Review</p><span class="pill ${due.length ? "warn" : "ok"}">${due.length} due${pri ? ` · ${pri} priority` : ""}</span></div>
          ${due.length ? `<p class="small muted">Recall each card cold before you flip it. No peeking.</p>` : greet("cafe", "Rien à réviser pour l'instant. À demain !", "Nothing due right now. Come back tomorrow.", "sm")}
          <div class="row"><button class="btn primary" data-act="v-start" data-mode="review" ${due.length ? "" : "disabled"}>Start review${due.length ? ` (${due.length})` : ""}</button>${learned ? `<button class="btn ghost" data-act="v-start" data-mode="practice">Practise French → English</button>` : ""}</div>
          ${learned ? `<p class="small muted">Reviews ask English → French and move the schedule. French → English practice takes ${Math.min(learned, PRACTICE_N)} card${Math.min(learned, PRACTICE_N) === 1 ? "" : "s"}, starting with those you've never practised in that direction, then those practised longest ago, and leaves their schedule as it is.</p>` : ""}
          ${srs.length ? `<div class="v-week"><p class="small muted">À revoir cette semaine · due this week: <b>${week.n.reduce((a, b) => a + b, 0)}</b></p>${week.html}</div>${stageChart(srs, "v-stages", true)}` : ""}
          <p class="small muted num">${learned} cards learned · ${cards.size} in the deck</p>
        </section>
        <section class="panel stack" data-spot>
          <p class="h3">New cards</p>
          <label class="field">Theme<select id="v-theme" data-change="v-theme">${opts}</select></label>
          <div class="row"><div class="seg" role="group" aria-label="How many">${[10, 15].map((n) => `<button data-act="v-count" data-n="${n}" aria-pressed="${ui.vCount === n}">${n}</button>`).join("")}</div>
          <button class="btn primary" data-act="v-start" data-mode="new" ${left ? "" : "disabled"}>Learn ${Math.min(left, ui.vCount)} new</button></div>
          ${left ? "" : `<p class="small muted">No new cards left in this theme. ${claudeBtn("build-" + theme, "v-build", "Build 20 more with Claude", `data-theme="${theme}"`, "btn ghost sm")}</p>`}
        </section>
      </div>
      <section class="sec"><div class="sec-head"><h2 class="h2">Deck by theme</h2><span class="small muted">Collocations and connectors are worth more than isolated nouns.</span></div>
        ${fold("deck", `Voir les ${T.VOCAB.length} thèmes · Show the deck`, `<div class="table-wrap"><table class="deck"><thead><tr><th>Theme</th><th>Learned</th><th>Mastered</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`)}
      </section>
      <section class="panel stack">${fold("add-card", "Ajouter une carte · Add your own card", `<div class="stack">
        <div class="grid2">
          <label class="field">French<input type="text" id="card-fr" data-input="form" data-k="card-fr" value="${formVal("card-fr")}" lang="fr" placeholder="s'engager à faire qqch"></label>
          <label class="field">English<input type="text" id="card-en" data-input="form" data-k="card-en" value="${formVal("card-en")}" placeholder="to commit to doing something"></label>
          <label class="field">Example (optional)<input type="text" id="card-ex" data-input="form" data-k="card-ex" value="${formVal("card-ex")}" lang="fr"></label>
          <label class="field">Theme<select id="card-th" data-change="form" data-k="card-th">${T.VOCAB.map((th) => `<option value="${th.id}" ${(ui.form["card-th"] || theme) === th.id ? "selected" : ""}>${esc(th.label)}</option>`).join("")}</select></label>
        </div>
        <div class="row"><button class="btn" data-act="v-add">Add card</button></div>
      </div>`)}</section>
    </div>`;
  }
  // What a step is, over the card: a check of a new card, or a card back after a miss.
  const STEP_TAG = { learn: ["info", "Check: recall it"], known: ["info", "Check: you said you knew it"], re: ["bad", "Again: you missed it"] };
  const GRADES = [[G.again, "Again"], [G.hard, "Hard"], [G.good, "Good"], [G.easy, "Easy"]];
  // A session's progress bar. A long one (12 steps or more) has three maple leaves on it, at a quarter, half and
  // three quarters: each turns gold and pops as the bar passes it, with a third, higher note on the grade's chime.
  // The bar can slip back when Again adds a repeat, so the furthest leaf reached is kept on the session (ms), and a
  // gold leaf stays gold.
  function vocabBar(v, pct, steps) {
    const bar = `<div class="bar"><i style="width:${pct}%" data-tween="vbar-${v.mode}" data-tw="width" data-to="${pct}"></i></div>`;
    if (steps < 12) return bar;
    const reach = Math.min(3, Math.floor(pct / 25));
    if (reach > (v.ms || 0)) {
      v.ms = reach;
      if (lastGrade && lastGrade !== G.again) tone("leaf");
    }
    const vk = hk(`${v.mode}|${v.total}|${(v.queue[0] || {}).id}`);
    const leaves = [1, 2, 3].map((n) => `<span class="ms${n <= (v.ms || 0) ? " on" : ""}" style="left:${n * 25}%"${n <= (v.ms || 0) ? ` data-m="pop" data-k="vms-${vk}-${n}"` : ""}>${leafSvg()}</span>`).join("");
    return `<div class="vbar" role="img" aria-label="${v.ms || 0} of 3 milestones passed">${bar}${leaves}</div>`;
  }
  function vocabCard() {
    const v = ui.vocab;
    const cards = allCards();
    const e = v.queue[v.i] || {};
    const id = e.id;
    const c = cards.get(id) || { fr: "?", en: "?", theme: "" };
    const st = S.srs.get(id);
    const th = THEME[c.theme];
    // Reviews and new cards ask English → French; the practice asks French → English.
    const frFirst = v.mode === "practice";
    const front = cardSide(c, frFirst ? "fr" : "en");
    const back = cardSide(c, frFirst ? "en" : "fr");
    const show = e.k === "show", tag = STEP_TAG[e.k];
    // The bar counts steps, with the checks still to come for each new card; the count is the cards done.
    const ahead = v.queue.slice(v.i);
    const todo = ahead.reduce((n, x) => n + 1 + (x.k === "show" ? 2 : x.k === "learn" && x.n === 1 ? 1 : 0), 0);
    const pct = (v.i / (v.i + todo)) * 100;
    const done = v.total - new Set(ahead.map((x) => x.id)).size;
    let buttons, hint = "";
    if (show) {
      // Got it, next → two checks in this session; I already know this → one. The first check's grade sets when
      // the card comes back. (Not shown on the card: the user asked on 2026-10-16 to keep it out of the interface.)
      buttons = `<button class="btn primary" data-act="v-learn" data-path="learn">Got it, next <span class="kbd">2</span></button><button class="btn" data-act="v-learn" data-path="known">I already know this <span class="kbd">3</span></button>`;
    } else if (!v.shown) buttons = `<button class="btn primary" data-act="v-show">Show answer <span class="kbd">Space</span></button>`;
    else {
      // A review and a new card's first check set the schedule, so their buttons say when each grade brings the card back.
      const first = (e.k === "learn" || e.k === "known") && !(id in v.first), graded = e.k === "rev" || first;
      const gaps = graded ? srsPreview(id, first) : null;
      const sub = (g) => (gaps ? (gaps[g - 1] <= 1 ? "tomorrow" : `${gaps[g - 1]} days`) : g === G.again ? "back soon" : "done");
      buttons = `<div class="grade4" data-m="rise" data-k="g4-${esc(id)}-${v.i}">${GRADES.map(([g, name]) => `<button class="btn grade g${g}${g === G.good ? " primary" : ""}" data-act="v-grade" data-g="${g}"><span class="g-name">${name}<span class="kbd">${g}</span></span><span class="g-gap">${sub(g)}</span></button>`).join("")}</div>`;
      hint = graded ? (first ? "This first check sets when the card comes back. Again also brings it back in this session." : "Again also brings the card back in this session.")
        : v.mode === "practice" ? "Practice doesn't move the schedule: Again brings the card back, the others finish it."
        : "Already scheduled today: Again brings it back in this session, the others finish it.";
    }
    const label = v.mode === "new" ? "Learning new cards" : v.mode === "practice" ? "Practice · French → English" : "Review";
    return `<div class="wrap">
      <div class="row between"><span class="eyebrow">${label} · ${done} / ${v.total} done</span><span class="row"><button class="btn ghost sm v-sound" data-act="v-sound" aria-pressed="${soundOn()}" title="${soundOn() ? "Turn the grading tones off" : "Turn the grading tones on"}">${ico(soundOn() ? "sound" : "mute")}${soundOn() ? "Sound" : "Muted"} <span class="kbd">M</span></button><button class="btn ghost sm" data-act="v-edit" ${v.edit ? "disabled" : ""}>Edit card <span class="kbd">E</span></button><button class="btn ghost sm" data-act="v-quit">End session</button></span></div>
      ${vocabBar(v, pct, v.i + todo)}
      <section class="panel flash" data-m="slide" data-k="vc-${esc(id)}-${v.i}">
        <p class="eyebrow">${th ? esc(th.label) : ""}${st && st.pri && v.mode === "review" ? " · priority" : ""}</p>
        ${tag ? `<div class="row"><span class="pill ${tag[0]}" data-m="pop" data-k="vt-${esc(id)}-${v.i}">${tag[1]}</span></div>` : ""}
        ${v.edit ? vocabEditForm(id) : `${front}
        ${v.shown ? `<div class="flash-back" data-m="rise" data-k="vb-${esc(id)}-${v.i}">` + back + (c.ex ? `<p class="ex">${exHTML(c)}</p>` : "") + (c.src ? `<p class="small muted">Saved from ${esc(c.src)}</p>` : "") + (st && st.lapses >= 4 ? `<p class="small muted">Missed ${st.lapses} times. Give it an example sentence of your own, or split it if it mixes two look-alikes: Edit card <span class="kbd">E</span>.</p>` : "") + `</div>` : `<p class="muted small">${frFirst ? "Say what it means before you flip." : "Say it out loud before you flip."}</p>`}
        ${hint ? `<p class="small muted">${hint}</p>` : ""}
        <div class="row">${buttons}</div>`}
      </section>
    </div>`;
  }
  // One side of a card: the French or the English, then your notes for that side.
  function cardSide(c, lang) {
    const note = str(lang === "fr" ? c.frNote : c.enNote).trim();
    const lines = note ? note.split("\n").map((l) => (lang === "fr" ? typo(l) : esc(l))).join("<br>") : "";
    return lang === "fr" ? `<p class="answer">${typo(c.fr)}</p>${lines ? `<p class="note fr">${lines}</p>` : ""}`
      : `<p class="prompt">${esc(c.en)}</p>${lines ? `<p class="note">${lines}</p>` : ""}`;
  }
  // Editing a card in the middle of a session. The card keeps its id, so its review progress stays; a
  // built-in or Anki card is saved to your cards under that same id, and can go back to the original.
  const CARD_FIELDS = ["fr", "en", "frNote", "enNote", "ex"];
  function vocabEditForm(id) {
    const f = (k) => formVal("ve-" + k);
    const note = (t) => `<span class="muted" style="font-weight:400">${t}</span>`;
    const restore = !(DECK.has(id) && S.cards.has(id)) ? "" : ui.confirm === "ve-restore"
      ? `<button class="btn danger" data-act="v-edit-restore">Restore the original</button><button class="btn ghost" data-act="confirm-cancel">Keep my edits</button>`
      : `<button class="btn ghost" data-act="confirm" data-key="ve-restore">Restore the original</button>`;
    return `<div class="stack" style="text-align:left">
      <div class="grid2">
        <div class="stack tight"><p class="eyebrow">French side</p>
          <label class="field">French<input type="text" id="ve-fr" data-input="form" data-k="ve-fr" value="${f("fr")}" lang="fr" autocomplete="off"></label>
          <label class="field">Notes ${note("definition, synonyms, grammar…")}<textarea id="ve-frNote" data-input="form" data-k="ve-frNote" rows="3" lang="fr">${f("frNote")}</textarea></label>
        </div>
        <div class="stack tight"><p class="eyebrow">English side</p>
          <label class="field">English<input type="text" id="ve-en" data-input="form" data-k="ve-en" value="${f("en")}" autocomplete="off"></label>
          <label class="field">Notes ${note("meaning, usage, a reminder…")}<textarea id="ve-enNote" data-input="form" data-k="ve-enNote" rows="3">${f("enNote")}</textarea></label>
        </div>
      </div>
      <label class="field">Examples ${note("in French, one per line, shown when the card flips")}<textarea id="ve-ex" data-input="form" data-k="ve-ex" rows="3" lang="fr">${f("ex")}</textarea></label>
      <p class="small muted">Notes show with their side of the card. Your review progress stays with the card.</p>
      <div class="row" style="justify-content:flex-start"><button class="btn primary" data-act="v-edit-save">Save <span class="kbd">⌘↵</span></button><button class="btn ghost" data-act="v-edit-cancel">Cancel <span class="kbd">Esc</span></button>${restore}</div>
    </div>`;
  }
  function vocabEditOpen() {
    const v = ui.vocab;
    if (!v || v.finished || v.edit) return;
    const c = allCards().get((v.queue[v.i] || {}).id);
    if (!c) return;
    CARD_FIELDS.forEach((k) => { ui.form["ve-" + k] = str(c[k]); });
    v.edit = true;
    v.shown = true; // the form shows both sides anyway
    ui.confirm = "";
    render(true);
    const el = document.getElementById("ve-fr");
    if (el) el.focus();
  }
  function vocabEditClose() {
    if (ui.vocab) ui.vocab.edit = false;
    ui.confirm = "";
    render(true);
  }
  function vocabEditSave() {
    const v = ui.vocab;
    if (!v || !v.edit) return;
    const id = (v.queue[v.i] || {}).id;
    const c = allCards().get(id);
    const val = (k) => str(ui.form["ve-" + k]).trim();
    if (!c) return;
    if (!val("fr") || !val("en")) { toast("Both sides need some text."); return; }
    const doc = Object.assign({}, c, { edited: todayStr() });
    delete doc.id;
    CARD_FIELDS.forEach((k) => { if (val(k)) doc[k] = val(k); else delete doc[k]; });
    put("cards", id, doc);
    v.edit = false;
    ui.confirm = "";
    toast("Card saved.");
    render(true);
  }
  // When a session's cards come back, from their schedules: « on 18 oct. » or « between 16 and 22 oct. ».
  function backWhen(ids) {
    const ds = ids.map((id) => (S.srs.get(id) || {}).due).filter(Boolean).sort();
    if (!ds.length) return "soon";
    return ds[0] === ds[ds.length - 1] ? `on ${shortDate(ds[0])}` : `between ${shortDate(ds[0])} and ${shortDate(ds[ds.length - 1])}`;
  }
  function vocabDone() {
    const v = ui.vocab;
    const due = dueIds().length;
    const sk = hk(v.queue.map((e) => e.id).join("|")), perfect = v.mode !== "new" && v.ok > 0 && !v.miss;
    const rm = v.mode === "new" ? ["bonjour", "Nouvelles cartes en poche !", "New cards in the bag!"]
      : perfect ? ["bravo", "Séance parfaite ! Bravo.", "A perfect session! Well done."]
      : v.mode === "practice" ? ["bonjour", "Bien joué ! Ton planning ne change pas.", "Nice work! Your schedule stays as it was."]
      : ["bonjour", "Bien joué ! Les ratées reviennent bientôt.", "Nice work! The ones you missed come back soon."];
    const n = v.total, checked = v.ok + v.miss;
    const ids = (k) => [...new Set(v.queue.filter((x) => x.k === k).map((x) => x.id))];
    const lede = v.mode === "new"
      ? `You recalled ${v.ok} of ${checked} at the first check. They come back ${backWhen(ids("show"))} for their first review.`
      : v.mode === "practice" ? `Practice only: the schedule didn't change.${v.miss ? ` The ${v.miss} you missed came back until you got ${v.miss > 1 ? "them" : "it"}.` : ""}`
      : v.miss ? `${v.miss} miss${v.miss > 1 ? "es" : ""} went to the priority pile: FSRS brings ${v.miss > 1 ? "them" : "it"} back ${backWhen(ids("re"))}, and counts ${v.miss > 1 ? "them" : "it"} as a little harder from now on.` : "Clean session.";
    return `<div class="wrap"><section class="panel stack" data-m="pop" data-k="vdone-${sk}">
      <p class="eyebrow">${v.mode === "practice" ? "Practice complete" : "Session complete"}</p>
      <p class="scorebig"${perfect ? ` data-m="burst" data-k="vperfect-${sk}"` : ""}>${v.mode === "new" ? `<span data-tween="vdone-${sk}" data-tw="count" data-to="${n}">${n}</span> new` : `<span data-tween="vdone-${sk}" data-tw="count" data-to="${v.ok}">${v.ok}</span> / ${checked}`}</p>
      ${greet(rm[0], rm[1], rm[2], "sm")}
      <p class="lede">${lede}${due ? ` ${due} card${due > 1 ? "s are" : " is"} still due.` : ""}</p>
      <div class="row"><button class="btn primary" data-act="v-close">Back to the deck</button>${due ? `<button class="btn" data-act="v-start" data-mode="review">Review the rest</button>` : ""}${v.mode === "practice" ? `<button class="btn" data-act="v-start" data-mode="practice">Practise more</button>` : ""}</div>
    </section></div>`;
  }

  /* =============== view: writing =============== */
  const W_CHECKS = {
    all: [["elision", "Elision pass: read once hunting only for missed elisions"], ["pron", "Pronominal verbs: être + agreement checked"]],
    t1: [["imp", "Imperatives and embedded questions checked"]],
    t2: [["opinion", "My opinion is woven in, not a neutral recount"], ["goal", "The conclusion ties back to the task's objective"]],
    t3: [["both", "Paragraph 1 states BOTH documents' positions"], ["order", "My opinion comes after the comparison"], ["concede", "I concede the other side before pivoting (Certes… mais)"]],
  };
  /* =============== Examen blanc EE =============== */
  // The three writing tasks on one 60-minute clock, as on the real test (the user asked on 2026-10-23; the plan's
  // « Full timed Écrite mock » blocks open it): a prompt each you haven't written yet, free movement between the
  // tasks, no spellcheck, and the exam handed in at 0:00. Each task is saved as an ordinary writing text with
  // `mock` ({ id, min, up }), so the history, Your mistakes and the writing estimate take them like any other, and
  // Claude corrects the three when you hand in. The mock's score is the mean of the three tasks' scores, a blank task
  // counting 0: an estimate, since FEI doesn't publish how it combines them.
  const EE_HOME = "writing.mock", EE_IP = "writing--mock", EE_MIN = 60, EE_TASKS = ["t1", "t2", "t3"];
  // A task's prompt: the first you haven't written yet, or else the one written longest ago.
  function eePrompt(task) {
    const W = T.WRITING[task], lastAt = new Map();
    list("writing").filter((x) => x.task === task).forEach((x) => lastAt.set(x.prompt, Math.max(lastAt.get(x.prompt) || 0, x.ts || 0)));
    const ps = W.prompts.map((p) => (typeof p === "string" ? { q: p } : p));
    const p = ps.find((x) => !lastAt.has(x.q)) || ps.slice().sort((a, b) => lastAt.get(a.q) - lastAt.get(b.q))[0];
    return { q: p.q, en: p.en || "", docs: p.docs || null };
  }
  const eeRunning = () => !!ui.ee && !ui.ee.done;
  const eeWords = (e) => EE_TASKS.reduce((n, t) => n + countWords(str(e.texts[t])), 0);
  // Your minutes on each task: the time on the clock while it was the one on screen.
  function eeTally() {
    const e = ui.ee;
    if (!e || e.done) return;
    const now = Date.now();
    if (timer.home === EE_HOME && timer.running) e.spent[e.task] = (e.spent[e.task] || 0) + Math.max(0, now - (e.at || now)) / 1000;
    e.at = now;
  }
  // The mock is kept from its start, as the listening exam is: the clock runs from there.
  function eeKeep(delay) {
    const e = ui.ee;
    if (!e || e.done) return;
    const left = timer.home === EE_HOME ? Math.max(0, Math.round(timerRemaining())) : null;
    ipSave(EE_IP, { kind: "eemock", title: "Examen blanc EE", route: EE_HOME, mockId: e.id, prompts: e.prompts, texts: e.texts, task: e.task, spent: e.spent, left }, delay);
  }
  function eeStart() {
    if (eeRunning()) { goTo("#" + EE_HOME); return; }
    // The first draw with your progress loaded checks unfinished attempts against the tab's copy; it comes first, so
    // a mock started now isn't taken for one carried on elsewhere.
    if (!loaded) { toast("Your progress is still loading."); return; }
    if (!hydrated) render(true);
    // One clock serves every page, so a practice exam already running keeps it.
    if (examRunning()) { toast("A practice exam is running: hand it in or pause it first."); return; }
    if (ipGet(EE_IP)) { ipResume(EE_IP); return; }
    ui.ee = { id: uid(), prompts: Object.fromEntries(EE_TASKS.map((t) => [t, eePrompt(t)])), texts: { t1: "", t2: "", t3: "" }, task: "t1", spent: { t1: 0, t2: 0, t3: 0 }, at: Date.now(), done: false };
    timerSet(EE_MIN * 60, "Examen blanc EE", EE_HOME);
    tone("start");
    timerStart();
    eeKeep();
    goTo("#" + EE_HOME);
    window.scrollTo(0, 0);
  }
  function eeResume(ip) {
    if (eeRunning() && ui.ee.id === ip.mockId) { goTo("#" + EE_HOME); return; }
    if (examRunning()) { toast("A practice exam is running: hand it in or pause it first."); return; }
    ui.ee = { id: ip.mockId || uid(), prompts: clone(ip.prompts), texts: Object.assign({ t1: "", t2: "", t3: "" }, clone(ip.texts)), task: EE_TASKS.includes(ip.task) ? ip.task : "t1", spent: Object.assign({ t1: 0, t2: 0, t3: 0 }, clone(ip.spent)), at: Date.now(), done: false };
    timerSet(EE_MIN * 60, "Examen blanc EE", EE_HOME);
    if (ip.left != null) timer.left = Math.min(EE_MIN * 60, Math.max(0, Number(ip.left)));
    tone("start");
    timerStart();
    goTo("#" + EE_HOME);
    window.scrollTo(0, 0);
  }
  function eeSwitch(task) {
    const e = ui.ee;
    if (!e || e.done || !EE_TASKS.includes(task) || task === e.task) return;
    eeTally();
    e.task = task;
    e.confirm = false;
    eeKeep();
    render(true);
    const el = document.getElementById("ee-text");
    if (el) el.focus({ preventScroll: true });
  }
  // What's off before handing in: a task left blank, or outside its word range.
  function eeIssues(e) {
    return EE_TASKS.map((t) => { const W = T.WRITING[t], n = countWords(str(e.texts[t])); return !n ? `${W.name} is blank` : n < W.min || n > W.max ? `${W.name} has ${n} words (${W.min}–${W.max})` : ""; }).filter(Boolean);
  }
  // Hands the three texts in: each one written is saved as a writing text of the mock, then Claude corrects them.
  function eeHandIn(reason) {
    const e = ui.ee;
    if (!e || e.done) return;
    const el = document.getElementById("ee-text");
    if (el) e.texts[e.task] = el.value;
    if (!eeWords(e)) {
      if (reason !== "time") { toast("Write something first: there's nothing to hand in yet."); return; }
    } else if (reason !== "time" && !e.confirm && eeIssues(e).length) { e.confirm = true; render(true); return; }
    eeTally();
    const used = timer.home === EE_HOME ? Math.round(timer.total - timerRemaining()) : 0;
    const min = Math.max(1, Math.min(EE_MIN, Math.round(used / 60))), up = reason === "time";
    timerSet(0, "", ""); // stops the clock and takes it off the sidebar
    const ts = Date.now();
    EE_TASKS.forEach((t, k) => {
      const text = str(e.texts[t]);
      if (!text.trim()) return;
      const p = e.prompts[t];
      put("writing", uid(), { task: t, date: todayStr(), ts: ts + k, prompt: p.q, docs: p.docs || null, text, words: countWords(text), minutes: Math.max(1, Math.round((e.spent[t] || 0) / 60)), fb: null, mock: { id: e.id, min, up } });
    });
    ipDrop(EE_IP);
    Object.assign(e, { done: true, confirm: false, view: null });
    autoTick(EE_HOME, { min });
    toast(up ? "Time's up: your three texts were handed in." : "Handed in.");
    render(true);
    window.scrollTo(0, 0);
    if (claudeOn() && eeWords(e)) eeCorrect(e.id);
  }
  function eeQuit() {
    ipDrop(EE_IP);
    if (timer.home === EE_HOME) timerSet(0, "", "");
    ui.ee = null;
    toast("The mock was discarded.");
    render(true);
  }
  // Every mock, newest first, with its three texts (a blank task has none) and its score once all are corrected.
  function eeMocks() {
    const by = new Map();
    list("writing").forEach((w) => {
      const m = w.mock;
      if (!m || !m.id) return;
      const x = by.get(m.id) || { id: m.id, date: w.date, ts: w.ts || 0, min: m.min, up: !!m.up, tasks: {} };
      x.tasks[w.task] = w;
      by.set(m.id, x);
    });
    return [...by.values()].map((x) => {
      const scores = EE_TASKS.map((t) => { const w = x.tasks[t]; return !w ? 0 : w.fb && w.fb.score20 != null && !isNaN(w.fb.score20) ? Number(w.fb.score20) : null; });
      return Object.assign(x, { scores, score: scores.every((v) => v != null) ? Math.round(scores.reduce((a, b) => a + b, 0) / 3) : null });
    }).sort((a, b) => b.ts - a.ts);
  }
  // Claude corrects the mock's texts, one after another, each like a text on the writing page. Once all three are,
  // the mock's score goes into the score log, as a practice exam's does (a copy: the tasks' own scores already count).
  async function eeCorrect(mockId) {
    if (ui.eeBusy) return;
    const m0 = eeMocks().find((x) => x.id === mockId);
    if (!m0) return;
    ui.eeBusy = mockId;
    render(true);
    for (const t of EE_TASKS) {
      const w = eeMocks().find((x) => x.id === mockId).tasks[t];
      if (!w || w.fb) continue;
      const out = await ask("ee-correct", wCorrectPrompt(t, { q: w.prompt, docs: w.docs }, w.text));
      if (!out) break; // ask() has said why
      const cur = S.writing.get(w.id);
      if (!cur) continue;
      put("writing", w.id, Object.assign({}, cur, { fb: cleanFb(out, t) }));
      minePrepSoon("w-" + w.id);
      render(true);
    }
    ui.eeBusy = null;
    const m = eeMocks().find((x) => x.id === mockId);
    if (m && m.score != null && !list("mocks").some((x) => x.compId === "ee-" + mockId)) put("mocks", uid(), { date: m.date, ts: Date.now(), label: "Examen blanc EE (site estimate)", ee: m.score, compId: "ee-" + mockId });
    render(true);
  }
  // The three texts for another AI, when Claude can't correct them (or on the local site): one prompt with the
  // rules, the three tasks and subjects, your texts, and the overall score to give.
  function eeCopyPrompt(m) {
    const parts = EE_TASKS.map((t, k) => {
      const W = T.WRITING[t], w = m.tasks[t];
      const docs = t === "t3" && w && w.docs ? w.docs.map((d, j) => `\nDOCUMENT ${j + 1} (${d.who}) :\n${d.text}`).join("") : "";
      return `TÂCHE ${k + 1}: ${W.name}, ${W.kind}. ${W.expected} Required length: ${W.min}–${W.max} words.${w ? ` My word count: ${w.words}.` : ""}\nSUBJECT:\n${w ? w.prompt : "(not written)"}${docs}\nMY TEXT:\n"""\n${w ? str(w.text).trim() : "(blank)"}\n"""`;
    });
    return [
      "You are a certified TCF Canada Expression écrite corrector (France Éducation International) and a French teacher. I wrote a full Expression écrite mock: the three tasks in one 60-minute sitting. Correct each text and grade it strictly the way the TCF Canada does, using the rules, criteria and score bands below. Don't use DELF, TEF or TCF tout public grading.",
      `${EE_RUBRIC}\nSCORE BANDS: ${TC.bands}`,
      ...parts,
      `ABOUT ME: an adult B1 learner of French preparing the TCF Canada, aiming for NCLC 7 (B2). Mistakes I often make: ${T.KNOWN_ERRORS.join("; ")}.${watchBrief(true)}`,
      `Reply in ${replyLang()} with, for each task: a score out of 20 on the TCF Canada scale (a blank task, or one outside its word range, capped as the TCF Canada would), a level and one sentence for each criterion (${TC.ee.criteria.map(([n]) => n).join(", ")}), every mistake as wrong → right (why), and the text corrected. For Tâche 3, whether part 1 compares both documents and my own position comes only in part 2. Then my overall Expression écrite score out of 20 and its NCLC level, and the three things to work on first.`,
    ].join("\n\n");
  }
  async function eeCopy(mockId) {
    const m = eeMocks().find((x) => x.id === mockId);
    if (!m) return;
    const text = eeCopyPrompt(m);
    if (await copyText(text)) { ui.eeCopyOut = null; toast("Copied: the TCF Canada rules and your three texts. Paste it into any AI chat."); render(true); return; }
    ui.eeCopyOut = { id: mockId, text };
    render(true);
    const el = document.getElementById("ee-copy-out");
    if (el) { el.focus(); el.select(); }
  }
  // The word meters under the editor and the counts on the task buttons, painted in place as you type.
  function eeMeters() {
    const e = ui.ee;
    if (!e || e.done) return;
    const W = T.WRITING[e.task], text = str(e.texts[e.task]);
    const el = document.getElementById("ee-meter");
    if (el) { const m = meterHTML(countWords(text), W.min, W.max, "Words"); el.className = "meter " + m.cls; el.innerHTML = m.html; }
    const pe = document.getElementById("ee-paras");
    if (pe && W.paras) {
      const ps = paragraphs(text), counts = [ps[0] ? countWords(ps[0]) : 0, ps.slice(1).reduce((n, x) => n + countWords(x), 0)];
      pe.innerHTML = W.paras.map((P, k) => { const mm = meterHTML(counts[k] || 0, P.min, P.max, P.label); return `<div class="meter ${mm.cls}">${mm.html}</div>`; }).join("");
    }
    EE_TASKS.forEach((t) => {
      const Wt = T.WRITING[t], n = countWords(str(e.texts[t]));
      document.querySelectorAll(`[data-ee-n="${t}"]`).forEach((b) => { b.textContent = `${n} mots`; b.className = `ee-n ${!n ? "" : n < Wt.min ? "under" : n > Wt.max ? "over" : "in"}`; });
    });
  }
  // A score out of 20's level, on the bands TC.bands gives (B1 6–9, B2 10–13, C1 14–15, C1–C2 16–20).
  const eeCefr = (v) => (v >= 16 ? "C1–C2" : v >= 14 ? "C1" : v >= 10 ? "B2" : v >= 6 ? "B1" : "A1–A2");
  const eeState = (n, W) => (!n ? "" : n < W.min ? "under" : n > W.max ? "over" : "in");
  function eeView() {
    const e = ui.ee;
    if (eeRunning()) return eeRun(e);
    const m = e && e.done && eeMocks().find((x) => x.id === e.id);
    return m ? eeResult(m, e) : eeIntro();
  }
  function eeIntro() {
    const ip = ipGet(EE_IP), mocks = eeMocks();
    const plan = EE_TASKS.map((t) => { const W = T.WRITING[t]; return `<li><b>${esc(W.name)}</b> · ${esc(W.kind)} · ${W.min}–${W.max} words · about ${W.exam} min</li>`; }).join("");
    const rows = mocks.map((m) => `<tr><td class="n">${shortDate(m.date)}</td>${EE_TASKS.map((t, k) => { const w = m.tasks[t], W = T.WRITING[t]; return `<td class="n">${w ? `<span class="tag7 ${w.words >= W.min && w.words <= W.max ? "ok" : "no"}">${w.words}</span>${m.scores[k] != null ? ` · ${m.scores[k]}/20` : ""}` : `<span class="muted small">blank</span>`}</td>`; }).join("")}<td class="n">${m.score != null ? `<b>${m.score}/20</b> ${nclcTag(m.score, "ee")}` : `<span class="muted small">not corrected</span>`}</td><td><button class="btn ghost sm" data-act="ee-open" data-id="${esc(m.id)}">Open</button></td></tr>`).join("");
    return `<section class="panel stack" data-spot>
        <p class="h3 with-ico">${ico("exam")}Examen blanc · Expression écrite</p>
        <p class="small">The three tasks on one 60-minute clock, as on the real test: no dictionary, no spellcheck, and only your final texts are marked. Move between the tasks as you like; at 0:00 the exam is handed in.</p>
        <ul class="small ee-plan">${plan}</ul>
        <p class="small muted">Each task gets a prompt you haven't written yet. ${claudeOn() ? "When you hand in, Claude corrects all three, and the mock's score is the mean of the three." : "Corrections need Claude, on claude.ai; here you can copy your three texts for another AI."}</p>
        ${ip ? `<div class="notice"><b>You have an unfinished mock:</b> ${esc(ipProgress(ip))}.<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="ip-resume" data-id="${EE_IP}">Resume the mock</button>${discardBtn(EE_IP)}</div></div>` : `<div class="row"><button class="btn primary" data-act="ee-start">Start the exam · 60:00</button></div>`}
      </section>
      <section class="sec"><div class="sec-head"><h2 class="h2">Tes examens blancs · Your mocks</h2><span class="small muted">${mocks.length ? `${mocks.length} so far, newest first` : ""}</span></div>
        ${mocks.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Date</th>${EE_TASKS.map((t) => `<th class="n">${esc(T.WRITING[t].name)}</th>`).join("")}<th class="n">Score</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="small muted">Your mocks collect here, with each task's words and score.</p>`}
      </section>`;
  }
  function eeRun(e) {
    const W = T.WRITING[e.task], p = e.prompts[e.task], text = str(e.texts[e.task]);
    const mine = timer.home === EE_HOME;
    const clock = `<div class="timer"><span class="clock" ${mine ? "data-timer" : ""}>${mine ? fmtClock(timerRemaining()) : "—"}</span>${mine ? `<button class="btn sm" data-act="timer-toggle" data-home="${EE_HOME}" data-sec="${EE_MIN * 60}" data-label="Examen blanc EE" data-timer-btn>${timer.running ? "Pause" : "Resume"}</button>` : ""}</div>`;
    const tabs = `<div class="ee-tabs" role="group" aria-label="The three tasks">${EE_TASKS.map((t) => { const Wt = T.WRITING[t], n = countWords(str(e.texts[t])); return `<button data-act="ee-task" data-t="${t}" aria-pressed="${t === e.task}"><b>${esc(Wt.name)}</b><span class="ee-n ${eeState(n, Wt)}" data-ee-n="${t}">${n} mots</span></button>`; }).join("")}</div>`;
    const docs = e.task === "t3" && p.docs ? `<div class="docs">${p.docs.map((d, k) => `<div class="doc"><p class="eyebrow">Document ${k + 1}</p><p class="fr">${typo(d.text)}</p><p class="who">${esc(d.who)}</p></div>`).join("")}</div>` : "";
    const issues = e.confirm ? eeIssues(e) : [];
    return `<div class="row between"><p class="h3 with-ico">${ico("exam")}Examen blanc EE</p>${clock}</div>
      ${tabs}
      <section class="panel prompt-card" data-m="slide" data-k="ee-${esc(e.id)}-${e.task}">
        <span class="eyebrow">${esc(W.kind)} · ${W.min}–${W.max} words · about ${W.exam} of the 60 min</span>
        <p class="fr">${typo(p.q)}</p>
        ${p.en ? `<p class="small muted en-gloss">${esc(p.en)}</p>` : ""}
        ${docs}
      </section>
      <section class="panel editor">
        <div class="ed-bar"><div class="meter" id="ee-meter"></div></div>
        <textarea id="ee-text" class="seyes" data-input="ee-text" spellcheck="false" autocomplete="off" autocorrect="off" lang="fr" placeholder="Écrivez ici…" aria-label="Your text for ${esc(W.name)}">${esc(text)}</textarea>
        ${W.paras ? `<div class="paras" id="ee-paras"></div>` : ""}
      </section>
      ${accentBar()}
      ${issues.length ? `<div class="notice warn">${issues.map((x) => esc(x)).join(" · ")}. On the real test, a task outside its range can be marked « A1 non atteint », and a blank one counts 0.<div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="ee-hand-in" data-force="1">Hand in anyway</button><button class="btn sm" data-act="ee-keep">Keep writing</button></div></div>` : ""}
      <div class="row between"><button class="btn primary" data-act="ee-hand-in">Hand in</button>${ui.confirm === "ee-quit" ? `<span class="row"><span class="small">Quit and lose these texts?</span><button class="btn sm danger" data-act="ee-quit">Quit the mock</button><button class="btn sm ghost" data-act="confirm-cancel">Keep going</button></span>` : `<button class="btn ghost sm" data-act="confirm" data-key="ee-quit">Quit without saving</button>`}</div>`;
  }
  function eeResult(m, e) {
    const busy = ui.eeBusy === m.id, open = EE_TASKS.some((t) => m.tasks[t] && !m.tasks[t].fb);
    const view = e.view && S.writing.get(e.view);
    const cards = EE_TASKS.map((t, k) => {
      const W = T.WRITING[t], w = m.tasks[t];
      if (!w) return `<div class="panel flat stack tight ee-task"><p class="eyebrow">${esc(W.name)}</p><p class="small"><span class="pill bad">Blank</span> counts 0</p></div>`;
      const st = w.fb ? (w.fb.score20 != null ? `<b class="ee-score">${w.fb.score20}<small>/20</small></b> <span class="pill">${esc(w.fb.level || "")}</span>` : `<span class="pill">${esc(w.fb.level || "Corrected")}</span>`) : busy ? `<span class="small muted thinking">Claude is correcting</span>` : `<span class="small muted">Not corrected</span>`;
      return `<div class="panel flat stack tight ee-task" data-m="rise" data-k="eet-${esc(m.id)}-${t}-${w.fb ? 1 : 0}"><p class="eyebrow">${esc(W.name)}</p><div class="row">${st}</div><p class="small"><span class="tag7 ${w.words >= W.min && w.words <= W.max ? "ok" : "no"}">${w.words} words</span> <span class="muted">${W.min}–${W.max} · ${w.minutes} min</span></p><div><button class="btn ghost sm" data-act="ee-view" data-id="${esc(w.id)}">${e.view === w.id ? "Showing" : w.fb ? "See the correction" : "See the text"}</button></div></div>`;
    }).join("");
    const nc = m.score != null ? nclcOf("ee", m.score) : null;
    return `<section class="panel stack" data-m="pop" data-k="eer-${esc(m.id)}">
        <p class="eyebrow">Examen blanc · Expression écrite · ${shortDate(m.date)}${m.up ? " · handed in when time ran out" : ""}</p>
        <div class="row"><span class="scorebig">${m.score != null ? `<span data-tween="ees-${esc(m.id)}" data-tw="count" data-to="${m.score}">${m.score}</span>/20` : "…/20"}</span>${m.score != null ? `${nclcTag(m.score, "ee")}<span class="pill">${eeCefr(m.score)}</span>` : ""}</div>
        <p class="small">${m.min} min of the 60 used. ${m.score != null ? "The score is the mean of the three tasks' scores, a blank one counting 0: an estimate, since France Éducation International doesn't publish how it combines them." : busy ? "Claude is correcting your texts, one after another." : claudeOn() ? "Not corrected yet." : "Corrections need Claude, on claude.ai. Here, copy your three texts for another AI."}</p>
        ${m.score != null ? greet(...remyScore("exam", m.score, 20, { nclc: nc || 0, key: m.id }), "sm") : ""}
        <div class="ee-tasks">${cards}</div>
        <div class="row">${open && !busy ? claudeBtn("ee-correct", "ee-correct", "Correct with Claude", `data-id="${esc(m.id)}"`, "btn primary") : ""}<button class="btn" data-act="ee-copy" data-id="${esc(m.id)}">Copy for another AI</button><button class="btn" data-act="ee-new">Start another mock</button><button class="btn ghost" data-act="ee-close">All your mocks</button></div>
        ${ui.eeCopyOut && ui.eeCopyOut.id === m.id ? `<div class="stack tight"><p class="small muted">This browser didn't let the page copy it. It's selected below: press Ctrl+C (⌘C on a Mac).</p><textarea id="ee-copy-out" readonly rows="10" aria-label="Prompt to copy">${esc(ui.eeCopyOut.text)}</textarea></div>` : ""}
      </section>
      ${view ? writingFb(e.view, view, "ee-view-close") : ""}`;
  }

  VIEWS.writing = {
    render(args) {
      const tabsOf = (cur) => `<nav class="tabs" role="tablist">${["t1", "t2", "t3"].map((k) => `<a href="#writing.${k}" role="tab" aria-selected="${k === cur}">${T.WRITING[k].name}<small>${T.WRITING[k].min}–${T.WRITING[k].max} mots</small></a>`).join("")}<a href="#writing.mock" role="tab" aria-selected="${cur === "mock"}">${ico("exam")}Examen blanc<small>3 tâches · 60 min</small></a></nav>`;
      if (args[0] === "mock") return `<div class="wrap${eeRunning() ? " focus" : ""}">${eeRunning() ? "" : `<header class="stack tight"><h1 class="title">Expression écrite</h1></header>${tabsOf("mock")}`}<div class="stack">${eeView()}</div></div>`;
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
      // Every corrected text's score out of 20, oldest to latest, against the NCLC 7 band.
      const scored = list("writing").filter((w) => w.fb && w.fb.score20 != null && w.fb.score20 !== "" && !isNaN(w.fb.score20)).sort((a, b) => (a.ts || 0) - (b.ts || 0)), ns = scored.length;
      const trend = ns > 1 ? `<div class="panel w-trend" data-spot><p class="small muted">Tes notes · your scores out of 20, every task, oldest to latest</p>${CH.plot({
        key: "w-trend", h: 96, yMin: 0, yMax: 20, ticks: [10, 20], label: "Your writing scores out of 20, oldest to latest",
        bands: [{ from: 10, to: 12, label: "NCLC 7", cls: "target" }],
        series: [{ label: "Score /20", color: "var(--c-ee)", line: true, points: scored.map((w, i) => ({ x: i / (ns - 1), y: Number(w.fb.score20), tip: `${w.fb.score20}/20${w.fb.level ? " · " + w.fb.level : ""}\n${(T.WRITING[w.task] || W).name} · ${shortDate(w.date)} · ${w.words} words` })) }],
        end: { x: 1, y: Number(scored[ns - 1].fb.score20), label: `${scored[ns - 1].fb.score20}/20` },
        xs: [{ x: 0, label: shortDate(scored[0].date) }, { x: 1, label: shortDate(scored[ns - 1].date) }],
      })}</div>` : "";
      return `<div class="wrap">
        <header class="stack tight"><h1 class="title">Expression écrite</h1>${fold("intro-writing", "Comment ça marche · How it works", `<p class="small muted">TCF Canada format and grading. Spellcheck is off, like on exam day, and your draft is saved with its prompt as you type, so you can come back to it on any device.</p>`)}</header>
        ${tabsOf(task)}
        ${fxTabs("writing." + task)}
        <section class="panel prompt-card">
          <div class="row between"><span class="eyebrow">${esc(W.kind)} · ${W.min}–${W.max} words${ui.w.gen[task] && !ui.w.gen[task].kept ? " · from Claude" : ""}</span>
            <span class="row"><button class="btn sm" data-act="w-next">Another prompt</button>${claudeBtn("w-gen", "w-gen", "New prompt from Claude", "", "btn sm")}</span></div>
          ${ui.confirm === "w-switch-w-next" || ui.confirm === "w-switch-w-gen" ? `<div class="notice warn small">A new prompt would leave your draft answering the wrong question, so the draft would be discarded.<div class="row" style="margin-top:8px"><button class="btn sm danger" data-act="${ui.confirm.slice(9)}">Discard the draft and switch</button><button class="btn sm ghost" data-act="confirm-cancel">Keep my draft</button></div></div>` : ""}
          <p class="fr">${typo(p.q)}</p>
          ${p.en ? `<p class="small muted en-gloss">${esc(p.en)}</p>` : ""}
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
        ${watchStrip()}
        <section class="panel editor">
          <div class="ed-bar"><div class="meter" id="w-meter"></div>${timerUI("writing." + task, W.name + " écrit", presets)}</div>
          <textarea id="w-text" class="seyes" data-input="w-text" spellcheck="false" autocomplete="off" autocorrect="off" lang="fr" placeholder="Écrivez ici…" aria-label="Your text">${esc(text)}</textarea>
          ${task === "t3" ? `<div class="paras" id="w-paras"></div>` : ""}
        </section>
        ${accentBar()}
        ${fold("w-checks-" + task, "Avant de rendre · Before you submit", `<div class="stack tight">
          <label class="check"><input type="checkbox" id="chk-words" disabled><span>Word count inside ${W.min}–${W.max}. Outside the range, a task can be marked “A1 non atteint” however good the French.</span></label>
          ${checks.map(([k, l]) => `<label class="check"><input type="checkbox" data-change="w-check" data-k="${k}" ${ch[k] ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}
        </div>`)}
        <div class="row">${claudeBtn("w-correct", "w-correct", "Correct with Claude", "", "btn primary")}<button class="btn" data-act="w-copy" title="Copies the task, the TCF Canada rules and criteria, and your draft, ready to paste into another AI for a correction">Copy for another AI</button><button class="btn" data-act="w-save">Finish without correction</button>${ui.confirm === "w-clear" ? `<button class="btn danger" data-act="w-clear">Clear the draft</button><button class="btn ghost" data-act="confirm-cancel">Keep it</button>` : `<button class="btn ghost" data-act="confirm" data-key="w-clear">Clear draft</button>`}</div>
        ${ui.w.copyOut && ui.w.copyOut.task === task ? `<section class="panel stack tight"><p class="h3">Copy this into another AI</p><p class="small muted">This browser didn't let the page copy it. It's selected below: press Ctrl+C (⌘C on a Mac), or select it all first.</p><textarea id="w-copy-out" readonly rows="10" aria-label="Prompt to copy">${esc(ui.w.copyOut.text)}</textarea><div class="row"><button class="btn sm ghost" data-act="w-copy-close">Close</button></div></section>` : ""}
        ${viewing ? writingFb(ui.w.viewing, viewing) : ""}
        <section class="sec"><div class="sec-head"><h2 class="h2">History</h2><span class="small muted">${hist.length ? `${hist.length} most recent` : ""}</span></div>
          ${trend}
          ${hist.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Date</th><th>Task</th><th>Words</th><th>Level</th><th></th></tr></thead><tbody>${hist.map((w) => {
            const WW = T.WRITING[w.task] || W;
            const ok = w.words >= WW.min && w.words <= WW.max;
            return `<tr><td class="n">${shortDate(w.date)}</td><td>${esc(WW.name)}${w.mock ? ` <span class="pill info">examen blanc</span>` : ""}</td><td class="n"><span class="tag7 ${ok ? "ok" : "no"}">${w.words}</span></td><td>${w.fb && w.fb.score20 != null ? `${w.fb.score20}/20 · ${esc(w.fb.level)}` : w.fb && w.fb.level ? esc(w.fb.level) : `<span class="muted small">not corrected</span>`}</td>
              <td><span class="row" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn ghost sm" data-act="w-open" data-id="${esc(w.id)}">${ui.w.viewing === w.id ? "Showing" : "Open"}</button>${confirmBtn("w-del-" + w.id, "Delete this entry", "w-del", `data-id="${esc(w.id)}"`)}</span></td></tr>`;
          }).join("")}</tbody></table></div>` : `<p class="small muted">Corrected and saved drafts collect here, with their word counts.</p>`}
        </section>
      </div>`;
    },
    after(args) { if (args[0] === "mock") eeMeters(); else updateMeters(); },
  };
  // What Rémy says over a correction: how many mistakes to fix, and the category most of them are in.
  function remyMarks(errs) {
    const n = arr(errs).length;
    if (!n) return ["Aucune faute relevée. Très bien !", "No mistakes found. Very good!"];
    const top = errorCountsOf(errs)[0];
    const most = top && top[1] >= 2 ? `, mostly ${CAT[top[0]].toLowerCase()}` : "";
    return [`${cap(frNum(n))} faute${n > 1 ? "s" : ""} à revoir.`, `${cap(enNum(n))} mistake${n > 1 ? "s" : ""} to fix${most}.`];
  }
  const errorCountsOf = (errs) => Object.entries(arr(errs).reduce((m, e) => { const c = catOf(e.category); m[c] = (m[c] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  function writingFb(id, doc, closeAct) {
    const W = T.WRITING[doc.task] || T.WRITING.t1;
    const fb = doc.fb;
    const inRange = doc.words >= W.min && doc.words <= W.max;
    const head = `<div class="row between"><h2 class="h2">${esc(W.name)} · ${shortDate(doc.date)}</h2><button class="btn ghost sm" data-act="${closeAct || "w-close"}">Close</button></div>
      <p class="small muted fr">${typo(doc.prompt || "")}</p>`;
    if (!fb) return `<section class="panel fb" id="w-fb">${head}<div class="flags"><span class="pill ${inRange ? "ok" : "bad"}">${doc.words} words</span><span class="pill">Not corrected</span></div><p class="corrected seyes">${esc(doc.text)}</p></section>`;
    const flag = (ok, yes, no) => `<span class="pill ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${esc(ok ? yes : no)}</span>`;
    const t3 = fb.tache3;
    return `<section class="panel fb" id="w-fb" data-m="rise" data-k="wfb-${esc(id)}">
      ${head}
      <div class="fb-head"><span class="level">${fb.score20 != null ? `<span data-tween="w20-${esc(id)}" data-tw="count" data-to="${fb.score20}">${fb.score20}</span><small>/20</small>` : esc(fb.level || "—")}</span><div class="stack tight"><span class="small muted">${fb.score20 != null ? `${esc(fb.level)} · about NCLC ${esc(fb.nclc)} · ` : fb.nclc ? `About NCLC ${esc(fb.nclc)} · ` : ""}Claude's estimate on the TCF Canada scale, not an official score.</span><p>${esc(fb.summary)}</p></div></div>
      ${greet("correction", ...remyMarks(fb.errors), "sm")}
      <div class="flags">
        ${flag(inRange, `${doc.words} words, inside ${W.min}–${W.max}`, `${doc.words} words, outside ${W.min}–${W.max}`)}
        ${flag(fb.compliance.on_topic, "On topic", "Off topic")}
        ${flag(fb.compliance.register_ok, "Register fits", "Register off")}
        ${t3 ? flag(t3.compared_both, "Compared both documents", "Didn't compare both documents") + flag(t3.opinion_after_comparison, "Opinion after comparison", "Opinion before or instead of comparison") : ""}
        ${doc.minutes ? `<span class="pill">${doc.minutes} min on the clock</span>` : ""}
      </div>
      ${fb.compliance.notes || (t3 && t3.notes) ? `<p class="small">${esc([fb.compliance.notes, t3 && t3.notes].filter(Boolean).join(" "))}</p>` : ""}
      ${criteriaTable(fb.criteria, "Graded against the criteria France Éducation International publishes for the TCF Canada. Its internal marking grids aren't public, so treat the score as an estimate.")}
      <div class="stack tight"><p class="h3">Corrections <span class="muted small">· ${fb.errors.length}</span></p>${errList(fb.errors, true)}${fb.errors.length ? `<a class="small" href="#grammar.mine">Practise these in Your mistakes →</a>` : ""}</div>
      ${fb.upgrades.length ? `<div class="stack tight"><p class="h3">B1 → B2 upgrades</p><ul class="upgrades">${fb.upgrades.map((u) => `<li><span>${typo(u.from)}</span><span class="arrow">→</span><b>${typo(u.to)}</b></li>`).join("")}</ul></div>` : ""}
      ${fb.strengths.length ? `<div class="stack tight"><p class="h3">What worked</p><ul class="small" style="margin:0;padding-left:20px">${fb.strengths.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${fb.corrected ? `<details class="fold"><summary>Corrected text</summary><p class="corrected seyes" style="margin-top:10px">${esc(fb.corrected)}</p></details>` : ""}
      <details class="fold"><summary>Your original</summary><p class="corrected seyes" style="margin-top:10px">${esc(doc.text)}</p></details>
      ${fb.homework.length ? `<div class="stack tight"><p class="h3">Follow-up tasks</p><p class="small muted">Claude's suggestions. Add the ones you want to your homework.</p><ul class="hw">${fb.homework.map((h, i) => `<li style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(h)}</span>${list("homework").some((x) => x.text === h) ? `<span class="small muted">Added</span>` : `<button class="btn sm" data-act="hw-fb-add" data-id="${esc(id)}" data-i="${i}">Add</button>`}</li>`).join("")}</ul></div>` : ""}
    </section>`;
  }

  /* =============== view: comprehension =============== */
  // Easy French every day (#comp.free.co, #comp.free.ce): the plan's last block, done outside study time.
  // The page says how to do it, lists the sources (T.COMP.free) and ticks today's block.
  function freeView(skill) {
    const co = skill === "co";
    const src = arr((T.COMP.free || {})[skill]);
    const tabs = `<nav class="tabs" role="tablist"><a href="#comp.free.co" role="tab" aria-selected="${co}">${ico("listen")}Écoute libre<small>easy listening</small></a><a href="#comp.free.ce" role="tab" aria-selected="${!co}">${ico("read")}Lecture libre<small>easy reading</small></a></nav>`;
    const tips = [
      co ? "Pick something you can follow without pausing: you know nearly every word. If you're lost every few sentences, go easier, not harder." : "Pick something you can read without stopping: you know nearly every word. If every line has a new one, go easier, not harder.",
      co ? "Don't rewind for every word. Follow the story, and let the rest wash over you." : "Don't look words up as you go. Read on, and guess from the context.",
      "Choose what you'd enjoy in English too. Twenty minutes you look forward to beat an hour you put off.",
      co ? "A few times a week, pick a Canadian source: the TCF Canada uses some Canadian accents." : "A word that keeps coming back is worth a card: add it in Vocabulaire, two or three a session at most.",
    ];
    return `<div class="wrap">
      <header class="stack tight"><h1 class="title">${co ? "Écoute libre" : "Lecture libre"}<small>Easy French every day, outside your study time</small></h1>${fold("intro-free", "Pourquoi · Why", `<p class="small muted">On your commute, while you cook, before bed. It's the input half of the plan, and it's how vocabulary and speed grow.</p>`)}</header>
      ${tabs}
      <div class="grid2">
        <section class="panel stack" style="align-content:start"><p class="h3">How to do it</p><ul class="small" style="margin:0;padding-left:20px">${tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>
        <section class="panel stack" style="align-content:start"><p class="h3">Where to find it</p><ul class="links">${src.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a><span class="small muted">${esc(r.what)}</span></li>`).join("")}</ul></section>
      </div>
      <div class="row"><button class="btn primary" data-act="free-done" data-skill="${skill}">Done for today</button><span class="small muted">Ticks today's easy listening or reading block.</span></div>
    </div>`;
  }
  VIEWS.comp = {
    render(args) {
      if (args[0] === "free") return freeView(args[1] === "ce" ? "ce" : "co");
      if (args[0] === "co" || args[0] === "ce") ui.c.skill = args[0];
      const skill = ui.c.skill;
      const head = `<header class="stack tight"><h1 class="title">Compréhension</h1>${fold("intro-comp", "Comment ça marche · How it works", `<p class="small muted">TCF Canada-style sets: four options, one right answer. Every topic has a built-in B1 and B2 set for both reading and listening, so switching topics is instant. A reading set is four short documents with one question each, pitched like the real test's B1 or B2 items. The listening sets are recorded with natural voices, 2 to 4 minutes each, and on the real test each recording plays once. Every set you finish or start is kept in your history at the bottom of the page. Select any word or phrase to save it to your cards.</p>`)}</header>`;
      const tabs = `<nav class="tabs" role="tablist"><a href="#comp.co" role="tab" aria-selected="${skill === "co"}">${ico("listen")}CO · Écoute<small>listening</small></a><a href="#comp.ce" role="tab" aria-selected="${skill === "ce"}">${ico("read")}CE · Lecture<small>reading</small></a></nav>`;
      if (args[1] === "exam") { const running = !!ui.cx && skillOf(ui.cx) === skill && !ui.cx.done; return `<div class="wrap${running ? " focus" : ""}">${running ? "" : head + tabs}<div class="stack">${examView(skill)}</div></div>`; }
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
      const stats = compStats(skill);
      const doneN = samplesFor(skill).filter((s) => stats.has(s.id)).length;
      const newBtn = claudeBtn("c-gen-" + skill, "c-new", th ? `New ${esc(themeLabel(th))} set from Claude` : "New set from Claude", `data-skill="${skill}"`, "btn ghost");
      // Offer "another built-in set" only when there is one to switch to at this level (and topic).
      const matching = samplesFor(skill).filter((x) => x.level === lvl && (!th || arr(x.themes).includes(th))).length;
      const nextBtn = !th || matching > 1 ? `<button class="btn" data-act="c-next" data-skill="${skill}" ${loading ? "disabled" : ""}>Another built-in set</button>` : "";
      const controls = `<div class="row">
        <div class="seg" role="group" aria-label="Level">${["B1", "B2"].map((l) => `<button data-act="c-level" data-l="${l}" aria-pressed="${lvl === l}">${l}</button>`).join("")}</div>
        <select id="c-theme" data-change="c-theme" aria-label="Topic"><option value="">Any topic</option>${COMP_TOPICS.map((t2) => `<option value="${t2.id}" ${th === t2.id ? "selected" : ""}>${esc(t2.label)}</option>`).join("")}</select>
        ${nextBtn}${newBtn}
        <button class="btn ghost" data-act="c-hist-jump">History · ${doneN} of ${samplesFor(skill).length} done ↓</button>
      </div>`;
      const tagLine = (kind) => `${kind} · ${esc((set && set.level) || lvl)}${set && set.theme ? " · " + esc(themeLabel(set.theme)) : ""}${set && set.src === "sample" ? " · built-in set" : " · from Claude"}`;
      let material;
      if (loading) {
        material = `<article class="sheet"><p class="eyebrow">${skill === "co" ? "Enregistrement" : "Document"} · ${esc(lvl)}${th ? " · " + esc(themeLabel(th)) : ""}</p><h3 class="thinking">Claude is writing a new ${skill === "co" ? "listening" : "reading"} set${th ? " on " + esc(themeLabel(th)) : ""}</h3><p class="small muted">This usually takes 10–40 seconds. It stays here if you switch back to this theme later.</p></article>`;
      } else if (skill === "ce") {
        material = set.text
          ? `<article class="sheet"><p class="eyebrow">${tagLine(esc(set.type || "Document"))}</p><h3>${typo(set.title)}</h3><p class="fr">${typo(set.text)}</p></article>`
          : `<div class="stack tight"><p class="eyebrow">${tagLine(esc(set.type || "Documents"))}</p><p class="h3">${typo(set.title)}</p><p class="small muted">As on the test, each document has one question. Read it, then answer.</p></div>`;
      } else {
        const va = bestVoice();
        const recorded = !!set.audio;
        const canPlay = recorded || !!synth;
        const weak = !recorded && (!va || voiceScore(va) < 30);
        const multi = new Set(set.lines.map((l) => l.speaker)).size > 1;
        const listen = canPlay && !submitted ? greet("ecoute", "Écoute bien : les réponses viennent dans l'ordre des questions.", "Listen closely: the answers come in the same order as the questions.", "sm") : "";
        // The controls get their own strip, which stays on screen while you scroll down to the questions.
        // One button shows and hides the transcript, in the same place. Without a voice the transcript is the set, so it stays.
        material = `<article class="sheet"><p class="eyebrow">${tagLine("Enregistrement")}</p><h3>${typo(set.title)}</h3>${set.context ? `<p class="fr" style="font-style:italic">${typo(set.context)}</p>` : ""}${listen}
          ${canPlay ? `<p class="small muted">${recorded ? "Recorded for this set with natural neural voices." : va ? `Voice: ${esc(va.name)} (${voiceTag(va)}), your browser's best French voice.` : "Voice: the browser's default."}</p>
            ${weak ? `<p class="notice small">This browser only offers basic French voices, so the audio can sound robotic. For more natural voices, open this page in Microsoft Edge (its French “Natural” voices) or Chrome (“Google français”). On a Mac you can also add an Enhanced or Premium French voice: System Settings → Accessibility → Spoken Content → System voice → Manage voices. For real recordings, use the official practice below.</p>` : ""}`
          : `<p class="notice warn small">This browser can't read text aloud. Use the transcript as a reading exercise, and the official recordings below.</p>`}
        </article>
        ${canPlay ? `<div class="player-dock">${playerHTML()}</div>` : ""}
        ${canPlay ? `<div><button class="btn ghost sm" id="c-script" data-act="c-script" aria-expanded="${!!ui.c.script}">${ui.c.script ? "Hide" : "Show"} the transcript</button></div>` : ""}
        ${ui.c.script || !canPlay ? `<article class="sheet"><p class="eyebrow">Transcription</p><div class="transcript">${set.lines.map((l) => `<p>${multi ? `<b class="who">${esc(l.speaker)}</b>` : ""}${typo(l.text)}</p>`).join("")}</div></article>` : ""}`;
      }
      const fallback = set && set.fallback ? `<p class="notice small">There's no built-in ${esc(lvl)} set on ${esc(themeLabel(th))} yet${claudeOn() ? ", and Claude couldn't write one just now" : ""}, so here's another set.</p>` : "";
      const rv = ui.c.review[skill];
      const reviewNote = rv && set ? `<p class="notice small">You're looking at your attempt from ${shortDate(rv.date)} (${rv.score}/${rv.total}). “Try this set again” starts a new one.</p>` : "";
      // The clock's lengths are the pace steps for the set's level, with yours (the coach's) picked unless you choose another.
      const sl = (set && set.level) || lvl, per = CE_PACE[sl] || 90, nq = set ? set.questions.length : CE_SET_SIZE;
      const steps = PACE_STEPS.slice().reverse().map(([m, name]) => [Math.round(m * per * nq), `${fmtClock(Math.round(m * per * nq))} · ${name}`]);
      const mineP = cePace(sl), myClock = Math.round(PACE_STEPS[mineP.k][0] * per * nq);
      const timerRow = skill === "ce" && set ? `<div class="row between"><span class="small muted">Your clock: ${fmtClock(myClock)}, ${mineP.label}. Exam pace for ${nq} ${esc(sl)} questions is ${fmtClock(per * nq)}.</span>${timerUI("comp.ce", "Lecture CE", steps.concat([[1200, "20:00"]]), myClock)}</div>` : "";
      const docOf = (q, i) => (q.doc ? `<article class="sheet"><p class="eyebrow">Document ${i + 1}${q.doc.type ? ` · ${esc(q.doc.type)}` : ""}</p>${q.doc.title ? `<h3>${typo(q.doc.title)}</h3>` : ""}<p class="fr">${typo(q.doc.text)}</p></article>` : "");
      // A checked set starts with its right answers hidden (ansHidden): the score, every question with your pick, and
      // the ones you missed marked in red pen. The right answers, the explanations and the gap tags come with Show.
      const hid = !!set && submitted && ansHidden(set.id);
      const nq2 = set ? set.questions.length : 0;
      const scoreBig = set && submitted ? `<span class="scorebig"${score === nq2 ? ` data-m="burst" data-k="cperf-${esc(set.id)}-${esc(ui.c.saved[skill] || "")}"` : ""}><span data-tween="cs-${esc(set.id)}" data-tw="count" data-to="${score}">${score}</span>/${nq2}</span>` : "";
      const trend = set && skill === "ce" ? `<span class="small muted">${ceTrend(set.level || lvl)}</span>` : "";
      const qs = !set ? "" : `<ol class="qs ${set.questions.some((q) => q.doc) ? "ce-items" : ""}">${set.questions.map((q, i) => {
        const miss = submitted && ans[i] !== q.answer;
        return `<li${miss ? ` class="q-miss"` : ""}${submitted ? ` data-m="rise" data-k="cr-${esc(set.id)}-${i}"` : ""}>${docOf(q, i)}<p class="fr q">${typo(q.q)}${miss ? ` <span class="q-mark"><span aria-hidden="true">✗</span> raté</span>` : ""}</p><div class="opts">${q.order.map((k) => {
          const st = submitted && !hid ? (k === q.answer ? "ok" : ans[i] === k ? "bad" : "") : "";
          return `<label class="opt ${st}"><input type="radio" name="q${i}" data-change="c-ans" data-i="${i}" data-k="${k}" ${ans[i] === k ? "checked" : ""} ${submitted ? "disabled" : ""}><span>${typo(q.options[k])}</span></label>`;
        }).join("")}</div>
        ${submitted && !hid && q.why ? `<p class="small">${typo(q.why)}</p>` : ""}
        ${miss && !hid ? `<div class="row"><span class="small muted">This miss was a…</span><div class="seg">${[["vocab", "Vocabulary gap"], ["comp", "Comprehension gap"]].map(([k, l]) => `<button data-act="c-gap" data-i="${i}" data-k="${k}" aria-pressed="${gaps[i] === k}">${l}</button>`).join("")}</div></div>` : ""}
        </li>`;
      }).join("")}</ol>
        <div class="row">${submitted ? `${scoreBig}<button class="btn" data-act="c-reset" data-skill="${skill}">Try this set again</button>${hid ? `<button class="btn primary" data-act="c-show" data-skill="${skill}">Show the answers</button>` : `<button class="btn ghost" data-act="c-hide" data-skill="${skill}">Hide the answers</button>`}${trend}` : `<button class="btn primary" data-act="c-submit" data-skill="${skill}">Check my answers</button>`}</div>
        ${hid ? `<p class="small muted">The right answers stay hidden until you show them, so you can think again about the ones you missed.</p>` : ""}
        ${submitted ? greet(...remyScore(skill, score, nq2, { key: `${set.id}-${ui.c.saved[skill] || ""}`, inClock: savedDoc && savedDoc.timed && savedDoc.clock ? savedDoc.secs <= savedDoc.clock : null }), "sm") : ""}`;
      const res = T.COMP.resources.filter((r) => arr(r.skills).includes(skill));
      return `<div class="wrap">
        ${head}
        ${set && !submitted && Object.keys(ans || {}).length ? `<div class="row between tab-row">${tabs}${examLink(skill)}</div>` : tabs + examCta(skill)}
        ${controls}
        <div class="stack">${reviewNote}${fallback}${timerRow}${material}${qs}</div>
        ${fold("c-more-" + skill, "Pratique officielle · Official practice and scores from elsewhere", `<div class="grid2">
          <section class="panel stack"><p class="h3">${skill === "co" ? "Real recordings: official practice" : "Official practice"}</p>
            <p class="small muted">${skill === "co" ? "Real voices at exam speed. Past papers aren't published, so the closest thing is practice written by the test's own designers at France Éducation International and its partners." : "Practice questions written by the test's designers and France Éducation International."} Log your scores here to keep them with the rest.</p>
            <ul class="links">${res.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a><span class="small muted">${esc(r.what)}</span></li>`).join("")}</ul></section>
          <section class="panel stack"><p class="h3">Log a score from elsewhere</p>
            <div class="grid2"><label class="field">Score<input type="number" id="cl-score" data-input="form" data-k="cl-score" value="${formVal("cl-score")}" min="0"></label><label class="field">Out of<input type="number" id="cl-total" data-input="form" data-k="cl-total" value="${formVal("cl-total")}" min="1"></label></div>
            <label class="field">Source<input type="text" id="cl-src" data-input="form" data-k="cl-src" value="${formVal("cl-src")}" placeholder="TV5MONDE TCF training, set 3"></label>
            <div class="row"><button class="btn" data-act="c-log" data-skill="${skill}">Log ${skill.toUpperCase()} score at ${esc(lvl)}</button></div>
          </section>
        </div>`)}
        ${historyTree(skill)}
      </div>`;
    },
  };

  /* =============== view: progress =============== */
  /* =============== history =============== */
  // Only two kinds of entry: unfinished attempts (the inprogress records) and finished ones (drill rounds,
  // production checks, reading and listening sets, practice exams, writing tasks).
  const SECTION = { drill: "Grammaire", prod: "Grammaire", comp: "Compréhension", exam: "Compréhension", writing: "Écrit", eemock: "Écrit" };
  const H_FILTERS = [["all", "Everything"], ["grammar", "Grammaire"], ["comp", "Compréhension"], ["writing", "Écrit"]];
  const sectionOf = (kind) => (kind === "drill" || kind === "prod" ? "grammar" : kind === "exam" ? "comp" : kind === "eemock" ? "writing" : kind);
  const clip = (s, n) => { const t = str(s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  function whenOf(ts) {
    if (!ts) return "";
    const d = new Date(ts), day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return day === todayStr() ? `Today ${pad(d.getHours())}:${pad(d.getMinutes())}` : `${shortDate(day)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const unfinished = () => list("inprogress").filter((x) => x && SECTION[x.kind]).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  function ipProgress(ip) {
    if (ip.kind === "drill") return `${arr(ip.results).filter(Boolean).length} of ${arr(ip.items).length} answered`;
    if (ip.kind === "comp") return `${Object.keys(ip.answers || {}).length} of ${ip.total || "?"} answered${ip.plays ? ` · played ${ip.plays}×` : ""}`;
    if (ip.kind === "exam") return `${Object.keys(ip.ans || {}).length} of ${ip.total} answered${ip.left != null ? ` · ${Math.ceil(ip.left / 60)} min left` : ""}`;
    if (ip.kind === "writing" || ip.kind === "prod") return `${countWords(str(ip.text))} words`;
    if (ip.kind === "eemock") return `${EE_TASKS.reduce((n, t) => n + countWords(str((ip.texts || {})[t])), 0)} words in 3 tasks${ip.left != null ? ` · ${Math.ceil(ip.left / 60)} min left` : ""}`;
    return "";
  }
  function ipResume(id) {
    const ip = ipGet(id);
    if (!ip) return;
    if (ip.kind === "drill") { drillResume(ip); goTo("#" + ip.route); return; }
    if (ip.kind === "prod") { ui.prod[ip.topic] = { text: str(ip.text) }; goTo("#" + ip.route); return; }
    if (ip.kind === "comp") { if (compLoad(ip.skill, ip.setId, ip)) { goTo("#comp." + ip.skill); window.scrollTo(0, 0); } return; }
    if (ip.kind === "exam") { examResume(ip); return; }
    if (ip.kind === "eemock") { eeResume(ip); return; }
    if (ip.kind === "writing") { writingRestore(ip.task); ui.w.task = ip.task; goTo("#writing." + ip.task); }
  }
  function ipDiscard(id) {
    const ip = ipGet(id);
    ui.confirm = "";
    ipDrop(id);
    if (ip) {
      if (ip.kind === "drill" && ui.drill && !ui.drill.done && drillIpId(ui.drill) === id) ui.drill = null;
      if (ip.kind === "prod") ui.prod[ip.topic] = { text: "" };
      if (ip.kind === "comp") { const set = ui.c.set[ip.skill]; if (set && set.id === ip.setId && !ui.c.submitted[ip.skill]) compReset(ip.skill); }
      if (ip.kind === "exam" && examRunning() && skillOf(ui.cx) === skillOf(ip)) { if (skillOf(ip) === "co") coxStop(); ui.cx = null; timerSet(0, "", ""); }
      if (ip.kind === "writing") { ui.w.text[ip.task] = ""; ui.w.checks[ip.task] = {}; }
      if (ip.kind === "eemock" && eeRunning()) { ui.ee = null; if (timer.home === EE_HOME) timerSet(0, "", ""); }
    }
    toast("Discarded.");
    render(true);
  }
  // Once saved progress has loaded, writing drafts fill their pages back in, and
  // drafts from the old browser-only store move into the saved ones.
  function hydrate() {
    hydrated = true;
    // An unfinished built-in set or exam whose content has since been replaced can't be picked up again.
    for (const ip of list("inprogress")) {
      if (ip.kind === "comp" && ip.src !== "claude" && !samplesFor(ip.skill).some((s) => s.id === ip.setId)) ipDrop(ip.id);
      if (ip.kind === "exam" && !ip.snap && !XSPEC[skillOf(ip)].bank().some((e) => e.id === ip.examId)) ipDrop(ip.id);
      // The Oral page was removed (2026-10-06): an unfinished speaking attempt has nowhere to go back to.
      if (ip.kind === "speaking") ipDrop(ip.id);
    }
    // After a refresh, this tab's copy of what was on screen is kept, unless the attempt's record has changed
    // since (on another device, say). A record that didn't get saved before the refresh is saved again.
    const newer = (id) => { const ip = ipGet(id); return !!ip && (ip.updated || 0) > tabAt; };
    ["t1", "t2", "t3"].forEach((t) => {
      const legacy = lsGet("tcf-draft-" + t, "");
      if (!tabAt || newer("writing--" + t)) { if (!writingRestore(t) && legacy.trim()) { ui.w.text[t] = legacy; writingKeep(t, 0); } }
      if (legacy) lsSet("tcf-draft-" + t, "");
    });
    if (!tabAt) return;
    try {
      const d = ui.drill;
      if (d && !d.done && d.src !== "retry") { if (newer(drillIpId(d))) drillResume(ipGet(drillIpId(d))); else drillKeep(); }
      ["ce", "co"].forEach((sk) => {
        const set = ui.c.set[sk];
        if (!set || !set.id || ui.c.submitted[sk]) return;
        if (newer(compIpId(sk, set.id))) compRestore(sk); else compKeep(sk);
      });
      if (eeRunning()) { if (newer(EE_IP)) { ui.ee = null; if (timer.home === EE_HOME) timerSet(0, "", ""); } else eeKeep(); }
      if (ui.cx && !ui.cx.done) {
        // An exam carried on elsewhere is picked up from there, with its own clock.
        const X = XSPEC[skillOf(ui.cx)];
        if (newer(X.ip)) { if (skillOf(ui.cx) === "co") coxStop(); ui.cx = null; if (timer.home === X.home) timerSet(0, "", ""); } else examKeep();
      }
    } catch (e) { console.warn(e); }
  }
  function finishedAttempts() {
    const out = [];
    for (const d of list("drills")) {
      if (d.src === "retry") continue;
      const tp = TOPIC[d.topic];
      if (d.set === "prod") { out.push({ kind: "prod", id: d.id, ts: d.ts || 0, date: d.date, title: tp && tp.prod ? `${tp.title} · ${tp.prod.title}` : "Production", result: d.score >= 1 ? "Passed" : "Not yet", doc: d }); continue; }
      const st = tp && tp.sets.find((x) => x.id === d.set);
      const name = d.topic === "hunt" ? `${DRILL_NAMES.hunt} · ${d.name}` : DRILL_NAMES[d.topic] ? d.name || DRILL_NAMES[d.topic] : `${tp ? tp.title : d.topic} · ${d.name || (st ? st.title : d.set)}`;
      out.push({ kind: "drill", id: d.id, ts: d.ts || 0, date: d.date, title: name, result: `${d.score}/${d.total}${retriesOf(d).length ? ` · retry ${retryScores(d)}` : ""}`, doc: d });
    }
    for (const c of list("comp")) {
      const exam = c.kind === "exam";
      out.push({ kind: exam ? "exam" : "comp", id: c.id, ts: c.ts || 0, date: c.date, title: `${c.skill === "co" ? "CO" : "CE"} · ${exam ? c.title : `${c.title || ""}${c.level ? " · " + c.level : ""}`}`, result: exam ? `≈${c.est} · ${c.score}/${c.total}` : `${c.score}/${c.total}${c.src === "logged" ? " · logged" : ""}`, doc: c });
    }
    for (const w of list("writing")) { const W = T.WRITING[w.task]; out.push({ kind: "writing", id: w.id, ts: w.ts || 0, date: w.date, title: `${W ? W.name : "Écrit"} · ${clip(w.prompt, 80)}`, result: w.fb && w.fb.score20 != null ? `${w.fb.score20}/20 · ${w.fb.level}` : "not corrected", doc: w }); }
    return out.sort((a, b) => b.ts - a.ts);
  }
  function drillReview(d) {
    const items = arr(d.items);
    const qs = items.length ? items : arr(d.misses).map((m) => ({ q: m.q, src: m.src, a: [m.a], given: m.given, ok: false }));
    const li = (it) => `<li>
        ${it.found === false ? `<p><span class="pill bad">Not spotted in the text</span></p>` : ""}
        ${it.ask ? `<p class="small muted">${esc(it.ask)}</p>` : ""}
        ${it.src ? `<p class="small muted fr">${typo(it.src)}</p>` : ""}
        <p class="fr">${typo(it.q).replace("___", "<b>___</b>")}</p>
        <p>${it.ok ? `<span class="pen-ok">${esc(it.given)}</span>${it.overturned ? ` <span class="small muted">· accepted by Claude</span>` : ""}` : `<span class="pen-wrong">${esc(it.given || "—")}</span> <span class="pen-right">${esc(arr(it.a)[0] || "")}</span>`}</p>
        ${it.why ? `<p class="small muted">${typo(it.why)}</p>` : ""}
      </li>`;
    // A text (Find the mistakes, Your mistakes) can be seen again whole, as you left it.
    const whole = (d.topic === "hunt" && huntRebuild(d)) || (d.topic === "mine" && mineRebuild(d)) ? `<div class="row"><button class="btn sm" data-act="h-text" data-id="${esc(d.id)}">${ico("read")}See the whole text</button><span class="small muted">with your marks and corrections, as you left it</span></div>` : "";
    return `<div class="stack tight">
      ${whole}
      ${items.length ? "" : `<p class="small muted">This round is from before whole rounds were saved, so only the questions you missed are here.</p>`}
      <ul class="misses">${qs.map(li).join("")}</ul>
      ${retriesOf(d).map((r, i, all) => `<p class="small">${all.length > 1 ? `Retry ${i + 1}` : "Retried the misses"}: ${r.score}/${r.total}.</p>${arr(r.items).length ? `<ul class="misses">${arr(r.items).map(li).join("")}</ul>` : ""}`).join("")}
    </div>`;
  }
  function prodReview(d) {
    const fb = d.fb;
    if (!d.text && !fb) return `<p class="small muted">This check is from before answers were saved with it, so only the result is here.</p>`;
    return `<div class="stack tight">
      ${d.text ? `<p class="fr" style="white-space:pre-line">${typo(d.text)}</p>` : ""}
      ${fb ? `<div class="verdict ${fb.pass ? "ok" : "bad"}"><p><b>${fb.pass ? "Criterion met." : "Not yet."}</b> ${esc(fb.comment)}</p></div>${errList(fb.errors)}${fb.improved ? `<div class="stack tight"><p class="eyebrow">Improved version</p><p class="fr" style="white-space:pre-line">${typo(fb.improved)}</p></div>` : ""}` : ""}
    </div>`;
  }
  function reviewOf(x) {
    if (x.kind === "drill") return drillReview(x.doc);
    if (x.kind === "prod") return prodReview(x.doc);
    if (x.kind === "writing") return writingFb(x.id, x.doc, "h-close");
    return "";
  }
  function historyOpenBtn(x) {
    if (x.kind === "comp") {
      const c = x.doc;
      if (c.src === "logged" || !(samplesFor(c.skill).some((s) => s.id === c.setId) || c.snap)) return "";
      return `<button class="btn ghost sm" data-act="h-comp" data-skill="${esc(c.skill)}" data-id="${esc(x.id)}">Open</button>`;
    }
    if (x.kind === "exam") return XSPEC[skillOf(x.doc)].bank().some((e) => e.id === x.doc.setId) || x.doc.snap ? `<button class="btn ghost sm" data-act="x-review" data-id="${esc(x.id)}">Open</button>` : "";
    return `<button class="btn ghost sm" data-act="h-open" data-id="${esc(x.id)}">${ui.hist.open === x.id ? "Close" : "Open"}</button>`;
  }
  function historyView(head, tabs) {
    const f = ui.hist.filter;
    const pick = (x) => f === "all" || sectionOf(x.kind) === f;
    const ips = unfinished().filter(pick);
    const all = finishedAttempts().filter(pick);
    const shown = all.slice(0, ui.hist.limit);
    const chips = `<div class="seg" role="group" aria-label="Section">${H_FILTERS.map(([k, l]) => `<button data-act="h-filter" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>`;
    const ipRows = ips.map((ip) => `<tr><td class="small">${esc(SECTION[ip.kind])}</td><td>${typo(ip.title)}<br><span class="small muted">${esc(ipProgress(ip))}</span></td><td class="n small">${esc(whenOf(ip.updated))}</td><td><span class="row" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn sm primary" data-act="ip-resume" data-id="${esc(ip.id)}">Resume</button>${discardBtn(ip.id)}</span></td></tr>`).join("");
    const rows = shown.map((x) => `<tr id="h-${esc(x.id)}"><td class="n">${shortDate(x.date)}</td><td class="small">${esc(SECTION[x.kind])}</td><td>${typo(x.title)}</td><td class="n small">${esc(x.result)}</td><td>${historyOpenBtn(x)}</td></tr>${ui.hist.open === x.id ? `<tr><td colspan="5">${reviewOf(x)}</td></tr>` : ""}`).join("");
    return `<div class="wrap">
      ${head}
      ${tabs}
      <div class="row">${chips}</div>
      <section class="sec"><div class="sec-head"><h2 class="h2">Unfinished</h2><span class="small muted">Saved as you go, from your first answer or keystroke.</span></div>
        ${ips.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Section</th><th>Attempt</th><th>Last change</th><th></th></tr></thead><tbody>${ipRows}</tbody></table></div>` : `<p class="small muted">Nothing unfinished.</p>`}
      </section>
      <section class="sec"><div class="sec-head"><h2 class="h2">Finished</h2><span class="small muted">${all.length} attempt${all.length === 1 ? "" : "s"}, newest first. Open one to see the questions, your answers and the results.</span></div>
        ${all.length ? `<div class="table-wrap"><table class="deck"><thead><tr><th>Date</th><th>Section</th><th>Attempt</th><th>Result</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${all.length > shown.length ? `<div class="row"><button class="btn" data-act="h-more">Show ${Math.min(30, all.length - shown.length)} more</button></div>` : ""}` : `<p class="small muted">Finished drill rounds, reading and listening sets, practice exams and writing tasks collect here.</p>`}
      </section>
    </div>`;
  }
  // Today's "Continue where you left off": the most recent unfinished attempts.
  function continueCard() {
    const ips = unfinished();
    if (!ips.length) return "";
    return `<section class="panel stack tight" data-spot><h2 class="h3">Continue where you left off</h2><ul class="hw">${ips.slice(0, 4).map((ip) => `<li style="grid-template-columns:minmax(0,1fr) auto"><span>${typo(ip.title)}<small>${esc(SECTION[ip.kind])} · ${esc(ipProgress(ip))}</small></span><button class="btn sm primary" data-act="ip-resume" data-id="${esc(ip.id)}">Resume</button></li>`).join("")}</ul>${ips.length > 4 ? `<a class="small" href="#progress.history">All ${ips.length} unfinished →</a>` : ""}</section>`;
  }

  /* =============== progress report (Progrès → Évolution) =============== */
  // Built from the finished attempts; it keeps nothing of its own. Each group (a writing task, a listening
  // or reading level, a drill set) lists every attempt newest first, like every history on the site, and
  // compares the first scored attempt with the latest. Groups come in the order of their latest attempt.
  // Each group's open state lives in ui.c.open, like the other trees.
  const REP_CHAIN = 10;
  function repBadge(change) {
    if (!change) return "";
    const [d, unit] = change;
    return `<span class="pill ${d > 0 ? "ok" : d < 0 ? "bad" : ""}">${d > 0 ? "▲ +" : d < 0 ? "▼ −" : "= "}${Math.abs(d)}${unit}</span>`;
  }
  const repOpenBtn = (id) => `<button class="btn ghost sm" data-act="rep-open" data-id="${esc(id)}">${ui.rep.open === id ? "Close" : "Open"}</button>`;
  // Change in a score out of a total: in answers when both totals match, otherwise in percentage points.
  const repFracChange = (f, l) => (f.total === l.total ? [l.score - f.score, ""] : [Math.round((l.score / l.total - f.score / f.total) * 100), " pts"]);
  // rows: [{id, date, v (the score, or null if not scored), show, pill, meta, tags, btn, sub, review}], oldest first.
  // They're listed newest first; the chain of scores in the summary still reads oldest → latest.
  function repGroup(id, head, rows, change, suffix, extra) {
    const scored = rows.filter((r) => r.v != null);
    const chain = scored.slice(-REP_CHAIN).map((r) => r.show).join(" → ");
    const last = rows[rows.length - 1];
    const spark = scored.length > 1 ? CH.spark(scored.slice(-REP_CHAIN).map((r) => r.v), { w: 64, h: 22, min: 0, color: "var(--accent)" }) : "";
    const summary = `${head}${spark}${chain ? `<span class="num">${scored.length > REP_CHAIN ? "… → " : ""}${chain}${suffix || ""}</span>` : ""}${scored.length > 1 ? repBadge(change(scored[0], scored[scored.length - 1])) : ""}<span class="h-meta">${rows.length} attempt${rows.length > 1 ? "s" : ""} · last ${shortDate(last.date)}</span>`;
    const body = rows.slice().reverse().map((r) => `<div class="h-att"><span class="num">${shortDate(r.date)}</span>${r.pill}${r.meta || ""}${r.tags || ""}<span style="margin-left:auto">${r.btn || ""}</span>${r.sub ? `<span class="small muted fr" style="flex-basis:100%">${r.sub}</span>` : ""}</div>${r.review && ui.rep.open === r.id ? `<div>${r.review()}</div>` : ""}`).join("") + (extra || "");
    return { html: branch(id, summary, body), trend: scored.length > 1 ? change(scored[0], scored[scored.length - 1])[0] : null, ts: last.ts || 0 };
  }
  // Mistakes per 100 words in each category, first corrected attempt → latest, so a longer text doesn't look worse.
  function repMistakes(a, b) {
    const count = (w) => { const m = {}; for (const e of w.fb.errors) { const c = catOf(e.category); m[c] = (m[c] || 0) + 1; } return m; };
    const ca = count(a), cb = count(b);
    const per = (n, w) => Math.round((n / w.words) * 1000) / 10;
    const cats = [...new Set(Object.keys(ca).concat(Object.keys(cb)))].sort((x, y) => (ca[y] || 0) - (ca[x] || 0) || (cb[y] || 0) - (cb[x] || 0));
    const title = `<p class="h3">Mistakes per 100 words <span class="small muted">· first corrected attempt (${shortDate(a.date)}) → latest (${shortDate(b.date)})</span></p>`;
    if (!cats.length) return `<div class="stack tight">${title}<p class="small muted">No mistakes in either attempt.</p></div>`;
    const rows = cats.map((c) => {
      const x = per(ca[c] || 0, a), y = per(cb[c] || 0, b);
      const [cls, label] = !x ? ["bad", "new"] : !y ? ["ok", "fixed ✓"] : y < x ? ["ok", "fewer"] : y > x ? ["bad", "more"] : ["warn", "repeating"];
      return `<tr><th>${esc(CAT[c])}</th><td class="num" style="white-space:nowrap" title="${ca[c] || 0} → ${cb[c] || 0} mistakes">${x} → ${y}</td><td><span class="pill ${cls}">${label}</span></td></tr>`;
    }).join("");
    return `<div class="stack tight">${title}<div class="table-wrap"><table class="crit"><tbody>${rows}</tbody></table></div></div>`;
  }
  // Écrit: one group per task, across prompts. A prompt you've answered before is tagged, with which try it is.
  function repWriting() {
    const all = list("writing").sort((a, b) => (a.ts || 0) - (b.ts || 0));
    return ["t1", "t2", "t3"].map((task) => {
      const ws = all.filter((w) => w.task === task);
      if (!ws.length) return null;
      const W = T.WRITING[task];
      const tries = new Map();
      const rows = ws.map((w) => {
        const key = str(w.prompt).replace(/\s+/g, " ").trim();
        const n = (tries.get(key) || 0) + 1;
        tries.set(key, n);
        const fb = w.fb, sc = fb && fb.score20 != null ? fb.score20 : null;
        const errs = fb && Array.isArray(fb.errors) ? fb.errors.length : null;
        return {
          id: w.id, date: w.date, ts: w.ts, v: sc, show: String(sc),
          pill: sc != null ? `<span class="pill ${sc >= 10 ? "ok" : ""}">${sc}/20 · ${esc(fb.level)}</span>` : `<span class="pill">${fb && fb.level ? esc(fb.level) : "not corrected"}</span>`,
          meta: `<span class="small muted">${w.words} words${errs != null ? ` · ${errs} mistake${errs === 1 ? "" : "s"}` : ""}</span>`,
          sub: typo(clip(w.prompt, 90)),
          tags: n > 1 ? `<span class="pill info">same prompt · try ${n}</span>` : "",
          btn: repOpenBtn(w.id),
          review: () => writingFb(w.id, w, "rep-close"),
        };
      });
      const corrected = ws.filter((w) => w.fb && Array.isArray(w.fb.errors) && w.words > 0);
      const extra = corrected.length > 1 ? repMistakes(corrected[0], corrected[corrected.length - 1])
        : `<p class="small muted">Correct ${corrected.length ? "another" : "a"} ${esc(W.name)} with Claude to compare your mistakes.</p>`;
      const head = `<span class="h-name">${esc(W.name)}</span><span class="small muted">${esc(W.kind)}</span>`;
      return repGroup("rep:ee:" + task, head, rows, (f, l) => [l.v - f.v, ""], " /20", `<div class="stack tight" style="padding-top:8px">${extra}</div>`);
    }).filter(Boolean).sort((a, b) => b.ts - a.ts);
  }
  // Compréhension: one group per skill and level, across sets, plus each skill's practice exams.
  function repComp() {
    const out = [];
    for (const skill of ["co", "ce"]) {
      const as = compAttempts(skill).slice().reverse();
      const sets = as.filter((a) => a.kind !== "exam");
      const levels = [...new Set(sets.map((a) => a.level || ""))].sort();
      for (const lvl of levels) {
        const tries = new Map();
        const rows = sets.filter((a) => (a.level || "") === lvl).map((a) => {
          const retry = a.setId && a.src !== "logged";
          const n = retry ? (tries.get(a.setId) || 0) + 1 : 1;
          if (retry) tries.set(a.setId, n);
          const canOpen = a.src !== "logged" && (samplesFor(skill).some((s) => s.id === a.setId) || a.snap);
          return {
            id: a.id, date: a.date, ts: a.ts, v: a.total ? a.score / a.total : null, show: `${a.score}/${a.total}`, score: a.score, total: a.total,
            pill: scorePill(a),
            meta: `<span class="small">${typo(a.title || "")}</span>${mins(a.secs) ? `<span class="small muted">${mins(a.secs)}</span>` : ""}${a.timed ? `<span class="pill info">timed</span>` : ""}${a.src === "logged" ? `<span class="pill">logged</span>` : ""}`,
            tags: n > 1 ? `<span class="pill info">same set · try ${n}</span>` : "",
            btn: canOpen ? `<button class="btn ghost sm" data-act="h-comp" data-skill="${skill}" data-id="${esc(a.id)}">Open</button>` : "",
          };
        });
        const head = `<span class="sk ${skill}">${skill.toUpperCase()}</span>${lvl ? `<span class="lv">${esc(lvl)}</span>` : ""}<span class="h-name">${skill === "co" ? "Listening sets" : "Reading sets"}</span>`;
        out.push(repGroup(`rep:${skill}:${lvl || "other"}`, head, rows, repFracChange));
      }
      const exams = as.filter((a) => a.kind === "exam"), retakes = retakeIds();
      if (exams.length) {
        const rows = exams.map((a) => ({
          // A retake stays out of the chain of scores and the change, which compare first tries.
          id: a.id, date: a.date, ts: a.ts, v: retakes.has(a.id) ? null : a.est, show: "≈" + a.est,
          pill: `<span class="pill">≈${a.est}</span>${nclcTag(a.est, skill)}`,
          meta: `<span class="small muted">${a.score}/${a.total} · ${typo(a.title || "")}</span>`,
          tags: retakes.has(a.id) ? `<span class="pill info">retake · not counted</span>` : "",
          btn: XSPEC[skill].bank().some((e) => e.id === a.setId) || a.snap ? `<button class="btn ghost sm" data-act="x-review" data-id="${esc(a.id)}">Open</button>` : "",
        }));
        out.push(repGroup(`rep:${skill}:exam`, `<span class="sk ${skill}">${skill.toUpperCase()}</span><span class="lv">A1–C2</span><span class="h-name">Examens blancs</span>`, rows, (f, l) => [l.v - f.v, ""]));
      }
    }
    return out.sort((a, b) => b.ts - a.ts);
  }
  // Grammaire: one group per drill set, most recent first. "Retry the misses" rounds are part of their round.
  function repDrills() {
    const groups = new Map();
    for (const d of list("drills").filter((x) => x.set !== "prod" && x.src !== "retry").sort((a, b) => (a.ts || 0) - (b.ts || 0))) {
      const k = d.topic === "mixed" ? "mixed" : `${d.topic}.${d.set}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(d);
    }
    return [...groups.entries()].map(([k, ds]) => {
      const tp = TOPIC[ds[0].topic], st = tp && tp.sets.find((x) => x.id === ds[0].set);
      const name = ds[0].topic === "mine" && ds[0].set === "style" ? "Your mistakes · Conseils de style" : DRILL_NAMES[ds[0].topic] || `${tp ? tp.title : ds[0].topic} · ${st ? st.title : ds[0].name || ds[0].set}`;
      const rows = ds.map((d) => ({
        id: d.id, date: d.date, ts: d.ts, v: d.total ? d.score / d.total : null, show: `${d.score}/${d.total}`, score: d.score, total: d.total,
        pill: scorePill(d),
        meta: `${d.src === "claude" ? `<span class="pill info">Claude's items</span>` : ""}${retriesOf(d).length ? `<span class="small muted">retried the misses: ${retryScores(d)}</span>` : ""}`,
        btn: repOpenBtn(d.id),
        review: () => drillReview(d),
      }));
      const head = `${st && st.level ? `<span class="lv">${esc(st.level)}</span>` : ""}<span class="h-name">${typo(name)}</span>`;
      return repGroup("rep:gr:" + k, head, rows, repFracChange);
    }).sort((a, b) => b.ts - a.ts);
  }
  function reportView(head, tabs) {
    const parts = [
      ["Écrit", "Claude's score out of 20 on each corrected task, across prompts. 10/20 is NCLC 7.", repWriting()],
      ["Compréhension", "Your score on each listening and reading set. Sets differ in difficulty, so read the trend over several sets.", repComp()],
      ["Grammaire", "Your score on each drill round. Every round draws different questions from its set.", repDrills()],
    ].filter(([, , gs]) => gs.length);
    const trends = parts.flatMap(([, , gs]) => gs.map((g) => g.trend)).filter((t) => t != null);
    const tally = [[trends.filter((t) => t > 0).length, "improving"], [trends.filter((t) => t === 0).length, "holding steady"], [trends.filter((t) => t < 0).length, "slipping"]];
    return `<div class="wrap">
      ${head}
      ${tabs}
      ${fold("intro-report", "Ce que montre Évolution · What this shows", `<p class="small muted">How your scores have moved in each writing task, listening and reading level, and drill set: every attempt, newest first, and the change from your first to your latest. Open any attempt to see it again.</p>`)}
      ${trends.length ? `<div class="stats">${tally.map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("")}</div><p class="small muted">Out of the ${trends.length} group${trends.length === 1 ? "" : "s"} you've done more than once, comparing your first and latest score.</p>` : ""}
      ${parts.length ? parts.map(([h, note, gs]) => `<section class="sec"><div class="sec-head"><h2 class="h2">${h}</h2><span class="small muted">${note}</span></div><div class="tree">${gs.map((g) => g.html).join("")}</div></section>`).join("")
        : `<div class="empty">${greet("bonjour", "Ta progression s'affichera ici.", "Finish a writing task, a listening or reading set, or a drill round, and your progress shows here.", "sm")}</div>`}
    </div>`;
  }

  /* =============== the dashboard (Progrès → Vue d'ensemble) =============== */
  // The overview as a logbook: the headline numbers, where each skill stands against NCLC 7, study time, grammar,
  // mistakes, cards, listening and reading, and writing. Like Évolution, it's worked out from progress already
  // saved and adds no data of its own. The charts come from charts.js (see "charts" above), each with its numbers
  // in a fold under it.
  const taskName = (w) => (T.WRITING[w.task] || {}).name || "Écrit";
  const numbers = (key, head, rows) => (rows.length ? fold("num-" + key, "Les chiffres · The numbers", CH.table(head, rows)) : "");
  // The day's first round of each drill set (as the criteria count it): the topics' sets and the mixed review.
  function firstRoundsSince(from) {
    const seen = new Set();
    return list("drills").filter((d) => d.total && d.set !== "prod" && d.src !== "retry" && d.topic !== "mine" && d.topic !== "hunt" && str(d.date) >= from)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0)).filter((d) => { const k = `${d.topic}|${d.set}|${d.date}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const accuracy = (rounds) => { const n = rounds.reduce((a, d) => a + d.total, 0); return n ? rounds.reduce((a, d) => a + d.score, 0) / n : null; };
  // Every day with anything done: a ticked block, a finished attempt, an error logged or a card reviewed.
  function activeDays() {
    const set = new Set();
    for (const [d, doc] of S.days) if (doc && doc.done && Object.keys(doc.done).length) set.add(d);
    ["drills", "comp", "writing", "errors"].forEach((c) => list(c).forEach((x) => x.date && set.add(x.date)));
    for (const st of S.srs.values()) { if (st && st.last) set.add(st.last); if (st && st.rec) set.add(st.rec); }
    return set;
  }
  // A score's place along the NCLC scale, from NCLC 4 (0) to 10+ (1), each band the same width.
  const NCLC_UP = T.NCLC.slice().sort((a, b) => a.n - b.n);
  function nclcPos(k, v) {
    const top = k === "co" || k === "ce" ? 700 : 21;
    for (let i = NCLC_UP.length - 1; i >= 0; i--) {
      const lo = NCLC_UP[i][k], hi = i + 1 < NCLC_UP.length ? NCLC_UP[i + 1][k] : top;
      if (v >= lo) return (i + Math.min(0.96, (v - lo) / (hi - lo))) / NCLC_UP.length;
    }
    return 0.01;
  }
  const scoreText = (k, v) => (k === "co" || k === "ce" ? String(Math.round(v)) : `${CH.fr(v, 1)}/20`);

  function dashData() {
    const t = todayStr(), mon = mondayOf(t), s = settings();
    const start = /^\d{4}-\d{2}-\d{2}$/.test(str(s.startDate)) && s.startDate <= t ? s.startDate : addDays(t, -27);
    const D = { t, mon, start };
    // The days charted: since you started, at least two weeks and at most four.
    let from = start < addDays(t, -27) ? addDays(t, -27) : start;
    if (from > addDays(t, -13)) from = addDays(t, -13);
    D.days = [];
    for (let d = from; d <= t; d = addDays(d, 1)) D.days.push(d);
    D.span = from === start ? "Since you started" : from > start ? "Last 4 weeks" : "Last 2 weeks";
    D.mins = D.days.map(dayMinutes);
    D.bySkill = {};
    D.mins.forEach((by) => Object.entries(by).forEach(([k, m]) => { D.bySkill[k] = (D.bySkill[k] || 0) + m; }));
    D.total = minTotal(D.bySkill);
    // This week against last week up to the same day, and each week since you started (eight at most).
    const span = (a, b) => { let m = 0; for (let d = a; d <= b; d = addDays(d, 1)) m += minTotal(dayMinutes(d)); return m; };
    D.week = span(mon, t);
    D.lastWeek = start <= addDays(t, -7) ? span(addDays(mon, -7), addDays(t, -7)) : null;
    D.planned = [0, 1, 2, 3, 4, 5].reduce((a, k) => a + planMins(addDays(mon, k), s.phase), 0);
    let w0 = mondayOf(start);
    if (w0 < addDays(mon, -49)) w0 = addDays(mon, -49);
    D.weekStarts = [];
    for (let w = w0; w <= mon; w = addDays(w, 7)) D.weekStarts.push(w);
    const weekEnd = (w) => (addDays(w, 6) < t ? addDays(w, 6) : t);
    D.weeks = D.weekStarts.map((w) => span(w, weekEnd(w)));
    // Regularity: what was done each day, against its plan (Sundays are rest days).
    const act = activeDays();
    D.strip = D.days.map((d) => { const st = dayStats(d); return { d, level: dayComplete(d) ? 3 : st && st.n ? 2 : act.has(d) ? 1 : 0, rest: dow(d) === 6, today: d === t }; });
    const counted = D.strip.filter((x) => !x.rest && x.d >= start && (x.d < t || x.level));
    D.active = counted.filter((x) => x.level).length;
    D.studyDays = counted.length;
    D.streak = streak();
    D.best = longestStreak();
    D.activeAll = [...act].filter((d) => d <= t).length;
    // Grammar: the day's first rounds, the last two weeks against the two before.
    const recent = firstRoundsSince(addDays(t, -13)), before = firstRoundsSince(addDays(t, -27)).filter((d) => d.date < addDays(t, -13));
    D.acc = accuracy(recent);
    D.accPrev = recent.length >= 3 && before.length >= 3 ? accuracy(before) : null;
    D.accWeeks = D.weekStarts.map((w) => accuracy(firstRoundsSince(w).filter((d) => d.date <= weekEnd(w))));
    // Cards.
    D.cards = allCards();
    D.srs = learnedCards(D.cards);
    D.learned = D.srs.length;
    D.learnedWeek = D.srs.filter(([, st]) => str(st.learned) >= mon).length;
    D.mastered = D.srs.filter(([, st]) => !st.pri && (st.stage || 0) >= 5).length;
    D.due = dueIds(D.cards).length;
    D.learnedWeeks = D.weekStarts.map((w) => D.srs.filter(([, st]) => !st.learned || st.learned <= weekEnd(w)).length);
    // Writing: Claude's corrections, oldest first, with mistakes per 100 words.
    D.writes = list("writing").filter((w) => w.fb).sort((a, b) => (a.ts || 0) - (b.ts || 0)).map((w) => {
      const n = arr(w.fb.errors).length, sc = w.fb.score20;
      return { w, n, rate: w.words ? (n / w.words) * 100 : null, score: sc != null && sc !== "" && !isNaN(sc) ? Number(sc) : null };
    });
    D.rates = D.writes.filter((x) => x.rate != null);
    D.scores = D.writes.filter((x) => x.score != null);
    return D;
  }

  const delta = (v, good, text) => (v == null ? "" : `<p class="k-delta ${v === 0 ? "flat" : good ? "good" : "bad"}"><span aria-hidden="true">${v > 0 ? "▲" : v < 0 ? "▼" : "■"}</span>${text}</p>`);
  const card = (span, title, note, body, cls) => `<article class="dash-card span-${span}${cls ? " " + cls : ""}" data-spot><div class="dash-ch"><h3 class="h3">${title}</h3>${note ? `<span class="small muted">${note}</span>` : ""}</div>${body}</article>`;
  const hint = (t) => `<p class="small muted dash-hint">${t}</p>`;

  // The headline numbers, one tile each with its trend.
  function dashKpis(D) {
    const nR = D.rates.length, rN = D.rates[nR - 1], k = Math.min(3, Math.floor(nR / 2));
    const avgRate = (xs) => xs.reduce((a, x) => a + x.rate, 0) / xs.length;
    const rateNow = nR ? avgRate(D.rates.slice(-3)) : null;
    const dRate = k ? +(avgRate(D.rates.slice(-k)) - avgRate(D.rates.slice(0, k))).toFixed(1) : null;
    const dw = D.lastWeek == null ? null : D.week - D.lastWeek;
    const accPts = D.acc != null && D.accPrev != null ? Math.round((D.acc - D.accPrev) * 100) : null;
    const n = (k, v, unit) => `<span data-tween="kpi-${k}" data-tw="count" data-to="${v}">${v}</span>${unit ? `<small>${unit}</small>` : ""}`;
    const tile = (k, icon, fr, en, value, sub, extra, viz) => `<article class="kpi k-${k}" data-tilt data-m="deal" data-k="kpi-${k}">
        <p class="k-label"><span class="k-ico">${ico(icon)}</span><span>${fr}<small>${en}</small></span></p>
        <p class="k-value">${value}</p><p class="k-sub">${sub}</p>${extra || ""}<div class="k-viz" data-m="chart" data-k="kv-${k}">${viz || ""}</div></article>`;
    const dayTip = (x) => `${dayLabel(x.d)}${x.today ? " · today" : ""}\n${x.rest ? (x.level ? "Rest day, and you practised anyway" : "Rest day") : ["Nothing done", "Practice outside the plan", "Part of the plan", "The whole plan"][x.level]}`;
    return `<div class="kpis">
      ${tile("time", "timer", "Temps d'étude", "this week", `≈ ${hm(D.week)}`, `Of about ${hm(D.planned)} planned, counted from the blocks you tick`, delta(dw, dw >= 0, `${dw >= 0 ? "+" : "−"}${hm(Math.abs(dw || 0))} on last week, same days`), CH.spark(D.weeks, { w: 150, h: 34, min: 0, color: "var(--accent)" }))}
      ${tile("days", "today", "Jours actifs", D.span.toLowerCase(), `${n("days", D.active)}${D.studyDays ? `<small>/${D.studyDays}</small>` : ""}`, D.streak ? `Streak of ${D.streak} day${D.streak > 1 ? "s" : ""} · best ${D.best}` : `No streak right now · best ${D.best}`, "", CH.strip(D.strip.map((x) => ({ level: x.level, rest: x.rest, today: x.today, tip: dayTip(x) })), { label: `${D.active} of ${D.studyDays} study days with something done` }))}
      ${tile("acc", "grammar", "Précision", "grammar, first rounds", D.acc == null ? "—" : n("acc", Math.round(D.acc * 100), " %"), "The day's first round of each set, last 14 days", accPts == null ? "" : delta(accPts, accPts >= 0, `${accPts >= 0 ? "+" : "−"}${Math.abs(accPts)} pts on the 14 days before`), CH.spark(D.accWeeks.map((a) => (a == null ? null : a * 100)), { w: 150, h: 34, min: 0, max: 100, color: "var(--c-gra)" }))}
      ${tile("cards", "vocab", "Cartes", "learned", n("cards", D.learned), `${D.mastered} mastered · ${D.due} due today`, D.learnedWeek ? delta(D.learnedWeek, true, `+${D.learnedWeek} this week`) : "", CH.spark(D.learnedWeeks, { w: 150, h: 34, color: "var(--c-voc)" }))}
      ${tile("rate", "errors", "Fautes", "per 100 words", rN ? CH.fr(rateNow, 1) : "—", rN ? (Math.min(3, nR) > 1 ? `Your last ${Math.min(3, nR)} corrected texts, on average (latest ${shortDate(rN.w.date)})` : `Your last corrected text (latest ${shortDate(rN.w.date)})`) : "Once Claude corrects a text", dRate == null ? "" : delta(dRate, dRate <= 0, (k > 1 ? `${dRate <= 0 ? "−" : "+"}${CH.fr(Math.abs(dRate), 1)} on your first ${k} texts` : `${dRate <= 0 ? "−" : "+"}${CH.fr(Math.abs(dRate), 1)} on your first text`)), CH.spark(D.rates.map((x) => x.rate), { w: 150, h: 34, min: 0, color: "var(--red)" }))}
    </div>`;
  }

  // Where each skill stands: the latest estimate for each of the four skills, and the scores before it. Practice
  // exams (retakes left out) and scores you logged; for writing, the average of Claude's last three scores unless a
  // score you logged is newer. The radar and the bullets both read it, and so does the weakest-skill notice.
  const SKILLS4 = [["co", "Compréhension orale"], ["ce", "Compréhension écrite"], ["ee", "Expression écrite"], ["eo", "Expression orale"]];
  function skillEstimates(D) {
    const all = [], R = retakeIds();
    const skills = SKILLS4.map(([k, name]) => {
      // Practice exams, and scores you logged (a practice exam's own copy in the log isn't counted twice).
      let hist = compAttempts(k).filter((a) => a.kind === "exam" && a.est && !R.has(a.id)).map((a) => ({ v: Number(a.est), date: a.date, ts: a.ts || 0, src: "Examen blanc (site estimate)" }))
        .concat(list("mocks").filter((m) => m[k] != null && m[k] !== "" && !isNaN(m[k]) && !m.compId).map((m) => ({ v: Number(m[k]), date: m.date, ts: m.ts || 0, src: m.label || "Logged score" })));
      const fromClaude = k === "ee" ? D.scores.map((x) => ({ v: x.score, date: x.w.date, ts: x.w.ts || 0, src: `${taskName(x.w)}, Claude's estimate`, claude: true })) : [];
      hist = hist.concat(fromClaude).sort((a, b) => str(a.date).localeCompare(str(b.date)) || a.ts - b.ts);
      hist.forEach((h) => all.push({ d: str(h.date), ts: h.ts, row: [name, shortDate(h.date), h.src, scoreText(k, h.v), `NCLC ${nclcLabel(nclcOf(k, h.v))}`] }));
      // Retakes are listed in the numbers, but kept off the charts and out of the estimate.
      compAttempts(k).filter((a) => a.kind === "exam" && a.est && R.has(a.id)).forEach((a) => all.push({ d: str(a.date), ts: a.ts || 0, row: [name, shortDate(a.date), "Examen blanc, a retake (not counted)", scoreText(k, a.est), `NCLC ${nclcLabel(nclcOf(k, a.est))}`] }));
      const logged = hist.filter((h) => !h.claude), lastLogged = logged[logged.length - 1];
      const last3 = fromClaude.slice(-3);
      let est = null, note = "", ghosts = hist;
      if (last3.length && !(lastLogged && str(lastLogged.date) >= str(last3[last3.length - 1].date))) {
        est = last3.reduce((a, x) => a + x.v, 0) / last3.length;
        note = `Average of Claude's last ${last3.length} score${last3.length > 1 ? "s" : ""}`;
      } else if (hist.length) {
        const h = hist[hist.length - 1];
        est = h.v;
        note = `${h.src} · ${shortDate(h.date)}`;
        ghosts = hist.slice(0, -1);
      }
      const nc = est == null ? null : nclcOf(k, est);
      return { k, name, est, nc, ok: nc != null && nc >= 7, note, ghosts, valTxt: est == null ? "" : `≈ ${scoreText(k, est)}` };
    });
    return { skills, rows: all.sort((x, y) => y.d.localeCompare(x.d) || y.ts - x.ts).map((x) => x.row) };
  }
  const weakestOf = (E) => E.skills.filter((x) => x.est != null).sort((a, b) => a.nc - b.nc)[0] || null;

  // The four skills on the NCLC scale, against the NCLC 7 ring (a skill without a score yet stays off the shape).
  function skillRadar(E) {
    const N = NCLC_UP.length, at = (n) => Math.max(0, NCLC_UP.findIndex((r) => r.n === n)) / N;
    return CH.radar(E.skills.map((x) => ({ label: `${T.SKILLS[x.k].code} · ${T.SKILLS[x.k].label}`, sub: x.est == null ? "pas encore de score" : `NCLC ${nclcLabel(x.nc)}`, value: x.est == null ? null : nclcPos(x.k, x.est), tip: x.est == null ? "" : `${x.name} · NCLC ${nclcLabel(x.nc)}\n${x.valTxt} · ${x.note}` })),
      { key: "radar", min: -0.14, rings: [at(5), at(9)], target: at(7), targetLabel: "NCLC 7", label: "Each skill on the NCLC scale, against the NCLC 7 ring" });
  }

  // Where each skill stands against NCLC 7: the latest estimate, the ones before it, and how far there is to go.
  function dashReady(E) {
    const rows = E.skills.map(({ k, name, est, nc, ok, note, ghosts, valTxt }) => {
      const gap = nc == null ? "" : ok ? `<span class="r-gap ok">✓ NCLC 7 reached</span>` : `<span class="r-gap">${nc === 0 ? "Below NCLC 4" : `${7 - nc} band${7 - nc > 1 ? "s" : ""} to go`}</span>`;
      const empty = k === "eo" ? "Speaking is practised off the site: log a mock's score below." : k === "co" ? "No score yet: the CO practice exam gives a first estimate." : k === "ce" ? "No score yet: the CE practice exam gives a first estimate." : "No score yet: correct a writing task with Claude.";
      return `<div class="r-row">
        <span class="r-skill">${skChip(k)}<b>${name}</b></span>
        ${CH.bullet({ key: "ready-" + k, bands: NCLC_UP.map((r) => ({ label: r.nclc, target: r.n === 7 })), pos: est == null ? null : nclcPos(k, est), ok, tip: est == null ? "" : `${valTxt} · NCLC ${nclcLabel(nc)}\n${note}`, ghosts: ghosts.slice(-6).map((h) => ({ pos: nclcPos(k, h.v), tip: `${scoreText(k, h.v)} · NCLC ${nclcLabel(nclcOf(k, h.v))}\n${h.src} · ${shortDate(h.date)}` })), label: est == null ? `${name}: no score yet` : `${name}: ${valTxt}, NCLC ${nclcLabel(nc)}` })}
        <span class="r-val">${est == null ? `<small>${empty}</small>` : `<b>${valTxt} · NCLC ${nclcLabel(nc)}</b><small>${esc(note)}</small>`}</span>
        ${gap}
      </div>`;
    }).join("");
    return `<article class="dash-card ready">${rows}<p class="small muted r-key"><span class="r-key-t"></span>NCLC 7, your target<span class="r-key-d"></span>latest estimate<span class="r-key-g"></span>earlier scores</p>
      ${numbers("ready", ["Skill", "Date", "From", "Score", "Level"], E.rows)}</article>`;
  }

  // Study time, opened: minutes a day by skill, how they split between skills, and everything since you started
  // (the heatmap is on the tile itself).
  function timeMore(D, stats) {
    const series = SK_ORDER.map((k) => ({ id: k, label: T.SKILLS[k].label, color: skColor(k) }));
    const top = Math.max(60, ...D.mins.map(minTotal));
    const step = top > 180 ? 60 : 30;
    const ticks = [];
    for (let v = step; v <= Math.ceil(top / step) * step; v += step) ticks.push(v);
    const afterMonday = D.t !== D.days[0] && dow(D.t) === 1;
    const cols = CH.cols({
      key: "time-cols", h: 190, ticks, max: Math.ceil(top / step) * step, series, label: `Minutes of study a day: ${hm(D.total)} in all`,
      x: D.days.map((d, i) => {
        const by = D.mins[i], tot = minTotal(by);
        const label = d === D.t ? "auj." : dow(d) === 0 && !(afterMonday && addDays(d, 1) === D.t) ? shortDate(d) : "";
        return { label, today: d === D.t, rest: dow(d) === 6, tip: `${dayLabel(d)} · ${tot ? hm(tot) : dow(d) === 6 ? "rest day" : "nothing ticked"}${SK_ORDER.filter((k) => by[k]).map((k) => `\n${T.SKILLS[k].label} · ${by[k]} min`).join("")}` };
      }),
      data: D.mins.map((by) => SK_ORDER.map((k) => by[k] || 0)),
    });
    const studied = D.mins.filter((by) => minTotal(by) > 0).length;
    const split = CH.stack(SK_ORDER.filter((k) => D.bySkill[k]).map((k) => ({ label: T.SKILLS[k].label, value: D.bySkill[k], color: skColor(k), text: hm(D.bySkill[k]) })), { key: "time-split", unit: "min", label: "How the study time splits between skills" });
    return { side: card(12, "Minutes par jour · minutes a day", `${D.span} · ${hm(D.total)} in all, from the blocks you ticked`, cols + numbers("time", ["Day", "Total"].concat(SK_ORDER.map((k) => T.SKILLS[k].label)), D.days.map((d, i) => [dayLabel(d), hm(minTotal(D.mins[i]))].concat(SK_ORDER.map((k) => (D.mins[i][k] ? `${D.mins[i][k]} min` : "")))).filter((r) => r[1] !== "0 min").reverse())),
      wide: `<div class="dash-grid">${card(6, "Répartition · the split", D.span, `${D.total ? split : hint("Tick blocks on Aujourd'hui and the split shows here.")}
        <dl class="facts"><div><dt>A study day, on average</dt><dd>${studied ? hm(D.total / studied) : "—"}</dd></div><div><dt>Days with anything done</dt><dd>${D.activeAll}</dd></div><div><dt>Longest streak</dt><dd>${D.best} day${D.best === 1 ? "" : "s"}</dd></div></dl>`)}
      ${card(6, "Depuis le début · since you started", `${D.streak}-day streak · best ${D.best}`, `<div class="stats">${stats.map(([v, l]) => `<div class="stat"><b data-tween="stat-${esc(l)}" data-tw="count" data-to="${v}">${v}</b><span>${l}</span></div>`).join("")}</div>`)}
    </div>` };
  }

  // Each topic's first rounds of its criterion set: what you're working on first, then what's mastered, then the
  // topics still ahead.
  function grammarRows() {
    const s = settings();
    const rows = T.TOPICS.map((tp) => {
      const c = tp.criterion, m = topicMastery(tp), firsts = new Map();
      if (c.set) drillsFor(tp.id, c.set).forEach((d) => { if (d.total && !firsts.has(d.date)) firsts.set(d.date, d.score / d.total); });
      const vals = [...firsts.values()];
      return { tp, m, vals, last: vals.length ? vals[vals.length - 1] : null };
    });
    const rank = (r) => (r.m.ok ? 1 : r.m.started || r.tp.phase === s.phase ? 0 : 2);
    return rows.sort((a, b) => rank(a) - rank(b) || a.tp.phase - b.tp.phase);
  }
  const topicRing = ({ tp, m, last }, size) => {
    const p = tp.criterion.pct || null, hit = last != null && p != null && last >= p - 1e-9;
    return CH.ring(last, { size, stroke: 5, color: m.ok || hit ? "var(--green)" : "var(--accent)", target: p, text: last == null ? "—" : String(Math.round(last * 100)), tip: last == null ? `${tp.title}\nNot started` : `${tp.title}\nLatest first round ${Math.round(last * 100)} %${p ? ` · target ${Math.round(p * 100)} %` : ""}` });
  };
  // Grammar, opened: each topic's latest first round against its target (wide), and the rules you miss most (side).
  function dashGrammar(rows) {
    const tiles = rows.map((r) => {
      const { tp, m, vals, last } = r, p = tp.criterion.pct || null, hit = last != null && p != null && last >= p - 1e-9;
      const color = m.ok || hit ? "var(--green)" : "var(--accent)";
      const status = m.ok ? "Maîtrisé · mastered" : m.started ? `En cours · Phase ${tp.phase}` : `Phase ${tp.phase} · not started`;
      return `<a class="t-tile ${m.ok ? "ok" : m.started ? "on" : "off"}" href="#grammar.${tp.id}" data-tilt>
        ${topicRing(r, 46)}
        <span class="t-txt"><b>${esc(tp.title)}</b><small>${status}</small></span>
        ${vals.length > 1 ? CH.spark(vals.slice(-8), { w: 54, h: 22, min: 0, max: 1, color }) : ""}
      </a>`;
    }).join("");
    // The rules behind the sentences missed in the last 30 days, found from the built-in sets.
    const since = Date.now() - 30 * 864e5, rules = new Map();
    for (const d of list("drills")) {
      if (d.set === "prod" || (d.ts || 0) < since) continue;
      arr(d.items).concat(retriesOf(d).flatMap((r) => arr(r.items))).forEach((it) => {
        const topic = it.topic || d.topic;
        if (topic === "mine" || topic === "hunt") return;
        const b = bankItem(topic, it), point = (b && b.point) || it.point;
        if (!point) return;
        const tid = b ? b.topic : topic, k = tid + "|" + point, e = rules.get(k) || { topic: tid, point, n: 0, miss: 0 };
        e.n++;
        if (!it.ok) e.miss++;
        rules.set(k, e);
      });
    }
    const weak = [...rules.values()].filter((e) => e.n >= 3 && e.miss).sort((a, b) => b.miss / b.n - a.miss / a.n || b.miss - a.miss).slice(0, 6);
    const tname = (id) => (TOPIC[id] || {}).title || "";
    const done = rows.filter((r) => r.m.ok).length;
    return { wide: card(12, "Les sujets · topics", `${done} of ${T.TOPICS.length} mastered · the ring is your latest first round, the tick its target`, `<div class="t-grid" data-m="chart" data-k="topics">${tiles}</div>` + numbers("topics", ["Topic", "Phase", "Latest first round", "Target", "Status"], rows.filter((r) => r.vals.length).map(({ tp, m, last }) => [tp.title, tp.phase, `${Math.round(last * 100)} %`, tp.criterion.pct ? `${Math.round(tp.criterion.pct * 100)} %` : "", m.ok ? "Mastered" : "In progress"]))),
      side: card(12, "Points faibles · weak rules", "Missed most in the last 30 days (rules met 3 times or more)", weak.length
        ? CH.hbars(weak.map((e) => ({ label: e.point, sub: tname(e.topic), value: e.miss / e.n, max: 1, text: `${e.miss}/${e.n}`, color: "var(--red)", href: TOPIC[e.topic] ? `#grammar.${e.topic}` : "", tip: `${e.point}\nMissed ${e.miss} of ${e.n} · ${tname(e.topic)}` })), { key: "weak-rules", label: "The rules missed most often in the last 30 days" })
          + numbers("weak", ["Rule", "Topic", "Missed"], weak.map((e) => [e.point, tname(e.topic), `${e.miss} of ${e.n}`]))
        : hint("Nothing missed often lately. Rules show here once you've met them three times.")),
    };
  }

  // Mistakes, opened: how many per 100 words in each corrected text and where your own mistakes stand (side), and
  // every category (wide).
  function dashErrors(D, counts) {
    const n = D.rates.length, lastR = D.rates[n - 1];
    const ratePlot = n ? CH.plot({
      key: "err-rate", h: 170, yMin: 0, yMax: Math.max(20, Math.ceil(Math.max(...D.rates.map((x) => x.rate)) / 5) * 5), ticks: [5, 10, 15, 20, 25, 30].filter((v) => v <= Math.max(20, Math.ceil(Math.max(...D.rates.map((x) => x.rate)) / 5) * 5)), label: "Mistakes per 100 words in each text Claude corrected",
      series: [{ label: "Per 100 words", color: "var(--red)", line: true, area: true, points: D.rates.map((x, i) => ({ x: n > 1 ? i / (n - 1) : 0.5, y: x.rate, tip: `${CH.fr(x.rate, 1)} per 100 words\n${taskName(x.w)} · ${shortDate(x.w.date)} · ${x.n} mistakes in ${x.w.words} words` })) }],
      end: { x: n > 1 ? 1 : 0.5, y: lastR.rate, label: CH.fr(lastR.rate, 1) },
      xs: n > 1 ? [{ x: 0, label: shortDate(D.rates[0].w.date) }, { x: 1, label: shortDate(lastR.w.date) }] : [],
    }) : "";
    const ms = mineStatus(), by = (st) => ms.filter((m) => m.state === st).length;
    const mine = CH.stack([["fixed", "Fixed", "var(--green)"], ["once", "Right once", "color-mix(in srgb, var(--green) 45%, var(--surface))"], ["new", "Not practised yet", "var(--ink-3)"], ["missed", "Missed last time", "var(--red)"]].map(([k, l, c]) => ({ label: l, value: by(k), color: c })), { key: "mine-split", label: "Where your own mistakes stand" });
    const recent = errorCounts(21);
    const rec = (c) => { const r = recent.find(([k]) => k === c); return r ? r[1].n : 0; };
    return { side: `<div class="dash-grid">
      ${card(12, "Fautes pour 100 mots · per 100 words", "Each text Claude corrected, oldest to latest", n ? ratePlot + numbers("rate", ["Date", "Task", "Words", "Mistakes", "Per 100 words"], D.rates.map((x) => [shortDate(x.w.date), taskName(x.w), x.w.words, x.n, CH.fr(x.rate, 1)]).reverse()) : hint("Correct a writing task with Claude and it shows here."))}
      ${card(12, "Mes erreurs · your mistakes drill", ms.length ? `${ms.length - by("fixed")} of ${ms.length} still to fix` : "", ms.length ? `${mine}<div class="row"><a class="btn sm" href="#grammar.mine">Practise them</a></div>` : hint("Your mistakes come here once Claude corrects your writing."))}
    </div>`,
      wide: card(6, "Par catégorie · by category", "Every mistake so far, with how many in the last 3 weeks", counts.length
        ? CH.hbars(counts.map(([c, v]) => ({ label: CAT[c], sub: rec(c) ? `${rec(c)} in the last 3 weeks` : "None in the last 3 weeks", value: v.n, text: String(v.n), color: "var(--red)", href: TOPIC[c] ? `#grammar.${c}` : "", tip: `${CAT[c]}\n${v.n} in all · ${rec(c)} in the last 3 weeks\ne.g. ${v.ex.wrong} → ${v.ex.right}` })), { key: "err-cats", label: "Mistakes by category" })
        : `<div class="empty">${greet("correction", "Pas encore de fautes relevées.", "No errors logged yet. Correct a writing task with Claude, or add one below.", "sm")}</div>`),
    };
  }

  // Cards, opened: how many you've learned week by week, and the ones that keep slipping (the stages are on the
  // tile, and the cards due on the week ahead).
  function vocabMore(D) {
    const hard = D.srs.filter(([, st]) => (st.lapses || 0) >= 2).sort((a, b) => b[1].lapses - a[1].lapses).slice(0, 6);
    const W = D.weekStarts, grow = CH.cols({ key: "voc-weeks", h: 110, legend: false, series: [{ id: "n", label: "Cards learned", color: "var(--c-voc)" }], data: D.learnedWeeks.map((v) => [v]), label: "Cards learned by the end of each week",
      x: W.map((w, i) => ({ label: i === 0 || i === W.length - 1 ? shortDate(w) : "", today: w === D.mon, tip: `Week of ${shortDate(w)}\n${D.learnedWeeks[i]} card${D.learnedWeeks[i] === 1 ? "" : "s"} learned by then` })) });
    return `<div class="dash-grid">
      ${card(12, "Cartes apprises · cards learned", `${D.learned} so far · ${D.learnedWeek} this week`, D.learned ? grow + numbers("voc-weeks", ["Week of", "Cards learned"], W.map((w, i) => [shortDate(w), D.learnedWeeks[i]]).reverse()) : hint("Learn your first cards in Vocabulaire."))}
      ${card(12, "Les plus difficiles · the ones that slip", "Missed the most: an example of your own helps (Edit card, or E while reviewing)", hard.length ? `<ul class="hard">${hard.map(([id, st]) => { const c = D.cards.get(id) || {}; return `<li><span class="fr" lang="fr">${typo(c.fr || id)}</span><span class="pill bad">×${st.lapses}</span><small>${esc(c.en || "")}</small></li>`; }).join("")}</ul>` : hint("No card missed twice yet."))}
      <div class="row"><a class="btn sm" href="#vocab">Review now</a></div>
    </div>`;
  }

  // Listening and reading: each set's score, first tries filled and retries hollow, against this phase's
  // target; reading pace against exam pace; and the practice exams.
  function dashComp() {
    const s = settings();
    const target = arr(T.CRITERIA[s.phase]).map((c) => str(c.auto).split(":")).find((a) => a[0] === "comp");
    const lvlColor = { B1: "var(--o-2)", B2: "var(--o-4)" };
    const plotFor = (k) => {
      const xs = compAttempts(k).filter((a) => a.kind !== "exam" && a.total && a.src !== "logged").reverse();
      if (!xs.length) return hint(`No ${k === "co" ? "listening" : "reading"} sets yet.`);
      const firsts = new Set(firstTries(xs).map((a) => a.id)), n = xs.length;
      const levels = ["B1", "B2"].filter((l) => xs.some((a) => (a.level || "B1") === l));
      return CH.plot({
        key: "comp-" + k, h: 160, yMin: 0, yMax: 100, ticks: [25, 50, 75, 100], tick: (v) => `${v} %`, label: `${k === "co" ? "Listening" : "Reading"} set scores, oldest to latest`,
        refs: target ? [{ y: Number(target[2]) * 100, label: `target ${Math.round(Number(target[2]) * 100)} % at ${target[1]}` }] : [],
        series: levels.map((l) => ({ label: l, color: lvlColor[l], points: xs.map((a, i) => ({ a, i })).filter(({ a }) => (a.level || "B1") === l).map(({ a, i }) => ({ x: n > 1 ? i / (n - 1) : 0.5, y: (a.score / a.total) * 100, hollow: !firsts.has(a.id), tip: `${a.score}/${a.total} · ${l}${firsts.has(a.id) ? " · first try" : " · another try"}\n${a.title || ""} · ${shortDate(a.date)}` })) })),
        xs: n > 1 ? [{ x: 0, label: shortDate(xs[0].date) }, { x: 1, label: shortDate(xs[n - 1].date) }] : [],
      }) + numbers("comp-" + k, ["Date", "Set", "Level", "Score", "Try"], xs.map((a) => [shortDate(a.date), a.title || "", a.level || "", `${a.score}/${a.total}`, firsts.has(a.id) ? "first" : "again"]).reverse());
    };
    // Reading pace in seconds a question, from sets done in one sitting (a set left open for hours says nothing).
    const ce = compAttempts("ce").filter((a) => a.kind !== "exam" && a.total && a.secs && a.secs / a.total <= 600).reverse(), m = ce.length;
    const paceMax = m ? Math.max(240, Math.ceil(Math.max(...ce.map((a) => a.secs / a.total)) / 60) * 60) : 240;
    const pace = m ? CH.plot({
      key: "ce-pace", h: 150, yMin: 0, yMax: paceMax, ticks: [60, 120, 180, 240, 300, 360, 420, 480, 540, 600].filter((v) => v <= paceMax), tick: (v) => `${v} s`, label: "Seconds a reading question, against exam pace",
      refs: [{ y: CE_PACE.B1, label: `exam pace · ${CE_PACE.B1} s` }],
      series: [{ label: "Seconds a question", color: "var(--c-ce)", line: true, points: ce.map((a, i) => ({ x: m > 1 ? i / (m - 1) : 0.5, y: a.secs / a.total, tip: `${Math.round(a.secs / a.total)} s a question${a.timed ? " · on the clock" : ""}\n${a.title || ""} · ${shortDate(a.date)} · ${a.score}/${a.total}` })) }],
      xs: m > 1 ? [{ x: 0, label: shortDate(ce[0].date) }, { x: 1, label: shortDate(ce[m - 1].date) }] : [],
    }) + numbers("pace", ["Date", "Set", "Seconds a question", "Score"], ce.map((a) => [shortDate(a.date), a.title || "", Math.round(a.secs / a.total), `${a.score}/${a.total}`]).reverse()) : hint("Do a reading set in one sitting and your pace shows here.");
    const exams = ["co", "ce"].flatMap((k) => compAttempts(k).filter((a) => a.kind === "exam" && a.est).map((a) => ({ k, a }))).sort((x, y) => (y.a.ts || 0) - (x.a.ts || 0)), retakes = retakeIds();
    return `<div class="dash-grid">
      ${card(6, `${ico("listen")}Écoute · listening sets`, "Filled: first try · hollow: another try", plotFor("co"))}
      ${card(6, `${ico("read")}Lecture · reading sets`, "Filled: first try · hollow: another try", plotFor("ce"))}
      ${card(6, "Rythme · reading pace", "Under the line is exam pace or quicker", pace)}
      ${card(6, `${ico("exam")}Examens blancs · practice exams`, "The site's estimate on the TCF scale", `${exams.length ? `<ul class="exams-l">${exams.map(({ k, a }) => `<li><span class="sk ${k}">${k.toUpperCase()}</span><b>≈ ${esc(a.est)}</b>${nclcTag(a.est, k)}${retakes.has(a.id) ? `<span class="pill info">retake · not counted</span>` : ""}<span class="small muted">${shortDate(a.date)} · ${a.score}/${a.total}</span></li>`).join("")}</ul>` : hint("No practice exam yet.")}
        <div class="row"><a class="btn sm" href="#comp.co.exam">CO exam</a><a class="btn sm" href="#comp.ce.exam">CE exam</a></div>`)}
    </div>`;
  }

  // Writing: Claude's score out of 20 for each corrected text, against the NCLC 7 band.
  function eePlot(D, h) {
    const pts = D.scores, n = pts.length, lastP = pts[n - 1];
    return n ? CH.plot({
      key: "ee-scores", h, yMin: 0, yMax: 20, ticks: [5, 10, 15, 20], label: "Claude's score out of 20 for each corrected text",
      bands: [{ from: 7, to: 10, label: "NCLC 6" }, { from: 10, to: 12, label: "NCLC 7", cls: "target" }],
      series: [{ label: "Score /20", color: "var(--c-ee)", line: true, points: pts.map((x, i) => ({ x: n > 1 ? i / (n - 1) : 0.5, y: x.score, tip: `${x.score}/20${x.w.fb.level ? " · " + x.w.fb.level : ""}\n${taskName(x.w)} · ${shortDate(x.w.date)} · ${x.w.words} words` })) }],
      end: { x: n > 1 ? 1 : 0.5, y: lastP.score, label: `${lastP.score}/20` },
      xs: n > 1 ? [{ x: 0, label: shortDate(pts[0].w.date) }, { x: 1, label: shortDate(lastP.w.date) }] : [],
    }) : hint("Correct a writing task with Claude and its score shows here.");
  }
  function writingMore(D) {
    const pts = D.scores, n = pts.length, last3 = pts.slice(-3), avg = last3.length ? last3.reduce((a, x) => a + x.score, 0) / last3.length : null;
    const ws = list("writing"), inRange = ws.filter((w) => { const W = T.WRITING[w.task]; return W && w.words >= W.min && w.words <= W.max; }).length;
    return `<div class="dash-grid">
      ${card(12, "En bref · at a glance", "", `<dl class="facts"><div><dt>Average of the last 3</dt><dd>${avg == null ? "—" : `${CH.fr(avg, 1)}/20`}</dd></div><div><dt>Best so far</dt><dd>${n ? `${Math.max(...pts.map((x) => x.score))}/20` : "—"}</dd></div><div><dt>Inside the word count</dt><dd>${ws.length ? `${inRange} of ${ws.length}` : "—"}</dd></div><div><dt>Texts corrected</dt><dd>${D.writes.length}</dd></div></dl>`)}
      ${n ? card(12, "Chaque texte · every text", "Newest first", CH.table(["Date", "Task", "Words", "Score", "Level"], pts.map((x) => [shortDate(x.w.date), taskName(x.w), x.w.words, `${x.score}/20`, x.w.fb.level || ""]).reverse())) : ""}
      <div class="row"><a class="btn sm" href="#writing">Write a task</a></div>
    </div>`;
  }

  /* ---------- the week ahead and what you'd recall ---------- */
  // The days ahead: what the plan asks each day (today, only the blocks still open, at the coach's minutes) and the
  // cards that fall due, with the time their reviews should take at your pace.
  function aheadDays(D, n) {
    const s = settings(), pace = myPace();
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(D.t, i), plan = planFor(s.phase, d), done = ((S.days.get(d) || {}).done) || {};
      const mins = plan ? blockMins(d, plan, s.phase) : [], by = {}, blocks = [];
      if (plan) plan.forEach((b, k) => { if (!i && done[blockKey(s.phase, k)]) return; by[b[0]] = (by[b[0]] || 0) + mins[k]; blocks.push(b[2]); });
      const due = D.srs.filter(([, st]) => st.due && (i ? st.due === d : st.due <= d)).length;
      return { d, i, plan: !!plan, by, total: minTotal(by), blocks, due, rev: (due * pace.rc) / 60 };
    });
  }
  const aheadLabel = (a) => (a.i ? DAYS_SHORT[dow(a.d)] : "auj.");
  const aheadName = (a) => (a.i ? dayLabel(a.d) : "Today");
  function aheadCols(A, key, h, labels) {
    const used = SK_ORDER.filter((k) => A.some((a) => a.by[k]));
    return { used, html: CH.cols({
      key, h, legend: false, series: used.map((k) => ({ id: k, label: T.SKILLS[k].label, color: skColor(k) })), data: A.map((a) => used.map((k) => a.by[k] || 0)),
      label: `Minutes the plan asks each day: ${hm(A.reduce((m, a) => m + a.total, 0))} in all`,
      x: A.map((a, i) => ({ label: labels && (A.length <= 7 || !(i % 2)) ? aheadLabel(a) : "", today: !a.i, rest: !a.plan, tip: `${aheadName(a)}${!a.plan ? " · rest day" : !a.i && !a.total ? " · the whole plan is done" : (a.i ? ` · ≈ ${hm(a.total)} planned` : ` · ≈ ${hm(a.total)} still to do`)}${used.filter((k) => a.by[k]).map((k) => `\n${T.SKILLS[k].label} · ${a.by[k]} min`).join("")}` })),
    }) };
  }
  const aheadDue = (A, key, h) => CH.cols({ key, h, legend: false, series: [{ id: "due", label: "Cards due", color: "var(--c-voc)" }], data: A.map((a) => [a.due]), label: `Cards due each day: ${A.reduce((m, a) => m + a.due, 0)} in all`,
    x: A.map((a, i) => ({ label: A.length <= 7 || !(i % 2) ? aheadLabel(a) : "", today: !a.i, tip: `${aheadName(a)} · ${a.due} card${a.due === 1 ? "" : "s"} due${a.i ? "" : " (with any overdue)"}${a.due ? `\n≈ ${hm(a.rev)} of reviews at your pace` : ""}` })) });
  function aheadFace(D) {
    const A = aheadDays(D, 7), mins = aheadCols(A, "ahead-min", 104, false);
    const total = A.reduce((m, a) => m + a.total, 0), due = A.reduce((m, a) => m + a.due, 0), rev = A.reduce((m, a) => m + a.rev, 0);
    return `<p class="bt-hero"><b>≈ ${hm(total)}</b><span>planned over the next 7 days · ${due} card review${due === 1 ? "" : "s"}${due ? ` (≈ ${hm(rev)})` : ""}</span></p>
      <div class="ahead"><p class="ah-cap">Minutes prévues · planned</p>${mins.html}<p class="ah-cap">Cartes à revoir · cards due</p>${aheadDue(A, "ahead-due", 44)}</div>
      ${mins.used.length > 1 ? CH.legend(mins.used.map((k) => ({ label: T.SKILLS[k].label, color: skColor(k) }))) : ""}`;
  }
  function aheadMore(D) {
    const A = aheadDays(D, 14), mins = aheadCols(A, "ahead-min14", 120, true);
    return `<div class="dash-grid">
      ${card(12, "Deux semaines · the next 14 days", "The plan's minutes each day, by skill", mins.html + (mins.used.length > 1 ? CH.legend(mins.used.map((k) => ({ label: T.SKILLS[k].label, color: skColor(k) }))) : ""))}
      ${card(12, "Cartes à revoir · cards due", `At your pace, ≈ ${CH.fr(myPace().rc, 0)} s a review card`, aheadDue(A, "ahead-due14", 80))}
    </div>`;
  }
  function aheadWide(D) {
    const A = aheadDays(D, 14);
    return card(12, "Jour par jour · day by day", "Today counts only the blocks still open", CH.table(["Day", "The plan", "Minutes", "Cards due", "Reviews"], A.map((a) => [aheadName(a), !a.plan ? "Rest day" : a.blocks.length ? a.blocks.join(" · ") : "All done", a.plan ? hm(a.total) : "", a.due, a.due ? `≈ ${hm(a.rev)}` : ""])));
  }

  // What you'd recall over the next 30 days if you stopped reviewing today: FSRS's chance of recall, averaged over
  // your cards (those from before FSRS through their conversion), all of them and split young (a gap under 21
  // days) and mastered. Measured: Hard, Good or Easy among the grades of the last 30 days (a new card's first
  // check left out).
  function retentionData(D) {
    if (!FSR) return null;
    const now = dayDate(D.t), days = Array.from({ length: 31 }, (_, t) => dayDate(addDays(D.t, t)));
    const cards = D.srs.filter(([, st]) => st.st !== FS.State.New && (st.st != null || st.due)).map(([, st]) => ({ c: srsCard(st, now), mature: !st.pri && (st.stage || 0) >= 5 }));
    if (!cards.length) return null;
    const sum = { all: days.map(() => 0), young: days.map(() => 0), mature: days.map(() => 0) };
    cards.forEach(({ c, mature }) => days.forEach((d, t) => { const r = FSR.get_retrievability(c, d, false); sum.all[t] += r; sum[mature ? "mature" : "young"][t] += r; }));
    const nY = cards.filter((x) => !x.mature).length, nM = cards.length - nY;
    const R = { n: cards.length, nYoung: nY, nMature: nM, all: sum.all.map((v) => v / cards.length), young: nY ? sum.young.map((v) => v / nY) : null, mature: nM ? sum.mature.map((v) => v / nM) : null, logN: 0, logPass: 0 };
    const from = addDays(D.t, -29);
    D.srs.forEach(([, st]) => arr(st.log).forEach(([d, g]) => { if (d >= from && d !== st.learned) { R.logN++; if (g > 1) R.logPass++; } }));
    return R;
  }
  const RET_DAYS = [0, 7, 14, 21, 30];
  const pc0 = (x) => `${Math.round(x * 100)} %`;
  function retentionPlot(R, key, h, split) {
    const lines = split ? [["young", "Young · a gap under 21 days", "var(--o-2)", R.nYoung], ["mature", "Mastered · 21 days or more", "var(--o-4)", R.nMature]].filter(([k]) => R[k]) : [["all", "Your cards", "var(--accent)", R.n]];
    const lowest = Math.min(...lines.map(([k]) => Math.min(...R[k])));
    const lo = Math.max(0, Math.min(80, Math.floor((lowest * 100 - 4) / 10) * 10)), ticks = [];
    for (let v = lo + (lo <= 40 ? 20 : 10); v <= 100; v += lo <= 40 ? 20 : 10) ticks.push(v);
    const series = lines.flatMap(([k, label, color, n]) => [
      { label, color, line: true, area: !split, dots: false, points: R[k].map((v, t) => ({ x: t / 30, y: v * 100 })) },
      { label, color, legend: false, points: RET_DAYS.map((t) => ({ x: t / 30, y: R[k][t] * 100, tip: `${t ? `In ${t} days` : "Today"} · ${pc0(R[k][t])}\n${label}, ${n} card${n === 1 ? "" : "s"}, if you stopped reviewing` })) },
    ]);
    return CH.plot({ key, h, yMin: lo, yMax: 100, ticks, tick: (v) => `${v} %`, refs: [{ y: 90, label: "objectif 90 %" }], series, legend: split && lines.length > 1 ? undefined : false,
      end: split ? null : { x: 1, y: R.all[30] * 100, label: pc0(R.all[30]) },
      xs: RET_DAYS.map((t) => ({ x: t / 30, label: t ? `${t} j` : "auj." })), label: `Average chance of recall over the next 30 days without reviews: ${RET_DAYS.map((t) => pc0(R.all[t])).join(", ")}` });
  }
  function retentionFace(R) {
    if (!R) return hint("Review your first cards, and FSRS's forecast of what you'd recall shows here.");
    return `<p class="bt-hero"><b>${pc0(R.all[0])}</b><span>of your ${R.n} cards you'd recall today · ${pc0(R.all[7])} in a week without a review</span></p>${retentionPlot(R, "ret-curve", 168, false)}
      <dl class="facts"><div><dt>Mastered cards, in 30 days</dt><dd>${R.mature ? pc0(R.mature[30]) : "—"}</dd></div><div><dt>Measured, last 30 days</dt><dd>${R.logN >= 20 ? pc0(R.logPass / R.logN) : `${R.logN} of 20 reviews`}</dd></div></dl>`;
  }
  function retentionMore(R) {
    if (!R) return hint("Nothing to show yet.");
    const measured = R.logN >= 20 ? `<dl class="facts"><div><dt>Measured, last 30 days</dt><dd>${pc0(R.logPass / R.logN)} of ${R.logN} reviews</dd></div><div><dt>FSRS aims for</dt><dd>90 %</dd></div></dl><p class="small muted">The share of your reviews graded Hard, Good or Easy. Well under 90 % means the cards are harder than FSRS reckons; well over it, easier.</p>`
      : hint(`Measured retention shows once 20 reviews are graded with the four buttons (${R.logN} so far in the last 30 days).`);
    return `<div class="dash-grid">
      ${card(12, "Jeunes et maîtrisées · young and mastered", `${R.nYoung} young · ${R.nMature} mastered`, retentionPlot(R, "ret-split", 150, true))}
      ${card(12, "Mesurée · measured", "From your own grades", measured)}
      ${card(12, "Comment le lire · how to read it", "", `<p class="small">FSRS brings each card back when your chance of recalling it falls to 90 %. The curve is what you'd keep if you stopped reviewing today: steep at first for young cards, flatter for mastered ones. Cards from before FSRS count from their last gap.</p>` + numbers("ret", ["Day", "All", "Young", "Mastered"], RET_DAYS.map((t) => [t ? `In ${t} days` : "Today", pc0(R.all[t]), R.young ? pc0(R.young[t]) : "—", R.mature ? pc0(R.mature[t]) : "—"])))}
    </div>`;
  }

  /* ---------- the bento: the overview as tiles ---------- */
  // The overview is bands of tiles, each band's spans adding up to 12 (index.html lays a band out as a row that
  // wraps on narrow screens, its tiles growing to fill the line). A tile shows its face; its header opens it to the
  // full width of its band, with its details beside the face (more) and, for the longer ones, below both (wide),
  // and closes it again. One is open at a time (ui.bento), and motion.js glides the tiles to their new places
  // (TCFMotion.expand).
  const BENTO = [[["scores", 5], ["phase", 7]], [["ahead", 7], ["retention", 5]], [["time", 6], ["grammar", 6]], [["errors", 4], ["week", 4], ["vocab", 4]], [["comp", 6], ["writing", 6]], [["stamps", 12]]];
  const BENTO_MORE = new Set(BENTO.flat().map(([id]) => id));
  const BENTO_ALIAS = { pass: "phase" };
  function tile(id, span, o) {
    const can = !!o.more, open = can && ui.bento === id;
    const head = `<span class="bt-ico">${ico(o.icon)}</span><span class="bt-t"><b>${o.title}</b><small class="en-gloss">${o.en}</small></span>`;
    return `<article class="btile${open ? " open" : ""}${span >= 12 ? " full" : ""}" id="sec-${id}" style="--span:${span};--vtn:bt-${id}" data-spot data-m="deal" data-k="tile-${id}">
      ${can ? `<button type="button" class="bt-h" id="tb-${id}" data-act="tile" data-id="${id}" aria-expanded="${open}" aria-controls="tm-${id}" title="${open ? "Close" : "Open the details"}">${head}<span class="bt-x"><span>${open ? "Réduire" : "Détails"}</span>${ico(open ? "collapse" : "expand")}</span></button>` : `<div class="bt-h">${head}</div>`}
      <div class="bt-body" id="tm-${id}"><div class="bt-pair"><div class="bt-face">${o.face}</div>${open ? `<div class="bt-more">${o.more()}</div>` : ""}</div>${open && o.wide ? `<div class="bt-wide">${o.wide()}</div>` : ""}${open ? `<div class="bt-foot"><button type="button" class="btn sm ghost" data-act="tile" data-id="${id}">${ico("collapse")}Réduire · close</button></div>` : ""}</div>
    </article>`;
  }
  // Opens a tile, or closes the one that's open. Closing a long tile brings its top back into view, in the same
  // movement.
  function bentoToggle(id) {
    const next = ui.bento === id ? null : id;
    const go = () => {
      ui.bento = next;
      render(true);
      const el = document.getElementById("sec-" + id);
      if (el) { const r = el.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight - 80) el.scrollIntoView({ block: "start" }); }
    };
    if (window.TCFMotion && TCFMotion.expand) TCFMotion.expand(go, id); else go();
  }
  const tileHero = (big, text) => `<p class="bt-hero"><b>${big}</b><span>${text}</span></p>`;

  function bentoTiles(s, P, crit, D, E) {
    const met = crit.filter((c) => criterionStatus(c).ok).length, allMet = crit.length && met === crit.length;
    const weakest = weakestOf(E);
    const G = grammarRows(), gDone = G.filter((r) => r.m.ok).length;
    const counts = errorCounts(0), recent21 = errorCounts(21);
    const R = retentionData(D);
    const stamps = stampBook();
    const ms = mineStatus(), msLeft = ms.filter((m) => m.state !== "fixed").length;
    const stats = [
      [list("drills").filter((d) => d.set !== "prod").length, "drill rounds"],
      [[...S.srs.keys()].length, "cards learned"],
      [list("writing").length, "writing tasks"],
      [list("comp").length, "CO / CE sets"],
    ];
    const lastSet = (k) => compAttempts(k).filter((a) => a.kind !== "exam" && a.total && a.src !== "logged");
    const R7 = retakeIds();
    const compRow = (k) => {
      const xs = lastSet(k), last = xs[0], ex = compAttempts(k).filter((a) => a.kind === "exam" && a.est && !R7.has(a.id))[0];
      return `<div class="cf-row">${skChip(k)}<span class="cf-t"><b>${last ? `${last.score}/${last.total}` : "—"}</b><small>${last ? `${esc(last.level || "B1")} · ${shortDate(last.date)}` : `No ${k === "co" ? "listening" : "reading"} set yet`}</small></span>${CH.spark(xs.slice(0, 8).reverse().map((a) => (a.score / a.total) * 100), { w: 84, h: 28, min: 0, max: 100, color: skColor(k) })}<span class="cf-x">${ex ? `≈ ${esc(ex.est)} ${nclcTag(ex.est, k)}` : `<small>No practice exam</small>`}</span></div>`;
    };
    const nComp = lastSet("co").length + lastSet("ce").length;
    const mocks = list("mocks").sort((a, b) => str(b.date).localeCompare(str(a.date)) || (b.ts || 0) - (a.ts || 0));
    const critHTML = crit.map((c) => {
      const st = criterionStatus(c);
      return `<li><span class="mark ${st.ok ? "ok" : "no"}">${st.ok ? "✓" : "○"}</span><span>${esc(c.text)}<small>${st.manual ? "Tick it yourself when it's true." : esc(st.note || "")}</small></span>${st.manual ? `<input type="checkbox" data-change="crit" data-id="${c.id}" ${st.ok ? "checked" : ""} aria-label="Done" style="width:18px;height:18px;accent-color:var(--green)">` : `<span class="pill ${st.ok ? "ok" : ""}">${st.ok ? "Met" : "Auto"}</span>`}</li>`;
    }).join("");
    const t3 = top3(), recent = allErrors().slice(0, 12);
    let timeD = null;
    return {
      scores: {
        icon: "target", title: "Objectif NCLC 7", en: "where each skill stands",
        face: (weakest ? tileHero(`NCLC ${nclcLabel(weakest.nc)}`, weakest.ok ? `your lowest, ${esc(T.SKILLS[weakest.k].label)}: every skill with a score is at NCLC 7 or above` : `your weakest skill, ${esc(T.SKILLS[weakest.k].label)} · ${weakest.nc === 0 ? "below NCLC 4" : `${7 - weakest.nc} band${7 - weakest.nc > 1 ? "s" : ""} to go`}`) : tileHero("—", "No score yet: a practice exam gives a first estimate")) + skillRadar(E),
        more: () => dashReady(E),
        wide: () => `${weakest ? `<div class="notice ${weakest.ok ? "" : "warn"}"><b>Weakest right now: ${esc(weakest.name)}</b>, NCLC ${nclcLabel(weakest.nc)}. ${weakest.ok ? "Every skill with a score is at NCLC 7 or above." : "Spend most of your spare time here, not on your strongest skill."} IRCC scores each skill on its own and never averages.</div>` : ""}
          ${fold("nclc-table", "Le barème NCLC · The NCLC table", `<div class="table-wrap"><table class="nclc"><thead><tr><th>NCLC</th><th>CEFR</th><th>CO</th><th>CE</th><th>EE</th><th>EO</th></tr></thead><tbody>${T.NCLC.map((r) => `<tr class="${r.n === 7 ? "target" : ""}"><td>${r.nclc}${r.n === 7 ? " · your target" : ""}</td><td>${r.cefr}</td><td>${r.coR}</td><td>${r.ceR}</td><td>${r.eR}</td><td>${r.eR}</td></tr>`).join("")}</tbody></table></div>`)}
          <div class="panel stack">${fold("log-mock", "Ajouter un score · Log a mock or real test", `<div class="stack">
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
          </div>`)}</div>
          ${mocks.length ? `<div class="table-wrap"><table class="nclc"><thead><tr><th>Date</th><th>Test</th><th>CO</th><th>CE</th><th>EE</th><th>EO</th><th></th></tr></thead><tbody>${mocks.map((m) => `<tr><td>${shortDate(m.date)}</td><td>${esc(m.label || "")}${m.compId && R7.has(m.compId) ? ` <span class="pill info">retake · not counted</span>` : ""}</td>${["co", "ce", "ee", "eo"].map((k) => { const n = nclcOf(k, m[k]); return `<td>${m[k] == null || m[k] === "" ? "—" : `${m[k]} <span class="tag7 ${n >= 7 ? "ok" : "no"}">${nclcLabel(n)}</span>`}</td>`; }).join("")}<td>${confirmBtn("m-del-" + m.id, "Delete this entry", "m-del", `data-id="${esc(m.id)}"`)}</td></tr>`).join("")}</tbody></table></div>` : ""}`,
      },
      phase: {
        icon: "plane", title: "Carte d'embarquement", en: "boarding pass",
        face: `<div id="sec-pass">${passHTML()}</div>
          <div class="crit-top" data-m="chart" data-k="crit-${s.phase}">${CH.ring(crit.length ? met / crit.length : null, { size: 56, stroke: 6, color: allMet ? "var(--green)" : "var(--accent)", text: `${met}/${crit.length}`, tip: `${met} of ${crit.length} criteria met\nPhase ${s.phase} · ${P.name}` })}<p class="small"><b>Phase ${s.phase} · ${esc(P.name)}</b> <span class="muted">· ${esc(P.weeks)} · semaine ${weekNo()}</span><br>${met} of ${crit.length} exit criteria met. ${esc(P.goal)}</p></div>`,
        more: () => `<article class="dash-card">
            <div class="dash-ch"><h3 class="h3">Phase</h3><span class="small muted">Advance on the exit criteria, not on the calendar</span></div>
            <div class="row"><div class="seg" role="group" aria-label="Phase">${T.PHASES.map((ph) => `<button data-act="p-phase" data-n="${ph.n}" aria-pressed="${ph.n === s.phase}">${ph.n}</button>`).join("")}</div>
              <label class="field" style="grid-auto-flow:column;align-items:center;gap:8px">Week 1 started<input type="date" id="p-start" data-change="start-date" value="${esc(s.startDate)}"></label></div>
          </article>
          <article class="dash-card crit-card">
            <div class="dash-ch"><h3 class="h3">Critères de sortie · exit criteria</h3><span class="small muted">${met} of ${crit.length} met</span></div>
            ${fold("crit-how", "Comment ça compte · How the criteria count", `<p class="small muted">A drill criterion counts the day's first round only, and needs the target on two days at least a week apart: what you still know a week later is what you'll know on test day. Comprehension counts your first try at each set.</p>`)}
            <ul class="criteria">${critHTML}</ul>
            ${allMet && s.phase < 5 ? `<div class="notice"><b>Every Phase ${s.phase} criterion is met.</b> Move to Phase ${s.phase + 1} when you're ready. <button class="btn sm primary" data-act="p-phase" data-n="${s.phase + 1}">Start Phase ${s.phase + 1}</button></div>` : ""}
          </article>`,
      },
      ahead: { icon: "ahead", title: "Les 7 prochains jours", en: "the week ahead", face: aheadFace(D), more: () => aheadMore(D), wide: () => aheadWide(D) },
      retention: { icon: "curve", title: "Rétention", en: "what you'd recall", face: retentionFace(R), more: R ? () => retentionMore(R) : null },
      time: {
        icon: "timer", title: "Activité", en: "study time",
        face: tileHero(`${leafSvg("leaf-ico t" + tierOf(D.streak))}${D.streak} jour${D.streak === 1 ? "" : "s"}`, `${D.streak ? "in a row" : "no streak right now"} · best ${D.best} · ≈ ${hm(D.week)} this week`)
          + `<div class="since-heat" data-m="chart" data-k="heat">${heatmap(12)}</div><p class="small muted">The last 12 weeks, a square a day: the darker, the more of the day's plan was done.</p>`,
        more: () => (timeD = timeD || timeMore(D, stats)).side,
        wide: () => (timeD = timeD || timeMore(D, stats)).wide,
      },
      grammar: {
        icon: "grammar", title: "Grammaire", en: "grammar topics",
        face: tileHero(`${gDone}<small>/${T.TOPICS.length}</small>`, `topics mastered · the ring is a topic's latest first round, the tick its target`)
          + `<div class="g-rings" data-m="chart" data-k="g-rings">${G.slice(0, 6).map((r) => `<a class="g-ring" href="#grammar.${r.tp.id}">${topicRing(r, 52)}<small>${esc(r.tp.title)}</small></a>`).join("")}</div>`,
        more: () => dashGrammar(G).side,
        wide: () => dashGrammar(G).wide + `<div class="row"><a class="btn sm" href="#grammar">All topics</a></div>`,
      },
      errors: {
        icon: "errors", title: "Fautes", en: "your mistakes",
        face: (counts.length ? tileHero(esc(CAT[counts[0][0]]), `your most frequent mistake · ×${counts[0][1].n}`) + CH.hbars(counts.slice(0, 3).map(([c, v]) => { const r = recent21.find(([k]) => k === c), n = r ? r[1].n : 0; return { label: CAT[c], sub: n ? `${n} in the last 3 weeks` : "None in the last 3 weeks", value: v.n, max: counts[0][1].n, text: String(v.n), color: "var(--red)", tip: `${CAT[c]}\n${v.n} in all · ${n} in the last 3 weeks\ne.g. ${v.ex.wrong} → ${v.ex.right}` }; }), { key: "err-top", label: "Your three most frequent kinds of mistake" }) : tileHero("—", "No mistakes logged yet"))
          + (ms.length ? `<p class="small"><a href="#grammar.mine">${msLeft} of your ${ms.length} mistakes still to fix →</a></p>` : ""),
        more: () => dashErrors(D, counts).side,
        wide: () => `<div class="dash-grid">${dashErrors(D, counts).wide}${card(6, "Récentes · recent", "The last 12, newest first", recent.length ? `<ul class="errs">${recent.map((e) => `<li><div class="fix"><span class="pen-wrong">${esc(e.wrong)}</span><span class="pen-right">${esc(e.right)}</span><span class="pill">${esc(CAT[catOf(e.category)])}</span><span class="small muted">${esc(e.src)} · ${shortDate(e.date)}</span>${e.manual ? confirmBtn("e-del-" + e.id, "Delete this error", "e-del", `data-id="${esc(e.id)}"`) : ""}</div>${e.why ? `<p class="why">${esc(e.why)}</p>` : ""}</li>`).join("")}</ul>` : hint("Nothing yet."))}</div>
          ${t3.length ? `<div class="panel stack"><p class="h3">Top 3 recurring issues <span class="small muted">· last 3 weeks</span></p>${fold("top3-how", "Comment faire · How to use it", `<p class="small muted">Saturday capstone: for each, one sentence naming exactly what goes wrong and the fix. If you can't write it in one sentence, that item needs another week.</p>`)}
            ${t3.map(([c, v]) => `<label class="field">${esc(CAT[c])} · ×${v.n} <span class="small muted" style="font-weight:400">e.g. <span class="pen-wrong">${esc(v.ex.wrong)}</span> → ${esc(v.ex.right)}</span><input type="text" id="fix-${c}" data-change="fix" data-k="${c}" value="${esc(s.fixes[c] || "")}" placeholder="What goes wrong, and the fix, in one sentence"></label>`).join("")}</div>` : ""}
          <div class="panel stack">${fold("log-error", "Ajouter une erreur · Log an error yourself", `<div class="stack">
            <div class="grid2">
              <label class="field">What you wrote<input type="text" id="e-wrong" data-input="form" data-k="e-wrong" value="${formVal("e-wrong")}" lang="fr" placeholder="je achèterai"></label>
              <label class="field">Correct form<input type="text" id="e-right" data-input="form" data-k="e-right" value="${formVal("e-right")}" lang="fr" placeholder="j'achèterai"></label>
              <label class="field">Category<select id="e-cat" data-change="form" data-k="e-cat">${Object.entries(CAT).map(([k, l]) => `<option value="${k}" ${(ui.form["e-cat"] || "elision") === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
              <label class="field">Note (optional)<input type="text" id="e-why" data-input="form" data-k="e-why" value="${formVal("e-why")}"></label>
            </div>
            <div class="row"><button class="btn" data-act="e-add">Add to the log</button></div>
          </div>`)}</div>`,
      },
      week: { icon: "eye", title: "À surveiller", en: "two mistakes to watch", face: watchFace(), more: () => watchMore() },
      vocab: {
        icon: "vocab", title: "Vocabulaire", en: "your cards",
        face: tileHero(`${D.mastered}<small>/${D.learned}</small>`, "cards mastered, a gap of 21 days or more") + (D.learned ? stageChart(D.srs, "voc-stages") : hint("Learn your first cards in Vocabulaire.")),
        more: () => vocabMore(D),
      },
      comp: {
        icon: "comp", title: "Compréhension", en: "listening and reading",
        face: tileHero(String(nComp), `set${nComp === 1 ? "" : "s"} done · your latest, then the trend`) + `<div class="cf" data-m="chart" data-k="cf">${compRow("co")}${compRow("ce")}</div>`,
        more: () => dashComp(),
      },
      writing: {
        icon: "writing", title: "Écrit", en: "Claude's scores",
        face: (() => { const l3 = D.scores.slice(-3), avg = l3.length ? l3.reduce((a, x) => a + x.score, 0) / l3.length : null; return (avg == null ? tileHero("—", "Once Claude corrects a text") : tileHero(`${CH.fr(avg, 1)}<small>/20</small>`, `the average of your last ${l3.length > 1 ? l3.length + " scores" : "score"} · NCLC ${nclcLabel(nclcOf("ee", avg))} · 10/20 is NCLC 7`)) + eePlot(D, 124); })(),
        more: () => writingMore(D),
      },
      stamps: { icon: "stamp", title: "Tampons", en: "stamps", face: stampsFace(stamps), more: () => stampsMore(stamps) },
    };
  }

  VIEWS.progress = {
    render(args) {
      const head = `<header class="stack tight"><h1 class="title">Progrès</h1>${fold("intro-progress", "Comment ça marche · How it works", `<p class="small muted">Advance on the exit criteria, not on the calendar. If a phase runs long, that tells you where the real bottleneck is.</p>`)}</header>`;
      const tab = args[0] === "history" || args[0] === "report" ? args[0] : "";
      const tabs = `<nav class="tabs" role="tablist"><a href="#progress" role="tab" aria-selected="${!tab}">Vue d'ensemble<small>overview</small></a><a href="#progress.report" role="tab" aria-selected="${tab === "report"}">Évolution<small>progress report</small></a><a href="#progress.history" role="tab" aria-selected="${tab === "history"}">Historique<small>history</small></a></nav>`;
      if (tab === "history") return historyView(head, tabs);
      if (tab === "report") return reportView(head, tabs);
      const s = settings();
      const P = T.PHASES[s.phase - 1];
      const crit = T.CRITERIA[s.phase] || [];
      const D = dashData(), E = skillEstimates(D);
      // An address like #progress.errors (the plan's Bilan blocks) opens that tile, once.
      const tok = args.join(".");
      if (args[0] && ui.applied !== "progress." + tok) { const id = BENTO_ALIAS[args[0]] || args[0]; if (BENTO_MORE.has(id)) ui.bento = id; }
      const tiles = bentoTiles(s, P, crit, D, E);
      return `<div class="wrap dash">
        ${head}
        ${tabs}
        <section class="sec" id="sec-kpis"><h2 class="sr">En bref · At a glance</h2>${dashKpis(D)}</section>
        <div class="bento">
          ${BENTO.map((band) => `<div class="band">${band.map(([id, span]) => tile(id, span, tiles[id])).join("")}</div>`).join("")}
          <p class="small muted bento-foot" style="--vtn:bt-foot">${backend.kind === "db" ? "Everything here is saved to this page on claude.ai, so it follows you to any device where you open it." : backend.kind === "server" ? "Everything here is saved in the local database (data/tcf.sqlite), separately from the claude.ai page. Claude's corrections and extra sets work only on claude.ai." : backend.kind === "local" ? "Everything here is saved in this browser only. Open the page on claude.ai to keep it with your account." : ""}</p>
        </div>
      </div>`;
    },
    after(args) {
      const tok = args.join(".");
      if (args[0] === "history") {
        const el = ui.hist.jump && document.getElementById("h-" + ui.hist.jump);
        if (el) el.scrollIntoView({ block: "start" });
        ui.hist.jump = null;
        return;
      }
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
  // Start, Pause and Resume, Reset: each has its sound, so you hear the clock do what you asked.
  function timerAct(el, kind) {
    const home = el.dataset.home, sec = Number(el.dataset.sec), label = el.dataset.label;
    if (kind === "preset") { timerSet(sec, label, home); }
    else if (kind === "reset") { tone("stop"); timerSet(timer.home === home ? timer.total : sec, label, home); }
    else {
      if (timer.home !== home) timerSet(sec, label, home);
      if (timer.running) { tone("pause"); timerPause(); } else { tone("start"); timerStart(); }
    }
    render(true);
  }

  const ACTS = {
    day: (el) => { ui.day = el.dataset.date; render(true); },
    theme: toggleTheme,
    lang: toggleLang,
    tile: (el) => bentoToggle(el.dataset.id),
    "watch-pick": (el) => watchToggle(el.dataset.k),
    "watch-save": watchSave,
    stop: (el) => { const c = busy[el.dataset.key]; if (c) c.abort(); },
    confirm: (el) => { ui.confirm = el.dataset.key; render(true); },
    "confirm-cancel": () => { ui.confirm = ""; render(true); },
    "hw-add": addHomework,
    "hw-suggest": suggestHomework,
    "hw-del": (el) => remove("homework", el.dataset.id),
    // Claude's suggestions are saved only when you add them.
    "hw-sug-add": (el) => {
      const h = arr(ui.hwSug)[Number(el.dataset.i)];
      if (!h) return;
      put("homework", uid(), { text: h.text, go: h.go || "", created: todayStr(), ts: Date.now(), done: false, src: "Suggested by Claude" });
      ui.hwSug = arr(ui.hwSug).filter((x) => x !== h);
      if (!ui.hwSug.length) ui.hwSug = null;
      render(true);
    },
    "hw-sug-clear": () => { ui.hwSug = null; render(true); },
    "hw-fb-add": (el) => {
      const w = S.writing.get(el.dataset.id), W = w && T.WRITING[w.task];
      const h = w && w.fb && arr(w.fb.homework)[Number(el.dataset.i)];
      if (!h || list("homework").some((x) => x.text === h)) return;
      put("homework", uid(), { text: h, created: todayStr(), ts: Date.now(), done: false, src: `${W ? W.name : "Écrit"} correction` });
      toast("Added to your homework.");
      render(true);
    },
    "ip-resume": (el) => ipResume(el.dataset.id),
    "plan-start": (el) => startBlock(Number(el.dataset.i)),
    "nextup-close": () => { ui.nextUp = null; render(true); },
    // L'expression du jour turns over where it is, without a redraw, so the turn plays (a link on its back just opens).
    "xp-flip": (el, e) => {
      if (e && e.target && e.target.closest && e.target.closest("a")) return;
      const fig = el.closest(".xp");
      if (!fig) return;
      const on = !fig.classList.contains("turned");
      ui.xp = on ? todayStr() : null;
      fig.classList.toggle("turned", on);
      const front = fig.querySelector(".xp-front"), back = fig.querySelector(".xp-back");
      const moveFocus = fig.contains(document.activeElement);
      if (front) front.inert = on;
      if (back) back.inert = !on;
      const btn = (on ? back : front) && (on ? back : front).querySelector(".xp-btn");
      if (moveFocus && btn) btn.focus({ preventScroll: true });
    },
    "ip-discard": (el) => ipDiscard(el.dataset.id),
    "h-filter": (el) => { ui.hist.filter = el.dataset.f; ui.hist.limit = 30; ui.hist.open = null; render(true); },
    "h-more": () => { ui.hist.limit += 30; render(true); },
    "h-open": (el) => { ui.hist.open = ui.hist.open === el.dataset.id ? null : el.dataset.id; render(true); },
    "h-close": () => { ui.hist.open = null; render(true); },
    // A Find the mistakes or Your mistakes text, opened on its page as you left it.
    "h-text": (el) => {
      const d = S.drills.get(el.dataset.id);
      const h = d && (d.topic === "hunt" ? huntRebuild(d) : mineRebuild(d));
      if (!h) { toast("This text has changed since, so it can't be shown as it was."); return; }
      if (d.topic === "hunt") ui.hunt = h; else { ui.mh = h; if (ui.drill && ui.drill.topic === "mine") ui.drill = null; }
      goTo(d.topic === "hunt" ? "#grammar.hunt" : "#grammar.mine");
      requestAnimationFrame(() => { const a = document.getElementById("drill-area"); if (a) a.scrollIntoView({ block: "start" }); });
    },
    "rep-open": (el) => { ui.rep.open = ui.rep.open === el.dataset.id ? null : el.dataset.id; render(true); },
    "rep-close": () => { ui.rep.open = null; render(true); },
    // Reading and listening attempts open on the Compréhension page, which already shows a set with your answers.
    "h-comp": (el) => { compReview(el.dataset.skill, el.dataset.id); goTo("#comp." + el.dataset.skill); window.scrollTo(0, 0); },
    // A "Review" link elsewhere opens that attempt in the history, scrolled into view.
    "h-show": (el) => {
      const f = el.dataset.f || "all", id = el.dataset.id;
      const idx = finishedAttempts().filter((x) => f === "all" || sectionOf(x.kind) === f).findIndex((x) => x.id === id);
      ui.hist = { filter: f, limit: Math.max(30, idx + 1), open: id, jump: id };
      goTo("#progress.history");
    },
    "drill-start": (el) => {
      if (el.dataset.fresh) ipDrop(el.dataset.topic === "mixed" ? "drill--mixed" : `drill--${el.dataset.topic}--${el.dataset.set}`);
      startDrill(el.dataset.topic, el.dataset.set);
    },
    "drill-gen": (el) => drillGenerate(el.dataset.topic, el.dataset.set),
    "drill-check": drillCheck,
    "drill-next": drillNext,
    "drill-pick": (el) => drillPick(Number(el.dataset.k)),
    // Pausing keeps the round; it's already saved from its first checked answer.
    "drill-quit": () => {
      const d = ui.drill;
      const kept = d && !d.done && d.src !== "retry" && ipGet(drillIpId(d));
      ui.drill = null;
      if (kept) toast("Paused. Pick it up from this page, from Today or from Progrès → Historique.");
      render(true);
    },
    "drill-close": () => { ui.drill = null; render(true); },
    "drill-retry": drillRetry,
    "mh-start": mhStart,
    "mh-tok": (el) => mhTap(Number(el.dataset.i)),
    "mh-check": mhCheck,
    "mh-pick": (el) => mhPick(Number(el.dataset.c), Number(el.dataset.o)),
    "mh-results": () => { if (ui.mh && ui.mh.saved) { ui.mh.done = true; render(true); const el = document.getElementById("drill-area"); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); } },
    "mh-close": () => { ui.mh = null; render(true); },
    "mine-prep": () => minePrepAll(),
    "mine-prep-stop": minePrepStop,
    "mine-hide": (el) => { saveSettings({ mineHidden: [...new Set(arr(settings().mineHidden).concat(el.dataset.k))] }); toast("Hidden: it won't come up in Your mistakes again."); },
    "mine-unhide": () => { saveSettings({ mineHidden: [] }); toast("Your hidden mistakes are back."); },
    "pr-start": () => huntStart(),
    "pr-again": (el) => huntStart(PR.find((x) => x.id === el.dataset.id)),
    "pr-tok": (el) => huntTap(Number(el.dataset.i)),
    "pr-check": huntCheck,
    "pr-finish": huntFinish,
    "pr-level": (el) => { ui.huntLevel = el.dataset.l; render(true); },
    "pr-close": () => { ui.hunt = null; render(true); },
    "drill-dispute": (el) => drillDispute(Number(el.dataset.k)),
    accent: (el) => insertAccent(el.dataset.ch),
    "prod-check": (el) => prodCheck(el.dataset.topic),
    "v-start": (el) => { if (el.dataset.mode === "new") ui.vTheme = (document.getElementById("v-theme") || {}).value || ui.vTheme; vocabStart(el.dataset.mode); },
    "v-show": () => { if (ui.vocab) { ui.vocab.shown = true; render(true); } },
    "v-grade": (el) => { const g = Number(el.dataset.g); gradeFx(g); vocabGrade(g); },
    "v-learn": (el) => vocabLearn(el.dataset.path),
    "v-sound": soundToggle,
    "timer-sound": () => { const on = !soundOn(); lsSet("tcf-sound", on ? "on" : "off"); if (on) tone("bell"); render(true); },
    "v-quit": () => { ui.vocab = null; render(true); },
    "v-edit": () => vocabEditOpen(),
    "v-edit-save": () => vocabEditSave(),
    "v-edit-cancel": () => vocabEditClose(),
    "v-edit-restore": () => {
      const v = ui.vocab, id = v && (v.queue[v.i] || {}).id;
      if (id && DECK.has(id)) remove("cards", id);
      if (v) v.edit = false;
      ui.confirm = "";
      toast("The card is back to the original.");
      render(true);
    },
    "v-close": () => { ui.vocab = null; render(true); },
    "v-count": (el) => { ui.vCount = Number(el.dataset.n); render(true); },
    "v-build": (el) => vocabBuild(el.dataset.theme),
    "card-del": (el) => cardDelete(el.dataset.id),
    "grab-open": () => grabOpen(),
    "grab-close": () => grabClose(),
    "grab-save": () => grabSave(),
    "grab-claude": () => grabClaude(),
    "grab-add-ex": () => grabAddEx(),
    "grab-force": () => { if (!ui.grab) return; ui.grab.force = true; paintGrab(true); const el = document.getElementById("grab-en"); if (el) el.focus({ preventScroll: true }); },
    "wt-fill": () => waitFill(),
    "ex-fill": () => exFill(),
    "fx-tag": (el) => { ui.fx.tag = el.dataset.tag; fxFilter(true); },
    // A slot lights up its words in the examples below it, and an example lights up the slots its words come from.
    // Both only mark the page, so nothing is redrawn.
    "fx-slot": (el) => { const sc = el.closest(".fx-scope"); if (!sc) return; const n = el.dataset.n; sc.dataset.lit = sc.dataset.lit === n ? "" : n; sc.dataset.lits = ""; sc.querySelectorAll(".fx-ex.on").forEach((x) => x.classList.remove("on")); },
    "fx-line": (el) => {
      const sc = el.closest(".fx-scope");
      if (!sc) return;
      const was = el.classList.contains("on");
      sc.querySelectorAll(".fx-ex.on").forEach((x) => x.classList.remove("on"));
      sc.dataset.lit = "";
      sc.dataset.lits = was ? "" : [...new Set([...el.querySelectorAll(".sw")].map((w) => w.dataset.n))].join(" ");
      if (!was) el.classList.add("on");
    },
    "fx-cacher": () => { ui.fx.cacher = !ui.fx.cacher; render(true); },
    "fx-note-del": (el) => fxNoteDel(el.dataset.id),
    "fx-note-up": (el) => fxNoteUp(el.dataset.id),
    "fx-etag": (el) => { if (ui.fx.edit) { ui.fx.edit.tag = el.dataset.tag; render(true); } },
    "fx-ins": (el) => fxInsert(el.dataset.b),
    "fx-save": () => fxSave(),
    "fx-cancel": () => fxCancel(),
    "fx-claude": () => fxClaude(),
    "fx-del": (el) => { ui.confirm = ""; remove("fiches", el.dataset.id); toast("Sheet deleted."); goTo("#fiches"); },
    "fx-restore": (el) => { ui.confirm = ""; remove("fiches", el.dataset.id); toast("Back to the original."); },
    "fx-hide": (el) => { const id = el.dataset.id; put("fiches", id, Object.assign({}, S.fiches.get(id) || {}, { hidden: true })); toast("Hidden. You can bring it back from the foot of Fiches."); goTo("#fiches"); },
    "fx-unhide": () => fxHidden().forEach((id) => { const d = Object.assign({}, S.fiches.get(id)); delete d.hidden; if (str(d.title).trim() || str(d.body).trim()) put("fiches", id, d); else remove("fiches", id); }),
    "exf-save": (el) => { if (exSave(el.dataset.id)) toast("Examples saved."); },
    "exf-skip": (el) => { delete ui.form["exf-" + el.dataset.id]; render(true); },
    "exf-save-all": () => { const n = thinCards().filter((c) => exDraft(c.id) != null && exSave(c.id)).length; toast(`Examples saved on ${n} cards.`); },
    "wt-save": (el) => {
      const r = waitSave(el.dataset.id);
      if (!r) { toast("Add the English first."); return; }
      toast(r === "merged" ? "That card was already there, so the sentence went to it." : "Saved. It comes up in your reviews from tomorrow.");
      render(true);
    },
    "wt-save-all": () => {
      const rs = waitingCards().filter((c) => waitVal(c.id, "en").trim()).map((c) => waitSave(c.id));
      const merged = rs.filter((r) => r === "merged").length;
      toast(`Saved ${rs.length}. They come up in your reviews from tomorrow.${merged ? ` ${merged} ${merged > 1 ? "were" : "was"} already a card, so the sentence went to it.` : ""}`);
      render(true);
    },
    "wt-del": (el) => cardDelete(el.dataset.id),
    "v-add": () => {
      const fr = str(ui.form["card-fr"]).trim(), en = str(ui.form["card-en"]).trim();
      if (!fr || !en) { toast("Fill in both the French and the English."); return; }
      const th = ui.form["card-th"] || (document.getElementById("card-th") || {}).value || "quotidien";
      put("cards", "c-" + uid(), { fr, en, ex: str(ui.form["card-ex"]).trim(), theme: th, created: todayStr(), by: "you" });
      ui.form["card-fr"] = ui.form["card-en"] = ui.form["card-ex"] = "";
      toast("Card added. It shows up under New cards for its theme.");
      render(true);
    },
    "w-next": () => { if (wDraftGuard("w-next")) return; const t = ui.w.task; ui.w.gen[t] = null; ui.w.idx[t]++; render(true); },
    "w-gen": () => { if (wDraftGuard("w-gen")) return; render(true); writingGenPrompt(); },
    "w-skeleton": () => {
      const t = ui.w.task, W = T.WRITING[t];
      const cur = ui.w.text[t] || "";
      ui.w.text[t] = cur.trim() ? cur.replace(/\s*$/, "\n\n") + W.skeleton : W.skeleton;
      writingKeep(t, 0);
      render(true);
      const ta = document.getElementById("w-text");
      if (ta) ta.focus();
    },
    "w-correct": writingCorrect,
    "w-copy": writingCopy,
    "w-copy-close": () => { ui.w.copyOut = null; render(true); },
    "w-save": writingSave,
    "w-clear": () => { const t = ui.w.task; ipDrop("writing--" + t); ui.w.text[t] = ""; ui.w.checks[t] = {}; ui.confirm = ""; render(true); },
    "w-open": (el) => { ui.w.viewing = el.dataset.id; render(true); const fe = document.getElementById("w-fb"); if (fe) fe.scrollIntoView({ block: "start", behavior: "smooth" }); },
    "w-close": () => { ui.w.viewing = null; render(true); },
    "w-del": (el) => { if (ui.w.viewing === el.dataset.id) ui.w.viewing = null; ui.confirm = ""; remove("writing", el.dataset.id); },
    // The Examen blanc EE (#writing.mock).
    "ee-start": eeStart,
    "ee-new": () => { ui.ee = null; eeStart(); },
    "ee-task": (el) => eeSwitch(el.dataset.t),
    "ee-hand-in": (el) => { if (el.dataset.force && ui.ee) ui.ee.confirm = true; eeHandIn(); },
    "ee-keep": () => { if (ui.ee) ui.ee.confirm = false; render(true); },
    "ee-quit": () => { ui.confirm = ""; eeQuit(); },
    "ee-correct": (el) => eeCorrect(el.dataset.id || (ui.ee && ui.ee.id)),
    "ee-copy": (el) => eeCopy(el.dataset.id),
    "ee-open": (el) => { ui.ee = { id: el.dataset.id, done: true, view: null }; render(true); window.scrollTo(0, 0); },
    "ee-close": () => { ui.ee = null; ui.eeCopyOut = null; render(true); },
    "ee-view": (el) => { if (ui.ee) ui.ee.view = ui.ee.view === el.dataset.id ? null : el.dataset.id; render(true); const f = document.getElementById("w-fb"); if (f && ui.ee && ui.ee.view) f.scrollIntoView({ block: "start", behavior: "smooth" }); },
    "ee-view-close": () => { if (ui.ee) ui.ee.view = null; render(true); },
    "timer-toggle": (el) => {
      // The mock's minutes per task count only while its clock runs.
      if (el.dataset.home === EE_HOME) eeTally();
      timerAct(el, "toggle");
      if (el.dataset.home === "comp.ce.exam") examKeep();
      if (el.dataset.home === EE_HOME) { eeTally(); eeKeep(); }
    },
    "timer-reset": (el) => timerAct(el, "reset"),
    "timer-preset": (el) => timerAct(el, "preset"),
    "free-done": (el) => {
      const t = todayStr(), n = () => (dayStats(t) || {}).n || 0, before = n(), sk = el.dataset.skill;
      autoTick(`comp.free.${sk}`);
      if (n() === before) autoTick(`comp.free.${sk === "co" ? "ce" : "co"}`);
      if (n() === before) toast("Nothing to tick: today's plan has no open easy listening or reading block.");
      render(true);
    },
    "c-level": (el) => { ui.c.lv[ui.c.skill] = el.dataset.l; render(true); },
    "c-next": (el) => {
      const sk = el.dataset.skill, key = compKey(sk), cur = ui.c.set[sk];
      const after = cur && cur.src === "sample" ? cur.sampleIdx : -1;
      let i = findSample(sk, compLevel(sk), ui.c.theme, after);
      if (i < 0) i = findSample(sk, compLevel(sk), "", after);
      if (i < 0) i = after + 1;
      compReset(sk);
      ui.c.set[sk] = sampleSet(sk, i, key);
      if (ui.c.theme && !arr(ui.c.set[sk].themes).includes(ui.c.theme)) ui.c.set[sk].fallback = true;
      compRestore(sk);
      render(true);
    },
    "c-new": (el) => { const sk = el.dataset.skill; const key = compKey(sk); delete ui.c.cache[key]; delete ui.c.failed[key]; compReset(sk); ui.c.set[sk] = null; compGenerate(sk); },
    "c-submit": (el) => compSubmit(el.dataset.skill),
    "c-hide": (el) => compAnsToggle(el.dataset.skill, false),
    "c-show": (el) => compAnsToggle(el.dataset.skill, true),
    "c-reset": (el) => { const sk = el.dataset.skill; compReset(sk); if (ui.c.set[sk]) prepSet(ui.c.set[sk]); render(true); },
    "c-play": coPlay,
    "c-pause": coPause,
    "c-resume": coResume,
    "c-stop": () => { stopAudio(); render(true); },
    "c-skip": (el) => { if (audioEl) { coSeek((audioEl.currentTime || 0) + Number(el.dataset.d)); coSeekDone(); } },
    "c-script": () => { ui.c.script = !ui.c.script; render(true); },
    "c-gap": (el) => compGap(ui.c.skill, el.dataset.i, el.dataset.k),
    "c-log": (el) => {
      const sc = Number(ui.form["cl-score"]), tot = Number(ui.form["cl-total"]);
      if (!(tot > 0) || !(sc >= 0) || sc > tot) { toast("Enter a score and a total, with the score no higher than the total."); return; }
      put("comp", uid(), { skill: el.dataset.skill, level: compLevel(el.dataset.skill), title: str(ui.form["cl-src"]).trim() || "Outside practice", date: todayStr(), ts: Date.now(), score: sc, total: tot, src: "logged", gaps: {} });
      ui.form["cl-score"] = ui.form["cl-total"] = ui.form["cl-src"] = "";
      toast("Score logged.");
      render(true);
    },
    "c-open": (el) => { if (compLoad(el.dataset.skill, el.dataset.set)) { render(true); window.scrollTo({ top: 0, behavior: "smooth" }); } },
    "c-review": (el) => { compReview(el.dataset.skill, el.dataset.id); render(true); window.scrollTo({ top: 0, behavior: "smooth" }); },
    "c-hist-jump": () => { const h = document.getElementById("c-hist"); if (h) h.scrollIntoView({ behavior: "smooth", block: "start" }); },
    "x-start": (el) => { for (const sk of ["ce", "co"]) { const e = XSPEC[sk].bank().find((x) => x.id === el.dataset.id); if (e) { examStart(e, sk); return; } } },
    "x-start-ready": () => { if (ui.cxReady) examStart(ui.cxReady); },
    "x-gen": examGenerate,
    "x-gen-stop": () => { const c = busy["cx-gen"]; ui.cxGen = null; if (c) c.abort(); render(true); },
    "x-go": (el) => { if (ui.cx) { ui.cx.i = Number(el.dataset.i); ui.cx.confirm = false; render(true); } },
    "x-prev": () => { if (ui.cx && ui.cx.i > 0) { ui.cx.i--; render(true); window.scrollTo(0, 0); } },
    "x-next": () => { if (ui.cx && ui.cx.i < ui.cx.exam.items.length - 1) { ui.cx.i++; render(true); window.scrollTo(0, 0); } },
    "x-finish": () => {
      const cx = ui.cx;
      if (!cx || cx.done) return;
      if (Object.keys(cx.ans).length < cx.exam.items.length && !cx.confirm) { cx.confirm = true; render(true); return; }
      examSubmit("done");
    },
    "x-submit": () => examSubmit("done"),
    "x-keep": () => { if (ui.cx) { ui.cx.confirm = false; ui.cx.quit = false; render(true); } },
    "x-quit": () => { if (ui.cx) { ui.cx.quit = true; render(true); } },
    "x-quit-yes": () => { const sk = skillOf(ui.cx); if (sk === "co") coxStop(); ui.cx = null; ipDrop(XSPEC[sk].ip); timerSet(0, "", ""); render(true); },
    "x-review": (el) => examReview(el.dataset.id),
    "x-close": () => { ui.cx = null; render(true); window.scrollTo(0, 0); },
    "x-hide": () => { const cx = ui.cx; if (cx && cx.done) { ansHide(cx.exam.id, true); render(true); } },
    "x-show": () => { const cx = ui.cx; if (cx && cx.done) { ansHide(cx.exam.id, false); render(true); } },
    // The same exam again, from its results: a built-in one from the bank, one of Claude's from the copy on screen.
    "x-retake": () => { const cx = ui.cx; if (!cx) return; const sk = skillOf(cx); examStart(XSPEC[sk].bank().find((e) => e.id === cx.exam.id) || cx.exam, sk); },
    "cox-pause": () => { tone("pause"); coxPause(); },
    "cox-resume": () => { tone("start"); coxResume(); },
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
    "c-seek": () => coSeekDone(),
    "fx-for": (el) => { if (ui.fx.edit) ui.fx.edit.for = el.value; },
    tick: (el) => {
      const d = el.dataset.date, was = dayComplete(d);
      setBlock(d, el.dataset.key, el.checked);
      if (!was && dayComplete(d)) ui.thunk = d;
    },
    "hw-done": (el) => { const cur = S.homework.get(el.dataset.id); if (cur) put("homework", el.dataset.id, Object.assign(clone(cur), { done: el.checked, doneOn: el.checked ? todayStr() : null })); },
    "w-check": (el) => { ui.w.checks[ui.w.task][el.dataset.k] = el.checked; if (str(ui.w.text[ui.w.task]).trim()) writingKeep(ui.w.task, 0); },
    crit: (el) => { const s = settings(); s.criteria[el.dataset.id] = el.checked; saveSettings({ criteria: s.criteria }); },
    "start-date": (el) => { if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) saveSettings({ startDate: el.value }); },
    fix: (el) => { const s = settings(); s.fixes[el.dataset.k] = el.value.trim(); saveSettings({ fixes: s.fixes }); },
    form: (el) => { ui.form[el.dataset.k] = el.value; },
    "grab-theme": (el) => { if (ui.grab) ui.grab.theme = el.value; },
    "v-theme": (el) => { ui.vTheme = el.value; render(true); },
    "c-theme": (el) => { ui.c.theme = el.value; render(true); },
    "c-ans": (el) => { ui.c.ans[ui.c.skill][Number(el.dataset.i)] = Number(el.dataset.k); compKeep(ui.c.skill); },
    // Updates the navigator in place rather than re-rendering, so the chosen option keeps focus.
    "x-ans": (el) => {
      const cx = ui.cx;
      if (!cx || cx.done) return;
      cx.ans[cx.i] = Number(el.dataset.k);
      const b = document.querySelector(`.qnav [data-i="${cx.i}"]`);
      if (b) { b.classList.add("done"); b.setAttribute("aria-label", `Question ${cx.i + 1}, answered`); }
      const c = document.getElementById("x-count");
      if (c) c.textContent = `${Object.keys(cx.ans).length} of ${cx.exam.items.length} answered`;
      const cell = document.querySelectorAll(".cox-strip span")[cx.i];
      if (cell) cell.classList.add("done");
      examKeep();
    },
  };
  const INPUTS = {
    "c-seek": (el) => coSeek(Number(el.value) || 0),
    drill: (el) => { if (ui.drill) ui.drill.given = el.value; },
    "pr-fix": (el) => { if (ui.hunt) ui.hunt.fixes[el.dataset.k] = el.value; },
    "w-text": onWText,
    "ee-text": (el) => { if (!eeRunning()) return; ui.ee.texts[ui.ee.task] = el.value; eeMeters(); eeKeep(1500); },
    "fx-q": (el) => { ui.fx.q = el.value; fxFilter(true); },
    "fx-note": (el) => { ui.fx.note = el.value; },
    "fx-f": (el) => { const d = ui.fx.edit; if (!d) return; d[el.dataset.k] = el.value; if (el.dataset.k !== "topic" && !fxPrevT) fxPrevT = setTimeout(fxPreview, 120); },
    prod: (el) => { const t = el.dataset.topic; ui.prod[t] = Object.assign({}, ui.prod[t] || {}, { text: el.value }); prodKeep(t); },
    form: (el) => { ui.form[el.dataset.k] = el.value; },
    grab: (el) => { if (ui.grab) ui.grab[el.dataset.k] = el.value; },
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = ACTS[el.dataset.act];
    if (!fn) return;
    if (el.tagName === "A") e.preventDefault();
    fn(el, e);
    tabSoon();
  });
  document.addEventListener("mousedown", (e) => { if (e.target.closest("[data-act='accent'], #grab-btn")) e.preventDefault(); });
  // In Cacher mode the answers are dotted blanks: a tap turns one over, before the slot or line under it hears the tap.
  document.addEventListener("click", (e) => {
    if (!e.target.closest) return;
    const b = e.target.closest(".fx-sheet.cacher td:not(:first-child):not(.shown)") || e.target.closest(".fx-sheet.cacher :is(.chip, mark.hl, .pen-right):not(.shown)");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    b.classList.add("shown");
    b.querySelectorAll("mark.hl, .pen-right, .chip").forEach((x) => x.classList.add("shown"));
    const M = window.TCFMotion;
    if (M && M.reveal) M.reveal(b);
  }, true);
  // The button follows the selection once it settles, so it doesn't flicker while you drag across the words.
  document.addEventListener("selectionchange", () => { clearTimeout(grabT); grabT = setTimeout(grabCheck, 250); });
  if (grabBtn) grabBtn.addEventListener("pointerdown", () => { grabHold = Date.now(); });
  window.addEventListener("resize", () => { if (grabBtn && !grabBtn.hidden) grabCheck(); });
  // Keep the history tree's open branches across re-renders. "toggle" doesn't bubble, so listen while it's captured.
  document.addEventListener("toggle", (e) => { const d = e.target; if (d && d.dataset && d.dataset.node) ui.c.open[d.dataset.node] = d.open; }, true);
  // A fold remembers only what you did with it, so it's noted on the click (before it opens or closes), not on
  // "toggle", which also fires for folds a redraw draws open.
  document.addEventListener("click", (e) => { const s = e.target.closest && e.target.closest("summary"), d = s && s.parentElement; if (d && d.dataset && d.dataset.fold) FOLD[d.dataset.fold] = !d.open; }, true);
  document.addEventListener("change", (e) => {
    const el = e.target;
    const fn = el.dataset && CHANGES[el.dataset.change];
    if (fn) fn(el, e);
    tabSoon();
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    const fn = el.dataset && INPUTS[el.dataset.input];
    if (fn) fn(el, e);
    tabSoon();
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
    if (ui.grab && t && t.closest && t.closest("#grab")) {
      if (e.key === "Escape") { e.preventDefault(); grabClose(); }
      else if (e.key === "Enter" && !e.isComposing && (e.metaKey || e.ctrlKey || t.tagName === "INPUT") && (ui.grab.force || !ui.grab.dup)) { e.preventDefault(); grabSave(); }
      return;
    }
    if (ui.grab && e.key === "Escape" && !(route.view === "vocab" && ui.vocab && ui.vocab.edit)) { e.preventDefault(); grabClose(); return; }
    // Esc closes the overview's open tile.
    if (e.key === "Escape" && route.view === "progress" && !route.args.some((a) => a === "history" || a === "report") && ui.bento && !isTyping(t)) { e.preventDefault(); bentoToggle(ui.bento); return; }
    if (t && t.id === "fx-note-in" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); fxNoteAdd(); return; }
    if (route.view === "fiches" && ui.fx.edit && (route.args[0] === "new" || route.args[1] === "edit")) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); fxSave(); return; }
      if (e.key === "Escape") { e.preventDefault(); if (fxDirty()) toast("You have unsaved changes: ⌘↵ saves them, Cancel throws them away."); else fxCancel(); return; }
    }
    if (t && t.id === "drill-in" && e.key === "Enter") { e.preventDefault(); if (ui.drill && ui.drill.checked) drillNext(); else drillCheck(); return; }
    if (t && t.id === "hw-new" && e.key === "Enter") { e.preventDefault(); addHomework(); return; }
    if (t && t.dataset && t.dataset.input === "pr-fix" && e.key === "Enter") {
      e.preventDefault();
      const all = [...document.querySelectorAll('[data-input="pr-fix"]')], next = all[all.indexOf(t) + 1];
      if (next) next.focus(); else huntFinish();
      return;
    }
    if (route.view === "vocab" && ui.vocab && ui.vocab.edit) {
      if (e.key === "Escape") { e.preventDefault(); vocabEditClose(); }
      else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); vocabEditSave(); }
      return;
    }
    if (route.view === "comp" && route.args[1] === "exam" && examRunning() && skillOf(ui.cx) === "co" && !isTyping(t) && !(t && t.closest && t.closest("#grab")) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const cx = ui.cx, it = cx.exam.items[cx.i], p = cx.play || {};
      const k = "abcd".indexOf(e.key.toLowerCase()) >= 0 ? "abcd".indexOf(e.key.toLowerCase()) : "1234".indexOf(e.key);
      if (k >= 0 && !p.paused) {
        e.preventDefault();
        const opt = it.order[k];
        cx.ans[cx.i] = opt;
        const el = document.querySelector(`input[name="x${cx.i}"][data-k="${opt}"]`);
        if (el) el.checked = true;
        const b = document.querySelectorAll(".cox-strip span")[cx.i];
        if (b) b.classList.add("done");
        examKeep();
        return;
      }
      if (e.key === " " && !(t && t.closest && t.closest("button, a, label"))) { e.preventDefault(); if (p.paused) { tone("start"); coxResume(); } else { tone("pause"); coxPause(); } return; }
    }
    if (t && t.closest && t.closest("input, textarea, select, button, a, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (route.view === "grammar" && route.args[0] === "mine" && ui.mh && ui.mh.found && !ui.mh.done && !(ui.drill && ui.drill.topic === "mine")) {
      const h = ui.mh, cur = mhShown(h).find((ci) => h.pick[ci] == null);
      if (cur != null && /^[1-9]$/.test(e.key)) { const pos = Number(e.key) - 1, c = h.cards[cur]; if (pos < c.order.length) { e.preventDefault(); mhPick(cur, c.order[pos]); } return; }
      if (cur == null && e.key === "Enter" && h.saved) { e.preventDefault(); ACTS["mh-results"](); return; }
    }
    if (route.view === "grammar" && ui.drill && !ui.drill.done) {
      const it = ui.drill.items[ui.drill.i];
      if (e.key === "Enter" && ui.drill.checked) { e.preventDefault(); drillNext(); }
      else if (!ui.drill.checked && it.kind === "choice" && /^[1-9]$/.test(e.key)) { const pos = Number(e.key) - 1; if (pos < it.order.length) { e.preventDefault(); drillPick(it.order[pos]); } }
      return;
    }
    if (route.view === "vocab" && ui.vocab && !ui.vocab.finished) {
      const v = ui.vocab, step = v.queue[v.i] || {};
      if (e.key === "e" || e.key === "E") { e.preventDefault(); vocabEditOpen(); return; }
      if (e.key === "m" || e.key === "M") { e.preventDefault(); soundToggle(); return; }
      if (step.k === "show") { if (e.key === "2" || e.key === "Enter") { e.preventDefault(); vocabLearn("learn"); } else if (e.key === "3") { e.preventDefault(); vocabLearn("known"); } return; }
      if (!v.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); v.shown = true; render(true); }
      else if (v.shown && /^[1-4]$/.test(e.key)) { e.preventDefault(); gradeFx(Number(e.key)); vocabGrade(Number(e.key)); }
      else if (v.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); gradeFx(G.good); vocabGrade(G.good); }
    }
  });
  // The navigation's order, for the way a new page slides in (motion.js): forward to the left, back to the right,
  // and a page within the same section rises in place.
  const NAV_ORDER = ["today", "grammar", "vocab", "fiches", "writing", "comp", "progress"];
  const pageDir = (a, b) => (a.view === b.view ? "up" : NAV_ORDER.indexOf(b.view) > NAV_ORDER.indexOf(a.view) ? "fwd" : "back");
  window.addEventListener("hashchange", () => {
    const r = parseRoute(location.hash);
    if (examRunning() && skillOf(ui.cx) === "co" && !(r.view === "comp" && r.args[0] === "co" && r.args[1] === "exam")) coxPause(true);
    const same = r.view === route.view && r.args.join(".") === route.args.join(".");
    const from = route;
    route = r;
    rememberPage();
    ui.confirm = "";
    ui.applied = "";
    const draw = () => {
      render(true);
      if (!same && !(r.view === "progress" && r.args[0])) window.scrollTo(0, 0);
    };
    const M = window.TCFMotion;
    if (!same && M && M.transition) M.transition(draw, pageDir(from, r)); else draw();
  });

  /* =============== boot =============== */
  function boot() {
    route = parseRoute(location.hash || rememberedPage());
    rememberPage();
    tabRestore();
    render(true);
    const c = window.claude;
    if (!c || typeof c.use !== "function") { claudeState = "none"; tryServer().then((ok) => { if (!ok) useLocal(); }); return; }
    c.use("sample").then((s) => { sample = s || null; claudeState = s ? "ready" : "none"; render(false); }, () => { claudeState = "none"; render(false); });
    c.use("db").then((db) => { if (db) useDb(db); else useLocal(); }, () => useLocal());
  }
  boot();
})();
