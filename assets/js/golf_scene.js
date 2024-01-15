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

    this.golfGame = null;

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
    // this.addDeck();
    // this.createStartGameButton();

    // setup events
    EMITTER.on("game_loaded", this.onGameLoad, this);
    EMITTER.on("round_started", this.onRoundStart, this);

    EMITTER.emit("golf_scene_ready");
  }

  addCard(cardName, x, y) {
    return this.add.image(x, y, cardName).setScale(CARD_SCALE);
  }

  addDeck() {
    const {x, y} = deckCoord(WIDTH, HEIGHT, this.golfGame.state);
    this.cards.deck = this.addCard(DOWN_CARD, x, y);
  }

  sendStartRound() {
    console.log("starting game...");
    this.pushEvent("start_round");
  }

  onGameLoad(game) {
    console.log("on game load", game);
    this.golfGame = game;

    this.addDeck();

    if (game.userId === game.hostId && game.state === "no_round") {
      this.createStartGameButton();
    }
  }

  onRoundStart(game) {
    console.log("on round start", game);
    if (this.startButtonBg) {
      this.destroyStartGameButton();
    }

    this.tweens.add({
      targets: this.cards.deck,
      x: WIDTH / 2 - CARD_WIDTH / 2 - DECK_TABLE_OFFSET,
      duration: 500,
      ease: "Quad.easeOut",
    });
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

    this.startButtonBg.on('pointerdown', () => this.sendStartRound());
    this.startButtonBg.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    this.startButtonBg.on('pointerout', () => this.input.setDefaultCursor('default'));
  }

  destroyStartGameButton() {
    this.startButtonBg.destroy();
    this.startButtonText.destroy();
    this.input.setDefaultCursor('default');
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

// coords

const DECK_TABLE_OFFSET = 4; // px between deck and table cards

export function deckCoord(width, height, state) {
  const x = state === "no_round"
    ? width / 2
    : width / 2 - CARD_WIDTH / 2 - DECK_TABLE_OFFSET

  return {
    x,
    y: height / 2,
  }
}

export function tableCoord(width, height) {
  return {
    x: width / 2 + CARD_WIDTH / 2 + DECK_TABLE_OFFSET,
    y: height / 2,
  }
}

export function heldCardCoord(width, height, pos, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x, y;

  switch (pos) {
    case "bottom":
      x = width / 2 + CARD_WIDTH * 2.4;
      y = height - CARD_HEIGHT - yPad - 30;
      break;

    case "top":
      x = width / 2 - CARD_WIDTH * 1.5;
      y = CARD_HEIGHT + 1.3 * yPad + 30;
      break;

    case "left":
      x = CARD_WIDTH + yPad + 5;
      y = height / 2 + CARD_HEIGHT * 1.5 + xPad;
      break;

    case "right":
      x = width - CARD_WIDTH - yPad - 5;
      y = height / 2 + CARD_HEIGHT * 1.5 + xPad;
      break;

    default:
      throw new Error(`invalid pos: ${pos}`);
  }

  return { x, y, rotation: 0 };
}

// function handCardCoord(width, height, pos, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
//   let x = 0, y = 0;
//   const xOffset = index % 3 === 0 ? -CARD_WIDTH - xPad : (index % 3 === 2 ? CARD_WIDTH + xPad : 0);
//   const yOffset = index < 3 ? -CARD_HEIGHT * 1.5 - yPad * 1.3 - 30 : -CARD_HEIGHT / 2 - yPad - 30;

//   switch (pos) {
//     case "bottom":
//       x = width / 2 + xOffset;
//       y = height - CARD_HEIGHT / 2 + yOffset;
//       break;
//     case "top":
//       x = width / 2 + xOffset;
//       y = CARD_HEIGHT / 2 + yOffset;
//       break;
//     case "left":
//       x = CARD_WIDTH / 2 + yOffset;
//       y = height / 2 + xOffset;
//       break;
//     case "right":
//       x = width - CARD_WIDTH / 2 + yOffset;
//       y = height / 2 + xOffset;
//       break;
//     default:
//       throw new Error(`invalid position: ${pos}`);
//   }

//   return { x, y, rotation: 0 };
// }

export function handCardCoord(width, height, pos, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  switch (pos) {
    case "bottom":
      return handCardBottomCoord(width, height, index, xPad, yPad);
    case "top":
      return handCardTopCoord(width, height, index, xPad, yPad);
    case "left":
      return handCardLeftCoord(width, height, index, xPad, yPad);
    case "right":
      return handCardRightCoord(width, height, index, xPad, yPad);
    default:
      throw new Error(`invalid position: ${pos}`);
  }
}

function handCardBottomCoord(width, height, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x = 0, y = 0;

  switch (index) {
    case 0:
      x = width / 2 - CARD_WIDTH - xPad;
      y = height - CARD_HEIGHT * 1.5 - yPad * 1.3 - 30;
      break;

    case 1:
      x = width / 2;
      y = height - CARD_HEIGHT * 1.5 - yPad * 1.3 - 30;
      break;

    case 2:
      x = width / 2 + CARD_WIDTH + xPad;
      y = height - CARD_HEIGHT * 1.5 - yPad * 1.3 - 30;
      break;

    case 3:
      x = width / 2 - CARD_WIDTH - xPad;
      y = height - CARD_HEIGHT / 2 - yPad - 30;
      break;

    case 4:
      x = width / 2;
      y = height - CARD_HEIGHT / 2 - yPad - 30;
      break;

    case 5:
      x = width / 2 + CARD_WIDTH + xPad;
      y = height - CARD_HEIGHT / 2 - yPad - 30;
      break;

    default:
      throw new Error(`index ${index} out of range`);
  }

  return { x, y, rotation: 0 };
}

function handCardTopCoord(width, _height, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x = 0, y = 0;

  switch (index) {
    case 0:
      x = width / 2 + CARD_WIDTH + xPad;
      y = CARD_HEIGHT * 1.5 + yPad * 1.3 + 30;
      break;

    case 1:
      x = width / 2;
      y = CARD_HEIGHT * 1.5 + yPad * 1.3 + 30;
      break;

    case 2:
      x = width / 2 - CARD_WIDTH - xPad;
      y = CARD_HEIGHT * 1.5 + yPad * 1.3 + 30;
      break;

    case 3:
      x = width / 2 + CARD_WIDTH + xPad;
      y = CARD_HEIGHT / 2 + yPad + 30;
      break;

    case 4:
      x = width / 2;
      y = CARD_HEIGHT / 2 + yPad + 30;
      break;

    case 5:
      x = width / 2 - CARD_WIDTH - xPad;
      y = CARD_HEIGHT / 2 + yPad + 30;
      break;
  }

  return { x, y, rotation: 0 };
}

function handCardLeftCoord(_width, height, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x = 0, y = 0;

  switch (index) {
    case 0:
      x = CARD_WIDTH * 1.5 + yPad * 1.3;
      y = height / 2 - CARD_HEIGHT - xPad;
      break;

    case 1:
      x = CARD_WIDTH * 1.5 + yPad * 1.3;
      y = height / 2;
      break;

    case 2:
      x = CARD_WIDTH * 1.5 + yPad * 1.3;
      y = height / 2 + CARD_HEIGHT + xPad;
      break;

    case 3:
      x = CARD_WIDTH / 2 + yPad;
      y = height / 2 - CARD_HEIGHT - xPad;
      break;

    case 4:
      x = CARD_WIDTH / 2 + yPad;
      y = height / 2;
      break;

    case 5:
      x = CARD_WIDTH / 2 + yPad;
      y = height / 2 + CARD_HEIGHT + xPad;
      break;
  }

  return { x, y, rotation: 0 };
}

function handCardRightCoord(width, height, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x = 0, y = 0;

  switch (index) {
    case 0:
      x = width - CARD_WIDTH * 1.5 - yPad * 1.3;
      y = height / 2 + CARD_HEIGHT + xPad;
      break;

    case 1:
      x = width - CARD_WIDTH * 1.5 - yPad * 1.3;
      y = height / 2;
      break;

    case 2:
      x = width - CARD_WIDTH * 1.5 - yPad * 1.3;
      y = height / 2 - CARD_HEIGHT - xPad;
      break;

    case 3:
      x = width - CARD_WIDTH / 2 - yPad;
      y = height / 2 + CARD_HEIGHT + xPad;
      break;

    case 4:
      x = width - CARD_WIDTH / 2 - yPad;
      y = height / 2;
      break;

    case 5:
      x = width - CARD_WIDTH / 2 - yPad;
      y = height / 2 - CARD_HEIGHT - xPad;
      break;
  }

  return { x, y, rotation: 0 };
}
