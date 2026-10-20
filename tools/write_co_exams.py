#!/usr/bin/env python3
"""Drafts more CO practice exams (Examens blancs) with Gemini on Google Cloud (Vertex AI), to the same spec as the
ones in site/exam-co.js. Claude writes this code; Gemini writes the items (the user's rule: bulk text goes to Gemini,
not Claude). Every item is original: nothing is copied from TCF preparation sites or past papers.

    python3 tools/write_co_exams.py plan 5 9    plan exams 5 to 9: a topic, a setting and speakers for each of the
                                                39 items, none repeating a topic already used (exams and sets)
    python3 tools/write_co_exams.py items       draft every planned item not drafted yet, each checked (below) and
                                                sent back with the reason when it fails, up to four times
    python3 tools/write_co_exams.py drawings    draft the line drawings of the picture items (or redraw the ids named)
    python3 tools/write_co_exams.py status      what's planned, drafted and left
    python3 tools/write_co_exams.py redo ID…    draft those again (co-exam-5-12; co-exam-5-01 redoes its drawing too)
    python3 tools/write_co_exams.py check       put every saved draft through the current checks; drop the ones that fail
    python3 tools/write_co_exams.py write       put the drafted exams into site/exam-co.js (between its markers)

Then: node tools/check_co.js, and python3 tools/make_audio.py --vertex records them.

Each item is checked as tools/check_co.js will: the spoken words for its level and kind (so each exam runs about 31
minutes with its pauses), at most two speakers besides the narrator, a voice of the right gender for each, four
different options with the right one's length in the role the exam needs (longest, shortest or neither, so the
exam's balance passes), and for B1–B2 a right option that doesn't share the most words with the recording. Drafts
are kept outside the repo, in ~/Library/Application Support/tcf-reussir/exam-drafts/.
Needs gcloud auth application-default login, and GOOGLE_CLOUD_PROJECT or a gcloud default project.
"""
import json
import os
import random
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import make_audio as MA  # noqa: E402  (the Cloud sign-in, and the spoken-word count check_co.js uses)

DRAFTS = os.path.expanduser("~/Library/Application Support/tcf-reussir/exam-drafts")
EXAM_FILE = os.path.join(ROOT, "site", "exam-co.js")
MODELS = ["gemini-3.8-flash", "gemini-3.7-flash"]
URL = "https://aiplatform.googleapis.com/v1/projects/%s/locations/global/publishers/google/models/%s:generateContent"
WORKERS = 6
TRIES = 4  # drafts of one item before it's left for a rerun
START, END = "  /* Examens blancs drafted by tools/write_co_exams.py (its `write` replaces this block) */", "  /* end of the drafted exams */"

# The 39 items of an exam, as in TCF_CANADA.coExam: 4 pictures, 3 spoken replies, then documents by level.
SKELETON = [("A1", "pic")] * 4 + [("A2", "reply")] * 3 + [("A2", "doc")] * 3 + [("B1", "doc")] * 9 + [("B2", "doc")] * 10 + [("C1", "doc")] * 6 + [("C2", "doc")] * 4
# Spoken words (the narrator's question and the option letters included), around Examen blanc 1's averages, so an
# exam runs about 31 minutes with its pauses; inside TCF_CANADA.coLevels.words.
WORDS = {("A1", "pic"): (23, 31), ("A2", "reply"): (29, 41), ("A2", "doc"): (35, 55), ("B1", "doc"): (62, 80),
         ("B2", "doc"): (92, 118), ("C1", "doc"): (122, 150), ("C2", "doc"): (142, 170)}
TYPES = {"A2": "Message sur répondeur, Annonce, Dialogue",
         "B1": "Dialogue, Conversation téléphonique, Message sur répondeur, Bulletin d'information, Annonce à la radio, Information pratique, Avis à la population, Entretien",
         "B2": "Reportage, Entretien, Témoignage",
         "C1": "Conférence, Chronique, Débat, Entretien",
         "C2": "Chronique (ironic or humorous), Lecture (an extract of a novel), Débat, Conférence"}
# Gemini's Paris voices, by gender, as the casts use them (the narrator, fr-fr-tutor-5, is kept for the questions).
VOICES = {"F": ["fr-fr-advisor-12", "fr-fr-advisor-7", "fr-fr-advisor-9", "fr-fr-concierge-6", "fr-fr-csagent-3", "fr-fr-podcaster-11",
                "fr-fr-podcaster-1", "fr-fr-podcaster-5", "fr-fr-podcaster-9", "fr-fr-tutor-4"],
          "M": ["fr-fr-advisor-2", "fr-fr-advisor-4", "fr-fr-concierge-4", "fr-fr-podcaster-12", "fr-fr-podcaster-2", "fr-fr-podcaster-4",
                "fr-fr-podcaster-6", "fr-fr-podcaster-8", "fr-fr-training-4", "fr-fr-tutor-6", "fr-fr-tutor-7"]}
