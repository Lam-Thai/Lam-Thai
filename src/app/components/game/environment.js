// Atmosphere, water, vegetation and ambient life for the game world.
// Everything is procedural: a golden-hour physical sky baked into IBL, an
// animated PBR river fed by a mountain waterfall, varied instanced flora
// and painted-wing butterflies + dusk fireflies.

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  createRng,
  terrainHeight,
  waterLevelAt,
  distanceToWater,
  distanceToTrail,
  RIVER_PATH,
  RIVER_WATER_HALF_WIDTH,
  PLUNGE_POOL,
} from "./terrain";

// ---------------------------------------------------------------------------
// Sunset sky + image-based lighting. Returns the sun direction so the shadow
// light can be aligned with the visible sun, plus dispose() for the env map.
// ---------------------------------------------------------------------------
export function setupSky(renderer, scene) {
  const sky = new Sky();
  sky.scale.setScalar(2000);

  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 10;
  uniforms.rayleigh.value = 3.1;
  uniforms.mieCoefficient.value = 0.008;
  uniforms.mieDirectionalG.value = 0.8;

  // Low western sun for golden hour.
  const elevation = THREE.MathUtils.degToRad(13);
  const azimuth = THREE.MathUtils.degToRad(235);
  const sunDir = new THREE.Vector3(
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth)
  );
  uniforms.sunPosition.value.copy(sunDir);

  // Bake the sky into a PMREM environment map for PBR reflections/ambient.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(sky);
  const envTarget = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();

  scene.add(sky); // visible backdrop
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.35;

  return {
    sunDir,
    dispose: () => envTarget.dispose(),
  };
}

