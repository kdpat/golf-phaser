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

const WIDTH = 600;
const HEIGHT = 600;

const BG_COLOR = "#228b22";

const CARD_SCALE = 0.3;
const CARD_IMG_WIDTH = 242;
const CARD_IMG_HEIGHT = 338;

const CARD_WIDTH = CARD_IMG_WIDTH * CARD_SCALE;
const CARD_HEIGHT = CARD_IMG_HEIGHT * CARD_SCALE;

export const EMITTER = new Phaser.Events.EventEmitter();

function onGameStart() {
  console.log("starting game...");
  EMITTER.emit("foo");
}

class GolfScene extends Phaser.Scene {
  constructor() {
    super({ key: "Golf" });

    this.cards = {
      deck: null,
    };
  }

  preload() {
    for (const card of CARD_NAMES) {
      this.load.image(card, cardPath(card));
    }
  }

  create() {
    this.addDeck();
    this.createStartGameButton();
    EMITTER.on("foo", this.onFoo, this);
  }

  addDeck() {
    const card = this.addCard(DOWN_CARD, WIDTH / 2, HEIGHT / 2);
    this.cards.deck = card;
  }

  addCard(cardName, x, y) {
    const card = this.add.image(x, y, cardName).setScale(CARD_SCALE);
    return card;
  }

  onFoo() {
    this.tweens.add({
      targets: this.cards.deck,
      x: 50,
      y: 100,
      ease: "Linear",
      duration: 1000,
    });
  }

  createStartGameButton() {
    const width = 150;
    const height = 50;
    const radius = 10;
    const bgColor = 0x0000ff;
    const textColor = '#ffffff';
  
    const background = this.add.graphics({ x: WIDTH / 2 - width / 2, y: HEIGHT / 2 - height / 2 });
    background.fillStyle(bgColor, 1);
    background.fillRoundedRect(0, 0, width, height, radius);
    background.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
  
    const text = this.add.text(WIDTH / 2, HEIGHT / 2, 'Start Game', {
      font: '24px Arial',
      fill: textColor
    }).setOrigin(0.5);
  
    background.on('pointerdown', () => onGameStart());
    background.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    background.on('pointerout', () => this.input.setDefaultCursor('default'));
  }
}

const config = {
  parent: PARENT_ID,
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: BG_COLOR,
  scene: GolfScene,
  scale: {
    // mode: Phaser.Scale.SHOW_ALL,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: PARENT_ID,
  },
  // physics: {
  //   default: "arcade",
  //   arcade: {
  //     gravity: { y: 300 },
  //     debug: false,
  //   }
  // },
};

export function createPhaserGame() {
  return new Phaser.Game(config);
}