MS = {"F": "vivienne", "M": "remy"}

RULES = """You write items for a practice version of the TCF Canada listening test (Compréhension orale), the French test IRCC accepts, for an adult learner at B1 aiming for B2. Everything you write is original: never copy or adapt items from TCF preparation websites, books or past papers.

The test has 39 items from A1 to C2. Each recording is heard once; four options, one right.

French: natural, correct, idiomatic French of today, as people really speak in the situation (radio, phone, an office, a shop), with French typography (« », a space before : ; ! ?). Numbers that are spoken are written in words, except years, prices and times written like « 14 h 30 », « 12 $ ». Québec settings may use Québec words (courriel, souper, dépanneur, cégep, aréna, stationnement, magasiner…) but stay clear to a speaker of Paris French.

How a document item works, as on the real test:
- The recording also says what each wrong option says, in a role that doesn't answer the question: a plan that changed, a correction, something refuted or conceded, someone else's habit or opinion, a number heard nearby, a first idea that's dropped, the reason given for something else. A learner who only matches words should be drawn to the wrong options.
- The right option rewords what was said (other words, same meaning) or follows from it. It never repeats a phrase of the recording.
- Never ask which option is NOT true. The four options have the same form (all noun phrases, or all infinitives, or all full sentences), and each is plainly right or wrong for a careful listener.
- Options are written in plain, natural French, as clear as a good exam's: no clumsy or invented phrasing, and no jargon the recording doesn't use.
- "why" is in English: it quotes, in « », the words of the recording that answer the question, then says briefly where each wrong option comes from and why it's wrong.
- "scene" (English) says the setting and the tone; each speaker's "style" (English) says who they are (age, job or role) and how they feel or speak in this moment, e.g. "A receptionist in her thirties, friendly and efficient." These guide the voice actors.

Reply with only the JSON object asked for."""

PLAN = """Plan the 39 items of « Examen blanc %(n)d », a TCF Canada listening practice exam. Give each item a topic that no other item, below or in the list of topics already used, covers.

The items, in order (keep them exactly): %(skeleton)s

- About 70%% of the topics are everyday life (housing, work, health, studies, family, shopping, transport, settling in a new country, services, leisure); the rest AI and work, mental health, climate, diversity, culture, science, society.
- Settings: about 45%% Québec and the rest of Canada, 30%% France, the rest Belgium, Switzerland and francophone Africa. Some speakers come from Senegal, Côte d'Ivoire, Haiti, Cameroon, Morocco or Lebanon and live in Canada or France.
- Document types by level: %(types)s.
- A1 "pic" items: a drawing of one simple everyday scene that can be drawn as stick-figure line art (people, a few objects, no text), with one detail in red. "mode" is "describe" (four statements about the scene) or "say" (four things someone might say); about half of each.
- A2 "reply" items: an everyday question someone asks (a time, a place, a price, who, how long, a request).
- Every "doc" item has one or two speakers, each with a role and a gender (F or M), and a "focus": what its question asks, fitting the level (A2–B1: what to do, a time, a reason, a decision; B2: a position, an intention, an attitude, the main idea, what's implied; C1: implicit meaning, how the argument is built, a nuanced position; C2: irony, an attitude, the effect of a remark).

Topics already used (don't repeat any): %(used)s

Reply as {"items": [{"n": 1, "topic": "short English description", "setting": "place", "drawing": "for pic: the scene and its red detail", "mode": "describe|say", "key": "for pic: one camelCase English word naming the drawing", "type": "for doc: the document type in French", "speakers": [{"role": "...", "gender": "F|M"}], "focus": "for doc"}, …]} with all 39 items."""

ITEM_DOC = """Write item %(n)d of « Examen blanc %(exam)d », a %(level)s document.

Plan: %(plan)s
Level %(level)s: %(docs)s. The question asks %(asks)s; here: %(focus)s.

Rules for this item:
- Speakers: %(speakers)s. Lines alternate as a real conversation would (one speaker may talk alone).
- Length: the whole recording, with the question, is %(lo)d to %(hi)d spoken words (count them).
- %(role)s All four options are between 75%% and 130%% of their average length.%(overlap)s
- The question is in French and ends with « ? ». It doesn't give the answer away.

Here is an item of the same level from another exam, for the form and the difficulty only (write about something else):
%(example)s

Reply as {"type": "%(type)s", "situation": "one French sentence presenting the situation, e.g. « Deux collègues parlent dans un bureau. »", "lines": [["A", "…"], ["B", "…"]], "q": "…", "options": ["the right option", "wrong", "wrong", "wrong"], "why": "…", "scene": "…", "styles": {"A": "…", "B": "…"}}"""

