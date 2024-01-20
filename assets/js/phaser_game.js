import * as Phaser from "../vendor/phaser.min.js";
import { LoadingScene } from "./scenes/loading_scene.js";
import { GolfScene } from "./scenes/golf_scene.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./game.js";

const PARENT_ID = "game-canvas";
const SCALE_MODE = Phaser.Scale.HEIGHT_CONTROLS_WIDTH;

const config = {
  type: Phaser.WEBGL,
  parent: PARENT_ID,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transparent: true,
  scene: [LoadingScene, GolfScene],
  scale: {
    parent: PARENT_ID,
    mode: SCALE_MODE,
    autoCenter: Phaser.Scale.CENTER_X,
  },
  render: {
    roundPixels: true,
  },
  resolution: 2,
};

export function createPhaserGame(golfGame, pushEvent) {
  const game = new Phaser.Game(config);
  game.scene.start("LoadingScene", { golfGame, pushEvent });
  return game;
}
