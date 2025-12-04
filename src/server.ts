import express from "express";
import { WebSocketServer } from "ws";
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

const wss = new WebSocketServer({ noServer: true });

const server = app.listen(PORT, () => {
  console.log(`Family Feud server listening on http://localhost:${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const [, _prefix, gameId, role] = url.pathname.split("/");

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.gameId = gameId;
    
    if (role === 'host' || role === 'game') {
        ws.role = role;
    } else {
        ws.close();
        return;
    }

    wss.emit("connection", ws);
  });
});

wss.on("connection", (ws) => {
  console.log(`ws#${ws.gameId}@${ws.role} Connected`);

  ws.on("message", (msg) => {
    console.log(`ws#${ws.gameId}@${ws.role}: ${msg}`);
    
    for (const client of wss.clients) {
      if (client.gameId === ws.gameId && client !== ws) {
        client.send(msg.toString());
      }
    }
  });
});