// ---------------------------------------------------------------------------
// Water material: MeshStandardMaterial (so it picks up the sunset sky) with
// procedural wave normals injected via onBeforeCompile.
// ---------------------------------------------------------------------------
export function createWaterMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x2a6274,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 1.9,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTime;\nvarying vec3 vWaterPos;"
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed.y += sin(position.x * 0.7 + uTime * 1.5) * 0.045
                       + cos(position.z * 0.9 + uTime * 2.0) * 0.035;`
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vWaterPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTime;\nvarying vec3 vWaterPos;"
      )
      .replace(
        "#include <normal_fragment_begin>",
        `#include <normal_fragment_begin>
        {
          // Wave phases march along -z -> +z so the current visibly runs
          // downstream (the river flows south, toward positive z).
          float w1 = sin(vWaterPos.x * 1.7 + uTime * 1.3) * cos(vWaterPos.z * 1.5 - uTime * 2.4);
          float w2 = sin(vWaterPos.x * 3.9 - uTime * 2.2) * cos(vWaterPos.z * 3.3 - uTime * 3.1);
          float w3 = sin((vWaterPos.x + vWaterPos.z) * 6.5 - uTime * 2.8);
          normal = normalize(normal + vec3(
            w1 * 0.22 + w2 * 0.10 + w3 * 0.04,
            0.0,
            w1 * 0.16 - w2 * 0.12 + w3 * 0.05
          ));
        }`
      );
    material.userData.shader = shader;
  };
  return material;
}

// River ribbon following the spline, plus the plunge pool disc.
export function createRiverWater() {
  const group = new THREE.Group();
  const material = createWaterMaterial();

  const points = RIVER_PATH.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  const samples = 160;

  const positions = [];
  const uvs = [];
  const indices = [];
  const tangent = new THREE.Vector3();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPoint(t);
    curve.getTangent(t, tangent);
    const nx = -tangent.z;
    const nz = tangent.x;
    const y = waterLevelAt(p.x, p.z);
    positions.push(
      p.x + nx * RIVER_WATER_HALF_WIDTH, y, p.z + nz * RIVER_WATER_HALF_WIDTH,
      p.x - nx * RIVER_WATER_HALF_WIDTH, y, p.z - nz * RIVER_WATER_HALF_WIDTH
    );
    uvs.push(0, t * 40, 1, t * 40);
    if (i < samples) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const river = new THREE.Mesh(geometry, material);
  river.renderOrder = 1;
  group.add(river);

  const poolGeo = new THREE.CircleGeometry(PLUNGE_POOL.r + 1.5, 40);
  poolGeo.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(poolGeo, material);
  pool.position.set(
    PLUNGE_POOL.x,
    waterLevelAt(PLUNGE_POOL.x, PLUNGE_POOL.z) + 0.02,
    PLUNGE_POOL.z
  );
  pool.renderOrder = 1;
  group.add(pool);

  const update = (t) => {
    const shader = material.userData.shader;
    if (shader) shader.uniforms.uTime.value = t;
  };

  return { group, update };
}

// ---------------------------------------------------------------------------
// Waterfall: a shader ribbon down the mountain flank, mist and foam sprites.
// ---------------------------------------------------------------------------
function makeSoftSpriteTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWaterfall() {
  const group = new THREE.Group();

  const poolY = waterLevelAt(PLUNGE_POOL.x, PLUNGE_POOL.z);
  const toMountain = new THREE.Vector2(0 - PLUNGE_POOL.x, -122 - PLUNGE_POOL.z).normalize();
  const bottom = new THREE.Vector3(
    PLUNGE_POOL.x + toMountain.x * 4.5,
    poolY - 0.3,
    PLUNGE_POOL.z + toMountain.y * 4.5
  );
  const top = new THREE.Vector3(
    bottom.x + toMountain.x * 8.5,
    poolY + 15,
    bottom.z + toMountain.y * 8.5
  );

  const fallMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float flow = vUv.y * 14.0 + uTime * 3.2;
        float streaks = 0.5 + 0.5 * sin(flow + sin(vUv.x * 22.0 + vUv.y * 6.0) * 1.8);
        float ripple = 0.6 + 0.4 * sin(vUv.x * 34.0 + sin(vUv.y * 20.0 - uTime * 5.0) * 2.0);
        float edge = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
        float head = smoothstep(1.0, 0.92, vUv.y);
        float footFoam = smoothstep(0.22, 0.0, vUv.y) * 0.8;
        float alpha = clamp(streaks * ripple * 0.75 + footFoam, 0.0, 1.0) * edge * head;
        // warm dusk tint on the spray
        vec3 color = mix(vec3(0.6, 0.66, 0.72), vec3(1.0, 0.93, 0.85), streaks * 0.6 + footFoam);
        gl_FragColor = vec4(color, alpha * 0.85);
      }
    `,
  });

  const widthDir = new THREE.Vector3(-toMountain.y, 0, toMountain.x);
  const rows = 10;
  const halfWidth = 2.6;
  const positions = [];
  const uvs = [];
  const indices = [];
  const point = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    point.lerpVectors(bottom, top, t);
    const bulge = Math.sin(t * Math.PI) * 1.1;
    point.x -= toMountain.x * bulge;
    point.z -= toMountain.y * bulge;
    positions.push(
      point.x + widthDir.x * halfWidth, point.y, point.z + widthDir.z * halfWidth,
      point.x - widthDir.x * halfWidth, point.y, point.z - widthDir.z * halfWidth
    );
    uvs.push(0, t, 1, t);
    if (i < rows) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const fallGeo = new THREE.BufferGeometry();
  fallGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  fallGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  fallGeo.setIndex(indices);
  const fall = new THREE.Mesh(fallGeo, fallMaterial);
  fall.renderOrder = 2;
  group.add(fall);

  // Wet rocks framing the fall.
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x55575e,
    roughness: 0.5,
    flatShading: true,
  });
  const rng = createRng(4242);
  for (let i = 0; i < 7; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const t = 0.05 + (i / 7) * 0.75;
    point.lerpVectors(bottom, top, t);
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1 + rng() * 1.3, 0),
      rockMat
    );
    rock.position.set(
      point.x + widthDir.x * (halfWidth + 0.8) * side,
      point.y - 0.4,
      point.z + widthDir.z * (halfWidth + 0.8) * side
    );
    rock.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    rock.castShadow = true;
    group.add(rock);
  }

  // Mist at the plunge point.
  const mistCount = 26;
  const mistGeo = new THREE.BufferGeometry();
  const mistPos = new Float32Array(mistCount * 3);
  const mistSeed = new Float32Array(mistCount);
  for (let i = 0; i < mistCount; i++) {
    mistSeed[i] = rng();
    mistPos[i * 3] = bottom.x + (rng() - 0.5) * 6;
    mistPos[i * 3 + 1] = poolY + rng() * 2;
    mistPos[i * 3 + 2] = bottom.z + (rng() - 0.5) * 6;
  }
  mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
  const mistMaterial = new THREE.PointsMaterial({
    map: makeSoftSpriteTexture(),
    size: 4.2,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const mist = new THREE.Points(mistGeo, mistMaterial);
  mist.renderOrder = 3;
  group.add(mist);

  const update = (t, delta) => {
    fallMaterial.uniforms.uTime.value = t;
    const attr = mist.geometry.attributes.position;
    for (let i = 0; i < mistCount; i++) {
      let y = attr.getY(i) + delta * (0.8 + mistSeed[i] * 1.2);
      if (y > poolY + 3.5) y = poolY + 0.2;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  };

  return { group, update };
}

// ---------------------------------------------------------------------------
// Vegetation: varied instanced trees (pine, oak, birch, dead), grass,
// flowers, bushes, mushrooms and riverside reeds.
// ---------------------------------------------------------------------------
function makeGrassTexture(withFlowers) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rng = createRng(withFlowers ? 77 : 55);
  for (let i = 0; i < 10; i++) {
    const baseX = 12 + rng() * 104;
    const lean = (rng() - 0.5) * 40;
    const height = 60 + rng() * 60;
    // muted olive blades for golden hour
    ctx.strokeStyle = `rgb(${58 + rng() * 34}, ${96 + rng() * 42}, ${38 + rng() * 22})`;
    ctx.lineWidth = 3.5 + rng() * 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, 128);
    ctx.quadraticCurveTo(baseX + lean * 0.4, 128 - height * 0.6, baseX + lean, 128 - height);
    ctx.stroke();
  }
  if (withFlowers) {
    const petals = ["#d9678a", "#e8dfc4", "#d9a23c", "#a06cc4"];
    for (let i = 0; i < 5; i++) {
      const x = 16 + rng() * 96;
      const y = 20 + rng() * 46;
      ctx.fillStyle = petals[Math.floor(rng() * petals.length)];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#e0b83c";
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Birch bark: pale trunk with dark horizontal lenticels.
function makeBirchTexture() {
  const rng = createRng(88);
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ded8cc";
  ctx.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = `rgba(40,36,32,${0.5 + rng() * 0.4})`;
    ctx.fillRect(rng() * 64, rng() * 128, 6 + rng() * 16, 2 + rng() * 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function addWindSway(material, strength = 0.1) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          {
            float wx = instanceMatrix[3][0];
            float wz = instanceMatrix[3][2];
            float sway = sin(uTime * 1.9 + wx * 0.35 + wz * 0.27);
            transformed.x += sway * ${strength.toFixed(3)} * max(position.y, 0.0);
            transformed.z += sway * ${(strength * 0.6).toFixed(3)} * max(position.y, 0.0);
          }
        #endif`
      );
    material.userData.shader = shader;
  };
}

function crossedQuadGeometry(width, height) {
  const a = new THREE.PlaneGeometry(width, height);
  a.translate(0, height / 2, 0);
  const b = a.clone();
  b.rotateY(Math.PI / 2);
  return mergeGeometries([a, b]);
}

// Scatters everything. `isClear(x, z)` guards milestones/landmarks/houses;
// water and trail proximity are handled internally. `addObstacle(x, z, r)`
// registers solid trunks with the collision system so the player can't
// walk through trees (grass, flowers and other soft flora stay passable).
export function createVegetation(isClear, worldRadius, addObstacle) {
  const group = new THREE.Group();
  const rng = createRng(90210);
  const timeMaterials = [];
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  const scatter = (count, minWater, maxTries, place, minTrail = 2.4) => {
    let placed = 0;
    for (let i = 0; i < maxTries && placed < count; i++) {
      const x = (rng() - 0.5) * 2 * worldRadius;
      const z = (rng() - 0.5) * 2 * worldRadius;
      if (!isClear(x, z)) continue;
      if (distanceToWater(x, z) < minWater) continue;
      if (distanceToTrail(x, z) < minTrail) continue;
      place(x, z, placed);
      placed++;
    }
    return placed;
  };

  // Trees get a random lean so the forest doesn't look stamped.
  const setInstance = (meshes, index, x, z, scale, rotY, lean = 0) => {
    dummy.position.set(x, terrainHeight(x, z) - 0.06, z);
    dummy.scale.setScalar(scale);
    dummy.rotation.set(lean, rotY, lean * 0.6);
    dummy.updateMatrix();
    for (const m of meshes) m.setMatrixAt(index, dummy.matrix);
  };

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x594031, roughness: 0.95 });

  // ------ pines
  const PINES = 70;
  const pineTrunkGeo = new THREE.CylinderGeometry(0.16, 0.3, 2.4, 7);
  pineTrunkGeo.translate(0, 1.2, 0);
  const cone1 = new THREE.ConeGeometry(1.7, 2.4, 9);
  cone1.translate(0, 3.1, 0);
  const cone2 = new THREE.ConeGeometry(1.3, 2.1, 9);
  cone2.translate(0, 4.4, 0);
  const cone3 = new THREE.ConeGeometry(0.85, 1.8, 9);
  cone3.translate(0, 5.6, 0);
  const pineCanopyGeo = mergeGeometries([cone1, cone2, cone3]);
  const pineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, trunkMat, PINES);
  const pineCanopies = new THREE.InstancedMesh(pineCanopyGeo, pineMat, PINES);
  pineTrunks.castShadow = true;
  pineCanopies.castShadow = true;
  pineCanopies.receiveShadow = true;

  const pinesPlaced = scatter(PINES, 5.5, PINES * 30, (x, z, i) => {
    const scale = 0.7 + rng() * 1.1;
    setInstance(
      [pineTrunks, pineCanopies], i, x, z,
      scale, rng() * Math.PI * 2, (rng() - 0.5) * 0.1
    );
    addObstacle?.(x, z, 0.38 * scale);
    // dusky green with occasional blue-fir tone
    tint.setHSL(0.3 + rng() * 0.13, 0.32 + rng() * 0.2, 0.24 + rng() * 0.12);
    pineCanopies.setColorAt(i, tint);
  });
  pineTrunks.count = pinesPlaced;
  pineCanopies.count = pinesPlaced;
  group.add(pineTrunks, pineCanopies);

  // ------ oaks (some turned autumn-gold for the sunset palette)
  const OAKS = 40;
  const oakTrunkGeo = new THREE.CylinderGeometry(0.22, 0.4, 2.1, 7);
  oakTrunkGeo.translate(0, 1.05, 0);
  const blob1 = new THREE.IcosahedronGeometry(1.6, 1);
  blob1.translate(0, 3.2, 0);
  const blob2 = new THREE.IcosahedronGeometry(1.15, 1);
  blob2.translate(1.05, 2.7, 0.35);
  const blob3 = new THREE.IcosahedronGeometry(1.05, 1);
  blob3.translate(-0.95, 2.85, -0.3);
  const oakCanopyGeo = mergeGeometries([blob1, blob2, blob3]);
  const oakMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const oakTrunks = new THREE.InstancedMesh(oakTrunkGeo, trunkMat, OAKS);
  const oakCanopies = new THREE.InstancedMesh(oakCanopyGeo, oakMat, OAKS);
  oakTrunks.castShadow = true;
  oakCanopies.castShadow = true;
  oakCanopies.receiveShadow = true;

  const oaksPlaced = scatter(OAKS, 5.5, OAKS * 30, (x, z, i) => {
    const scale = 0.7 + rng() * 0.9;
    setInstance(
      [oakTrunks, oakCanopies], i, x, z,
      scale, rng() * Math.PI * 2, (rng() - 0.5) * 0.12
    );
    addObstacle?.(x, z, 0.48 * scale);
    if (rng() > 0.6) {
      // autumn: amber → rust
      tint.setHSL(0.06 + rng() * 0.06, 0.6 + rng() * 0.2, 0.34 + rng() * 0.1);
    } else {
      tint.setHSL(0.24 + rng() * 0.09, 0.4 + rng() * 0.15, 0.28 + rng() * 0.1);
    }
    oakCanopies.setColorAt(i, tint);
  });
  oakTrunks.count = oaksPlaced;
  oakCanopies.count = oaksPlaced;
  group.add(oakTrunks, oakCanopies);

  // ------ birches: pale bark, small airy canopy
  const BIRCHES = 22;
  const birchTrunkGeo = new THREE.CylinderGeometry(0.09, 0.15, 3.4, 7);
  birchTrunkGeo.translate(0, 1.7, 0);
  const birchBlob1 = new THREE.IcosahedronGeometry(1.0, 1);
  birchBlob1.translate(0, 3.7, 0);
  const birchBlob2 = new THREE.IcosahedronGeometry(0.7, 1);
  birchBlob2.translate(0.55, 3.1, 0.2);
  const birchCanopyGeo = mergeGeometries([birchBlob1, birchBlob2]);
  const birchTrunkMat = new THREE.MeshStandardMaterial({
    map: makeBirchTexture(),
    roughness: 0.85,
  });
  const birchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const birchTrunks = new THREE.InstancedMesh(birchTrunkGeo, birchTrunkMat, BIRCHES);
  const birchCanopies = new THREE.InstancedMesh(birchCanopyGeo, birchMat, BIRCHES);
  birchTrunks.castShadow = true;
  birchCanopies.castShadow = true;

  const birchesPlaced = scatter(BIRCHES, 5, BIRCHES * 30, (x, z, i) => {
    const scale = 0.8 + rng() * 0.6;
    setInstance(
      [birchTrunks, birchCanopies], i, x, z,
      scale, rng() * Math.PI * 2, (rng() - 0.5) * 0.14
    );
    addObstacle?.(x, z, 0.24 * scale);
    // golden birch foliage
    tint.setHSL(0.11 + rng() * 0.05, 0.55 + rng() * 0.2, 0.42 + rng() * 0.12);
    birchCanopies.setColorAt(i, tint);
  });
  birchTrunks.count = birchesPlaced;
  birchCanopies.count = birchesPlaced;
  group.add(birchTrunks, birchCanopies);

  // ------ dead trees: bare silhouettes for mood
  const DEADS = 10;
  const deadTrunk = new THREE.CylinderGeometry(0.12, 0.24, 3.2, 6);
  deadTrunk.translate(0, 1.6, 0);
  const branchGeo = new THREE.CylinderGeometry(0.05, 0.09, 1.5, 5);
  const branch1 = branchGeo.clone();
  branch1.translate(0, 0.75, 0);
  branch1.rotateZ(0.8);
  branch1.translate(0.1, 2.2, 0);
  const branch2 = branchGeo.clone();
  branch2.scale(0.8, 0.8, 0.8);
  branch2.translate(0, 0.6, 0);
  branch2.rotateZ(-0.9);
  branch2.rotateY(0.7);
  branch2.translate(-0.05, 2.7, 0.05);
  const deadGeo = mergeGeometries([deadTrunk, branch1, branch2]);
  const deadMat = new THREE.MeshStandardMaterial({ color: 0x4d4238, roughness: 1 });
  const deads = new THREE.InstancedMesh(deadGeo, deadMat, DEADS);
  deads.castShadow = true;
  deads.count = scatter(DEADS, 4, DEADS * 30, (x, z, i) => {
    const scale = 0.8 + rng() * 0.8;
    setInstance([deads], i, x, z, scale, rng() * Math.PI * 2, (rng() - 0.5) * 0.2);
    addObstacle?.(x, z, 0.3 * scale);
  });
  group.add(deads);

  // ------ bushes
  const BUSHES = 40;
  const bushGeo = new THREE.IcosahedronGeometry(0.7, 1);
  bushGeo.translate(0, 0.45, 0);
  bushGeo.scale(1, 0.75, 1);
  const bushMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, BUSHES);
  bushes.castShadow = true;
  bushes.count = scatter(BUSHES, 3.5, BUSHES * 12, (x, z, i) => {
    setInstance([bushes], i, x, z, 0.7 + rng() * 1.0, rng() * Math.PI * 2);
    tint.setHSL(0.22 + rng() * 0.12, 0.35 + rng() * 0.2, 0.26 + rng() * 0.1);
    bushes.setColorAt(i, tint);
  });
  group.add(bushes);

  // ------ mushrooms clustered in the shade
  const SHROOMS = 30;
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6);
  stemGeo.translate(0, 0.11, 0);
  const capGeo = new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.translate(0, 0.2, 0);
  const shroomGeo = mergeGeometries([stemGeo, capGeo]);
  const shroomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const shrooms = new THREE.InstancedMesh(shroomGeo, shroomMat, SHROOMS);
  shrooms.count = scatter(SHROOMS, 3.5, SHROOMS * 12, (x, z, i) => {
    setInstance([shrooms], i, x, z, 0.8 + rng() * 1.2, rng() * Math.PI * 2);
    tint.setHSL(rng() > 0.5 ? 0.02 : 0.08, 0.55 + rng() * 0.25, 0.4 + rng() * 0.15);
    shrooms.setColorAt(i, tint);
  });
  group.add(shrooms);

  // ------ grass tufts + flowers (crossed alpha-tested quads, wind swayed)
  const grassGeo = crossedQuadGeometry(1.1, 0.85);
  const grassMat = new THREE.MeshStandardMaterial({
    map: makeGrassTexture(false),
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  addWindSway(grassMat, 0.11);
  timeMaterials.push(grassMat);
  const GRASS = 900;
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, GRASS);
  grass.count = scatter(GRASS, 3.4, GRASS * 8, (x, z, i) => {
    setInstance([grass], i, x, z, 0.7 + rng() * 0.9, rng() * Math.PI);
  }, 1.6);
  group.add(grass);

  const flowerGeo = crossedQuadGeometry(1.0, 0.8);
  const flowerMat = new THREE.MeshStandardMaterial({
    map: makeGrassTexture(true),
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  addWindSway(flowerMat, 0.09);
  timeMaterials.push(flowerMat);
  const FLOWERS = 160;
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWERS);
  flowers.count = scatter(FLOWERS, 3.4, FLOWERS * 10, (x, z, i) => {
    setInstance([flowers], i, x, z, 0.65 + rng() * 0.6, rng() * Math.PI);
  });
  group.add(flowers);

  // ------ reeds hugging the riverbank
  const reedGeo = new THREE.ConeGeometry(0.055, 1.9, 5);
  reedGeo.translate(0, 0.95, 0);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x5c7040, roughness: 0.95 });
  addWindSway(reedMat, 0.16);
  timeMaterials.push(reedMat);
  const REEDS = 140;
  const reeds = new THREE.InstancedMesh(reedGeo, reedMat, REEDS);
  let reedIndex = 0;
  let reedTries = 0;
  const reedRng = createRng(3131);
  while (reedIndex < REEDS && reedTries++ < REEDS * 20) {
    const seg = Math.floor(reedRng() * (RIVER_PATH.length - 1));
    const t = reedRng();
    const [ax, az] = RIVER_PATH[seg];
    const [bx, bz] = RIVER_PATH[seg + 1];
    const cx = ax + (bx - ax) * t;
    const cz = az + (bz - az) * t;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const side = reedRng() > 0.5 ? 1 : -1;
    const offset = 3.6 + reedRng() * 1.4;
    const x = cx + (-dz / len) * offset * side + (reedRng() - 0.5);
    const z = cz + (dx / len) * offset * side + (reedRng() - 0.5);
    if (!isClear(x, z)) continue;
    setInstance([reeds], reedIndex, x, z, 0.8 + reedRng() * 0.8, reedRng() * Math.PI);
    reedIndex++;
  }
  reeds.count = reedIndex;
  group.add(reeds);

  const update = (t) => {
    for (const material of timeMaterials) {
      const shader = material.userData.shader;
      if (shader) shader.uniforms.uTime.value = t;
    }
  };

  return { group, update };
}

