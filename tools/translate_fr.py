#!/usr/bin/env python3
"""The French for « Pense en français », written by Gemini (no Claude involved).

    python3 tools/translate_fr.py            translate the phrases not done yet, then write site/fr.js
    python3 tools/translate_fr.py --status   how many are done, and the ones Gemini's answer didn't pass
    python3 tools/translate_fr.py --write    only write site/fr.js from what's done
    python3 tools/translate_fr.py --max 1    send at most that many requests (to try it out)
    python3 tools/translate_fr.py --redo RE  translate again the phrases whose English or French matches RE
    python3 tools/translate_fr.py --content  the learning material instead (explanations, rule names, the grammar
                                             notes, the starter sheets), on the flash models only, until their free
                                             daily quotas run out; the fr-content-gemini routine runs this daily at 8 AM
    python3 tools/translate_fr.py --content --dry 20   try 20 on a lite model and print them, saving nothing
    --only RE (with --content) only the material whose English, kind or sheet id matches RE; --max N batches at most
    --vertex  the same models on Google Cloud (Vertex AI), paid from a Cloud project instead of the free tier, with no
              daily quota (needs gcloud auth application-default login, and GOOGLE_CLOUD_PROJECT or a gcloud default
              project); e.g. python3 tools/translate_fr.py --content --vertex

It reads tools/fr-strings.json (from `node tools/i18n_extract.js`) and keeps every translation in
tools/fr-cache.json, keyed by the English, so a run only sends phrases that are new or changed. An entry edited by
hand there is kept. Gemini reads its key from ~/.config/gemini/api_key (or $GEMINI_API_KEY), as make_audio.py does.
"""
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STRINGS = os.path.join(HERE, "fr-strings.json")
CACHE = os.path.join(HERE, "fr-cache.json")
OUT = os.path.join(ROOT, "site", "fr.js")
KEY_FILE = os.path.expanduser("~/.config/gemini/api_key")
API = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent"
# The models to ask, in order: when one is busy (503) twice, the next one is asked.
# (On 2026-10-15 gemini-3.8-flash took 1–4 minutes a request or answered 503; the next two took about 6 s. The
# free tier gives each model its own small daily quota, so a model that has used it is set aside until tomorrow,
# and the lite models, with bigger quotas, come last.)
MODELS = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
SPENT = set()  # models whose daily quota is used up
WORKERS = 2  # batches sent at once
BATCH = 60
# The learning material: the flash models only (the user chose them on 2026-10-16, as they explain grammar more
# accurately), one batch at a time, and a sheet on its own.
CONTENT_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.7-flash", "gemini-3.6-flash"]
CONTENT_BATCH = 40
# --vertex: the same models on Google Cloud (Vertex AI), paid from a Cloud project and its credits, with no daily
# quota, so the batches go six at a time, 20 phrases each. Vertex has no "-latest" aliases. The user chose it on 2026-10-19 to
# finish the learning material in one run; make_audio.py --vertex records the exams the same way.
VERTEX_URL = "https://aiplatform.googleapis.com/v1/projects/%s/locations/global/publishers/google/models/%s:generateContent"
VERTEX_SKIP = {"gemini-flash-latest", "gemini-flash-lite-latest"}
VERTEX_WORKERS = 6
VERTEX_BATCH = 20  # gemini-3.8-flash on Vertex often took over 5 minutes to answer 40 at once
VERTEX = {}  # project, gcloud, token and when it was taken, once --vertex is given

