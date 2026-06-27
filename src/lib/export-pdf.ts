"use client";

import jsPDF from "jspdf";

// ── PDF Label translations ────────────────────────────────────────────────

export interface PDFLabels {
  battleAnalysisReport: string;
  competitiveGuide: string;
  yourTeam: string;
  customTeam: string;
  winRate: string;
  games: string;
  wins: string;
  losses: string;
  avgTurns: string;
  executiveSummary: string;
  leadSelectionGuide: string;
  leadMuted: string;
  leadPair: string;
  archetypeMatchupStudy: string;
  archetypeMuted: string;
  teams: string;
  threatScoutingReport: string;
  threatMuted: string;
  pokemon: string;
  seen: string;
  lossRate: string;
  severity: string;
  severityCritical: string;
  severityHigh: string;
  severityModerate: string;
  fullMatchupBreakdown: string;
  matchupMuted: string;
  opponentTeam: string;
  verdict: string;
  strategyGamePlan: string;
  strategyMuted: string;
  weaknessesCommonMistakes: string;
  weaknessesMuted: string;
  improvementProposals: string;
  proposalsMuted: string;
  proposal: string;
  // wrLabel
  wrDominant: string;
  wrStrong: string;
  wrFavourable: string;
  wrEven: string;
  wrSlightlyWeak: string;
  wrUnfavourable: string;
  wrVeryWeak: string;
  // Team Tester specific
  matchupStudyReport: string;
  teamVsTeamDeepDive: string;
  team1: string;
  team2: string;
  team1WinRate: string;
  matchupOverview: string;
  leadOpeningMuted: string;
  speedTierComparison: string;
  speedMuted: string;
  base: string;
  min: string;
  neutral: string;
  max: string;
  scarf: string;
  tailwind: string;
  typeCoverageWeaknesses: string;
  typeMuted: string;
  team1YourTeam: string;
  team2Opponent: string;
  weakTo: string;
  resists: string;
  cantHit: string;
  teamIdentityRoleMap: string;
  roleMuted: string;
  archetype: string;
  winCondition: string;
  primaryRole: string;
  additionalRoles: string;
  teamSynergyScore: string;
  pokemonImpactAnalysis: string;
  impactMuted: string;
  wrWithout: string;
  matchupInsightsCoaching: string;
  insightsMuted: string;
  whatYouCanDoNext: string;
  strategyFlowchart: string;
  flowchartMuted: string;
  keyThreats: string;
  backupPlan: string;
  team1Roles: string;
  team2Roles: string;
  team1Archetype: string;
  team2Archetype: string;
  noItem: string;
  // Coaching paragraph templates ({0}, {1}, etc. = placeholders)
  bbOverview: string;
  bbLeadBest: string;
  bbLeadGap: string;
  bbLeadFlexible: string;
  bbArchBest: string;
  bbArchWorst: string;
  bbArchCoinFlip: string;
  bbThreatSevere: string;
  bbThreatNotable: string;
  bbThreatManageable: string;
  bbMistakeLead: string;
  bbPropTech: string;
  bbPropAnswer: string;
  bbPropLeadFlex: string;
  bbPropFast: string;
  bbPropSlow: string;
  ttOverview: string;
  ttVerdictT1: string;
  ttVerdictT2: string;
  ttVerdictClose: string;
  ttImpactMVP: string;
  ttImpactWeakest: string;
  ttImpactAllPositive: string;
  ttPropRough: string;
  ttPropLeadSaves: string;
  ttPropStrong: string;
  ttLeadBestPara: string;
  ttLeadMakeOrBreak: string;
  ttLeadFlexible: string;
  ttSpeedFaster: string;
  ttSpeedTied: string;
  ttSpeedHuge: string;
  ttSpeedManageable: string;
  ttTypeWeakness: string;
  ttRoleMissing: string;
}

export const PDF_LABELS_EN: PDFLabels = {
  battleAnalysisReport: "Battle Analysis Report",
  competitiveGuide: "Champions Lab  •  Your Competitive VGC Training Guide",
  yourTeam: "YOUR TEAM",
  customTeam: "Custom Team",
  winRate: "Win Rate",
  games: "Games",
  wins: "Wins",
  losses: "Losses",
  avgTurns: "Avg Turns",
  executiveSummary: "Executive Summary",
  leadSelectionGuide: "Lead Selection Guide",
  leadMuted: "Your opening two Pokémon set the tempo of the game. The right lead can turn a 45% matchup into a 60% one.",
  leadPair: "Lead Pair",
  archetypeMatchupStudy: "Archetype Matchup Study",
  archetypeMuted: "How your team performs against each competitive archetype. Use this to understand your strengths and plan around your blind spots.",
  teams: "teams",
  threatScoutingReport: "Threat Scouting Report",
  threatMuted: "These are the opposing Pokémon that gave your team the most trouble. Loss rate = how often you lost when facing this Pokémon.",
  pokemon: "Pokémon",
  seen: "Seen",
  lossRate: "Loss Rate",
  severity: "Severity",
  severityCritical: "CRITICAL",
  severityHigh: "High",
  severityModerate: "Moderate",
  fullMatchupBreakdown: "Full Matchup Breakdown",
  matchupMuted: "Detailed results against every opponent team in the simulation pool. Study your losing matchups to find patterns.",
  opponentTeam: "Opponent Team",
  verdict: "Verdict",
  strategyGamePlan: "Strategy & Game Plan",
  strategyMuted: "Key strategic insights derived from your simulation data. Apply these in your next tournament.",
  weaknessesCommonMistakes: "Weaknesses & Common Mistakes",
  weaknessesMuted: "Problems identified in your team's performance. Addressing these will yield the biggest improvement.",
  improvementProposals: "Improvement Proposals",
  proposalsMuted: "Concrete suggestions to push your team to the next tier. Prioritise the first item — it will have the biggest impact.",
  proposal: "Proposal",
  wrDominant: "Dominant",
  wrStrong: "Strong",
  wrFavourable: "Favourable",
  wrEven: "Even",
  wrSlightlyWeak: "Slightly Weak",
  wrUnfavourable: "Unfavourable",
  wrVeryWeak: "Very Weak",
  matchupStudyReport: "Matchup Study Report",
  teamVsTeamDeepDive: "Champions Lab  •  Team vs Team Deep Dive",
  team1: "TEAM 1",
  team2: "TEAM 2",
  team1WinRate: "Team 1 Win Rate",
  matchupOverview: "Matchup Overview",
  leadOpeningMuted: "The leads you pick define the early game. Against this specific opponent, here are your best openings.",
  speedTierComparison: "Speed Tier Comparison",
  speedMuted: "Knowing who moves first is everything in Doubles. This table shows each Pokémon's speed at key benchmarks — use it to decide whether you need Tailwind, Trick Room, or Choice Scarf.",
  base: "Base",
  min: "Min",
  neutral: "Neutral",
  max: "Max",
  scarf: "Scarf",
  tailwind: "Tailwind",
  typeCoverageWeaknesses: "Type Coverage & Weaknesses",
  typeMuted: "Defensive vulnerabilities and offensive blind spots. Knowing what types threaten your team — and what you can't hit — is key for team preview decisions.",
  team1YourTeam: "TEAM 1 — YOUR TEAM",
  team2Opponent: "TEAM 2 — OPPONENT",
  weakTo: "Weak to:",
  resists: "Resists:",
  cantHit: "Can't hit:",
  teamIdentityRoleMap: "Team Identity & Role Map",
  roleMuted: "Understanding what each Pokémon does and how the teams are built helps you predict the opponent's game plan.",
  archetype: "ARCHETYPE",
  winCondition: "WIN CONDITION",
  primaryRole: "Primary Role",
  additionalRoles: "Additional Roles",
  teamSynergyScore: "Team Synergy Score:",
  pokemonImpactAnalysis: "Pokémon Impact Analysis",
  impactMuted: "Each Pokémon was removed and the matchup re-simulated to measure its individual contribution. Positive impact = your team is stronger with it.",
  wrWithout: "WR without:",
  matchupInsightsCoaching: "Matchup Insights & Coaching",
  insightsMuted: "Key observations from the simulation that can help you play this matchup better.",
  whatYouCanDoNext: "What You Can Do Next",
  strategyFlowchart: "Strategy Game Plan",
  flowchartMuted: "A turn-by-turn decision tree for your best lead combination. Follow this flowchart during the game.",
  keyThreats: "Key Threats:",
  backupPlan: "Backup Plan:",
  team1Roles: "TEAM 1 ROLES",
  team2Roles: "TEAM 2 ROLES",
  team1Archetype: "Team 1 Archetype:",
  team2Archetype: "Team 2 Archetype:",
  noItem: "no item",
  // Coaching paragraphs
  bbOverview: "This team consists of {0}. Across {1} simulated battles against the current competitive metagame, it achieved a {2}% win rate ({3}W–{4}L) with an average game length of {5} turns, earning a {6} rating.",
  bbLeadBest: "Your strongest opening is {0} + {1} at {2}% over {3} games. This should be your default lead in tournament play unless you have specific intel on your opponent's team.",
  bbLeadGap: "There's a {0}% gap between your best and worst leads. Lead selection is critical for this team — study the matchup before choosing.",
  bbLeadFlexible: "Your leads have similar win rates (only {0}% spread), which means this team is flexible. You can adapt your leads to the opponent's composition freely.",
  bbArchBest: "You excel against {0} teams ({1}%) — this matchup is in your comfort zone and you should play confidently.",
  bbArchWorst: "{0} teams are problematic ({1}%). Consider teching one of your sets specifically to handle this archetype, or practice a different lead strategy against it.",
  bbArchCoinFlip: "Against {0} ({1}%), games are coin-flip territory. In these matchups, micro-decisions like Protect timing and target selection will decide the game.",
  bbThreatSevere: "{0} is a severe threat ({1}% loss rate). When you see this Pokémon on your opponent's team, you must have a clear plan to neutralize it — whether through type coverage, speed control, or focusing it down early.",
  bbThreatNotable: "{0} is a notable threat ({1}% loss rate in {2} appearances). While not unwinnable, games against it tend to be harder. Consider how your team matchup changes when it's on the field.",
  bbThreatManageable: "{0} appears frequently ({1} times) with a {2}% loss rate. This is manageable but keep it on your radar during team preview.",
  bbMistakeLead: "Your overall win rate is dragged down by suboptimal lead choices. Defaulting to {0} + {1} more often could immediately improve your results.",
  bbPropTech: "Tech against {0}: consider giving one of your Pokémon a move or item specifically to handle this archetype. Even a single coverage move can swing a 40% matchup to 55%.",
  bbPropAnswer: "Add an answer to {0}: it's your #1 threat. Think about what beats it — a faster attacker with super-effective coverage, Intimidate to weaken it, or redirection to protect your vulnerable Pokémon.",
  bbPropLeadFlex: "Your best lead is significantly better than alternatives. This could be a problem in Best-of-3 where opponents adapt. Practice with your 2nd and 3rd best leads so you have flexibility.",
  bbPropFast: "Games are ending very quickly (avg {0} turns). This suggests hyper-offensive play. While good, it can be fragile — one bad prediction and you lose. Consider adding a bulkier pivot for games where aggression is punished.",
  bbPropSlow: "Games are running long (avg {0} turns). This means your team might lack closing power. Consider adding a stronger win condition or more offensive pressure to prevent drawn-out attrition wars.",
  ttOverview: "{0} vs {1}. Over {2} simulated games, {3} won {4}% ({5}W–{6}L) with games lasting an average of {7} turns. {8}.",
  ttVerdictT1: "Team 1 has a clear advantage",
  ttVerdictT2: "Team 2 has a clear advantage",
  ttVerdictClose: "This is a closely contested matchup",
  ttImpactMVP: "{0} is the MVP of this matchup (+{1}% impact). Without it, Team 1's win rate drops to {2}%. This Pokémon is your key to winning — protect it and build your game plan around it.",
  ttImpactWeakest: "{0} is actually hurting your performance in this matchup ({1}% impact). The team does better without it. Consider leaving it in the back or replacing its set with something more useful against this opponent.",
  ttImpactAllPositive: "Every team member contributes positively — this is a well-built team where all 6 Pokémon have synergy against this opponent.",
  ttPropRough: "This is a rough matchup. Rather than forcing it, consider preparing an alternate team for opponents running this composition. In Bo3, you need a sideboard strategy.",
  ttPropLeadSaves: "Although the overall matchup is negative, your best lead ({0} + {1}) actually wins {2}%. The matchup isn't hopeless — you just need to nail your lead choice.",
  ttPropStrong: "You have a strong matchup here. The biggest risk is overconfidence — stick to fundamentals, don't make risky plays you don't need, and close out the game cleanly.",
  ttLeadBestPara: "Your best opening ({0} + {1}) wins {2}% of the time. {3}",
  ttLeadMakeOrBreak: "Lead choice is make-or-break in this matchup — picking the wrong lead can cost you 15%+ win rate.",
  ttLeadFlexible: "Lead selection is relatively flexible here, so you can adapt to what you see in team preview.",
  ttSpeedFaster: "{0}'s fastest Pokémon ({1}) is {2} points faster at max investment. {3}",
  ttSpeedTied: "{0}'s fastest Pokémon ({1}) is speed-tied at max investment. {2}",
  ttSpeedHuge: "The speed gap is huge — speed control (Tailwind/Trick Room) is essential for the slower team.",
  ttSpeedManageable: "The speed gap is manageable — Scarf or Tailwind swings the matchup.",
  ttTypeWeakness: "Your team has {0} critical weakness{1} ({2}) — {0} or more of your Pokémon are hit super-effectively by {3}. Watch for these in team preview and consider your back position carefully.",
  ttRoleMissing: "Your team is missing {0}. In VGC, these tools often determine whether you can execute your game plan or get overrun. Consider if your current roster can compensate.",
};

