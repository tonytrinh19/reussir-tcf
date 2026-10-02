/* Find the mistakes: short texts like the ones the TCF Canada's writing tasks ask for, each hiding a few
   mistakes of the kinds the learner makes (KNOWN_ERRORS in data.js and their own corrections: malgré before a
   clause, participer à, si + conditionnel, gender agreement…). The learner taps the words that look wrong,
   then types a correction for each mistake found. B1 texts are messages with 4 mistakes; B2 texts are
   letters, articles and opinions with 5.
   Text: {n} marks the n-th mistake, as whole words. Mistake: [what the text says, [accepted corrections],
   category (an id from CATEGORIES in data.js), why]. Everything outside the marks must be correct French.
   Check with: node tools/check_drills.js */
(function () {
  "use strict";
  const T = window.TCF;
  const text = (id, level, kind, title, body, mistakes) => ({ id, level, kind, title, text: body, mistakes });

  T.PROOFREAD = [
    text("pr-b1-01", "B1", "Message to a friend", "Trois semaines à Montréal",
      "Salut Julie,\n\nJ'espère que tu vas bien ! Ça fait déjà trois semaines que je suis à Montréal. Au début, c'était difficile : il faisait très froid et je ne connaissais personne. Heureusement, mes voisins {0} à trouver un médecin et à ouvrir un compte bancaire. Le quartier est calme et il y a un marché {1} j'adore. La semaine prochaine, je commence mon cours de francisation. Je me demande {2}. Et toi, quand est-ce que tu viens me voir ? {3} dès que tu connais tes dates !\n\nBises,\nInès", [
        ["me sont aidés beaucoup", ["m'ont beaucoup aidée", "m'ont aidée beaucoup"], "pronominaux", "Aider isn't pronominal: it takes avoir. M' (Inès) comes before the verb, so aidée agrees: m'ont beaucoup aidée."],
        ["dont", ["que"], "relatifs", "Adorer quelque chose: a direct object, so que. Dont replaces de + noun."],
        ["si le cours sera-t-il difficile", ["si le cours sera difficile"], "interrogative", "No inversion in an embedded question: si le cours sera difficile."],
        ["M'écris", ["Écris-moi"], "imperatif", "Affirmative imperative: the pronoun goes after the verb and me becomes moi: écris-moi."],
      ]),
    text("pr-b1-02", "B1", "Email to a landlord", "Le chauffage en panne",
      "Bonjour Madame Tremblay,\n\nJe vous écris au sujet de l'appartement 4B. Depuis lundi, le chauffage ne marche plus et il fait très froid la nuit. Hier soir, {0} le technicien, mais il n'a pas rappelé. Pourriez-vous me dire {1} ? J'ai aussi remarqué une fuite sous l'évier : il faut que quelqu'un {2} avant la fin de la semaine, sinon le plancher va s'abîmer. Je suis disponible tous les jours après 17 h. {3} si vous avez besoin de plus d'informations.\n\nJe vous remercie d'avance.\nKarim Haddad", [
        ["j'appelais", ["j'ai appelé"], "sequence", "One completed action at a given time (hier soir): passé composé, not imparfait."],
        ["quand est-ce que le réparateur peut venir", ["quand le réparateur peut venir", "quand le réparateur pourra venir", "quand le réparateur pourrait venir"], "interrogative", "Est-ce que disappears in an embedded question: quand le réparateur peut venir."],
        ["vient la réparer", ["vienne la réparer"], "subjonctif", "Il faut que + subjonctif: vienne."],
        ["Me contactez", ["Contactez-moi"], "imperatif", "Affirmative imperative: the pronoun goes after the verb, as moi: contactez-moi."],
      ]),
    text("pr-b1-03", "B1", "Message to a colleague", "Une fête surprise",
      "Salut Marc,\n\nSamedi prochain, nous organisons une petite fête pour les quarante ans de Sophie. Elle ne sait rien, alors {0} à personne ! On se retrouve chez moi vers 19 h. Si tu {1} venir avec ta compagne, elle est la bienvenue. Chacun apporte quelque chose à manger : tu pourrais faire ta fameuse tarte aux pommes ? {2} une salle au restaurant, mais c'était trop cher. Dis-moi {3} d'ici jeudi, pour que je puisse prévoir assez de chaises.\n\nÀ samedi,\nPaul", [
        ["n'en parles", ["n'en parle"], "imperatif", "In the imperative, -er verbs drop the s of the tu form: n'en parle à personne."],
        ["voudrais", ["veux"], "si", "Never the conditionnel right after si: si tu veux."],
        ["Je ai cherché", ["J'ai cherché"], "elision", "Je becomes j' before a vowel: j'ai cherché."],
        ["est-ce que tu viens", ["si tu viens"], "interrogative", "A yes/no question becomes si in an embedded question: dis-moi si tu viens."],
      ]),
    text("pr-b1-04", "B1", "Email to a teacher", "Une absence au cours",
      "Bonjour Madame Leblanc,\n\nJe ne pourrai pas venir au cours de français demain matin, parce que ma fille {0} malade cette nuit. Mes parents ne peuvent pas la garder : ils travaillent tous les deux et {1} horaires sont très longs. Pourriez-vous m'envoyer les exercices {2} vous allez faire en classe ? Je les ferai à la maison. Je voudrais aussi savoir {3}, car je n'ai pas encore reçu la convocation.\n\nMerci beaucoup et bonne journée,\nAna Morales", [
        ["a tombé", ["est tombée"], "accord", "Tomber takes être, and the participle agrees with ma fille: est tombée."],
        ["ses", ["leurs"], "micro", "Several owners (mes parents): leurs, not ses."],
        ["dont", ["que"], "relatifs", "Faire des exercices: a direct object, so que."],
        ["à quelle heure commence-t-il l'examen", ["à quelle heure commence l'examen", "à quelle heure l'examen commence"], "interrogative", "No added pronoun and no inversion with il in an embedded question: à quelle heure commence l'examen."],
      ]),
    text("pr-b1-05", "B1", "Message to a friend", "Retour de Québec",
      "Coucou Sam,\n\nMe voilà de retour de Québec ! Le voyage était génial. Nous avons visité le Vieux-Québec, et nous {0} sur la terrasse Dufferin pendant des heures. Il faisait beau, mais le soir il faisait froid, alors j'ai acheté un gros pull. Les gens étaient vraiment {1} : un monsieur nous a même invités à goûter sa tourtière ! Le seul problème, c'était l'hôtel : la chambre était petite et {2} chère pour ce qu'elle offrait. Si tu {3} à Québec un jour, je te donnerai de bonnes adresses.\n\nÀ bientôt,\nLéo", [
        ["avons promenés", ["nous sommes promenés"], "pronominaux", "Se promener is pronominal: être, and keep the second nous: nous nous sommes promenés."],
        ["amicables", ["aimables", "sympathiques", "accueillants", "chaleureux", "gentils"], "lexique", "Amicable is English. In French: aimables (or sympathiques, accueillants)."],
        ["beaucoup", ["très", "trop"], "micro", "Beaucoup doesn't go before an adjective: très chère (or trop chère)."],
        ["iras", ["vas"], "si", "Never the futur right after si: si tu vas à Québec."],
      ]),
    text("pr-b1-06", "B1", "Email to a sports centre", "Des cours de natation",
      "Bonjour,\n\nJe viens de m'installer dans le quartier et je voudrais m'inscrire au cours de natation pour adultes. J'ai quelques questions. Pourriez-vous me dire {0} ? Je travaille jusqu'à 18 h, donc je préfère les cours du soir. Est-ce qu'il faut apporter son propre matériel, ou est-ce que vous {1} prêtez ? Enfin, je voudrais savoir {2} une réduction pour les nouveaux arrivants. Merci de {3} par courriel.\n\nBien cordialement,\nMei Chen", [
        ["combien coûte-t-il le cours", ["combien coûte le cours", "combien le cours coûte"], "interrogative", "No inversion with an added il in an embedded question: combien coûte le cours."],
        ["lui", ["le", "en"], "pronoms", "Le matériel is a thing and a direct object: le (or en, some of it). Lui is for a person after à."],
        ["si il y a", ["s'il y a"], "elision", "Si elides before il: s'il y a."],
        ["les me envoyer", ["me les envoyer"], "pronoms", "With two pronouns, me comes before les: me les envoyer."],
      ]),
    text("pr-b1-07", "B1", "Message to a colleague", "La réunion de demain",
      "Bonjour Nadia,\n\nJe suis désolé, je ne pourrai pas assister à la réunion de demain : j'ai un rendez-vous {0} à 10 h. Est-ce que tu pourrais prendre des notes pour moi ? Le rapport {1} tu m'as parlé est presque fini. Je te l'envoie ce soir, afin que tu {2} le relire avant vendredi. Si le client appelle, dis-lui que je le rappellerai lundi. {3} si tu as des questions !\n\nMerci et bonne soirée,\nThomas", [
        ["à le hôpital", ["à l'hôpital"], "elision", "Hôpital starts with a mute h, so le elides: à l'hôpital."],
        ["que", ["dont"], "relatifs", "Parler DE quelque chose: dont."],
        ["pourrais", ["puisses"], "subjonctif", "Afin que + subjonctif, never the conditionnel: puisses."],
        ["M'appelle", ["Appelle-moi"], "imperatif", "Affirmative imperative: the pronoun goes after the verb, as moi: appelle-moi."],
      ]),
    text("pr-b1-08", "B1", "Message to a friend", "Des conseils pour l'hiver",
      "Salut Ahmed,\n\nAlors, tu arrives {0} Canada le mois prochain ? Super nouvelle ! Voici quelques conseils. D'abord, n'oublie pas d'apporter tous tes diplômes : il faudra les faire reconnaître. Ensuite, achète des bottes dès ton arrivée : {1} vraiment nécessaire en janvier. Moi, quand je suis arrivé, {2} compte trop tard que mes chaussures n'étaient pas assez chaudes. Enfin, je viendrai te chercher à l'aéroport : quand tu auras ton numéro de vol, {3} !\n\nÀ très vite,\nYoussef", [
        ["en", ["au"], "micro", "Le Canada is masculine: au Canada."],
        ["il est", ["c'est"], "micro", "C'est + adjective about an idea (buying boots): c'est vraiment nécessaire."],
        ["j'ai rendu", ["je me suis rendu"], "pronominaux", "Se rendre compte keeps its reflexive pronoun and takes être: je me suis rendu compte."],
        ["me l'envoie", ["envoie-le-moi"], "imperatif", "Affirmative imperative: the pronouns go after the verb, le before moi: envoie-le-moi."],
      ]),
    text("pr-b1-09", "B1", "Message to a neighbour", "Merci pour les fleurs",
      "Bonjour Madame Roy,\n\nJe voulais vous remercier pour les fleurs {0} vous m'avez apportées hier : elles sont magnifiques ! Je vous écris aussi pour vous prévenir que nous organisons un petit repas samedi soir. Il y aura peut-être un peu de bruit, mais nous ferons attention après 22 h. Si vous {1} libre, venez prendre un verre avec nous ! Les enfants seront {2} de vous revoir. {3} un plaisir de vous avoir comme voisine.\n\nBonne journée,\nClaire", [
        ["qui", ["que"], "relatifs", "Les fleurs is the direct object of apporter (vous is the subject): que."],
        ["seriez", ["êtes"], "si", "Never the conditionnel right after si: si vous êtes libre."],
        ["ravi", ["ravis"], "accord", "The adjective agrees with les enfants: ravis."],
        ["Il est", ["C'est"], "micro", "C'est + article + noun: c'est un plaisir."],
      ]),
    text("pr-b1-10", "B1", "Email to customer service", "Un colis introuvable",
      "Bonjour,\n\nJ'ai commandé une machine à café sur votre site {0} deux semaines, mais je ne l'ai toujours pas reçue. Le suivi indique que le colis {1} livré le 3 mars, pourtant personne n'a sonné chez moi. J'ai vérifié avec mes voisins et ils ne l'ont pas vu non plus. Je voudrais savoir {2} : un remboursement ou un nouvel envoi ? {3} une réponse rapide, car c'était un cadeau pour ma mère.\n\nCordialement,\nDavid Nguyen", [
        ["depuis", ["il y a"], "micro", "A point in the past (= ago): il y a. Depuis is for something still going on."],
        ["est été", ["a été"], "passif", "Être takes avoir as its auxiliary: le colis a été livré."],
        ["qu'est-ce que vous proposez", ["ce que vous proposez"], "interrogative", "Qu'est-ce que becomes ce que in an embedded question."],
        ["Je apprécierais", ["J'apprécierais"], "elision", "Je becomes j' before a vowel: j'apprécierais."],
      ]),

    text("pr-b2-01", "B2", "Opinion piece", "Le télétravail pour tous ?",
      "Depuis la pandémie, beaucoup d'entreprises canadiennes ont adopté le télétravail. Certains salariés apprécient de ne plus perdre deux heures par jour dans les transports. D'autres, au contraire, regrettent l'ambiance du bureau et se sentent isolés.\n\nÀ mon avis, le télétravail présente de vrais avantages ; {0}, il ne convient pas à tout le monde. Bien qu'il {1} plus de liberté, il demande aussi beaucoup de discipline. Personnellement, quand j'ai commencé à travailler de chez moi, {2} compte que je travaillais beaucoup plus tard le soir. Si les employeurs {3} garder des équipes motivées, ils devraient proposer une formule hybride. Il est essentiel que chacun {4} choisir les jours où il vient au bureau.", [
        ["malgré", ["cependant", "toutefois", "néanmoins", "pourtant"], "concession", "Malgré needs a noun, not a clause. Between two clauses, use a connector: cependant."],
        ["permet", ["permette"], "subjonctif", "Bien que + subjonctif: bien qu'il permette."],
        ["j'ai rendu", ["je me suis rendu", "je me suis rendue"], "pronominaux", "Se rendre compte keeps se and takes être: je me suis rendu compte."],
        ["voudraient", ["veulent"], "si", "Never the conditionnel right after si: si les employeurs veulent."],
        ["peut", ["puisse"], "subjonctif", "Il est essentiel que + subjonctif: puisse."],
      ]),
    text("pr-b2-02", "B2", "Letter to a newspaper", "Pour les pistes cyclables",
      "Madame, Monsieur,\n\nJe vous écris en réaction à l'article {0} vous avez publié la semaine dernière sur les pistes cyclables de notre ville. Selon votre journaliste, ces aménagements {1} la circulation et nuiraient aux commerces du centre-ville. Je ne suis pas d'accord. Avant, {2} au travail en voiture ; depuis que la piste de la rue Saint-Denis est ouverte, je prends mon vélo tous les jours, et je ne suis pas le seul. Les commerçants que j'ai {3} constatent même une hausse de leur clientèle. Certes, les travaux ont causé des embouteillages pendant quelques mois, mais il faut penser à l'avenir. Si la ville {4} davantage dans le transport actif, l'air serait plus propre et nos rues plus sûres.\n\nVeuillez agréer, Madame, Monsieur, mes salutations distinguées.\nJean Lavoie", [
        ["dont", ["que"], "relatifs", "Publier un article: a direct object, so que."],
        ["ralentirait", ["ralentiraient"], "accord", "The verb agrees with ces aménagements: ralentiraient."],
        ["je suis allé", ["j'allais"], "sequence", "A past habit (avant…): imparfait, j'allais."],
        ["interrogé", ["interrogés"], "accord", "Que (= les commerçants) is a direct object placed before avoir, so the participle agrees: interrogés."],
        ["investirait", ["investissait"], "si", "Si + imparfait → conditionnel: si la ville investissait."],
      ]),
    text("pr-b2-03", "B2", "Article", "Apprendre une langue à l'âge adulte",
      "On dit souvent qu'il est trop tard pour apprendre une langue après trente ans. Pourtant, les recherches récentes montrent le contraire. Les adultes ont moins de facilité pour la prononciation, {0} ils comprennent mieux les règles de grammaire et savent organiser leur apprentissage.\n\nArrivée à Montréal à quarante ans, ma voisine Lucia ne parlait pas un mot de français. Trois ans plus tard, elle {1} son examen de français avec la mention très bien. Son secret ? Elle regardait les nouvelles tous les soirs, {2} les mots nouveaux dans un carnet. « Il ne faut pas avoir peur de faire des erreurs, m'a-t-elle expliqué. Il faut qu'on {3} en parlant, pas seulement en lisant. » Je me demande {4} les écoles ne proposent pas davantage de cours du soir pour les adultes.", [
        ["donc", ["mais", "en revanche", "cependant", "pourtant", "par contre"], "concession", "The two facts are opposed, not a cause and its result: mais (or en revanche)."],
        ["réussissait", ["a réussi"], "sequence", "One completed event in the story: passé composé, a réussi."],
        ["en écrivent", ["en écrivant", "en notant"], "gerondif", "The gérondif ends in -ant: en écrivant."],
        ["apprend", ["apprenne"], "subjonctif", "Il faut que + subjonctif: qu'on apprenne."],
        ["pourquoi est-ce que", ["pourquoi"], "interrogative", "Est-ce que disappears in an embedded question: je me demande pourquoi les écoles…"],
      ]),
    text("pr-b2-04", "B2", "Complaint letter", "Une valise perdue",
      "Madame, Monsieur,\n\nLe 12 février, j'ai pris le vol AC 872 entre Paris et Montréal. À mon arrivée, ma valise n'était pas sur le tapis. L'agente {0} je me suis adressé m'a assuré qu'elle arriverait le lendemain. Or, elle ne m'a été livrée que dix jours plus tard, et plusieurs objets étaient {1}. Pendant ce temps, j'ai dû acheter des vêtements et des produits d'hygiène, ce {2} m'a coûté plus de 300 dollars ; vous trouverez les reçus ci-joints. Je vous serais reconnaissant de bien vouloir me rembourser ces frais et de m'indiquer {3} pour obtenir une indemnisation. Si {4} pas de réponse sous trente jours, je m'adresserai à l'Office des transports du Canada.\n\nJe vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.\nMalik Benali", [
        ["que", ["à qui", "à laquelle"], "relatifs", "S'adresser À quelqu'un: à qui (or à laquelle)."],
        ["abîmé", ["abîmés"], "accord", "The participle agrees with plusieurs objets: abîmés."],
        ["que", ["qui"], "relatifs", "Ce qui is the subject of a coûté: ce qui m'a coûté."],
        ["qu'est-ce qu'il faut faire", ["ce qu'il faut faire", "ce que je dois faire"], "interrogative", "Qu'est-ce que becomes ce que in an embedded question: ce qu'il faut faire."],
        ["je n'aurai", ["je n'ai"], "si", "Never the futur right after si: si je n'ai pas de réponse."],
      ]),
    text("pr-b2-05", "B2", "Two documents compared", "Les téléphones à l'école",
      "Le premier document défend l'interdiction des téléphones portables à l'école : selon l'auteur, les élèves seraient plus attentifs et {0} en classe. Le second document, au contraire, estime qu'il vaut mieux apprendre aux jeunes à {1} intelligemment.\n\nPour ma part, je partage plutôt le point de vue du premier auteur. Quand j'étais au lycée, nous n'avions pas de téléphone en classe, et nous {2} beaucoup plus entre nous pendant les pauses. {3} soit utile en cas d'urgence, le téléphone distrait les élèves en permanence. Cependant, une interdiction totale ne suffit pas : il faudrait que les parents {4} aussi l'exemple à la maison.", [
        ["participeraient les discussions", ["participeraient aux discussions", "participeraient davantage aux discussions"], "lexique", "Participer À quelque chose: participeraient aux discussions."],
        ["les servir", ["s'en servir"], "pronoms", "Se servir DE quelque chose: keep se, and de + thing becomes en: s'en servir."],
        ["avons parlé", ["parlions"], "sequence", "A habit in the past (quand j'étais au lycée): imparfait, nous parlions."],
        ["Même s'il", ["Bien qu'il", "Quoiqu'il"], "concession", "Soit is subjonctif, which même si never takes: bien qu'il soit."],
        ["donneraient", ["donnent"], "subjonctif", "Il faudrait que + subjonctif, never the conditionnel: que les parents donnent."],
      ]),
    text("pr-b2-06", "B2", "Article", "Se loger à Vancouver",
      "Trouver un logement abordable à Vancouver est devenu un véritable défi. En dix ans, les loyers {0}, alors que les salaires n'ont augmenté que de 20 %. Beaucoup de jeunes familles quittent la ville {1} ne peuvent plus payer. Certains propriétaires profitent même de la situation pour louer des appartements en mauvais état.\n\nMa sœur et son mari, par exemple, ont dû s'installer à Abbotsford l'année dernière ; ils passent maintenant trois heures par jour dans {2} voiture. La ville a lancé plusieurs projets de logements sociaux, mais il faudra des années avant qu'ils {3} prêts. À mon avis, il est urgent que les gouvernements {4} front commun : sans action coordonnée, la crise ne fera que s'aggraver.", [
        ["ont presque doublés", ["ont presque doublé"], "accord", "With avoir and no direct object before it, the participle doesn't agree: ont presque doublé."],
        ["à cause qu'elles", ["parce qu'elles", "car elles"], "cause", "À cause de needs a noun. Before a clause, use parce que: parce qu'elles."],
        ["sa", ["leur"], "micro", "Two owners (ma sœur et son mari): leur voiture, not sa."],
        ["seront", ["soient"], "subjonctif", "Avant que + subjonctif: avant qu'ils soient prêts."],
        ["font", ["fassent"], "subjonctif", "Il est urgent que + subjonctif: fassent."],
      ]),
    text("pr-b2-07", "B2", "Cover letter", "Candidature : assistant comptable",
      "Madame, Monsieur,\n\nTitulaire d'un diplôme en comptabilité obtenu au Maroc, je souhaite répondre à l'offre d'emploi {0} vous avez publiée sur le site de la Ville pour un poste d'assistant comptable. Depuis mon arrivée au Québec, {1} plusieurs formations pour faire reconnaître mes compétences, et j'ai effectué un stage de six mois dans un cabinet de Laval. Cette expérience m'a permis de me familiariser avec les normes canadiennes. Je suis une personne rigoureuse et organisée, et {2} facilement au travail en équipe. Si ma candidature vous {3}, je serai ravi de vous rencontrer. Je reste à votre disposition pour tout renseignement {4} vous pourriez avoir besoin.\n\nVeuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\nOmar Alaoui", [
        ["dont", ["que"], "relatifs", "Publier une offre: a direct object, so que (and publiée agrees with it)."],
        ["je suivais", ["j'ai suivi"], "sequence", "Training courses completed since arriving: passé composé, j'ai suivi."],
        ["j'adapte", ["je m'adapte"], "pronominaux", "S'adapter keeps its reflexive pronoun: je m'adapte."],
        ["intéresserait", ["intéresse"], "si", "Never the conditionnel right after si: si ma candidature vous intéresse."],
        ["que", ["dont"], "relatifs", "Avoir besoin DE quelque chose: dont."],
      ]),
    text("pr-b2-08", "B2", "Article", "Le bénévolat, une porte d'entrée",
      "Faire du bénévolat est l'un des meilleurs moyens de s'intégrer quand on arrive au Canada. C'est ce {0} Mariam, arrivée de Syrie il y a deux ans, a découvert. « Au début, je ne connaissais personne et je n'osais pas parler français », raconte-t-elle. « {1} à la banque alimentaire du quartier ! » lui a conseillé une voisine. Aujourd'hui, Mariam y travaille deux après-midi par semaine. {2} cette expérience, elle a amélioré son français et elle a même trouvé un emploi.\n\nLes organismes communautaires manquent pourtant de bénévoles : selon une étude récente, leur nombre {3} de 15 % depuis 2019. Il serait donc utile que les entreprises {4} leurs employés à s'engager.", [
        ["qui", ["que"], "relatifs", "Mariam is the subject of a découvert, so ce que: c'est ce que Mariam a découvert."],
        ["T'inscris", ["Inscris-toi"], "imperatif", "Affirmative imperative: the pronoun goes after the verb and te becomes toi: inscris-toi."],
        ["À cause de", ["Grâce à"], "cause", "A cause with a good result: grâce à. À cause de is for a bad one."],
        ["ont baissé", ["a baissé", "aurait baissé"], "accord", "The subject is leur nombre, which is singular: a baissé."],
        ["encourageraient", ["encouragent"], "subjonctif", "Il serait utile que + subjonctif, never the conditionnel: que les entreprises encouragent."],
      ]),
    text("pr-b2-09", "B2", "Email to a teacher", "Demande de délai",
      "Bonjour Monsieur Gagnon,\n\nJe me permets de vous écrire au sujet du travail de recherche {0} nous devons rendre vendredi. Mon père a été hospitalisé la semaine dernière et j'ai dû m'occuper de mes jeunes frères. Je n'ai donc pas pu avancer autant que {1}. Serait-il possible que je vous {2} le travail lundi prochain ? J'ai déjà terminé la recherche documentaire ; il ne me reste que la rédaction. Je comprendrais tout à fait que vous {3}, mais ce délai me permettrait de rendre un travail de qualité. Pourriez-vous me dire {4} ?\n\nJe vous remercie de votre compréhension.\nSarah Dubois", [
        ["qui", ["que"], "relatifs", "Le travail is the direct object of rendre (nous is the subject): que."],
        ["je l'ai prévu", ["je l'avais prévu"], "sequence", "The plan came before the delay: plus-que-parfait, je l'avais prévu."],
        ["rendrai", ["rende"], "subjonctif", "Serait-il possible que + subjonctif: que je vous rende."],
        ["refuseriez", ["refusiez"], "subjonctif", "Comprendre que + subjonctif here, never the conditionnel: que vous refusiez."],
        ["si est-ce possible", ["si c'est possible", "si cela est possible", "si ce serait possible"], "interrogative", "No inversion in an embedded question: si c'est possible."],
      ]),
    text("pr-b2-10", "B2", "Two documents compared", "La voiture électrique obligatoire ?",
      "Le gouvernement canadien veut que toutes les voitures neuves vendues en 2035 {0} électriques. Le premier document salue cette décision : selon son auteur, elle permettrait de réduire fortement les émissions de gaz à effet de serre. Le second document se montre plus prudent ; il rappelle que les bornes de recharge {1} encore rares dans les régions éloignées.\n\nÀ mon avis, cette mesure va dans le bon sens, même si elle ne {2} pas. {3} les voitures électriques coûtent moins cher à l'usage, leur prix d'achat reste trop élevé pour beaucoup de familles. Si l'État {4} pas les ménages modestes, seuls les plus riches pourront changer de voiture.", [
        ["seront", ["soient"], "subjonctif", "Vouloir que + subjonctif: soient."],
        ["est", ["sont"], "accord", "The subject is les bornes, which is plural: sont."],
        ["suffise", ["suffira", "suffit"], "concession", "Même si takes the indicative, never the subjonctif: même si elle ne suffira pas."],
        ["Malgré", ["Bien que", "Même si", "Alors que"], "concession", "Malgré needs a noun. Before a clause: bien que (or même si)."],
        ["n'aidera", ["n'aide"], "si", "Never the futur right after si: si l'État n'aide pas."],
      ]),
  ];
})();
