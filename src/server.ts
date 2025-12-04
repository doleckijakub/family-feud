import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));

app.get("/:id/host", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/public/host.html"));
});

app.get("/:id/game", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/public/game.html"));
});

interface Client extends WebSocket {
  gameId?: string;
  role?: "host" | "game";
}

interface GameState {
  answers: string[];
  revealed: boolean[];
  xCount: number;
  scores: Record<string, number>;
}

const games: Record<string, GameState> = {};

const wss = new WebSocketServer({ noServer: true });

const server = app.listen(PORT, () => {
  console.log(`Family Feud server listening on http://localhost:${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const [, prefix, gameId, role] = url.pathname.split("/");

  if (prefix !== "ws" || !gameId || (role !== "host" && role !== "game")) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (socketWs) => {
    const ws = socketWs as Client;
    ws.gameId = gameId;
    ws.role = role as "host" | "game";
    wss.emit("connection", ws);
  });
});

wss.on("connection", (ws: Client) => {
  console.log(`ws#${ws.gameId}@${ws.role} connected`);

  const gameId = ws.gameId!;
  if (!games[gameId]) {
    games[gameId] = {
      answers: ["apple", "banana", "orange", "grape", "pear"],
      revealed: [false, false, false, false, false],
      xCount: 0,
      scores: { host: 0 },
    };
  }

  ws.send(JSON.stringify({ type: "init", state: games[gameId] }));

  ws.on("message", (msg: WebSocket.RawData) => {
    const data = JSON.parse(msg.toString());
    const state = games[gameId];

    if (ws.role === "host") {
      if (data.type === "reveal") {
        const index: number = data.index;
        state.revealed[index] = true;
      } else if (data.type === "addX") {
        state.xCount++;
      } else if (data.type === "addPoints") {
        state.scores.host += data.points;
      }
    }

    for (const client of wss.clients) {
      const c = client as Client;
      if (c.gameId === gameId) {
        c.send(JSON.stringify({ type: "update", state }));
      }
    }
  });
});
