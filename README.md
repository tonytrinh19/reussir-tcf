# Réussir le TCF

Daily practice for the TCF Canada, run on your own computer.

## Requirements

- [Node.js](https://nodejs.org) 22.13 or newer (the server uses Node's built-in SQLite; there's nothing to install).

## Start

```bash
npm start
```

Then open http://localhost:4173.

Your progress is saved in `data/tcf.sqlite`, separately from the claude.ai version of the site. To bring your claude.ai progress here, download a backup in Progrès → Sauvegarde on claude.ai, then import it in the same place here.

## Reading exam papers

Open **Compréhension → Compréhension écrite → Examen blanc** and choose a paper from **Collection Việt–Pháp**. The collection contains 32 timed papers with 39 questions each. You can resume an unfinished paper and review your answers against its reference key after handing it in.

The transcriptions in `site/reading-papers/` follow the source files numbered 1–32. The two mislettered questions (12/8 and 20/12) use the original choice order. Matching questions elsewhere in the collection supply the repeated prompt in 11/14 and duplicated choices in 14/12, 15/29, 21/37 and 23/38. In 23/12, an editorial distractor replaces a second copy of the keyed answer. All reference answer letters are retained.

## Listening, speaking and writing annales

Open **Annales** in the navigation for 24 listening papers, 25 speaking collections and 61 writing PDFs. Speaking and writing subjects remain browsable original PDFs, including the model answers present in the sources. Documents open in the built-in PDF reader, with page controls and a text view. Files download only when you choose “Télécharger le PDF”; browsing subjects does not invoke the browser’s native PDF handler.

Listening review lets you jump between all 39 questions, replay the recording, inspect its picture, and independently reveal the transcript or reference answer. The supplied transcription PDF is unordered: passages are matched against locally recognized audio, with explicitly labelled automatic transcripts when no reliable source match is found. These aids may contain transcription errors; the original recording and PDF remain available.

Twenty listening papers also appear in **Compréhension → Compréhension orale → Examen blanc**, with saved progress and answer review. Their timers follow the supplied recordings plus reading/answer pauses, so some exceed the official 35-minute format. Free review includes all available papers, including incomplete ones:

- Test 20 lacks recordings 4 and 18; Test 27 lacks recording 2. Tests 21 and 28 had no files.
- Test 4 has no reference answer key; Test 3 question 15 has the ambiguous key “BC”. These answers are left unknown, and these four papers are excluded from scored exams.

The collection lives in `site/exam-sources/`: original PDFs, extracted pictures, question JSON and deduplicated AAC recordings (approximately 425 MB total). Existing learning progress and the database schema are unchanged. Run `npm run check` to validate the content and asset references.

## Writing mock exams from PDFs

In **Écrit → Examen blanc**, use **Sujets de tes PDF** to select one of 177 complete three-task exams, or choose **Composer mon examen avec les sujets PDF** to pick each task separately from 631 available prompts. The original built-in subject selection remains available.

The 60-minute timer, word counts, draft saving, resume, submission and correction flows work as before. Both Tâche 3 documents are shown. Saved attempts keep the exact prompts, source references and exam title, and link back to the original PDF after submission. Model corrections are excluded from the question bank.

`site/exam-sources/writing.json` contains the extracted subjects, complete combinations and source gaps. Older monthly files list independent task choices; these are offered individually without inventing original combinations. Thirteen incomplete sections remain in the source PDFs rather than becoming incomplete timed exams. Repeated topics across different PDFs retain their source references.

To regenerate the collection, run `python3 tools/import_writing_papers.py` with `pdfplumber` installed, then `node tools/check_writing_papers.js`. The importer normalizes Unicode ligatures and known PDF font mappings for “ff”; other source wording is retained. June/July 2023 combinations have no printed numbers and are numbered by their order in the PDF.

## Options

```bash
PORT=5000 npm start                  # another port
TCF_DB=/path/to/file.sqlite npm start   # another database file
```
