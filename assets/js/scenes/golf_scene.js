import * as Phaser from "../../vendor/phaser.min.js";
import { DOWN_CARD, CARD_SCALE, CARD_WIDTH, DECK_TABLE_OFFSET, BG_COLOR, GAME_WIDTH, GAME_HEIGHT, EMITTER } from "../game.js";
import { deckCoord, tableCoord, handCardCoord, heldCardCoord } from "../coords.js";

export class GolfScene extends Phaser.Scene {
  constructor() {
    super({ key: "GolfScene" });

    this.cards = {
      table: [],
      hands: {
        bottom: [],
        left: [],
        top: [],
        right: [],
      },
    };
  }

  init(data) {
    this.pushEvent = data.pushEvent;
  }

  preload() {
    this.cameras.main.setBackgroundColor(BG_COLOR);
  }

  create() {
    EMITTER.on("game_loaded", this.onGameLoad, this);
    EMITTER.on("round_started", this.onRoundStart, this);
    EMITTER.on("game_event", this.onGameEvent, this);

    EMITTER.emit("golf_scene_ready");
  }

  // card sprites

  addCard(cardName, x, y, angle = 0) {
    const img = this.add.image(x, y, cardName)
      .setScale(CARD_SCALE)
      .setAngle(angle);

    img.cardName = cardName;
    return img;
  }

  addDeck(state) {
    const { x, y } = deckCoord(GAME_WIDTH, GAME_HEIGHT, state);
    const img = this.addCard(DOWN_CARD, x, y);
    this.cards.deck = img;

    if (isPlayable(this.golfGame, "deck")) {
      makePlayable(img, () => this.pushDeckClick());
    }
  }

  addTableCard(card) {
    const { x, y } = tableCoord(GAME_WIDTH, GAME_HEIGHT);
    const img = this.addCard(card, x, y);

    // make old card unplayable
    if (this.cards.table[0]) {
      makeUnplayable(this.cards.table[0]);
    }

    this.cards.table.unshift(img);
    return img;
  }

  addTableCards() {
    const card0 = this.golfGame.tableCards[0];
    const card1 = this.golfGame.tableCards[1];

    // add the second card first, so it's on bottom
    if (card1) {
      this.addTableCard(card1);
    }

    if (card0) {
      const img = this.addTableCard(card0);

      if (isPlayable(this.golfGame, "table")) {
        makePlayable(img, () => this.pushTableClick());
      }
    }
  }

