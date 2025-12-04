interface GameState {
  answers: string[];
  revealed: boolean[];
  xCount: number;
  scores: Record<string, number>;
}

const gameId = window.location.pathname.split("/")[1];
const ws = new WebSocket(`ws://${location.host}/ws/${gameId}/game`);

const answersContainer = document.createElement("div");
document.body.appendChild(answersContainer);

const xContainer = document.createElement("div");
document.body.appendChild(xContainer);

const scoreContainer = document.createElement("div");
document.body.appendChild(scoreContainer);

ws.onmessage = (ev: MessageEvent) => {
  const msg: { type: string; state: GameState } = JSON.parse(ev.data);
  const state = msg.state;

  answersContainer.innerHTML = "";
  state.answers.forEach((ans: string, i: number) => {
    const el = document.createElement("div");
    el.textContent = state.revealed[i] ? ans : "???";
    answersContainer.appendChild(el);
  });

  xContainer.textContent = "X's: " + state.xCount;
  scoreContainer.textContent = "Score: " + state.scores.host;
};

export {};
