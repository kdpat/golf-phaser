import * as Phaser from "../../vendor/phaser.min.js";
import { DOWN_CARD, CARD_HEIGHT, CARD_WIDTH, DECK_TABLE_OFFSET, BG_COLOR, GAME_WIDTH, GAME_HEIGHT, EMITTER, HAND_X_PAD } from "../game.js";
import { deckCoord, tableCoord, handCardCoord, heldCardCoord, playerTextCoord } from "../coords.js";
import { makeHandTweens } from "../tweens.js";
import { PLAYER_TURN_COLOR, NOT_PLAYER_TURN_COLOR } from "../game.js";

export class GolfScene extends Phaser.Scene {
  constructor() {
    super({ key: "GolfScene" });

    this.cards = {
      hands: {
        bottom: [],
        left: [],
        top: [],
        right: [],
      },
      table: [],
      deck: null,
      held: null,
    };

    this.playerTexts = {};
  }

  init(data) {
    this.golfGame = data.golfGame;
    this.pushEvent = data.pushEvent;
  }

  create() {
    this.setupCamera();
    this.setupMouseWheelZoom();
    this.setupMouseDragging();
    this.setupKeyListeners();
    this.setupEventListeners();
    this.onGameLoad(this.golfGame);
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

    const dragSpeed = 1;

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
        const dragX = (pointer.x - this.dragStartX) * dragSpeed;
        const dragY = (pointer.y - this.dragStartY) * dragSpeed;
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
      makePlayable(deckImg, () => this.pushCardClick("deck"));
    }
  }

  addTableCard(card) {
    const { x, y } = tableCoord(GAME_WIDTH, GAME_HEIGHT);
    const tableImg = this.addCard(card, x, y);

    if (this.cards.table[0]) {
      makeUnplayable(this.cards.table[0]);
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
      const tableImg = this.addTableCard(card0);

      if (this.isPlayable("table")) {
        makePlayable(tableImg, () => this.pushCardClick("table"));
      }
    }
  }

  addHand(player) {
    const handImages = this.cards.hands[player.position];

    player.hand.forEach((card, index) => {
      const cardName = card["face_up?"] ? card.name : DOWN_CARD;
      const { x, y, rotation } = handCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position, index);
      const cardImg = this.addCard(cardName, x, y, rotation);
      handImages[index] = cardImg;

      if (player.id === this.golfGame.playerId && this.isPlayable(`hand_${index}`)) {
        makePlayable(cardImg, () => this.pushCardClick("hand", index));
      }
    });

    return handImages;
  }

  addHeldCard(player) {
    const cardName = player.id === this.golfGame.playerId
      ? player.held_card
      : DOWN_CARD;

    const { x, y, rotation } = heldCardCoord(GAME_WIDTH, GAME_HEIGHT, player.position);
    const heldImg = this.addCard(cardName, x, y, rotation);
    this.cards.held = heldImg;

    const tableImg = this.cards.table[0];

    if (tableImg && this.isPlayable("held")) {
      makePlayable(tableImg, () => this.pushCardClick("table"));
    }
  }

  addPlayerText(player) {
    const color = playerColor(player);

    const textStyle = {
      font: '28px monospace',
      fill: color,
      align: "center",
    };

    const points = player.score == 1 || player.score == -1 ? "pt" : "pts";
    const textStr = `${player.user.name}\n(${player.score}${points})`;
    const textObj = this.add.text(0, 0, textStr, textStyle);

    const { x, y, originX, originY } = playerTextCoord(GAME_WIDTH, GAME_HEIGHT, player.position);
    textObj.setPosition(x, y);
    textObj.setOrigin(originX, originY);

    this.playerTexts[player.position] = textObj;
    return textObj;
  }

  updatePlayerTexts() {
    for (const player of this.golfGame.players) {
      this.updatePlayerText(player);
    }
  }

  updatePlayerText(player) {
    const points = player.score == 1 || player.score == -1 ? "pt" : "pts";
    const textStr = `${player.user.name}\n(${player.score}${points})`;
    const textObj = this.playerTexts[player.position];
    textObj.setText(textStr);

    const color = playerColor(player);
    textObj.setColor(color);
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

    if (game.userIsHost && game.state === "round_over") {
      this.createNextRoundButton();
    }
  }

  onRoundStart(game) {
    this.golfGame = game;

    this.cards.table.forEach(img => img.destroy());
    this.cards.table = [];

    Object.values(this.cards.hands).forEach(hand => {
      hand.forEach(cardImg => cardImg.destroy());
    });

    this.cards.deck.x = GAME_WIDTH / 2;

    if (this.startButton) {
      this.destroyStartGameButton();
    }

    const firstPlayerIndex = game.players.findIndex(p => p.id == game.firstPlayerId);
    if (firstPlayerIndex == null) throw new Error("first player index is null");

    const players = rotate(game.players, firstPlayerIndex);
    const handsTweens = [];

    // we want the first players cards on top, so draw the cards last player to first
    for (let i = players.length - 1; i >= 0; i--) {
      const player = players[i];
      const handImages = this.addHand(player);
      const tweens = makeHandTweens(this, GAME_WIDTH, GAME_HEIGHT, handImages, i);
      handsTweens.push(tweens);
      this.updatePlayerText(player);
    }

    // reverse the tweens so they still happen first to last
    handsTweens.reverse();

    handsTweens.forEach((handTweens, playerIndex) => {
      handTweens.forEach((tween, cardIndex) => {
        // tween.targets.forEach((img, i) => img.setDepth(i))
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

    const oldState = this.golfGame.state;
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

    if (game.userIsHost
      && game.state === "round_over"
      && oldState !== "round_over") {
      this.createNextRoundButton();
    }

    this.updatePlayerTexts();
  }

  onFlip(game, player, event) {
    const handImages = this.cards.hands[player.position];
    const cardImg = handImages[event.hand_index];

    const cardName = player.hand[event.hand_index].name;
    cardImg.setTexture(cardName);

    this.wiggleCard(cardImg);

    handImages.forEach((img, i) => {
      if (!this.isPlayable(`hand_${i}`)) {
        makeUnplayable(img);
      }
    });

    if (this.cards.deck && this.isPlayable("deck")) {
      makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.cards.table[0] && this.isPlayable("table")) {
      makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
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
      makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => makePlayable(img, () => this.pushCardClick("hand", i)));
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
      makeUnplayable(this.cards.deck);

      if (this.cards.table[0]) {
        makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
      }

      const hand = this.cards.hands[player.position];
      hand.forEach((img, i) => makePlayable(img, () => this.pushCardClick("hand", i)));
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

    const handImages = this.cards.hands[player.position];

    handImages.forEach((cardImg, i) => {
      if (!this.isPlayable(`hand_${i}`)) {
        makeUnplayable(cardImg);
      }

      // if the game is over, flip all the player's cards
      if (game.isFlipped) {
        const cardName = player.hand[i].name;
        cardImg.setTexture(cardName);
      }
    });

    if (this.isPlayable("deck")) {
      makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.isPlayable("table")) {
      makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
    }

    if (this.cards.table[1]) {
      makeUnplayable(this.cards.table[1]);
    }
  }

  onSwap(game, player, event) {
    if (this.cards.table[0]) {
      makeUnplayable(this.cards.table[0]);
    }

    const handImages = this.cards.hands[player.position];
    const handCardImg = handImages[event.hand_index]
    const cardName = player.hand[event.hand_index].name;
    handCardImg.setTexture(cardName);
    const hcX = handCardImg.x;
    const hcY = handCardImg.y;

    const tableImg = this.addTableCard(game.tableCards[0]);
    const x = tableImg.x;
    const y = tableImg.y;
    tableImg.x = handCardImg.x;
    tableImg.y = handCardImg.y;

    handCardImg.x = this.cards.held.x;
    handCardImg.y = this.cards.held.y;
    // handCardImg.angle = this.cards.held.angle;

    this.children.bringToTop(tableImg);
    this.children.bringToTop(handCardImg);

    this.tweens.add({
      targets: handCardImg,
      x: hcX,
      y: hcY,
      // angle: 0,
      duration: 750,
      ease: "Quad.easeInOut",
      // onStart: () => {
      //   setTimeout(() => this.wiggleCard(handCardImg), 400);
      // },
    });

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
      handImages.forEach((cardImg, i) => {
        const cardName = player.hand[i].name;
        cardImg.setTexture(cardName);
      });
    }

    if (player.id === game.playerId) {
      for (const cardImg of handImages) {
        makeUnplayable(cardImg);
      }
    }

    if (this.isPlayable("deck")) {
      makePlayable(this.cards.deck, () => this.pushCardClick("deck"));
    }

    if (this.isPlayable("table")) {
      makePlayable(this.cards.table[0], () => this.pushCardClick("table"));
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
    const radius = 10;
    const bgColor = 0x0069d9;
    const textColor = '#ffffff';
    const bgX = GAME_WIDTH / 2 - width / 2;
    const bgY = GAME_HEIGHT - width / 2 - CARD_HEIGHT / 2 - 4;

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

    this.startButton.background.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      this.startButton.background.clear();
      this.startButton.background.fillStyle(0x005cbf, 1);
      this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    });

    this.startButton.background.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      this.startButton.background.clear();
      this.startButton.background.fillStyle(bgColor, 1);
      this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    });
  }

  createNextRoundButton() {
    const width = 300;
    const height = 100;
    const radius = 10;
    const bgColor = 0x0069d9;
    const textColor = '#ffffff';
    const bgX = GAME_WIDTH / 2 - width / 2;
    const bgY = GAME_HEIGHT - width / 2 - CARD_HEIGHT / 2 - 4;

    this.startButton = {};

    this.startButton.background = this.add.graphics({ x: bgX, y: bgY });
    this.startButton.background.fillStyle(bgColor, 1);
    this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    this.startButton.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    this.startButton.text = this.add.text(GAME_WIDTH / 2, bgY + height / 2, 'Next Round', {
      font: '48px monospace',
      fill: textColor
    }).setOrigin(0.5);

    this.startButton.background.on('pointerdown', () => this.pushStartRound());

    this.startButton.background.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      this.startButton.background.clear();
      this.startButton.background.fillStyle(0x005cbf, 1);
      this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    });

    this.startButton.background.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      this.startButton.background.clear();
      this.startButton.background.fillStyle(bgColor, 1);
      this.startButton.background.fillRoundedRect(0, 0, width, height, radius);
    });    
  }

  destroyStartGameButton() {
    this.startButton.background.destroy();
    this.startButton.text.destroy();
    this.input.setDefaultCursor('default');
  }

  wiggleCard(cardImg, duration = 75) {
    return this.tweens.add({
      targets: cardImg,
      angle: { from: -1, to: 1 },
      duration,
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

function playerColor(player) {
  return player["can_act?"]
    ? PLAYER_TURN_COLOR
    : NOT_PLAYER_TURN_COLOR;
}

function rotate(arr, n) {
  return arr.slice(n).concat(arr.slice(0, n));
}