export const PDF_LABELS_FR: PDFLabels = {
  battleAnalysisReport: "Rapport d'Analyse de Combat",
  competitiveGuide: "Champions Lab  •  Votre Guide d'Entraînement VGC Compétitif",
  yourTeam: "VOTRE ÉQUIPE",
  customTeam: "Équipe Personnalisée",
  winRate: "Taux de Victoire",
  games: "Parties",
  wins: "Victoires",
  losses: "Défaites",
  avgTurns: "Tours Moy.",
  executiveSummary: "Résumé",
  leadSelectionGuide: "Guide de Sélection des Leads",
  leadMuted: "Vos deux premiers Pokémon donnent le tempo du match. Le bon lead peut transformer un matchup de 45% en 60%.",
  leadPair: "Paire de Leads",
  archetypeMatchupStudy: "Étude des Matchups par Archétype",
  archetypeMuted: "Comment votre équipe performe contre chaque archétype compétitif. Utilisez ceci pour comprendre vos forces et pallier vos faiblesses.",
  teams: "équipes",
  threatScoutingReport: "Rapport de Menaces",
  threatMuted: "Les Pokémon adverses qui ont posé le plus de problèmes à votre équipe. Taux de défaite = fréquence de défaite face à ce Pokémon.",
  pokemon: "Pokémon",
  seen: "Vus",
  lossRate: "Taux de Défaite",
  severity: "Sévérité",
  severityCritical: "CRITIQUE",
  severityHigh: "Élevée",
  severityModerate: "Modérée",
  fullMatchupBreakdown: "Détail Complet des Matchups",
  matchupMuted: "Résultats détaillés contre chaque équipe adverse du pool de simulation. Étudiez vos matchups perdants pour trouver des patterns.",
  opponentTeam: "Équipe Adverse",
  verdict: "Verdict",
  strategyGamePlan: "Stratégie & Plan de Jeu",
  strategyMuted: "Insights stratégiques clés tirés de vos données de simulation. Appliquez-les lors de votre prochain tournoi.",
  weaknessesCommonMistakes: "Faiblesses & Erreurs Courantes",
  weaknessesMuted: "Problèmes identifiés dans les performances de votre équipe. Les corriger apportera la plus grande amélioration.",
  improvementProposals: "Propositions d'Amélioration",
  proposalsMuted: "Suggestions concrètes pour pousser votre équipe au tier supérieur. Priorisez le premier point — il aura le plus grand impact.",
  proposal: "Proposition",
  wrDominant: "Dominant",
  wrStrong: "Fort",
  wrFavourable: "Favorable",
  wrEven: "Équilibré",
  wrSlightlyWeak: "Légèrement Faible",
  wrUnfavourable: "Défavorable",
  wrVeryWeak: "Très Faible",
  matchupStudyReport: "Rapport d'Étude de Matchup",
  teamVsTeamDeepDive: "Champions Lab  •  Analyse Approfondie Équipe vs Équipe",
  team1: "ÉQUIPE 1",
  team2: "ÉQUIPE 2",
  team1WinRate: "Taux de Victoire Équipe 1",
  matchupOverview: "Aperçu du Matchup",
  leadOpeningMuted: "Les leads que vous choisissez définissent le début de partie. Contre cet adversaire spécifique, voici vos meilleures ouvertures.",
  speedTierComparison: "Comparaison des Paliers de Vitesse",
  speedMuted: "Savoir qui agit en premier est crucial en Doubles. Ce tableau montre la vitesse de chaque Pokémon aux repères clés — utilisez-le pour décider si vous avez besoin de Vent Arrière, Distorsion ou Foulard Choix.",
  base: "Base",
  min: "Min",
  neutral: "Neutre",
  max: "Max",
  scarf: "Foulard",
  tailwind: "Vent Arr.",
  typeCoverageWeaknesses: "Couverture de Types & Faiblesses",
  typeMuted: "Vulnérabilités défensives et angles morts offensifs. Connaître les types qui menacent votre équipe — et ce que vous ne pouvez pas toucher — est clé pour les décisions au team preview.",
  team1YourTeam: "ÉQUIPE 1 — VOTRE ÉQUIPE",
  team2Opponent: "ÉQUIPE 2 — ADVERSAIRE",
  weakTo: "Faible à :",
  resists: "Résiste à :",
  cantHit: "Ne touche pas :",
  teamIdentityRoleMap: "Identité d'Équipe & Rôles",
  roleMuted: "Comprendre ce que fait chaque Pokémon et comment les équipes sont construites vous aide à prédire le plan de jeu adverse.",
  archetype: "ARCHÉTYPE",
  winCondition: "CONDITION DE VICTOIRE",
  primaryRole: "Rôle Principal",
  additionalRoles: "Rôles Supplémentaires",
  teamSynergyScore: "Score de Synergie :",
  pokemonImpactAnalysis: "Analyse d'Impact par Pokémon",
  impactMuted: "Chaque Pokémon a été retiré et le matchup re-simulé pour mesurer sa contribution individuelle. Impact positif = votre équipe est plus forte avec.",
  wrWithout: "TV sans :",
  matchupInsightsCoaching: "Insights & Coaching de Matchup",
  insightsMuted: "Observations clés de la simulation qui peuvent vous aider à mieux jouer ce matchup.",
  whatYouCanDoNext: "Prochaines Étapes",
  strategyFlowchart: "Plan de Jeu Stratégique",
  flowchartMuted: "Un arbre de décision tour par tour pour votre meilleure combinaison de leads. Suivez cet organigramme pendant le match.",
  keyThreats: "Menaces Clés :",
  backupPlan: "Plan B :",
  team1Roles: "RÔLES ÉQUIPE 1",
  team2Roles: "RÔLES ÉQUIPE 2",
  team1Archetype: "Archétype Équipe 1 :",
  team2Archetype: "Archétype Équipe 2 :",
  noItem: "pas d'objet",
  // Coaching paragraphs
  bbOverview: "Cette équipe est composée de {0}. Sur {1} combats simulés contre le métagame compétitif actuel, elle a atteint un taux de victoire de {2}% ({3}V–{4}D) avec une durée moyenne de {5} tours, obtenant le rang {6}.",
  bbLeadBest: "Votre meilleure ouverture est {0} + {1} à {2}% sur {3} parties. Ce devrait être votre lead par défaut en tournoi sauf si vous avez des informations spécifiques sur l'équipe adverse.",
  bbLeadGap: "Il y a un écart de {0}% entre vos meilleurs et pires leads. Le choix du lead est critique pour cette équipe — étudiez le matchup avant de choisir.",
  bbLeadFlexible: "Vos leads ont des taux de victoire similaires (seulement {0}% d'écart), ce qui signifie que cette équipe est flexible. Vous pouvez adapter vos leads à la composition adverse librement.",
  bbArchBest: "Vous excellez contre les équipes {0} ({1}%) — ce matchup est dans votre zone de confort et vous devriez jouer en confiance.",
  bbArchWorst: "Les équipes {0} sont problématiques ({1}%). Envisagez d'adapter un de vos sets spécifiquement pour gérer cet archétype, ou pratiquez une stratégie de lead différente.",
  bbArchCoinFlip: "Contre {0} ({1}%), les parties sont à pile ou face. Dans ces matchups, les micro-décisions comme le timing d'Abri et la sélection de cible feront la différence.",
  bbThreatSevere: "{0} est une menace sévère ({1}% de taux de défaite). Quand vous voyez ce Pokémon dans l'équipe adverse, vous devez avoir un plan clair pour le neutraliser — que ce soit par couverture de type, contrôle de vitesse ou en le ciblant rapidement.",
  bbThreatNotable: "{0} est une menace notable ({1}% de défaite en {2} apparitions). Bien que pas impossible à battre, les parties contre lui sont plus difficiles. Réfléchissez à comment votre matchup change quand il est sur le terrain.",
  bbThreatManageable: "{0} apparaît fréquemment ({1} fois) avec un taux de défaite de {2}%. C'est gérable mais gardez-le sur votre radar au team preview.",
  bbMistakeLead: "Votre taux de victoire global est tiré vers le bas par des choix de lead sous-optimaux. Utiliser {0} + {1} par défaut plus souvent pourrait améliorer immédiatement vos résultats.",
  bbPropTech: "Contrer {0} : envisagez de donner à un de vos Pokémon un move ou objet spécifiquement pour gérer cet archétype. Même un seul move de couverture peut transformer un matchup de 40% en 55%.",
  bbPropAnswer: "Ajoutez une réponse à {0} : c'est votre menace n°1. Réfléchissez à ce qui le bat — un attaquant plus rapide avec une couverture super-efficace, Intimidation pour l'affaiblir, ou la redirection pour protéger vos Pokémon vulnérables.",
  bbPropLeadFlex: "Votre meilleur lead est nettement supérieur aux alternatives. Cela peut être un problème en Best-of-3 où les adversaires s'adaptent. Pratiquez avec vos 2e et 3e meilleurs leads pour avoir de la flexibilité.",
  bbPropFast: "Les parties se terminent très vite (moy. {0} tours). Cela suggère un jeu hyper-offensif. Bien que bon, c'est fragile — une mauvaise prédiction et vous perdez. Envisagez d'ajouter un pivot plus résistant pour les parties où l'agression est punie.",
  bbPropSlow: "Les parties durent longtemps (moy. {0} tours). Cela signifie que votre équipe manque peut-être de puissance de finition. Envisagez d'ajouter une condition de victoire plus forte ou plus de pression offensive.",
  ttOverview: "{0} vs {1}. Sur {2} parties simulées, {3} a gagné {4}% ({5}V–{6}D) avec des parties d'une durée moyenne de {7} tours. {8}.",
  ttVerdictT1: "L'Équipe 1 a un avantage clair",
  ttVerdictT2: "L'Équipe 2 a un avantage clair",
  ttVerdictClose: "C'est un matchup très serré",
  ttImpactMVP: "{0} est le MVP de ce matchup (+{1}% d'impact). Sans lui, le taux de victoire de l'Équipe 1 chute à {2}%. Ce Pokémon est votre clé pour gagner — protégez-le et construisez votre plan de jeu autour de lui.",
  ttImpactWeakest: "{0} nuit en fait à votre performance dans ce matchup ({1}% d'impact). L'équipe fait mieux sans. Envisagez de le laisser en arrière ou de remplacer son set par quelque chose de plus utile contre cet adversaire.",
  ttImpactAllPositive: "Chaque membre de l'équipe contribue positivement — c'est une équipe bien construite où les 6 Pokémon ont de la synergie contre cet adversaire.",
  ttPropRough: "C'est un matchup difficile. Plutôt que de forcer, envisagez de préparer une équipe alternative pour les adversaires jouant cette composition. En Bo3, vous avez besoin d'une stratégie de sideboard.",
  ttPropLeadSaves: "Bien que le matchup global soit négatif, votre meilleur lead ({0} + {1}) gagne en fait {2}%. Le matchup n'est pas désespéré — vous devez juste réussir votre choix de lead.",
  ttPropStrong: "Vous avez un matchup favorable ici. Le plus grand risque est l'excès de confiance — restez sur les fondamentaux, ne prenez pas de risques inutiles, et finissez le match proprement.",
  ttLeadBestPara: "Votre meilleure ouverture ({0} + {1}) gagne {2}% du temps. {3}",
  ttLeadMakeOrBreak: "Le choix du lead est décisif dans ce matchup — choisir le mauvais lead peut vous coûter 15%+ de taux de victoire.",
  ttLeadFlexible: "La sélection du lead est relativement flexible ici, vous pouvez vous adapter à ce que vous voyez au team preview.",
  ttSpeedFaster: "Le Pokémon le plus rapide de {0} ({1}) est plus rapide de {2} points à investissement maximum. {3}",
  ttSpeedTied: "Le Pokémon le plus rapide de {0} ({1}) est à égalité de vitesse à investissement maximum. {2}",
  ttSpeedHuge: "L'écart de vitesse est énorme — le contrôle de vitesse (Vent Arrière/Distorsion) est essentiel pour l'équipe la plus lente.",
  ttSpeedManageable: "L'écart de vitesse est gérable — Foulard Choix ou Vent Arrière change la donne.",
  ttTypeWeakness: "Votre équipe a {0} faiblesse{1} critique{1} ({2}) — {0} ou plus de vos Pokémon sont touchés super-efficacement par {3}. Surveillez cela au team preview et réfléchissez à votre positionnement arrière.",
  ttRoleMissing: "Il manque {0} à votre équipe. En VGC, ces outils déterminent souvent si vous pouvez exécuter votre plan de jeu ou vous faire submerger. Évaluez si votre roster actuel peut compenser.",
};
export const PDF_LABELS_DE: PDFLabels = {
  battleAnalysisReport: "Kampfanalyse-Bericht",
  competitiveGuide: "Champions Lab  •  Dein Wettbewerbs-VGC-Trainingsguide",
  yourTeam: "DEIN TEAM",
  customTeam: "Benutzerdefiniertes Team",
  winRate: "Gewinnrate",
  games: "Spiele",
  wins: "Siege",
  losses: "Niederlagen",
  avgTurns: "Ø Runden",
  executiveSummary: "Zusammenfassung",
  leadSelectionGuide: "Lead-Auswahl-Guide",
  leadMuted: "Deine ersten beiden Pokémon geben das Tempo des Spiels vor. Der richtige Lead kann ein 45%-Matchup in ein 60%-Matchup verwandeln.",
  leadPair: "Lead-Paar",
  archetypeMatchupStudy: "Archetyp-Matchup-Studie",
  archetypeMuted: "Wie dein Team gegen jeden Wettbewerbs-Archetyp abschneidet. Nutze dies, um deine Stärken zu verstehen und deine blinden Flecken zu umgehen.",
  teams: "Teams",
  threatScoutingReport: "Bedrohungs-Scouting-Bericht",
  threatMuted: "Das sind die gegnerischen Pokémon, die deinem Team die meisten Probleme bereitet haben. Niederlagenrate = wie oft du verloren hast, wenn du diesem Pokémon gegenüberstandest.",
  pokemon: "Pokémon",
  seen: "Gesehen",
  lossRate: "Niederlagenrate",
  severity: "Schwere",
  severityCritical: "KRITISCH",
  severityHigh: "Hoch",
  severityModerate: "Mittel",
  fullMatchupBreakdown: "Vollständige Matchup-Aufschlüsselung",
  matchupMuted: "Detaillierte Ergebnisse gegen jedes gegnerische Team im Simulations-Pool. Studiere deine verlorenen Matchups, um Muster zu finden.",
  opponentTeam: "Gegner-Team",
  verdict: "Urteil",
  strategyGamePlan: "Strategie & Spielplan",
  strategyMuted: "Wichtige strategische Erkenntnisse aus deinen Simulationsdaten. Wende sie bei deinem nächsten Turnier an.",
  weaknessesCommonMistakes: "Schwächen & Häufige Fehler",
  weaknessesMuted: "Identifizierte Probleme in der Performance deines Teams. Diese zu beheben wird die größte Verbesserung bringen.",
  improvementProposals: "Verbesserungsvorschläge",
  proposalsMuted: "Konkrete Vorschläge, um dein Team auf die nächste Stufe zu heben. Priorisiere den ersten Punkt — er wird den größten Impact haben.",
  proposal: "Vorschlag",
  wrDominant: "Dominant",
  wrStrong: "Stark",
  wrFavourable: "Günstig",
  wrEven: "Ausgeglichen",
  wrSlightlyWeak: "Leicht schwach",
  wrUnfavourable: "Ungünstig",
  wrVeryWeak: "Sehr schwach",
  matchupStudyReport: "Matchup-Studien-Bericht",
  teamVsTeamDeepDive: "Champions Lab  •  Team vs Team Deep Dive",
  team1: "TEAM 1",
  team2: "TEAM 2",
  team1WinRate: "Team 1 Gewinnrate",
  matchupOverview: "Matchup-Übersicht",
  leadOpeningMuted: "Die Leads, die du wählst, definieren das Early Game. Gegen diesen spezifischen Gegner sind das deine besten Eröffnungen.",
  speedTierComparison: "Initiativstufen-Vergleich",
  speedMuted: "Zu wissen, wer zuerst agiert, ist im Doppelkampf alles. Diese Tabelle zeigt die Initiative jedes Pokémon bei wichtigen Benchmarks — nutze sie, um zu entscheiden, ob du Rückenwind, Trick Room oder Choice-Schal brauchst.",
  base: "Basis",
  min: "Min",
  neutral: "Neutral",
  max: "Max",
  scarf: "Schal",
  tailwind: "Rückenwind",
  typeCoverageWeaknesses: "Typ-Abdeckung & Schwächen",
  typeMuted: "Defensive Verwundbarkeiten und offensive blinde Flecken. Zu wissen, welche Typen dein Team bedrohen — und was du nicht treffen kannst — ist entscheidend für Team-Preview-Entscheidungen.",
  team1YourTeam: "TEAM 1 — DEIN TEAM",
  team2Opponent: "TEAM 2 — GEGNER",
  weakTo: "Schwach gegen:",
  resists: "Resistent gegen:",
  cantHit: "Kann nicht treffen:",
  teamIdentityRoleMap: "Team-Identität & Rollenkarte",
  roleMuted: "Zu verstehen, was jedes Pokémon tut und wie die Teams aufgebaut sind, hilft dir, den Spielplan des Gegners vorherzusagen.",
  archetype: "ARCHETYP",
  winCondition: "SIGBEDINGUNG",
  primaryRole: "Primäre Rolle",
  additionalRoles: "Zusätzliche Rollen",
  teamSynergyScore: "Team-Synergie-Score:",
  pokemonImpactAnalysis: "Pokémon-Impact-Analyse",
  impactMuted: "Jedes Pokémon wurde entfernt und das Matchup neu simuliert, um seinen individuellen Beitrag zu messen. Positiver Impact = dein Team ist mit ihm stärker.",
  wrWithout: "GR ohne:",
  matchupInsightsCoaching: "Matchup-Einblicke & Coaching",
  insightsMuted: "Wichtige Beobachtungen aus der Simulation, die dir helfen können, dieses Matchup besser zu spielen.",
  whatYouCanDoNext: "Was du als Nächstes tun kannst",
  strategyFlowchart: "Strategie-Spielplan",
  flowchartMuted: "Ein rundenbasierter Entscheidungsbaum für deine beste Lead-Kombination. Folge diesem Flowchart während des Spiels.",
  keyThreats: "Schlüsselbedrohungen:",
  backupPlan: "Backup-Plan:",
  team1Roles: "TEAM 1 ROLLEN",
  team2Roles: "TEAM 2 ROLLEN",
  team1Archetype: "Team 1 Archetyp:",
  team2Archetype: "Team 2 Archetyp:",
  noItem: "kein Item",
  // Coaching paragraphs
  bbOverview: "Dieses Team besteht aus {0}. Über {1} simulierte Kämpfe gegen das aktuelle Wettbewerbs-Metagame erreichte es eine {2}% Gewinnrate ({3}S–{4}N) mit einer durchschnittlichen Spieldauer von {5} Runden und erhielt eine {6}-Bewertung.",
  bbLeadBest: "Deine stärkste Eröffnung ist {0} + {1} bei {2}% über {3} Spiele. Das sollte dein Standard-Lead im Turnierspiel sein, es sei denn, du hast spezische Informationen über das gegnerische Team.",
  bbLeadGap: "Es gibt eine {0}% Lücke zwischen deinem besten und schlechtesten Lead. Die Lead-Auswahl ist für dieses Team kritisch — studiere das Matchup, bevor du wählst.",
  bbLeadFlexible: "Deine Leads haben ähnliche Gewinnraten (nur {0}% Unterschied), was bedeutet, dass dieses Team flexibel ist. Du kannst deine Leads an die gegnerische Zusammensetzung anpassen.",
  bbArchBest: "Du brillierst gegen {0}-Teams ({1}%) — dieses Matchup liegt in deiner Komfortzone und du solltest selbstbewusst spielen.",
  bbArchWorst: "{0}-Teams sind problematisch ({1}%). Erwäge, eines deiner Sets speziell gegen diesen Archetyp zu techten, oder übe eine andere Lead-Strategie dagegen.",
  bbArchCoinFlip: "Gegen {0} ({1}%) sind die Spiele Münzwurf-Territorium. In diesen Matchups entscheiden Mikro-Entscheidungen wie Protect-Timing und Zielauswahl das Spiel.",
  bbThreatSevere: "{0} ist eine schwere Bedrohung ({1}% Niederlagenrate). Wenn du dieses Pokémon im gegnerischen Team siehst, musst du einen klaren Plan haben, es zu neutralisieren — sei es durch Typ-Abdeckung, Initiativkontrolle oder frühes Fokussieren.",
  bbThreatNotable: "{0} ist eine bemerkenswerte Bedrohung ({1}% Niederlagenrate bei {2} Auftritten). Auch wenn nicht ungewinnbar, neigen Spiele dagegen dazu, schwieriger zu sein. Überlege, wie sich dein Team-Matchup ändert, wenn es auf dem Feld ist.",
  bbThreatManageable: "{0} erscheint häufig ({1} Mal) mit einer {2}% Niederlagenrate. Das ist handhabbar, aber behalte es im Team Preview im Blick.",
  bbMistakeLead: "Deine Gesamtgewinnrate wird durch suboptimale Lead-Wahlen gedrückt. Öfter auf {0} + {1} als Standard zu setzen, könnte deine Ergebnisse sofort verbessern.",
  bbPropTech: "Tech gegen {0}: Erwäge, einem deiner Pokémon eine Attacke oder ein Item zu geben, das speziell diesen Archetyp handhabt. Selbst eine einzelne Coverage-Attacke kann ein 40%-Matchup zu 55% wenden.",
  bbPropAnswer: "Füge eine Antwort auf {0} hinzu: Es ist deine #1-Bedrohung. Überlege, was es schlägt — ein schnellerer Angreifer mit sehr effektiver Abdeckung, Intimidate, um es zu schwächen, oder Redirection, um deine verwundbaren Pokémon zu schützen.",
  bbPropLeadFlex: "Dein bester Lead ist deutlich besser als Alternativen. Das könnte in Best-of-3 ein Problem sein, wo Gegner sich anpassen. Übe mit deinem 2. und 3. besten Lead, um Flexibilität zu haben.",
  bbPropFast: "Spiele enden sehr schnell (Ø {0} Runden). Das deutet auf hyper-offensives Spiel hin. Während gut, kann es fragil sein — eine falsche Prediction und du verlierst. Erwäge, einen defensiveren Pivot für Spiele hinzuzufügen, in denen Aggression bestraft wird.",
  bbPropSlow: "Spiele dauern lange (Ø {0} Runden). Das bedeutet, dein Team könnte an Abschlusskraft fehlen. Erwäge, eine stärkere Siegbedingung oder mehr offensiven Druck hinzuzufügen, um langgezogene Abnutzungskriege zu verhindern.",
  ttOverview: "{0} vs {1}. Über {2} simulierte Spiele gewann {3} {4}% ({5}S–{6}N) mit einer durchschnittlichen Spieldauer von {7} Runden. {8}.",
  ttVerdictT1: "Team 1 hat einen klaren Vorteil",
  ttVerdictT2: "Team 2 hat einen klaren Vorteil",
  ttVerdictClose: "Dies ist ein knapp umkämpftes Matchup",
  ttImpactMVP: "{0} ist der MVP dieses Matchups (+{1}% Impact). Ohne ihn sinkt die Gewinnrate von Team 1 auf {2}%. Dieses Pokémon ist dein Schlüssel zum Sieg — schütze es und baue deinen Spielplan darum auf.",
  ttImpactWeakest: "{0} schadet dir tatsächlich in diesem Matchup ({1}% Impact). Das Team macht es ohne besser. Erwäge, es auf die Bank zu setzen oder sein Set durch etwas Nützlicheres gegen diesen Gegner zu ersetzen.",
  ttImpactAllPositive: "Jedes Teammitglied trägt positiv bei — das ist ein gut gebautes Team, bei dem alle 6 Pokémon Synergie gegen diesen Gegner haben.",
  ttPropRough: "Dies ist ein hartes Matchup. Statt es zu erzwingen, erwäge, ein alternatives Team für Gegner mit dieser Zusammensetzung vorzubereiten. In Bo3 brauchst du eine Sideboard-Strategie.",
  ttPropLeadSaves: "Obwohl das Gesamt-Matchup negativ ist, gewinnt dein bester Lead ({0} + {1}) tatsächlich {2}%. Das Matchup ist nicht aussichtslos — du musst nur deine Lead-Wahl treffen.",
  ttPropStrong: "Du hast hier ein starkes Matchup. Das größte Risiko ist Überheblichkeit — bleib bei den Grundlagen, mache keine unnötigen Risiken und beende das Spiel sauber.",
  ttLeadBestPara: "Deine beste Eröffnung ({0} + {1}) gewinnt {2}% der Zeit. {3}",
  ttLeadMakeOrBreak: "Die Lead-Wahl ist Make-or-Break in diesem Matchup — der falsche Lead kann dich 15%+ Gewinnrate kosten.",
  ttLeadFlexible: "Die Lead-Auswahl ist hier relativ flexibel, also kannst du dich an das anpassen, was du im Team Preview siehst.",
  ttSpeedFaster: "Das schnellste Pokémon von {0} ({1}) ist bei Max-Investition {2} Punkte schneller. {3}",
  ttSpeedTied: "Das schnellste Pokémon von {0} ({1}) ist bei Max-Investition initiative-gleich. {2}",
  ttSpeedHuge: "Die Initiativlücke ist riesig — Initiativkontrolle (Rückenwind/Trick Room) ist für das langsamere Team essenziell.",
  ttSpeedManageable: "Die Initiativlücke ist handhabbar — Schal oder Rückenwind kippen das Matchup.",
  ttTypeWeakness: "Dein Team hat {0} kritische Schwäche{1} ({2}) — {0} oder mehr deiner Pokémon werden von {3} super-effektiv getroffen. Achte darauf im Team Preview und überlege deine Hinterposition sorgfältig.",
  ttRoleMissing: "Deinem Team fehlt {0}. Im VGC bestimmen diese Tools oft, ob du deinen Spielplan ausführen kannst oder überrannt wirst. Überlege, ob dein aktueller Roster das ausgleichen kann.",
};

