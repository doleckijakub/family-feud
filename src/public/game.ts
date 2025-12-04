const gameId = window.location.pathname.split("/")[1];
const ws = new WebSocket(`ws://${location.host}/ws/${gameId}/game`);

ws.onmessage = (ev) => {
    console.log("recv:", ev.data);
};

document.getElementById("send")!.addEventListener("click", () => {
    const msg = (document.getElementById("msg") as HTMLInputElement).value;
    console.log("send:", msg);
    ws.send(msg);
});

export {};