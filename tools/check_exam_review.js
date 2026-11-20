// Regression checks for review disclosures and deferred question bodies. No learner data is used.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../site/app.js"), "utf8");
const helpers = source.slice(source.indexOf("  const answerDetail ="), source.indexOf("  function paintAnswerVisibility()"));
const review = source.slice(source.indexOf("  const xMark ="), source.indexOf("  // Claude writes a fresh exam"));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const items = Array.from({ length: 39 }, (_, j) => ({ level: "B1", kind: "doc", title: "Document " + j, q: "Une question ?", text: "Le document.", options: ["A", "B", "C", "D"], order: [0, 1, 2, 3], answer: 1, why: "Une explication.", lines: [{ speaker: "A", text: "Le dialogue." }], audio: "test-audio.m4a" }));
const cx = { done: true, skill: "co", attemptId: "attempt-1", exam: { id: "test-exam", items }, ans: { 4: 1, 7: 0 } };
const ui = { cx, c: { open: {} } }, viewEl = { nodes: [], querySelectorAll() { return this.nodes; } };
let highlights = 0, hidden = true;
const ctx = { ui, viewEl, esc, typo: esc, skillOf: (c) => c.skill, ansHidden: () => hidden, readingOption: (_, it, k) => esc(it.options[k]), coxPicture: () => "", paintMarks: () => highlights++ };
vm.createContext(ctx);
vm.runInContext(helpers + review + "\nthis.reviewTest = {examReviewKey, examReviewNode, rememberExamReview, examReviewItem, mountExamReviewQuestion};", ctx);
const { examReviewKey, examReviewNode, rememberExamReview, examReviewItem, mountExamReviewQuestion } = ctx.reviewTest;
const draw = (exam = cx) => exam.exam.items.map((_, j) => examReviewItem(exam, j, hidden)).join("");
const questionKey = examReviewNode(cx, 4), transcriptKey = examReviewNode(cx, 4, true);
let html = draw();
assert.equal((html.match(/data-exam-question=/g) || []).length, 39);
assert(!html.includes("<audio"), "Closed questions must not initialize audio players");
assert(!html.includes('class="transcript"'), "Closed questions must not create transcript content");
assert(!html.includes('class="opts"'), "Closed questions must not build hidden answer choices");

// Capture the DOM synchronously, including an open/close before the native toggle event is delivered.
const question = { dataset: { node: questionKey }, open: true };
const transcript = { dataset: { node: transcriptKey }, open: true };
viewEl.nodes = [question, transcript];
rememberExamReview();
html = draw();
assert.match(html, /id="co-review-4"[^>]* open/);
assert.equal((html.match(/<audio/g) || []).length, 1);
assert.match(html, /data-exam-transcript[^>]* open/);
assert.match(html, /data-answer-detail hidden/);
question.open = false;
rememberExamReview();
assert(!draw().includes("<audio"));
assert(ui.c.open[transcriptKey], "Closing a question retains its independent transcript choice");
question.open = true;
transcript.open = false;
rememberExamReview();
assert(!/data-exam-transcript[^>]* open/.test(draw()));

// A saved tab can reconstruct the disclosures; a different attempt or paper starts separately.
ui.c.open = JSON.parse(JSON.stringify(ui.c.open));
assert.match(draw(), /id="co-review-4"[^>]* open/);
assert(!draw({ ...cx, attemptId: "attempt-2" }).includes("<audio"));
assert(!draw({ ...cx, exam: { ...cx.exam, id: "another-exam" } }).includes("<audio"));
const reading = { ...cx, skill: "ce" };
assert(!draw(reading).includes('class="opts"'));
ui.c.open[examReviewNode(reading, 4)] = true;
assert.match(draw(reading), /id="ce-review-4"[^>]* open/);
assert.equal((draw(reading).match(/class="opts"/g) || []).length, 1);

// Mount once, using the current answer visibility. Old detached nodes cannot mount another attempt's audio.
let mounts = 0;
const body = { ready: false, html: "", hasAttribute() { return this.ready; }, setAttribute() { this.ready = true; }, set innerHTML(value) { this.html = value; mounts++; } };
const root = { dataset: { examReview: examReviewKey(cx) } };
const el = { isConnected: true, open: true, dataset: { examQuestion: "4" }, closest: () => root, querySelector: () => body };
hidden = false;
mountExamReviewQuestion(el);
assert.equal(mounts, 1);
assert.equal(highlights, 1);
assert(body.html.includes('class="opt ok"'), "Opening after Show answers uses the latest visibility");
assert(!body.html.includes("data-answer-detail hidden"));
mountExamReviewQuestion(el);
assert.equal(mounts, 1, "Repeated openings reuse the existing body and player");
body.ready = false;
el.open = false;
mountExamReviewQuestion(el);
el.open = true;
el.isConnected = false;
mountExamReviewQuestion(el);
el.isConnected = true;
root.dataset.examReview = examReviewKey({ ...cx, attemptId: "another-attempt" });
mountExamReviewQuestion(el);
assert.equal(mounts, 1, "Closed, detached or stale questions must not mount");
console.log("Exam review: deferred bodies, saved open/closed questions and transcripts, attempt isolation, latest corrections and single player mounting pass.");