export const PDF_LABELS_KO: PDFLabels = {
  battleAnalysisReport: "배틀 분석 보고서",
  competitiveGuide: "Champions Lab  •  경쟁 VGC 트레이닝 가이드",
  yourTeam: "내 팀",
  customTeam: "커스텀 팀",
  winRate: "승률",
  games: "게임",
  wins: "승",
  losses: "패",
  avgTurns: "평균 턴",
  executiveSummary: "요약",
  leadSelectionGuide: "리드 선택 가이드",
  leadMuted: "첫 두 마리의 포켓몬이 게임의 템포를 정합니다. 올바른 리드는 45% 매치업을 60%로 바꿀 수 있습니다.",
  leadPair: "리드 페어",
  archetypeMatchupStudy: "아키타입 매치업 연구",
  archetypeMuted: "각 경쟁 아키타입에 대한 팀의 성과입니다. 강점을 파악하고 사각지대를 보완하는 데 활용하세요.",
  teams: "팀",
  threatScoutingReport: "위협 스카우팅 보고서",
  threatMuted: "내 팀에게 가장 큰 곤란을 준 상대 포켓몬입니다. 패배율 = 이 포켓몬을 상대했을 때 진 비율입니다.",
  pokemon: "포켓몬",
  seen: "등장",
  lossRate: "패배율",
  severity: "심각도",
  severityCritical: "치명적",
  severityHigh: "높음",
  severityModerate: "보통",
  fullMatchupBreakdown: "전체 매치업 세부 분석",
  matchupMuted: "시뮬레이션 풀의 모든 상대 팀에 대한 상세 결과입니다. 패배한 매치업을 연구해 패턴을 찾으세요.",
  opponentTeam: "상대 팀",
  verdict: "평가",
  strategyGamePlan: "전략 & 게임 플랜",
  strategyMuted: "시뮬레이션 데이터에서 도출한 핵심 전략 인사이트입니다. 다음 토너먼트에 적용해 보세요.",
  weaknessesCommonMistakes: "약점 & 흔한 실수",
  weaknessesMuted: "팀 성과에서 발견된 문제점입니다. 이것들을 개선하면 가장 큰 향상을 얻을 수 있습니다.",
  improvementProposals: "개선 제안",
  proposalsMuted: "팀을 다음 단계로 끌어올릴 구체적인 제안입니다. 첫 번째 항목을 우선적으로 적용하세요 — 가장 큰 영향을 줍니다.",
  proposal: "제안",
  wrDominant: "압도적",
  wrStrong: "강함",
  wrFavourable: "유리",
  wrEven: "비등",
  wrSlightlyWeak: "약간 불리",
  wrUnfavourable: "불리",
  wrVeryWeak: "매우 불리",
  matchupStudyReport: "매치업 연구 보고서",
  teamVsTeamDeepDive: "Champions Lab  •  팀 대 팀 심층 분석",
  team1: "팀 1",
  team2: "팀 2",
  team1WinRate: "팀 1 승률",
  matchupOverview: "매치업 개요",
  leadOpeningMuted: "선택한 리드가 초반 게임을 결정합니다. 이 특정 상대를 상대로 가장 좋은 오프닝은 다음과 같습니다.",
  speedTierComparison: "스피드 티어 비교",
  speedMuted: "누가 먼저 움직이는지는 더블에서 모든 것을 결정합니다. 이 표는 각 포켓몬의 주요 기준 스피드를 보여주며, 순풍, 트릭룸, 초이스스카프가 필요한지 판단하는 데 활용하세요.",
  base: "기본",
  min: "최소",
  neutral: "중립",
  max: "최대",
  scarf: "스카프",
  tailwind: "순풍",
  typeCoverageWeaknesses: "타입 커버리지 & 약점",
  typeMuted: "방어적 취약점과 공격적 사각지대입니다. 어떤 타입이 팀을 위협하고 무엇을 공격할 수 없는지 아는 것이 팀 프리뷰 결정의 핵심입니다.",
  team1YourTeam: "팀 1 — 내 팀",
  team2Opponent: "팀 2 — 상대",
  weakTo: "약점:",
  resists: "내성:",
  cantHit: "공격 불가:",
  teamIdentityRoleMap: "팀 정체성 & 역할 맵",
  roleMuted: "각 포켓몬의 역할과 팀 구성을 이해하면 상대의 게임 플랜을 예측하는 데 도움이 됩니다.",
  archetype: "아키타입",
  winCondition: "승리 조건",
  primaryRole: "주 역할",
  additionalRoles: "추가 역할",
  teamSynergyScore: "팀 시너지 점수:",
  pokemonImpactAnalysis: "포켓몬 영향력 분석",
  impactMuted: "각 포켓몬을 제거하고 매치업을 재시뮬레이션하여 개인 기여도를 측정했습니다. 긍정적 영향 = 해당 포켓몬이 있을 때 팀이 더 강합니다.",
  wrWithout: "제외 시 승률:",
  matchupInsightsCoaching: "매치업 인사이트 & 코칭",
  insightsMuted: "이 매치업을 더 잘 플레이하는 데 도움이 되는 시뮬레이션의 핵심 관찰 결과입니다.",
  whatYouCanDoNext: "다음에 할 수 있는 것",
  strategyFlowchart: "전략 게임 플랜",
  flowchartMuted: "최고 리드 조합에 대한 턴 단위 의사결정 트리입니다. 게임 중 이 플로우차트를 따르세요.",
  keyThreats: "핵심 위협:",
  backupPlan: "백업 플랜:",
  team1Roles: "팀 1 역할",
  team2Roles: "팀 2 역할",
  team1Archetype: "팀 1 아키타입:",
  team2Archetype: "팀 2 아키타입:",
  noItem: "도구 없음",
  // Coaching paragraphs
  bbOverview: "이 팀은 {0}로 구성되어 있습니다. 현재 경쟁 메타를 상대로 {1}회의 시뮬레이션 배틀에서 {2}% 승률({3}승–{4}패)을 기록했으며, 평균 게임 길이는 {5}턴, 평가는 {6}입니다.",
  bbLeadBest: "가장 강력한 오프닝은 {0} + {1}로 {3}게임에서 {2}%입니다. 상대 팀에 대한 구체적인 정보가 없다면 토너먼트에서 기본 리드로 사용하세요.",
  bbLeadGap: "최고와 최악의 리드 사이에 {0}% 차이가 있습니다. 이 팀은 리드 선택이 매우 중요 — 선택하기 전 매치업을 분석하세요.",
  bbLeadFlexible: "리드 간 승률 차이가 {0}%에 불과해 이 팀은 유연합니다. 상대 구성에 따라 리드를 자유롭게 조정할 수 있습니다.",
  bbArchBest: "{0} 팀에게 강합니다({1}%) — 이 매치업은 자신감 있게 플레이하세요.",
  bbArchWorst: "{0} 팀이 문제입니다({1}%). 이 아키타입을 상대로 세트를 특화하거나 다른 리드 전략을 연습해 보세요.",
  bbArchCoinFlip: "{0} 상대({1}%)는 동전 던기 수준입니다. 이런 매치업에서는 프로텍트 타이밍과 타깃 선택 같은 미세한 결정이 승패를 갈립니다.",
  bbThreatSevere: "{0}은(는) 심각한 위협입니다({1}% 패배율). 상대 팀에 이 포켓몬이 보이면 타입 커버리지, 스피드 컨트롤, 혹은 조기 집중 공격으로 물리칠 명확한 계획이 필요합니다.",
  bbThreatNotable: "{0}은(는) 주목할 위협입니다({2}번 등장에서 {1}% 패배율). 이길 수 없는 것은 아니지만 어려운 경향이 있습니다. 이 포켓몬이 필드에 있을 때 매치업이 어떻게 변하는지 고려하세요.",
  bbThreatManageable: "{0}이(가) 자주 등장합니다({1}회, {2}% 패배율). 관리 가능하지만 팀 프리뷰에서 주의 깊게 살피세요.",
  bbMistakeLead: "전체 승률이 비최적 리드 선택으로 낮아지고 있습니다. {0} + {1}을(를) 기본 리드로 더 자주 사용하면 결과가 즉시 개선될 수 있습니다.",
  bbPropTech: "{0} 대비 특화: 이 아키타입을 상대로 한 포켓몬에게 기술이나 도구를 주는 것을 고려하세요. 단 하나의 커버리지 기술로 40% 매치업을 55%로 바꿀 수 있습니다.",
  bbPropAnswer: "{0}에 대한 해결책 추가: 이것이 당신의 1위 위협입니다. 더 빠른 어태커의 반 타입 커버리지, 위협으로 약화시키기, 딜레인저로 보호하기 등을 생각해 보세요.",
  bbPropLeadFlex: "최고 리드가 다른 대안보다 현저히 좋습니다. Best-of-3에서 상대가 적응하면 문제가 될 수 있으므로 2, 3번째 리드도 연습해 유연성을 확보하세요.",
  bbPropFast: "게임이 매우 빠르게 끝납니다(평균 {0}턴). 하이퍼 오펜스 플레이를 시사하지만, 하나의 잘못된 예측으로 패배할 수 있습니다. 공격이 처벌받는 게임을 위해 더 탱탱한 피벗을 고려하세요.",
  bbPropSlow: "게임이 길어집니다(평균 {0}턴). 팀에 마무리 능력이 부족할 수 있습니다. 더 강한 승리 조건이나 공격 압박을 추가해 장기전을 피하세요.",
  ttOverview: "{0} vs {1}. {2}회의 시뮬레이션 게임에서 {3}이(가) {4}%({5}승–{6}패)를 기록했으며, 평균 게임 길이는 {7}턴입니다. {8}.",
  ttVerdictT1: "팀 1이 유리합니다",
  ttVerdictT2: "팀 2가 유리합니다",
  ttVerdictClose: "매우 접전인 매치업입니다",
  ttImpactMVP: "{0}이(가) 이 매치업의 MVP입니다(+{1}% 영향력). 없으면 팀 1의 승률이 {2}%로 떨어집니다. 이 포켓몬이 승리의 핵심 — 보호하고 게임 플랜의 중심으로 삼으세요.",
  ttImpactWeakest: "{0}이(가) 이 매치업에서 실제로 약화시키고 있습니다({1}% 영향력). 없는 편이 더 나은 팀입니다. 후보로 두거나 이 상대에 더 유용한 세트로 교체하세요.",
  ttImpactAllPositive: "모든 팀원이 긍정적으로 기여합니다 — 이는 상대에게 시너지가 잘 맞는 잘 짜인 팀입니다.",
  ttPropRough: "어려운 매치업입니다. 억지로 하기보다 이 구성을 사용하는 상대를 위해 대체 팀을 준비하세요. Bo3에서는 사이드 전략이 필요합니다.",
  ttPropLeadSaves: "전체 매치업은 부정적이지만 최고 리드({0} + {1})가 {2}%를 이깁니다. 매치업이 희망 없는 것은 아닙니다 — 리드 선택만 잘하면 됩니다.",
  ttPropStrong: "여기서 강력한 매치업입니다. 가장 큰 위험은 과신입니다 — 기본기에 충실하고 불필요한 리스크를 피하며 깔끔하게 마무리하세요.",
  ttLeadBestPara: "최고 오프닝({0} + {1})은 {2}%의 시간을 이깁니다. {3}",
  ttLeadMakeOrBreak: "이 매치업에서 리드 선택이 승패를 가릅니다 — 잘못된 리드는 15% 이상의 승률을 날릴 수 있습니다.",
  ttLeadFlexible: "여기서는 리드 선택이 비교적 유연하므로 팀 프리뷰에서 보이는 것에 따라 적응할 수 있습니다.",
  ttSpeedFaster: "{0}의 최고속 포켓몬({1})이 최대 투자 시 {2} 포인트 더 빠릅니다. {3}",
  ttSpeedTied: "{0}의 최고속 포켓몬({1})이 최대 투자 시 동속입니다. {2}",
  ttSpeedHuge: "스피드 격차가 큽니다 — 느린 팀에는 스피드 컨트롤(순풍/트릭룸)이 필수입니다.",
  ttSpeedManageable: "스피드 격차는 관리 가능합니다 — 스카프나 순풍으로 매치업이 뒤집힙니다.",
  ttTypeWeakness: "팀에 {0}개의 치명적 약점{1}({2})이 있습니다 — {0}마리 이상의 포켓몬이 {3}에게 2배 데미지를 받습니다. 팀 프리뷰에서 주의하고 후보 배치를 신중히 결정하세요.",
  ttRoleMissing: "팀에 {0}이(가) 없습니다. VGC에서 이런 도구들은 게임 플랜을 실행할 수 있느냐, overrun당하느냐를 결정합니다. 현재 로스터가 보완할 수 있는지 고려하세요.",
};

