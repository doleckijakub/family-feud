interface GameState {
  answers: string[];
  revealed: boolean[];
  xCount: number;
  scores: Record<string, number>;
}

const gameId = window.location.pathname.split("/")[1];
const ws = new WebSocket(`ws://${location.host}/ws/${gameId}/host`);

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
    const el = document.createElement("button");
    el.textContent = state.revealed[i] ? ans : "???";
    el.onclick = () =>
      ws.send(JSON.stringify({ type: "reveal", index: i }));
    answersContainer.appendChild(el);
  });

  xContainer.textContent = "X's: " + state.xCount;
  scoreContainer.textContent = "Score: " + state.scores.host;
};

const addX = document.createElement("button");
addX.textContent = "Add X";
addX.onclick = () => ws.send(JSON.stringify({ type: "addX" }));
document.body.appendChild(addX);

const addPoints = document.createElement("button");
addPoints.textContent = "Add 5 Points";
addPoints.onclick = () =>
  ws.send(JSON.stringify({ type: "addPoints", points: 5 }));
document.body.appendChild(addPoints);

export {};
