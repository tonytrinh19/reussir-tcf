/* Charts for Réussir le TCF, in the warm notebook style. Each builder returns HTML text, so a page's template
   can include a chart like any other markup.
   - Colours are CSS tokens: --c-co, --c-voc, --c-ee, --c-ce, --c-gra, --c-bil for the skills (in that order,
     checked for colour-blind readers in both modes), --o-1…--o-4 for an ordered scale, and --red, --green and
     --accent where a colour means something. Light and dark follow the page.
   - Marks are HTML laid out in % (and SVG only where a shape needs it), so text stays readable at any width.
   - Every mark with a value has a tooltip (data-tip, one line per \n, the first in bold). Tooltips add to what's
     on the chart and in its table (TCFCharts.table), never replace them.
   - A chart given a key draws itself once as it comes into view (motion.js, data-m="chart"): columns and bars
     grow, lines wipe in, dots pop, rings sweep.
   Nothing here reads or writes progress. */
(() => {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fr = (n, d) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: d == null ? 1 : d }));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pc = (v) => +clamp(v * 100, 0, 100).toFixed(2) + "%";
  const tip = (t) => (t ? ` data-tip="${esc(t)}"` : "");
  const motion = (key) => (key ? ` data-m="chart" data-k="${esc(key)}"` : "");
  const chart = (key, cls, inner, label) => `<figure class="c-chart ${cls || ""}"${motion(key)}${label ? ` role="img" aria-label="${esc(label)}"` : ""}>${inner}</figure>`;
  // A label under the plot: centred on its point, or kept inside the plot at either end.
  const xLabel = (x, text) => `<span class="${x <= 0.04 ? "start" : x >= 0.96 ? "end" : ""}" style="left:${pc(x)}">${esc(text)}</span>`;

  // A legend: one swatch per series, in the series' order (a square for bars, a short line for lines).
  function legend(series, kind) {
    return `<ul class="c-legend">${series.map((s) => `<li><i class="${kind === "line" ? "line" : ""}" style="background:${s.color}"></i>${esc(s.label)}</li>`).join("")}</ul>`;
  }

  // Stacked columns over a run of days. data[i] holds one value per series, bottom to top.
  // x[i]: { label (shown under the column, or ""), tip, today, rest }. ticks: the y gridlines, in data units.
  // ghost[i], if given, is drawn as an outline behind each column: what was planned, say.
  function cols(o) {
    const n = o.x.length;
    const totals = o.data.map((vs) => vs.reduce((a, b) => a + (b || 0), 0));
    const max = Math.max(o.max || 0, ...totals, ...(o.ghost || []), 1);
    const grid = (o.ticks || []).map((t) => `<span class="c-grid" style="bottom:${pc(t / max)}"><b>${fr(t, 0)}</b></span>`).join("");
    const colsHtml = o.x.map((x, i) => {
      const segs = o.series.map((s, k) => (o.data[i][k] ? `<i style="flex:${o.data[i][k]};background:${s.color}"></i>` : "")).join("");
      const ghost = o.ghost && o.ghost[i] ? `<span class="c-gcol" style="height:${pc(o.ghost[i] / max)}"></span>` : "";
      return `<span class="c-colw${x.today ? " today" : ""}${x.rest ? " rest" : ""}"${tip(x.tip)}>${ghost}${totals[i] ? `<span class="c-col" style="height:${pc(totals[i] / max)}">${segs}</span>` : ""}</span>`;
    }).join("");
    const labels = o.x.map((x, i) => (x.label ? xLabel((i + 0.5) / n, x.label) : "")).join("");
    return chart(o.key, "c-cols", `<div class="c-plot${grid ? "" : " bare"}" style="height:${o.h || 180}px">${grid}<div class="c-colrow" style="--n:${n}">${colsHtml}</div></div><div class="c-xs${grid ? "" : " bare"}">${labels}</div>${o.legend === false ? "" : legend(o.series)}`, o.label);
  }

  // Horizontal bars, one per row: { label, sub, value, max, text (shown at the end), tip, color, href }.
  function hbars(rows, o) {
    const max = Math.max(...rows.map((r) => r.max || r.value || 0), 1);
    return chart(o.key, "c-hbars", rows.map((r) => {
      const inner = `<span class="c-hl"><b>${esc(r.label)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><span class="c-ht"><i style="width:${pc((r.value || 0) / (r.max || max))};background:${r.color || o.color || "var(--accent)"}"></i></span><span class="c-hv">${esc(r.text != null ? r.text : fr(r.value, 0))}</span>`;
      return r.href ? `<a class="c-hrow" href="${esc(r.href)}"${tip(r.tip)}>${inner}</a>` : `<div class="c-hrow"${tip(r.tip)}>${inner}</div>`;
    }).join(""), o.label);
  }

  // A whole split into its parts, as one bar: segs [{ label, value, color, text, tip }]. The legend under it gives
  // every part its number and share, so nothing has to fit inside a thin part; o.compact puts it on one line.
  function stack(segs, o) {
    const total = segs.reduce((a, s) => a + (s.value || 0), 0) || 1;
    const share = (s) => `${fr(((s.value || 0) / total) * 100, 0)} %`;
    const bar = segs.filter((s) => s.value > 0).map((s) => `<i style="flex:${s.value};background:${s.color}"${tip(s.tip || `${s.label}\n${s.text != null ? s.text : fr(s.value, 0)}${o.unit ? " " + o.unit : ""} · ${share(s)}`)}></i>`).join("");
    const leg = o.compact
      ? `<ul class="c-legend">${segs.map((s) => `<li><i style="background:${s.color}"></i>${esc(s.label)} <b>${esc(s.text != null ? s.text : fr(s.value, 0))}</b></li>`).join("")}</ul>`
      : `<ul class="c-legend c-legend-v">${segs.map((s) => `<li><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${esc(s.text != null ? s.text : fr(s.value, 0))}</b><small>${share(s)}</small></li>`).join("")}</ul>`;
    return chart(o.key, "c-stack", `<div class="c-bar">${bar}</div>${o.legend === false ? "" : leg}`, o.label);
  }

  // Dots, and the lines between them, on a value axis: series [{ label, color, line, area, dots (false: the line
  // alone), legend (false: not in the legend), points: [{ x 0–1, y, tip, hollow }] }], bands [{ from, to, label,
  // cls }], refs [{ y, label }], ticks [y…], xs [{ x, label }]; o.legend false leaves the legend out.
  function plot(o) {
    const lo = o.yMin, hi = o.yMax;
    const Y = (v) => clamp((v - lo) / (hi - lo), 0, 1);
    const bands = (o.bands || []).map((b) => `<span class="c-band ${b.cls || ""}" style="bottom:${pc(Y(b.from))};height:${pc(Y(b.to) - Y(b.from))}">${b.label ? `<b>${esc(b.label)}</b>` : ""}</span>`).join("");
    const grid = (o.ticks || []).map((t) => `<span class="c-grid" style="bottom:${pc(Y(t))}"><b>${esc(o.tick ? o.tick(t) : fr(t, 0))}</b></span>`).join("");
    const refs = (o.refs || []).map((r) => `<span class="c-ref" style="bottom:${pc(Y(r.y))}"><b>${esc(r.label)}</b></span>`).join("");
    const lines = o.series.filter((s) => s.line && s.points.length > 1).map((s) => {
      const d = s.points.map((p, k) => `${k ? "L" : "M"}${(p.x * 100).toFixed(2)} ${((1 - Y(p.y)) * 100).toFixed(2)}`).join(" ");
      const area = s.area ? `<path class="c-area" d="${d} L${(s.points[s.points.length - 1].x * 100).toFixed(2)} 100 L${(s.points[0].x * 100).toFixed(2)} 100 Z" style="fill:${s.color}"/>` : "";
      return `${area}<path class="c-line" d="${d}" style="stroke:${s.color}"/>`;
    }).join("");
    const dots = o.series.filter((s) => s.dots !== false).flatMap((s) => s.points.map((p) => `<span class="c-dot${p.hollow ? " hollow" : ""}" style="left:${pc(p.x)};bottom:${pc(Y(p.y))};--c:${s.color}"${tip(p.tip)}></span>`)).join("");
    const end = o.end ? `<span class="c-end${o.end.x >= 0.8 ? " r" : ""}" style="left:${pc(o.end.x)};bottom:${pc(Y(o.end.y))}">${esc(o.end.label)}</span>` : "";
    const xs = (o.xs || []).map((x) => xLabel(x.x, x.label)).join("");
    const shown = o.series.filter((s) => s.legend !== false), leg = o.legend !== false && shown.length > 1 ? legend(shown, "dot") : "";
    return chart(o.key, `c-plotc${bands ? " has-bands" : ""}`, `<div class="c-plot" style="height:${o.h || 170}px">${bands}${grid}${refs}<svg class="c-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${dots}${end}</div><div class="c-xs">${xs}</div>${leg}`, o.label);
  }

  // A progress ring with its number in the middle: pct 0–1, or null for nothing yet. target (0–1) adds a tick.
  function ring(pct, o) {
    const size = o.size || 56, sw = o.stroke || 5, r = (size - sw) / 2, C = +(2 * Math.PI * r).toFixed(2), h = size / 2;
    const p = pct == null ? 0 : clamp(pct, 0, 1);
    // The ring is turned a quarter back so it starts at the top; the tick is drawn at the start and turned with it.
    const target = o.target != null ? `<line class="c-rtick" x1="${size - sw * 1.6}" y1="${h}" x2="${size + sw * 0.3}" y2="${h}" transform="rotate(${+(o.target * 360).toFixed(1)} ${h} ${h})"/>` : "";
    return `<span class="c-ring" style="width:${size}px;height:${size}px"${tip(o.tip)}${motion(o.key)}><svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="c-rtrack" cx="${h}" cy="${h}" r="${r}" style="stroke-width:${sw}"/>${p ? `<circle class="c-rfill" cx="${h}" cy="${h}" r="${r}" style="stroke-width:${sw};stroke:${o.color || "var(--accent)"}" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - p)).toFixed(2)}" data-c="${C}" data-p="${p}"/>` : ""}${target}</svg><b>${esc(o.text != null ? o.text : pct == null ? "—" : fr(p * 100, 0))}</b></span>`;
  }

  // A sparkline: the trend of a few values, the last one dotted (nothing until there are two).
  function spark(vals, o) {
    const v = vals.filter((x) => x != null && !isNaN(x));
    const w = o.w || 120, h = o.h || 34;
    if (v.length < 2) return "";
    const lo = o.min != null ? o.min : Math.min(...v), hi = o.max != null ? o.max : Math.max(...v);
    const X = (i) => 3 + (i / (v.length - 1)) * (w - 6), Yv = (x) => h - 4 - (hi === lo ? 0.5 : (x - lo) / (hi - lo)) * (h - 8);
    const d = v.map((x, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Yv(x).toFixed(1)}`).join(" ");
    const last = v.length - 1, c = o.color || "var(--accent)";
    return `<svg class="c-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path class="c-sarea" d="${d} L${X(last).toFixed(1)} ${h} L${X(0).toFixed(1)} ${h} Z" style="fill:${c}"/><path class="c-sline" d="${d}" style="stroke:${c}"/><circle class="c-sdot" cx="${X(last).toFixed(1)}" cy="${Yv(v[last]).toFixed(1)}" r="3" style="fill:${c}"/></svg>`;
  }

  // A strip of days, one square each: levels 0 (nothing) to 3 (the whole plan), with a tooltip per day.
  function strip(days, o) {
    return chart(o.key, "c-strip", `<div class="c-cells" style="--n:${days.length}">${days.map((d) => `<i class="l${d.level}${d.today ? " today" : ""}${d.rest ? " rest" : ""}"${tip(d.tip)}></i>`).join("")}</div>`, o.label);
  }

  // Where a score sits on the NCLC scale: bands [{ label, target }], the value's position 0–1 along the track,
  // and earlier positions (ghosts) as hollow marks. ok: the value has reached the target.
  function bullet(o) {
    const bands = o.bands.map((b) => `<i class="${b.target ? "target" : ""}"><b>${esc(b.label)}</b></i>`).join("");
    const ghosts = (o.ghosts || []).map((g) => `<span class="c-ghost" style="left:${pc(g.pos)}"${tip(g.tip)}></span>`).join("");
    const mark = o.pos == null ? "" : `<span class="c-mark${o.ok ? " ok" : ""}" style="left:${pc(o.pos)}"${tip(o.tip)}></span>`;
    return chart(o.key, "c-bullet", `<div class="c-btrack" style="--n:${o.bands.length}">${bands}${ghosts}${mark}</div>`, o.label);
  }

  // A radar of a few axes, clockwise from the top: axes [{ label, sub, value (0–1 along the axis, or null for
  // nothing yet), tip }]. Each axis runs from o.min at the centre to 1 at the edge; o.rings are hairline rings and
  // o.target the dashed one, labelled o.targetLabel. The shape is filled only when every axis has a value;
  // otherwise only neighbouring values are joined. Marks are HTML over the SVG, so they keep their size.
  function radar(axes, o) {
    const n = axes.length, W = 320, H = o.h || 270, cx = W / 2, cy = H / 2, R = Math.min(cy - 30, cx - 74);
    const lo = o.min == null ? 0 : o.min;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const at = (i, v) => { const r = (clamp(v, lo, 1) - lo) / (1 - lo) * R; return [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]; };
    const xy = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const ring = (v, cls) => `<polygon class="${cls}" points="${axes.map((_, i) => xy(at(i, v))).join(" ")}"/>`;
    const spokes = axes.map((_, i) => { const e = at(i, 1); return `<line class="c-rs" x1="${cx}" y1="${cy}" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}"/>`; }).join("");
    const rings = (o.rings || []).map((v) => ring(v, "c-rr")).join("") + ring(1, "c-rr c-redge") + (o.target != null ? ring(o.target, "c-rr c-rtarget") : "");
    const color = o.color || "var(--accent)";
    const has = axes.map((a) => a.value != null);
    const shape = has.every(Boolean)
      ? `<polygon class="c-rshape" points="${axes.map((a, i) => xy(at(i, a.value))).join(" ")}" style="--c:${color}"/>`
      : axes.map((a, i) => { const j = (i + 1) % n; return has[i] && has[j] && n > 2 ? `<line class="c-rseg" x1="${at(i, a.value)[0].toFixed(1)}" y1="${at(i, a.value)[1].toFixed(1)}" x2="${at(j, axes[j].value)[0].toFixed(1)}" y2="${at(j, axes[j].value)[1].toFixed(1)}" style="--c:${color}"/>` : ""; }).join("");
    const pos = (p) => `left:${pc(p[0] / W)};top:${pc(p[1] / H)}`;
    const dots = axes.map((a, i) => (a.value == null ? "" : `<span class="c-rdot" style="${pos(at(i, a.value))};--c:${color}"${tip(a.tip)}></span>`)).join("");
    const labels = axes.map((a, i) => {
      const c = Math.cos(ang(i)), sn = Math.sin(ang(i)), e = [cx + c * (R + 14), cy + sn * (R + 14)];
      const side = Math.abs(c) < 0.3 ? (sn < 0 ? "top" : "bottom") : c > 0 ? "right" : "left";
      return `<span class="c-rlab ${side}${a.value == null ? " none" : ""}" style="${pos(e)}"><b>${esc(a.label)}</b>${a.sub ? `<small>${esc(a.sub)}</small>` : ""}</span>`;
    }).join("");
    const tl = o.target != null && o.targetLabel ? `<span class="c-rtl" style="${pos(at(0, o.target))}">${esc(o.targetLabel)}</span>` : "";
    return chart(o.key, "c-radar", `<div class="c-rbox" style="aspect-ratio:${W} / ${H}"><svg class="c-rsvg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${rings}${spokes}<g class="c-rfig">${shape}</g></svg>${tl}${dots}${labels}</div>`, o.label);
  }

  // The table twin of a chart: the same numbers, readable without hovering.
  function table(head, rows) {
    return `<div class="table-wrap"><table class="c-table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  /* ---------- the tooltip ---------- */
  // One tooltip for every chart: it follows the pointer over a mark, and a tap shows it on a touch screen. The
  // same numbers are in each chart's table, so screen readers are pointed there rather than at the tooltip.
  let tipEl = null, tipFor = null;
  function showTip(el, x, y) {
    const t = el.getAttribute("data-tip");
    if (!t) return;
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "c-tip";
      tipEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(tipEl);
    }
    if (tipFor !== el) {
      tipEl.textContent = "";
      t.split("\n").forEach((line, i) => { const p = document.createElement(i ? "span" : "b"); p.textContent = line; tipEl.appendChild(p); });
      if (tipFor) tipFor.classList.remove("c-on");
      el.classList.add("c-on");
      tipFor = el;
    }
    tipEl.hidden = false;
    const r = tipEl.getBoundingClientRect(), W = window.innerWidth;
    let left = x + 14, top = y - r.height - 12;
    if (left + r.width > W - 8) left = x - r.width - 14;
    if (top < 8) top = y + 18;
    tipEl.style.transform = `translate(${Math.max(8, left).toFixed(0)}px, ${top.toFixed(0)}px)`;
  }
  function hideTip() {
    if (tipEl) tipEl.hidden = true;
    if (tipFor) tipFor.classList.remove("c-on");
    tipFor = null;
  }
  const markOf = (e) => (e.target && e.target.closest ? e.target.closest("[data-tip]") : null);
  document.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const m = markOf(e); if (m) showTip(m, e.clientX, e.clientY); else if (tipFor) hideTip(); }, { passive: true });
  document.addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch") return; const m = markOf(e); if (m) showTip(m, e.clientX, e.clientY); else hideTip(); }, { passive: true });
  document.addEventListener("scroll", () => { if (tipFor) hideTip(); }, { passive: true, capture: true });
  // A redraw replaces the marks: a tooltip whose mark is gone goes too.
  document.addEventListener("tcf:render", () => { if (tipFor && !tipFor.isConnected) hideTip(); });

  window.TCFCharts = Object.freeze({ legend, cols, hbars, stack, plot, ring, spark, strip, bullet, radar, table, fr });
})();
