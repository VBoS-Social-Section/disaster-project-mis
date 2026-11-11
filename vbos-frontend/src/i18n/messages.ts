/**
 * Interface text in Vanuatu's three official languages.
 *
 * English is the source. French and Bislama cover the dashboard's frame (header, panels,
 * event and impact summaries, report); anything not listed here still shows in English.
 * The Bislama text is a first draft and should be reviewed by a native speaker before it
 * is relied on in official communication.
 */
export const en = {
  "app.title": "Disaster Risk Management Information System",
  "app.skipToMap": "Skip to map",
  "gov.officialSystem": "Official government information system",

  "lang.label": "Language",
  "lowData.label": "Low-data mode",
  "lowData.help": "Loads fewer and lighter map tiles. Use on a slow or metered connection.",
  "lowData.auto": "Switched on automatically: slow connection detected",
  "sync.lastSynced": "Data last synced {time}",
  "sync.never": "Data not synced yet",
  "sync.offline": "Offline – showing saved data",

  "picker.year": "Year",
  "picker.event": "Event",
  "picker.groupLabel": "Year and disaster event",
  "picker.noEvent": "No event (baseline)",
  "picker.eventsIn": "Events in {year}",
  "picker.noneRecorded": "No events recorded for {year}.",
  "picker.scenarios": "Scenarios",
  "picker.loading": "Loading…",
  "picker.loadError": "Could not load disaster events",
  "picker.oneEvent": "1 event",
  "picker.manyEvents": "{n} events",
  "picker.yearScenarioHint":
    "Scenarios are not tied to a year. The year still selects which baseline figures are shown.",

  "area.groupLabel": "Province and area council",
  "area.province": "Province",
  "area.council": "Area council",
  "area.allProvinces": "All provinces",
  "area.allCouncils": "All area councils",
  "area.nProvinces": "{n} provinces",
  "area.nCouncils": "{n} area councils",
  "area.chooseProvinceFirst": "Choose a province first",

  "panel.dataLayers": "Data layers",
  "panel.context": "Context",
  "panel.selectSector": "Select sector…",
  "panel.sector": "Sector",
  "panel.userManual": "User manual",

  "event.scenario": "Scenario",
  "event.event": "Event",
  "event.noFootprint": "No hazard footprint layer has been uploaded for this event.",
  "scenario.tag": "Scenario – not a real event",
  "scenario.explain":
    "This is a modelled scenario for planning and exercises. It does not describe a real disaster.",

  "impact.title": "Impact summary",
  "impact.national": "Vanuatu",
  "impact.headline": "{area}: {items} in the Category {n} zone.",
  "impact.headlineNone": "{area}: no area council is in a cyclone wind zone.",
  "impact.councils": "Area councils by category",
  "impact.oneCouncil": "1 area council",
  "impact.manyCouncils": "{n} area councils",
  "impact.exposure": "Exposure by category",
  "impact.exposureNote": "Baseline figures counted by the category of their area council.",
  "impact.notAffected": "Not affected",
  "impact.category": "Category {n}",
  "impact.catShort": "Cat. {n}",
  "impact.and": "and",
  "impact.zoneSentence": "{name}: this area is in the {category} wind zone.",

  "legend.title": "Legend",
  "legend.clearAll": "Remove all layers",
  "legend.details": "Opacity and details",

  "download.button": "Download data",
  "download.caption":
    "Active layers for the selected area and year. Tables as Excel, map layers as GeoJSON.",
  "download.empty": "Switch on a data layer to download it.",

  "report.button": "Situation report",
  "report.help": "Opens the print dialog. Choose “Save as PDF” to make a file you can send.",
  "report.title": "Situation report",
  "report.area": "Area",
  "report.year": "Baseline year",
  "report.generated": "Generated",
  "report.by": "by",
  "report.keyFigures": "Key figures",
  "report.layers": "Map layers shown",
  "report.sources": "Sources",
  "report.noEvent": "No event selected (baseline data)",
  "report.disclaimer":
    "Figures are estimates from the data loaded in DRMIS at the time of printing and should be verified before operational use.",

  "pwa.install": "Install app",
  "pwa.installHint": "Add DRMIS to this device for quicker access and offline use.",
  "pwa.reload": "Reload page",
  "pwa.updateReady": "A new version of DRMIS is ready.",
  "pwa.dismiss": "Not now",

  "footer.dataAsOf": "Data as of {date}",
  "footer.sources": "Sources",
} as const;

export type MessageKey = keyof typeof en;
type Messages = Partial<Record<MessageKey, string>>;