RULES = """You translate the interface of a website that prepares an adult learner (B1, aiming for B2) for the TCF Canada, the French test IRCC accepts. The learner has switched on full immersion: every button, heading, instruction, hint and message must now be in natural, concise French, the way a French app would say it.

Rules:
1. Keep every placeholder ({0}, {1}…) exactly as written, each one once; you may move them where French needs them. A placeholder holds a number, a name, a date or another phrase. A placeholder glued to a word, like "card{1}" or "day{0}", adds an "s" or nothing: keep it glued to the French word ("carte{1}", "jour{0}").
2. Address the learner with « tu ». Buttons and menu items take the infinitive (« Commencer la révision », « Vérifier »).
3. A pair « Français · English » becomes the French half alone, unchanged. Text that is already French (page names, Rémy's lines, French examples) stays exactly as it is.
4. A short English gloss under or after a French label (in <small> in the context, like "overview" under « Vue d'ensemble », or "listening" after « Écoute ») becomes "" (empty).
5. French typography: a space before : ; ! ? and inside « ». Keep symbols as they are (→ · × % … ≈ ▲ ▼ ✓), and keep numbers, times and units (min, h, s, %).
6. Use these terms: CO Compréhension orale, CE Compréhension écrite, EE Expression écrite, EO Expression orale, NCLC, TCF Canada, IRCC; task → tâche; test part → épreuve; practice exam, mock → examen blanc; set → série; drill → exercice; round → tour; retry the misses → reprendre les erreurs; card → carte; deck, theme → thème; review → révision; due → à revoir; streak → série de jours; exit criteria → critères de sortie; instructions → consigne; mistakes → erreurs (fautes in writing); Your mistakes (a page) → Mes erreurs; Find the mistakes (a page) → Relecture; Mixed review → Révision mixte; Again / Hard / Good / Easy (the card grades) → À revoir / Difficile / Bien / Facile; Save to cards → Ajouter aux cartes; Light mode / Dark mode → Mode clair / Mode sombre; Claude stays Claude.
7. Keep it as short as the English, and as friendly. Never add explanations.
8. A plural placeholder glued to an English noun goes on the French noun that takes the plural: "{0} card review{1}" → « {0} révision{1} de cartes », not « révision de carte{1} ».
9. A level before "set" or "sets" goes after the French noun: "{0} set" → « série {0} », "B2 sets" → « séries B2 ».
10. Always « tu », never « vous ». Start with a capital letter where the English does (« Série {0} : … »). "brackets" are the parentheses around a verb in a drill: « entre parenthèses ». "s" right after a number is seconds (« 30 s par question »).

Each item has an id, the English text, where it appears, and its context: the template it comes from, with … for values. Reply with only a JSON object whose keys are the ids, exactly as given, and whose values are the French: {"a1b2c3d4e5f6": "…"}."""


CONTENT_RULES = """You translate the learning material of a website that prepares an adult learner (B1, aiming for B2) for the TCF Canada, the French test IRCC accepts, into French: the learner has switched on full immersion. The texts are explanations after an answer (why a form is right, what a document says), the names of grammar rules, and short notes on grammar topics. They quote French words and sentences.

Rules:
1. Write clear, natural French a B1–B2 learner can follow: short sentences, and the usual French grammar terms (le passé composé, l'auxiliaire être, l'accord du participe passé, le COD, le COI, le subjonctif, la proposition subordonnée, le pronom relatif…).
2. Keep every French word, example and quotation exactly as it is written, with its « » or quotation marks. Translate only the English around them.
3. Keep symbols, arrows, numbers and abbreviations (COD, COI, CO, CE, EE, EO, NCLC, TCF, B1, B2) as they are.
4. A rule name, a short label, stays a short label: a heading, not a sentence.
5. Address the learner with « tu », never « vous », except when the text is about the pronoun vous itself.
6. Never add, drop or soften information, and never correct the content: translate it faithfully.
7. French typography: a space before : ; ! ? and inside « ».

Each item has an id and the English text. Reply with only a JSON object whose keys are the ids, exactly as given, and whose values are the French: {"a1b2c3d4e5f6": "…"}."""

FICHE_RULES = """You translate a revision sheet of a website that prepares an adult learner (B1, aiming for B2) for the TCF Canada into French: the learner has switched on full immersion. The sheet is written in a small markup, one block per line. Translate only its English into clear French a B1–B2 learner can follow, with the usual French grammar terms and « tu », and keep everything else exactly:
- every line, in the same order, with its start: « # » a heading, « - » a point, « > » a note, « ! » a warning, « | » a table row, « = » an example, « >> » an order chain;
- lines like « = ⟦3⟧ » are examples set aside: copy them exactly as they are;
- in a chain (« >> »), the slots are separated by « | » and each slot's label follows « :: »; keep the French words of each slot, and the « * » before the verb;
- in a table, the same number of « | » cells on each row;
- the inline marks: **bold**, ~~crossed out~~, ++right++, ==hidden==, and {n:word} (keep the number and the French word);
- French text stays exactly as it is.
Reply with only a JSON object: {"body": "the whole translated sheet, lines separated by \\n"}."""


