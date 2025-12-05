import { t } from './i18n.ts';
import type { GameState } from '../types.ts';

const gameId = window.location.pathname.split("/")[1] ?? "000";
const ws = new WebSocket(`ws://${location.host}/ws/${gameId}/game`);

const questionTop = document.getElementById("questionTop") as HTMLElement;
const answersCenter = document.getElementById("answersCenter") as HTMLElement;
const scoreAEl = document.getElementById("scoreA") as HTMLElement;
const scoreBEl = document.getElementById("scoreB") as HTMLElement;
const xsA = document.getElementById("xsA") as HTMLElement;
const xsB = document.getElementById("xsB") as HTMLElement;

function renderState(state: GameState) {
  let _ = (k: string) => t(k, state.lang);

  questionTop.textContent = state.questionRevealed ? state.question : "???";
  
  (document.getElementById("title") as HTMLElement).textContent = _("title");

  scoreAEl.textContent = String(state.scoreA);
  scoreBEl.textContent = String(state.scoreB);

  (document.getElementById("teamA") as HTMLElement).textContent = state.nameA;
  (document.getElementById("teamB") as HTMLElement).textContent = state.nameB;

  xsA.innerHTML = "";
  for (let i = 0; i < Math.min(3, state.strikesA); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; xsA.appendChild(d);
  }
  xsB.innerHTML = "";
  for (let i = 0; i < Math.min(3, state.strikesB); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; xsB.appendChild(d);
  }

  answersCenter.innerHTML = "";
  state.answers.forEach((a, i) => {
    const row = document.createElement("div");
    row.className = "answerRow";
    if (!a.revealed) {
      row.className = "answerRow answerHidden";
      row.textContent = "???";
    } else {
      const left = document.createElement("div");
      left.textContent = a.text;
      const right = document.createElement("div");
      right.textContent = String(a.points);
      row.appendChild(left);
      row.appendChild(right);
    }
    answersCenter.appendChild(row);
  });
}

ws.onmessage = (ev: MessageEvent) => {
  const msg = JSON.parse(ev.data) as { type: string; state: GameState };
  
  console.log({ msg });

  if (msg.type === "init" || msg.type === "update") {
    renderState(msg.state);
  }
};

ws.onopen = () => console.log("game ws open");
