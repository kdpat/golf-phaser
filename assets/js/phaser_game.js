import * as Phaser from "../vendor/phaser.min.js";
import { LoadingScene } from "./scenes/loading_scene.js";
import { GolfScene } from "./scenes/golf_scene.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./game.js";

const PARENT_ID = "game-canvas";
const CANVAS = document.getElementById("game-canvas-canvas")

const config = {
  type: Phaser.WEBGL,
  canvas: CANVAS,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transparent: true,
  scene: [LoadingScene, GolfScene],
  scale: {
    parent: PARENT_ID,
    mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE_ALL,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export function createPhaserGame(pushEvent) {
  const game = new Phaser.Game(config);
  game.scene.start("LoadingScene", { pushEvent });
}