// ── Types ─────────────────────────────────────────────────────────────────

interface BattleBotReport {
  teamName: string;
  team: { name: string; ability: string; item: string; moves: string[] }[];
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  avgTurns: number;
  tier: string;
  matchupBreakdown: { opponent: string; winRate: number; wins: number; losses: number; archetype: string }[];
  threats: { name: string; threatScore: number; appearances: number; winsAgainst: number }[];
  bestLeads: { lead1: string; lead2: string; winRate: number; games: number }[];
  archetypeBreakdown: { archetype: string; winRate: number; count: number }[];
  commonWeaknesses: string[];
  strategyTips: string[];
}

interface StrategyStep {
  label: string;
  detail?: string;
  severity?: "good" | "neutral" | "bad";
  children?: StrategyStep[];
  branchLabel?: string;
}

interface StrategyOverview {
  archetype: string;
  winCondition: string;
  keyThreats: string[];
  backupPlan: string;
  steps: StrategyStep[]; // flattened key actions
}

interface SpeedEntry {
  name: string;
  baseSpeed: number;
  minSpeed: number;
  neutralSpeed: number;
  maxSpeed: number;
  scarfSpeed: number;
  tailwindSpeed: number;
}

interface TypeProfile {
  weaknesses: { type: string; count: number }[];
  resistances: { type: string; count: number }[];
  uncovered: string[];
}

