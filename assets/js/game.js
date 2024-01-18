import * as Phaser from "../vendor/phaser.min.js";

export const EMITTER = new Phaser.Events.EventEmitter();

export const BG_COLOR = 0x228b22;

export const GAME_WIDTH = 950;
export const GAME_HEIGHT = 1200;

export const CARD_SCALE = 0.5;

export const CARD_IMG_WIDTH = 225;
export const CARD_IMG_HEIGHT = 315;

export const CARD_WIDTH = CARD_IMG_WIDTH * CARD_SCALE;
export const CARD_HEIGHT = CARD_IMG_HEIGHT * CARD_SCALE;

// px between hand cards
export const HAND_X_PAD = GAME_WIDTH / 60;
export const HAND_Y_PAD = GAME_HEIGHT / 16;

// px between deck and table cards
export const DECK_TABLE_OFFSET = GAME_WIDTH / 120;

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
  return `/images/cards/svg/${name}.svg`;
}

export const PLAYER_TURN_COLOR = "#00ff00";
export const NOT_PLAYER_TURN_COLOR = "#ff77ff";
