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

## Options

```bash
PORT=5000 npm start                  # another port
TCF_DB=/path/to/file.sqlite npm start   # another database file
```
