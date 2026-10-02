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

Usage: python3 tools/make_audio.py               record new or changed sets with Microsoft
       python3 tools/make_audio.py --force       re-record every set with Microsoft (except Gemini ones)
       python3 tools/make_audio.py co-sante-b2   re-record one set with Microsoft
       python3 tools/make_audio.py --gemini      record Gemini takes until the daily limit
       python3 tools/make_audio.py --use-gemini  put the ready Gemini takes on the site (all, or set ids)
       python3 tools/make_audio.py --status      show each set's recording and the script targets
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

# Microsoft neural voices, slowed per level to about 150 (B1) and 180 (B2) words a minute.
MS_VOICES = {"vivienne": "fr-FR-VivienneMultilingualNeural", "remy": "fr-FR-RemyMultilingualNeural"}
MS_RATE = {("vivienne", "B1"): "-28%", ("vivienne", "B2"): "-20%", ("remy", "B1"): "-22%", ("remy", "B2"): "-5%"}

GEMINI_API = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_TTS = "gemini-3.8-flash-tts"
GEMINI_CHECK = "gemini-3.8-flash"  # transcribes each take to catch skipped or repeated words
MAX_WER, MAX_GAP = 0.08, 5  # a take fails over 8% word errors, or with 5+ words skipped or added in a row
# Gemini reads fast: "unhurried" still gave B1 about 180 words a minute (1:50), so B1 asks for a slow pace.
PACE = {"B1": "Speak slowly and clearly, as for a learner of French at level B1, and leave a short pause after each sentence.",
        "B2": "Speak at a natural pace."}
# One stuck request used to hold the whole batch past the routine's limit, with nothing printed.
# Each attempt now waits at most REQUEST_TIMEOUT for Gemini to answer, a failed attempt (an error
# code, a dropped connection or a timeout) is retried after 15 s, 30 s, 60 s, and the batch stops
# cleanly once it has run BATCH_MINUTES, so the rest of run.sh still puts the ready takes on the site.
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


def content_hash(s):
    """Changes whenever the script or the cast changes (same as hashOf in tools/check_co.js)."""
    data = {"level": s["level"], "lines": s["lines"]}
    if s.get("cast") is not None:
        data["cast"] = s["cast"]
    blob = json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha1(blob.encode("utf-8")).hexdigest()[:12]


def speakers(s):
    """The set's speakers, in the order they first speak."""
    return list(dict.fromkeys(line["speaker"] for line in s["lines"]))


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


# ---------------------------------------------------------------- Microsoft (edge-tts)

def ask_for_better_mp3():
    """edge-tts always asks for 48 kbps MP3; the service also serves 96 kbps, so ask for that."""
    import aiohttp
    send = aiohttp.ClientWebSocketResponse.send_str

    async def send_str(self, data, *args, **kwargs):
        return await send(self, data.replace("audio-24khz-48kbitrate-mono-mp3", "audio-24khz-96kbitrate-mono-mp3"), *args, **kwargs)
    aiohttp.ClientWebSocketResponse.send_str = send_str


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
                        await edge_tts.Communicate(tts_text(line["text"]), MS_VOICES[who["ms"]], rate=MS_RATE[(who["ms"], s["level"])]).save(mp3)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
                parts.append(decode(mp3))
                if i + 1 < len(lines):
                    gap = GAP_TURN if lines[i + 1]["speaker"] != line["speaker"] else GAP_SAME
                    parts.append(silence(gap))
                    pauses += gap
            parts.append(silence(TAIL))
            sec = encode(b"".join(parts), os.path.join(AUDIO, s["id"] + ".mp4"))
    wpm = len(script_words(s)) / max(1, sec - pauses) * 60
    voices = {sp: s["cast"][sp]["ms"] for sp in speakers(s)}
    print("%-22s %s %s  %3.0f words/min  %s%s" % (s["id"], s["level"], clock(sec), wpm, "+".join(dict.fromkeys(voices.values())), ("  " + length_problem(sec).upper()) if length_problem(sec) else ""), flush=True)
    return {"engine": "microsoft", "voices": voices, "hash": content_hash(s), "seconds": round(sec, 1), "date": today()}