  addHand(player) {
    player.hand.forEach((card, index) => {
      const cardName = card["face_up?"] ? card.name : DOWN_CARD;
      const { x, y, rotation } = handCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position, index);
      const img = this.addCard(cardName, x, y, rotation);
      this.cards.hands[player.position][index] = img;

      if (isPlayable(this.golfGame, `hand_${index}`)) {
        makePlayable(img, () => this.pushHandClick(index));
      }
    });
  }

  addHeldCard(player) {
    const cardName = player.id === this.golfGame.playerId
      ? player.held_card
      : DOWN_CARD;

    const { x, y, rotation } = heldCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position);
    const img = this.addCard(cardName, x, y, rotation);
    this.cards.held = img;

    const tableImg = this.cards.table[0];

    if (tableImg && isPlayable(this.golfGame, "held")) {
      // originally the user clicked on the held card to send a discard event
      // it feels more natural to click the table instead, so we'll set up the handler on the table image
      // the tableImg will call onTableClick when "table" is in playableCards, and onHeldClick when "held" is in playableCards
      // TODO find better names
      makePlayable(tableImg, () => this.pushHeldClick());
    }
  }

  // server events

  onGameLoad(game) {
    this.golfGame = game;
    this.addDeck(game.state);

    if (game.state !== "no_round") {
      this.addTableCards();

      for (const player of game.players) {
        this.addHand(player);

        if (player.held_card) {
          this.addHeldCard(player);
        }
      }
    }

    if (game.userIsHost && game.state === "no_round") {
      this.createStartGameButton();
    }
  }

  onRoundStart(game) {
    this.golfGame = game;

    if (this.startButtonBg) {
      this.destroyStartGameButton();
    }

    const tween = this.tweens.add({
      targets: this.cards.deck,
      x: GAME_WIDTH / 2 - CARD_WIDTH / 2 - DECK_TABLE_OFFSET,
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

  onGameEvent(game, event) {
    const player = game.players.find(p => p.id === event.player_id);
    if (!player) throw new Error("null player");

    switch (event.action) {
      case "flip":
        this.onFlip(game, player, event);
        break;
      case "take_deck":
        this.onTakeDeck(game, player);
        break;
      case "take_table":
        this.onTakeTable(game, player);
        break;
      case "discard":
        this.onDiscard(game, player);
        break;
      case "swap":
        this.onSwap(game, player, event);
        break;
    }

    this.golfGame = game;
  }

  onFlip(game, player, event) {
    const handImages = this.cards.hands[player.position];
    const cardImg = handImages[event.hand_index];

    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);;

    handImages.forEach((img, i) => {
      if (!isPlayable(game, `hand_${i}`)) {
        makeUnplayable(img);
      }
    });

    if (isPlayable(game, "deck")) {
      makePlayable(this.cards.deck, () => this.pushDeckClick());
    }

    if (isPlayable(game, "table")) {
      makePlayable(this.cards.table[0], () => this.pushTableClick());
    }
  }

  onTakeDeck(game, player) {
    this.golfGame = game;
    this.addHeldCard(player);

    if (player.id === this.golfGame.playerId) {
      makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        makePlayable(this.cards.table[0], () => this.pushTableClick());
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => makePlayable(img, () => this.pushHandClick(i)));
    }
  }

  onTakeTable(game, player) {
    this.golfGame = game;
    this.addHeldCard(player);

    const tableImg = this.cards.table.shift();
    tableImg.destroy();

    if (player.id === this.golfGame.playerId) {
      makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        // set a timeout in case the user accidentally double clicks
        setTimeout(() => {
          makePlayable(this.cards.table[0], () => this.pushTableClick());
        }, 250);
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => makePlayable(img, () => this.pushHandClick(i)));
    }
  }

  onDiscard(game, player) {
    this.golfGame = game;
    this.addTableCard(game.tableCards[0]);

    this.cards.held.destroy();
    this.cards.held = null;

    const hand = this.cards.hands[player.position];

    hand.forEach((cardImg, i) => {
      if (!isPlayable(game, `hand_${i}`)) {
        makeUnplayable(cardImg);
      }

      // if the game is over, flip all the player's cards
      if (game.isFlipped) {
        const cardName = player.hand[i].name;
        cardImg.setTexture(cardName);;
      }
    });

    if (isPlayable(game, "deck")) {
      makePlayable(this.cards.deck, () => this.pushDeckClick());
    }

    if (isPlayable(game, "table")) {
      makePlayable(this.cards.table[0], () => this.pushTableClick());
    }

    if (this.cards.table[1]) {
      makeUnplayable(this.cards.table[1]);
    }
  }

  onSwap(game, player, event) {
    if (this.cards.table[0]) {
      makeUnplayable(this.cards.table[0]);
    }

    this.addTableCard(game.tableCards[0]);

    const hand = this.cards.hands[player.position];
    const cardImg = hand[event.hand_index]
    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);

    this.cards.held.destroy();
    this.cards.held = null;

    // if this is the last round, flip all the player's cards
    if (game.isFlipped) {
      hand.forEach((cardImg, i) => {
        const cardName = player.hand[i].name;
        cardImg.setTexture(cardName);
      });
    }

    if (player.id === game.playerId) {
      for (const cardImg of hand) {
        makeUnplayable(cardImg);
      }
    }

    if (isPlayable(game, "deck")) {
      makePlayable(this.cards.deck, () => this.pushDeckClick());
    }

    if (isPlayable(game, "table")) {
      makePlayable(this.cards.table[0], () => this.pushTableClick());
    }
  }

  // client events

  pushDeckClick() {
    this.pushEvent("card_click", {
      playerId: this.golfGame.playerId,
      place: "deck"
    });
  }

  pushTableClick() {
    this.pushEvent("card_click", {
      playerId: this.golfGame.playerId,
      place: "table",
    });
  }

  pushHandClick(handIndex) {
    this.pushEvent("card_click", {
      playerId: this.golfGame.playerId,
      handIndex,
      place: "hand",
    });
  }

  pushHeldClick() {
    this.pushEvent("card_click", {
      playerId: this.golfGame.playerId,
      place: "held",
    });
  }

  pushStartRound() {
    this.pushEvent("start_round");
  }

  // ui

  createStartGameButton() {
    const width = 150;
    const height = 50;
    const radius = 10;
    const bgColor = 0x0000ff;
    const textColor = '#ffffff';
    const margin = 20; // px from the bottom of the canvas

    const buttonX = GAME_WIDTH / 2 - width / 2;
    const buttonY = GAME_HEIGHT - height - margin;

    this.startButtonBg = this.add.graphics({ x: buttonX, y: buttonY });
    this.startButtonBg.fillStyle(bgColor, 1);
    this.startButtonBg.fillRoundedRect(0, 0, width, height, radius);
    this.startButtonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    this.startButtonText = this.add.text(GAME_WIDTH / 2, buttonY + height / 2, 'Start Game', {
      font: '24px monospace',
      fill: textColor
    }).setOrigin(0.5);

    this.startButtonBg.on('pointerdown', () => this.pushStartRound());
    this.startButtonBg.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    this.startButtonBg.on('pointerout', () => this.input.setDefaultCursor('default'));
  }

  destroyStartGameButton() {
    this.startButtonBg.destroy();
    this.startButtonText.destroy();
    this.input.setDefaultCursor('default');
  }
}

// util

function isPlayable(game, cardPlace) {
  return game.playableCards.includes(cardPlace);
}

function makePlayable(cardImg, callback) {
  cardImg.setTint(0x00ffff);
  cardImg.setInteractive({ cursor: "pointer" });

  cardImg.off("pointerdown");
  cardImg.on("pointerdown", () => callback(cardImg));
}

function makeUnplayable(cardImg) {
  cardImg.clearTint();
  cardImg.off("pointerdown");
  cardImg.removeInteractive();
}

