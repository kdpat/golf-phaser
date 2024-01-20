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
    this.handleEvent("game_loaded", data => {
      console.log("game loaded", data.game);
      phaserGame = createPhaserGame(data.game, this.pushEvent.bind(this));
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
  // setup toggle sidebar
  const sidebar = document.getElementById('toggle-sidebar');
  const gameInfo = document.getElementById('game-info');

  if (sidebar) {
    sidebar.addEventListener('click', () => {
      gameInfo.classList.toggle('active');
    });
  }

  //setup reset camera button
  const resetCameraButton = document.getElementById('reset-camera');

  if (resetCameraButton) {
    resetCameraButton.addEventListener('click', () => {
      if (phaserGame && phaserGame.scene && phaserGame.scene.isActive('GolfScene')) {
        const golfScene = phaserGame.scene.getScene('GolfScene');
        if (golfScene) {
          golfScene.resetCamera();
        }
      }
    });
  }
});

// clear chat after submit
window.addEventListener("phx:clear-chat-input", _ => {
  const inputEl = document.querySelector("#chat-form-input");
  inputEl.value = "";
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
// liveSocket.enableDebug()
// liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// liveSocket.disableLatencySim()
window.liveSocket = liveSocket
