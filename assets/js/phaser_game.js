import * as Phaser from "../vendor/phaser.min.js";
import { LoadingScene } from "./scenes/loading_scene.js";
import { GolfScene } from "./scenes/golf_scene.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./game.js";

const PARENT_ID = "game-canvas";
const SCALE_MODE = Phaser.Scale.HEIGHT_CONTROLS_WIDTH;
// const SCALE_MODE = Phaser.Scale.RESIZE_Y;
// const SCALE_MODE = Phaser.Scale.FIT;

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
    // autoCenter: Phaser.Scale.CENTER_Y,
  },
  render: {
    roundPixels: true,
  },
  resolution: 2,
};

export function createPhaserGame(pushEvent) {
  const game = new Phaser.Game(config);
  game.scene.start("LoadingScene", { pushEvent });
}

// const WIDTH_THRESHOLD = 600;
// const SCALE_MODE =
//   window.innerWidth <= WIDTH_THRESHOLD
//     ? Phaser.Scale.RESIZE_ALL
//     : Phaser.Scale.FIT;

// const SCALE_MODE = Phaser.Scale.RESIZE_Y;

// min: {
//   width: 300,
//   height: 400,
// },
// max: {
//   width: 1200,
//   height: 1200,
// }