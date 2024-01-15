import * as Phaser from "../vendor/phaser.js";

// cards

const RANKS = "KA23456789TJQ".split("");
const SUITS = "CDHS".split("");

const DOWN_CARD = "2B";
const JOKER_CARD = "jk";

const CARD_NAMES = cardNames();

function cardNames() {
  const names = [DOWN_CARD, JOKER_CARD];

  for (const rank of RANKS) {
    for (const suit of SUITS) {
      names.push(rank + suit)
    }
  }

  return names;
}

function cardPath(name) {
  return `/images/cards/${name}.svg`;
}

// phaser

const PARENT_ID = "game-canvas";
const BG_COLOR = "#228b22";

const WIDTH = 600;
const HEIGHT = 600;

const CARD_SCALE = 0.3;
const CARD_IMG_WIDTH = 242;
const CARD_IMG_HEIGHT = 338;

const CARD_WIDTH = CARD_IMG_WIDTH * CARD_SCALE;
const CARD_HEIGHT = CARD_IMG_HEIGHT * CARD_SCALE;

export const EMITTER = new Phaser.Events.EventEmitter();

class GolfScene extends Phaser.Scene {
  constructor() {
    super({ key: "GolfScene" });

    this.cards = {
      deck: null,
    };
  }

  init(data) {
    this.pushEvent = data.pushEvent;
  }

  preload() {
    for (const card of CARD_NAMES) {
      this.load.image(card, cardPath(card));
    }
  }

  create() {
    this.addDeck();
    this.createStartGameButton();

    // setup events
    EMITTER.on("game_loaded", this.onGameLoad, this);

    EMITTER.emit("scene_ready");
  }

  addDeck() {
    this.cards.deck = this.addCard(DOWN_CARD, WIDTH / 2, HEIGHT / 2);
  }

  addCard(cardName, x, y) {
    return this.add.image(x, y, cardName).setScale(CARD_SCALE);
  }

  onGameStart() {
    console.log("starting game...");
  }

  onGameLoad(game) {
    console.log("on game load", game);
  }

  createStartGameButton() {
    const width = 150;
    const height = 50;
    const radius = 10;
    const bgColor = 0x0000ff;
    const textColor = '#ffffff';
    const margin = 20; // px from the bottom of the canvas

    const buttonX = WIDTH / 2 - width / 2;
    const buttonY = HEIGHT - height - margin;

    this.startButtonBg = this.add.graphics({ x: buttonX, y: buttonY });
    this.startButtonBg.fillStyle(bgColor, 1);
    this.startButtonBg.fillRoundedRect(0, 0, width, height, radius);
    this.startButtonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    this.startButtonText = this.add.text(WIDTH / 2, buttonY + height / 2, 'Start Game', {
      font: '24px Arial',
      fill: textColor
    }).setOrigin(0.5);

    this.startButtonBg.on('pointerdown', () => {
      this.onGameStart();
      // this.startButtonBg.destroy();
      // this.startButtonText.destroy();
    });

    this.startButtonBg.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    this.startButtonBg.on('pointerout', () => this.input.setDefaultCursor('default'));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: PARENT_ID,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: BG_COLOR,
  scene: GolfScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: PARENT_ID,
  },
};

export function createPhaserGame(pushEvent) {
  const game = new Phaser.Game(config);
  game.scene.start("GolfScene", { pushEvent });
}

// mode: Phaser.Scale.SHOW_ALL,

// physics: {
//   default: "arcade",
//   arcade: {
//     gravity: { y: 300 },
//     debug: false,
//   }
// },

// onFoo() {
//   const tween = this.tweens.add({
//     targets: this.cards.deck,
//     x: WIDTH / 2,
//     y: HEIGHT / 2,
//     angle: 0,
//     ease: "Quad.easeOut",
//     duration: 1000,
//   });

//   tween.on("complete", () => console.log("tween done"))
// }
