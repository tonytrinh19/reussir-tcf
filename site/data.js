/* Réussir le TCF — curriculum content.
   Source: 01-assessment-and-roadmap.md, 02-grammar-progression.md,
   03-weekly-study-system.md, 04-vocabulary-speaking-writing.md (parent folder). */
window.TCF = (function () {
  "use strict";

  const SKILLS = {
    voc: { code: "VOC", label: "Vocabulaire" },
    gra: { code: "GRA", label: "Grammaire" },
    co: { code: "CO", label: "Écoute" },
    ce: { code: "CE", label: "Lecture" },
    ee: { code: "EE", label: "Écrit" },
    eo: { code: "EO", label: "Oral" },
    bil: { code: "BIL", label: "Bilan" },
  };

  const PHASES = [
    { n: 1, name: "Foundation Repair", weeks: "Weeks 1–3", level: "B1",
      goal: "Stop the recurring mechanical errors before building on top of them, and get honest CO and CE baselines.",
      vocab: ["connecteurs", "quotidien", "immigration"] },
    { n: 2, name: "B1+ Consolidation", weeks: "Weeks 4–8", level: "B1",
      goal: "Close the remaining B1 gaps, read at exam pace, and take in easy French every day.",
      vocab: ["travail", "education", "sante", "famille", "societe"] },
    { n: 3, name: "B2 Development", weeks: "Weeks 9–14", level: "B2",
      goal: "Build the B2 grammar toolkit and make a first real run at the B2 ceiling in all four skills.",
      vocab: ["environnement", "technologie", "gouvernement", "economie", "societe"] },
    { n: 4, name: "B2 + TCF Specialization", weeks: "Weeks 15–18", level: "B2",
      goal: "Turn B2 ability into exam-day reliability. No new grammar: fix whatever the mocks surface.",
      vocab: ["consommation", "crime", "science", "tourisme", "gouvernement"] },
    { n: 5, name: "Mocks & Final Optimization", weeks: "Weeks 19–21", level: "B2",
      goal: "Full timed dress rehearsals. Find your single weakest skill and spend most of the time there.",
      vocab: [] },
  ];

  /* Weekly templates (Document 3). Block = [skill, minutes, title, detail, check, route] */
  const PLAN = {
    1: {
      note: "Run the same week shape until the Phase 1 exit criteria are met, with fresh drill content each week.",
      days: [
        [
          ["voc", 10, "Review + 10–15 new words", "Review yesterday's cards, then add 10–15 new: daily life and connectors (mais, donc, alors, cependant).", "Recall each card cold, no peeking.", "vocab.new.connecteurs"],
          ["gra", 30, "Pronominal verbs → passé composé", "10-sentence présent → passé composé drill, mixing regular reflexives and inherently pronominal verbs.", "Flag every auxiliary or agreement slip.", "grammar.pronominaux"],
          ["co", 20, "Listening exposure", "One short, slow-paced segment. No notes: this is calibration only.", "Nothing to hand in yet.", "comp.co"],
          ["ee", 35, "Tâche 1 draft", "Full draft to a fresh prompt (60–120 words). Check the word count before you finish.", "Inside 60–120 words?", "writing.t1"],
          ["bil", 5, "Log your errors", "Log every error from today in the tracker, by category.", "Each error has a category.", "progress.errors"],
        ],
        [
          ["voc", 10, "Review only", "Spaced-repetition review. No new cards today.", "Recall each card cold.", "vocab.review"],
          ["gra", 25, "Imperative + pronoun, rapid fire", "20-item drill: envoie-moi, donne-le-moi, ne me l'envoie pas.", "18/20 or better. If not, repeat tomorrow instead of adding new material.", "grammar.imperatif"],
          ["ce", 20, "Untimed reading set", "One CE set (four short documents, one question each), no timer.", "For each miss: vocabulary gap or comprehension gap?", "comp.ce"],
          ["bil", 10, "Error log + listen-back notes", "Log today's errors and your listen-back notes.", "", "progress.errors"],
        ],
        [
          ["voc", 10, "New words: immigration & admin", "10–15 new cards: démarche, dossier, délai, ressortissant…", "Recall each card cold.", "vocab.new.immigration"],
          ["gra", 30, "Elision pass + embedded questions", "Proofread Monday's draft hunting only for missed elisions, then a 10-item embedded-question drill.", "0 elision misses; 9/10+ on the drill.", "grammar.interrogative"],
          ["co", 20, "Listening exposure", "A new segment, exposure only.", "", "comp.co"],
          ["ee", 35, "Tâche 2 draft", "Full draft, 120–150 words.", "Inside 120–150 words?", "writing.t2"],
          ["bil", 5, "Log your errors", "Log every error from today, by category.", "", "progress.errors"],
        ],
        [
          ["voc", 10, "Review the week", "Spaced-repetition review of this week's cards.", "", "vocab.review"],
          ["gra", 30, "Subjonctif présent", "Conjugate 15 verbs after il faut que, regular and irregular stems.", "Irregular stems are where slips happen: flag them.", "grammar.subjonctif.formation"],
          ["ce", 20, "Second CE diagnostic", "Another untimed reading segment.", "", "comp.ce"],
          ["bil", 5, "Log your errors", "", "", "progress.errors"],
        ],
        [
          ["voc", 10, "Review only", "Spaced-repetition review.", "", "vocab.review"],
          ["gra", 30, "Mixed review", "15 items mixing the week's four topics.", "Which category is still weakest? That's next week's extra focus.", "grammar.mixed"],
          ["co", 35, "First CO diagnostic set", "A full untimed listening set.", "Record the score as a baseline, not as pass/fail.", "comp.co"],
          ["ee", 25, "Rewrite Monday's Tâche 1", "Rewrite it with this week's corrections actually applied.", "Are Monday's specific errors gone?", "writing.t1"],
          ["bil", 10, "Top 3 recurring issues", "Consolidate the week into a top-3 recurring issues note.", "", "progress.errors"],
        ],
        [
          ["ce", 25, "Second CE diagnostic set", "Capstone day: no new material.", "", "comp.ce"],
          ["ee", 40, "Submit your best piece", "Submit your best piece from the week for full correction.", "", "writing"],
          ["bil", 25, "Explain your top 3", "For each of Friday's top 3, write one sentence naming exactly what went wrong and the fix.", "Can you explain each in one sentence? If not, extend Phase 1 by a week for that item.", "progress.errors"],
        ],
      ],
    },
    2: {
      note: "Grammar: one round, then Retry the misses, and two rounds at most in a sitting. Only the day's first round counts toward a criterion, and each topic comes back a week later. Easy listening and reading go outside your study time. Once this phase, take the CO Examen blanc on a Saturday instead of the timed sets, as your listening baseline.",
      days: [
        [
          ["voc", 10, "Cards + 10–15 new: work & employment", "Due cards first, then the new ones. Theme cards English → French, so you practise producing the words.", "Recall each card before you flip it.", "vocab.new.travail"],
          ["gra", 20, "Séquence des temps", "One round, then Retry the misses. Imparfait, passé composé or plus-que-parfait? Watch for implied anteriority.", "8/10+ on the day's first round is the Phase 2 target (baseline 6/10).", "grammar.sequence"],
          ["co", 25, "Listening set: once through, then dig in", "One set at your level, once without pausing, like the exam. Then replay each miss with the transcript. 5/6 or better adds a second set.", "For each miss: vocabulary gap or comprehension gap?", "comp.co"],
          ["ee", 30, "Tâche 1 on the clock", "A fresh prompt, 15 minutes. Then 3 minutes of proofreading: accents, agreement, elision, verb + preposition.", "Inside 60–120 words?", "writing.t1"],
          ["co", 20, "Easy listening", "Outside your study time: commute or chores. French you can follow without pausing, and no dictionary.", "You understood nearly everything.", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "Spaced-repetition review. No new cards today.", "Recall each card cold.", "vocab.review"],
          ["gra", 20, "Si-clauses, types 1 & 2", "One round, then Retry the misses.", "", "grammar.si"],
          ["ce", 25, "Reading set at exam pace", "One set at your level on the clock (6:00 for 4 B1 questions at exam pace; more while you build up to it). Answer every question, then go over each miss without the clock. 3/4 inside the clock adds a second set.", "Done in time, nothing blank? For each miss: vocabulary gap or comprehension gap?", "comp.ce"],
          ["gra", 10, "Your mistakes", "One round of the mistakes from your own corrected writing.", "", "grammar.mine"],
          ["ce", 20, "Easy reading", "Outside your study time: a graded reader or an easy article. Read on without stopping for every word.", "You understood nearly everything.", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: education & health", "", "", "vocab.new.education"],
          ["gra", 20, "Relative pronouns", "One round, then Retry the misses: qui, que, où, dont, lequel.", "", "grammar.relatifs"],
          ["co", 25, "Listening set #2: once through, then dig in", "Once without pausing, answer, then replay each miss with the transcript. 5/6 or better adds a second set.", "", "comp.co"],
          ["ee", 30, "Tâche 2 on the clock", "120–150 words in 20 minutes, then the 3-minute proofreading pass.", "Inside 120–150 words?", "writing.t2"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["gra", 20, "Object pronouns + y / en", "One round, then Retry the misses.", "", "grammar.pronoms"],
          ["ce", 25, "Reading set #2 at exam pace", "One set on the clock, nothing blank, then your misses without it. 3/4 inside the clock adds a second set.", "", "comp.ce"],
          ["gra", 10, "Find the mistakes", "One text: tap what looks wrong, then correct it. It's the eye you need to proofread your own writing.", "", "grammar.hunt"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: family & society", "", "", "vocab.new.famille"],
          ["gra", 15, "Your mistakes", "", "", "grammar.mine"],
          ["ee", 40, "Tâche 3 on the clock", "The two-part template: compare both documents (40–60 words), then your position (80–120). 25 minutes, then the proofreading pass.", "Part 1 names both positions; 120–180 words.", "writing.t3"],
          ["bil", 10, "Plan next week", "Look at your criteria and this week's misses. Pick the two mistakes you'll watch for in next week's writing.", "", "progress"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["gra", 15, "Mixed review", "Questions from every topic you've practised so far, Phase 1 included.", "Which topic is still weakest? Give it next week's extra round.", "grammar.mixed"],
          ["co", 20, "Timed CO set", "Back to back with the CE set: listen once only, answer, then replay your misses with the transcript.", "", "comp.co"],
          ["ce", 20, "Timed CE set", "One set on the clock, nothing blank, then your misses without it.", "", "comp.ce"],
          ["ee", 25, "Rewrite from memory", "Reread the correction of your best piece this week, close it, and write it again from memory. Then compare.", "Are the corrected forms in your rewrite?", "writing"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
      ],
    },
    3: {
      note: "B2 material from here, timed every time. Grammar as in Phase 2: one round, then Retry the misses; the day's first round is the one that counts. Once this phase, CE Examen blanc 2 as a Saturday mock. Easy listening and reading stay outside your study time.",
      days: [
        [
          ["voc", 10, "Cards + 10–15 new: environment & climate", "", "", "vocab.new.environnement"],
          ["gra", 20, "Subjonctif vs conditionnel", "Contrastive drill after afin que / avant que: your named gap.", "12/15+ on the day's first round is the Phase 3 target.", "grammar.subjonctif.contraste"],
          ["co", 25, "B2 listening set: once through, then dig in", "Once without pausing, answer, then replay each miss with the transcript. 5/6 or better adds a second set.", "", "comp.co"],
          ["ee", 30, "Tâche 1 on the clock", "15 minutes, then the proofreading pass.", "", "writing.t1"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["gra", 20, "Concession: yes, but", "State a position, concede with bien que / alors que, pivot back.", "", "grammar.concession"],
          ["ce", 25, "Timed B2 reading set", "One set on the clock (7:00 for 4 B2 questions at exam pace), nothing blank, then your misses without it. 3/4 inside the clock adds a second set.", "", "comp.ce"],
          ["gra", 10, "Your mistakes", "", "", "grammar.mine"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: technology & social media", "", "", "vocab.new.technologie"],
          ["gra", 20, "Reported speech", "Direct → reported, checking tense and time expressions.", "", "grammar.discours"],
          ["co", 25, "B2 listening set #2", "Once without pausing, then your misses with the transcript.", "", "comp.co"],
          ["ee", 30, "Tâche 2 on the clock", "20 minutes, then the proofreading pass.", "", "writing.t2"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["gra", 20, "Conditionnel + passive voice", "", "", "grammar.conditionnel"],
          ["ce", 25, "Timed B2 reading set #2", "One set on the clock, then your misses without it.", "", "comp.ce"],
          ["gra", 10, "Find the mistakes", "A B2 text.", "", "grammar.hunt"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: government & economy", "", "", "vocab.new.gouvernement"],
          ["gra", 20, "Gérondif + participles", "", "", "grammar.gerondif"],
          ["gra", 10, "Your mistakes", "", "", "grammar.mine"],
          ["ee", 40, "Tâche 3 on the clock", "25 minutes, then the proofreading pass.", "Part 1 compares both documents; 120–180 words.", "writing.t3"],
          ["bil", 10, "Plan next week", "", "", "progress"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["gra", 15, "Mixed review", "Every topic you've practised so far.", "", "grammar.mixed"],
          ["bil", 60, "Full mock: weakest skill", "One full timed mock of whichever skill is currently weakest. Log the score in Progrès → Scores.", "", "progress.scores"],
          ["bil", 20, "Same-day review", "Every wrong or weak answer: why was it wrong, and what was the trap?", "", "progress.scores"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
      ],
    },
    4: {
      note: "No new grammar. Every grammar block re-drills what the week's mocks surfaced, plus Your mistakes. CO mocks: the CO Examen blanc, then TV5MONDE's and RFI's TCF practice (log those scores on the CO page). Easy listening and reading stay outside your study time.",
      days: [
        [
          ["voc", 10, "Cards + 10–15 new: consumerism & crime", "", "", "vocab.new.consommation"],
          ["gra", 20, "Targeted grammar drill", "Pick the topic your latest mock exposed.", "", "grammar"],
          ["ce", 60, "Full timed CE mock", "Examen blanc 2, then Claude's new exams. 39 questions, 60 minutes, nothing blank.", "", "comp.ce.exam"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["gra", 15, "Your mistakes", "", "", "grammar.mine"],
          ["ce", 25, "Timed reading set", "One B2 set on the clock, then your misses without it.", "", "comp.ce"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: science & tourism", "", "", "vocab.new.science"],
          ["gra", 20, "Targeted grammar drill", "", "", "grammar"],
          ["co", 35, "Full timed CO mock", "39 questions, 35 minutes, each recording heard once.", "", "comp.co.exam"],
          ["bil", 25, "Same-day review", "Every miss: which trap caught you?", "", "progress.scores"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["ee", 60, "Full timed Écrite mock", "All three tasks on the real 60-minute clock.", "Word counts on all three tasks; comparison present in Tâche 3.", "writing.t1"],
          ["bil", 15, "Review the corrections", "", "", "progress.errors"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Cards + 10–15 new: politics & civic life", "", "", "vocab.new.gouvernement"],
          ["gra", 15, "Your mistakes", "", "", "grammar.mine"],
          ["ce", 25, "Timed reading set", "One set on the clock, then your misses without it.", "", "comp.ce"],
          ["bil", 10, "Plan next week", "", "", "progress"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["gra", 15, "Mixed review", "", "", "grammar.mixed"],
          ["bil", 30, "Resolved, or just improved?", "Check the error log against the original error list: which items are genuinely resolved?", "", "progress.errors"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
      ],
    },
    5: {
      note: "Diagnostic-driven: adjust each day to what the previous mock showed. Keep the card reviews and the easy listening and reading going until the exam. Final week: light review only; confirm booking and ID.",
      days: [
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["co", 35, "Full timed CO mock", "39 questions, 35 minutes.", "", "comp.co.exam"],
          ["bil", 30, "Same-day review", "Review every wrong or weak answer.", "", "progress.scores"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["ce", 60, "Full timed CE mock", "39 questions, 60 minutes, nothing blank.", "", "comp.ce.exam"],
          ["bil", 30, "Same-day review", "", "", "progress.scores"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["ee", 60, "Full timed Écrite mock", "Three tasks, 60 minutes.", "", "writing.t1"],
          ["bil", 30, "Same-day review", "", "", "progress.scores"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["gra", 15, "Your mistakes", "", "", "grammar.mine"],
          ["ce", 25, "Timed reading set", "One set on the clock, then your misses without it.", "", "comp.ce"],
          ["ce", 20, "Easy reading", "Outside your study time.", "", "comp.free.ce"],
        ],
        [
          ["bil", 60, "Weakest skill", "Most of the remaining time goes to your lowest skill against NCLC 7. IRCC never averages.", "", "progress.scores"],
          ["gra", 15, "Mixed review", "", "", "grammar.mixed"],
          ["voc", 10, "Review only", "", "", "vocab.review"],
          ["co", 20, "Easy listening", "Outside your study time.", "", "comp.free.co"],
        ],
        [
          ["bil", 167, "Dress rehearsal (optional)", "All four skills back to back at the real length (~2 h 47), at the time of day you've booked.", "", "progress.scores"],
        ],
      ],
    },
  };

  /* Error categories used by the error log and by Claude's corrections. */
  const CATEGORIES = {
    pronominaux: "Pronominal verbs",
    subjonctif: "Subjonctif",
    sequence: "Séquence des temps",
    si: "Si-clauses",
    relatifs: "Relative pronouns",
    pronoms: "Object pronouns, y / en",
    interrogative: "Embedded questions",
    imperatif: "Imperative + pronoun",
    elision: "Elision",
    cause: "Cause / consequence",
    concession: "Concession",
    conditionnel: "Conditionnel",
    discours: "Reported speech",
    passif: "Passive voice",
    gerondif: "Gérondif / participles",
    micro: "Micro-errors (c'est/il est, places…)",
    accord: "Agreement & spelling",
    lexique: "Word choice",
    structure: "Task structure & length",
    autre: "Other",
  };

  const KNOWN_ERRORS = [
    "pronominal verbs in passé composé (être + agreement; dropping the reflexive on se rendre compte, s'inquiéter, s'aider de)",
    "imperative + object pronoun order (m'envoie instead of envoie-moi), persisting since the first session",
    "missed elision (je achèterai, que habiter)",
    "embedded questions with an infinitive or inversion (pourquoi je sortir, quand serai-je)",
    "conditionnel used instead of subjonctif after afin que / avant que",
    "passé composé where the plus-que-parfait is needed for implied anteriority",
    "infinitive after si (si on vivre)",
    "c'est vs il/elle est, prepositions with places, seul/seulement, leur/ses, les/des",
    "Tâche 3: skipped the comparison of the two documents twice; word count once over 180 and once under 120",
  ];

  /* Grammar curriculum (Document 2), in priority order. Each topic's drill sets are in drills.js. */
  const TOPICS = [
    {
      id: "pronominaux", n: 1, title: "Verbes pronominaux", en: "Pronominal verbs", phase: 1,
      why: "Your #1 flagged systematic error. It touches nearly every past-tense sentence you write.",
      know: "Present-tense reflexive conjugation (je me lève, tu te lèves).",
      master: "Passé composé with être, and agreement with the reflexive pronoun (elle s'est levée), except when a direct object follows, which blocks agreement (elle s'est lavé les mains). Negation wraps both parts (elle ne s'est pas levée). Inherently pronominal verbs (se rendre compte, s'apercevoir, se souvenir) never drop the reflexive pronoun.",
      mistakes: [["nous avons rendu compte", "nous nous sommes rendu compte"], ["elle s'inquiète → a inquiété", "elle s'est inquiétée"], ["il a aidé d'un dictionnaire", "il s'est aidé d'un dictionnaire"]],
      examples: [["Elle s'est levée à 7 h.", "She got up at 7."], ["Nous nous sommes rendu compte de l'erreur.", "We realized the mistake. Rendu stays invariable: compte is the direct object."]],
      exercise: "Daily 10-sentence présent → passé composé transformation, rotating regular reflexives and inherently pronominal verbs.",
      criterion: { text: "9/10 on the drill, plus zero auxiliary/agreement errors across 2 consecutive writing submissions.", set: "pc", pct: 0.9, writing: "pronominaux" },
    },
    {
      id: "subjonctif", n: 2, title: "Subjonctif présent", en: "Present subjunctive", phase: 1,
      why: "Your current target and a hard B2 marker. Graders look for it after volition, necessity, emotion, doubt and certain conjunctions.",
      know: "Indicative forms; passive recognition of the subjunctive.",
      master: "Formation from the ils-form stem of the present (ils finissent → que je finisse), irregular stems for être, avoir, aller, faire, pouvoir, savoir, vouloir. Core triggers: il faut que, vouloir que, avoir peur que, douter que, bien que, avant que, afin que, pour que, à moins que, sans que, jusqu'à ce que.",
      mistakes: [["afin qu'il pourrait", "afin qu'il puisse"], ["avant qu'il serait trop tard", "avant qu'il soit trop tard"]],
      examples: [["Il faut que tu viennes.", "You need to come."], ["Bien qu'il soit fatigué, il continue.", "Although he's tired, he keeps going."]],
      exercise: "Contrastive drill: same stem, trigger vs non-trigger. Say the mood choice out loud before you write it.",
      criterion: { text: "12/15+ on the mixed subjonctif / indicatif / conditionnel drill.", set: "contraste", pct: 0.8 },
    },
    {
      id: "sequence", n: 3, title: "Séquence des temps", en: "Imparfait / passé composé / plus-que-parfait", phase: 2,
      why: "Drilled once at 6/10, weakest on anteriority that isn't flagged by an explicit “before”.",
      know: "Basic passé composé and imparfait.",
      master: "Imparfait = background, ongoing, habitual. Passé composé = a completed, punctual action. Plus-que-parfait = anterior to another past action, even when nothing in the sentence says “before”.",
      mistakes: [["Quand je suis arrivé, elle est déjà partie.", "Quand je suis arrivé, elle était déjà partie."]],
      examples: [["Quand je suis arrivé, elle était déjà partie.", "When I arrived, she had already left."]],
      exercise: "Mark which verbs are anterior to another past event from the story logic, not from spotting the word avant.",
      criterion: { text: "8/10+ on the séquence des temps drill (baseline 6/10).", set: "main", pct: 0.8 },
    },
    {
      id: "si", n: 4, title: "Phrases avec si", en: "Si-clauses (hypothesis)", phase: 2,
      why: "Core B2 argumentation structure: comparing viewpoints and speculating in Tâche 3 and Orale Tâche 3.",
      know: "Type 1: si + présent → futur.",
      master: "Type 2: si + imparfait → conditionnel présent. Type 3: si + plus-que-parfait → conditionnel passé.",
      mistakes: [["si on vivre à la campagne", "si on vivait à la campagne"]],
      examples: [["Si j'avais plus de temps, je voyagerais davantage.", "If I had more time, I'd travel more."], ["Si j'avais su, je ne serais pas venu.", "If I had known, I wouldn't have come."]],
      exercise: "Complete-the-sentence drill mixing all three types.",
      criterion: { text: "9/10 on a mixed-type si-clause drill.", set: "main", pct: 0.9 },
    },
    {
      id: "relatifs", n: 5, title: "Pronoms relatifs", en: "Relative pronouns", phase: 2,
      why: "Embedding clauses instead of stacking short sentences is one of the fastest ways to sound B2.",
      know: "Basic qui / que.",
      master: "Dont (replaces de + noun), où (place and time), lequel / auquel / duquel after prepositions.",
      mistakes: [["Short, separate sentences where one relative clause would do.", "Le livre dont je te parle…"]],
      examples: [["Le livre dont je te parle…", "The book I'm telling you about…"], ["Le projet auquel je pense…", "The project I'm thinking about…"]],
      exercise: "Sentence combining: merge two short sentences with the right relative pronoun.",
      criterion: { text: "Correctly combine 8/10 sentence pairs.", set: "main", pct: 0.8 },
      prod: { title: "Your turn", prompt: "Write 3 sentences about your city or your job using dont, où and a form of lequel (auquel, pour laquelle…).", check: "each sentence uses the target relative pronoun correctly" },
    },
    {
      id: "pronoms", n: 6, title: "Pronoms compléments, y et en", en: "Object pronouns + y / en", phase: 2,
      why: "Concise, natural B2 register without the repetition that reads as B1.",
      know: "Basic le / la / les.",
      master: "Lui / leur (indirect); y (à + place or thing); en (de + noun, quantities); order when stacking (me le, te la, le lui); placement with infinitives and the imperative.",
      mistakes: [["Overlaps with the imperative + pronoun issue.", "donne-le-moi / ne me le donne pas"]],
      examples: [["J'y pense souvent.", "I think about it often."], ["Il en a trois.", "He has three of them."]],
      exercise: "Substitution drill: rewrite the sentence, replacing the noun phrase with the right pronoun.",
      criterion: { text: "9/10 on the substitution drill.", set: "main", pct: 0.9 },
    },
    {
      id: "interrogative", n: 7, title: "Interrogation indirecte", en: "Embedded / indirect questions", phase: 1,
      why: "A flagged recurring error, and where Orale Tâche 2 earns its points in real time.",
      know: "Direct-question inversion.",
      master: "Embedded questions drop inversion and go back to subject–verb order, with a conjugated verb (never an infinitive). Est-ce que disappears; qu'est-ce que → ce que; qu'est-ce qui → ce qui; yes/no → si.",
      mistakes: [["pourquoi je sortir", "pourquoi je sors"], ["quand serai-je", "quand je serai"]],
      examples: [["Je me demande pourquoi il est parti.", "I wonder why he left."], ["Elle ne sait pas quand je serai là.", "She doesn't know when I'll be there."]],
      exercise: "Convert direct questions into embedded ones after Je me demande… / Il ne sait pas…",
      criterion: { text: "9/10 on the transformation drill.", set: "main", pct: 0.9 },
    },
    {
      id: "imperatif", n: 8, title: "Impératif + pronom", en: "Imperative + object pronoun", phase: 1,
      why: "Persisting since your very first session. Writing and correcting hasn't extinguished it, so it needs a different practice mode: isolated, fast, daily.",
      know: "Basic imperative forms.",
      master: "Affirmative imperative: pronoun after the verb with a hyphen, and me/te become moi/toi (envoie-moi, donne-le-moi). Negative imperative: pronoun stays before the verb (ne me l'envoie pas).",
      mistakes: [["m'envoie", "envoie-moi"]],
      examples: [["Envoie-moi le lien.", "Send me the link."], ["Ne me l'envoie pas.", "Don't send it to me."]],
      exercise: "Isolated rapid drill, kept separate from longer writing. Five minutes a day until it's boring.",
      criterion: { text: "10/10 on the isolated drill on 3 separate days. One clean pass doesn't count.", set: "main", pct: 1, days: 3 },
    },
    {
      id: "elision", n: 9, title: "L'élision", en: "Elision", phase: 1,
      why: "Mechanical but recurring: je achèterai and que habiter keep coming back.",
      know: "",
      master: "Je, me, te, se, le, la, ne, que, de → j', m', t', s', l', n', qu', d' before a vowel or a mute h. Si elides only before il / ils. No elision before an aspirated h (le héros, la haine).",
      mistakes: [["je achèterai", "j'achèterai"], ["que habiter", "qu'habiter"]],
      examples: [["J'habite à Vancouver.", "I live in Vancouver."], ["S'il pleut, on reste ici.", "If it rains, we stay here."]],
      exercise: "A dedicated proofreading pass on every submission: read once, hunting only for missed elisions.",
      criterion: { text: "Zero missed elisions across 2 consecutive writing submissions.", set: "main", pct: 0.9, writing: "elision" },
    },
    {
      id: "cause", n: 10, title: "Cause et conséquence", en: "Cause / consequence connectors", phase: 2,
      why: "Structured argumentation in Tâche 3 and Orale Tâche 3.",
      know: "",
      master: "Cause: parce que, car (written, formal), puisque (an already-known reason), comme (at the start), grâce à / à cause de. Consequence: donc, c'est pourquoi, par conséquent, d'où + noun.",
      mistakes: [],
      examples: [["Puisque tu es là, autant en profiter.", "Since you're here, might as well make the most of it."], ["Il pleuvait, par conséquent nous sommes restés à la maison.", "It was raining, so we stayed home."]],
      exercise: "Rewrite a paragraph using a different cause/consequence connector each time, without changing the meaning.",
      criterion: { text: "Vary connectors correctly across a 150-word paragraph with no repeats.", set: "main", pct: 0.9, prod: true },
      prod: { title: "Rewrite the paragraph", prompt: "Rewrite this paragraph with a different cause or consequence connector each time, no repeats, same meaning:\n\n« Les loyers augmentent à Vancouver parce que la demande est forte. Beaucoup de familles quittent le centre-ville parce qu'elles ne peuvent plus payer. Les trajets deviennent plus longs parce que les gens habitent loin. Donc, la circulation augmente. Donc, la pollution augmente aussi. Parce que la situation est grave, la ville doit agir. »", check: "every cause/consequence link uses a different, correctly used connector and the meaning is unchanged" },
    },
    {
      id: "concession", n: 11, title: "Concession et opposition", en: "Concession / opposition", phase: 3,
      why: "The clearest B2 signal in argumentation, and exactly what Tâche 3's “compare both viewpoints” needs.",
      know: "",
      master: "Bien que / quoique + subjonctif; alors que / tandis que (contrast, indicative); malgré + noun; même si + indicative; cependant, néanmoins, toutefois, en revanche as connectors; certes… mais.",
      mistakes: [],
      examples: [["Bien que je comprenne son point de vue, je ne suis pas d'accord.", "Although I understand his point of view, I disagree."]],
      exercise: "“Yes, but” paragraph: state a position, concede the opposite with bien que / alors que, then pivot back to your view.",
      criterion: { text: "One paragraph correctly using at least 2 different concession structures.", set: "main", pct: 0.9, prod: true },
      prod: { title: "Yes, but paragraph", prompt: "In 60–100 words: Le télétravail va-t-il remplacer le bureau ? State your position, concede the other side with bien que / alors que / certes… mais, then pivot back to your view.", check: "at least two different concession structures are used correctly (bien que + subjonctif, alors que, malgré, certes… mais, cependant…)" },
    },
    {
      id: "conditionnel", n: 12, title: "Le conditionnel", en: "Conditionnel", phase: 3,
      why: "Politeness register, hypothesis results (pairs with si-clauses), and unconfirmed information.",
      know: "",
      master: "Formation: futur stem + imparfait endings (same irregular stems as the futur). Three uses: politeness (je voudrais), hypothesis result, reported or unconfirmed information (il serait déjà parti).",
      mistakes: [],
      examples: [["Je voudrais un café, s'il vous plaît.", "I'd like a coffee, please."], ["Selon la rumeur, il serait déjà parti.", "Rumor has it he's already left."]],
      exercise: "Register shift: rewrite blunt requests as polite conditionnel ones.",
      criterion: { text: "9/10 on formation, and identify which use applies.", set: "main", pct: 0.9 },
      prod: { title: "Register shift", prompt: "Rewrite each blunt request politely with the conditionnel:\n1. Donne-moi ton numéro.\n2. Je veux parler au responsable.\n3. Vous devez m'envoyer le document.\n4. Tu peux fermer la fenêtre ?\n5. Je veux savoir le prix.", check: "all five requests are polite, grammatical and use the conditionnel" },
    },
    {
      id: "discours", n: 13, title: "Discours rapporté", en: "Reported speech", phase: 3,
      why: "Tâche 3 starts by reporting what two documents say, and that is reported speech.",
      know: "",
      master: "Tense backshift (présent → imparfait, passé composé → plus-que-parfait, futur → conditionnel); pronoun and possessive shifts; time expressions (aujourd'hui → ce jour-là, demain → le lendemain, hier → la veille).",
      mistakes: [],
      examples: [["Il a dit qu'il viendrait le lendemain.", "He said he would come the next day."]],
      exercise: "Direct → reported, checking both the verb tense and the time expression.",
      criterion: { text: "8/10 on the transformation drill.", set: "main", pct: 0.8 },
    },
    {
      id: "passif", n: 14, title: "La voix passive", en: "Passive voice", phase: 3,
      why: "Impersonal, formal register that suits Tâche 3 writing.",
      know: "",
      master: "Être (in the active verb's tense) + past participle, agreeing with the subject, + par / de for the agent. French often prefers on over a true passive, much more than English does.",
      mistakes: [],
      examples: [["Le rapport a été rédigé par l'équipe.", "The report was written by the team (vs the more natural: On a rédigé le rapport)."]],
      exercise: "Active → passive, then a second pass: would on sound more natural here?",
      criterion: { text: "Correctly transform 8/10.", set: "main", pct: 0.8 },
    },
    {
      id: "gerondif", n: 15, title: "Gérondif et participes", en: "Gérondif + participles", phase: 3,
      why: "Simultaneity or manner without a second clause: compact and distinctly B2.",
      know: "",
      master: "En + present participle for simultaneity or manner (en marchant); present participle as an adjective (une décision surprenante); past participle as an adjective, with agreement.",
      mistakes: [],
      examples: [["Il a répondu en souriant.", "He answered with a smile."], ["Une histoire fascinante.", "A fascinating story."]],
      exercise: "Combine two simultaneous actions into one gérondif sentence.",
      criterion: { text: "8/10 on the combination drill.", set: "main", pct: 0.8 },
    },
    {
      id: "micro", n: 16, title: "Pièges du quotidien", en: "Micro-error checklist", phase: 2,
      why: "Lexical, not grammatical systems: drill them like flashcards, not with long exercises.",
      know: "",
      master: "C'est + article/noun vs il/elle est + bare adjective or profession; à + city, en + feminine country, au + masculine country, aux + plural country; seul vs seulement; sûr vs sauf; le tour vs la tour; les vs des; leur vs ses; no calques from English.",
      mistakes: [["avoir un bon temps", "s'amuser / passer un bon moment"], ["Il est un bon médecin", "C'est un bon médecin"]],
      examples: [["C'est un bon médecin. / Il est médecin.", "He's a good doctor. / He's a doctor."], ["à Milan, en France, au Canada, aux États-Unis", "Prepositions with places."]],
      exercise: "Quick-choice flashcards, a few minutes at a time.",
      criterion: { text: "90%+ on the checklist drill.", set: "main", pct: 0.9 },
    },
  ];

  const LOW_PRIORITY = [
    ["Passé simple", "Recognition only (il fut, il eut, il vint, il fit). You'll meet it in CE passages, never produce it."],
    ["Subjonctif imparfait / plus-que-parfait", "Literary, effectively extinct. Skip."],
    ["Passé antérieur", "Formal literary narrative tense. Skip."],
    ["Style-soutenu inversions", "Peut-être viendra-t-il: recognize while reading, don't practise producing."],
    ["Rare connectors", "Nonobstant, partant, derechef: outside TCF register."],
  ];

  /* Vocabulary (Document 4). Card = [fr, en, example?] */
  const VOCAB = [
    { id: "connecteurs", label: "Connecteurs", en: "Connectors", full: true, cards: [
      // cependant, pourtant, toutefois, néanmoins, en effet, par conséquent, puisque, bien que and malgré are in "Mes cartes Anki" (anki.js).
      ["mais", "but"], ["donc", "so, therefore"], ["alors", "so, then"],
      ["par contre", "on the other hand (everyday)"], ["en revanche", "on the other hand (formal)"],
      ["par ailleurs", "besides, moreover"], ["en outre", "furthermore"],
      ["d'une part… d'autre part", "on the one hand… on the other"], ["ainsi", "thus, in this way"],
      ["c'est pourquoi", "that's why"],
      ["grâce à", "thanks to (positive cause)"], ["à cause de", "because of (negative cause)"],
      ["alors que", "whereas, while"], ["en définitive", "ultimately, all in all"],
      ["tout bien considéré", "all things considered"], ["dans cette optique", "with this in mind"], ["face à ce constat", "faced with this reality"],
      ["dans ce contexte", "in this context"], ["cela dit", "that said"], ["d'un autre côté", "on the other hand"],
      ["quant à", "as for"], ["il n'en demeure pas moins que", "the fact remains that"],
    ] },
    { id: "quotidien", label: "Vie quotidienne", en: "Daily life", full: true, cards: [
      ["le quotidien", "daily life"], ["les tâches ménagères", "household chores"], ["gérer son temps", "to manage one's time"],
      ["faire les courses", "to do the grocery shopping"], ["prendre rendez-vous", "to make an appointment"], ["se déplacer", "to get around"],
      ["le trajet", "the commute, the journey"], ["un imprévu", "an unexpected event"], ["être débordé(e)", "to be swamped"],
      ["se détendre", "to relax, unwind"], ["le voisinage", "the neighbourhood, the neighbours"], ["ranger", "to tidy up"],
      ["faire la queue", "to wait in line"], ["avoir hâte de", "to look forward to"],
    ] },
    { id: "immigration", label: "Immigration", en: "Immigration", full: true, cards: [
      ["l'intégration", "integration"], ["la résidence permanente", "permanent residence"], ["la citoyenneté", "citizenship"],
      ["le statut", "status"], ["la démarche", "administrative process, step"], ["le dossier", "file, application"],
      ["l'admissibilité", "eligibility"], ["le parcours migratoire", "migration journey"],
      ["s'intégrer", "to integrate"], ["déposer une demande", "to file an application"], ["remplir les conditions", "to meet the requirements"],
      ["immigrer", "to immigrate (arrive to settle)"], ["émigrer", "to emigrate (leave one's own country)"], ["s'expatrier", "to move abroad"],
      ["admissible", "eligible (admissible)"], ["qualifié(e)", "qualified, skilled"], ["francophone", "French-speaking"],
      ["bilingue", "bilingual"], ["le / la ressortissant(e)", "national (of a country)"], ["le délai", "deadline, processing time"],
      ["le seuil", "threshold"], ["l'accueil", "welcome, reception"], ["déposer un dossier", "to submit a file"],
      ["remplir les conditions d'admissibilité", "to meet the eligibility requirements"], ["s'intégrer à la société d'accueil", "to integrate into the host society"],
      ["prendre racine", "to put down roots"], ["tourner la page", "to turn the page, start fresh"],
      ["s'expatrier / entamer un parcours migratoire", "B2 upgrade of: aller vivre dans un autre pays", "De nombreux candidats choisissent le TCF Canada pour prouver leur niveau de français dans le cadre de leur démarche d'immigration. — Many candidates choose the TCF Canada to prove their level of French as part of their immigration process."],
    ] },
    { id: "travail", label: "Travail et emploi", en: "Work & employment", full: true, cards: [
      ["le marché du travail", "the job market"], ["le recrutement", "recruitment"], ["le télétravail", "remote work"],
      ["la reconversion professionnelle", "career change"], ["l'équilibre vie professionnelle-vie privée", "work-life balance"],
      ["postuler à un poste", "to apply for a position"], ["embaucher", "to hire"], ["licencier", "to lay off, dismiss"],
      ["se reconvertir", "to change careers"], ["négocier son salaire", "to negotiate one's salary"],
      ["polyvalent(e)", "versatile"], ["précaire", "precarious, insecure"], ["le CDI", "permanent contract"], ["le CDD", "fixed-term contract"],
      ["le chômage", "unemployment"], ["la promotion", "promotion"], ["faire ses preuves", "to prove oneself"],
      ["monter en compétences", "to upskill"], ["décrocher un poste", "B2 upgrade of: trouver un travail", "Le télétravail a profondément transformé le marché du travail depuis quelques années. — Remote work has profoundly changed the job market in recent years."],
    ] },
    { id: "environnement", label: "Environnement", en: "Environment & climate", full: true, cards: [
      ["le réchauffement climatique", "global warming"], ["l'empreinte carbone", "carbon footprint"], ["les énergies renouvelables", "renewable energy"],
      ["la biodiversité", "biodiversity"], ["le développement durable", "sustainable development"], ["les gaz à effet de serre", "greenhouse gases"],
      ["polluer", "to pollute"], ["préserver", "to preserve"], ["réduire les émissions", "to reduce emissions"],
      ["sensibiliser", "to raise awareness"], ["lutter contre", "to fight against"], ["durable", "sustainable, lasting"],
      ["polluant(e)", "polluting"], ["alarmant(e)", "alarming"], ["la sécheresse", "drought"], ["la canicule", "heatwave"],
      ["l'espèce menacée", "endangered species"], ["réduire son empreinte carbone", "to reduce one's carbon footprint"],
      ["adopter un mode de vie durable", "to adopt a sustainable lifestyle"], ["il est urgent d'agir", "action is urgently needed"],
      ["prendre conscience de", "to become aware of"],
      ["cela contribue au réchauffement climatique", "B2 upgrade of: c'est mauvais pour la planète", "Le réchauffement climatique menace la biodiversité à l'échelle mondiale. — Global warming threatens biodiversity worldwide."],
    ] },
    { id: "technologie", label: "Technologie", en: "Technology & social media", full: true, cards: [
      ["les réseaux sociaux", "social media"], ["l'intelligence artificielle", "artificial intelligence"], ["la vie privée", "privacy"],
      ["la désinformation", "misinformation"], ["l'algorithme", "algorithm"], ["partager du contenu", "to share content"],
      ["publier", "to post, publish"], ["s'informer via", "to get one's news via"], ["se déconnecter", "to disconnect, unplug"],
      ["addictif / addictive", "addictive"], ["fiable / peu fiable", "reliable / unreliable"], ["l'influenceur / l'influenceuse", "influencer"],
      ["la donnée personnelle", "personal data"], ["passer trop de temps sur les écrans", "to spend too much time on screens"],
      ["protéger sa vie privée", "to protect one's privacy"], ["être accro à", "to be hooked on"], ["prendre du recul", "to step back, gain perspective"],
      ["on observe une dépendance croissante aux écrans", "B2 upgrade of: les gens regardent trop leur téléphone", "La désinformation se propage rapidement en ligne. — Misinformation spreads quickly online."],
    ] },
    { id: "societe", label: "Société et vie civique", en: "Society, culture & civic life", full: true, cards: [
      ["la diversité", "diversity"], ["le vivre-ensemble", "social cohesion, living together"], ["le débat public", "public debate"],
      ["l'égalité", "equality"], ["la discrimination", "discrimination"], ["revendiquer", "to claim, demand"],
      ["s'engager (civiquement)", "to get involved (civically)"], ["manifester", "to protest, demonstrate"], ["engagé(e)", "committed, engaged"],
      ["inclusif / inclusive", "inclusive"], ["la manifestation", "demonstration, protest"], ["l'opinion publique", "public opinion"],
      ["prendre position sur un sujet", "to take a stand on an issue"], ["défendre ses valeurs", "to defend one's values"],
      ["favoriser le vivre-ensemble", "to foster social cohesion"], ["faire entendre sa voix", "to make one's voice heard"],
      ["avoir voix au chapitre", "to have a say"],
      ["la diversité constitue une richesse pour la société", "B2 upgrade of: les gens sont différents et c'est bien", "La diversité culturelle enrichit le débat public. — Cultural diversity enriches public debate."],
    ] },
    { id: "education", label: "Éducation", en: "Education", cards: [["le cursus", "course of study"], ["la formation continue", "continuing education"], ["décrocher un diplôme", "to earn a degree"]] },
    { id: "sante", label: "Santé", en: "Health", cards: [["le système de santé", "the health system"], ["la prévention", "prevention"]] },
    { id: "gouvernement", label: "Gouvernement", en: "Government & politics", cards: [["les pouvoirs publics", "public authorities"], ["la politique publique", "public policy"], ["légiférer", "to legislate"]] },
    { id: "economie", label: "Économie", en: "Economy", cards: [["l'inflation", "inflation"], ["le pouvoir d'achat", "purchasing power"]] },
    { id: "logement", label: "Logement", en: "Housing", cards: [["le logement", "housing"], ["le loyer", "rent"], ["la crise du logement", "the housing crisis"]] },
    { id: "transports", label: "Transports", en: "Transportation", cards: [["les transports en commun", "public transit"],["la mobilité durable", "sustainable mobility"]] },
    { id: "famille", label: "Famille", en: "Family", cards: [["la cellule familiale", "the family unit"], ["la garde des enfants", "childcare, custody"]] },
    { id: "crime", label: "Sécurité", en: "Crime & safety", cards: [["la sécurité publique", "public safety"], ["la criminalité", "crime (rate)"]] },
    { id: "science", label: "Science", en: "Science", cards: [["la recherche", "research"], ["l'innovation", "innovation"], ["expérimenter", "to experiment"]] },
    { id: "tourisme", label: "Tourisme", en: "Tourism", cards: [["le tourisme durable", "sustainable tourism"], ["la surfréquentation", "overtourism"], ["le dépaysement", "change of scenery, feeling of being somewhere new"]] },
    { id: "consommation", label: "Consommation", en: "Consumerism", cards: [["la surconsommation", "overconsumption"], ["l'achat responsable", "responsible purchasing"]] },
  ];

  /* Writing (Document 4, section 7) */
  const WRITING = {
    t1: {
      name: "Tâche 1", kind: "Message informel", min: 60, max: 120, exam: 15,
      expected: "Respond to a situation with an informal message to a named person: describe, recount or explain.",
      structure: ["Greeting", "Reason for writing", "Main content, 2–3 sentences", "Closing question or sign-off"],
      template: "Salut [nom], [raison de t'écrire]. [2–3 phrases de contenu]. [Question ou formule de clôture]. [Signature].",
      skeleton: "Salut …,\n\nJe t'écris pour …\n\n…\n\nÀ bientôt,\n…",
      prompts: [
        "Vous venez de vous installer dans un nouvel appartement. Écrivez un message à votre ami Julien pour lui décrire votre logement et votre quartier.",
        "Vous organisez une petite fête pour votre anniversaire samedi prochain. Écrivez un message à vos amis pour les inviter : date, lieu, programme.",
        "Votre collègue Sophie vous demande des conseils pour visiter Vancouver. Écrivez-lui un message pour lui recommander des lieux et des activités.",
        "Vous avez commencé une nouvelle activité sportive. Écrivez un message à votre cousine pour lui raconter votre première séance et l'inviter à venir avec vous.",
        "Un ami vous a prêté un livre que vous avez beaucoup aimé. Écrivez-lui un message pour le remercier et lui dire ce que vous en avez pensé.",
        "Vous cherchez quelqu'un pour garder votre chat pendant vos vacances. Écrivez un message à votre voisine pour lui demander ce service : dates, instructions.",
        "Vous êtes arrivé(e) au Canada il y a quelques mois. Écrivez un message à un ami de votre pays pour lui raconter vos premières impressions.",
        "Vous ne pouvez pas aller au rendez-vous prévu avec votre ami Karim ce week-end. Écrivez-lui un message pour vous excuser, expliquer pourquoi et proposer une autre date.",
      ],
    },
    t2: {
      name: "Tâche 2", kind: "Compte rendu + opinion", min: 120, max: 150, exam: 20,
      expected: "An article, letter or post for several readers that recounts an experience with your comments and opinions folded in, toward the objective the prompt states.",
      structure: ["Context in 1–2 sentences", "What happened, 2–3 sentences", "Your reaction or opinion + justification", "Conclusion tied to the task's objective"],
      template: "[Contexte en 1–2 phrases]. [Ce qui s'est passé, 2–3 phrases]. [Ta réaction/opinion + justification, 2–3 phrases]. [Conclusion liée à l'objectif de la tâche].",
      skeleton: "…\n\n…\n\nÀ mon avis, …\n\n…",
      prompts: [
        "Vous avez participé à une journée de bénévolat dans votre ville. Écrivez un article pour le blog de votre quartier : racontez cette expérience et encouragez les lecteurs à participer.",
        "Vous avez assisté à un festival de musique décevant (organisation, prix, attente). Écrivez un message sur le site du festival pour raconter votre expérience et demander des améliorations.",
        "Votre entreprise a testé la semaine de quatre jours pendant un mois. Écrivez un article pour le journal interne : racontez l'expérience et donnez votre avis.",
        "Vous avez suivi une formation en ligne. Écrivez un commentaire sur le site de la formation pour partager votre expérience et dire si vous la recommandez.",
        "Vous avez essayé de ne pas utiliser votre voiture pendant une semaine. Racontez votre expérience dans un article pour un magazine sur l'environnement, et dites ce que vous en retenez.",
        "Vous avez visité un musée récemment rénové. Écrivez un article pour le site culturel de votre ville : décrivez votre visite et donnez votre opinion.",
      ],
    },
    t3: {
      name: "Tâche 3", kind: "Comparer deux documents + opinion", min: 120, max: 180, exam: 25,
      expected: "Two short documents give differing views on a social issue. Write a text that compares both viewpoints, then gives your own opinion.",
      structure: ["Frame + compare both documents (40–60 words)", "Your opinion, with concession and justification (60–90 words)", "Brief, nuanced conclusion (20–30 words)"],
      paras: [
        { label: "Compare both documents", min: 40, max: 60 },
        { label: "Your opinion", min: 60, max: 90 },
        { label: "Conclusion", min: 20, max: 30 },
      ],
      template: "Le sujet de [thème] fait débat. D'une part, [position du document 1]. D'autre part, [position du document 2]. / En ce qui me concerne, je pense que [ton avis]. Certes, [l'autre côté], mais [ton raisonnement + exemple]. / En définitive, [position nuancée].",
      skeleton: "Le sujet de … fait débat. D'une part, … D'autre part, …\n\nEn ce qui me concerne, je pense que … Certes, …, mais …\n\nEn définitive, …",
      prompts: [
        { q: "Faut-il interdire les téléphones portables au collège ?", en: "Should phones be banned in middle school?", docs: [
          { who: "Martine, professeure de mathématiques", text: "Depuis que notre collège a interdit les téléphones, l'ambiance a changé. Pendant les récréations, les élèves discutent et jouent ensemble au lieu de fixer leur écran. Les professeurs constatent aussi une meilleure concentration en classe. Pour moi, l'école doit rester un lieu protégé des distractions numériques." },
          { who: "Karim, père d'élève", text: "Interdire complètement le téléphone, c'est oublier qu'il peut être un outil pédagogique : dictionnaire, recherches, applications éducatives. De plus, beaucoup de parents veulent pouvoir joindre leurs enfants en cas de problème. Plutôt que d'interdire, il faudrait apprendre aux jeunes à l'utiliser de façon responsable." },
        ] },
        { q: "Le télétravail est-il bénéfique pour les salariés ?", en: "Is remote work good for employees?", docs: [
          { who: "Claire, comptable", text: "Grâce au télétravail, je gagne presque deux heures par jour : plus de trajets, plus d'embouteillages. Je suis plus concentrée à la maison et j'organise mieux ma vie de famille. Mon employeur y gagne aussi, car je suis plus productive et moins stressée." },
          { who: "Thomas, ingénieur", text: "Après un an de télétravail, je me sentais isolé. Les échanges informels avec les collègues me manquaient, et la frontière entre vie professionnelle et vie privée avait disparu : je répondais à mes courriels jusqu'à minuit. Selon moi, le bureau reste indispensable pour garder le lien social." },
        ] },
        { q: "Les grandes villes devraient-elles limiter la voiture individuelle ?", en: "Should big cities restrict private cars?", docs: [
          { who: "Association Ville respirable", text: "Dans le centre-ville, la voiture occupe un espace énorme et pollue l'air que nous respirons. Les villes qui ont réduit la circulation ont vu la qualité de l'air s'améliorer et les commerces de proximité se développer. Il faut investir dans les transports en commun et les pistes cyclables." },
          { who: "Jean-Marc, artisan plombier", text: "Limiter la voiture, c'est pénaliser ceux qui n'ont pas le choix : les habitants des banlieues mal desservies, les personnes âgées, les artisans qui transportent du matériel. Tant que les transports en commun ne seront pas plus fiables, la voiture restera nécessaire pour beaucoup de familles." },
        ] },
        { q: "La technologie renforce-t-elle ou affaiblit-elle les liens sociaux ?", en: "Does technology strengthen or weaken social bonds?", docs: [
          { who: "Odette, 72 ans", text: "Grâce aux appels vidéo, je vois chaque semaine mes petits-enfants qui habitent à l'étranger. Les réseaux sociaux m'ont aussi permis de retrouver d'anciens amis. Pour moi, la technologie rapproche les gens, surtout quand la distance les sépare." },
          { who: "Lucas, psychologue", text: "Au restaurant, je vois des familles entières les yeux rivés sur leur téléphone. On a des centaines d'amis en ligne, mais de moins en moins de vraies conversations. La technologie donne l'illusion d'être connecté tout en nous isolant davantage." },
        ] },
        { q: "Faut-il taxer davantage les entreprises qui polluent ?", en: "Should companies that pollute be taxed more?", docs: [
          { who: "Collectif Planète juste", text: "Les entreprises qui polluent font payer à toute la société le coût de leurs dégâts : maladies, catastrophes climatiques, nettoyage. Une taxe plus élevée les obligerait à investir dans des technologies propres, et l'argent récolté pourrait financer la transition écologique." },
          { who: "Fédération des PME", text: "Augmenter les taxes risque de pousser les entreprises à délocaliser leurs usines dans des pays aux règles moins strictes. Résultat : des emplois perdus ici, et autant de pollution ailleurs. Il vaut mieux aider les entreprises à se moderniser grâce à des subventions et à des incitations." },
        ] },
      ],
    },
  };

  /* Comprehension samples, so the page works before any set is generated. */
  const COMP = {
    resources: [
      { name: "TV5Monde Apprendre", url: "https://apprendre.tv5monde.com/fr", what: "Short videos with exercises, sorted by CEFR level up to B2." },
      { name: "RFI Français facile", url: "https://francaisfacile.rfi.fr/fr/", what: "Journal en français facile: ten minutes of news read slowly, with transcripts." },
      { name: "Radio-Canada OHdio", url: "https://ici.radio-canada.ca/ohdio", what: "Canadian French radio and podcasts at natural speed." },
      { name: "France Éducation International", url: "https://www.france-education-international.fr/test/tcf-canada", what: "The official TCF Canada page: format, rules and sample questions." },
    ],
  };

  /* IRCC TCF Canada → NCLC equivalence (Document 1, section 1.4). */
  const NCLC = [
    { nclc: "10+", n: 10, cefr: "C1–C2", co: 549, ce: 549, ee: 16, eo: 16, coR: "549–699", ceR: "549–699", eR: "16–20" },
    { nclc: "9", n: 9, cefr: "C1", co: 523, ce: 524, ee: 14, eo: 14, coR: "523–548", ceR: "524–548", eR: "14–15" },
    { nclc: "8", n: 8, cefr: "B2", co: 503, ce: 499, ee: 12, eo: 12, coR: "503–522", ceR: "499–523", eR: "12–13" },
    { nclc: "7", n: 7, cefr: "B2", co: 458, ce: 453, ee: 10, eo: 10, coR: "458–502", ceR: "453–498", eR: "10–11" },
    { nclc: "6", n: 6, cefr: "B1", co: 398, ce: 406, ee: 7, eo: 7, coR: "398–457", ceR: "406–452", eR: "7–9" },
    { nclc: "5", n: 5, cefr: "B1", co: 369, ce: 375, ee: 6, eo: 6, coR: "369–397", ceR: "375–405", eR: "6" },
    { nclc: "4", n: 4, cefr: "A2", co: 331, ce: 342, ee: 4, eo: 4, coR: "331–368", ceR: "342–374", eR: "4–5" },
  ];

  const EXAM = [
    { code: "CO", name: "Compréhension orale", fmt: "39 questions · 35 min", note: "Multiple choice. Each recording plays once." },
    { code: "CE", name: "Compréhension écrite", fmt: "39 questions · 60 min", note: "Multiple choice, from short notices to long articles." },
    { code: "EE", name: "Expression écrite", fmt: "3 tâches · 60 min", note: "T1 60–120 words · T2 120–150 · T3 120–180, comparing two documents." },
    { code: "EO", name: "Expression orale", fmt: "3 tâches · 12 min", note: "T1 2 min, no prep · T2 5 min 30 incl. 2 min prep · T3 4 min 30, no prep." },
  ];

  const AUTOFAIL = ["Word count not respected", "Illegible", "Off-topic", "A task skipped"];

  /* Phase exit criteria (Document 1). auto = rule the app can check itself. A drill rule counts the day's first
     round of the set only, on two days at least a week apart (coldMet in app.js), and comp counts your first try
     at each set. Speaking is practised off the site, so its checks are ticked by hand. */
  const CRITERIA = {
    1: [
      { id: "p1-pron", text: "Zero pronominal-verb auxiliary errors across 2 consecutive writing submissions", auto: "writingZero:pronominaux" },
      { id: "p1-imp", text: "9/10+ on a dedicated imperative + pronoun drill", auto: "drill:imperatif:main:0.9" },
      { id: "p1-subj", text: "Subjonctif présent correctly formed (regular + top irregulars) in isolation", auto: "drill:subjonctif:formation:0.9" },
      { id: "p1-base", text: "Baseline on file: one CO sample and one CE sample", auto: "baseline" },
    ],
    2: [
      { id: "p2-seq", text: "Séquence des temps drill at 8/10+ (up from 6/10)", auto: "drill:sequence:main:0.8" },
      { id: "p2-t3", text: "A Tâche 3 draft that compares both documents before the opinion, within 120–180 words, in one sitting", auto: "t3ok" },
      { id: "p2-coce", text: "CO and CE at 70%+ on B1 material, on your first try at each set", auto: "comp:B1:0.7" },
      { id: "p2-pace", text: "A B1 reading set at exam pace (4 questions in 6 minutes) with 3/4 or better", auto: "pace:ce:B1:0.75" },
      { id: "p2-eo", text: "A fluent, hesitation-light 2-minute Orale Tâche 1: your introduction plus answers to follow-up questions" },
    ],
    3: [
      { id: "p3-mood", text: "12/15+ on the mixed subjonctif / indicatif / conditionnel drill", auto: "drill:subjonctif:contraste:0.8" },
      { id: "p3-mock", text: "A full Écrite mock rated B2 on 2 of 3 tasks" },
      { id: "p3-t3", text: "An Orale Tâche 3 sustaining 3+ minutes of on-topic argued speech" },
      { id: "p3-coce", text: "CO and CE sets averaging 70%+ at B2, on your first try, with CE on the clock", auto: "comp:B2:0.7:timed" },
      { id: "p3-cex", text: "A CE practice exam with all 39 questions answered inside 60 minutes", auto: "examFull:ce" },
    ],
    4: [
      { id: "p4-ee", text: "3 consecutive full Écrite mocks with correct word counts on all 3 tasks and the Tâche 3 comparison present" },
      { id: "p4-eo", text: "2 consecutive full Orale mocks completed in full at real time" },
      { id: "p4-coce", text: "CO and CE mocks in the NCLC 7 band (458+ / 453+) at least twice each", auto: "mocks:coce2" },
    ],
    5: [
      { id: "p5-all", text: "2 consecutive full mocks with all 4 skills at or above NCLC 7", auto: "mocks:all2" },
      { id: "p5-log", text: "Booking, ID requirements and test-centre details confirmed" },
    ],
  };

  /* More vocabulary: Phase 2–3 themes built out, plus the Document 2 micro-error checklist as cards. */
  const MORE_CARDS = {
    education: [
      ["s'inscrire à un programme", "to enrol in a program"], ["l'établissement scolaire", "school (the institution)"],
      ["le décrochage scolaire", "dropping out of school"], ["l'échec scolaire / la réussite scolaire", "academic failure / success"],
      ["les frais de scolarité", "tuition fees"], ["l'égalité des chances", "equal opportunity"],
      ["faire des études supérieures", "to pursue higher education"], ["l'enseignement à distance", "distance learning"],
      ["faire reconnaître ses diplômes", "to get one's qualifications recognized", "Beaucoup de nouveaux arrivants doivent faire reconnaître leurs diplômes avant de travailler. — Many newcomers have to get their qualifications recognised before they can work."],
      ["se former", "to train, to upskill"], ["l'orientation professionnelle", "career guidance"],
      ["acquérir des compétences", "B2 upgrade of: apprendre des choses"],
    ],
    sante: [
      ["le médecin de famille", "family doctor"], ["la liste d'attente", "waiting list"], ["les urgences", "the emergency room"],
      ["prendre rendez-vous chez le médecin", "to book a doctor's appointment"], ["l'assurance maladie", "health insurance"],
      ["la santé mentale", "mental health"], ["mener une vie saine", "to lead a healthy life"],
      ["l'épuisement professionnel", "burnout"], ["la sédentarité", "sedentary lifestyle"], ["se soigner", "to look after one's health, get treatment"],
      ["l'accès aux soins", "access to healthcare", "L'accès aux soins reste difficile dans certaines régions éloignées. — Access to healthcare is still difficult in some remote regions."],
      ["adopter de saines habitudes de vie", "B2 upgrade of: manger bien et faire du sport"],
    ],
    famille: [
      ["la famille monoparentale", "single-parent family"], ["la famille recomposée", "blended family"], ["les liens familiaux", "family ties"],
      ["concilier travail et vie de famille", "to balance work and family life"], ["le congé parental", "parental leave"],
      ["élever ses enfants", "to raise one's children"], ["la natalité", "birth rate"], ["le vieillissement de la population", "population ageing"],
      ["s'occuper de ses parents âgés", "to care for one's elderly parents"], ["le fossé des générations", "the generation gap"],
      ["transmettre des valeurs", "to pass on values"],
      ["la conciliation travail-famille", "B2 upgrade of: avoir du temps pour son travail et sa famille", "La conciliation travail-famille est une priorité pour beaucoup de jeunes parents. — Work-family balance is a priority for many young parents."],
    ],
    gouvernement: [
      ["le gouvernement fédéral / provincial", "the federal / provincial government"], ["adopter une loi", "to pass a law"],
      ["mettre en place une réforme", "to implement a reform"], ["les élus", "elected officials"], ["le droit de vote", "the right to vote"],
      ["la fiscalité", "taxation"], ["les impôts", "taxes"], ["les services publics", "public services"],
      ["l'intérêt général", "the public interest"], ["prendre des mesures pour", "to take measures to"],
      ["la démocratie participative", "participatory democracy"],
      ["les pouvoirs publics devraient intervenir", "B2 upgrade of: le gouvernement doit faire quelque chose"],
    ],
    economie: [
      ["le coût de la vie", "the cost of living"], ["la hausse des prix", "rising prices"], ["le salaire minimum", "minimum wage"],
      ["la pénurie de main-d'œuvre", "labour shortage", "La pénurie de main-d'œuvre touche surtout la santé et la construction. — The labour shortage mainly affects healthcare and construction."],
      ["le taux de chômage", "unemployment rate"], ["la mondialisation", "globalization"], ["les inégalités sociales", "social inequalities"],
      ["faire des économies", "to save money"], ["s'endetter", "to go into debt"], ["relancer l'économie", "to boost the economy"],
      ["les PME", "small and medium-sized businesses"],
      ["la flambée des prix", "B2 upgrade of: les prix montent beaucoup"],
    ],
    logement: [
      ["le propriétaire / le locataire", "landlord / tenant"], ["signer un bail", "to sign a lease"], ["charges comprises", "utilities included"],
      ["déménager", "to move (house)"], ["la colocation", "flat-sharing"], ["le logement social", "social housing"],
      ["l'accès à la propriété", "access to home ownership"], ["la hausse des loyers", "rent increases"], ["se loger", "to find somewhere to live"],
      ["l'étalement urbain", "urban sprawl"], ["la gentrification", "gentrification"],
      ["le marché locatif est saturé", "B2 upgrade of: c'est difficile de trouver un appartement", "Dans les grandes villes, le marché locatif est saturé et les loyers explosent. — In the big cities, the rental market is saturated and rents are soaring."],
    ],
  };
  VOCAB.forEach((th) => { (MORE_CARDS[th.id] || []).forEach((c) => th.cards.push(c)); });
  VOCAB.push({ id: "pieges", label: "Pièges", en: "Common traps (Document 2 checklist)", full: true, cards: [
    ["C'est un bon médecin.", "He's a good doctor. (c'est or il est?)"], ["Il est médecin.", "He's a doctor. (c'est or il est?)"],
    ["à Montréal · en France · au Canada · aux États-Unis", "in Montréal · in France · in Canada · in the US"],
    ["J'ai seulement deux minutes.", "I only have two minutes."], ["Il est seul ce soir.", "He's alone tonight."],
    ["tout le monde, sauf lui", "everyone except him"], ["Je suis sûr de moi.", "I'm sure of myself."],
    ["le tour du monde", "a trip around the world"], ["la tour Eiffel", "the Eiffel Tower"],
    ["s'amuser / passer un bon moment", "to have a good time (never avoir un bon temps)"],
    ["J'aime les chats.", "I like cats (in general)."], ["J'ai des chats.", "I have cats."],
    ["leur maison / leurs enfants", "their house / their children"], ["ses enfants", "his / her children"],
    ["J'habite ici depuis trois ans.", "I've lived here for three years (and still do)."], ["Je suis arrivé il y a deux ans.", "I arrived two years ago."],
    ["Si !", "Yes! (answering a negative question)"], ["Je connais Montréal.", "I know Montréal (a place)."], ["Je sais nager.", "I know how to swim."],
    ["C'est facile à comprendre.", "It's easy to understand."], ["Il est important de lire le contrat.", "It's important to read the contract."],
    ["amener quelqu'un / apporter quelque chose", "to bring someone / to bring something"],
    // From your own corrected writing (Oct 2026).
    ["J'ai participé au festival.", "I took part in the festival. (participer à + noun)"],
    ["Je viens te voir demain.", "I'm coming to see you tomorrow. (venir + infinitive, no à)"],
    ["plus de billets", "more tickets (plus de + noun, never plus des)"],
    ["chercher sur Internet", "to look it up online (sur Internet, no article)"],
    ["la semaine dernière · le mois dernier", "last week · last month (dernier after the noun)"],
    ["actuellement / en fait", "currently / actually (actuellement never means actually)"],
    ["Après avoir fini, il est parti.", "After finishing, he left. (same subject: après + past infinitive)"],
    ["Après qu'il est parti, on a continué.", "After he left, we carried on. (après que + indicative)"],
  ] });
  PHASES[1].vocab.push("pieges");
  PHASES[2].vocab.splice(4, 0, "logement");

  /* More writing prompts */
  WRITING.t1.prompts.push(
    "Vous avez trouvé un nouvel emploi. Écrivez un message à votre ancienne collègue Nadia pour lui annoncer la nouvelle et lui décrire votre nouveau poste.",
    "Vous voulez organiser une sortie en groupe ce week-end (randonnée, pique-nique…). Écrivez un message à vos amis pour proposer l'activité et demander qui est disponible.",
    "Votre ami Hugo arrive bientôt au Canada pour étudier. Écrivez-lui un message pour lui donner des conseils pratiques pour ses premières semaines.",
    "Vous avez oublié un objet important chez un ami après une soirée. Écrivez-lui un message pour lui expliquer la situation et organiser sa récupération.",
  );
  WRITING.t2.prompts.push(
    "Vous avez déménagé dans un nouveau quartier. Écrivez un article pour le bulletin de votre ancienne association de quartier : racontez votre déménagement et comparez vos deux quartiers.",
    "Vous avez participé à une journée portes ouvertes dans une entreprise ou une école. Écrivez un compte rendu pour votre blog et dites si vous conseillez cette visite.",
    "Vous avez eu un problème avec une livraison commandée en ligne. Écrivez un avis sur le site du vendeur pour raconter ce qui s'est passé et demander une solution.",
    "Vous avez assisté à une conférence sur l'intégration des nouveaux arrivants. Écrivez un article pour le bulletin de votre centre communautaire : résumez la conférence et donnez votre avis.",
  );
  WRITING.t3.prompts.push(
    { q: "Faut-il rendre les transports en commun gratuits ?", en: "Should public transit be free?", docs: [
      { who: "Sophie, conseillère municipale", text: "Dans plusieurs villes qui ont rendu les transports en commun gratuits, la fréquentation a nettement augmenté et la circulation automobile a diminué. La gratuité profite surtout aux ménages modestes, pour qui le coût du transport pèse lourd dans le budget. C'est une mesure à la fois sociale et écologique." },
      { who: "Marc, économiste", text: "Rien n'est vraiment gratuit : ce sont les contribuables qui paieront la facture. Avec cet argent, on pourrait plutôt améliorer la fréquence des bus et entretenir un réseau vieillissant. Les usagers réclament surtout un service fiable et ponctuel, pas forcément gratuit." },
    ] },
    { q: "Les écrans ont-ils leur place à l'école primaire ?", en: "Do screens belong in primary school?", docs: [
      { who: "Julie, enseignante", text: "Les tablettes permettent d'adapter les exercices au niveau de chaque enfant et rendent l'apprentissage plus motivant. De plus, les élèves doivent apprendre dès le plus jeune âge à utiliser les outils numériques qu'ils retrouveront toute leur vie." },
      { who: "Paul, pédiatre", text: "Les enfants passent déjà trop de temps devant les écrans à la maison. À l'école, ils ont besoin d'écrire à la main, de manipuler des objets et d'échanger entre eux. Plusieurs études suggèrent d'ailleurs que la lecture sur papier favorise une meilleure compréhension." },
    ] },
    { q: "L'immigration est-elle la solution à la pénurie de main-d'œuvre ?", en: "Is immigration the answer to labour shortages?", docs: [
      { who: "Chambre de commerce régionale", text: "Dans de nombreux secteurs, comme la santé ou la construction, les entreprises n'arrivent plus à recruter. Les travailleurs immigrés apportent des compétences dont notre économie a besoin et contribuent au dynamisme des régions. Sans eux, beaucoup de services ne pourraient tout simplement pas fonctionner." },
      { who: "Nadia, sociologue", text: "Accueillir plus de travailleurs ne suffit pas si l'on ne leur offre pas de logement, de cours de langue et une vraie reconnaissance de leurs diplômes. Il faudrait aussi mieux former et mieux payer les travailleurs locaux. L'immigration est une partie de la solution, pas une solution miracle." },
    ] },
  );

  /* The built-in reading sets are in comp-ce.js. */
  COMP.ceSets = [];

  /* ================= TCF Canada: the exam this whole site targets =================
     Source: Manuel du candidat TCF Canada (France Éducation International, ex-CIEP) and
     IRCC's TCF Canada → NCLC equivalence table. Every Claude prompt in app.js reads this,
     so grading, rubrics and generated exercises follow TCF Canada (not TCF tout public,
     DELF/DALF or TEF Canada). FEI's internal marking grids aren't public; the criteria
     below are the ones it publishes. */
  const TCF_CANADA = {
    source: "Manuel du candidat TCF Canada (France Éducation International) and IRCC's TCF Canada to NCLC equivalence table",
    brief: "The exam is the TCF Canada from France Éducation International, the version IRCC accepts for Canadian immigration and citizenship. It is not the TCF tout public, the DELF/DALF or the TEF Canada. Listening and reading are scored from 100 to 699; writing and speaking from 0 to 20 each, with a CEFR level. IRCC converts each skill separately to an NCLC level and never averages them (NCLC 7 = listening 458–502, reading 453–498, writing and speaking 10–11/20). Some comprehension items use Canadian francophone accents or contexts, and the writing and speaking topics lean toward emigration and expatriation, especially to Canada.",
    bands: "Writing and speaking out of 20: B1 = 6–9, B2 = 10–13, C1 = 14–15, C1–C2 = 16–20. NCLC 5 = 6, NCLC 6 = 7–9, NCLC 7 = 10–11, NCLC 8 = 12–13, NCLC 9 = 14–15, NCLC 10+ = 16–20. Comprehension: A1 100–199, A2 200–299, B1 300–399, B2 400–499, C1 500–599, C2 600–699.",
    ee: {
      rules: "Expression écrite: 60 minutes, three tasks, no dictionary or grammar book, and only the final text is marked. Tâche 1: a message to describe, recount and/or explain, addressed to one or more recipients whose status the prompt specifies (60–120 words). Tâche 2: an article, letter or note for several readers recounting an experience or a story, with comments, opinions or arguments serving a stated objective such as complaining or making up (120–150 words). Tâche 3: a text (for a newspaper, a website, a colleague or a manager) that first compares two viewpoints on a social issue expressed in two short documents of about 90 words each (part 1, 40–60 words), then takes a position on the issue (part 2, 80–120 words), for 120–180 words in total. A task that ignores the word count or the instructions, is off-topic or is left blank can be marked A1 non atteint.",
      criteria: [
        ["Réalisation de la tâche", "follows the instructions: recipient and register, the required content, the stated objective and the word count; for Tâche 3, compares both documents in part 1 before taking a position in part 2, reformulating rather than copying"],
        ["Cohérence et cohésion", "clear, logical progression of ideas, paragraphing, varied and accurate connectors, thematic development"],
        ["Lexique", "range and precision of vocabulary for the topic, and control of it"],
        ["Morphosyntaxe", "range and control of grammar, including how elaborate the sentences are (subordination, tenses, moods)"],
        ["Orthographe", "spelling, accents, agreement and elision"],
        ["Adéquation sociolinguistique", "register and conventions suited to the situation and the recipient (tu or vous, greetings, sign-offs)"],
      ],
    },
    eo: {
      rules: "Expression orale: 12 minutes with an examiner, recorded and marked twice. Tâche 1, entretien dirigé (2 min, no preparation): an exchange with an examiner the candidate doesn't know, who asks about them, their background, family, work and plans. Tâche 2, exercice en interaction (5 min 30: 2 min of preparation with short notes allowed, then 3 min 30 of exchange): the candidate obtains information in an everyday situation, with both roles set by the prompt (for example, finding someone to look after a pet while away). Tâche 3, expression d'un point de vue (4 min 30, no preparation): the candidate speaks spontaneously, continuously and convincingly in answer to a question chosen by the examiner. Candidates may ask the examiner to repeat or clarify.",
      criteria: [
        ["Réalisation de la tâche", "does what the task asks: talks about themself, obtains the information, or defends a clear point of view"],
        ["Cohérence et structure", "a clear, structured argument or exchange: introduction, development, conclusion, connectors"],
        ["Interaction", "Tâche 2: relevant, well-formed and varied questions suited to the situation, reacting to the answers"],
        ["Lexique", "range and precision of vocabulary"],
        ["Morphosyntaxe", "range and control of grammar"],
        ["Aisance", "fluency and continuity, getting around a missing word (only partly visible in a transcript)"],
      ],
    },
    comp: "Compréhension orale: 39 multiple-choice items in 35 minutes, four options and one correct answer, each recording heard only once, items getting harder from A1 to C2: everyday dialogues, phone calls, interviews, public announcements, radio and TV news and programmes, and talks on concrete or abstract topics at standard speed. Compréhension écrite: 39 items in 60 minutes, one document and one question each, from notices, ads, menus, timetables and letters to opinion articles and long, complex or literary texts. Distractors reuse words from the document in misleading ways.",
    /* A reading item at each level: one document and one question. The documents follow the Manuel du
       candidat's list for each level, and the questions follow France Éducation International's sample
       items, where even the easy ones reword the document and the wrong options reuse its words. `items`
       are the question numbers on the real test. check_ce.js holds the built-in B1 and B2 documents to
       these lengths; app.js gives all of this to Claude when it writes reading sets and exams.
       Checked again in October 2026 against the Manuel du candidat, version J (September 2024): 39 questions
       in 60 minutes, rising difficulty, only right answers counted and weighted by difficulty; the documents
       run from short messages and everyday documents to letters, articles that take a position, and long
       factual or literary texts. Prep guides (languagenext, tcfca and others) add vocabulary-in-context
       questions and questions on a document's purpose, and describe the traps below. FEI's own samples are set
       in France while Canadian guides report Canadian news and services, so documents mix the two. */
    ceLevels: {
      A1: { items: "1–4", words: [15, 40], docs: "very short everyday documents: signs, notices, short text messages, small ads and timetables", asks: "a detail stated directly" },
      A2: { items: "5–10", words: [40, 80], docs: "short practical documents: simple emails and letters, building notices, ads, programmes and notes", asks: "a detail, what the writer asks for or proposes, or what the document is for (« Que doit faire… ? », « Que propose… ? », « Quel est le but de ce message ? », where the wrong options misread it as informing, inviting, complaining or thanking)" },
      B1: { items: "11–19", words: [70, 150], docs: "an everyday text about daily life or work: a personal or semi-formal email or letter, a forum post, a short news item, a practical article, a detailed notice or ad, a testimonial", asks: "what the document is for or what we learn from it as a whole: its purpose, a request or proposal, a cause, a change, or what the writer thinks or feels (« Quel est le but de ce message ? », « Qu'apprend-on dans ce texte ? », « Pourquoi… ? »). Answering often means putting two pieces of information together" },
      B2: { items: "20–29", words: [140, 260], docs: "an article or report in which the writer takes a position on a concrete or abstract subject: a news analysis, an editorial or opinion column, a review, an open letter, a reader's letter, an interview extract", asks: "the main idea, the writer's position, intention or attitude, what is implied, or what a study, example or quotation is there to show (« Quelle est la position de l'auteur ? », « Que reproche l'auteur à… ? », « Que laisse entendre… ? »). The writer's real view often comes after a concession (certes… mais, pourtant, reste que). Some ask what an expression means in the text (« Dans le texte, l'expression « … » signifie… »), with its literal or other meanings as the wrong options" },
      C1: { items: "30–35", words: [200, 300], docs: "a complex argumentative or analytical text: an essay, an analysis, a report or an opinion column with nuance and implicit positions", asks: "implicit meaning, the structure of the argument, the tone, or what a word or expression means in the text" },
      C2: { items: "36–39", words: [250, 350], docs: "a demanding text: a literary passage (a narrative with implicit emotion or irony) or a dense essay", asks: "implicit meaning, irony, tone or the effect of a stylistic choice" },
    },
    ceItemRule: "The right answer rewords the document instead of copying its words. Each wrong option reuses words or facts from the document but gets them wrong: a detail that is there but doesn't answer the question, a view the writer reports and then rejects, an overgeneralisation (toujours, tous, seulement), a number, quantity or relation changed (après for avant, loin for près), a cause and effect swapped, the document's intent misread (informing taken for complaining, say), or an assumption the text doesn't support. Never ask which option is NOT in the text. Settings mix Canada (Québec, Ontario, Acadie, the West) with France, Belgium, Switzerland and francophone Africa, in standard French, with Québec usage only where the setting is Canadian.",
    /* The CE practice exam: 39 items in 60 minutes, one document per item, in level blocks from A1 to C2.
       Each block is [level, items, points per correct item]. TCF prep sites quote 3, 9, 15, 21 and 26
       points; 33 for items 36–39 is what brings the total to 699. */
    ceExam: {
      minutes: 60,
      blocks: [["A1", 4, 3], ["A2", 6, 9], ["B1", 9, 15], ["B2", 10, 21], ["C1", 6, 26], ["C2", 4, 33]],
      note: "An estimate from the points per level that TCF prep sites use. France Éducation International scores the real test with item response theory and doesn't publish its method.",
    },
    /* A listening item at each level. The kinds of item follow the official samples in the Manuel du candidat
       (FEI, version D, 2022, pp. 48–51): a picture with four spoken statements, a spoken question with four
       spoken replies, then a document (a dialogue, then radio pieces and talks) followed by the spoken question,
       with four written options. Each recording plays once and the question comes after it. The levels, the
       short reading pause before each recording, the short answer window after it and the clip lengths follow
       guides to the computer-based TCF Canada, which agree with one another. `secs` is the recording, the
       spoken question included, and `words` its spoken words; check_co.js holds the built-in exam to them. */
    coLevels: {
      A1: { items: "1–4", secs: [10, 20], words: [18, 34], docs: "a picture of an everyday scene, with four short spoken statements (A to D), one of which describes it", asks: "which statement matches the picture" },
      A2: { items: "5–10", secs: [10, 25], words: [20, 60], docs: "a spoken question with four spoken replies (A to D), then short everyday documents: a voicemail, a public announcement, a short exchange", asks: "the reply that fits the question, or a detail, what someone wants or has to do" },
      B1: { items: "11–19", secs: [20, 35], words: [50, 85], docs: "a conversation, a phone call, a news brief or practical information on the radio", asks: "the purpose, a reason, a decision, or what someone thinks or will do" },
      B2: { items: "20–29", secs: [28, 50], words: [80, 135], docs: "radio: an interview, a report, a testimony, a discussion on a concrete subject", asks: "the speaker's position, intention or attitude, the main idea, or what is implied" },
      C1: { items: "30–35", secs: [40, 65], words: [115, 185], docs: "a talk, a debate or a radio column on an abstract subject, with nuance", asks: "implicit meaning, the structure of the argument, or a nuanced position" },
      C2: { items: "36–39", secs: [45, 70], words: [130, 200], docs: "dense speech at natural speed: an expert discussion, a reading, an ironic column", asks: "implicit meaning, irony, an attitude or the effect of a remark" },
    },
    /* The CO practice exam: 39 items in 35 minutes, in the same level blocks and points as the CE one. Items 1–4
       are pictures and 5–7 questions with spoken replies; the rest are documents. Before each recording there's a
       pause to read (seconds, by level; questions with spoken replies have nothing to read), and after it a window
       to answer, then the next item starts by itself. */
    coExam: {
      minutes: 35,
      blocks: [["A1", 4, 3], ["A2", 6, 9], ["B1", 9, 15], ["B2", 10, 21], ["C1", 6, 26], ["C2", 4, 33]],
      kinds: [["pic", 4], ["reply", 3], ["doc", 32]],
      read: { A1: 8, A2: 8, B1: 8, B2: 8, C1: 10, C2: 10, reply: 3 },
      answer: { A1: 7, A2: 7, B1: 7, B2: 7, C1: 10, C2: 10 },
      note: "An estimate from the points per level that TCF prep sites use. France Éducation International scores the real test with item response theory and doesn't publish its method.",
    },
  };
  EXAM[0].note = "Multiple choice, four options, one correct. Each recording is heard once, and questions get harder as you go (A1 → C2). Some items use Canadian accents or contexts.";
  EXAM[1].note = "Multiple choice, four options, from notices, ads and letters up to opinion articles and long, complex texts, in rising difficulty.";
  EXAM[2].note = "T1 message, 60–120 words · T2 article or letter with opinions, 120–150 · T3 compare two ~90-word documents (part 1, 40–60 words), then take a position (part 2, 80–120). No dictionary, and only the final text is marked.";
  EXAM[3].note = "T1 entretien dirigé, 2 min, no prep · T2 interaction, 5 min 30 including 2 min prep (short notes allowed) · T3 point of view, 4 min 30, no prep. You can ask the examiner to repeat.";

  /* Tâche 3 follows the official two-part split, and the built-in documents are lengthened toward the official ~90 words. */
  WRITING.t3.expected = "Two short documents (about 90 words each) give differing views on a social issue. Write a text that first compares both viewpoints (part 1), then takes your position (part 2).";
  WRITING.t3.structure = ["Partie 1, 40–60 words: present the topic and compare the two documents' viewpoints in your own words", "Partie 2, 80–120 words: take a position, concede the other side, justify it with an example, and close with a nuanced conclusion"];
  WRITING.t3.paras = [
    { label: "Partie 1 · compare both documents", min: 40, max: 60 },
    { label: "Partie 2 · your position", min: 80, max: 120 },
  ];
  const T3_MORE = {
    "Faut-il interdire les téléphones portables au collège ?": ["Les cas de harcèlement en ligne pendant les heures de cours ont aussi beaucoup diminué, et les élèves eux-mêmes reconnaissent qu'ils se sentent moins stressés.", "Une interdiction totale risque surtout de pousser les élèves à l'utiliser en cachette. L'école devrait plutôt fixer des règles claires, avec des moments précis où le téléphone est autorisé."],
    "Le télétravail est-il bénéfique pour les salariés ?": ["Je peux aussi faire une vraie pause à midi et aller chercher mes enfants à l'école. Deux jours au bureau par semaine me suffisent largement pour voir mes collègues.", "Les nouveaux employés ont encore plus de mal : il est difficile d'apprendre son métier sans pouvoir poser une question rapide au collègue assis à côté."],
    "Les grandes villes devraient-elles limiter la voiture individuelle ?": ["Moins de voitures, c'est aussi moins de bruit, moins d'accidents et plus d'espace pour les piétons et les enfants. Nos villes doivent être pensées pour les habitants, pas pour les automobiles.", "Pour moi, la voiture n'est pas un luxe mais un outil de travail. Avant de limiter son usage, les villes devraient proposer de vraies solutions de remplacement, à un prix raisonnable."],
    "La technologie renforce-t-elle ou affaiblit-elle les liens sociaux ?": ["Je participe même à un club de lecture en ligne avec des personnes de mon âge, ce qui m'aide à rompre la solitude depuis que je vis seule.", "Dans mon cabinet, je reçois de plus en plus d'adolescents qui se sentent seuls malgré leurs centaines d'abonnés. Il devient urgent d'apprendre à se déconnecter."],
    "Faut-il taxer davantage les entreprises qui polluent ?": ["C'est le principe du pollueur-payeur. Sans pression financière, rien ne changera, car polluer restera toujours moins cher que protéger l'environnement.", "Les petites entreprises, qui n'ont pas les moyens de changer leurs machines du jour au lendemain, seraient les premières victimes. Il faut accompagner la transition, pas la rendre punitive."],
    "Faut-il rendre les transports en commun gratuits ?": ["Quand on n'a plus besoin d'acheter de billet, les déplacements deviennent aussi plus simples, notamment pour les personnes âgées et les visiteurs.", "Dans certaines villes, la gratuité a surtout attiré des piétons et des cyclistes, et non des automobilistes. L'objectif écologique n'est donc pas toujours atteint."],
    "Les écrans ont-ils leur place à l'école primaire ?": ["Les enfants timides osent aussi davantage participer quand ils répondent sur une tablette. Bien utilisé, le numérique ne remplace pas l'enseignant : il l'aide à accompagner chaque élève.", "Je constate aussi chez mes jeunes patients des troubles du sommeil et de l'attention liés aux écrans. L'école primaire devrait rester un lieu où l'on apprend autrement."],
    "L'immigration est-elle la solution à la pénurie de main-d'œuvre ?": ["Dans notre région, de nombreux hôpitaux fonctionnent déjà grâce à des infirmières venues de l'étranger. Faciliter leur arrivée est donc une priorité économique.", "Trop de nouveaux arrivants qualifiés finissent par occuper des emplois bien en dessous de leurs compétences. C'est un gaspillage, pour eux comme pour la société."],
  };
  const T3_MORE2 = {
    "Faut-il interdire les téléphones portables au collège ?": ["Nous avons d'ailleurs constaté une nette amélioration des résultats en lecture.", "Nos enfants vivent dans un monde numérique : autant les y préparer."],
    "Le télétravail est-il bénéfique pour les salariés ?": ["Pour moi, il n'y a plus de retour en arrière possible.", "J'ai finalement demandé à retourner au bureau quatre jours par semaine."],
    "Les grandes villes devraient-elles limiter la voiture individuelle ?": ["Plusieurs villes l'ont déjà prouvé.", "Sinon, ce sont toujours les mêmes qui paieront."],
    "La technologie renforce-t-elle ou affaiblit-elle les liens sociaux ?": ["À mon âge, apprendre à utiliser une tablette a changé ma vie : mes enfants m'envoient des photos tous les jours et je me sens moins loin d'eux.", "Les relations humaines demandent du temps, de la présence et de l'attention, trois choses que les écrans nous volent peu à peu."],
    "Faut-il taxer davantage les entreprises qui polluent ?": ["Les recettes pourraient aussi aider les ménages modestes à payer la hausse des prix de l'énergie. Chaque année d'attente coûte plus cher à tout le monde.", "Des aides à l'innovation seraient bien plus efficaces."],
    "Faut-il rendre les transports en commun gratuits ?": ["Enfin, moins de voitures en ville, c'est un air plus propre pour tout le monde.", "Mieux vaudrait des tarifs réduits pour les étudiants, les chômeurs et les retraités, plutôt qu'une gratuité pour tous."],
    "Les écrans ont-ils leur place à l'école primaire ?": ["Dans ma classe, les élèves qui avaient des difficultés en lecture ont beaucoup progressé grâce aux exercices adaptés.", "Les parents, eux, réclament souvent moins d'écrans, pas davantage."],
    "L'immigration est-elle la solution à la pénurie de main-d'œuvre ?": ["Chaque poste qui reste vacant, c'est un service en moins pour la population.", "Il faut penser l'accueil sur le long terme."],
  };
  WRITING.t3.prompts.forEach((p) => { [T3_MORE, T3_MORE2].forEach((m) => { const add = m[p.q]; if (add) p.docs.forEach((d, i) => { d.text += " " + add[i]; }); }); });

  /* Comprehension: the official practice partners. */
  COMP.resources = [
    { name: "TV5MONDE · S'entraîner au TCF", url: "https://apprendre.tv5monde.com/fr/tcf", what: "The official preparation partner: 560 questions in listening, language structure and reading, written by the test's own designers and validated by France Éducation International. Real audio and video.", skills: ["co", "ce"] },
    { name: "RFI · Diplômes et tests", url: "https://francaisfacile.rfi.fr/fr/dipl%C3%B4mes-tests/", what: "TCF listening series from A2 to C1, made with France Éducation International, in exam conditions.", skills: ["co"] },
    { name: "Podcast « S'entraîner au TCF avec TV5MONDE »", url: "https://podcasts.apple.com/us/podcast/sentrainer-au-tcf-avec-tv5monde/id1653438395", what: "TCF listening practice episodes you can play on your phone.", skills: ["co"] },
    { name: "France Éducation International · TCF Canada", url: "https://www.france-education-international.fr/test/tcf-canada", what: "The test's publisher: format, rules, example questions and sample writing and speaking subjects.", skills: ["co", "ce"] },
    { name: "Radio-Canada OHdio", url: "https://ici.radio-canada.ca/ohdio", what: "Canadian French at natural speed. The TCF Canada includes some Canadian accents.", skills: ["co"] },
    { name: "RFI Français facile", url: "https://francaisfacile.rfi.fr/fr/", what: "Journal en français facile: ten minutes of news read slowly, with transcripts.", skills: ["co", "ce"] },
  ];

  /* Easy French for every day: the plan's last block, outside study time (#comp.free.co and #comp.free.ce).
     Material you can follow without pausing, with about 95% of the words known for listening and 98% for
     reading, is what builds speed and vocabulary, so these start easy. */
  COMP.free = {
    co: [
      { name: "RFI · Journal en français facile", url: "https://francaisfacile.rfi.fr/fr/podcasts/journal-en-fran%C3%A7ais-facile/", what: "Ten minutes of world news a day, read slowly, with the transcript." },
      { name: "InnerFrench", url: "https://innerfrench.com/podcast/", what: "A podcast in clear French for intermediate learners: psychology, history, culture. Start with the early episodes; the transcripts are on the site." },
      { name: "TV5MONDE Apprendre", url: "https://apprendre.tv5monde.com/fr", what: "Short videos sorted by level, up to B2." },
      { name: "Radio-Canada OHdio", url: "https://ici.radio-canada.ca/ohdio", what: "Canadian radio and podcasts at natural speed. Harder, so pick topics you know well; a few times a week, for the accent." },
    ],
    ce: [
      { name: "RFI · Journal en français facile", url: "https://francaisfacile.rfi.fr/fr/podcasts/journal-en-fran%C3%A7ais-facile/", what: "Read the transcript of today's news, then listen to it." },
      { name: "Lectures CLE en français facile", url: "https://www.cle-international.com/", what: "Graded readers from A1 to B2: novels and classics rewritten for learners, as e-books too. Start at B1." },
      { name: "Vikidia", url: "https://fr.vikidia.org/", what: "A French encyclopedia written simply: easy articles on whatever you're curious about." },
      { name: "ICI Radio-Canada Info", url: "https://ici.radio-canada.ca/info", what: "Canadian news at natural level: B2 reading, best on stories you already know." },
    ],
  };

  /* L'expression du jour (brand kit): a new saying every morning on a scrap of notebook paper, on Aujourd'hui.
     [French, English: the literal meaning, then what it means]. A few are from Québec, and say so. */
  const EXPRESSIONS = [
    ["C'est en forgeant qu'on devient forgeron.", "Literally “it's by forging that you become a blacksmith”: practice makes perfect."],
    ["Petit à petit, l'oiseau fait son nid.", "Literally “little by little, the bird builds its nest”: slow, steady work gets there."],
    ["Qui ne tente rien n'a rien.", "Literally “who tries nothing has nothing”: nothing ventured, nothing gained."],
    ["Il ne faut pas mettre la charrue avant les bœufs.", "Literally “don't put the plough before the oxen”: don't put the cart before the horse."],
    ["Vouloir, c'est pouvoir.", "Literally “to want is to be able”: where there's a will, there's a way."],
    ["Les petits ruisseaux font les grandes rivières.", "Literally “little streams make great rivers”: small efforts add up."],
    ["Paris ne s'est pas fait en un jour.", "Literally “Paris wasn't built in a day”: the French take on “Rome wasn't built in a day”."],
    ["Mieux vaut tard que jamais.", "Literally “better late than never”, word for word."],
    ["Avoir le cœur sur la main.", "Literally “to have your heart on your hand”: to be very generous."],
    ["Poser un lapin à quelqu'un.", "Literally “to put a rabbit on someone”: to stand someone up."],
    ["Avoir un chat dans la gorge.", "Literally “to have a cat in your throat”: to have a frog in your throat."],
    ["Coûter les yeux de la tête.", "Literally “to cost the eyes of your head”: to cost an arm and a leg."],
    ["Tomber dans les pommes.", "Literally “to fall into the apples”: to faint."],
    ["Mettre les bouchées doubles.", "Literally “to take double mouthfuls”: to work twice as hard to catch up."],
    ["Il pleut des cordes.", "Literally “it's raining ropes”: it's pouring."],
    ["Être dans la lune.", "Literally “to be in the moon”: to be daydreaming."],
    ["Avoir du pain sur la planche.", "Literally “to have bread on the board”: to have a lot of work ahead."],
    ["Donner sa langue au chat.", "Literally “to give your tongue to the cat”: to give up guessing."],
    ["Chercher la petite bête.", "Literally “to look for the little beast”: to nitpick."],
    ["Avoir le cafard.", "Literally “to have the cockroach”: to feel down."],
    ["Appeler un chat un chat.", "Literally “to call a cat a cat”: to call a spade a spade."],
    ["Faire d'une pierre deux coups.", "Literally “to make two hits with one stone”: to kill two birds with one stone."],
    ["Ce n'est pas la mer à boire.", "Literally “it's not the sea to drink”: it's not that hard."],
    ["Remettre les pendules à l'heure.", "Literally “to set the clocks to the right time”: to set the record straight."],
    ["Avoir plus d'une corde à son arc.", "Literally “to have more than one string to your bow”: to have more than one skill or option."],
    ["Qui vivra verra.", "Literally “who lives will see”: time will tell."],
    ["L'habit ne fait pas le moine.", "Literally “the habit doesn't make the monk”: don't judge a book by its cover."],
    ["Il faut battre le fer pendant qu'il est chaud.", "Literally “strike the iron while it's hot”: seize the moment."],
    ["Après la pluie, le beau temps.", "Literally “after the rain, fine weather”: good times follow hard ones."],
    ["Chaque chose en son temps.", "Literally “each thing in its time”: one thing at a time."],
    ["Il n'y a pas de fumée sans feu.", "Literally “there's no smoke without fire”: rumours usually hold some truth."],
    ["Tourner autour du pot.", "Literally “to turn around the pot”: to beat around the bush."],
    ["Mettre la main à la pâte.", "Literally “to put your hand in the dough”: to pitch in and help."],
    ["Être comme un poisson dans l'eau.", "Literally “to be like a fish in water”: to be completely at ease."],
    ["Voir la vie en rose.", "Literally “to see life in pink”: to look on the bright side."],
    ["Avoir la main verte.", "Literally “to have the green hand”: to have a green thumb."],
    ["Les doigts dans le nez.", "Literally “fingers in the nose”: easily, hands down (informal)."],
    ["Il fait un froid de canard.", "Literally “it's duck cold”: it's freezing."],
    ["Lâche pas la patate !", "Québec. Literally “don't let go of the potato!”: hang in there, don't give up."],
    ["C'est de valeur.", "Québec. Literally “it's of value”: what a pity, that's too bad."],
    ["Tomber en amour.", "Québec. “To fall in love”, where France says tomber amoureux."],
    ["Avoir de la misère à comprendre.", "Québec. Literally “to have misery understanding”: to have a hard time understanding."],
  ];

  return { SKILLS, PHASES, PLAN, CATEGORIES, KNOWN_ERRORS, TOPICS, LOW_PRIORITY, VOCAB, WRITING, COMP, NCLC, EXAM, AUTOFAIL, CRITERIA, TCF_CANADA, EXPRESSIONS };
})();
