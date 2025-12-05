export type Lang = "en" | "pl";

export type Team = "A" | "B";

export interface AnswerState {
  text: string;
  points: number;
  revealed: boolean;
  awardedTo?: Team | null;
};

export interface RoundState {
  question: string;
  answers: AnswerState[];
  questionRevealed: boolean;
  strikesA: number;
  strikesB: number;
};

export interface GameState {
  lang: Lang,
  questionIndex: number;
  questionCount: number;
  nameA: string;
  nameB: string;
  scoreA: number;
  scoreB: number;
  rounds: RoundState[];
};