/**
 * @typedef {("Move" | "Put" | "Delete")} ActionType
 * @typedef {number[]} Pos
 * @typedef {number[]} Color
 * @typedef {({ type: "Move" | "Delete", pos: Pos }) | ({ type: "Put", pos: Pos, color: Color, energy: number })} Action
 */

/**
 * @typedef {Object} State
 * @property {Object} world
 * @property {Object} world.pixels - 2D array of strings
 * @property {(focus: Pos | undefined) => void} world.subscribe - subscribe to focus changes
 * @property {(pos: Pos, color: string | null) => void} world.setPixel - set a pixel
 * @property {(pos: Pos) => string | null} world.getPixel - get a pixel
 * @property {Object} keyboard
 * @property {(key: string) => boolean} keyboard.isPressed - check if a key is pressed
 * @property {(fn: (key: string) => void) => () => void} keyboard.subscribe - subscribe to key presses
 */

/**
 * @param {State} state
 * @param {(action: Action) => void} act
 */


export function main(state, act) {

  state.keyboard.subscribe(console.log);

}


