import type { WheelMount } from "@/types/vehicle";

/** Single source of truth for vehicle tuning — portable to Phase 2. */
export const VEHICLE_CONFIG = {
  mass: 1280,
  chassisHalfExtents: [0.92, 0.38, 2.05] as const,
  engineForce: 6200,
  brakeForce: 9000,
  handbrakeMultiplier: 1.8,
  maxSteerAngle: 0.42,
  steerSpeed: 5.5,
  drag: 0.35,
  rollingResistance: 120,
  maxSpeedMs: 78,
  /** Nitro boost. */
  nitro: {
    speedCapMult: 1.45,
    boostAccel: 8,
    drain: 0.5,
    recharge: 0.16,
  },
  /** Arcade-sim kinematic integrator tuning (Phase 1). */
  reverseMaxSpeedMs: 10,
  /** Peak yaw rate (rad/s) at full lock × full readiness. */
  turnRate: 1.7,
  /** Speed (m/s) at which steering authority reaches 100 %. */
  turnReadinessSpeed: 5,
  /** Keep the car on the asphalt: max lateral offset from spline centerline. */
  maxLateralOffset: 4.8,
  /** Handling "soul": grip/drift + visual weight transfer (render only). */
  handling: {
    /** How fast travel direction realigns to heading (1/s). High = grippy. */
    gripBase: 8,
    /** Reduced grip with handbrake → the car breaks loose and slides. */
    gripHandbrake: 1.6,
    /** Grip lost per unit cornering load (|steer| × speed). */
    gripLossPerLoad: 0.013,
    /** Floor on the grip factor so the car never fully loses traction. */
    minGripFactor: 0.22,
    /** Speed scrubbed off while sliding sideways. */
    slipScrub: 0.9,
    /** Max visual body roll in corners (rad). */
    maxBodyRoll: 0.11,
    /** Max visual pitch under accel/brake (rad). */
    maxBodyPitch: 0.075,
    /** Body-tilt smoothing (1/s). */
    tiltSmoothing: 6,
    /** Roll per unit lateral accel. */
    rollPerLat: 0.012,
    /** Pitch per unit longitudinal accel. */
    pitchPerAccel: 0.013,
  },
  idleRpm: 800,
  maxRpm: 7200,
  centerOfMassOffset: [0, -0.22, 0.08] as const,
  suspension: {
    restLength: 0.34,
    springStiffness: 32000,
    damperStiffness: 3800,
    maxTravel: 0.22,
    /** Ray origin lifted along chassis-up to clear the hull collider. */
    rayStartOffset: 0.06,
    /** Total ray cast length from offset origin (must reach ground from ride height). */
    maxRayDistance: 2.8,
  },
  wheels: [
    {
      id: "fl",
      position: [-0.88, -0.12, 1.42],
      radius: 0.36,
      isDrive: false,
      isSteer: true,
    },
    {
      id: "fr",
      position: [0.88, -0.12, 1.42],
      radius: 0.36,
      isDrive: false,
      isSteer: true,
    },
    {
      id: "rl",
      position: [-0.88, -0.12, -1.38],
      radius: 0.36,
      isDrive: true,
      isSteer: false,
    },
    {
      id: "rr",
      position: [0.88, -0.12, -1.38],
      radius: 0.36,
      isDrive: true,
      isSteer: false,
    },
  ] satisfies WheelMount[],
} as const;