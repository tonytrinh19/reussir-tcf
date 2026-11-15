# Imported source collection

This directory contains the user's supplied TCF preparation materials, included publicly at their request. These are practice sources; reference keys and transcripts can contain errors.

- `catalog.json`: 24 CO papers, 25 EO collections and 61 EE PDFs. Byte-identical duplicates are included once.
- `papers/`: original PDFs, including the unordered, 301-page transcription collection.
- `data/`: 39 questions per listening paper, with printed choice order and reference keys retained. Unknown/ambiguous keys are `null`.
- `images/`: 57 illustrations cropped from the question PDFs; decorative watermarks are excluded.
- `audio/`: 907 distinct recordings, converted from MP3 to mono AAC at 64 kbit/s in an MP4 container, with fast-start metadata. Filenames are the first 24 hexadecimal characters of each source MP3's SHA-256 digest. The 933 available question recordings share duplicates.

## Transcripts

`lines` holds each question's review text. `transcriptKind` distinguishes `source-match` from `automatic`, and the UI displays `transcriptSource` whenever a transcript is revealed. Source matches include `transcriptPage`, linking back to the original PDF. Matching uses speech content, never the apparent order of question numbers in the PDF.

Local faster-whisper recognition produced candidate matches using word overlap and fuzzy text similarity. Full recordings were recognized again where the initial match was uncertain. The unmatched recordings retain explicitly labelled automatic text; recognition is not a substitute for listening. The source collection itself contains transcription mistakes and incomplete passages.

Known boundary problems in the PDF were corrected when extracting passages: trailing questions attached to the next numbered heading were moved back to their dialogue, the two adjacent excerpts about Camille's housing in Québec were joined, and a stray Toronto question was removed from the black-hole interview. Joined or incomplete passages were excluded when a suitable alternative could not be found. Four difficult matches were resolved by comparing distinctive content and printed choices (software appointment, household finances, Québec housing and cultural spaces).

## Source gaps

Test 20 lacks audio for Q4 and Q18; Test 27 lacks audio for Q2. Test 4 has no reference key. Test 3 Q15 prints “BC”, so it has no single accepted answer here. Tests 21 and 28 contained no files. All available questions remain accessible in free review; only the 20 papers with complete recordings and unambiguous keys are offered as scored exams.

`node tools/check_sources.js` checks the manifest, asset references, transcript provenance, preserved gaps and timed-exam eligibility. Timers include the source recordings and the application's reading/answer pauses, and can exceed the official 35-minute format.
