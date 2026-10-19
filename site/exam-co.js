/* The built-in CO practice exams (Examens blancs 1–4), modelled on the real TCF Canada listening test: 39 items in 35
   minutes, from A1 to C2, each recording heard once. The kinds of item follow the official samples in the
   Manuel du candidat (France Éducation International, 2022):
   - items 1–4 (A1), a picture: you see a drawing and hear four statements, A to D; one matches the picture;
   - items 5–7 (A2), a question and reply: you hear a question, then four replies, A to D; one fits it;
   - items 8–39, a document: you hear a dialogue, an announcement, a radio piece or a talk, then the question,
     and you read four options.
   Nothing is written for the first two kinds, so their options keep the order they're read in and their right
   answer moves between A and D. The document items list the right option first; the app shuffles them.
   Every item is original writing. As in the listening sets, the recording also says what the wrong options say,
   in a role that doesn't answer the question, and the right option rewords what was said.
   Each item plays audio/<exam id>/NN.mp4, made by tools/make_audio.py from its cast, as for the sets: a scene
   note and, for each speaker, a Gemini voice, a Microsoft voice and a delivery note. Q is the narrator who reads
   the question at the end of a document, the same in every exam. A few B2–C2 items have Québec voices, as on the
   real test. No topic repeats one from another exam or the listening sets.
   Give an exam a new id whenever its questions change, so old answers aren't shown against new questions.
   After editing, run: node tools/check_co.js and python3 tools/make_audio.py --vertex <item ids> (or let the
   nightly --gemini run record them) */
