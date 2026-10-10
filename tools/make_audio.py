#!/usr/bin/env python3
"""Record the built-in Compréhension orale sets (site/comp-co.js) into site/audio/<id>.mp4.

Every set has a cast: a note on the scene and, for each speaker, a Microsoft voice (Vivienne or
Rémy), a Gemini voice and a delivery note. Recordings last 2 to 4 minutes.

Microsoft voices (edge-tts) make the site's recordings. Gemini 3.8 Flash TTS records the same
scripts in the background, one request per set; its free tier allows 10 requests a day, so a daily
scheduled task runs --gemini until the limit. Gemini takes are checked against the script, wait in
a folder outside the repo, and replace the Microsoft files with --use-gemini (the routine runs it).
tools/recordings.json notes which voices made each file and the script it was made from. It is the
record of what has been converted: --gemini never records a set that is already on the site with
Gemini for its current script, and --force leaves those sets alone unless they're named.

Needs: python3 -m pip install --user edge-tts ; node ; macOS afconvert.
Gemini also needs an API key in ~/.config/gemini/api_key (or $GEMINI_API_KEY).

The CO practice exams (site/exam-co.js) are recorded item by item into site/audio/<exam id>/NN.mp4, with
Microsoft voices first and Gemini takes over time, tracked in recordings.json like the sets (ids such as
co-exam-1-07). An item's document (one or two speakers) is one Gemini request; the narrator's question
is recorded apart, all of an exam's missing questions in one batched request, and split at its silences.
The item is the document, a pause and the question, joined here. A new exam or item is picked up by the
next --gemini run, since anything not on the site with Gemini for its current script is still to do.

Usage: python3 tools/make_audio.py               record new or changed sets and exam items with Microsoft
       python3 tools/make_audio.py --force       re-record every set with Microsoft (except Gemini ones)
       python3 tools/make_audio.py co-sante-b2   re-record one set (or exam item, co-exam-1-07) with Microsoft
       python3 tools/make_audio.py --gemini      record Gemini takes (sets, then exam items) until the daily limit (or just the ids named)
       python3 tools/make_audio.py --use-gemini  put the ready Gemini takes on the site (all, or set ids)
       python3 tools/make_audio.py --status      show each set's and exam item's recording and the script targets
       python3 tools/make_audio.py --word-counts each script's spoken word count, as JSON (for check_co.js)
"""
import array
import asyncio
import base64
import datetime
import hashlib
import http.client
import io
import json
import math
import os
import re
import shutil
import statistics
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unicodedata
import urllib.error
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "site", "audio")
MANIFEST = os.path.join(ROOT, "tools", "recordings.json")
TARGETS = os.path.join(ROOT, "tools", "word-targets.json")
CACHE = os.path.expanduser("~/Library/Application Support/tcf-reussir/gemini")
KEY_FILE = os.path.expanduser("~/.config/gemini/api_key")

SR = 24000
GAP_SAME, GAP_TURN, LEAD_IN, TAIL = 0.45, 0.8, 0.4, 0.6
# Length is judged by the script's word count, not the take's duration, so a take isn't thrown away
# for being a second short. A script needs enough words for about 2:15 at Gemini's pace for its
# level, learned from every Gemini read so far (DEFAULT_WPM until a level has one); tools/word-targets.json
# holds the current numbers for tools/check_co.js. A take outside 1:45–4:00 still means something went wrong.
TARGET_SECONDS = 135
DEFAULT_WPM = {"B1": 160, "B2": 185}  # Gemini's median on 2026-10-02, from 9 takes at each level
MIN_SECONDS, MAX_SECONDS = 105, 240
TARGET_DB, PEAK_DB = -21.0, -1.0  # every recording equally loud, with no clipping
BITRATE = 64000

# Microsoft neural voices, slowed per level to about 150 (B1) and 180 (B2) words a minute. Sylvie and Jean,
# from Québec, speak in a few of the exam's B2–C2 items, as the real test has some Québec French.
MS_VOICES = {"vivienne": "fr-FR-VivienneMultilingualNeural", "remy": "fr-FR-RemyMultilingualNeural",
             "sylvie": "fr-CA-SylvieNeural", "jean": "fr-CA-JeanNeural"}
MS_RATE = {("vivienne", "B1"): "-28%", ("vivienne", "B2"): "-20%", ("remy", "B1"): "-22%", ("remy", "B2"): "-5%"}
# The exam runs from A1 to C2: slow and clear at A1–A2 (about 130 words a minute), the sets' pace at B1 and
# B2, close to natural speed at C1–C2 (about 185). Its narrator reads every question at the same steady pace.
EXAM_RATE = {
    "vivienne": {"A1": "-30%", "A2": "-30%", "B1": "-28%", "B2": "-20%", "C1": "-12%", "C2": "-12%"},
    "remy": {"A1": "-15%", "A2": "-15%", "B1": "-22%", "B2": "-5%", "C1": "-8%", "C2": "-6%"},
    "sylvie": {"A1": "-25%", "A2": "-25%", "B1": "-20%", "B2": "-12%", "C1": "-6%", "C2": "-4%"},
    "jean": {"A1": "-22%", "A2": "-22%", "B1": "-18%", "B2": "-8%", "C1": "-4%", "C2": "-2%"},
}
QUESTION_RATE = "-22%"
# In the exam, a pause after each spoken option (A, B, C, D) and before the narrator's question.
GAP_OPTION, GAP_QUESTION = 0.9, 1.6

GEMINI_API = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_TTS = "gemini-3.8-flash-tts"
GEMINI_CHECK = "gemini-3.8-flash"  # transcribes each take to catch skipped or repeated words
MAX_WER, MAX_GAP = 0.08, 5  # a take fails over 8% word errors, or with 5+ words skipped or added in a row
# Gemini reads fast: "unhurried" still gave B1 about 180 words a minute (1:50), so B1 asks for a slow pace.
PACE = {"B1": "Speak slowly and clearly, as for a learner of French at level B1, and leave a short pause after each sentence.",
        "B2": "Speak at a natural pace."}
# The exam runs from A1 to C2, so its pace follows the level: slow and clear for beginners, natural for the rest.
PACE_EXAM = {"A1": "Speak slowly and clearly, as for a learner of French at level A1, and leave a short pause after each sentence.",
             "A2": "Speak slowly and clearly, as for a learner of French at level A2.",
             "B1": PACE["B1"], "B2": PACE["B2"],
             "C1": "Speak at a natural pace.", "C2": "Speak at a natural, fluent pace."}
