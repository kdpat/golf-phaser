import * as Phaser from "../../vendor/phaser.min.js";
import { DOWN_CARD, CARD_HEIGHT, CARD_WIDTH, DECK_TABLE_OFFSET, BG_COLOR, GAME_WIDTH, GAME_HEIGHT, EMITTER, HAND_Y_PAD, HAND_X_PAD } from "../game.js";
import { deckCoord, tableCoord, handCardCoord, heldCardCoord } from "../coords.js";
import { makeHandTweens } from "../tweens.js";

export const PLAYER_TURN_COLOR = "#00ff00";
export const NOT_PLAYER_TURN_COLOR = "#ff77ff";

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

    this.playerTexts = {};
  }

  init(data) {
    this.pushEvent = data.pushEvent;
  }

  create() {
    this.setupCamera();
    this.setupMouseWheelZoom();
    this.setupMouseDragging();
    this.setupKeyListeners();
    this.setupEventListeners();
    EMITTER.emit("golf_scene_ready");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.resetCamera();
    }
  }

  resetCamera() {
    this.camera.setZoom(1);
    this.camera.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }

  setupKeyListeners() {
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  setupEventListeners() {
    EMITTER.on("game_loaded", this.onGameLoad, this);
    EMITTER.on("game_event", this.onGameEvent, this);
    EMITTER.on("round_started", this.onRoundStart, this);
  }

  setupCamera() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(BG_COLOR);

    this.cameraBounds = {
      minX: -GAME_WIDTH / 2,
      minY: -GAME_HEIGHT / 2,
      maxX: GAME_WIDTH / 2,
      maxY: GAME_HEIGHT / 2,
    };
  }

  setupMouseWheelZoom() {
    const zoomFactor = 0.1;

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (deltaY > 0 && this.camera.zoom < 2) {
        this.camera.zoom += zoomFactor;
      } else if (deltaY < 0 && this.camera.zoom > 0.5) {
        this.camera.zoom -= zoomFactor;
      }
    });
  }

  setupMouseDragging() {
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

    this.input.on('pointermove', pointer => {
      if (this.isDragging) {
        const dragX = pointer.x - this.dragStartX;
        const dragY = pointer.y - this.dragStartY;
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

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  // card sprites

  addCard(cardName, x, y, angle = 0) {
    return this.add.image(x, y, cardName).setAngle(angle);
  }

  addDeck(state) {
    const { x, y } = deckCoord(GAME_WIDTH, GAME_HEIGHT, state);
    const deckImg = this.addCard(DOWN_CARD, x, y);
    this.cards.deck = deckImg;

    if (this.isPlayable("deck")) {
      this.makePlayable(deckImg, () => this.pushCardClick("deck"));
    }
  }

  addTableCard(card) {
    const { x, y } = tableCoord(GAME_WIDTH, GAME_HEIGHT);
    const tableImg = this.addCard(card, x, y);

    // make old card unplayable
    if (this.cards.table[0]) {
      this.makeUnplayable(this.cards.table[0]);
    }

    this.cards.table.unshift(tableImg);
    return tableImg;
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

      if (this.isPlayable("table")) {
        this.makePlayable(img, () => this.pushCardClick("table"));
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

      if (this.isPlayable(`hand_${index}`)) {
        this.makePlayable(cardImg, () => this.pushCardClick("hand", index));
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

    if (tableImg && this.isPlayable("held")) {
      // TODO find better names
      // originally the user clicked on the held card to send a discard event
      // it feels more natural to click the table instead, so we'll set up the handler on the table image
      // the tableImg will call onTableClick when "table" is in playableCards, and onHeldClick when "held" is in playableCards
      this.makePlayable(tableImg, () => this.pushCardClick("held"));
    }
  }

  addPlayerText(player) {
    const color = playerColor(player);

    const textStyle = {
      font: '40px monospace',
      fill: color,
    };

    const points = player.score == 1 || player.score == -1 ? "pt" : "pts";
    const playerInfo = `${player.user.name}(${player.score}${points})`;
    const text = this.add.text(0, 0, playerInfo, textStyle);

    switch (player.position) {
      case "bottom":
        text.x = GAME_WIDTH / 2;
        text.y = GAME_HEIGHT - 20;
        text.setOrigin(0.5, 1);
        break;

      case "top":
        text.x = GAME_WIDTH / 2;
        text.y = 20;
        text.setOrigin(0.5, 0.0);
        break;

      case "left":
        text.x = CARD_HEIGHT + 8;
        text.y = GAME_HEIGHT / 2 - CARD_HEIGHT * 2 - HAND_X_PAD;
        text.setOrigin(0.5, 0.0);
        break;

      case "right":
        text.x = GAME_WIDTH - CARD_HEIGHT - HAND_Y_PAD;
        text.y = GAME_HEIGHT / 2 - CARD_HEIGHT * 2 - HAND_X_PAD;
        text.setOrigin(0.5, 0.0);
        break;

      default:
        throw new Error(`invalid position: ${pos}`);
    }

    this.playerTexts[player.position] = text;
    return text;
  }

  updatePlayerTexts() {
    for (const player of this.golfGame.players) {
      this.updatePlayerText(player);
    }
  }

  updatePlayerText(player) {
    const text = this.playerTexts[player.position];
    const color = playerColor(player);
    const points = player.score == 1 || player.score == -1 ? "pt" : "pts";
    const playerInfo = `${player.user.name}(${player.score}${points})`;
    text.setText(playerInfo);
    text.setColor(color);    
  }

  // server events

  onGameLoad(game) {
    this.golfGame = game;
    this.addDeck(game.state);

    if (game.state !== "no_round") {
      this.addTableCards();

      for (const player of game.players) {
        this.addPlayerText(player);
        this.addHand(player);

        if (player.held_card) {
          this.addHeldCard(player);
        }
      }
    } else {
      game.players.forEach(p => this.addPlayerText(p));
    }

    if (game.userIsHost && game.state === "no_round") {
      this.createStartButton();
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

      this.updatePlayerText(player);
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

    this.golfGame = game;

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

    this.updatePlayerTexts();
  }

  onFlip(game, player, event) {
    const hand = this.cards.hands[player.position];
    const cardImg = hand[event.hand_index];

    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);

    this.wiggleCard(cardImg);

    hand.forEach((img, i) => {
      if (!this.isPlayable(`hand_${i}`)) {
        this.makeUnplayable(img);
      }
    });

    if (this.isPlayable("deck")) {
      this.makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.isPlayable("table") && this.cards.table[0]) {
      this.makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
    }
  }

  onTakeDeck(game, player) {
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
      this.makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        this.makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => this.makePlayable(img, () => this.pushCardClick("hand", i)));
    }
  }

  onTakeTable(game, player) {
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
      this.makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        this.makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => this.makePlayable(img, () => this.pushCardClick("hand", i)));
    }
  }

  onDiscard(game, player) {
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
      if (!this.isPlayable(`hand_${i}`)) {
        this.makeUnplayable(cardImg);
      }

      // if the game is over, flip all the player's cards
      if (game.isFlipped) {
        const cardName = player.hand[i].name;
        cardImg.setTexture(cardName);
      }
    });

    if (this.isPlayable("deck")) {
      this.makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.isPlayable("table")) {
      this.makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
    }

    if (this.cards.table[1]) {
      this.makeUnplayable(this.cards.table[1]);
    }
  }

  onSwap(game, player, event) {
    if (this.cards.table[0]) {
      this.makeUnplayable(this.cards.table[0]);
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
        this.makeUnplayable(cardImg);
      }
    }

    if (this.isPlayable("deck")) {
      this.makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.isPlayable("table")) {
      this.makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
    }
  }

  // client events

  pushCardClick(place, handIndex = null) {
    const data = {
      playerId: this.golfGame.playerId,
      place,
    };

    if (handIndex !== null) {
      data.handIndex = handIndex;
    }

    this.pushEvent("card_click", data);
  }

  pushStartRound() {
    this.pushEvent("start_round");
  }

  // ui

  createStartButton() {
    const width = 300;
    const height = 100;
    const radius = 20;
    const bgColor = 0x0000ff;
    const textColor = '#ffffff';
    const bgX = GAME_WIDTH / 2 - width / 2;
    const bgY = GAME_HEIGHT * 0.85 - height / 2;

    this.startButton = {};

    this.startButton.background = this.add.graphics({ x: bgX, y: bgY });
    this.startButton.background.fillStyle(bgColor, 1);
    this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    this.startButton.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    this.startButton.text = this.add.text(GAME_WIDTH / 2, bgY + height / 2, 'Start Game', {
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

  makePlayable(cardImg, callback) {
    cardImg.setTint(0x00ffff);
    cardImg.setInteractive({ cursor: "pointer" });
    cardImg.off("pointerdown");
    cardImg.on("pointerdown", () => callback(cardImg));
  }

  makeUnplayable(cardImg) {
    cardImg.clearTint();
    cardImg.off("pointerdown");
    cardImg.removeInteractive();
  }

  wiggleCard(cardImg) {
    this.tweens.add({
      targets: cardImg,
      angle: { from: -1, to: 1 },
      duration: 75,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => cardImg.setAngle(0),
    });
  }

  isPlayable(cardPlace) {
    return this.golfGame.playableCards.includes(cardPlace);
  }
}

function playerColor(player) {
  return player["can_act?"]
    ? PLAYER_TURN_COLOR
    : NOT_PLAYER_TURN_COLOR;
}
