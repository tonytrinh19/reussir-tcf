#!/usr/bin/env python3
"""Record the built-in Compréhension orale sets with one natural neural voice.

Reads the scripts from site/comp-co.js (through tools/export_co.js), synthesizes each line with
Microsoft's neural French voice via edge-tts, joins the lines with short pauses (longer when the
speaker changes) and writes one AAC file per set to site/audio/<id>.mp4.

Needs: python3 -m pip install --user edge-tts ; node ; macOS afconvert.
Usage: python3 tools/make_audio.py            (only sets without a file yet)
       python3 tools/make_audio.py --force    (re-record everything)
       python3 tools/make_audio.py co-sante-b2 (re-record one set)
"""
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import edge_tts

VOICE = "fr-FR-DeniseNeural"  # one voice for every recording
RATE = {"B1": "-5%", "B2": "+0%"}
SR = 24000
GAP_SAME, GAP_TURN, LEAD_IN, TAIL = 0.45, 0.8, 0.4, 0.6
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "audio")


def tts_text(s):
    """Spell out what text-to-speech can misread (same rules as ttsText in app.js)."""
    s = re.sub(r"(\d{1,2})\s?h\s?(\d{2})(?!\d)", r"\1 heures \2", s)
    s = re.sub(r"(\d{1,2})\s?h(?![a-zà-ÿ\d])", r"\1 heures", s, flags=re.I)
    s = re.sub(r"\b1 heures\b", "une heure", s)
    s = re.sub(r"(\d+(?:[.,]\d+)?)\s?\$", r"\1 dollars", s)
    s = re.sub(r"(\d+)\s?%", r"\1 pour cent", s)
    s = re.sub(r"\b1er\b", "premier", s)
    s = re.sub(r"\b1re\b", "première", s)
    return re.sub(r"\s+", " ", s).strip()


def silence(sec):
    return b"\x00\x00" * int(SR * sec)


def pcm(mp3, tmp):
    wav = mp3[:-4] + ".wav"
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@%d" % SR, "-c", "1", mp3, wav], check=True, capture_output=True)
    with wave.open(wav, "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.readframes(w.getnframes())


async def record(s, sem):
    out = os.path.join(OUT, s["id"] + ".mp4")
    async with sem:
        with tempfile.TemporaryDirectory() as tmp:
            parts = [silence(LEAD_IN)]
            for i, line in enumerate(s["lines"]):
                mp3 = os.path.join(tmp, "l%02d.mp3" % i)
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(tts_text(line["text"]), VOICE, rate=RATE.get(s["level"], "+0%")).save(mp3)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
                parts.append(pcm(mp3, tmp))
                nxt = s["lines"][i + 1] if i + 1 < len(s["lines"]) else None
                parts.append(silence(TAIL if nxt is None else GAP_TURN if nxt["speaker"] != line["speaker"] else GAP_SAME))
            wav = os.path.join(tmp, "all.wav")
            with wave.open(wav, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(SR)
                w.writeframes(b"".join(parts))
            subprocess.run(["afconvert", "-f", "mp4f", "-d", "aac", "-b", "48000", wav, out], check=True, capture_output=True)
    frames = sum(len(p) for p in parts) // 2
    print("%-24s %5.1f s  %4d KB" % (s["id"], frames / SR, os.path.getsize(out) // 1024), flush=True)


async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    sets = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools", "export_co.js")], check=True, capture_output=True, text=True).stdout)
    os.makedirs(OUT, exist_ok=True)
    todo = [s for s in sets if (s["id"] in args) or (not args and (force or not os.path.exists(os.path.join(OUT, s["id"] + ".mp4"))))]
    print("Recording %d of %d sets with %s" % (len(todo), len(sets), VOICE), flush=True)
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(record(s, sem) for s in todo))


if __name__ == "__main__":
    asyncio.run(main())
