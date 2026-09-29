/* Built-in Compréhension orale sets: a B1 and a B2 recording for every topic, in TCF Canada style.
   Every recording lasts at least 2 minutes and has 6 questions, in the order the answers come up.
   The correct option is listed first; the app shuffles the options.

   Each set plays audio/<id>.mp4, made by tools/make_audio.py from the set's cast: a note on the
   scene and, for every speaker, a Gemini voice (Paris French), a Microsoft voice (vivienne or remy) and
   a delivery note. The site ignores the cast. The Montréal (fr-ca) voices left are in sets already
   recorded with Gemini; they're kept for now and will be re-recorded with Paris voices eventually.
   After editing, run: node tools/check_co.js and python3 tools/make_audio.py */
(function () {
  "use strict";
  const T = window.TCF;
  const set = (id, level, themes, title, context, lines, qs, cast) => ({
    id, level, themes: [].concat(themes), title, context,
    lines: lines.map(([speaker, text]) => ({ speaker, text })),
    questions: qs.map(([q, options, why]) => ({ q, options, answer: 0, why })),
    cast,
  });
  // One speaker's voices: a Gemini voice id, a Microsoft voice and a note on how to deliver the lines.
  const v = (gemini, ms, style) => ({ gemini, ms, style });

  T.COMP.coSets = [
    /* ---------- Vie quotidienne ---------- */
    set("co-quotidien-b2", "B2", "quotidien", "Pourquoi n'a-t-on jamais le temps ?", "Vous écoutez une chronique à la radio.", [
      ["N", "Vous avez sans doute déjà eu cette impression : les journées passent trop vite, et la liste des choses à faire ne diminue jamais. Pourtant, selon plusieurs enquêtes, nous avons aujourd'hui plus de temps libre que nos grands-parents. Nous travaillons moins d'heures, nous avons plus de congés, et les machines ont réduit le temps consacré aux tâches ménagères. Alors, pourquoi ce sentiment d'être toujours pressé ?"],
      ["N", "D'abord parce que notre temps libre est morcelé. Dix minutes par-ci, vingt minutes par-là, entre deux rendez-vous ou deux trajets. Ce temps en miettes, nous le remplissons souvent avec notre téléphone, que nous consultons des dizaines de fois par jour. Et chaque notification interrompt ce que nous faisions : il faut ensuite plusieurs minutes pour retrouver notre concentration. Résultat : nous ne nous arrêtons jamais vraiment, et le cerveau n'a pas l'impression de s'être reposé."],
      ["N", "Ensuite, nous voulons tout faire : le sport, les amis, les séries, les cours du soir, les sorties avec les enfants. Le choix est immense, et chaque activité que l'on ne fait pas ressemble à une occasion manquée. Nos grands-parents avaient moins de possibilités, donc moins de regrets."],
      ["N", "Il y a aussi une erreur que nous commettons presque tous : nous sous-estimons le temps que prennent les choses. Une réunion prévue pour une heure en dure une et demie, un trajet de vingt minutes en prend trente-cinq. Comme notre emploi du temps ne laisse aucune marge, le moindre retard crée une réaction en chaîne, et nous finissons la journée avec le sentiment d'avoir couru après le temps."],
      ["N", "Les spécialistes proposent une solution simple, mais difficile à appliquer : renoncer. Choisir deux ou trois priorités par semaine, et accepter de ne pas faire le reste. Ils conseillent aussi de prévoir des moments vides dans son agenda, sans écran, pour marcher, lire ou simplement ne rien faire. Certains appliquent même la règle des deux minutes : si une tâche prend moins de deux minutes, on la fait tout de suite, pour qu'elle n'encombre pas l'esprit."],
      ["N", "Précisons enfin que tout le monde n'est pas égal face au temps. Pour les parents seuls ou pour ceux qui cumulent deux emplois, le manque de temps n'est pas une impression, c'est une réalité, et aucune astuce ne la fera disparaître. Pour les autres, le temps ne s'allonge pas, mais on peut apprendre à mieux le vivre : choisir ce qu'on en fait, c'est peut-être la meilleure façon d'avoir enfin l'impression d'en avoir assez."],
    ], [
      ["Selon la chronique, avons-nous moins de temps libre qu'autrefois ?", ["Non, nous en avons même plutôt davantage", "Oui, à cause des tâches ménagères", "Oui, parce que nous travaillons plus", "La chronique ne donne aucun chiffre"], "« nous avons aujourd'hui plus de temps libre que nos grands-parents »"],
      ["Que signifie un temps libre « morcelé » ?", ["Un temps libre coupé en petits moments", "Un temps libre passé sur le téléphone", "Un temps libre trop long pour se reposer", "Un temps libre partagé avec la famille"], "« Dix minutes par-ci, vingt minutes par-là… Ce temps en miettes ». The phone is how we fill it, not what « morcelé » means."],
      ["Pourquoi chaque activité non faite ressemble-t-elle à une occasion manquée ?", ["Parce que le choix est immense", "Parce que les activités coûtent cher", "Parce que les amis insistent souvent", "Parce qu'on a peur de s'ennuyer"], "« Le choix est immense, et chaque activité que l'on ne fait pas ressemble à une occasion manquée. »"],
      ["Quelle erreur commettons-nous presque tous ?", ["Nous sous-estimons la durée des choses", "Nous acceptons trop de réunions au travail", "Nous partons toujours trop tard le matin", "Nous refusons de prendre des pauses"], "« nous sous-estimons le temps que prennent les choses »"],
      ["Que conseillent les spécialistes ?", ["Renoncer à une partie de ses activités", "Se lever une heure plus tôt chaque jour", "Remplir chaque moment vide d'une activité", "Noter chaque jour toutes ses tâches dans un agenda"], "« renoncer. Choisir deux ou trois priorités par semaine, et accepter de ne pas faire le reste ». They recommend leaving moments empty, the opposite of filling them."],
      ["Que dit la chroniqueuse à la fin ?", ["Pour certains, le manque de temps est réel", "Les parents seuls ont trop de temps libre", "Personne ne manque vraiment de temps libre", "Le temps libre va bientôt diminuer pour tous"], "« Pour les parents seuls ou pour ceux qui cumulent deux emplois, le manque de temps n'est pas une impression, c'est une réalité. »"],
    ], {
      scene: "A morning radio chronicle on a French station; thoughtful and lightly humorous.",
      N: v("fr-fr-podcaster-9", "vivienne", "A radio columnist in her late twenties, warm, clear and a little amused."),
    }),

    /* ---------- Immigration ---------- */
    set("co-immigration-b1", "B1", ["immigration", "education"], "À l'accueil d'un centre pour nouveaux arrivants", "Une femme parle avec un employé à l'accueil d'un centre de services pour nouveaux arrivants, à Montréal.", [
      ["A", "Bonjour, madame. Je peux vous aider ?"],
      ["B", "Bonjour. Je suis arrivée à Montréal il y a trois semaines et je voudrais m'inscrire aux cours de français gratuits pour les nouveaux arrivants."],
      ["A", "Très bien, vous êtes au bon endroit. Vous avez votre carte de résident permanent avec vous ? J'ai aussi besoin d'une preuve d'adresse, par exemple un bail ou une facture d'électricité."],
      ["B", "Oui, j'ai ma carte et mon bail. Est-ce que les cours ont lieu le soir ? Je travaille dans un entrepôt pendant la journée."],
      ["A", "Nous avons des cours du soir le lundi et le jeudi, de 18 h à 21 h. Il existe aussi des cours à temps complet, le jour, avec une aide financière, mais ce ne serait pas possible avec votre travail. Attention : la prochaine session commence dans deux semaines, et il reste très peu de places."],
      ["B", "Alors je m'inscris tout de suite ! Les groupes sont grands ? Je n'ai jamais étudié le français, à part quelques mots appris sur une application."],
      ["A", "Une quinzaine de personnes au maximum, et les enseignantes ont l'habitude des grands débutants, ne vous inquiétez pas. Les livres sont prêtés gratuitement pour toute la session. Par contre, avant de commencer, vous devez passer un test de niveau, mercredi prochain à 10 h. Ça dure environ une heure : d'abord une petite conversation avec une enseignante, puis quelques exercices écrits."],
      ["B", "D'accord. Qu'est-ce que je dois apporter ce jour-là ?"],
      ["A", "Seulement une pièce d'identité et un crayon. Si vous êtes en retard, prévenez l'accueil par téléphone, sinon votre place pourrait être donnée à quelqu'un d'autre. Le centre est à deux minutes du métro Jean-Talon. Et si vous avez des enfants, il y a une halte-garderie gratuite pendant les cours du soir."],
      ["B", "Ça, c'est une très bonne nouvelle, mon fils a quatre ans ! Pour mercredi à 10 h… je vais demander à mon patron si je peux commencer plus tard ce jour-là. Merci beaucoup, monsieur !"],
    ], [
      ["Pourquoi la femme vient-elle au centre ?", ["Pour s'inscrire à des cours de français", "Pour renouveler sa carte de résident", "Pour chercher un emploi", "Pour inscrire son fils à la garderie"], "« je voudrais m'inscrire aux cours de français gratuits pour les nouveaux arrivants »"],
      ["Quels documents l'employé lui demande-t-il ?", ["Sa carte de résident et une preuve d'adresse", "Son passeport et une lettre de son patron", "Une photo et une facture d'électricité", "Son permis de conduire et son contrat de travail"], "« votre carte de résident permanent… une preuve d'adresse, par exemple un bail ou une facture d'électricité ». The bill is only an example of proof of address."],
      ["Pourquoi ne peut-elle pas suivre les cours à temps complet ?", ["Elle travaille pendant la journée", "Ils sont réservés aux étudiants", "Il ne reste plus de places", "Ils coûtent trop cher sans aide financière"], "Full-time classes are during the day: « ce ne serait pas possible avec votre travail »."],
      ["Comment se passe le test de niveau ?", ["Une conversation, puis des exercices écrits", "Un long examen écrit de trois heures", "Une conversation avec la directrice du centre", "Des exercices sur ordinateur à la maison"], "« d'abord une petite conversation avec une enseignante, puis quelques exercices écrits »"],
      ["Pourquoi la halte-garderie l'intéresse-t-elle ?", ["Elle a un fils de quatre ans", "Elle cherche un emploi dans une garderie", "Son fils commence l'école mercredi", "Les cours du jour sont trop chers"], "« Ça, c'est une très bonne nouvelle, mon fils a quatre ans ! »"],
      ["Que va-t-elle faire pour pouvoir passer le test ?", ["Demander à son patron de commencer plus tard", "Demander un autre jour à l'enseignante du test", "Venir au centre avec son fils mercredi soir", "Prendre le métro plus tôt que d'habitude"], "« je vais demander à mon patron si je peux commencer plus tard ce jour-là »"],
    ], {
      scene: "The reception desk of a community centre for newcomers in Montréal; a friendly, practical conversation.",
      A: v("fr-ca-csagent-2", "remy", "A receptionist in his late thirties, calm, patient and reassuring."),
      B: v("fr-fr-tutor-5", "vivienne", "A woman who arrived three weeks ago, polite and a little anxious, then relieved."),
    }),
    set("co-immigration-b2", "B2", "immigration", "Faire reconnaître ses compétences", "Un journaliste interroge une conseillère en emploi qui accompagne des immigrants qualifiés.", [
      ["A", "Vous accompagnez des immigrants qualifiés depuis quinze ans. Quelle est leur principale difficulté à leur arrivée ?"],
      ["B", "Contrairement à ce qu'on pense, ce n'est pas toujours la langue. C'est la reconnaissance de leur expérience. Un employeur voit un diplôme obtenu à l'étranger et ne sait pas à quoi il correspond. Dans le doute, il préfère un candidat formé ici, même moins expérimenté."],
      ["A", "Que conseillez-vous à ces personnes ?"],
      ["B", "D'abord, de faire évaluer leurs diplômes par un organisme officiel : c'est un document que l'employeur comprend tout de suite. Ensuite, d'obtenir une première expérience locale, même courte, même en dessous de leur niveau, par exemple grâce à un stage ou au bénévolat. Enfin, de se construire un réseau. Beaucoup d'offres d'emploi ne sont jamais publiées : elles circulent de bouche à oreille."],
      ["A", "Et pour les professions réglementées, comme les infirmières ou les ingénieurs ?"],
      ["B", "Là, c'est plus long. Il faut obtenir un permis de l'ordre professionnel, ce qui peut demander des examens, des stages, parfois des cours complémentaires. Certaines personnes attendent deux ou trois ans avant de pouvoir exercer. Pendant ce temps, je leur conseille de travailler dans un domaine voisin, pour ne pas perdre le contact avec leur métier."],
      ["A", "Au Québec, la langue reste tout de même un enjeu, non ?"],
      ["B", "Bien sûr. Beaucoup de nouveaux arrivants parlent déjà un bon français général, mais il leur manque le vocabulaire de leur métier. Des cours de français spécialisé existent, par exemple pour le secteur de la santé. Ils font souvent une énorme différence en entrevue."],
      ["A", "Vous parlez beaucoup du réseau. Concrètement, comment s'en construit-on un quand on ne connaît personne ?"],
      ["B", "En participant à des activités professionnelles : des conférences, des rencontres organisées par les associations de métier, des « cinq à sept » où l'on discute de manière informelle. Le bénévolat aide aussi énormément. Une de mes clientes, ingénieure, a trouvé son premier emploi grâce à une personne rencontrée en aidant à organiser un festival de quartier."],
      ["A", "Et les employeurs, ont-ils un rôle à jouer ?"],
      ["B", "Évidemment. Ceux qui proposent des stages rémunérés ou du mentorat découvrent souvent des candidats excellents, et toute l'équipe y gagne. Avec la pénurie de main-d'œuvre, ils n'ont plus vraiment le choix. Mais il faut aussi changer les réflexes : demander « avez-vous une expérience canadienne ? », c'est souvent fermer la porte à quelqu'un avant même d'avoir écouté ce qu'il peut apporter."],
    ], [
      ["Selon la conseillère, quelle est la principale difficulté des immigrants qualifiés ?", ["La reconnaissance de leur expérience", "Leur niveau de français général", "Le prix élevé des formations", "Le manque d'offres d'emploi"], "« ce n'est pas toujours la langue. C'est la reconnaissance de leur expérience. »"],
      ["Pourquoi conseille-t-elle de faire évaluer ses diplômes ?", ["C'est un document clair pour l'employeur", "Cela permet d'obtenir un meilleur salaire", "Cela dispense de l'examen de français", "C'est obligatoire pour faire du bénévolat"], "« c'est un document que l'employeur comprend tout de suite »"],
      ["Que dit-elle des offres d'emploi ?", ["Beaucoup circulent sans être publiées", "La plupart exigent un diplôme canadien", "Elles sont surtout réservées aux stagiaires", "Elles sont publiées par les ordres professionnels"], "« Beaucoup d'offres d'emploi ne sont jamais publiées : elles circulent de bouche à oreille. »"],
      ["Que conseille-t-elle aux personnes qui attendent leur permis d'exercer ?", ["Travailler dans un domaine voisin", "Reprendre toutes leurs études depuis le début", "Chercher un emploi dans une autre province", "Faire du bénévolat dans un ordre professionnel"], "« je leur conseille de travailler dans un domaine voisin, pour ne pas perdre le contact avec leur métier »"],
      ["Selon elle, qu'est-ce qui manque souvent aux nouveaux arrivants en français ?", ["Le vocabulaire de leur métier", "Les bases de la grammaire", "La prononciation des mots québécois", "La confiance pour parler"], "« il leur manque le vocabulaire de leur métier »"],
      ["Que reproche-t-elle à certains employeurs ?", ["Exiger une expérience canadienne dès le départ", "Refuser de payer les stagiaires", "Proposer trop de programmes de mentorat", "Recruter seulement par les ordres professionnels"], "« demander « avez-vous une expérience canadienne ? », c'est souvent fermer la porte avant même d'avoir écouté la personne »"],
    ], {
      scene: "A current-affairs interview on a Montréal radio station; serious but warm.",
      A: v("fr-ca-podcaster-8", "remy", "A journalist in his forties, curious, precise and professional."),
      B: v("fr-ca-assistant-6", "vivienne", "An experienced employment counsellor around fifty, confident, warm and convincing."),
    }),

    /* ---------- Travail ---------- */
    set("co-travail-b1", "B1", "travail", "Un appel des ressources humaines", "Vous écoutez une conversation téléphonique entre une responsable des ressources humaines et un candidat.", [
      ["A", "Bonjour, ici Julie Tremblay, du service des ressources humaines de la compagnie Nordex. Je vous appelle au sujet de votre candidature pour le poste d'adjoint administratif. Vous avez quelques minutes ?"],
      ["B", "Oui, bien sûr. Bonjour, madame Tremblay."],
      ["A", "Votre profil nous intéresse beaucoup. Nous aimerions vous rencontrer pour une entrevue le mardi 18 mars, à 10 h. Est-ce que ça vous convient ?"],
      ["B", "Mardi matin, c'est difficile : j'ai un rendez-vous chez le médecin à 9 h 30. Est-ce que l'après-midi serait possible ?"],
      ["A", "Voyons voir… Oui, mardi à 14 h, c'est libre. L'entrevue aura lieu à nos bureaux du 400, boulevard Saint-Joseph, au troisième étage. Elle durera environ une heure. Vous rencontrerez le directeur du bureau, M. Bouchard, et moi-même."],
      ["B", "Parfait. Qu'est-ce que je dois apporter ?"],
      ["A", "Une pièce d'identité et deux lettres de référence. Il y aura aussi un petit test de vingt minutes sur ordinateur : un tableau à remplir et un courriel à rédiger. Pour le test, vous n'avez besoin de rien, l'ordinateur est fourni."],
      ["B", "Et le salaire, est-ce qu'on en parlera pendant l'entrevue ?"],
      ["A", "Oui, M. Bouchard vous présentera les conditions : le salaire, les vacances et les assurances collectives. Vous pourrez poser toutes vos questions à ce moment-là."],
      ["B", "D'accord. Et pour venir, est-ce qu'il y a un stationnement ?"],
      ["A", "Malheureusement non, pas pour les visiteurs. Je vous conseille le métro : la station Laurier est à cinq minutes à pied. Sinon, il y a un stationnement payant derrière l'immeuble, mais il est souvent complet l'après-midi."],
      ["B", "Je prendrai le métro, alors. Pouvez-vous me rappeler l'horaire du poste ?"],
      ["A", "C'est un poste à temps plein, trente-cinq heures par semaine, du lundi au vendredi. Après trois mois, il est possible de faire du télétravail une journée par semaine. Je vous envoie aussi un courriel de confirmation avec l'adresse et un plan d'accès. Si vous avez un empêchement, rappelez-moi avant vendredi. Au plaisir de vous rencontrer !"],
    ], [
      ["Pourquoi Julie Tremblay appelle-t-elle ?", ["Pour lui proposer une entrevue d'embauche", "Pour annoncer que le poste est pourvu", "Pour demander un nouveau curriculum", "Pour offrir un stage de trois mois"], "« Nous aimerions vous rencontrer pour une entrevue »"],
      ["Pourquoi l'heure de l'entrevue change-t-elle ?", ["Le candidat voit un médecin mardi matin", "Le directeur du bureau est absent le matin", "Les bureaux sont fermés le mardi matin", "Le candidat travaille jusqu'à midi"], "« j'ai un rendez-vous chez le médecin à 9 h 30 », so the interview moves to 14 h."],
      ["Qui le candidat va-t-il rencontrer ?", ["Julie Tremblay et le directeur du bureau", "Le directeur général et une informaticienne", "Plusieurs candidats pour le même poste", "Une adjointe et un informaticien"], "« Vous rencontrerez le directeur du bureau, M. Bouchard, et moi-même. »"],
      ["En quoi consiste le test ?", ["Remplir un tableau et écrire un courriel", "Répondre à des questions sur l'entreprise", "Taper un long texte en vingt minutes", "Présenter un projet devant le directeur"], "« un tableau à remplir et un courriel à rédiger »"],
      ["Comment Julie Tremblay conseille-t-elle de venir ?", ["En prenant le métro jusqu'à Laurier", "En voiture, avec le stationnement gratuit", "En autobus, depuis la station Saint-Joseph", "À pied depuis le centre-ville"], "« Je vous conseille le métro : la station Laurier est à cinq minutes à pied. » The car park is paid and often full."],
      ["Qu'est-ce qui est possible après trois mois ?", ["Travailler de la maison un jour par semaine", "Travailler seulement quatre jours par semaine", "Obtenir une augmentation de salaire", "Choisir ses horaires de travail"], "« il est possible de faire du télétravail une journée par semaine »"],
    ], {
      scene: "A phone call between the HR coordinator of a Montréal company and a job applicant; professional and friendly.",
      A: v("fr-ca-advisor-1", "vivienne", "An HR coordinator in her early thirties, organised, friendly and efficient."),
      B: v("fr-ca-tutor-4", "remy", "A job applicant in his twenties, polite and a little nervous."),
    }),
    set("co-travail-b2", "B2", "travail", "La semaine de quatre jours à l'essai", "Vous écoutez un reportage à la radio.", [
      ["N", "Depuis six mois, une cinquantaine d'entreprises testent la semaine de quatre jours, sans baisse de salaire. Les employés travaillent trente-deux heures au lieu de trente-cinq, mais ils doivent atteindre les mêmes objectifs qu'avant. Banques, agences de communication, usines : les secteurs sont très variés."],
      ["N", "Le principe n'est pas nouveau. Dans d'autres pays, des expériences semblables ont été menées ces dernières années, avec des résultats plutôt encourageants. Mais c'est la première fois qu'autant d'entreprises de secteurs différents participent en même temps, sous le regard de chercheurs chargés d'en mesurer les effets."],
      ["N", "Premier constat : la plupart des participants se disent moins fatigués et plus motivés. Les absences pour maladie ont diminué, et plusieurs entreprises affirment recruter plus facilement, car la formule attire les candidats. Une responsable d'agence raconte qu'elle reçoit désormais trois fois plus de candidatures pour chaque offre."],
      ["N", "Sur le terrain, les témoignages se ressemblent. Sophie, comptable dans une banque, a pris l'habitude de faire ses courses et ses rendez-vous médicaux le vendredi. « Le week-end, je suis enfin vraiment disponible pour mes enfants », explique-t-elle. Dans une usine de meubles, les ouvriers ont choisi de ne pas travailler le lundi, et la direction a constaté moins d'accidents du travail."],
      ["N", "Tout n'est pas si simple pour autant. Dans les commerces et les services de santé, qui doivent rester ouverts tous les jours, il a fallu embaucher du personnel supplémentaire ou réorganiser les horaires, ce qui coûte cher. Certains employés reconnaissent aussi que leurs journées sont devenues plus intenses, avec moins de pauses et moins de moments pour discuter entre collègues."],
      ["N", "Les cadres, eux, sont partagés. Beaucoup apprécient le jour de repos supplémentaire, mais avouent consulter leurs courriels ce jour-là, par peur de prendre du retard. Pour eux, la semaine de quatre jours ressemble parfois à une semaine de cinq jours en quatre."],
      ["N", "Les chercheurs qui suivent l'expérience restent prudents. Selon eux, la formule fonctionne surtout quand l'entreprise en profite pour supprimer les réunions inutiles et revoir ses méthodes de travail. Réduire le temps sans changer l'organisation mène vite à l'épuisement."],
      ["N", "À la fin de l'essai, les entreprises devront choisir : continuer, revenir à la semaine classique, ou trouver un compromis, comme une semaine de quatre jours et demi. D'après les premiers chiffres, une large majorité souhaite continuer. Le gouvernement, lui, attend les conclusions des chercheurs avant de décider s'il faut encourager la formule."],
    ], [
      ["Quel est le principe de l'expérience ?", ["Quatre jours sans baisse de salaire", "Quatre jours avec un salaire réduit", "Cinq journées plus courtes, même salaire", "Quatre jours sans objectifs précis"], "« la semaine de quatre jours, sans baisse de salaire… ils doivent atteindre les mêmes objectifs »"],
      ["Quel avantage les entreprises constatent-elles ?", ["Elles recrutent plus facilement", "Elles paient moins d'impôts", "Elles ferment plus tôt le soir", "Elles vendent davantage à l'étranger"], "« plusieurs entreprises affirment recruter plus facilement »"],
      ["Quelle difficulté rencontrent les commerces et les services de santé ?", ["Ils doivent embaucher ou réorganiser", "Leurs employés refusent de tester la formule", "Ils doivent fermer un jour par semaine", "Leurs clients se plaignent des nouveaux prix"], "« il a fallu embaucher du personnel supplémentaire ou réorganiser les horaires »"],
      ["Que font beaucoup de cadres pendant leur jour de repos ?", ["Ils lisent quand même leurs courriels de travail", "Ils suivent des formations en ligne", "Ils travaillent dans une autre entreprise", "Ils organisent des réunions avec l'équipe"], "« avouent consulter leurs courriels ce jour-là, par peur de prendre du retard »"],
      ["Selon les chercheurs, à quelle condition la formule fonctionne-t-elle ?", ["Si l'organisation du travail change aussi", "Si les salaires baissent légèrement", "Si les employés acceptent de travailler le samedi", "Si l'essai dure au moins deux ans"], "« quand l'entreprise en profite pour supprimer les réunions inutiles et revoir ses méthodes de travail »"],
      ["Que souhaite la majorité des entreprises, d'après les premiers chiffres ?", ["Continuer la semaine de quatre jours", "Revenir à la semaine classique", "Passer à quatre jours et demi", "Attendre l'avis d'autres pays"], "« une large majorité souhaite continuer »"],
    ], {
      scene: "A radio news report on a French station; informative and balanced.",
      N: v("fr-fr-podcaster-12", "remy", "A seasoned radio reporter in his fifties, natural, clear and neutral."),
    }),
    /* ---------- Environnement ---------- */
    set("co-environnement-b1", "B1", "environnement", "Journée de nettoyage des berges", "Vous écoutez une annonce sur une radio locale.", [
      ["N", "Bonjour à tous ! Samedi prochain, la mairie organise sa grande journée de nettoyage des berges de la rivière. Rendez-vous à 9 h au parc du Moulin, près du pont. Que vous veniez seul, en famille ou avec des amis, tout le monde est le bienvenu. Pas besoin d'expérience : il suffit d'un peu de bonne volonté."],
      ["N", "Les participants ramasseront les déchets le long de la rivière jusqu'à midi. Les gants, les sacs et les pinces sont fournis. Portez des bottes ou de vieilles chaussures, car le terrain peut être boueux, et n'oubliez pas une bouteille d'eau : il n'y aura pas de fontaine sur place."],
      ["N", "Cette journée est organisée avec l'association Rivière propre, qui surveille la qualité de l'eau toute l'année. Ses membres expliqueront aux participants pourquoi les déchets en plastique sont si dangereux pour les poissons et les oiseaux, et comment éviter qu'ils arrivent dans la rivière."],
      ["N", "Les enfants sont les bienvenus, mais ils doivent être accompagnés d'un adulte. Pour eux, un petit concours est organisé : celui ou celle qui trouvera l'objet le plus étonnant gagnera une entrée gratuite à la piscine municipale."],
      ["N", "À midi, un repas sera offert à tous les bénévoles sous le grand chapiteau. Ensuite, ceux qui le souhaitent pourront aider au tri des déchets : le verre, le plastique et le métal seront envoyés au recyclage."],
      ["N", "L'an dernier, près de deux cents personnes ont participé, et plus d'une tonne de déchets a été ramassée : des bouteilles, bien sûr, mais aussi deux vélos et même une vieille télévision !"],
      ["N", "Pour participer, il suffit de s'inscrire sur le site de la mairie ou par téléphone, avant jeudi soir. L'inscription permet de prévoir assez de repas pour tout le monde. Vous pouvez aussi venir sans vous inscrire, mais le repas n'est alors pas garanti. En cas de forte pluie, l'activité sera reportée au dimanche, à la même heure. Merci d'avance pour votre aide, et à samedi !"],
    ], [
      ["Quel est le but de cette journée ?", ["Ramasser les déchets au bord de la rivière", "Planter des arbres dans le parc du Moulin", "Construire un nouveau pont au-dessus de la rivière", "Nettoyer les rues du centre-ville"], "« nettoyage des berges de la rivière… Les participants ramasseront les déchets le long de la rivière »"],
      ["Que doivent apporter les participants ?", ["De vieilles chaussures et de l'eau", "Des gants et des sacs pour les déchets", "Des pinces et un pique-nique", "Un vélo et un maillot de bain"], "Gloves, bags and pickers are provided. « Portez des bottes ou de vieilles chaussures… n'oubliez pas une bouteille d'eau »"],
      ["Que peuvent gagner les enfants ?", ["Une entrée gratuite à la piscine", "Un vélo trouvé dans la rivière", "Un repas offert sous le grand chapiteau", "Une vieille télévision réparée"], "« gagnera une entrée gratuite à la piscine municipale »"],
      ["Que se passera-t-il l'après-midi ?", ["Des volontaires trieront les déchets", "Les enfants iront à la piscine", "Un concert aura lieu sous le chapiteau", "La mairie remettra des prix aux bénévoles"], "« Ensuite, ceux qui le souhaitent pourront aider au tri des déchets »"],
      ["Pourquoi faut-il s'inscrire avant jeudi ?", ["Pour prévoir assez de repas", "Pour recevoir des gants à sa taille", "Parce que les places sont limitées", "Pour participer au concours des enfants"], "« L'inscription permet de prévoir assez de repas pour tout le monde. »"],
      ["Que se passera-t-il s'il pleut beaucoup ?", ["L'activité aura lieu le dimanche", "L'activité sera annulée", "Tout aura lieu sous la tente", "Le rendez-vous sera fixé à midi"], "« En cas de forte pluie, l'activité sera reportée au dimanche, à la même heure. »"],
    ], {
      scene: "A local radio announcement in a small French town; upbeat and friendly.",
      N: v("fr-fr-podcaster-1", "vivienne", "A friendly local radio host in her forties, warm and enthusiastic."),
    }),
    set("co-environnement-b2", "B2", "environnement", "Canicules : adapter nos villes", "Un journaliste interroge une urbaniste sur les vagues de chaleur.", [
      ["A", "Les étés sont de plus en plus chauds. Comment nos villes peuvent-elles s'adapter aux canicules ?"],
      ["B", "Le premier problème, ce sont les îlots de chaleur. Dans les quartiers où il y a beaucoup d'asphalte et peu d'arbres, la température peut être de plusieurs degrés plus élevée qu'ailleurs, surtout la nuit. L'écart peut atteindre dix degrés entre un parking en plein soleil et un parc ombragé, à quelques rues de distance. Et ce sont souvent les quartiers les plus pauvres, où les logements sont petits et mal isolés."],
      ["A", "Quelles solutions fonctionnent le mieux ?"],
      ["B", "Planter des arbres, bien sûr, mais aussi remplacer une partie de l'asphalte par des surfaces qui absorbent l'eau, peindre les toits en blanc, créer des fontaines et des parcs. Dans certaines villes, on transforme même les cours d'école : on enlève le bitume, on plante des arbres, et ces cours deviennent des îlots de fraîcheur ouverts aux habitants pendant l'été. Ces mesures sont assez simples, mais elles prennent du temps : un arbre met des années avant de donner vraiment de l'ombre."],
      ["A", "Ces aménagements coûtent cher. Qui doit payer ?"],
      ["B", "C'est un investissement, pas une dépense. Une ville plus verte, c'est moins de malades pendant les canicules, moins d'inondations quand il pleut fort, et des quartiers plus agréables toute l'année. Les villes peuvent aussi obtenir des aides de l'État, à condition de présenter un plan sérieux."],
      ["A", "Beaucoup de gens répondent : il suffit d'installer la climatisation."],
      ["B", "C'est une solution pour les personnes fragiles, mais pas pour toute une ville. Les climatiseurs rejettent de l'air chaud dans la rue et consomment beaucoup d'électricité, ce qui augmente la pollution. Autrement dit, ils nous rafraîchissent à l'intérieur en réchauffant l'extérieur."],
      ["A", "Et à court terme, que peut-on faire ?"],
      ["B", "À court terme, il faut surtout protéger les personnes vulnérables : les personnes âgées qui vivent seules, les malades, les travailleurs à l'extérieur. Certaines villes ouvrent des lieux climatisés et appellent directement les personnes à risque pendant les vagues de chaleur. C'est peu spectaculaire, mais cela sauve des vies."],
      ["A", "Les citoyens ont-ils aussi un rôle à jouer ?"],
      ["B", "Oui, et il est plus important qu'on ne le croit. Fermer les volets pendant la journée, aérer la nuit, installer des plantes sur son balcon… et surtout prendre des nouvelles de ses voisins âgés. Lors des dernières canicules, beaucoup de victimes étaient des personnes isolées, que personne n'était venu voir."],
    ], [
      ["Qu'est-ce qu'un « îlot de chaleur », selon l'urbaniste ?", ["Un quartier plus chaud que les autres", "Une île où il fait toujours chaud", "Un logement petit et mal isolé du centre", "Un parc équipé de fontaines"], "« la température peut être de plusieurs degrés plus élevée qu'ailleurs »"],
      ["Pourquoi planter des arbres n'est-il pas une solution rapide ?", ["Ils mettent des années à donner de l'ombre", "Ils coûtent plus cher que les fontaines", "Il faut d'abord remplacer tout l'asphalte des rues", "Ils consomment trop d'eau en été"], "« un arbre met des années avant de donner vraiment de l'ombre »"],
      ["Selon l'urbaniste, que représentent ces aménagements ?", ["Un investissement plutôt qu'une dépense", "Une dépense trop lourde pour les villes", "Une solution réservée aux quartiers riches", "Un luxe que seul l'État peut payer"], "« C'est un investissement, pas une dépense. »"],
      ["Que reproche-t-elle à la climatisation ?", ["Elle réchauffe l'air de la rue", "Elle coûte trop cher aux familles", "Elle est mauvaise pour la santé", "Elle ne fonctionne pas bien la nuit"], "« Les climatiseurs rejettent de l'air chaud dans la rue… ils nous rafraîchissent à l'intérieur en réchauffant l'extérieur »"],
      ["Que font certaines villes pendant les vagues de chaleur ?", ["Elles appellent les personnes à risque", "Elles distribuent des ventilateurs", "Elles interdisent le travail à l'extérieur", "Elles ferment les parcs l'après-midi"], "« appellent directement les personnes à risque pendant les vagues de chaleur »"],
      ["Qu'est-ce qui a frappé l'urbaniste lors des dernières canicules ?", ["Beaucoup de victimes vivaient isolées", "Les parcs étaient trop peu nombreux", "Les climatiseurs sont tombés en panne", "Les voisins ont appelé les secours trop tard"], "« beaucoup de victimes étaient des personnes isolées, que personne n'était venu voir »"],
    ], {
      scene: "A radio interview on a French public station about heat waves; calm and informative.",
      A: v("fr-fr-podcaster-8", "remy", "A radio journalist in his late twenties, warm and engaged."),
      B: v("fr-fr-advisor-7", "vivienne", "An urban planner in her thirties, confident, clear and convincing."),
    }),

    /* ---------- Technologie ---------- */
    set("co-technologie-b1", "B1", "technologie", "Ateliers numériques à la bibliothèque", "Vous écoutez une annonce à la bibliothèque municipale.", [
      ["N", "Vous avez du mal à utiliser votre téléphone intelligent ou votre tablette ? Cet automne, la bibliothèque municipale propose des ateliers numériques gratuits pour les personnes de 60 ans et plus. L'an dernier, plus de cent personnes y ont participé."],
      ["N", "Les ateliers ont lieu chaque mardi après-midi, de 14 h à 16 h, pendant huit semaines. La première semaine, vous apprendrez à prendre des photos et à les envoyer à vos proches. Ensuite, un animateur vous montrera comment faire un appel vidéo avec votre famille, même si elle vit à l'autre bout du monde."],
      ["N", "Une séance entière sera consacrée à la sécurité : comment reconnaître les messages frauduleux, comment créer un bon mot de passe, et pourquoi il ne faut jamais donner ses informations bancaires par courriel. Vous apprendrez aussi à utiliser les applications de transport, pour connaître l'heure du prochain autobus, et à prendre rendez-vous chez le médecin en ligne. Enfin, les dernières semaines, vous découvrirez les services en ligne de la ville et du gouvernement."],
      ["N", "Les groupes sont petits, huit personnes au maximum, pour que chacun puisse poser ses questions. Des étudiants bénévoles aident l'animateur pendant les séances. Ils parlent aussi anglais, espagnol et arabe, ce qui peut aider les personnes qui maîtrisent encore mal le français. Apportez votre propre appareil, bien chargé. Si vous n'en avez pas, la bibliothèque peut vous prêter une tablette pendant l'atelier."],
      ["N", "Pour vous inscrire, il faut avoir une carte de la bibliothèque. Elle est gratuite pour les résidents de la ville : présentez simplement une preuve d'adresse au comptoir. La salle des ateliers se trouve au deuxième étage, et un ascenseur est disponible."],
      ["N", "Les inscriptions commencent le 1er septembre, au comptoir ou par téléphone. Les places partent vite, alors ne tardez pas ! Et si vous avez une question urgente, venez au café numérique, le vendredi matin : des bénévoles vous aident, sans inscription."],
    ], [
      ["À qui s'adressent les ateliers ?", ["Aux personnes de 60 ans et plus", "Aux étudiants bénévoles", "Aux employés de la bibliothèque", "Aux familles qui vivent à l'étranger"], "« des ateliers numériques gratuits pour les personnes de 60 ans et plus »"],
      ["Qu'apprendra-t-on pendant la séance sur la sécurité ?", ["À reconnaître les messages frauduleux", "À réparer une tablette endommagée", "À payer ses factures par courriel", "À choisir un téléphone"], "« comment reconnaître les messages frauduleux, comment créer un bon mot de passe »"],
      ["Pourquoi les groupes sont-ils petits ?", ["Pour que chacun puisse poser ses questions", "Parce que la salle est au deuxième étage", "Parce qu'il y a peu de tablettes à prêter", "Parce que l'animateur n'a pas d'assistant bénévole"], "« huit personnes au maximum, pour que chacun puisse poser ses questions »"],
      ["Que se passe-t-il si on n'a pas d'appareil ?", ["On peut emprunter une tablette sur place", "On ne peut pas participer aux ateliers", "On doit en acheter un avant la première séance", "On regarde l'écran d'un étudiant"], "« la bibliothèque peut vous prêter une tablette pendant l'atelier »"],
      ["Que faut-il pour s'inscrire ?", ["Une carte de la bibliothèque", "Un téléphone intelligent récent et chargé", "Une lettre de son médecin", "Un abonnement payant"], "« Pour vous inscrire, il faut avoir une carte de la bibliothèque. »"],
      ["Que propose le café numérique du vendredi ?", ["De l'aide sans inscription", "Des ateliers de huit semaines", "Un café gratuit aux étudiants", "Des tablettes à acheter"], "« des bénévoles vous aident, sans inscription »"],
    ], {
      scene: "An announcement recorded for a Montréal public library; welcoming and clear.",
      N: v("fr-ca-tutor-1", "vivienne", "A librarian in her forties, natural, clear and welcoming."),
    }),
    set("co-technologie-b2", "B2", "technologie", "Le droit à la déconnexion", "Vous écoutez une chronique à la radio.", [
      ["N", "Répondre à un courriel du patron à vingt-deux heures, vérifier ses messages pendant les vacances : pour beaucoup de salariés, la frontière entre le travail et la vie privée a presque disparu. Avec le télétravail et les smartphones, le bureau nous suit désormais partout, jusque dans notre chambre. C'est pour répondre à ce problème que plusieurs pays ont adopté un droit à la déconnexion."],
      ["N", "Le principe est simple : en dehors de leurs heures de travail, les employés n'ont pas l'obligation de répondre aux messages professionnels, et ils ne peuvent pas être sanctionnés s'ils ne le font pas. En France, la loi le prévoit depuis 2017. Au Canada, l'Ontario oblige désormais les entreprises de vingt-cinq employés et plus à avoir une politique écrite sur la déconnexion."],
      ["N", "Certaines entreprises vont plus loin : elles bloquent l'envoi de courriels le soir et le week-end, ou elles affichent un message qui rappelle à l'expéditeur qu'il écrit en dehors des heures de travail. D'autres suppriment tout simplement les messages reçus pendant les vacances, et l'expéditeur est invité à écrire à un collègue."],
      ["N", "Les résultats sont encourageants, mais limités. Les employés concernés disent mieux dormir et mieux séparer leur vie personnelle de leur travail. En revanche, dans les entreprises où la charge de travail reste trop lourde, la loi change peu de choses : les salariés continuent de répondre, par peur de prendre du retard ou de passer pour moins motivés. Et certains admettent qu'ils préfèrent traiter leurs messages le soir, pour commencer la journée plus tranquillement."],
      ["N", "Les syndicats, eux, demandent d'aller plus loin. Selon eux, une simple politique écrite ne suffit pas : il faudrait aussi compter et payer les heures passées à répondre aux messages le soir. Les employeurs répondent que la souplesse profite aussi aux salariés, qui peuvent par exemple partir plus tôt pour aller chercher leurs enfants."],
      ["N", "Il faut aussi tenir compte des différences entre les métiers. Pour un médecin de garde ou un technicien d'astreinte, être joignable fait partie du travail. La déconnexion, dans ce cas, passe plutôt par des horaires clairs et des périodes de repos garanties."],
      ["N", "Pour les spécialistes, la déconnexion ne dépend donc pas seulement de la loi. Elle dépend surtout de l'exemple donné par les dirigeants : un patron qui envoie des messages à minuit, même sans exiger de réponse, envoie un signal très clair à toute son équipe."],
    ], [
      ["Quel est le principe du droit à la déconnexion ?", ["Ne pas devoir répondre après ses heures", "Ne plus utiliser son téléphone au travail", "Pouvoir travailler à distance le vendredi", "Travailler moins d'heures chaque semaine"], "« en dehors de leurs heures de travail, les employés n'ont pas l'obligation de répondre aux messages professionnels »"],
      ["Que doivent faire les entreprises ontariennes de vingt-cinq employés et plus ?", ["Avoir une politique écrite sur la déconnexion", "Bloquer tous les courriels après vingt-deux heures", "Payer les messages envoyés le soir", "Offrir des vacances plus longues"], "« l'Ontario oblige désormais les entreprises de vingt-cinq employés et plus à avoir une politique écrite sur la déconnexion »"],
      ["Que font certaines entreprises pendant les vacances de leurs employés ?", ["Elles suppriment les messages reçus", "Elles paient les heures supplémentaires", "Elles envoient les courriels le week-end", "Elles demandent un numéro de téléphone"], "« D'autres suppriment tout simplement les messages reçus pendant les vacances »"],
      ["Dans quel cas la loi change-t-elle peu de choses ?", ["Quand la charge de travail reste trop lourde", "Quand l'entreprise a moins de vingt-cinq employés", "Quand les salariés sont en vacances", "Quand le patron n'envoie aucun message"], "« dans les entreprises où la charge de travail reste trop lourde, la loi change peu de choses »"],
      ["Que demandent les syndicats ?", ["Que les heures passées à répondre soient payées", "Que les patrons n'envoient plus aucun courriel", "Que la loi s'applique à tous les médecins", "Que les employés puissent partir plus tôt"], "« il faudrait aussi compter et payer les heures passées à répondre aux messages le soir ». Leaving early is the employers' argument."],
      ["Selon les spécialistes, qu'est-ce qui compte surtout ?", ["L'exemple donné par les dirigeants", "Le nombre de messages envoyés", "La qualité des téléphones fournis", "Les sanctions prévues par la nouvelle loi"], "« Elle dépend surtout de l'exemple donné par les dirigeants »"],
    ], {
      scene: "A radio chronicle on a French station about work and technology; thoughtful, slightly ironic.",
      N: v("fr-fr-podcaster-2", "remy", "A radio columnist in his thirties, resonant and witty, but clear."),
    }),

    /* ---------- Société ---------- */
    set("co-societe-b1", "B1", "societe", "Jardin communautaire : places disponibles", "Vous écoutez une annonce sur la radio du quartier.", [
      ["N", "Vous rêvez de cultiver vos propres légumes ? Le jardin communautaire de la rue Masson a encore quelques parcelles disponibles pour la saison, qui commence à la mi-mai et se termine à la fin du mois d'octobre."],
      ["N", "Chaque parcelle mesure dix mètres carrés et coûte 30 $ pour toute la saison. Les outils, l'eau et le compost sont fournis. En échange, chaque jardinier doit donner deux heures par mois pour l'entretien des espaces communs : les allées, la cabane à outils et le coin compost."],
      ["N", "Pas besoin d'être un expert : des jardiniers expérimentés donnent des conseils tous les samedis matin. Vous apprendrez quand semer, comment arroser sans gaspiller l'eau et comment protéger vos plants contre les insectes, sans produits chimiques. Au jardin, les pesticides sont d'ailleurs interdits."],
      ["N", "Chaque jardinier reçoit aussi un petit guide, en français et en anglais, avec le calendrier des semis et les règles du jardin. Par exemple, il est interdit de planter des arbres ou des plantes trop hautes, qui feraient de l'ombre aux parcelles voisines. Et les parcelles doivent rester entretenues : une parcelle abandonnée pendant plus d'un mois peut être donnée à quelqu'un d'autre."],
      ["N", "Le jardin, c'est aussi une belle occasion de rencontrer vos voisins. On y croise des familles, des retraités, des étudiants, et des nouveaux arrivants qui font pousser les légumes de leur pays. Chaque année, en septembre, une grande fête des récoltes réunit tous les jardiniers autour d'un repas préparé avec les légumes du jardin."],
      ["N", "Nouveauté cette année : quatre bacs surélevés ont été installés pour les personnes à mobilité réduite. On peut y jardiner assis, sans se pencher. Ces bacs sont réservés en priorité aux personnes âgées et aux personnes handicapées."],
      ["N", "Pour réserver une parcelle, présentez-vous au centre communautaire avec une preuve d'adresse, du lundi au vendredi. Les résidents du quartier sont prioritaires. Quand toutes les parcelles sont prises, on peut s'inscrire sur une liste d'attente : chaque année, quelques places se libèrent en juin."],
    ], [
      ["Qu'est-ce que le jardin communautaire propose ?", ["Des parcelles pour cultiver des légumes", "Des cours de cuisine avec des légumes", "Des légumes gratuits pour les voisins", "Un marché de légumes bios chaque samedi matin"], "« quelques parcelles disponibles pour la saison »"],
      ["Qu'est-ce qui est demandé aux jardiniers en échange ?", ["Deux heures d'entretien chaque mois", "Un panier de légumes chaque mois", "Une réunion chaque samedi matin", "Un examen de jardinage en mai"], "« chaque jardinier doit donner deux heures par mois pour l'entretien des espaces communs »"],
      ["Que peut-on apprendre le samedi matin ?", ["À protéger ses plants sans produits chimiques", "À utiliser les pesticides sans danger pour la santé", "À préparer un repas avec ses légumes", "À construire une cabane à outils"], "« comment protéger vos plants contre les insectes, sans produits chimiques ». Pesticides are banned."],
      ["Que se passe-t-il chaque année en septembre ?", ["Une fête réunit les jardiniers", "Les parcelles sont redistribuées", "Le compost est vendu aux voisins", "La saison de jardinage commence"], "« une grande fête des récoltes réunit tous les jardiniers »"],
      ["À quoi servent les bacs surélevés ?", ["À jardiner assis, sans se pencher", "À faire pousser des légumes plus vite", "À protéger les plants des insectes", "À ranger les outils du jardin"], "« On peut y jardiner assis, sans se pencher. »"],
      ["Que peut-on faire si toutes les parcelles sont prises ?", ["S'inscrire sur une liste d'attente", "Louer une parcelle dans un autre quartier", "Partager la parcelle d'un voisin", "Revenir au centre en octobre"], "« on peut s'inscrire sur une liste d'attente : chaque année, quelques places se libèrent en juin »"],
    ], {
      scene: "A neighbourhood radio announcement in Montréal's Rosemont district; cheerful and relaxed.",
      N: v("fr-fr-podcaster-9", "vivienne", "A young neighbourhood radio host, clear, friendly and upbeat."),
    }),

    /* ---------- Éducation ---------- */
    set("co-education-b2", "B2", "education", "Apprendre une langue à l'âge adulte", "Une journaliste interroge un linguiste.", [
      ["A", "On entend souvent dire qu'il est trop tard pour apprendre une langue après vingt ans. Est-ce vrai ?"],
      ["B", "C'est une idée reçue. Les enfants ont un avantage pour la prononciation, c'est vrai : ils imitent plus facilement les sons. Mais les adultes apprennent souvent plus vite la grammaire et le vocabulaire, parce qu'ils savent organiser leur apprentissage et qu'ils peuvent s'appuyer sur une première langue."],
      ["A", "Alors, qu'est-ce qui fait la différence ?"],
      ["B", "Surtout la quantité de contact avec la langue. Un adulte qui suit trois heures de cours par semaine, puis parle uniquement sa langue maternelle le reste du temps, progressera lentement. Celui qui écoute la radio, lit la presse, parle avec des collègues ou fait du bénévolat avancera beaucoup plus vite."],
      ["A", "Et les applications sur téléphone, elles sont efficaces ?"],
      ["B", "Elles sont utiles pour le vocabulaire, à condition de les utiliser tous les jours. Mais elles ne remplacent pas la conversation. On peut réussir tous les exercices d'une application et rester incapable de commander un café, parce que parler, c'est aussi réagir vite, deviner, oser. Je conseille plutôt de les combiner avec de vrais échanges, même courts."],
      ["A", "Vous parlez des adultes en général. L'âge joue-t-il quand même un rôle après cinquante ou soixante ans ?"],
      ["B", "Un peu, pour la mémoire à court terme. Mais les personnes âgées ont souvent un atout : du temps et de la patience. J'ai vu des retraités apprendre l'italien pour lire leurs auteurs préférés dans le texte, et progresser plus vite que leurs petits-enfants. Et apprendre une langue est excellent pour le cerveau : c'est l'un des meilleurs exercices pour garder l'esprit vif."],
      ["A", "Beaucoup d'adultes s'inquiètent de leur accent. Faut-il chercher à le perdre ?"],
      ["B", "Non, l'objectif, c'est d'être compris, pas de passer pour un natif. Un accent léger ne gêne personne. Il vaut mieux travailler les sons qui changent le sens des mots, comme « dessus » et « dessous », plutôt que de viser une prononciation parfaite."],
      ["A", "Et la peur de faire des erreurs ?"],
      ["B", "C'est le principal frein chez les adultes. Ils ont peur d'être jugés, alors ils se taisent. Or on apprend justement en se trompant. Les personnes qui progressent le plus vite sont rarement les plus douées : ce sont celles qui acceptent d'être maladroites pendant quelque temps. Mon conseil : parler tôt, même imparfaitement, se fixer un objectif concret, par exemple un examen ou un voyage, et considérer chaque erreur comme une information, pas comme un échec."],
    ], [
      ["Selon le linguiste, quel avantage les enfants ont-ils ?", ["Ils imitent plus facilement les sons", "Ils comprennent mieux la grammaire", "Ils ont davantage de temps libre", "Ils n'ont pas peur des examens"], "« Les enfants ont un avantage pour la prononciation… ils imitent plus facilement les sons. » Grammar is where adults are often faster."],
      ["Pourquoi les adultes apprennent-ils parfois plus vite le vocabulaire ?", ["Ils savent organiser leur apprentissage", "Ils suivent davantage de cours", "Ils ont une meilleure mémoire", "Ils passent plus de temps dans le pays étranger"], "« parce qu'ils savent organiser leur apprentissage et qu'ils peuvent s'appuyer sur une première langue »"],
      ["Qu'est-ce qui fait surtout la différence, selon lui ?", ["La quantité de contact avec la langue", "Le prix et la qualité des cours", "Le talent naturel de chacun pour les langues", "L'âge exact au début des études"], "« Surtout la quantité de contact avec la langue. »"],
      ["Que pense-t-il des applications sur téléphone ?", ["Elles aident, sans remplacer la conversation", "Elles suffisent pour apprendre à parler couramment", "Elles sont inutiles pour le vocabulaire", "Elles fatiguent plus que les cours"], "« Elles sont utiles pour le vocabulaire… Mais elles ne remplacent pas la conversation. »"],
      ["Que dit-il à propos de l'accent ?", ["Il faut surtout être compris", "Il faut le perdre complètement", "Il gêne toujours les natifs", "Il disparaît avec les applications"], "« l'objectif, c'est d'être compris, pas de passer pour un natif »"],
      ["Quel conseil donne-t-il à la fin ?", ["Parler tôt, même avec des erreurs", "Attendre de maîtriser la grammaire", "Éviter toutes les situations stressantes", "Suivre seulement des cours en ligne"], "« parler tôt, même imparfaitement »"],
    ], {
      scene: "A radio interview about learning languages as an adult; relaxed and encouraging.",
      A: v("fr-fr-podcaster-11", "vivienne", "A radio interviewer in her fifties, direct, curious and helpful."),
      B: v("fr-fr-tutor-7", "remy", "A linguist in his sixties, warm and conversational, with a touch of dry humour."),
    }),
    /* ---------- Santé ---------- */
    set("co-sante-b1", "B1", ["sante", "quotidien"], "Un rendez-vous à déplacer", "Vous écoutez une conversation téléphonique entre une employée d'une clinique médicale et un patient.", [
      ["A", "Bonjour, ici Karine, de la clinique médicale Saint-Laurent. Je vous appelle au sujet de votre rendez-vous avec le docteur Martin, prévu ce vendredi à 14 h."],
      ["B", "Oui, bonjour. Il y a un problème ?"],
      ["A", "Malheureusement, le docteur Martin sera absent ce jour-là : il participe à une formation à Québec. Je peux vous proposer deux possibilités : lundi prochain à 9 h 30 avec lui, ou ce vendredi à la même heure avec sa collègue, la docteure Lemieux."],
      ["B", "Je ne connais pas la docteure Lemieux. Est-ce qu'elle aura accès à mon dossier ?"],
      ["A", "Oui, bien sûr, tout est dans votre dossier électronique : vos anciennes visites, vos vaccins et vos médicaments. Elle travaille à la clinique depuis cinq ans, et les patients l'apprécient beaucoup."],
      ["B", "D'accord. Mais je dois d'abord vérifier mon horaire de travail. Est-ce que je peux vous rappeler ?"],
      ["A", "Bien sûr, mais rappelez-nous avant jeudi midi. Sans réponse de votre part, votre rendez-vous sera automatiquement déplacé à lundi, avec le docteur Martin."],
      ["B", "Entendu. J'en profite pour vous demander : j'ai fait une prise de sang il y a deux semaines. Les résultats sont arrivés ?"],
      ["A", "Oui, ils sont dans votre dossier. Je ne peux pas vous les donner par téléphone, mais le médecin en parlera avec vous pendant le rendez-vous. S'il y avait eu quelque chose d'urgent, on vous aurait déjà appelé, rassurez-vous."],
      ["B", "Ah, tant mieux, ça me rassure. Est-ce que je dois apporter quelque chose ?"],
      ["A", "Votre carte d'assurance maladie et la liste de vos médicaments. Et je vois que vous avez déménagé : arrivez quinze minutes plus tôt pour mettre à jour votre adresse à l'accueil. Le stationnement de la clinique est gratuit pour les patients, mais il se remplit vite l'après-midi."],
      ["B", "Très bien. Et si je choisis la docteure Lemieux, est-ce que je devrai la revoir ensuite ?"],
      ["A", "Non, c'est seulement pour ce rendez-vous. Pour le suivi, vous restez avec le docteur Martin. Bonne journée, et à bientôt !"],
    ], [
      ["Pourquoi la clinique appelle-t-elle ?", ["Le médecin sera absent vendredi", "La clinique fermera vendredi", "Il manque un document au dossier", "Le patient a manqué un rendez-vous"], "« le docteur Martin sera absent ce jour-là »"],
      ["Pourquoi le docteur Martin sera-t-il absent ?", ["Il suit une formation à Québec", "Il est malade depuis lundi", "Il part en vacances à Québec", "Il déménage dans une autre clinique"], "« il participe à une formation à Québec »"],
      ["Quelle possibilité garde le même jour et la même heure ?", ["Voir la docteure Lemieux", "Voir le docteur Martin lundi", "Rappeler la clinique jeudi", "Venir à la clinique à 9 h 30"], "« ou ce vendredi à la même heure avec sa collègue, la docteure Lemieux »"],
      ["Que se passera-t-il si le patient ne rappelle pas ?", ["Son rendez-vous passera à lundi", "Son rendez-vous sera annulé", "Il verra la docteure Lemieux vendredi à 14 h", "Il devra payer des frais"], "« Sans réponse de votre part, votre rendez-vous sera automatiquement déplacé à lundi »"],
      ["Que dit Karine des résultats de la prise de sang ?", ["Le médecin les expliquera au rendez-vous", "Ils ne sont pas encore arrivés à la clinique", "Ils montrent un problème urgent", "Elle les lira au patient par téléphone"], "« le médecin en parlera avec vous pendant le rendez-vous. S'il y avait eu quelque chose d'urgent, on vous aurait déjà appelé »"],
      ["Pourquoi le patient doit-il arriver plus tôt ?", ["Pour changer son adresse à l'accueil", "Pour refaire une prise de sang", "Pour rencontrer la docteure Lemieux", "Pour trouver une place de stationnement gratuite"], "« vous avez déménagé : arrivez quinze minutes plus tôt pour mettre à jour votre adresse à l'accueil »"],
    ], {
      scene: "A phone call from a medical clinic in Montréal to a patient; polite and reassuring.",
      A: v("fr-fr-advisor-9", "vivienne", "A clinic receptionist in her twenties, warm, polite and efficient."),
      B: v("fr-fr-advisor-4", "remy", "A patient in his forties, relaxed, with a little dry humour."),
    }),
    set("co-sante-b2", "B2", "sante", "Le sommeil des adolescents", "Vous écoutez un reportage à la radio.", [
      ["N", "Les adolescents dorment de moins en moins. Selon plusieurs études, une majorité d'entre eux dort moins de huit heures par nuit, alors que les médecins en recommandent entre huit et dix. Et ce manque de sommeil ne se rattrape pas vraiment le week-end : dormir jusqu'à midi le dimanche dérègle encore davantage l'horloge interne."],
      ["N", "Les écrans sont souvent montrés du doigt, et pour cause : la lumière des téléphones retarde l'endormissement, et les réseaux sociaux poussent à rester connecté tard. Mais il y a aussi une explication biologique. À l'adolescence, l'horloge interne se décale : les jeunes ont naturellement sommeil plus tard le soir, et ils ont du mal à se réveiller tôt."],
      ["N", "Les conséquences sont nombreuses. Un adolescent qui manque de sommeil a plus de mal à se concentrer et à retenir ce qu'il apprend. Il est aussi plus irritable, plus anxieux, et, pour ceux qui conduisent déjà, plus exposé aux accidents. Certaines études font même un lien entre le manque de sommeil et la prise de poids, parce que la fatigue pousse à grignoter."],
      ["N", "« Le sommeil n'est pas du temps perdu », rappelle une pédiatre que nous avons interrogée. C'est pendant la nuit que le cerveau trie les informations de la journée et fixe ce qui a été appris. Un élève qui révise tard le soir au lieu de dormir risque donc d'oublier une partie de ce qu'il a étudié."],
      ["N", "C'est pourquoi certaines écoles ont décidé de commencer les cours plus tard, vers neuf heures au lieu de huit heures. En Californie, une loi impose même aux lycées de ne pas commencer avant huit heures et demie. Les premiers résultats sont positifs : moins de retards, moins d'absences et une meilleure concentration en classe. Les élèves, eux, disent se sentir moins fatigués dès la deuxième semaine."],
      ["N", "Tous les établissements ne peuvent pas changer leurs horaires, notamment à cause du transport scolaire, organisé pour plusieurs écoles à la fois. Les médecins conseillent donc aux familles d'agir à la maison : pas d'écran dans la chambre la nuit, et des heures de coucher régulières, même le week-end."],
      ["N", "Ils rappellent aussi quelques règles simples : s'exposer à la lumière du jour le matin, faire du sport, mais pas juste avant de se coucher, et éviter les boissons énergisantes, très populaires chez les adolescents, qui contiennent autant de caféine que plusieurs cafés. Et rien n'empêche de faire une courte sieste en début d'après-midi, à condition qu'elle ne dépasse pas vingt minutes."],
    ], [
      ["Combien d'heures de sommeil les médecins recommandent-ils aux adolescents ?", ["Entre huit et dix heures", "Un peu moins de huit heures", "Six heures au minimum", "Au moins douze heures"], "« les médecins en recommandent entre huit et dix »"],
      ["Que dit le reportage à propos du week-end ?", ["Dormir tard dérègle l'horloge interne", "Il permet de rattraper le sommeil perdu", "Les jeunes y dorment moins qu'en semaine", "Les écrans y sont moins utilisés"], "« dormir jusqu'à midi le dimanche dérègle encore davantage l'horloge interne »"],
      ["Quelle explication biologique le reportage donne-t-il ?", ["L'horloge interne se décale vers le soir", "Les adolescents ont besoin de moins dormir", "La lumière du matin les réveille trop tôt", "La croissance les empêche de s'endormir"], "« l'horloge interne se décale : les jeunes ont naturellement sommeil plus tard le soir »"],
      ["Pourquoi, selon la pédiatre, réviser tard le soir est-il une mauvaise idée ?", ["Le cerveau fixe les connaissances la nuit", "Les écrans fatiguent trop les yeux", "Les parents dorment déjà", "Les élèves boivent alors trop de café"], "« C'est pendant la nuit que le cerveau… fixe ce qui a été appris. Un élève qui révise tard le soir au lieu de dormir risque donc d'oublier »"],
      ["Pourquoi toutes les écoles ne changent-elles pas leurs horaires ?", ["À cause du transport scolaire", "Parce que les parents refusent", "Parce que les élèves préfèrent huit heures", "Parce que la loi l'interdit"], "« notamment à cause du transport scolaire, organisé pour plusieurs écoles à la fois »"],
      ["Que disent les médecins des boissons énergisantes ?", ["Elles contiennent beaucoup de caféine", "Elles aident à se concentrer en classe", "Elles remplacent bien un repas", "Elles sont interdites aux adolescents"], "« qui contiennent autant de caféine que plusieurs cafés »"],
    ], {
      scene: "A health report on a French radio station; calm, informative and caring.",
      N: v("fr-fr-podcaster-5", "vivienne", "An experienced radio journalist in her sixties, professional and approachable."),
    }),

    /* ---------- Gouvernement ---------- */
    set("co-gouvernement-b1", "B1", "gouvernement", "Élections municipales : comment voter", "Vous écoutez un message d'information de la ville.", [
      ["N", "Les élections municipales auront lieu le dimanche 2 novembre. Vous élirez le maire ou la mairesse, ainsi que les conseillers municipaux de votre quartier. Les bureaux de vote seront ouverts de 10 h à 20 h."],
      ["N", "Pour voter, vous devez avoir 18 ans le jour du vote, être citoyen canadien et habiter la ville depuis au moins six mois. Vérifiez que votre nom est inscrit sur la liste électorale : au début du mois d'octobre, vous recevrez un avis par la poste. Cet avis indique l'adresse de votre bureau de vote."],
      ["N", "Si vous ne recevez pas cet avis, ou si votre nom est mal écrit, présentez-vous au bureau de révision de la liste électorale, à l'hôtel de ville, avant le 20 octobre. N'oubliez pas d'apporter deux documents : une pièce d'identité et une preuve d'adresse."],
      ["N", "Le jour du vote, présentez-vous avec une pièce d'identité avec photo, comme votre permis de conduire ou votre carte d'assurance maladie. Tous les bureaux de vote sont accessibles en fauteuil roulant, et le personnel peut aider les personnes qui ont du mal à lire le bulletin."],
      ["N", "Les enfants peuvent accompagner leurs parents dans le bureau de vote : c'est une bonne façon de leur montrer comment fonctionne la démocratie. Et si vous êtes hospitalisé ou si vous ne pouvez pas vous déplacer, contactez la ville avant le 15 octobre : dans certains cas, un employé peut venir recueillir votre vote à domicile."],
      ["N", "Vous ne serez pas disponible le 2 novembre ? Vous pouvez voter par anticipation le dimanche précédent, le 26 octobre, dans les mêmes bureaux et aux mêmes heures."],
      ["N", "Pour vous aider à faire votre choix, un débat entre les candidats à la mairie aura lieu le 22 octobre à 19 h, à la bibliothèque centrale. Il sera aussi diffusé en direct sur le site de la ville. Les résultats seront publiés sur ce site dès la fermeture des bureaux, le soir de l'élection."],
    ], [
      ["Quand a lieu l'élection ?", ["Le 2 novembre", "Le dimanche 26 octobre", "Le mercredi 22 octobre", "Au début du mois d'octobre"], "« Les élections municipales auront lieu le dimanche 2 novembre. » The 26th is early voting."],
      ["Quelle condition faut-il remplir pour voter ?", ["Habiter la ville depuis six mois", "Être propriétaire de son logement", "Avoir un permis de conduire valide", "Travailler dans la ville depuis un an"], "« être citoyen canadien et habiter la ville depuis au moins six mois »"],
      ["Que faire si on n'a pas reçu l'avis par la poste ?", ["Aller à l'hôtel de ville avant le 20 octobre", "Voter par anticipation le 26 octobre", "Attendre un deuxième avis en novembre", "Téléphoner pendant le débat du 22 octobre"], "« présentez-vous au bureau de révision de la liste électorale, à l'hôtel de ville, avant le 20 octobre »"],
      ["Que faut-il apporter le jour du vote ?", ["Une pièce d'identité avec photo", "L'avis reçu par la poste", "Une preuve d'adresse de moins de trois mois", "Son certificat de citoyenneté"], "« présentez-vous avec une pièce d'identité avec photo »"],
      ["Que peut faire une personne hospitalisée ?", ["Demander à voter depuis son domicile", "Envoyer un proche voter à sa place", "Voter par téléphone le 2 novembre", "Voter en ligne sur le site de la ville"], "« contactez la ville avant le 15 octobre : dans certains cas, un employé peut venir recueillir votre vote à domicile »"],
      ["Qu'est-ce qui aura lieu le 22 octobre ?", ["Un débat entre les candidats à la mairie", "La publication des résultats", "L'envoi des avis par la poste", "La révision de la liste électorale"], "« un débat entre les candidats à la mairie aura lieu le 22 octobre à 19 h »"],
    ], {
      scene: "A public information message from a Québec city; clear, neutral and reassuring.",
      N: v("fr-fr-podcaster-12", "remy", "A municipal announcer in his fifties, clear, friendly and measured."),
    }),
    set("co-gouvernement-b2", "B2", "gouvernement", "Consulter les citoyens : pour quoi faire ?", "Vous écoutez une chronique à la radio.", [
      ["N", "Nouveau parc, nouvelle ligne de tramway, transformation d'un quartier : de plus en plus de projets publics passent par une consultation citoyenne. Sur le papier, l'idée est excellente. Qui connaît mieux un quartier que ceux qui y vivent ?"],
      ["N", "Dans les faits, pourtant, ces consultations déçoivent souvent. D'abord parce que ce sont toujours les mêmes qui y participent : des retraités, des propriétaires, des citoyens déjà engagés. Les jeunes, les locataires et les nouveaux arrivants y sont rarement représentés, souvent parce que les réunions ont lieu en semaine, à dix-huit heures, quand ils travaillent ou s'occupent de leurs enfants."],
      ["N", "Ensuite parce que les participants ont parfois l'impression que les décisions sont déjà prises, et qu'on leur demande simplement de les approuver. Quand un projet est présenté avec des plans détaillés et un budget fixé, il reste peu de place pour de véritables propositions."],
      ["N", "Il y a aussi une question de langage. Les documents présentés sont souvent techniques, remplis de sigles et de termes juridiques. Pour un habitant qui découvre le dossier, il est difficile de donner un avis sur un plan d'urbanisme de deux cents pages. Résultat : ceux qui maîtrisent ce vocabulaire prennent la parole, et les autres se taisent."],
      ["N", "Certaines villes essaient de faire autrement. Elles tirent au sort des citoyens, comme pour un jury, afin d'obtenir un groupe qui ressemble vraiment à la population. Ces citoyens reçoivent une information complète, entendent des experts, puis formulent des recommandations. Ils sont indemnisés pour leur temps, ce qui permet aussi à ceux qui ont peu de moyens de participer."],
      ["N", "Dans une ville de taille moyenne, un jury de trente citoyens tirés au sort a ainsi travaillé pendant trois week-ends sur l'avenir du centre-ville. Ses propositions, comme la création de rues réservées aux piétons le samedi, ont été en grande partie adoptées par le conseil municipal."],
      ["N", "Les plateformes en ligne, elles, attirent davantage de jeunes, mais elles ont leurs limites : on y vote en un clic, sans vraiment débattre, et un groupe bien organisé peut facilement faire croire que son avis est majoritaire. Certaines villes combinent donc les deux : un débat en ligne, puis des réunions de quartier pour approfondir."],
      ["N", "Dans tous les cas, une règle semble essentielle : les autorités doivent répondre publiquement, expliquer ce qu'elles retiennent, et pourquoi elles refusent le reste. Car une consultation n'a de sens que si les citoyens peuvent voir ce que leur parole a changé."],
    ], [
      ["Quel problème de participation la chronique souligne-t-elle ?", ["Ce sont toujours les mêmes qui participent", "Presque personne ne vient aux réunions du soir", "Les consultations coûtent trop cher", "Les experts refusent de participer"], "« ce sont toujours les mêmes qui y participent »"],
      ["Pourquoi les jeunes et les locataires participent-ils peu ?", ["Les réunions tombent pendant leur travail", "Ils ne s'intéressent pas à leur quartier", "Ils ne sont pas autorisés à voter", "Les réunions ont lieu trop loin de chez eux"], "« les réunions ont lieu en semaine, à dix-huit heures, quand ils travaillent ou s'occupent de leurs enfants »"],
      ["Quelle impression ont parfois les participants ?", ["Que tout est déjà décidé", "Qu'ils sont trop nombreux", "Que les projets sont inutiles", "Qu'on les paie pour venir"], "« l'impression que les décisions sont déjà prises »"],
      ["Pourquoi certaines villes tirent-elles des citoyens au sort ?", ["Pour avoir un groupe représentatif", "Pour aller plus vite dans les décisions", "Pour éviter de payer des experts", "Pour choisir les futurs élus de la ville"], "« afin d'obtenir un groupe qui ressemble vraiment à la population »"],
      ["Qu'est-il arrivé aux propositions du jury de trente citoyens ?", ["La plupart ont été adoptées", "Elles ont toutes été refusées", "Elles seront votées en ligne", "Elles ont été confiées à des experts"], "« Ses propositions… ont été en grande partie adoptées par le conseil municipal. »"],
      ["Qu'est-ce qui donne son sens à une consultation, selon la chronique ?", ["Voir ce que la parole citoyenne a changé", "Réunir beaucoup de personnes", "Durer au moins plusieurs mois", "Être organisée par des experts reconnus"], "« une consultation n'a de sens que si les citoyens peuvent voir ce que leur parole a changé »"],
    ], {
      scene: "An opinion chronicle on a French radio station about local democracy; measured and engaging.",
      N: v("fr-fr-podcaster-4", "remy", "A radio columnist in his fifties, laid-back, encouraging and clear."),
    }),

    /* ---------- Économie ---------- */
    set("co-economie-b1", "B1", "economie", "Le salaire minimum augmente", "Vous écoutez les nouvelles à la radio.", [
      ["N", "Bonne nouvelle pour les travailleurs payés au salaire minimum : à partir du 1er mai, leur salaire passera de quinze dollars soixante-quinze à seize dollars vingt-cinq de l'heure. Environ trois cent mille personnes sont concernées dans la province, surtout dans la restauration et le commerce de détail."],
      ["N", "Les employés qui reçoivent des pourboires, comme les serveurs et les serveuses, verront aussi leur salaire augmenter, de douze dollars soixante à treize dollars de l'heure. Une serveuse qui travaille quatre soirs par semaine dans un restaurant du Vieux-Québec, interrogée ce matin, se dit soulagée : « Avec les prix à l'épicerie, chaque dollar compte. »"],
      ["N", "Pour le gouvernement, cette hausse doit aider les ménages à faire face à l'augmentation du coût de la vie, en particulier du loyer et de l'épicerie. Selon ses calculs, un employé à temps plein gagnera environ mille dollars de plus par an. La ministre du Travail explique qu'elle a voulu trouver un équilibre entre le pouvoir d'achat des travailleurs et la santé des petites entreprises."],
      ["N", "Les syndicats saluent la mesure, mais la jugent insuffisante. Selon eux, il faudrait au moins dix-huit dollars de l'heure pour vivre correctement dans les grandes villes, où un appartement de deux chambres coûte souvent plus de mille cinq cents dollars par mois."],
      ["N", "Du côté des petites entreprises, on s'inquiète au contraire. Certains restaurateurs affirment qu'ils devront augmenter leurs prix ou réduire les heures de leurs employés. Le propriétaire d'un dépanneur explique qu'il a déjà dû augmenter le prix du café et des sandwichs l'an dernier. D'autres, en revanche, voient la hausse d'un bon œil : dans un marché où il est difficile de recruter, un meilleur salaire aide à garder son personnel."],
      ["N", "Le gouvernement annonce enfin que le salaire minimum sera désormais révisé chaque année, en fonction de l'inflation. La prochaine révision est prévue au printemps prochain. Les associations de commerçants, elles, demandent à être consultées avant chaque décision."],
    ], [
      ["Quand le salaire minimum augmentera-t-il ?", ["Le 1er mai", "Le 1er janvier", "Le 1er juillet", "Le mois prochain"], "« à partir du 1er mai »"],
      ["Quels secteurs sont surtout concernés ?", ["La restauration et la vente au détail", "La santé et les services sociaux", "L'industrie et les chantiers de construction", "Les banques et les assurances"], "« surtout dans la restauration et le commerce de détail »"],
      ["Que pense la serveuse interrogée ?", ["Chaque dollar compte pour elle", "Les pourboires vont diminuer", "Les prix vont trop augmenter", "Son patron va réduire ses heures"], "« Avec les prix à l'épicerie, chaque dollar compte. »"],
      ["Que demandent les syndicats ?", ["Un salaire minimum d'au moins 18 $", "Une baisse des loyers dans les villes", "Des pourboires plus élevés", "Une révision tous les six mois"], "« il faudrait au moins dix-huit dollars de l'heure pour vivre correctement »"],
      ["Pourquoi certains restaurateurs sont-ils plutôt favorables à la hausse ?", ["Elle les aide à garder leurs employés", "Elle leur permet d'augmenter leurs prix", "Elle attire plus de clients le soir", "Elle réduit leurs impôts"], "« dans un marché où il est difficile de recruter, un meilleur salaire aide à garder son personnel »"],
      ["Qu'est-ce qui changera à partir de maintenant ?", ["Le salaire minimum sera revu chaque année", "Le salaire minimum sera fixé par les syndicats", "Les pourboires seront inclus dans les prix", "Les restaurants fermeront plus tôt"], "« le salaire minimum sera désormais révisé chaque année, en fonction de l'inflation »"],
    ], {
      scene: "A morning news bulletin on a Québec radio station; clear and neutral.",
      N: v("fr-fr-podcaster-11", "vivienne", "A news anchor in her late forties, confident, clear and neutral."),
    }),
    set("co-economie-b2", "B2", "economie", "L'inflation expliquée", "Vous écoutez une chronique économique à la radio.", [
      ["N", "On en parle partout, mais sait-on vraiment ce qu'est l'inflation ? En termes simples, c'est la hausse générale et durable des prix. On la mesure en suivant le prix d'un grand nombre de produits et de services achetés par les ménages. Quand l'inflation est de trois pour cent, un panier de courses qui coûtait cent euros l'an dernier en coûte cent trois aujourd'hui."],
      ["N", "Ses causes sont variées. Parfois, la demande augmente plus vite que la production : tout le monde veut acheter, et les prix montent. Parfois, ce sont les coûts qui explosent, par exemple quand le prix de l'énergie grimpe brutalement et que les entreprises répercutent cette hausse sur leurs clients."],
      ["N", "Une inflation faible et stable est considérée comme normale, et même souhaitable : la plupart des banques centrales visent environ deux pour cent par an. Le problème commence quand les prix augmentent plus vite que les salaires : le pouvoir d'achat diminue, et les ménages doivent faire des choix."],
      ["N", "À l'inverse, une inflation trop faible pose aussi problème. Quand les prix baissent, les consommateurs attendent pour acheter, en espérant payer moins cher plus tard. Les entreprises vendent moins, réduisent leurs investissements, et l'activité économique ralentit. C'est pourquoi les banques centrales ne visent pas une inflation nulle."],
      ["N", "Pour ralentir l'inflation, la banque centrale dispose d'un outil principal : les taux d'intérêt. En les augmentant, elle rend les prêts plus chers. Les ménages et les entreprises empruntent et dépensent moins, ce qui finit par freiner la hausse des prix. Mais cet effet n'est pas immédiat : il faut souvent attendre plus d'un an pour le mesurer."],
      ["N", "Et ce remède a ses effets secondaires. Les propriétaires qui ont un prêt immobilier à taux variable voient leurs paiements mensuels augmenter, et certaines entreprises reportent leurs projets d'investissement. Toute la difficulté consiste donc à freiner l'inflation sans provoquer de récession."],
      ["N", "L'inflation ne touche pas tout le monde de la même façon. Les épargnants voient la valeur de leurs économies fondre, tandis que ceux qui ont des dettes à taux fixe sont en partie avantagés. Et les ménages modestes, qui consacrent une grande part de leur budget à l'alimentation et au logement, sont souvent les premiers à souffrir."],
      ["N", "Pour se protéger, les économistes donnent quelques conseils simples : comparer les prix, acheter les produits de saison, éviter les achats à crédit et, pour ceux qui le peuvent, placer leur épargne sur des produits dont le rendement suit l'inflation."],
    ], [
      ["Selon la chronique, qu'est-ce que l'inflation ?", ["Une hausse générale et durable des prix", "Une baisse soudaine des salaires", "Une augmentation brutale des impôts sur le revenu", "Une crise grave des banques"], "« c'est la hausse générale et durable des prix »"],
      ["Quelle cause de l'inflation est citée ?", ["Une forte hausse du prix de l'énergie", "Une baisse de la demande des ménages", "Une production plus rapide que la demande", "Une diminution du nombre d'entreprises"], "« quand le prix de l'énergie grimpe brutalement et que les entreprises répercutent cette hausse sur leurs clients ». It's demand growing faster than production, not the reverse."],
      ["Quand l'inflation devient-elle un problème ?", ["Quand les salaires augmentent moins vite", "Quand elle reste faible et stable", "Quand elle atteint deux pour cent", "Quand les taux d'intérêt diminuent"], "« Le problème commence quand les prix augmentent plus vite que les salaires »"],
      ["Comment la banque centrale freine-t-elle l'inflation ?", ["En augmentant les taux d'intérêt", "En imprimant davantage de billets", "En baissant le salaire minimum", "En fixant le prix des aliments"], "« les taux d'intérêt. En les augmentant, elle rend les prêts plus chers »"],
      ["Quel effet secondaire de ce remède est mentionné ?", ["Des mensualités plus chères pour certains", "Des prix qui baissent beaucoup trop vite", "Des salaires qui augmentent plus fortement qu'avant", "Des banques qui prêtent davantage"], "« Les propriétaires qui ont un prêt immobilier à taux variable voient leurs paiements mensuels augmenter »"],
      ["Qui est souvent le premier à souffrir de l'inflation ?", ["Les ménages modestes", "Les épargnants très riches", "Les emprunteurs à taux fixe", "Les grandes entreprises"], "« les ménages modestes… sont souvent les premiers à souffrir ». Fixed-rate borrowers are partly advantaged."],
    ], {
      scene: "An economics chronicle on a French radio station; pedagogical and calm.",
      N: v("fr-fr-advisor-4", "remy", "An economist in his forties, confident, clear and pedagogical."),
    }),
    /* ---------- Logement ---------- */
    set("co-logement-b1", "B1", "logement", "Le renouvellement du bail", "Vous écoutez une conversation téléphonique entre un propriétaire et sa locataire.", [
      ["A", "Bonjour, madame Diallo, c'est Robert Gagnon, votre propriétaire. Je vous appelle au sujet du renouvellement de votre bail, qui se termine le 30 juin."],
      ["B", "Bonjour, monsieur Gagnon. Oui, je voulais justement vous en parler."],
      ["A", "Comme chaque année, je vais vous envoyer un avis par écrit. Le loyer augmentera de quarante dollars par mois à partir du 1er juillet, à cause de la hausse des taxes municipales et du prix du chauffage."],
      ["B", "Quarante dollars… C'est beaucoup pour moi. Est-ce que c'est négociable ?"],
      ["A", "On peut en discuter, bien sûr. Vous aurez un mois pour me répondre après avoir reçu l'avis. Si vous refusez l'augmentation, vous pouvez garder le logement, et c'est moi qui devrai demander au Tribunal administratif du logement de fixer le loyer."],
      ["B", "D'accord, je vais y réfléchir. Autre chose : le lave-vaisselle ne fonctionne plus depuis lundi."],
      ["A", "Ah, je ne le savais pas. J'envoie un réparateur jeudi matin, entre 8 h et midi. C'est une entreprise sérieuse, avec qui je travaille depuis longtemps. Vous serez à la maison ?"],
      ["B", "Non, je travaille, mais ma fille sera là. Elle a dix-sept ans."],
      ["A", "Parfait. Et j'ai une bonne nouvelle : nous allons remplacer toutes les fenêtres de l'immeuble cet été. Les travaux prendront deux jours par appartement, et je vous préviendrai une semaine à l'avance. Les nouvelles fenêtres devraient réduire vos frais de chauffage l'hiver prochain."],
      ["B", "Ça, c'est une excellente nouvelle. Les fenêtres de ma chambre laissent passer beaucoup d'air froid. Les travaux auront lieu quand ?"],
      ["A", "Probablement en août. L'entreprise viendra d'abord prendre les mesures, un matin de juillet. Il faudra seulement dégager l'espace devant les fenêtres."],
      ["B", "Très bien. Dernière question : mon voisin dit que les places de stationnement derrière l'immeuble vont devenir payantes. C'est vrai ?"],
      ["A", "Non, rassurez-vous, rien ne change pour le stationnement cette année. Si vous avez des questions sur l'avis, appelez-moi le soir, après 18 h. Bonne journée, madame Diallo !"],
    ], [
      ["Pourquoi le propriétaire appelle-t-il ?", ["Pour parler du renouvellement du bail", "Pour annoncer la vente de l'immeuble", "Pour réclamer un loyer en retard", "Pour organiser la visite d'un futur locataire"], "« Je vous appelle au sujet du renouvellement de votre bail »"],
      ["Pourquoi le loyer va-t-il augmenter ?", ["À cause des taxes et du chauffage", "À cause des nouvelles fenêtres", "Parce que le lave-vaisselle est neuf", "Parce que le stationnement devient payant"], "« à cause de la hausse des taxes municipales et du prix du chauffage »"],
      ["Que peut faire la locataire si elle refuse l'augmentation ?", ["Rester dans son logement", "Quitter le logement avant juillet", "Payer seulement la moitié de la hausse", "Déposer une plainte contre le propriétaire"], "« Si vous refusez l'augmentation, vous pouvez garder le logement »"],
      ["Qui recevra le réparateur jeudi ?", ["La fille de Mme Diallo", "Le propriétaire lui-même", "Une voisine de l'immeuble", "Mme Diallo, après son travail"], "« Non, je travaille, mais ma fille sera là. »"],
      ["Quel avantage auront les nouvelles fenêtres ?", ["Elles réduiront les frais de chauffage", "Elles laisseront entrer plus de lumière", "Elles feront baisser le loyer de juillet", "Elles protégeront l'appartement du bruit"], "« Les nouvelles fenêtres devraient réduire vos frais de chauffage l'hiver prochain. »"],
      ["Que répond le propriétaire au sujet du stationnement ?", ["Rien ne change cette année", "Il deviendra payant en juillet", "Les places seront réservées aux voisins", "Il sera fermé pendant les travaux"], "« rien ne change pour le stationnement cette année »"],
    ], {
      scene: "A phone call between a Montréal landlord and his tenant; polite and practical, with a little tension about the rent.",
      A: v("fr-fr-tutor-6", "remy", "A landlord around sixty, friendly, clear and a bit businesslike."),
      B: v("fr-fr-advisor-12", "vivienne", "A tenant in her thirties, polite, worried about the rent, then pleased."),
    }),
    set("co-logement-b2", "B2", ["logement", "societe"], "Le retour à la campagne", "Une journaliste interroge un sociologue à la radio.", [
      ["A", "Depuis quelques années, de plus en plus de citadins quittent les grandes villes pour s'installer en région. Est-ce une véritable tendance de fond ?"],
      ["B", "C'est une tendance réelle : les départs vers les régions ont nettement augmenté depuis cinq ans. Mais il faut la nuancer. Tous les citadins ne partent pas : ce sont surtout des familles avec de jeunes enfants et des travailleurs qui peuvent faire du télétravail au moins une partie de la semaine."],
      ["A", "Qu'est-ce qui les pousse à partir ?"],
      ["B", "Le prix du logement, d'abord. Avec ce qu'on paie pour un petit appartement en ville, on peut souvent acheter une maison avec un terrain. Mais il y a aussi une recherche de qualité de vie : plus d'espace, moins de bruit, un contact avec la nature, et le sentiment que les enfants grandissent plus librement."],
      ["A", "Et est-ce que ça se passe toujours bien ?"],
      ["B", "Pas toujours. Certains découvrent que les services sont éloignés, l'hôpital, les écoles secondaires, et que la voiture devient indispensable. D'autres ont du mal à se faire accepter par la population locale, qui voit parfois les prix de l'immobilier grimper à cause d'eux. Et l'hiver, quand il fait noir à seize heures, l'isolement peut peser."],
      ["A", "Comment les régions s'y prennent-elles pour attirer ces nouveaux habitants ?"],
      ["B", "Certaines offrent des aides à l'installation : quelques municipalités remboursent même une partie des frais de déménagement. D'autres créent des espaces de travail partagés, pour que les télétravailleurs ne restent pas seuls chez eux. Mais les régions qui réussissent le mieux sont celles qui ont préparé l'accueil : internet haute vitesse, garderies, activités pour créer des liens."],
      ["A", "Et les villes, que perdent-elles dans ce mouvement ?"],
      ["B", "Des familles, surtout. Certaines écoles de quartier voient leurs inscriptions baisser, et des commerces perdent une partie de leur clientèle. Dans certains quartiers très chers, des propriétaires ont aussi plus de mal qu'avant à louer leurs appartements. Mais il ne faut pas exagérer : les grandes villes continuent de grandir, grâce notamment à l'immigration et aux étudiants."],
      ["A", "Avec le retour au bureau que demandent beaucoup d'entreprises, cette tendance va-t-elle durer ?"],
      ["B", "C'est la grande question. Si les employeurs exigent une présence de quatre ou cinq jours par semaine, certains vont revenir en ville, c'est certain. Mais pour beaucoup, le choix est fait : ils préfèrent une heure de route deux fois par semaine qu'un appartement trop petit et trop cher."],
    ], [
      ["Selon le sociologue, qui quitte surtout les villes ?", ["Des familles et des télétravailleurs", "Des retraités en quête de calme", "Des jeunes qui n'ont pas d'emploi", "Tous les citadins, sans exception"], "« ce sont surtout des familles avec de jeunes enfants et des travailleurs qui peuvent faire du télétravail »"],
      ["Quelle est la première raison du départ qu'il mentionne ?", ["Le coût du logement", "Le bruit des grandes villes", "Le désir de nature", "Le télétravail"], "« Le prix du logement, d'abord. »"],
      ["Quelle difficulté les nouveaux arrivants rencontrent-ils parfois ?", ["Ils dépendent davantage de la voiture", "Ils ne trouvent pas de travail en région", "Ils paient plus d'impôts qu'en ville", "Ils doivent apprendre une autre langue"], "« la voiture devient indispensable »"],
      ["Pourquoi certaines régions créent-elles des espaces de travail partagés ?", ["Pour éviter l'isolement des télétravailleurs", "Pour attirer de grandes entreprises venues de la ville", "Pour remplacer les écoles fermées", "Pour faire baisser le prix des maisons"], "« pour que les télétravailleurs ne restent pas seuls chez eux »"],
      ["Que dit-il de l'effet de ce mouvement sur les grandes villes ?", ["Elles continuent quand même de grandir", "Elles perdent la plupart de leurs habitants", "Leurs commerces ferment presque tous", "Leurs écoles accueillent plus d'élèves"], "« il ne faut pas exagérer : les grandes villes continuent de grandir »"],
      ["Que pense-t-il de l'avenir de cette tendance ?", ["Certains reviendront, mais beaucoup resteront", "Tout le monde reviendra bientôt en ville", "Les entreprises vont toutes fermer leurs bureaux", "La tendance va surtout concerner les retraités"], "« certains vont revenir en ville, c'est certain. Mais pour beaucoup, le choix est fait »"],
    ], {
      scene: "A radio interview on a Québec station about moving from the city to the regions; relaxed and thoughtful.",
      A: v("fr-fr-advisor-7", "vivienne", "A radio host in her late twenties, calm, velvety and unhurried."),
      B: v("fr-fr-advisor-2", "remy", "A sociologist in his forties, warm, engaging and nuanced."),
    }),

    /* ---------- Transports ---------- */
    set("co-transports-b1", "B1", "transports", "Annonces en gare", "Vous êtes dans une gare et vous entendez plusieurs annonces.", [
      ["N", "Votre attention, s'il vous plaît. En raison d'un problème technique, le train de 17 h 42 à destination de Saint-Jérôme partira avec environ vingt minutes de retard. Les voyageurs sont invités à patienter dans la salle d'attente, où un café leur sera offert. Nous vous prions de nous excuser pour ce contretemps."],
      ["N", "Les passagers qui doivent prendre une correspondance à la gare de Laval peuvent utiliser, sans frais supplémentaires, l'autobus de 17 h 50, qui part du quai numéro trois. Présentez simplement votre billet au chauffeur."],
      ["N", "Nous rappelons qu'il est strictement interdit de traverser les voies. Pour changer de quai, veuillez utiliser le passage souterrain, situé au bout du hall, ou l'ascenseur, près de la billetterie. Nous vous demandons également de ne pas laisser vos bagages sans surveillance : tout bagage abandonné pourra être détruit par les services de sécurité."],
      ["N", "Changement de quai : le train de 18 h 05 à destination de Mont-Saint-Hilaire partira du quai numéro cinq, et non du quai numéro deux, comme indiqué sur les écrans. Je répète : le train de 18 h 05 partira du quai numéro cinq."],
      ["N", "Un sac à dos bleu a été trouvé dans la salle d'attente. Il contient des livres et une gourde rouge. La personne qui l'a perdu peut le récupérer au comptoir du service à la clientèle, en présentant une pièce d'identité."],
      ["N", "Nous rappelons aux voyageurs que les billets doivent être validés avant de monter à bord. Des contrôles ont lieu dans les trains, et les passagers sans billet valide devront payer une amende. Pour tout renseignement sur les horaires, consultez l'application mobile ou adressez-vous au comptoir d'information, près de l'entrée principale."],
      ["N", "Enfin, la billetterie fermera exceptionnellement à 20 h ce soir. Les billets restent en vente aux distributrices automatiques, qui acceptent les cartes et l'argent comptant. Le stationnement de la gare reste gratuit pour les détenteurs d'un abonnement mensuel. Merci de votre compréhension, et bon voyage."],
    ], [
      ["Quel est le problème du train de 17 h 42 ?", ["Il partira vingt minutes plus tard", "Il est annulé à cause d'un problème technique", "Il partira d'un autre quai", "Il ne s'arrêtera pas à Laval"], "« partira avec environ vingt minutes de retard »"],
      ["Que peuvent faire les passagers qui ont une correspondance à Laval ?", ["Prendre gratuitement l'autobus de 17 h 50", "Attendre le train de 18 h 05", "Se faire rembourser à la billetterie", "Prendre un taxi payé par la compagnie"], "« sans frais supplémentaires, l'autobus de 17 h 50, qui part du quai numéro trois »"],
      ["Comment faut-il changer de quai ?", ["Par le passage souterrain ou l'ascenseur", "En traversant les voies avec prudence", "En passant par l'extérieur de la gare", "En suivant le chauffeur de l'autobus"], "« veuillez utiliser le passage souterrain… ou l'ascenseur »"],
      ["Quelle information sur le train de 18 h 05 est donnée ?", ["Il partira du quai cinq", "Il partira du quai numéro deux", "Il aura vingt minutes de retard", "Il est remplacé par un autobus"], "« partira du quai numéro cinq, et non du quai numéro deux, comme indiqué sur les écrans »"],
      ["Où peut-on récupérer le sac à dos bleu ?", ["Au service à la clientèle", "Dans la salle d'attente", "À la billetterie, avant 20 h", "Auprès du chauffeur"], "« au comptoir du service à la clientèle, en présentant une pièce d'identité »"],
      ["Que se passera-t-il ce soir ?", ["La billetterie fermera à 20 h", "Les distributrices ne marcheront pas", "Les contrôles seront supprimés", "Le dernier train partira à 20 h"], "« la billetterie fermera exceptionnellement à 20 h ce soir »"],
    ], {
      scene: "Public address announcements in a commuter train station near Montréal; clear, calm and slightly formal.",
      N: v("fr-fr-concierge-6", "vivienne", "A station announcer, crisp, clear and calm, pronouncing numbers carefully."),
    }),
    set("co-transports-b2", "B2", "transports", "Voitures électriques : la solution ?", "Une animatrice interroge un spécialiste des transports.", [
      ["A", "Les ventes de voitures électriques augmentent rapidement. Est-ce la solution pour réduire la pollution liée aux transports ?"],
      ["B", "C'est une partie de la solution. Une voiture électrique n'émet pas de gaz d'échappement, et au Québec, où l'électricité vient surtout de l'hydroélectricité, son bilan carbone est bien meilleur que celui d'une voiture à essence. Mais il ne faut pas oublier la fabrication des batteries, qui demande beaucoup d'énergie et de métaux. Sur l'ensemble de sa vie, elle émet donc beaucoup moins qu'une voiture à essence, mais pas zéro."],
      ["A", "Beaucoup de gens hésitent encore à cause de l'autonomie. Ont-ils raison ?"],
      ["B", "Moins qu'avant. La plupart des modèles récents font plus de quatre cents kilomètres avec une charge, ce qui suffit largement pour les trajets quotidiens. L'hiver, par contre, le froid réduit l'autonomie, parfois d'un tiers : chez nous, c'est un vrai sujet."],
      ["A", "Et que deviennent les batteries usées ?"],
      ["B", "De plus en plus, elles ont une deuxième vie : on les utilise pour stocker de l'électricité, par exemple près des panneaux solaires. Ensuite, on peut récupérer une grande partie des métaux. Le recyclage progresse, mais il n'est pas encore capable de traiter toutes les batteries qui arriveront en fin de vie dans quelques années. Plusieurs projets d'usines de recyclage ont d'ailleurs été annoncés au Québec."],
      ["A", "Les subventions à l'achat sont-elles une bonne idée ?"],
      ["B", "Elles ont aidé à lancer le marché, c'est certain. Mais elles profitent surtout aux ménages qui ont les moyens d'acheter une voiture neuve. Aujourd'hui, beaucoup d'experts proposent plutôt d'aider l'achat de voitures électriques d'occasion, ou de financer les transports en commun, qui servent à tout le monde."],
      ["A", "Quelles sont les autres limites ?"],
      ["B", "Le prix, d'abord, même s'il baisse et que les gouvernements offrent des subventions à l'achat. Ensuite, la recharge : quand on vit en appartement, sans stationnement privé, ce n'est pas toujours simple de brancher sa voiture. Et puis, une voiture électrique reste une voiture : elle occupe autant d'espace, elle crée autant d'embouteillages, et ses pneus produisent aussi des particules fines."],
      ["A", "Que faudrait-il faire, alors ?"],
      ["B", "Combiner les solutions : électrifier les véhicules qui sont vraiment nécessaires, comme les autobus, les taxis ou les camions de livraison, mais surtout développer les transports en commun, l'autopartage et les déplacements à pied ou à vélo. Du point de vue de l'environnement, la meilleure voiture, c'est souvent celle qu'on n'a pas besoin d'utiliser."],
    ], [
      ["Pourquoi le bilan carbone d'une voiture électrique est-il bon au Québec ?", ["L'électricité y est surtout hydroélectrique", "Les batteries y sont toutes fabriquées et recyclées", "Les routes y sont moins encombrées", "Les voitures y sont plus petites"], "« au Québec, où l'électricité vient surtout de l'hydroélectricité »"],
      ["Que dit-il de l'autonomie des modèles récents ?", ["Elle suffit pour les trajets quotidiens", "Elle augmente fortement en hiver", "Elle dépasse mille kilomètres", "Elle reste le principal problème des conducteurs"], "« plus de quatre cents kilomètres avec une charge, ce qui suffit largement pour les trajets quotidiens ». Winter reduces it."],
      ["Que deviennent de plus en plus de batteries usées ?", ["Elles servent à stocker de l'électricité", "Elles sont toutes recyclées sans difficulté", "Elles sont envoyées dans d'autres pays", "Elles sont réparées pour d'autres voitures"], "« elles ont une deuxième vie : on les utilise pour stocker de l'électricité »"],
      ["Quelle difficulté ont les personnes qui vivent en appartement ?", ["Recharger leur voiture n'est pas toujours simple", "Elles n'ont pas droit aux subventions", "Elles paient l'électricité plus cher", "Elles ne peuvent pas acheter de voiture"], "« quand on vit en appartement, sans stationnement privé, ce n'est pas toujours simple de brancher sa voiture »"],
      ["Pourquoi les voitures électriques ne régleront-elles pas les embouteillages ?", ["Elles prennent autant de place que les autres", "Elles roulent plus lentement en ville", "Elles tombent souvent en panne l'hiver", "Elles sont interdites au centre-ville"], "« elle occupe autant d'espace, elle crée autant d'embouteillages »"],
      ["Quelle est l'idée de sa dernière phrase ?", ["Le mieux est de moins utiliser la voiture", "Il faut acheter le modèle électrique le plus récent", "Les voitures à essence polluent moins", "Il faut partager toutes les voitures"], "« la meilleure voiture, c'est souvent celle qu'on n'a pas besoin d'utiliser »"],
    ], {
      scene: "A Québec radio interview about electric cars; lively but informative.",
      A: v("fr-fr-podcaster-9", "vivienne", "A young radio host, bright, clear and curious."),
      B: v("fr-fr-concierge-4", "remy", "A transport specialist around fifty, warm, engaging and pragmatic."),
    }),

    /* ---------- Famille ---------- */
    set("co-famille-b1", "B1", "famille", "Un service à te demander", "Vous écoutez une conversation téléphonique entre deux amis.", [
      ["A", "Salut Julien, c'est Émilie ! Dis, j'ai un petit service à te demander. Samedi soir, Marc et moi, on est invités au mariage d'une collègue, et notre gardienne habituelle vient d'annuler."],
      ["B", "Oh non ! Et tu voudrais que je garde les enfants, c'est ça ?"],
      ["A", "Exactement. De 18 h à minuit environ. Ils auront déjà soupé : tu n'auras qu'à leur lire une histoire et à les coucher vers 20 h. Léa a quatre ans, elle s'endort vite si elle a son doudou. N'oublie pas de le lui donner, sinon elle ne dormira pas !"],
      ["B", "Et Tom ? Il a sept ans maintenant, non ?"],
      ["A", "Oui. Lui, il peut rester debout jusqu'à 20 h 30 s'il a rangé sa chambre. Attention, il est allergique aux arachides : ne lui donne rien à grignoter sans lire l'étiquette. Il a toujours un auto-injecteur dans son sac, au cas où. Les numéros d'urgence sont sur le frigo."],
      ["B", "Est-ce qu'ils ont des habitudes particulières avant de dormir ?"],
      ["A", "Tom aime qu'on laisse la lumière du couloir allumée, et Léa demande toujours un verre d'eau. Ne t'inquiète pas si elle se relève une fois ou deux, c'est normal."],
      ["B", "Pas de problème. Par contre, je travaille dimanche à 7 h du matin. Minuit, c'est un peu tard pour moi."],
      ["A", "Je comprends. On peut rentrer à 23 h 30, ce n'est pas un problème. Le mariage est à Laval, à trente minutes de chez nous. Et bien sûr, Marc te ramènera chez toi en voiture après."],
      ["B", "Parfait. Je peux venir avec ma copine ? Elle adore les enfants."],
      ["A", "Avec plaisir ! Il y a des pizzas au congélateur, servez-vous. Et vous pouvez regarder un film quand les enfants dormiront. Merci mille fois, Julien, tu nous sauves la vie !"],
      ["B", "De rien, ça me fait plaisir. Je serai là à 17 h 45, pour que les enfants aient le temps de me dire bonjour avant votre départ. Et s'il y a le moindre problème, je t'appelle, promis."],
    ], [
      ["Pourquoi Émilie appelle-t-elle Julien ?", ["Pour qu'il garde ses deux enfants samedi soir", "Pour l'inviter au mariage de sa collègue", "Pour annuler un souper prévu samedi", "Pour lui demander une recette de pizza"], "« Samedi soir… notre gardienne habituelle vient d'annuler. » / « tu voudrais que je garde les enfants »"],
      ["Pourquoi Émilie et Marc ont-ils besoin d'aide ?", ["Leur gardienne habituelle a annulé", "Leurs enfants sont malades", "Ils doivent travailler tard samedi soir", "Ils déménagent à Laval"], "« notre gardienne habituelle vient d'annuler »"],
      ["Que faut-il faire pour que Léa s'endorme ?", ["Lui donner son doudou", "Lui préparer un repas", "La coucher à minuit", "Lui lire deux histoires"], "« N'oublie pas de le lui donner, sinon elle ne dormira pas ! »"],
      ["À quoi Julien doit-il faire attention avec Tom ?", ["À son allergie aux arachides", "À ses devoirs du samedi soir", "À l'heure de sa série préférée", "À sa chambre en désordre"], "« il est allergique aux arachides : ne lui donne rien à grignoter sans lire l'étiquette »"],
      ["Pourquoi Émilie et Marc rentreront-ils à 23 h 30 ?", ["Julien travaille tôt dimanche matin", "Le mariage se termine plus tôt que prévu", "Tom se couche à 20 h 30", "La copine de Julien doit partir"], "« je travaille dimanche à 7 h du matin. Minuit, c'est un peu tard pour moi. »"],
      ["Que propose Émilie à Julien et à sa copine ?", ["Manger des pizzas et regarder un film", "Dormir chez eux jusqu'au dimanche matin", "Venir au mariage après le coucher des enfants", "Ramener les enfants chez leurs grands-parents"], "« Il y a des pizzas au congélateur, servez-vous. Et vous pouvez regarder un film »"],
    ], {
      scene: "A phone call between two friends near Montréal; warm, casual and a little rushed.",
      A: v("fr-fr-advisor-12", "vivienne", "A mother in her thirties, lively, grateful and a bit hurried."),
      B: v("fr-fr-podcaster-2", "remy", "A friend in his thirties, easy-going, cheerful and helpful."),
    }),
    set("co-famille-b2", "B2", "famille", "Rester chez ses parents à trente ans", "Vous écoutez une chronique à la radio.", [
      ["N", "Ils ont vingt-cinq, parfois trente ans, un emploi, et ils vivent toujours chez leurs parents. Longtemps perçue comme un échec, cette situation est de plus en plus courante. Au Canada, plus d'un tiers des jeunes adultes de vingt à trente-quatre ans habitent encore avec au moins un de leurs parents."],
      ["N", "Les chiffres varient d'ailleurs beaucoup : la proportion est nettement plus forte dans les grandes villes, où les loyers sont les plus élevés, qu'à la campagne. Et les jeunes hommes restent en moyenne plus longtemps que les jeunes femmes."],
      ["N", "La principale raison est économique. Avec la hausse des loyers, quitter le nid familial représente un coût énorme. Beaucoup de jeunes préfèrent économiser pour acheter plus tard, plutôt que de consacrer la moitié de leur salaire à un loyer. D'autres reviennent après une rupture, une perte d'emploi ou la fin de leurs études."],
      ["N", "Mais les mentalités ont aussi changé. Les relations entre parents et enfants sont souvent plus détendues qu'autrefois, et la cohabitation se passe plutôt bien. Dans certaines familles immigrantes, vivre à plusieurs générations sous le même toit est d'ailleurs une tradition, et non un pis-aller."],
      ["N", "Beaucoup de parents y trouvent aussi leur compte. Ils gardent un lien fort avec leurs enfants, partagent les dépenses, et reçoivent parfois de l'aide pour les courses ou le jardin. Certains avouent même qu'ils redoutent le jour où la maison sera vide."],
      ["N", "Pour que la cohabitation fonctionne, les familles fixent souvent des règles : une contribution au loyer ou à l'épicerie, un partage des tâches ménagères, et le respect de l'intimité de chacun. Les psychologues insistent sur un point : un jeune adulte qui vit chez ses parents doit rester autonome, gérer son argent et participer à la vie de la maison, pas se comporter en adolescent."],
      ["N", "Reste que cette situation retarde d'autres étapes : la vie de couple, l'arrivée des enfants, l'autonomie. Et elle pèse parfois sur les parents, qui espéraient profiter de leur retraite dans une maison plus petite."],
      ["N", "Pour beaucoup d'experts, la solution ne se trouve pas dans les familles, mais dans les politiques publiques : construire davantage de logements abordables permettrait aux jeunes de partir quand ils le souhaitent, et non quand ils le peuvent. Certaines villes testent aussi des colocations entre étudiants et personnes âgées : un loyer très bas, en échange d'un peu de compagnie et de quelques services."],
    ], [
      ["Quelle proportion de jeunes adultes vit encore chez ses parents au Canada ?", ["Plus d'un tiers", "Près de la moitié", "Un sur dix", "Presque tous"], "« plus d'un tiers des jeunes adultes de vingt à trente-quatre ans »"],
      ["Où la proportion est-elle la plus forte ?", ["Dans les grandes villes", "Dans les petites villes", "À la campagne", "Dans les familles immigrantes"], "« la proportion est nettement plus forte dans les grandes villes, où les loyers sont les plus élevés »"],
      ["Que signifie ici « un pis-aller » ?", ["Une solution acceptée faute de mieux", "Une tradition familiale ancienne", "Une grande maison familiale", "Un choix idéal pour tous"], "Un pis-aller = a last resort, a second-best solution. For these families it's a tradition, not a pis-aller."],
      ["Selon les psychologues, que doit faire un jeune adulte qui vit chez ses parents ?", ["Rester autonome et participer à la maison", "Payer chaque mois la totalité du loyer familial", "Quitter la maison avant trente ans", "Laisser ses parents gérer son argent"], "« doit rester autonome, gérer son argent et participer à la vie de la maison »"],
      ["Quel inconvénient pour les parents la chronique mentionne-t-elle ?", ["Leurs projets de retraite sont retardés", "Ils doivent vendre leur maison", "Ils perdent leur intimité et leur tranquillité", "Ils paient toutes les factures"], "« qui espéraient profiter de leur retraite dans une maison plus petite »"],
      ["Où se trouve la solution, selon beaucoup d'experts ?", ["Dans la construction de logements abordables", "Dans des règles plus strictes à la maison", "Dans l'aide financière des grands-parents", "Dans le départ des jeunes à l'étranger"], "« construire davantage de logements abordables permettrait aux jeunes de partir quand ils le souhaitent »"],
    ], {
      scene: "A society chronicle on a Québec radio station; warm, thoughtful and engaging.",
      N: v("fr-fr-podcaster-1", "vivienne", "A radio columnist in her late twenties, warm, engaging and natural."),
    }),
    /* ---------- Sécurité ---------- */
    set("co-crime-b1", "B1", "crime", "Vols de vélos : les conseils de la police", "Vous écoutez un message de prévention à la radio.", [
      ["N", "Avec l'arrivée du printemps, les vols de vélos augmentent dans la ville. Ils ont surtout lieu près des gares, devant les universités et, la nuit, dans les cours d'immeubles. Le service de police vous donne quelques conseils pour protéger le vôtre."],
      ["N", "Utilisez un cadenas en U solide, plutôt qu'un simple câble, qui peut être coupé en quelques secondes. Attachez le cadre du vélo, et pas seulement une roue, à un support fixe, comme un arceau ou un poteau. Si vous avez un vélo électrique, emportez la batterie avec vous : elle coûte cher et elle est souvent volée."],
      ["N", "Évitez de laisser votre vélo toute la nuit dans la rue. Si possible, rangez-le à l'intérieur ou dans un local fermé à clé. Et ne le laissez jamais au même endroit pendant plusieurs jours : un vélo abandonné attire l'attention."],
      ["N", "Notez aussi le numéro de série de votre vélo, inscrit sous le pédalier, et prenez-le en photo. Encore mieux : faites-le marquer gratuitement. Samedi prochain, de 10 h à 16 h, des policiers graveront un numéro sur les vélos, devant la mairie. Ce numéro est enregistré dans un fichier national. Apportez simplement une pièce d'identité et, si vous l'avez, la facture du vélo."],
      ["N", "Grâce au marquage, un vélo retrouvé peut être rendu à son propriétaire. Chaque année, des centaines de vélos retrouvés restent au commissariat, simplement parce qu'on ne sait pas à qui ils appartiennent."],
      ["N", "Méfiez-vous aussi des bonnes affaires : si on vous propose un vélo d'occasion très bon marché, sans facture, il a peut-être été volé. Et acheter un objet volé, même sans le savoir, peut vous causer des ennuis."],
      ["N", "Enfin, en cas de vol, portez plainte le plus vite possible, au commissariat ou en ligne, en donnant le numéro de série et la photo. Ces informations aideront beaucoup la police à retrouver votre vélo."],
    ], [
      ["Pourquoi la police donne-t-elle ces conseils maintenant ?", ["Les vols augmentent au printemps", "Un nouveau règlement va entrer en vigueur", "Les pistes cyclables ouvrent samedi", "Les vélos électriques sont interdits"], "« Avec l'arrivée du printemps, les vols de vélos augmentent dans la ville. »"],
      ["Que conseille la police aux propriétaires de vélos électriques ?", ["D'emporter la batterie avec eux", "D'utiliser deux cadenas différents", "De ne pas les laisser près des gares", "D'acheter une batterie de rechange"], "« emportez la batterie avec vous : elle coûte cher et elle est souvent volée »"],
      ["Que se passera-t-il samedi devant la mairie ?", ["La police marquera gratuitement les vélos", "La police vendra des cadenas en U", "Des vélos retrouvés seront rendus à leurs propriétaires", "Des vélos électriques seront prêtés"], "« des policiers graveront un numéro sur les vélos, devant la mairie »"],
      ["Que faut-il apporter pour faire marquer son vélo ?", ["Une pièce d'identité et, si possible, la facture", "Une photo du vélo et du pédalier", "Le cadenas et la batterie du vélo", "Une preuve d'adresse de moins de trois mois"], "« Apportez simplement une pièce d'identité et, si vous l'avez, la facture du vélo. »"],
      ["Pourquoi des centaines de vélos restent-ils au commissariat ?", ["On ne connaît pas leurs propriétaires", "Ils sont trop abîmés pour rouler", "Personne ne vient les chercher le samedi", "La police les garde comme preuves"], "« simplement parce qu'on ne sait pas à qui ils appartiennent »"],
      ["Que dit la police à propos des vélos d'occasion très bon marché ?", ["Ils ont peut-être été volés", "Ils sont souvent en mauvais état", "Il faut les faire marquer d'abord", "Ils sont vendus par la police"], "« si on vous propose un vélo d'occasion très bon marché, sans facture, il a peut-être été volé »"],
    ], {
      scene: "A police prevention message broadcast on a French radio station; clear, calm and practical.",
      N: v("fr-fr-advisor-2", "remy", "A police officer in his late thirties, approachable, calm and clear."),
    }),
    set("co-crime-b2", "B2", "crime", "La justice réparatrice", "Un journaliste interroge une médiatrice.", [
      ["A", "On parle de plus en plus de justice réparatrice. De quoi s'agit-il exactement ?"],
      ["B", "L'idée est de ne pas se limiter à punir l'auteur d'un délit. Quand la victime le souhaite, on organise une rencontre entre elle et l'auteur, avec un médiateur formé. La victime peut expliquer ce qu'elle a vécu et poser ses questions, et l'auteur doit assumer les conséquences de ses actes. On cherche aussi à réparer, autant que possible, le tort causé : des excuses, un dédommagement, parfois un travail utile à la communauté."],
      ["A", "Cela ne remplace pas la prison ?"],
      ["B", "Non, pas nécessairement. C'est un complément. Pour les délits mineurs, cela peut éviter un procès, mais pour les crimes graves, la rencontre a lieu en plus de la peine. Et elle n'est jamais obligatoire : ni la victime ni l'auteur ne peuvent y être forcés."],
      ["A", "Comment se prépare une telle rencontre ?"],
      ["B", "Longuement. Je rencontre d'abord chacun séparément, parfois pendant plusieurs mois. Je vérifie que la victime ne risque pas d'être blessée une deuxième fois, et que l'auteur ne vient pas seulement pour obtenir une peine plus légère. Si l'une des deux personnes n'est pas prête, on attend, ou on arrête."],
      ["A", "Vous avez un exemple ?"],
      ["B", "Je pense à une dame âgée dont l'appartement avait été cambriolé. Elle ne dormait plus. Pendant la rencontre, elle a demandé au jeune homme pourquoi il avait choisi sa porte. Il a répondu : « Au hasard. » Paradoxalement, cette réponse l'a rassurée : elle n'était pas visée personnellement. Elle a recommencé à dormir, et elle m'a dit ensuite qu'elle avait l'impression d'avoir retrouvé sa maison."],
      ["A", "Certains critiquent cette approche : ils la trouvent trop douce pour les coupables."],
      ["B", "Je comprends cette réaction, mais c'est souvent l'inverse. Dans une salle d'audience, l'auteur peut se taire et laisser parler son avocat. Face à la victime, il doit regarder en face ce qu'il a fait, répondre aux questions, parfois entendre des choses très dures. Beaucoup me disent que c'est le moment le plus difficile de tout le processus."],
      ["A", "Quels sont les résultats, de manière générale ?"],
      ["B", "Les études montrent que beaucoup de victimes se sentent mieux après la rencontre : elles ont des réponses, et le sentiment d'avoir été entendues. Du côté des auteurs, le risque de récidive semble diminuer, parce qu'ils prennent conscience du mal qu'ils ont fait. Ce n'est pas une solution miracle, mais c'est une approche plus humaine de la justice."],
    ], [
      ["En quoi consiste la justice réparatrice ?", ["Faire se rencontrer la victime et l'auteur", "Remplacer toutes les peines de prison", "Obliger l'auteur à rembourser tous les dégâts causés", "Juger les délits beaucoup plus vite"], "« on organise une rencontre entre elle et l'auteur, avec un médiateur formé »"],
      ["La justice réparatrice remplace-t-elle la prison ?", ["Non, elle s'ajoute souvent à la peine", "Oui, pour tous les crimes graves", "Oui, mais seulement pour les jeunes", "Non, elle concerne les prisonniers"], "« C'est un complément… pour les crimes graves, la rencontre a lieu en plus de la peine »"],
      ["Que vérifie la médiatrice avant une rencontre ?", ["Les vraies motivations de l'auteur", "Le montant des dégâts causés", "Le casier judiciaire de la victime", "La date du prochain procès"], "« que l'auteur ne vient pas seulement pour obtenir une peine plus légère »"],
      ["Pourquoi la réponse « Au hasard » a-t-elle rassuré la dame ?", ["Elle n'avait pas été choisie personnellement", "Le jeune homme s'était excusé longuement", "Le jeune homme allait rester en prison", "Elle allait récupérer ses objets volés"], "« cette réponse l'a rassurée : elle n'était pas visée personnellement »"],
      ["Que répond-elle à ceux qui trouvent cette approche trop douce ?", ["C'est souvent plus dur pour l'auteur", "Les avocats des deux côtés y sont présents", "Les peines de prison sont plus longues", "Les victimes peuvent choisir la peine"], "« c'est souvent l'inverse… Beaucoup me disent que c'est le moment le plus difficile de tout le processus »"],
      ["Quel effet a-t-on observé chez les auteurs ?", ["Ils récidivent apparemment moins", "Ils obtiennent des peines plus courtes", "Ils refusent souvent de participer", "Ils quittent rapidement la région"], "« le risque de récidive semble diminuer »"],
    ], {
      scene: "A radio interview about restorative justice on a French public station; serious, gentle and attentive.",
      A: v("fr-fr-podcaster-6", "remy", "A young radio journalist, confident, clear and respectful."),
      B: v("fr-fr-csagent-3", "vivienne", "A mediator in her fifties, calm, soothing and deeply convinced."),
    }),

    /* ---------- Science ---------- */
    set("co-science-b1", "B1", "science", "Les géants du passé", "Vous écoutez une publicité pour un musée.", [
      ["N", "Cet été, le Centre des sciences présente une nouvelle exposition : « Les géants du passé ». Vous pourrez y découvrir une trentaine de squelettes de dinosaures, dont un tyrannosaure de douze mètres de long, arrivé tout droit des États-Unis. C'est la plus grande exposition sur les dinosaures jamais présentée dans la région."],
      ["N", "L'exposition est interactive : les enfants pourront jouer aux paléontologues, fouiller le sable pour trouver des fossiles et comparer leur taille à celle des animaux préhistoriques. Un atelier de moulage leur permettra même de repartir avec l'empreinte d'une dent de dinosaure. Et pour les tout-petits, un coin lecture avec des livres sur les dinosaures a été aménagé près de la sortie."],
      ["N", "Ne manquez pas non plus le spectacle du planétarium, « Le ciel des dinosaures », à 11 h et à 15 h. Il raconte comment une météorite a changé l'histoire de la Terre. Attention, il faut un billet supplémentaire de 5 euros, et les places sont limitées."],
      ["N", "Le Centre est ouvert tous les jours de 9 h à 17 h, et jusqu'à 21 h le jeudi. Les billets coûtent 22 euros pour les adultes et 14 euros pour les enfants de 4 à 12 ans. L'entrée est gratuite pour les moins de 4 ans. Pour les familles, un forfait de 60 euros permet l'entrée de deux adultes et de deux enfants."],
      ["N", "Sur place, vous trouverez une cafétéria, des casiers pour vos sacs et un espace de pique-nique à l'extérieur. Des visites guidées ont lieu chaque jour à 10 h 30, en français et en anglais. Pour les écoles, des visites de groupe sont proposées en semaine, avec un atelier adapté à l'âge des élèves."],
      ["N", "Un conseil : achetez vos billets en ligne pour éviter la file d'attente, surtout le week-end. Le jeudi soir, une conférence gratuite avec une paléontologue est aussi proposée à 19 h. L'exposition se termine le 7 septembre. Venez vite rencontrer les géants du passé !"],
    ], [
      ["Qu'est-ce que l'exposition présente ?", ["Une trentaine de squelettes de dinosaures", "Des animaux vivants venus des États-Unis", "Des robots géants qui imitent les dinosaures", "Des météorites tombées sur la Terre"], "« une trentaine de squelettes de dinosaures »"],
      ["Avec quoi les enfants peuvent-ils repartir ?", ["L'empreinte d'une dent de dinosaure", "Un vrai fossile trouvé dans le sable", "Une photo avec le tyrannosaure", "Un livre sur les animaux préhistoriques"], "« repartir avec l'empreinte d'une dent de dinosaure »"],
      ["Que faut-il savoir sur le spectacle du planétarium ?", ["Il demande un billet supplémentaire", "Il a lieu seulement le jeudi soir", "Il est réservé aux enfants de moins de 4 ans", "Il est gratuit avec le forfait famille"], "« il faut un billet supplémentaire de 5 euros »"],
      ["Quel jour le Centre ferme-t-il plus tard ?", ["Le jeudi", "Le samedi", "Le dimanche", "Le vendredi"], "« jusqu'à 21 h le jeudi »"],
      ["Combien coûte le forfait famille ?", ["60 euros pour deux adultes et deux enfants", "22 euros par adulte, 14 par enfant", "60 euros pour toute une classe", "5 euros de plus pour chaque enfant"], "« un forfait de 60 euros permet l'entrée de deux adultes et de deux enfants »"],
      ["Pourquoi acheter ses billets en ligne ?", ["Pour éviter la file d'attente", "Pour obtenir un prix réduit", "Pour entrer gratuitement le jeudi", "Pour choisir l'heure de la visite guidée"], "« achetez vos billets en ligne pour éviter la file d'attente »"],
    ], {
      scene: "A radio advertisement for a science museum; upbeat and lively, but clear.",
      N: v("fr-fr-training-4", "remy", "A young presenter, warm, enthusiastic and engaging."),
    }),
    set("co-science-b2", "B2", "science", "Le mythe du multitâche", "Vous écoutez une chronique scientifique à la radio.", [
      ["N", "Répondre à un message tout en écoutant une réunion, préparer le dîner en consultant ses courriels : nous sommes nombreux à croire que nous savons faire plusieurs choses à la fois. Au bureau comme à la maison, c'est devenu une habitude. Les neuroscientifiques sont formels : c'est, en grande partie, une illusion."],
      ["N", "Notre cerveau peut réaliser en même temps des tâches automatiques, comme marcher et parler. Mais dès que deux tâches demandent de l'attention, il ne les fait pas vraiment ensemble : il passe très rapidement de l'une à l'autre. Et chaque changement a un coût. On perd quelques secondes, on commet davantage d'erreurs, et on se fatigue plus vite. Mis bout à bout, ces allers-retours peuvent faire perdre une part importante du temps de travail."],
      ["N", "Les chercheurs ont même donné un nom à ce phénomène : l'attention résiduelle. Quand on passe d'une tâche à une autre, une partie de notre esprit reste bloquée sur la première. Autrement dit, on n'est jamais complètement concentré sur ce qu'on fait."],
      ["N", "Le multitâche a aussi un coût caché : il donne une impression d'efficacité. Quand on passe d'un message à un autre, on a le sentiment d'avancer, alors qu'en réalité, les tâches importantes, celles qui demandent de la réflexion, restent en attente. En fin de journée, on est épuisé sans savoir exactement ce qu'on a accompli."],
      ["N", "Des études ont montré que les personnes qui pratiquent beaucoup le multitâche ne deviennent pas plus efficaces avec le temps. Au contraire, elles ont souvent plus de mal à se concentrer et à ignorer les distractions. Et il suffit parfois de la simple présence d'un téléphone sur la table, même éteint, pour que les résultats à un test baissent légèrement."],
      ["N", "La solution proposée par les chercheurs est simple : regrouper les tâches semblables, désactiver les notifications pendant les moments de travail important, et accepter de faire une seule chose à la fois. Certains conseillent de bloquer dans son agenda des plages de travail sans interruption, par exemple une heure et demie le matin. D'autres suggèrent, tout simplement, de ranger son téléphone dans une autre pièce."],
      ["N", "Faut-il pour autant renoncer à toute forme de multitâche ? Pas forcément. Écouter une musique sans paroles en rangeant son bureau ne pose aucun problème. C'est lorsque deux activités font appel au langage ou à la réflexion que le cerveau sature. Moins spectaculaire, mais beaucoup plus efficace : une chose à la fois."],
    ], [
      ["Selon les neuroscientifiques, le multitâche est-il réel ?", ["C'est surtout une illusion", "Oui, pour toutes les tâches", "Oui, mais seulement chez les jeunes", "Oui, si l'on s'entraîne assez"], "« c'est, en grande partie, une illusion »"],
      ["Que fait le cerveau quand deux tâches demandent de l'attention ?", ["Il passe rapidement de l'une à l'autre", "Il les réalise parfaitement ensemble", "Il abandonne la tâche difficile", "Il ralentit la tâche la plus facile"], "« il passe très rapidement de l'une à l'autre »"],
      ["Qu'est-ce que l'« attention résiduelle » ?", ["L'esprit reste en partie sur l'ancienne tâche", "La capacité à faire deux choses à la fois", "La fatigue qui apparaît à la fin d'une longue journée", "L'attention portée aux notifications"], "« une partie de notre esprit reste bloquée sur la première »"],
      ["Quel « coût caché » du multitâche la chronique décrit-elle ?", ["On croit avancer sans vraiment avancer", "On dépense plus d'argent en appareils", "On dort beaucoup moins bien la nuit", "On oublie de répondre à ses messages"], "« on a le sentiment d'avancer, alors qu'en réalité, les tâches importantes… restent en attente »"],
      ["Quel effet peut avoir un téléphone posé sur la table ?", ["Des résultats un peu moins bons", "Une meilleure concentration", "Aucun effet s'il est complètement éteint", "Une envie de faire une pause"], "« même éteint, pour que les résultats à un test baissent légèrement »"],
      ["Quand le multitâche pose-t-il vraiment problème ?", ["Quand deux tâches font appel au langage", "Quand on écoute une musique sans paroles", "Quand on range son bureau en parlant", "Quand on marche en téléphonant à un ami"], "« C'est lorsque deux activités font appel au langage ou à la réflexion que le cerveau sature. »"],
    ], {
      scene: "A science chronicle on a French radio station; lively, clear and slightly playful.",
      N: v("fr-fr-tutor-4", "vivienne", "A science columnist in her forties, warm, engaging and clear."),
    }),

    /* ---------- Tourisme ---------- */
    set("co-tourisme-b1", "B1", "tourisme", "Visite guidée de Québec", "Vous êtes dans un autobus touristique et le guide parle.", [
      ["N", "Bienvenue à bord de notre autobus touristique ! Je m'appelle Martin et je serai votre guide pendant les deux prochaines heures. Pendant le trajet, je vous raconterai l'histoire de la ville, fondée en 1608 par Samuel de Champlain. Si vous avez des questions, n'hésitez pas à me les poser pendant les arrêts."],
      ["N", "Nous allons d'abord traverser le Vieux-Québec, avec ses rues étroites et ses fortifications. C'est la seule ville fortifiée au nord du Mexique, et elle est inscrite au patrimoine mondial de l'UNESCO. Regardez à votre gauche : voici le Château Frontenac, un hôtel construit à la fin du dix-neuvième siècle."],
      ["N", "Nous ferons un premier arrêt de vingt minutes à la terrasse Dufferin, d'où vous aurez une vue magnifique sur le fleuve Saint-Laurent. Par beau temps, on peut même voir l'île d'Orléans. C'est aussi l'endroit idéal pour une photo de groupe, avec le Château Frontenac en arrière-plan."],
      ["N", "Ensuite, nous irons aux chutes Montmorency, qui sont plus hautes que les chutes du Niagara : elles mesurent quatre-vingt-trois mètres. En hiver, l'eau gèle en partie et forme au pied de la chute un grand cône de glace, qu'on appelle le « pain de sucre ». Là-bas, vous aurez quarante-cinq minutes pour prendre des photos ou monter l'escalier panoramique. Il y a aussi un téléphérique, mais il est payant : comptez environ quinze dollars."],
      ["N", "Quelques consignes, maintenant. Vous pouvez boire de l'eau dans l'autobus, mais pas de boissons chaudes, ni de nourriture, s'il vous plaît. Des toilettes sont disponibles aux chutes, à côté de la boutique. Si vous avez faim, la boutique vend aussi des sandwichs et de délicieuses tartes au sucre."],
      ["N", "Et surtout, merci de revenir à l'autobus à l'heure indiquée : nous ne pourrons pas attendre les retardataires, car d'autres groupes nous attendent. Au retour, nous déposerons les passagers qui le souhaitent devant leur hôtel, dans le Vieux-Québec. N'oubliez pas vos effets personnels en descendant ! Allez, c'est parti !"],
    ], [
      ["Combien de temps dure la visite ?", ["Environ deux heures", "Vingt minutes", "Toute la journée", "Quarante-cinq minutes"], "« je serai votre guide pendant les deux prochaines heures »"],
      ["Que dit le guide sur le Château Frontenac ?", ["C'est un hôtel du dix-neuvième siècle", "C'est un ancien fort construit par l'armée", "C'est le plus vieux bâtiment de la ville", "C'est un musée sur l'UNESCO"], "« le Château Frontenac, un hôtel construit à la fin du dix-neuvième siècle »"],
      ["Que peut-on voir depuis la terrasse Dufferin ?", ["Le fleuve Saint-Laurent", "Les chutes Montmorency", "Les chutes du Niagara", "Le port de Montréal"], "« une vue magnifique sur le fleuve Saint-Laurent »"],
      ["Que dit le guide sur les chutes Montmorency ?", ["Elles sont plus hautes que celles du Niagara", "Elles sont fermées aux visiteurs l'été", "On ne peut pas les photographier", "Elles se trouvent juste à côté du Château Frontenac"], "« plus hautes que les chutes du Niagara : elles mesurent quatre-vingt-trois mètres »"],
      ["Qu'est-ce qui est interdit dans l'autobus ?", ["Manger et boire du café", "Boire de l'eau", "Prendre des photos", "Poser des questions au guide"], "« Vous pouvez boire de l'eau dans l'autobus, mais pas de boissons chaudes, ni de nourriture »"],
      ["Pourquoi faut-il revenir à l'autobus à l'heure ?", ["Le guide ne pourra pas attendre", "Le téléphérique des chutes ferme à midi", "La boutique ferme bientôt", "Il va bientôt pleuvoir"], "« nous ne pourrons pas attendre les retardataires, car d'autres groupes nous attendent »"],
    ], {
      scene: "A guided bus tour of Québec City; friendly, proud of the city and relaxed.",
      N: v("fr-fr-podcaster-4", "remy", "A tour guide in his fifties, confident, clear and enthusiastic."),
    }),
    set("co-tourisme-b2", "B2", "tourisme", "Le tourisme lent", "Un journaliste interroge une spécialiste du voyage.", [
      ["A", "On parle beaucoup du tourisme lent. En quoi est-ce différent d'un voyage classique ?"],
      ["B", "Le tourisme lent, c'est l'idée de voyager moins souvent, mais plus longtemps, et de prendre le temps de connaître un endroit. Au lieu de visiter cinq villes en une semaine, on reste dans une seule région, on loge chez l'habitant, on fait ses courses au marché, on apprend quelques mots de la langue locale, on prend ses habitudes au café du coin."],
      ["A", "Qui sont ces voyageurs ?"],
      ["B", "Des profils très variés : des retraités, des familles, mais aussi des travailleurs à distance qui peuvent partir un mois avec leur ordinateur. Beaucoup en ont assez des voyages où l'on court d'un musée à l'autre pour rentrer plus fatigué qu'au départ."],
      ["A", "Comment prépare-t-on un voyage de ce type ?"],
      ["B", "Justement, en préparant moins ! On choisit une région et un logement, et on laisse de la place à l'imprévu. Beaucoup de voyageurs gardent quelques jours sans programme, pour suivre les conseils des habitants : un marché, une fête de village, une randonnée qu'on ne trouve dans aucun guide. Ce sont souvent leurs meilleurs souvenirs."],
      ["A", "Est-ce que c'est plus économique ?"],
      ["B", "Pas forcément. On dépense moins en transport, et on peut louer un logement au mois, ce qui revient moins cher. Mais un séjour plus long représente aussi plus de repas et plus d'activités. En fait, le tourisme lent ne coûte pas moins cher : il change la façon de dépenser, avec plus d'argent pour les commerces locaux et moins pour les grandes chaînes."],
      ["A", "Et pour les habitants, est-ce une bonne nouvelle ?"],
      ["B", "Plutôt, oui. Dans certaines villes, le tourisme de masse rend la vie difficile : les loyers augmentent, les commerces de quartier deviennent des boutiques de souvenirs. Des visiteurs qui restent plus longtemps et qui s'intéressent à la vie locale sont en général mieux accueillis."],
      ["A", "Est-ce aussi un choix écologique ?"],
      ["B", "En partie. Prendre le train plutôt que l'avion, ou rester plus longtemps au même endroit, réduit l'empreinte carbone du voyage. D'ailleurs, les trains de nuit reviennent à la mode en Europe. Mais soyons honnêtes : partir un mois à l'autre bout du monde en avion reste très polluant. Le tourisme lent n'est vraiment écologique que s'il s'accompagne de destinations plus proches. C'est peut-être sa plus grande qualité : nous rappeler qu'on peut être dépaysé à quelques heures de chez soi."],
    ], [
      ["Qu'est-ce que le « tourisme lent » ?", ["Voyager moins souvent, mais plus longtemps", "Voyager uniquement à pied ou à vélo", "Visiter beaucoup de villes très vite", "Voyager seulement hors saison"], "« voyager moins souvent, mais plus longtemps, et de prendre le temps de connaître un endroit »"],
      ["Pourquoi beaucoup de voyageurs choisissent-ils cette façon de voyager ?", ["Ils en ont assez des voyages épuisants", "Ils veulent dépenser le plus possible", "Ils n'aiment pas visiter les musées", "Ils ne peuvent plus prendre l'avion"], "« Beaucoup en ont assez des voyages où l'on court d'un musée à l'autre pour rentrer plus fatigué qu'au départ. »"],
      ["Le tourisme lent coûte-t-il moins cher, selon la spécialiste ?", ["Non, il change surtout la façon de dépenser", "Oui, car on ne paie plus de transport", "Oui, car on loge toujours chez des amis", "Non, car les logements au mois sont plus chers"], "« le tourisme lent ne coûte pas moins cher : il change la façon de dépenser »"],
      ["Quel problème du tourisme de masse est mentionné ?", ["La hausse des loyers pour les habitants", "Le manque de trains de nuit en Europe", "La fermeture des boutiques", "Le prix des billets d'avion"], "« le tourisme de masse rend la vie difficile : les loyers augmentent »"],
      ["Le tourisme lent est-il toujours écologique ?", ["Non, pas avec un long voyage en avion", "Oui, dans tous les cas", "Oui, si l'on loge chez l'habitant", "Non, parce qu'on reste trop longtemps"], "« partir un mois à l'autre bout du monde en avion reste très polluant »"],
      ["Quelle est, selon elle, sa plus grande qualité ?", ["Rappeler qu'on peut être dépaysé tout près", "Permettre de travailler moins souvent", "Coûter moins cher que l'hôtel", "Remplacer les longues vacances en famille"], "« nous rappeler qu'on peut être dépaysé à quelques heures de chez soi »"],
    ], {
      scene: "A travel interview on a French radio station; relaxed, curious and thoughtful.",
      A: v("fr-fr-concierge-4", "remy", "A radio journalist in his fifties, curious and friendly."),
      B: v("fr-fr-advisor-9", "vivienne", "A travel specialist in her late twenties, warm, engaging and honest."),
    }),

    /* ---------- Consommation ---------- */
    set("co-consommation-b1", "B1", "consommation", "Annonces dans un grand magasin", "Vous êtes dans un grand magasin et vous entendez plusieurs annonces.", [
      ["N", "Chers clients, bonjour ! Profitez dès aujourd'hui de nos soldes de fin de saison : jusqu'à cinquante pour cent de réduction sur tous les vêtements d'hiver, au deuxième étage. Manteaux, bottes, écharpes : il y en a pour toute la famille."],
      ["N", "Au rayon des chaussures, achetez une paire et obtenez la deuxième à moitié prix. Cette offre est valable jusqu'à dimanche seulement, sur les modèles signalés par une étiquette rouge."],
      ["N", "Membres de notre programme de fidélité, n'oubliez pas de présenter votre carte à la caisse : vous obtiendrez dix pour cent de réduction supplémentaire. Vous n'avez pas encore la carte ? Elle est gratuite, et vous pouvez l'obtenir en deux minutes à l'accueil, au rez-de-chaussée."],
      ["N", "Nouveau ce mois-ci : au rez-de-chaussée, un point de collecte vous permet de rapporter vos vieux vêtements, même abîmés. Ils seront triés et recyclés, et chaque sac rapporté vous donne droit à un bon de réduction de cinq euros, valable dès aujourd'hui. Pour les familles, un espace de jeux pour les enfants de trois à huit ans vous attend aussi au premier étage, avec une animatrice."],
      ["N", "Nous vous rappelons que les articles en solde ne sont ni repris ni échangés. Pensez donc à les essayer avant de passer à la caisse : les cabines d'essayage se trouvent au fond de chaque étage. Et notre service de retouches, au deuxième étage, peut raccourcir vos pantalons en vingt-quatre heures."],
      ["N", "Votre attention, s'il vous plaît : nous avons retrouvé une petite fille de cinq ans, prénommée Inès, près des escaliers roulants. Elle porte un manteau jaune. Ses parents sont priés de venir la chercher à l'accueil, au rez-de-chaussée."],
      ["N", "Petite faim ? Au troisième étage, notre café vous offre une boisson chaude pour tout achat de plus de cinquante euros, sur présentation de votre ticket de caisse. Le parking du magasin est gratuit pendant deux heures, avec n'importe quel achat. Enfin, ce soir, le magasin fermera exceptionnellement à 18 h, pour l'inventaire. Merci de votre visite, et bonnes affaires !"],
    ], [
      ["Quels produits ont la plus forte réduction ?", ["Les vêtements d'hiver", "Les chaussures signalées", "Tous les articles du magasin", "Les boissons du café"], "« jusqu'à cinquante pour cent de réduction sur tous les vêtements d'hiver »"],
      ["Quelle est l'offre sur les chaussures ?", ["La deuxième paire est à moitié prix", "Toutes les paires à moitié prix", "Une paire gratuite avec la carte", "Dix pour cent sur les bottes d'hiver"], "« achetez une paire et obtenez la deuxième à moitié prix »"],
      ["Comment obtient-on la carte de fidélité ?", ["Gratuitement, à l'accueil", "En achetant pour cinquante euros", "À la caisse, pour dix euros", "En ligne, sur le site du magasin"], "« Elle est gratuite, et vous pouvez l'obtenir en deux minutes à l'accueil »"],
      ["Que conseille l'annonce avant d'acheter un article en solde ?", ["De l'essayer en cabine", "De garder son ticket de caisse", "De demander un échange à la caisse", "De présenter sa carte à l'accueil"], "Sale items can't be returned or exchanged: « Pensez donc à les essayer avant de passer à la caisse »"],
      ["Où les parents d'Inès doivent-ils aller ?", ["À l'accueil, au rez-de-chaussée", "Près des escaliers roulants", "Au café du troisième étage", "Au rayon des manteaux jaunes"], "« Ses parents sont priés de venir la chercher à l'accueil, au rez-de-chaussée. »"],
      ["Que se passera-t-il ce soir ?", ["Le magasin fermera plus tôt", "Les soldes se termineront", "Le café offrira des boissons", "Les prix augmenteront"], "« ce soir, le magasin fermera exceptionnellement à 18 h, pour l'inventaire »"],
    ], {
      scene: "In-store announcements in a big Paris department store; bright, friendly and clear.",
      N: v("fr-fr-concierge-6", "vivienne", "A store announcer in her forties, crisp, bright and friendly."),
    }),
    set("co-consommation-b2", "B2", "consommation", "L'obsolescence programmée", "Vous écoutez une chronique consommation à la radio.", [
      ["N", "Un téléphone qui ralentit après deux ans, une imprimante qui s'arrête sans raison, une batterie impossible à remplacer : beaucoup de consommateurs ont le sentiment que leurs appareils sont conçus pour durer de moins en moins longtemps. C'est ce qu'on appelle l'obsolescence programmée."],
      ["N", "Il est difficile de prouver qu'un fabricant limite volontairement la durée de vie de ses produits. En France, c'est pourtant un délit depuis 2015, mais les condamnations restent rares. En revanche, certaines pratiques sont bien réelles : des pièces collées plutôt que vissées, des logiciels qui ne sont plus mis à jour, des pièces de rechange introuvables ou plus chères que l'appareil neuf."],
      ["N", "Le problème touche aussi les logiciels. Un téléphone en parfait état peut devenir inutilisable parce que certaines applications ne fonctionnent plus sur les anciennes versions du système. C'est pourquoi l'Union européenne exige désormais que les fabricants de téléphones fournissent des mises à jour pendant plusieurs années après la fin de la vente d'un modèle."],
      ["N", "Face à ce problème, les pouvoirs publics ont réagi. Les fabricants doivent désormais rendre disponibles les pièces et les manuels pendant plusieurs années. Et depuis 2021, un indice de réparabilité, une note sur dix, est affiché sur certains appareils, comme les téléphones, les ordinateurs portables ou les lave-linge. Il informe l'acheteur avant l'achat : plus la note est élevée, plus l'appareil est facile à réparer."],
      ["N", "Pour encourager la réparation, un bonus réduit aussi la facture chez les réparateurs agréés : quelques dizaines d'euros pour une machine à laver ou un téléphone. L'objectif est clair : que réparer coûte moins cher que remplacer."],
      ["N", "Les réparateurs, eux, voient leur activité repartir. Dans plusieurs villes, de petits ateliers changent un écran ou une batterie en moins d'une heure. Mais ils manquent encore de techniciens formés, et certains fabricants leur compliquent toujours la tâche, en utilisant des vis spéciales ou en réservant les pièces à leurs propres services."],
      ["N", "Les consommateurs ont eux aussi leur rôle à jouer : entretenir leurs appareils, les faire réparer plutôt que de les jeter, ou acheter des appareils reconditionnés, c'est-à-dire d'occasion, vérifiés et garantis. Les ateliers de réparation bénévoles, les « repair cafés », connaissent d'ailleurs un grand succès."],
      ["N", "Mais les habitudes changent lentement. Beaucoup de gens remplacent encore leur téléphone tous les deux ans, souvent par envie de nouveauté plutôt que par nécessité. Or l'appareil le plus écologique reste celui que l'on garde le plus longtemps."],
    ], [
      ["Qu'est-ce que l'obsolescence programmée, selon la chronique ?", ["Des appareils conçus pour durer moins longtemps", "Une mise à jour automatique et obligatoire des appareils", "Un programme de recyclage des téléphones", "Une garantie prolongée par le fabricant"], "« des appareils… conçus pour durer de moins en moins longtemps »"],
      ["Que dit la chronique sur les condamnations en France ?", ["Elles restent rares", "Elles sont très fréquentes", "Elles existent depuis 2021", "Elles concernent les réparateurs"], "« c'est pourtant un délit depuis 2015, mais les condamnations restent rares »"],
      ["Pourquoi un téléphone en bon état peut-il devenir inutilisable ?", ["Certaines applications ne fonctionnent plus", "Sa batterie ne peut plus être chargée", "Les réparateurs refusent de l'ouvrir", "L'Union européenne interdit sa vente"], "« certaines applications ne fonctionnent plus sur les anciennes versions du système »"],
      ["À quoi sert l'indice de réparabilité ?", ["À informer l'acheteur avant l'achat", "À fixer le prix des réparations", "À noter la qualité des vendeurs", "À calculer la durée de la garantie"], "« Il informe l'acheteur avant l'achat. »"],
      ["Qu'est-ce qu'un appareil reconditionné ?", ["Un appareil d'occasion vérifié et garanti", "Un appareil neuf vendu moins cher", "Un appareil réparé par son propriétaire", "Un appareil fabriqué avec des pièces collées"], "« des appareils reconditionnés, c'est-à-dire d'occasion, vérifiés et garantis »"],
      ["Pourquoi beaucoup de gens changent-ils de téléphone tous les deux ans ?", ["Surtout par envie de nouveauté", "Parce que la batterie est collée", "Parce que la loi les y oblige", "Parce que les réparations sont gratuites"], "« souvent par envie de nouveauté plutôt que par nécessité »"],
    ], {
      scene: "A consumer-affairs chronicle on a French radio station; engaged, clear and slightly ironic.",
      N: v("fr-fr-tutor-6", "remy", "A radio columnist around sixty, warm, engaging and clear."),
    }),
  ];

  // Every built-in set plays its recording.
  T.COMP.coSets.forEach((s) => { s.audio = "audio/" + s.id + ".mp4"; });
})();