# For the spoken options of a picture or reply item, and the narrator's questions (recorded apart).
OPTION_NOTE = " Read each option on its own, then stay silent for about a second."
NARRATOR_NOTE = " Read the question once, steadily. Then stay completely silent for four seconds before the next one."
RESPLIT_SECONDS = (1.5, 1.0, 0.7)  # shorter silences tried on a saved narrator take that didn't split
NARRATOR_CHUNK = 6         # questions per narrator request (16 at once never came back cleanly separated)
QUESTION_GAP = 1.6         # the pause between an item's document and its question (GAP_QUESTION)
SPLIT_DB, SPLIT_SECONDS, CLIP_PAD = -50.0, 2.0, 0.15  # silence that separates narrator questions, and the margin kept
# One stuck request used to hold the whole batch past the routine's limit, with nothing printed.
# Each attempt now gets at most REQUEST_TIMEOUT in all for Gemini's whole answer, and never runs past
# the batch's BATCH_MINUTES. A failed attempt (an error code, a dropped connection or no full answer)
# is retried after 15 s, 30 s, 60 s, and the batch stops cleanly at BATCH_MINUTES, so the rest of
# run.sh still puts the ready takes on the site. urlopen's own timeout only covers each wait for the
# next bytes, so an answer that trickled in once held a request for over an hour (2026-10-03).
REQUEST_TIMEOUT, TRIES, BATCH_MINUTES = 240, 4, 40


def tts_text(s):
    """Spell out what text-to-speech can misread (same rules as ttsText in app.js)."""
    s = re.sub(r"(\d{1,2})\s?h\s?(\d{2})(?!\d)", r"\1 heures \2", s)
    s = re.sub(r"(\d{1,2})\s?h(?![a-zà-ÿ\d])", r"\1 heures", s, flags=re.I)
    s = re.sub(r"\b1 heures\b", "une heure", s)
    s = re.sub(r"(\d+(?:[.,]\d+)?)\s?\$", r"\1 dollars", s)
    s = re.sub(r"(\d+)\s?%", r"\1 pour cent", s)
    s = re.sub(r"\b1er\b", "premier", s)
    s = re.sub(r"\b1re\b", "première", s)
    s = re.sub(r"\bM\.(?=\s)", "Monsieur", s)
    s = re.sub(r"\bMme(?=\s)", "Madame", s)
    s = re.sub(r"\bDr\.?(?=\s)", "Docteur", s)
    s = re.sub(r"\betc\.", "et cetera", s)
    return re.sub(r"\s+", " ", s).strip()