ITEM_PIC = """Write item %(n)d of « Examen blanc %(exam)d », an A1 picture item: the learner sees a drawing and hears four short statements, A to D; only %(letter)s matches the drawing.

The drawing: %(drawing)s
Mode: %(mode)s (describe: four statements about a scene, « Il fait les courses au supermarché. »; say: four things someone might say, « Joyeux anniversaire, ma chérie ! »).

- Each statement is at most 9 words, in simple A1 French. The three wrong ones are clearly contradicted by something one can see (another place, another action, something absent from the drawing), never just a different word for the same thing.
- The four statements, with their letters, are %(lo)d to %(hi)d spoken words in all.
- "alt" describes the drawing in one French sentence; "why" (English) says what in the drawing matches the right statement, in « », and what rules out each wrong one.

Reply as {"alt": "…", "statements": ["A…", "B…", "C…", "D…"], "why": "…"} with the right statement in position %(letter)s."""

ITEM_REPLY = """Write item %(n)d of « Examen blanc %(exam)d », an A2 question-and-reply item: the learner hears a question, then four short spoken replies, A to D; only %(letter)s answers it.

The question's topic: %(topic)s

- The question is everyday French (a time, a place, a price, who, how long, a request) and ends with « ? ».
- Each reply is at most 8 words. The three wrong ones are natural sentences that echo a word of the question or answer another question (where instead of when, a price instead of a place…), but never answer this one.
- The question and the four replies, with their letters, are %(lo)d to %(hi)d spoken words in all.
- "why" (English) says what the question asks, quotes the right reply in « », and says what each wrong one answers instead.

Reply as {"q": "…", "replies": ["A…", "B…", "C…", "D…"], "why": "…"} with the right reply in position %(letter)s."""

DRAW = """Draw a picture for an A1 item of a French listening test, as SVG elements for a 320 × 200 viewBox.

The scene: %(drawing)s
It must clearly show: %(right)s
and must not show: %(wrong)s

Style (copy it exactly, like the two examples below):
- line art: stick figures (a circle head about r=10–11, a trapezoid torso, straight lines for arms and legs), simple outlined objects; a ground line « M14 182H306 »;
- elements: path, circle, rect, ellipse, polyline only; no fill except small dots or text with fill="currentColor" stroke="none"; no colours, no style or class attributes except class="pen";
- exactly one detail drawn in red: give its elements class="pen" (the object the scene is about: a ball, a ringing alarm, a cake's candles…);
- no text, no letters; everything inside x 8–312, y 8–190; leave room between figures and objects so lines don't cross.

Example 1 (a woman waiting at a bus stop in the rain):
%(ex1)s

Example 2 (a man walking his dog):
%(ex2)s

Reply as {"svg": "the elements, one after another, no <svg> wrapper"}."""

STOP = set("les des une aux que qui quoi dont cet cette ces cela ceci elle ils elles nous vous leur leurs son ses mon mes ton tes notre nos votre vos pas plus moins tres trop tout tous toute toutes est sont etre ete avoir ont avait etait sera fait faire par pour sur sous dans avec sans entre chez vers comme aussi bien meme autre autres peu deja encore toujours jamais rien personne chaque quand comment pourquoi quel quelle quels quelles selon apres avant mais donc car ainsi alors lui ceux celle celles dun dune".split())


def fold(x):
    x = unicodedata.normalize("NFD", str(x).lower())
    return re.sub(r"[’']", " ", "".join(ch for ch in x if unicodedata.category(ch) != "Mn"))


def stems(x):
    return [w[:5] for w in re.split(r"[^a-z0-9]+", fold(x)) if len(w) >= 3 and w not in STOP]


def flat(x):
    """For comparing quotations: one kind of apostrophe and space, no case."""
    return re.sub(r"[\s  ]+", " ", str(x).replace("’", "'").lower())


def overlap(option, text):
    """The share of an option's word stems heard in the recording (the same as tools/check_co.js)."""
    inside, o = set(stems(text)), stems(option)
    return sum(w in inside for w in o) / len(o) if o else 0


