import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
} from "three";

/** Animatable parts exposed via `group.userData` for the ride-along wiggle. */
export interface DogRefs {
  head: Object3D;
  earL: Object3D;
  earR: Object3D;
  tail: Object3D;
}

const unit = new SphereGeometry(1, 16, 12);

/**
 * A small stylized companion dog in a sitting pose, facing +Z (car forward).
 * ~1 unit tall before scaling. Head, ears and tail are separate pivots so the
 * controller can wag/flap them — happy passenger energy.
 */
export function createDog(colorHex: string): Group {
  const g = new Group();

  const fur = new MeshStandardMaterial({ color: colorHex, roughness: 0.85, metalness: 0 });
  const dark = new MeshStandardMaterial({ color: 0x241d18, roughness: 0.7 });

  const add = (
    parent: Object3D,
    mat: MeshStandardMaterial,
    pos: [number, number, number],
    scale: [number, number, number],
  ): Mesh => {
    const m = new Mesh(unit, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Body: chest up, haunches down (sitting).
  add(g, fur, [0, 0.3, -0.02], [0.2, 0.26, 0.24]); // chest/torso
  add(g, fur, [0, 0.2, -0.18], [0.23, 0.2, 0.22]); // haunches

  // Front legs (straight, sitting).
  const legGeo = new CylinderGeometry(0.045, 0.05, 0.28, 8);
  for (const s of [-1, 1]) {
    const leg = new Mesh(legGeo, fur);
    leg.position.set(s * 0.1, 0.14, 0.12);
    leg.castShadow = true;
    g.add(leg);
    add(g, fur, [s * 0.1, 0.02, 0.14], [0.06, 0.035, 0.09]); // paw
  }

  // Head group (pivot at the neck so it can tilt).
  const head = new Group();
  head.position.set(0, 0.56, 0.08);
  g.add(head);
  add(head, fur, [0, 0.04, 0], [0.15, 0.14, 0.14]); // skull
  add(head, fur, [0, -0.01, 0.13], [0.07, 0.06, 0.09]); // snout
  add(head, dark, [0, 0.0, 0.21], [0.025, 0.02, 0.02]); // nose
  add(head, dark, [-0.06, 0.08, 0.1], [0.02, 0.025, 0.02]); // eyes
  add(head, dark, [0.06, 0.08, 0.1], [0.02, 0.025, 0.02]);

  // Floppy ears (pivot at the top of the skull).
  const earL = new Group();
  earL.position.set(-0.11, 0.15, 0.01);
  earL.rotation.z = 0.5;
  add(earL, fur, [0, -0.07, 0], [0.045, 0.09, 0.03]);
  head.add(earL);

  const earR = new Group();
  earR.position.set(0.11, 0.15, 0.01);
  earR.rotation.z = -0.5;
  add(earR, fur, [0, -0.07, 0], [0.045, 0.09, 0.03]);
  head.add(earR);

  // Tail (pivot at the base — wags on Y).
  const tail = new Group();
  tail.position.set(0, 0.22, -0.36);
  tail.rotation.x = -0.7;
  add(tail, fur, [0, 0.1, 0], [0.035, 0.13, 0.035]);
  g.add(tail);

  const refs: DogRefs = { head, earL, earR, tail };
  g.userData.dogRefs = refs;
  return g;
}
