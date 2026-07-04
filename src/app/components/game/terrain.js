// Terrain system: deterministic multi-octave value noise, a river carved
// along a spline, and the shared height functions used by both the terrain
// mesh and gameplay (character placement, camera collision).

import * as THREE from "three";

// Deterministic pseudo-random generator so the world is identical each visit.
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// --------------------------------------------------------------- value noise
function hash2(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x, z, octaves = 4) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    total += (valueNoise(x * frequency, z * frequency) * 2 - 1) * amplitude;
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return total; // roughly [-1, 1]
}

// ------------------------------------------------------------------- river
// Polyline from the waterfall plunge pool (by the mountain) down through the
// west side of the realm. [x, z] pairs, ordered downstream.
export const RIVER_PATH = [
  [-28, -96],
  [-27, -72],
  [-30, -48],
  [-33, -28],
  [-28, -6],
  [-32, 22],
  [-40, 58],
  [-46, 110],
];

export const PLUNGE_POOL = { x: -28, z: -101, r: 7.5 };

export const RIVER_CARVE_HALF_WIDTH = 4.6; // where the banks start
export const RIVER_WATER_HALF_WIDTH = 3.1; // water surface half width
export const RIVER_WATER_DROP = 0.9; // water surface below bank base height

function smooth01(t) {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
}

// Distance from (x, z) to the river polyline plus the closest point on it.
export function riverInfo(x, z) {
  let best = Infinity;
  let bx = 0;
  let bz = 0;
  for (let i = 0; i < RIVER_PATH.length - 1; i++) {
    const [ax, az] = RIVER_PATH[i];
    const [cx, cz] = RIVER_PATH[i + 1];
    const dx = cx - ax;
    const dz = cz - az;
    const lenSq = dx * dx + dz * dz;
    let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
    t = Math.min(Math.max(t, 0), 1);
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < best) {
      best = d;
      bx = px;
      bz = pz;
    }
  }
  return { dist: Math.sqrt(best), x: bx, z: bz };
}

// Rolling terrain before the river is carved into it.
export function baseHeight(x, z) {
  return (
    fbm(x * 0.016 + 3.7, z * 0.016 - 1.2, 4) * 3.4 +
    fbm(x * 0.055 - 8.1, z * 0.055 + 5.9, 3) * 0.85
  );
}

function carveDepth(x, z) {
  const river = riverInfo(x, z);
  let depth = 2.3 * smooth01(1 - river.dist / RIVER_CARVE_HALF_WIDTH);
  const poolDist = Math.hypot(x - PLUNGE_POOL.x, z - PLUNGE_POOL.z);
  const pool = 2.6 * smooth01(1 - poolDist / PLUNGE_POOL.r);
  if (pool > depth) depth = pool;
  return depth;
}

export function terrainHeight(x, z) {
  return baseHeight(x, z) - carveDepth(x, z);
}

// Water surface height near (x, z) — follows the banks downstream.
export function waterLevelAt(x, z) {
  const river = riverInfo(x, z);
  return baseHeight(river.x, river.z) - RIVER_WATER_DROP;
}

export function distanceToWater(x, z) {
  const river = riverInfo(x, z);
  const poolDist =
    Math.hypot(x - PLUNGE_POOL.x, z - PLUNGE_POOL.z) - PLUNGE_POOL.r;
  return Math.min(river.dist, poolDist);
}

// -------------------------------------------------------------- terrain mesh
const GRASS_A = new THREE.Color(0x67a04b);
const GRASS_B = new THREE.Color(0x4a7f38);
const GRASS_C = new THREE.Color(0x7fae57);
const DIRT = new THREE.Color(0x8d6f4a);
const SAND = new THREE.Color(0xb5a06d);
const RIVERBED = new THREE.Color(0x6d5c40);

function makeGroundDetailTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const rng = createRng(1337);
  for (let i = 0; i < size * size; i++) {
    const v = 225 + rng() * 30; // subtle bright noise, multiplied over color
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(60, 60);
  return texture;
}

export function buildTerrainMesh() {
  const size = 360;
  const segments = 220;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);

    // Color blend: grass variation, dirt patches, sandy riverbanks, wet bed.
    const patch = fbm(x * 0.045 + 40, z * 0.045 - 17, 3);
    color.copy(GRASS_A);
    if (patch > 0.18) color.lerp(GRASS_C, smooth01((patch - 0.18) / 0.3));
    else if (patch < -0.15) color.lerp(GRASS_B, smooth01((-patch - 0.15) / 0.3));
    const dirtNoise = fbm(x * 0.03 - 60, z * 0.03 + 33, 3);
    if (dirtNoise > 0.34) color.lerp(DIRT, smooth01((dirtNoise - 0.34) / 0.22) * 0.65);

    const water = distanceToWater(x, z);
    if (water < 4.5) {
      color.lerp(SAND, smooth01(1 - water / 4.5) * 0.9);
    }
    if (water < 0.6) {
      color.lerp(RIVERBED, 0.8);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const detail = makeGroundDetailTexture();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: detail,
    bumpMap: detail,
    bumpScale: 0.35,
    roughness: 0.95,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}
