import type { Lang } from '../types.ts';

const dictionaries: Record<Lang, Record<string, string>> = {
  en: {
    answers: "Answers",
    awarded: "Awarded",
    hidden: "Hidden",
    nextQuestion: "Next Question",
    prevQuestion: "Previous Question",
    pts: "points",
    question: "Question",
    reveal: "Reveal",
    revealAll: "Reveal All",
    revealQuestion: "Reveal Question",
    scoreA: "Score A",
    scoreB: "Score B",
    strikeA: "Strike A",
    strikeB: "Strike B",
    strikes: "Strikes",
    teamA: "Team A",
    teamB: "Team B",
    title: "Family Feud",
  },
  pl: {
    answers: "Odpowiedzi",
    awarded: "Przyznano",
    hidden: "Ukryte",
    nextQuestion: "Następne Pytanie",
    prevQuestion: "Poprzednie Pytanie",
    pts: "punktów",
    question: "Pytanie",
    reveal: "Odkryj",
    revealAll: "Odkryj Wszystkie",
    revealQuestion: "Odkryj Pytanie",
    scoreA: "Punkty A",
    scoreB: "Punkty B",
    strikeA: "Błąd dla A",
    strikeB: "Błąd dla B",
    strikes: "Błędy",
    teamA: "Drużyna A",
    teamB: "Drużyna B",
    title: "Familiada",
  }
};

export function t(key: string, lang: Lang): string {
  return dictionaries[lang][key] ?? key;
}