export const fr: Messages = {
  "app.title": "Système d’information pour la gestion des risques de catastrophe",
  "app.skipToMap": "Aller à la carte",
  "gov.officialSystem": "Système d’information officiel du gouvernement",

  "lang.label": "Langue",
  "lowData.label": "Mode économie de données",
  "lowData.help":
    "Charge moins de tuiles de carte, et plus légères. À utiliser avec une connexion lente ou limitée.",
  "lowData.auto": "Activé automatiquement : connexion lente détectée",
  "sync.lastSynced": "Dernière synchronisation des données : {time}",
  "sync.never": "Données pas encore synchronisées",
  "sync.offline": "Hors ligne – données enregistrées affichées",

  "picker.year": "Année",
  "picker.event": "Événement",
  "picker.groupLabel": "Année et catastrophe",
  "picker.noEvent": "Aucun événement (référence)",
  "picker.eventsIn": "Événements de {year}",
  "picker.noneRecorded": "Aucun événement enregistré pour {year}.",
  "picker.scenarios": "Scénarios",
  "picker.loading": "Chargement…",
  "picker.loadError": "Impossible de charger les événements",
  "picker.oneEvent": "1 événement",
  "picker.manyEvents": "{n} événements",
  "picker.yearScenarioHint":
    "Les scénarios ne sont pas liés à une année. L’année détermine toujours les données de référence affichées.",

  "area.groupLabel": "Province et conseil de zone",
  "area.province": "Province",
  "area.council": "Conseil de zone",
  "area.allProvinces": "Toutes les provinces",
  "area.allCouncils": "Tous les conseils de zone",
  "area.nProvinces": "{n} provinces",
  "area.nCouncils": "{n} conseils de zone",
  "area.chooseProvinceFirst": "Choisissez d’abord une province",

  "panel.dataLayers": "Couches de données",
  "panel.context": "Contexte",
  "panel.selectSector": "Choisir un secteur…",
  "panel.sector": "Secteur",
  "panel.userManual": "Manuel d’utilisation",

  "event.scenario": "Scénario",
  "event.event": "Événement",
  "event.noFootprint": "Aucune couche d’emprise de l’aléa n’a été chargée pour cet événement.",
  "scenario.tag": "Scénario – pas un événement réel",
  "scenario.explain":
    "Scénario modélisé pour la planification et les exercices. Il ne décrit pas une catastrophe réelle.",

  "impact.title": "Synthèse de l’impact",
  "impact.national": "Vanuatu",
  "impact.headline": "{area} : {items} en zone de catégorie {n}.",
  "impact.headlineNone": "{area} : aucun conseil de zone ne se trouve en zone de vent cyclonique.",
  "impact.councils": "Conseils de zone par catégorie",
  "impact.oneCouncil": "1 conseil de zone",
  "impact.manyCouncils": "{n} conseils de zone",
  "impact.exposure": "Exposition par catégorie",
  "impact.exposureNote":
    "Données de référence comptées selon la catégorie de leur conseil de zone.",
  "impact.notAffected": "Non touché",
  "impact.category": "Catégorie {n}",
  "impact.catShort": "Cat. {n}",
  "impact.and": "et",
  "impact.zoneSentence": "{name} : cette zone se trouve en zone de vent de {category}.",

  "legend.title": "Légende",
  "legend.clearAll": "Retirer toutes les couches",
  "legend.details": "Opacité et détails",

  "download.button": "Télécharger les données",
  "download.caption":
    "Couches actives pour la zone et l’année choisies. Tableaux en Excel, couches cartographiques en GeoJSON.",
  "download.empty": "Activez une couche de données pour la télécharger.",

  "report.button": "Rapport de situation",
  "report.help":
    "Ouvre la fenêtre d’impression. Choisissez « Enregistrer au format PDF » pour obtenir un fichier à envoyer.",
  "report.title": "Rapport de situation",
  "report.area": "Zone",
  "report.year": "Année de référence",
  "report.generated": "Généré le",
  "report.by": "par",
  "report.keyFigures": "Chiffres clés",
  "report.layers": "Couches affichées",
  "report.sources": "Sources",
  "report.noEvent": "Aucun événement sélectionné (données de référence)",
  "report.disclaimer":
    "Les chiffres sont des estimations issues des données chargées dans le DRMIS au moment de l’impression et doivent être vérifiés avant tout usage opérationnel.",

  "pwa.install": "Installer l’application",
  "pwa.installHint":
    "Ajoutez le DRMIS à cet appareil pour un accès plus rapide et une utilisation hors ligne.",
  "pwa.reload": "Recharger la page",
  "pwa.updateReady": "Une nouvelle version du DRMIS est prête.",
  "pwa.dismiss": "Plus tard",

  "footer.dataAsOf": "Données au {date}",
  "footer.sources": "Sources",
};

