import { deckCoord } from "./coords";

const HAND_SIZE = 6;

export function makeHandTweens(scene, width, height, cardImages, turn) {
  const tweens = [];

  for (let i = HAND_SIZE - 1; i >= 0; i--) {
    const cardImg = cardImages[i];
    const x = cardImg.x;
    const y = cardImg.y;

    const startCoord = deckCoord(width, height, "no_round");
    cardImg.x = startCoord.x;
    cardImg.y = startCoord.y;

    const delay = (HAND_SIZE - 1 - i) * 150 + turn * 1000;

    const tween = scene.tweens.add({
      targets: cardImg,
      x,
      y,
      duration: 500,
      ease: "Quad.easeInOut",
      paused: true,
      delay,
      // onStart: () => scene.children.bringToTop(cardImg),
    });

    tweens.push(tween);
  }

  return tweens;
}