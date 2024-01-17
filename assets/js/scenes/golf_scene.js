import * as Phaser from "../../vendor/phaser.min.js";
import { DOWN_CARD, CARD_WIDTH, DECK_TABLE_OFFSET, BG_COLOR, GAME_WIDTH, GAME_HEIGHT, EMITTER } from "../game.js";
import { deckCoord, tableCoord, handCardCoord, heldCardCoord } from "../coords.js";
import { makeHandTweens } from "../tweens.js";

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
    this.camera = this.cameras.main;

    // setup mouse wheel zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomFactor = 0.1;

      if (deltaY > 0 && this.camera.zoom < 2) {
        // scrolled up, zoom in
        this.camera.zoom += zoomFactor;
      } else if (deltaY < 0 && this.camera.zoom > 0.5) {
        // scrolled down, zoom out
        this.camera.zoom -= zoomFactor;
      }
    });

    // setup mouse dragging
    this.cameraBounds = {
      minX: -600,
      minY: -600,
      maxX: 600,
      maxY: 600
    };

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.input.on('pointerdown', pointer => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    // listen for when the pointer is moved
    this.input.on('pointermove', pointer => {
      if (this.isDragging) {
        const dragX = pointer.x - this.dragStartX;
        const dragY = pointer.y - this.dragStartY;

        // clamp camera
        this.camera.scrollX = Phaser.Math.Clamp(
          this.camera.scrollX - dragX,
          this.cameraBounds.minX,
          this.cameraBounds.maxX
        );
        this.camera.scrollY = Phaser.Math.Clamp(
          this.camera.scrollY - dragY,
          this.cameraBounds.minY,
          this.cameraBounds.maxY
        );

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    // listen for when the pointer is released
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // setup key listeners
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // setup events listeners
    EMITTER.on("game_loaded", this.onGameLoad, this);
    EMITTER.on("game_event", this.onGameEvent, this);
    EMITTER.on("round_started", this.onRoundStart, this);

    EMITTER.emit("golf_scene_ready");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      // Reset the camera
      this.camera.setZoom(1);
      this.camera.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
  }

  // card sprites

  addCard(cardName, x, y, angle = 0) {
    const img = this.add.image(x, y, cardName).setAngle(angle);
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
    const hand = this.cards.hands[player.position];

    player.hand.forEach((card, index) => {
      const cardName = card["face_up?"] ? card.name : DOWN_CARD;
      const { x, y, rotation } = handCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position, index);
      const cardImg = this.addCard(cardName, x, y, rotation);
      hand[index] = cardImg;

      if (isPlayable(this.golfGame, `hand_${index}`)) {
        makePlayable(cardImg, () => this.pushHandClick(index));
      }
    });

    return hand;
  }

  addHeldCard(player) {
    const isUsersCard = player.id === this.golfGame.playerId;
    const cardName = isUsersCard ? player.held_card : DOWN_CARD;

    const { x, y, rotation } = heldCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position);
    const heldImg = this.addCard(cardName, x, y, rotation);
    this.cards.held = heldImg;

    const tableImg = this.cards.table[0];

    if (tableImg && isPlayable(this.golfGame, "held")) {
      // TODO find better names
      // originally the user clicked on the held card to send a discard event
      // it feels more natural to click the table instead, so we'll set up the handler on the table image
      // the tableImg will call onTableClick when "table" is in playableCards, and onHeldClick when "held" is in playableCards
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

    if (this.startButton) {
      this.destroyStartGameButton();
    }

    let handsTweens = [];

    game.players.forEach((player, i) => {
      const hand = this.addHand(player);
      const tweens = makeHandTweens(this, GAME_WIDTH, GAME_HEIGHT, hand, i);
      handsTweens.push(tweens);
    });

    handsTweens.forEach((handTweens, playerIndex) => {
      handTweens.forEach((tween, cardIndex) => {
        // start tweening the deck after dealing to the last player
        if (playerIndex === game.players.length - 1 && cardIndex === 5) {
          tween.setCallback("onComplete", () => {

            this.tweens.add({
              targets: this.cards.deck,
              x: GAME_WIDTH / 2 - CARD_WIDTH / 2 - DECK_TABLE_OFFSET,
              duration: 200,
              ease: "Quad.easeOut",
              onComplete: () => {
                this.addTableCards();

                const tableImg = this.cards.table[0];
                const x = tableImg.x;
                const y = tableImg.y;
                tableImg.x = this.cards.deck.x;
                tableImg.y = this.cards.deck.y;

                this.tweens.add({
                  targets: tableImg,
                  x,
                  y,
                  duration: 400,
                  ease: "Quad.easeOut",
                });
              },
            });
          });
        }

        tween.resume();
      });
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
    const hand = this.cards.hands[player.position];
    const cardImg = hand[event.hand_index];

    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);;

    hand.forEach((img, i) => {
      if (!isPlayable(game, `hand_${i}`)) {
        makeUnplayable(img);
      }
    });

    if (isPlayable(game, "deck")) {
      makePlayable(this.cards.deck, () => this.pushDeckClick());
    }

    if (isPlayable(game, "table") && this.cards.table[0]) {
      makePlayable(this.cards.table[0], () => this.pushTableClick());
    }
  }

  onTakeDeck(game, player) {
    this.golfGame = game;
    this.addHeldCard(player);

    // tween held card from the deck
    const heldImg = this.cards.held;
    const x = heldImg.x;
    const y = heldImg.y;
    heldImg.x = this.cards.deck.x;
    heldImg.y = this.cards.deck.y;

    this.tweens.add({
      targets: heldImg,
      x,
      y,
      duration: 750,
      ease: "Quad.easeInOut",
    });

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

    // tween held card from table
    const heldImg = this.cards.held;
    const x = heldImg.x;
    const y = heldImg.y;
    heldImg.x = this.cards.table[0].x;
    heldImg.y = this.cards.table[0].y;

    this.tweens.add({
      targets: heldImg,
      x,
      y,
      duration: 750,
      ease: "Quad.easeInOut",
    });

    const tableImg = this.cards.table.shift();
    tableImg.destroy();

    if (player.id === this.golfGame.playerId) {
      makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        makePlayable(this.cards.table[0], () => this.pushTableClick());
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => makePlayable(img, () => this.pushHandClick(i)));
    }
  }

  onDiscard(game, player) {
    this.golfGame = game;
    this.addTableCard(game.tableCards[0]);

    const tableImg = this.cards.table[0];
    const x = tableImg.x;
    const y = tableImg.y;
    tableImg.x = this.cards.held.x;
    tableImg.y = this.cards.held.y;

    this.tweens.add({
      targets: tableImg,
      x,
      y,
      duration: 750,
      ease: "Quad.easeInOut",
    });

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
        cardImg.setTexture(cardName);
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

    const hand = this.cards.hands[player.position];
    const cardImg = hand[event.hand_index]
    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);

    const tableImg = this.addTableCard(game.tableCards[0]);
    const x = tableImg.x;
    const y = tableImg.y;
    tableImg.x = cardImg.x;
    tableImg.y = cardImg.y;

    this.tweens.add({
      targets: tableImg,
      x,
      y,
      duration: 750,
      ease: "Quad.easeInOut",
    });

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
    const width = 300;
    const height = 100;
    const radius = 20;
    const bgColor = 0x0000ff;
    const textColor = '#ffffff';
    const margin = 40; // px from the bottom of the canvas
    const x = GAME_WIDTH / 2 - width / 2;
    const y = GAME_HEIGHT - height - margin;

    this.startButton = {};

    this.startButton.background = this.add.graphics({ x, y });
    this.startButton.background.fillStyle(bgColor, 1);
    this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    this.startButton.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    this.startButton.text = this.add.text(GAME_WIDTH / 2, y + height / 2, 'Start Game', {
      font: '48px monospace',
      fill: textColor
    }).setOrigin(0.5);

    this.startButton.background.on('pointerdown', () => this.pushStartRound());
    this.startButton.background.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    this.startButton.background.on('pointerout', () => this.input.setDefaultCursor('default'));
  }

  destroyStartGameButton() {
    this.startButton.background.destroy();
    this.startButton.text.destroy();
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

