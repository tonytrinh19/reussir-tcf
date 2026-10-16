#!/usr/bin/env python3
"""The French for « Pense en français », written by Gemini (no Claude involved).

    python3 tools/translate_fr.py            translate the phrases not done yet, then write site/fr.js
    python3 tools/translate_fr.py --status   how many are done, and the ones Gemini's answer didn't pass
    python3 tools/translate_fr.py --write    only write site/fr.js from what's done
    python3 tools/translate_fr.py --max 1    send at most that many requests (to try it out)
    python3 tools/translate_fr.py --redo RE  translate again the phrases whose English or French matches RE

It reads tools/fr-strings.json (from `node tools/i18n_extract.js`) and keeps every translation in
tools/fr-cache.json, keyed by the English, so a run only sends phrases that are new or changed. An entry edited by
hand there is kept. Gemini reads its key from ~/.config/gemini/api_key (or $GEMINI_API_KEY), as make_audio.py does.
"""
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor
import re
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
PAUSE = 7  # seconds between requests, inside the free tier's per-minute limit

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


def ask(items, key):
    body = {
        "systemInstruction": {"parts": [{"text": RULES}]},
        "contents": [{"role": "user", "parts": [{"text": json.dumps(items, ensure_ascii=False)}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    data = json.dumps(body).encode()
    busy = 0
    for attempt in range(10):
        live = [m for m in MODELS if m not in SPENT]
        if not live:
            raise DailyLimit("every model has used its daily quota")
        model = live[min(busy // 2, len(live) - 1)]
        req = urllib.request.Request(API % model, data=data, method="POST", headers={"x-goog-api-key": key, "Content-Type": "application/json"})
        wait = min(60, 10 * 2 ** (attempt % 3))
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                out = json.loads(r.read())
            text = "".join(p.get("text", "") for c in out.get("candidates", [])[:1] for p in c.get("content", {}).get("parts", []))
            return json.loads(text)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code == 429 and ("PerDay" in msg or "per day" in msg.lower()):
                SPENT.add(model)
                print("  %s has used its daily quota: on to the next model" % model, flush=True)
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


def write(strings, cache):
    exact, patterns = {}, []
    for u in strings:
        fr = cache.get(u["text"])
        if fr is None:
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
          "window.TCF.FR = " + json.dumps({"exact": exact, "patterns": patterns}, ensure_ascii=False, indent=0, sort_keys=True) + ";\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print("Wrote %s: %d exact phrases, %d patterns" % (os.path.relpath(OUT, ROOT), len(exact), len(patterns)))


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
    todo = [u for u in strings if u["text"] not in cache]
    if "--status" in sys.argv:
        print("%d of %d phrases in French, %d to do" % (len(strings) - len(todo), len(strings), len(todo)))
        for u in todo[:40]:
            print("  " + u["text"][:100])
        return
    if "--write" in sys.argv or not todo:
        write(strings, cache)
        return
    key = api_key()
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
    left = [u for u in strings if u["text"] not in cache]
    if left:
        print("%d still to do: run it again (`--status` lists them)." % len(left))


if __name__ == "__main__":
    main()
