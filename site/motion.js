/* Motion for Réussir le TCF.
   app.js redraws a whole page as HTML on every change, so an animation written in CSS would replay on every redraw.
   This file runs after each redraw (the "tcf:render" event) and animates only what's new:
   - the page's entrance, when you open another page;
   - elements marked data-m (rise, pop, slide, shake, tick, burst) whose key (data-k) wasn't on screen in the
     previous redraw, so a question animates when it appears and not again on every save. Press, fly and draw
     (the stamps, the boarding pass's plane and route) belong to a page's entrance and also play as it opens;
   - bars, rings and numbers marked data-tween, from the value they had before (data-tw: width, ring or count).
   It also glides the navigation highlight, slides the toast in and out, opens folds gently and throws the maple
   leaves (TCFMotion.burst). It only reads the page and adds animations: it never writes data, calls the app or
   stores anything, and the site works the same without it. With reduced motion asked for, nothing moves. */
(() => {
  "use strict";
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
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
      const box = el.previousElementSibling;
      if (box) box.animate([{ transform: "scale(.75)" }, { transform: "scale(1.15)", offset: 0.55 }, { transform: "none" }], { duration: 360, easing: EASE });
      const p = el.querySelector("path");
      if (p) p.animate([{ strokeDashoffset: 18 }, { strokeDashoffset: 0 }], { duration: 300, delay: 90, easing: EASE, fill: "backwards" });
    },
    burst: (el) => burst(el),
    // A stamp pressed onto the page, one after another (the scale property keeps its tilt).
    press: (el, i) => el.animate([{ scale: "1.35", opacity: 0 }, { scale: ".94", opacity: 1, offset: 0.6 }, { scale: "1", opacity: 1 }], { duration: 420, delay: 160 + Math.min(i, 10) * 70, easing: EASE, fill: "backwards" }),
    // The boarding pass's plane flies along its route to this week (data-dx: how far it has come).
    fly: (el) => { const dx = Number(el.getAttribute("data-dx")) || 0; if (dx > 0) el.animate([{ translate: `${-dx}px 0` }, { translate: "0 0" }], { duration: 900, delay: 150, easing: EASE, fill: "backwards" }); },
    // A line that draws itself: the part of the route already flown.
    draw: (el) => { const L = el.getTotalLength ? el.getTotalLength() : 0; if (L) el.animate([{ strokeDasharray: `${L}`, strokeDashoffset: L }, { strokeDasharray: `${L}`, strokeDashoffset: 0 }], { duration: 900, delay: 150, easing: EASE, fill: "backwards" }); },
  };
  // These are part of a page's entrance, so they also play when the page opens.
  const ENTRANCE = new Set(["press", "fly", "draw"]);

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
    const now = new Set(), fresh = [];
    view.querySelectorAll("[data-m][data-k]").forEach((el) => {
      const k = el.getAttribute("data-m") + "|" + el.getAttribute("data-k");
      now.add(k);
      if (!seen.has(k)) fresh.push(el);
    });
    seen = now;
    // Until your progress has loaded the page is drawn with defaults, so it waits there, still, and comes in once.
    if (!d.ready) return;
    if (still()) { safe(() => tween(view, true, false)); return; }
    if (entering) {
      safe(() => enter(view));
      safe(() => playFresh(fresh.filter((el) => ENTRANCE.has(el.getAttribute("data-m"))), true));
    } else safe(() => playFresh(fresh));
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
    let n = 0;
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
      safe(() => fn(el, n++));
    });
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
      } else if (kind === "count") countUp(el, from, to);
    });
  }

  // A score counts up to its value; the text the page drew comes back exactly at the end.
  function countUp(el, from, to) {
    const text = el.textContent, t0 = performance.now(), dur = Math.min(900, 300 + Math.abs(to - from) * 40);
    const step = (t) => {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { el.textContent = text; return; }
      el.textContent = String(Math.round(from + (to - from) * e));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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

  window.TCFMotion = Object.freeze({ burst: (el, opts) => safe(() => burst(el, opts)) });
  document.addEventListener("tcf:render", (e) => safe(() => onRender(e)));
  window.addEventListener("resize", () => safe(() => placePill(true)));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => safe(() => placePill(true)));
  safe(watchToast);
  safe(watchGrab);
})();
