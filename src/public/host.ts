import { t } from './i18n.js';

type Team = "A" | "B";

interface AnswerState {
  text: string;
  points: number;
  revealed: boolean;
  awardedTo?: Team | null;
}

interface GameState {
  questionIndex: number;
  question: string;
  answers: AnswerState[];
  questionRevealed: boolean;
  strikesA: number;
  strikesB: number;
  scoreA: number;
  scoreB: number;
}

const gameId = window.location.pathname.split("/")[1] ?? "000";
const ws = new WebSocket(`ws://${location.host}/ws/${gameId}/host`);

const questionBox = document.getElementById("questionBox") as HTMLElement;
const answersList = document.getElementById("answersList") as HTMLElement;
const scoreAEl = document.getElementById("scoreA") as HTMLElement;
const scoreBEl = document.getElementById("scoreB") as HTMLElement;
const strikesAEl = document.getElementById("strikesA") as HTMLElement;
const strikesBEl = document.getElementById("strikesB") as HTMLElement;

const btnRevealQuestion = document.getElementById("revealQuestion") as HTMLButtonElement;
const btnRevealAll = document.getElementById("revealAll") as HTMLButtonElement;
const btnNextQuestion = document.getElementById("nextQuestion") as HTMLButtonElement;
const btnStrikeA = document.getElementById("strikeA") as HTMLButtonElement;
const btnStrikeB = document.getElementById("strikeB") as HTMLButtonElement;

(document.getElementById("title") as HTMLElement).textContent = t("title");
(document.getElementById("revealQuestion") as HTMLElement).textContent = t("revealQuestion");
(document.getElementById("revealAll") as HTMLElement).textContent = t("revealAll");
(document.getElementById("nextQuestion") as HTMLElement).textContent = t("nextQuestion");

(document.getElementById("teamA") as HTMLElement).textContent = t("teamA");
scoreAEl.textContent = t("scoreA");
strikesAEl.textContent = t("strikesA");

(document.getElementById("teamB") as HTMLElement).textContent = t("teamB");
scoreBEl.textContent = t("scoreB");
strikesBEl.textContent = t("strikesB");

document.querySelectorAll(".strikes").forEach(e => e.textContent = t("strikes"));

btnRevealQuestion.onclick = () => ws.send(JSON.stringify({ type: "revealQuestion" }));
btnRevealAll.onclick = () => ws.send(JSON.stringify({ type: "revealAll" }));
btnNextQuestion.onclick = () => ws.send(JSON.stringify({ type: "nextQuestion" }));
btnStrikeA.onclick = () => ws.send(JSON.stringify({ type: "strike", team: "A" }));
btnStrikeB.onclick = () => ws.send(JSON.stringify({ type: "strike", team: "B" }));

function renderAnswers(state: GameState) {
  answersList.innerHTML = "";
  state.answers.forEach((ans, i) => {
    const row = document.createElement("div");
    row.className = "answerRow";

    const text = document.createElement("div");
    text.className = "answerText";
    text.textContent = ans.revealed ? `${ans.text} - ${ans.points} pts` : `${ans.text} - ${ans.points} pts`;

    const small = document.createElement("div");
    small.className = "small";
    small.textContent = ans.awardedTo ? `Awarded: ${ans.awardedTo}` : "";

    const btns = document.createElement("div");
    btns.className = "answerButtons";

    const btnA = document.createElement("button");
    btnA.className = "btn-ghost";
    btnA.textContent = "A";
    btnA.title = "Give points to Team A";
    btnA.onclick = () => ws.send(JSON.stringify({ type: "assignPoints", index: i, team: "A" }));

    const btnB = document.createElement("button");
    btnB.className = "btn-ghost";
    btnB.textContent = "B";
    btnB.title = "Give points to Team B";
    btnB.onclick = () => ws.send(JSON.stringify({ type: "assignPoints", index: i, team: "B" }));

    const btnReveal = document.createElement("button");
    btnReveal.className = "btn-ghost";
    btnReveal.textContent = "Reveal";
    btnReveal.onclick = () => ws.send(JSON.stringify({ type: "revealAnswer", index: i }));

    btns.appendChild(btnA);
    btns.appendChild(btnB);
    btns.appendChild(btnReveal);

    row.appendChild(text);
    row.appendChild(small);
    row.appendChild(btns);

    answersList.appendChild(row);
  });
}

ws.onopen = () => console.log("host ws open");
ws.onmessage = (ev: MessageEvent) => {
  const msg = JSON.parse(ev.data) as { type: string; state: GameState };
  const state = msg.state;
  questionBox.textContent = state.questionRevealed ? state.question : "(hidden)";
  renderAnswers(state);
  scoreAEl.textContent = String(state.scoreA);
  scoreBEl.textContent = String(state.scoreB);
  strikesAEl.innerHTML = "";
  for (let i = 0; i < Math.min(3, state.strikesA); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; strikesAEl.appendChild(d);
  }
  strikesBEl.innerHTML = "";
  for (let i = 0; i < Math.min(3, state.strikesB); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; strikesBEl.appendChild(d);
  }
};
