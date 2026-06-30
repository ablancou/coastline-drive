import { MeshStandardMaterial } from "three";

/**
 * Animated ocean — a standard PBR water material whose surface is displaced by
 * summed sine waves in the vertex shader, with analytic normals so the HDRI
 * reflections shimmer and roll. Drive the motion by incrementing
 * `material.userData.uTime.value` each frame (see the Ocean component).
 */
export function createOceanMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: 0x1f6f9e,
    metalness: 0.25,
    roughness: 0.07,
    transparent: true,
    opacity: 0.92,
    envMapIntensity: 1.6,
  });

  mat.userData.uTime = { value: 0 };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `
      float _x = position.x;
      float _y = position.y;
      float dwdx = cos(_x * 0.18 + uTime * 1.1) * 0.12 * 0.18
                 + cos((_x + _y) * 0.07 + uTime * 0.6) * 0.08 * 0.07;
      float dwdy = cos(_y * 0.13 - uTime * 0.9) * 0.10 * 0.13
                 + cos((_x + _y) * 0.07 + uTime * 0.6) * 0.08 * 0.07;
      vec3 objectNormal = normalize(vec3(-dwdx, -dwdy, 1.0));
      #ifdef USE_TANGENT
        vec3 objectTangent = vec3( tangent.xyz );
      #endif
      `,
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
      float w = sin(position.x * 0.18 + uTime * 1.1) * 0.12
              + sin(position.y * 0.13 - uTime * 0.9) * 0.10
              + sin((position.x + position.y) * 0.07 + uTime * 0.6) * 0.08;
      vec3 transformed = vec3( position.x, position.y, position.z + w );
      `,
    );
  };

  return mat;
}
