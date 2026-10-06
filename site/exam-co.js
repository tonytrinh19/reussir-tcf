/* The built-in CO practice exam (Examen blanc), modelled on the real TCF Canada listening test: 39 items in 35
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
   Each item plays audio/co-exam-1/NN.mp4, made by tools/make_audio.py from its cast, as for the sets: a scene
   note and, for each speaker, a Gemini voice, a Microsoft voice and a delivery note. Q is the narrator who reads
   the question at the end of a document. A few B2–C2 items have Québec voices, as on the real test.
   Give the exam a new id whenever its questions change, so old answers aren't shown against new questions.
   After editing, run: node tools/check_co.js and python3 tools/make_audio.py */
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
        { scene: "A small-business owner from Gaspésie talking on a Québec radio programme.", A: v("fr-ca-assistant-6", "sylvie", "A Québec entrepreneur in her forties, warm and candid, with a Québec accent.") }),
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
        { scene: "A radio interview with a dog-sled guide in the Laurentians; easy-going.", A: v("fr-fr-advisor-7", "vivienne", "A radio journalist, curious."), B: v("fr-ca-podcaster-8", "jean", "A dog-sled guide from Québec in his fifties, relaxed, with a Québec accent.") }),

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
        { scene: "A linguist from Montréal talking on a Québec radio programme; clear and engaging.", A: v("fr-ca-tutor-1", "sylvie", "A Québec linguist in her fifties, clear and engaging, with a Québec accent.") }),
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
        { scene: "A radio debate on economics and climate; dense, at a natural pace.", A: v("fr-ca-csagent-2", "jean", "A Québec radio host in his fifties, sharp and friendly, with a Québec accent."), B: v("fr-fr-advisor-9", "vivienne", "An economist in her fifties, precise, fast and nuanced.") }),
      doc("C2", "Conférence", "Vous écoutez un extrait de conférence.", [
        ["A", "Nous passons nos journées à faire confiance à des inconnus. Nous mangeons des plats préparés par des gens que nous ne verrons jamais, nous montons dans des avions pilotés par des personnes dont nous ignorons le nom, nous suivons les conseils de médecins rencontrés une seule fois. Même acheter un pot de confiture suppose de croire, sans vérifier, qu'il contient bien ce qu'annonce l'étiquette. On décrit volontiers notre époque comme celle de la défiance généralisée ; je crois que c'est confondre deux choses. Ce qui s'effrite, ce n'est pas la confiance en tant que telle, sans laquelle aucune journée ne serait vivable : c'est la confiance que nous accordons aux institutions qui la garantissaient, le diplôme, la signature, le titre. Le défi n'est donc pas de réapprendre à faire confiance, mais de rebâtir ce qui nous permettait de le faire sans y penser."],
      ], "Quelle est la thèse de la conférencière ?",
        ["C'est la confiance dans ses garants qui faiblit.", "Notre époque se caractérise par une méfiance générale.", "Il faudrait apprendre à se méfier des inconnus.", "Les institutions sont plus fiables que les individus."],
        "« Ce qui s'effrite, ce n'est pas la confiance en tant que telle… c'est la confiance que nous accordons aux institutions qui la garantissaient ». General distrust is the description she rejects (« c'est confondre deux choses »), she shows we trust strangers all day, and she says those institutions are losing our trust, not that they're more reliable.",
        { scene: "An extract from a philosophy lecture; dense and elegant.", A: v("fr-fr-advisor-7", "vivienne", "A philosopher in her sixties, dense, elegant and unhurried.") }),
    ],
  }];

  // Every item plays its recording, numbered in exam order.
  T.COMP.coExams.forEach((e) => e.items.forEach((it, i) => { it.audio = `audio/${e.id}/${String(i + 1).padStart(2, "0")}.mp4`; }));
})();
