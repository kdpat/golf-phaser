import { CARD_WIDTH, CARD_HEIGHT, DECK_TABLE_OFFSET, HAND_X_PAD, HAND_Y_PAD } from "./game";

// coords

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
      x = width / 2 + CARD_WIDTH * 2 + xPad * 2.5;
      y = height - CARD_HEIGHT - yPad * 1.3 - 18;
      break;

    case "top":
      x = width / 2 - CARD_WIDTH * 1.5 - xPad;
      y = CARD_HEIGHT + yPad * 1.5;
      break;

    case "left":
      x = CARD_WIDTH + xPad + 4;
      y = height / 2 + CARD_HEIGHT * 1.5 + xPad + 2;
      break;

    case "right":
      x = width - CARD_WIDTH - xPad - 4;
      y = height / 2 + CARD_HEIGHT * 1.5 + xPad;
      break;

    default:
      throw new Error(`invalid pos: ${pos}`);
  }

  return { x, y, rotation: 0 };
}

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
      x = CARD_WIDTH * 1.5 + xPad * 2;
      y = height / 2 - CARD_HEIGHT - xPad - 2;
      break;

    case 1:
      x = CARD_WIDTH * 1.5 + xPad * 2;
      y = height / 2;
      break;

    case 2:
      x = CARD_WIDTH * 1.5 + xPad * 2;
      y = height / 2 + CARD_HEIGHT + xPad + 2;
      break;

    case 3:
      x = CARD_WIDTH / 2 + xPad;
      y = height / 2 - CARD_HEIGHT - xPad - 2;
      break;

    case 4:
      x = CARD_WIDTH / 2 + xPad;
      y = height / 2;
      break;

    case 5:
      x = CARD_WIDTH / 2 + xPad;
      y = height / 2 + CARD_HEIGHT + xPad + 2;
      break;
  }

  return { x, y, rotation: 0 };
}

function handCardRightCoord(width, height, index, xPad = HAND_X_PAD, yPad = HAND_Y_PAD) {
  let x = 0, y = 0;

  switch (index) {
    case 0:
      x = width - CARD_WIDTH * 1.5 - xPad * 2;
      y = height / 2 + CARD_HEIGHT + xPad + 2;
      break;

    case 1:
      x = width - CARD_WIDTH * 1.5 - xPad * 2;
      y = height / 2;
      break;

    case 2:
      x = width - CARD_WIDTH * 1.5 - xPad * 2;
      y = height / 2 - CARD_HEIGHT - xPad - 2;
      break;

    case 3:
      x = width - CARD_WIDTH / 2 - xPad;
      y = height / 2 + CARD_HEIGHT + xPad + 2;
      break;

    case 4:
      x = width - CARD_WIDTH / 2 - xPad;
      y = height / 2;
      break;

    case 5:
      x = width - CARD_WIDTH / 2 - xPad;
      y = height / 2 - CARD_HEIGHT - xPad - 2;
      break;
  }

  return { x, y, rotation: 0 };
}

export function playerTextCoord(width, height, position) {
  switch (position) {
    case "bottom":
      return { x: width / 2, y: height - 20, originX: 0.5, originY: 1 };

    case "top":
      return { x: width / 2, y: 20, originX: 0.5, originY: 0.0 };

    case "left":
      return { x: HAND_X_PAD, y: height / 2 - CARD_HEIGHT * 2 - HAND_X_PAD, originX: 0.0, originY: 0.0 };

    case "right":
      return { x: width, y: height / 2 - CARD_HEIGHT * 2 - HAND_X_PAD, originX: 1.0, originY: 0 };

    default:
      throw new Error(`invalid position: ${position}`);
  }
}

