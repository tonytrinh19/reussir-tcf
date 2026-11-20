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
const ctx = { ui, viewEl, S: { comp: new Map() }, arr: (v) => Array.isArray(v) ? v : [], esc, typo: esc, skillOf: (c) => c.skill, ansHidden: () => hidden, readingOption: (_, it, k) => esc(it.options[k]), coxPicture: () => "", paintMarks: () => highlights++ };
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

// Follow a listening retry from today's plan, through a wrong answer and a blank, back to the saved result.
const retry = source.slice(source.indexOf("  function listeningMisses("), source.indexOf("  // The exam page:"));
const records = ctx.S.comp;
const attempt = { id: "attempt-1", kind: "exam", skill: "co", setId: "test-exam", title: "Mock", score: 1, total: 3, answers: [1, 0, null] };
records.set(attempt.id, attempt);
cx.exam.items = items.slice(0, 3);
cx.ans = { 0: 1, 1: 0 };
cx.retryMisses = true;
let writingTask = { id: "w1" };
Object.assign(ctx, { clone: structuredClone, todayStr: () => "2026-11-19", shortDate: () => "19 nov.",
  XSPEC: { co: { bank: () => [cx.exam] }, ce: { bank: () => [cx.exam] } },
  compAttempts: skill => [...records.values()].filter(a => a.skill === skill),
  eeMocks: () => [{ id: "written", tasks: { t1: writingTask } }],
  put: (_, id, doc) => records.set(id, doc), render() {}, toast() {},
});
viewEl.querySelector = () => null;
vm.runInContext(retry + "\nthis.retryTest = {listeningRetryView, updateListeningRetry, dailyExamReviews, examReviewLink};", ctx);
const { listeningRetryView, updateListeningRetry, dailyExamReviews, examReviewLink } = ctx.retryTest;
const choice = (j, k) => ({ closest: () => ({ dataset: { retryQuestion: String(j) }, querySelector: () => k == null ? null : { value: String(k) } }) });
assert.match(dailyExamReviews(), /data-act="retry-open" data-id="attempt-1"/);
assert.match(examReviewLink(cx), /Revoir mes erreurs \(2\)/);
assert.match(listeningRetryView(cx), /data-retry-question="1"/);
assert(!listeningRetryView(cx).includes("Transcription"));
updateListeningRetry(choice(1), true);
updateListeningRetry(choice(1), false);
assert.equal(records.get(attempt.id), attempt);
updateListeningRetry(choice(1, 0), false);
assert.match(listeningRetryView(cx), /Transcription/);
updateListeningRetry(choice(1, 1), false);
assert.equal(records.get(attempt.id).missReview.picks[1], 0);
updateListeningRetry(choice(1), true);
updateListeningRetry(choice(1), true);
assert.match(listeningRetryView(cx), /data-retry-question="2"/);
updateListeningRetry(choice(2, 1), false);
assert.match(listeningRetryView(cx), /sans réponse/);
updateListeningRetry(choice(2), true);
assert.match(listeningRetryView(cx), /1 \/ 2/);
assert.match(examReviewLink(cx), /Révision terminée/);
assert.deepEqual(records.get(attempt.id).answers, [1, 0, null]);
assert.equal(records.get(attempt.id).score, 1);
assert(!dailyExamReviews().includes('data-id="attempt-1"'));
assert.match(dailyExamReviews(), /data-act="ee-open" data-id="written"/);
writingTask = { ...writingTask, mockReviewedOn: "2026-11-19" };
records.set("reading", { ...attempt, id: "reading", skill: "ce" });
assert.match(dailyExamReviews(), /data-act="x-review" data-id="reading"/);
records.set("reading", { ...records.get("reading"), reviewedOn: "2026-11-19" });
assert.equal(dailyExamReviews(), "");
console.log("Daily exam reviews: listening retries, spoilers, saved answers, scores, reading and writing completion pass.");
