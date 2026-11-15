/* Original source collections. Listening review never creates a graded attempt. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let catalog = [], skill = new URLSearchParams(location.search).get("skill") || "co", current = null, items = [], index = 0, request = 0;
  const choices = new Map();
  const viewerUrl = (file, page = 1) => `pdf-viewer.html?file=${encodeURIComponent(file)}#page=${page}`;
  const status = (text) => { $("status").textContent = text; };
  function showQuestion() {
    const it = items[index];
    $("audio").pause();
    $("question-title").textContent = `Question ${index + 1} sur ${items.length}`;
    document.querySelectorAll("#questions button").forEach((b, i) => b.setAttribute("aria-current", String(i === index)));
    $("document").src = viewerUrl(current.pdf, it.page);
    $("picture").hidden = !it.image;
    if (it.image) { $("picture").src = it.image; $("picture").alt = `Illustration de la question ${index + 1}`; }
    $("audio").hidden = !it.audio;
    if (it.audio) $("audio").src = it.audio;
    else $("audio").removeAttribute("src");
    $("missing").textContent = it.audio ? "" : "L’enregistrement de cette question manque dans les fichiers fournis.";
    $("choices").replaceChildren();
    it.options.forEach((text, k) => {
      const label = document.createElement("label"), input = document.createElement("input");
      input.type = "radio"; input.name = "answer"; input.checked = choices.get(`${current.id}-${index}`) === k;
      input.addEventListener("change", () => choices.set(`${current.id}-${index}`, k));
      label.append(input, document.createTextNode(`${"ABCD"[k]}. ${text === "ABCD"[k] ? "" : text}`)); $("choices").append(label);
    });
    $("key").open = false;
    $("key").querySelector("p").textContent = Number.isInteger(it.answer) ? `Réponse ${"ABCD"[it.answer]}` : "Le corrigé fourni est absent ou ambigu pour cette question.";
    $("transcript").open = false;
    $("transcript").querySelector(".source-note").textContent = it.transcriptSource || "";
    $("transcript-original").hidden = !it.transcriptPage;
    if (it.transcriptPage) $("transcript-original").href = viewerUrl("exam-sources/papers/transcripts.pdf", it.transcriptPage);
    $("transcript").querySelector(".transcript").textContent = it.lines.map(line => line.text).join("\n\n") || "Aucune transcription vérifiée pour cet enregistrement. Le recueil complet est accessible ci-dessous.";
    $("previous").disabled = index === 0; $("next").disabled = index === items.length - 1;
  }
  async function openPaper() {
    const token = ++request;
    $("audio").pause(); $("content").hidden = true;
    current = catalog.find(e => e.id === $("paper").value);
    if (!current) return;
    status("Ouverture du sujet…");
    try {
      items = [];
      if (current.file) {
        const response = await fetch(current.file);
        if (!response.ok) throw new Error("load_failed");
        const data = await response.json();
        if (token !== request) return;
        items = data;
      }
      if (token !== request) return;
      $("title").textContent = current.title; $("original").href = viewerUrl(current.pdf);
      $("listening").hidden = current.skill !== "co";
      if (items.length) {
        index = 0; $("questions").replaceChildren();
        items.forEach((it, i) => {
          const b = document.createElement("button"); b.textContent = i + 1; b.setAttribute("aria-label", `Question ${i + 1}`);
          b.addEventListener("click", () => { index = i; showQuestion(); $("question-title").focus(); }); $("questions").append(b);
        });
        showQuestion();
      } else $("document").src = viewerUrl(current.pdf);
      $("content").hidden = false; status("");
    } catch (_) { if (token === request) status("Impossible d’ouvrir le sujet. Choisis-le à nouveau pour réessayer."); }
  }
  function filter() {
    const search = $("search").value.toLocaleLowerCase("fr");
    const papers = catalog.filter(e => e.skill === skill && e.title.toLocaleLowerCase("fr").includes(search));
    $("paper").replaceChildren(...papers.map(e => new Option(e.title, e.id)));
    $("collection-count").textContent = `${papers.length} sujet${papers.length === 1 ? "" : "s"} disponible${papers.length === 1 ? "" : "s"}`;
    document.querySelectorAll("[data-skill]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.skill === skill)));
    if (!papers.length) { request++; $("audio").pause(); $("content").hidden = true; status("Aucun sujet trouvé."); }
    else openPaper();
  }
  document.querySelectorAll("[data-skill]").forEach(b => b.addEventListener("click", () => { skill = b.dataset.skill; $("search").value = ""; history.replaceState(null, "", `?skill=${skill}`); filter(); }));
  $("search").addEventListener("input", filter); $("paper").addEventListener("change", openPaper);
  $("previous").addEventListener("click", () => { if (index > 0) { index--; showQuestion(); } });
  $("next").addEventListener("click", () => { if (index < items.length - 1) { index++; showQuestion(); } });
  $("audio").addEventListener("error", () => { $("missing").textContent = "Impossible de lire cet enregistrement. Recharge le sujet pour réessayer."; });
  fetch("exam-sources/catalog.json").then(r => { if (!r.ok) throw new Error("catalog_failed"); return r.json(); }).then(data => { catalog = data; if (!["co","eo","ee"].includes(skill)) skill = "co"; filter(); }).catch(() => status("Impossible de charger les annales. Recharge la page pour réessayer."));
}());