def load(p, default):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def api_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key and os.path.exists(KEY_FILE):
        with open(KEY_FILE) as f:
            key = f.read().strip()
    if not key:
        sys.exit("No Gemini key: save one to ~/.config/gemini/api_key")
    return key


class DailyLimit(Exception):
    pass


def vertex_setup():
    """--vertex: the Google Cloud project and the gcloud sign-in (gcloud auth application-default login)."""
    gcloud = shutil.which("gcloud") or next((p for p in ("/opt/homebrew/bin/gcloud", "/usr/local/bin/gcloud") if os.path.exists(p)), None)
    if not gcloud:
        sys.exit("--vertex needs the Google Cloud CLI (gcloud), signed in with: gcloud auth application-default login")
    run = lambda *a: (lambda r: r.stdout.strip() if r.returncode == 0 else "")(subprocess.run([gcloud, *a], capture_output=True, text=True))
    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "").strip() or run("config", "get-value", "project")
    if not project:
        sys.exit("--vertex needs a Google Cloud project: set GOOGLE_CLOUD_PROJECT, or run: gcloud config set project <id>")
    VERTEX.update(project=project, run=run, token="", at=0.0, lock=threading.Lock())


def vertex_headers():
    """A gcloud access token, renewed every 40 minutes (and after a 401), never printed."""
    with VERTEX["lock"]:
        if not VERTEX["token"] or time.time() - VERTEX["at"] > 40 * 60:
            VERTEX["token"] = VERTEX["run"]("auth", "application-default", "print-access-token")
            if not VERTEX["token"]:
                sys.exit("No Google Cloud sign-in: run gcloud auth application-default login")
            VERTEX["at"] = time.time()
        return {"Authorization": "Bearer " + VERTEX["token"], "x-goog-user-project": VERTEX["project"], "Content-Type": "application/json"}


