# Réussir le TCF: project notes

## The exam is TCF Canada
- Everything here targets the **TCF Canada** from France Éducation International (FEI), the version IRCC accepts for Express Entry and citizenship. It is not the TCF tout public, the DELF/DALF or the TEF Canada.
- All guidelines, grading rubrics, Claude prompts and generated exercises must follow TCF Canada. The single source of truth is `TCF_CANADA` in `site/data.js`. `site/app.js` builds `EXAM_BRIEF`, `EE_RUBRIC` and `EO_RUBRIC` from it and includes them in every Claude request.
- Sources: the official *Manuel du candidat TCF Canada* (FEI) and IRCC's TCF Canada → NCLC equivalence table. FEI's internal marking grids aren't public, so we use the criteria it publishes. Linguistic: vocabulary range, grammatical accuracy, spelling, how elaborate the sentences are. Pragmatic: coherence and cohesion, thematic development. Sociolinguistic: fit with the communication situation.

### Format
- **CO:** 39 items, 35 min. Each recording is heard once. Four options, one correct. Items get harder from A1 to C2. Some items use Canadian accents or contexts.
- **CE:** 39 items, 60 min.
- **EE:** 60 min, no dictionary, only the final text is marked.
  - T1: a message, 60–120 words.
  - T2: an article or letter with opinions toward a stated objective, 120–150 words.
  - T3: 120–180 words in two parts. Part 1 (40–60 words) compares two documents of about 90 words each. Part 2 (80–120 words) takes a position.
- **EO:** 12 min with an examiner.
  - T1: entretien dirigé, 2 min, no preparation.
  - T2: exercice en interaction, 5 min 30, including 2 min preparation with notes allowed.
  - T3: point de vue, 4 min 30, no preparation.
- Writing and speaking topics lean toward emigration and expatriation to Canada.

### Scores
- CO and CE are scored 100–699 (A1 100–199 … C2 600–699). EE and EO are scored 0–20 (B1 6–9, B2 10–13, C1 14–15, C1–C2 16–20).
- NCLC: 5 = 6/20, 6 = 7–9, **7 = 10–11**, 8 = 12–13, 9 = 14–15, 10+ = 16–20. For CO, NCLC 7 = 458–502; for CE, 453–498. IRCC never averages skills.

## The learner
- Currently B1, targeting **NCLC 7 in all four skills**. The plan builds up from B1 through B1+ to B2 across five phases.
- Known recurring errors are listed in `KNOWN_ERRORS` in `site/data.js`.

## Files
- `01`–`04-*.md`: the roadmap (assessment and phases, grammar progression, weekly study system, vocabulary/speaking/writing).
- `site/`: the practice website.
  - `index.html`: page shell and CSS. White by default; dark mode is a manual toggle that adds the `dark` class to `<html>`. No purple palette.
  - `data.js`: curriculum content plus the `TCF_CANADA` spec.
  - `anki.js`: the learner's own Anki deck, "Mes cartes Anki" (100 cards from `~/French/french-cards.apkg`), loaded right after `data.js`.
    - Cards that duplicated it were removed from the built-in themes.
    - Their Anki review progress was copied into the `srs` collection under ids `anki--<slug of the French side>`. Changing a card's French side resets its progress.
    - Keep one copy of each word across all decks.
  - `app.js`: the app logic.
  - `comp-ce.js`: built-in reading (CE) sets, one B1 and one B2 for every topic. Switching topic never needs Claude.
  - `exam-ce.js`: the built-in CE practice exam (Examen blanc). It has 39 items, one document each, in the level blocks of `TCF_CANADA.ceExam` (A1 ×4 up to C2 ×4). Its score is an estimate from the points per level that prep sites use, because FEI doesn't publish its own scoring.
  - `comp-co.js`: all 31 built-in listening (CO) sets, one B1 and one B2 for every topic. Each plays `audio/<id>.mp4`.
    - Every recording lasts 2 to 4 minutes (B1 300–340 words, B2 380–430) and has 6 questions, with option lengths held to the same rule as CE.
    - Each set has a `cast`, which the site ignores: a note on the scene and, for each speaker (two at most), a Gemini voice, a Microsoft voice and a delivery note. Montreal French Gemini voices for Canadian settings, Paris French otherwise; Microsoft `vivienne` for women and narrators, `remy` for men.
  - `audio/`: the recordings. The user prefers Gemini, then Vivienne, then Rémy, and never Denise. They're made with Microsoft voices now and replaced by Gemini 3.8 Flash TTS takes over time. Sets without a recording, such as Claude's extra sets, fall back to the browser's best French voice.
- `server/`: runs the site locally on the user's Mac, with progress in SQLite. No npm dependencies; it needs Node 22.13+ for the built-in `node:sqlite`.
  - `npm start` serves `site/` at http://localhost:4173 and keeps progress in `data/tcf.sqlite` (git-ignored; `TCF_DB` and `PORT` override).
  - `db.js`: one `docs` table (`coll`, `id`, `data` JSON, `updated`), using the same collections as the claude.ai page.
  - `server.js`: `GET /api/data` returns every collection; `PUT`/`DELETE /api/data/<coll>/<id>` write one document. Audio is served with byte ranges so Safari can play and seek it.
  - `npm run import -- file.json` merges an export (`{coll: {id: doc}}`) into the database. A claude.ai export can be made with ArtifactData.
  - `app.js` picks its store at boot: the claude.ai `db` when `window.claude` exists, then this server, then the browser's localStorage. On first run with an empty database, it copies over whatever that browser had in localStorage.
  - The local site and the claude.ai page keep separate progress. Claude features (corrections, extra sets, "Suggest 3") only work on claude.ai.
