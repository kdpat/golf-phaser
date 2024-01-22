import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"
import "../css/app.css"
import { createPhaserGame } from "./phaser_game.js"
import { EMITTER } from "./game.js"

window.onerror = e => {
  console.error(e);
  location.reload();
}

let phaserGame;

const hooks = {};

hooks.GameCanvas = {
  mounted() {
    this.handleEvent("game_loaded", data => {
      console.log("game loaded", data.game, phaserGame);
      if (phaserGame) {
        // if the client drops and reconnects we need to cleanup the old canvas so we don't end up with two 
        phaserGame.destroy(true);
      }
      phaserGame = createPhaserGame(data.game, this.pushEvent.bind(this));
    });

    this.handleEvent("round_started", data => {
      console.log("round started", data, phaserGame);
      EMITTER.emit("round_started", data.game);
    });

    this.handleEvent("game_event", data => {
      console.log("game event", data, phaserGame);
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

  const copyToClipboardAndNotify = async (linkElement) => {
    try {
      await navigator.clipboard.writeText(linkElement.textContent || linkElement.innerText);
      linkElement.classList.add('copied-notification');
      setTimeout(() => { linkElement.classList.remove('copied-notification'); }, 1000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // copy to clipboard when click .lobby-link
  const lobbyLinks = document.querySelectorAll('.lobby-link');
  lobbyLinks.forEach(link => {
    link.addEventListener('click', () => {
      copyToClipboardAndNotify(link);
    });
  });

  // zoom buttons
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');

  const zoomFactor = 0.15;

  if (zoomInButton) {
    zoomInButton.addEventListener('click', e => {
      e.preventDefault();
      const camera = phaserGame.scene.getScene("GolfScene").camera;
      if (camera && camera.zoom < 2) {
        camera.zoom += zoomFactor;
      }
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener('click', e => {
      e.preventDefault();
      const camera = phaserGame.scene.getScene("GolfScene").camera;
      if (camera && camera.zoom > 0.5) {
        camera.zoom -= zoomFactor;
      }
    });
  }
});

// clear chat after submit
window.addEventListener("phx:clear-chat-input", _ => {
  const inputEl = document.querySelector("#chat-form-input");
  inputEl.value = "";
});

// set vh property
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

// set vh on resize
window.addEventListener('resize', () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// setup livesocket
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