export const bi: Messages = {
  "app.title": "Sistem blong Infomesen blong Manejem Risk blong Disasta",
  "app.skipToMap": "Go stret long map",
  "gov.officialSystem": "Ofisol sistem blong infomesen blong gavman",

  "lang.label": "Lanwis",
  "lowData.label": "Mod blong sevem data",
  "lowData.help": "I lodem smol map nomo. Yusum taem intanet i slo o i sas.",
  "lowData.auto": "I on hem wan: intanet i slo",
  "sync.lastSynced": "Las taem data i kam: {time}",
  "sync.never": "Data i no kam yet",
  "sync.offline": "No gat intanet – data we i sev nomo",

  "picker.year": "Yia",
  "picker.event": "Disasta",
  "picker.groupLabel": "Yia mo disasta",
  "picker.noEvent": "No gat disasta (nomol data)",
  "picker.eventsIn": "Ol disasta long {year}",
  "picker.noneRecorded": "No gat disasta we i rekod long {year}.",
  "picker.scenarios": "Ol senario",
  "picker.loading": "I stap lod…",
  "picker.loadError": "I no save lodem ol disasta",
  "picker.oneEvent": "1 disasta",
  "picker.manyEvents": "{n} disasta",
  "picker.yearScenarioHint":
    "Senario i no blong wan yia. Yia i stap jusum nomol data we i soa.",

  "area.groupLabel": "Provins mo eria kaonsel",
  "area.province": "Provins",
  "area.council": "Eria kaonsel",
  "area.allProvinces": "Evri provins",
  "area.allCouncils": "Evri eria kaonsel",
  "area.nProvinces": "{n} provins",
  "area.nCouncils": "{n} eria kaonsel",
  "area.chooseProvinceFirst": "Jusum wan provins fastaem",

  "panel.dataLayers": "Ol leya blong data",
  "panel.context": "Infomesen",
  "panel.selectSector": "Jusum sekta…",
  "panel.sector": "Sekta",
  "panel.userManual": "Buk blong yusum",

  "event.scenario": "Senario",
  "event.event": "Disasta",
  "event.noFootprint": "No gat leya blong hasad we oli putum yet from disasta ia.",
  "scenario.tag": "Senario – i no wan tru disasta",
  "scenario.explain":
    "Hemia wan senario blong plan mo trening nomo. Hem i no wan tru disasta.",

  "impact.title": "Sot ripot blong damej",
  "impact.national": "Vanuatu",
  "impact.headline": "{area}: {items} oli stap long eria blong Kategori {n}.",
  "impact.headlineNone": "{area}: no gat eria kaonsel we i stap long eria blong win blong saeklon.",
  "impact.councils": "Ol eria kaonsel long wanwan kategori",
  "impact.oneCouncil": "1 eria kaonsel",
  "impact.manyCouncils": "{n} eria kaonsel",
  "impact.exposure": "Namba long wanwan kategori",
  "impact.exposureNote": "Nomol namba, oli kaontem folem kategori blong eria kaonsel blong olgeta.",
  "impact.notAffected": "I no kasem",
  "impact.category": "Kategori {n}",
  "impact.catShort": "Kat. {n}",
  "impact.and": "mo",
  "impact.zoneSentence": "{name}: eria ia i stap long eria blong win blong {category}.",

  "legend.title": "Mak blong map",
  "legend.clearAll": "Tekemaot evri leya",
  "legend.details": "Klia mo moa infomesen",

  "download.button": "Daonlodem data",
  "download.caption":
    "Ol leya we oli on, long eria mo yia we yu jusum. Tebol long Excel, leya blong map long GeoJSON.",
  "download.empty": "Onem wan leya blong data blong daonlodem.",

  "report.button": "Ripot blong situesen",
  "report.help": "I openem print. Jusum “Save as PDF” blong mekem wan fael blong sendem.",
  "report.title": "Ripot blong situesen",
  "report.area": "Eria",
  "report.year": "Yia blong nomol data",
  "report.generated": "Oli mekem long",
  "report.by": "",
  "report.keyFigures": "Ol bigfala namba",
  "report.layers": "Ol leya long map",
  "report.sources": "Data i kam long",
  "report.noEvent": "No gat disasta we yu jusum (nomol data)",
  "report.disclaimer":
    "Ol namba ia oli wan estimet nomo long data we i stap long DRMIS taem yu print, mo oli mas jekem bifo oli yusum.",

  "pwa.install": "Instolem ap",
  "pwa.installHint": "Putum DRMIS long fon o kompiuta ia blong openem kwik mo yusum taem i no gat intanet.",
  "pwa.reload": "Lodem pej bakegen",
  "pwa.updateReady": "Wan niu vesen blong DRMIS i redi.",
  "pwa.dismiss": "I no naoia",

  "footer.dataAsOf": "Data long {date}",
  "footer.sources": "Data i kam long",
};
