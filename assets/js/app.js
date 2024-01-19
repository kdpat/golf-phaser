import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"
import "../css/app.css"
import { createPhaserGame } from "./phaser_game.js"
import { EMITTER } from "./game.js"

let phaserGame;

const hooks = {};

hooks.GameCanvas = {
  mounted() {
    phaserGame = createPhaserGame(this.pushEvent.bind(this));

    this.handleEvent("game_loaded", data => {
      console.log("game loaded", data);
      EMITTER.once("golf_scene_ready", () => EMITTER.emit("game_loaded", data.game));
    });

    this.handleEvent("round_started", data => {
      console.log("round started", data);
      EMITTER.emit("round_started", data.game);
    });

    this.handleEvent("game_event", data => {
      console.log("game event", data);
      EMITTER.emit("game_event", data.game, data.event);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('toggle-sidebar');
  const gameInfo = document.getElementById('game-info');

  if (sidebar) {
    sidebar.addEventListener('click', () => {
      gameInfo.classList.toggle('active');

      // if (phaserGame) {
      //   const interval = setInterval(() => {
      //     phaserGame.scale.refresh();
      //   }, 10);

      //   setTimeout(() => {
      //     clearInterval(interval);
      //   }, 1000);
      // }
    });
  }
});

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")

let liveSocket = new LiveSocket(
  "/live",
  Socket,
  { hooks, params: { _csrf_token: csrfToken } }
);

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" })
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket
