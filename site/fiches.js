/* The starter revision sheets (Fiches), loaded after examples.js. Each is { id, title, en, tag, for, body }:
   tag is grammaire, ecrit, oral, vocabulaire or examen; for is the page it belongs to (a grammar topic or a
   writing task), which shows a tab linking here; body is in the sheet markup app.js draws (ficheHTML):
     # Titre            a section heading                  - item          a bullet
     | a | b |          a table, first row the header      > …             a taped note (the memory trick)
     ! …                a red-pen "Attention" box          = Fr — En       an example line
     >> slot | slot     an order chain. A slot is "words :: label"; "*" makes it the verb; "#n " gives it
                        colour n (by default its place among the slots), so the same kind of pronoun keeps
                        its colour from one chain to the next
     **gras**  ~~faux~~  ++juste++  ==caché en mode Cacher==  {n:mot} (coloured like slot n above)
   They follow TCF Canada and the learner's KNOWN_ERRORS (data.js). The learner can edit or hide any of them;
   an edited one is saved in the fiches collection under the same id. tools/check_notes.js checks them. */
(function () {
  "use strict";
  const T = window.TCF;
  T.FICHES = [
    {
      id: "pronoms-ordre", tag: "grammaire", for: "grammar.pronoms",
      title: "L'ordre des pronoms compléments", en: "Where object pronouns go, and in what order",
      body: `# L'ordre devant le verbe
>> me te se nous vous :: 1re et 2e pers., réfléchis | le la les :: COD, 3e pers. | lui leur :: COI, 3e pers. | y :: à + chose, lieu | en :: de + nom, quantité | *verbe
= Je {2:le} {3:lui} donne. — I give it to him.
= Elle {1:me} {2:l'}a expliqué. — She explained it to me.
= Il {4:y} {5:en} a trois. — There are three of them.
= Je {1:t'}{5:en} parlerai demain. — I'll tell you about it tomorrow.
= Nous {2:les} {3:leur} avons envoyés hier. — We sent them to them yesterday.
> « Il y en a » : y passe toujours juste avant en.
> Moi devant, lui derrière : je **te le** donne · je **le lui** donne.

# Où placer le bloc
| Quand | Où | Exemple |
|---|---|---|
| Temps simple | juste devant le verbe | Je ==le lui== donne. |
| Passé composé | devant l'auxiliaire | Je ==le lui== ai donné. |
| Verbe + infinitif | devant l'infinitif | Je vais ==le lui== donner. |
| Négation | ne + pronoms + verbe + pas | Je ne ==le lui== ai pas donné. |
| Impératif négatif | ordre normal, devant | Ne ==le lui== donne pas. |
! Au passé composé, le participe s'accorde avec un COD placé avant : les lettres → je **les** ai envoyé**es**.

# L'impératif affirmatif : tout passe après
>> *verbe | #2 le la les :: COD | #3 moi toi lui nous vous leur :: COI | #4 y :: à + chose, lieu | #5 en :: de + nom, quantité
= Donne-{2:le}-{3:moi}. — Give it to me.
= Envoyez-{2:les}-{3:leur}. — Send them to them.
= Vas-{4:y} ! — Go on!
= Parles-{5:en} à ton professeur. — Talk to your teacher about it.
= Donne-{3:m'}{5:en} un peu. — Give me some.
! Ton erreur fréquente : ~~m'envoie le dossier~~ ++envoie-moi le dossier++. À l'impératif affirmatif, le pronom va **après** le verbe, avec un trait d'union.
> Devant en, moi et toi deviennent m' et t' : donne-m'en, va-t'en.
> Devant y et en, va et les verbes en -er gardent un s : vas-y, parles-en, manges-en.

# Les pièges
- **lui / leur** ne vont jamais avec me, te, se, nous, vous : je te présente ==à lui== (pas ~~je te lui présente~~).
- **leur** pronom ne prend jamais de s : je ==leur== parle (≠ leurs enfants).
- **y** remplace une chose, pas une personne : je pense à mon projet → j'==y== pense ; je pense à ma mère → je pense ==à elle==.
- **en** garde la quantité : j'ai deux enfants → j'==en== ai ==deux==.`,
    },
    {
      id: "subjonctif-indicatif", tag: "grammaire", for: "grammar.subjonctif",
      title: "Subjonctif ou indicatif ?", en: "Which mood after which trigger",
      body: `# Le subjonctif après…
| Ce qu'on exprime | Déclencheurs | Exemple |
|---|---|---|
| La volonté | vouloir que, souhaiter que, exiger que | Je veux que tu ==viennes==. |
| La nécessité | il faut que, il est important que | Il faut que nous ==partions== tôt. |
| Le sentiment | être content que, avoir peur que, regretter que | Je suis content que tu ==sois== là. |
| Le doute | douter que, ne pas penser que | Je ne pense pas qu'il ==ait== raison. |
| Le but | pour que, afin que, de peur que | Je parle lentement pour que tu ==comprennes==. |
| La concession | bien que, quoique | Bien qu'il ==pleuve==, on sort. |
| Le temps | avant que, jusqu'à ce que, en attendant que | Pars avant qu'il ==soit== trop tard. |
| La condition | à condition que, pourvu que, à moins que | Je viens à condition que tu ==conduises==. |

# … mais l'indicatif après
| Déclencheur | Pourquoi | Exemple |
|---|---|---|
| après que | le fait a déjà eu lieu | Après qu'il ==est== parti, on a dîné. |
| parce que, puisque | une cause réelle | Je reste parce qu'il ==pleut==. |
| espérer que | on vise le réel | J'espère que tu ==viendras==. |
| penser que, croire que | à l'affirmatif : une certitude | Je pense qu'il ==a== raison. |
| il est sûr que, il est certain que | une certitude | Il est sûr qu'elle ==viendra==. |
> Doute ou désir → subjonctif. Fait ou certitude → indicatif. « Je pense que » affirme, « je ne pense pas que » doute.

# Les radicaux irréguliers
| Infinitif | que je… | que nous… |
|---|---|---|
| être | sois | soyons |
| avoir | aie | ayons |
| aller | aille | allions |
| faire | fasse | fassions |
| pouvoir | puisse | puissions |
| savoir | sache | sachions |
| vouloir | veuille | voulions |
| venir | vienne | venions |
| prendre | prenne | prenions |
> Le radical régulier vient de « ils » au présent : ils finissent → que je finisse.
! Ton erreur fréquente : ~~afin qu'il pourrait~~ ++afin qu'il puisse++ · ~~avant qu'il serait trop tard~~ ++avant qu'il soit trop tard++. Jamais de conditionnel après afin que ou avant que.`,
    },
    {
      id: "conjugaison", tag: "grammaire", for: "grammar.conditionnel",
      title: "Conjuguer : le radical et les terminaisons", en: "How to build each tense and mood, and the irregular verbs",
      body: `# Trois formes pour tout conjuguer
| Pour former… | On part de… | Exemple |
|---|---|---|
| l'imparfait | « nous » au présent | nous **finiss**ons → je **finiss**ais |
| le futur et le conditionnel | l'infinitif | **finir** → je **finir**ai · je **finir**ais |
| le subjonctif | « ils » au présent | ils **finiss**ent → que je **finiss**e |
> Nous → imparfait. Infinitif → futur et conditionnel. Ils → subjonctif.

# L'imparfait
>> nous parlons, nous finissons, nous prenons :: « nous » au présent | parl-, finiss-, pren- :: le radical : on enlève -ons | -ais -ais -ait -ions -iez -aient :: les terminaisons
| Personne | parler | finir | prendre |
|---|---|---|---|
| je | {2:parl}{3:**ais**} | {2:finiss}{3:**ais**} | {2:pren}{3:**ais**} |
| tu | {2:parl}{3:**ais**} | {2:finiss}{3:**ais**} | {2:pren}{3:**ais**} |
| il, elle, on | {2:parl}{3:**ait**} | {2:finiss}{3:**ait**} | {2:pren}{3:**ait**} |
| nous | {2:parl}{3:**ions**} | {2:finiss}{3:**ions**} | {2:pren}{3:**ions**} |
| vous | {2:parl}{3:**iez**} | {2:finiss}{3:**iez**} | {2:pren}{3:**iez**} |
| ils, elles | {2:parl}{3:**aient**} | {2:finiss}{3:**aient**} | {2:pren}{3:**aient**} |
> Un seul irrégulier : être → j'**ét**ais.
- -cer et -ger gardent leur son devant a : je commen**ç**ais, je mang**e**ais.
- Les verbes en -ier prennent deux i à nous et vous : nous étud**ii**ons, vous étud**ii**ez.
= Quand j'{2:habit}{3:**ais**} à Lyon, je {2:pren}{3:**ais**} le métro tous les jours. — When I lived in Lyon, I took the metro every day.

# Le futur simple
>> parler, finir, prendre :: l'infinitif | parler-, finir-, prendr- :: le radical : -re perd son e | -ai -as -a -ons -ez -ont :: les terminaisons
| Personne | parler | finir | prendre |
|---|---|---|---|
| je | {2:parler}{3:**ai**} | {2:finir}{3:**ai**} | {2:prendr}{3:**ai**} |
| tu | {2:parler}{3:**as**} | {2:finir}{3:**as**} | {2:prendr}{3:**as**} |
| il, elle, on | {2:parler}{3:**a**} | {2:finir}{3:**a**} | {2:prendr}{3:**a**} |
| nous | {2:parler}{3:**ons**} | {2:finir}{3:**ons**} | {2:prendr}{3:**ons**} |
| vous | {2:parler}{3:**ez**} | {2:finir}{3:**ez**} | {2:prendr}{3:**ez**} |
| ils, elles | {2:parler}{3:**ont**} | {2:finir}{3:**ont**} | {2:prendr}{3:**ont**} |
> Les terminaisons, c'est avoir au présent : (j')ai, (tu) as, (il) a, (nous av)ons, (vous av)ez, (ils) ont.
- Le changement du présent reste : j'achète → j'achèterai, j'appelle → j'appellerai, je paie → je paierai.
- Pour l'avenir, le futur après quand, lorsque et dès que : quand j'**arriverai**, je t'appellerai (pas ~~quand j'arrive~~).
! Ton erreur fréquente : ~~je achèterai~~ ++j'achèterai++ · ~~je irai~~ ++j'irai++. Devant une voyelle, je devient j'.
= Quand nous {2:arriver}{3:**ons**} à Montréal, nous {2:chercher}{3:**ons**} un appartement. — When we get to Montreal, we'll look for a flat.

# Le conditionnel présent
>> je parlerai, je finirai, je prendrai :: le futur | parler-, finir-, prendr- :: le même radical | -ais -ais -ait -ions -iez -aient :: les terminaisons de l'imparfait
| Personne | parler | finir | prendre |
|---|---|---|---|
| je | {2:parler}{3:**ais**} | {2:finir}{3:**ais**} | {2:prendr}{3:**ais**} |
| tu | {2:parler}{3:**ais**} | {2:finir}{3:**ais**} | {2:prendr}{3:**ais**} |
| il, elle, on | {2:parler}{3:**ait**} | {2:finir}{3:**ait**} | {2:prendr}{3:**ait**} |
| nous | {2:parler}{3:**ions**} | {2:finir}{3:**ions**} | {2:prendr}{3:**ions**} |
| vous | {2:parler}{3:**iez**} | {2:finir}{3:**iez**} | {2:prendr}{3:**iez**} |
| ils, elles | {2:parler}{3:**aient**} | {2:finir}{3:**aient**} | {2:prendr}{3:**aient**} |
> Conditionnel = le radical du futur + les terminaisons de l'imparfait.
- Pour demander poliment : je voudrais, j'aimerais, pourriez-vous… ?
! Futur ou conditionnel ? Une lettre change le sens : je **ferai** (c'est prévu) · je **ferais** (si…). Après si + imparfait : si j'avais le temps, je ~~ferai~~ ++ferais++ du sport.
= Si j'avais plus de temps, je {2:prendr}{3:**ais**} des cours du soir. — If I had more time, I'd take evening classes.
= Nous {2:aimer}{3:**ions**} visiter l'appartement samedi. — We'd like to see the flat on Saturday.

# Le subjonctif présent
>> ils parlent, ils finissent, ils prennent :: « ils » au présent | parl-, finiss-, prenn- :: le radical : on enlève -ent | -e -es -e -ions -iez -ent :: les terminaisons
| Personne | parler | finir | prendre |
|---|---|---|---|
| que je | {2:parl}{3:**e**} | {2:finiss}{3:**e**} | {2:prenn}{3:**e**} |
| que tu | {2:parl}{3:**es**} | {2:finiss}{3:**es**} | {2:prenn}{3:**es**} |
| qu'il, qu'elle | {2:parl}{3:**e**} | {2:finiss}{3:**e**} | {2:prenn}{3:**e**} |
| que nous | {2:parl}{3:**ions**} | {2:finiss}{3:**ions**} | {2:pren}{3:**ions**} |
| que vous | {2:parl}{3:**iez**} | {2:finiss}{3:**iez**} | {2:pren}{3:**iez**} |
| qu'ils, qu'elles | {2:parl}{3:**ent**} | {2:finiss}{3:**ent**} | {2:prenn}{3:**ent**} |
> Nous et vous gardent le radical de « nous » : nous prenons → que nous prenions. Le plus souvent, c'est la forme de l'imparfait.
- Quand l'employer : la fiche « Subjonctif ou indicatif ? ».
! Ton erreur fréquente : ~~afin qu'il pourrait~~ ++afin qu'il puisse++. Après afin que, avant que, bien que : le subjonctif, jamais le conditionnel.
= Il faut que je {2:finiss}{3:**e**} ce dossier avant vendredi. — I have to finish this file before Friday.
= Mon employeur souhaite que nous {2:pren}{3:**ions**} nos congés en août. — My employer wants us to take our holidays in August.

# Les temps composés
>> #4 avoir, être :: l'auxiliaire, au temps simple voulu | #5 fini, partie, pris :: le participe passé
| Temps composé | Temps de l'auxiliaire | Exemple |
|---|---|---|
| passé composé | présent | j'{4:ai} {5:fini} · elle {4:est} {5:partie} |
| plus-que-parfait | imparfait | j'{4:avais} {5:fini} · elle {4:était} {5:partie} |
| futur antérieur | futur | j'{4:aurai} {5:fini} · elle {4:sera} {5:partie} |
| conditionnel passé | conditionnel | j'{4:aurais} {5:fini} · elle {4:serait} {5:partie} |
| subjonctif passé | subjonctif | que j'{4:aie} {5:fini} · qu'elle {4:soit} {5:partie} |
> Seul l'auxiliaire change de temps ; le participe ne bouge pas. Avec être, il s'accorde avec le sujet.
! Une action avant une autre, au passé : le plus-que-parfait. Quand je suis arrivé, le bus ~~est déjà parti~~ ++était déjà parti++.
= Si j'avais su, j'{4:aurais} {5:pris} un autre vol. — If I'd known, I'd have taken another flight.
= Je t'appellerai dès que j'{4:aurai} {5:reçu} la réponse. — I'll call you as soon as I've had the answer.

# Les irréguliers : futur et conditionnel
>> être, avoir, aller, faire :: l'infinitif | ser-, aur-, ir-, fer- :: un radical à apprendre | -ai, -ais :: futur ou conditionnel
| Infinitif | Futur | Conditionnel |
|---|---|---|
| être | je {2:ser}{3:**ai**} | je {2:ser}{3:**ais**} |
| avoir | j'{2:aur}{3:**ai**} | j'{2:aur}{3:**ais**} |
| aller | j'{2:ir}{3:**ai**} | j'{2:ir}{3:**ais**} |
| faire | je {2:fer}{3:**ai**} | je {2:fer}{3:**ais**} |
| pouvoir | je {2:pourr}{3:**ai**} | je {2:pourr}{3:**ais**} |
| vouloir | je {2:voudr}{3:**ai**} | je {2:voudr}{3:**ais**} |
| savoir | je {2:saur}{3:**ai**} | je {2:saur}{3:**ais**} |
| devoir | je {2:devr}{3:**ai**} | je {2:devr}{3:**ais**} |
| venir, tenir | je {2:viendr}{3:**ai**} · je {2:tiendr}{3:**ai**} | je {2:viendr}{3:**ais**} · je {2:tiendr}{3:**ais**} |
| voir | je {2:verr}{3:**ai**} | je {2:verr}{3:**ais**} |
| envoyer | j'{2:enverr}{3:**ai**} | j'{2:enverr}{3:**ais**} |
| recevoir | je {2:recevr}{3:**ai**} | je {2:recevr}{3:**ais**} |
| courir, mourir | je {2:courr}{3:**ai**} · je {2:mourr}{3:**ai**} | je {2:courr}{3:**ais**} · je {2:mourr}{3:**ais**} |
| falloir | il {2:faudr}{3:**a**} | il {2:faudr}{3:**ait**} |
| valoir | il {2:vaudr}{3:**a**} | il {2:vaudr}{3:**ait**} mieux |
> Deux r : pouvoir, voir, envoyer, courir, mourir → pourrai, verrai, enverrai, courrai, mourrai.
> Le conditionnel prend toujours le radical du futur : si tu sais l'un, tu sais l'autre.
= Je {2:pourr}{3:**ais**} commencer dès le mois prochain. — I could start as early as next month.
= Il {2:vaudr}{3:**ait**} mieux réserver avant l'été. — It would be better to book before the summer.

# Les irréguliers : subjonctif
>> être, avoir, aller, faire :: l'infinitif | sois, aie, aill-, fass- :: à apprendre par cœur | -e -es -e -ions -iez -ent :: les terminaisons, sauf être et avoir
| Infinitif | que je (j')… | que nous… |
|---|---|---|
| être | {2:sois} | {2:soyons} |
| avoir | {2:aie} | {2:ayons} |
| aller | {2:aill}{3:**e**} | {2:all}{3:**ions**} |
| faire | {2:fass}{3:**e**} | {2:fass}{3:**ions**} |
| pouvoir | {2:puiss}{3:**e**} | {2:puiss}{3:**ions**} |
| savoir | {2:sach}{3:**e**} | {2:sach}{3:**ions**} |
| vouloir | {2:veuill}{3:**e**} | {2:voul}{3:**ions**} |
| falloir | qu'il {2:faill}{3:**e**} | — |
> Être et avoir ont leurs propres terminaisons : que je sois, tu sois, il soit, nous soyons, vous soyez, ils soient · que j'aie, tu aies, il ait, nous ayons, vous ayez, ils aient.
## Deux radicaux, mais la règle marche
| Infinitif | ils… | que je… | que nous… |
|---|---|---|---|
| venir | viennent | {2:vienn}{3:**e**} | {2:ven}{3:**ions**} |
| prendre | prennent | {2:prenn}{3:**e**} | {2:pren}{3:**ions**} |
| devoir | doivent | {2:doiv}{3:**e**} | {2:dev}{3:**ions**} |
| recevoir | reçoivent | {2:reçoiv}{3:**e**} | {2:recev}{3:**ions**} |
| boire | boivent | {2:boiv}{3:**e**} | {2:buv}{3:**ions**} |
| voir | voient | {2:voi}{3:**e**} | {2:voy}{3:**ions**} |
| croire | croient | {2:croi}{3:**e**} | {2:croy}{3:**ions**} |
= Il faut que tu {2:fass}{3:**es**} ta demande avant la fin du mois. — You have to apply before the end of the month.
= Je ne pense pas qu'il {2:puiss}{3:**e**} venir demain. — I don't think he can come tomorrow.

# Les participes passés irréguliers
| Finale | Verbes |
|---|---|
| -u | avoir → **eu** · pouvoir → **pu** · savoir → **su** · voir → **vu** · vouloir → **voulu** · devoir → **dû** · falloir → **fallu** · venir → **venu** · tenir → **tenu** · lire → **lu** · boire → **bu** · croire → **cru** · recevoir → **reçu** · connaître → **connu** · vivre → **vécu** · courir → **couru** |
| -is | prendre → **pris** · apprendre → **appris** · comprendre → **compris** · mettre → **mis** · promettre → **promis** |
| -it | faire → **fait** · dire → **dit** · écrire → **écrit** · conduire → **conduit** · traduire → **traduit** |
| -ert | ouvrir → **ouvert** · offrir → **offert** · découvrir → **découvert** · souffrir → **souffert** |
| à part | être → **été** · naître → **né** · mourir → **mort** · craindre → **craint** · peindre → **peint** |
> Au féminin, -is, -it et -ert s'entendent : la lettre que j'ai écri**te**, la décision qu'il a pri**se**, la porte qu'elle a ouver**te**.

# Toutes les terminaisons d'un coup d'œil
| Personne | Imparfait | Futur | Conditionnel | Subjonctif |
|---|---|---|---|---|
| je | -ais | -ai | -ais | -e |
| tu | -ais | -as | -ais | -es |
| il, elle, on | -ait | -a | -ait | -e |
| nous | -ions | -ons | -ions | -ions |
| vous | -iez | -ez | -iez | -iez |
| ils, elles | -aient | -ont | -aient | -ent |
> -ions et -iez reviennent trois fois : imparfait, conditionnel, subjonctif. Le futur garde -ons et -ez, comme le présent.`,
    },
    {
      id: "phrases-si", tag: "grammaire", for: "grammar.si",
      title: "Les phrases avec si", en: "The three kinds of if-clause",
      body: `# Les trois types
| Type | Si + … | Verbe principal | Exemple |
|---|---|---|---|
| 1 · le réel | présent | futur, présent ou impératif | Si tu ==viens==, on ==ira== au parc. |
| 2 · l'hypothèse | imparfait | conditionnel présent | Si j'==avais== le temps, je ==voyagerais==. |
| 3 · le regret | plus-que-parfait | conditionnel passé | Si j'==avais su==, je ne ==serais== pas ==venu==. |
> « Les si n'aiment pas les -rais » : le conditionnel va dans l'autre moitié de la phrase.
! Jamais de conditionnel ni d'infinitif après si : ~~si j'aurais~~ ++si j'avais++ · ~~si on vivre~~ ++si on vivait++.
- si + il, ils → **s'il**, **s'ils** ; mais si elle, si on, sans élision.
- La phrase peut commencer par l'autre moitié : on ira au parc si tu viens.

# Pour argumenter (Tâche 3, oral Tâche 3)
= Si les loyers étaient encadrés, plus de familles pourraient rester en ville. — If rents were capped, more families could stay in the city.
= Si le gouvernement avait investi plus tôt, la crise aurait été évitée. — If the government had invested sooner, the crisis would have been avoided.
= Si vous habitez loin du travail, le télétravail vous fera gagner du temps. — If you live far from work, remote work will save you time.`,
    },
    {
      id: "accord-participe", tag: "grammaire", for: "grammar.pronominaux",
      title: "L'accord du participe passé", en: "When the past participle agrees",
      body: `# Avec être : accord avec le sujet
= Elle est parti==e== à 8 h. — She left at 8.
= Nous sommes arrivé==s== hier. — We arrived yesterday.
> Être pour les verbes de mouvement de « DR MRS VANDERTRAMP » (devenir, revenir, monter, rester, sortir…) et pour tous les verbes pronominaux.

# Avec avoir : accord avec le COD placé avant
| Phrase | Où est le COD ? | Accord ? |
|---|---|---|
| J'ai envoyé **les lettres**. | après le verbe | non : envoyé |
| Je **les** ai envoyées. | avant : les | oui : envoyées |
| Les lettres **que** j'ai envoyées… | avant : que | oui : envoyées |
| Elle a mangé. | pas de COD | non : mangé |

# Les verbes pronominaux
- En général, accord avec le sujet : elle s'est ==levée==, ils se sont ==rencontrés==.
- Pas d'accord si un COD suit le verbe : elle s'est ==lavé== les mains (le COD, c'est les mains).
- Pas d'accord quand se est un COI : elles se sont ==parlé== (parler **à** quelqu'un).
- se rendre compte : nous nous sommes ==rendu== compte (compte est le COD).
! Tes erreurs fréquentes : ~~nous avons rendu compte~~ ++nous nous sommes rendu compte++ · ~~elle a inquiété~~ ++elle s'est inquiétée++. Un verbe pronominal garde son se et prend être.`,
    },
    {
      id: "pronoms-relatifs", tag: "grammaire", for: "grammar.relatifs",
      title: "Les pronoms relatifs", en: "qui, que, dont, où, lequel",
      body: `# Choisir le bon pronom
| Il remplace… | Pronom | Exemple |
|---|---|---|
| le sujet | qui | Le voisin ==qui== habite en face est infirmier. |
| le COD | que (qu') | Le livre ==que== je lis est passionnant. |
| de + nom | dont | Le projet ==dont== je te parle avance bien. |
| un lieu, un moment | où | La ville ==où== j'habite · le jour ==où== je suis arrivé |
| préposition + chose | lequel, laquelle, lesquels, lesquelles | L'outil avec ==lequel== je travaille |
| à + lequel | auquel, à laquelle, auxquels, auxquelles | Le poste ==auquel== je postule |
| de + lequel, après une locution | duquel, de laquelle, desquels, desquelles | Le parc près ==duquel== j'habite |
> dont = de + … : parler **de**, avoir besoin **de**, être fier **de** → dont.
> Pour une personne après une préposition, on préfère qui : la collègue **avec qui** je travaille.
! Une phrase complexe vaut mieux que deux courtes : ~~J'ai un ami. Il habite à Québec.~~ ++J'ai un ami qui habite à Québec.++

# Pour écrire plus B2
= Voici l'entreprise dans laquelle j'aimerais travailler. — This is the company I'd like to work for.
= C'est une question à laquelle il est difficile de répondre. — It's a question that's hard to answer.
= Le quartier où nous vivons manque d'espaces verts. — The neighbourhood we live in lacks green space.`,
    },
    {
      id: "connecteurs", tag: "ecrit", for: "writing.t2",
      title: "Les connecteurs logiques", en: "Linking words by job, everyday and formal",
      body: `# Par fonction
| Pour… | Courant | Soutenu (EE, oral Tâche 3) |
|---|---|---|
| ajouter | et, aussi, de plus | en outre, par ailleurs |
| opposer | mais, par contre | en revanche, cependant, toutefois, néanmoins |
| concéder | même si, malgré (+ nom) | bien que (+ subj.), certes… mais, il n'en demeure pas moins que |
| expliquer la cause | parce que, car, comme | puisque, étant donné que, en raison de (+ nom) |
| tirer une conséquence | donc, alors, c'est pourquoi | par conséquent, ainsi, dès lors |
| exprimer un but | pour (+ inf.), pour que | afin de (+ inf.), afin que (+ subj.) |
| conclure | enfin, pour finir | en définitive, tout bien considéré |
> Un connecteur par idée, pas trois par phrase : le correcteur note la cohérence, pas l'accumulation.
! **malgré** + nom, **bien que** + subjonctif : ~~malgré qu'il pleut~~ ++bien qu'il pleuve++ · ++malgré la pluie++.

# À ne pas confondre
- **en effet** confirme ou explique ce qui précède ; il n'oppose rien.
- **d'une part… d'autre part** ajoute deux aspects ; **d'un côté… de l'autre** oppose deux points de vue.
- **cependant, toutefois, néanmoins** ouvrent la phrase ou suivent le verbe : il est, toutefois, trop tôt pour conclure.

# En contexte
= Le télétravail fait gagner du temps. En revanche, il peut isoler certains salariés. — Remote work saves time. On the other hand, it can isolate some employees.
= Bien que le loyer soit élevé, l'appartement reste très demandé ; par conséquent, il faut se décider vite. — Although the rent is high, the flat is in great demand; consequently, you have to decide fast.`,
    },
    {
      id: "tache3-plan", tag: "ecrit", for: "writing.t3",
      title: "Le plan de la Tâche 3", en: "Compare two documents, then take a position",
      body: `# Le format
| Partie | Ce qu'on fait | Mots |
|---|---|---|
| 1 · Comparer | présenter le point de vue de chaque document, sans donner son avis | 40–60 |
| 2 · Prendre position | donner son opinion sur la question, avec des arguments et un exemple | 80–120 |
| Total | deux paragraphes séparés par une ligne vide | 120–180 |
! Tes erreurs passées : la comparaison des deux documents oubliée deux fois, un texte au-dessus de 180 mots et un sous 120. Un texte qui ne respecte pas la consigne ou le nombre de mots peut être noté A1 non atteint.

# Partie 1 : comparer
- Le thème : Les deux documents traitent de…
- Le document 1 : Selon le premier document, … / L'auteur du premier texte affirme que…
- Le document 2 : En revanche, le second document souligne que… / À l'inverse, …
- Un point commun, s'il y en a un : Les deux textes s'accordent sur…
> Reformuler, ne pas recopier : changer les mots des documents montre ton vocabulaire.

# Partie 2 : prendre position
- Annoncer son avis : Pour ma part, je suis convaincu(e) que… / À mon sens, …
- Un argument et un exemple : D'abord, … Par exemple, …
- Un deuxième argument : De plus, … / En outre, …
- Nuancer : Certes, … mais… / Il n'en demeure pas moins que…
- Conclure : En définitive, … / Tout bien considéré, …
> Compte tes mots à la fin de chaque partie, pas seulement à la fin du texte.`,
    },
    {
      id: "tache1-message", tag: "ecrit", for: "writing.t1",
      title: "Ouvrir et fermer un message", en: "Tâche 1: the right register, start to finish",
      body: `# Tu ou vous ?
| Destinataire | Registre | Saluer | Prendre congé |
|---|---|---|---|
| un ami, un proche | tu, familier | Salut Léa ! · Coucou ! | À bientôt ! · Bises · Je t'embrasse |
| un collègue | tu ou vous, courant | Bonjour Sophie, | Bonne journée · À demain |
| un voisin, un propriétaire | vous, poli | Bonjour Madame Tremblay, | Merci d'avance · Bien cordialement |
| un service, un inconnu | vous, formel | Madame, Monsieur, | Je vous prie d'agréer mes salutations distinguées. |
! Garde le même registre du début à la fin : pas de ~~Salut Monsieur~~, et pas de mélange de tu et de vous.

# Le plan d'un message (60–120 mots)
- Saluer le destinataire par son nom.
- Dire pourquoi on écrit : Je t'écris pour te raconter… / Je vous écris au sujet de…
- Décrire, raconter ou expliquer ce que demande la consigne : qui, quoi, où, quand.
- Proposer ou demander quelque chose : Tu serais libre samedi ? / Pourriez-vous… ?
- Prendre congé, puis signer.
> Coche chaque point de la consigne : un point oublié se voit tout de suite.

# Formules utiles
= Ça fait longtemps ! J'espère que tout va bien de ton côté. — It's been a while! I hope all is well with you.
= Je t'écris pour t'inviter à mon anniversaire samedi prochain. — I'm writing to invite you to my birthday next Saturday.
= Je vous écris au sujet du bruit dans l'immeuble. — I'm writing to you about the noise in the building.
= Pourriez-vous me répondre avant vendredi ? — Could you reply before Friday?
= Dis-moi si tu es libre, ça me ferait très plaisir. — Let me know if you're free; I'd love that.`,
    },
  ];
})();