interface RoleEntry {
  name: string;
  primaryRole: string;
  roles: string[];
}

interface ArchetypeEntry {
  archetype: string;
  confidence: number;
  keyPokemon: string[];
}

interface TeamTesterReport {
  team1: { name: string; ability: string; item: string; moves: string[] }[];
  team2: { name: string; ability: string; item: string; moves: string[] }[];
  wins: number;
  losses: number;
  winRate: number;
  avgTurns: number;
  totalGames: number;
  leadCombos: { lead1: string; lead2: string; winRate: number; games: number }[];
  pokemonImpact: { name: string; impact: number; excludeWinRate: number }[];
  insights: string[];
  strategy?: StrategyOverview | null;
  // Extended analysis
  speedTiers?: { team1: SpeedEntry[]; team2: SpeedEntry[] };
  typeProfile?: { team1: TypeProfile; team2: TypeProfile };
  roles?: { team1: RoleEntry[]; team2: RoleEntry[] };
  archetypes?: { team1: ArchetypeEntry[]; team2: ArchetypeEntry[] };
  synergyScores?: { team1: number; team2: number };
}

// ── Light theme colors ────────────────────────────────────────────────────

type RGB = [number, number, number];

const C = {
  white: [255, 255, 255] as RGB,
  bg: [250, 250, 252] as RGB,
  text: [30, 30, 40] as RGB,
  textMuted: [110, 115, 135] as RGB,
  textLight: [155, 160, 178] as RGB,
  accent: [124, 58, 237] as RGB,        // violet-600, brand
  accentBg: [245, 240, 255] as RGB,     // very light violet
  cardBorder: [230, 232, 240] as RGB,
  green: [22, 163, 74] as RGB,
  greenBg: [240, 253, 244] as RGB,
  red: [220, 38, 38] as RGB,
  redBg: [254, 242, 242] as RGB,
  orange: [234, 88, 12] as RGB,
  orangeBg: [255, 247, 237] as RGB,
  blue: [37, 99, 235] as RGB,
  blueBg: [239, 246, 255] as RGB,
  gold: [161, 98, 7] as RGB,
  barBg: [235, 237, 245] as RGB,
  rowAlt: [247, 248, 252] as RGB,
  divider: [225, 228, 238] as RGB,
};

// ── Helpers ───────────────────────────────────────────────────────────────

function wrColor(wr: number): RGB {
  if (wr >= 65) return C.green;
  if (wr >= 50) return C.blue;
  if (wr >= 40) return C.orange;
  return C.red;
}

function wrLabel(wr: number, L: PDFLabels): string {
  if (wr >= 70) return L.wrDominant;
  if (wr >= 60) return L.wrStrong;
  if (wr >= 55) return L.wrFavourable;
  if (wr >= 50) return L.wrEven;
  if (wr >= 45) return L.wrSlightlyWeak;
  if (wr >= 35) return L.wrUnfavourable;
  return L.wrVeryWeak;
}

function drawBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number, color: RGB) {
  doc.setFillColor(...C.barBg);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (pct > 0) {
    const fillW = Math.max(h, (w * Math.min(pct, 100)) / 100);
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillW, h, h / 2, h / 2, "F");
  }
}

async function loadLogoAsDataURL(): Promise<string | null> {
  try {
    const resp = await fetch("/logo.png");
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

const M = { left: 18, right: 18, top: 15, bottom: 18 };

function pageW(doc: jsPDF) { return doc.internal.pageSize.getWidth(); }
function contentW(doc: jsPDF) { return pageW(doc) - M.left - M.right; }

function addFooter(doc: jsPDF, page: number) {
  const pw = pageW(doc);
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(M.left, ph - 12, pw - M.right, ph - 12);
  doc.setFontSize(7);
  doc.setTextColor(...C.textLight);
  doc.text("Champions Lab  •  championslab.gg", M.left, ph - 8);
  doc.text(new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }), pw / 2, ph - 8, { align: "center" });
  doc.text(`${page}`, pw - M.right, ph - 8, { align: "right" });
}

function newPage(doc: jsPDF, pageNum: { v: number }): number {
  addFooter(doc, pageNum.v);
  doc.addPage();
  pageNum.v++;
  return M.top;
}

function ensure(doc: jsPDF, y: number, need: number, pn: { v: number }): number {
  if (y + need > doc.internal.pageSize.getHeight() - M.bottom) return newPage(doc, pn);
  return y;
}

/** Section heading with icon-style colored dot */
function heading(doc: jsPDF, y: number, title: string, color: RGB = C.accent): number {
  doc.setFillColor(...color);
  doc.circle(M.left + 2, y + 1.5, 1.5, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.text);
  doc.text(title, M.left + 7, y + 3);
  return y + 8;
}

/** Paragraph text (multi-line, auto wrap) */
function para(doc: jsPDF, y: number, text: string, indent = 0, pn: { v: number }): number {
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  const maxW = contentW(doc) - indent;
  const lines: string[] = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    y = ensure(doc, y, 4.5, pn);
    doc.text(line, M.left + indent, y);
    y += 4;
  }
  return y + 1;
}

/** Muted explanation paragraph */
function muted(doc: jsPDF, y: number, text: string, indent = 0, pn: { v: number }): number {
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...C.textMuted);
  const lines: string[] = doc.splitTextToSize(text, contentW(doc) - indent);
  for (const line of lines) {
    y = ensure(doc, y, 4, pn);
    doc.text(line, M.left + indent, y);
    y += 3.5;
  }
  doc.setFont("helvetica", "normal");
  return y + 1.5;
}

/** Bullet item with coaching text */
function bullet(doc: jsPDF, y: number, text: string, pn: { v: number }): number {
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  const lines: string[] = doc.splitTextToSize(text, contentW(doc) - 8);
  // Bullet dot
  y = ensure(doc, y, lines.length * 4 + 1, pn);
  doc.setFillColor(...C.accent);
  doc.circle(M.left + 2, y - 1, 0.8, "F");
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], M.left + 6, y);
    y += 4;
  }
  return y + 0.5;
}

// ── Text Generation Helpers ──────────────────────────────────────────

/** Simple template formatter: fmt("Hello {0}, you scored {1}", "Alice", "95") */
function fmt(template: string, ...args: (string | number)[]): string {
  return template.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ""));
}

function buildBBTeamOverview(d: BattleBotReport, L: PDFLabels): string {
  const members = d.team.map(p => `${p.name} (${p.ability}, ${p.item || L.noItem})`).join(", ");
  return fmt(L.bbOverview, members, d.totalGames, d.winRate.toFixed(1), d.wins, d.losses, d.avgTurns.toFixed(1), d.tier);
}

