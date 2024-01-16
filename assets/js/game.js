import * as Phaser from "../vendor/phaser.min.js";

export const EMITTER = new Phaser.Events.EventEmitter();

export const CARD_SCALE = 0.29;

export const CARD_IMG_WIDTH = 242;
export const CARD_IMG_HEIGHT = 338;

export const CARD_WIDTH = CARD_IMG_WIDTH * CARD_SCALE;
export const CARD_HEIGHT = CARD_IMG_HEIGHT * CARD_SCALE;

export const HAND_X_PAD = 3;
export const HAND_Y_PAD = 10;

export const DECK_TABLE_OFFSET = 4; // px between deck and table cards

export const RANKS = "KA23456789TJQ".split("");
export const SUITS = "CDHS".split("");

export const DOWN_CARD = "2B";
export const JOKER_CARD = "jk";

export const CARD_NAMES = cardNames();

export function cardNames() {
  const names = [DOWN_CARD, JOKER_CARD];

  for (const rank of RANKS) {
    for (const suit of SUITS) {
      names.push(rank + suit)
    }
  }

  return names;
}

export function cardPath(name) {
  return `/images/cards/${name}.svg`;
}

export const BG_COLOR = 0x228b22;

export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 600;