- `tools/make_audio.py` (+ `tools/export_co.js`): records the listening sets. `tools/recordings.json` notes which voices made each file, from which version of the script.
  - `python3 tools/make_audio.py` records new or changed sets with Microsoft voices (edge-tts) and deletes audio that no set uses. `--force` re-records every set; set ids re-record just those. A recording under 2 minutes or over 4 fails.
  - `--gemini` records Gemini takes, one request per set, into `~/Library/Application Support/tcf-reussir/gemini/`. It checks each take by transcribing it with `gemini-3.8-flash` and stops at the free tier's limit of 10 requests a day. `--status` shows progress. `--use-gemini` copies the ready takes onto the site; the routine runs it every night.
    - `tools/recordings.json` is the record of which sets are converted (`engine: "gemini"` with the current script's hash). `--gemini` never re-records those, and `--force` leaves them alone unless they're named, so no request is spent twice. Check `--status` before recording anything.
    - A take outside 2–4 minutes, or with skipped, added or misread words, isn't kept. After two failures a set waits for a look. Changing a level's `PACE` instruction clears its earlier failures.
    - To save requests, a take outside 2–4 minutes isn't transcribed. Before each request, the script's word count is checked against the slowest and fastest pace Gemini has read that level with the current instruction; a script that can't reach 2–4 minutes is skipped until it's rewritten (`--status` shows the expected length).
    - Gemini reads fast, so B1 asks for a slow pace. Its first instruction ("unhurried") gave about 180 words a minute, which made the B1 takes last about 1:50.
  - The daily scheduled task `co-gemini-audio` runs `--gemini` at 00:30 Pacific, just after Google's daily reset, It runs `~/.claude/scheduled-tasks/co-gemini-audio/run.sh`, a single command so its permission can be saved. The script works in a throwaway worktree of `origin/main`: it records, runs `--use-gemini` and `check_co.js`, then commits the new recordings and **pushes them straight to main**, as the user chose on 2026-09-27. Changes to the recorder reach the routine only once they're merged. When all 31 sets are converted, the routine reminds the user once and turns itself off. The live site is still republished only when the user asks.
  - Gemini reads its key from `~/.config/gemini/api_key`, which the user saves; never type or print the key. Microsoft needs `python3 -m pip install --user edge-tts`. Both need node and macOS `afconvert`.
  - After editing `comp-co.js`, run `node tools/check_co.js`, then `python3 tools/make_audio.py`.
- `tools/check_co.js`: checks the listening sets: structure, 6 questions, the cast, script length and option lengths. It also checks that every set has an up-to-date recording of 2 to 4 minutes and that no audio file is left over.
- `tools/check_ce.js`: checks the CE sets and the practice exam.
  - Structure: unique ids, a B1 and a B2 set for every topic, 4 options per question, and the exam's level blocks.
  - Option lengths: the right answer must not stand out as the longest or shortest option.
  - Run `node tools/check_ce.js` after editing `comp-ce.js`, the CE sets in `data.js` or `exam-ce.js`.

## Publishing
- Live site, private to the user: https://claude.ai/artifact/DSZbMSPYaH838KTwT7dff8
- Republish `site/index.html` to that URL, with `data.js`, `anki.js`, `comp-ce.js`, `exam-ce.js`, `comp-co.js`, `app.js` and every `audio/*.mp4` as supporting files. Artifacts serve `.mp4` but not `.m4a`. Keep the capabilities `db` (the user's progress) and `sample` (Claude features).
- GitHub: https://github.com/tonytrinh19/reussir-tct (remote `origin`, branch `main`).
- Progress lives in the artifact's database, not in these files. Collections: settings, days, drills, srs, cards, writing, errors, homework, speaking, comp, mocks, inprogress.
  - Each `comp` attempt records `setId`, `answers`, `secs` and `timed`, which the Compréhension history tree reads.
  - Claude's sets and exams also keep `snap`, a copy of the content, so they can be reopened.
  - A finished CE practice exam is saved with `kind: "exam"`. It also adds a `mocks` entry, labelled as a site estimate.
- History keeps only two kinds of record, shown in Progrès → Historique:
  - **Unfinished attempts** live in `inprogress`, one record per activity:
    - `drill--<topic>--<set>` and `drill--mixed`
    - `prod--<topic>`
    - `ce--<setId>` and `co--<setId>`
    - `exam--ce`
    - `writing--t1…t3`
    - `speaking--t1…t3`

    A record is written at the first real answer or keystroke (typing is saved 1.5 s after it stops). It's deleted when the attempt is submitted or discarded. Nothing is saved when something is only opened or generated.
  - **Finished attempts** keep what's needed to review them:
    - Drill rounds keep every question with the answer given (`items`). A "retry the misses" round only adds `retry: {score, total}` to its round.
    - Production checks keep `text` and `fb`.
    - Speaking attempts keep the Tâche 2 conversation (`chat`).
  - **Claude's follow-up homework** (from writing corrections and "Suggest 3") is saved only when the learner presses Add.