function buildBBLeadAnalysis(d: BattleBotReport, L: PDFLabels): string[] {
  const lines: string[] = [];
  if (d.bestLeads.length === 0) return lines;
  const best = d.bestLeads[0];
  lines.push(fmt(L.bbLeadBest, best.lead1, best.lead2, best.winRate.toFixed(1), best.games));
  if (d.bestLeads.length >= 3) {
    const worst = d.bestLeads[d.bestLeads.length - 1];
    const gap = best.winRate - worst.winRate;
    if (gap > 10)
      lines.push(fmt(L.bbLeadGap, gap.toFixed(0)));
    else
      lines.push(fmt(L.bbLeadFlexible, gap.toFixed(0)));
  }
  return lines;
}

function buildBBArchAnalysis(d: BattleBotReport, L: PDFLabels): string[] {
  const lines: string[] = [];
  if (d.archetypeBreakdown.length === 0) return lines;
  const best = d.archetypeBreakdown[0];
  const worst = d.archetypeBreakdown[d.archetypeBreakdown.length - 1];
  lines.push(fmt(L.bbArchBest, best.archetype, best.winRate.toFixed(1)));
  if (worst.winRate < 45)
    lines.push(fmt(L.bbArchWorst, worst.archetype, worst.winRate.toFixed(1)));
  if (d.archetypeBreakdown.length >= 3) {
    const mid = d.archetypeBreakdown[Math.floor(d.archetypeBreakdown.length / 2)];
    if (mid.winRate >= 48 && mid.winRate <= 52)
      lines.push(fmt(L.bbArchCoinFlip, mid.archetype, mid.winRate.toFixed(1)));
  }
  return lines;
}

function buildBBThreatAnalysis(d: BattleBotReport, L: PDFLabels): string[] {
  const lines: string[] = [];
  if (d.threats.length === 0) return lines;
  const top3 = d.threats.slice(0, 3);
  for (const t of top3) {
    const lossRate = t.threatScore;
    if (lossRate >= 70)
      lines.push(fmt(L.bbThreatSevere, t.name, lossRate));
    else if (lossRate >= 55)
      lines.push(fmt(L.bbThreatNotable, t.name, lossRate, t.appearances));
    else
      lines.push(fmt(L.bbThreatManageable, t.name, t.appearances, lossRate));
  }
  return lines;
}

function buildBBMistakes(d: BattleBotReport, L: PDFLabels): string[] {
  const tips: string[] = [];
  if (d.commonWeaknesses.length > 0)
    for (const w of d.commonWeaknesses) tips.push(w);
  if (d.winRate < 48 && d.bestLeads.length > 0) {
    const bestLead = d.bestLeads[0];
    if (bestLead.winRate > d.winRate + 5)
      tips.push(fmt(L.bbMistakeLead, bestLead.lead1, bestLead.lead2));
  }
  return tips;
}

function buildBBProposals(d: BattleBotReport, L: PDFLabels): string[] {
  const proposals: string[] = [];
  const worstArch = d.archetypeBreakdown.length > 0 ? d.archetypeBreakdown[d.archetypeBreakdown.length - 1] : null;
  if (worstArch && worstArch.winRate < 40)
    proposals.push(fmt(L.bbPropTech, worstArch.archetype));
  const topThreat = d.threats[0];
  if (topThreat && topThreat.threatScore >= 65)
    proposals.push(fmt(L.bbPropAnswer, topThreat.name));
  if (d.bestLeads.length >= 2 && d.bestLeads[0].winRate - d.bestLeads[1].winRate > 8)
    proposals.push(L.bbPropLeadFlex);
  if (d.avgTurns < 6)
    proposals.push(fmt(L.bbPropFast, d.avgTurns.toFixed(1)));
  if (d.avgTurns > 14)
    proposals.push(fmt(L.bbPropSlow, d.avgTurns.toFixed(1)));
  return proposals;
}

// ── Team Tester Content Generation ───────────────────────────────────

function buildTTOverview(d: TeamTesterReport, L: PDFLabels): string {
  const t1 = d.team1.map(p => p.name).join(", ");
  const t2 = d.team2.map(p => p.name).join(", ");
  const verdict = d.winRate >= 55 ? L.ttVerdictT1 : d.winRate <= 45 ? L.ttVerdictT2 : L.ttVerdictClose;
  return fmt(L.ttOverview, `${L.team1} (${t1})`, `${L.team2} (${t2})`, d.totalGames, L.team1, d.winRate.toFixed(1), d.wins, d.losses, d.avgTurns.toFixed(1), verdict);
}

function buildTTImpactAnalysis(d: TeamTesterReport, L: PDFLabels): string[] {
  const lines: string[] = [];
  if (d.pokemonImpact.length === 0) return lines;
  const mvp = d.pokemonImpact[0];
  if (mvp.impact > 0)
    lines.push(fmt(L.ttImpactMVP, mvp.name, mvp.impact.toFixed(1), mvp.excludeWinRate.toFixed(1)));
  const weakest = d.pokemonImpact[d.pokemonImpact.length - 1];
  if (weakest.impact < -2)
    lines.push(fmt(L.ttImpactWeakest, weakest.name, weakest.impact.toFixed(1)));
  const allPositive = d.pokemonImpact.every(p => p.impact >= 0);
  if (allPositive)
    lines.push(L.ttImpactAllPositive);
  return lines;
}

function buildTTProposals(d: TeamTesterReport, L: PDFLabels): string[] {
  const proposals: string[] = [];
  if (d.winRate < 40)
    proposals.push(L.ttPropRough);
  if (d.winRate >= 40 && d.winRate < 50 && d.leadCombos.length > 0 && d.leadCombos[0].winRate >= 55)
    proposals.push(fmt(L.ttPropLeadSaves, d.leadCombos[0].lead1, d.leadCombos[0].lead2, d.leadCombos[0].winRate.toFixed(0)));
  if (d.winRate > 60)
    proposals.push(L.ttPropStrong);
  return proposals;
}

// ══════════════════════════════════════════════════════════════════════
//  BATTLE BOT PDF
// ══════════════════════════════════════════════════════════════════════

export async function exportBattleBotPDF(data: BattleBotReport, L: PDFLabels = PDF_LABELS_EN) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = pageW(doc);
  const cw = contentW(doc);
  const pn = { v: 1 };

  // ── Cover Header ────────────────────────────────────────────────────
  const logo = await loadLogoAsDataURL();
  let y = M.top + 4;
  if (logo) doc.addImage(logo, "PNG", M.left, y - 2, 16, 12.6);
  const logoOffset = logo ? 21 : 0;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(L.battleAnalysisReport, M.left + logoOffset, y + 5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textMuted);
  doc.text(L.competitiveGuide, M.left + logoOffset, y + 10);
  y += 18;

  // Divider
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.6);
  doc.line(M.left, y, pw - M.right, y);
  y += 6;

  // ── 1. Team at a Glance ────────────────────────────────────────────
  const minCardH = 34; // enough for badge + win rate on right side
  const cardH = Math.max(minCardH, 16 + data.team.length * 4);
  doc.setFillColor(...C.accentBg);
  doc.setDrawColor(...C.cardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(M.left, y, cw, cardH, 2.5, 2.5, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(L.yourTeam, M.left + 5, y + 6);
  doc.setFontSize(12);
  doc.setTextColor(...C.text);
  doc.text(data.teamName || L.customTeam, M.left + 5, y + 13);

  // Win rate + tier badge on right side
  const badgeW2 = 30;
  const badgeX = pw - M.right - badgeW2 - 4;
  const badgeMidX = badgeX + badgeW2 / 2;
  const badgeColor = wrColor(data.winRate);
  doc.setFillColor(...badgeColor);
  doc.roundedRect(badgeX, y + 4, badgeW2, 10, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(data.tier, badgeMidX, y + 11, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(...badgeColor);
  doc.text(`${data.winRate.toFixed(1)}%`, badgeMidX, y + 23, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text(L.winRate, badgeMidX, y + 27, { align: "center" });

  // Team members — single column, clipped to avoid badge
  const maxTextW = badgeX - M.left - 10;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textMuted);
  for (let i = 0; i < data.team.length; i++) {
    const p = data.team[i];
    let line = `${p.name}  –  ${p.ability}  –  ${p.item || L.noItem}`;
    // Truncate if too wide
    while (doc.getTextWidth(line) > maxTextW && line.length > 10) line = line.slice(0, -2) + "…";
    doc.text(line, M.left + 5, y + 18 + i * 4);
  }

  y += cardH + 6;

  // ── 2. Stat Bar ────────────────────────────────────────────────────
  const statItems = [
    { l: L.games, v: data.totalGames.toString(), c: C.text },
    { l: L.wins, v: data.wins.toString(), c: C.green },
    { l: L.losses, v: data.losses.toString(), c: C.red },
    { l: L.avgTurns, v: data.avgTurns.toFixed(1), c: C.text },
  ];
  const sw = cw / 4;
  for (let i = 0; i < 4; i++) {
    const x = M.left + sw * i;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...statItems[i].c);
    doc.text(statItems[i].v, x + sw / 2, y + 5, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text(statItems[i].l, x + sw / 2, y + 9, { align: "center" });
  }
  y += 14;

  // Thin divider
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.2);
  doc.line(M.left, y, pw - M.right, y);
  y += 6;

  // ── 3. Executive Summary ───────────────────────────────────────────
  y = heading(doc, y, L.executiveSummary);
  y = para(doc, y, buildBBTeamOverview(data, L), 0, pn);
  y += 2;

  // ── 4. Lead Selection Guide ────────────────────────────────────────
  if (data.bestLeads.length > 0) {
    y = ensure(doc, y, 40, pn);
    y = heading(doc, y, L.leadSelectionGuide, C.blue);
    y = muted(doc, y, L.leadMuted, 0, pn);
    y += 1;

    // Lead table
    doc.setFillColor(...C.blueBg);
    doc.roundedRect(M.left, y, cw, 6, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.blue);
    doc.text("#", M.left + 3, y + 4);
    doc.text(L.leadPair, M.left + 10, y + 4);
    doc.text(L.games, pw - M.right - 40, y + 4, { align: "center" });
    doc.text(L.winRate, pw - M.right - 10, y + 4, { align: "center" });
    y += 8;

    for (let i = 0; i < Math.min(data.bestLeads.length, 6); i++) {
      const lead = data.bestLeads[i];
      y = ensure(doc, y, 6, pn);
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M.left, y - 1.5, cw, 6, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${i + 1}`, M.left + 3, y + 2);
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "bold");
      doc.text(`${lead.lead1}  +  ${lead.lead2}`, M.left + 10, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${lead.games}`, pw - M.right - 40, y + 2, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...wrColor(lead.winRate));
      doc.text(`${lead.winRate.toFixed(1)}%`, pw - M.right - 10, y + 2, { align: "center" });
      y += 6;
    }
    y += 3;

    // Lead coaching paragraphs
    for (const line of buildBBLeadAnalysis(data, L)) y = para(doc, y, line, 0, pn);
    y += 3;
  }

  // ── 5. Archetype Matchup Study ─────────────────────────────────────
  if (data.archetypeBreakdown.length > 0) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.archetypeMatchupStudy, C.accent);
    y = muted(doc, y, L.archetypeMuted, 0, pn);
    y += 1;

    for (const arch of data.archetypeBreakdown.slice(0, 8)) {
      y = ensure(doc, y, 8, pn);
      const color = wrColor(arch.winRate);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(arch.archetype, M.left + 2, y + 3);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${arch.count} ${L.teams}`, M.left + 55, y + 3);
      drawBar(doc, M.left + 80, y + 0.5, 65, 4, arch.winRate, color);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(`${arch.winRate.toFixed(1)}%`, pw - M.right - 5, y + 3, { align: "right" });
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textLight);
      doc.text(wrLabel(arch.winRate, L), pw - M.right - 5, y + 6.5, { align: "right" });
      y += 9;
    }
    y += 2;

    for (const line of buildBBArchAnalysis(data, L)) y = para(doc, y, line, 0, pn);
    y += 3;
  }

  // ── 6. Threat Scouting Report ──────────────────────────────────────
  if (data.threats.length > 0) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.threatScoutingReport, C.red);
    y = muted(doc, y, L.threatMuted, 0, pn);
    y += 1;

    // Header
    doc.setFillColor(...C.redBg);
    doc.roundedRect(M.left, y, cw, 6, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.red);
    doc.text(L.pokemon, M.left + 3, y + 4);
    doc.text(L.seen, M.left + 65, y + 4, { align: "center" });
    doc.text(L.lossRate, pw - M.right - 30, y + 4, { align: "center" });
    doc.text(L.severity, pw - M.right - 5, y + 4, { align: "right" });
    y += 8;

    for (let i = 0; i < Math.min(data.threats.length, 10); i++) {
      const t = data.threats[i];
      y = ensure(doc, y, 6, pn);
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M.left, y - 1.5, cw, 6, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(t.name, M.left + 3, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${t.appearances}`, M.left + 65, y + 2, { align: "center" });
      const lr = t.threatScore;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...wrColor(100 - lr));
      doc.text(`${lr}%`, pw - M.right - 30, y + 2, { align: "center" });
      const severity = lr >= 70 ? L.severityCritical : lr >= 55 ? L.severityHigh : L.severityModerate;
      doc.setFontSize(6.5);
      doc.text(severity, pw - M.right - 5, y + 2, { align: "right" });
      y += 6;
    }
    y += 3;

    // Coaching
    for (const line of buildBBThreatAnalysis(data, L)) y = bullet(doc, y, line, pn);
    y += 3;
  }

  // ── 7. Full Matchup Breakdown ──────────────────────────────────────
  if (data.matchupBreakdown.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.fullMatchupBreakdown);
    y = muted(doc, y, L.matchupMuted, 0, pn);
    y += 1;

    // Header
    doc.setFillColor(...C.accentBg);
    doc.roundedRect(M.left, y, cw, 5.5, 1.5, 1.5, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.accent);
    doc.text(L.opponentTeam, M.left + 3, y + 3.8);
    doc.text("W", M.left + cw * 0.6, y + 3.8, { align: "center" });
    doc.text("L", M.left + cw * 0.68, y + 3.8, { align: "center" });
    doc.text("WR%", M.left + cw * 0.8, y + 3.8, { align: "center" });
    doc.text(L.verdict, pw - M.right - 3, y + 3.8, { align: "right" });
    y += 7;

    for (let i = 0; i < Math.min(data.matchupBreakdown.length, 25); i++) {
      const m = data.matchupBreakdown[i];
      y = ensure(doc, y, 5.5, pn);
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M.left, y - 1.5, cw, 5.5, "F");
      }
      const oppName = m.opponent.length > 38 ? m.opponent.slice(0, 38) + "…" : m.opponent;
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.text);
      doc.text(oppName, M.left + 3, y + 2);
      doc.setTextColor(...C.green);
      doc.text(`${m.wins}`, M.left + cw * 0.6, y + 2, { align: "center" });
      doc.setTextColor(...C.red);
      doc.text(`${m.losses}`, M.left + cw * 0.68, y + 2, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...wrColor(m.winRate));
      doc.text(`${m.winRate.toFixed(1)}`, M.left + cw * 0.8, y + 2, { align: "center" });
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(wrLabel(m.winRate, L), pw - M.right - 3, y + 2, { align: "right" });
      y += 5.5;
    }
    y += 4;
  }

  // ── 8. Strategy & Coaching ─────────────────────────────────────────
  if (data.strategyTips.length > 0 || data.commonWeaknesses.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.strategyGamePlan, C.green);
    y = muted(doc, y, L.strategyMuted, 0, pn);
    y += 1;
    for (const tip of data.strategyTips) y = bullet(doc, y, tip, pn);
    y += 3;
  }

  // ── 9. Mistakes & Weaknesses ───────────────────────────────────────
  const mistakes = buildBBMistakes(data, L);
  if (mistakes.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.weaknessesCommonMistakes, C.orange);
    y = muted(doc, y, L.weaknessesMuted, 0, pn);
    y += 1;
    for (const m of mistakes) y = bullet(doc, y, m, pn);
    y += 3;
  }

  // ── 10. Improvement Proposals ──────────────────────────────────────
  const proposals = buildBBProposals(data, L);
  if (proposals.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.improvementProposals, C.accent);
    y = muted(doc, y, L.proposalsMuted, 0, pn);
    y += 1;
    for (let i = 0; i < proposals.length; i++) {
      y = ensure(doc, y, 10, pn);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.accent);
      doc.text(`${L.proposal} ${i + 1}`, M.left + 2, y);
      y += 4;
      y = para(doc, y, proposals[i], 2, pn);
      y += 2;
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────
  addFooter(doc, pn.v);
  doc.save("ChampionsLab_BattleSimResult.pdf");
}

