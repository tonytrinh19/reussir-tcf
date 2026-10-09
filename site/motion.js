/* Motion for Réussir le TCF.
   app.js redraws a whole page as HTML on every change, so an animation written in CSS would replay on every redraw.
   This file runs after each redraw (the "tcf:render" event) and animates only what's new:
   - the page's entrance, when you open another page;
   - elements marked data-m (rise, pop, slide, shake, tick, burst) whose key (data-k) wasn't on screen in the
     previous redraw, so a question animates when it appears and not again on every save. Press, fly, draw, deal
     and chart (the stamps, the boarding pass's plane and route, the overview's tiles and its charts) belong to a
     page's entrance and also play as it opens; below the fold they wait, still, until you scroll to them;
   - bars, rings and numbers marked data-tween, from the value they had before (data-tw: width, ring or count).
   It also slides one page out and the next in when you change page (TCFMotion.transition), glides the navigation
   highlight, slides the toast in and out, opens folds gently, throws the maple leaves (TCFMotion.burst), lights up
   cards and tilts tiles under a mouse, and runs the overview's section bar (a tap scrolls to the section; the pill
   follows the one you're reading). On the Fiches it slides the cards into place as you filter them, peels a note
   off the board and turns over a blank you tap in Cacher mode. It only reads the page, moves it and scrolls it: it never writes data, calls
   the app or stores anything, and the site works the same without it. With reduced motion asked for, nothing
   moves. */
