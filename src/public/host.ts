import { t } from './i18n.ts';
import type { Lang, GameState } from '../types.ts';

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
const btnPrevQuestion = document.getElementById("prevQuestion") as HTMLButtonElement;
const btnNextQuestion = document.getElementById("nextQuestion") as HTMLButtonElement;
const inputNameA = document.getElementById("nameA") as HTMLInputElement;
const inputNameB = document.getElementById("nameB") as HTMLInputElement;
const btnStrikeA = document.getElementById("strikeA") as HTMLButtonElement;
const btnStrikeB = document.getElementById("strikeB") as HTMLButtonElement;

for (let lang of ["pl", "en"]) {
  let code = lang;
  switch (lang) {
    case "pl":
      break;
    case "en": code = "us"; break;
  }

  let img = document.createElement('img');
  img.src = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;
  img.onclick = () => ws.send(JSON.stringify({ type: "setLang", lang }));
  (document.getElementById("langSelect") as HTMLElement).appendChild(img);
}

btnRevealQuestion.onclick = () => ws.send(JSON.stringify({ type: "revealQuestion" }));
btnRevealAll.onclick = () => ws.send(JSON.stringify({ type: "revealAll" }));
btnPrevQuestion.onclick = () => ws.send(JSON.stringify({ type: "prevQuestion" }));
btnNextQuestion.onclick = () => ws.send(JSON.stringify({ type: "nextQuestion" }));
btnStrikeA.onclick = () => ws.send(JSON.stringify({ type: "strike", team: "A" }));
btnStrikeB.onclick = () => ws.send(JSON.stringify({ type: "strike", team: "B" }));

inputNameA.value = "A";
inputNameB.value = "B";

inputNameA.oninput = () => ws.send(JSON.stringify({ type: "renameA", newName: inputNameA.value }));
inputNameB.oninput = () => ws.send(JSON.stringify({ type: "renameB", newName: inputNameB.value }));

function renderAnswers(state: GameState) {
  let _ = (k: string) => t(k, state.lang);

  (document.getElementById("title") as HTMLElement).textContent = _("title");
  btnRevealQuestion.textContent = _("revealQuestion");
  btnRevealAll.textContent = _("revealAll");
  (document.getElementById("questionHeader") as HTMLElement).textContent = _("question");
  btnPrevQuestion.textContent = _("prevQuestion");
  btnNextQuestion.textContent = _("nextQuestion");

  scoreAEl.textContent = _("scoreA");
  strikesAEl.textContent = _("strikesA");
  btnStrikeA.textContent = _("strikeA");

  scoreBEl.textContent = _("scoreB");
  strikesBEl.textContent = _("strikesB");
  btnStrikeB.textContent = _("strikeB");

  document.querySelectorAll(".strikes").forEach(e => e.textContent = _("strikes"));

  (document.getElementById("questionIndex") as HTMLElement).textContent = (state.questionIndex + 1).toString();
  (document.getElementById("questionCount") as HTMLElement).textContent = state.questionCount.toString();

  btnRevealQuestion.style = `border: 3px solid ${state.questionRevealed ? 'red' : 'green'};`;
  btnPrevQuestion.style   = `border: 3px solid ${state.questionIndex === 0 ? 'red' : 'green'};`;
  btnNextQuestion.style   = `border: 3px solid ${state.questionIndex >= state.questionCount ? 'red' : 'green'};`;

  answersList.innerHTML = "";
  state.answers.forEach((ans, i) => {
    const row = document.createElement("div");
    row.className = "answerRow";

    const text = document.createElement("div");
    text.className = "answerText";
    text.textContent = ans.revealed
      ? `${ans.text} - ${ans.points} ${_("pts")}`
      : `${ans.text} - ${ans.points} ${_("pts")}`;

    const small = document.createElement("div");
    small.className = "small";
    small.textContent = ans.awardedTo ? `${_("awarded")}: ${ans.awardedTo}` : "";

    const btns = document.createElement("div");
    btns.className = "answerButtons";

    const btnA = document.createElement("button");
    btnA.className = "btn-ghost";
    btnA.textContent = "A";
    btnA.onclick = () => ws.send(JSON.stringify({ type: "assignPoints", index: i, team: "A" }));

    const btnB = document.createElement("button");
    btnB.className = "btn-ghost";
    btnB.textContent = "B";
    btnB.onclick = () => ws.send(JSON.stringify({ type: "assignPoints", index: i, team: "B" }));

    const btnReveal = document.createElement("button");
    btnReveal.className = "btn-ghost";
    btnReveal.textContent = _("reveal");
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
  console.log({ msg });
  const state = msg.state;
  let _ = (k: string) => t(k, state.lang);
  questionBox.textContent = state.question + (state.questionRevealed ? "" : `  (${_("hidden")})`);
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