def run_microsoft(sets, force, ids):
    manifest = load_json(MANIFEST, {})
    todo = []
    for s in sets:
        m, f = manifest.get(s["id"]), os.path.join(AUDIO, s["id"] + ".mp4")
        if ids:
            if s["id"] in ids:
                todo.append(s)
        elif not os.path.exists(f) or not m or m.get("hash") != content_hash(s) or force and not on_site_gemini(manifest, s):
            todo.append(s)
    print("Recording %d of %d sets with Microsoft voices" % (len(todo), len(sets)), flush=True)
    if todo:
        ask_for_better_mp3()
        os.makedirs(AUDIO, exist_ok=True)

        async def go():
            sem = asyncio.Semaphore(4)
            return await asyncio.gather(*(ms_record(s, sem) for s in todo))
        for s, entry in zip(todo, asyncio.run(go())):
            manifest[s["id"]] = entry
    prune(sets, manifest)
    save_json(MANIFEST, manifest)
    bad = ["%s (%s)" % (s["id"], length_problem(manifest[s["id"]]["seconds"])) for s in todo if length_problem(manifest[s["id"]]["seconds"])]
    if bad:
        sys.exit("Recordings must last 1:45 to 4 minutes; change the script: " + ", ".join(bad))


def length_problem(sec):
    return "too short" if sec < MIN_SECONDS else "too long" if sec > MAX_SECONDS else ""


def prune(sets, manifest):
    """Delete recordings (and manifest entries) that no set uses any more."""
    ids = {s["id"] for s in sets}
    for f in sorted(os.listdir(AUDIO)) if os.path.isdir(AUDIO) else []:
        if f.endswith(".mp4") and f[:-4] not in ids:
            os.remove(os.path.join(AUDIO, f))
            print("Removed site/audio/%s: no set uses it" % f)
    for k in [k for k in manifest if k not in ids]:
        del manifest[k]


# ---------------------------------------------------------------- Gemini

class DailyLimit(Exception):
    pass


class Busy(Exception):
    """Gemini still fails (5xx such as 503 "high demand", a dropped connection, a timeout) after every retry,
    or the batch has run out of time."""