(() => {
  "use strict";
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const fine = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;
  const still = () => !!(mq && mq.matches) || typeof Element.prototype.animate !== "function";
  const EASE = "cubic-bezier(.2, .8, .2, 1)";
  const POP = "cubic-bezier(.34, 1.56, .64, 1)";
  const safe = (fn) => { try { return fn(); } catch (e) { console.warn("motion:", e); } };

  const KINDS = {
    rise: (el, i) => el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 280, delay: Math.min(i, 8) * 40, easing: EASE, fill: "backwards" }),
    pop: (el) => el.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "scale(1.03)", offset: 0.6 }, { opacity: 1, transform: "none" }], { duration: 340, easing: EASE }),
    slide: (el) => el.animate([{ opacity: 0, transform: "translateX(16px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: EASE }),
    shake: (el) => el.animate([{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }], { duration: 380, easing: "ease-out" }),
    // A tick: the circle pops and the check mark draws itself.
    tick: (el) => {
      const box = el.previousElementSibling, out = [];
      if (box) out.push(box.animate([{ transform: "scale(.75)" }, { transform: "scale(1.15)", offset: 0.55 }, { transform: "none" }], { duration: 360, easing: EASE }));
      const p = el.querySelector("path");
      if (p) out.push(p.animate([{ strokeDashoffset: 18 }, { strokeDashoffset: 0 }], { duration: 300, delay: 90, easing: EASE, fill: "backwards" }));
      return out;
    },
    burst: (el) => burst(el),
    // A stamp pressed onto the page, one after another (the scale property keeps its tilt).
    press: (el, i) => el.animate([{ scale: "1.35", opacity: 0 }, { scale: ".94", opacity: 1, offset: 0.6 }, { scale: "1", opacity: 1 }], { duration: 420, delay: 160 + Math.min(i, 10) * 70, easing: EASE, fill: "backwards" }),
    // The boarding pass's plane flies along its route to this week (data-dx: how far it has come).
    fly: (el) => { const dx = Number(el.getAttribute("data-dx")) || 0; return dx > 0 ? el.animate([{ translate: `${-dx}px 0` }, { translate: "0 0" }], { duration: 900, delay: 150, easing: EASE, fill: "backwards" }) : null; },
    // A line that draws itself: the part of the route already flown.
    draw: (el) => { const L = el.getTotalLength ? el.getTotalLength() : 0; return L ? el.animate([{ strokeDasharray: `${L}`, strokeDashoffset: L }, { strokeDasharray: `${L}`, strokeDashoffset: 0 }], { duration: 900, delay: 150, easing: EASE, fill: "backwards" }) : null; },
    // A tile dealt onto the table, one after another (the overview's headline numbers).
    deal: (el, i) => el.animate([{ opacity: 0, transform: "translateY(16px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: 60 + Math.min(i, 8) * 70, easing: POP, fill: "backwards" }),
    chart: (el) => chartIn(el),
    // The Fiches: a note taped on drops in and settles with a small bounce (translate and scale, so it keeps its tilt);
    // a red-pen line draws itself under a heading; an order chain's slots pop in one by one, left to right; a
    // table's rows come in one after another.
    pin: (el, i) => el.animate([{ opacity: 0, translate: "0 -22px", scale: "1.08" }, { opacity: 1, translate: "0 3px", scale: "1", offset: 0.7 }, { opacity: 1, translate: "0 0", scale: "1" }], { duration: 560, delay: 60 + Math.min(i, 8) * 80, easing: POP, fill: "backwards" }),
    ink: (el) => el.animate([{ scale: "0 1" }, { scale: "1 1" }], { duration: 700, delay: 140, easing: EASE, fill: "backwards" }),
    slots: (el) => [...el.children].map((c, i) => c.animate([{ opacity: 0, scale: ".7", translate: "0 10px" }, { opacity: 1, scale: "1.06", translate: "0 0", offset: 0.6 }, { opacity: 1, scale: "1", translate: "0 0" }], { duration: 480, delay: 100 + i * 85, easing: POP, fill: "backwards" })),
    rows: (el) => [...el.querySelectorAll("tbody tr")].map((r, i) => r.animate([{ opacity: 0, translate: "-10px 0" }, { opacity: 1, translate: "0 0" }], { duration: 340, delay: 80 + Math.min(i, 12) * 50, easing: EASE, fill: "backwards" })),
    // The red pen (Your mistakes): what you wrote is crossed out, a stroke after another, then the correction is
    // written in, the ink soaking into the paper.
    pen: (el) => {
      const dels = [...el.querySelectorAll("del")], ins = [...el.querySelectorAll("ins")], out = [];
      dels.forEach((d, i) => out.push(d.animate([{ backgroundSize: "0% 2px" }, { backgroundSize: "100% 2px" }], { duration: 280, delay: 60 + i * 110, easing: EASE, fill: "backwards" })));
      const t0 = 60 + dels.length * 110 + 80;
      ins.forEach((n, i) => out.push(n.animate([{ opacity: 0, filter: "blur(3px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 380, delay: t0 + i * 90, easing: EASE, fill: "backwards" })));
      return out;
    },
  };
  // These are part of a page's entrance, so they also play when the page opens.
  const ENTRANCE = new Set(["press", "fly", "draw", "deal", "chart", "pin", "ink", "slots", "rows"]);
  // These wait until they're on screen: there's no point drawing a chart nobody sees.
  const LATER = ENTRANCE;

  // A chart draws itself (charts.js): columns grow from the baseline, bars from the left, lines wipe in with their
  // dots popping as the line reaches them, rings sweep round, a day strip and the heatmap fill in square by square,
  // and a score slides along its scale.
  function chartIn(el) {
    const out = [];
    const add = (node, frames, o) => out.push(node.animate(frames, Object.assign({ easing: EASE, fill: "backwards" }, o)));
    el.querySelectorAll(".c-gcol").forEach((g) => add(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 }));
    const cols = el.querySelectorAll(".c-col");
    cols.forEach((c, i) => add(c, [{ scale: "1 0" }, { scale: "1 1" }], { duration: 560, delay: 60 + i * Math.min(40, 520 / cols.length) }));
    el.querySelectorAll(".c-ht > i").forEach((b, i) => add(b, [{ scale: "0 1" }, { scale: "1 1" }], { duration: 640, delay: 80 + Math.min(i, 12) * 55 }));
    el.querySelectorAll(".c-bar").forEach((b) => add(b, [{ clipPath: "inset(0 100% 0 0 round 999px)" }, { clipPath: "inset(0 0 0 0 round 999px)" }], { duration: 820, delay: 80 }));
    el.querySelectorAll(".c-svg, .c-spark").forEach((s) => add(s, [{ clipPath: "inset(-20% 100% -20% -2%)" }, { clipPath: "inset(-20% -4% -20% -2%)" }], { duration: 900, delay: 120, easing: "cubic-bezier(.45, 0, .2, 1)" }));
    el.querySelectorAll(".c-dot").forEach((d) => { const x = (parseFloat(d.style.left) || 0) / 100; add(d, [{ scale: "0", opacity: 0 }, { scale: "1.35", opacity: 1, offset: 0.6 }, { scale: "1", opacity: 1 }], { duration: 420, delay: 140 + x * 780, easing: POP }); });
    el.querySelectorAll(".c-end, .c-ref, .c-band").forEach((n) => add(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 640 }));
    el.querySelectorAll(".c-rfill").forEach((r, i) => { const C = Number(r.getAttribute("data-c")) || 0, p = Number(r.getAttribute("data-p")) || 0; if (C && p) add(r, [{ strokeDashoffset: C }, { strokeDashoffset: C * (1 - p) }], { duration: 900, delay: 100 + Math.min(i, 16) * 45 }); });
    const cells = el.querySelectorAll(".c-cells > i, .heat > i");
    cells.forEach((c, i) => add(c, [{ opacity: 0, scale: ".3" }, { opacity: 1, scale: "1" }], { duration: 320, delay: 40 + i * Math.min(12, 700 / cells.length), easing: POP }));
    el.querySelectorAll(".c-mark").forEach((m) => add(m, [{ left: "0%", opacity: 0 }, { opacity: 1, offset: 0.12 }, { left: m.style.left, opacity: 1 }], { duration: 1000, delay: 220 }));
    el.querySelectorAll(".c-ghost").forEach((g, i) => add(g, [{ opacity: 0, scale: ".4" }, { opacity: 1, scale: "1" }], { duration: 300, delay: 320 + i * 70 }));
    return out;
  }

  /* ---------- after each redraw ---------- */
  let seen = new Set(); // the data-m keys on screen after the previous redraw
  const done = new Set(); // bursts already thrown during this visit
  const tweens = new Map(); // data-tween key → the value it showed last
  let lastPage = null, lastReady = false;

  function onRender(e) {
    const d = (e && e.detail) || {};
    const view = document.getElementById("view");
    if (!view) return;
    // A new page, or the first drawing with your progress loaded, enters as a whole; inside it nothing else moves.
    const entering = d.page !== lastPage || (!!d.ready && !lastReady);
    lastPage = d.page;
    lastReady = !!d.ready;
    safe(() => setClock(view));
    safe(() => placePill(entering));
    safe(() => spy(true));
    if (tilted && !tilted.isConnected) tilted = null;
    const now = new Set(), fresh = [], again = [];
    view.querySelectorAll("[data-m][data-k]").forEach((el) => {
      const k = el.getAttribute("data-m") + "|" + el.getAttribute("data-k");
      now.add(k);
      if (!seen.has(k)) fresh.push(el);
      else if (waitKeys.has(k)) again.push(el);
    });
    seen = now;
    // Until your progress has loaded the page is drawn with defaults, so it waits there, still, and comes in once.
    if (!d.ready) return;
    if (still()) { safe(() => tween(view, true, false)); return; }
    if (entering) {
      safe(forget);
      // A page that slides in as a whole (a page change) doesn't also rise section by section.
      if (!vt) safe(() => enter(view));
      safe(() => playFresh(fresh.filter((el) => ENTRANCE.has(el.getAttribute("data-m"))), true));
    } else {
      // Something still waiting to be seen when the page redrew waits on in its new copy.
      safe(() => { prune(now); playFresh(again, true); });
      safe(() => playFresh(fresh));
    }
    safe(() => tween(view, false, entering));
  }

  // Rémy's idle cycles (index.html) all run on one clock, so redrawing the page doesn't restart them.
  function setClock(view) {
    const v = -Math.round(performance.now()) + "ms";
    view.style.setProperty("--clock", v);
    const foot = document.getElementById("rail-foot");
    if (foot) foot.style.setProperty("--clock", v);
  }

  function enter(view) {
    const wrap = view.firstElementChild;
    if (!wrap) return;
    const parts = wrap.classList.contains("wrap") ? [...wrap.children] : [wrap];
    parts.forEach((el, i) => KINDS.rise(el, i));
  }

  function playFresh(fresh, inside) {
    const set = new Set(fresh);
    const n = {}; // each kind counts its own, so a row of stamps or tiles comes in one after another
    fresh.forEach((el) => {
      const kind = el.getAttribute("data-m");
      const fn = KINDS[kind];
      if (!fn) return;
      if (kind === "burst") {
        const k = el.getAttribute("data-k");
        if (done.has(k)) return;
        done.add(k);
        safe(() => fn(el));
        return;
      }
      // Inside something that's already coming in, one movement is enough (an entrance's own parts excepted).
      if (!inside) for (let p = el.parentElement; p && p.id !== "view"; p = p.parentElement) if (set.has(p) && p.getAttribute("data-m") !== "burst") return;
      const i = n[kind] || 0;
      n[kind] = i + 1;
      if (LATER.has(kind)) safe(() => later(el, kind, i));
      else safe(() => fn(el, i));
    });
  }

  /* ---------- waiting until it's seen ---------- */
  // An entrance below the fold is set up paused at its start and plays when it scrolls into view.
  const waiting = new Map(); // element → what starts it
  let waitKeys = new Set(); // the data-m keys of what's waiting, so a redraw can carry them over
  let io = null;
  function inView(el) {
    const r = el.getBoundingClientRect();
    return (r.width || r.height) && r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
  }
  function whenSeen(el, start, key) {
    if (inView(el) || typeof IntersectionObserver !== "function") { start(); return; }
    if (!io) io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const w = waiting.get(en.target);
      io.unobserve(en.target);
      waiting.delete(en.target);
      if (w) { waitKeys.delete(w.key); safe(w.start); }
    }), { rootMargin: "0px 0px -10% 0px" });
    waiting.set(el, { start, key });
    if (key) waitKeys.add(key);
    io.observe(el);
  }
  function later(el, kind, i) {
    const key = kind + "|" + el.getAttribute("data-k");
    waitKeys.delete(key);
    const anims = [].concat(KINDS[kind](el, i) || []).filter(Boolean);
    if (!anims.length || inView(el)) return;
    anims.forEach((a) => a.pause());
    whenSeen(el, () => anims.forEach((a) => a.play()), key);
  }
  // A new page starts with nothing waiting; a redraw lets go of the copies it replaced.
  function forget() {
    if (io) waiting.forEach((w, el) => io.unobserve(el));
    waiting.clear();
    waitKeys = new Set();
  }
  function prune(keys) {
    waiting.forEach((w, el) => { if (!el.isConnected) { if (io) io.unobserve(el); waiting.delete(el); } });
    waitKeys.forEach((k) => { if (!keys.has(k)) waitKeys.delete(k); });
  }

  function tween(view, instant, entering) {
    view.querySelectorAll("[data-tween]").forEach((el) => {
      const key = el.getAttribute("data-tween"), to = Number(el.getAttribute("data-to"));
      if (!isFinite(to)) return;
      const from = !entering && tweens.has(key) ? tweens.get(key) : Number(el.getAttribute("data-from") || 0);
      tweens.set(key, to);
      if (instant || from === to) return;
      const kind = el.getAttribute("data-tw");
      if (kind === "ring") {
        const c = Number(el.getAttribute("data-c")) || 0;
        el.animate([{ strokeDashoffset: c * (1 - from / 100) }, { strokeDashoffset: c * (1 - to / 100) }], { duration: 700, easing: EASE });
      } else if (kind === "width") {
        el.animate([{ width: from + "%" }, { width: to + "%" }], { duration: 500, easing: EASE });
      } else if (kind === "count") {
        const text = el.textContent;
        // A number below the fold counts up when you get to it.
        if (entering && !inView(el) && typeof IntersectionObserver === "function") {
          el.textContent = String(from);
          whenSeen(el, () => countUp(el, from, to, text));
        } else countUp(el, from, to, text);
      }
    });
  }

  // A score counts up to its value; the text the page drew comes back exactly at the end.
  function countUp(el, from, to, text) {
    const t0 = performance.now(), dur = Math.min(900, 300 + Math.abs(to - from) * 40);
    const step = (t) => {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { el.textContent = text; return; }
      el.textContent = String(Math.round(from + (to - from) * e));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- changing page ---------- */
  // The old page slides out and the new one slides in (the View Transitions API): forward along the navigation to
  // the left, back to the right, and a page within the same section rises in place ("fwd", "back", "up"). The
  // sidebar stays still (index.html). Without the API, with reduced motion, or in a tab in the background, the new
  // page is simply drawn.
  let vt = null;
  function transition(update, dir) {
    if (still() || document.hidden || typeof document.startViewTransition !== "function") { update(); return; }
    const root = document.documentElement;
    let t = null;
    try {
      root.setAttribute("data-vt", dir || "up");
      t = document.startViewTransition(update);
    } catch (e) {
      root.removeAttribute("data-vt");
      if (!t) update();
      return;
    }
    vt = t;
    const end = () => { if (vt === t) { vt = null; root.removeAttribute("data-vt"); } };
    t.finished.then(end, end);
    t.ready.catch(() => {});
  }

  /* ---------- the navigation highlight ---------- */
  let pill = null;
  function placePill(instant) {
    const nav = document.querySelector(".rail .nav");
    if (!nav) return;
    if (!pill || !pill.isConnected) {
      pill = document.createElement("span");
      pill.className = "nav-pill";
      pill.setAttribute("aria-hidden", "true");
      nav.prepend(pill);
      nav.classList.add("has-pill");
      instant = true;
    }
    const cur = nav.querySelector('a[aria-current="page"]');
    if (!cur) { pill.style.opacity = "0"; return; }
    const jump = instant || still() || pill.style.opacity === "0";
    if (jump) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.width = cur.offsetWidth + "px";
    pill.style.height = cur.offsetHeight + "px";
    pill.style.transform = `translate(${cur.offsetLeft}px, ${cur.offsetTop}px)`;
    if (jump) { void pill.offsetWidth; pill.style.transition = ""; }
    // On a phone the links scroll sideways: bring the current one into view.
    if (nav.scrollWidth > nav.clientWidth + 1) {
      const l = cur.offsetLeft, r = l + cur.offsetWidth;
      if (l < nav.scrollLeft + 8 || r > nav.scrollLeft + nav.clientWidth - 8) nav.scrollTo({ left: Math.max(0, l - 24), behavior: jump ? "auto" : "smooth" });
    }
  }

  /* ---------- the overview's section bar ---------- */
  // A tap scrolls to the section (at once with reduced motion). As you scroll, the bar marks the section you're
  // reading, and its pill glides there.
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("[data-goto]") : null;
    const sec = b && document.getElementById(b.getAttribute("data-goto"));
    if (sec) sec.scrollIntoView({ behavior: still() ? "auto" : "smooth", block: "start" });
  });
  let navPill = null, spyRaf = 0;
  function spy(instant) {
    const nav = document.querySelector(".dash-nav");
    if (!nav) return;
    const btns = [...nav.querySelectorAll("[data-goto]")];
    if (!btns.length) return;
    const line = nav.getBoundingClientRect().bottom + 28;
    let cur = btns[0];
    btns.forEach((b) => { const s = document.getElementById(b.getAttribute("data-goto")); if (s && s.getBoundingClientRect().top <= line) cur = b; });
    const doc = document.documentElement;
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 4) cur = btns[btns.length - 1];
    btns.forEach((b) => { if (b === cur) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    if (!navPill || !nav.contains(navPill)) {
      navPill = document.createElement("span");
      navPill.className = "dash-pill";
      navPill.setAttribute("aria-hidden", "true");
      nav.prepend(navPill);
      instant = true;
    }
    const jump = instant || still();
    if (jump) navPill.style.transition = "none";
    navPill.style.width = cur.offsetWidth + "px";
    navPill.style.height = cur.offsetHeight + "px";
    navPill.style.transform = `translate(${cur.offsetLeft}px, ${cur.offsetTop}px)`;
    if (jump) { void navPill.offsetWidth; navPill.style.transition = ""; }
    if (nav.scrollWidth > nav.clientWidth + 1) {
      const l = cur.offsetLeft, r = l + cur.offsetWidth;
      if (l < nav.scrollLeft + 8 || r > nav.scrollLeft + nav.clientWidth - 8) nav.scrollTo({ left: Math.max(0, l - 24), behavior: jump ? "auto" : "smooth" });
    }
  }
  window.addEventListener("scroll", () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; safe(() => spy(false)); }); }, { passive: true });

  /* ---------- the overview's cards under a mouse ---------- */
  // A soft light follows the pointer across a card (--sx, --sy), and a tile tilts toward it.
  let lastMove = null, moveRaf = 0, tilted = null;
  function untilt() {
    if (!tilted) return;
    tilted.style.rotate = "";
    tilted.classList.remove("m-tilting");
    tilted = null;
  }
  function track(e) {
    const t = e.target && e.target.closest ? e.target : null;
    const on = t && !still() && !!(fine && fine.matches);
    const spot = on ? t.closest("[data-spot], .kpi") : null;
    const tilt = on ? t.closest("[data-tilt]") : null;
    if (spot) {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--sx", Math.round(e.clientX - r.left) + "px");
      spot.style.setProperty("--sy", Math.round(e.clientY - r.top) + "px");
    }
    if (tilted && tilted !== tilt) untilt();
    if (!tilt) return;
    const r = tilt.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    const deg = Math.min(1, Math.hypot(px, py) * 2) * (tilt.classList.contains("kpi") ? 5 : 7);
    tilted = tilt;
    tilt.classList.add("m-tilting");
    tilt.style.rotate = deg > 0.2 ? `${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${deg.toFixed(2)}deg` : "";
  }
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    lastMove = e;
    if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; safe(() => track(lastMove)); });
  }, { passive: true });
  document.addEventListener("pointerout", (e) => { if (!e.relatedTarget) safe(untilt); }, { passive: true });

  /* ---------- the toast ---------- */
  function watchToast() {
    const t = document.getElementById("toast");
    if (!t || typeof MutationObserver !== "function") return;
    let wasHidden = t.hidden, lastText = t.textContent;
    new MutationObserver(() => safe(() => {
      const hid = t.hidden;
      if (!hid) lastText = t.textContent;
      if (!still()) {
        if (wasHidden && !hid) t.animate([{ opacity: 0, transform: "translate(-50%, 14px) scale(.96)" }, { opacity: 1, transform: "translate(-50%, 0) scale(1)" }], { duration: 280, easing: POP });
        else if (!wasHidden && hid) fadeOut(t, lastText);
        else if (!hid) t.animate([{ transform: "translate(-50%, 0) scale(.97)" }, { transform: "translate(-50%, 0) scale(1)" }], { duration: 180, easing: EASE });
      }
      wasHidden = hid;
    })).observe(t, { attributes: true, attributeFilter: ["hidden"], childList: true, characterData: true, subtree: true });
  }
  // The toast is hidden at once by the page, so a silent copy of it fades out in its place.
  function fadeOut(t, text) {
    const g = t.cloneNode(false);
    ["id", "role", "aria-live", "hidden"].forEach((a) => g.removeAttribute(a));
    g.setAttribute("aria-hidden", "true");
    g.classList.add("toast-ghost");
    g.textContent = text;
    document.body.appendChild(g);
    const a = g.animate([{ opacity: 1, transform: "translate(-50%, 0)" }, { opacity: 0, transform: "translate(-50%, 10px)" }], { duration: 220, easing: "ease-in", fill: "forwards" });
    a.onfinish = () => g.remove();
    setTimeout(() => g.remove(), 800);
  }

  /* ---------- Save to cards, and the theme ---------- */
  // The button under a selection pops up, and the panel slides up when it opens.
  function watchGrab() {
    if (typeof MutationObserver !== "function") return;
    [["grab-btn", [{ opacity: 0, transform: "translateY(6px) scale(.9)" }, { opacity: 1, transform: "none" }], 200], ["grab", [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], 260]].forEach(([id, frames, ms]) => {
      const el = document.getElementById(id);
      if (!el) return;
      let was = el.hidden;
      new MutationObserver(() => safe(() => { if (was && !el.hidden && !still()) el.animate(frames, { duration: ms, easing: POP }); was = el.hidden; })).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    });
  }
  // Switching between light and dark fades the colours over a moment instead of snapping.
  document.addEventListener("click", (e) => {
    if (still() || !e.target.closest || !e.target.closest('[data-act="theme"]')) return;
    const root = document.documentElement;
    root.classList.add("theme-fade");
    clearTimeout(root.__mFade);
    root.__mFade = setTimeout(() => root.classList.remove("theme-fade"), 400);
  }, true);

  /* ---------- folds ---------- */
  // A fold you open shows its contents gently. Folds drawn open by a redraw stay still.
  document.addEventListener("click", (e) => {
    const s = e.target && e.target.closest ? e.target.closest("summary") : null;
    if (s && s.parentElement && s.parentElement.tagName === "DETAILS") s.parentElement.__mAt = performance.now();
  }, true);
  document.addEventListener("toggle", (e) => safe(() => {
    const d = e.target;
    if (!d || d.tagName !== "DETAILS" || !d.open || still() || !(d.__mAt && performance.now() - d.__mAt < 1000)) return;
    [...d.children].filter((c) => c.tagName !== "SUMMARY").forEach((c) => c.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: EASE }));
  }), true);

  /* ---------- the maple-leaf burst ---------- */
  const FILLS = ["var(--leaf-1)", "var(--leaf-2)", "var(--leaf-3)", "var(--leaf-4)"];
  function burst(target, opts) {
    if (still() || !target || !target.getBoundingClientRect) return;
    const r = target.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const n = (opts && opts.count) || 22;
    const box = document.createElement("div");
    box.className = "m-burst";
    box.setAttribute("aria-hidden", "true");
    box.style.left = r.left + r.width / 2 + "px";
    box.style.top = r.top + r.height / 2 + "px";
    let html = "";
    for (let i = 0; i < n; i++) html += `<svg viewBox="0 0 24 26" style="fill:${FILLS[i % FILLS.length]}"><use href="#leaf" width="24" height="26"/></svg>`;
    box.innerHTML = html;
    document.body.appendChild(box);
    let left = n;
    const gone = () => { if (--left <= 0) box.remove(); };
    [...box.children].forEach((leaf) => {
      const a = ((-90 + (Math.random() - 0.5) * 160) * Math.PI) / 180;
      const dist = 70 + Math.random() * 110, dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
      const fall = 90 + Math.random() * 130, drift = (Math.random() - 0.5) * 60;
      const rot = (Math.random() - 0.5) * 540, s = 0.55 + Math.random() * 0.6;
      const anim = leaf.animate([
        { transform: `translate(0, 0) rotate(0deg) scale(${(s * 0.4).toFixed(2)})`, opacity: 0 },
        { transform: `translate(${(dx * 0.6).toFixed(1)}px, ${(dy * 0.6).toFixed(1)}px) rotate(${(rot * 0.3).toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: 1, offset: 0.18 },
        { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(rot * 0.6).toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: 1, offset: 0.45 },
        { transform: `translate(${(dx * 1.1 + drift).toFixed(1)}px, ${(dy + fall).toFixed(1)}px) rotate(${rot.toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: 0 },
      ], { duration: 1050 + Math.random() * 450, delay: Math.random() * 70, easing: "cubic-bezier(.2, .7, .4, 1)" });
      anim.onfinish = gone;
      anim.oncancel = gone;
    });
    setTimeout(() => box.remove(), 2400);
  }

  /* ---------- the Fiches ---------- */
  // Filtering the cards: the ones that stay slide to their new places, the ones that go fold away where they
  // were (a copy fades out there, since the card itself is already hidden), and the ones that come back pop in.
  function flip(els, mutate) {
    if (still()) { mutate(); return; }
    const before = new Map();
    els.forEach((el) => { if (!el.hidden) before.set(el, el.getBoundingClientRect()); });
    mutate();
    els.forEach((el) => {
      const a = before.get(el);
      if (el.hidden) { if (a) ghost(el, a); return; }
      const b = el.getBoundingClientRect();
      if (!a) { el.animate([{ opacity: 0, scale: ".88" }, { opacity: 1, scale: "1" }], { duration: 340, easing: POP }); return; }
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) el.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 440, easing: EASE });
    });
  }
  function ghost(el, r) {
    const g = el.cloneNode(true);
    g.hidden = false;
    g.removeAttribute("id");
    g.setAttribute("aria-hidden", "true");
    Object.assign(g.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", margin: "0", pointerEvents: "none", zIndex: "5", viewTransitionName: "none" });
    document.body.appendChild(g);
    const a = g.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: ".82" }], { duration: 260, easing: "ease-in", fill: "forwards" });
    a.onfinish = () => g.remove();
    setTimeout(() => g.remove(), 700);
  }
  // A note peeled off the board: it lifts at a corner, then falls away. Resolves when it's gone.
  function peel(el) {
    return new Promise((done) => {
      if (still() || !el || !el.animate) { done(); return; }
      const a = el.animate([{ translate: "0 0", rotate: "0deg", opacity: 1 }, { translate: "6px -8px", rotate: "-7deg", opacity: 1, offset: 0.25 }, { translate: "34px 110px", rotate: "26deg", opacity: 0 }], { duration: 560, easing: "cubic-bezier(.5, 0, .75, .4)", fill: "forwards", composite: "add" });
      a.onfinish = done;
      a.oncancel = done;
      setTimeout(done, 800);
    });
  }
  // A blank in Cacher mode turned over: the answer comes into focus.
  function reveal(el) {
    if (still() || !el || !el.animate) return;
    el.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 340, easing: EASE });
  }

  window.TCFMotion = Object.freeze({ burst: (el, opts) => safe(() => burst(el, opts)), flip: (els, mutate) => { let ran = false; try { flip(els, () => { ran = true; mutate(); }); } catch (e) { console.warn("motion:", e); if (!ran) mutate(); } }, peel: (el) => peel(el).catch(() => {}), reveal: (el) => safe(() => reveal(el)), transition: (update, dir) => {
    // The page is drawn exactly once, whatever happens to the transition.
    let ran = false;
    const once = () => { if (!ran) { ran = true; update(); } };
    try { transition(once, dir); } catch (e) { console.warn("motion:", e); once(); }
  } });
  document.addEventListener("tcf:render", (e) => safe(() => onRender(e)));
  window.addEventListener("resize", () => safe(() => { placePill(true); spy(true); }));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => safe(() => { placePill(true); spy(true); }));
  safe(watchToast);
  safe(watchGrab);
})();