def ask(items, key, rules=None, models=None):
    body = {
        "systemInstruction": {"parts": [{"text": rules or RULES}]},
        "contents": [{"role": "user", "parts": [{"text": json.dumps(items, ensure_ascii=False)}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    data = json.dumps(body).encode()
    busy = 0
    for attempt in range(10):
        live = [m for m in (models or MODELS) if m not in SPENT and not (VERTEX and m in VERTEX_SKIP)]
        if not live:
            raise DailyLimit("every model has used its daily quota")
        model = live[min(busy // 2, len(live) - 1)]
        if VERTEX:
            req = urllib.request.Request(VERTEX_URL % (VERTEX["project"], model), data=data, method="POST", headers=vertex_headers())
        else:
            req = urllib.request.Request(API % model, data=data, method="POST", headers={"x-goog-api-key": key, "Content-Type": "application/json"})
        wait = min(60, 10 * 2 ** (attempt % 3))
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                out = json.loads(r.read())
            text = "".join(p.get("text", "") for c in out.get("candidates", [])[:1] for p in c.get("content", {}).get("parts", []))
            return json.loads(text)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code == 429 and ("PerDay" in msg or "per day" in msg.lower()):
                SPENT.add(model)
                print("  %s has used its daily quota: on to the next model" % model, flush=True)
                continue
            if e.code == 401 and VERTEX:
                VERTEX["token"] = ""
                continue
            if e.code not in (429, 500, 502, 503, 504):
                raise RuntimeError("Gemini API error %s: %s" % (e.code, msg[:300]))
            hint = re.search(r"retry in ([\d.]+)\s*s", msg)
            wait = float(hint.group(1)) + 1 if hint else wait
            # A model that's busy, or out of its per-minute quota (each model has its own): the next one.
            if e.code in (429, 503):
                busy += 2 if e.code == 429 else 1
                wait = 5
            problem = "%s: error %s" % (model, e.code)
        except (urllib.error.URLError, OSError, ValueError) as e:
            problem = "%s: %s" % (type(e).__name__, str(e)[:80])
        print("  attempt %d failed (%s), retrying in %.0f s" % (attempt + 1, problem, wait), flush=True)
        time.sleep(wait)
    raise RuntimeError("Gemini didn't answer after 10 tries")


def as_map(answer, batch):
    """Gemini's answer as {id: French}, whatever shape it came in: by id, by the English, a list of items, or one
    of those wrapped in an object."""
    if isinstance(answer, dict):
        if any(u["id"] in answer for u in batch):
            return answer
        if any(u["text"] in answer for u in batch):
            return {u["id"]: answer.get(u["text"]) for u in batch}
        for v in answer.values():
            if isinstance(v, (list, dict)):
                got = as_map(v, batch)
                if got:
                    return got
        return {}
    if isinstance(answer, list):
        out = {}
        for x in answer:
            if not isinstance(x, dict):
                continue
            fr = next((x[k] for k in ("fr", "french", "translation", "value", "text_fr") if isinstance(x.get(k), str)), None)
            if fr is None:
                fr = next((v for k, v in x.items() if k not in ("id", "text", "where", "context") and isinstance(v, str)), None)
            if x.get("id"):
                out[x["id"]] = fr
            elif x.get("text"):
                u = next((u for u in batch if u["text"] == x["text"]), None)
                if u:
                    out[u["id"]] = fr
        return out
    return {}


PH = re.compile(r"\{\d+\}")


def problem(en, fr):
    """Why a translation can't be used, or None."""
    if not isinstance(fr, str):
        return "not text"
    if sorted(PH.findall(en)) != sorted(PH.findall(fr)):
        return "placeholders differ"
    # Empty is for an English gloss beside a French label: a few words, often after « · ».
    if not fr.strip() and len(en.split()) > 6:
        return "empty"
    if len(fr) > 3 * len(en) + 40:
        return "too long"
    if "<" in fr and "<" not in en:
        return "holds HTML"
    return None


MARKS = ("**", "~~", "++", "==", "{", "::", "|", "*")


def protect(body):
    """A sheet with its example lines (« = French — English ») set aside as markers, so they come back exactly as
    they were, English included (the user chose on 2026-10-16 to keep the examples' English)."""
    lines, kept = body.split("\n"), {}
    for i, l in enumerate(lines):
        if l.strip().startswith("="):
            kept[i] = l
            lines[i] = "= ⟦%d⟧" % i
    return "\n".join(lines), kept


def restore(fr, kept):
    lines = fr.split("\n")
    for i, l in kept.items():
        if i < len(lines) and lines[i].strip() == "= ⟦%d⟧" % i:
            lines[i] = l
    return "\n".join(lines)


def ask_sheet(body, key, models):
    sent, kept = protect(body)
    got = ask({"body": sent}, key, FICHE_RULES, models)
    fr = got.get("body") if isinstance(got, dict) else None
    return restore(fr, kept) if isinstance(fr, str) else None


def fiche_problem(en, fr):
    """Why a translated sheet can't be used, or None: the same lines, starts, examples and marks as the English."""
    if not isinstance(fr, str) or not fr.strip():
        return "not text"
    a, b = en.split("\n"), fr.split("\n")
    if len(a) != len(b):
        return "%d lines, not %d" % (len(b), len(a))
    for x, y in zip(a, b):
        start = lambda l: re.match(r"^(>>|#|-|>|!|\||=|)", l.strip()).group(1)
        if start(x) != start(y):
            return "a line changed its start: %r" % y[:40]
        if x.strip().startswith("=") and x != y:
            return "an example changed: %r" % y[:40]
        for m in MARKS:
            if x.count(m) != y.count(m):
                return "%r count changed on %r" % (m, y[:40])
    return None


def write(strings, cache):
    exact, patterns, fiches = {}, [], {}
    for u in strings:
        fr = cache.get(u["text"])
        if fr is None:
            continue
        if u["kind"] == "fiche":
            fiches[u["fiche"]] = fr
            continue
        # A sentence that starts with a capital, or with a value ("B1 set: …"), starts with a capital in French too.
        if fr[:1].islower() and re.match(r"(\{\d+\}|[A-Z])", u["text"]):
            fr = fr[0].upper() + fr[1:]
        if u["kind"] == "pattern":
            patterns.append([u["text"], fr])
        else:
            exact[u["text"]] = fr
    js = ("/* The French for « Pense en français »: the interface's phrases, keyed by their English. Written by Gemini\n"
          "   (python3 tools/translate_fr.py) from tools/fr-cache.json; don't edit this file by hand. */\n"
          "window.TCF.FR = " + json.dumps({"exact": exact, "patterns": patterns, "fiches": fiches}, ensure_ascii=False, indent=0, sort_keys=True) + ";\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print("Wrote %s: %d exact phrases, %d patterns, %d sheets" % (os.path.relpath(OUT, ROOT), len(exact), len(patterns), len(fiches)))


def main():
    strings = load(STRINGS, None)
    if strings is None:
        sys.exit("Run `node tools/i18n_extract.js` first.")
    cache = load(CACHE, {})
    if "--redo" in sys.argv:
        rx = re.compile(sys.argv[sys.argv.index("--redo") + 1], re.I)
        again = [k for k, v in cache.items() if rx.search(k) or rx.search(v)]
        for k in again:
            del cache[k]
        print("Translating %d again" % len(again))
    content = "--content" in sys.argv
    is_content = lambda u: u["where"].startswith("content:")
    ui_todo = [u for u in strings if not is_content(u) and u["text"] not in cache]
    ct_all = [u for u in strings if is_content(u)]
    ct_todo = [u for u in ct_all if u["text"] not in cache]
    todo = ct_todo if content else ui_todo
    if content and "--only" in sys.argv:
        rx = re.compile(sys.argv[sys.argv.index("--only") + 1], re.I)
        todo = [u for u in todo if rx.search(u["text"]) or rx.search(u["where"]) or rx.search(u.get("fiche", ""))]
    if "--status" in sys.argv:
        ui_n = len(strings) - len(ct_all)
        print("Interface: %d of %d phrases in French, %d to do" % (ui_n - len(ui_todo), ui_n, len(ui_todo)))
        print("Learning material: %d of %d in French, %d to do (python3 tools/translate_fr.py --content)" % (len(ct_all) - len(ct_todo), len(ct_all), len(ct_todo)))
        for u in todo[:40]:
            print("  " + u["text"][:100])
        return
    if content and "--dry" in sys.argv:
        n = int(sys.argv[sys.argv.index("--dry") + 1])
        key = api_key()
        sample = [u for u in ct_todo if u["kind"] != "fiche"][:n]
        answer = as_map(ask([{"id": u["id"], "text": u["text"]} for u in sample], key, CONTENT_RULES, ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"]), sample)
        for u in sample:
            fr = answer.get(u["id"])
            print("%s\n  → %s%s" % (u["text"][:110], (fr or "")[:130], "" if not problem(u["text"], fr) else "   [%s]" % problem(u["text"], fr)))
        sheet = next((u for u in ct_todo if u["kind"] == "fiche"), None)
        if sheet:
            fr = ask_sheet(sheet["text"], key, ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"])
            print("\nSheet %s: %s" % (sheet["fiche"], fiche_problem(sheet["text"], fr) or "kept its markup"))
            print("\n".join((fr or "").split("\n")[:8]))
        return
    if "--write" in sys.argv or not todo:
        write(strings, cache)
        if content and not ct_todo:  # so the fr-content-gemini routine sees there's nothing left
            print("Learning material: %d of %d in French" % (len(ct_all), len(ct_all)))
            print("ALL READY: the learning material is in French")
        return
    if "--vertex" in sys.argv:
        vertex_setup()
    key = "" if VERTEX else api_key()
    if content:
        translate_content(todo, cache, key)
        write(strings, cache)
        left = [u for u in strings if is_content(u) and u["text"] not in cache]
        print("Learning material: %d of %d in French" % (len(ct_all) - len(left), len(ct_all)))
        if not left:
            print("ALL READY: the learning material is in French")
        return
    print("%d phrases to translate, in %d requests" % (len(todo), -(-len(todo) // BATCH)), flush=True)
    failed = []
    most = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else None
    if most:
        todo = todo[:most * BATCH]
    lock = threading.Lock()
    done = [0]

    def run(batch):
        items = [{"id": u["id"], "text": u["text"], "where": u["where"], "context": " | ".join(u["ctx"])[:300]} for u in batch]
        try:
            answer = as_map(ask(items, key), batch)
        except RuntimeError as e:
            print("  a batch of %d is left for the next run: %s" % (len(batch), e), flush=True)
            return
        with lock:
            for u in batch:
                fr = answer.get(u["id"])
                why = problem(u["text"], fr)
                if why:
                    failed.append(u)
                    print("  not kept (%s): %s → %r" % (why, u["text"][:70], fr if isinstance(fr, str) else None))
                else:
                    cache[u["text"]] = fr.strip()
            with open(CACHE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=1, sort_keys=True)
            done[0] += len(batch)
            print("  %d / %d" % (done[0], len(todo)), flush=True)

    try:
        batches = [todo[n:n + BATCH] for n in range(0, len(todo), BATCH)]
        with ThreadPoolExecutor(WORKERS) as pool:
            for f in [pool.submit(run, b) for b in batches]:
                f.result()
        # One more try for the ones whose answer didn't pass, on their own.
        if failed:
            print("Trying again: %d" % len(failed), flush=True)
            answer = as_map(ask([{"id": u["id"], "text": u["text"], "where": u["where"], "context": " | ".join(u["ctx"])[:300]} for u in failed], key), failed)
            for u in failed:
                fr = answer.get(u["id"])
                if not problem(u["text"], fr):
                    cache[u["text"]] = fr
            with open(CACHE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=1, sort_keys=True)
    except DailyLimit as e:
        print("Stopped at Gemini's daily limit: the rest goes on the next run. (%s)" % e)
    write(strings, cache)
    left = [u for u in strings if not is_content(u) and u["text"] not in cache]
    if left:
        print("%d still to do: run it again (`--status` lists them)." % len(left))


def save(cache):
    with open(CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1, sort_keys=True)


def translate_content(todo, cache, key):
    """The learning material, one batch at a time on the flash models, saving after each, until done or every
    model has used its daily quota (the next night carries on)."""
    sheets = [u for u in todo if u["kind"] == "fiche"]
    rest = [u for u in todo if u["kind"] != "fiche"]
    size = VERTEX_BATCH if VERTEX else CONTENT_BATCH
    batches = [rest[n:n + size] for n in range(0, len(rest), size)]
    if "--max" in sys.argv:
        batches = batches[:int(sys.argv[sys.argv.index("--max") + 1])]
        sheets = sheets[:1]
    print("Learning material: %d phrases in %d requests, and %d sheets%s" % (len(rest), len(batches), len(sheets),
          " (Vertex AI, %d at a time)" % VERTEX_WORKERS if VERTEX else ""), flush=True)
    lock = threading.Lock()

    def run(i, batch):
        try:
            answer = as_map(ask([{"id": u["id"], "text": u["text"]} for u in batch], key, CONTENT_RULES, CONTENT_MODELS), batch)
        except RuntimeError as e:
            print("  a batch of %d is left for the next run: %s" % (len(batch), e), flush=True)
            return
        with lock:
            kept = 0
            for u in batch:
                fr = answer.get(u["id"])
                why = problem(u["text"], fr)
                if why:
                    print("  not kept (%s): %s" % (why, u["text"][:70]))
                else:
                    cache[u["text"]] = fr.strip()
                    kept += 1
            save(cache)
            print("  batch %d / %d: %d kept" % (i + 1, len(batches), kept), flush=True)

    def run_sheet(u):
        try:
            fr = ask_sheet(u["text"], key, CONTENT_MODELS)
        except RuntimeError as e:
            print("  sheet %s is left for the next run: %s" % (u["fiche"], e), flush=True)
            return
        with lock:
            why = fiche_problem(u["text"], fr)
            if why:
                print("  sheet %s not kept: %s" % (u["fiche"], why))
            else:
                cache[u["text"]] = fr
                save(cache)
                print("  sheet %s kept" % u["fiche"], flush=True)

    jobs = [(run, (i, b)) for i, b in enumerate(batches)] + [(run_sheet, (u,)) for u in sheets]
    try:
        if VERTEX:  # no daily quota to pace: several at once
            with ThreadPoolExecutor(VERTEX_WORKERS) as pool:
                for f in [pool.submit(fn, *args) for fn, args in jobs]:
                    f.result()
        else:  # the free tier: one at a time, in order, until the daily quotas run out
            for fn, args in jobs:
                fn(*args)
    except DailyLimit as e:
        print("Stopped at Gemini's daily limit: the rest goes on the next run. (%s)" % e)


if __name__ == "__main__":
    main()