DEADLINE = [None]  # time.monotonic() after which no new attempt starts (set by run_gemini)


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
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
                return json.loads(r.read())
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
            problem = ("no answer in %d s" % REQUEST_TIMEOUT if isinstance(reason, (TimeoutError, socket.timeout))
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
    cast, who = s["cast"], speakers(s)
    content = []
    for line in s["lines"]:
        meta = {"type": "speech_metadata", "style": " ".join([cast["scene"], cast[line["speaker"]]["style"], PACE[s["level"]]])}
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
    return st


def run_gemini(sets):
    key = api_key()
    os.makedirs(CACHE, exist_ok=True)
    st = load_status()
    status_file = os.path.join(CACHE, "status.json")
    # Forget takes and failures for scripts that have changed, and delete their files.
    current = {(s["id"], content_hash(s)) for s in sets}
    for f in os.listdir(CACHE):
        m = re.match(r"(.+)-([0-9a-f]{12})\.(?:mp4|unchecked\.wav)$", f)
        if m and (m.group(1), m.group(2)) not in current:
            os.remove(os.path.join(CACHE, f))
    for bucket in ("takes", "fails", "unchecked"):
        st[bucket] = {k: v for k, v in st[bucket].items() if (k, v.get("hash")) in current}
    # A failure under an older pace instruction doesn't count against the set.
    level = {s["id"]: s["level"] for s in sets}
    st["fails"] = {k: v for k, v in st["fails"].items() if v.get("pace") == PACE[level[k]]}
    manifest = load_json(MANIFEST, {})
    done = [s for s in sets if on_site_gemini(manifest, s)]
    todo = [s for s in sets if s not in done and not take_ready(st, s) and st["fails"].get(s["id"], {}).get("count", 0) < 2]
    for s in done:  # converted: the cached copies are no longer needed
        if st["takes"].pop(s["id"], None) and os.path.exists(take_path(s)):
            os.remove(take_path(s))
        if st["unchecked"].pop(s["id"], None) and os.path.exists(unchecked_path(s)):
            os.remove(unchecked_path(s))
    # Takes already recorded but not checked go first: they cost no recording request.
    todo.sort(key=lambda s: s["id"] not in st["unchecked"])
    if done:
        print("Already on the site with Gemini, skipped: %d" % len(done), flush=True)
    print("Gemini: %d set%s to record" % (len(todo), "" if len(todo) == 1 else "s"), flush=True)
    DEADLINE[0] = time.monotonic() + BATCH_MINUTES * 60
    try:
        for s in todo:
            if out_of_time():
                raise Busy("out of time: the batch ran %d minutes" % BATCH_MINUTES)
            # Checked before each request, with the targets learned from every take so far.
            expected = expected_problem(word_targets(st, sets, manifest), s)
            if expected:
                print("%-22s %s  skipped: script %s (%d words, the target is %s %d for about 2:15 at Gemini's pace)" % (
                    s["id"], s["level"], expected[0], expected[1], "at least" if expected[0] == "too short" else "at most", expected[2]), flush=True)
                continue
            h = content_hash(s)
            speech = load_unchecked(st, s)
            if speech is not None:
                print("%-22s %s  checking the take recorded on %s… (%s)" % (s["id"], s["level"], st["unchecked"][s["id"]]["date"], time.strftime("%H:%M:%S")), flush=True)
            else:
                print("%-22s %s  recording… (%s)" % (s["id"], s["level"], time.strftime("%H:%M:%S")), flush=True)
                speech = gemini_speak(s, key)
            sec = (len(speech) / 2 + int(SR * (LEAD_IN + TAIL))) / SR
            if not length_problem(sec) and s["id"] not in st["unchecked"]:
                # Saved before the check, so a transcription outage doesn't throw the recording away.
                write_wav(speech, unchecked_path(s, h))
                st["unchecked"][s["id"]] = {"hash": h, "seconds": round(sec, 1), "pace": PACE[s["level"]], "date": today()}
                save_json(status_file, st)
            # A take outside 2–4 minutes can't be kept, so it isn't worth a transcription request.
            problem = length_problem(sec)
            err, missed, extra = (None, 0, 0) if problem else compare(script_words(s), words(transcript(speech, key)))
            problem = problem or ("%d words skipped in a row" % missed if missed >= MAX_GAP
                       else "%d words added in a row" % extra if extra >= MAX_GAP else "misread" if err > MAX_WER else "")
            checked = "not checked     " if err is None else "%2.0f%% word errors" % (err * 100)
            if problem:
                f = st["fails"].get(s["id"], {"count": 0})
                st["fails"][s["id"]] = {"hash": h, "count": f["count"] + 1, "wer": None if err is None else round(err, 3), "problem": problem,
                                        "seconds": round(sec, 1), "pace": PACE[s["level"]], "date": today()}
                print("%-22s %s  %s  NOT KEPT (%s)" % (s["id"], clock(sec), checked, problem), flush=True)
            else:
                encode(silence(LEAD_IN) + speech + silence(TAIL), take_path(s, h))
                voices = {sp: s["cast"][sp]["gemini"] for sp in speakers(s)}
                st["takes"][s["id"]] = {"hash": h, "seconds": round(sec, 1), "wer": round(err, 3), "voices": voices, "pace": PACE[s["level"]], "date": today()}
                st["fails"].pop(s["id"], None)
                print("%-22s %s  %2.0f%% word errors  ready (%s)" % (s["id"], clock(sec), err * 100, ", ".join(voices.values())), flush=True)
            if st["unchecked"].pop(s["id"], None) and os.path.exists(unchecked_path(s, h)):
                os.remove(unchecked_path(s, h))
            save_json(status_file, st)
    except DailyLimit:
        print("Stopped at Gemini's daily limit (10 requests on the free tier). The next run continues.", flush=True)
    except Busy as e:
        print("Stopped: %s. The next run continues." % ("the batch ran out of time" if str(e).startswith("out of time")
              else "Gemini stayed unavailable after every retry (%s)" % e), flush=True)
    ready = sum(take_ready(st, s) for s in sets if s not in done)
    stuck = [k for k, v in st["fails"].items() if v.get("count", 0) >= 2]
    print("Gemini: %d of %d ready (%d on the site, %d waiting to go on it)" % (len(done) + ready, len(sets), len(done), ready))
    if st["unchecked"]:
        print("Recorded, not checked yet (kept for the next run): " + ", ".join(sorted(st["unchecked"])))
    if stuck:
        print("Failed twice, needs a look: " + ", ".join(sorted(stuck)))
    if len(done) + ready == len(sets):
        print("ALL READY" + ("" if st.get("announced") else " (new)"))
        st["announced"] = True
    else:
        st["announced"] = False
    save_json(status_file, st)
    word_targets(st, sets, manifest)


def use_gemini(sets, ids):
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
        shutil.copyfile(take_path(s), os.path.join(AUDIO, s["id"] + ".mp4"))
        t = st["takes"][s["id"]]
        manifest[s["id"]] = {"engine": "gemini", "voices": t["voices"], "hash": t["hash"], "seconds": t["seconds"], "pace": t["pace"], "date": today()}
        print("%-22s %s  on the site (%s)" % (s["id"], clock(t["seconds"]), ", ".join(t["voices"].values())))
        used += 1
    save_json(MANIFEST, manifest)
    word_targets(st, sets, manifest)
    print("Put %d Gemini recording%s on the site" % (used, "" if used == 1 else "s"))


def status(sets):
    st, manifest = load_status(), load_json(MANIFEST, {})
    targets, counts = word_targets(st, sets, manifest), {}
    for s in sets:
        m = manifest.get(s["id"])
        if not m or not os.path.exists(os.path.join(AUDIO, s["id"] + ".mp4")):
            site = "missing"
        else:
            site = "%s %s%s (%s)" % (m["engine"], clock(m["seconds"]), "" if m["hash"] == content_hash(s) else ", out of date", ", ".join(m["voices"].values()))
            counts[m["engine"]] = counts.get(m["engine"], 0) + 1
        t = st["takes"].get(s["id"])
        fails = st["fails"].get(s["id"], {}).get("count", 0)
        expected = expected_problem(targets, s)
        u = st["unchecked"].get(s["id"])
        gem = ("on the site" if on_site_gemini(manifest, s) else "ready %s" % clock(t["seconds"]) if take_ready(st, s)
               else "recorded %s, not checked yet" % clock(u["seconds"]) if u and u.get("hash") == content_hash(s)
               else "failed %d×" % fails if fails else "script %s (%d words, target %d)" % expected if expected else "to do")
        print("%-22s %s %4d words  site: %-52s gemini: %s" % (s["id"], s["level"], len(script_words(s)), site, gem))
    ready = sum(take_ready(st, s) for s in sets if not on_site_gemini(manifest, s))
    print("\nSite: %s · Gemini takes waiting to go on the site: %d" % (", ".join("%d %s" % (n, e) for e, n in sorted(counts.items())) or "none", ready))
    print("Script targets for about 2:15: " + " · ".join("%s at least %d words (Gemini reads %.0f a minute, from %d reads)" % (lv, t["minWords"], t["wpm"], t["reads"]) for lv, t in targets.items()))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    sets = load_sets()
    unknown = [a for a in args if a not in {s["id"] for s in sets}]
    if unknown:
        sys.exit("Unknown set id: " + ", ".join(unknown))
    if "--word-counts" in flags:  # for tools/check_co.js, so both count the spoken words the same way
        print(json.dumps({s["id"]: len(script_words(s)) for s in sets}))
    elif "--status" in flags:
        status(sets)
    elif "--gemini" in flags:
        run_gemini(sets)
    elif "--use-gemini" in flags:
        use_gemini(sets, set(args))
    else:
        run_microsoft(sets, "--force" in flags, set(args))


if __name__ == "__main__":
    main()