(function () {
  "use strict";
  const T = window.TCF;
  const v = (gemini, ms, style) => ({ gemini, ms, style });
  const L = "ABCD";
  // The narrator who reads every question.
  const Q = v("fr-fr-tutor-5", "vivienne", "The exam's narrator: neutral, clear and steady, reading the question once.");
  // A picture: the drawing, then the four statements in the order they're read; `answer` is the one that matches.
  const pic = (art, alt, statements, answer, why, cast) => ({
    level: "A1", kind: "pic", pic: art, alt,
    lines: statements.map((t, k) => ({ speaker: "N", text: `${L[k]}. ${t}` })),
    options: statements, answer, why, cast,
  });
  // A question with four spoken replies, read in order; `answer` is the one that fits.
  const reply = (question, replies, answer, why, cast) => ({
    level: "A2", kind: "reply", q: question,
    lines: [{ speaker: "A", text: question }].concat(replies.map((t, k) => ({ speaker: "B", text: `${L[k]}. ${t}` }))),
    options: replies, answer, why, cast,
  });
  // A document, then the narrator's question; the right option is listed first.
  const doc = (level, type, situation, lines, q, options, why, cast) => ({
    level, kind: "doc", type, situation,
    lines: lines.map(([speaker, text]) => ({ speaker, text })).concat([{ speaker: "Q", text: q }]),
    q, options, answer: 0, why, cast: Object.assign({}, cast, { Q }),
  });

  /* The drawings: line art on a 320 × 200 grid in the page's ink, with one red-pen detail (.pen). The app
     draws them in an <svg viewBox="0 0 320 200"> with the strokes set, so they follow light and dark mode. */
  const DOT = 'fill="currentColor" stroke="none"';
  const ART = {
    busStop: `<path d="M14 182H306"/><path d="M236 182V60"/><rect x="212" y="30" width="48" height="30" rx="5"/>`
      + `<text x="236" y="51" text-anchor="middle" font-size="15" font-weight="700" font-family="sans-serif" ${DOT}>BUS</text>`
      + `<circle cx="122" cy="92" r="11"/><path d="M116 104L104 152H140L128 104Z"/><path d="M114 152V180M130 152V180"/>`
      + `<path d="M127 112L146 118M117 112L104 130"/><path d="M146 46V124q0 6-6 6"/>`
      + `<path class="pen" d="M96 72Q146 18 196 72Q183 62 171 72Q158 62 146 72Q134 62 121 72Q108 62 96 72Z"/>`
      + `<path stroke-width="2" d="M32 40l-6 12M58 66l-6 12M26 98l-6 12M66 108l-6 12M40 140l-6 12M80 34l-6 12M272 76l-6 12M298 40l-6 12M290 112l-6 12M264 142l-6 12M214 98l-6 12M300 150l-6 12"/>`,
    cooking: `<path d="M14 182H306"/><rect x="168" y="112" width="120" height="70" rx="4"/><rect x="180" y="134" width="96" height="40" rx="3"/>`
      + `<path d="M196 142H260"/><circle cx="186" cy="122" r="3"/><circle cx="200" cy="122" r="3"/><circle cx="256" cy="122" r="3"/><circle cx="270" cy="122" r="3"/>`
      + `<path d="M190 86H262M190 92h-8M262 92h8"/><path d="M196 86V108q0 4 4 4H252q4 0 4-4V86"/>`
      + `<path class="pen" d="M212 76q-6-8 0-16t0-16M228 76q-6-8 0-16t0-16M244 76q-6-8 0-16t0-16"/>`
      + `<circle cx="120" cy="66" r="12"/><path d="M120 78V136"/><path d="M112 96H128L132 132H108Z"/>`
      + `<path d="M120 90L170 70M120 90L104 118"/><path d="M168 70L224 100"/><path d="M120 136L106 180M120 136L134 180"/>`
      + `<path d="M116 69q4 4 8 0"/>`,
    snowman: `<path d="M14 182Q100 170 160 178T306 176"/><path d="M48 178V158M48 60L26 100H40L20 132H38L16 158H80L58 132H76L56 100H70Z"/>`
      + `<circle cx="196" cy="150" r="26"/><circle cx="196" cy="106" r="19"/><circle cx="196" cy="76" r="13"/>`
      + `<circle cx="191" cy="73" r="1.8" ${DOT}/><circle cx="201" cy="73" r="1.8" ${DOT}/><circle cx="196" cy="100" r="1.8" ${DOT}/><circle cx="196" cy="112" r="1.8" ${DOT}/><circle cx="196" cy="142" r="1.8" ${DOT}/>`
      + `<path class="pen" d="M196 77L211 80L196 82Z"/>`
      + `<path d="M178 102L156 88M156 88l-4-8M156 88l-8 2M214 102L236 90M236 90l4-8M236 90l8 2"/>`
      + `<circle cx="122" cy="120" r="9"/><path d="M113 118Q122 101 131 118"/><circle cx="122" cy="105" r="3"/><path d="M122 129V156M122 136L150 128M122 136L110 150M122 156L114 176M122 156L130 176"/><circle cx="155" cy="127" r="5"/>`
      + `<circle cx="268" cy="124" r="9"/><path d="M259 122Q268 105 277 122"/><circle cx="268" cy="109" r="3"/><path d="M268 133V160M268 140L254 126M268 140L282 126M268 160L260 178M268 160L276 178"/>`
      + `<path stroke-width="1.8" d="M90 36v10M85 41h10M150 26v10M145 31h10M252 36v10M247 41h10M292 74v10M287 79h10M108 72v8M104 76h8M228 18v8M224 22h8"/>`,
    birthday: `<path d="M36 150H284M60 150V184M260 150V184"/><rect x="128" y="116" width="64" height="34" rx="4"/><path d="M128 126q8 6 16 0t16 0t16 0t16 0"/>`
      + `<path d="M140 116V103M152 116V103M164 116V103M176 116V103M188 116V103"/>`
      + `<path class="pen" d="M140 99q-4-5 0-10q4 5 0 10ZM152 99q-4-5 0-10q4 5 0 10ZM164 99q-4-5 0-10q4 5 0 10ZM176 99q-4-5 0-10q4 5 0 10ZM188 99q-4-5 0-10q4 5 0 10Z"/>`
      + `<circle cx="232" cy="96" r="11"/><path d="M223 89L232 66L241 89"/><circle cx="232" cy="64" r="2.5"/><path d="M228 99q4 4 8 0"/>`
      + `<path d="M226 107L218 146H246L238 107Z"/><path d="M226 114L214 100M238 114L250 100"/>`
      + `<circle cx="84" cy="80" r="13"/><path d="M79 84q5 5 10 0"/><path d="M84 93V148M84 106L106 98M84 106L106 112"/>`
      + `<ellipse cx="278" cy="40" rx="13" ry="16"/><ellipse cx="300" cy="62" rx="11" ry="14"/><path d="M278 56q-6 20 2 40M300 76q6 16-2 30"/>`,
    // Examen blanc 2
    cart: `<path d="M14 182H306"/><rect x="228" y="34" width="78" height="148"/><path d="M228 80H306M228 126H306"/>`
      + `<rect x="236" y="56" width="12" height="24"/><rect x="252" y="62" width="12" height="18"/><rect x="268" y="50" width="14" height="30"/><rect x="286" y="60" width="12" height="20"/>`
      + `<rect x="236" y="106" width="16" height="20"/><circle cx="264" cy="118" r="8"/><rect x="278" y="100" width="12" height="26"/><rect x="293" y="108" width="9" height="18"/>`
      + `<rect x="238" y="150" width="20" height="32"/><rect x="266" y="156" width="18" height="26"/>`
      + `<circle cx="78" cy="66" r="11"/><path d="M72 78L64 130H92L84 78Z"/><path d="M70 130L62 180M86 130L94 180"/><path d="M84 90L120 102M76 92L120 110"/>`
      + `<path d="M120 100H210L198 146H134Z"/><path stroke-width="1.6" d="M142 100L146 146M164 100V146M186 100L184 146M124 116H206M128 132H202"/>`
      + `<path d="M134 146L138 164H200L198 146"/><circle cx="146" cy="174" r="8"/><circle cx="192" cy="174" r="8"/>`
      + `<path class="pen" d="M148 98L166 68M168 98L176 76"/><circle class="pen" cx="186" cy="92" r="7"/><circle class="pen" cx="199" cy="93" r="6"/>`,
    bench: `<path d="M14 182H306"/><path d="M60 182V118M60 146L46 132M60 136L72 124"/>`
      + `<path d="M38 120a20 20 0 0 1-4-38a26 26 0 0 1 46-16a22 22 0 0 1 22 34a18 18 0 0 1-16 20Z"/>`
      + `<path d="M126 146H254M130 108H168M218 108H250M130 122H168M218 122H250M136 108V146M244 108V146M134 146V182M246 146V182"/>`
      + `<circle cx="206" cy="88" r="11"/><path d="M200 100L194 142H216L210 100Z"/><path d="M216 84q8 2 8 14"/>`
      + `<path d="M201 110L188 120M208 112L190 126"/><path d="M170 120l9 4l9-4v-16l-9 4l-9-4Z"/><path d="M179 108V124"/>`
      + `<path d="M198 142H176L172 182M212 146H188L184 182"/>`
      + `<circle class="pen" cx="278" cy="40" r="12"/><path class="pen" d="M278 18v-6M278 62v6M256 40h-6M300 40h6M262 24l-4-4M294 56l4 4M294 24l4-4M262 56l-4 4"/>`,
    dog: `<path d="M14 182H306"/><circle cx="100" cy="62" r="11"/><path d="M94 74L88 126H112L106 74Z"/><path d="M94 126L84 180M106 126L116 180"/><path d="M106 84L130 100M94 84L84 110"/>`
      + `<ellipse cx="224" cy="150" rx="30" ry="12"/><path d="M248 143L255 137"/><circle cx="262" cy="129" r="11"/><path d="M256 121L250 108L265 117"/><path d="M272 131H283V138H270"/>`
      + `<circle cx="265" cy="126" r="1.8" ${DOT}/><circle cx="283" cy="133" r="2" ${DOT}/><path d="M204 157V180M216 161V180M234 161V180M246 156V180"/><path d="M195 147Q182 137 186 123"/>`
      + `<path class="pen" d="M130 100Q196 104 254 138"/>`
      + `<path stroke-width="1.6" d="M30 182l-4-8M40 182l2-9M150 182l-3-7M290 182l4-8M298 182l-2-7"/>`,
    football: `<path d="M14 182H306"/><path d="M228 182V92H306"/><path stroke-width="1.4" d="M244 92V182M260 92V182M276 92V182M292 92V182M228 110H306M228 128H306M228 146H306M228 164H306"/>`
      + `<circle cx="92" cy="86" r="10"/><path d="M88 97L84 134H102L98 97Z"/><path d="M88 134L82 180M98 134L122 156"/><path d="M88 102L72 118M98 102L112 90"/>`
      + `<circle class="pen" cx="158" cy="146" r="10"/><path class="pen" d="M153 142l5-3.5l5 3.5l-2 6h-6Z"/>`
      + `<circle cx="196" cy="90" r="10"/><path d="M192 101L188 138H206L202 101Z"/><path d="M192 138L184 180M202 138L210 180"/><path d="M192 106L178 88M202 106L216 88"/>`,
    // Examen blanc 3
    bike: `<path d="M14 182H306"/><circle cx="104" cy="156" r="24"/><circle cx="214" cy="156" r="24"/>`
      + `<path d="M104 156L152 156L140 114L104 156M140 114H196M152 156L196 114M196 114L214 156M196 114V104M188 104H204M134 112H148"/><circle cx="152" cy="156" r="5"/>`
      + `<circle cx="160" cy="64" r="11"/><path d="M166 58q8 2 7 13"/><path d="M158 75L142 110"/><path d="M156 84L194 104"/>`
      + `<path d="M142 110L168 128L160 160M142 110L150 136L144 150"/>`
      + `<path class="pen" d="M147 62q2-16 14-16q12 0 14 16Z"/><path class="pen" d="M146 62H178"/>`
      + `<path stroke-width="1.6" d="M40 128h26M30 144h30M42 160h20"/>`,
    alarm: `<path d="M14 182H306"/><path d="M30 92V182M30 130H220V150H30M38 150V182M212 150V182"/>`
      + `<rect x="38" y="112" width="44" height="18" rx="8"/><circle cx="62" cy="102" r="11"/><path d="M55 102q3 3 6 0M64 102q3 3 6 0"/>`
      + `<path d="M76 118Q140 104 218 118V130H76Z"/>`
      + `<rect x="236" y="134" width="52" height="48"/><path d="M236 154H288M256 144h12"/>`
      + `<circle cx="262" cy="110" r="16"/><path d="M262 110V100M262 110l7 4"/><circle cx="249" cy="92" r="5"/><circle cx="275" cy="92" r="5"/><path d="M252 124l-4 8M272 124l4 8"/>`
      + `<path class="pen" d="M238 98l-10-5M236 110h-12M238 122l-10 5M286 98l10-5M288 110h12M286 122l10 5"/>`,
    watering: `<path d="M14 182H306"/><circle cx="84" cy="64" r="11"/><circle cx="76" cy="56" r="5"/><path d="M78 76L68 130H100L90 76Z"/><path d="M78 130L76 180M90 130L92 180"/>`
      + `<path d="M90 86L130 98M78 86L66 110"/>`
      + `<path d="M128 94H158V122H128Z"/><path d="M130 94q14-18 26 0"/><path d="M158 106L182 90"/><path d="M180 86l7 7"/>`
      + `<path class="pen" d="M190 98l-2 7M198 100l-3 8M193 113l-2 7M203 112l-2 7M197 126l-2 6"/>`
      + `<path d="M210 182V144M236 182V134M262 182V146M286 182V138"/>`
      + `<circle cx="210" cy="138" r="6"/><circle cx="236" cy="128" r="6"/><circle cx="262" cy="140" r="6"/><circle cx="286" cy="132" r="6"/>`
      + `<path d="M210 164q-10-2-12-10M236 160q10-2 12-10M262 168q-10-2-12-10M286 162q10-2 12-10"/>`,
    handshake: `<path d="M14 182H306"/><path d="M104 134H216M114 134V182M206 134V182"/><rect x="124" y="122" width="34" height="12"/><path d="M168 134l4-10h22l4 10"/>`
      + `<circle cx="70" cy="68" r="11"/><path d="M64 80L58 132H82L76 80Z"/><path d="M64 132L60 180M76 132L80 180"/><path d="M64 90L54 116"/>`
      + `<circle cx="250" cy="68" r="11"/><path d="M240 66q10-18 21 0"/><path d="M244 80L236 132H264L256 80Z"/><path d="M244 132L240 180M256 132L260 180"/><path d="M256 90L266 116"/>`
      + `<path d="M76 90L150 104M244 90L170 104"/><path class="pen" d="M148 104q12-10 24 0q-12 10-24 0Z"/>`,
    // Examen blanc 4
    skier: `<path d="M14 178Q100 170 160 175T306 171"/><path d="M270 172V156M270 72L250 108H262L244 134H258L238 156H302L282 134H296L278 108H290Z"/>`
      + `<circle cx="148" cy="62" r="11"/><path d="M137 58q11-18 22 0Z"/><circle cx="148" cy="40" r="3"/>`
      + `<path d="M144 73L126 114"/><path d="M140 82L168 102M138 82L104 94"/><path d="M168 102L150 170M104 94L78 166"/>`
      + `<path d="M126 114L146 138L152 170M126 114L110 140L94 166"/><path d="M120 173H196M60 169H130"/>`
      + `<path class="pen" d="M141 76q-14-2-27 6l11 1q-6 4-11 10"/>`
      + `<path stroke-width="1.8" d="M40 40v8M36 44h8M200 30v8M196 34h8M226 70v8M222 74h8M60 100v8M56 104h8"/>`,
    picnic: `<path d="M14 168H170Q182 172 190 182"/><path d="M176 120q28-10 56-2t74-4"/><path d="M196 120l6-14l6 14M212 118l5-12l5 12M286 116l5-12l5 12"/>`
      + `<path stroke-width="1.6" d="M200 136h30M250 132h40M210 178h40M262 186h36M268 156h30"/>`
      + `<path d="M24 168V150M24 96L12 120H20L8 140H40L28 120H36Z"/>`
      + `<path d="M40 168L62 146H150L162 168Z"/><path stroke-width="1.4" d="M84 146L80 168M106 146L104 168M128 146L130 168M50 157H156"/>`
      + `<rect x="92" y="132" width="26" height="16" rx="3"/><path d="M96 132q9-12 18 0"/>`
      + `<circle cx="66" cy="110" r="9"/><path d="M62 119L58 146H74L70 119Z"/><path d="M70 126L84 136"/>`
      + `<circle cx="144" cy="108" r="9"/><path d="M135 106q9-15 18 0"/><path d="M140 117L136 146H152L148 117Z"/><path d="M140 124L124 136"/>`
      + `<path class="pen" d="M214 152Q254 168 298 152Q256 160 214 152Z"/><path d="M234 148L272 156"/>`,
    painter: `<path d="M14 182H306"/><path d="M212 182L224 70M248 182L236 70M216 160H244M219 138H241M221 116H239M223 94H237"/>`
      + `<circle cx="112" cy="72" r="11"/><circle cx="104" cy="62" r="5"/><path d="M106 84L98 134H126L118 84Z"/><path d="M106 134L102 180M118 134L122 180"/>`
      + `<path d="M118 92L148 70M106 92L94 116"/><path d="M148 70L154 52"/>`
      + `<rect class="pen" x="144" y="40" width="28" height="11" rx="4"/><path class="pen" stroke-width="9" d="M184 26V124"/>`
      + `<path d="M56 182l5-12h26l5 12"/>`,
    market: `<path d="M14 182H306"/><path d="M146 70H304L296 90H154Z"/><path d="M180 70l-3 20M210 70l-1 20M240 70v20M270 70l2 20"/><path d="M156 90V128M294 90V128"/>`
      + `<path d="M150 128H300M160 128V182M290 128V182"/><rect x="168" y="110" width="52" height="18"/><rect x="232" y="110" width="50" height="18"/>`
      + `<circle class="pen" cx="178" cy="104" r="6"/><circle class="pen" cx="192" cy="104" r="6"/><circle class="pen" cx="206" cy="104" r="6"/><circle class="pen" cx="185" cy="94" r="6"/><circle class="pen" cx="199" cy="94" r="6"/>`
      + `<path d="M240 110v-8h34v8"/><text x="257" y="124" text-anchor="middle" font-size="11" font-weight="700" font-family="sans-serif" ${DOT}>1,50 $</text>`
      + `<circle cx="96" cy="78" r="11"/><path d="M85 76q11-18 22 0"/><path d="M90 90L82 138H110L102 90Z"/><path d="M90 138L86 180M102 138L106 180"/>`
      + `<path d="M102 100L164 108M90 100L78 122"/><path d="M68 122h20l-2 22H70Z"/>`,
  };

  T.COMP.coExams = [{
    id: "co-exam-1",
    title: "Examen blanc 1",
    items: [
      /* ---------- A1: pictures (items 1–4) ---------- */
      pic(ART.busStop, "Une femme attend à un arrêt d'autobus, sous la pluie, avec un parapluie.",
        ["Elle prend un taxi devant la gare.", "Il fait très beau aujourd'hui.", "Elle attend l'autobus sous la pluie.", "Elle achète un parapluie au magasin."], 2,
        "The drawing shows a woman with an umbrella in the rain, next to a bus-stop sign: « Elle attend l'autobus sous la pluie ». There's no taxi or station (A), it's raining (B), and she isn't in a shop (D).",
        { scene: "The first item of a listening test: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-1", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.cooking, "Un homme en tablier prépare un plat sur la cuisinière ; la casserole fume.",
        ["Le repas est presque prêt !", "Je fais la vaisselle tout de suite.", "Tu as lu le journal ce matin ?", "On mange au restaurant ce soir ?"], 0,
        "The man in an apron is stirring a steaming pot on the stove, which fits what he'd say: « Le repas est presque prêt ! ». There's no sink or dishes (B), no newspaper (C), and he's cooking at home, not at a restaurant (D).",
        { scene: "A listening test item: four short things someone might say, read slowly and clearly.", N: v("fr-fr-tutor-6", "remy", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.snowman, "Deux enfants en tuque font un bonhomme de neige, sous les flocons.",
        ["Les enfants nagent à la piscine.", "Les enfants regardent la télévision.", "Les enfants mangent une glace au soleil.", "Les enfants font un bonhomme de neige."], 3,
        "The children in tuques are building a snowman while it snows: « Les enfants font un bonhomme de neige ». They aren't swimming (A) or indoors (B), and it's snowing, not sunny (C).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-9", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.birthday, "Une fillette avec un chapeau pointu devant un gâteau aux bougies allumées ; un adulte applaudit.",
        ["Attention, les cartons sont lourds !", "Joyeux anniversaire, ma chérie !", "Tu as la liste des courses ?", "Elle a de la fièvre depuis hier."], 1,
        "A girl in a party hat stands behind a cake with lit candles while an adult claps: « Joyeux anniversaire, ma chérie ! ». There are no moving boxes (A), no shopping (C), and the girl looks happy, not ill (D).",
        { scene: "A listening test item: four short things someone might say, read slowly and clearly.", N: v("fr-fr-podcaster-2", "remy", "A clear, slow test voice, with a short pause after each statement.") }),

      /* ---------- A2: a question and four replies (items 5–7) ---------- */
      reply("Excusez-moi, à quelle heure ferme la piscine le dimanche ?",
        ["Elle est juste à côté de l'école.", "À dix-huit heures, je crois.", "Le dimanche, c'est gratuit.", "Oui, elle est fermée l'hiver."], 1,
        "The question asks what time (« à quelle heure ») the pool closes: « À dix-huit heures, je crois ». A says where it is, C reuses « dimanche » to talk about the price, and D reuses « ferme » with a yes.",
        { scene: "A short exchange in the street: someone asks a question and four possible replies follow.", A: v("fr-fr-advisor-2", "remy", "A passer-by asking politely."), B: v("fr-fr-csagent-3", "vivienne", "Four short replies read one by one, with a pause after each.") }),
      reply("Tu viens avec qui à la fête de Julie ?",
        ["En métro, c'est plus simple.", "Samedi soir, vers vingt heures.", "Chez elle, à Longueuil.", "Avec ma cousine et son copain."], 3,
        "The question asks who with (« avec qui »): « Avec ma cousine et son copain ». A answers how, B when, and C where.",
        { scene: "Two friends chatting: a question, then four possible replies.", A: v("fr-fr-podcaster-5", "vivienne", "A friend asking casually."), B: v("fr-fr-podcaster-8", "remy", "Four short replies read one by one, with a pause after each.") }),
      reply("Pardon, monsieur, combien coûte le billet pour Québec ?",
        ["Quarante-deux dollars, aller simple.", "Le train part du quai numéro trois.", "Il y a un billet pour vous.", "Québec, c'est à trois heures d'ici."], 0,
        "The question asks the price (« combien coûte ») of the ticket: « Quarante-deux dollars, aller simple ». B gives the platform, C reuses « billet », and D reuses « Québec » to give the travel time.",
        { scene: "At a station ticket counter: a traveller asks a question, then four possible replies.", A: v("fr-fr-advisor-12", "vivienne", "A traveller asking politely."), B: v("fr-fr-concierge-4", "remy", "A ticket clerk; four short replies read one by one, with a pause after each.") }),

      /* ---------- A2: short documents (items 8–10) ---------- */
      doc("A2", "Message sur répondeur", "Un libraire laisse un message à une cliente.", [
        ["A", "Bonjour madame Côté, ici Kevin, de la librairie Le Signet. Le livre que vous avez commandé est arrivé. Nous le gardons pour vous jusqu'à samedi. Attention, nous sommes fermés lundi. Bonne journée !"],
      ], "Que dit Kevin à madame Côté ?",
        ["Elle peut venir chercher son livre.", "Son livre n'arrivera que samedi prochain.", "La librairie restera fermée jusqu'à lundi.", "Elle doit commander un autre exemplaire."],
        "« Le livre que vous avez commandé est arrivé. Nous le gardons pour vous » means she can come and get it. Saturday is how long they'll keep it, not when it arrives; the shop is closed on Monday only; and the order was already made.",
        { scene: "A voicemail from a small bookshop; friendly and practical.", A: v("fr-fr-tutor-7", "remy", "A young bookseller, friendly and clear.") }),
      doc("A2", "Annonce", "Vous entendez une annonce à l'aréna.", [
        ["A", "Votre attention, s'il vous plaît. À cause de la pluie et du redoux, la patinoire extérieure est fermée cet après-midi. La patinoire intérieure reste ouverte jusqu'à vingt et une heures, et le prêt de patins est gratuit aujourd'hui. Merci de votre compréhension."],
      ], "Que propose-t-on aux patineurs ?",
        ["De patiner dans l'aréna.", "De revenir quand il fera froid.", "D'acheter des patins sur place.", "De patiner dehors jusqu'à 21 h."],
        "« La patinoire intérieure reste ouverte » invites skaters to skate indoors. Nobody asks them to come back later; the skates are lent for free, not sold; and 9 p.m. is when the indoor rink closes, while the outdoor one is shut.",
        { scene: "A public announcement over the loudspeakers of a Québec ice arena.", A: v("fr-fr-advisor-9", "vivienne", "An arena announcer, calm and clear.") }),
      doc("A2", "Dialogue", "Deux amis parlent de leur soirée.", [
        ["A", "On va au cinéma ce soir ? Il y a le film de dix-neuf heures."],
        ["B", "Dix-neuf heures, c'est trop tôt pour moi : je finis le travail à dix-huit heures trente. Prenons plutôt la séance de vingt et une heures."],
        ["A", "D'accord, je réserve les billets."],
      ], "À quelle heure vont-ils voir le film ?",
        ["À 21 h", "À 19 h", "À 18 h 30", "À 20 h"],
        "« Prenons plutôt la séance de vingt et une heures. — D'accord. » 7 p.m. was the first idea, 6:30 p.m. is when work ends, and 8 p.m. is never mentioned.",
        { scene: "Two friends making plans for the evening; relaxed.", A: v("fr-fr-podcaster-11", "vivienne", "A friend in her twenties, enthusiastic."), B: v("fr-fr-podcaster-4", "remy", "A friend in his twenties, a little tired after work.") }),

      /* ---------- B1 (items 11–19) ---------- */
      doc("B1", "Dialogue", "Deux collègues parlent dans un bureau.", [
        ["A", "Dis donc, Marc, pour le covoiturage, ça tient toujours la semaine prochaine ?"],
        ["B", "Oui, mais j'ai un petit changement. Je ne pourrai pas conduire lundi et mardi : ma voiture est au garage."],
        ["A", "Pas de problème. Je prendrai la mienne ces deux jours-là, et toi, tu conduis le reste de la semaine."],
        ["B", "Parfait. Et je te paie l'essence, c'est la moindre des choses."],
      ], "Qu'est-ce que les deux collègues décident ?",
        ["Elle conduira au début de la semaine.", "Marc conduira tous les jours de la semaine.", "Ils arrêtent de faire du covoiturage.", "Ils partageront le prix du garage."],
        "« Je prendrai la mienne ces deux jours-là » (Monday and Tuesday) means she drives at the start of the week. Marc can't drive those two days; the carpool goes on (« ça tient toujours »); and he offers to pay for petrol, not the garage.",
        { scene: "Two colleagues chatting at the office; friendly.", A: v("fr-fr-tutor-4", "vivienne", "A colleague in her forties, practical and cheerful."), B: v("fr-fr-advisor-4", "remy", "Marc, a colleague in his thirties, relaxed.") }),
      doc("B1", "Message sur répondeur", "Vous entendez un message laissé par une école.", [
        ["A", "Bonjour, ici Josée Lavoie, du secrétariat de l'école Saint-Laurent. Je vous rappelle que vendredi est une journée pédagogique : il n'y aura pas de classe. Le service de garde sera ouvert, mais seulement pour les enfants inscrits avant mercredi midi. Vous pouvez inscrire votre enfant sur le portail des parents ou en répondant à ce message. Merci et bonne journée !"],
      ], "Que doivent faire les parents qui ont besoin du service de garde vendredi ?",
        ["Réserver une place d'ici mercredi.", "Venir chercher leur enfant à midi.", "Appeler l'école le vendredi matin.", "Envoyer leur enfant en classe."],
        "« seulement pour les enfants inscrits avant mercredi midi » means booking a place by Wednesday. Midday is the deadline, not a pick-up time; the call comes from the school, which asks for a reply, not a call on Friday; and there's no class on Friday.",
        { scene: "A school secretary's voicemail to parents in Québec; polite and efficient.", A: v("fr-fr-concierge-6", "vivienne", "A school secretary in her fifties, friendly and efficient.") }),
      doc("B1", "Information routière", "Vous écoutez des informations sur la circulation à la radio.", [
        ["A", "Mauvaise nouvelle pour les automobilistes qui traversent le pont Jacques-Cartier : en raison de travaux, deux voies sur trois seront fermées ce week-end, de vendredi vingt heures à lundi cinq heures du matin. On prévoit jusqu'à une heure d'attente aux heures de pointe. Si vous le pouvez, laissez votre voiture à la maison : les trains de banlieue seront plus fréquents, et le métro restera ouvert plus tard samedi soir."],
      ], "Que conseille-t-on aux automobilistes ?",
        ["De prendre plutôt le train ou le métro.", "De traverser le pont lundi matin.", "De partir plus tôt le vendredi soir.", "D'éviter le métro le samedi soir."],
        "« laissez votre voiture à la maison : les trains de banlieue seront plus fréquents, et le métro restera ouvert plus tard ». Monday 5 a.m. is when the closure ends, Friday 8 p.m. when it starts, and the metro stays open later on Saturday.",
        { scene: "A traffic bulletin on a Montréal radio station; brisk and clear.", A: v("fr-fr-podcaster-12", "remy", "A radio traffic reporter, quick but clear.") }),
      doc("B1", "Dialogue", "Une femme parle avec son voisin dans l'escalier de leur immeuble.", [
        ["A", "Bonjour, monsieur Gagnon. Excusez-moi, mais les travaux chez vous commencent à sept heures du matin, et moi, je travaille de nuit…"],
        ["B", "Ah, je suis désolé, je ne savais pas. Écoutez, les ouvriers peuvent arriver plus tard, vers dix heures, et faire les travaux les plus bruyants l'après-midi. Ça vous irait ?"],
        ["A", "Ce serait parfait. Merci beaucoup, c'est gentil."],
      ], "Que propose l'homme ?",
        ["De décaler les travaux plus tard dans la journée.", "D'arrêter complètement les travaux pendant une semaine.", "De faire les travaux pendant la nuit.", "De commencer les travaux à sept heures."],
        "« les ouvriers peuvent arriver plus tard, vers dix heures, et faire les travaux les plus bruyants l'après-midi ». The work doesn't stop; night is when she works, not when the builders will; and seven o'clock is the problem she complains about.",
        { scene: "Two neighbours on the stairs of an apartment building; polite.", A: v("fr-fr-advisor-7", "vivienne", "A woman in her thirties, tired but polite."), B: v("fr-fr-training-4", "remy", "Monsieur Gagnon, a neighbour in his fifties, apologetic and kind.") }),
      doc("B1", "Météo", "Vous écoutez la météo à la radio.", [
        ["A", "Environnement Canada a émis un avertissement de tempête hivernale pour la région de Québec. On attend entre trente et quarante centimètres de neige d'ici demain soir, avec des vents forts. Les écoles resteront ouvertes demain matin, mais les activités parascolaires sont annulées. La Ville demande aux résidents de déplacer leur voiture de la rue pour faciliter le déneigement."],
      ], "Que demande la Ville aux habitants ?",
        ["De garer leur véhicule ailleurs.", "De garder leurs enfants à la maison.", "De déneiger eux-mêmes devant chez eux.", "De rester chez eux jusqu'au soir."],
        "« La Ville demande aux résidents de déplacer leur voiture de la rue » means parking somewhere else. The schools stay open; the city clears the snow itself; and « demain soir » is when the snow should stop.",
        { scene: "A weather bulletin on a Québec radio station; serious but calm.", A: v("fr-fr-podcaster-5", "vivienne", "A radio weather presenter, clear and calm.") }),
      doc("B1", "Dialogue", "Une cliente parle avec un vendeur dans un magasin de vêtements.", [
        ["A", "Bonjour, j'aimerais retourner ce manteau : il est trop petit."],
        ["B", "Je vois. Malheureusement, nous ne remboursons pas les articles en solde. Je peux vous l'échanger contre une taille au-dessus, ou vous faire une carte-cadeau du même montant."],
        ["A", "Vous l'avez dans la taille au-dessus ?"],
        ["B", "Désolé, il ne reste que des petites tailles."],
        ["A", "Bon. Alors je vais prendre la carte-cadeau."],
      ], "Qu'est-ce que la cliente va obtenir ?",
        ["Un bon d'achat du prix du manteau.", "Le remboursement de son manteau.", "Le même manteau en plus grand.", "Une réduction sur un autre manteau."],
        "« je vais prendre la carte-cadeau » (« du même montant »): a voucher for the coat's price. Refunds aren't given on sale items, there's no bigger size left, and « en solde » describes the coat, not a new discount.",
        { scene: "A returns desk in a clothing shop; polite.", A: v("fr-fr-podcaster-9", "vivienne", "A customer in her forties, polite but a little disappointed."), B: v("fr-fr-podcaster-6", "remy", "A shop assistant in his twenties, apologetic and helpful.") }),
      doc("B1", "Entretien", "À la radio, une bénévole parle de son engagement.", [
        ["A", "Martine, vous êtes bénévole à la banque alimentaire depuis deux ans. Qu'est-ce qui vous a décidée ?"],
        ["B", "Au départ, je voulais juste occuper mes samedis, après ma retraite. Mais j'ai vite compris que j'y trouvais autre chose : des rencontres. Je ne connaissais presque personne dans le quartier, et maintenant, on me salue partout !"],
      ], "Qu'est-ce que le bénévolat a apporté à Martine ?",
        ["Des liens avec les gens du coin.", "Un emploi pour sa retraite.", "Des samedis plus calmes qu'avant.", "Des repas gratuits chaque semaine."],
        "« j'y trouvais autre chose : des rencontres… maintenant, on me salue partout » means ties with local people. Retirement is when she started, filling her Saturdays was only the first idea, and the food bank gives out food; she doesn't get meals from it.",
        { scene: "A short interview on a community radio station; warm.", A: v("fr-fr-podcaster-8", "remy", "A radio host, friendly."), B: v("fr-fr-tutor-4", "vivienne", "Martine, a retired woman in her sixties, cheerful.") }),
      doc("B1", "Dialogue", "Deux amis parlent au téléphone de leur fin de semaine.", [
        ["A", "Alors, on fait toujours la randonnée au mont Sainte-Anne samedi ?"],
        ["B", "J'ai regardé la météo : il va pleuvoir toute la journée. Les sentiers vont être pleins de boue."],
        ["A", "Bon… Et si on allait à la cabane à sucre ? C'est la saison, et on serait au chaud."],
        ["B", "Bonne idée ! On remet la randonnée au mois prochain."],
      ], "Qu'est-ce que les amis vont faire samedi ?",
        ["Une sortie gourmande à l'abri de la pluie.", "Une randonnée malgré la pluie et la boue.", "La randonnée prévue au mont Sainte-Anne.", "Une journée de ski au mont Sainte-Anne."],
        "« Et si on allait à la cabane à sucre ? … on serait au chaud. — Bonne idée ! »: a sugar-shack meal, indoors. The hike is postponed to next month, so it isn't on Saturday, rain or not, and skiing is never mentioned.",
        { scene: "Two friends on the phone planning their weekend in Québec; relaxed.", A: v("fr-fr-advisor-2", "remy", "A friend in his thirties, keen on the outdoors."), B: v("fr-fr-advisor-12", "vivienne", "A friend in her thirties, practical.") }),
      doc("B1", "Bulletin d'information", "Vous écoutez les nouvelles à la radio.", [
        ["A", "Bonne nouvelle pour les cyclistes de Montréal : cette année, le service de vélos en libre-service ne fermera pas en novembre. Une partie des stations restera ouverte tout l'hiver, surtout près des stations de métro, et les vélos seront équipés de pneus d'hiver. En revanche, le prix de l'abonnement mensuel augmentera de cinq dollars."],
      ], "Qu'est-ce qui change cette année ?",
        ["On pourra louer des vélos en hiver.", "Toutes les stations fermeront en novembre.", "L'abonnement coûtera cinq dollars par mois.", "Les vélos seront interdits près du métro."],
        "« le service… ne fermera pas en novembre. Une partie des stations restera ouverte tout l'hiver ». November is when it used to close, five dollars is the price increase, not the price, and the winter stations are near the metro.",
        { scene: "A news brief on a Montréal radio station; upbeat.", A: v("fr-fr-podcaster-2", "remy", "A radio newsreader, clear and lively.") }),

      /* ---------- B2 (items 20–29) ---------- */
      doc("B2", "Reportage", "Vous écoutez un reportage à la radio.", [
        ["A", "Dans le quartier Rosemont, les ruelles grises ont presque disparu. En dix ans, plus de quatre-vingts ruelles ont été transformées en ruelles vertes : on y a retiré l'asphalte, planté des arbres et installé des bacs à fleurs. L'objectif affiché est de lutter contre la chaleur. Mais pour beaucoup d'habitants, l'effet le plus visible est ailleurs."],
        ["B", "Avant, je ne connaissais pas mes voisins. Aujourd'hui, les enfants jouent ensemble dehors, on organise des repas l'été… La ruelle est devenue une sorte de place de village."],
        ["A", "Seul bémol : l'entretien repose entièrement sur des bénévoles, et certains comités s'essoufflent."],
      ], "Selon cet habitant, qu'ont changé les ruelles vertes ?",
        ["Elles ont rapproché les gens du voisinage.", "Elles ont fait baisser la chaleur en été.", "Elles ont attiré de nouveaux habitants.", "Elles donnent trop de travail aux voisins."],
        "« Avant, je ne connaissais pas mes voisins… La ruelle est devenue une sorte de place de village. » Fighting the heat is the official aim, not what he describes; nobody mentions newcomers; and the upkeep problem is the reporter's caveat, not his view.",
        { scene: "A radio report from a Montréal neighbourhood, with a resident's comment.", A: v("fr-fr-podcaster-1", "vivienne", "A radio reporter, lively and clear."), B: v("fr-fr-tutor-7", "remy", "A resident in his forties, enthusiastic.") }),
      doc("B2", "Entretien", "Un journaliste interroge une agricultrice urbaine.", [
        ["A", "Les fermes sur les toits se multiplient. Est-ce que l'agriculture urbaine pourra un jour nourrir les villes ?"],
        ["B", "Soyons honnêtes : non. Même si on couvrait tous les toits de Montréal, on ne produirait qu'une petite partie des légumes qu'on y mange. Mais ce n'est pas notre but. Une ferme urbaine, c'est d'abord un lieu où les citadins revoient comment pousse ce qu'ils mangent. Les écoles nous rendent visite, les gens viennent cueillir eux-mêmes… On ne remplace pas les agriculteurs des campagnes : on rappelle aux gens qu'ils existent."],
      ], "Quel rôle l'agricultrice donne-t-elle aux fermes urbaines ?",
        ["Faire connaître aux citadins l'origine de leurs aliments.", "Nourrir un jour toute la population des villes.", "Remplacer peu à peu les fermes des campagnes.", "Offrir des emplois aux élèves des écoles."],
        "« un lieu où les citadins revoient comment pousse ce qu'ils mangent… on rappelle aux gens qu'ils existent ». She says they'll never feed the city (« Soyons honnêtes : non »), that they don't replace country farms, and schools come to visit, not to work.",
        { scene: "A radio interview on a Montréal rooftop farm; frank and warm.", A: v("fr-fr-advisor-4", "remy", "A radio journalist, curious."), B: v("fr-fr-advisor-9", "vivienne", "An urban farmer in her thirties, frank and passionate.") }),
      doc("B2", "Témoignage", "À la radio, un homme raconte son retour aux études.", [
        ["A", "À soixante-six ans, je me suis inscrit à l'université, en histoire. Mes amis pensaient que je voulais un diplôme pour le plaisir de l'encadrer. En réalité, le diplôme, je n'en ai rien à faire ! Ce qui m'a frappé, c'est autre chose : les jeunes de ma classe me demandent conseil. Pas sur l'histoire, sur la vie : un premier emploi, un déménagement, une rupture… Moi qui croyais que j'allais être le vieux qu'on évite, au fond de la salle !"],
      ], "Qu'est-ce qui a surpris cet homme ?",
        ["Les autres étudiants recherchent son expérience.", "Ses amis l'ont encouragé à reprendre ses études.", "Le diplôme compte finalement beaucoup pour lui.", "Les jeunes de sa classe préfèrent l'éviter."],
        "« Ce qui m'a frappé… les jeunes de ma classe me demandent conseil… sur la vie ». His friends only guessed at his reasons, he says he doesn't care about the degree, and being avoided is what he expected, not what happened.",
        { scene: "A listener's testimony on a radio programme about learning later in life.", A: v("fr-fr-advisor-2", "remy", "A retired man of sixty-six, amused and warm.") }),
      doc("B2", "Entretien", "Un animateur discute avec une directrice de musée.", [
        ["A", "Plusieurs musées sont gratuits le premier dimanche du mois. C'est une bonne façon d'attirer un nouveau public, non ?"],
        ["B", "C'est ce qu'on espérait. Mais nos chiffres montrent que ces dimanches-là, ce sont surtout nos habitués qui viennent, simplement plus nombreux. Les gens qui n'ont jamais mis les pieds dans un musée ne restent pas à l'écart pour une question de prix : ils pensent que ce n'est pas pour eux. Pour les faire venir, il faut aller les chercher, dans les écoles, dans les centres communautaires. La gratuité ne suffit pas."],
      ], "Que pense la directrice de la gratuité des musées ?",
        ["Elle ne fait guère venir de nouveaux visiteurs.", "Elle coûte beaucoup trop cher aux musées.", "Elle devrait s'appliquer à tous les dimanches.", "Elle a attiré de nombreux élèves des écoles."],
        "« ce sont surtout nos habitués qui viennent… La gratuité ne suffit pas. » She never mentions the cost, doesn't ask for more free Sundays, and schools are where she'd go to find new visitors, not who came.",
        { scene: "A radio discussion about museums; thoughtful.", A: v("fr-fr-podcaster-6", "remy", "A radio host, curious and friendly."), B: v("fr-fr-podcaster-11", "vivienne", "A museum director in her fifties, thoughtful and precise.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage à la radio.", [
        ["A", "Ils avaient presque disparu ; ils reviennent en force. Depuis quelques années, les trains de nuit relient de nouveau Paris, Vienne ou Berlin. Leur prix n'est pas leur principal atout : un billet coûte souvent plus cher qu'un vol à bas prix. Mais les voyageurs y trouvent ce que l'avion ne leur donne plus."],
        ["B", "On part le soir, on dort, et on arrive au centre-ville le matin, sans passer des heures à l'aéroport. Et puis, je culpabilise moins : en avion, je pensais toujours à la pollution."],
      ], "Pourquoi cette voyageuse préfère-t-elle le train de nuit ?",
        ["Il est plus pratique et pollue moins.", "Il coûte moins cher que l'avion.", "Il dessert des aéroports plus proches.", "Il permet de visiter plusieurs villes."],
        "« on arrive au centre-ville le matin, sans passer des heures à l'aéroport… je culpabilise moins… la pollution ». The ticket often costs more than a cheap flight, the train avoids airports altogether, and the cities are the routes, not a tour.",
        { scene: "A radio report on night trains in Europe, with a traveller's comment.", A: v("fr-fr-podcaster-4", "remy", "A radio reporter, lively."), B: v("fr-fr-csagent-3", "vivienne", "A traveller in her thirties, enthusiastic.") }),
      doc("B2", "Entretien", "Un journaliste interroge une cheffe cuisinière.", [
        ["A", "Vous avez retiré la viande de la moitié de votre menu. Vos clients ont protesté ?"],
        ["B", "Les premières semaines, un peu. Mais je n'ai jamais voulu faire la morale à qui que ce soit. Je ne dis pas aux gens d'arrêter la viande ; je leur dis d'en manger moins, mais de meilleure qualité, et élevée près d'ici. Le reste du temps, les légumineuses, ça peut être délicieux, à condition de les cuisiner avec autant de soin qu'un steak."],
      ], "Que recommande la cheffe ?",
        ["Manger moins de viande, mais mieux choisie.", "Supprimer toute la viande des menus.", "Manger des légumineuses à chaque repas.", "Cuisiner le steak avec beaucoup plus de soin."],
        "« Je ne dis pas aux gens d'arrêter la viande ; je leur dis d'en manger moins, mais de meilleure qualité ». She refuses a ban, offers pulses « le reste du temps », not at every meal, and the care she asks for is for cooking pulses.",
        { scene: "A radio interview with a chef in her restaurant; lively.", A: v("fr-fr-podcaster-12", "remy", "A food journalist, friendly."), B: v("fr-fr-podcaster-5", "vivienne", "A chef in her forties, direct and good-humoured.") }),
      doc("B2", "Témoignage", "À la radio, une entrepreneure parle de son entreprise.", [
        ["A", "J'ai lancé ma savonnerie dans mon sous-sol, en Gaspésie, il y a cinq ans. Au début, je voulais tout faire moi-même : la fabrication, la comptabilité, le site web… J'ai failli abandonner au bout d'un an, complètement épuisée. Le jour où j'ai accepté de payer quelqu'un pour la comptabilité, j'ai retrouvé du temps pour ce que je fais de mieux : inventer de nouveaux savons. Mon conseil aux jeunes entrepreneurs ? Ne croyez pas que vous devez tout savoir faire."],
      ], "Quel conseil donne cette entrepreneure ?",
        ["Confier à d'autres une partie des tâches.", "Commencer son entreprise à la maison.", "Apprendre la comptabilité avant de se lancer.", "Créer de nouveaux produits chaque année."],
        "« Le jour où j'ai accepté de payer quelqu'un pour la comptabilité… Ne croyez pas que vous devez tout savoir faire. » Her basement is where she started, not advice; she says the opposite of learning everything herself; and new soaps are what she has time for now.",
        { scene: "A small-business owner from Gaspésie talking on a Québec radio programme.", A: v("fr-fr-advisor-9", "sylvie", "A Québec entrepreneur in her forties, warm and candid.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage à la radio.", [
        ["A", "À Sherbrooke, un programme met en relation des étudiants qui cherchent un logement et des personnes âgées qui vivent seules dans une grande maison. L'étudiant paie un petit loyer et, en échange, il passe quelques soirées par semaine avec son hôte."],
        ["B", "On pense souvent que l'aide matérielle est l'essentiel : faire les courses, sortir les poubelles. Mais ce que nos aînés nous disent, c'est qu'ils ne se sentent plus seuls le soir. C'est ça, le vrai changement."],
      ], "Selon la responsable, qu'apporte surtout ce programme aux personnes âgées ?",
        ["Une compagnie qui rompt leur isolement.", "De l'aide pour toutes les tâches de la maison.", "Un revenu supplémentaire grâce au loyer.", "Un logement plus petit et mieux adapté à leur âge."],
        "« ce que nos aînés nous disent, c'est qu'ils ne se sentent plus seuls le soir. C'est ça, le vrai changement. » Help with chores is what people assume matters most; the rent is small and never presented as the benefit; and they keep their big house.",
        { scene: "A radio report on an intergenerational housing programme in Sherbrooke.", A: v("fr-fr-podcaster-8", "remy", "A radio reporter, warm."), B: v("fr-fr-concierge-6", "vivienne", "The programme's coordinator, in her fifties, caring and clear.") }),
      doc("B2", "Entretien", "Une journaliste interroge un commerçant sur un projet de la Ville.", [
        ["A", "La Ville veut transformer des places de stationnement en terrasses pour l'été. Les restaurateurs sont ravis. Et vous, vous êtes fleuriste…"],
        ["B", "Je n'ai rien contre les terrasses, au contraire, ça rend la rue vivante. Et ce n'est pas une question d'argent. Mon problème, c'est la livraison. Mes fournisseurs arrivent le matin avec des camions ; si on supprime les places devant ma boutique, ils devront se garer à deux rues d'ici. On aurait pu au moins garder une zone de livraison. Personne ne nous a consultés."],
      ], "Que reproche le commerçant au projet ?",
        ["Il oublie les besoins des livraisons.", "Il rend la rue moins vivante.", "Il favorise trop les restaurateurs.", "Il coûtera trop cher aux commerçants."],
        "« Mon problème, c'est la livraison… On aurait pu au moins garder une zone de livraison. » He says terraces make the street lively, the restaurant owners' delight is the journalist's remark, and he says it isn't about money.",
        { scene: "A street interview with a florist about a city project; frank.", A: v("fr-fr-podcaster-9", "vivienne", "A radio journalist, brisk."), B: v("fr-fr-podcaster-6", "remy", "A florist in his fifties, calm but annoyed.") }),
      doc("B2", "Entretien", "Une journaliste interroge un guide de traîneau à chiens.", [
        ["A", "Les hivers raccourcissent. Comment une entreprise de traîneau à chiens s'en sort-elle ?"],
        ["B", "Il y a vingt ans, on commençait les sorties en décembre. Maintenant, c'est souvent à la mi-janvier, et on finit plus tôt au printemps. On a perdu presque un mois de saison. Alors on s'est adaptés : l'été, on propose de la randonnée avec les chiens, et des visites du chenil pour les familles. Ça ne rapporte pas autant que l'hiver, mais ça fait vivre l'entreprise toute l'année, et les chiens restent en forme."],
      ], "Comment l'entreprise s'est-elle adaptée ?",
        ["En proposant des activités en dehors de l'hiver.", "En commençant ses sorties dès le mois de décembre.", "En réduisant peu à peu le nombre de ses chiens.", "En augmentant le prix des sorties en traîneau."],
        "« l'été, on propose de la randonnée avec les chiens, et des visites du chenil ». December is when outings began twenty years ago, the dogs are kept fit, not fewer, and prices are never mentioned (summer simply earns less).",
        { scene: "A radio interview with a dog-sled guide in the Laurentians; easy-going.", A: v("fr-fr-advisor-7", "vivienne", "A radio journalist, curious."), B: v("fr-fr-podcaster-8", "jean", "A dog-sled guide from Québec in his fifties, relaxed.") }),

      /* ---------- C1 (items 30–35) ---------- */
      doc("C1", "Conférence", "Vous écoutez un extrait de conférence.", [
        ["A", "On croit volontiers que plus on a de choix, plus on est libre, et donc plus on est heureux. Les études menées depuis une vingtaine d'années racontent une histoire plus nuancée. Face à six confitures, les clients d'un supermarché achètent plus volontiers que face à vingt-quatre. Et quand ils achètent, ceux qui ont eu le plus grand choix sont souvent les moins satisfaits : ils se demandent s'ils n'ont pas laissé passer la meilleure option. Attention, je ne plaide pas pour qu'on nous retire nos choix. Je constate simplement qu'au-delà d'un certain seuil, la multiplication des possibilités devient une charge, et que le vrai luxe, aujourd'hui, c'est peut-être qu'on choisisse pour nous ce qui ne mérite pas notre attention."],
      ], "Quelle idée le conférencier défend-il ?",
        ["Trop d'options finit par nuire à la satisfaction.", "Il faudrait limiter par la loi le nombre de produits.", "On achète davantage quand le choix est large.", "La liberté se mesure au nombre de choix possibles."],
        "« au-delà d'un certain seuil, la multiplication des possibilités devient une charge » and the widest choice leaves people least satisfied. He says he isn't asking for our choices to be taken away; the jam study shows the opposite of buying more with more choice; and freedom measured by choice is the common belief he questions.",
        { scene: "An extract from a public lecture on psychology; measured and engaging.", A: v("fr-fr-tutor-6", "remy", "A lecturer in his fifties, measured, with a touch of humour.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique à la radio.", [
        ["A", "On aime les histoires de génies solitaires : le savant qui trouve la solution seul dans son laboratoire, l'inventeur dans son garage. Ces récits ont un charme indéniable, mais ils déforment la manière dont les idées naissent réellement. L'ampoule, le vaccin, le téléphone : derrière chaque nom célèbre, il y a des dizaines de collaborateurs, des concurrents qu'on a oubliés, des essais ratés partagés par d'autres. Et le problème n'est pas seulement historique. En célébrant le héros isolé, nos entreprises et nos écoles récompensent l'individu, et négligent ce qui fait vraiment avancer les choses : la circulation des idées, le droit de se tromper ensemble."],
      ], "Que reproche la chroniqueuse au mythe du génie solitaire ?",
        ["Il masque le caractère collectif des découvertes.", "Il décourage les inventeurs de travailler seuls.", "Il exagère l'importance des laboratoires.", "Il donne une mauvaise image de l'école."],
        "« derrière chaque nom célèbre, il y a des dizaines de collaborateurs… » and schools and companies end up rewarding the individual. It's lone work that the myth glorifies, not discourages; the laboratory is just part of the cliché; and schools are criticised for what they reward, not for their image.",
        { scene: "A radio column on science and society; lively and incisive.", A: v("fr-fr-podcaster-11", "vivienne", "A columnist in her forties, lively, incisive and articulate.") }),
      doc("C1", "Débat", "Un enseignant et une chercheuse débattent des devoirs à la maison.", [
        ["A", "Je donne des devoirs, oui, parce que je crois à la répétition. Un enfant qui revoit le soir ce qu'il a appris le matin le retient mieux. Supprimer les devoirs, c'est renoncer à cet ancrage."],
        ["B", "Sur la répétition, je vous rejoins. Mais le problème, c'est l'endroit où elle a lieu. À la maison, certains enfants ont un parent disponible et une chambre calme ; d'autres n'ont ni l'un ni l'autre. Les devoirs creusent les écarts que l'école est censée réduire."],
        ["A", "Là-dessus, je ne peux pas vous donner tort. C'est d'ailleurs pour ça que j'en fais faire une partie en classe, pendant l'aide aux devoirs."],
      ], "Sur quel point l'enseignant finit-il par donner raison à la chercheuse ?",
        ["Les devoirs à la maison renforcent les inégalités.", "Il faut supprimer complètement les devoirs.", "La répétition n'aide pas vraiment à retenir.", "Les parents devraient aider davantage leurs enfants."],
        "« Les devoirs creusent les écarts… — Là-dessus, je ne peux pas vous donner tort. » Neither wants to scrap homework entirely; both agree repetition helps, so C is the opposite; and the parents' availability is the cause of the gap, not a call for them to do more.",
        { scene: "A radio debate on education; courteous and focused.", A: v("fr-fr-advisor-4", "remy", "A primary-school teacher in his forties, convinced but open."), B: v("fr-fr-advisor-12", "vivienne", "An education researcher in her fifties, precise and calm.") }),
      doc("C1", "Entretien", "Une linguiste parle à la radio.", [
        ["A", "On me demande souvent si les anglicismes menacent le français au Québec. Ma réponse surprend : pas tant qu'on le croit. Les langues ont toujours emprunté des mots ; le français a adopté « week-end » il y a plus d'un siècle, et personne ne s'en porte plus mal. Ce qui m'inquiète davantage, ce sont les calques discrets : ces tournures traduites mot à mot de l'anglais qu'on ne remarque même plus, et qui finissent par remplacer des expressions françaises plus précises. Un mot anglais, on le repère. Une structure qui s'installe, non. C'est là que se joue, à mon avis, la vitalité d'une langue."],
      ], "Qu'est-ce qui préoccupe surtout la linguiste ?",
        ["Des emprunts qui passent inaperçus.", "L'arrivée de mots anglais comme « week-end ».", "Le refus d'emprunter des mots étrangers.", "La disparition du français au Québec."],
        "« Ce qui m'inquiète davantage, ce sont les calques discrets… qu'on ne remarque même plus ». She says English words like « week-end » do no harm, never talks of refusing loanwords, and answers that the threat is smaller than people think.",
        { scene: "A linguist from Montréal talking on a Québec radio programme; clear and engaging.", A: v("fr-fr-podcaster-1", "sylvie", "A Québec linguist in her fifties, clear and engaging.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique économique à la radio.", [
        ["A", "Dans certains commerces, on ne peut déjà plus payer en espèces. On nous présente cette évolution comme un progrès : plus rapide, plus hygiénique, plus sûr. Et pour la plupart d'entre nous, c'est vrai. Mais une société sans argent liquide laisse des gens au bord du chemin. Pensez à la personne âgée qui n'a pas de téléphone intelligent, à celle qui gère un budget serré et qui ne sait plus combien il lui reste quand tout passe par une carte. Et il y a la question de la trace : chaque achat devient une donnée, et cette donnée, quelqu'un, quelque part, sait très bien quoi en faire. Je ne réclame pas qu'on revienne en arrière. Je demande simplement qu'on garde le choix."],
      ], "Que demande le chroniqueur ?",
        ["Qu'on puisse toujours régler en espèces.", "Qu'on interdise le paiement par carte.", "Qu'on revienne entièrement aux billets.", "Qu'on protège mieux les commerces des vols."],
        "« Je demande simplement qu'on garde le choix », after defending those who rely on cash. He asks for nothing to be banned, says « Je ne réclame pas qu'on revienne en arrière », and « plus sûr » is one of the arguments for cards, not a call about theft.",
        { scene: "An economics column on the radio; thoughtful, a little wry.", A: v("fr-fr-podcaster-12", "remy", "A columnist in his fifties, thoughtful and a little wry.") }),
      doc("C1", "Entretien", "Une journaliste interroge un architecte.", [
        ["A", "On construit aujourd'hui des bâtiments très économes en énergie. Pourquoi plaidez-vous plutôt pour la rénovation ?"],
        ["B", "Parce qu'on oublie une partie de l'addition. Un bâtiment neuf, même très performant, a déjà émis énormément de carbone avant d'être habité : le béton, l'acier, le transport, le chantier. Il faut des décennies d'économies d'énergie pour compenser. Autrement dit, quand on démolit un immeuble des années soixante pour le remplacer par un bâtiment exemplaire, on commence par creuser une dette de carbone qu'on mettra trente ou quarante ans à rembourser. Le bâtiment le plus écologique, c'est souvent celui qui existe déjà. Rénover coûte parfois plus cher et demande plus d'imagination, mais démolir, c'est jeter une énergie qu'on a déjà dépensée."],
      ], "Selon l'architecte, pourquoi vaut-il mieux rénover ?",
        ["La construction elle-même pollue beaucoup.", "Les bâtiments neufs consomment trop d'énergie.", "La rénovation coûte toujours moins cher.", "Les anciens bâtiments sont plus beaux."],
        "« Un bâtiment neuf… a déjà émis énormément de carbone avant d'être habité ». New buildings use little energy (« très économes »), renovating sometimes costs more, and beauty is never mentioned.",
        { scene: "A radio interview with an architect; calm and convincing.", A: v("fr-fr-csagent-3", "vivienne", "A radio journalist, curious."), B: v("fr-fr-training-4", "remy", "An architect in his sixties, calm, precise and convincing.") }),

      /* ---------- C2 (items 36–39) ---------- */
      doc("C2", "Chronique", "Vous écoutez une chronique à la radio.", [
        ["A", "Réjouissons-nous : le bonheur est enfin à la portée de tous. Il suffit de se lever à cinq heures, de méditer dix minutes, de noter chaque soir trois choses pour lesquelles on est reconnaissant, et de bannir les pensées négatives, ces parasites. Si, malgré tout, vous êtes triste un mardi de novembre, la conclusion s'impose : vous n'avez pas assez essayé. C'est toute la beauté du système : il ne peut pas échouer, puisque c'est toujours vous qui échouez. Les livres qui vous l'expliquent se vendent par millions, et leurs auteurs, eux, ont d'excellentes raisons d'être heureux. On vous proposera bientôt, j'en suis sûr, une application pour mesurer vos progrès, avec un joli graphique et un rappel discret quand votre moyenne baisse. Quant à la tristesse, qui servait jadis à comprendre ce qui ne va pas, elle est priée de rester discrète."],
      ], "Que dénonce le chroniqueur ?",
        ["Une injonction au bonheur qui culpabilise.", "L'inefficacité des méthodes de méditation.", "Le manque de livres consacrés au bonheur.", "Les gens qui se lèvent trop tôt le matin."],
        "The praise is ironic: « il ne peut pas échouer, puisque c'est toujours vous qui échouez » shows a system that blames people for being sad. He never judges whether meditation works, says the books sell by the million, and getting up at five is one of the recipes he mocks, not his target.",
        { scene: "A satirical radio column; deadpan irony.", A: v("fr-fr-podcaster-4", "remy", "A columnist in his forties, deadpan and ironic, with a dry delivery.") }),
      doc("C2", "Lecture", "Vous écoutez la lecture d'un extrait de roman.", [
        ["A", "Ce dernier été, mon père m'a appris à nager. J'avais pourtant vingt-deux ans, et je nageais très bien depuis l'enfance. Mais chaque matin, il m'attendait au bord du lac avec la même serviette rayée, et il me disait : « Allez, montre-moi encore ta brasse. » Je faisais semblant de m'appliquer ; il faisait semblant de corriger mes mouvements. Ni lui ni moi ne parlions de mon départ, fixé au premier septembre, ni de la ville lointaine où j'allais travailler. Il comptait mes longueurs à voix haute, comme si chaque chiffre retardait un peu le calendrier. Parfois, il se trompait, recommençait à zéro, et je ne protestais pas. Le dernier matin, il a oublié la serviette. Je crois qu'il l'avait fait exprès. Je suis sortie de l'eau sans rien pour me sécher, et nous sommes restés longtemps au bord du lac, sans rien dire."],
      ], "Que laisse comprendre ce passage ?",
        ["Le père cherche à retenir le temps avant la séparation.", "La narratrice ne savait pas nager avant cet été-là.", "Le père voudrait que sa fille devienne nageuse.", "La narratrice refuse de quitter sa famille."],
        "The swimming lessons are a pretext: « comme si chaque chiffre retardait un peu le calendrier » before her departure, which neither mentions. She says she had swum well since childhood; nothing points to a swimming career; and she is leaving, if sadly.",
        { scene: "A reading from a novel on a literary radio programme; intimate and restrained.", A: v("fr-fr-podcaster-1", "vivienne", "A reader in her thirties, intimate and restrained, letting the silences speak.") }),
      doc("C2", "Débat", "Un animateur reçoit une économiste.", [
        ["A", "On entend beaucoup parler de croissance verte : produire plus, mais en polluant moins. C'est possible ?"],
        ["B", "Sur le papier, oui, et certains pays ont réussi à faire croître leur économie tout en réduisant leurs émissions. Mais regardons de plus près. Une partie de ces baisses vient du fait qu'on fait fabriquer ailleurs ce qu'on consomme ici : les émissions ont déménagé, elles n'ont pas disparu. Quand on compte ce que nous importons, le bilan de plusieurs champions de la croissance verte devient nettement moins flatteur. Et là où la baisse est réelle, son rythme reste très loin de ce qu'exigeraient nos engagements climatiques. Je ne dis pas que la croissance verte est un leurre. Je dis qu'en faire notre seule stratégie, c'est parier sur une vitesse qu'aucune économie n'a jamais atteinte."],
      ], "Que laisse entendre l'économiste ?",
        ["Miser uniquement sur la croissance verte serait imprudent.", "La croissance verte n'est qu'une pure illusion.", "Aucun pays n'est parvenu à réduire ses émissions.", "Il faudrait produire davantage à l'étranger."],
        "« en faire notre seule stratégie, c'est parier sur une vitesse qu'aucune économie n'a jamais atteinte ». She explicitly says it isn't a decoy (« je ne dis pas que… un leurre »), that some countries did cut emissions, and moving production abroad is what hides emissions, not a solution.",
        { scene: "A radio debate on economics and climate; dense, at a natural pace.", A: v("fr-fr-podcaster-12", "jean", "A Québec radio host in his fifties, sharp and friendly."), B: v("fr-fr-advisor-9", "vivienne", "An economist in her fifties, precise, fast and nuanced.") }),
      doc("C2", "Conférence", "Vous écoutez un extrait de conférence.", [
        ["A", "Nous passons nos journées à faire confiance à des inconnus. Nous mangeons des plats préparés par des gens que nous ne verrons jamais, nous montons dans des avions pilotés par des personnes dont nous ignorons le nom, nous suivons les conseils de médecins rencontrés une seule fois. Même acheter un pot de confiture suppose de croire, sans vérifier, qu'il contient bien ce qu'annonce l'étiquette. On décrit volontiers notre époque comme celle de la défiance généralisée ; je crois que c'est confondre deux choses. Ce qui s'effrite, ce n'est pas la confiance en tant que telle, sans laquelle aucune journée ne serait vivable : c'est la confiance que nous accordons aux institutions qui la garantissaient, le diplôme, la signature, le titre. Le défi n'est donc pas de réapprendre à faire confiance, mais de rebâtir ce qui nous permettait de le faire sans y penser."],
      ], "Quelle est la thèse de la conférencière ?",
        ["C'est la confiance dans ses garants qui faiblit.", "Notre époque se caractérise par une méfiance générale.", "Il faudrait apprendre à se méfier des inconnus.", "Les institutions sont plus fiables que les individus."],
        "« Ce qui s'effrite, ce n'est pas la confiance en tant que telle… c'est la confiance que nous accordons aux institutions qui la garantissaient ». General distrust is the description she rejects (« c'est confondre deux choses »), she shows we trust strangers all day, and she says those institutions are losing our trust, not that they're more reliable.",
        { scene: "An extract from a philosophy lecture; dense and elegant.", A: v("fr-fr-advisor-7", "vivienne", "A philosopher in her sixties, dense, elegant and unhurried.") }),
    ],
  }, {
    id: "co-exam-2",
    title: "Examen blanc 2",
    items: [
      /* ---------- A1: pictures (items 1–4) ---------- */
      pic(ART.cart, "Un homme pousse un chariot plein de provisions dans un supermarché, devant des étagères.",
        ["Il fait les courses au supermarché.", "Il prépare le dîner dans sa cuisine.", "Il attend le train sur le quai.", "Il répare sa voiture au garage."], 0,
        "The man is pushing a trolley full of groceries past the shelves: « Il fait les courses au supermarché ». He isn't cooking (B), there's no platform or train (C), and no car or garage (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-6", "remy", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.bench, "Une femme lit un livre, assise sur un banc dans un parc, près d'un arbre ; il fait soleil.",
        ["Elle court sous la pluie.", "Elle écrit une lettre au bureau.", "Elle lit sur un banc, au soleil.", "Elle dort dans son lit."], 2,
        "She's sitting on a park bench with an open book, in the sun: « Elle lit sur un banc, au soleil ». It isn't raining and she isn't running (A), she isn't writing or in an office (B), and she isn't in bed (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-11", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.dog, "Un homme promène son chien en laisse sur le trottoir.",
        ["Il donne à manger au chat.", "Il promène son chien.", "Il fait du vélo avec son fils.", "Il lave sa voiture devant la maison."], 1,
        "The man is holding a dog on a lead: « Il promène son chien ». It's a dog, not a cat, and he isn't feeding it (A); there's no bike or child (C), and no car (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-tutor-7", "remy", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.football, "Deux enfants jouent au ballon : l'un tire vers un but, l'autre l'attend devant les filets, les bras levés.",
        ["Les enfants font leurs devoirs.", "Les enfants nagent dans le lac.", "Les enfants mangent à la cantine.", "Les enfants jouent au ballon."], 3,
        "One child kicks a ball towards a goal where the other is waiting: « Les enfants jouent au ballon ». They aren't doing homework (A), there's no lake (B), and they aren't eating (C).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-1", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),

      /* ---------- A2: a question and four replies (items 5–7) ---------- */
      reply("Où est-ce que je peux recharger ma carte de métro ?",
        ["Le métro passe toutes les cinq minutes.", "Ma carte est dans mon portefeuille.", "Aux machines, à l'entrée de la station.", "Ça coûte trois dollars cinquante."], 2,
        "The question asks where (« où ») to top up the card: « Aux machines, à l'entrée de la station ». A reuses « métro » to give how often trains come, B reuses « carte » to say where the speaker's own card is, and D gives a price.",
        { scene: "In a metro station: a passenger asks a question, then four possible replies.", A: v("fr-fr-podcaster-9", "vivienne", "A passenger asking politely."), B: v("fr-fr-concierge-4", "remy", "A station agent; four short replies read one by one, with a pause after each.") }),
      reply("Ça fait combien de temps que tu habites à Gatineau ?",
        ["Depuis trois ans, à peu près.", "Au troisième étage, à gauche.", "Je déménage la semaine prochaine.", "C'est à vingt minutes d'Ottawa."], 0,
        "« Ça fait combien de temps » asks how long: « Depuis trois ans, à peu près ». B says where the flat is in the building, C talks about moving out, and D says how far Gatineau is from Ottawa.",
        { scene: "Two new colleagues getting to know each other: a question, then four possible replies.", A: v("fr-fr-advisor-4", "remy", "A friendly colleague asking casually."), B: v("fr-fr-tutor-4", "vivienne", "Four short replies read one by one, with a pause after each.") }),
      reply("Et comme dessert, qu'est-ce que vous prenez ?",
        ["Une table pour deux, s'il vous plaît.", "Une tarte aux pommes, s'il vous plaît.", "Le menu du midi est à quinze dollars.", "Non, je n'ai pas réservé."], 1,
        "The waiter asks which dessert (« comme dessert ») the customer wants: « Une tarte aux pommes, s'il vous plaît ». A asks for a table, which comes before the meal; C gives the price of the lunch menu; and D answers a question about booking.",
        { scene: "In a restaurant: a waiter asks a question, then four possible replies.", A: v("fr-fr-training-4", "remy", "A waiter, polite and quick."), B: v("fr-fr-advisor-12", "vivienne", "A customer; four short replies read one by one, with a pause after each.") }),

      /* ---------- A2: short documents (items 8–10) ---------- */
      doc("A2", "Message sur répondeur", "Une réceptionniste laisse un message à un patient.", [
        ["A", "Bonjour, monsieur Diallo, ici Sophie, de la clinique dentaire du Parc. Votre rendez-vous de jeudi à quatorze heures est confirmé. Merci d'arriver dix minutes en avance pour remplir un formulaire. Si vous avez une assurance, apportez votre carte. Bonne journée !"],
      ], "Que doit faire monsieur Diallo jeudi ?",
        ["Venir un peu plus tôt.", "Appeler la clinique pour confirmer.", "Payer sa nouvelle assurance dentaire.", "Arriver à la clinique à 14 h 10."],
        "« Merci d'arriver dix minutes en avance » means coming a little before the appointment. It's already confirmed, so there's no call to make; he's asked to bring his insurance card, not to pay for insurance; and the ten minutes come before 2 p.m., not after.",
        { scene: "A voicemail from a dental clinic's receptionist; friendly and clear.", A: v("fr-fr-csagent-3", "vivienne", "A receptionist in her thirties, friendly and clear.") }),
      doc("A2", "Annonce", "Vous entendez une annonce dans un musée.", [
        ["A", "Mesdames et messieurs, le musée fermera ses portes dans quinze minutes. Merci de vous diriger vers la sortie. La boutique, elle, reste ouverte jusqu'à dix-huit heures. N'oubliez pas : demain, l'entrée est gratuite pour tous, toute la journée."],
      ], "Qu'est-ce qu'on annonce aux visiteurs ?",
        ["Ils doivent partir bientôt.", "Le musée ferme à dix-huit heures.", "La boutique est déjà fermée.", "L'entrée est gratuite aujourd'hui."],
        "« Le musée fermera ses portes dans quinze minutes. Merci de vous diriger vers la sortie » tells visitors to leave the galleries soon. 6 p.m. is when the shop closes, the shop stays open, and entry is free tomorrow, not today.",
        { scene: "A closing announcement over a museum's loudspeakers; calm and clear.", A: v("fr-fr-advisor-2", "remy", "A museum announcer, calm and clear.") }),
      doc("A2", "Dialogue", "Deux amis organisent un repas.", [
        ["A", "Pour le repas de samedi, chacun apporte un plat. Moi, je fais une salade. Tu peux faire un dessert ?"],
        ["B", "Je n'ai pas le temps de cuisiner. J'apporte plutôt les boissons : du jus et de l'eau pétillante."],
        ["A", "Parfait ! Alors Karim fera le gâteau."],
      ], "Qu'est-ce que l'homme va apporter ?",
        ["Du jus et de l'eau.", "Une salade verte.", "Un dessert maison.", "Le gâteau de Karim."],
        "« J'apporte plutôt les boissons : du jus et de l'eau pétillante ». The salad is what she makes, a dessert is what she first asked him for, and the cake will be Karim's.",
        { scene: "Two friends organising a potluck; relaxed.", A: v("fr-fr-podcaster-5", "vivienne", "A friend in her thirties, organised and cheerful."), B: v("fr-fr-podcaster-2", "remy", "A friend in his thirties, a little short of time.") }),

      /* ---------- B1 (items 11–19) ---------- */
      doc("B1", "Dialogue", "Une employée parle avec son responsable.", [
        ["A", "Monsieur Tremblay, je voudrais prendre congé vendredi prochain : ma sœur se marie à Québec."],
        ["B", "Vendredi, c'est la livraison du nouveau logiciel, j'ai besoin de toute l'équipe. Mais si vous finissez le rapport mensuel d'ici jeudi, je vous libère dès midi vendredi. Vous pourrez prendre la route tôt."],
        ["A", "D'accord, je m'organise pour le terminer mercredi."],
      ], "Qu'est-ce que le responsable accepte ?",
        ["Qu'elle quitte le travail vendredi midi.", "Qu'elle ne vienne pas du tout vendredi.", "Qu'elle rende son rapport après vendredi.", "Qu'elle travaille depuis Québec vendredi."],
        "« si vous finissez le rapport mensuel d'ici jeudi, je vous libère dès midi vendredi »: she can leave at noon on Friday. He refuses the whole day because of the software delivery; the report is due by Thursday, not after; and Québec is where the wedding is, not where she'd work.",
        { scene: "An employee asks her manager for a day off, in his office; polite.", A: v("fr-fr-advisor-7", "vivienne", "An employee in her thirties, polite and a little nervous."), B: v("fr-fr-podcaster-8", "remy", "Monsieur Tremblay, a manager in his fifties, firm but fair.") }),
      doc("B1", "Conversation téléphonique", "Une cliente appelle son fournisseur d'accès à Internet.", [
        ["A", "Bonjour, mon internet ne fonctionne plus depuis hier soir. J'ai déjà redémarré le modem deux fois."],
        ["B", "Je vois une panne sur votre ligne. Un technicien peut passer jeudi entre huit heures et midi. Il faudra qu'un adulte soit présent pour lui ouvrir. Il vous appellera une heure avant."],
        ["A", "Jeudi matin, je travaille… Mais mon mari sera là. C'est bon."],
      ], "Que va-t-il se passer jeudi ?",
        ["Un réparateur passera le matin.", "Elle devra redémarrer son modem.", "Elle attendra le technicien au bureau.", "La panne sera réparée à distance."],
        "« Un technicien peut passer jeudi entre huit heures et midi », and her husband will be home to let him in. Restarting the modem is what she has already done; she'll be at work, not waiting for the technician there; and the agent sends someone because of a fault on the line, so it isn't fixed remotely.",
        { scene: "A phone call to an internet provider's customer service; polite.", A: v("fr-fr-podcaster-9", "vivienne", "A customer in her forties, a little annoyed but polite."), B: v("fr-fr-tutor-6", "remy", "A customer service agent, calm and helpful.") }),
      doc("B1", "Bulletin d'information", "Vous écoutez les nouvelles locales à la radio.", [
        ["A", "Bonne nouvelle pour les cyclistes : cet hiver, le service de vélos en libre-service restera ouvert au centre-ville. Jusqu'ici, les vélos disparaissaient des rues en novembre. Cette année, deux cents vélos équipés de pneus d'hiver seront disponibles près des stations de métro. Les abonnés pourront les utiliser sans frais supplémentaires. Les autres quartiers devront attendre le retour du printemps, en avril."],
      ], "Quelle est la nouveauté annoncée ?",
        ["Le centre gardera ses vélos l'hiver.", "Tous les quartiers garderont leurs vélos l'hiver.", "Les vélos disparaîtront des rues dès novembre.", "Deux cents stations de métro vont ouvrir en avril."],
        "« cet hiver, le service de vélos en libre-service restera ouvert au centre-ville »: downtown keeps bikes through the cold season. The other neighbourhoods wait until April; November is when the bikes used to disappear; and the two hundred bikes go near existing metro stations.",
        { scene: "A local news brief on a Montréal radio station; upbeat.", A: v("fr-fr-podcaster-4", "remy", "A radio newsreader, upbeat and clear.") }),
      doc("B1", "Dialogue", "Deux étudiants préparent un exposé.", [
        ["A", "Pour l'exposé de mardi, on se partage comment ? Je peux faire les diapositives, si tu veux."],
        ["B", "Tu les as faites la dernière fois. Cette fois, je m'en occupe, et toi, tu présentes. Tu parles mieux que moi devant la classe, tout le monde le dit."],
        ["A", "Bon, d'accord. Mais alors tu m'envoies tout lundi soir, pour que je répète."],
      ], "Comment les étudiants se partagent-ils le travail ?",
        ["Elle prépare les diapos, il prend la parole.", "Il prépare les diapos, elle prend la parole.", "Ils présentent chacun une moitié de l'exposé.", "Ils répètent ensemble lundi soir."],
        "« Cette fois, je m'en occupe [des diapositives], et toi, tu présentes ». He offered to make the slides, but she says he did them last time; nobody splits the talk in half; and Monday evening is when she sends him everything so he can rehearse on his own.",
        { scene: "Two students planning a class presentation, in a college corridor; casual.", A: v("fr-fr-podcaster-6", "remy", "A student in his twenties, easy-going."), B: v("fr-fr-podcaster-11", "vivienne", "A student in her twenties, organised and direct.") }),
      doc("B1", "Message enregistré", "Vous écoutez le message d'un centre communautaire.", [
        ["A", "Bonjour à tous, ici le centre communautaire Saint-Michel. À partir de janvier, le cours de yoga du lundi soir passe au mardi, même heure. Le cours de cuisine du mercredi, lui, ne change pas. Attention : les inscriptions se font désormais uniquement en ligne, à partir du cinq décembre. Il n'y aura plus d'inscription à l'accueil."],
      ], "Que doivent savoir les participants ?",
        ["Il faudra s'inscrire sur Internet.", "Le cours de cuisine change de jour.", "Le yoga commencera plus tard le soir.", "On peut s'inscrire à l'accueil dès décembre."],
        "« les inscriptions se font désormais uniquement en ligne »: from now on you sign up online. The cooking class doesn't change; yoga moves from Monday to Tuesday at the same time, not later; and signing up at the front desk is exactly what stops.",
        { scene: "A recorded message from a community centre in Montréal; friendly.", A: v("fr-fr-concierge-6", "vivienne", "A community centre employee in her fifties, friendly and clear.") }),
      doc("B1", "Dialogue", "Un client parle avec une pharmacienne.", [
        ["A", "Bonjour, le médecin m'a prescrit cet antibiotique. Je peux le prendre le matin, avant de partir au travail ?"],
        ["B", "Oui, mais pas à jeun : prenez-le pendant le petit-déjeuner, sinon il peut vous donner mal au ventre. Et surtout, continuez jusqu'à la fin de la boîte, même si vous vous sentez mieux."],
        ["A", "Même si je n'ai plus de fièvre ?"],
        ["B", "Oui, jusqu'au bout."],
      ], "Que conseille la pharmacienne ?",
        ["Prendre le médicament en mangeant.", "Prendre le médicament avant de manger.", "Arrêter dès que la fièvre a disparu.", "Changer d'antibiotique s'il a mal au ventre."],
        "« pas à jeun : prenez-le pendant le petit-déjeuner »: with food. Taking it before eating is what she warns against; he must go on even without fever (« jusqu'au bout »); and a stomach ache is what may happen on an empty stomach, not a reason to change medicine.",
        { scene: "At a pharmacy counter; calm and professional.", A: v("fr-fr-podcaster-12", "remy", "A customer in his forties, in a hurry."), B: v("fr-fr-advisor-12", "vivienne", "A pharmacist in her fifties, kind and precise.") }),
      doc("B1", "Entretien", "À la radio, une nouvelle arrivante parle de son premier hiver.", [
        ["A", "Fatou, vous êtes arrivée de Dakar l'an dernier. Comment s'est passé votre premier hiver ?"],
        ["B", "Je m'attendais à souffrir du froid, et finalement, avec un bon manteau, ça va. Ce qui a été dur, c'est la nuit qui tombe à seize heures. Heureusement, une voisine m'a emmenée faire du patin le dimanche : sortir, même par moins vingt, ça m'a sauvée."],
      ], "Qu'est-ce qui a aidé Fatou pendant l'hiver ?",
        ["Les sorties du week-end avec sa voisine.", "Un manteau très chaud acheté à Dakar.", "Des journées passées à l'intérieur.", "Les longues soirées d'hiver chez elle."],
        "« une voisine m'a emmenée faire du patin le dimanche : sortir… ça m'a sauvée ». The coat only kept her warm, and she never says she bought it in Dakar; staying in and the long dark evenings are what was hard (« la nuit qui tombe à seize heures »).",
        { scene: "A short interview on a Montréal community radio station; warm.", A: v("fr-fr-advisor-2", "remy", "A radio host, warm and curious."), B: v("fr-fr-tutor-4", "vivienne", "Fatou, a woman in her thirties from Senegal, lively and humorous.") }),
      doc("B1", "Dialogue", "Un couple parle de deux appartements visités.", [
        ["A", "Alors, tu préfères lequel ? Le cinq et demie à Rosemont est plus grand, et il y a une cour."],
        ["B", "Oui, mais il est à quarante minutes de mon travail en autobus. Le quatre et demie, sur Saint-Denis, est plus petit, mais je serais à dix minutes à pied du bureau. Et le loyer est presque le même."],
        ["A", "Alors je ne discute plus : on prend le plus proche."],
      ], "Quel logement vont-ils choisir ?",
        ["Le plus petit des deux.", "Celui qui a une cour.", "Le moins cher des deux.", "Celui de Rosemont."],
        "« on prend le plus proche »: the four-and-a-half on Saint-Denis, the smaller one. The yard comes with the bigger flat in Rosemont, and the rent is « presque le même », so neither is cheaper.",
        { scene: "A couple talking after visiting two flats in Montréal; relaxed.", A: v("fr-fr-podcaster-5", "vivienne", "A woman in her thirties, keen on the big flat."), B: v("fr-fr-advisor-4", "remy", "A man in his thirties, practical and calm.") }),
      doc("B1", "Avis à la population", "Vous écoutez un message de la Ville à la radio.", [
        ["A", "Avis aux résidents : à partir du premier mars, les ordures ménagères ne seront plus ramassées chaque semaine, mais toutes les deux semaines, le jeudi. Le bac brun, pour les restes de table, sera collecté, lui, chaque semaine. La Ville rappelle que les sacs déposés à côté des bacs ne seront pas ramassés. Le calendrier complet est sur le site de la Ville."],
      ], "Qu'annonce la Ville aux résidents ?",
        ["Les poubelles seront vidées moins souvent.", "Le bac brun ne sera plus ramassé.", "Les sacs à côté des bacs seront acceptés.", "Les ordures seront collectées chaque semaine."],
        "« les ordures… ne seront plus ramassées chaque semaine, mais toutes les deux semaines »: the bins are emptied less often. The brown bin is still collected every week, rubbish only every two weeks, and bags left beside the bins won't be taken.",
        { scene: "A public service announcement from a city, on local radio; clear.", A: v("fr-fr-podcaster-1", "vivienne", "A city announcer, clear and neutral.") }),

      /* ---------- B2 (items 20–29) ---------- */
      doc("B2", "Reportage", "Vous écoutez un reportage à la radio.", [
        ["A", "À Plouguerneau, en Bretagne, l'ancienne poste est devenue un espace de travail partagé. Une quinzaine de personnes y viennent chaque jour, ordinateur sous le bras."],
        ["B", "Je télétravaille pour une entreprise parisienne. Au début, je restais chez moi, et franchement, je ne voyais plus personne. Ici, je paie quatre-vingts euros par mois, ce n'est pas rien. Mais ce que je paie, au fond, ce n'est pas un bureau : ce sont des collègues, même s'ils ne travaillent pas pour la même boîte que moi."],
      ], "Qu'est-ce que cette femme apprécie surtout dans cet espace ?",
        ["Ne plus travailler seule toute la journée.", "Un loyer moins cher qu'à Paris.", "Un bureau mieux équipé que chez elle.", "La possibilité de changer d'employeur."],
        "« ce que je paie, au fond, ce n'est pas un bureau : ce sont des collègues »: she pays so as not to work alone all day. Eighty euros is « pas rien », so it isn't about a cheap price; the desk itself isn't what she values; and the people there work for other firms, but she isn't changing employer.",
        { scene: "A radio report from a village in Brittany; relaxed.", A: v("fr-fr-podcaster-8", "remy", "A radio reporter, curious and relaxed."), B: v("fr-fr-advisor-9", "vivienne", "A remote worker in her forties, frank and warm.") }),
      doc("B2", "Entretien", "Une journaliste interroge un médecin de famille.", [
        ["A", "Docteur Lefebvre, près d'un Québécois sur cinq n'a pas de médecin de famille. Faut-il simplement former plus de médecins ?"],
        ["B", "On en forme déjà davantage, mais il faut dix ans pour former un médecin, et les patients ne peuvent pas attendre dix ans. Le vrai gaspillage, c'est que je passe une partie de mes journées à renouveler des ordonnances ou à remplir des formulaires. Ce temps-là, je le prends à mes patients. Une infirmière praticienne ou un pharmacien pourraient le faire. Chacun devrait faire ce que lui seul sait faire."],
      ], "Que propose le médecin ?",
        ["Mieux répartir les tâches entre soignants.", "Former davantage de nouveaux médecins.", "Réduire la paperasse des pharmaciens.", "Allonger la formation des infirmières."],
        "« Une infirmière praticienne ou un pharmacien pourraient le faire. Chacun devrait faire ce que lui seul sait faire »: share the work better among health professionals. More doctors are already being trained, too slowly to help; the paperwork he means is his own, not the pharmacists'; and he never talks about nurses' training.",
        { scene: "A radio interview about healthcare in Québec; serious.", A: v("fr-fr-advisor-7", "vivienne", "A journalist in her forties, direct."), B: v("fr-fr-podcaster-12", "jean", "Doctor Lefebvre, a family doctor in his fifties, calm and convinced.") }),
      doc("B2", "Témoignage", "À la radio, un Français raconte son installation au Nouveau-Brunswick.", [
        ["A", "Quand mon entreprise m'a proposé un poste à Moncton, je ne savais même pas placer la ville sur une carte. J'imaginais une petite ville tranquille, presque entièrement anglophone. Tranquille, oui. Mais le français est partout : au travail, la moitié de mes collègues sont acadiens, et ils passent d'une langue à l'autre au milieu d'une phrase. Au début, j'avoue, je les corrigeais. Aujourd'hui, c'est moi qui dis « chiller » sans y penser. Mes enfants, eux, ne se posent même plus la question."],
      ], "Qu'est-ce qui a changé chez cet homme ?",
        ["Il a adopté la façon de parler locale.", "Il a appris à parler anglais au travail.", "Il corrige encore ses collègues acadiens.", "Il cherche à quitter cette ville trop calme."],
        "« Au début… je les corrigeais. Aujourd'hui, c'est moi qui dis « chiller » sans y penser »: he now speaks like the people around him. French is everywhere at work, so he isn't learning English there; he has stopped correcting his colleagues; and he finds the town quiet but never says he wants to leave.",
        { scene: "A personal testimony on a radio programme about moving abroad; amused.", A: v("fr-fr-podcaster-2", "remy", "A Parisian man in his forties, amused and self-mocking.") }),
      doc("B2", "Entretien", "Un journaliste interroge une bibliothécaire.", [
        ["A", "Votre bibliothèque de quartier prête maintenant des outils, des jeux de société, et même des raquettes à neige. Est-ce encore une bibliothèque ?"],
        ["B", "Je comprends la question. Certains usagers nous reprochent de délaisser les livres. Mais on n'a jamais prêté autant de livres ! Les gens viennent pour une perceuse, restent pour un café, et repartent avec un roman. En fait, une bibliothèque, ça n'a jamais été seulement des livres : c'est le dernier endroit en ville où l'on peut entrer sans rien acheter."],
      ], "Quelle est la position de la bibliothécaire ?",
        ["Ces nouveautés font vivre le lieu.", "La bibliothèque devrait revenir aux livres.", "Les usagers ont raison de se plaindre.", "Il faudrait faire payer l'entrée."],
        "« on n'a jamais prêté autant de livres ! Les gens viennent pour une perceuse… et repartent avec un roman »: the new services bring people, and readers, in. Going back to books only is what some users want; she understands their question without agreeing; and she praises a place you can enter « sans rien acheter », the opposite of charging for entry.",
        { scene: "A radio interview in a public library in Québec; lively.", A: v("fr-fr-tutor-7", "remy", "A journalist, slightly provocative."), B: v("fr-fr-advisor-12", "vivienne", "A librarian in her forties, enthusiastic and quick.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage sur le gaspillage alimentaire.", [
        ["A", "En France, depuis 2016, les grandes surfaces n'ont plus le droit de jeter les invendus encore consommables : elles doivent les donner à des associations."],
        ["B", "La loi a changé beaucoup de choses, c'est vrai. Mais ce qu'on reçoit, ce sont souvent des produits qui expirent le lendemain. Il faut tout trier, tout distribuer en quelques heures, et nous sommes des bénévoles. Parfois, on finit par jeter nous-mêmes ce que le magasin n'a pas eu le droit de jeter. Le gaspillage a simplement changé d'adresse."],
      ], "Que laisse entendre la bénévole ?",
        ["Le problème a été déplacé vers les associations.", "La loi n'a eu aucun effet sur les magasins.", "Les magasins donnent trop peu de produits.", "Les bénévoles refusent les produits frais."],
        "« Parfois, on finit par jeter nous-mêmes… Le gaspillage a simplement changé d'adresse »: the waste has moved from the shops to the charities. She grants the law « a changé beaucoup de choses »; her complaint is about products close to their date, not how much is given; and nothing suggests volunteers turn fresh food away.",
        { scene: "A radio report on food waste in France; serious.", A: v("fr-fr-podcaster-4", "remy", "A radio reporter, measured."), B: v("fr-fr-podcaster-1", "vivienne", "A food bank volunteer in her sixties, frank and tired.") }),
      doc("B2", "Entretien", "Un animateur interroge une psychologue.", [
        ["A", "On associe souvent la solitude aux personnes âgées. Or, selon les enquêtes, ce sont les dix-huit à vingt-cinq ans qui se disent les plus seuls. Comment l'expliquer ?"],
        ["B", "On pense qu'avec les réseaux sociaux, les jeunes sont entourés en permanence. Mais avoir trois cents contacts, ce n'est pas avoir quelqu'un à appeler à deux heures du matin. Je ne dis pas qu'il faut supprimer les écrans. Je conseille plutôt de choisir une activité régulière, toujours avec les mêmes personnes : une chorale, une équipe de soccer. La confiance naît de la répétition."],
      ], "Que conseille la psychologue ?",
        ["S'engager dans une activité de groupe régulière.", "Abandonner les réseaux sociaux pendant un temps.", "Appeler un ami dès qu'on se sent seul.", "Multiplier les contacts sur Internet."],
        "« choisir une activité régulière, toujours avec les mêmes personnes… La confiance naît de la répétition ». She explicitly doesn't ask anyone to give up screens; someone to call at 2 a.m. is what many young people lack, not her advice; and having many online contacts is what she says isn't enough.",
        { scene: "A radio interview about mental health; gentle and serious.", A: v("fr-fr-training-4", "remy", "A radio host, gentle."), B: v("fr-fr-advisor-9", "vivienne", "A psychologist in her forties, warm and clear.") }),
      doc("B2", "Témoignage", "À la radio suisse, une agricultrice du Valais parle de l'eau.", [
        ["A", "Ma famille cultive des abricots dans le Valais depuis quatre générations. L'eau, ici, vient des glaciers. Pendant longtemps, on n'y pensait même pas : elle arrivait, c'est tout. Aujourd'hui, les glaciers fondent, et paradoxalement, nous avons plus d'eau que jamais au printemps. Mais dans vingt ans, en août, il n'y en aura peut-être plus. Alors on a commencé à planter des variétés qui demandent moins d'eau. Ce n'est pas de la panique : c'est de la prudence."],
      ], "Quelle est l'attitude de cette agricultrice ?",
        ["Elle se prépare calmement à une eau plus rare.", "Elle s'inquiète d'un manque d'eau dès cet été.", "Elle pense que le problème est exagéré.", "Elle veut arrêter de cultiver des abricots."],
        "« dans vingt ans, en août, il n'y en aura peut-être plus… Ce n'est pas de la panique : c'est de la prudence »: she calmly prepares for scarcer water. Today they have more water than ever in spring, so the shortage isn't this summer; she takes the problem seriously; and she changes varieties rather than giving up apricots.",
        { scene: "A testimony on a Swiss radio programme about climate; calm.", A: v("fr-fr-tutor-4", "vivienne", "A farmer in her fifties, calm and grounded.") }),
      doc("B2", "Entretien", "Une journaliste interroge un spécialiste du recrutement.", [
        ["A", "De plus en plus d'entreprises confient le tri des CV à l'intelligence artificielle. Vous êtes spécialiste du recrutement : faut-il s'en inquiéter ?"],
        ["B", "Ce qui m'inquiète, ce n'est pas l'outil, c'est l'usage qu'on en fait. Un logiciel apprend à partir des embauches passées. Si, pendant vingt ans, une entreprise a surtout recruté des hommes de trente ans, le logiciel va chercher… des hommes de trente ans. Il ne fait que reproduire nos habitudes, en plus rapide. Utilisé seul, c'est un problème. Vérifié par un humain, ça peut faire gagner du temps."],
      ], "Quelle est l'opinion du spécialiste ?",
        ["L'outil est utile s'il reste sous contrôle humain.", "L'intelligence artificielle recrute mieux que nous.", "Ces logiciels devraient être interdits.", "Le tri automatique favorise les jeunes femmes."],
        "« Utilisé seul, c'est un problème. Vérifié par un humain, ça peut faire gagner du temps »: useful if a person checks it. He says it only reproduces our habits « en plus rapide », not better; he worries about the use, not the tool, so he doesn't call for a ban; and his example shows it favouring men of thirty, not young women.",
        { scene: "A radio interview about work and technology; brisk.", A: v("fr-fr-csagent-3", "vivienne", "A journalist in her thirties, brisk."), B: v("fr-fr-advisor-2", "remy", "A recruitment specialist in his forties, precise and calm.") }),
      doc("B2", "Entretien", "Un journaliste interroge une membre d'une coopérative d'habitation.", [
        ["A", "Vous vivez depuis douze ans dans une coopérative d'habitation à Trois-Rivières. Le loyer y est plus bas qu'ailleurs. C'est ça, le secret ?"],
        ["B", "Le loyer, oui, c'est un avantage, mais il y a une contrepartie. Ici, personne n'est seulement locataire : chacun donne quelques heures par mois. Moi, je m'occupe des comptes ; mon voisin entretient le jardin. Certains trouvent ça lourd et repartent au bout d'un an. Ceux qui restent, comme moi, restent parce qu'ils ont un mot à dire sur l'endroit où ils vivent."],
      ], "Selon cette femme, qu'est-ce qui retient les membres ?",
        ["Avoir leur mot à dire sur leur cadre de vie.", "Un loyer bien plus bas que dans le privé.", "Les heures de travail qui leur sont payées.", "Le jardin dont s'occupe un des voisins."],
        "« Ceux qui restent… restent parce qu'ils ont un mot à dire sur l'endroit où ils vivent ». The lower rent is an advantage she mentions first, not what keeps people; the hours members give aren't paid; and the garden is just her neighbour's task.",
        { scene: "A radio interview about housing in Québec; friendly.", A: v("fr-fr-podcaster-6", "remy", "A journalist, friendly."), B: v("fr-fr-podcaster-5", "sylvie", "A co-op member in her fifties from Trois-Rivières, frank and good-humoured.") }),
      doc("B2", "Entretien", "Une journaliste interroge un auteur de bande dessinée belge.", [
        ["A", "Votre dernière bande dessinée raconte l'histoire des mineurs italiens venus en Belgique après la guerre. Pourquoi la BD, et pas un roman ?"],
        ["B", "Parce qu'en BD, je peux montrer sans expliquer. Une case suffit pour qu'on sente la poussière, la fatigue, la nostalgie du pays. Mes lecteurs sont souvent des adolescents qui n'ouvriraient jamais un livre d'histoire. Mon but n'est pas de leur faire un cours : je veux qu'ils aient envie d'aller poser des questions à leurs grands-parents, tant qu'il est encore temps."],
      ], "Que cherche surtout l'auteur ?",
        ["Amener les jeunes à questionner leur famille.", "Remplacer les cours d'histoire à l'école.", "Écrire un roman sur les mineurs italiens.", "Décrire en détail le travail dans les mines."],
        "« je veux qu'ils aient envie d'aller poser des questions à leurs grands-parents »: getting young readers to ask their families about the past. He says « Mon but n'est pas de leur faire un cours »; he chose comics over a novel; and he wants to show without explaining, not to describe the mines in detail.",
        { scene: "A radio interview with a Belgian comic-book author, in Brussels; relaxed.", A: v("fr-fr-podcaster-9", "vivienne", "A journalist in her thirties, curious."), B: v("fr-fr-tutor-6", "remy", "A comic-book author in his fifties, thoughtful and warm.") }),

      /* ---------- C1 (items 30–35) ---------- */
      doc("C1", "Conférence", "Vous écoutez un extrait de conférence sur l'école.", [
        ["A", "On répète aux élèves, depuis des années, que l'erreur fait partie de l'apprentissage. Personne ne le conteste. C'est devenu un slogan, affiché dans toutes les classes. Pourtant, regardez comment fonctionne l'école : on corrige, on note, et la note reste dans le bulletin. L'élève comprend très vite que le slogan est sympathique, mais que le système, lui, punit. Je ne propose pas de supprimer les notes. Je propose de distinguer deux moments : celui où l'on s'entraîne, où l'erreur ne coûte rien, et celui où l'on évalue. Tant que ces deux moments seront confondus, l'élève prudent aura raison de ne prendre aucun risque. Et c'est exactement ce qu'il fait : il se tait."],
      ], "Que reproche la conférencière à l'école ?",
        ["Elle punit les erreurs qu'elle dit encourager.", "Elle accorde trop d'importance aux slogans.", "Elle devrait supprimer complètement les notes.", "Elle pousse les élèves à prendre trop de risques."],
        "« le slogan est sympathique, mais… le système, lui, punit »: school penalises the mistakes it claims to welcome. Her target is the gap between the slogan and the marks, not the slogan itself; she explicitly doesn't propose removing marks; and the careful pupil takes no risks at all, not too many.",
        { scene: "An extract from a lecture on education; clear and persuasive.", A: v("fr-fr-advisor-7", "vivienne", "An education researcher in her fifties, clear and a little ironic.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique culturelle à la radio.", [
        ["A", "Vous avez remarqué ? Les plateformes ne me proposent plus que des films qui ressemblent à ceux que j'ai déjà vus. J'ai regardé deux polars scandinaves en janvier ; depuis, mon écran est couvert de neige et de commissaires dépressifs. J'ai même eu droit à un documentaire sur la pêche en Norvège. On nous vend ça comme un service : la machine me connaît, elle me fait gagner du temps. Mais le plaisir de la culture, c'était justement de tomber sur ce qu'on n'aurait jamais choisi. Le libraire qui vous glisse un livre improbable, l'ami qui vous traîne à un concert de jazz. Un algorithme qui ne se trompe jamais sur mes goûts m'empêche surtout d'en avoir de nouveaux."],
      ], "Que reproche le chroniqueur aux algorithmes de recommandation ?",
        ["Ils enferment chacun dans ses goûts passés.", "Ils se trompent souvent sur ses préférences.", "Ils proposent trop de films scandinaves.", "Ils remplacent les libraires et les amis."],
        "« Un algorithme qui ne se trompe jamais sur mes goûts m'empêche surtout d'en avoir de nouveaux »: it locks him into the tastes he already has. It never gets his tastes wrong; the Scandinavian thrillers are only his example; and the bookseller and the friend are what he misses, not what the platforms have replaced.",
        { scene: "A culture column on the radio; witty.", A: v("fr-fr-podcaster-8", "remy", "A columnist in his forties, witty and lively.") }),
      doc("C1", "Débat", "Une conseillère municipale et un économiste débattent des transports en commun.", [
        ["A", "La gratuité des transports en commun, c'est d'abord une mesure de justice sociale, et aussi une mesure écologique. Ceux qui prennent l'autobus sont souvent ceux qui ont les plus petits revenus."],
        ["B", "Je partage votre objectif, madame, mais pas votre moyen. Les études menées ailleurs montrent que la gratuité attire surtout des piétons et des cyclistes, pas des automobilistes. Et un réseau gratuit, c'est un réseau qui perd ses revenus au moment où il faudrait l'agrandir. Si l'on veut aider les ménages modestes, un tarif réduit selon le revenu coûte moins cher et cible mieux."],
        ["A", "Sur ce point, je vous l'accorde : sans plus de bus, la gratuité ne servirait à rien."],
      ], "Qu'admet finalement la conseillère municipale ?",
        ["La gratuité exige un réseau plus développé.", "Un tarif selon le revenu serait plus juste.", "La gratuité attire surtout les automobilistes.", "Les transports doivent rester payants."],
        "« Sur ce point, je vous l'accorde : sans plus de bus, la gratuité ne servirait à rien »: free transit only makes sense with a bigger network. The income-based fare is the economist's proposal, which she doesn't take up; he says free transit attracts pedestrians and cyclists, not drivers; and she still defends free transit.",
        { scene: "A radio debate about public transit in a Québec city; lively but courteous.", A: v("fr-fr-podcaster-1", "sylvie", "A city councillor in her forties, committed and quick."), B: v("fr-fr-podcaster-4", "jean", "An economist in his fifties, courteous and precise.") }),
      doc("C1", "Entretien", "Un journaliste interroge une historienne.", [
        ["A", "À Montréal comme à Bruxelles, plusieurs villes débattent du changement de nom de rues qui honorent des personnages controversés. Vous êtes historienne : faut-il débaptiser ?"],
        ["B", "Je comprends les deux camps, mais je me méfie des deux réflexes. Effacer un nom, c'est parfois effacer aussi l'occasion d'en parler : une rue rebaptisée, on l'oublie en deux ans. Mais garder le nom tel quel, sans un mot, c'est continuer à honorer quelqu'un sans savoir pourquoi. Ce que je défends, c'est un panneau explicatif sous la plaque, ou mieux, que les habitants décident après un vrai débat public. Ce débat, c'est déjà de l'histoire vivante. L'histoire ne se règle pas à coups de tournevis."],
      ], "Quelle position défend l'historienne ?",
        ["Expliquer les noms et en débattre ensemble.", "Remplacer rapidement les noms controversés.", "Laisser les plaques telles qu'elles sont.", "Confier la décision aux seuls historiens."],
        "« un panneau explicatif sous la plaque, ou mieux, que les habitants décident après un vrai débat public »: explain the names and let citizens debate them. She distrusts both quick renaming and keeping the plaque « tel quel, sans un mot »; and she wants residents, not historians, to decide.",
        { scene: "A radio interview about history and public memory; thoughtful.", A: v("fr-fr-tutor-7", "remy", "A journalist, measured."), B: v("fr-fr-concierge-6", "vivienne", "A historian in her sixties, precise and nuanced.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique consommation à la radio.", [
        ["A", "Acheter ses vêtements d'occasion, c'est devenu le geste écologique par excellence. Et c'est vrai qu'un manteau qui sert deux fois, c'est un manteau de moins à fabriquer. Sauf que les applications de revente ont changé la donne. On achète une robe en se disant qu'on pourra toujours la revendre. Le vêtement n'est plus un bien qu'on garde, c'est un placement qu'on fait tourner. Et les plateformes le savent très bien. Résultat : certaines personnes n'ont jamais autant acheté que depuis qu'elles achètent d'occasion. Je ne dis pas qu'il faut revenir au neuf. Le problème n'a jamais été le neuf ou l'usagé. Le problème, c'est la quantité."],
      ], "Quelle est l'idée principale de la chroniqueuse ?",
        ["La seconde main peut encourager à consommer davantage.", "Acheter d'occasion est inutile pour l'environnement.", "Il vaut mieux acheter des vêtements neufs.", "Les applications de revente devraient être interdites."],
        "« certaines personnes n'ont jamais autant acheté que depuis qu'elles achètent d'occasion… Le problème, c'est la quantité »: second-hand can push people to buy more. She grants that a coat worn twice is one less to make, so it isn't useless; she says outright she isn't arguing for new clothes; and she describes what resale apps do without calling for a ban.",
        { scene: "A consumer affairs column on the radio; sharp.", A: v("fr-fr-podcaster-11", "vivienne", "A columnist in her thirties, sharp and lively.") }),
      doc("C1", "Entretien", "Une journaliste interroge un neuroscientifique.", [
        ["A", "Professeur Martin, vous défendez l'ennui. C'est presque provocateur, à une époque où l'on remplit chaque minute libre avec son téléphone. Pourquoi ce combat ?"],
        ["B", "Je ne fais pas l'éloge de l'ennui en soi : s'ennuyer au travail pendant des années, ça n'a rien de créatif. Ce que je défends, ce sont ces moments vides, sans stimulation, où le cerveau se met à vagabonder. C'est là qu'il relie des idées qui n'avaient rien à voir. Vos meilleures idées vous sont venues sous la douche, pas devant un écran. Le problème du téléphone, ce n'est pas qu'il nous rende bêtes ; c'est qu'il ne laisse plus aucun de ces moments exister. On a supprimé la salle d'attente. Ennuyez-vous un peu, ça vous fera du bien."],
      ], "Que défend le chercheur ?",
        ["Des moments vides où l'esprit peut errer.", "L'ennui sous toutes ses formes, même au travail.", "L'interdiction des téléphones dans les lieux publics.", "Des exercices pour stimuler le cerveau."],
        "« Ce que je défends, ce sont ces moments vides, sans stimulation, où le cerveau se met à vagabonder », which the phone no longer leaves room for. Boredom at work is exactly what he doesn't praise; he blames the phone for filling every gap but never asks for a ban; and he wants the brain without stimulation, not exercises.",
        { scene: "A radio interview with a neuroscientist; relaxed and thoughtful.", A: v("fr-fr-csagent-3", "vivienne", "A journalist in her thirties, curious."), B: v("fr-fr-advisor-4", "remy", "Professor Martin, a neuroscientist in his fifties, calm and witty.") }),

      /* ---------- C2 (items 36–39) ---------- */
      doc("C2", "Chronique", "Vous écoutez une chronique humoristique à la radio.", [
        ["A", "Je tiens à féliciter l'humanité : nous n'avons jamais été aussi productifs. Nous avons des applications pour planifier nos journées, d'autres pour mesurer le temps passé à les planifier, et une troisième, très utile, qui nous rappelle de faire une pause, à condition de la programmer. Le matin, je lis des articles sur les dix habitudes des gens efficaces ; le soir, je culpabilise de ne pas en avoir adopté une seule. J'ai d'ailleurs une application qui compte mes pas jusqu'au frigo. Entre les deux, je travaille, un peu. Mon voisin, lui, n'a ni montre connectée ni liste de tâches. Il fait son jardin, il répare des vélos, il lit. Et le pire, c'est qu'il a l'air heureux. Il ne sait pas qu'il perd son temps. Personne n'a eu le cœur de le lui dire."],
      ], "Que laisse entendre le chroniqueur ?",
        ["La course à l'efficacité nous fait perdre l'essentiel.", "Les applications nous rendent réellement plus productifs.", "Son voisin devrait apprendre à mieux s'organiser.", "Il faudrait lire davantage d'articles sur l'efficacité."],
        "The column is ironic: he « congratulates » us on apps that plan our planning, while his neighbour, gardening, mending bikes and reading, looks happy. « Il ne sait pas qu'il perd son temps » means the opposite: chasing efficiency makes us miss what matters. He mocks the apps, the neighbour needs no organising, and the articles only make him feel guilty.",
        { scene: "A satirical column on the radio; dry and ironic, at a natural pace.", A: v("fr-fr-podcaster-2", "remy", "A columnist in his fifties, dry and ironic, with perfect timing.") }),
      doc("C2", "Lecture", "Vous écoutez la lecture d'un extrait de roman.", [
        ["A", "Ce matin-là, Amina resta longtemps à la fenêtre. La neige tombait sur Montréal comme elle tombait dans les films de son enfance, lente, presque timide. Le voisin du dessous pelletait déjà son entrée en sifflotant. Une voiture passa lentement, ses phares encore allumés. Sa mère, au téléphone, lui demandait si elle avait froid, si elle mangeait bien, si elle comptait rentrer pour l'été. Amina répondait oui à tout, en regardant les flocons effacer peu à peu les traces de pas sur le trottoir. Dans la cuisine, la bouilloire sifflait, mais elle ne bougea pas. Elle pensa qu'il faudrait bientôt choisir une langue pour rêver. Puis elle raccrocha, enfila les bottes qu'elle n'avait encore jamais portées, et descendit l'escalier sans se presser, comme on entre dans une maison qui n'est pas encore tout à fait la sienne."],
      ], "Que suggère la fin du passage ?",
        ["Amina fait peu à peu sa vie ici.", "Amina a décidé de repartir vivre dans son pays.", "Amina a peur de sortir sous la neige.", "Amina attend la fin de la neige pour sortir."],
        "She puts on boots she had never worn and goes out « comme on entre dans une maison qui n'est pas encore tout à fait la sienne »: she's slowly making this new life her own. Her « oui » to her mother is absent-minded, and coming home for the summer isn't moving back; she goes down « sans se presser », not afraid; and she goes out while the snow is still falling.",
        { scene: "A reading from a novel on a literary radio programme; intimate.", A: v("fr-fr-podcaster-9", "vivienne", "A reader in her thirties, intimate and unhurried.") }),
      doc("C2", "Débat", "Un animateur reçoit une juriste.", [
        ["A", "Le droit à l'oubli permet de faire effacer des moteurs de recherche des informations anciennes ou inexactes vous concernant. Certains y voient une censure, d'autres une protection. Vous, juriste, qu'en pensez-vous ?"],
        ["B", "Le mot censure me semble excessif, mais l'inquiétude n'est pas absurde. Qu'un adolescent puisse faire disparaître une photo humiliante, qui s'y opposerait ? Qu'un élu fasse effacer une condamnation pour corruption, c'est une autre affaire. Le droit à l'oubli n'est ni bon ni mauvais en soi : tout dépend de qui le demande et de ce qu'il veut faire oublier. Le danger, c'est de confier cet arbitrage aux moteurs de recherche eux-mêmes, qui ont tout intérêt à dire oui pour éviter les ennuis. Aujourd'hui, ce sont eux qui tranchent, seuls, et sans rendre de comptes."],
      ], "Quelle réserve exprime la juriste ?",
        ["Les moteurs de recherche arbitrent mal.", "Le droit à l'oubli est une forme de censure.", "Les élus devraient pouvoir effacer leur passé.", "Les adolescents abusent de ce droit."],
        "« Le danger, c'est de confier cet arbitrage aux moteurs de recherche eux-mêmes, qui ont tout intérêt à dire oui »: search engines aren't good judges. She finds the word censorship « excessif »; the politician erasing a conviction is the case she objects to; and the teenager's photo is the case she approves of.",
        { scene: "A radio debate on law and the internet; dense, at a natural pace.", A: v("fr-fr-podcaster-12", "remy", "A radio host in his fifties, sharp."), B: v("fr-fr-advisor-7", "vivienne", "A lawyer in her forties, fast, precise and nuanced.") }),
      doc("C2", "Conférence", "Vous écoutez un extrait de conférence d'histoire.", [
        ["A", "Mesdames et messieurs, pendant deux siècles, nous avons cru que le progrès allait de soi : chaque génération vivrait mieux que la précédente. Cette certitude s'est fissurée, et l'on entend aujourd'hui le discours inverse : tout irait plus mal. Je voudrais vous mettre en garde contre ces deux récits, qui ont en commun de nous dispenser d'agir. Si le progrès est automatique, il suffit d'attendre ; si le déclin est inévitable, à quoi bon essayer ? Je ne suis ni optimiste ni pessimiste : je suis historien. Or l'histoire montre autre chose. Les vaccins, les congés payés, l'école pour tous n'ont pas été offerts par le cours des choses : ils ont été voulus, discutés, souvent arrachés. Le progrès n'est pas une pente. C'est un chantier. Et un chantier, ça s'abandonne aussi."],
      ], "Où veut en venir le conférencier ?",
        ["Le progrès dépend de choix et d'efforts collectifs.", "Le progrès finit toujours par arriver de lui-même.", "Notre époque est entrée dans un déclin inévitable.", "Les générations futures vivront moins bien que nous."],
        "« Le progrès n'est pas une pente. C'est un chantier »: vaccines, paid holidays and schooling for all were « voulus, discutés, souvent arrachés ». Automatic progress and inevitable decline are the two stories he warns against, and nothing he says predicts worse lives for future generations.",
        { scene: "An extract from a history lecture; dense and elegant.", A: v("fr-fr-concierge-4", "remy", "A historian in his sixties, elegant and measured.") }),
    ],
  }, {
    id: "co-exam-3",
    title: "Examen blanc 3",
    items: [
      /* ---------- A1: pictures (items 1–4) ---------- */
      pic(ART.bike, "Une femme qui porte un casque fait du vélo sur la route.",
        ["Elle conduit une voiture rouge.", "Elle marche sous la neige.", "Elle attend devant la boulangerie.", "Elle fait du vélo avec un casque."], 3,
        "The woman in a helmet is riding a bike: « Elle fait du vélo avec un casque ». There's no car (A), she isn't walking and there's no snow (B), and there's no bakery (C).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-podcaster-5", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.alarm, "Un homme dort dans son lit pendant que le réveil sonne sur la table de nuit.",
        ["Il prend sa douche le matin.", "Le réveil sonne, mais il dort encore.", "Il lit un livre dans son lit.", "Il prépare son café dans la cuisine."], 1,
        "The alarm clock is ringing on the bedside table while the man is still asleep: « Le réveil sonne, mais il dort encore ». He isn't in the shower (A), his eyes are closed and there's no book (C), and he isn't in the kitchen (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-tutor-6", "remy", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.watering, "Une femme arrose des fleurs avec un arrosoir.",
        ["Elle arrose les fleurs du jardin.", "Elle achète des fleurs au marché.", "Elle lave la vaisselle.", "Elle nage dans la piscine."], 0,
        "The woman is pouring water from a watering can onto the flowers: « Elle arrose les fleurs du jardin ». She isn't at a market (B), there are no dishes (C), and there's no pool (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-csagent-3", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.handshake, "Un homme et une femme se serrent la main au-dessus d'un bureau.",
        ["Bonne nuit, à demain !", "Attention, le plancher est mouillé !", "Enchantée, je suis votre nouvelle collègue.", "Bon appétit, tout le monde !"], 2,
        "A man and a woman shake hands across an office desk, as people do when they first meet: « Enchantée, je suis votre nouvelle collègue ». « Bonne nuit » is for the evening (A), the floor isn't wet (B), and nobody is eating (D).",
        { scene: "A listening test item: four short things someone might say, read slowly and clearly.", N: v("fr-fr-podcaster-2", "remy", "A clear, slow test voice, with a short pause after each statement.") }),

      /* ---------- A2: a question and four replies (items 5–7) ---------- */
      reply("Excusez-moi, vous pourriez m'aider à monter ma valise ?",
        ["Elle pèse au moins vingt kilos.", "Bien sûr, donnez-la-moi.", "Je pars en vacances demain.", "Non, ce n'est pas ma valise."], 1,
        "The question asks for help (« vous pourriez m'aider »): « Bien sûr, donnez-la-moi ». A talks about the suitcase's weight, C about the speaker's own holiday, and D reuses « valise » without answering.",
        { scene: "In the hall of an apartment building: someone asks for help, then four possible replies.", A: v("fr-fr-advisor-9", "vivienne", "A woman with a heavy suitcase, asking politely."), B: v("fr-fr-podcaster-8", "remy", "A neighbour; four short replies read one by one, with a pause after each.") }),
      reply("Il fait quel temps à Montréal aujourd'hui ?",
        ["J'y suis allé l'été dernier.", "C'est à cinq heures de Toronto.", "Le vol arrive à quatorze heures.", "Il neige depuis ce matin."], 3,
        "« Il fait quel temps » asks about the weather: « Il neige depuis ce matin ». A talks about a past trip, B about the distance from Toronto, and C about a flight.",
        { scene: "Two friends on the phone: a question, then four possible replies.", A: v("fr-fr-tutor-7", "remy", "A friend asking casually."), B: v("fr-fr-podcaster-1", "vivienne", "Four short replies read one by one, with a pause after each.") }),
      reply("On se retrouve où, après le cours ?",
        ["Devant la bibliothèque, ça te va ?", "Vers seize heures, je pense.", "Le cours de chimie, je crois.", "Avec Inès et Thomas."], 0,
        "« On se retrouve où » asks where to meet: « Devant la bibliothèque, ça te va ? ». B says when, C reuses « cours » to name the class, and D says who with.",
        { scene: "Two students in a corridor: a question, then four possible replies.", A: v("fr-fr-podcaster-11", "vivienne", "A student asking quickly."), B: v("fr-fr-podcaster-6", "remy", "Four short replies read one by one, with a pause after each.") }),

      /* ---------- A2: short documents (items 8–10) ---------- */
      doc("A2", "Message sur répondeur", "Un garagiste laisse un message à une cliente.", [
        ["A", "Bonjour, madame Nguyen, c'est Patrick, du garage Lacroix. Votre voiture est prête : on a changé les freins avant. Vous pouvez passer la chercher aujourd'hui jusqu'à dix-huit heures. Demain, nous sommes fermés. Bonne fin de journée !"],
      ], "Que doit faire madame Nguyen ?",
        ["Aller chercher sa voiture.", "Rappeler le garage demain matin.", "Changer les freins de sa voiture.", "Apporter sa voiture au garage."],
        "« Vous pouvez passer la chercher aujourd'hui jusqu'à dix-huit heures »: she should go and get her car. The garage is closed tomorrow; the brakes have already been changed; and the car is already at the garage.",
        { scene: "A voicemail from a car garage; friendly and quick.", A: v("fr-fr-concierge-4", "remy", "A mechanic in his forties, friendly and quick.") }),
      doc("A2", "Annonce", "Vous entendez une annonce dans un aéroport.", [
        ["A", "Votre attention, s'il vous plaît. Les passagers du vol AC 870 à destination de Paris sont priés de se rendre à la porte quarante-deux, et non à la porte douze. L'embarquement commencera dans vingt minutes. Merci."],
      ], "Que doivent faire les passagers pour Paris ?",
        ["Aller à une autre porte.", "Embarquer tout de suite.", "Aller à la porte douze.", "Attendre un autre vol."],
        "« sont priés de se rendre à la porte quarante-deux, et non à la porte douze »: they must go to another gate. Boarding starts in twenty minutes, not now; gate 12 is the wrong one; and the flight doesn't change.",
        { scene: "An announcement in an airport departure lounge; calm and clear.", A: v("fr-fr-advisor-12", "vivienne", "An airport announcer, calm and clear.") }),
      doc("A2", "Conversation téléphonique", "Une cliente appelle un restaurant.", [
        ["A", "Restaurant Le Saint-Laurent, bonsoir."],
        ["B", "Bonsoir, j'ai réservé une table pour quatre à dix-neuf heures trente, au nom de Moreau. Nous serons finalement six."],
        ["A", "À l'intérieur, c'est complet, mais je peux vous installer sur la terrasse, à la même heure."],
        ["B", "Parfait, merci !"],
      ], "Où la famille Moreau va-t-elle dîner ?",
        ["Dehors, sur la terrasse.", "À l'intérieur du restaurant.", "Dans un autre restaurant.", "À une table pour quatre."],
        "« À l'intérieur, c'est complet, mais je peux vous installer sur la terrasse » — « Parfait ». Inside is full; they keep the same restaurant; and a table for four was the first booking, before they became six.",
        { scene: "A phone call to a restaurant in Québec; polite.", A: v("fr-fr-advisor-2", "remy", "A restaurant host, polite and quick."), B: v("fr-fr-tutor-4", "vivienne", "Madame Moreau, a customer in her forties, friendly.") }),

      /* ---------- B1 (items 11–19) ---------- */
      doc("B1", "Conversation téléphonique", "Une locataire appelle son propriétaire.", [
        ["A", "Bonjour, monsieur Roy. Le chauffage ne marche plus dans mon appartement depuis ce matin, et il fait moins quinze dehors."],
        ["B", "Ah, désolé ! Le technicien ne peut pas venir avant demain matin. En attendant, je vous apporte un radiateur électrique ce soir, vers dix-neuf heures. Ça ira pour la nuit ?"],
        ["A", "Oui, ce sera parfait. Merci beaucoup."],
      ], "Que va faire le propriétaire ce soir ?",
        ["Prêter un appareil de chauffage.", "Réparer lui-même le chauffage.", "Faire venir le technicien.", "Proposer une chambre d'hôtel."],
        "« je vous apporte un radiateur électrique ce soir »: he'll lend her a heater. The technician only comes tomorrow morning; the landlord doesn't repair the heating himself; and no hotel is mentioned.",
        { scene: "A phone call between a tenant and her landlord in winter; polite.", A: v("fr-fr-podcaster-9", "vivienne", "A tenant in her thirties, cold and a little worried."), B: v("fr-fr-podcaster-12", "remy", "Monsieur Roy, a landlord in his sixties, apologetic and helpful.") }),
      doc("B1", "Annonce à la radio", "Vous écoutez une annonce sur une radio locale.", [
        ["A", "Le festival du quartier Limoilou revient le dernier week-end d'août, avec sa grande vente de garage et ses spectacles gratuits. Nouveauté cette année : la rue principale sera fermée aux voitures pendant les trois jours, pour laisser la place aux terrasses et aux jeux pour enfants. Les organisateurs cherchent encore des bénévoles pour l'accueil."],
      ], "Qu'est-ce qui sera différent cette année ?",
        ["Une rue sera piétonne.", "Les spectacles deviendront payants.", "Le festival aura lieu en juillet.", "La vente de garage sera annulée."],
        "« la rue principale sera fermée aux voitures pendant les trois jours »: one street will be for pedestrians. The shows stay free, the festival is still at the end of August, and the garage sale is still on.",
        { scene: "A local radio announcement in Québec City; cheerful.", A: v("fr-fr-podcaster-5", "vivienne", "A radio presenter, cheerful and clear.") }),
      doc("B1", "Dialogue", "Deux collègues parlent d'une formation.", [
        ["A", "Tu as vu ? L'entreprise offre une formation sur les outils d'intelligence artificielle, le jeudi après-midi."],
        ["B", "Oui, mais c'est en ligne, et moi, devant un écran, je décroche au bout de vingt minutes."],
        ["A", "Il y a aussi une session en présentiel, le samedi matin, à la bibliothèque. On s'inscrit ensemble ?"],
        ["B", "Le samedi, ça me coûte un peu… mais d'accord, à deux, ce sera plus motivant."],
      ], "Que décident les deux collègues ?",
        ["De suivre la formation en salle le samedi.", "De suivre la formation en ligne le jeudi.", "De ne pas s'inscrire à la formation.", "D'apprendre seuls à la bibliothèque."],
        "« une session en présentiel, le samedi matin… On s'inscrit ensemble ? — … d'accord »: the in-person course on Saturday. Online on Thursday is what she rejects; they do sign up; and the library is where the course takes place, not where they'd study alone.",
        { scene: "Two colleagues chatting at the coffee machine; relaxed.", A: v("fr-fr-advisor-4", "remy", "A colleague in his thirties, enthusiastic."), B: v("fr-fr-advisor-7", "vivienne", "A colleague in her thirties, honest and a little reluctant.") }),
      doc("B1", "Message sur répondeur", "Vous écoutez le message d'une garderie.", [
        ["A", "Bonjour, ici Nathalie, du centre de la petite enfance Les Bourgeons. Votre fils est maintenant le troisième sur notre liste d'attente. Une place pourrait se libérer en janvier, mais ce n'est pas garanti. Pour garder votre rang, vous devez confirmer votre intérêt avant le quinze novembre, par courriel. Sans réponse de votre part, nous passerons à la famille suivante."],
      ], "Que doivent faire les parents ?",
        ["Écrire au centre avant la mi-novembre.", "Inscrire leur fils en janvier.", "Appeler la famille suivante.", "Payer pour garder leur place."],
        "« vous devez confirmer votre intérêt avant le quinze novembre, par courriel »: write to the centre before mid-November. January is when a place might open, with no guarantee; the next family is who gets the place if they don't answer; and nothing is said about paying.",
        { scene: "A voicemail from a daycare centre in Québec; kind and clear.", A: v("fr-fr-concierge-6", "vivienne", "A daycare coordinator in her forties, kind and clear.") }),
      doc("B1", "Avis à la population", "Vous écoutez un avis de la Ville à la radio.", [
        ["A", "Avis à la population de Saint-Jérôme : à la suite d'un bris d'aqueduc, l'eau du robinet doit être bouillie pendant au moins une minute avant d'être bue. Vous pouvez l'utiliser sans la faire bouillir pour vous laver ou faire la lessive. L'avis restera en vigueur jusqu'à nouvel ordre ; la Ville publiera les mises à jour sur son site Internet."],
      ], "Que demande-t-on aux habitants ?",
        ["De faire bouillir l'eau qu'ils boivent.", "De ne plus se laver jusqu'à nouvel ordre.", "D'acheter de l'eau en bouteille.", "De ne pas faire la lessive."],
        "« l'eau du robinet doit être bouillie… avant d'être bue »: boil the water they drink. They can still use it unboiled to wash and do the laundry; « jusqu'à nouvel ordre » is how long the advisory lasts; and bottled water isn't mentioned.",
        { scene: "A public health announcement on a Québec radio station; serious and calm.", A: v("fr-fr-advisor-2", "jean", "A city announcer, serious and calm.") }),
      doc("B1", "Dialogue", "Une vétérinaire parle avec le propriétaire d'un chat.", [
        ["A", "Bon, votre chat n'a rien de grave : il a juste un peu trop mangé. Je vous conseille de lui donner des croquettes allégées et de réduire les portions."],
        ["B", "Et les friandises ? Il en mange au moins cinq par jour…"],
        ["A", "Une seule, le soir. Et jouez avec lui dix minutes par jour : il doit bouger davantage. On le pèse à nouveau dans un mois."],
      ], "Que conseille la vétérinaire ?",
        ["Faire perdre du poids au chat.", "Opérer le chat le mois prochain.", "Supprimer toutes les friandises.", "Donner cinq friandises par jour."],
        "Light food, smaller portions, one treat and play time all aim at the same thing: getting the cat to lose weight. They'll weigh him again in a month, with no operation; she keeps one treat a day, not none; and five a day is what he eats now.",
        { scene: "At a vet's surgery; friendly and practical.", A: v("fr-fr-tutor-4", "vivienne", "A vet in her forties, friendly and practical."), B: v("fr-fr-training-4", "remy", "A cat owner in his fifties, a little embarrassed.") }),
      doc("B1", "Entretien", "À la radio, un jeune apprenti parle de son métier.", [
        ["A", "Lucas, vous avez dix-neuf ans et vous êtes apprenti boulanger à Lyon. Pourquoi ce métier ?"],
        ["B", "Au lycée, tout le monde me poussait vers l'université. J'ai essayé un an de droit, mais j'étais malheureux. Ici, je me lève à quatre heures, c'est dur. Mais à sept heures, quand les premiers clients achètent le pain que j'ai fait de mes mains, je sais pourquoi je suis là."],
      ], "Qu'est-ce qui motive surtout Lucas ?",
        ["Voir le résultat concret de son travail.", "Se lever tôt le matin.", "Suivre les conseils de ses professeurs.", "Préparer des études de droit."],
        "« quand les premiers clients achètent le pain que j'ai fait de mes mains, je sais pourquoi je suis là »: seeing what his work produces. Getting up at four is the hard part; everyone at school pushed him towards university; and he left law after a year.",
        { scene: "A short interview on a French radio station about young workers; warm.", A: v("fr-fr-advisor-12", "vivienne", "A radio host, warm."), B: v("fr-fr-podcaster-4", "remy", "Lucas, an apprentice baker of nineteen, shy but sincere.") }),
      doc("B1", "Dialogue", "Deux amis préparent un voyage.", [
        ["A", "Pour la Gaspésie, on loue une voiture ? En autobus, il faut presque dix heures."],
        ["B", "Une voiture pour une semaine, avec l'essence, ça coûte cher. Et moi, je n'ai pas mon permis."],
        ["A", "Alors je conduirai. On partage les frais, et on s'arrête où on veut, à Percé, à Gaspé…"],
        ["B", "D'accord, mais on fait des pauses toutes les deux heures."],
      ], "Comment vont-ils voyager ?",
        ["En voiture de location.", "En autobus, pendant dix heures.", "En voiture, avec lui au volant.", "En train jusqu'à Gaspé."],
        "« on loue une voiture ? … Alors je conduirai » — « D'accord »: they'll rent a car. Ten hours is the bus journey they want to avoid; he has no licence, so she drives; and there's no train.",
        { scene: "Two friends planning a summer trip in Québec; relaxed.", A: v("fr-fr-csagent-3", "vivienne", "A woman in her twenties, decisive."), B: v("fr-fr-tutor-6", "remy", "A man in his twenties, careful about money.") }),
      doc("B1", "Information pratique", "Vous écoutez une chronique pour les nouveaux arrivants.", [
        ["A", "Vous venez de vous installer au Québec ? Votre permis de conduire étranger est valable pendant six mois. Après, il faut l'échanger contre un permis québécois. Si votre pays a une entente avec le Québec, comme la France ou la Belgique, l'échange est simple : pas d'examen. Sinon, vous devrez repasser l'examen théorique et l'examen pratique."],
      ], "Que doit faire un nouvel arrivant français après six mois ?",
        ["Échanger son permis, sans passer d'examen.", "Repasser les deux examens de conduite.", "Arrêter complètement de conduire au Québec.", "Garder son permis étranger encore six mois."],
        "France has an agreement with Québec, so « l'échange est simple : pas d'examen ». Both tests are only for countries without an agreement; nobody has to stop driving, just exchange the licence; and six months is how long the foreign licence is valid, not an extension.",
        { scene: "A practical information segment for newcomers on a Québec radio station; clear.", A: v("fr-fr-podcaster-8", "jean", "A radio presenter, clear and friendly.") }),

      /* ---------- B2 (items 20–29) ---------- */
      doc("B2", "Reportage", "Vous écoutez un reportage dans un repair café.", [
        ["A", "À Liège, chaque premier samedi du mois, une salle paroissiale se transforme en atelier : c'est le repair café. On y apporte un grille-pain, une lampe, un pantalon déchiré."],
        ["B", "Je ne répare pas à la place des gens : je répare avec eux. Ils tiennent le tournevis, je leur montre. La moitié repart avec un objet qui fonctionne, l'autre moitié repart déçue, mais en ayant compris pourquoi ça ne marche pas. Et ça, c'est peut-être le plus important : ils n'ont plus peur d'ouvrir les choses."],
      ], "Selon ce bénévole, qu'apporte surtout le repair café ?",
        ["L'envie d'oser réparer soi-même ses objets.", "La garantie de repartir avec un objet réparé.", "Des réparations faites gratuitement par des experts.", "Des objets d'occasion à prix réduit."],
        "« ils n'ont plus peur d'ouvrir les choses »: the confidence to repair their own things. Half the visitors leave with their object still broken, so nothing is guaranteed; he repairs « avec eux », not for them; and nothing is sold.",
        { scene: "A radio report from a repair café in Liège, Belgium; lively.", A: v("fr-fr-podcaster-11", "vivienne", "A radio reporter, lively."), B: v("fr-fr-podcaster-2", "remy", "A retired electrician in his sixties, patient and good-humoured.") }),
      doc("B2", "Entretien", "Un animateur interroge une conseillère d'orientation.", [
        ["A", "Vous accompagnez des gens qui changent de métier après quarante ans. Qu'est-ce qui les retient, le plus souvent ?"],
        ["B", "On croit que c'est l'argent. En réalité, c'est rarement ça : la plupart ont fait leurs calculs. Ce qui les bloque, c'est la peur de redevenir débutants, de ne plus être ceux qui savent. Un comptable de vingt ans d'expérience qui veut devenir menuisier, il va se retrouver à côté d'apprentis de dix-huit ans. Ceux qui réussissent sont ceux qui acceptent d'être maladroits pendant un temps."],
      ], "Selon la conseillère, quel est le principal frein au changement de métier ?",
        ["La crainte de perdre son statut d'expert.", "Le manque d'argent pendant la formation.", "La difficulté à trouver un apprentissage.", "L'âge des autres apprentis."],
        "« la peur de redevenir débutants, de ne plus être ceux qui savent »: the fear of losing their standing as the one who knows. Money is what people assume, but « c'est rarement ça »; finding an apprenticeship isn't mentioned; and the young apprentices are just who they'll work beside, not the obstacle.",
        { scene: "A radio interview about careers; warm and thoughtful.", A: v("fr-fr-podcaster-6", "remy", "A radio host, curious."), B: v("fr-fr-advisor-9", "vivienne", "A career counsellor in her fifties, warm and perceptive.") }),
      doc("B2", "Témoignage", "À la radio, une restauratrice raconte ses débuts.", [
        ["A", "Quand j'ai ouvert mon restaurant ivoirien à Sherbrooke, la banque m'a dit que personne ici ne mangerait de l'attiéké. Les premiers mois, elle avait presque raison : la salle était vide. Alors j'ai fait goûter mes plats au marché, le samedi, gratuitement. Les gens revenaient avec leurs amis. Aujourd'hui, la moitié de mes clients sont des Québécois qui n'ont jamais mis les pieds en Afrique. Le plus dur n'a pas été la recette. C'était de faire venir les gens jusqu'à la porte."],
      ], "Selon cette femme, quelle a été la principale difficulté ?",
        ["Faire découvrir son restaurant au public.", "Adapter ses recettes au goût québécois.", "Obtenir un prêt auprès de la banque.", "Trouver des produits africains au marché."],
        "« Le plus dur n'a pas été la recette. C'était de faire venir les gens jusqu'à la porte »: making her restaurant known. She never changed her recipes for local tastes; the bank only doubted her idea; and the market is where she gave free tastings, not where she shopped.",
        { scene: "A personal testimony on a Québec radio programme about entrepreneurs; proud and warm.", A: v("fr-fr-tutor-4", "vivienne", "A restaurant owner in her forties from Côte d'Ivoire, proud, warm and lively.") }),
      doc("B2", "Entretien", "Une journaliste interroge le directeur d'une station de ski.", [
        ["A", "Votre station de ski, dans les Laurentides, a ouvert ses pistes trois semaines plus tard que d'habitude. Est-ce que l'avenir du ski est menacé ?"],
        ["B", "Le ski, non. Le ski tel qu'on l'a connu, oui. On fabrique déjà de la neige sur presque toutes nos pistes, et ça coûte cher en eau et en électricité. Alors on se prépare : vélo de montagne, randonnée, festivals l'été. Dans dix ans, je pense qu'on fera la moitié de notre chiffre d'affaires hors de l'hiver. Ce n'est pas une défaite, c'est une adaptation."],
      ], "Quelle est l'attitude du directeur ?",
        ["Il s'adapte sans dramatiser.", "Il pense que le ski va disparaître.", "Il refuse de changer ses activités.", "Il compte sur la neige naturelle."],
        "« Ce n'est pas une défaite, c'est une adaptation »: he is changing the business calmly. He says skiing itself isn't threatened, only skiing « tel qu'on l'a connu »; he is moving into summer activities; and he already makes snow on almost every slope.",
        { scene: "A radio interview about tourism and climate in Québec; calm.", A: v("fr-fr-advisor-12", "vivienne", "A journalist, direct."), B: v("fr-fr-podcaster-12", "jean", "A ski resort director in his fifties, calm and pragmatic.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage dans le Grand Nord.", [
        ["A", "À Kuujjuaq, au Nunavik, une tête de laitue peut coûter huit dollars, quand on en trouve. Depuis deux ans, une serre communautaire chauffée produit des légumes toute l'année."],
        ["B", "Les gens pensent que le but, c'est de nourrir tout le village. On en est loin : on produit une petite partie de ce qu'on mange. Mais les enfants de l'école viennent planter, récolter, goûter. Certains n'avaient jamais vu une carotte sortir de la terre. Ce qu'on cultive surtout, ici, c'est l'habitude de manger frais."],
      ], "Selon la responsable, quel est le rôle principal de la serre ?",
        ["Donner aux jeunes le goût des légumes frais.", "Nourrir l'ensemble des habitants du village.", "Faire baisser le prix de la laitue.", "Vendre des légumes aux écoles."],
        "« Ce qu'on cultive surtout, ici, c'est l'habitude de manger frais », with the schoolchildren planting and tasting. Feeding the whole village is what people think, but « on en est loin »; the price of lettuce is only the background; and the children come to grow vegetables, not to buy them.",
        { scene: "A radio report from Nunavik, in northern Québec; warm.", A: v("fr-fr-advisor-4", "remy", "A radio reporter, warm and curious."), B: v("fr-fr-podcaster-1", "vivienne", "The greenhouse manager, a woman in her forties, enthusiastic and down-to-earth.") }),
      doc("B2", "Entretien", "Un journaliste interroge une enseignante.", [
        ["A", "Avec l'intelligence artificielle, un élève peut obtenir une dissertation en dix secondes. Faut-il en finir avec les devoirs écrits ?"],
        ["B", "Interdire l'outil, c'est perdu d'avance : ils l'ont dans leur poche. J'ai changé ma façon d'évaluer. Les élèves écrivent un premier jet en classe, à la main. Ensuite, ils peuvent utiliser l'intelligence artificielle à la maison, mais ils doivent me rendre aussi la conversation qu'ils ont eue avec elle, et m'expliquer ce qu'ils ont gardé ou rejeté. Ce que je note, maintenant, c'est leur jugement."],
      ], "Comment cette enseignante s'est-elle adaptée ?",
        ["Elle évalue leur esprit critique.", "Elle a interdit l'intelligence artificielle.", "Elle a supprimé tous les devoirs écrits.", "Elle laisse l'outil rédiger les devoirs."],
        "« Ce que je note, maintenant, c'est leur jugement »: what they kept or rejected from the AI's answers. She says banning it is « perdu d'avance »; the first draft is still written, in class, by hand; and they must explain their choices, so the tool doesn't do the work for them.",
        { scene: "A radio interview about schools and technology; lively.", A: v("fr-fr-tutor-7", "remy", "A journalist, slightly provocative."), B: v("fr-fr-advisor-7", "vivienne", "A secondary school teacher in her forties, energetic and practical.") }),
      doc("B2", "Entretien", "Une animatrice interroge un pédiatre.", [
        ["A", "Docteur Benali, faut-il interdire complètement les écrans aux enfants de moins de trois ans ?"],
        ["B", "Dans l'idéal, avant deux ans, on s'en passe. Mais je ne veux pas culpabiliser les parents épuisés qui mettent un dessin animé pour prendre leur douche. Le vrai problème, ce n'est pas dix minutes de dessin animé. C'est l'écran qui remplace la conversation : le parent sur son téléphone pendant le repas, la télévision allumée toute la journée. Un tout-petit apprend à parler parce qu'on lui parle."],
      ], "Que pense surtout le pédiatre ?",
        ["L'écran nuit s'il remplace l'échange.", "Il faut interdire tout écran avant trois ans.", "Les dessins animés aident les enfants à parler.", "Les parents épuisés sont de mauvais parents."],
        "« C'est l'écran qui remplace la conversation »: screens do harm when they take the place of talking. He says « dans l'idéal » before two, but refuses a strict ban and blames no tired parent; and children learn to talk « parce qu'on lui parle », not from cartoons.",
        { scene: "A radio interview about children's health; reassuring.", A: v("fr-fr-podcaster-9", "vivienne", "A radio host, warm."), B: v("fr-fr-training-4", "remy", "Doctor Benali, a paediatrician in his fifties, reassuring and clear.") }),
      doc("B2", "Témoignage", "À la radio, un retraité parle de son bénévolat.", [
        ["A", "Depuis ma retraite, je donne des cours de conversation aux nouveaux arrivants, deux soirs par semaine, à la bibliothèque de Laval. Au début, je préparais des leçons de grammaire, très sérieuses. Ça ne marchait pas : ils s'ennuyaient, et moi aussi. Un soir, une dame syrienne m'a demandé comment on dit « coriandre ». On a parlé de cuisine pendant une heure, et tout le monde a participé. Depuis, je les laisse choisir le sujet. J'ai appris que pour parler une langue, il faut d'abord avoir envie de dire quelque chose."],
      ], "Qu'a compris ce bénévole ?",
        ["L'envie de communiquer passe avant la grammaire.", "Les leçons de grammaire restent indispensables.", "Il faut parler surtout de cuisine en classe.", "Les nouveaux arrivants s'ennuient à la bibliothèque."],
        "« pour parler une langue, il faut d'abord avoir envie de dire quelque chose »: wanting to communicate comes before grammar. His grammar lessons « ne marchait pas »; cooking was only the topic of one evening, and now the learners choose; and they were bored by his lessons, not by the library.",
        { scene: "A personal testimony on a radio programme about volunteering; warm.", A: v("fr-fr-advisor-2", "remy", "A retired man in his seventies, warm and gently humorous.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage sur les inondations au Québec.", [
        ["A", "À Sainte-Marthe-sur-le-Lac, certaines maisons ont été inondées trois fois en dix ans. Le gouvernement propose maintenant de racheter ces maisons, plutôt que de payer leur reconstruction."],
        ["B", "Quand on m'a fait l'offre, j'étais furieux. Cette maison, c'est mon père qui l'a construite. Mais ma femme m'a dit : combien de fois tu veux encore vider le sous-sol à la chaudière ? Elle avait raison. On a accepté. Je n'ai pas gagné d'argent, mais je dors enfin pendant la fonte des neiges."],
      ], "Que ressent finalement cet habitant ?",
        ["Du soulagement, malgré ses regrets.", "De la colère contre le gouvernement.", "De la joie d'avoir fait un profit.", "Du regret d'avoir quitté son père."],
        "« je dors enfin pendant la fonte des neiges », though his father built the house: relief, despite his regrets. Anger was only his first reaction (« j'étais furieux »); he made no money; and his father built the house, but he hasn't left him.",
        { scene: "A radio report about flooding in Québec; serious and personal.", A: v("fr-fr-csagent-3", "vivienne", "A radio reporter, measured."), B: v("fr-fr-podcaster-8", "jean", "A homeowner in his sixties, gruff but moved.") }),
      doc("B2", "Entretien", "Un journaliste interroge une urbaniste.", [
        ["A", "On parle beaucoup de la ville du quart d'heure : tout avoir à quinze minutes à pied ou à vélo. Est-ce réaliste ?"],
        ["B", "Dans les quartiers centraux, c'est déjà presque le cas. Le défi, ce sont les banlieues construites pour la voiture, où il n'y a ni épicerie ni école à distance de marche. On ne va pas tout raser. Mais on peut autoriser un café, un médecin, une garderie au rez-de-chaussée des immeubles. Ce n'est pas une révolution : c'est revenir à la manière dont on construisait les villes il y a cent ans."],
      ], "Comment l'urbaniste présente-t-elle ce projet ?",
        ["Comme un retour aux villes d'autrefois.", "Comme une révolution totale de nos villes.", "Comme un projet réservé aux banlieues.", "Comme une idée impossible à réaliser."],
        "« Ce n'est pas une révolution : c'est revenir à la manière dont on construisait les villes il y a cent ans ». She denies it's a revolution; the suburbs are the main challenge, but the idea isn't only for them; and she shows how it can be done, so she doesn't call it impossible.",
        { scene: "A radio interview about urban planning; clear and engaged.", A: v("fr-fr-tutor-6", "remy", "A journalist, curious."), B: v("fr-fr-concierge-6", "vivienne", "An urban planner in her forties, clear and convinced.") }),

      /* ---------- C1 (items 30–35) ---------- */
      doc("C1", "Chronique", "Vous écoutez une chronique consommation à la radio.", [
        ["A", "Avant de choisir un restaurant, un plombier ou un dentiste, nous consultons les étoiles. C'est devenu un réflexe. Moi la première. Mais posez-vous la question : qui laisse un avis ? Le client ravi, parfois. Le client furieux, toujours. Entre les deux, la grande majorité silencieuse ne dit rien. Résultat, les notes ne mesurent pas la qualité, elles mesurent les émotions extrêmes. Prenez mon dentiste : trois étoiles, à cause d'un patient fâché d'avoir attendu dix minutes. Il est excellent. Et les commerçants l'ont compris : certains supplient leurs clients satisfaits de laisser cinq étoiles, d'autres en achètent. Une note, c'est une humeur, pas une mesure. Je ne vous dis pas d'ignorer les avis. Lisez-les comme on lit un témoignage, pas comme un verdict."],
      ], "Que recommande la chroniqueuse ?",
        ["Lire les avis avec un regard critique.", "Ne plus tenir compte des avis en ligne.", "Laisser davantage d'avis négatifs.", "Choisir les commerces les mieux notés."],
        "« Je ne vous dis pas d'ignorer les avis. Lisez-les comme on lit un témoignage, pas comme un verdict »: read them critically. She explicitly doesn't say to ignore them; she never asks for more negative reviews; and her dentist shows that a low rating can hide an excellent professional, so the best-rated aren't always the best.",
        { scene: "A consumer column on the radio; lively and ironic.", A: v("fr-fr-advisor-12", "vivienne", "A columnist in her forties, lively and a little ironic.") }),
      doc("C1", "Débat", "Une économiste et un intervenant communautaire débattent du revenu garanti.", [
        ["A", "Un revenu minimum garanti, versé à tous sans condition, simplifierait un système d'aide devenu illisible. Aujourd'hui, une personne en difficulté doit remplir dix formulaires pour obtenir trois aides différentes. J'ai vu des familles perdre leurs aides pour une case mal cochée. Et on économiserait des millions en frais de gestion."],
        ["B", "Sur la simplification, je vous suis entièrement. Ce qui m'inquiète, c'est le montant. Si on fusionne toutes les aides en un seul chèque modeste, ceux qui ont aujourd'hui des besoins particuliers, une personne handicapée par exemple, risquent d'y perdre. Je le vois chaque semaine dans mon organisme. Un revenu garanti, oui, mais pas s'il sert de prétexte pour faire des économies sur le dos des plus fragiles."],
      ], "Quelle réserve exprime l'intervenant communautaire ?",
        ["Les plus vulnérables pourraient recevoir moins.", "Le système actuel est déjà assez simple.", "Le revenu garanti coûterait trop cher à l'État.", "Les aides devraient être versées sans condition."],
        "« ceux qui ont… des besoins particuliers… risquent d'y perdre »: the most vulnerable could end up with less. He fully agrees on simplifying (« je vous suis entièrement »); he never talks about the cost to the state; and paying aid without conditions is the economist's idea, not his reservation.",
        { scene: "A radio debate about social policy; courteous and dense.", A: v("fr-fr-podcaster-5", "vivienne", "An economist in her forties, confident and clear."), B: v("fr-fr-advisor-4", "remy", "A community worker in his fifties, warm but firm.") }),
      doc("C1", "Entretien", "Un journaliste interroge une sociologue.", [
        ["A", "Près d'un travailleur sur cinq a des horaires de nuit ou décalés. Vous avez étudié leur quotidien. Vous en avez rencontré plus de deux cents. Qu'est-ce qui vous a frappée ?"],
        ["B", "On parle beaucoup de la fatigue, et elle est réelle. Mais ce qui revient dans tous les entretiens, c'est autre chose : le sentiment de vivre à côté des autres. Le repas de famille a lieu pendant qu'ils dorment, la fête d'anniversaire pendant qu'ils travaillent. Ils sont là, mais décalés, comme dans un fuseau horaire différent. Ce n'est pas qu'ils manquent de sommeil ; c'est qu'ils manquent de moments partagés. Et ça, aucune prime de nuit ne le compense."],
      ], "Selon la sociologue, qu'est-ce qui pèse le plus sur ces travailleurs ?",
        ["Être coupés de la vie sociale et familiale.", "Le manque chronique de sommeil réparateur.", "Des primes de nuit bien trop faibles.", "La fatigue qui s'accumule au fil des nuits."],
        "« le sentiment de vivre à côté des autres… ce n'est pas qu'ils manquent de sommeil ; c'est qu'ils manquent de moments partagés »: being cut off from family and social life. She grants fatigue is real but says something else comes up in every interview; lack of sleep is what she sets aside; and she says no night bonus could make up for it, not that bonuses are too low.",
        { scene: "A radio interview with a sociologist; calm and thoughtful.", A: v("fr-fr-podcaster-2", "remy", "A journalist, attentive."), B: v("fr-fr-tutor-4", "vivienne", "A sociologist in her fifties, calm, precise and empathetic.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique économique à la radio.", [
        ["A", "« Livraison gratuite. » Deux mots magiques. Ma voisine reçoit trois colis par jour. Pourtant, un colis qui traverse la ville pour vous apporter une paire de chaussettes coûte bien quelque chose : du carburant, un livreur payé à la course, souvent mal, et un emballage que vous jetterez dans trente secondes. Si vous ne le payez pas, quelqu'un d'autre le paie. Le commerçant, qui augmente discrètement ses prix. Le livreur, qui court. La ville, qui gère les camionnettes en double file. Ce sont des coûts invisibles, mais bien réels. Ce n'est pas un reproche, c'est un constat. Je ne vous demande pas de renoncer aux achats en ligne. Je vous demande seulement de ne plus croire que ce qui est gratuit ne coûte rien."],
      ], "Quel est le message du chroniqueur ?",
        ["La gratuité de la livraison n'est qu'une illusion.", "Il faut arrêter d'acheter sur Internet.", "Les livreurs devraient être mieux payés.", "Les commerçants baissent leurs prix en ligne."],
        "« Si vous ne le payez pas, quelqu'un d'autre le paie… ne plus croire que ce qui est gratuit ne coûte rien »: free delivery is an illusion. He explicitly doesn't ask you to stop buying online; badly paid couriers are one hidden cost, not his main point; and shops raise their prices, they don't lower them.",
        { scene: "An economics column on the radio; sharp and ironic.", A: v("fr-fr-podcaster-4", "remy", "A columnist in his forties, sharp and ironic.") }),
      doc("C1", "Entretien", "Un journaliste interroge une archéologue.", [
        ["A", "À Lyon comme à Montréal, chaque fois qu'un chantier découvre des vestiges, les travaux s'arrêtent, et les promoteurs s'impatientent. Les archéologues freinent-ils le développement des villes ?"],
        ["B", "Je comprends l'agacement : un retard coûte cher. Je ne nie pas qu'il y ait eu des abus, de part et d'autre. Mais regardez les chiffres : dans la très grande majorité des cas, nos fouilles durent quelques semaines, et elles sont prévues dès le départ. Les vrais blocages arrivent quand on découvre les vestiges par surprise, parce que personne n'a fait de diagnostic avant de creuser. Dans ces cas-là, oui, le chantier peut attendre des mois. Autrement dit, le problème n'est pas l'archéologie. C'est l'archéologie qu'on n'a pas voulu prévoir."],
      ], "Quelle est la position de l'archéologue ?",
        ["Mieux planifier les fouilles.", "Les promoteurs ont raison d'être impatients.", "Les fouilles devraient durer plus longtemps.", "Il faudrait arrêter de creuser en ville."],
        "« Les vrais blocages arrivent quand on découvre les vestiges par surprise… le problème, c'est l'archéologie qu'on n'a pas voulu prévoir »: plan the digs ahead and most delays disappear. She understands the developers' irritation without saying they're right; she says most digs last only a few weeks; and she never suggests stopping building.",
        { scene: "A radio interview about cities and heritage; measured.", A: v("fr-fr-advisor-2", "remy", "A journalist, slightly provocative."), B: v("fr-fr-advisor-9", "vivienne", "An archaeologist in her fifties, measured and precise.") }),
      doc("C1", "Conférence", "Vous écoutez un extrait de conférence de philosophie.", [
        ["A", "En 1880, Paul Lafargue publiait un pamphlet au titre provocateur : Le Droit à la paresse. On le cite souvent pour rire, comme un éloge de la sieste. C'est un contresens. Le livre a connu un succès immense, surtout chez ceux qui ne l'ont pas lu. Lafargue, lui, ne riait pas. Son titre est une provocation, pas un programme. Il ne défendait pas l'inaction ; il dénonçait une société qui avait fait du travail une valeur morale, au point que les ouvriers eux-mêmes réclamaient, en 1848, le droit au travail. Sa question reste d'actualité : travaillons-nous pour vivre, ou vivons-nous pour travailler ? Et si nos machines produisent toujours plus, pourquoi travaillons-nous toujours autant ?"],
      ], "Selon le conférencier, que dénonçait réellement Lafargue ?",
        ["Le culte du travail érigé en vertu.", "Le manque de sieste chez les ouvriers.", "L'arrivée des machines dans les usines.", "Les ouvriers qui refusaient de travailler."],
        "« il dénonçait une société qui avait fait du travail une valeur morale »: the cult of work raised into a virtue. Reading the book as praise of naps is the « contresens » the speaker points out; machines come into his own closing question, not Lafargue's target; and the workers he mentions were demanding work, not refusing it.",
        { scene: "An extract from a philosophy lecture; elegant and lively.", A: v("fr-fr-concierge-4", "remy", "A philosopher in his sixties, elegant, with a touch of humour.") }),

      /* ---------- C2 (items 36–39) ---------- */
      doc("C2", "Chronique", "Vous écoutez une chronique humoristique à la radio.", [
        ["A", "J'ai participé cette semaine à une réunion passionnante. Elle avait pour objectif de préparer la réunion de jeudi, laquelle devait valider l'ordre du jour de la grande réunion du mois prochain. Nous étions douze. Un record. Trois parlaient, deux prenaient des notes, et les sept autres, caméras éteintes, répondaient probablement à leurs courriels, ce qui est, il faut le reconnaître, une forme de productivité. À la fin, nous avons décidé, à l'unanimité, de nous revoir. Le tout a duré une heure et quart. Le café, lui, était excellent. J'ai pris des notes, moi aussi : elles tiennent sur un ticket de métro. Je ne dis pas que les réunions sont inutiles. Certaines ont même abouti à une décision ; on m'en a parlé. Mais je propose une règle simple : toute réunion qui ne produit rien devra produire, au minimum, un compte rendu expliquant pourquoi."],
      ], "Que laisse entendre la chroniqueuse ?",
        ["Beaucoup de réunions ne servent à rien.", "Les réunions sont toujours très productives.", "Les comptes rendus devraient être supprimés.", "Il faudrait inviter davantage de participants."],
        "The column is ironic: a « passionnante » meeting to prepare a meeting about a meeting, decisions she has only heard of (« on m'en a parlé »), and a rule that useless meetings must at least produce a report. She means many meetings achieve nothing. Calling them productive is the irony; she mockingly asks for more reports, not fewer; and more people would only make it worse.",
        { scene: "A satirical column on the radio; dry and ironic, at a natural pace.", A: v("fr-fr-advisor-7", "vivienne", "A columnist in her forties, dry and deadpan, with perfect timing.") }),
      doc("C2", "Lecture", "Vous écoutez la lecture d'un extrait de roman.", [
        ["A", "Monsieur Lemieux avait accepté l'offre un mardi, sans discuter le prix. Le jeune couple était revenu deux fois, la deuxième avec un mètre et des projets plein la bouche : abattre ce mur, agrandir cette fenêtre, refaire la cuisine. Il avait hoché la tête à chaque fois. Le soir du départ, il fit le tour des pièces vides. Il vérifia deux fois que le robinet était bien fermé. La maison sentait encore la cire. Sur le cadre de la porte de la cuisine, les traits de crayon étaient toujours là, avec les prénoms et les dates : Julie, sept ans ; Marc, neuf ans ; Julie, douze ans. Il sortit un petit couteau de sa poche, hésita longtemps, puis le rangea. Il éteignit la lumière et laissa la porte de la cuisine ouverte, comme on laisse un livre à la page où quelqu'un d'autre reprendra la lecture."],
      ], "Que laisse deviner l'attitude de monsieur Lemieux ?",
        ["Il accepte de confier sa maison à d'autres vies.", "Il regrette d'avoir vendu sa maison si peu cher.", "Il veut emporter le cadre de la porte avec lui.", "Il s'oppose aux travaux prévus par le couple."],
        "He thinks of cutting out the height marks but puts the knife away, and leaves the door open « comme on laisse un livre à la page où quelqu'un d'autre reprendra la lecture »: he accepts that the house will go on with other lives. He accepted the price « sans discuter »; the knife hints he might take the marks, but he doesn't; and he nods at the couple's plans.",
        { scene: "A reading from a novel on a literary radio programme; intimate and restrained.", A: v("fr-fr-podcaster-8", "remy", "A reader in his fifties, warm, intimate and unhurried.") }),
      doc("C2", "Débat", "Une sociologue et un philosophe débattent de la méritocratie.", [
        ["A", "La méritocratie est une belle promesse : chacun obtient la place qu'il mérite par ses efforts. Je ne suis pas contre l'effort, entendons-nous bien. Le problème, c'est que les enfants n'arrivent pas tous à la ligne de départ avec les mêmes chaussures. Les enquêtes le montrent : à talent égal, l'enfant de cadre a deux fois plus de chances d'accéder aux grandes écoles. Ce n'est pas un détail, c'est un système."],
        ["B", "Je ne conteste aucun de vos chiffres. Mais faut-il pour autant jeter l'idée ? Sans elle, que reste-t-il ? Le piston, l'héritage, le hasard de la naissance. La méritocratie est mal appliquée, j'en conviens. C'est une raison de la réparer, pas de l'abandonner. Le danger, c'est plutôt la version arrogante : celle où ceux qui ont réussi se persuadent qu'ils ne doivent rien à personne. Or personne ne réussit seul."],
      ], "Quelle position défend le philosophe ?",
        ["L'idéal reste valable, mais doit être mieux appliqué.", "Les inégalités de départ sont un mythe.", "Le mérite n'a aucune valeur réelle.", "Ceux qui réussissent ne doivent rien à personne."],
        "« C'est une raison de la réparer, pas de l'abandonner »: the ideal stands but must be better applied. He accepts all the figures on unequal starts; he defends merit against « le piston, l'héritage, le hasard de la naissance »; and « ils ne doivent rien à personne » is the arrogant version he calls a danger.",
        { scene: "A radio debate on society; dense, at a natural pace.", A: v("fr-fr-podcaster-11", "vivienne", "A sociologist in her forties, quick and incisive."), B: v("fr-fr-podcaster-6", "remy", "A philosopher in his sixties, calm, measured and courteous.") }),
      doc("C2", "Conférence", "Vous écoutez un extrait de conférence de sociologie.", [
        ["A", "Nous avons conquis le temps libre. Les congés payés, la semaine de quarante heures, puis de trente-cinq : chacune de ces victoires a été arrachée de haute lutte. Mais regardez ce que nous en faisons. Nos grands-parents se reposaient le dimanche ; nous, nous nous entraînons. Le week-end est devenu un programme : courir dix kilomètres, apprendre l'italien, visiter trois expositions, et publier les preuves. Le lundi, on se raconte ses exploits comme on remettrait un rapport. Même le repos doit être mesuré : on compte ses heures de sommeil sur une montre. Le loisir, qui devait nous libérer de la performance, en est devenu une nouvelle scène. Je ne regrette pas ces conquêtes, au contraire. Je dis seulement qu'un temps libre où il faut tout optimiser n'est plus tout à fait libre. La dernière liberté à reconquérir, c'est peut-être celle de ne rien faire de remarquable."],
      ], "Quelle idée défend la conférencière ?",
        ["Le loisir est devenu une nouvelle forme d'obligation.", "Les congés payés étaient une erreur historique.", "Il faudrait travailler davantage le week-end.", "Le temps libre a toujours été un privilège."],
        "« Le loisir, qui devait nous libérer de la performance, en est devenu une nouvelle scène »: free time has become a new obligation. She says « Je ne regrette pas ces conquêtes, au contraire »; she never asks for more work at weekends; and she presents free time as a conquest, not as something that was always a privilege.",
        { scene: "An extract from a sociology lecture; elegant and lively.", A: v("fr-fr-podcaster-1", "vivienne", "A sociologist in her fifties, elegant, lively and slightly ironic.") }),
    ],
  }, {
    id: "co-exam-4",
    title: "Examen blanc 4",
    items: [
      /* ---------- A1: pictures (items 1–4) ---------- */
      pic(ART.skier, "Un homme en tuque fait du ski de fond dans la neige, près d'un sapin.",
        ["Il fait du vélo en forêt.", "Il nage dans un lac.", "Il fait du ski de fond.", "Il joue au hockey sur la glace."], 2,
        "The man in a tuque is gliding on skis with poles, in the snow: « Il fait du ski de fond ». There's no bike (A), no lake (B), and no rink or hockey stick (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-advisor-4", "remy", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.picnic, "Deux personnes pique-niquent sur une couverture au bord d'un lac ; un canot flotte sur l'eau.",
        ["Ils pique-niquent au bord du lac.", "Ils font la vaisselle à la maison.", "Ils attendent l'autobus en ville.", "Ils dorment sous une tente."], 0,
        "Two people sit on a blanket with a basket, by a lake with a canoe: « Ils pique-niquent au bord du lac ». They're outdoors, not washing up at home (B), there's no bus or town (C), and no tent (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-advisor-12", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.painter, "Une femme repeint un mur avec un rouleau ; une échelle est posée à côté.",
        ["Bonne route, et soyez prudents !", "Tu peux me passer le sel ?", "Le train part dans cinq minutes !", "Attention, la peinture est fraîche !"], 3,
        "The woman is painting a wall with a roller, next to a ladder, so she might warn: « Attention, la peinture est fraîche ! ». Nobody is setting off by car (A), there's no table or meal (B), and no station (C).",
        { scene: "A listening test item: four short things someone might say, read slowly and clearly.", N: v("fr-fr-podcaster-9", "vivienne", "A clear, slow test voice, with a short pause after each statement.") }),
      pic(ART.market, "Une femme achète des pommes à un étal de marché ; un panneau indique 1,50 $.",
        ["Elle vend des légumes au marché.", "Elle achète des pommes au marché.", "Elle cueille des pommes dans un verger.", "Elle fait un gâteau aux pommes."], 1,
        "The woman stands in front of a market stall with a bag, reaching for the apples: « Elle achète des pommes au marché ». She's the customer, not the seller (A), it's a stall, not an orchard (C), and she isn't baking (D).",
        { scene: "A listening test item: four short statements about a picture, read slowly and clearly.", N: v("fr-fr-training-4", "remy", "A clear, slow test voice, with a short pause after each statement.") }),

      /* ---------- A2: a question and four replies (items 5–7) ---------- */
      reply("Est-ce que je peux payer par carte ?",
        ["La carte du restaurant est en anglais.", "Ça fait vingt-deux dollars.", "Le guichet est fermé le dimanche.", "Bien sûr, le terminal est juste ici."], 3,
        "The customer asks whether paying by card is possible: « Bien sûr, le terminal est juste ici ». A reuses « carte » to mean the menu, B gives the price, and C talks about a ticket office's hours.",
        { scene: "At a shop counter: a customer asks a question, then four possible replies.", A: v("fr-fr-podcaster-4", "remy", "A customer asking politely."), B: v("fr-fr-csagent-3", "vivienne", "A cashier; four short replies read one by one, with a pause after each.") }),
      reply("Tu as fini ton rapport pour demain ?",
        ["Presque, il me reste la conclusion.", "Demain, je travaille de la maison.", "C'est le rapport de l'an dernier.", "Je l'ai acheté à la librairie."], 0,
        "« Tu as fini…? » asks whether the report is done: « Presque, il me reste la conclusion ». B reuses « demain » to say where the speaker works, C reuses « rapport » to talk about an old one, and D talks about buying something.",
        { scene: "Two colleagues at the office: a question, then four possible replies.", A: v("fr-fr-advisor-7", "vivienne", "A colleague asking quickly."), B: v("fr-fr-tutor-7", "remy", "Four short replies read one by one, with a pause after each.") }),
      reply("Pardon, il y a une pharmacie près d'ici ?",
        ["Je prends ce médicament le soir.", "Le médecin est en vacances.", "Oui, au coin de la rue, à gauche.", "Non, je ne suis pas malade."], 2,
        "The question asks whether there's a pharmacy nearby: « Oui, au coin de la rue, à gauche ». A says when the speaker takes a medicine, B talks about a doctor, and D says the speaker isn't ill.",
        { scene: "In the street: a passer-by asks a question, then four possible replies.", A: v("fr-fr-podcaster-12", "remy", "A passer-by asking politely."), B: v("fr-fr-podcaster-5", "vivienne", "Four short replies read one by one, with a pause after each.") }),

      /* ---------- A2: short documents (items 8–10) ---------- */
      doc("A2", "Message sur répondeur", "Une bibliothèque laisse un message à une abonnée.", [
        ["A", "Bonjour, c'est la bibliothèque Gabrielle-Roy. Le livre que vous avez réservé, « Le Petit Prince », est arrivé. Il vous attend au comptoir des prêts pendant cinq jours. N'oubliez pas votre carte d'abonné. Bonne journée !"],
      ], "Qu'est-ce que la bibliothèque annonce ?",
        ["Le livre réservé est disponible.", "La carte d'abonné est expirée.", "Le livre doit être rendu dans cinq jours.", "La bibliothèque sera fermée cinq jours."],
        "« Le livre que vous avez réservé… est arrivé. Il vous attend au comptoir des prêts »: it's ready to collect. Nothing says the card has expired; five days is how long the book is kept for her, not when to return it, and not a closure.",
        { scene: "A voicemail from a public library in Québec City; friendly.", A: v("fr-fr-tutor-4", "vivienne", "A librarian, friendly and clear.") }),
      doc("A2", "Annonce", "Vous entendez une annonce à la gare du traversier.", [
        ["A", "Avis aux passagers du traversier Québec–Lévis : à cause des glaces sur le fleuve, le départ de dix heures est retardé de trente minutes. Le traversier partira donc à dix heures trente. Nous nous excusons pour ce retard."],
      ], "À quelle heure part le traversier ?",
        ["À 10 h 30", "À 10 h", "À 9 h 30", "À 11 h 30"],
        "« le départ de dix heures est retardé de trente minutes. Le traversier partira donc à dix heures trente ». 10 a.m. was the planned time; 9.30 and 11.30 are never said.",
        { scene: "An announcement at the Québec–Lévis ferry terminal; calm.", A: v("fr-fr-concierge-4", "jean", "A ferry terminal announcer, calm and clear.") }),
      doc("A2", "Dialogue", "Deux collègues parlent d'un cadeau de départ.", [
        ["A", "Pour le départ de Sylvain, on lui offre quoi ? Un livre ?"],
        ["B", "Il a déjà trop de livres. Il part vivre à Vancouver… Pourquoi pas un bon pour un cours de kayak ? Il adore l'eau."],
        ["A", "Excellente idée ! Je m'occupe de la carte, tu achètes le cadeau."],
      ], "Que vont-ils offrir à Sylvain ?",
        ["Une activité sur l'eau.", "Un livre sur Vancouver.", "Une carte de vœux.", "Un billet d'avion."],
        "« Pourquoi pas un bon pour un cours de kayak ? … — Excellente idée ! »: an activity on the water. He already has too many books; the card goes with the present, it isn't the present; and Vancouver is where he's moving, with no plane ticket mentioned.",
        { scene: "Two colleagues planning a leaving present at work; cheerful.", A: v("fr-fr-podcaster-11", "vivienne", "A colleague in her thirties, cheerful."), B: v("fr-fr-advisor-2", "remy", "A colleague in his forties, thoughtful.") }),

      /* ---------- B1 (items 11–19) ---------- */
      doc("B1", "Conversation téléphonique", "Une recruteuse appelle un candidat.", [
        ["A", "Bonjour, monsieur Haddad, ici Claire Dubois, de l'entreprise Novatec. Nous devions nous voir mardi pour votre entrevue, mais notre directrice sera absente. Pouvez-vous venir jeudi à dix heures à la place ?"],
        ["B", "Jeudi matin, j'ai un cours de francisation… Est-ce qu'on pourrait faire l'entrevue par vidéo, jeudi après-midi ?"],
        ["A", "Oui, aucun problème. Je vous envoie le lien par courriel."],
      ], "Comment se passera l'entrevue ?",
        ["En ligne, le jeudi après-midi.", "Dans les bureaux, le mardi.", "Dans les bureaux, jeudi à dix heures.", "Par téléphone, le jeudi matin."],
        "« Est-ce qu'on pourrait faire l'entrevue par vidéo, jeudi après-midi ? — Oui, aucun problème »: online, on Thursday afternoon. Tuesday was the first date; Thursday at ten is the recruiter's offer, which he can't take; and nobody mentions the phone.",
        { scene: "A phone call from a recruiter in Montréal; polite and professional.", A: v("fr-fr-advisor-9", "vivienne", "A recruiter in her thirties, polite and efficient."), B: v("fr-fr-podcaster-6", "remy", "Monsieur Haddad, a candidate in his thirties, polite and a little careful.") }),
      doc("B1", "Annonce à la radio", "Vous écoutez une annonce sur une radio locale.", [
        ["A", "Le marché fermier du samedi déménage ! À partir du six mai, les producteurs s'installeront dans le stationnement de l'aréna, et non plus sur la place de l'église, devenue trop petite. Les heures ne changent pas : de huit heures à midi. Et nouveauté : une navette gratuite partira du centre-ville toutes les vingt minutes."],
      ], "Qu'est-ce qui change pour le marché ?",
        ["Il se tiendra à un autre endroit.", "Il ouvrira plus tôt le matin.", "Il aura lieu le dimanche.", "Il restera sur la place de l'église."],
        "« les producteurs s'installeront dans le stationnement de l'aréna, et non plus sur la place de l'église »: it moves somewhere else. The hours stay the same, it's still on Saturday, and leaving the church square is exactly what changes.",
        { scene: "A local radio announcement; cheerful.", A: v("fr-fr-podcaster-8", "remy", "A radio presenter, cheerful and clear.") }),
      doc("B1", "Dialogue", "Deux colocataires parlent des tâches ménagères.", [
        ["A", "Écoute, Max, je fais toujours la vaisselle, et toi, tu sors les poubelles une fois par semaine. Ce n'est pas très équitable."],
        ["B", "C'est vrai… Et si on faisait un tableau ? Chacun choisit ses tâches, et on change tous les mois."],
        ["A", "D'accord, mais la salle de bain, on la fait à tour de rôle, une semaine chacun."],
        ["B", "Ça marche."],
      ], "Que décident les deux colocataires ?",
        ["De partager les tâches.", "Que Max fera désormais la vaisselle.", "D'engager quelqu'un pour le ménage.", "De ne plus sortir les poubelles."],
        "A rota where each picks tasks, swapped every month, and the bathroom in turns: they'll share the chores more fairly. Washing up is what she always does now, and nothing says Max takes it over; nobody mentions hiring help; and the bins still have to go out.",
        { scene: "Two flatmates talking in their kitchen; frank but friendly.", A: v("fr-fr-podcaster-1", "vivienne", "A flatmate in her twenties, frank and fair."), B: v("fr-fr-podcaster-2", "remy", "Max, a flatmate in his twenties, a little guilty.") }),
      doc("B1", "Message sur répondeur", "Vous écoutez le message d'une université.", [
        ["A", "Bonjour, ici le bureau du registraire de l'Université Laval. Votre dossier d'admission est presque complet, mais il manque la traduction officielle de votre diplôme. Sans ce document, nous ne pourrons pas confirmer votre inscription. Vous avez jusqu'au premier juin pour le déposer sur votre portail étudiant. Si vous avez des questions, écrivez-nous plutôt que de vous déplacer."],
      ], "Que demande le bureau du registraire ?",
        ["Envoyer un document traduit.", "Traduire soi-même son diplôme.", "Venir s'inscrire en personne.", "Payer ses frais avant juin."],
        "« il manque la traduction officielle de votre diplôme… pour le déposer sur votre portail étudiant »: send in a translated document. It must be an official translation; the office asks people to write rather than come in; and nothing is said about fees.",
        { scene: "A voicemail from a university registrar's office in Québec City; formal and clear.", A: v("fr-fr-advisor-12", "vivienne", "A university administrator, formal and clear.") }),
      doc("B1", "Information pratique", "Vous écoutez un rappel à la radio.", [
        ["A", "N'oubliez pas : dans la nuit de samedi à dimanche, nous passons à l'heure d'hiver. À trois heures du matin, il sera deux heures. Vous dormirez donc une heure de plus. La plupart des téléphones changent d'heure tout seuls, mais pensez à régler le four, la voiture et les réveils. Et profitez-en pour vérifier les piles de vos détecteurs de fumée."],
      ], "Que conseille-t-on aux auditeurs ?",
        ["De régler à la main certains appareils.", "De se coucher une heure plus tôt.", "D'acheter un nouveau détecteur de fumée.", "De changer l'heure de leur téléphone."],
        "« pensez à régler le four, la voiture et les réveils »: set some devices by hand. They'll sleep an hour more, so there's no need to go to bed earlier; they're asked to check the batteries, not buy a detector; and phones change by themselves.",
        { scene: "A practical reminder on a Québec radio station; light.", A: v("fr-fr-podcaster-5", "vivienne", "A radio presenter, light and friendly.") }),
      doc("B1", "Dialogue", "Une nouvelle arrivante ouvre un compte à la banque.", [
        ["A", "Pour ouvrir un compte, il me faut une pièce d'identité avec photo et une preuve d'adresse. Votre passeport, c'est parfait."],
        ["B", "Pour l'adresse, je viens d'arriver… Je n'ai pas encore de facture à mon nom."],
        ["A", "Votre bail fera l'affaire. Vous pouvez me l'envoyer par courriel cet après-midi, et le compte sera ouvert dès demain."],
      ], "Que doit encore fournir la cliente ?",
        ["Son bail de logement.", "Son passeport valide.", "Une facture à son nom.", "Une photo d'identité."],
        "« Votre bail fera l'affaire »: her lease. Her passport is already accepted (« c'est parfait »); she has no bill in her name yet, which is why the lease will do instead; and the photo ID is the passport.",
        { scene: "At a bank in Montréal: a newcomer opens an account; polite.", A: v("fr-fr-advisor-4", "remy", "A bank adviser in his forties, helpful and efficient."), B: v("fr-fr-csagent-3", "vivienne", "A newcomer in her thirties, a little worried.") }),
      doc("B1", "Entretien", "À la radio, un pompier volontaire parle de son engagement.", [
        ["A", "Martin, vous êtes pompier volontaire dans un village de la Beauce. Comment ça fonctionne ?"],
        ["B", "J'ai un autre emploi : je suis électricien. Mais quand mon téléavertisseur sonne, je laisse tout et je pars, même la nuit. On intervient surtout pour des accidents de la route, rarement pour des incendies. Ce qui me fait rester, après quinze ans, c'est que je connais presque tous les gens que j'aide."],
      ], "Pourquoi Martin continue-t-il ce travail ?",
        ["Pour les gens qu'il aide.", "Pour le salaire de pompier volontaire.", "Parce qu'il aime combattre les incendies.", "Parce qu'il n'a pas d'autre emploi."],
        "« Ce qui me fait rester… c'est que je connais presque tous les gens que j'aide »: the people he helps. No pay is mentioned; fires are rare, most calls are road accidents; and he has another job, as an electrician.",
        { scene: "A short interview on a Québec regional radio station; warm.", A: v("fr-fr-podcaster-9", "vivienne", "A radio host, warm."), B: v("fr-fr-podcaster-12", "jean", "Martin, a volunteer firefighter in his forties, modest and calm.") }),
      doc("B1", "Dialogue", "Deux parents choisissent une activité pour leur fille.", [
        ["A", "Pour Léa, on l'inscrit au soccer ou à la natation, cet automne ?"],
        ["B", "Elle a dit qu'elle voulait faire du soccer comme ses amies. Mais les entraînements sont le mardi et le jeudi, et je finis tard ces jours-là."],
        ["A", "Moi, je peux l'emmener le mardi. Et le jeudi, la mère de Chloé propose de faire du covoiturage."],
        ["B", "Alors c'est réglé, on l'inscrit au soccer."],
      ], "Que vont faire les parents ?",
        ["Inscrire Léa au sport qu'elle veut.", "Inscrire Léa à la natation.", "Attendre l'hiver pour l'inscrire.", "Demander à Chloé de jouer au soccer."],
        "« Alors c'est réglé, on l'inscrit au soccer », the sport Léa wanted. Swimming was the other option; they sign her up this autumn, not later; and Chloé's mother offers to drive, but nobody asks Chloé to play.",
        { scene: "Two parents talking in the evening at home; relaxed.", A: v("fr-fr-tutor-6", "remy", "A father in his thirties, practical."), B: v("fr-fr-advisor-7", "vivienne", "A mother in her thirties, busy but organised.") }),
      doc("B1", "Bulletin d'information", "Vous écoutez les nouvelles locales à la radio.", [
        ["A", "La Société de transport de Laval lance une nouvelle ligne d'autobus de nuit à partir du lundi douze février. Elle reliera la station de métro Montmorency au cégep et à l'hôpital, toutes les trente minutes, de minuit à cinq heures du matin. Le service vise surtout les travailleurs de nuit, qui devaient jusqu'ici prendre un taxi. Le tarif reste le même que le jour."],
      ], "À qui s'adresse surtout ce nouveau service ?",
        ["Aux employés aux horaires de nuit.", "Aux étudiants qui sortent du cégep.", "Aux chauffeurs de taxi de Laval.", "Aux voyageurs qui vont à l'aéroport."],
        "« Le service vise surtout les travailleurs de nuit, qui devaient jusqu'ici prendre un taxi ». The cégep is one of the stops, not the main target; taxis are what night workers used before; and the airport isn't on the route.",
        { scene: "A local news brief on a Laval radio station; clear.", A: v("fr-fr-concierge-6", "vivienne", "A radio newsreader, clear and neutral.") }),

      /* ---------- B2 (items 20–29) ---------- */
      doc("B2", "Reportage", "Vous écoutez un reportage dans une école.", [
        ["A", "Dans cette école de Montpellier, la cour en goudron a laissé place à une mini-forêt : trois cents arbres plantés serrés, sur l'équivalent de deux terrains de tennis."],
        ["B", "On l'a fait d'abord pour la chaleur : en juin, la cour atteignait quarante degrés. Ça marche, il fait nettement plus frais. Mais ce qui nous a surpris, c'est le reste. Les disputes ont beaucoup diminué à la récréation. Les enfants ne se battent plus pour le terrain de foot : ils construisent des cabanes, ils observent les insectes. On voulait de l'ombre, on a eu du calme."],
      ], "Qu'est-ce qui a surpris la directrice ?",
        ["Les élèves se disputent moins.", "La cour est beaucoup plus fraîche.", "Les enfants jouent davantage au foot.", "Les arbres ont poussé très vite."],
        "« ce qui nous a surpris, c'est le reste. Les disputes ont beaucoup diminué… On voulait de l'ombre, on a eu du calme ». The cooler yard was the goal, not the surprise; the children no longer fight over the football pitch and build huts instead; and nothing is said about how fast the trees grew.",
        { scene: "A radio report from a primary school in the south of France; lively.", A: v("fr-fr-tutor-7", "remy", "A radio reporter, lively."), B: v("fr-fr-podcaster-11", "vivienne", "A school principal in her forties, enthusiastic and precise.") }),
      doc("B2", "Entretien", "Une journaliste interroge une étudiante qui vit chez un aîné.", [
        ["A", "Inès, vous êtes étudiante et vous habitez chez Gérard, quatre-vingt-quatre ans. Vous ne payez presque pas de loyer. C'est un bon calcul ?"],
        ["B", "Au début, oui, c'était surtout pour l'argent : à Montréal, les loyers sont devenus fous. En échange, je fais quelques courses et je suis là le soir. Mais je ne m'attendais pas à ça : Gérard m'apprend les échecs, je lui explique son téléphone, on regarde les nouvelles ensemble et on se dispute sur tout. Je n'ai plus l'impression d'avoir un arrangement, mais un grand-père."],
      ], "Comment Inès voit-elle aujourd'hui cette colocation ?",
        ["Comme un lien familial.", "Comme une simple affaire d'argent.", "Comme un travail d'aide à domicile.", "Comme une source de conflits."],
        "« Je n'ai plus l'impression d'avoir un arrangement, mais un grand-père »: a family bond. Money was the reason at the start (« au début »); the errands are her side of the deal, not a job; and their arguments are friendly, not real conflict.",
        { scene: "A radio interview about housing between generations, in Montréal; warm and amused.", A: v("fr-fr-advisor-9", "vivienne", "A journalist, curious and warm."), B: v("fr-fr-podcaster-5", "vivienne", "Inès, a student in her twenties, lively and affectionate.") }),
      doc("B2", "Témoignage", "À la radio, une infirmière française parle de son travail en Abitibi.", [
        ["A", "Je suis infirmière, je viens de Lille, et je travaille depuis trois ans à l'hôpital de Rouyn-Noranda, en Abitibi. On m'avait prévenue : l'hiver est long, la ville est petite, et Montréal est à huit heures de route. Tout ça est vrai. Mais ici, je ne suis pas un numéro. Mes chefs me connaissent, mes patients me croisent à l'épicerie et me remercient. En France, je courais d'un patient à l'autre sans jamais les revoir. Je ne retournerais pas dans un grand hôpital, même pour un meilleur salaire."],
      ], "Qu'est-ce que cette infirmière apprécie dans son travail actuel ?",
        ["Être reconnue et proche des gens.", "Un salaire plus élevé qu'en France.", "La proximité de Montréal.", "Des hivers plus doux qu'à Lille."],
        "« ici, je ne suis pas un numéro. Mes chefs me connaissent, mes patients… me remercient »: being known and close to people. She'd turn down a better salary elsewhere, so pay isn't it; Montréal is eight hours away; and the winter is long, not mild.",
        { scene: "A personal testimony on a Québec radio programme about working in the regions; warm and sincere.", A: v("fr-fr-advisor-12", "vivienne", "A nurse in her thirties from northern France, warm and sincere.") }),
      doc("B2", "Entretien", "Un journaliste interroge une biologiste.", [
        ["A", "Les ruches se multiplient sur les toits de Montréal : hôtels, banques, universités… C'est une bonne nouvelle pour les abeilles ?"],
        ["B", "Pas forcément. Une ruche, c'est des dizaines de milliers d'abeilles domestiques qui ont besoin de fleurs. Si on installe trop de ruches sans planter plus de fleurs, elles entrent en concurrence avec les abeilles sauvages, qui, elles, sont vraiment menacées. Avant d'ajouter une ruche sur un toit, il faudrait d'abord fleurir les rues et les parcs. Sinon, on fait de la communication, pas de l'écologie."],
      ], "Quelle est la position de la biologiste ?",
        ["Les ruches urbaines peuvent nuire aux abeilles sauvages.", "Il faut installer davantage de ruches en ville.", "Les abeilles domestiques sont les plus menacées.", "Les entreprises devraient arrêter la communication."],
        "« elles entrent en concurrence avec les abeilles sauvages, qui, elles, sont vraiment menacées »: too many city hives can harm wild bees. She wants flowers before more hives; it's the wild bees, not the honeybees, that are threatened; and she criticises hives used as publicity without asking companies to stop communicating.",
        { scene: "A radio interview about urban nature in Montréal; clear and nuanced.", A: v("fr-fr-podcaster-4", "remy", "A journalist, curious."), B: v("fr-fr-tutor-4", "vivienne", "A biologist in her forties, precise and nuanced.") }),
      doc("B2", "Entretien", "Une animatrice interroge un psychologue.", [
        ["A", "On entend de plus en plus parler d'épuisement parental. Est-ce une mode, ou une réalité ?"],
        ["B", "C'est une réalité, et elle n'a rien à voir avec l'amour qu'on porte à ses enfants. Les parents épuisés sont souvent les plus investis. Ils veulent tout bien faire : les repas équilibrés, les activités, les devoirs, zéro écran. Le problème, c'est cette pression d'être parfait. Mon conseil est presque choquant : faites moins. Un repas de pâtes, une soirée télé, ce n'est pas un échec. Un parent reposé vaut mieux qu'un parent parfait."],
      ], "Que recommande le psychologue ?",
        ["Baisser ses exigences envers soi-même.", "Inscrire les enfants à plus d'activités.", "Passer davantage de temps avec ses enfants.", "Interdire complètement les écrans."],
        "« Mon conseil est presque choquant : faites moins… Un parent reposé vaut mieux qu'un parent parfait »: lower the bar they set themselves. More activities and zero screens are part of the pressure he describes; and spending more time with the children isn't his advice.",
        { scene: "A radio interview about family life; calm and reassuring.", A: v("fr-fr-csagent-3", "vivienne", "A radio host, warm."), B: v("fr-fr-advisor-2", "remy", "A psychologist in his fifties, calm, kind and reassuring.") }),
      doc("B2", "Reportage", "Vous écoutez un reportage sur les livraisons en ville.", [
        ["A", "À Bordeaux, une entreprise livre les colis du centre-ville à vélo-cargo. Les camionnettes s'arrêtent à un entrepôt en périphérie, et les vélos prennent le relais."],
        ["B", "On pense que c'est un choix écologique, et ça l'est. Mais nos clients nous choisissent d'abord parce qu'on est plus rapides. Dans les rues étroites, avec les embouteillages, un vélo-cargo livre deux fois plus de colis à l'heure qu'une camionnette. Et il n'y a pas besoin de chercher une place pour se garer. L'écologie, c'est notre fierté ; la vitesse, c'est notre argument commercial."],
      ], "Selon le fondateur, pourquoi les clients choisissent-ils son entreprise ?",
        ["Pour la rapidité des livraisons.", "Pour son engagement écologique.", "Pour ses tarifs plus bas.", "Pour ses camionnettes plus modernes."],
        "« nos clients nous choisissent d'abord parce qu'on est plus rapides… la vitesse, c'est notre argument commercial ». Ecology is his pride, not why clients come; prices aren't mentioned; and the vans stop at the warehouse outside the centre.",
        { scene: "A radio report on city logistics in Bordeaux; dynamic.", A: v("fr-fr-podcaster-9", "vivienne", "A radio reporter, dynamic."), B: v("fr-fr-podcaster-8", "remy", "The company's founder, a man in his thirties, energetic and confident.") }),
      doc("B2", "Entretien", "Un journaliste interroge une interprète d'hôpital.", [
        ["A", "Vous êtes interprète à l'hôpital Sainte-Justine. Les médecins ne pourraient pas utiliser une application de traduction ?"],
        ["B", "Pour demander où sont les toilettes, sûrement. Mais quand un médecin annonce un diagnostic grave à une mère qui vient d'arriver d'Afghanistan, la traduction mot à mot ne suffit pas. Il faut savoir qu'un oui ne veut pas toujours dire oui, qu'on ne parle pas de la mort de la même façon partout. Mon travail, ce n'est pas seulement de traduire des mots. C'est de faire passer ce que les gens veulent vraiment dire."],
      ], "Selon l'interprète, qu'apporte-t-elle de plus qu'une application ?",
        ["Elle tient compte des différences culturelles.", "Elle traduit plus vite que les machines.", "Elle connaît le vocabulaire médical.", "Elle remplace le médecin auprès du patient."],
        "« un oui ne veut pas toujours dire oui… on ne parle pas de la mort de la même façon partout »: she takes cultural differences into account. Speed isn't her argument; medical vocabulary isn't mentioned; and the doctor gives the diagnosis, she doesn't replace him.",
        { scene: "A radio interview in a Montréal hospital; serious and humane.", A: v("fr-fr-training-4", "remy", "A journalist, respectful."), B: v("fr-fr-concierge-6", "vivienne", "A hospital interpreter in her forties, calm, humane and precise.") }),
      doc("B2", "Témoignage", "À la radio, un enseignant parle de son parcours.", [
        ["A", "Je suis né à Port-au-Prince et je suis arrivé à Montréal-Nord à douze ans, en parlant surtout créole, une langue que mes professeurs ne comprenaient pas. Aujourd'hui, j'enseigne les mathématiques dans l'école où j'ai été élève. Le mercredi soir, j'accompagne des jeunes qui décrochent. Je ne leur fais pas de discours. Je leur montre simplement que quelqu'un qui leur ressemble est passé par là, et qu'on peut en sortir. Parfois, c'est tout ce qui manquait."],
      ], "Selon cet enseignant, qu'est-ce qui aide surtout ces jeunes ?",
        ["Avoir un modèle qui leur ressemble.", "Les discours sur l'importance de l'école.", "Des cours de mathématiques en plus.", "Parler créole avec ses professeurs."],
        "« Je leur montre simplement que quelqu'un qui leur ressemble est passé par là »: a role model they can identify with. He says he gives no speeches; maths is what he teaches in class, not what he offers on Wednesdays; and Creole is the language his own teachers didn't understand, not his advice.",
        { scene: "A personal testimony on a Montréal radio programme; sincere and warm.", A: v("fr-fr-podcaster-6", "remy", "A teacher in his forties, born in Haiti, sincere and warm.") }),
      doc("B2", "Entretien", "Une journaliste interroge le maire d'une petite ville.", [
        ["A", "Votre municipalité de trois mille habitants a accueilli quarante familles immigrantes en cinq ans. Comment avez-vous fait ?"],
        ["B", "Les emplois, on en avait : nos usines cherchaient des soudeurs, des mécaniciens. Ce qui manquait, c'était tout le reste. On a ouvert une classe de francisation à la bibliothèque, on a trouvé des logements, et surtout, chaque famille a un parrain du village, qui l'invite à souper, l'aide pour l'hiver, l'emmène à la cabane à sucre. Un emploi fait venir les gens. C'est l'accueil qui les fait rester."],
      ], "Selon le maire, qu'est-ce qui retient les familles immigrantes ?",
        ["L'accompagnement par les gens du village.", "Les emplois offerts par les usines.", "Les cours de français à la bibliothèque.", "Les logements à prix réduit."],
        "« Un emploi fait venir les gens. C'est l'accueil qui les fait rester », with a village sponsor for every family. The jobs were already there and bring people in; the French classes and housing are part of the welcome, but he stresses the sponsors (« et surtout »); and no reduced rent is mentioned.",
        { scene: "A radio interview about immigration in rural Québec; warm and proud.", A: v("fr-fr-advisor-7", "vivienne", "A journalist, attentive."), B: v("fr-fr-podcaster-12", "jean", "The mayor of a small Québec town, in his sixties, warm and proud.") }),
      doc("B2", "Entretien", "Un journaliste interroge une étudiante étrangère à Lyon.", [
        ["A", "Grâce, vous êtes arrivée de Yaoundé en septembre pour étudier l'économie à Lyon. Qu'est-ce qui a été le plus difficile ?"],
        ["B", "Je pensais que ce serait le froid, ou la cuisine. Pas du tout ! Le plus dur, c'était la méthode. À Yaoundé, on apprenait beaucoup par cœur. Ici, les professeurs ne veulent pas qu'on répète le cours : ils veulent qu'on le critique. Au premier examen, j'ai eu huit sur vingt, alors que je connaissais tout. Maintenant, j'ai compris : on ne me demande pas ce que je sais, mais ce que j'en pense."],
      ], "Qu'est-ce qui a été le plus difficile pour Grâce ?",
        ["S'adapter à une autre façon d'étudier.", "Supporter le froid de l'hiver lyonnais.", "Apprendre le cours entièrement par cœur.", "Comprendre l'accent des professeurs."],
        "« Le plus dur, c'était la méthode… on ne me demande pas ce que je sais, mais ce que j'en pense »: adapting to another way of studying. She expected the cold to be hard, « pas du tout »; learning by heart is how she studied before; and the professors' accent isn't mentioned.",
        { scene: "A radio interview about international students in France; lively.", A: v("fr-fr-advisor-4", "remy", "A journalist, friendly."), B: v("fr-fr-advisor-9", "vivienne", "Grâce, a student in her twenties from Cameroon, lively and thoughtful.") }),

      /* ---------- C1 (items 30–35) ---------- */
      doc("C1", "Conférence", "Vous écoutez un extrait de conférence de psychologie.", [
        ["A", "Dans un supermarché moyen, on trouve aujourd'hui une quarantaine de sortes de yaourts. Moi-même, j'ai mis vingt minutes à choisir le mien ce matin. On pourrait croire que plus de choix rend plus libre. Les études suggèrent souvent l'inverse : face à trop d'options, beaucoup de gens repoussent leur décision, ou choisissent puis regrettent, persuadés que l'option parfaite était juste à côté. Je ne plaide pas pour un monde où l'on n'aurait qu'un seul yaourt. Je dis qu'au-delà d'un certain seuil, le choix cesse d'être un pouvoir et devient une charge. La vraie liberté, c'est peut-être de savoir quand arrêter de comparer."],
      ], "Que soutient la conférencière ?",
        ["Trop de choix devient un fardeau.", "Il faudrait limiter les produits en magasin.", "Plus de choix rend toujours plus libre.", "Les consommateurs choisissent mal par paresse."],
        "« au-delà d'un certain seuil, le choix cesse d'être un pouvoir et devient une charge »: too much choice becomes a burden. She doesn't want a single yogurt, so she isn't asking to limit products; « plus de choix rend plus libre » is the belief she questions; and she never blames laziness.",
        { scene: "An extract from a lecture on psychology and consumption; lively.", A: v("fr-fr-podcaster-1", "vivienne", "A psychology researcher in her forties, lively and witty.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique de société à la radio.", [
        ["A", "Il y a dix ans, sur les réseaux sociaux, il fallait paraître parfait : la plage, le gâteau réussi, le sourire impeccable. Aujourd'hui, la mode est à l'authenticité. On montre ses cernes, son bureau en désordre, ses échecs. Progrès ? Pas si vite. Regardez bien : ces photos « naturelles » sont souvent prises vingt fois, choisies avec soin, accompagnées d'une légende étudiée. Même mon banquier a publié une photo de lui au réveil, les cheveux en bataille. Elle avait été retouchée. On n'a pas renoncé à la mise en scène ; on a simplement changé de décor. Je ne dis pas que tout le monde triche. Mais l'imperfection est devenue un nouveau filtre."],
      ], "Que pense le chroniqueur de la mode de l'authenticité ?",
        ["C'est une mise en scène sous une autre forme.", "C'est un vrai progrès vers la sincérité.", "Elle oblige à paraître parfait.", "Elle a fait disparaître les filtres."],
        "« On n'a pas renoncé à la mise en scène ; on a simplement changé de décor. L'imperfection est devenue un nouveau filtre »: staging in another form. He answers « Pas si vite » to the idea of progress; looking perfect was the fashion ten years ago; and the « natural » look is itself a filter.",
        { scene: "A society column on the radio; ironic and lively.", A: v("fr-fr-tutor-6", "remy", "A columnist in his thirties, ironic and lively.") }),
      doc("C1", "Débat", "Une présidente d'association et un politologue débattent du droit de vote.", [
        ["A", "Les jeunes de seize ans travaillent, paient des impôts, et ce sont eux qui vivront le plus longtemps avec les décisions d'aujourd'hui, sur le climat par exemple. Pourquoi n'auraient-ils pas le droit de voter ?"],
        ["B", "L'argument du climat est fort, je le reconnais. Mais je ne suis pas convaincu que le droit de vote soit la priorité. Dans les pays qui l'ont essayé, l'Autriche par exemple, les jeunes votent un peu plus quand on les y prépare à l'école, et pas plus que les autres sinon. Si on abaisse l'âge du vote sans former les jeunes, on n'aura changé que la loi."],
        ["A", "Alors faisons les deux : le droit et l'éducation civique."],
        ["B", "Là, vous me convainquez à moitié."],
      ], "Quelle est la position du politologue ?",
        ["Ce droit n'a de sens qu'avec une formation.", "Les jeunes de seize ans sont trop immatures.", "L'argument du climat ne tient pas.", "L'Autriche a eu tort d'essayer."],
        "« Si on abaisse l'âge du vote sans former les jeunes, on n'aura changé que la loi »: the right only makes sense with civic education. He never calls young people immature; he grants the climate argument « est fort »; and he cites Austria as evidence, not as a mistake.",
        { scene: "A radio debate on democracy; lively and courteous.", A: v("fr-fr-podcaster-11", "vivienne", "The president of a youth organisation, in her twenties, passionate and quick."), B: v("fr-fr-concierge-4", "remy", "A political scientist in his fifties, measured and courteous.") }),
      doc("C1", "Entretien", "Un journaliste interroge une démographe.", [
        ["A", "En 2030, un Québécois sur quatre aura plus de soixante-cinq ans. On parle souvent de cette évolution comme d'une catastrophe. Vous êtes démographe : faut-il s'inquiéter ?"],
        ["B", "S'inquiéter, non ; s'organiser, oui. Le vieillissement n'est pas une vague qui va nous submerger, c'est une tendance qu'on voit venir depuis cinquante ans. Ce qui me frappe, c'est qu'on en parle uniquement comme d'un coût : les soins, les pensions. On oublie que les retraités d'aujourd'hui sont en meilleure santé que jamais, qu'ils gardent des petits-enfants, qu'ils font tourner les associations. La vraie question n'est pas de savoir combien ils coûtent, mais comment on leur fait une place."],
      ], "Que reproche la démographe au discours habituel sur le vieillissement ?",
        ["Il ne voit les aînés que comme un coût.", "Il sous-estime le coût des pensions.", "Il exagère la santé des retraités.", "Il ignore la hausse des naissances."],
        "« on en parle uniquement comme d'un coût… La vraie question n'est pas de savoir combien ils coûtent, mais comment on leur fait une place »: seniors are only seen as a cost. She doesn't say pensions are underestimated; she stresses retirees' good health rather than doubting it; and birth rates aren't mentioned.",
        { scene: "A radio interview with a demographer; calm and thoughtful.", A: v("fr-fr-podcaster-2", "remy", "A journalist, slightly alarmist."), B: v("fr-fr-advisor-12", "vivienne", "A demographer in her fifties, calm, clear and quietly optimistic.") }),
      doc("C1", "Chronique", "Vous écoutez une chronique économique à la radio.", [
        ["A", "Dans certaines boutiques de Stockholm, l'argent liquide n'est plus accepté. Au Canada, la part des paiements en espèces a fondu en quinze ans. C'est pratique, rapide, et ça réduit la fraude, nous dit-on. Sans doute. Mais pensez à ceux pour qui le billet est le dernier outil de gestion : la personne âgée qui ne fait pas confiance aux applications, le parent qui met vingt dollars dans une enveloppe pour tenir jusqu'à la fin du mois. Et le jour d'une panne informatique, que reste-t-il ? Une pièce de monnaie, elle, ne tombe jamais en panne. Je ne demande pas qu'on arrête l'innovation. Je demande qu'on garde le droit de payer avec ce qu'on tient dans la main."],
      ], "Que défend la chroniqueuse ?",
        ["Le maintien du paiement en espèces.", "La fin rapide de l'argent liquide.", "Un contrôle plus strict des applications.", "Le retour aux enveloppes pour épargner."],
        "« je demande qu'on garde le droit de payer avec ce qu'on tient dans la main »: keep cash as a way to pay. The end of cash is what worries her; she doesn't ask to control apps, she defends people who don't trust them; and the envelope is an example, not a savings tip.",
        { scene: "An economics column on the radio; warm but firm.", A: v("fr-fr-advisor-7", "vivienne", "A columnist in her fifties, warm but firm.") }),
      doc("C1", "Entretien", "Une journaliste interroge un nutritionniste.", [
        ["A", "On entend partout qu'il faut éviter les aliments ultra-transformés. Mais est-ce vraiment réaliste, quand on travaille à temps plein et qu'on a trois enfants ?"],
        ["B", "Non, et je refuse de culpabiliser les familles. Le pain de mie industriel ou les céréales du matin ne sont pas du poison. Le problème, c'est quand ces produits deviennent la base de l'alimentation, parce qu'ils sont conçus pour qu'on en mange trop : sucrés, salés, faciles. Mon conseil est modeste : cuisinez un plat simple deux ou trois fois par semaine, en grande quantité, et congelez le reste. Personne ne mange parfaitement, pas même moi. Ce n'est pas la perfection qui compte, c'est la proportion."],
      ], "Que conseille le nutritionniste ?",
        ["Réduire la part des produits industriels.", "Supprimer tous les aliments transformés.", "Cuisiner chaque jour des plats complets.", "Éviter les céréales du matin."],
        "« Ce n'est pas la perfection qui compte, c'est la proportion »: cut down the share of industrial food. He says avoiding it all isn't realistic; he suggests cooking two or three times a week, not every day; and breakfast cereals « ne sont pas du poison ».",
        { scene: "A radio interview about food and health; reassuring and practical.", A: v("fr-fr-podcaster-9", "vivienne", "A journalist, a working mother, a little sceptical."), B: v("fr-fr-tutor-7", "remy", "A nutritionist in his forties, reassuring and practical.") }),

      /* ---------- C2 (items 36–39) ---------- */
      doc("C2", "Chronique", "Vous écoutez une chronique humoristique à la radio.", [
        ["A", "J'ai décidé de me détendre. J'ai donc téléchargé une application de méditation, qui m'a d'abord demandé de créer un compte, puis d'accepter les notifications, puis de choisir un abonnement. Après vingt minutes de réglages, j'étais prêt à lâcher prise. Le premier exercice durait trois minutes. Le tutoriel, sept. Depuis, mon téléphone me rappelle trois fois par jour qu'il est temps de respirer. Il me félicite quand j'ai médité sept jours de suite, et me fait sentir coupable quand j'oublie. J'ai maintenant une série à ne pas briser, des statistiques de sérénité et un classement. Je suis, paraît-il, dans le premier pour cent. Je n'ai jamais été aussi stressé d'être calme. Ma grand-mère, elle, regardait le fleuve en silence. Elle n'avait pas de compte."],
      ], "Où le chroniqueur veut-il en venir ?",
        ["On a transformé la détente en nouvelle performance.", "Les applications de méditation sont très efficaces.", "Il faudrait méditer davantage chaque jour.", "Sa grand-mère avait besoin d'une application."],
        "The column is ironic: an app that needs an account, notifications and a subscription, « statistiques de sérénité », a ranking, and « jamais été aussi stressé d'être calme ». Relaxing has become another performance. He mocks the app rather than praising it; the daily reminders are what stress him; and his grandmother's silence by the river is the contrast.",
        { scene: "A satirical column on the radio; dry and ironic, at a natural pace.", A: v("fr-fr-podcaster-4", "remy", "A columnist in his forties, dry and ironic, with perfect timing.") }),
      doc("C2", "Lecture", "Vous écoutez la lecture d'un extrait de roman.", [
        ["A", "Quand Rosine descendit du taxi-brousse, le village lui parut plus petit que dans ses souvenirs. L'air sentait la terre chaude et le charbon de bois. Le manguier était toujours là, devant l'école, mais quelqu'un avait repeint les volets en bleu. Des enfants qu'elle ne connaissait pas la regardèrent passer en silence, comme on regarde une étrangère. Elle serra plus fort la poignée de sa valise. Elle avait préparé des phrases en fon, la langue de sa grand-mère, et s'aperçut qu'elle les avait répétées avec l'accent de Paris. Devant la maison familiale, une vieille femme qu'elle ne reconnut pas se leva, l'observa longuement, puis dit simplement son prénom d'enfance, celui que plus personne n'utilisait depuis vingt ans. Rosine sentit sa gorge se serrer."],
      ], "Que suggère ce passage ?",
        ["Rosine reste liée à ce village malgré la distance.", "Rosine regrette d'être revenue au village.", "Personne au village ne se souvient de Rosine.", "Rosine a oublié la langue de sa grand-mère."],
        "An old woman she doesn't recognise still knows her childhood name, one nobody had used for twenty years: the bond with the village is still there. She feels out of place but never regrets coming; the old woman does remember her; and she prepared phrases in Fon, with a Paris accent, so she hasn't forgotten the language.",
        { scene: "A reading from a novel on a literary radio programme; intimate.", A: v("fr-fr-tutor-4", "vivienne", "A reader in her thirties, warm, intimate and unhurried.") }),
      doc("C2", "Débat", "Un chercheur et une directrice d'école débattent des examens.", [
        ["A", "Les examens mesurent surtout la capacité à réussir des examens. Ils récompensent la mémoire à court terme et la gestion du stress, pas la compréhension. Dans un monde où toute l'information est accessible en trois secondes, pourquoi continuer à évaluer ce qu'un élève retient pendant deux heures, sans document ? Personne, dans sa vie professionnelle, ne travaille sans documents."],
        ["B", "Parce que tout n'est pas accessible en trois secondes : le raisonnement, lui, ne se télécharge pas. Je vous accorde que nos examens vérifient trop souvent la mémoire. Mais sans évaluation commune, ce sont les élèves les mieux entourés qui s'en sortent, ceux dont les parents savent décoder les attentes. L'examen, si imparfait soit-il, reste l'un des rares moments où tout le monde est jugé sur la même copie."],
      ], "Pourquoi la directrice défend-elle les examens ?",
        ["Ils mettent les élèves sur un pied d'égalité.", "Ils mesurent parfaitement la compréhension.", "Ils apprennent aux élèves à gérer le stress.", "Ils évitent de tout chercher sur Internet."],
        "« l'un des rares moments où tout le monde est jugé sur la même copie », while without a common test the best-supported pupils win: exams put pupils on an equal footing. She grants they check memory too often, so not « parfaitement » the understanding; stress management is the researcher's criticism; and she says reasoning « ne se télécharge pas », not that exams stop pupils searching online.",
        { scene: "A radio debate on education; dense, at a natural pace.", A: v("fr-fr-podcaster-8", "remy", "An education researcher in his forties, provocative and quick."), B: v("fr-fr-advisor-9", "vivienne", "A school principal in her fifties, firm, precise and calm.") }),
      doc("C2", "Conférence", "Vous écoutez un extrait de conférence de géographie.", [
        ["A", "On imagine souvent la frontière comme une ligne : d'un côté, nous ; de l'autre, eux. Mais allez à Gatineau et à Ottawa, ou à Strasbourg et à Kehl. Des milliers de personnes traversent chaque jour pour travailler, faire leurs courses, voir leur famille. Pour elles, la frontière n'est pas un mur, c'est une couture : elle sépare, mais elle tient ensemble deux pièces qui ne formeraient rien l'une sans l'autre. Demandez à une infirmière qui habite Gatineau et soigne à Ottawa de quel côté elle vit : elle hésitera. Les cartes, elles, ne montrent que le trait. Je ne dis pas que les frontières sont inutiles ; elles protègent, elles organisent. Je dis que les penser seulement comme des barrières, c'est oublier ce qu'elles relient."],
      ], "Quelle image de la frontière le conférencier propose-t-il ?",
        ["Un lieu qui sépare, mais aussi qui unit.", "Un mur qu'il faudrait faire tomber.", "Une ligne entre deux camps opposés.", "Une protection devenue inutile."],
        "« la frontière n'est pas un mur, c'est une couture : elle sépare, mais elle tient ensemble »: a place that separates and also joins. He doesn't want borders torn down (« elles protègent, elles organisent »); the line between « nous » and « eux » is the image he questions; and he says borders aren't useless.",
        { scene: "An extract from a geography lecture; dense and elegant.", A: v("fr-fr-advisor-4", "remy", "A geographer in his sixties, elegant and warm.") }),
    ],
  }];

  // Every item plays its recording, numbered in exam order.
  T.COMP.coExams.forEach((e) => e.items.forEach((it, i) => { it.audio = `audio/${e.id}/${String(i + 1).padStart(2, "0")}.mp4`; }));
})();
