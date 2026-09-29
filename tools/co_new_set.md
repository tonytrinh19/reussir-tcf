# Making a requested listening set

On the live site, the CO page's **Request a new … set** button adds a document to the `cosets`
collection of https://claude.ai/artifact/DSZbMSPYaH838KTwT7dff8:

```json
{ "status": "requested", "level": "B1", "theme": "immigration", "n": 2,
  "avoid": ["titles of the sets already on this topic and level"], "requested": "2026-09-29" }
```

The nightly routine (`co-gemini-audio`) makes each requested set on the Mac: it writes the set,
checks it, records it with Vivienne and Rémy, uploads the recording to the artifact's asset
store and turns the document into the set. The page then lists it under its topic and level
with its own history. `~/.claude/scheduled-tasks/co-gemini-audio/extra.sh` (a copy of
`tools/co_extra.sh`) runs the tools below from GitHub main.

## Steps, for each requested document (at most 3 a night)

1. Write the set as JSON (below) to a work file, e.g. `work/<id>.json` in the routine's folder.
   The id is the document id.
2. `extra.sh check work/<id>.json` (`node tools/check_co.js --one`). Fix what it reports, and run
   it again until it prints OK.
3. `extra.sh record work/<id>.json work/<id>.mp4` (`python3 tools/make_audio.py --one`). It prints
   `{"seconds", "voices"}`. A recording outside 2–4 minutes fails: lengthen or shorten the script
   within its word range, check, and record again.
4. Upload the recording with the Artifact tool: `publish` with the artifact's `url`, the mp4 as
   `file_path` and `asset: true`. Keep the returned asset id. If the upload is refused because
   this session hasn't read the artifact, read it first (`action: "read"`) and retry.
5. With the ArtifactData tool, `update` the document in `cosets` (pinned to the version you read):
   `status: "ready"`, `title`, `context`, `lines`, `questions`, `cast`,
   `audio: {asset: "<asset id>", seconds, voices}` and `made: "<today, YYYY-MM-DD>"`.
6. Delete the work files.

If a set still fails after 5 tries, update its document to `status: "failed"` with a
one-sentence `reason` instead. The page shows it, with Try again and Remove. Never publish or
republish the page itself: only the recording goes up, as an asset.

## The set

A complete example that passes the check (recorded at 2:41): `tools/co_new_set.example.json`.

```json
{
  "id": "co-immigration-b1-2", "level": "B1", "theme": "immigration",
  "title": "Un titre court en français",
  "context": "Une phrase en français qui décrit la situation, montrée avant l'écoute.",
  "lines": [{ "speaker": "A", "text": "…" }, { "speaker": "B", "text": "…" }],
  "questions": [
    { "q": "…?", "options": ["la bonne réponse", "…", "…", "…"], "answer": 0,
      "why": "English explanation quoting the script." }
  ],
  "cast": {
    "scene": "Where it happens, what's going on, the overall tone.",
    "A": { "ms": "vivienne", "style": "Age, role and delivery." },
    "B": { "ms": "remy", "style": "Age, role and delivery." }
  }
}
```

It follows the rules of the built-in sets in `site/comp-co.js` and the TCF Canada spec in
`site/data.js`:

- **The recording:** one realistic TCF Canada Compréhension orale recording on the requested
  topic. At B1, a phone call, a series of public announcements or an everyday conversation. At
  B2, a radio interview, a report or a chronicle. Natural spoken French, in a situation clearly
  different from the titles in `avoid`.
- **Length:** 2 to 4 minutes read aloud, which is 300–340 words at B1 and 380–430 at B2.
- **Speakers:** at most two, labelled `N` for a single narrator, or `A` and `B`.
- **Setting:** about one set in three is in Canada (Québec places, dollars, Canadian vocabulary);
  the others are in France or elsewhere in the French-speaking world.
- **Written to be read aloud:** text-to-speech reads it, so write times, prices and numbers in
  words ("neuf heures et demie", "trente dollars"), and avoid abbreviations.
- **Cast:** a `scene` note, and for every speaker a Microsoft voice (`ms`) and a delivery note
  (`style`). Vivienne (`vivienne`) reads women and narrators, Rémy (`remy`) men. A dialogue has
  one of each.
- **Questions:** 6 in French, in the order the answers come up in the recording, testing gist,
  details and inference. Each has exactly one correct option, listed first (`answer: 0`; the
  site shuffles them), and a `why` in English quoting the script.
- **Options:** parallel, with similar length and form and the same amount of detail. The correct
  option must not stand out as the longest or the most precise. It can be the longest option in
  at most 2 of the 6 questions, and the shortest in at most 2. Distractors are plausible and
  reuse words from the recording in misleading ways, as on the real test.
