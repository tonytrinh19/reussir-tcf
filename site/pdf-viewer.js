// Render PDF bytes ourselves: a raw PDF iframe can trigger browser downloads.
import { getDocument, GlobalWorkerOptions } from "./vendor/pdfjs/pdf.js";
GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.js", import.meta.url).href;
const $ = id => document.getElementById(id);
const file = new URLSearchParams(location.search).get("file") || "";
let pdf, revision = 0, renderTask, resizeTimer;
const requestedPage = () => Math.max(1, Math.min(pdf?.numPages || 1, Math.trunc(Number(new URLSearchParams(location.hash.slice(1)).get("page"))) || 1));
const go = page => { location.hash = `page=${Math.max(1, Math.min(pdf.numPages, page))}`; };
async function render() {
  if (!pdf) return;
  const token = ++revision, number = requestedPage();
  renderTask?.cancel();
  $("sheet").replaceChildren();
  $("status").textContent = "Ouverture de la page…";
  $("page").value = number;
  $("prev").disabled = number === 1;
  $("next").disabled = number === pdf.numPages;
  $("text-version").hidden = true;
  $("text-version").open = false;
  try {
    const page = await pdf.getPage(number);
    if (token !== revision) return;
    const natural = page.getViewport({ scale: 1 });
    const width = Math.max(240, $("sheet").clientWidth - 24);
    const viewport = page.getViewport({ scale: Math.min(width / natural.width, 2) });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    // Each render gets its own canvas so cancelled renders cannot paint over a newer page.
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width * pixelRatio);
    canvas.height = Math.ceil(viewport.height * pixelRatio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Page ${number} sur ${pdf.numPages}. Le texte est disponible sous le document.`);
    renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
    await renderTask.promise;
    if (token !== revision) return;
    $("sheet").replaceChildren(canvas);
    $("status").textContent = "";
    const text = await page.getTextContent();
    if (token !== revision) return;
    $("page-text").textContent = text.items.map(item => item.str + (item.hasEOL ? "\n" : " ")).join("");
    $("text-version").hidden = !$("page-text").textContent.trim();
  } catch (error) {
    if (token !== revision || error.name === "RenderingCancelledException") return;
    $("sheet").replaceChildren();
    $("status").textContent = "Impossible d’afficher cette page. Choisis une autre page ou télécharge le PDF.";
  }
}
$("prev").addEventListener("click", () => go(requestedPage() - 1));
$("next").addEventListener("click", () => go(requestedPage() + 1));
$("page").addEventListener("change", () => { const n = Number($("page").value); go(Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1); $("page").value = requestedPage(); });
window.addEventListener("hashchange", render);
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 150); });
async function open() {
  // Only this collection can be opened; never navigate the frame to a raw PDF URL.
  if (!/^exam-sources\/papers\/[a-z0-9-]+\.pdf$/.test(file)) {
    $("status").textContent = "Ce document n’est pas disponible dans les annales.";
    return;
  }
  $("download").href = file;
  $("download").download = file.split("/").pop();
  $("download").hidden = false;
  try {
    pdf = await getDocument({ url: file, cMapUrl: new URL("./vendor/pdfjs/cmaps/", import.meta.url).href, cMapPacked: true, standardFontDataUrl: new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href, wasmUrl: new URL("./vendor/pdfjs/wasm/", import.meta.url).href, isEvalSupported: false }).promise;
    $("total").textContent = `sur ${pdf.numPages}`;
    $("page").max = pdf.numPages;
    $("page").disabled = false;
    await render();
  } catch (_) {
    $("status").textContent = "Impossible d’ouvrir ce document. Recharge la page pour réessayer ou télécharge le PDF.";
  }
}
open();
