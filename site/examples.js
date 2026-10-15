/* Example sentences for every built-in card: the word in real use, not a definition.
   Loaded after anki.js and before app.js. Each card keeps the examples it already had first; these are added
   after them, skipping any whose French is already there. Keyed by deck id, then by the card's French side
   exactly as written in data.js / anki.js (so a reworded card needs its key reworded too: check_notes.js
   lists any key that no longer matches a card).
   Every card has at least 2, and a card with several parts one per part, at least 3. They're B1–B2, set in the
   situations the TCF Canada writes about (settling in Canada, work, housing, health, the environment,
   studies, public life), and at least one per card is a sentence you could write in Tâche 2 or 3 or say in
   Expression orale Tâche 3. Line format: "French — English". */
(function () {
  "use strict";
  const T = window.TCF;
  const EX = {
    anki: {
      "le jour ouvrable": [
        "Votre permis de travail sera traité dans un délai de dix jours ouvrables. — Your work permit will be processed within ten working days.",
        "Les jours fériés ne comptent pas comme des jours ouvrables. — Public holidays don't count as business days.",
      ],
      "amener / emmener": [
        "Tu peux amener ta sœur à la fête, elle sera la bienvenue. — You can bring your sister to the party; she'll be welcome.",
        "Chaque matin, j'emmène mes enfants à l'école avant d'aller au bureau. — Every morning I take my children to school before going to the office.",
        "Le chauffeur nous a amenés jusqu'à l'aéroport, puis il est reparti. — The driver brought us to the airport, then left again.",
      ],
      "l'oreiller (nm)": [
        "L'hôtel propose un oreiller plus ferme sur demande. — The hotel offers a firmer pillow on request.",
        "J'ai oublié mon oreiller de voyage dans l'avion pour Montréal. — I left my travel pillow on the plane to Montréal.",
      ],
      "quoique (+ subj.)": [
        "Quoique le loyer soit élevé, l'appartement reste très demandé. — Although the rent is high, the flat is still in great demand.",
        "Le télétravail fait gagner du temps, quoiqu'il puisse isoler certains employés. — Remote work saves time, although it can isolate some employees.",
      ],
      "à condition que (+ subj.)": [
        "Vous pouvez déposer votre demande en ligne, à condition que tous vos documents soient traduits. — You can apply online, on condition that all your documents are translated.",
        "Le télétravail est une bonne solution, à condition que l'employeur fournisse le matériel nécessaire. — Remote work is a good solution, provided the employer supplies the equipment needed.",
      ],
      "en attendant que (+ subj.)": [
        "En attendant que ma demande soit acceptée, je suis des cours de français le soir. — While I wait for my application to be accepted, I'm taking French classes in the evening.",
        "Nous logeons chez des amis en attendant que notre appartement soit prêt. — We're staying with friends until our flat is ready.",
      ],
      "pour que (+ subj.)": [
        "La ville a ajouté des pistes cyclables pour que les habitants puissent se déplacer sans voiture. — The city added cycle lanes so that residents can get around without a car.",
        "Je t'envoie le formulaire pour que tu le remplisses avant vendredi. — I'm sending you the form so that you fill it in before Friday.",
      ],
      "de peur que / de crainte que (+ subj.)": [
        "Beaucoup de nouveaux arrivants n'osent pas parler, de peur qu'on se moque de leur accent. — Many newcomers don't dare speak, for fear people will make fun of their accent.",
        "Le gouvernement a reporté la réforme de crainte qu'elle ne soit mal accueillie. — The government postponed the reform for fear it would be badly received.",
      ],
      "jusqu'à ce que (+ subj.)": [
        "Je resterai au Québec jusqu'à ce que j'obtienne ma résidence permanente. — I'll stay in Québec until I get my permanent residence.",
        "Il faut répéter l'exercice jusqu'à ce que la règle devienne automatique. — You have to repeat the exercise until the rule becomes automatic.",
      ],
      "bien que (+ subj.)": [
        "Bien que les hivers soient rudes, je ne regrette pas de m'être installé à Québec. — Although the winters are harsh, I don't regret settling in Québec City.",
        "Bien que les réseaux sociaux facilitent la communication, ils favorisent aussi la désinformation. — Although social media make communication easier, they also encourage misinformation.",
      ],
      "sans que (+ subj.)": [
        "Le loyer a augmenté sans que le propriétaire nous prévienne. — The rent went up without the landlord warning us.",
        "Il est parti sans que personne s'en rende compte. — He left without anyone noticing.",
      ],
      "pourvu que (+ subj.)": [
        "Tu peux emprunter ma voiture, pourvu que tu me la rendes avant ce soir. — You can borrow my car, provided you give it back before tonight.",
        "Pourvu qu'il fasse beau samedi, sinon le pique-nique sera annulé ! — Let's hope it's nice on Saturday, or the picnic will be cancelled!",
      ],
      "avant que (+ subj.)": [
        "Il faut agir avant qu'il soit trop tard pour la biodiversité. — We must act before it's too late for biodiversity.",
        "Envoie-moi ton CV avant que le poste soit pourvu. — Send me your CV before the position is filled.",
      ],
      "afin que (+ subj.)": [
        "Les cours de francisation sont gratuits afin que tous les immigrants puissent y participer. — French classes for immigrants are free so that all newcomers can take part.",
        "Je vous écris afin que vous puissiez corriger l'erreur sur ma facture. — I'm writing so that you can correct the mistake on my bill.",
        "J'économise chaque mois afin d'acheter un appartement. — I save every month in order to buy a flat.",
      ],
      "à moins de (+ inf.) / à moins que (+ subj.)": [
        "À moins de trouver un logement rapidement, nous devrons rester à l'hôtel. — Unless we find somewhere to live quickly, we'll have to stay at the hotel.",
        "La réunion aura lieu lundi, à moins que la directrice soit absente. — The meeting will be on Monday, unless the director is away.",
        "Je viendrai à pied, à moins qu'il neige trop. — I'll come on foot, unless it snows too much.",
      ],
      "le partisan / la partisane": [
        "Les partisans du télétravail affirment qu'il améliore la qualité de vie. — Supporters of remote work say it improves quality of life.",
        "Elle est une fervente partisane des transports en commun. — She's a keen supporter of public transit.",
      ],
      "le scrutin (nm)": [
        "Le taux de participation au dernier scrutin municipal était très faible. — Turnout in the last municipal election was very low.",
        "Les résultats du scrutin seront annoncés dimanche soir. — The election results will be announced on Sunday evening.",
      ],
      "démissionner": [
        "Elle a démissionné pour reprendre ses études à l'université. — She resigned to go back to university.",
        "Le ministre a été contraint de démissionner après le scandale. — The minister was forced to resign after the scandal.",
      ],
      "indiscutable (adj)": [
        "Les avantages du bilinguisme sur le marché du travail sont indiscutables. — The advantages of being bilingual on the job market are undeniable.",
        "Son talent est indiscutable, mais il manque d'expérience. — His talent is indisputable, but he lacks experience.",
      ],
      "sans appel": [
        "La décision du tribunal est sans appel. — The court's decision is final.",
        "Les résultats de l'étude sont sans appel : la sédentarité nuit à la santé. — The study's results are clear-cut: a sedentary lifestyle harms health.",
      ],
      "onéreux / onéreuse": [
        "Les études supérieures restent onéreuses pour les étudiants étrangers. — Higher education remains costly for international students.",
        "Réparer cette vieille voiture serait trop onéreux. — Repairing this old car would be too expensive.",
      ],
      "la caution": [
        "Le propriétaire m'a demandé une caution d'un mois de loyer. — The landlord asked me for a deposit of one month's rent.",
        "Au Québec, il est interdit d'exiger une caution pour louer un logement. — In Québec, it's illegal to demand a deposit to rent a home.",
      ],
      "le montant (nm) / montant (adj)": [
        "Le montant de la facture d'électricité a doublé cet hiver. — The amount on the electricity bill doubled this winter.",
        "Indiquez le montant total de vos revenus sur le formulaire. — Enter the total amount of your income on the form.",
        "La marée montante a recouvert la plage en quelques minutes. — The rising tide covered the beach in a few minutes.",
      ],
      "baser / basé sur": [
        "Le système d'immigration canadien est basé sur des points. — Canada's immigration system is based on points.",
        "J'ai basé mon argumentation sur deux études récentes. — I based my argument on two recent studies.",
      ],
      "la rareté": [
        "La rareté des logements abordables pousse les familles vers la banlieue. — The scarcity of affordable housing pushes families out to the suburbs.",
        "La rareté de l'eau devient un enjeu majeur dans plusieurs régions. — Water scarcity is becoming a major issue in several regions.",
      ],
      "le frein (nm)": [
        "Le coût du logement constitue un frein à l'installation des jeunes en ville. — Housing costs are an obstacle to young people settling in the city.",
        "La langue reste le principal frein à l'intégration professionnelle. — Language remains the main obstacle to finding work.",
      ],
      "la méfiance (nf)": [
        "La désinformation nourrit la méfiance envers les médias traditionnels. — Misinformation feeds distrust of the traditional media.",
        "Il a accueilli la proposition avec méfiance. — He greeted the proposal with suspicion.",
      ],
      "fâcher": [
        "Ses remarques sur mon accent m'ont vraiment fâché. — His comments about my accent really made me angry.",
        "Je ne voulais pas te fâcher, je voulais seulement t'aider. — I didn't mean to make you angry; I only wanted to help.",
      ],
      "repousser": [
        "La réunion a été repoussée à la semaine prochaine. — The meeting has been put off until next week.",
        "Après la coupe, les cheveux repoussent plus vite en été. — After a haircut, hair grows back faster in summer.",
        "Ce produit naturel repousse les moustiques. — This natural product repels mosquitoes.",
      ],
      "échiner / s'échiner": [
        "Elle s'échine à cumuler deux emplois pour payer son loyer. — She's working herself to the bone holding down two jobs to pay her rent.",
        "Je me suis échiné toute la journée à repeindre l'appartement. — I slaved away all day repainting the flat.",
      ],
      "l'aboutissement (nm)": [
        "Ce diplôme est l'aboutissement de quatre années d'efforts. — This degree is the result of four years of hard work.",
        "L'obtention de la citoyenneté marque l'aboutissement de son parcours migratoire. — Getting citizenship marks the end point of her migration journey.",
      ],
      "retraiter": [
        "Les eaux usées sont retraitées avant d'être rejetées dans le fleuve. — Wastewater is treated again before being released into the river.",
        "L'usine retraite les déchets plastiques pour en faire du mobilier urbain. — The plant reprocesses plastic waste into street furniture.",
      ],
      "rompre": [
        "L'entreprise a rompu son contrat avec ce fournisseur. — The company terminated its contract with this supplier.",
        "Ils ont rompu après cinq ans de vie commune. — They broke up after living together for five years.",
      ],
      "édicter": [
        "La province a édicté de nouvelles règles pour protéger les locataires. — The province has enacted new rules to protect tenants.",
        "Les normes de sécurité sont édictées par le gouvernement fédéral. — Safety standards are laid down by the federal government.",
      ],
      "malicieux / malicieuse": [
        "Mon fils m'a regardé avec un sourire malicieux. — My son looked at me with a mischievous smile.",
        "Ce pirate informatique est malveillant, pas malicieux : il vole des données. — This hacker is malicious, not mischievous: he steals data.",
      ],
      "le perdant / la perdante": [
        "Les grands perdants de cette réforme sont les étudiants étrangers. — The big losers from this reform are international students.",
        "Il est mauvais perdant : il quitte toujours la partie en colère. — He's a sore loser: he always leaves the game angry.",
      ],
      "la feuille de demande de congés / le congé / la feuille de papier": [
        "J'ai rempli la feuille de demande de congés pour la semaine de Noël. — I filled in the leave request form for Christmas week.",
        "Elle est en congé de maternité jusqu'au mois de juin. — She's on maternity leave until June.",
        "Prenez une feuille de papier et notez vos idées principales. — Take a sheet of paper and note down your main ideas.",
      ],
      "s'écrouler": [
        "Le vieux pont s'est écroulé sous le poids de la neige. — The old bridge collapsed under the weight of the snow.",
        "Après sa journée de travail, elle s'est écroulée sur le canapé. — After her day at work, she collapsed onto the sofa.",
      ],
      "l'étoile (nf)": [
        "Loin des villes, on voit beaucoup plus d'étoiles la nuit. — Away from the cities, you can see many more stars at night.",
        "La pollution lumineuse nous empêche d'observer les étoiles. — Light pollution stops us from seeing the stars.",
      ],
      "s'évanouir": [
        "Une passagère s'est évanouie dans le métro à cause de la chaleur. — A passenger fainted on the metro because of the heat.",
        "J'ai failli m'évanouir pendant la prise de sang. — I nearly passed out during the blood test.",
      ],
      "avoir un rhume / la grippe": [
        "J'ai un rhume, alors je vais travailler de la maison aujourd'hui. — I've got a cold, so I'm going to work from home today.",
        "Il a eu la grippe et il est resté au lit toute la semaine. — He had the flu and stayed in bed all week.",
        "Le vaccin contre la grippe est gratuit pour les personnes âgées. — The flu vaccine is free for older people.",
      ],
      "tousser": [
        "Si vous toussez depuis plus de trois semaines, consultez un médecin. — If you've been coughing for more than three weeks, see a doctor.",
        "Cette toux sèche m'empêche de dormir. — This dry cough is keeping me awake.",
      ],
      "l'analgésique (nm)": [
        "Le pharmacien m'a conseillé un analgésique contre le mal de dos. — The pharmacist recommended a painkiller for my back pain.",
        "Ne prenez pas plus de trois analgésiques par jour. — Don't take more than three painkillers a day.",
      ],
      "la gélule": [
        "Prenez une gélule matin et soir pendant le repas. — Take one capsule morning and evening with food.",
        "Ce médicament existe en gélules ou en sirop. — This medicine comes as capsules or as a syrup.",
      ],
      "l'embouteillage (nm)": [
        "Chaque matin, je perds une heure dans les embouteillages sur le pont Champlain. — Every morning I lose an hour in traffic jams on the Champlain Bridge.",
        "Le développement des transports en commun permettrait de réduire les embouteillages. — Expanding public transit would reduce traffic jams.",
      ],
      "accroître": [
        "Le télétravail a accru la productivité de nombreuses entreprises. — Remote work has increased productivity at many companies.",
        "La province souhaite accroître le nombre d'immigrants francophones. — The province wants to increase the number of French-speaking immigrants.",
        "On observe une demande accrue de logements sociaux. — There's increased demand for social housing.",
      ],
      "l'échec (nm)": [
        "Un échec à l'examen n'est pas la fin du monde : on peut le repasser. — Failing the exam isn't the end of the world: you can take it again.",
        "Les négociations entre le syndicat et la direction se sont soldées par un échec. — The talks between the union and management ended in failure.",
        "Mon grand-père m'a appris à jouer aux échecs. — My grandfather taught me to play chess.",
      ],
      "détenir": [
        "Cette entreprise détient près de la moitié du marché. — This company holds nearly half the market.",
        "Pour voter, il faut détenir la citoyenneté canadienne. — To vote, you must hold Canadian citizenship.",
      ],
      "la matière": [
        "Le français est la matière que je préfère. — French is my favourite subject.",
        "Cette veste est faite dans une matière recyclée. — This jacket is made from a recycled material.",
        "En matière de logement, la situation reste préoccupante. — When it comes to housing, the situation is still worrying.",
      ],
      "aboutir / aboutir à": [
        "Après deux ans de démarches, notre projet a enfin abouti. — After two years of paperwork, our project finally came through.",
        "Ces discussions ont abouti à un accord entre les deux parties. — These discussions led to an agreement between the two sides.",
        "Ma demande de résidence n'a pas encore abouti. — My residence application hasn't gone through yet.",
      ],
      "l'apprentissage (nm)": [
        "L'apprentissage d'une langue demande de la patience et de la régularité. — Learning a language takes patience and consistency.",
        "Il a fait un apprentissage de deux ans chez un électricien. — He did a two-year apprenticeship with an electrician.",
      ],
      "perturber": [
        "La tempête de neige a perturbé le trafic aérien toute la journée. — The snowstorm disrupted air traffic all day.",
        "Le bruit des travaux perturbe mon sommeil. — The noise from the roadworks disturbs my sleep.",
      ],
      "la répartition": [
        "La répartition des tâches ménagères reste inégale dans beaucoup de couples. — The division of household chores is still unequal in many couples.",
        "Le gouvernement a revu la répartition du budget entre la santé et l'éducation. — The government has revised the split of the budget between health and education.",
      ],
      "concrétiser": [
        "Grâce à cette bourse, j'ai pu concrétiser mon projet d'études au Canada. — Thanks to this grant, I was able to make my plan to study in Canada a reality.",
        "La ville tarde à concrétiser ses promesses en matière de logement. — The city is slow to deliver on its housing promises.",
      ],
      "échapper (à)": [
        "Le voleur a réussi à échapper à la police. — The thief managed to escape the police.",
        "Personne n'échappe à la hausse du coût de la vie. — Nobody escapes the rising cost of living.",
        "Son nom m'échappe pour le moment. — His name escapes me for the moment.",
      ],
      "confondu (adj)": [
        "Toutes catégories confondues, les ventes ont augmenté de 5 %. — All categories combined, sales rose by 5%.",
        "Confondu, il n'a pas su quoi répondre à la question du jury. — Flustered, he didn't know how to answer the panel's question.",
      ],
      "évoquer": [
        "Dans son discours, la ministre a évoqué la pénurie de main-d'œuvre. — In her speech, the minister brought up the labour shortage.",
        "Cette chanson évoque mon enfance au Maroc. — This song brings back my childhood in Morocco.",
      ],
      "le bien-être (nm)": [
        "Le télétravail peut améliorer le bien-être des employés. — Remote work can improve employees' well-being.",
        "Les espaces verts contribuent au bien-être des habitants. — Green spaces contribute to residents' well-being.",
      ],
      "mettre en doute": [
        "Personne ne met en doute l'importance de la prévention. — Nobody questions the importance of prevention.",
        "Certains experts mettent en doute l'efficacité de cette mesure. — Some experts question how effective this measure is.",
      ],
      "faire preuve de": [
        "Pour s'intégrer, il faut faire preuve de patience et d'ouverture. — To fit in, you have to show patience and openness.",
        "L'équipe a fait preuve de beaucoup de créativité pendant la crise. — The team showed great creativity during the crisis.",
      ],
      "trier / classer": [
        "À Montréal, on doit trier ses déchets dans trois bacs différents. — In Montréal you have to sort your rubbish into three different bins.",
        "J'ai classé tous mes documents d'immigration par date. — I've filed all my immigration documents by date.",
        "Ce restaurant est classé parmi les meilleurs de la ville. — This restaurant is ranked among the best in the city.",
      ],
      "la croissance": [
        "La croissance économique ralentit depuis le début de l'année. — Economic growth has been slowing since the start of the year.",
        "Le secteur des technologies vertes est en pleine croissance. — The green tech sector is growing fast.",
      ],
      "rater": [
        "J'ai raté le dernier autobus et j'ai dû rentrer à pied. — I missed the last bus and had to walk home.",
        "J'ai complètement raté mon gâteau : il est trop sec. — I completely messed up my cake: it's too dry.",
        "Ne rate pas cette occasion de travailler à l'étranger ! — Don't miss this chance to work abroad!",
      ],
      "échouer / échouer à": [
        "Les négociations ont échoué faute d'accord sur les salaires. — The talks failed for lack of agreement on pay.",
        "Il a échoué à l'examen de conduite deux fois. — He failed the driving test twice.",
        "Beaucoup de projets échouent par manque de financement. — Many projects fail for lack of funding.",
      ],
      "installer / s'installer": [
        "Le technicien est venu installer Internet dans notre nouvel appartement. — The technician came to set up the internet in our new flat.",
        "Nous nous sommes installés à Sherbrooke il y a deux ans. — We settled in Sherbrooke two years ago.",
        "De plus en plus de familles s'installent en région pour fuir les loyers élevés. — More and more families are moving out of the big cities to escape high rents.",
      ],
      "attendre / s'attendre à": [
        "J'attends la réponse d'Immigration Canada depuis six mois. — I've been waiting six months for an answer from Immigration Canada.",
        "Je ne m'attendais pas à un hiver aussi froid. — I wasn't expecting such a cold winter.",
        "Il faut s'attendre à une hausse des loyers l'an prochain. — We should expect rents to go up next year.",
      ],
      "abordable": [
        "Il devient difficile de trouver un logement abordable à Vancouver. — It's getting hard to find affordable housing in Vancouver.",
        "Les transports en commun doivent rester abordables pour tous. — Public transit must stay affordable for everyone.",
      ],
      "mensuel / mensuelle": [
        "Mon loyer mensuel représente presque la moitié de mon salaire. — My monthly rent is almost half my salary.",
        "Nous organisons une réunion mensuelle avec toute l'équipe. — We hold a monthly meeting with the whole team.",
      ],
      "le placement": [
        "L'immobilier reste un placement sûr pour beaucoup de Canadiens. — Property is still a safe investment for many Canadians.",
        "La banque m'a proposé plusieurs placements à faible risque. — The bank suggested several low-risk investments.",
      ],
      "épargner": [
        "Nous épargnons chaque mois pour acheter notre première maison. — We save every month to buy our first house.",
        "Avec la hausse des prix, il est de plus en plus difficile d'épargner. — With prices rising, it's harder and harder to save.",
      ],
      "abîmer": [
        "Le déménageur a abîmé ma table en la descendant. — The mover damaged my table carrying it downstairs.",
        "Le sel sur les routes abîme les voitures en hiver. — The salt on the roads damages cars in winter.",
      ],
      "convenir de / convenir à": [
        "Nous avons convenu d'un rendez-vous mardi à 10 h. — We agreed on an appointment on Tuesday at 10.",
        "Je dois convenir que tu avais raison. — I have to admit you were right.",
        "Cet horaire me convient parfaitement. — This schedule suits me perfectly.",
      ],
      "la larme": [
        "Elle avait les larmes aux yeux en recevant sa citoyenneté. — She had tears in her eyes when she received her citizenship.",
        "Ce film m'a fait verser une larme. — This film made me shed a tear.",
      ],
      "rouillé(e)": [
        "Mon vélo est resté dehors tout l'hiver et la chaîne est rouillée. — My bike was left outside all winter and the chain is rusty.",
        "Je n'ai pas parlé espagnol depuis des années, je suis un peu rouillé. — I haven't spoken Spanish for years; I'm a bit rusty.",
      ],
      "le / la dirigeant(e)": [
        "Les dirigeants syndicaux ont rencontré la première ministre. — The union leaders met the premier.",
        "La dirigeante de l'entreprise a annoncé de nouvelles embauches. — The company's head announced new hires.",
      ],
      "le chiffre": [
        "Selon les derniers chiffres, le chômage a légèrement baissé. — According to the latest figures, unemployment has fallen slightly.",
        "Le chiffre d'affaires de la PME a doublé en deux ans. — The small business's turnover doubled in two years.",
      ],
      "l'abus (nm)": [
        "L'abus d'alcool est l'une des principales causes d'accidents de la route. — Alcohol abuse is one of the main causes of road accidents.",
        "Les locataires dénoncent les abus de certains propriétaires. — Tenants are speaking out against abuses by some landlords.",
      ],
      "prioritaire (adj) / la priorité (nf)": [
        "Les infirmières sont prioritaires dans le programme d'immigration de la province. — Nurses get priority in the province's immigration program.",
        "La lutte contre la crise du logement doit être une priorité. — Tackling the housing crisis must be a priority.",
        "Au carrefour, les piétons ont la priorité. — At the crossroads, pedestrians have right of way.",
      ],
      "le troupeau (pl. troupeaux)": [
        "Un troupeau de vaches bloquait la route de campagne. — A herd of cows was blocking the country road.",
        "Les éleveurs rentrent les troupeaux avant l'hiver. — Farmers bring the herds in before winter.",
      ],
      "cependant (adv)": [
        "Le Canada attire de nombreux immigrants. Cependant, beaucoup peinent à trouver un emploi dans leur domaine. — Canada attracts many immigrants. However, many struggle to find work in their field.",
        "Le projet est prometteur ; il présente cependant quelques risques. — The project is promising; it does, however, carry some risks.",
      ],
      "pourtant (adv)": [
        "Il a révisé tous les soirs, et pourtant il a raté l'examen. — He revised every evening, and yet he failed the exam.",
        "Les loyers augmentent. Pourtant, les salaires stagnent. — Rents are going up. Yet wages are stagnating.",
      ],
      "en effet": [
        "Le télétravail séduit de nombreux salariés. En effet, il leur permet d'éviter les longs trajets. — Remote work appeals to many employees. Indeed, it lets them avoid long commutes.",
        "Je n'ai pas pu venir hier. En effet, mon train a été annulé. — I couldn't come yesterday: my train was cancelled, in fact.",
      ],
      "les frais (nm pl) / frais, fraîche (adj)": [
        "Les frais de scolarité ont augmenté de 10 % cette année. — Tuition fees went up 10% this year.",
        "L'entreprise rembourse les frais de déplacement. — The company pays back travel expenses.",
        "J'achète des légumes frais au marché Jean-Talon. — I buy fresh vegetables at Jean-Talon Market.",
      ],
      "rentable (adj)": [
        "L'installation de panneaux solaires devient rentable au bout de dix ans. — Installing solar panels pays off after ten years.",
        "Ce commerce n'était plus rentable, alors il a fermé. — This shop was no longer profitable, so it closed.",
      ],
      "entreprendre": [
        "Elle a entrepris des démarches pour faire reconnaître son diplôme. — She has started the process of getting her degree recognised.",
        "La ville va entreprendre de grands travaux de rénovation. — The city is going to undertake major renovation work.",
      ],
      "toutefois": [
        "Le transport en commun est pratique ; il reste toutefois insuffisant en banlieue. — Public transit is convenient; it is, however, still inadequate in the suburbs.",
        "Je suis d'accord avec vous. Toutefois, il faut tenir compte du coût. — I agree with you. However, we have to take the cost into account.",
      ],
      "tandis que": [
        "Les jeunes s'informent sur les réseaux sociaux, tandis que leurs parents préfèrent la télévision. — Young people get their news on social media, whereas their parents prefer television.",
      ],
      "jadis (adv)": [
        "Ce quartier, jadis industriel, attire aujourd'hui de jeunes familles. — This neighbourhood, once industrial, now attracts young families.",
      ],
      "le déchet": [
        "Chaque Canadien produit en moyenne près de 700 kg de déchets par an. — Each Canadian produces on average nearly 700 kg of waste a year.",
        "Il faudrait réduire les déchets à la source plutôt que de les recycler. — We should cut waste at the source rather than recycle it.",
      ],
      "malgré (+ nom) / malgré tout (adv)": [
        "Malgré le froid, les Montréalais profitent de la ville en hiver. — Despite the cold, Montrealers enjoy the city in winter.",
        "Le trajet était long ; malgré tout, je suis arrivé à l'heure. — The journey was long; even so, I arrived on time.",
      ],
      "contenir": [
        "Ce formulaire contient plusieurs questions sur votre parcours professionnel. — This form contains several questions about your career.",
        "Les produits transformés contiennent souvent trop de sel. — Processed foods often contain too much salt.",
      ],
      "réunir": [
        "Le festival réunit chaque année des artistes du monde entier. — Every year the festival brings together artists from all over the world.",
        "Il faut réunir tous les documents avant de déposer la demande. — You need to gather all the documents before submitting the application.",
      ],
      "ressourcer": [
        "Un week-end à la campagne permet de se ressourcer loin du bruit de la ville. — A weekend in the country lets you recharge away from the city noise.",
      ],
      "puisque": [
        "Puisque les loyers sont trop élevés en ville, beaucoup de familles partent en banlieue. — Since rents are too high in the city, many families move to the suburbs.",
      ],
      "étant donné que": [
        "Étant donné que le français est obligatoire au travail, les cours de langue sont essentiels. — Given that French is required at work, language classes are essential.",
      ],
      "en raison de (+ nom)": [
        "L'école est fermée aujourd'hui en raison d'une tempête de neige. — The school is closed today because of a snowstorm.",
      ],
      "par conséquent": [
        "Les loyers ont beaucoup augmenté ; par conséquent, de nombreux étudiants vivent en colocation. — Rents have risen sharply; consequently, many students share flats.",
      ],
      "néanmoins": [
        "Le télétravail offre une grande liberté ; néanmoins, il peut nuire à l'esprit d'équipe. — Remote work gives a lot of freedom; nonetheless, it can harm team spirit.",
      ],
    },
    connecteurs: {
      "mais": [
        "Le loyer est raisonnable, mais l'appartement est loin du métro. — The rent is reasonable, but the flat is far from the metro.",
        "J'aimerais travailler à Montréal, mais mon diplôme n'y est pas encore reconnu. — I'd like to work in Montréal, but my degree isn't recognised there yet.",
      ],
      "donc": [
        "Les transports en commun sont rares en région ; il faut donc une voiture. — Public transit is scarce outside the cities, so you need a car.",
        "Je n'ai pas reçu de réponse, je vous écris donc une seconde fois. — I haven't had an answer, so I'm writing to you a second time.",
      ],
      "alors": [
        "Le bus ne passait pas, alors j'ai pris un taxi. — The bus wasn't coming, so I took a taxi.",
        "Si tu n'es pas libre samedi, alors on se voit dimanche. — If you're not free on Saturday, then we'll meet on Sunday.",
      ],
      "par contre": [
        "Le centre-ville est animé ; par contre, il est très bruyant la nuit. — The city centre is lively; on the other hand, it's very noisy at night.",
        "Je comprends bien l'écrit, par contre j'ai encore du mal à l'oral. — I understand written French well, but I still struggle with speaking.",
      ],
      "en revanche": [
        "Les grandes villes offrent plus d'emplois. En revanche, le coût de la vie y est beaucoup plus élevé. — Big cities offer more jobs. On the other hand, the cost of living there is much higher.",
        "Le télétravail réduit les déplacements ; en revanche, il isole certains salariés. — Remote work cuts down on travel; on the other hand, it isolates some employees.",
      ],
      "par ailleurs": [
        "Ce programme facilite l'accès au logement. Par ailleurs, il encourage l'installation en région. — This program makes housing easier to find. Besides, it encourages people to settle outside the big cities.",
        "Le vélo est économique ; il est par ailleurs excellent pour la santé. — Cycling is cheap; it's also excellent for your health.",
      ],
      "en outre": [
        "Le poste est bien payé. En outre, il offre la possibilité de travailler à distance. — The job pays well. Furthermore, it offers the option of working remotely.",
        "La réforme est coûteuse ; elle risque, en outre, de pénaliser les plus modestes. — The reform is expensive; it may, moreover, penalise people on low incomes.",
      ],
      "d'une part… d'autre part": [
        "D'une part, l'immigration répond à la pénurie de main-d'œuvre ; d'autre part, elle enrichit la vie culturelle. — On the one hand, immigration addresses the labour shortage; on the other, it enriches cultural life.",
        "Il faut, d'une part, construire plus de logements et, d'autre part, encadrer la hausse des loyers. — We need, on the one hand, to build more housing and, on the other, to rein in rent increases.",
      ],
      "ainsi": [
        "La ville a créé des pistes cyclables ; ainsi, de nombreux habitants ont laissé leur voiture. — The city created cycle lanes; as a result, many residents left their cars at home.",
        "Ainsi, le télétravail présente autant d'avantages que d'inconvénients. — So remote work has as many advantages as drawbacks.",
      ],
      "c'est pourquoi": [
        "Les loyers ont explosé en ville, c'est pourquoi beaucoup de jeunes familles partent en banlieue. — Rents in the city have soared, which is why many young families move to the suburbs.",
        "Je parle déjà anglais ; c'est pourquoi j'ai choisi de m'installer au Québec pour apprendre le français. — I already speak English; that's why I chose to settle in Québec to learn French.",
      ],
      "grâce à": [
        "Grâce à son réseau, elle a trouvé un emploi en deux semaines. — Thanks to her network, she found a job in two weeks.",
        "Grâce aux cours de francisation, les nouveaux arrivants s'intègrent plus vite. — Thanks to French classes, newcomers fit in faster.",
      ],
      "à cause de": [
        "Le vol a été annulé à cause d'une tempête de neige. — The flight was cancelled because of a snowstorm.",
        "Beaucoup de familles s'endettent à cause de la hausse des prix. — Many families go into debt because of rising prices.",
      ],
      "alors que": [
        "Les loyers augmentent alors que les salaires stagnent. — Rents are rising while wages are stagnating.",
        "Il est parti en vacances alors que le projet n'était pas terminé. — He went on holiday even though the project wasn't finished.",
      ],
      "en définitive": [
        "En définitive, le télétravail profite surtout aux employés qui vivent loin du bureau. — Ultimately, remote work mainly benefits employees who live far from the office.",
        "Le projet a coûté plus cher que prévu, mais, en définitive, il a été une réussite. — The project cost more than planned but, in the end, it was a success.",
      ],
      "tout bien considéré": [
        "Tout bien considéré, je pense que vivre en région offre une meilleure qualité de vie. — All things considered, I think living outside the big cities gives a better quality of life.",
        "Tout bien considéré, nous avons décidé de rester à Montréal. — All things considered, we decided to stay in Montréal.",
      ],
      "dans cette optique": [
        "La ville veut réduire la circulation. Dans cette optique, elle a rendu le métro gratuit le dimanche. — The city wants to reduce traffic. With this in mind, it has made the metro free on Sundays.",
        "Je souhaite travailler dans la santé ; dans cette optique, je suis une formation de préposé aux bénéficiaires. — I want to work in healthcare; with that in mind, I'm training as a care attendant.",
      ],
      "face à ce constat": [
        "Le nombre de cyclistes a doublé en cinq ans. Face à ce constat, la ville a élargi ses pistes cyclables. — The number of cyclists has doubled in five years. Faced with this, the city has widened its cycle lanes.",
        "Face à ce constat, il me semble urgent d'investir dans le logement social. — In light of this, I think it's urgent to invest in social housing.",
      ],
      "dans ce contexte": [
        "Les prix de l'essence ne cessent d'augmenter. Dans ce contexte, le covoiturage devient très populaire. — Petrol prices keep rising. In this context, carpooling is becoming very popular.",
        "Dans ce contexte de pénurie, les employeurs recrutent davantage à l'étranger. — In this context of shortage, employers are recruiting more abroad.",
      ],
      "cela dit": [
        "Le loyer est cher. Cela dit, l'appartement est très bien situé. — The rent is expensive. That said, the flat is very well located.",
        "Les réseaux sociaux posent problème ; cela dit, ils permettent aussi de garder le contact avec sa famille. — Social media are a problem; that said, they also let you keep in touch with your family.",
      ],
      "d'un autre côté": [
        "D'un côté, la ville offre beaucoup d'emplois ; d'un autre côté, la vie y est stressante. — On the one hand, the city offers lots of jobs; on the other hand, life there is stressful.",
        "Le télétravail me fait gagner du temps. D'un autre côté, mes collègues me manquent. — Remote work saves me time. On the other hand, I miss my colleagues.",
      ],
      "quant à": [
        "Les enfants se sont vite adaptés ; quant à moi, il m'a fallu plus de temps. — The children adapted quickly; as for me, it took me longer.",
        "Quant aux frais de scolarité, ils restent très élevés pour les étudiants étrangers. — As for tuition fees, they're still very high for international students.",
      ],
      "il n'en demeure pas moins que": [
        "Le Canada accueille bien les immigrants. Il n'en demeure pas moins que l'accès à l'emploi reste difficile. — Canada welcomes immigrants well. The fact remains that finding work is still hard.",
        "Les loyers ont un peu baissé ; il n'en demeure pas moins que se loger coûte cher. — Rents have dropped a little; the fact remains that housing is expensive.",
      ],
    },
    quotidien: {
      "le quotidien": [
        "Le froid de l'hiver change complètement le quotidien des Montréalais. — The winter cold completely changes Montrealers' daily life.",
        "Les applications de paiement simplifient notre quotidien. — Payment apps make our everyday life simpler.",
      ],
      "les tâches ménagères": [
        "Chez nous, nous partageons les tâches ménagères à parts égales. — At home, we share the household chores equally.",
        "Les femmes consacrent encore plus de temps que les hommes aux tâches ménagères. — Women still spend more time on household chores than men.",
      ],
      "gérer son temps": [
        "Quand on travaille et qu'on étudie, il faut apprendre à gérer son temps. — When you work and study, you have to learn to manage your time.",
        "Le télétravail exige de bien gérer son temps. — Working from home means managing your time well.",
      ],
      "faire les courses": [
        "Je fais les courses le samedi matin, quand le supermarché est calme. — I do the grocery shopping on Saturday morning, when the supermarket is quiet.",
        "De plus en plus de gens font les courses en ligne. — More and more people do their grocery shopping online.",
      ],
      "prendre rendez-vous": [
        "Il faut prendre rendez-vous en ligne pour renouveler son passeport. — You have to make an appointment online to renew your passport.",
        "J'ai pris rendez-vous à la banque pour ouvrir un compte. — I've made an appointment at the bank to open an account.",
      ],
      "se déplacer": [
        "À Montréal, on peut facilement se déplacer en métro ou à vélo. — In Montréal you can easily get around by metro or by bike.",
        "Les personnes âgées ont souvent du mal à se déplacer l'hiver. — Older people often find it hard to get around in winter.",
      ],
      "le trajet": [
        "Mon trajet entre la maison et le bureau dure quarante minutes. — My commute between home and the office takes forty minutes.",
        "Je profite du trajet en train pour écouter des balados en français. — I use the train journey to listen to podcasts in French.",
      ],
      "un imprévu": [
        "Désolé, j'ai eu un imprévu et je ne pourrai pas venir ce soir. — Sorry, something came up and I won't be able to come tonight.",
        "Il vaut mieux garder un peu d'argent de côté en cas d'imprévu. — It's better to keep some money aside in case something unexpected happens.",
      ],
      "être débordé(e)": [
        "Je suis débordée en ce moment, est-ce qu'on peut se voir la semaine prochaine ? — I'm swamped at the moment; can we meet next week?",
        "Les urgences sont débordées pendant la saison de la grippe. — The emergency rooms are overwhelmed during flu season.",
      ],
      "se détendre": [
        "Le dimanche, j'aime me détendre au parc avec un bon livre. — On Sundays I like to relax in the park with a good book.",
        "Après une semaine chargée, j'ai besoin de me détendre. — After a busy week, I need to unwind.",
      ],
      "le voisinage": [
        "Nous entretenons de bonnes relations avec le voisinage. — We get on well with the neighbours.",
        "Une fête de quartier permet de rencontrer tout le voisinage. — A street party is a way to meet the whole neighbourhood.",
      ],
      "ranger": [
        "Les enfants doivent ranger leur chambre avant de sortir jouer. — The children have to tidy their room before going out to play.",
        "Où est-ce que tu as rangé les clés de la voiture ? — Where did you put the car keys?",
      ],
      "faire la queue": [
        "Nous avons fait la queue pendant une heure pour visiter le musée. — We queued for an hour to visit the museum.",
        "Grâce aux rendez-vous en ligne, on n'a plus besoin de faire la queue au bureau des passeports. — With online appointments, you no longer have to wait in line at the passport office.",
      ],
      "avoir hâte de": [
        "J'ai hâte de te faire visiter ma nouvelle ville ! — I can't wait to show you around my new city!",
        "Nous avons hâte que l'été arrive. — We're looking forward to summer coming.",
      ],
    },
    immigration: {
      "l'intégration": [
        "La maîtrise du français facilite l'intégration des nouveaux arrivants au Québec. — Mastering French makes it easier for newcomers to fit in in Québec.",
        "L'intégration professionnelle des immigrants qualifiés reste un défi. — Getting skilled immigrants into work remains a challenge.",
      ],
      "la résidence permanente": [
        "J'ai obtenu la résidence permanente après trois ans de permis de travail. — I got permanent residence after three years on a work permit.",
        "La résidence permanente donne accès à l'assurance maladie provinciale. — Permanent residence gives access to provincial health insurance.",
      ],
      "la citoyenneté": [
        "Pour demander la citoyenneté, il faut avoir vécu au Canada au moins trois ans sur cinq. — To apply for citizenship, you must have lived in Canada at least three years out of five.",
        "La cérémonie de citoyenneté a été un moment très émouvant pour toute la famille. — The citizenship ceremony was a very moving moment for the whole family.",
      ],
      "le statut": [
        "Mon statut de résident temporaire expire dans six mois. — My temporary resident status expires in six months.",
        "Les étudiants étrangers peuvent changer de statut une fois leur diplôme obtenu. — International students can change their status once they've graduated.",
      ],
      "la démarche": [
        "Les démarches d'immigration peuvent prendre plusieurs mois. — The immigration process can take several months.",
        "J'ai entrepris les démarches pour faire venir ma famille. — I've started the process of bringing my family over.",
      ],
      "le dossier": [
        "Votre dossier est incomplet : il manque votre relevé de notes. — Your application is incomplete: your transcript is missing.",
        "Mon dossier est en cours de traitement depuis février. — My file has been under review since February.",
      ],
      "l'admissibilité": [
        "Vérifiez votre admissibilité avant de remplir le formulaire. — Check your eligibility before filling in the form.",
        "Le niveau de français fait partie des critères d'admissibilité. — French level is one of the eligibility criteria.",
      ],
      "le parcours migratoire": [
        "Chaque parcours migratoire est unique et mérite d'être écouté. — Every migration journey is unique and deserves to be heard.",
        "Son parcours migratoire l'a menée du Liban à Paris, puis à Montréal. — Her migration journey took her from Lebanon to Paris, then to Montréal.",
      ],
      "s'intégrer": [
        "Le bénévolat est un excellent moyen de s'intégrer dans un nouveau pays. — Volunteering is a great way to fit into a new country.",
        "Mes enfants se sont intégrés très vite à l'école. — My children fitted in very quickly at school.",
      ],
      "déposer une demande": [
        "J'ai déposé une demande de permis de travail ouvert en ligne. — I filed an application for an open work permit online.",
        "Il faut déposer la demande au moins trois mois avant l'expiration de votre permis. — You must file the application at least three months before your permit expires.",
      ],
      "remplir les conditions": [
        "Pour obtenir cette bourse, il faut remplir certaines conditions de revenu. — To get this grant, you have to meet certain income requirements.",
        "Malheureusement, je ne remplis pas encore les conditions pour demander la citoyenneté. — Unfortunately, I don't meet the requirements to apply for citizenship yet.",
      ],
      "immigrer": [
        "Mes grands-parents ont immigré au Canada dans les années 1970. — My grandparents immigrated to Canada in the 1970s.",
        "De nombreux francophones choisissent d'immigrer au Nouveau-Brunswick. — Many French speakers choose to immigrate to New Brunswick.",
      ],
      "émigrer": [
        "Il a émigré de France à 25 ans pour travailler à Toronto. — He emigrated from France at 25 to work in Toronto.",
        "Chaque année, des milliers de jeunes diplômés émigrent pour trouver un emploi. — Every year, thousands of young graduates emigrate to find work.",
      ],
      "s'expatrier": [
        "Elle s'est expatriée au Québec pour la qualité de vie. — She moved abroad to Québec for the quality of life.",
        "S'expatrier demande beaucoup de courage et de préparation. — Moving abroad takes a lot of courage and preparation.",
      ],
      "admissible": [
        "Les étudiants étrangers sont admissibles à ce programme de stage. — International students are eligible for this internship program.",
        "Vous n'êtes pas admissible à ce programme si vous avez déjà un diplôme canadien. — You aren't eligible for this program if you already have a Canadian degree.",
      ],
      "qualifié(e)": [
        "Le Canada cherche à attirer des travailleurs qualifiés dans le secteur de la santé. — Canada is trying to attract skilled workers in the health sector.",
        "Malgré son expérience, il n'est pas considéré comme qualifié ici sans équivalence de diplôme. — Despite his experience, he isn't considered qualified here without a recognised degree.",
      ],
      "francophone": [
        "Les immigrants francophones sont recherchés hors du Québec. — French-speaking immigrants are in demand outside Québec.",
        "Je vis dans une communauté francophone en Ontario. — I live in a French-speaking community in Ontario.",
      ],
      "bilingue": [
        "Être bilingue est un véritable atout sur le marché du travail canadien. — Being bilingual is a real asset on the Canadian job market.",
        "Mes enfants grandissent dans une famille bilingue. — My children are growing up in a bilingual family.",
      ],
      "le / la ressortissant(e)": [
        "Les ressortissants français n'ont pas besoin de visa pour un court séjour au Canada. — French nationals don't need a visa for a short stay in Canada.",
        "Elle est ressortissante algérienne et vit à Montréal depuis 2020. — She's an Algerian national and has lived in Montréal since 2020.",
      ],
      "le délai": [
        "Les délais de traitement des demandes ont beaucoup augmenté cette année. — Application processing times have risen sharply this year.",
        "Vous avez un délai de trente jours pour répondre à cette lettre. — You have thirty days to reply to this letter.",
      ],
      "le seuil": [
        "Pour être admissible, votre revenu doit dépasser un certain seuil. — To be eligible, your income must be above a certain threshold.",
        "Une famille sur dix vit sous le seuil de pauvreté. — One family in ten lives below the poverty line.",
      ],
      "l'accueil": [
        "L'accueil des réfugiés mobilise de nombreux bénévoles. — Welcoming refugees involves many volunteers.",
        "Merci pour votre accueil chaleureux ! — Thank you for your warm welcome!",
      ],
      "déposer un dossier": [
        "J'ai déposé mon dossier de résidence permanente en mars. — I submitted my permanent residence file in March.",
        "Pour déposer un dossier complet, il faut joindre vos résultats du TCF Canada. — To submit a complete file, you must attach your TCF Canada results.",
      ],
      "remplir les conditions d'admissibilité": [
        "Seuls les candidats qui remplissent les conditions d'admissibilité seront contactés. — Only candidates who meet the eligibility requirements will be contacted.",
        "Pour remplir les conditions d'admissibilité, il faut obtenir au moins le NCLC 7 en français. — To meet the eligibility requirements, you need at least NCLC 7 in French.",
      ],
      "s'intégrer à la société d'accueil": [
        "Apprendre la langue est le premier pas pour s'intégrer à la société d'accueil. — Learning the language is the first step in integrating into the host society.",
        "Les associations de quartier aident les familles à s'intégrer à la société d'accueil. — Neighbourhood associations help families integrate into the host society.",
      ],
      "prendre racine": [
        "Après dix ans à Québec, nous avons vraiment pris racine ici. — After ten years in Québec City, we've really put down roots here.",
        "Il faut du temps pour prendre racine dans un nouveau pays. — It takes time to put down roots in a new country.",
      ],
      "tourner la page": [
        "En arrivant au Canada, j'ai voulu tourner la page et recommencer à zéro. — When I arrived in Canada, I wanted to turn the page and start from scratch.",
        "Après son licenciement, il lui a fallu du temps pour tourner la page. — After being laid off, it took him a while to move on.",
      ],
      "s'expatrier / entamer un parcours migratoire": [
        "Beaucoup de jeunes Français choisissent de s'expatrier au Québec pour quelques années. — Many young French people choose to move to Québec for a few years.",
        "Avant d'entamer un parcours migratoire, il est essentiel de bien se renseigner. — Before starting the migration process, it's essential to find out as much as you can.",
      ],
    },
    travail: {
      "le marché du travail": [
        "Les nouveaux arrivants ont parfois du mal à accéder au marché du travail canadien. — Newcomers sometimes struggle to get into the Canadian job market.",
        "Le marché du travail est très dynamique dans le secteur de la santé. — The job market is very buoyant in the health sector.",
      ],
      "le recrutement": [
        "Le recrutement d'infirmières à l'étranger s'est accéléré ces dernières années. — Recruitment of nurses from abroad has sped up in recent years.",
        "Les entreprises utilisent de plus en plus l'intelligence artificielle pour le recrutement. — Companies are using artificial intelligence more and more for recruitment.",
      ],
      "le télétravail": [
        "Le télétravail me permet de passer plus de temps avec mes enfants. — Working from home lets me spend more time with my children.",
        "Depuis la pandémie, le télétravail fait partie du quotidien de nombreux employés. — Since the pandemic, remote work has been part of many employees' daily life.",
      ],
      "la reconversion professionnelle": [
        "Après quinze ans dans la finance, elle a entamé une reconversion professionnelle dans l'enseignement. — After fifteen years in finance, she began a career change into teaching.",
        "La reconversion professionnelle est souvent nécessaire quand un diplôme étranger n'est pas reconnu. — A career change is often necessary when a foreign degree isn't recognised.",
      ],
      "l'équilibre vie professionnelle-vie privée": [
        "Les jeunes accordent de plus en plus d'importance à l'équilibre vie professionnelle-vie privée. — Young people care more and more about work-life balance.",
        "La semaine de quatre jours pourrait améliorer l'équilibre vie professionnelle-vie privée. — A four-day week could improve work-life balance.",
      ],
      "postuler à un poste": [
        "J'ai postulé à un poste d'analyste dans une banque de Montréal. — I applied for an analyst position at a bank in Montréal.",
        "Avant de postuler à un poste, adaptez votre CV aux normes canadiennes. — Before applying for a position, adapt your CV to Canadian standards.",
      ],
      "embaucher": [
        "L'entreprise prévoit d'embaucher vingt personnes cette année. — The company plans to hire twenty people this year.",
        "Elle a été embauchée deux semaines après son entrevue. — She was hired two weeks after her interview.",
      ],
      "licencier": [
        "L'usine a licencié la moitié de son personnel. — The factory laid off half its staff.",
        "Un employeur ne peut pas licencier un salarié sans motif valable. — An employer can't dismiss an employee without a valid reason.",
      ],
      "se reconvertir": [
        "Il s'est reconverti dans l'informatique après avoir perdu son emploi. — He retrained in IT after losing his job.",
        "De nombreux immigrants doivent se reconvertir pour trouver un emploi. — Many immigrants have to change careers to find work.",
      ],
      "négocier son salaire": [
        "Au Canada, il est tout à fait normal de négocier son salaire lors de l'embauche. — In Canada it's completely normal to negotiate your salary when you're hired.",
        "Elle n'a pas osé négocier son salaire et elle le regrette. — She didn't dare negotiate her salary and she regrets it.",
      ],
      "polyvalent(e)": [
        "Nous recherchons un employé polyvalent, capable de travailler en français et en anglais. — We're looking for a versatile employee who can work in French and English.",
        "Dans une petite entreprise, il faut être polyvalent. — In a small company, you have to be versatile.",
      ],
      "précaire": [
        "Beaucoup de jeunes enchaînent des emplois précaires avant de trouver un poste stable. — Many young people go from one insecure job to another before finding a stable position.",
        "Sans permis de travail, sa situation reste très précaire. — Without a work permit, his situation is still very precarious.",
      ],
      "le CDI": [
        "Après deux ans de contrats temporaires, j'ai enfin décroché un CDI. — After two years of temporary contracts, I finally landed a permanent contract.",
        "Un CDI facilite beaucoup la recherche d'un logement. — A permanent contract makes finding somewhere to live much easier.",
      ],
      "le CDD": [
        "On m'a proposé un CDD de six mois pour remplacer une employée en congé. — I was offered a six-month fixed-term contract to replace an employee on leave.",
        "Les CDD se multiplient chez les jeunes diplômés. — Fixed-term contracts are becoming more common among young graduates.",
      ],
      "le chômage": [
        "Le taux de chômage chez les immigrants récents est plus élevé que la moyenne. — The unemployment rate among recent immigrants is higher than average.",
        "Il est au chômage depuis trois mois et cherche activement un emploi. — He's been unemployed for three months and is actively looking for work.",
      ],
      "la promotion": [
        "Elle a obtenu une promotion au bout d'un an seulement. — She got a promotion after just one year.",
        "Cette promotion s'accompagne d'une hausse de salaire. — This promotion comes with a pay rise.",
      ],
      "faire ses preuves": [
        "Les nouveaux employés doivent faire leurs preuves pendant la période d'essai. — New employees have to prove themselves during the probation period.",
        "Cette méthode a déjà fait ses preuves dans plusieurs écoles. — This method has already proved its worth in several schools.",
      ],
      "monter en compétences": [
        "L'entreprise offre des formations pour aider ses employés à monter en compétences. — The company offers training to help its employees upskill.",
        "Je suis des cours en ligne pour monter en compétences en gestion de projet. — I'm taking online courses to build my project-management skills.",
      ],
      "décrocher un poste": [
        "Grâce à son stage, il a décroché un poste dans une grande entreprise. — Thanks to his internship, he landed a job at a large company.",
        "Pour décrocher un poste au Québec, il faut souvent un bon niveau de français. — To land a job in Québec, you often need good French.",
      ],
    },
    environnement: {
      "le réchauffement climatique": [
        "Le réchauffement climatique rend les feux de forêt plus fréquents au Canada. — Global warming is making forest fires more frequent in Canada.",
        "Les jeunes se mobilisent contre le réchauffement climatique. — Young people are mobilising against global warming.",
      ],
      "l'empreinte carbone": [
        "Les voyages en avion alourdissent considérablement notre empreinte carbone. — Air travel adds considerably to our carbon footprint.",
        "Manger local permet de diminuer l'empreinte carbone de son alimentation. — Eating local reduces the carbon footprint of your diet.",
      ],
      "les énergies renouvelables": [
        "Le Québec produit l'essentiel de son électricité à partir d'énergies renouvelables. — Québec produces most of its electricity from renewable energy.",
        "Il faut investir davantage dans les énergies renouvelables, comme l'éolien et le solaire. — We need to invest more in renewable energy, such as wind and solar.",
      ],
      "la biodiversité": [
        "L'étalement urbain menace la biodiversité autour des grandes villes. — Urban sprawl threatens biodiversity around the big cities.",
        "Protéger les zones humides est essentiel pour préserver la biodiversité. — Protecting wetlands is essential to preserve biodiversity.",
      ],
      "le développement durable": [
        "Le développement durable cherche à concilier croissance économique et protection de l'environnement. — Sustainable development tries to reconcile economic growth and environmental protection.",
        "Notre école enseigne le développement durable dès le primaire. — Our school teaches sustainable development from primary level.",
      ],
      "les gaz à effet de serre": [
        "Les transports sont la principale source de gaz à effet de serre au Québec. — Transport is the main source of greenhouse gases in Québec.",
        "Le Canada s'est engagé à réduire ses émissions de gaz à effet de serre. — Canada has committed to cutting its greenhouse gas emissions.",
      ],
      "polluer": [
        "Les voitures à essence polluent beaucoup plus que les véhicules électriques. — Petrol cars pollute much more than electric vehicles.",
        "Cette usine a été condamnée pour avoir pollué la rivière. — This factory was convicted of polluting the river.",
      ],
      "préserver": [
        "Il est de notre devoir de préserver les forêts pour les générations futures. — It's our duty to preserve the forests for future generations.",
        "Ce parc national a été créé pour préserver l'habitat du caribou. — This national park was created to preserve the caribou's habitat.",
      ],
      "réduire les émissions": [
        "Pour réduire les émissions, la ville mise sur le transport électrique. — To reduce emissions, the city is betting on electric transport.",
        "Le Canada vise à réduire ses émissions d'au moins 40 % d'ici 2030. — Canada aims to cut its emissions by at least 40% by 2030.",
      ],
      "sensibiliser": [
        "Cette campagne vise à sensibiliser les jeunes au gaspillage alimentaire. — This campaign aims to raise young people's awareness of food waste.",
        "Il faut sensibiliser la population aux dangers de la canicule. — The public needs to be made aware of the dangers of heatwaves.",
      ],
      "lutter contre": [
        "Le gouvernement a lancé un plan pour lutter contre le gaspillage alimentaire. — The government has launched a plan to fight food waste.",
        "Planter des arbres en ville aide à lutter contre les îlots de chaleur. — Planting trees in the city helps fight urban heat islands.",
      ],
      "durable": [
        "Il faut privilégier des solutions durables plutôt que des mesures temporaires. — We should favour lasting solutions rather than temporary measures.",
        "J'achète des vêtements plus durables pour moins consommer. — I buy more durable clothes so I consume less.",
      ],
      "polluant(e)": [
        "Les sacs en plastique sont très polluants pour les océans. — Plastic bags are very polluting for the oceans.",
        "La ville veut interdire les véhicules les plus polluants au centre-ville. — The city wants to ban the most polluting vehicles from downtown.",
      ],
      "alarmant(e)": [
        "Le rapport dresse un constat alarmant sur l'état des océans. — The report paints an alarming picture of the state of the oceans.",
        "Le nombre de feux de forêt cet été est alarmant. — The number of forest fires this summer is alarming.",
      ],
      "la sécheresse": [
        "La sécheresse a ruiné une grande partie des récoltes dans les Prairies. — The drought ruined much of the harvest on the Prairies.",
        "Avec le réchauffement climatique, les périodes de sécheresse se multiplient. — With global warming, droughts are becoming more frequent.",
      ],
      "la canicule": [
        "Pendant la canicule, la ville ouvre des centres de rafraîchissement. — During the heatwave, the city opens cooling centres.",
        "Les personnes âgées sont les plus vulnérables en période de canicule. — Older people are the most vulnerable during a heatwave.",
      ],
      "l'espèce menacée": [
        "Le béluga du Saint-Laurent est une espèce menacée. — The St. Lawrence beluga is an endangered species.",
        "La destruction des habitats est la première cause de disparition des espèces menacées. — Habitat destruction is the leading cause of endangered species disappearing.",
      ],
      "réduire son empreinte carbone": [
        "Prendre le train plutôt que l'avion est un bon moyen de réduire son empreinte carbone. — Taking the train instead of flying is a good way to reduce your carbon footprint.",
        "Chacun peut réduire son empreinte carbone en changeant ses habitudes au quotidien. — Everyone can reduce their carbon footprint by changing their daily habits.",
      ],
      "adopter un mode de vie durable": [
        "Adopter un mode de vie durable ne veut pas dire renoncer à son confort. — Adopting a sustainable lifestyle doesn't mean giving up your comfort.",
        "De plus en plus de familles adoptent un mode de vie durable en réduisant leurs déchets. — More and more families are adopting a sustainable lifestyle by cutting their waste.",
      ],
      "il est urgent d'agir": [
        "Face à la fonte des glaciers, il est urgent d'agir. — Faced with melting glaciers, action is urgently needed.",
        "Les scientifiques sont unanimes : il est urgent d'agir pour le climat. — Scientists are unanimous: we must act on climate now.",
      ],
      "prendre conscience de": [
        "Les feux de 2023 ont fait prendre conscience aux Canadiens de l'urgence climatique. — The 2023 fires made Canadians realise how urgent the climate crisis is.",
        "J'ai pris conscience de l'importance du recyclage en arrivant ici. — I became aware of how important recycling is when I arrived here.",
      ],
      "cela contribue au réchauffement climatique": [
        "Laisser tourner le moteur de sa voiture en hiver, cela contribue au réchauffement climatique. — Leaving your car engine running in winter contributes to global warming.",
        "On achète trop de vêtements, et cela contribue au réchauffement climatique. — We buy too many clothes, and that contributes to global warming.",
      ],
    },
    technologie: {
      "les réseaux sociaux": [
        "Les réseaux sociaux permettent aux immigrants de garder le contact avec leur famille. — Social media let immigrants keep in touch with their family.",
        "Beaucoup d'adolescents passent plusieurs heures par jour sur les réseaux sociaux. — Many teenagers spend several hours a day on social media.",
      ],
      "l'intelligence artificielle": [
        "L'intelligence artificielle transforme déjà le monde du travail. — Artificial intelligence is already transforming the world of work.",
        "Certains craignent que l'intelligence artificielle ne remplace de nombreux emplois. — Some fear artificial intelligence will replace many jobs.",
      ],
      "la vie privée": [
        "Les applications collectent nos données au détriment de notre vie privée. — Apps collect our data at the expense of our privacy.",
        "Il est important de respecter la vie privée de ses collègues. — It's important to respect your colleagues' privacy.",
      ],
      "la désinformation": [
        "La désinformation circule plus vite que les vraies nouvelles sur Internet. — Misinformation travels faster than real news online.",
        "L'école doit apprendre aux jeunes à repérer la désinformation. — Schools must teach young people to spot misinformation.",
      ],
      "l'algorithme": [
        "L'algorithme nous propose des vidéos qui confirment nos opinions. — The algorithm suggests videos that confirm our opinions.",
        "Les algorithmes des réseaux sociaux favorisent les contenus choquants. — Social media algorithms favour shocking content.",
      ],
      "partager du contenu": [
        "Avant de partager du contenu, il faut vérifier la source. — Before sharing content, you should check the source.",
        "Elle partage du contenu sur la vie à Montréal pour aider les nouveaux arrivants. — She shares content about life in Montréal to help newcomers.",
      ],
      "publier": [
        "J'ai publié des photos de notre voyage en Gaspésie. — I posted photos of our trip to the Gaspé.",
        "Le gouvernement publiera son rapport sur l'immigration le mois prochain. — The government will publish its immigration report next month.",
      ],
      "s'informer via": [
        "La plupart des jeunes s'informent via les réseaux sociaux plutôt que par la télévision. — Most young people get their news via social media rather than television.",
        "Je m'informe via des balados et des journaux en ligne. — I keep informed via podcasts and online newspapers.",
      ],
      "se déconnecter": [
        "Pendant les vacances, j'essaie de me déconnecter complètement. — On holiday I try to unplug completely.",
        "Le droit de se déconnecter après le travail devrait être protégé par la loi. — The right to disconnect after work should be protected by law.",
      ],
      "addictif / addictive": [
        "Les jeux vidéo peuvent devenir addictifs chez les adolescents. — Video games can become addictive for teenagers.",
        "Cette application est conçue pour être addictive. — This app is designed to be addictive.",
      ],
      "fiable / peu fiable": [
        "Il est essentiel de vérifier si une source est fiable. — It's essential to check whether a source is reliable.",
        "Les informations trouvées sur ce forum sont souvent peu fiables. — The information found on this forum is often unreliable.",
      ],
      "l'influenceur / l'influenceuse": [
        "Les influenceurs ont un impact important sur les habitudes de consommation des jeunes. — Influencers have a big impact on young people's spending habits.",
        "Cette influenceuse fait la promotion de produits qu'elle n'utilise pas. — This influencer promotes products she doesn't use.",
      ],
      "la donnée personnelle": [
        "Les entreprises doivent protéger les données personnelles de leurs clients. — Companies must protect their customers' personal data.",
        "Ne communiquez jamais vos données personnelles par courriel. — Never give out your personal data by email.",
      ],
      "passer trop de temps sur les écrans": [
        "Passer trop de temps sur les écrans nuit au sommeil des enfants. — Spending too much time on screens harms children's sleep.",
        "Depuis que je télétravaille, je passe trop de temps sur les écrans. — Since I started working from home, I've been spending too much time on screens.",
      ],
      "protéger sa vie privée": [
        "Pour protéger sa vie privée, il vaut mieux limiter ce qu'on publie en ligne. — To protect your privacy, it's better to limit what you post online.",
        "Il devient difficile de protéger sa vie privée à l'ère numérique. — It's getting hard to protect your privacy in the digital age.",
      ],
      "être accro à": [
        "Mon fils est accro à son téléphone : il ne le lâche jamais. — My son is hooked on his phone: he never puts it down.",
        "Je suis accro aux séries québécoises depuis mon arrivée. — I've been hooked on Québec TV series since I arrived.",
      ],
      "prendre du recul": [
        "Face à une information choquante, il faut savoir prendre du recul. — Faced with shocking news, you have to know how to step back.",
        "Ces vacances m'ont permis de prendre du recul sur ma carrière. — This holiday let me step back and look at my career.",
      ],
      "on observe une dépendance croissante aux écrans": [
        "Chez les enfants, on observe une dépendance croissante aux écrans. — Among children, there's a growing dependence on screens.",
        "Depuis la pandémie, on observe une dépendance croissante aux écrans chez les adultes aussi. — Since the pandemic, there's been a growing dependence on screens among adults too.",
      ],
    },
    societe: {
      "la diversité": [
        "La diversité culturelle de Toronto est l'une de ses grandes forces. — Toronto's cultural diversity is one of its great strengths.",
        "Les entreprises qui valorisent la diversité attirent plus de talents. — Companies that value diversity attract more talent.",
      ],
      "le vivre-ensemble": [
        "Les fêtes de quartier renforcent le vivre-ensemble. — Street parties strengthen social cohesion.",
        "L'école joue un rôle essentiel dans l'apprentissage du vivre-ensemble. — School plays a key role in learning to live together.",
      ],
      "le débat public": [
        "La question des loyers occupe une grande place dans le débat public. — The issue of rents takes up a lot of space in public debate.",
        "Les citoyens devraient participer davantage au débat public. — Citizens should take a greater part in public debate.",
      ],
      "l'égalité": [
        "L'égalité entre les femmes et les hommes est une valeur fondamentale au Québec. — Equality between women and men is a fundamental value in Québec.",
        "L'égalité des salaires n'est pas encore une réalité dans tous les secteurs. — Equal pay isn't yet a reality in every sector.",
      ],
      "la discrimination": [
        "Certains candidats sont victimes de discrimination à l'embauche à cause de leur nom. — Some candidates face hiring discrimination because of their name.",
        "La loi interdit toute discrimination fondée sur l'origine ou la religion. — The law prohibits any discrimination based on origin or religion.",
      ],
      "revendiquer": [
        "Les infirmières revendiquent de meilleures conditions de travail. — Nurses are demanding better working conditions.",
        "Les manifestants revendiquent le droit à un logement abordable. — The protesters are calling for the right to affordable housing.",
      ],
      "s'engager (civiquement)": [
        "Elle s'engage dans une association qui aide les réfugiés. — She's involved in an association that helps refugees.",
        "S'engager dans sa communauté est un excellent moyen de s'intégrer. — Getting involved in your community is a great way to fit in.",
      ],
      "manifester": [
        "Des milliers d'étudiants ont manifesté contre la hausse des frais de scolarité. — Thousands of students demonstrated against the rise in tuition fees.",
        "Il a manifesté son désaccord lors de la réunion. — He made his disagreement known at the meeting.",
      ],
      "engagé(e)": [
        "C'est une artiste engagée qui défend les droits des femmes. — She's a committed artist who defends women's rights.",
        "Les jeunes sont plus engagés pour l'environnement que leurs parents. — Young people are more committed to the environment than their parents.",
      ],
      "inclusif / inclusive": [
        "Notre entreprise veut créer un milieu de travail plus inclusif. — Our company wants to create a more inclusive workplace.",
        "Une société inclusive offre les mêmes chances à tous ses citoyens. — An inclusive society gives all its citizens the same opportunities.",
      ],
      "la manifestation": [
        "La manifestation pour le climat a réuni plus de 500 000 personnes à Montréal. — The climate demonstration drew over 500,000 people in Montréal.",
        "La police a encadré la manifestation sans incident. — The police supervised the protest without incident.",
      ],
      "l'opinion publique": [
        "L'opinion publique est divisée sur la question du télétravail. — Public opinion is divided on the question of remote work.",
        "Les réseaux sociaux influencent fortement l'opinion publique. — Social media strongly influence public opinion.",
      ],
      "prendre position sur un sujet": [
        "Dans la Tâche 3, il faut prendre position sur un sujet de société. — In Task 3, you have to take a stand on a social issue.",
        "Les entreprises hésitent à prendre position sur des sujets politiques. — Companies are reluctant to take a stand on political issues.",
      ],
      "défendre ses valeurs": [
        "Il est important de défendre ses valeurs, même quand elles ne sont pas populaires. — It's important to defend your values, even when they aren't popular.",
        "Cette association défend ses valeurs de solidarité depuis trente ans. — This association has upheld its values of solidarity for thirty years.",
      ],
      "favoriser le vivre-ensemble": [
        "Les activités interculturelles favorisent le vivre-ensemble dans les quartiers. — Intercultural activities foster social cohesion in neighbourhoods.",
        "La ville finance des projets pour favoriser le vivre-ensemble. — The city funds projects to foster living together.",
      ],
      "faire entendre sa voix": [
        "Voter, c'est le meilleur moyen de faire entendre sa voix. — Voting is the best way to make your voice heard.",
        "Les locataires se sont regroupés pour faire entendre leur voix. — The tenants joined forces to make their voices heard.",
      ],
      "avoir voix au chapitre": [
        "Les résidents permanents n'ont pas voix au chapitre lors des élections fédérales. — Permanent residents don't have a say in federal elections.",
        "Les employés veulent avoir voix au chapitre dans les décisions de l'entreprise. — Employees want to have a say in the company's decisions.",
      ],
      "la diversité constitue une richesse pour la société": [
        "Je suis convaincu que la diversité constitue une richesse pour la société canadienne. — I'm convinced that diversity is an asset for Canadian society.",
        "Comme le montre l'exemple de Montréal, la diversité constitue une richesse pour la société. — As Montréal shows, diversity is an asset for society.",
      ],
    },
    education: {
      "le cursus": [
        "Son cursus universitaire comprend un stage obligatoire en entreprise. — Her university course includes a compulsory work placement.",
        "J'ai suivi tout mon cursus en anglais, mais je travaille maintenant en français. — I did my whole degree in English, but now I work in French.",
      ],
      "la formation continue": [
        "La formation continue permet aux adultes de mettre leurs compétences à jour. — Continuing education lets adults keep their skills up to date.",
        "Mon employeur finance ma formation continue en comptabilité. — My employer pays for my continuing education in accounting.",
      ],
      "décrocher un diplôme": [
        "Elle a décroché son diplôme d'infirmière à l'Université de Montréal. — She earned her nursing degree at the Université de Montréal.",
        "Décrocher un diplôme canadien facilite l'accès à la résidence permanente. — Earning a Canadian degree makes it easier to get permanent residence.",
      ],
      "s'inscrire à un programme": [
        "Je me suis inscrit à un programme de francisation à temps partiel. — I enrolled in a part-time French program for immigrants.",
        "Pour vous inscrire à un programme universitaire, vous devez fournir vos relevés de notes. — To enrol in a university program, you must provide your transcripts.",
      ],
      "l'établissement scolaire": [
        "Chaque établissement scolaire doit avoir un plan d'urgence. — Every school must have an emergency plan.",
        "Les parents peuvent choisir l'établissement scolaire de leurs enfants. — Parents can choose their children's school.",
      ],
      "le décrochage scolaire": [
        "Le décrochage scolaire touche davantage les garçons que les filles. — Dropping out of school affects boys more than girls.",
        "Le mentorat est un moyen efficace de lutter contre le décrochage scolaire. — Mentoring is an effective way to fight school dropout.",
      ],
      "l'échec scolaire / la réussite scolaire": [
        "L'échec scolaire est souvent lié à des difficultés familiales. — Failing at school is often linked to family difficulties.",
        "L'aide aux devoirs favorise la réussite scolaire des enfants immigrants. — Homework help supports immigrant children's success at school.",
        "Le sommeil joue un rôle clé dans la réussite scolaire. — Sleep plays a key role in academic success.",
      ],
      "les frais de scolarité": [
        "Les frais de scolarité sont beaucoup plus élevés pour les étudiants étrangers. — Tuition fees are much higher for international students.",
        "Au Québec, les frais de scolarité restent parmi les plus bas au Canada. — In Québec, tuition fees are still among the lowest in Canada.",
      ],
      "l'égalité des chances": [
        "L'école publique doit garantir l'égalité des chances pour tous les enfants. — Public schools must guarantee equal opportunity for every child.",
        "Les bourses d'études contribuent à l'égalité des chances. — Scholarships contribute to equal opportunity.",
      ],
      "faire des études supérieures": [
        "De plus en plus de jeunes viennent au Canada pour faire des études supérieures. — More and more young people come to Canada for higher education.",
        "Faire des études supérieures coûte cher, mais c'est un investissement. — Going on to higher education is expensive, but it's an investment.",
      ],
      "l'enseignement à distance": [
        "L'enseignement à distance permet aux étudiants des régions éloignées de suivre des cours. — Distance learning lets students in remote regions take courses.",
        "Pendant la pandémie, l'enseignement à distance s'est généralisé. — During the pandemic, distance learning became widespread.",
      ],
      "faire reconnaître ses diplômes": [
        "Faire reconnaître ses diplômes peut prendre plus d'un an pour les médecins étrangers. — Getting their qualifications recognised can take foreign doctors more than a year.",
      ],
      "se former": [
        "Il est important de se former tout au long de sa carrière. — It's important to keep training throughout your career.",
        "Je me forme en ligne pour devenir développeuse web. — I'm training online to become a web developer.",
      ],
      "l'orientation professionnelle": [
        "Un conseiller en orientation professionnelle m'a aidé à choisir ma formation. — A careers adviser helped me choose my training.",
        "L'orientation professionnelle devrait commencer dès le secondaire. — Career guidance should start in secondary school.",
      ],
      "acquérir des compétences": [
        "Le bénévolat permet d'acquérir des compétences utiles sur le marché du travail. — Volunteering lets you gain skills that are useful on the job market.",
        "Ce stage m'a permis d'acquérir des compétences en gestion d'équipe. — This internship let me acquire team-management skills.",
      ],
    },
    sante: {
      "le système de santé": [
        "Le système de santé canadien est financé par les impôts. — The Canadian health system is funded by taxes.",
        "Le vieillissement de la population met le système de santé sous pression. — The ageing population is putting the health system under pressure.",
      ],
      "la prévention": [
        "Investir dans la prévention coûte moins cher que soigner les maladies. — Investing in prevention costs less than treating illness.",
        "Les campagnes de prévention ont réduit le nombre de fumeurs. — Prevention campaigns have reduced the number of smokers.",
      ],
      "le médecin de famille": [
        "Au Québec, des centaines de milliers de personnes attendent un médecin de famille. — In Québec, hundreds of thousands of people are waiting for a family doctor.",
        "Mon médecin de famille m'a orienté vers un spécialiste. — My family doctor referred me to a specialist.",
      ],
      "la liste d'attente": [
        "Je suis sur la liste d'attente pour une opération du genou depuis huit mois. — I've been on the waiting list for knee surgery for eight months.",
        "Les listes d'attente pour les garderies subventionnées sont très longues. — The waiting lists for subsidised daycare are very long.",
      ],
      "les urgences": [
        "Aux urgences, il faut parfois attendre plus de dix heures. — In the emergency room you sometimes have to wait more than ten hours.",
        "Il s'est cassé le poignet et ils l'ont emmené aux urgences. — He broke his wrist and they took him to the emergency room.",
      ],
      "prendre rendez-vous chez le médecin": [
        "Il est de plus en plus difficile de prendre rendez-vous chez le médecin rapidement. — It's getting harder and harder to see a doctor quickly.",
        "J'ai pris rendez-vous chez le médecin pour un bilan de santé. — I've booked a doctor's appointment for a check-up.",
      ],
      "l'assurance maladie": [
        "Dans certaines provinces, les nouveaux résidents attendent trois mois avant d'être couverts par l'assurance maladie. — In some provinces, new residents wait three months before they're covered by health insurance.",
        "N'oubliez pas votre carte d'assurance maladie lors de votre rendez-vous. — Don't forget your health insurance card for your appointment.",
      ],
      "la santé mentale": [
        "L'isolement peut avoir des effets graves sur la santé mentale des nouveaux arrivants. — Isolation can seriously affect newcomers' mental health.",
        "Les entreprises commencent à prendre au sérieux la santé mentale de leurs employés. — Companies are starting to take their employees' mental health seriously.",
      ],
      "mener une vie saine": [
        "Pour mener une vie saine, il faut bien dormir et bouger régulièrement. — To lead a healthy life, you need to sleep well and move regularly.",
        "Il est plus facile de mener une vie saine quand on habite près d'un parc. — It's easier to lead a healthy life when you live near a park.",
      ],
      "l'épuisement professionnel": [
        "Le nombre de cas d'épuisement professionnel a augmenté chez les enseignants. — The number of burnout cases has risen among teachers.",
        "Après un épuisement professionnel, elle a dû arrêter de travailler pendant six mois. — After burning out, she had to stop working for six months.",
      ],
      "la sédentarité": [
        "La sédentarité augmente le risque de maladies cardiaques. — A sedentary lifestyle raises the risk of heart disease.",
        "Le télétravail a renforcé la sédentarité de nombreux employés. — Remote work has made many employees even less active.",
      ],
      "se soigner": [
        "Dans les régions éloignées, il est parfois difficile de se soigner. — In remote regions it's sometimes hard to get medical care.",
        "Il refuse de se soigner et continue de travailler malgré sa grippe. — He won't look after himself and keeps working despite his flu.",
      ],
      "l'accès aux soins": [
        "Améliorer l'accès aux soins devrait être la priorité du gouvernement. — Improving access to healthcare should be the government's priority.",
      ],
      "adopter de saines habitudes de vie": [
        "L'école encourage les enfants à adopter de saines habitudes de vie. — School encourages children to adopt healthy lifestyle habits.",
        "Adopter de saines habitudes de vie permet de prévenir de nombreuses maladies. — Adopting healthy habits helps prevent many illnesses.",
      ],
    },
    gouvernement: {
      "les pouvoirs publics": [
        "Les pouvoirs publics doivent agir pour faire baisser le prix des loyers. — The public authorities must act to bring rents down.",
        "Face à la crise, les pouvoirs publics ont débloqué des fonds d'urgence. — In response to the crisis, the authorities released emergency funds.",
      ],
      "la politique publique": [
        "Cette politique publique vise à attirer des immigrants en région. — This public policy aims to attract immigrants outside the big cities.",
        "Les politiques publiques en matière de logement ont souvent manqué d'ambition. — Public housing policies have often lacked ambition.",
      ],
      "légiférer": [
        "Le gouvernement a décidé de légiférer pour encadrer l'intelligence artificielle. — The government decided to legislate to regulate artificial intelligence.",
        "Il est urgent de légiférer sur la location à court terme. — Legislation on short-term rentals is urgently needed.",
      ],
      "le gouvernement fédéral / provincial": [
        "Le gouvernement fédéral est responsable de l'immigration et de la citoyenneté. — The federal government is responsible for immigration and citizenship.",
        "L'éducation et la santé relèvent du gouvernement provincial. — Education and health are the provincial government's responsibility.",
        "Le Québec sélectionne lui-même une partie de ses immigrants, avec l'accord du gouvernement fédéral. — Québec selects some of its immigrants itself, with the federal government's agreement.",
      ],
      "adopter une loi": [
        "L'Assemblée nationale a adopté une loi pour protéger la langue française. — The National Assembly passed a law to protect the French language.",
        "Le Parlement devrait adopter une loi sur le droit à la déconnexion. — Parliament should pass a law on the right to disconnect.",
      ],
      "mettre en place une réforme": [
        "Le ministère a mis en place une réforme du système d'immigration. — The ministry has implemented a reform of the immigration system.",
        "Avant de mettre en place une réforme, il faudrait consulter les citoyens. — Before implementing a reform, citizens should be consulted.",
      ],
      "les élus": [
        "Les élus municipaux ont voté une hausse des taxes foncières. — The city councillors voted for a property tax increase.",
        "Les citoyens attendent de leurs élus qu'ils tiennent leurs promesses. — Citizens expect their elected officials to keep their promises.",
      ],
      "le droit de vote": [
        "Le droit de vote est réservé aux citoyens canadiens. — The right to vote is reserved for Canadian citizens.",
        "Les femmes ont obtenu le droit de vote au Québec en 1940. — Women won the right to vote in Québec in 1940.",
      ],
      "la fiscalité": [
        "La fiscalité des entreprises est plus avantageuse dans certaines provinces. — Business taxation is more favourable in some provinces.",
        "Une réforme de la fiscalité pourrait réduire les inégalités. — A tax reform could reduce inequality.",
      ],
      "les impôts": [
        "Au Québec, on remplit deux déclarations d'impôts : une fédérale et une provinciale. — In Québec you file two tax returns: a federal one and a provincial one.",
        "Les impôts financent les services publics comme la santé et l'éducation. — Taxes fund public services such as health and education.",
      ],
      "les services publics": [
        "Les services publics sont disponibles en français et en anglais. — Public services are available in French and English.",
        "Le manque de personnel menace la qualité des services publics. — Staff shortages threaten the quality of public services.",
      ],
      "l'intérêt général": [
        "Les élus doivent agir dans l'intérêt général, pas dans leur intérêt personnel. — Elected officials must act in the public interest, not their own.",
        "Ce projet de route est-il vraiment dans l'intérêt général ? — Is this road project really in the public interest?",
      ],
      "prendre des mesures pour": [
        "La ville a pris des mesures pour réduire la circulation au centre-ville. — The city has taken measures to reduce traffic downtown.",
        "Le gouvernement doit prendre des mesures pour aider les familles à se loger. — The government must take steps to help families find housing.",
      ],
      "la démocratie participative": [
        "Le budget participatif est un bel exemple de démocratie participative. — The participatory budget is a good example of participatory democracy.",
        "La démocratie participative permet aux habitants de proposer des projets pour leur quartier. — Participatory democracy lets residents propose projects for their neighbourhood.",
      ],
      "les pouvoirs publics devraient intervenir": [
        "Selon moi, les pouvoirs publics devraient intervenir pour limiter la hausse des loyers. — In my view, the authorities should step in to limit rent increases.",
        "Quand le marché ne suffit pas, les pouvoirs publics devraient intervenir. — When the market isn't enough, the public authorities should intervene.",
      ],
    },
    economie: {
      "l'inflation": [
        "L'inflation a fortement réduit le pouvoir d'achat des ménages. — Inflation has greatly reduced household purchasing power.",
        "La Banque du Canada a relevé ses taux pour freiner l'inflation. — The Bank of Canada raised its rates to curb inflation.",
      ],
      "le pouvoir d'achat": [
        "Avec la hausse des loyers, le pouvoir d'achat des jeunes a beaucoup diminué. — With rising rents, young people's purchasing power has fallen sharply.",
        "Les syndicats réclament des hausses de salaire pour protéger le pouvoir d'achat. — Unions are demanding pay rises to protect purchasing power.",
      ],
      "le coût de la vie": [
        "Le coût de la vie est beaucoup plus élevé à Vancouver qu'à Québec. — The cost of living is much higher in Vancouver than in Québec City.",
        "La hausse du coût de la vie pousse les familles à changer leurs habitudes. — The rising cost of living is pushing families to change their habits.",
      ],
      "la hausse des prix": [
        "La hausse des prix de l'épicerie inquiète les consommateurs. — Rising grocery prices worry consumers.",
        "Face à la hausse des prix, beaucoup achètent des produits en solde. — Faced with rising prices, many people buy discounted products.",
      ],
      "le salaire minimum": [
        "Le salaire minimum augmente chaque année le 1er mai au Québec. — The minimum wage goes up every year on 1 May in Québec.",
        "Avec le salaire minimum, il est presque impossible de payer un loyer à Montréal. — On the minimum wage, it's almost impossible to pay rent in Montréal.",
      ],
      "la pénurie de main-d'œuvre": [
        "Pour faire face à la pénurie de main-d'œuvre, les entreprises recrutent à l'étranger. — To deal with the labour shortage, companies are recruiting abroad.",
      ],
      "le taux de chômage": [
        "Le taux de chômage a légèrement baissé au dernier trimestre. — The unemployment rate fell slightly last quarter.",
        "Le taux de chômage des jeunes reste plus élevé que celui des adultes. — The youth unemployment rate is still higher than that of adults.",
      ],
      "la mondialisation": [
        "La mondialisation a permis de baisser le prix de nombreux produits. — Globalisation has brought down the price of many products.",
        "Certains accusent la mondialisation d'avoir détruit des emplois industriels. — Some blame globalisation for destroying industrial jobs.",
      ],
      "les inégalités sociales": [
        "Les inégalités sociales se sont creusées pendant la pandémie. — Social inequalities widened during the pandemic.",
        "L'éducation est le meilleur moyen de réduire les inégalités sociales. — Education is the best way to reduce social inequalities.",
      ],
      "faire des économies": [
        "Nous faisons des économies en cuisinant à la maison. — We save money by cooking at home.",
        "Prendre le transport en commun permet de faire des économies importantes. — Taking public transit lets you save a lot of money.",
      ],
      "s'endetter": [
        "Beaucoup d'étudiants s'endettent pour payer leurs études. — Many students go into debt to pay for their studies.",
        "Il vaut mieux éviter de s'endetter avec une carte de crédit. — It's best to avoid running up debt on a credit card.",
      ],
      "relancer l'économie": [
        "Le gouvernement a lancé de grands chantiers pour relancer l'économie. — The government launched major projects to boost the economy.",
        "Baisser les impôts suffit-il à relancer l'économie ? — Is cutting taxes enough to boost the economy?",
      ],
      "les PME": [
        "Les PME créent la majorité des emplois au Canada. — Small and medium-sized businesses create most jobs in Canada.",
        "Les PME ont du mal à recruter à cause de la pénurie de main-d'œuvre. — SMEs are struggling to recruit because of the labour shortage.",
      ],
      "la flambée des prix": [
        "La flambée des prix de l'immobilier empêche les jeunes d'acheter. — Soaring property prices stop young people from buying.",
        "La flambée des prix de l'essence a relancé le débat sur les transports en commun. — The surge in petrol prices has revived the debate on public transit.",
      ],
    },
    logement: {
      "le logement": [
        "Trouver un logement est souvent la première difficulté des nouveaux arrivants. — Finding somewhere to live is often newcomers' first difficulty.",
        "Le logement représente la plus grosse dépense des ménages. — Housing is households' biggest expense.",
      ],
      "le loyer": [
        "Le loyer d'un trois et demie à Montréal dépasse souvent 1 500 $. — The rent on a one-bedroom in Montréal often tops $1,500.",
        "Le loyer est payable le premier jour de chaque mois. — The rent is due on the first day of each month.",
      ],
      "la crise du logement": [
        "La crise du logement touche désormais aussi les petites villes. — The housing crisis now affects small towns too.",
        "Pour sortir de la crise du logement, il faut construire beaucoup plus. — To get out of the housing crisis, we need to build much more.",
      ],
      "le propriétaire / le locataire": [
        "Le propriétaire doit faire les réparations nécessaires dans le logement. — The landlord has to carry out the necessary repairs in the home.",
        "Le locataire a le droit de refuser une hausse de loyer abusive. — The tenant has the right to refuse an unreasonable rent increase.",
        "En cas de conflit entre propriétaire et locataire, on peut s'adresser au Tribunal administratif du logement. — In a dispute between landlord and tenant, you can go to the housing tribunal.",
      ],
      "signer un bail": [
        "Avant de signer un bail, lisez attentivement toutes les clauses. — Before signing a lease, read all the clauses carefully.",
        "Au Québec, on signe généralement un bail d'un an qui commence le 1er juillet. — In Québec you usually sign a one-year lease starting on 1 July.",
      ],
      "charges comprises": [
        "L'appartement est à 1 200 $ par mois, charges comprises. — The flat is $1,200 a month, utilities included.",
        "Est-ce que le loyer est charges comprises ou est-ce que je paie l'électricité ? — Are utilities included in the rent, or do I pay the electricity?",
      ],
      "déménager": [
        "Au Québec, beaucoup de gens déménagent le 1er juillet. — In Québec, lots of people move house on 1 July.",
        "Nous avons déménagé en banlieue pour avoir plus d'espace. — We moved to the suburbs to have more space.",
      ],
      "la colocation": [
        "La colocation permet aux étudiants de payer un loyer moins élevé. — Flat-sharing lets students pay lower rent.",
        "Je vis en colocation avec deux collègues depuis mon arrivée. — I've been sharing a flat with two colleagues since I arrived.",
      ],
      "le logement social": [
        "Les listes d'attente pour un logement social peuvent durer plusieurs années. — Waiting lists for social housing can last several years.",
        "La ville s'est engagée à construire mille logements sociaux. — The city has committed to building a thousand social housing units.",
      ],
      "l'accès à la propriété": [
        "L'accès à la propriété devient un rêve inaccessible pour beaucoup de jeunes. — Home ownership is becoming an impossible dream for many young people.",
        "Ce programme facilite l'accès à la propriété pour les premiers acheteurs. — This program makes home ownership easier for first-time buyers.",
      ],
      "la hausse des loyers": [
        "La hausse des loyers oblige de nombreuses familles à quitter leur quartier. — Rising rents are forcing many families to leave their neighbourhood.",
        "Les locataires se mobilisent contre la hausse des loyers. — Tenants are mobilising against rent increases.",
      ],
      "se loger": [
        "Il est de plus en plus difficile de se loger dans les grandes villes. — It's harder and harder to find a place to live in the big cities.",
        "Les étudiants étrangers ont souvent du mal à se loger à la rentrée. — International students often struggle to find housing at the start of term.",
      ],
      "l'étalement urbain": [
        "L'étalement urbain augmente la dépendance à la voiture. — Urban sprawl increases dependence on the car.",
        "Pour limiter l'étalement urbain, la ville encourage la densification. — To limit urban sprawl, the city encourages higher density.",
      ],
      "la gentrification": [
        "La gentrification du quartier a fait exploser les loyers. — The neighbourhood's gentrification has sent rents soaring.",
        "La gentrification chasse souvent les habitants les plus modestes. — Gentrification often drives out the poorest residents.",
      ],
      "le marché locatif est saturé": [
        "Le marché locatif est saturé : il y a vingt candidats pour chaque appartement. — The rental market is saturated: there are twenty applicants for every flat.",
      ],
    },
    transports: {
      "les transports en commun": [
        "À Montréal, les transports en commun sont pratiques, mais ils sont moins fréquents en banlieue. — In Montréal, public transit is convenient, but it runs less often in the suburbs.",
        "Si les transports en commun étaient gratuits, beaucoup de gens laisseraient leur voiture. — If public transit were free, many people would leave their cars at home.",
      ],
      "la mobilité durable": [
        "La ville encourage la mobilité durable avec des vélos en libre-service. — The city encourages sustainable mobility with bike-share schemes.",
        "Le covoiturage est une solution de mobilité durable pour les régions. — Carpooling is a sustainable mobility solution for rural areas.",
      ],
    },
    famille: {
      "la cellule familiale": [
        "La cellule familiale a beaucoup changé depuis cinquante ans. — The family unit has changed a great deal in fifty years.",
        "Pour les immigrants, la cellule familiale est souvent le premier soutien. — For immigrants, the family is often the first source of support.",
      ],
      "la garde des enfants": [
        "Le coût de la garde des enfants pèse lourd dans le budget des jeunes parents. — The cost of childcare weighs heavily on young parents' budgets.",
        "Après le divorce, ils ont obtenu la garde partagée des enfants. — After the divorce, they were given joint custody of the children.",
      ],
      "la famille monoparentale": [
        "Les familles monoparentales sont plus touchées par la pauvreté. — Single-parent families are harder hit by poverty.",
        "Elle élève seule ses deux enfants dans une famille monoparentale. — She's raising her two children alone as a single parent.",
      ],
      "la famille recomposée": [
        "Dans notre famille recomposée, il y a cinq enfants. — In our blended family there are five children.",
        "Les familles recomposées sont de plus en plus nombreuses au Canada. — Blended families are more and more common in Canada.",
      ],
      "les liens familiaux": [
        "La distance rend parfois difficile le maintien des liens familiaux. — Distance sometimes makes it hard to keep family ties alive.",
        "Grâce aux appels vidéo, je garde des liens familiaux forts malgré l'éloignement. — Thanks to video calls, I keep strong family ties despite the distance.",
      ],
      "concilier travail et vie de famille": [
        "Le télétravail aide de nombreux parents à concilier travail et vie de famille. — Remote work helps many parents balance work and family life.",
        "Il est difficile de concilier travail et vie de famille avec des horaires de nuit. — It's hard to balance work and family life on night shifts.",
      ],
      "le congé parental": [
        "Au Québec, les pères ont droit à un congé parental réservé. — In Québec, fathers are entitled to a dedicated parental leave.",
        "Elle a prolongé son congé parental pour rester avec son bébé. — She extended her parental leave to stay with her baby.",
      ],
      "élever ses enfants": [
        "Nous avons choisi le Canada pour élever nos enfants dans un environnement sûr. — We chose Canada to raise our children in a safe environment.",
        "Élever ses enfants dans deux langues demande beaucoup de constance. — Raising your children in two languages takes a lot of consistency.",
      ],
      "la natalité": [
        "La baisse de la natalité inquiète les économistes. — The falling birth rate worries economists.",
        "Les aides aux familles visent à relancer la natalité. — Family benefits aim to boost the birth rate.",
      ],
      "le vieillissement de la population": [
        "Le vieillissement de la population explique en partie la pénurie de main-d'œuvre. — Population ageing partly explains the labour shortage.",
        "L'immigration permet de compenser le vieillissement de la population. — Immigration helps offset population ageing.",
      ],
      "s'occuper de ses parents âgés": [
        "Beaucoup de femmes réduisent leurs heures de travail pour s'occuper de leurs parents âgés. — Many women cut their working hours to care for their elderly parents.",
        "Vivre loin rend difficile de s'occuper de ses parents âgés. — Living far away makes it hard to look after your elderly parents.",
      ],
      "le fossé des générations": [
        "Les réseaux sociaux ont creusé le fossé des générations. — Social media have widened the generation gap.",
        "Le fossé des générations se voit surtout dans la façon de s'informer. — The generation gap shows most in the way people get their news.",
      ],
      "transmettre des valeurs": [
        "Les parents immigrants veulent transmettre des valeurs et une langue à leurs enfants. — Immigrant parents want to pass on values and a language to their children.",
        "L'école aussi a pour rôle de transmettre des valeurs comme le respect. — School also has a role in passing on values such as respect.",
      ],
      "la conciliation travail-famille": [
        "Les employeurs qui favorisent la conciliation travail-famille gardent leurs employés plus longtemps. — Employers who support work-family balance keep their employees longer.",
      ],
    },
    crime: {
      "la sécurité publique": [
        "La sécurité publique est une priorité pour les habitants du quartier. — Public safety is a priority for the neighbourhood's residents.",
        "La ville a augmenté le budget consacré à la sécurité publique. — The city has increased the budget for public safety.",
      ],
      "la criminalité": [
        "La criminalité a baissé dans le centre-ville depuis l'ouverture du nouveau poste de police. — Crime has fallen downtown since the new police station opened.",
        "La pauvreté et l'exclusion favorisent la criminalité chez les jeunes. — Poverty and exclusion encourage crime among young people.",
      ],
    },
    science: {
      "la recherche": [
        "Le Canada investit beaucoup dans la recherche sur l'intelligence artificielle. — Canada invests heavily in artificial intelligence research.",
        "Elle fait de la recherche en biologie à l'Université Laval. — She does research in biology at Université Laval.",
      ],
      "l'innovation": [
        "L'innovation technologique crée de nouveaux métiers chaque année. — Technological innovation creates new jobs every year.",
        "Montréal est reconnue comme un pôle d'innovation en jeux vidéo. — Montréal is recognised as an innovation hub for video games.",
      ],
      "expérimenter": [
        "Plusieurs entreprises expérimentent la semaine de quatre jours. — Several companies are trying out the four-day week.",
        "Les élèves apprennent mieux quand ils peuvent expérimenter par eux-mêmes. — Pupils learn better when they can experiment for themselves.",
      ],
    },
    tourisme: {
      "le tourisme durable": [
        "Le tourisme durable cherche à protéger les paysages et les communautés locales. — Sustainable tourism tries to protect the landscapes and local communities.",
        "Choisir le train plutôt que l'avion, c'est une façon de pratiquer le tourisme durable. — Choosing the train over the plane is one way of practising sustainable tourism.",
      ],
      "la surfréquentation": [
        "La surfréquentation abîme les sentiers des parcs nationaux. — Overtourism is damaging the trails in national parks.",
        "Pour lutter contre la surfréquentation, le parc limite le nombre de visiteurs par jour. — To fight overtourism, the park limits the number of visitors per day.",
      ],
      "le dépaysement": [
        "En arrivant à Montréal en plein hiver, le dépaysement a été total. — Arriving in Montréal in the middle of winter, the change of scenery was complete.",
        "Pas besoin d'aller loin pour trouver le dépaysement : la Gaspésie suffit. — You don't need to go far for a change of scene: the Gaspé is enough.",
      ],
    },
    consommation: {
      "la surconsommation": [
        "La surconsommation de vêtements a un coût écologique énorme. — Overconsumption of clothing has a huge environmental cost.",
        "Le Vendredi fou encourage la surconsommation. — Black Friday encourages overconsumption.",
      ],
      "l'achat responsable": [
        "L'achat responsable consiste à privilégier des produits locaux et durables. — Responsible purchasing means favouring local, durable products.",
        "De plus en plus de consommateurs pratiquent l'achat responsable. — More and more consumers are buying responsibly.",
      ],
    },
    pieges: {
      "C'est un bon médecin.": [
        "C'est une ingénieure brillante, mais elle n'a pas encore son permis d'exercice ici. — She's a brilliant engineer, but she doesn't have her licence to practise here yet.",
        "C'est un excellent professeur : ses cours sont toujours clairs. — He's an excellent teacher: his classes are always clear.",
      ],
      "Il est médecin.": [
        "Elle est infirmière dans un hôpital de Laval. — She's a nurse at a hospital in Laval.",
        "Mon frère est avocat ; c'est un avocat très connu à Québec. — My brother is a lawyer; he's a very well-known lawyer in Québec City.",
      ],
      "à Montréal · en France · au Canada · aux États-Unis": [
        "J'ai vécu en France, puis au Canada, et maintenant j'habite à Montréal. — I lived in France, then in Canada, and now I live in Montréal.",
        "Elle travaille au Québec, mais sa famille vit aux États-Unis. — She works in Québec, but her family lives in the US.",
      ],
      "J'ai seulement deux minutes.": [
        "Je n'ai que deux minutes, alors je vais faire vite. — I only have two minutes, so I'll be quick.",
        "Il a seulement vingt ans, mais il parle déjà quatre langues. — He's only twenty, but he already speaks four languages.",
      ],
      "Il est seul ce soir.": [
        "Elle est seule ce soir, alors je l'ai invitée à dîner. — She's on her own tonight, so I've invited her to dinner.",
        "Je ne suis pas le seul à penser que les loyers sont trop élevés. — I'm not the only one who thinks rents are too high.",
      ],
      "tout le monde, sauf lui": [
        "Tout le monde est venu à la réunion, sauf lui. — Everyone came to the meeting except him.",
        "Le magasin est ouvert tous les jours, sauf le dimanche. — The shop is open every day except Sunday.",
      ],
      "Je suis sûr de moi.": [
        "Pendant l'entrevue, il faut paraître sûr de soi. — During the interview, you have to come across as self-confident.",
        "Elle est sûre d'elle quand elle parle anglais, moins en français. — She's confident when she speaks English, less so in French.",
      ],
      "le tour du monde": [
        "Après leurs études, ils ont fait le tour du monde en un an. — After their studies, they travelled round the world in a year.",
        "Le guide nous a fait faire le tour du Vieux-Québec à pied. — The guide took us on a walking tour of Old Québec.",
      ],
      "la tour Eiffel": [
        "De la tour Eiffel, on voit tout Paris. — From the Eiffel Tower you can see the whole of Paris.",
        "Ils habitent dans une tour de trente étages au centre-ville. — They live in a thirty-storey tower block downtown.",
      ],
      "s'amuser / passer un bon moment": [
        "Nous avons passé un très bon moment au Festival de jazz. — We had a really good time at the Jazz Festival.",
        "Les enfants se sont bien amusés à la cabane à sucre. — The children had great fun at the sugar shack.",
        "Amuse-toi bien à la fête ce soir ! — Have a good time at the party tonight!",
      ],
      "J'aime les chats.": [
        "J'adore le hockey, mais je déteste le froid. — I love hockey, but I hate the cold.",
        "Les Québécois aiment beaucoup les festivals d'été. — Quebecers really love summer festivals.",
      ],
      "J'ai des chats.": [
        "Nous avons des amis à Ottawa et de la famille à Toronto. — We have friends in Ottawa and family in Toronto.",
        "J'achète des légumes au marché, mais je n'achète pas de viande. — I buy vegetables at the market, but I don't buy meat.",
      ],
      "leur maison / leurs enfants": [
        "Mes voisins ont vendu leur maison pour se rapprocher de leurs enfants. — My neighbours sold their house to move closer to their children.",
        "Les parents doivent inscrire leurs enfants à l'école avant le mois de mars. — Parents must enrol their children at school before March.",
        "Je leur ai téléphoné hier. — I phoned them yesterday.",
      ],
      "ses enfants": [
        "Elle emmène ses enfants au parc chaque samedi. — She takes her children to the park every Saturday.",
        "Mon collègue parle souvent de ses enfants et de sa femme. — My colleague often talks about his children and his wife.",
      ],
      "J'habite ici depuis trois ans.": [
        "J'apprends le français depuis deux ans. — I've been learning French for two years.",
        "Depuis que je vis à Montréal, je prends le métro tous les jours. — Since I've been living in Montréal, I take the metro every day.",
      ],
      "Je suis arrivé il y a deux ans.": [
        "J'ai obtenu ma résidence permanente il y a six mois. — I got my permanent residence six months ago.",
        "Il y a dix ans, ce quartier était beaucoup plus calme. — Ten years ago, this neighbourhood was much quieter.",
      ],
      "Si !": [
        "« Tu n'as pas reçu mon courriel ? » « Si, je l'ai lu ce matin. » — \"Didn't you get my email?\" \"Yes, I read it this morning.\"",
        "« Vous ne parlez pas français ? » « Si, un peu ! » — \"You don't speak French?\" \"Yes I do, a little!\"",
      ],
      "Je connais Montréal.": [
        "Je connais bien le quartier, j'y ai habité pendant deux ans. — I know the neighbourhood well; I lived there for two years.",
        "Est-ce que tu connais quelqu'un qui loue un appartement ? — Do you know anyone who's renting out a flat?",
      ],
      "Je sais nager.": [
        "Je sais conduire, mais je n'ai pas encore de permis canadien. — I can drive, but I don't have a Canadian licence yet.",
        "Est-ce que tu sais où se trouve le bureau de Service Canada ? — Do you know where the Service Canada office is?",
      ],
      "C'est facile à comprendre.": [
        "Ce formulaire est difficile à remplir sans aide. — This form is hard to fill in without help.",
        "C'est un texte agréable à lire. — It's a pleasant text to read.",
      ],
      "Il est important de lire le contrat.": [
        "Il est difficile de trouver un logement en juillet. — It's hard to find housing in July.",
        "Il est essentiel de bien préparer son entrevue d'embauche. — It's essential to prepare your job interview well.",
      ],
      "amener quelqu'un / apporter quelque chose": [
        "Chacun apporte un plat au repas de quartier. — Everyone brings a dish to the neighbourhood potluck.",
        "Tu peux amener tes enfants, il y aura des jeux pour eux. — You can bring your children; there'll be games for them.",
        "N'oubliez pas d'apporter une pièce d'identité. — Don't forget to bring a piece of ID.",
      ],
      "J'ai participé au festival.": [
        "J'ai participé à une formation sur la recherche d'emploi. — I took part in a job-search workshop.",
        "Tous les employés ont participé à la réunion. — All the employees took part in the meeting.",
      ],
      "Je viens te voir demain.": [
        "Mes parents viennent nous rendre visite cet été. — My parents are coming to visit us this summer.",
        "Je vais chercher les enfants à l'école à 16 h. — I'm going to pick the children up from school at 4 pm.",
      ],
      "plus de billets": [
        "Il faut plus de logements abordables en ville. — We need more affordable housing in the city.",
        "Il n'y a plus de places dans le cours du soir. — There are no more places left in the evening class.",
      ],
      "chercher sur Internet": [
        "J'ai trouvé mon appartement sur Internet. — I found my flat online.",
        "Avant de partir, j'ai cherché des informations sur Internet. — Before leaving, I looked up information online.",
      ],
      "la semaine dernière · le mois dernier": [
        "Je suis allé chez le médecin la semaine dernière. — I went to the doctor last week.",
        "Le mois dernier, mon loyer a augmenté de 5 %. — Last month my rent went up by 5%.",
        "C'est la dernière semaine avant les vacances. — It's the last week before the holidays.",
      ],
      "actuellement / en fait": [
        "Actuellement, je travaille comme serveur en attendant mon équivalence. — At the moment I'm working as a waiter while I wait for my degree to be recognised.",
        "Je pensais que c'était gratuit ; en fait, il faut payer vingt dollars. — I thought it was free; actually, you have to pay twenty dollars.",
      ],
      "Après avoir fini, il est parti.": [
        "Après avoir obtenu mon diplôme, j'ai trouvé un emploi à Montréal. — After getting my degree, I found a job in Montréal.",
        "Après être arrivée au Canada, elle a suivi des cours de français. — After arriving in Canada, she took French classes.",
      ],
      "Après qu'il est parti, on a continué.": [
        "Après que le directeur a présenté le projet, nous avons posé nos questions. — After the director presented the project, we asked our questions.",
        "Après que la loi a été adoptée, les loyers ont été mieux encadrés. — After the law was passed, rents were better regulated.",
      ],
    },
    expressions: {
      "peser le pour et le contre": [
        "Avant d'accepter un poste à Calgary, j'ai longuement pesé le pour et le contre. — Before accepting a job in Calgary, I weighed up the pros and cons for a long time.",
        "Il faut peser le pour et le contre avant d'interdire la voiture au centre-ville. — We need to weigh up the pros and cons before banning cars downtown.",
      ],
      "le revers de la médaille": [
        "Le télétravail fait gagner du temps, mais le revers de la médaille, c'est l'isolement. — Remote work saves time, but the downside is isolation.",
        "Le tourisme fait vivre la région ; le revers de la médaille, ce sont des loyers hors de prix. — Tourism keeps the region alive; the flip side is sky-high rents.",
      ],
      "être à double tranchant": [
        "Les réseaux sociaux sont à double tranchant : ils informent, mais ils propagent aussi des rumeurs. — Social media is a double-edged sword: it informs, but it also spreads rumours.",
        "Pour les petites entreprises, la hausse du salaire minimum est une mesure à double tranchant. — For small businesses, raising the minimum wage is a double-edged measure.",
      ],
      "trouver un juste milieu": [
        "Entre le télétravail complet et le bureau tous les jours, il faut trouver un juste milieu. — Between working from home full-time and the office every day, we need to find a happy medium.",
        "J'essaie de trouver un juste milieu entre mes études et mon travail à temps partiel. — I'm trying to strike a balance between my studies and my part-time job.",
      ],
      "mettre de l'eau dans son vin": [
        "Pour obtenir un accord, le syndicat et la direction ont dû mettre de l'eau dans leur vin. — To reach an agreement, the union and management both had to compromise.",
        "Si chacun met un peu d'eau dans son vin, la colocation se passera bien. — If everyone compromises a little, the flat-share will go well.",
      ],
      "Il ne faut pas jeter le bébé avec l'eau du bain.": [
        "Notre système de santé a des défauts, mais il ne faut pas jeter le bébé avec l'eau du bain. — Our health system has its flaws, but we shouldn't throw the baby out with the bathwater.",
        "Réformer l'examen, d'accord, mais il ne faut pas jeter le bébé avec l'eau du bain. — Reform the exam, fine, but let's not throw the baby out with the bathwater.",
      ],
      "Tout le monde y trouve son compte.": [
        "Avec la semaine de quatre jours, tout le monde y trouve son compte, les employés comme l'entreprise. — With the four-day week, everyone gets something out of it, the employees and the company alike.",
        "Au marché fermier du samedi, producteurs et clients y trouvent leur compte. — At the Saturday farmers' market, producers and customers both benefit.",
      ],
      "Le jeu en vaut la chandelle.": [
        "Apprendre le français prend du temps, mais le jeu en vaut la chandelle. — Learning French takes time, but it's well worth the effort.",
        "Rénover une vieille maison coûte cher ; je ne suis pas sûr que le jeu en vaille la chandelle. — Renovating an old house is expensive; I'm not sure it's worth it.",
      ],
      "force est de constater que": [
        "Force est de constater que les loyers ont augmenté beaucoup plus vite que les salaires. — One has to admit that rents have risen much faster than wages.",
        "Malgré les campagnes de prévention, force est de constater que les jeunes vapotent de plus en plus. — Despite the prevention campaigns, the fact is that more and more young people are vaping.",
      ],
      "il va de soi que": [
        "Il va de soi que les nouveaux arrivants devraient avoir accès à des cours de français gratuits. — It goes without saying that newcomers should have access to free French classes.",
        "Si vous ne pouvez pas venir ce jour-là, il va de soi que nous changerons la date. — If you can't come that day, it goes without saying that we'll change the date.",
      ],
      "se mettre à la place de quelqu'un": [
        "Mettez-vous à la place des parents qui attendent une place en garderie depuis deux ans. — Put yourself in the shoes of parents who've been waiting two years for a daycare spot.",
        "Avant de critiquer les grévistes, essayons de nous mettre à leur place. — Before we criticise the strikers, let's try to put ourselves in their shoes.",
      ],
      "une goutte d'eau dans l'océan": [
        "Ces cent logements sociaux ne sont qu'une goutte d'eau dans l'océan face à la crise. — These hundred social housing units are just a drop in the ocean given the crisis.",
        "Mon geste semble une goutte d'eau dans l'océan, mais si tout le monde faisait pareil… — What I do seems a drop in the ocean, but if everyone did the same…",
      ],
      "la partie émergée de l'iceberg": [
        "Les plaintes officielles ne sont que la partie émergée de l'iceberg. — The official complaints are just the tip of the iceberg.",
        "Selon les infirmières, les urgences débordées ne sont que la partie émergée de l'iceberg. — According to the nurses, the overcrowded emergency rooms are only the tip of the iceberg.",
      ],
      "un pas dans la bonne direction": [
        "La gratuité des transports pour les étudiants est un pas dans la bonne direction. — Free transit for students is a step in the right direction.",
        "Cette loi n'est pas parfaite, mais c'est un pas dans la bonne direction. — This law isn't perfect, but it's a step in the right direction.",
      ],
      "Mieux vaut prévenir que guérir.": [
        "Mieux vaut prévenir que guérir : le sport à l'école coûte moins cher que les soins plus tard. — Prevention is better than cure: sport at school costs less than treatment later on.",
        "J'ai fait installer mes pneus d'hiver avant la première neige ; mieux vaut prévenir que guérir. — I had my winter tyres put on before the first snow; better safe than sorry.",
      ],
      "vouloir le beurre et l'argent du beurre": [
        "Exiger de meilleurs services publics sans payer plus d'impôts, c'est vouloir le beurre et l'argent du beurre. — Demanding better public services without paying more tax is wanting to have your cake and eat it.",
        "Un grand appartement au centre-ville pour un petit loyer ? Tu veux le beurre et l'argent du beurre ! — A big flat downtown for low rent? You want to have your cake and eat it!",
      ],
      "ne pas mettre tous ses œufs dans le même panier": [
        "Je cherche du travail à Montréal et à Ottawa : je ne mets pas tous mes œufs dans le même panier. — I'm looking for work in Montréal and in Ottawa: I'm not putting all my eggs in one basket.",
        "Une région qui dépend d'une seule usine met tous ses œufs dans le même panier. — A region that depends on a single factory is putting all its eggs in one basket.",
      ],
      "Il ne faut pas mettre la charrue avant les bœufs.": [
        "Trouve un appartement avant d'acheter des meubles : il ne faut pas mettre la charrue avant les bœufs. — Find a flat before you buy furniture: don't put the cart before the horse.",
        "Lancer le projet sans budget, ce serait mettre la charrue avant les bœufs. — Launching the project without a budget would be putting the cart before the horse.",
      ],
      "tirer la sonnette d'alarme": [
        "Les médecins de famille tirent la sonnette d'alarme : les listes d'attente ne cessent de s'allonger. — Family doctors are sounding the alarm: the waiting lists keep getting longer.",
        "Des scientifiques tirent la sonnette d'alarme sur la fonte rapide des glaciers. — Scientists are sounding the alarm about the rapid melting of the glaciers.",
      ],
      "monter en flèche": [
        "Dans les grandes villes, les loyers ont monté en flèche en cinq ans. — In the big cities, rents have soared in five years.",
        "Le prix du panier d'épicerie monte en flèche, et les banques alimentaires débordent. — The cost of groceries is skyrocketing, and the food banks are overwhelmed.",
      ],
      "joindre les deux bouts": [
        "Avec deux emplois, elle arrive tout juste à joindre les deux bouts. — With two jobs, she's only just making ends meet.",
        "De plus en plus d'étudiants ont du mal à joindre les deux bouts à la fin du mois. — More and more students struggle to make ends meet at the end of the month.",
      ],
      "se serrer la ceinture": [
        "Avec la hausse des taux d'intérêt, beaucoup de familles doivent se serrer la ceinture. — With interest rates going up, many families have to tighten their belts.",
        "La ville va se serrer la ceinture : plusieurs projets seront reportés. — The city is going to tighten its belt: several projects will be put off.",
      ],
      "un parcours du combattant": [
        "Faire reconnaître son diplôme d'infirmière au Canada est un vrai parcours du combattant. — Getting your nursing degree recognised in Canada is a real obstacle course.",
        "Trouver un logement à Montréal en juillet relève du parcours du combattant. — Finding a place to live in Montréal in July is an ordeal.",
      ],
      "un coup de pouce": [
        "Le gouvernement offre un coup de pouce aux familles pour payer la garderie. — The government is giving families a boost to pay for daycare.",
        "Grâce au coup de pouce d'une ancienne collègue, j'ai décroché un entretien. — Thanks to a helping hand from a former colleague, I landed an interview.",
      ],
      "faire marche arrière": [
        "Face aux protestations, la mairie a fait marche arrière sur la hausse des tarifs. — In the face of the protests, city hall backed down on the fare increase.",
        "J'avais accepté l'offre, mais j'ai fait marche arrière en lisant le contrat. — I'd accepted the offer, but I backed out when I read the contract.",
      ],
      "changer la donne": [
        "L'intelligence artificielle pourrait changer la donne sur le marché du travail. — Artificial intelligence could change the game on the job market.",
        "Une ligne de train rapide changerait la donne pour les habitants des banlieues. — A fast train line would be a game-changer for people in the suburbs.",
      ],
      "mettre la clé sous la porte": [
        "Faute de clients, la librairie du quartier a dû mettre la clé sous la porte. — For lack of customers, the neighbourhood bookshop had to close down.",
        "Sans aide publique, de nombreuses petites fermes risquent de mettre la clé sous la porte. — Without public support, many small farms may have to shut down.",
      ],
      "être à bout de souffle": [
        "Après des années de pénurie de personnel, le système de santé est à bout de souffle. — After years of staff shortages, the health system is running out of steam.",
        "Les bénévoles de la banque alimentaire sont à bout de souffle depuis l'hiver. — The food bank volunteers have been stretched to the limit since the winter.",
      ],
      "faire boule de neige": [
        "Une simple publication sur les réseaux sociaux a fait boule de neige. — A simple social media post snowballed.",
        "Quelques voisins ont commencé à composter, puis l'initiative a fait boule de neige dans tout le quartier. — A few neighbours started composting, then the idea snowballed across the whole neighbourhood.",
      ],
      "la goutte d'eau qui fait déborder le vase": [
        "Cette nouvelle hausse de loyer a été la goutte d'eau qui fait déborder le vase. — This latest rent increase was the last straw.",
        "Pour les employés, la suppression des primes a été la goutte d'eau qui a fait déborder le vase. — For the employees, losing their bonuses was the last straw.",
      ],
      "jeter de l'huile sur le feu": [
        "Les déclarations du ministre n'ont fait que jeter de l'huile sur le feu. — The minister's statements only added fuel to the fire.",
        "Évite de lui répondre sur ce ton, tu vas jeter de l'huile sur le feu. — Don't answer him in that tone, you'll only add fuel to the fire.",
      ],
      "mettre des bâtons dans les roues à quelqu'un": [
        "La lenteur administrative met des bâtons dans les roues des entrepreneurs immigrants. — Red tape puts obstacles in the way of immigrant entrepreneurs.",
        "Mon ancien propriétaire m'a mis des bâtons dans les roues pour me rendre ma caution. — My old landlord made it hard for me to get my deposit back.",
      ],
      "avoir le vent en poupe": [
        "Les voitures électriques ont le vent en poupe au Québec. — Electric cars are booming in Québec.",
        "Le covoiturage a le vent en poupe chez les jeunes travailleurs. — Carpooling is on the rise among young workers.",
      ],
      "être monnaie courante": [
        "Dans ce secteur, les heures supplémentaires non payées sont monnaie courante. — In this sector, unpaid overtime is commonplace.",
        "Les retards de train sont devenus monnaie courante cet hiver. — Train delays became commonplace this winter.",
      ],
      "du jour au lendemain": [
        "On ne devient pas bilingue du jour au lendemain. — You don't become bilingual overnight.",
        "L'usine a fermé du jour au lendemain, et deux cents personnes ont perdu leur emploi. — The factory closed overnight, and two hundred people lost their jobs.",
      ],
      "faire le point": [
        "Faisons le point sur votre dossier avant l'entretien de la semaine prochaine. — Let's go over where your file stands before next week's interview.",
        "Six mois après mon arrivée, j'ai fait le point sur ce qui avait marché ou non. — Six months after I arrived, I took stock of what had worked and what hadn't.",
      ],
      "avoir du pain sur la planche": [
        "Avec trois examens en mai, j'ai du pain sur la planche. — With three exams in May, I've got my work cut out for me.",
        "Le nouveau gouvernement aura du pain sur la planche pour régler la crise du logement. — The new government will have its work cut out solving the housing crisis.",
      ],
      "mettre les bouchées doubles": [
        "Il me reste un mois avant le TCF, alors je mets les bouchées doubles. — I've got a month left before the TCF, so I'm doubling my efforts.",
        "Pour finir le chantier avant l'hiver, l'entreprise a mis les bouchées doubles. — To finish the building site before winter, the company redoubled its efforts.",
      ],
      "mettre la main à la pâte": [
        "Pour la fête de quartier, tous les voisins ont mis la main à la pâte. — For the street party, all the neighbours pitched in.",
        "La directrice n'hésite pas à mettre la main à la pâte quand l'équipe est débordée. — The manager doesn't hesitate to pitch in when the team is swamped.",
      ],
      "donner un coup de main à quelqu'un": [
        "Tu peux me donner un coup de main pour déménager samedi ? — Can you give me a hand with the move on Saturday?",
        "Les organismes communautaires donnent un coup de main aux nouveaux arrivants pour remplir leurs formulaires. — Community organisations help newcomers fill in their forms.",
      ],
      "avoir plus d'une corde à son arc": [
        "Elle est infirmière et traductrice : elle a plus d'une corde à son arc. — She's a nurse and a translator: she has more than one string to her bow.",
        "Sur le marché du travail actuel, mieux vaut avoir plus d'une corde à son arc. — In today's job market, it's best to have more than one skill to offer.",
      ],
      "baisser les bras": [
        "Après trois refus, j'avais envie de baisser les bras, mais j'ai encore postulé. — After three rejections, I felt like giving up, but I applied again.",
        "Il ne faut pas baisser les bras face au changement climatique : chaque geste compte. — We mustn't give up in the face of climate change: every action counts.",
      ],
      "tenir le coup": [
        "Le premier hiver a été dur, mais j'ai tenu le coup grâce à mes amis. — The first winter was hard, but I held up thanks to my friends.",
        "Les infirmières ne pourront pas tenir le coup longtemps avec de tels horaires. — Nurses won't be able to cope for long with hours like these.",
      ],
      "faire d'une pierre deux coups": [
        "En allant au travail à vélo, je fais d'une pierre deux coups : du sport et des économies. — By cycling to work, I kill two birds with one stone: exercise and savings.",
        "Rénover les écoles pour réduire leur consommation d'énergie, c'est faire d'une pierre deux coups. — Renovating schools to cut their energy use kills two birds with one stone.",
      ],
      "avoir du mal à (+ inf.)": [
        "Au début, j'avais du mal à comprendre l'accent québécois. — At first, I had trouble understanding the Québec accent.",
        "Beaucoup de PME ont du mal à recruter du personnel qualifié. — Many small businesses struggle to recruit qualified staff.",
      ],
      "sauter le pas": [
        "Après des années d'hésitation, nous avons sauté le pas et déposé notre demande de résidence permanente. — After years of hesitating, we took the plunge and applied for permanent residence.",
        "Beaucoup de jeunes rêvent de créer leur entreprise, mais peu osent sauter le pas. — Many young people dream of starting a business, but few dare take the plunge.",
      ],
      "repartir de zéro": [
        "En arrivant au Canada, j'ai dû repartir de zéro : nouveau pays, nouvelle langue, nouveau métier. — When I arrived in Canada, I had to start from scratch: new country, new language, new job.",
        "Repartir de zéro à quarante ans demande beaucoup de courage. — Starting over at forty takes a lot of courage.",
      ],
      "avoir le mal du pays": [
        "Pendant les fêtes de fin d'année, j'ai souvent le mal du pays. — Over the holidays, I often feel homesick.",
        "Les appels vidéo aident les immigrants qui ont le mal du pays à garder le lien avec leur famille. — Video calls help homesick immigrants stay in touch with their families.",
      ],
      "être comme un poisson dans l'eau": [
        "Après six mois à Québec, ma fille est comme un poisson dans l'eau à l'école. — After six months in Québec City, my daughter is completely at home at school.",
        "Dans un milieu de travail bilingue, je me sens comme un poisson dans l'eau. — In a bilingual workplace, I feel completely at ease.",
      ],
      "accueillir quelqu'un à bras ouverts": [
        "Les habitants de la petite ville nous ont accueillis à bras ouverts. — The people of the small town welcomed us with open arms.",
        "Les régions qui manquent de main-d'œuvre accueillent les travailleurs étrangers à bras ouverts. — Regions short of workers welcome foreign workers with open arms.",
      ],
      "être dans le même bateau": [
        "Ne t'inquiète pas, tous les nouveaux arrivants sont dans le même bateau. — Don't worry, all newcomers are in the same boat.",
        "Face à la hausse des taxes municipales, locataires et propriétaires sont dans le même bateau. — With municipal taxes going up, tenants and owners are in the same boat.",
      ],
      "prendre son mal en patience": [
        "Le traitement des demandes prend huit mois, il faut donc prendre son mal en patience. — Applications take eight months to process, so you have to be patient.",
        "En attendant un médecin de famille, beaucoup de patients prennent leur mal en patience. — While they wait for a family doctor, many patients grin and bear it.",
      ],
      "coûter les yeux de la tête": [
        "À Vancouver, un appartement de deux chambres coûte les yeux de la tête. — In Vancouver, a two-bedroom apartment costs an arm and a leg.",
        "La garderie privée coûte les yeux de la tête, c'est pourquoi l'État devrait plafonner les tarifs. — Private daycare costs an arm and a leg, which is why the state should cap the fees.",
      ],
      "Ce n'est pas la mer à boire.": [
        "Remplir ce formulaire, ce n'est pas la mer à boire : je vais t'aider. — Filling in this form isn't that hard: I'll help you.",
        "Une heure de français par jour, ce n'est pas la mer à boire si on s'organise bien. — An hour of French a day isn't asking much if you organise yourself well.",
      ],
      "Ça vaut le coup.": [
        "Le parc national est loin, mais ça vaut le coup d'y aller en automne. — The national park is far, but it's worth going in the autumn.",
        "Ça vaut le coup de comparer les forfaits avant de choisir un fournisseur internet. — It's worth comparing plans before you choose an internet provider.",
      ],
      "poser un lapin à quelqu'un": [
        "Désolé de t'avoir posé un lapin hier, j'avais complètement oublié notre rendez-vous. — Sorry I stood you up yesterday, I'd completely forgotten our meeting.",
        "Le technicien nous a posé un lapin deux fois ; je ne recommande pas cette entreprise. — The technician stood us up twice; I don't recommend this company.",
      ],
      "tourner autour du pot": [
        "Arrête de tourner autour du pot et dis-moi ce qui ne va pas. — Stop beating around the bush and tell me what's wrong.",
        "Pendant le débat, le candidat a tourné autour du pot au lieu de parler du logement. — During the debate, the candidate beat around the bush instead of talking about housing.",
      ],
      "Il pleut des cordes.": [
        "Il pleut des cordes, prends ton parapluie et tes bottes. — It's pouring, take your umbrella and your boots.",
        "Il pleuvait des cordes, alors le festival a été reporté à dimanche. — It was pouring, so the festival was put off until Sunday.",
      ],
      "Il fait un froid de canard.": [
        "Il fait un froid de canard ce matin : moins vingt-cinq avec le vent ! — It's freezing this morning: minus twenty-five with the wind chill!",
        "Même quand il fait un froid de canard, certains Montréalais continuent d'aller au travail à vélo. — Even when it's freezing cold, some Montrealers keep cycling to work.",
      ],
      "avoir le cafard": [
        "En novembre, quand les journées raccourcissent, j'ai souvent le cafard. — In November, when the days get shorter, I often feel down.",
        "Beaucoup d'étudiants étrangers ont le cafard pendant leur premier hiver loin de chez eux. — Many international students feel low during their first winter away from home.",
      ],
      "Qui ne tente rien n'a rien.": [
        "J'ai postulé même sans toute l'expérience demandée : qui ne tente rien n'a rien. — I applied even without all the experience they asked for: nothing ventured, nothing gained.",
        "Émigrer comporte des risques, mais qui ne tente rien n'a rien. — Emigrating has its risks, but nothing ventured, nothing gained.",
      ],
      "C'est en forgeant qu'on devient forgeron.": [
        "Je parle français avec mes voisins tous les jours : c'est en forgeant qu'on devient forgeron. — I speak French with my neighbours every day: practice makes perfect.",
        "Les stages sont essentiels dans une formation, car c'est en forgeant qu'on devient forgeron. — Work placements are essential in any training, because practice makes perfect.",
      ],
      "Petit à petit, l'oiseau fait son nid.": [
        "Je comprends un peu mieux la radio chaque semaine : petit à petit, l'oiseau fait son nid. — I understand the radio a little better every week: slowly but surely.",
        "Elle a commencé avec un comptoir au marché, puis elle a ouvert un restaurant : petit à petit, l'oiseau fait son nid. — She started with a market stall, then opened a restaurant: step by step.",
      ],
      "Paris ne s'est pas fait en un jour.": [
        "Ne te décourage pas si tu fais encore des fautes : Paris ne s'est pas fait en un jour. — Don't lose heart if you still make mistakes: Rome wasn't built in a day.",
        "La transition énergétique prendra des décennies ; Paris ne s'est pas fait en un jour. — The energy transition will take decades; Rome wasn't built in a day.",
      ],
      "Les petits ruisseaux font les grandes rivières.": [
        "Je mets vingt dollars de côté chaque semaine : les petits ruisseaux font les grandes rivières. — I put twenty dollars aside every week: small amounts add up.",
        "Trier ses déchets peut sembler inutile, mais les petits ruisseaux font les grandes rivières. — Sorting your waste may seem pointless, but small efforts add up.",
      ],
      "L'habit ne fait pas le moine.": [
        "Il est toujours en jean, mais c'est un excellent avocat : l'habit ne fait pas le moine. — He's always in jeans, but he's an excellent lawyer: don't judge a book by its cover.",
        "Un CV impressionnant ne garantit rien ; l'habit ne fait pas le moine. — An impressive CV guarantees nothing; appearances can be deceptive.",
      ],
      "Lâche pas la patate !": [
        "Il te reste juste l'oral à passer, lâche pas la patate ! — You've only got the speaking test left, hang in there!",
        "Les Québécois disent souvent « Lâche pas la patate ! » pour encourager quelqu'un qui doute. — Quebecers often say “Lâche pas la patate!” to encourage someone who's having doubts.",
      ],
      "C'est de valeur.": [
        "Tu ne peux pas venir au souper ? C'est de valeur, on aurait aimé te voir. — You can't come to dinner? What a shame, we'd have liked to see you.",
        "C'est de valeur que le centre communautaire ferme le dimanche. — It's a pity that the community centre is closed on Sundays.",
      ],
      "avoir de la misère à (+ inf.)": [
        "Au début, j'avais de la misère à suivre les conversations au bureau. — At first, I had a hard time following conversations at the office.",
        "Plusieurs familles ont de la misère à payer l'épicerie depuis la hausse des prix. — Many families have had a hard time paying for groceries since prices went up.",
      ],
      "C'est plate.": [
        "Ce film est plate, on change de poste ? — This film is boring, shall we change channels?",
        "C'est plate que le dernier autobus passe si tôt la fin de semaine. — It's a drag that the last bus runs so early on weekends.",
      ],
      "tomber en amour": [
        "Nous sommes tombés en amour avec la ville de Québec dès notre première visite. — We fell in love with Québec City on our very first visit.",
        "Beaucoup d'immigrants tombent en amour avec les grands espaces canadiens. — Many immigrants fall in love with Canada's wide open spaces.",
      ],
    },
  };
  // Each card keeps its own examples first; a line whose French is already there isn't added again.
  const frOf = (l) => l.split(" — ")[0].replace(/\s+/g, " ").trim().toLowerCase();
  T.VOCAB.forEach((th) => {
    const m = EX[th.id];
    if (!m) return;
    th.cards.forEach((c) => {
      const add = m[c[0]];
      if (!add) return;
      const have = String(c[2] || "").split("\n").map((l) => l.trim()).filter(Boolean);
      add.forEach((l) => { if (!have.some((h) => frOf(h) === frOf(l))) have.push(l); });
      c[2] = have.join("\n");
    });
  });
  T.EXAMPLES = EX;
})();