// ══════════════════════════════════════════════════════════════════════
//  TEAM TESTER PDF
// ══════════════════════════════════════════════════════════════════════

export async function exportTeamTesterPDF(data: TeamTesterReport, L: PDFLabels = PDF_LABELS_EN) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = pageW(doc);
  const cw = contentW(doc);
  const pn = { v: 1 };

  // ── Cover Header ────────────────────────────────────────────────────
  const logo = await loadLogoAsDataURL();
  let y = M.top + 4;
  if (logo) doc.addImage(logo, "PNG", M.left, y - 2, 16, 12.6);
  const logoOffset = logo ? 21 : 0;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(L.matchupStudyReport, M.left + logoOffset, y + 5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textMuted);
  doc.text(L.teamVsTeamDeepDive, M.left + logoOffset, y + 10);
  y += 18;

  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.6);
  doc.line(M.left, y, pw - M.right, y);
  y += 6;

  // ── 1. Teams Card ──────────────────────────────────────────────────
  const gap = 16; // wide gap so VS badge doesn't overlap either card
  const halfW = (cw - gap) / 2;
  const t2X = M.left + halfW + gap;

  // Team 1
  doc.setFillColor(...C.blueBg);
  doc.setDrawColor(...C.cardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(M.left, y, halfW, 34, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blue);
  doc.text(L.team1, M.left + 4, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  for (let i = 0; i < data.team1.length; i++) {
    const p = data.team1[i];
    doc.text(`${p.name}  (${p.item || "—"})`, M.left + 4, y + 12 + i * 3.5);
  }

  // VS badge centered in the gap
  const vsCX = M.left + halfW + gap / 2;
  doc.setFillColor(...C.accent);
  doc.roundedRect(vsCX - 5, y + 12, 10, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("VS", vsCX, y + 19, { align: "center" });

  // Team 2
  doc.setFillColor(...C.redBg);
  doc.setDrawColor(...C.cardBorder);
  doc.roundedRect(t2X, y, halfW, 34, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.red);
  doc.text(L.team2, t2X + 4, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  for (let i = 0; i < data.team2.length; i++) {
    const p = data.team2[i];
    doc.text(`${p.name}  (${p.item || "—"})`, t2X + 4, y + 12 + i * 3.5);
  }

  y += 40;

  // ── 2. Result Bar ──────────────────────────────────────────────────
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.cardBorder);
  doc.roundedRect(M.left, y, cw, 22, 2.5, 2.5, "FD");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...wrColor(data.winRate));
  doc.text(`${data.winRate.toFixed(1)}%`, pw / 2, y + 10, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text(L.team1WinRate, pw / 2, y + 14, { align: "center" });

  // Bar
  const barY = y + 16;
  drawBar(doc, M.left + 5, barY, cw - 10, 3.5, 100, C.red);
  if (data.winRate > 0) drawBar(doc, M.left + 5, barY, (cw - 10) * data.winRate / 100, 3.5, data.winRate, C.blue);

  doc.setFontSize(6.5);
  doc.setTextColor(...C.blue);
  doc.text(`${data.wins}W`, M.left + 5, barY - 1);
  doc.setTextColor(...C.red);
  doc.text(`${data.losses}W`, pw - M.right - 5, barY - 1, { align: "right" });

  y += 28;

  // Stats row
  const s2 = [
    { l: L.games, v: data.totalGames.toString() },
    { l: L.avgTurns, v: data.avgTurns.toFixed(1) },
    { l: L.verdict, v: wrLabel(data.winRate, L) },
  ];
  const s2w = cw / 3;
  for (let i = 0; i < 3; i++) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.text);
    doc.text(s2[i].v, M.left + s2w * i + s2w / 2, y + 3, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(...C.textMuted);
    doc.text(s2[i].l, M.left + s2w * i + s2w / 2, y + 7, { align: "center" });
  }
  y += 12;

  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.2);
  doc.line(M.left, y, pw - M.right, y);
  y += 6;

  // ── 3. Overview ────────────────────────────────────────────────────
  y = heading(doc, y, L.matchupOverview);
  y = para(doc, y, buildTTOverview(data, L), 0, pn);
  y += 3;

  // ── 4. Lead Selection Guide ────────────────────────────────────────
  if (data.leadCombos.length > 0) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.leadSelectionGuide, C.blue);
    y = muted(doc, y, L.leadOpeningMuted, 0, pn);
    y += 1;

    doc.setFillColor(...C.blueBg);
    doc.roundedRect(M.left, y, cw, 5.5, 1.5, 1.5, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.blue);
    doc.text("#", M.left + 3, y + 3.8);
    doc.text(L.leadPair, M.left + 10, y + 3.8);
    doc.text(L.games, pw - M.right - 35, y + 3.8, { align: "center" });
    doc.text(L.winRate, pw - M.right - 10, y + 3.8, { align: "center" });
    y += 7;

    for (let i = 0; i < Math.min(data.leadCombos.length, 5); i++) {
      const lc = data.leadCombos[i];
      y = ensure(doc, y, 6, pn);
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M.left, y - 1.5, cw, 5.5, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${i + 1}`, M.left + 3, y + 2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(`${lc.lead1}  +  ${lc.lead2}`, M.left + 10, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${lc.games}`, pw - M.right - 35, y + 2, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...wrColor(lc.winRate));
      doc.text(`${lc.winRate.toFixed(1)}%`, pw - M.right - 10, y + 2, { align: "center" });
      y += 6;
    }

    if (data.leadCombos.length >= 2) {
      y += 2;
      const best = data.leadCombos[0];
      const worst = data.leadCombos[data.leadCombos.length - 1];
      y = para(doc, y, fmt(L.ttLeadBestPara, best.lead1, best.lead2, best.winRate.toFixed(1), best.winRate - worst.winRate > 15 ? L.ttLeadMakeOrBreak : L.ttLeadFlexible), 0, pn);
    }
    y += 3;
  }

  // ── 5. Speed Tier Comparison ───────────────────────────────────────
  if (data.speedTiers) {
    y = ensure(doc, y, 40, pn);
    y = heading(doc, y, L.speedTierComparison, C.blue);
    y = muted(doc, y, L.speedMuted, 0, pn);
    y += 2;

    const allSpeeds = [
      ...data.speedTiers.team1.map(s => ({ ...s, team: 1 as const })),
      ...data.speedTiers.team2.map(s => ({ ...s, team: 2 as const })),
    ].sort((a, b) => b.maxSpeed - a.maxSpeed);

    // Table header
    const cols = [
      { l: L.pokemon, x: M.left + 3, w: 38 },
      { l: L.base, x: M.left + 43, w: 14 },
      { l: L.min, x: M.left + 59, w: 14 },
      { l: L.neutral, x: M.left + 75, w: 16 },
      { l: L.max, x: M.left + 93, w: 14 },
      { l: L.scarf, x: M.left + 109, w: 16 },
      { l: L.tailwind, x: M.left + 127, w: 18 },
    ];
    doc.setFillColor(...C.blueBg);
    doc.roundedRect(M.left, y, cw, 5.5, 1.5, 1.5, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.blue);
    for (const c of cols) doc.text(c.l, c.x, y + 3.8);
    y += 7;

    for (let i = 0; i < allSpeeds.length; i++) {
      const s = allSpeeds[i];
      y = ensure(doc, y, 5.5, pn);
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M.left, y - 1.5, cw, 5.5, "F");
      }
      // Team color indicator
      const teamColor = s.team === 1 ? C.blue : C.red;
      doc.setFillColor(...teamColor);
      doc.roundedRect(M.left, y - 1, 1.5, 4, 0.5, 0.5, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name, M.left + 3, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${s.baseSpeed}`, cols[1].x, y + 2);
      doc.text(`${s.minSpeed}`, cols[2].x, y + 2);
      doc.text(`${s.neutralSpeed}`, cols[3].x, y + 2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(`${s.maxSpeed}`, cols[4].x, y + 2);
      doc.setTextColor(...C.accent);
      doc.text(`${s.scarfSpeed}`, cols[5].x, y + 2);
      doc.setTextColor(...C.green);
      doc.text(`${s.tailwindSpeed}`, cols[6].x, y + 2);
      y += 5.5;
    }
    y += 2;
    // Speed insight
    const t1Fast = data.speedTiers.team1[0];
    const t2Fast = data.speedTiers.team2[0];
    if (t1Fast && t2Fast) {
      const faster = t1Fast.maxSpeed >= t2Fast.maxSpeed ? L.team1 : L.team2;
      const fasterName = t1Fast.maxSpeed >= t2Fast.maxSpeed ? t1Fast.name : t2Fast.name;
      const diff = Math.abs(t1Fast.maxSpeed - t2Fast.maxSpeed);
      const speedComment = diff < 5 ? L.ttSpeedManageable : diff > 30 ? L.ttSpeedHuge : L.ttSpeedManageable;
      if (diff > 0) {
        y = para(doc, y, fmt(L.ttSpeedFaster, faster, fasterName, diff, speedComment), 0, pn);
      } else {
        y = para(doc, y, fmt(L.ttSpeedTied, faster, fasterName, speedComment), 0, pn);
      }
    }
    y += 4;
  }

  // ── 6. Type Coverage & Weakness Profile ────────────────────────────
  if (data.typeProfile) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.typeCoverageWeaknesses, C.red);
    y = muted(doc, y, L.typeMuted, 0, pn);
    y += 2;

    for (const [label, profile, color, bg] of [
      [L.team1YourTeam, data.typeProfile.team1, C.blue, C.blueBg] as const,
      [L.team2Opponent, data.typeProfile.team2, C.red, C.redBg] as const,
    ]) {
      y = ensure(doc, y, 22, pn);
      doc.setFillColor(...bg);
      doc.roundedRect(M.left, y, cw, 5, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(label, M.left + 3, y + 3.5);
      y += 7;

      // Weaknesses
      if (profile.weaknesses.length > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.red);
        doc.text(L.weakTo, M.left + 2, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const weakStr = profile.weaknesses
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map(w => `${w.type} (×${w.count})`)
          .join("  •  ");
        doc.text(weakStr, M.left + 22, y);
        y += 4;
      }

      // Resistances
      if (profile.resistances.length > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.green);
        doc.text(L.resists, M.left + 2, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        const resStr = profile.resistances
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map(r => `${r.type} (×${r.count})`)
          .join("  •  ");
        doc.text(resStr, M.left + 22, y);
        y += 4;
      }

      // Uncovered types
      if (profile.uncovered.length > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.orange);
        doc.text(L.cantHit, M.left + 2, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        doc.text(profile.uncovered.join(", "), M.left + 22, y);
        y += 4;
      }
      y += 3;
    }

    // Cross-team coaching
    const t1Weak = data.typeProfile.team1.weaknesses;
    const t2Coverage = data.typeProfile.team2.uncovered;
    const dangerTypes = t1Weak.filter(w => w.count >= 3).map(w => w.type);
    if (dangerTypes.length > 0) {
      y = para(doc, y, fmt(L.ttTypeWeakness, dangerTypes.length, dangerTypes.length > 1 ? "s" : "", dangerTypes.join(", "), dangerTypes.length > 1 ? dangerTypes.join(", ") : dangerTypes[0]), 0, pn);
    }
    y += 3;
  }

  // ── 7. Role & Archetype Breakdown ──────────────────────────────────
  if (data.roles || data.archetypes) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.teamIdentityRoleMap, C.accent);
    y = muted(doc, y, L.roleMuted, 0, pn);
    y += 2;

    // Archetype badges
    if (data.archetypes) {
      for (const [label, arches, color, bg] of [
        [L.team1Archetype, data.archetypes.team1, C.blue, C.blueBg] as const,
        [L.team2Archetype, data.archetypes.team2, C.red, C.redBg] as const,
      ]) {
        if (arches.length === 0) continue;
        y = ensure(doc, y, 10, pn);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(`${label}`, M.left + 2, y);
        let ax = M.left + 38;
        for (const a of arches.slice(0, 3)) {
          doc.setFillColor(...bg);
          const archLabel = `${a.archetype} (${Math.round(a.confidence * 100)}%)`;
          const archW = doc.getTextWidth(archLabel) + 6;
          doc.roundedRect(ax, y - 3, archW, 5, 1.5, 1.5, "F");
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...color);
          doc.text(archLabel, ax + 3, y);
          ax += archW + 3;
        }
        y += 6;
      }
      y += 2;
    }

    // Role table
    if (data.roles) {
      for (const [label, roles, color, bg] of [
        [L.team1Roles, data.roles.team1, C.blue, C.blueBg] as const,
        [L.team2Roles, data.roles.team2, C.red, C.redBg] as const,
      ]) {
        y = ensure(doc, y, 8 + roles.length * 5, pn);
        doc.setFillColor(...bg);
        doc.roundedRect(M.left, y, cw, 5, 1.5, 1.5, "F");
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(label, M.left + 3, y + 3.5);
        doc.text(L.primaryRole, M.left + 55, y + 3.5);
        doc.text(L.additionalRoles, M.left + 95, y + 3.5);
        y += 7;

        for (let i = 0; i < roles.length; i++) {
          const r = roles[i];
          y = ensure(doc, y, 5, pn);
          if (i % 2 === 0) {
            doc.setFillColor(...C.rowAlt);
            doc.rect(M.left, y - 1.5, cw, 5, "F");
          }
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...C.text);
          doc.text(r.name, M.left + 3, y + 2);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...C.accent);
          doc.text(r.primaryRole.replace(/-/g, " "), M.left + 55, y + 2);
          doc.setTextColor(...C.textMuted);
          const extraRoles = r.roles.filter(rl => rl !== r.primaryRole).slice(0, 3).map(rl => rl.replace(/-/g, " ")).join(", ");
          doc.text(extraRoles || "—", M.left + 95, y + 2);
          y += 5;
        }
        y += 4;
      }

      // Role gap coaching
      const t1Roles = new Set(data.roles.team1.flatMap(r => r.roles));
      const missing: string[] = [];
      if (!t1Roles.has("speed-control") && !t1Roles.has("trick-room-setter")) missing.push("speed control");
      if (!t1Roles.has("redirector")) missing.push("redirection");
      if (!t1Roles.has("intimidate-user")) missing.push("Intimidate");
      if (missing.length > 0) {
        y = para(doc, y, fmt(L.ttRoleMissing, missing.join(" & ")), 0, pn);
      }
    }

    // Synergy scores
    if (data.synergyScores) {
      y = ensure(doc, y, 10, pn);
      y += 2;
      const s1 = data.synergyScores.team1;
      const s2 = data.synergyScores.team2;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(L.teamSynergyScore, M.left + 2, y);
      doc.setTextColor(...(s1 >= 60 ? C.green : s1 >= 40 ? C.orange : C.red));
      doc.text(`${L.team1}: ${s1}/100`, M.left + 48, y);
      doc.setTextColor(...(s2 >= 60 ? C.green : s2 >= 40 ? C.orange : C.red));
      doc.text(`${L.team2}: ${s2}/100`, M.left + 90, y);
      y += 6;
    }
    y += 3;
  }

  // ── 8. Pokémon Impact Analysis ─────────────────────────────────────
  if (data.pokemonImpact.length > 0) {
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.pokemonImpactAnalysis, C.gold);
    y = muted(doc, y, L.impactMuted, 0, pn);
    y += 2;

    for (const mon of data.pokemonImpact) {
      y = ensure(doc, y, 8, pn);
      const impactColor = mon.impact >= 0 ? C.green : C.red;
      const impactBg = mon.impact >= 0 ? C.greenBg : C.redBg;
      doc.setFillColor(...impactBg);
      doc.roundedRect(M.left, y, cw, 6.5, 1.5, 1.5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(mon.name, M.left + 4, y + 4.5);
      doc.setTextColor(...impactColor);
      doc.text(`${mon.impact >= 0 ? "+" : ""}${mon.impact.toFixed(1)}%`, M.left + cw * 0.5, y + 4.5, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`${L.wrWithout} ${mon.excludeWinRate.toFixed(1)}%`, pw - M.right - 4, y + 4.5, { align: "right" });
      y += 8;
    }
    y += 2;

    for (const line of buildTTImpactAnalysis(data, L)) y = bullet(doc, y, line, pn);
    y += 3;
  }

  // ── 9. Matchup Insights ────────────────────────────────────────────
  if (data.insights.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.matchupInsightsCoaching, C.green);
    y = muted(doc, y, L.insightsMuted, 0, pn);
    y += 1;
    for (const insight of data.insights) y = bullet(doc, y, insight, pn);
    y += 3;
  }

  // ── 10. Improvement Proposals ──────────────────────────────────────
  const proposals = buildTTProposals(data, L);
  if (proposals.length > 0) {
    y = ensure(doc, y, 20, pn);
    y = heading(doc, y, L.whatYouCanDoNext, C.accent);
    y += 1;
    for (let i = 0; i < proposals.length; i++) {
      y = ensure(doc, y, 10, pn);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.accent);
      doc.text(`${i + 1}.`, M.left + 2, y);
      y += 4;
      y = para(doc, y, proposals[i], 4, pn);
      y += 2;
    }
  }

  // ── Strategy Flowchart ─────────────────────────────────────────────
  if (data.strategy) {
    const s = data.strategy;
    y = ensure(doc, y, 30, pn);
    y = heading(doc, y, L.strategyFlowchart, C.accent);
    y = muted(doc, y, L.flowchartMuted, 0, pn);
    y += 2;

    // Archetype + Win Condition badges
    const badgeW = cw / 2 - 2;
    doc.setFillColor(...C.accentBg);
    doc.roundedRect(M.left, y, badgeW, 10, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.accent);
    doc.text(L.archetype, M.left + 3, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(...C.text);
    doc.text(s.archetype, M.left + 3, y + 8);

    doc.setFillColor(...C.greenBg);
    doc.roundedRect(M.left + badgeW + 4, y, badgeW, 10, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.green);
    doc.text(L.winCondition, M.left + badgeW + 7, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(...C.text);
    doc.text(s.winCondition, M.left + badgeW + 7, y + 8);
    y += 14;

    // Steps
    for (const step of s.steps) {
      y = ensure(doc, y, 10, pn);
      const sColor = step.severity === "good" ? C.green : step.severity === "bad" ? C.red : C.blue;
      const sBg = step.severity === "good" ? C.greenBg : step.severity === "bad" ? C.redBg : C.blueBg;
      doc.setFillColor(...sBg);
      doc.roundedRect(M.left + 2, y, cw - 4, step.detail ? 10 : 7, 1.5, 1.5, "F");
      doc.setFillColor(...sColor);
      doc.roundedRect(M.left + 2, y, 2, step.detail ? 10 : 7, 0.5, 0.5, "F"); // left accent bar
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(step.label, M.left + 7, y + 4.5);
      if (step.detail) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.textMuted);
        const detailLines: string[] = doc.splitTextToSize(step.detail, cw - 16);
        doc.text(detailLines[0], M.left + 7, y + 8.5);
      }
      // Connector line
      y += step.detail ? 12 : 9;
      if (s.steps.indexOf(step) < s.steps.length - 1) {
        doc.setDrawColor(...C.divider);
        doc.setLineWidth(0.3);
        doc.line(pw / 2, y - 1.5, pw / 2, y + 1);
        y += 2;
      }
    }
    y += 4;

    // Key Threats
    if (s.keyThreats.length > 0) {
      y = ensure(doc, y, 10, pn);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.red);
      doc.text(L.keyThreats, M.left + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.text);
      doc.text(s.keyThreats.join(", "), M.left + 30, y);
      y += 5;
    }

    // Backup Plan
    if (s.backupPlan) {
      y = ensure(doc, y, 10, pn);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.orange);
      doc.text(L.backupPlan, M.left + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.text);
      const bpLines: string[] = doc.splitTextToSize(s.backupPlan, cw - 30);
      doc.text(bpLines, M.left + 30, y);
      y += bpLines.length * 3.5 + 3;
    }
    y += 4;
  }

  addFooter(doc, pn.v);
  doc.save("ChampionsLab_MatchupStudy.pdf");
}
