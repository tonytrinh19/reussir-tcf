# Réussir le TCF

Daily practice for the TCF Canada, run on your own computer.

## Requirements

- [Node.js](https://nodejs.org) 22.13 or newer (the server uses Node's built-in SQLite; there's nothing to install).

## Start

```bash
npm start
```

Then open http://localhost:4173.

Your progress is saved in `data/tcf.sqlite`, separately from the claude.ai version of the site.

## Options

```bash
PORT=5000 npm start                  # another port
TCF_DB=/path/to/file.sqlite npm start   # another database file
```
