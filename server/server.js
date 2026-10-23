#!/usr/bin/env node
// Local server for Réussir le TCF: serves site/ and keeps progress in a SQLite file.
// No npm dependencies: it needs Node 22.13 or later for the built-in node:sqlite.
//   npm start                   → http://localhost:4173
//   PORT=5000 npm start         → another port
//   TCF_DB=/path/to/file.sqlite → another database file (default: data/tcf.sqlite)
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { openDb, COLLS } = require("./db");

const ROOT = path.resolve(__dirname, "..", "site");
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BODY = 5 * 1024 * 1024;
// A whole backup, imported in one request.
const MAX_BACKUP = 200 * 1024 * 1024;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".m4a": "audio/mp4",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const db = openDb();

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" });

function readBody(req, max) {
  max = max || MAX_BODY;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > max) { reject(Object.assign(new Error("Body too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// /api/data                 GET    → { settings: { id: doc, … }, days: { … }, … }
//                           PUT    → replace everything with a body of that shape (a backup imported)
// /api/data/:coll/:id       PUT    → replace one document (JSON body)
// /api/data/:coll/:id       DELETE → remove one document
async function api(req, res, parts) {
  if (parts.length === 0) {
    if (req.method === "GET") return json(res, 200, db.all());
    if (req.method !== "PUT") return json(res, 405, { error: "method_not_allowed" });
    let data;
    try { data = JSON.parse(await readBody(req, MAX_BACKUP)); } catch (e) { return json(res, e.status || 400, { error: e.status ? "too_large" : "bad_json" }); }
    if (!data || typeof data !== "object" || Array.isArray(data) || !Object.keys(data).some((c) => COLLS.includes(c))) return json(res, 400, { error: "bad_backup" });
    for (const docs of Object.values(data)) if (!docs || typeof docs !== "object" || Array.isArray(docs) || Object.values(docs).some((d) => !d || typeof d !== "object" || Array.isArray(d))) return json(res, 400, { error: "bad_backup" });
    return json(res, 200, { ok: true, n: db.replace(data) });
  }
  if (parts.length !== 2) return json(res, 404, { error: "not_found" });
  const [coll, id] = parts;
  if (!COLLS.includes(coll)) return json(res, 400, { error: "unknown_collection" });
  if (!id || id.length > 300) return json(res, 400, { error: "bad_id" });
  if (req.method === "PUT") {
    let data;
    try { data = JSON.parse(await readBody(req)); } catch (e) { return json(res, e.status || 400, { error: e.status ? "too_large" : "bad_json" }); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return json(res, 400, { error: "bad_doc" });
    db.set(coll, id, data);
    return json(res, 200, { ok: true });
  }
  if (req.method === "DELETE") {
    db.del(coll, id);
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { error: "method_not_allowed" });
}

// Static files, with byte ranges so Safari and iOS can play and seek the recordings.
function serveFile(req, res, rel) {
  const file = path.resolve(ROOT, "." + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, "Forbidden");
  let stat;
  try { stat = fs.statSync(file); } catch (_) { return send(res, 404, "Not found"); }
  if (stat.isDirectory()) return serveFile(req, res, path.posix.join(rel, "index.html"));
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);
    if (start > end) return send(res, 416, "", { "Content-Range": `bytes */${stat.size}` });
    res.writeHead(206, Object.assign(base, { "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 }));
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, Object.assign(base, { "Content-Length": stat.size }));
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === "/api/data" || pathname.startsWith("/api/data/")) {
      const parts = pathname.slice("/api/data".length).split("/").filter(Boolean);
      return await api(req, res, parts);
    }
    if (pathname.startsWith("/api/")) return json(res, 404, { error: "not_found" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
    serveFile(req, res, pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: "server_error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Réussir le TCF → http://localhost:${PORT}`);
  console.log(`Progress is saved in ${db.file}`);
});

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { server.close(); db.close(); process.exit(0); });
