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

const WIDTH = 600;
const HEIGHT = 600;

const BG_COLOR = "#228b22";

const CARD_SCALE = 0.3;
const CARD_IMG_WIDTH = 242;
const CARD_IMG_HEIGHT = 338;

const CARD_WIDTH = CARD_IMG_WIDTH * CARD_SCALE;
const CARD_HEIGHT = CARD_IMG_HEIGHT * CARD_SCALE;

function preload() {
  for (const card of CARD_NAMES) {
    this.load.image(card, cardPath(card));
  }
}

function create() {
  const card = addCard(this, "AH", 0, 0);
  card.setVelocity(50, 100);
  card.setBounce(1, 1);
  card.setCollideWorldBounds(true);  
}

function addCard(game, cardName, x, y) {
  const image = game.physics.add.image(x, y, cardName).setScale(CARD_SCALE);
  return image;
}

function update() {
  
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: BG_COLOR,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    }
  },
  scene: {
    preload,
    create,
    update,
  }
};

export function createGame() {
  return new Phaser.Game(config);
}
  
