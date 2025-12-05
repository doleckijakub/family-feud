import { t } from './i18n.ts';
import type { GameState } from '../types.ts';

const gameId = window.location.pathname.split("/")[1] ?? "000";
const ws = new WebSocket(`${location.protocol == "https:" ? "wss" : "ws"}://${location.host}/ws/${gameId}/game`);

const questionTop = document.getElementById("questionTop") as HTMLElement;
const answersCenter = document.getElementById("answersCenter") as HTMLElement;
const scoreAEl = document.getElementById("scoreA") as HTMLElement;
const scoreBEl = document.getElementById("scoreB") as HTMLElement;
const xsA = document.getElementById("xsA") as HTMLElement;
const xsB = document.getElementById("xsB") as HTMLElement;

const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
const audioCtx = new AudioCtx();

function unlockAudio() {
  if (audioCtx.state !== "suspended") return;
  audioCtx.resume();
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
  (document.getElementById('audioDisabled') as HTMLElement).style = "display: none;";
}

window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);

function playTick(freq: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.value = freq;

  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.05
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

const scoreControllers = new WeakMap<HTMLElement, {
  target: number;
  timer?: number;
  running: boolean;
}>();

function animateScore(el: HTMLElement, newValue: number, interval = 50) {
  const parsed = parseInt(el.textContent || "0", 10);
  const current = Number.isNaN(parsed) ? 0 : parsed;

  if (current === newValue && !scoreControllers.has(el)) {
    el.textContent = String(newValue);
    return;
  }

  let ctrl = scoreControllers.get(el);
  if (!ctrl) {
    ctrl = { target: newValue, running: false };
    scoreControllers.set(el, ctrl);
  } else {
    ctrl.target = newValue;
  }

  if (ctrl.running) return;

  ctrl.running = true;

  const tick = () => {
    const parsedNow = parseInt(el.textContent || "0", 10);
    const now = Number.isNaN(parsedNow) ? 0 : parsedNow;
    const target = ctrl!.target;

    if (now === target) {
      ctrl!.running = false;
      if (ctrl!.timer) {
        window.clearTimeout(ctrl!.timer);
        ctrl!.timer = undefined;
      }
      scoreControllers.delete(el);
      return;
    }

    const step = Math.sign(target - now);
    el.textContent = String(now + step);

    const next = now + step;
    const baseFreq = 500;
    const extra = next * 4;
    const freq = baseFreq + extra;
    playTick(freq);

    ctrl!.timer = window.setTimeout(tick, interval);
  };

  ctrl.timer = window.setTimeout(tick, interval);
}


function renderState(state: GameState) {
  const _ = (k: string) => t(k, state.lang);
  const round = state.rounds[state.questionIndex];

  questionTop.textContent = round.questionRevealed ? round.question : "???";
  
  (document.getElementById("audioDisabled") as HTMLElement).textContent = _("audioDisabled");
  (document.getElementById("title") as HTMLElement).textContent = _("title");

  animateScore(scoreAEl, state.scoreA);
  animateScore(scoreBEl, state.scoreB);

  (document.getElementById("teamA") as HTMLElement).textContent = state.nameA;
  (document.getElementById("teamB") as HTMLElement).textContent = state.nameB;

  xsA.innerHTML = "";
  for (let i = 0; i < Math.min(3, round.strikesA); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; xsA.appendChild(d);
  }
  xsB.innerHTML = "";
  for (let i = 0; i < Math.min(3, round.strikesB); i++) {
    const d = document.createElement("div"); d.className = "x"; d.textContent = "X"; xsB.appendChild(d);
  }

  answersCenter.innerHTML = "";
  round.answers.forEach((a, i) => {
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
