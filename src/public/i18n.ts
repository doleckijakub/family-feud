type Lang = "en" | "pl";

const dictionaries: Record<Lang, Record<string, string>> = {
  en: {
    title: "Family Feud",
    revealQuestion: "Reveal Question",
    teamA: "Team A",
    teamB: "Team B",
    strikes: "Strikes",
    revealAll: "Reveal All",
    nextRound: "Next Round",
    answers: "Answers",
    strikeA: "Strike A",
    strikeB: "Strike B",
    scoreA: "Score A",
    scoreB: "Score B",
    hidden: "Hidden",
  },
  pl: {
    title: "Familiada",
    revealQuestion: "Odkryj Pytanie",
    teamA: "Drużyna A",
    teamB: "Drużyna B",
    strikes: "Błędy",
    revealAll: "Odkryj Wszystkie",
    nextRound: "Następna Runda",
    answers: "Odpowiedzi",
    strikeA: "Błąd dla A",
    strikeB: "Błąd dla B",
    scoreA: "Punkty A",
    scoreB: "Punkty B",
    hidden: "Ukryte",
  }
};

export function getLang(): Lang {
  const url = new URL(window.location.href);
  const l = url.searchParams.get("lang");
  if (l === "pl") return "pl";
  return "en";
}

export function t(key: string): string {
  const lang = getLang();
  return dictionaries[lang][key] ?? key;
}
