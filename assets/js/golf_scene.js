import * as Phaser from "../vendor/phaser.js";
import { cardPath, CARD_NAMES, DOWN_CARD, CARD_SCALE, CARD_WIDTH, DECK_TABLE_OFFSET } from "./game.js";
import { deckCoord, tableCoord, handCardCoord, heldCardCoord } from "./coords.js";

export const EMITTER = new Phaser.Events.EventEmitter();

const PARENT_ID = "game-canvas";
const BG_COLOR = "#228b22";

const WIDTH = 600;
const HEIGHT = 600;

class GolfScene extends Phaser.Scene {
  constructor() {
    super({ key: "GolfScene" });

    this.cards = {
      deck: null,
      table: [],
      hand: {
        bottom: [],
        left: [],
        top: [],
        right: [],
      },
      held: null,
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
    EMITTER.on("game_loaded", this.onGameLoad, this);
    EMITTER.on("round_started", this.onRoundStart, this);
    EMITTER.emit("golf_scene_ready");
  }

  addCard(cardName, x, y, angle = 0) {
    const img = this.add.image(x, y, cardName)
      .setScale(CARD_SCALE)
      .setAngle(angle);

    img.cardName = cardName;
    return img;
  }

  addDeck(state) {
    const { x, y } = deckCoord(WIDTH, HEIGHT, state);
    this.cards.deck = this.addCard(DOWN_CARD, x, y);
  }

  addTableCard(card) {
    const { x, y } = tableCoord(WIDTH, HEIGHT);
    return this.addCard(card, x, y);
  }

  addTableCards() {
    const card0 = this.golfGame.tableCards[0];
    const card1 = this.golfGame.tableCards[1];

    // add the second card first, so it's on bottom
    if (card1) {
      this.cards.table[1] = this.addTableCard(card1);
    }

    if (card0) {
      this.cards.table[0] = this.addTableCard(card0);
    }
  }

  addHand(player) {
    player.hand.forEach((card, i) => {
      const cardName = card["face_up?"] ? card.name : DOWN_CARD;
      const { x, y, rotation } = handCardCoord(WIDTH, HEIGHT, player.position, i);
      const image = this.addCard(cardName, x, y, rotation);
      this.cards.hand[player.position][i] = image;
    });
  }

  sendStartRound() {
    console.log("starting game...");
    this.pushEvent("start_round");
  }

  onGameLoad(game) {
    console.log("game loaded", game);
    this.golfGame = game;
    this.addDeck(game.state);

    if (game.state !== "no_round") {
      this.addTableCards();

      for (const player of game.players) {
        this.addHand(player);
      }
    }

    if (game.userIsHost && game.state === "no_round") {
      this.createStartGameButton();
    }
  }

  onRoundStart(game) {
    console.log("round started", game);
    this.golfGame = game;

    if (this.startButtonBg) {
      this.destroyStartGameButton();
    }

    const tween = this.tweens.add({
      targets: this.cards.deck,
      x: WIDTH / 2 - CARD_WIDTH / 2 - DECK_TABLE_OFFSET,
      duration: 500,
      ease: "Quad.easeOut",
    });

    tween.on("complete", () => {
      this.addTableCards()

      for (const player of game.players) {
        this.addHand(player);
      }
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
    // mode: Phaser.Scale.RESIZE_ALL,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: PARENT_ID,
  },
};

export function createPhaserGame(pushEvent) {
  const game = new Phaser.Game(config);
  game.scene.start("GolfScene", { pushEvent });
}

function makePlayable(cardImg, callback) {
  cardImg.setInteractive();
  cardImg.on("pointerdown", () => callback(cardImg));
}

function makeUnplayable(cardImg) {
  cardImg.off("pointerdown");
  cardImg.removeInteractive();
}
