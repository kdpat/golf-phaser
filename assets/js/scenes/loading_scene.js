import * as Phaser from "../../vendor/phaser.min.js";
import { cardPath, CARD_NAMES } from "../game.js";
import { GAME_HEIGHT } from "../game.js";
import { GAME_WIDTH } from "../game.js";
import { BG_COLOR } from "../game.js";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  init(data) {
    this.pushEvent = data.pushEvent;
  }

  preload() {
    this.cameras.main.setBackgroundColor(BG_COLOR);

    for (const card of CARD_NAMES) {
      this.load.image(card, cardPath(card));
    }

    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      font: '32px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);
  }

  create() {
    this.scene.start("GolfScene", { pushEvent: this.pushEvent });
  }
}