def load(name, default):
    try:
        with open(os.path.join(DRAFTS, name), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save(name, data):
    os.makedirs(DRAFTS, exist_ok=True)
    tmp = os.path.join(DRAFTS, name + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, os.path.join(DRAFTS, name))


VX = []


def ask(prompt, temperature=0.9):
    """One JSON answer from Gemini on Vertex, retried on rate limits, server errors and timeouts."""
    if not VX:
        VX.append(MA.Vertex())
    vx = VX[0]
    body = json.dumps({"systemInstruction": {"parts": [{"text": RULES}]}, "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                       "generationConfig": {"responseMimeType": "application/json", "temperature": temperature}}).encode()
    for attempt in range(8):
        model = MODELS[min(attempt // 3, len(MODELS) - 1)]
        try:
            req = urllib.request.Request(URL % (vx.project, model), data=body, method="POST", headers=vx.headers())
            out = json.loads(MA.fetch(req, 300))
            return json.loads("".join(p.get("text", "") for c in out.get("candidates", [])[:1] for p in c.get("content", {}).get("parts", [])))
        except urllib.error.HTTPError as e:
            if e.code == 401:
                vx.token = ""
            elif e.code not in (429, 500, 502, 503, 504):
                raise RuntimeError("Vertex AI error %s: %s" % (e.code, e.read().decode("utf-8", "replace")[:300]))
            problem = "error %s" % e.code
        except (urllib.error.URLError, OSError, ValueError) as e:
            problem = "%s" % type(e).__name__
        time.sleep(min(60, 5 * 2 ** attempt))
        print("    retrying (%s)" % problem, flush=True)
    raise RuntimeError("no answer after 8 tries")


def existing():
    """What the site already has, from site/: the exams' items and the listening sets."""
    js = r"""global.window={};require('./site/data.js');require('./site/comp-co.js');require('./site/exam-co.js');
const T=window.TCF;process.stdout.write(JSON.stringify({levels:T.TCF_CANADA.coLevels,
exams:T.COMP.coExams.map(e=>({id:e.id,items:e.items})),sets:T.COMP.coSets.map(s=>({title:s.title,context:s.context}))}))"""
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


def used_topics(site, plan):
    out = []
    for e in site["exams"]:
        if e["id"] in plan:
            continue
        for it in e["items"]:
            if it["kind"] == "doc":
                out.append("%s (%s)" % (it["situation"], it["q"]))
            elif it["kind"] == "pic":
                out.append("picture: " + it["alt"])
            else:
                out.append("question: " + it["q"])
    out += ["listening set: %s (%s)" % (s["title"], s["context"]) for s in site["sets"]]
    for eid, p in plan.items():
        out += ["%s: %s" % (eid, x.get("topic", "")) for x in p]
    return out


def cmd_plan(a, b):
    site, plan = existing(), load("plan.json", {})
    skeleton = ", ".join("%d %s %s" % (i + 1, lv, kind) for i, (lv, kind) in enumerate(SKELETON))
    types = "; ".join("%s: %s" % kv for kv in TYPES.items())
    for n in range(a, b + 1):
        eid = "co-exam-%d" % n
        if eid in plan:
            print("%s: planned already" % eid)
            continue
        for attempt in range(3):
            ans = ask(PLAN % {"n": n, "skeleton": skeleton, "types": types, "used": json.dumps(used_topics(site, plan), ensure_ascii=False)}, 1.0)
            items = ans.get("items", [])
            if len(items) == 39 and all(isinstance(x, dict) for x in items):
                break
            print("  %s: the plan had %d items, asking again" % (eid, len(items)))
        else:
            sys.exit("%s: no complete plan" % eid)
        for i, x in enumerate(items):
            x["level"], x["kind"] = SKELETON[i]
            x["n"] = i + 1
        plan[eid] = items
        save("plan.json", plan)
        print("%s planned: %s" % (eid, "; ".join(x.get("topic", "")[:40] for x in items[7:12])))


def roles(n):
    """Which documents get their right option as the longest, the shortest or neither: 7, 7 and 18 of 32, so the
    exam's balance passes check_co.js (15–30% longest, 15–35% shortest, a mean ratio near 1)."""
    r = ["L"] * 7 + ["S"] * 7 + ["M"] * 18
    random.Random(n).shuffle(r)
    return r


def match_roles(n):
    """For the 19 B1–B2 documents (items 11–29): 5 may have the right option share the fewest of the recording's
    words ("B"); the others keep it between two wrong options ("M"), so neither the most nor the fewest words heard
    gives the answer away (check_co.js: at most 30% top and 40% bottom)."""
    r = ["B"] * 5 + ["M"] * 14
    random.Random(n * 13).shuffle(r)
    return dict(zip(range(10, 29), r))


MATCH_TEXT = {"M": " Word overlap: one wrong option reuses words heard in the recording (that's its trap), and another wrong option is about something the recording never says (few of its words). The right option rewords the answer but keeps one or two key words heard in the recording, so it shares more of the recording's words than one wrong option and fewer than another.",
              "B": " The wrong options reuse words heard in the recording; the right option rewords, so it shares fewer of the recording's words than at least one wrong option."}


ROLE_TEXT = {"L": "The right option is the longest of the four, by 2 to 8 characters.",
             "S": "The right option is the shortest of the four, by 2 to 8 characters.",
             "M": "The right option is neither the longest nor the shortest of the four."}


def letters(n):
    """The right letter of the 4 picture items and 3 reply items: every letter at least once, varied by exam."""
    p = [0, 1, 2, 3]
    random.Random(n * 7).shuffle(p)
    r = random.Random(n * 11).sample([0, 1, 2, 3], 3)
    return p + r


def voices_for(n, i, speakers):
    """A Paris Gemini voice for each speaker, of their gender, two speakers never sharing one."""
    rnd, out = random.Random(n * 100 + i), []
    for sp in speakers:
        pool = [v for v in VOICES["F" if sp.get("gender") == "F" else "M"] if v not in out]
        out.append(rnd.choice(pool))
    return out


def lines_of(kind, d, q=None):
    if kind == "pic":
        return [{"speaker": "N", "text": "%s. %s" % ("ABCD"[k], t)} for k, t in enumerate(d["statements"])]
    if kind == "reply":
        return [{"speaker": "A", "text": d["q"]}] + [{"speaker": "B", "text": "%s. %s" % ("ABCD"[k], t)} for k, t in enumerate(d["replies"])]
    return [{"speaker": sp, "text": t} for sp, t in d["lines"]] + [{"speaker": "Q", "text": d["q"]}]


def spoken(lines):
    return len(MA.script_words({"lines": lines}))


def check(kind, level, d, slot, role=None, mrole="B"):
    """Why a drafted item can't be used, or "" when it passes."""
    if not isinstance(d, dict):
        return "the answer isn't a JSON object"
    lo, hi = slot.get("words") or WORDS[(level, kind)]  # a plan can set a shorter range for one item (to trim an exam)
    if kind in ("pic", "reply"):
        opts = d.get("statements" if kind == "pic" else "replies")
        if not (isinstance(opts, list) and len(opts) == 4 and all(isinstance(o, str) and o.strip() for o in opts)):
            return "it needs exactly 4 options"
        if len({o.strip().lower() for o in opts}) < 4:
            return "two options are the same"
        if any(len(o.split()) > 10 for o in opts):
            return "an option is longer than 10 words"
        if kind == "reply" and not str(d.get("q", "")).strip().endswith("?"):
            return "the question must end with « ? »"
        if kind == "pic" and not d.get("alt"):
            return "no alt"
    else:
        lines, opts = d.get("lines"), d.get("options")
        if not (isinstance(lines, list) and lines and all(isinstance(l, list) and len(l) == 2 and l[0] in ("A", "B") and str(l[1]).strip() for l in lines)):
            return "lines must be [speaker, text] pairs with speaker A or B"
        want = {"A", "B"} if len(slot.get("speakers") or []) >= 2 else {"A"}
        got = {l[0] for l in lines}
        if got != want:
            return "the speakers must be %s, as planned" % (" and ".join(sorted(want)))
        if not (isinstance(opts, list) and len(opts) == 4 and all(isinstance(o, str) and len(o.strip()) >= 8 for o in opts)):
            return "it needs exactly 4 options of at least 8 characters"
        if len({o.strip().lower() for o in opts}) < 4:
            return "two options are the same"
        q = str(d.get("q", "")).strip()
        if not q.endswith("?"):
            return "the question must end with « ? »"
        if not d.get("situation") or not d.get("scene") or not isinstance(d.get("styles"), dict) or any(not d["styles"].get(s) for s in got):
            return "it needs a situation, a scene and a style for each speaker"
        L = [len(o.strip()) for o in opts]
        others = L[1:]
        ratio = L[0] / (sum(others) / 3)
        if max(L) > 1.45 * min(L):
            return "the options' lengths are too different (keep them within 75–130% of their average)"
        if role == "L" and not (L[0] > max(others) and ratio <= 1.3):
            return "the right option (the first) must be the longest, by 2 to 8 characters (lengths now %s)" % L
        if role == "S" and not (L[0] < min(others) and ratio >= 0.77):
            return "the right option (the first) must be the shortest, by 2 to 8 characters (lengths now %s)" % L
        if role == "M" and not (min(others) <= L[0] <= max(others) and 0.8 <= ratio <= 1.25):
            return "the right option (the first) must be neither the longest nor the shortest (lengths now %s)" % L
        if level in ("B1", "B2"):
            text = " ".join(t for _, t in lines)
            ov = [overlap(o, text) for o in opts]
            if ov[0] > max(ov[1:]):
                return "the right option repeats the recording's words more than every wrong one: reword it, and let the wrong options reuse the recording's words"
            if mrole == "M" and ov[0] < min(ov[1:]):
                return ("the right option shares the fewest words with the recording, which gives it away: keep one or two key words "
                        "heard in the recording in it, and make one wrong option about something the recording never says")
    if "«" not in str(d.get("why", "")):
        return "\"why\" must quote, in « », the words that give the answer"
    # Every quotation in "why" is the recording's (or an option's) words exactly; "…" may cut it.
    heard = flat(" ".join(l["text"] for l in lines_of(kind, d)) + " " + " ".join(str(o) for o in (d.get("options") or [])))
    for quote in re.findall(r"«\s*(.+?)\s*»", str(d.get("why", ""))):
        # « […] » or a bracketed word is an editor's cut or addition: the words on either side are checked apart.
        for piece in re.split(r"\s*(?:\.\.\.|…)\s*", re.sub(r"\s*\[[^\]]*\]\s*", "…", quote)):
            if len(piece) >= 12 and flat(piece).strip(" .,;:!?") not in heard:
                return "\"why\" quotes « %s », which isn't in the recording word for word: quote it exactly" % piece[:60]
    n = spoken(lines_of(kind, d))
    if not lo <= n <= hi:
        return "the recording is %d spoken words; it must be %d to %d (%s)" % (n, lo, hi, "add a sentence or two" if n < lo else "cut some")
    return ""


def example_of(site, level, kind, i):
    """An item of the same level and kind from exams 2–4, as a model of the form."""
    pool = [it for e in site["exams"] if e["id"] in ("co-exam-2", "co-exam-3", "co-exam-4") for it in e["items"] if it["level"] == level and it["kind"] == kind]
    it = pool[i % len(pool)]
    return json.dumps({"type": it.get("type"), "situation": it.get("situation"), "lines": [[l["speaker"], l["text"]] for l in it["lines"] if l["speaker"] != "Q"],
                       "q": it.get("q"), "options": it["options"], "why": it.get("why")}, ensure_ascii=False)


def draft_item(site, eid, i, slot):
    n, (level, kind) = int(eid.split("-")[-1]), SKELETON[i]
    lo, hi = slot.get("words") or WORDS[(level, kind)]
    letter = letters(n)[i] if i < 7 else None
    role = roles(n)[i - 7] if kind == "doc" else None
    lv = site["levels"][level]
    if kind == "pic":
        prompt = ITEM_PIC % {"n": i + 1, "exam": n, "letter": "ABCD"[letter], "drawing": slot.get("drawing", ""), "mode": slot.get("mode", "describe"), "lo": lo, "hi": hi}
    elif kind == "reply":
        prompt = ITEM_REPLY % {"n": i + 1, "exam": n, "letter": "ABCD"[letter], "topic": slot.get("topic", ""), "lo": lo, "hi": hi}
    else:
        sps = slot.get("speakers") or [{"role": "a speaker", "gender": "F"}]
        speakers = "; ".join("%s is %s (%s)" % ("AB"[k], sp.get("role", ""), "a woman" if sp.get("gender") == "F" else "a man") for k, sp in enumerate(sps[:2]))
        overlap_rule = MATCH_TEXT[match_roles(n).get(i, "B")] if level in ("B1", "B2") else ""
        prompt = ITEM_DOC % {"n": i + 1, "exam": n, "level": level, "plan": json.dumps({k: slot.get(k) for k in ("topic", "setting", "type", "focus")}, ensure_ascii=False),
                             "docs": lv["docs"], "asks": lv["asks"], "focus": slot.get("focus", ""), "speakers": speakers, "lo": lo, "hi": hi,
                             "role": ROLE_TEXT[role], "overlap": overlap_rule, "example": example_of(site, level, kind, i), "type": slot.get("type", "")}
    why = ""
    for attempt in range(TRIES):
        d = ask(prompt + ("\n\nYour previous answer couldn't be used: %s. Write the item again." % why if why else ""))
        if kind in ("pic", "reply") and isinstance(d, dict):
            key = "statements" if kind == "pic" else "replies"
            if isinstance(d.get(key), list):
                d[key] = [re.sub(r"^[ABCD][.)]\s*", "", str(o)).strip() for o in d[key]]
        why = check(kind, level, d, slot, role, match_roles(n).get(i, "B"))
        if not why:
            d["answer"] = letter if letter is not None else 0
            return d, ""
    return None, why


def cmd_items():
    site, plan, drafts = existing(), load("plan.json", {}), load("items.json", {})
    todo = [(eid, i, slot) for eid, p in sorted(plan.items(), key=lambda kv: int(kv[0].split("-")[-1])) for i, slot in enumerate(p) if "%s-%02d" % (eid, i + 1) not in drafts]
    print("%d items to draft, %d at a time" % (len(todo), WORKERS), flush=True)
    lock = __import__("threading").Lock()

    def run(job):
        eid, i, slot = job
        iid = "%s-%02d" % (eid, i + 1)
        try:
            d, why = draft_item(site, eid, i, slot)
        except RuntimeError as e:
            d, why = None, str(e)
        with lock:
            if d:
                drafts[iid] = d
                save("items.json", drafts)
                print("  %s %s %-5s drafted" % (iid, SKELETON[i][0], SKELETON[i][1]), flush=True)
            else:
                print("  %s NOT drafted after %d tries: %s" % (iid, TRIES, why[:160]), flush=True)

    with ThreadPoolExecutor(WORKERS) as pool:
        list(pool.map(run, todo))
    left = sum(1 for eid, p in plan.items() for i in range(len(p)) if "%s-%02d" % (eid, i + 1) not in drafts)
    print("Drafted: %d · left: %d%s" % (len(drafts), left, " (run items again)" if left else ""))


def drawing_problem(svg):
    if not isinstance(svg, str) or "`" in svg or "${" in svg:
        return "not usable in a template string"
    try:
        root = ET.fromstring('<svg xmlns="http://www.w3.org/2000/svg">%s</svg>' % svg)
    except ET.ParseError as e:
        return "not valid SVG (%s)" % e
    tags = {el.tag.split("}")[-1] for el in root.iter()} - {"svg"}
    if tags - {"path", "circle", "rect", "ellipse", "polyline", "line", "g"}:
        return "uses %s" % ", ".join(sorted(tags - {"path", "circle", "rect", "ellipse", "polyline", "line", "g"}))
    if not any(el.get("class") == "pen" for el in root.iter()):
        return "no red detail (class=\"pen\")"
    if any(el.get("style") or (el.get("class") not in (None, "pen")) for el in root.iter()):
        return "has a style or another class"
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", " ".join(v for el in root.iter() for k, v in el.attrib.items() if k in ("d", "points", "cx", "cy", "x", "y", "x1", "y1", "x2", "y2")))]
    if not nums:
        return "no shapes"
    return ""


def cmd_drawings(only=None):
    plan, drafts, art = load("plan.json", {}), load("items.json", {}), load("drawings.json", {})
    site = existing()
    ex = {it["alt"]: it["pic"] for e in site["exams"][:1] for it in e["items"] if it["kind"] == "pic"}
    ex1 = next(v for k, v in ex.items() if "arrêt" in k)
    ex2 = next((it["pic"] for e in site["exams"] for it in e["items"] if it["kind"] == "pic" and "chien" in it["alt"]), ex1)
    ex1, ex2 = ex1.replace('${DOT}', 'fill="currentColor" stroke="none"'), ex2.replace('${DOT}', 'fill="currentColor" stroke="none"')
    jobs = [(eid, i) for eid in sorted(plan) for i in range(4)
            if "%s-%02d" % (eid, i + 1) in drafts and (("%s-%02d" % (eid, i + 1)) in only if only else ("%s-%02d" % (eid, i + 1)) not in art)]
    lock = __import__("threading").Lock()

    def run(job):
        eid, i = job
        iid, p, d = "%s-%02d" % (eid, i + 1), plan[eid], drafts["%s-%02d" % (eid, i + 1)]
        right = d["statements"][d["answer"]]
        wrong = "; ".join(s for k, s in enumerate(d["statements"]) if k != d["answer"])
        why = ""
        for attempt in range(TRIES):
            try:
                a = ask(DRAW % {"drawing": p[i].get("drawing", d["alt"]), "right": right, "wrong": wrong, "ex1": ex1, "ex2": ex2}
                        + ("\n\nYour previous answer couldn't be used: %s." % why if why else ""), 0.6)
            except RuntimeError as e:
                why = str(e)
                break
            svg = a.get("svg") if isinstance(a, dict) else None
            why = drawing_problem(svg)
            if not why:
                with lock:
                    art[iid] = {"key": re.sub(r"[^A-Za-z0-9]", "", p[i].get("key") or "pic%s%d" % (eid[-1], i + 1)), "svg": svg.strip()}
                    save("drawings.json", art)
                    print("  %s drawing kept (%s)" % (iid, art[iid]["key"]), flush=True)
                return
        print("  %s drawing NOT kept: %s" % (iid, why), flush=True)

    with ThreadPoolExecutor(WORKERS) as pool:
        list(pool.map(run, jobs))


def js(s):
    return json.dumps(s, ensure_ascii=False)


def cmd_write():
    plan, drafts, art = load("plan.json", {}), load("items.json", {}), load("drawings.json", {})
    exams = sorted(plan, key=lambda e: int(e.split("-")[-1]))
    missing = ["%s-%02d" % (e, i + 1) for e in exams for i in range(39) if "%s-%02d" % (e, i + 1) not in drafts]
    missing += ["%s-%02d drawing" % (e, i + 1) for e in exams for i in range(4) if "%s-%02d" % (e, i + 1) not in art]
    if missing:
        sys.exit("Not drafted yet: " + ", ".join(missing))
    keys, art_lines = set(), []
    for e in exams:
        for i in range(4):
            a = art["%s-%02d" % (e, i + 1)]
            k = a["key"] or "pic"
            while k in keys:
                k += "X"
            keys.add(k)
            a["k"] = k
            art_lines.append("    %s: `%s`," % (k, a["svg"].replace("\n", " ")))
    out = [START, "  const ART_MORE = {", *art_lines, "  };", "  T.COMP.coExams.push({"]
    for x, e in enumerate(exams):
        n = int(e.split("-")[-1])
        if x:
            out.append("  }, {")
        out += ['    id: "%s",' % e, '    title: "Examen blanc %d",' % n, "    items: ["]
        for i, slot in enumerate(plan[e]):
            d, (level, kind) = drafts["%s-%02d" % (e, i + 1)], SKELETON[i]
            if kind == "pic":
                voice = voices_for(n, i, [{"gender": "F" if i % 2 else "M"}])[0]
                g = "F" if voice in VOICES["F"] else "M"
                out.append("      pic(ART_MORE.%s, %s,\n        %s, %d,\n        %s,\n        { scene: \"A listening test item: four short %s, read slowly and clearly.\", N: v(%s, %s, \"A clear, slow test voice, with a short pause after each statement.\") })," % (
                    art["%s-%02d" % (e, i + 1)]["k"], js(d["alt"]), js(d["statements"]), d["answer"], js(d["why"]),
                    "things someone might say" if slot.get("mode") == "say" else "statements about a picture", js(voice), js(MS[g])))
            elif kind == "reply":
                va, vb = voices_for(n, i, [{"gender": "F"}, {"gender": "M"}] if i % 2 else [{"gender": "M"}, {"gender": "F"}])
                ga, gb = ("F" if va in VOICES["F"] else "M"), ("F" if vb in VOICES["F"] else "M")
                out.append("      reply(%s,\n        %s, %d,\n        %s,\n        { scene: \"An everyday exchange: a question, then four possible replies.\", A: v(%s, %s, \"Someone asking a question, natural and clear.\"), B: v(%s, %s, \"Four short replies read one by one, with a pause after each.\") })," % (
                    js(d["q"]), js(d["replies"]), d["answer"], js(d["why"]), js(va), js(MS[ga]), js(vb), js(MS[gb])))
            else:
                sps = (slot.get("speakers") or [{"gender": "F"}])[:2]
                used = sorted({sp for sp, _ in d["lines"]})
                vs = voices_for(n, i, sps)
                cast = ", ".join("%s: v(%s, %s, %s)" % (sp, js(vs[k]), js(MS["F" if vs[k] in VOICES["F"] else "M"]), js(d["styles"][sp])) for k, sp in enumerate(used))
                lines = "\n".join("        [%s, %s]," % (js(sp), js(t)) for sp, t in d["lines"])
                out.append("      doc(%s, %s, %s, [\n%s\n      ], %s,\n        %s,\n        %s,\n        { scene: %s, %s })," % (
                    js(level), js(d.get("type") or slot.get("type") or "Document"), js(d["situation"]), lines, js(d["q"]), js(d["options"]), js(d["why"]), js(d["scene"]), cast))
        out.append("    ],")
    out += ["  });", END]
    with open(EXAM_FILE, encoding="utf-8") as f:
        src = f.read()
    block = "\n".join(out) + "\n"
    if START in src:
        src = src[:src.index(START)] + block + src[src.index(END) + len(END) + 1:]
    else:
        anchor = "\n  // Every item plays its recording, numbered in exam order.\n"
        if anchor not in src:
            sys.exit("Can't find where to put the exams in site/exam-co.js")
        src = src.replace(anchor, "\n" + block + anchor, 1)
    with open(EXAM_FILE, "w", encoding="utf-8") as f:
        f.write(src)
    print("Wrote %d exams into site/exam-co.js: %s" % (len(exams), ", ".join(exams)))


def cmd_status():
    plan, drafts, art = load("plan.json", {}), load("items.json", {}), load("drawings.json", {})
    for e in sorted(plan, key=lambda e: int(e.split("-")[-1])):
        print("%s: %d of 39 items drafted, %d of 4 drawings" % (e, sum("%s-%02d" % (e, i + 1) in drafts for i in range(39)), sum("%s-%02d" % (e, i + 1) in art for i in range(4))))


def main():
    a = sys.argv[1:]
    if not a or a[0] not in ("plan", "items", "drawings", "write", "status", "redo", "check"):
        sys.exit(__doc__)
    if a[0] == "plan":
        cmd_plan(int(a[1]), int(a[2]) if len(a) > 2 else int(a[1]))
    elif a[0] == "items":
        cmd_items()
    elif a[0] == "drawings":
        cmd_drawings(set(a[1:]) or None)
    elif a[0] == "write":
        cmd_write()
    elif a[0] == "status":
        cmd_status()
    elif a[0] == "check":  # every saved draft through the current checks; the ones that fail are dropped, to draft again
        plan, drafts = load("plan.json", {}), load("items.json", {})
        bad = []
        for iid, d in sorted(drafts.items()):
            eid, i = iid.rsplit("-", 1)[0], int(iid.rsplit("-", 1)[1]) - 1
            level, kind = SKELETON[i]
            n = int(eid.split("-")[-1])
            why = check(kind, level, d, plan[eid][i], roles(n)[i - 7] if kind == "doc" else None, match_roles(n).get(i, "B"))
            if why:
                bad.append(iid)
                print("  %s: %s" % (iid, why[:150]))
        for iid in bad:
            drafts.pop(iid)
        save("items.json", drafts)
        print("Checked %d drafts: %d dropped, to draft again with `items`" % (len(drafts) + len(bad), len(bad)))
    elif a[0] == "redo":
        drafts, art = load("items.json", {}), load("drawings.json", {})
        for iid in a[1:]:
            drafts.pop(iid, None)
            art.pop(iid, None)
        save("items.json", drafts)
        save("drawings.json", art)
        print("Dropped %d; run items (and drawings) again" % len(a[1:]))


if __name__ == "__main__":
    main()