def load_sets():
    out = subprocess.run(["node", os.path.join(ROOT, "tools", "export_co.js")], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def load_exam():
    """The practice exam's items, each with an id (co-exam-1-07), its recording and the length its level allows."""
    out = subprocess.run(["node", os.path.join(ROOT, "tools", "export_co.js"), "--exam"], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def out_path(s):
    """Where a set's or an exam item's recording goes."""
    return os.path.join(ROOT, "site", s["file"]) if "file" in s else os.path.join(AUDIO, s["id"] + ".mp4")


def content_hash(s):
    """Changes whenever the script or the cast changes (same as hashOf in tools/check_co.js)."""
    data = {"level": s["level"], "lines": s["lines"]}
    if s.get("cast") is not None:
        data["cast"] = s["cast"]
    blob = json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha1(blob.encode("utf-8")).hexdigest()[:12]


def doc_lines(s):
    """What Gemini records in one request: every line but the exam narrator's question (recorded apart)."""
    return [line for line in s["lines"] if line["speaker"] != "Q"]


def speakers(s):
    """The set's speakers, in the order they first speak."""
    return list(dict.fromkeys(line["speaker"] for line in s["lines"]))


def doc_speakers(s):
    return list(dict.fromkeys(line["speaker"] for line in doc_lines(s)))


def pace_of(s):
    return PACE_EXAM[s["level"]] if "exam" in s else PACE[s["level"]]


def question_of(s):
    """An exam item's narrator question, or None."""
    qs = [line["text"] for line in s["lines"] if line["speaker"] == "Q"]
    return qs[0] if qs else None


def today():
    return datetime.date.today().isoformat()


def clock(sec):
    t = int(round(sec))
    return "%d:%02d" % (t // 60, t % 60)


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    os.replace(tmp, path)


# ---------------------------------------------------------------- audio

def silence(sec):
    return b"\x00\x00" * int(SR * sec)


def decode(path):
    """Any file afconvert reads, as 24 kHz mono 16-bit PCM."""
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "x.wav")
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@%d" % SR, "-c", "1", path, wav], check=True, capture_output=True)
        # afconvert sometimes writes the "extensible" WAV header, which the wave module can't read,
        # so take the samples straight from the data chunk (their format is the one asked for above).
        with open(wav, "rb") as f:
            data = f.read()
    i = 12
    while i + 8 <= len(data):
        size = int.from_bytes(data[i + 4:i + 8], "little")
        if data[i:i + 4] == b"data":
            return data[i + 8:i + 8 + size]
        i += 8 + size + (size & 1)
    raise ValueError("No audio in " + path)


def write_wav(pcm, path, rate=SR):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)


def rms_db(pcm):
    a = array.array("h", pcm)
    return 20 * math.log10(max(1e-9, math.sqrt(sum(x * x for x in a) / max(1, len(a))) / 32768))


def level(pcm):
    """Match loudness (RMS) across recordings, without letting peaks go above -1 dBFS."""
    a = array.array("h", pcm)
    gain = 10 ** ((TARGET_DB - rms_db(pcm)) / 20)
    gain = min(gain, 32767 * 10 ** (PEAK_DB / 20) / (max(abs(x) for x in a) or 1))
    return array.array("h", (max(-32768, min(32767, round(x * gain))) for x in a)).tobytes()


def encode(pcm, out):
    """Level the loudness and write AAC in an .mp4 (artifacts serve .mp4 but not .m4a). Returns seconds."""
    with tempfile.TemporaryDirectory() as tmp:
        wav, part = os.path.join(tmp, "all.wav"), os.path.join(tmp, "out.mp4")
        write_wav(level(pcm), wav)
        subprocess.run(["afconvert", "-f", "mp4f", "-d", "aac", "-b", str(BITRATE), wav, part], check=True, capture_output=True)
        shutil.move(part, out)
    return len(pcm) / 2 / SR


UNITS = ("zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize "
         "dix-sept dix-huit dix-neuf").split()
TENS = {2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante"}


def spell(n):
    """A whole number in French words (up to 999 999), as it is read aloud."""
    if n < 20:
        return UNITS[n]
    if n < 70:
        t, u = divmod(n, 10)
        return TENS[t] + ("" if u == 0 else " et un" if u == 1 else "-" + UNITS[u])
    if n < 80:
        return "soixante et onze" if n == 71 else "soixante-" + UNITS[n - 60]
    if n < 100:
        return "quatre-vingts" if n == 80 else "quatre-vingt-" + UNITS[n - 80]
    if n < 1000:
        h, r = divmod(n, 100)
        head = "cent" if h == 1 else UNITS[h] + (" cents" if r == 0 else " cent")
        return head if r == 0 else head + " " + spell(r)
    t, r = divmod(n, 1000)
    head = "mille" if t == 1 else spell(t) + " mille"
    return head if r == 0 else head + " " + spell(r)


def words(s):
    """Lower-case words without accents or punctuation, numbers spelled out, for counting and for
    comparing a transcript with its script whichever way each writes the numbers."""
    s = re.sub(r"\d+", lambda m: " " + spell(int(m.group())) + " " if len(m.group()) <= 6 else m.group(), s)
    s = unicodedata.normalize("NFD", s.lower().replace("’", "'"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", s)


def script_words(s):
    return words(" ".join(tts_text(line["text"]) for line in s["lines"]))


def doc_words(s):
    """The words Gemini is asked to read in the item's own request (the question is checked apart)."""
    return words(" ".join(tts_text(line["text"]) for line in doc_lines(s)))


# ---------------------------------------------------------------- Microsoft (edge-tts)

def ask_for_better_mp3():
    """edge-tts always asks for 48 kbps MP3; the service also serves 96 kbps, so ask for that."""
    import aiohttp
    send = aiohttp.ClientWebSocketResponse.send_str

    async def send_str(self, data, *args, **kwargs):
        return await send(self, data.replace("audio-24khz-48kbitrate-mono-mp3", "audio-24khz-96kbitrate-mono-mp3"), *args, **kwargs)
    aiohttp.ClientWebSocketResponse.send_str = send_str


def ms_rate(s, line):
    who = s["cast"][line["speaker"]]["ms"]
    if "exam" not in s:
        return MS_RATE[(who, s["level"])]
    return QUESTION_RATE if line["speaker"] == "Q" else EXAM_RATE[who][s["level"]]


def gap_after(s, i):
    """The silence after line i: longer before an exam's spoken option or its question, and at a change of speaker."""
    line, nxt = s["lines"][i], s["lines"][i + 1]
    if "exam" in s and nxt["speaker"] == "Q":
        return GAP_QUESTION
    if "exam" in s and s["kind"] in ("pic", "reply") and re.match(r"[ABCD]\. ", nxt["text"]):
        return GAP_OPTION
    return GAP_TURN if nxt["speaker"] != line["speaker"] else GAP_SAME


async def ms_record(s, sem):
    import edge_tts
    async with sem:
        lines, pauses = s["lines"], LEAD_IN + TAIL
        with tempfile.TemporaryDirectory() as tmp:
            parts = [silence(LEAD_IN)]
            for i, line in enumerate(lines):
                who = s["cast"][line["speaker"]]
                mp3 = os.path.join(tmp, "l%02d.mp3" % i)
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(tts_text(line["text"]), MS_VOICES[who["ms"]], rate=ms_rate(s, line)).save(mp3)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
                parts.append(decode(mp3))
                if i + 1 < len(lines):
                    gap = gap_after(s, i)
                    parts.append(silence(gap))
                    pauses += gap
            parts.append(silence(TAIL))
            os.makedirs(os.path.dirname(out_path(s)), exist_ok=True)
            sec = encode(b"".join(parts), out_path(s))
    wpm = len(script_words(s)) / max(1, sec - pauses) * 60
    voices = {sp: s["cast"][sp]["ms"] for sp in speakers(s)}
    problem = length_problem(sec, s)
    print("%-22s %s %s  %3.0f words/min  %s%s" % (s["id"], s["level"], clock(sec), wpm, "+".join(dict.fromkeys(voices.values())), ("  " + problem.upper()) if problem else ""), flush=True)
    return {"engine": "microsoft", "voices": voices, "hash": content_hash(s), "seconds": round(sec, 1), "date": today()}


def run_microsoft(sets, items, force, ids):
    manifest = load_json(MANIFEST, {})
    todo = []
    for s in sets + items:
        m, f = manifest.get(s["id"]), out_path(s)
        if ids:
            if s["id"] in ids:
                todo.append(s)
        elif not os.path.exists(f) or not m or m.get("hash") != content_hash(s) or force and not on_site_gemini(manifest, s):
            todo.append(s)
    print("Recording %d of %d sets and exam items with Microsoft voices" % (len(todo), len(sets) + len(items)), flush=True)
    if todo:
        ask_for_better_mp3()
        os.makedirs(AUDIO, exist_ok=True)

        async def go():
            sem = asyncio.Semaphore(4)
            return await asyncio.gather(*(ms_record(s, sem) for s in todo))
        for s, entry in zip(todo, asyncio.run(go())):
            manifest[s["id"]] = entry
    prune(sets, items, manifest)
    save_json(MANIFEST, manifest)
    bad = ["%s (%s)" % (s["id"], length_problem(manifest[s["id"]]["seconds"], s)) for s in todo if length_problem(manifest[s["id"]]["seconds"], s)]
    if bad:
        sys.exit("Recordings must last 1:45 to 4 minutes (exam items: what their level allows); change the script: " + ", ".join(bad))


def length_problem(sec, s=None):
    lo, hi = s["secs"] if s and "secs" in s else (MIN_SECONDS, MAX_SECONDS)
    return "too short" if sec < lo else "too long" if sec > hi else ""


def prune(sets, items, manifest):
    """Delete recordings (and manifest entries) that no set or exam item uses any more."""
    ids = {s["id"] for s in sets + items}
    for f in sorted(os.listdir(AUDIO)) if os.path.isdir(AUDIO) else []:
        if f.endswith(".mp4") and f[:-4] not in ids:
            os.remove(os.path.join(AUDIO, f))
            print("Removed site/audio/%s: no set uses it" % f)
    used = {out_path(s) for s in items}
    for exam in sorted({s["exam"] for s in items}):
        folder = os.path.join(AUDIO, exam)
        for f in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
            if f.endswith(".mp4") and os.path.join(folder, f) not in used:
                os.remove(os.path.join(folder, f))
                print("Removed site/audio/%s/%s: no exam item uses it" % (exam, f))
    for k in [k for k in manifest if k not in ids]:
        del manifest[k]


# ---------------------------------------------------------------- Gemini

class DailyLimit(Exception):
    pass


class Busy(Exception):
    """Gemini still fails (5xx such as 503 "high demand", a dropped connection, a timeout) after every retry,
    or the batch has run out of time."""


DEADLINE = [None]  # time.monotonic() after which no new attempt starts (set by run_gemini)


def fetch(req, limit):
    """The answer to one request, or TimeoutError once it has taken `limit` seconds in all.
    It runs in a thread so the limit holds however slowly the bytes arrive; a stuck thread is left behind."""
    box = {}

    def run():
        try:
            with urllib.request.urlopen(req, timeout=limit) as r:
                box["data"] = r.read()
        except BaseException as e:
            box["error"] = e
    t = threading.Thread(target=run, daemon=True)
    t.start()
    t.join(limit)
    if t.is_alive():
        raise TimeoutError("no full answer")
    if "error" in box:
        raise box["error"]
    return box["data"]


def out_of_time():
    return DEADLINE[0] is not None and time.monotonic() >= DEADLINE[0]


def api_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key and os.path.exists(KEY_FILE):
        with open(KEY_FILE) as f:
            key = f.read().strip()
    if not key:
        sys.exit("No Gemini key: save one to ~/.config/gemini/api_key")
    return key


def gemini(path, body, key, what):
    """One request, retried on rate limits, server errors, dropped connections and timeouts.
    Every failed attempt prints a line, so a bad night shows what Gemini did."""
    data = json.dumps(body).encode()
    for attempt in range(TRIES):
        if out_of_time():
            raise Busy("out of time: the batch ran %d minutes" % BATCH_MINUTES)
        req = urllib.request.Request(GEMINI_API + path, data=data, method="POST", headers={"x-goog-api-key": key, "Content-Type": "application/json"})
        start = time.monotonic()
        wait = 15 * 2 ** attempt
        try:
            limit = REQUEST_TIMEOUT if DEADLINE[0] is None else max(1, min(REQUEST_TIMEOUT, DEADLINE[0] - start))
            return json.loads(fetch(req, limit))
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code == 429 and "per day" in msg:
                raise DailyLimit(msg[:300])
            if e.code not in (429, 500, 502, 503, 504):
                raise RuntimeError("Gemini API error %s: %s" % (e.code, msg[:300]))
            hint = re.search(r"retry in ([\d.]+)\s*s", msg)
            wait = float(hint.group(1)) + 1 if hint else wait
            problem = "error %s" % e.code
        except (urllib.error.URLError, http.client.HTTPException, OSError) as e:
            reason = getattr(e, "reason", e)
            problem = ("no full answer in %.0f s" % (time.monotonic() - start) if isinstance(reason, (TimeoutError, socket.timeout))
                       else "%s (%s)" % (type(reason).__name__, str(reason)[:80] or "connection lost"))
        took = time.monotonic() - start
        if attempt == TRIES - 1:
            print("    %s: attempt %d of %d failed after %.0f s: %s. Giving up." % (what, attempt + 1, TRIES, took, problem), flush=True)
            raise Busy("%s, %d tries" % (problem, TRIES))
        print("    %s: attempt %d of %d failed after %.0f s: %s. Retrying in %.0f s." % (what, attempt + 1, TRIES, took, problem, wait), flush=True)
        time.sleep(wait)


def to_pcm(raw, mime):
    """The WAV (or headerless L16) the API sends, as 24 kHz mono 16-bit PCM."""
    if raw[:4] == b"RIFF":
        with wave.open(io.BytesIO(raw)) as w:
            rate, ch, width, frames = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.readframes(w.getnframes())
    else:
        rate = int(dict(p.split("=", 1) for p in (mime or "").split(";")[1:] if "=" in p).get("rate", SR))
        ch, width, frames = 1, 2, raw
    if (rate, ch, width) == (SR, 1, 2):
        return frames
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "in.wav")
        with wave.open(src, "wb") as w:
            w.setnchannels(ch)
            w.setsampwidth(width)
            w.setframerate(rate)
            w.writeframes(frames)
        return decode(src)


def gemini_request(s):
    """One request for the whole set: each line is a turn with its speaker's delivery note."""
    cast, who = s["cast"], doc_speakers(s)
    content = []
    for line in doc_lines(s):
        spoken_options = s.get("kind") in ("pic", "reply") and re.match(r"[ABCD]\. ", line["text"])
        meta = {"type": "speech_metadata", "style": " ".join([cast["scene"], cast[line["speaker"]]["style"], pace_of(s)]) + (OPTION_NOTE if spoken_options else "")}
        if len(who) > 1:
            meta["speaker"] = line["speaker"]
        content.append({"type": "text", "text": tts_text(line["text"]), "annotations": [meta]})
    if len(who) > 1:
        config = {"mode": "conversational", "speakers": [{"speaker": sp, "voice": cast[sp]["gemini"]} for sp in who]}
    else:
        config = [{"voice": cast[who[0]]["gemini"]}]
    return {"model": GEMINI_TTS, "input": [{"type": "user_input", "content": content}],
            "response_format": {"type": "audio"}, "generation_config": {"speech_config": config}}


def gemini_speak(s, key):
    r = gemini("/interactions", gemini_request(s), key, "take")
    pcm = [to_pcm(base64.b64decode(c["data"]), c.get("mime_type") or c.get("mimeType"))
           for step in r.get("steps", []) for c in step.get("content", []) if c.get("type") == "audio" and c.get("data")]
    if not pcm:
        raise RuntimeError("No audio in Gemini's reply: " + json.dumps(r)[:300])
    return b"".join(pcm)


def transcript(pcm, key):
    """Gemini's word-for-word transcript of a take (sent as 16 kHz WAV to keep the request small)."""
    with tempfile.TemporaryDirectory() as tmp:
        src, low = os.path.join(tmp, "in.wav"), os.path.join(tmp, "low.wav")
        write_wav(pcm, src)
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", src, low], check=True, capture_output=True)
        with open(low, "rb") as f:
            audio = base64.b64encode(f.read()).decode()
    body = {"contents": [{"parts": [
        {"inline_data": {"mime_type": "audio/wav", "data": audio}},
        {"text": "Transcris cet enregistrement en français, mot pour mot, sans rien corriger. Écris les nombres en toutes lettres, comme ils sont prononcés. Réponds uniquement avec la transcription."},
    ]}]}
    r = gemini("/models/%s:generateContent" % GEMINI_CHECK, body, key, "transcription")
    return "".join(p.get("text", "") for c in r.get("candidates", [])[:1] for p in c.get("content", {}).get("parts", []))


def compare(ref, hyp):
    """How far a transcript is from its script: the word error rate, and the longest run of script
    words left out and of extra words put in (a skipped or repeated phrase)."""
    n, m = len(ref), len(hyp)
    d = [list(range(m + 1))] + [[i] + [0] * m for i in range(1, n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] != hyp[j - 1]))
    i, j, run, most = n, m, {"miss": 0, "extra": 0}, {"miss": 0, "extra": 0}
    while i or j:
        if i and j and d[i][j] == d[i - 1][j - 1] + (ref[i - 1] != hyp[j - 1]):
            i, j, run = i - 1, j - 1, {"miss": 0, "extra": 0}
            continue
        kind = "miss" if i and d[i][j] == d[i - 1][j] + 1 else "extra"
        i, j = (i - 1, j) if kind == "miss" else (i, j - 1)
        run[kind], run["miss" if kind == "extra" else "extra"] = run[kind] + 1, 0
        most[kind] = max(most[kind], run[kind])
    return d[n][m] / max(1, n), most["miss"], most["extra"]


# ---- the exam narrator: every missing question of a voice in one request, split at its silences

def clip_key(s):
    q, who = question_of(s), s["cast"]["Q"]
    return hashlib.sha1(("|".join([who["gemini"], who["style"], tts_text(q)])).encode("utf-8")).hexdigest()[:12]


def clip_path(key):
    return os.path.join(CACHE, "q-%s.wav" % key)


def have_clip(s):
    return question_of(s) is None or os.path.exists(clip_path(clip_key(s)))


def load_clip(s):
    with wave.open(clip_path(clip_key(s))) as w:
        return w.readframes(w.getnframes())


def split_clips(pcm, n, gap=SPLIT_SECONDS):
    """The n spoken clips of a narrator take, cut at the silent stretches between them; None when the
    take doesn't hold exactly n."""
    a, frame = array.array("h", pcm), int(SR * 0.02)
    loud, i = [], 0
    for i in range(0, len(a) - frame + 1, frame):
        db = 20 * math.log10(max(1e-9, math.sqrt(sum(x * x for x in a[i:i + frame]) / frame) / 32768))
        loud.append(db > SPLIT_DB)
    clips, start, quiet = [], None, 0
    for k, on in enumerate(loud + [False] * int(gap / 0.02 + 1)):
        if on:
            start = k if start is None else start
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * 0.02 >= gap:
                end = k - quiet + 1
                lo, hi = max(0, start * frame - int(SR * CLIP_PAD)), min(len(a), end * frame + int(SR * CLIP_PAD))
                clips.append(a[lo:hi].tobytes())
                start, quiet = None, 0
    return clips if len(clips) == n else None


def narrator_chunks(todo):
    """The questions of the items still to do that have no clip yet, grouped by narrator voice, in chunks."""
    groups = {}
    for s in todo:
        if "exam" in s and question_of(s) and not have_clip(s):
            who = s["cast"]["Q"]
            g = groups.setdefault((who["gemini"], who["style"]), {})
            g.setdefault(clip_key(s), tts_text(question_of(s)))
    out = []
    for (voice, style), qs in groups.items():
        keys = list(qs)
        for i in range(0, len(keys), NARRATOR_CHUNK):
            out.append((voice, style, [(k, qs[k]) for k in keys[i:i + NARRATOR_CHUNK]]))
    return out


def keep_rejected(pcm, name):
    """A take that wasn't kept is saved here to listen to, not thrown away; only the newest 40 stay."""
    d = os.path.join(CACHE, "rejected")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "%s-%s.wav" % (name, time.strftime("%Y%m%d-%H%M%S")))
    write_wav(pcm, path)
    old = sorted(os.listdir(d))
    for f in old[:-40]:
        os.remove(os.path.join(d, f))
    print("    saved to %s" % path, flush=True)


def gap_report(pcm):
    """The silent stretches of 0.5 s or more in a take, in seconds, so a failed split can be understood."""
    a, frame = array.array("h", pcm), int(SR * 0.02)
    gaps, run = [], 0
    for i in range(0, len(a) - frame + 1, frame):
        db = 20 * math.log10(max(1e-9, math.sqrt(sum(x * x for x in a[i:i + frame]) / frame) / 32768))
        if db > SPLIT_DB:
            if run * 0.02 >= 0.5:
                gaps.append(round(run * 0.02, 1))
            run = 0
        else:
            run += 1
    return gaps


def failed_path(cid):
    return os.path.join(CACHE, "narrator-%s.failed.wav" % cid)


def run_narrator(chunk, st, key):
    voice, style, qs = chunk
    cid = hashlib.sha1("|".join(k for k, _ in qs).encode()).hexdigest()[:12]
    # A take that failed to split on an earlier run is looked at again first, with shorter silences allowed
    # between the questions: it costs no recording request.
    if os.path.exists(failed_path(cid)):
        with wave.open(failed_path(cid)) as w:
            pcm = w.readframes(w.getnframes())
        for gap in RESPLIT_SECONDS:
            clips = split_clips(pcm, len(qs), gap)
            if clips:
                break
        if clips:
            print("narrator               checking the take saved earlier (split at %.1f s of silence)… (%s)" % (gap, time.strftime("%H:%M:%S")), flush=True)
            err, missed, extra = compare(words(" ".join(t for _, t in qs)), words(transcript(pcm, key)))
            problem = "%d words skipped in a row" % missed if missed >= MAX_GAP else "%d words added in a row" % extra if extra >= MAX_GAP else "misread" if err > MAX_WER else ""
            if not problem:
                for (k, _), clip in zip(qs, clips):
                    write_wav(clip, clip_path(k))
                os.remove(failed_path(cid))
                print("narrator               %d questions  ready (%2.0f%% word errors, %s, from the saved take)" % (len(qs), err * 100, voice), flush=True)
                return
            print("narrator               the saved take isn't usable either (%s)" % problem, flush=True)
        else:
            print("narrator               the saved take can't be split into %d questions at any silence length" % len(qs), flush=True)
        keep_rejected(pcm, "narrator-" + cid)
        os.remove(failed_path(cid))
    fails = st["narrator_fails"].get(cid, 0)
    if fails >= 2:
        print("narrator (%d questions)  failed twice, needs a look" % len(qs), flush=True)
        return
    print("narrator               %d questions  recording… (%s)" % (len(qs), time.strftime("%H:%M:%S")), flush=True)
    content = [{"type": "text", "text": text, "annotations": [{"type": "speech_metadata", "style": style + NARRATOR_NOTE}]} for _, text in qs]
    body = {"model": GEMINI_TTS, "input": [{"type": "user_input", "content": content}], "response_format": {"type": "audio"},
            "generation_config": {"speech_config": [{"voice": voice}]}}
    r = gemini("/interactions", body, key, "narrator")
    pcm = b"".join(to_pcm(base64.b64decode(c["data"]), c.get("mime_type") or c.get("mimeType")) for step in r.get("steps", [])
                   for c in step.get("content", []) if c.get("type") == "audio" and c.get("data"))
    clips = split_clips(pcm, len(qs)) if pcm else None
    problem = "" if clips else ("no audio" if not pcm else "the questions weren't separated by silences (expected %d clips)" % len(qs))
    if clips:
        err, missed, extra = compare(words(" ".join(t for _, t in qs)), words(transcript(pcm, key)))
        problem = "%d words skipped in a row" % missed if missed >= MAX_GAP else "%d words added in a row" % extra if extra >= MAX_GAP else "misread" if err > MAX_WER else ""
    if problem:
        st["narrator_fails"][cid] = fails + 1
        print("narrator               NOT KEPT (%s)" % problem, flush=True)
        if pcm:
            # Saved, so the next run can look at it again without a new request (and so it can be listened to).
            write_wav(pcm, failed_path(cid))
            print("    take %.0f s, silent stretches of 0.5 s or more (s): %s" % (len(pcm) / 2 / SR, gap_report(pcm)), flush=True)
            print("    saved to %s" % failed_path(cid), flush=True)
        return
    for (k, _), clip in zip(qs, clips):
        write_wav(clip, clip_path(k))
    print("narrator               %d questions  ready (%2.0f%% word errors, %s)" % (len(qs), err * 100, voice), flush=True)


def compose(s, speech):
    """An exam item's recording: its document, a pause and the narrator's question, each at the same loudness;
    or just the document when the item has no question. Sets are their speech alone."""
    if "exam" not in s or question_of(s) is None:
        return speech
    return level(speech) + silence(QUESTION_GAP) + level(load_clip(s))


def take_path(s, h=None):
    return os.path.join(CACHE, "%s-%s.mp4" % (s["id"], h or content_hash(s)))


def on_site_gemini(manifest, s):
    """The site already plays a Gemini recording of this set's current script (read from
    recordings.json, so it works in the routine's copy of the repo, which has no audio files)."""
    m = manifest.get(s["id"]) or {}
    return m.get("engine") == "gemini" and m.get("hash") == content_hash(s)


def unchecked_path(s, h=None):
    """A take that came back but couldn't be checked yet (e.g. the transcription got 503s): the raw
    speech, kept so the next run checks it without spending another recording request."""
    return os.path.join(CACHE, "%s-%s.unchecked.wav" % (s["id"], h or content_hash(s)))


def rejected_path(s, h=None):
    return os.path.join(CACHE, "%s-%s.rejected.wav" % (s["id"], h or content_hash(s)))


def recheck_rejected(st, s, key, exam):
    """The take saved when this item last failed: checked again, now, against the current limits (a length
    that was too long may be allowed now, and a transcription can have misread). Returns it when it now
    passes, and otherwise puts it with the other rejected takes and returns None."""
    r = st["rejected"].get(s["id"])
    path = rejected_path(s)
    if not r or r.get("hash") != content_hash(s) or not os.path.exists(path):
        return None
    with wave.open(path) as w:
        pcm = w.readframes(w.getnframes())
    sec = (len(compose(s, pcm)) / 2 + int(SR * (LEAD_IN + TAIL))) / SR
    problem = length_problem(sec, s)
    if not problem:
        err, missed, extra = compare(doc_words(s) if exam else script_words(s), words(transcript(pcm, key)))
        problem = ("%d words skipped in a row" % missed if missed >= MAX_GAP
                   else "%d words added in a row" % extra if extra >= MAX_GAP else "misread" if err > MAX_WER else "")
    st["rejected"].pop(s["id"], None)
    if problem:
        print("%-22s %s  the take rejected on %s still fails (%s)" % (s["id"], clock(sec), r.get("date"), problem), flush=True)
        keep_rejected(pcm, s["id"])
        os.remove(path)
        return None
    print("%-22s %s  the take rejected on %s passes now" % (s["id"], clock(sec), r.get("date")), flush=True)
    os.remove(path)
    return pcm


def load_unchecked(st, s):
    u = st["unchecked"].get(s["id"])
    if not u or u.get("hash") != content_hash(s) or not os.path.exists(unchecked_path(s)):
        return None
    with wave.open(unchecked_path(s)) as w:
        return w.readframes(w.getnframes())


def take_ready(status, s):
    t = status["takes"].get(s["id"])
    return bool(t) and t.get("hash") == content_hash(s) and os.path.exists(take_path(s))


def gemini_wpm(st, sets, manifest):
    """Gemini's median words a minute at each level, from every read of a current script with the
    current pace instruction: the recordings on the site and the takes kept, failed or not checked yet.
    Takes that skipped or added words are left out, since their length doesn't match the script."""
    by_id, rates = {s["id"]: s for s in sets}, {}
    reads = [(k, v) for k, v in manifest.items() if v.get("engine") == "gemini"]
    reads += [(k, v) for b in ("takes", "fails", "unchecked") for k, v in st[b].items()
              if b != "fails" or not re.search(r"skipped|added", v.get("problem", ""))]
    for k, v in reads:
        s = by_id.get(k)
        if s and v.get("hash") == content_hash(s) and v.get("pace", PACE[s["level"]]) == PACE[s["level"]] and v.get("seconds"):
            rates.setdefault(s["level"], {})[k] = len(script_words(s)) / (v["seconds"] - LEAD_IN - TAIL) * 60
    return {lv: (statistics.median(rates[lv].values()) if rates.get(lv) else DEFAULT_WPM[lv], len(rates.get(lv, {}))) for lv in PACE}


def word_targets(st, sets, manifest):
    """The fewest words a script needs for about 2:15 at each level, and the most that stays under 4
    minutes; saved to tools/word-targets.json when they change."""
    out = {}
    for lv, (wpm, n) in gemini_wpm(st, sets, manifest).items():
        speech = lambda sec: (sec - LEAD_IN - TAIL) * wpm / 60
        out[lv] = {"wpm": round(wpm, 1), "minWords": math.ceil(speech(TARGET_SECONDS)), "maxWords": math.floor(speech(MAX_SECONDS)), "reads": n}
    if load_json(TARGETS, {}) != out:
        save_json(TARGETS, out)
    return out


def expected_problem(targets, s):
    """Why a script is too short (or long) for Gemini, with its word count and the level's target; None when it's fine."""
    t, n = targets[s["level"]], len(script_words(s))
    return ("too short", n, t["minWords"]) if n < t["minWords"] else ("too long", n, t["maxWords"]) if n > t["maxWords"] else None


def load_status():
    st = load_json(os.path.join(CACHE, "status.json"), {})
    st.setdefault("takes", {})
    st.setdefault("fails", {})
    st.setdefault("unchecked", {})
    st.setdefault("rejected", {})
    st.setdefault("narrator_fails", {})
    return st


def run_gemini(sets, items, only=None):
    key = api_key()
    os.makedirs(CACHE, exist_ok=True)
    st = load_status()
    status_file = os.path.join(CACHE, "status.json")
    everything = sets + items
    # Forget takes and failures for scripts that have changed, and delete their files.
    current = {(s["id"], content_hash(s)) for s in everything}
    for f in os.listdir(CACHE):
        m = re.match(r"(.+)-([0-9a-f]{12})\.(?:mp4|unchecked\.wav|rejected\.wav)$", f)
        if m and (m.group(1), m.group(2)) not in current:
            os.remove(os.path.join(CACHE, f))
    for bucket in ("takes", "fails", "unchecked", "rejected"):
        st[bucket] = {k: v for k, v in st[bucket].items() if (k, v.get("hash")) in current}
    # A failure under an older pace instruction doesn't count against the set.
    pace = {s["id"]: pace_of(s) for s in everything}
    st["fails"] = {k: v for k, v in st["fails"].items() if v.get("pace") == pace[k]}
    manifest = load_json(MANIFEST, {})
    done = [s for s in everything if on_site_gemini(manifest, s)]
    todo = [s for s in everything if s not in done and not take_ready(st, s) and st["fails"].get(s["id"], {}).get("count", 0) < 2
            and (not only or s["id"] in only)]
    for s in done:  # converted: the cached copies are no longer needed
        if st["takes"].pop(s["id"], None) and os.path.exists(take_path(s)):
            os.remove(take_path(s))
        if st["unchecked"].pop(s["id"], None) and os.path.exists(unchecked_path(s)):
            os.remove(unchecked_path(s))
    # Narrator clips are kept only for the questions of items still to do.
    wanted = {clip_key(s) for s in everything if "exam" in s and question_of(s) and s not in done}
    for f in os.listdir(CACHE):
        m = re.match(r"q-([0-9a-f]{12})\.wav$", f)
        if m and m.group(1) not in wanted:
            os.remove(os.path.join(CACHE, f))
    # Takes already recorded but not checked go first: they cost no recording request.
    todo.sort(key=lambda s: s["id"] not in st["unchecked"])
    if done:
        print("Already on the site with Gemini, skipped: %d" % len(done), flush=True)
    print("Gemini: %d set%s or exam item%s to record" % (len(todo), "" if len(todo) == 1 else "s", "" if len(todo) == 1 else "s"), flush=True)
    DEADLINE[0] = time.monotonic() + BATCH_MINUTES * 60
    try:
        # The narrator's questions first (one request per six), unless every item waiting has its clip.
        for chunk in narrator_chunks([s for s in todo if s["id"] not in st["unchecked"] or not have_clip(s)]):
            run_narrator(chunk, st, key)
            save_json(status_file, st)
        # Documents wait until every narrator question is recorded, so no request is spent on them meanwhile.
        left = narrator_chunks(todo)
        if left:
            print("Narrator questions first: %d batch%s still to record, no documents today" % (len(left), "" if len(left) == 1 else "es"), flush=True)
            todo = []
        for s in todo:
            if out_of_time():
                raise Busy("out of time: the batch ran %d minutes" % BATCH_MINUTES)
            exam = "exam" in s
            if exam and not have_clip(s):
                print("%-22s %s  skipped: its narrator question isn't recorded yet" % (s["id"], s["level"]), flush=True)
                continue
            # Checked before each request, with the targets learned from every take so far (sets only).
            expected = None if exam else expected_problem(word_targets(st, sets, manifest), s)
            if expected:
                print("%-22s %s  skipped: script %s (%d words, the target is %s %d for about 2:15 at Gemini's pace)" % (
                    s["id"], s["level"], expected[0], expected[1], "at least" if expected[0] == "too short" else "at most", expected[2]), flush=True)
                continue
            h = content_hash(s)
            speech = load_unchecked(st, s)
            if speech is not None:
                print("%-22s %s  checking the take recorded on %s… (%s)" % (s["id"], s["level"], st["unchecked"][s["id"]]["date"], time.strftime("%H:%M:%S")), flush=True)
            else:
                speech = recheck_rejected(st, s, key, exam)
            if speech is None:
                print("%-22s %s  recording… (%s)" % (s["id"], s["level"], time.strftime("%H:%M:%S")), flush=True)
                speech = gemini_speak(s, key)
            whole = compose(s, speech)
            sec = (len(whole) / 2 + int(SR * (LEAD_IN + TAIL))) / SR
            if not length_problem(sec, s) and s["id"] not in st["unchecked"]:
                # Saved before the check, so a transcription outage doesn't throw the recording away.
                write_wav(speech, unchecked_path(s, h))
                st["unchecked"][s["id"]] = {"hash": h, "seconds": round(sec, 1), "pace": pace_of(s), "date": today()}
                save_json(status_file, st)
            # A take outside its length can't be kept, so it isn't worth a transcription request.
            problem = length_problem(sec, s)
            ref = doc_words(s) if exam else script_words(s)
            err, missed, extra = (None, 0, 0) if problem else compare(ref, words(transcript(speech, key)))
            problem = problem or ("%d words skipped in a row" % missed if missed >= MAX_GAP
                       else "%d words added in a row" % extra if extra >= MAX_GAP else "misread" if err > MAX_WER else "")
            checked = "not checked     " if err is None else "%2.0f%% word errors" % (err * 100)
            if problem:
                f = st["fails"].get(s["id"], {"count": 0})
                st["fails"][s["id"]] = {"hash": h, "count": f["count"] + 1, "wer": None if err is None else round(err, 3), "problem": problem,
                                        "seconds": round(sec, 1), "pace": pace_of(s), "date": today()}
                print("%-22s %s  %s  NOT KEPT (%s)" % (s["id"], clock(sec), checked, problem), flush=True)
                # Saved, to be checked again on the next run without a new recording (an earlier one goes to rejected/).
                if os.path.exists(rejected_path(s, h)):
                    with wave.open(rejected_path(s, h)) as w:
                        keep_rejected(w.readframes(w.getnframes()), s["id"])
                write_wav(speech, rejected_path(s, h))
                st["rejected"][s["id"]] = {"hash": h, "problem": problem, "date": today()}
            else:
                encode(silence(LEAD_IN) + whole + silence(TAIL), take_path(s, h))
                voices = {sp: s["cast"][sp]["gemini"] for sp in speakers(s)}
                st["takes"][s["id"]] = {"hash": h, "seconds": round(sec, 1), "wer": round(err, 3), "voices": voices, "pace": pace_of(s), "date": today()}
                st["fails"].pop(s["id"], None)
                if st["rejected"].pop(s["id"], None) and os.path.exists(rejected_path(s, h)):
                    os.remove(rejected_path(s, h))
                print("%-22s %s  %2.0f%% word errors  ready (%s)" % (s["id"], clock(sec), err * 100, ", ".join(voices.values())), flush=True)
            if st["unchecked"].pop(s["id"], None) and os.path.exists(unchecked_path(s, h)):
                os.remove(unchecked_path(s, h))
            save_json(status_file, st)
    except DailyLimit:
        print("Stopped at Gemini's daily limit (10 requests on the free tier). The next run continues.", flush=True)
    except Busy as e:
        print("Stopped: %s. The next run continues." % ("the batch ran out of time" if str(e).startswith("out of time")
              else "Gemini stayed unavailable after every retry (%s)" % e), flush=True)
    ready = sum(take_ready(st, s) for s in everything if s not in done)
    stuck = [k for k, v in st["fails"].items() if v.get("count", 0) >= 2]
    print("Gemini: %d of %d ready (%d on the site, %d waiting to go on it)" % (len(done) + ready, len(everything), len(done), ready))
    if items:
        have = sum(on_site_gemini(manifest, s) or take_ready(st, s) for s in items)
        print("Exam: %d of %d items ready" % (have, len(items)))
    if st["unchecked"]:
        print("Recorded, not checked yet (kept for the next run): " + ", ".join(sorted(st["unchecked"])))
    if stuck:
        print("Failed twice, needs a look: " + ", ".join(sorted(stuck)))
    if len(done) + ready == len(everything):
        print("ALL READY" + ("" if st.get("announced") else " (new)"))
        st["announced"] = True
    else:
        st["announced"] = False
    save_json(status_file, st)
    word_targets(st, sets, manifest)


def use_gemini(sets, ids):  # sets here are sets and exam items
    st, manifest = load_status(), load_json(MANIFEST, {})
    used = 0
    for s in sets:
        if ids and s["id"] not in ids:
            continue
        if on_site_gemini(manifest, s) or not take_ready(st, s):
            if ids:
                print("%-22s %s" % (s["id"], "already on the site" if on_site_gemini(manifest, s) else "no Gemini take for the current script"))
            continue
        # Copied, not moved: the cached take is deleted by the next --gemini run once the
        # recordings.json it reads (main's, for the routine) says the set is converted.
        os.makedirs(os.path.dirname(out_path(s)), exist_ok=True)
        shutil.copyfile(take_path(s), out_path(s))
        t = st["takes"][s["id"]]
        manifest[s["id"]] = {"engine": "gemini", "voices": t["voices"], "hash": t["hash"], "seconds": t["seconds"], "pace": t["pace"], "date": today()}
        print("%-22s %s  on the site (%s)" % (s["id"], clock(t["seconds"]), ", ".join(t["voices"].values())))
        used += 1
    save_json(MANIFEST, manifest)
    word_targets(st, [s for s in sets if "exam" not in s], manifest)
    print("Put %d Gemini recording%s on the site" % (used, "" if used == 1 else "s"))


def status(sets, items):
    st, manifest = load_status(), load_json(MANIFEST, {})
    targets, counts = word_targets(st, sets, manifest), {}
    for s in sets + items:
        exam = "exam" in s
        m = manifest.get(s["id"])
        if not m or not os.path.exists(out_path(s)):
            site = "missing"
        else:
            site = "%s %s%s (%s)" % (m["engine"], clock(m["seconds"]), "" if m["hash"] == content_hash(s) else ", out of date", ", ".join(m["voices"].values()))
            counts[m["engine"]] = counts.get(m["engine"], 0) + 1
        t = st["takes"].get(s["id"])
        fails = st["fails"].get(s["id"], {}).get("count", 0)
        expected = None if exam else expected_problem(targets, s)
        u = st["unchecked"].get(s["id"])
        gem = ("on the site" if on_site_gemini(manifest, s) else "ready %s" % clock(t["seconds"]) if take_ready(st, s)
               else "recorded %s, not checked yet" % clock(u["seconds"]) if u and u.get("hash") == content_hash(s)
               else "failed %d×" % fails if fails else "script %s (%d words, target %d)" % expected if expected
               else "to do (narrator question not recorded)" if exam and not have_clip(s) else "to do")
        print("%-22s %s %4d words  site: %-52s gemini: %s" % (s["id"], s["level"], len(doc_words(s) if exam else script_words(s)), site, gem))
    ready = sum(take_ready(st, s) for s in sets + items if not on_site_gemini(manifest, s))
    print("\nSite: %s · Gemini takes waiting to go on the site: %d" % (", ".join("%d %s" % (n, e) for e, n in sorted(counts.items())) or "none", ready))
    if items:
        for exam in sorted({s["exam"] for s in items}):
            mine = [s for s in items if s["exam"] == exam]
            print("%s: %d of %d items on the site with Gemini, %d more ready" % (exam, sum(on_site_gemini(manifest, s) for s in mine), len(mine),
                  sum(take_ready(st, s) and not on_site_gemini(manifest, s) for s in mine)))
    print("Script targets for about 2:15: " + " · ".join("%s at least %d words (Gemini reads %.0f a minute, from %d reads)" % (lv, t["minWords"], t["wpm"], t["reads"]) for lv, t in targets.items()))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    sets = load_sets()
    items = load_exam()
    known = {"--force", "--gemini", "--use-gemini", "--status", "--word-counts"}
    if flags - known:  # a mistyped flag (--help included) used to start a Microsoft recording
        sys.exit("Unknown option: %s. Options: %s" % (", ".join(sorted(flags - known)), ", ".join(sorted(known))))
    unknown = [a for a in args if a not in {s["id"] for s in sets + items}]
    if unknown:
        sys.exit("Unknown set id: " + ", ".join(unknown))
    if "--word-counts" in flags:  # for tools/check_co.js, so both count the spoken words the same way
        print(json.dumps({s["id"]: len(script_words(s)) for s in sets + items}))
    elif "--status" in flags:
        status(sets, items)
    elif "--gemini" in flags:
        run_gemini(sets, items, set(args))
    elif "--use-gemini" in flags:
        use_gemini(sets + items, set(args))
    else:
        run_microsoft(sets, items, "--force" in flags, set(args))


if __name__ == "__main__":
    main()
