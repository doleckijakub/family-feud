import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/:id/host", (_, res) =>
  res.sendFile(path.join(__dirname, "../src/public/host.html"))
);
app.get("/:id/game", (_, res) =>
  res.sendFile(path.join(__dirname, "../src/public/game.html"))
);

type QuestionFileBlock = {
  text: string;
  answers: { text: string; points: number }[];
};

function parseQuestionsFile(filepath: string): QuestionFileBlock[] {
  const raw = fs.readFileSync(filepath, "utf8");
  const blocks = raw.split(/\n-{3,}\s*\n/).map(b => b.trim()).filter(Boolean);
  const questions: QuestionFileBlock[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean).filter(l => !l.startsWith("#"));
    if (lines.length === 0) continue;

    let qLine = lines[0];
    if (qLine.toUpperCase().startsWith("QUESTION:")) {
      qLine = qLine.slice("QUESTION:".length).trim();
    }

    const answers: { text: string; points: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^(.+?)\s*=\s*(\d+)\s*$/);
      if (m) {
        answers.push({ text: m[1].trim(), points: parseInt(m[2], 10) });
      }
    }

    if (answers.length > 0) {
      questions.push({ text: qLine, answers });
    }
  }

  return questions;
}

const QUESTIONS = parseQuestionsFile(path.join(__dirname, "questions.txt"));
if (!QUESTIONS.length) {
  console.warn("No questions loaded from src/questions.txt. Please add questions.");
}

interface AnswerState {
  text: string;
  points: number;
  revealed: boolean;
  awardedTo?: "A" | "B" | null;
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

interface Client extends WebSocket {
  gameId?: string;
  role?: "host" | "game";
}

const games: Record<string, GameState> = {};

function createInitialStateForQuestion(index: number): GameState {
  const q = QUESTIONS[index];
  return {
    questionIndex: index,
    question: q.text,
    answers: q.answers.map(a => ({ text: a.text, points: a.points, revealed: false, awardedTo: null })),
    questionRevealed: false,
    strikesA: 0,
    strikesB: 0,
    scoreA: 0,
    scoreB: 0
  };
}

function ensureGame(gameId: string) {
  if (!games[gameId]) {
    games[gameId] = createInitialStateForQuestion(0);
  }
}

const wss = new WebSocketServer({ noServer: true });
const server = app.listen(PORT, () => {
  console.log(`Family Feud server listening on http://localhost:${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const [, prefix, gameId, role] = url.pathname.split("/");

    if (prefix !== "ws" || !gameId || (role !== "host" && role !== "game")) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (wsRaw) => {
      const ws = wsRaw as Client;
      ws.gameId = gameId;
      ws.role = role as "host" | "game";
      ensureGame(gameId);
      ws.send(JSON.stringify({ type: "init", state: games[gameId] }));
      wss.emit("connection", ws);
    });
  } catch (err) {
    socket.destroy();
  }
});

function broadcast(gameId: string) {
  const state = games[gameId];
  if (!state) return;
  const payload = JSON.stringify({ type: "update", state });
  for (const client of wss.clients) {
    const c = client as Client;
    if (c.gameId === gameId && c.readyState === c.OPEN) {
      c.send(payload);
    }
  }
}

wss.on("connection", (ws: Client) => {
  console.log(`connected ws#${ws.gameId}@${ws.role}`);
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const gameId = ws.gameId!;
      const state = games[gameId];
      if (!state) return;

      if (ws.role === "host") {
        switch (data.type) {
          case "revealQuestion":
            state.questionRevealed = true;
            break;
          case "revealAnswer": {
            const idx: number = Number(data.index);
            if (Number.isFinite(idx) && idx >= 0 && idx < state.answers.length) {
              state.answers[idx].revealed = true;
            }
            break;
          }
          case "assignPoints": {
            const idx: number = Number(data.index);
            const team = data.team === "A" ? "A" : "B";
            if (Number.isFinite(idx) && idx >= 0 && idx < state.answers.length && !state.answers[idx].awardedTo) {
              const pts = state.answers[idx].points;
              state.answers[idx].awardedTo = team;
              state.answers[idx].revealed = true;
              if (team === "A") state.scoreA += pts;
              else state.scoreB += pts;
            }
            break;
          }
          case "strike": {
            const team = data.team === "A" ? "A" : "B";
            if (team === "A") state.strikesA = Math.min(3, state.strikesA + 1);
            else state.strikesB = Math.min(3, state.strikesB + 1);
            break;
          }
          case "revealAll":
            state.answers.forEach(a => a.revealed = true);
            break;
          case "nextQuestion": {
            const nextIdx = Math.min(QUESTIONS.length - 1, state.questionIndex + 1);
            if (nextIdx !== state.questionIndex) {
              state.questionIndex = nextIdx;
              state.question = QUESTIONS[nextIdx].text;
              state.answers = QUESTIONS[nextIdx].answers.map(a => ({ text: a.text, points: a.points, revealed: false, awardedTo: null }));
              state.questionRevealed = false;
              state.strikesA = 0;
              state.strikesB = 0;
            }
            break;
          }
          default:
            break;
        }
      }

      broadcast(gameId);
    } catch (err) {
      console.error("ws msg parse err:", err);
    }
  });
});
