export type Lang = "en" | "pl";

export type Team = "A" | "B";

export interface AnswerState {
  text: string;
  points: number;
  revealed: boolean;
  awardedTo?: Team | null;
}

export interface GameState {
  lang: Lang,
  questionIndex: number;
  questionCount: number;
  question: string;
  answers: AnswerState[];
  questionRevealed: boolean;
  nameA: string;
  nameB: string;
  strikesA: number;
  strikesB: number;
  scoreA: number;
  scoreB: number;
}