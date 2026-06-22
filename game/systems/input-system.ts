import { GAMEPAD_DEADZONE } from "@/game/constants/input";
import { touchInput } from "@/game/systems/touch-input";
import { applyDeadzone, clamp } from "@/lib/math";
import { ZERO_INPUT, type InputState } from "@/types/input";

const KEY_MAP = {
  forward: new Set(["KeyW", "ArrowUp"]),
  backward: new Set(["KeyS", "ArrowDown"]),
  left: new Set(["KeyA", "ArrowLeft"]),
  right: new Set(["KeyD", "ArrowRight"]),
  handbrake: new Set(["Space"]),
} as const;

type InputSource = "gamepad" | "keyboard" | "touch" | "none";

interface InputSystemState {
  keys: Set<string>;
  source: InputSource;
}

/** Mutable input state — polled in useFrame, never React state. */
export function createInputSystem(): {
  state: InputSystemState;
  bind: () => void;
  unbind: () => void;
  poll: () => InputState;
  getSource: () => InputSource;
} {
  const state: InputSystemState = {
    keys: new Set(),
    source: "none",
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    state.keys.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    state.keys.delete(event.code);
  };

  const pollKeyboard = (): InputState => {
    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let handbrake = false;

    for (const code of KEY_MAP.forward) {
      if (state.keys.has(code)) throttle = 1;
    }
    for (const code of KEY_MAP.backward) {
      if (state.keys.has(code)) brake = 1;
    }
    for (const code of KEY_MAP.left) {
      if (state.keys.has(code)) steer -= 1;
    }
    for (const code of KEY_MAP.right) {
      if (state.keys.has(code)) steer += 1;
    }
    for (const code of KEY_MAP.handbrake) {
      if (state.keys.has(code)) handbrake = true;
    }

    return {
      throttle: clamp(throttle, 0, 1),
      brake: clamp(brake, 0, 1),
      steer: clamp(steer, -1, 1),
      handbrake,
    };
  };

  const pollGamepad = (): InputState | null => {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return null;

    const pad = Array.from(gamepads).find((gp) => gp?.connected);
    if (!pad) return null;

    const steer = applyDeadzone(pad.axes[0] ?? 0, GAMEPAD_DEADZONE);
    const throttle = applyDeadzone(-(pad.axes[1] ?? 0), GAMEPAD_DEADZONE);
    const brake = applyDeadzone(pad.buttons[7]?.value ?? 0, GAMEPAD_DEADZONE);
    const altBrake = applyDeadzone(-(pad.axes[2] ?? 0), GAMEPAD_DEADZONE);
    const handbrake = (pad.buttons[0]?.pressed ?? false) || (pad.buttons[1]?.value ?? 0) > 0.5;

    return {
      throttle: clamp(Math.max(throttle, 0), 0, 1),
      brake: clamp(Math.max(brake, altBrake, 0), 0, 1),
      steer: clamp(steer, -1, 1),
      handbrake,
    };
  };

  return {
    state,
    bind: () => {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    },
    unbind: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
    poll: () => {
      const gamepadInput = pollGamepad();
      if (gamepadInput) {
        state.source = "gamepad";
        return gamepadInput;
      }

      if (touchInput.active) {
        state.source = "touch";
        return {
          throttle: clamp(touchInput.throttle, 0, 1),
          brake: clamp(touchInput.brake, 0, 1),
          steer: clamp(touchInput.steer, -1, 1),
          handbrake: touchInput.handbrake,
        };
      }

      const keyboardInput = pollKeyboard();
      const hasKeyboard =
        keyboardInput.throttle > 0 ||
        keyboardInput.brake > 0 ||
        keyboardInput.steer !== 0 ||
        keyboardInput.handbrake;

      state.source = hasKeyboard ? "keyboard" : "none";
      return hasKeyboard ? keyboardInput : ZERO_INPUT;
    },
    getSource: () => state.source,
  };
}