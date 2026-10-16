/* Light by day, dark by night: the page turns dark at sunset and light again at sunrise, by the sun on the
   Pacific coast (Vancouver), worked out from the date alone, with no location asked. It loads in the page's head,
   before anything is drawn, so the page never shows the wrong theme first.

   Switching it yourself (the sidebar's button) holds until the sun would bring that theme anyway, the next sunset
   or sunrise, and then it's automatic again: so a choice lasts until the next day and never flips under your eyes.
   It's kept in this browser (localStorage "tcf-theme": { mode, until }). Choosing the theme the sun would give
   clears it. The system and claude.ai themes are ignored, as before. */
(function () {
  "use strict";
  const LAT = 49.28, LON = -123.12;
  const KEY = "tcf-theme";
  const RAD = Math.PI / 180, DAY = 864e5, J2000 = 2451545;
  const julian = (ms) => ms / DAY + 2440587.5;
  const fromJulian = (j) => (j - 2440587.5) * DAY;

  // Sunrise and sunset (ms) of solar day n, counted from J2000: the sunrise equation, good to about a minute.
  function sunDay(n) {
    const js = n - LON / 360;
    const M = ((357.5291 + 0.98560028 * js) % 360) * RAD;
    const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
    const L = ((M / RAD + C + 180 + 102.9372) % 360) * RAD;
    const transit = J2000 + js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const dec = Math.asin(Math.sin(L) * Math.sin(23.4397 * RAD));
    const cosW = (Math.sin(-0.833 * RAD) - Math.sin(LAT * RAD) * Math.sin(dec)) / (Math.cos(LAT * RAD) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / RAD;
    return { rise: fromJulian(transit - w / 360), set: fromJulian(transit + w / 360) };
  }
  // The days around a moment, enough to hold the day it falls in and the next switch after it.
  const around = (ms) => { const n = Math.floor(julian(ms) - J2000); return [n - 1, n, n + 1, n + 2].map(sunDay); };
  // The day's sunrise and sunset for a moment: the solar day whose noon is nearest.
  function sun(ms) {
    const t = ms == null ? Date.now() : ms;
    return around(t).reduce((best, d) => (Math.abs((d.rise + d.set) / 2 - t) < Math.abs((best.rise + best.set) / 2 - t) ? d : best));
  }
  const auto = (ms) => { const t = ms == null ? Date.now() : ms; return around(t).some((d) => t >= d.rise && t < d.set) ? "light" : "dark"; };
  // The next sunrise or sunset after a moment, and which theme it brings.
  function nextSwitch(ms) {
    const t = ms == null ? Date.now() : ms;
    let best = null;
    around(t).forEach((d) => { [[d.rise, "light"], [d.set, "dark"]].forEach(([at, mode]) => { if (at > t && (!best || at < best.at)) best = { at, mode }; }); });
    return best;
  }

  function ls(fn) { try { return fn(window.localStorage); } catch (_) { return null; } }
  // Your choice, while it holds. A choice saved before the theme followed the sun ("dark", "light") is dropped.
  function override(ms) {
    const t = ms == null ? Date.now() : ms;
    const raw = ls((s) => s.getItem(KEY));
    if (raw == null) return null;
    let o = null;
    try { o = JSON.parse(raw); } catch (_) { o = null; }
    if (!o || (o.mode !== "dark" && o.mode !== "light") || !(o.until > t)) { ls((s) => s.removeItem(KEY)); return null; }
    return o;
  }
  const mode = (ms) => { const o = override(ms); return o ? o.mode : auto(ms); };

  const root = document.documentElement;
  let timer = 0;
  // Puts the theme on the page and announces it (the "tcf:theme" event, with whether it changed), so the button
  // can say when it switches next and motion.js can fade the colours.
  function apply() {
    const dark = mode() === "dark";
    const was = root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try { document.dispatchEvent(new CustomEvent("tcf:theme", { detail: { mode: dark ? "dark" : "light", changed: was !== dark } })); } catch (_) {}
    clearTimeout(timer);
    const nx = nextSwitch();
    if (nx) timer = setTimeout(apply, Math.max(1000, nx.at - Date.now() + 1000));
  }
  function toggle() {
    const t = Date.now();
    const next = mode(t) === "dark" ? "light" : "dark";
    if (next === auto(t)) ls((s) => s.removeItem(KEY));
    else { const nx = nextSwitch(t); ls((s) => s.setItem(KEY, JSON.stringify({ mode: next, until: nx ? nx.at : t + DAY }))); }
    apply();
  }

  window.TCFTheme = Object.freeze({ sun, auto, nextSwitch, override, mode, toggle, apply });
  apply();
  // A laptop asleep past sunset, or a tab in the background: check again when the page comes back.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) apply(); });
  window.addEventListener("focus", apply);
})();
