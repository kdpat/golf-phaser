import * as Phaser from "../../vendor/phaser.min.js";
import { cardPath, CARD_NAMES, CARD_SCALE } from "../game.js";
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
    this.setupLoadingBar();

    for (const card of CARD_NAMES) {
      this.load.svg(card, cardPath(card), { scale: CARD_SCALE * 100 });
    }

    this.load.on('progress', this.updateLoadingBar, this);
  }

  create() {
    this.scene.start("GolfScene", { pushEvent: this.pushEvent });
  }

  setupLoadingBar() {
    const { centerX, centerY } = this.cameras.main;
    this.progressBarWidth = 300;
    this.progressBarHeight = 25;

    this.progressBarYOffset = 60;
    const textYOffset = -10;

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRect(centerX - this.progressBarWidth / 2 - 2, centerY + this.progressBarYOffset - this.progressBarHeight / 2 - 2, this.progressBarWidth + 4, this.progressBarHeight + 4);
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillRect(centerX - this.progressBarWidth / 2, centerY + this.progressBarYOffset - this.progressBarHeight / 2, this.progressBarWidth, this.progressBarHeight);

    this.loadingText = this.add.text(centerX, centerY + textYOffset, 'Loading...', {
      font: '64px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);
  }


  updateLoadingBar(progress) {
    const { centerX, centerY } = this.cameras.main;

    this.graphics.fillStyle(0x00ff00, 1);
    this.graphics.fillRect(centerX - this.progressBarWidth / 2, centerY + this.progressBarYOffset - this.progressBarHeight / 2, this.progressBarWidth * progress, this.progressBarHeight);

    this.loadingText.setText('Loading ' + parseInt(progress * 100) + '%');
  }
}
