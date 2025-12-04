import "ws";

declare module "ws" {
  interface WebSocket {
    gameId?: string;
    role?: "host" | "game";
  }
}