// ---------------------------------------------------------------------------
// Butterflies: shaped, patterned wings with a body and antennae, wandering
// organically and flapping at rest-realistic rates.
// ---------------------------------------------------------------------------
function makeWingTexture(baseHue) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const rng = createRng(Math.floor(baseHue * 997) + 13);

  const base = new THREE.Color().setHSL(baseHue, 0.72, 0.52);
  const deep = new THREE.Color().setHSL(baseHue, 0.8, 0.3);
  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, `#${base.getHexString()}`);
  gradient.addColorStop(1, `#${deep.getHexString()}`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  // dark veins radiating from the wing root (bottom-left of the texture)
  ctx.strokeStyle = "rgba(25,15,10,0.55)";
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = 0.15 + (i / 6) * 1.25;
    ctx.beginPath();
    ctx.moveTo(4, 124);
    ctx.quadraticCurveTo(
      50 + Math.cos(a) * 20, 90 - Math.sin(a) * 30,
      10 + Math.cos(a) * 130, 124 - Math.sin(a) * 130
    );
    ctx.stroke();
  }
  // pale spots near the outer edge
  ctx.fillStyle = "rgba(255,245,225,0.85)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(78 + rng() * 40, 28 + rng() * 44, 3 + rng() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // dark scalloped border
  ctx.strokeStyle = "rgba(20,12,8,0.9)";
  ctx.lineWidth = 7;
  ctx.strokeRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function butterflyWingGeometry() {
  // Fore + hind wing lobes, root at the origin, spanning +x.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  shape.bezierCurveTo(0.12, 0.2, 0.34, 0.28, 0.42, 0.14);
  shape.bezierCurveTo(0.46, 0.04, 0.32, 0.0, 0.17, -0.01);
  shape.bezierCurveTo(0.32, -0.06, 0.36, -0.24, 0.2, -0.28);
  shape.bezierCurveTo(0.07, -0.3, 0.01, -0.12, 0, 0.02);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  // Remap UVs to the 0..1 texture space.
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      (uv.getX(i) - bb.min.x) / (bb.max.x - bb.min.x),
      (uv.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)
    );
  }
  return geometry;
}

