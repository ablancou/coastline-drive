/**
 * Shared mutable touch-input state — written by the on-screen TouchControls (DOM)
 * and read by the input system during poll(). Mirrors InputState plus an `active`
 * flag so the input system only uses it while the player is touching a control.
 */
export const touchInput = {
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  active: false,
};
