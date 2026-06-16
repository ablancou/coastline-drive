/** Normalized driver input consumed by the vehicle controller (source-agnostic). */
export interface InputState {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
}

export const ZERO_INPUT: InputState = {
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
};