export function createButterflies() {
  const group = new THREE.Group();
  const rng = createRng(60606);
  const wingGeo = butterflyWingGeometry();
  const hues = [0.07, 0.58, 0.12, 0.85, 0.02];
  const items = [];

  for (let i = 0; i < 7; i++) {
    const butterfly = new THREE.Group();
    const wingMat = new THREE.MeshStandardMaterial({
      map: makeWingTexture(hues[i % hues.length] + rng() * 0.03),
      side: THREE.DoubleSide,
      roughness: 0.8,
      transparent: true,
    });

    const rightPivot = new THREE.Group();
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightPivot.add(rightWing);
    const leftPivot = new THREE.Group();
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.scale.x = -1;
    leftPivot.add(leftWing);

    // Lay wings flat; they flap around the body axis (z).
    const wings = new THREE.Group();
    wings.rotation.x = -Math.PI / 2;
    wings.add(rightPivot, leftPivot);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e2018, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.16, 3, 8), bodyMat);
    body.rotation.x = Math.PI / 2;
    const headBead = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), bodyMat);
    headBead.position.set(0, 0, 0.1);
    const antennaGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4);
    for (const side of [-1, 1]) {
      const antenna = new THREE.Mesh(antennaGeo, bodyMat);
      antenna.position.set(side * 0.025, 0.04, 0.15);
      antenna.rotation.x = 0.9;
      antenna.rotation.z = -side * 0.35;
      butterfly.add(antenna);
    }

    butterfly.add(wings, body, headBead);

    const cx = (rng() - 0.5) * 90;
    const cz = (rng() - 0.5) * 90 - 10;
    items.push({
      node: butterfly,
      leftPivot,
      rightPivot,
      cx,
      cz,
      radius: 2 + rng() * 4,
      speed: 0.25 + rng() * 0.4,
      phase: rng() * Math.PI * 2,
      lastX: cx,
      lastZ: cz,
    });
    group.add(butterfly);
  }

  const update = (t) => {
    for (const b of items) {
      const a = t * b.speed + b.phase;
      const x = b.cx + Math.cos(a) * b.radius + Math.sin(a * 2.7) * 0.8;
      const z = b.cz + Math.sin(a * 1.3) * b.radius + Math.cos(a * 3.1) * 0.6;
      b.node.position.set(
        x,
        terrainHeight(x, z) + 1.25 + Math.sin(t * 2.2 + b.phase) * 0.35,
        z
      );
      // Face the direction of travel.
      const dx = x - b.lastX;
      const dz = z - b.lastZ;
      if (dx * dx + dz * dz > 1e-6) b.node.rotation.y = Math.atan2(dx, dz);
      b.lastX = x;
      b.lastZ = z;
      // Flap: quick strokes with a glide every few beats.
      const glide = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + b.phase));
      const flap = Math.sin(t * 15 + b.phase) * 1.0 * glide;
      b.leftPivot.rotation.y = flap;
      b.rightPivot.rotation.y = -flap;
    }
  };

  return { group, update };
}

