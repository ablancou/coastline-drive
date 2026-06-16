import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  type Object3D,
} from "three";

/**
 * Procedural performance wheel — rubber tire + machined alloy rim with spokes,
 * a hub cap and a brake disc with caliper. Rolls about its local X axis.
 */
export function createWheelMesh(radius: number): Object3D {
  const wheel = new Group();
  const width = 0.3;

  const tireMat = new MeshStandardMaterial({
    color: 0x0c0c0e,
    metalness: 0.1,
    roughness: 0.85,
  });
  const rimMat = new MeshStandardMaterial({
    color: 0xc9ced6,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1.4,
  });
  const discMat = new MeshStandardMaterial({
    color: 0x60656c,
    metalness: 0.9,
    roughness: 0.4,
  });
  const caliperMat = new MeshStandardMaterial({
    color: 0xd11422,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x300306,
    emissiveIntensity: 0.4,
  });

  // Tire
  const tireGeo = new CylinderGeometry(radius, radius, width, 28);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);

  // Sidewall lip (subtle torus for a bit of profile)
  const lipGeo = new TorusGeometry(radius * 0.94, 0.05, 8, 28);
  const lipL = new Mesh(lipGeo, tireMat);
  lipL.rotation.y = Math.PI / 2;
  lipL.position.x = width * 0.5;
  wheel.add(lipL);
  const lipR = lipL.clone();
  lipR.position.x = -width * 0.5;
  wheel.add(lipR);

  // Rim barrel
  const rimGeo = new CylinderGeometry(radius * 0.62, radius * 0.62, width * 0.92, 24);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new Mesh(rimGeo, rimMat);
  rim.castShadow = true;
  wheel.add(rim);

  // Spokes (5-spoke star)
  const spokeGeo = new BoxGeometry(width * 0.4, radius * 1.1, 0.05);
  for (let i = 0; i < 5; i++) {
    const spoke = new Mesh(spokeGeo, rimMat);
    spoke.rotation.x = (i / 5) * Math.PI * 2;
    spoke.position.x = width * 0.18;
    wheel.add(spoke);
  }

  // Hub cap
  const hubGeo = new CylinderGeometry(radius * 0.18, radius * 0.18, width * 0.5, 16);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new Mesh(hubGeo, rimMat);
  hub.position.x = width * 0.35;
  wheel.add(hub);

  // Brake disc + caliper (inboard)
  const discGeo = new CylinderGeometry(radius * 0.7, radius * 0.7, 0.04, 24);
  discGeo.rotateZ(Math.PI / 2);
  const disc = new Mesh(discGeo, discMat);
  disc.position.x = -width * 0.2;
  wheel.add(disc);

  const caliper = new Mesh(new BoxGeometry(0.06, radius * 0.5, 0.12), caliperMat);
  caliper.position.set(-width * 0.2, radius * 0.55, 0);
  wheel.add(caliper);

  return wheel;
}