// ---------------------------------------------------------------------------
// Fireflies drifting over the meadow at dusk.
// ---------------------------------------------------------------------------
export function createFireflies() {
  const rng = createRng(51515);
  const COUNT = 70;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const anchors = [];
  for (let i = 0; i < COUNT; i++) {
    const x = (rng() - 0.5) * 160;
    const z = (rng() - 0.5) * 160 - 10;
    const y = terrainHeight(x, z) + 0.6 + rng() * 1.8;
    anchors.push({ x, y, z, phase: rng() * Math.PI * 2, speed: 0.4 + rng() * 0.6 });
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: makeSoftSpriteTexture(),
    color: 0xffc26b,
    size: 0.55,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 3;

  const update = (t) => {
    const attr = points.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const a = anchors[i];
      attr.setXYZ(
        i,
        a.x + Math.sin(t * a.speed + a.phase) * 1.2,
        a.y + Math.sin(t * a.speed * 1.7 + a.phase * 2) * 0.5,
        a.z + Math.cos(t * a.speed * 0.8 + a.phase) * 1.2
      );
    }
    attr.needsUpdate = true;
    material.opacity = 0.6 + Math.sin(t * 2.3) * 0.25;
  };

  return { group: points, update };
}

// ---------------------------------------------------------------------------
// Birds circling overhead.
// ---------------------------------------------------------------------------
export function createBirds() {
  const group = new THREE.Group();
  const rng = createRng(80808);
  const material = new THREE.MeshStandardMaterial({ color: 0x2c2c34, roughness: 0.9 });
  const items = [];

  for (let i = 0; i < 4; i++) {
    const bird = new THREE.Group();
    const wingGeo = new THREE.PlaneGeometry(1.5, 0.42);
    wingGeo.translate(0.75, 0, 0);
    const left = new THREE.Mesh(wingGeo, material);
    left.rotation.y = Math.PI;
    const right = new THREE.Mesh(wingGeo.clone(), material);
    bird.add(left, right);
    items.push({
      node: bird,
      left,
      right,
      radius: 35 + rng() * 25,
      height: 26 + rng() * 10,
      speed: (0.1 + rng() * 0.08) * (rng() > 0.5 ? 1 : -1),
      phase: rng() * Math.PI * 2,
    });
    group.add(bird);
  }

  const update = (t) => {
    for (const bird of items) {
      const a = t * bird.speed + bird.phase;
      bird.node.position.set(
        Math.cos(a) * bird.radius,
        bird.height + Math.sin(t * 0.7 + bird.phase) * 2,
        Math.sin(a) * bird.radius - 30
      );
      bird.node.rotation.y = -a + (bird.speed > 0 ? 0 : Math.PI);
      const flap = Math.sin(t * 5 + bird.phase) * 0.5;
      bird.left.rotation.z = flap;
      bird.right.rotation.z = -flap;
    }
  };

  return { group, update };
}
