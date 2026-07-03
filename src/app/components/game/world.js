// Procedural builders for the medieval game world: characters, structures
// and props. Sculpted from lathe profiles, capsules and displaced spheres
// with canvas-painted color/bump maps — no external 3D assets.

import * as THREE from "three";
import { createRng, fbm } from "./terrain";

export const COLORS = {
  trunk: 0x5d3f28,
  stone: 0x8d8d94,
  wood: 0x9c7448,
  woodDark: 0x6b4a2c,
  cloth: 0xa8432e,
  steel: 0xaab2bc,
  steelDark: 0x707a85,
  gold: 0xc9982e,
  skin: 0xe0b189,
  monster: 0x679c3d,
  dragon: 0x8e2d22,
  dragonWing: 0xb35a35,
  sail: 0xe4d9bd,
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.0,
    ...options,
  });
}

function metalMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.85,
    envMapIntensity: 0.9,
    ...options,
  });
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Lathe a smooth profile: points as [radius, y] pairs, bottom to top.
function lathe(points, material, segments = 28) {
  const profile = points.map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(profile, segments);
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Displace a sphere along its normals with noise for an organic, lumpy look.
function organicSphere(radius, material, { bump = 0.1, seed = 0, detail = 2.4 } = {}) {
  const geometry = new THREE.SphereGeometry(radius, 28, 20);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n =
      fbm(v.x * detail + seed, v.y * detail - seed, 3) * 0.7 +
      fbm(v.y * detail + seed * 2, v.z * detail + seed, 3) * 0.3;
    v.multiplyScalar(1 + n * bump);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures: color maps and grayscale bump maps for surface detail.
// ---------------------------------------------------------------------------
function canvasTexture(size, draw, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext("2d"), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function drawNoise(ctx, size, rng, alpha) {
  for (let i = 0; i < size * 6; i++) {
    const shade = Math.floor(rng() * 255);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 1 + rng() * 2);
  }
}

// Grayscale bumps (three.js reads luminance).
function makeNoiseBump(repeat = 4) {
  const rng = createRng(101);
  return canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      drawNoise(ctx, s, rng, 0.5);
    },
    repeat,
    repeat
  );
}

function makeChainmailBump() {
  const rng = createRng(103);
  return canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#6a6a6a";
      ctx.fillRect(0, 0, s, s);
      const r = 7;
      for (let y = 0; y < s + r; y += r * 1.5) {
        for (let x = 0; x < s + r; x += r * 1.7) {
          const off = (Math.round(y / (r * 1.5)) % 2) * r * 0.85;
          ctx.strokeStyle = `rgba(${180 + rng() * 60},${190 + rng() * 50},${200},0.9)`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(x + off, y, r * 0.62, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    3,
    3
  );
}

function makeScalesBump() {
  const rng = createRng(107);
  return canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#707070";
      ctx.fillRect(0, 0, s, s);
      const r = 11;
      for (let y = 0; y < s + r; y += r * 0.8) {
        for (let x = 0; x < s + r; x += r * 1.35) {
          const off = (Math.round(y / (r * 0.8)) % 2) * r * 0.68;
          const shade = 150 + rng() * 80;
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          ctx.beginPath();
          ctx.arc(x + off, y, r * 0.62, 0, Math.PI, false);
          ctx.fill();
          ctx.strokeStyle = "rgba(40,40,40,0.6)";
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
    },
    4,
    3
  );
}

function makeClothBump() {
  const rng = createRng(109);
  return canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#7a7a7a";
      ctx.fillRect(0, 0, s, s);
      ctx.lineWidth = 1;
      for (let i = 0; i < s; i += 3) {
        ctx.strokeStyle = `rgba(${120 + rng() * 60},${120 + rng() * 60},${120 + rng() * 60},0.5)`;
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(s, i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, s);
        ctx.stroke();
      }
    },
    5,
    5
  );
}

function makeStrawBump() {
  const rng = createRng(113);
  return canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#787878";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 140; i++) {
        const shade = 90 + rng() * 130;
        ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.8)`;
        ctx.lineWidth = 1.6;
        const x = rng() * s;
        ctx.beginPath();
        ctx.moveTo(x, rng() * s * 0.3);
        ctx.lineTo(x + (rng() - 0.5) * 10, s);
        ctx.stroke();
      }
    },
    3,
    1
  );
}

// Painted face for villagers.
function makeFaceTexture() {
  return canvasTexture(256, (ctx, s) => {
    const rng = createRng(127);
    ctx.fillStyle = "#e0b189";
    ctx.fillRect(0, 0, s, s);
    drawNoise(ctx, s, rng, 0.03);

    const drawEye = (cx) => {
      ctx.fillStyle = "#f7f2ea";
      ctx.beginPath();
      ctx.ellipse(cx, 118, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3d22";
      ctx.beginPath();
      ctx.arc(cx, 118, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#241812";
      ctx.beginPath();
      ctx.arc(cx, 118, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(cx + 2, 115.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // brow
      ctx.strokeStyle = "#6b4a2c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, 122, 15, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    };
    drawEye(104);
    drawEye(152);

    // smile
    ctx.strokeStyle = "#8a4a34";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 152, 16, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // blush
    ctx.fillStyle = "rgba(214,120,90,0.25)";
    ctx.beginPath();
    ctx.ellipse(88, 140, 9, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(168, 140, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Half-timbered plaster wall.
function makePlasterTexture() {
  const rng = createRng(11);
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#ddd2ba";
    ctx.fillRect(0, 0, s, s);
    drawNoise(ctx, s, rng, 0.05);
    ctx.strokeStyle = "#5f452c";
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, s - 14, s - 14);
    ctx.beginPath();
    ctx.moveTo(s / 2, 0);
    ctx.lineTo(s / 2, s);
    ctx.moveTo(0, s * 0.55);
    ctx.lineTo(s, s * 0.55);
    ctx.moveTo(s * 0.08, s * 0.08);
    ctx.lineTo(s * 0.46, s * 0.5);
    ctx.moveTo(s * 0.92, s * 0.08);
    ctx.lineTo(s * 0.54, s * 0.5);
    ctx.stroke();
  });
}

// Weathered wooden planks.
function makePlankTexture(repeatX = 1, repeatY = 1) {
  const rng = createRng(23);
  return canvasTexture(
    256,
    (ctx, s) => {
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        const shade = 105 + rng() * 40;
        ctx.fillStyle = `rgb(${shade}, ${shade * 0.72}, ${shade * 0.48})`;
        ctx.fillRect(0, (s / rows) * r, s, s / rows);
        ctx.strokeStyle = "rgba(46, 30, 16, 0.85)";
        ctx.lineWidth = 3;
        ctx.strokeRect(-2, (s / rows) * r, s + 4, s / rows);
        ctx.strokeStyle = "rgba(60, 40, 22, 0.35)";
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 5; g++) {
          const y = (s / rows) * r + 6 + rng() * (s / rows - 12);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(s * 0.3, y + rng() * 6 - 3, s * 0.6, y + rng() * 6 - 3, s, y);
          ctx.stroke();
        }
      }
    },
    repeatX,
    repeatY
  );
}

// Terracotta roof tiles.
function makeRoofTexture(repeatX = 3, repeatY = 2) {
  const rng = createRng(37);
  return canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#8f4030";
      ctx.fillRect(0, 0, s, s);
      const rows = 6;
      const cols = 6;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offset = r % 2 === 0 ? 0 : s / cols / 2;
          const shade = 120 + rng() * 60;
          ctx.fillStyle = `rgb(${shade + 30}, ${shade * 0.45}, ${shade * 0.3})`;
          ctx.beginPath();
          ctx.arc(
            offset + (c * s) / cols + s / cols / 2,
            (r * s) / rows + s / rows,
            s / cols / 2 - 2,
            Math.PI,
            0
          );
          ctx.fill();
        }
      }
    },
    repeatX,
    repeatY
  );
}

// Rough stone blocks.
function makeStoneTexture(repeatX = 3, repeatY = 3) {
  const rng = createRng(53);
  return canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#8a8a90";
      ctx.fillRect(0, 0, s, s);
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        const cols = 4;
        for (let c = 0; c < cols; c++) {
          const offset = r % 2 === 0 ? 0 : s / cols / 2;
          const shade = 118 + rng() * 42;
          ctx.fillStyle = `rgb(${shade},${shade},${shade + 6})`;
          ctx.fillRect(
            ((offset + (c * s) / cols) % s) - 2,
            (r * s) / rows + 2,
            s / cols - 5,
            s / rows - 5
          );
        }
      }
      drawNoise(ctx, s, rng, 0.06);
    },
    repeatX,
    repeatY
  );
}

// Shared bump instances (textures are cheap but avoid rebuilding per NPC).
let sharedBumps = null;
function bumps() {
  if (!sharedBumps) {
    sharedBumps = {
      noise: makeNoiseBump(),
      chainmail: makeChainmailBump(),
      scales: makeScalesBump(),
      cloth: makeClothBump(),
      straw: makeStrawBump(),
      face: makeFaceTexture(),
    };
  }
  return sharedBumps;
}

// ---------------------------------------------------------------------------
// Text rendered over wood planks for signboards.
// ---------------------------------------------------------------------------
export function makeTextTexture(lines, options = {}) {
  const {
    width = 512,
    height = 256,
    background = null, // null = wood planks
    border = "#2c1e10",
    color = "#f5e6c8",
    accent = "#e8a13c",
    fontScale = 1,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const rng = createRng(97);

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  } else {
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const shade = 82 + rng() * 26;
      ctx.fillStyle = `rgb(${shade}, ${shade * 0.68}, ${shade * 0.42})`;
      ctx.fillRect(0, (height / rows) * r, width, height / rows);
      ctx.strokeStyle = "rgba(30, 19, 9, 0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(-2, (height / rows) * r, width + 4, height / rows);
      ctx.strokeStyle = "rgba(50, 33, 16, 0.4)";
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const y = (height / rows) * r + 6 + rng() * (height / rows - 12);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.3, y + rng() * 5 - 2, width * 0.7, y + rng() * 5 - 2, width, y);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = border;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, width - 12, height - 12);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  const rows = Array.isArray(lines) ? lines : [lines];
  const step = (height - 60) / (rows.length + 1);
  rows.forEach((row, index) => {
    const size = Math.round((row.big ? 52 : 30) * fontScale);
    ctx.font = `${row.big ? "bold " : ""}${size}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = row.big ? color : accent;
    ctx.fillText(row.text, width / 2, 30 + step * (index + 1));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ---------------------------------------------------------------------------
// Signboard placed in front of every milestone character.
// ---------------------------------------------------------------------------
export function createSignboard(title, subtitle) {
  const group = new THREE.Group();
  const postMat = mat(COLORS.woodDark, { roughness: 0.95, bumpMap: bumps().noise, bumpScale: 0.4 });

  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.1, 10);
  group.add(mesh(postGeo, postMat, -1.05, 1.05, 0));
  group.add(mesh(postGeo, postMat, 1.05, 1.05, 0));

  const texture = makeTextTexture([
    { text: title, big: true },
    { text: subtitle, big: false },
    { text: "— click to open —", big: false },
  ]);
  const panelMat = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.25,
    roughness: 0.8,
    metalness: 0,
  });
  const sideMat = mat(COLORS.wood);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.12), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    panelMat,
    panelMat,
  ]);
  panel.position.set(0, 1.75, 0);
  panel.castShadow = true;
  group.add(panel);

  return { group, panel };
}

// ---------------------------------------------------------------------------
// Characters — sculpted with lathe profiles, capsules and organic spheres.
// Each returns { group, update(t) }.
// ---------------------------------------------------------------------------

// Limb: capsule segments with a joint sphere, pivoting from the top.
function limb(material, upperR, lowerR, upperLen, lowerLen) {
  const pivot = new THREE.Group();
  const upper = mesh(
    new THREE.CapsuleGeometry(upperR, upperLen, 4, 12),
    material,
    0,
    -upperLen / 2,
    0
  );
  const joint = mesh(new THREE.SphereGeometry(upperR * 1.15, 12, 10), material, 0, -upperLen, 0);
  const lower = mesh(
    new THREE.CapsuleGeometry(lowerR, lowerLen, 4, 12),
    material,
    0,
    -upperLen - lowerLen / 2,
    0
  );
  pivot.add(upper, joint, lower);
  return pivot;
}

export function createKnight({ tunic = COLORS.cloth, isPlayer = false } = {}) {
  const group = new THREE.Group();
  const b = bumps();
  const steel = metalMat(COLORS.steel);
  const chain = metalMat(COLORS.steelDark, {
    roughness: 0.55,
    bumpMap: b.chainmail,
    bumpScale: 0.5,
  });
  const clothMat = mat(tunic, { roughness: 0.92, bumpMap: b.cloth, bumpScale: 0.25 });

  // Torso: waist → chest → shoulders profile, over a chainmail under-layer.
  const torso = lathe(
    [
      [0.3, 0],
      [0.42, 0.12],
      [0.47, 0.42],
      [0.44, 0.6],
      [0.3, 0.74],
      [0.17, 0.8],
    ],
    steel
  );
  torso.position.y = 0.98;
  // Breastplate centre ridge.
  const ridge = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.06), steel, 0, 1.36, 0.44);
  ridge.rotation.x = -0.12;

  // Chainmail skirt with cloth tabard over it.
  const skirt = lathe(
    [
      [0.44, 0],
      [0.36, 0.22],
    ],
    chain
  );
  skirt.position.y = 0.78;
  const tabard = mesh(new THREE.BoxGeometry(0.34, 0.62, 0.04), clothMat, 0, 0.82, 0.4);
  const belt = mesh(new THREE.TorusGeometry(0.37, 0.05, 8, 20), mat(0x4a3018), 0, 1.02, 0);
  belt.rotation.x = Math.PI / 2;

  // Head + helmet with visor slit.
  const head = mesh(new THREE.SphereGeometry(0.27, 20, 14), mat(COLORS.skin, { roughness: 0.7 }), 0, 1.98, 0.02);
  const helm = lathe(
    [
      [0.31, 0],
      [0.34, 0.08],
      [0.34, 0.26],
      [0.28, 0.4],
      [0.12, 0.5],
      [0.01, 0.52],
    ],
    steel
  );
  helm.position.y = 1.86;
  const visor = mesh(new THREE.BoxGeometry(0.4, 0.05, 0.12), mat(0x14161a, { roughness: 0.4 }), 0, 2.06, 0.28);
  const plume = mesh(new THREE.ConeGeometry(0.08, 0.5, 10), clothMat, 0, 2.55, -0.06);

  // Pauldrons.
  const pauldronGeo = new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const leftPauldron = mesh(pauldronGeo, steel, -0.48, 1.68, 0);
  const rightPauldron = mesh(pauldronGeo, steel, 0.48, 1.68, 0);

  // Cape.
  const capeGeo = new THREE.PlaneGeometry(0.85, 1.25, 6, 8);
  {
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, -Math.abs(x) * 0.35 - (0.625 - y) * 0.06);
    }
    capeGeo.computeVertexNormals();
  }
  const cape = new THREE.Mesh(capeGeo, mat(tunic, { roughness: 0.95, bumpMap: b.cloth, bumpScale: 0.3, side: THREE.DoubleSide }));
  cape.castShadow = true;
  const capePivot = new THREE.Group();
  capePivot.position.set(0, 1.72, -0.3);
  cape.position.y = -0.64;
  capePivot.add(cape);
  capePivot.rotation.x = 0.14;

  // Legs / arms.
  const leftLeg = limb(chain, 0.14, 0.12, 0.36, 0.34);
  leftLeg.position.set(-0.19, 0.78, 0);
  const rightLeg = limb(chain, 0.14, 0.12, 0.36, 0.34);
  rightLeg.position.set(0.19, 0.78, 0);
  const bootGeo = new THREE.SphereGeometry(0.14, 12, 8);
  for (const leg of [leftLeg, rightLeg]) {
    const boot = mesh(bootGeo, steel, 0, -0.72, 0.06);
    boot.scale.set(1, 0.7, 1.5);
    leg.add(boot);
  }

  const leftArm = limb(chain, 0.11, 0.09, 0.3, 0.3);
  leftArm.position.set(-0.52, 1.62, 0);
  const rightArm = limb(chain, 0.11, 0.09, 0.3, 0.3);
  rightArm.position.set(0.52, 1.62, 0);
  const gauntletGeo = new THREE.SphereGeometry(0.11, 12, 8);
  leftArm.add(mesh(gauntletGeo, steel, 0, -0.62, 0));
  rightArm.add(mesh(gauntletGeo, steel, 0, -0.62, 0));

  // Sword: tapered blade with fuller, guard, wrapped grip, pommel.
  const sword = new THREE.Group();
  sword.position.set(0, -0.62, 0.08);
  const bladeGeo = new THREE.BoxGeometry(0.075, 0.85, 0.02);
  {
    // taper toward the tip
    const pos = bladeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = 1 - Math.max(0, y / 0.425) * 0.55;
      pos.setX(i, pos.getX(i) * k);
    }
    bladeGeo.computeVertexNormals();
  }
  sword.add(mesh(bladeGeo, metalMat(0xd9dee4, { roughness: 0.18 }), 0, 0.52, 0.16));
  sword.add(mesh(new THREE.ConeGeometry(0.036, 0.12, 6), metalMat(0xd9dee4, { roughness: 0.18 }), 0, 1.0, 0.16));
  sword.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.06), metalMat(COLORS.gold, { roughness: 0.35 }), 0, 0.08, 0.16));
  const grip = mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.16, 8), mat(0x3d2817, { bumpMap: b.cloth, bumpScale: 0.3 }), 0, -0.03, 0.16);
  sword.add(grip);
  sword.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), metalMat(COLORS.gold), 0, -0.13, 0.16));
  sword.rotation.x = Math.PI / 2.4;
  rightArm.add(sword);

  // Heater shield with boss and studs.
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-0.3, 0.32);
  shieldShape.lineTo(0.3, 0.32);
  shieldShape.quadraticCurveTo(0.3, -0.05, 0, -0.42);
  shieldShape.quadraticCurveTo(-0.3, -0.05, -0.3, 0.32);
  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  const shield = new THREE.Mesh(shieldGeo, mat(tunic, { roughness: 0.7 }));
  shield.castShadow = true;
  shield.position.set(-0.14, -0.42, 0.06);
  shield.rotation.y = -Math.PI / 2;
  const shieldFace = new THREE.Group();
  shieldFace.add(shield);
  shieldFace.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), metalMat(COLORS.gold), -0.2, -0.44, 0.06));
  for (const [sy, sz] of [[-0.16, -0.16], [-0.16, 0.28], [-0.68, 0.06]]) {
    shieldFace.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), metalMat(COLORS.steel), -0.2, sy - 0.02, sz));
  }
  leftArm.add(shieldFace);

  group.add(
    torso, ridge, skirt, tabard, belt, head, helm, visor, plume,
    leftPauldron, rightPauldron, capePivot,
    leftLeg, rightLeg, leftArm, rightArm
  );

  const phase = Math.random() * Math.PI * 2;
  const parts = { leftLeg, rightLeg, leftArm, rightArm, body: group };

  const update = (t, walkSpeed = 0) => {
    if (isPlayer) {
      const swing = walkSpeed > 0.01 ? Math.sin(t * 9) * 0.55 * Math.min(walkSpeed, 1) : 0;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.7;
      rightArm.rotation.x = swing * 0.7;
      capePivot.rotation.x = 0.14 + walkSpeed * 0.35 + Math.sin(t * 3) * 0.04;
    } else {
      leftArm.rotation.x = Math.sin(t * 1.3 + phase) * 0.08;
      rightArm.rotation.x = -0.35 + Math.sin(t * 0.9 + phase) * 0.25;
      capePivot.rotation.x = 0.14 + Math.sin(t * 1.1 + phase) * 0.05;
    }
    plume.rotation.z = Math.sin(t * 2 + phase) * 0.15;
  };

  return { group, update, parts };
}

export function createVillager({ tunic = 0x74659c } = {}) {
  const group = new THREE.Group();
  const b = bumps();
  const tunicMat = mat(tunic, { roughness: 0.95, bumpMap: b.cloth, bumpScale: 0.35 });
  const skinMat = mat(COLORS.skin, { roughness: 0.7 });

  // Tunic flares from shoulders to hem.
  const body = lathe(
    [
      [0.4, 0],
      [0.52, 0.06],
      [0.44, 0.5],
      [0.36, 0.95],
      [0.3, 1.12],
      [0.14, 1.2],
    ],
    tunicMat
  );
  body.position.y = 0.46;
  // Rope belt.
  const rope = mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 22), mat(0xa8905e, { bumpMap: b.straw, bumpScale: 0.4 }), 0, 1.0, 0);
  rope.rotation.x = Math.PI / 2;

  // Head with painted face, nose, hair under a straw hat.
  const head = mesh(
    new THREE.SphereGeometry(0.3, 24, 18),
    mat(0xffffff, { map: b.face, roughness: 0.65 }),
    0,
    1.95,
    0
  );
  head.rotation.y = -Math.PI / 2; // face texture centre → +z
  const nose = mesh(new THREE.SphereGeometry(0.05, 10, 8), skinMat, 0, 1.93, 0.29);
  const hair = mesh(
    new THREE.SphereGeometry(0.31, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.4),
    mat(0x5a3d22, { roughness: 0.95, bumpMap: b.noise, bumpScale: 0.4 }),
    0,
    1.97,
    0
  );
  const hat = mesh(
    new THREE.ConeGeometry(0.48, 0.32, 18),
    mat(0xcaa958, { roughness: 0.98, bumpMap: b.straw, bumpScale: 0.5 }),
    0,
    2.28,
    0
  );
  const brim = mesh(
    new THREE.CylinderGeometry(0.52, 0.55, 0.045, 18),
    mat(0xba9848, { roughness: 0.98, bumpMap: b.straw, bumpScale: 0.5 }),
    0,
    2.15,
    0
  );

  // Arms with hands; feet peeking from the hem.
  const leftArm = limb(tunicMat, 0.09, 0.075, 0.26, 0.26);
  leftArm.position.set(-0.44, 1.58, 0);
  leftArm.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat, 0, -0.54, 0));
  const rightArm = limb(tunicMat, 0.09, 0.075, 0.26, 0.26);
  rightArm.position.set(0.44, 1.58, 0);
  rightArm.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat, 0, -0.54, 0));

  const shoeGeo = new THREE.SphereGeometry(0.11, 10, 8);
  for (const side of [-1, 1]) {
    const shoe = mesh(shoeGeo, mat(0x4a3018), side * 0.16, 0.08, 0.1);
    shoe.scale.set(1, 0.6, 1.5);
    group.add(shoe);
  }

  group.add(body, rope, head, nose, hair, hat, brim, leftArm, rightArm);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    rightArm.rotation.z = -2.4 + Math.sin(t * 4 + phase) * 0.35;
    leftArm.rotation.x = Math.sin(t * 1.5 + phase) * 0.1;
    group.position.y = group.userData.baseY + Math.abs(Math.sin(t * 2.2 + phase)) * 0.06;
    head.rotation.y = -Math.PI / 2 + Math.sin(t * 0.7 + phase) * 0.4;
  };

  return { group, update };
}

export function createMonster({ skin = COLORS.monster } = {}) {
  const group = new THREE.Group();
  const b = bumps();
  const bodyMat = mat(skin, { roughness: 0.75, bumpMap: b.noise, bumpScale: 0.5 });

  // Lumpy displaced body with a lighter belly.
  const body = organicSphere(0.85, bodyMat, { bump: 0.09, seed: 3 });
  body.position.y = 0.95;
  body.scale.set(1, 0.94, 0.96);
  const belly = mesh(new THREE.SphereGeometry(0.62, 18, 14), mat(0xb9cf8e, { roughness: 0.8 }), 0, 0.78, 0.34);
  belly.scale.set(0.85, 0.75, 0.55);

  const eyeWhite = mat(0xf5f2e8, { roughness: 0.25 });
  const eyeDark = mat(0x201a14, { roughness: 0.25 });
  for (const side of [-1, 1]) {
    group.add(mesh(new THREE.SphereGeometry(0.16, 14, 10), eyeWhite, side * 0.3, 1.28, 0.66));
    group.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), eyeDark, side * 0.3, 1.28, 0.8));
    // heavy brow
    const brow = mesh(new THREE.CapsuleGeometry(0.05, 0.22, 3, 8), bodyMat, side * 0.3, 1.47, 0.62);
    brow.rotation.z = Math.PI / 2 + side * 0.25;
    group.add(brow);
    const horn = mesh(
      new THREE.ConeGeometry(0.11, 0.42, 10),
      mat(0xe0d4b8, { roughness: 0.5, bumpMap: b.noise, bumpScale: 0.3 }),
      side * 0.44,
      1.76,
      0
    );
    horn.rotation.z = -side * 0.5;
    group.add(horn);
    // ears
    const ear = mesh(new THREE.ConeGeometry(0.09, 0.26, 8), bodyMat, side * 0.72, 1.32, -0.1);
    ear.rotation.z = -side * 1.25;
    group.add(ear);
    // stubby arms with claws
    const arm = mesh(new THREE.CapsuleGeometry(0.12, 0.3, 3, 10), bodyMat, side * 0.78, 0.85, 0.15);
    arm.rotation.z = -side * 0.9;
    group.add(arm);
    for (let c = 0; c < 3; c++) {
      const claw = mesh(new THREE.ConeGeometry(0.03, 0.1, 6), eyeWhite, side * (0.92 + c * 0.05), 0.62 - c * 0.03, 0.24 + c * 0.06);
      claw.rotation.x = 0.8;
      group.add(claw);
    }
    // feet
    const foot = mesh(new THREE.SphereGeometry(0.22, 14, 10), bodyMat, side * 0.5, 0.2, 0.25);
    foot.scale.set(1, 0.65, 1.3);
    group.add(foot);
  }
  // Toothy grin.
  for (let i = 0; i < 4; i++) {
    group.add(mesh(new THREE.ConeGeometry(0.05, 0.13, 6), eyeWhite, -0.24 + i * 0.16, 0.84, 0.76));
  }

  group.add(body, belly);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    const hop = Math.abs(Math.sin(t * 3 + phase));
    group.position.y = group.userData.baseY + hop * 0.45;
    const squash = 1 + (1 - hop) * 0.12;
    group.scale.set(squash, 2 - squash, squash);
  };

  return { group, update };
}

export function createDragon({ skin = COLORS.dragon, wing = COLORS.dragonWing } = {}) {
  const group = new THREE.Group();
  const b = bumps();
  const bodyMat = mat(skin, {
    roughness: 0.6,
    metalness: 0.1,
    bumpMap: b.scales,
    bumpScale: 0.6,
  });
  const bellyMat = mat(0xdec08a, { roughness: 0.75, bumpMap: b.cloth, bumpScale: 0.3 });
  const boneMat = mat(0xe0d4b8, { roughness: 0.5, bumpMap: b.noise, bumpScale: 0.3 });

  // Organic body.
  const body = organicSphere(1.5, bodyMat, { bump: 0.05, seed: 7, detail: 1.6 });
  body.position.y = 2.6;
  body.scale.set(1, 0.85, 1.5);
  const belly = mesh(new THREE.SphereGeometry(1.2, 20, 14), bellyMat, 0, 2.25, 0.4);
  belly.scale.set(0.78, 0.62, 1.15);

  // Neck: chain of spheres along a curve up to the head.
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.1, 1.15),
    new THREE.Vector3(0, 3.8, 1.6),
    new THREE.Vector3(0, 4.45, 1.95),
    new THREE.Vector3(0, 4.75, 2.15),
  ]);
  for (let i = 0; i < 6; i++) {
    const p = neckCurve.getPoint(i / 5);
    const seg = mesh(new THREE.SphereGeometry(0.55 - i * 0.05, 16, 12), bodyMat, p.x, p.y, p.z);
    group.add(seg);
  }

  // Head: skull, snout, jaw, nostrils, teeth, glowing eyes, curved horns.
  const head = new THREE.Group();
  head.position.set(0, 4.8, 2.2);
  head.add(mesh(new THREE.SphereGeometry(0.52, 20, 14), bodyMat));
  const snout = mesh(new THREE.SphereGeometry(0.32, 16, 12), bodyMat, 0, -0.08, 0.52);
  snout.scale.set(0.9, 0.62, 1.5);
  head.add(snout);
  const jaw = mesh(new THREE.SphereGeometry(0.26, 14, 10), bodyMat, 0, -0.28, 0.42);
  jaw.scale.set(0.82, 0.42, 1.35);
  head.add(jaw);
  for (const side of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x1a0f0a), side * 0.1, 0.04, 0.94));
    // fangs
    const fang = mesh(new THREE.ConeGeometry(0.035, 0.12, 6), boneMat, side * 0.16, -0.22, 0.72);
    fang.rotation.x = Math.PI;
    head.add(fang);
    // curved horn: three tilted cone segments
    let hx = side * 0.26;
    let hy = 0.34;
    let hz = -0.18;
    let tilt = -0.5;
    for (let s = 0; s < 3; s++) {
      const segLen = 0.3 - s * 0.06;
      const hornSeg = mesh(new THREE.ConeGeometry(0.09 - s * 0.025, segLen, 8), boneMat, hx, hy, hz);
      hornSeg.rotation.x = tilt;
      head.add(hornSeg);
      hy += Math.cos(tilt) * segLen * 0.75;
      hz += Math.sin(tilt) * segLen * 0.75 - 0.02;
      tilt -= 0.45;
    }
  }
  const eyeMat = mat(0xf5d442, { emissive: 0xf5b83c, emissiveIntensity: 1.2, roughness: 0.3 });
  head.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat, -0.26, 0.14, 0.36));
  head.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat, 0.26, 0.14, 0.36));

  // Spine plates.
  for (let i = 0; i < 7; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.13 - i * 0.008, 0.42, 6), boneMat, 0, 3.78 - i * 0.14, 0.85 - i * 0.55);
    spike.rotation.x = -0.35;
    group.add(spike);
  }

  // Webbed wings: membrane shape + finger bones, pivoting at the shoulder.
  const membraneShape = new THREE.Shape();
  membraneShape.moveTo(0, 0);
  membraneShape.lineTo(1.35, 0.5);
  membraneShape.lineTo(2.65, 0.72);
  membraneShape.quadraticCurveTo(2.25, -0.35, 1.85, -0.52);
  membraneShape.quadraticCurveTo(1.5, -0.3, 1.15, -0.72);
  membraneShape.quadraticCurveTo(0.8, -0.45, 0.42, -0.8);
  membraneShape.quadraticCurveTo(0.18, -0.45, 0, 0);
  const membraneGeo = new THREE.ShapeGeometry(membraneShape, 8);
  const membraneMat = mat(wing, {
    roughness: 0.8,
    side: THREE.DoubleSide,
    bumpMap: b.cloth,
    bumpScale: 0.25,
  });

  const buildWing = (mirror) => {
    const pivot = new THREE.Group();
    pivot.position.set(mirror * 0.85, 3.35, 0.1);
    const wingGroup = new THREE.Group();
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    membrane.castShadow = true;
    wingGroup.add(membrane);
    // bones along the leading edge and fingers
    const bonePts = [
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.35, 0.5, 0)],
      [new THREE.Vector3(1.35, 0.5, 0), new THREE.Vector3(2.65, 0.72, 0)],
      [new THREE.Vector3(1.35, 0.5, 0), new THREE.Vector3(1.85, -0.52, 0)],
      [new THREE.Vector3(1.35, 0.5, 0), new THREE.Vector3(1.15, -0.72, 0)],
    ];
    for (const [a, c] of bonePts) {
      const len = a.distanceTo(c);
      const bone = mesh(new THREE.CylinderGeometry(0.045, 0.035, len, 6), bodyMat);
      bone.position.copy(a).lerp(c, 0.5);
      bone.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        c.clone().sub(a).normalize()
      );
      wingGroup.add(bone);
    }
    // lay flat, sweep back slightly
    wingGroup.rotation.x = -Math.PI / 2;
    wingGroup.rotation.z = mirror < 0 ? Math.PI : 0;
    pivot.add(wingGroup);
    return pivot;
  };
  const leftWing = buildWing(-1);
  const rightWing = buildWing(1);

  // Haunches + tucked feet.
  for (const side of [-1, 1]) {
    const haunch = mesh(new THREE.SphereGeometry(0.55, 16, 12), bodyMat, side * 0.95, 1.9, -0.5);
    haunch.scale.set(0.8, 1, 1.15);
    group.add(haunch);
    const foot = mesh(new THREE.SphereGeometry(0.3, 14, 10), bodyMat, side * 0.85, 1.35, 0.15);
    foot.scale.set(0.9, 0.6, 1.4);
    group.add(foot);
    for (let c = 0; c < 3; c++) {
      const claw = mesh(new THREE.ConeGeometry(0.05, 0.16, 6), boneMat, side * (0.7 + c * 0.14), 1.24, 0.55);
      claw.rotation.x = 1.2;
      group.add(claw);
    }
  }

  // Tail: tapering sphere chain with a fin at the tip.
  const tail = new THREE.Group();
  tail.position.set(0, 2.45, -1.6);
  let prev = tail;
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.position.z = i === 0 ? 0 : -0.62;
    const seg = mesh(new THREE.SphereGeometry(0.4 - i * 0.055, 14, 10), bodyMat, 0, 0, -0.3);
    pivot.add(seg);
    prev.add(pivot);
    prev = pivot;
  }
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.45, 0.4);
  finShape.lineTo(-0.32, 0);
  finShape.lineTo(-0.45, -0.4);
  finShape.lineTo(0, 0);
  const fin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), membraneMat);
  fin.castShadow = true;
  fin.rotation.y = Math.PI / 2;
  fin.position.set(0, 0, -0.45);
  prev.add(fin);

  group.add(body, belly, head, leftWing, rightWing, tail);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    const flap = Math.sin(t * 3.2 + phase);
    leftWing.rotation.z = -flap * 0.5 - 0.12;
    rightWing.rotation.z = flap * 0.5 + 0.12;
    group.position.y = group.userData.baseY + Math.sin(t * 1.6 + phase) * 0.35 + 0.6;
    tail.rotation.y = Math.sin(t * 1.2 + phase) * 0.3;
    head.rotation.y = Math.sin(t * 0.6 + phase) * 0.35;
  };

  return { group, update };
}

export const CHARACTER_BUILDERS = {
  knight: () => createKnight({ tunic: 0x35619e }),
  villager: createVillager,
  monster: createMonster,
  dragon: createDragon,
};

// ---------------------------------------------------------------------------
// Landmarks
// ---------------------------------------------------------------------------
export function createWindmill(labelLines) {
  const group = new THREE.Group();
  const b = bumps();

  const stoneTex = makeStoneTexture(3, 4);
  const towerMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.6,
    roughness: 0.9,
  });
  const tower = mesh(new THREE.CylinderGeometry(2.2, 3.4, 11, 24), towerMat, 0, 5.5, 0);
  const roofTex = makeRoofTexture(4, 2);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    bumpMap: roofTex,
    bumpScale: 0.5,
    roughness: 0.85,
  });
  const roof = mesh(new THREE.ConeGeometry(2.8, 2.6, 24), roofMat, 0, 12.2, 0);
  group.add(tower, roof);

  const plankTex = makePlankTexture(1, 1);
  const doorMat = new THREE.MeshStandardMaterial({
    map: plankTex,
    bumpMap: plankTex,
    bumpScale: 0.4,
    roughness: 0.9,
  });
  group.add(mesh(new THREE.BoxGeometry(1.2, 2, 0.3), doorMat, 0, 1.2, 3.15));

  // Rotating blades.
  const blades = new THREE.Group();
  blades.position.set(0, 10, 2.9);
  const bladeMat = mat(COLORS.sail, {
    side: THREE.DoubleSide,
    roughness: 0.95,
    bumpMap: b.cloth,
    bumpScale: 0.35,
  });
  const armMat = mat(COLORS.woodDark, { roughness: 0.95, bumpMap: b.noise, bumpScale: 0.4 });
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    arm.add(mesh(new THREE.BoxGeometry(0.22, 4.6, 0.22), armMat, 0, 2.3, 0));
    arm.add(mesh(new THREE.BoxGeometry(1.3, 3.4, 0.08), bladeMat, 0.55, 2.7, 0));
    blades.add(arm);
  }
  blades.add(mesh(new THREE.SphereGeometry(0.5, 14, 10), armMat));
  group.add(blades);

  // Sign mounted on the tower.
  const texture = makeTextTexture(
    labelLines.map((text) => ({ text, big: true })),
    { width: 512, height: 256, fontScale: 1.05 }
  );
  const signMat = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.25,
    roughness: 0.8,
  });
  const sideMat = mat(COLORS.wood);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.3, 0.18), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    signMat,
    signMat,
  ]);
  sign.position.set(0, 5.6, 3.3);
  sign.castShadow = true;
  group.add(sign);

  const update = (t) => {
    blades.rotation.z = t * 0.6;
  };

  return { group, sign, tower, update };
}

// Displaced, vertex-colored peak: rock strata below a noisy snowline.
function craggyPeak(radius, height, radialSegments = 64, heightSegments = 16) {
  const geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments);
  geometry.translate(0, height / 2, 0);

  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const rock = new THREE.Color(0x76727a);
  const rockWarm = new THREE.Color(0x8a7a68);
  const snow = new THREE.Color(0xf2f5f8);
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.01 && y > 0.01) {
      const n = fbm(x * 0.11 + 5, z * 0.11 - 9, 4) + fbm(y * 0.18, (x + z) * 0.07, 3) * 0.5;
      const amount = n * 2.6 * Math.min(1, (height - y) / height + 0.15);
      pos.setX(i, x + (x / r) * amount);
      pos.setZ(i, z + (z / r) * amount);
      pos.setY(i, y + fbm(x * 0.2 - 3, z * 0.2 + 8, 2) * 1.2);
    }
    const snowLine = height * 0.55 + fbm(x * 0.14, z * 0.14, 3) * height * 0.12;
    if (pos.getY(i) > snowLine) {
      color.copy(snow);
    } else {
      color.copy(rock).lerp(rockWarm, (fbm(x * 0.05, pos.getY(i) * 0.16, 3) + 1) / 2);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    flatShading: true,
  });
  const peak = new THREE.Mesh(geometry, material);
  peak.castShadow = true;
  peak.receiveShadow = true;
  return peak;
}

export function createMountain(label) {
  const group = new THREE.Group();

  const main = craggyPeak(34, 54);
  main.rotation.y = 0.4;
  const left = craggyPeak(20, 31, 48, 12);
  left.position.set(-26, 0, -6);
  left.rotation.y = 1.1;
  const right = craggyPeak(17, 25, 48, 12);
  right.position.set(24, 0, -4);
  right.rotation.y = 2.2;
  group.add(main, left, right);

  // Huge banner on the south face so it is visible from anywhere.
  const texture = makeTextTexture([{ text: label, big: true }], {
    width: 1024,
    height: 256,
    background: "#7a2f22",
    border: "#4a1c14",
    color: "#ffe9b8",
    accent: "#f0b45a",
    fontScale: 2.1,
  });
  const bannerMat = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.2,
    roughness: 0.8,
  });
  const trim = mat(COLORS.woodDark);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(30, 7.5, 0.6), [
    trim,
    trim,
    trim,
    trim,
    bannerMat,
    bannerMat,
  ]);
  sign.position.set(0, 24, 21.5);
  sign.rotation.x = -0.14;
  sign.castShadow = true;
  group.add(sign);

  // Torches flanking the banner (emissive flames animated by caller).
  const flames = [];
  for (const side of [-1, 1]) {
    const pole = mesh(new THREE.CylinderGeometry(0.18, 0.24, 5, 8), trim, side * 17.5, 21.5, 22.2);
    const flame = mesh(
      new THREE.ConeGeometry(0.65, 1.6, 8),
      mat(0xffa028, { emissive: 0xff8c1a, emissiveIntensity: 2.2 }),
      side * 17.5,
      24.8,
      22.2
    );
    flames.push(flame);
    group.add(pole, flame);
  }

  const update = (t) => {
    flames.forEach((flame, i) => {
      const s = 1 + Math.sin(t * 7 + i * 2.1) * 0.18;
      flame.scale.set(s, 1 + Math.sin(t * 9 + i) * 0.22, s);
    });
  };

  return { group, sign, update };
}

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------
export function createHouse(rng) {
  const group = new THREE.Group();
  const w = 3 + rng() * 1.5;
  const d = 2.6 + rng() * 1.2;
  const h = 2.2 + rng() * 0.6;

  const plasterTex = makePlasterTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: plasterTex,
    bumpMap: plasterTex,
    bumpScale: 0.5,
    roughness: 0.92,
  });
  group.add(mesh(new THREE.BoxGeometry(w, h, d), wallMat, 0, h / 2, 0));

  const roofTex = makeRoofTexture(4, 1);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    bumpMap: roofTex,
    bumpScale: 0.5,
    roughness: 0.85,
  });
  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.8, 4), roofMat, 0, h + 0.9, 0);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  const plankTex = makePlankTexture(1, 1);
  const doorMat = new THREE.MeshStandardMaterial({
    map: plankTex,
    bumpMap: plankTex,
    bumpScale: 0.4,
    roughness: 0.9,
  });
  group.add(mesh(new THREE.BoxGeometry(0.7, 1.3, 0.15), doorMat, 0, 0.65, d / 2 + 0.02));

  // Warm window.
  const windowMat = mat(0xf5d08a, { emissive: 0xd98f2b, emissiveIntensity: 0.9 });
  group.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), windowMat, w * 0.28, h * 0.55, d / 2 + 0.02));

  // Chimney.
  group.add(mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), mat(0x8a8a90, { roughness: 0.95 }), w * 0.3, h + 1, -d * 0.2));

  return group;
}

export function createCloud(rng) {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.82,
  });
  const puffs = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < puffs; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.8 + rng() * 1.8, 12, 8), cloudMat);
    puff.position.set(i * 2.4 - puffs, rng() * 0.8, rng() * 1.8 - 0.9);
    puff.scale.y = 0.5;
    group.add(puff);
  }
  return group;
}

export function createRock(rng) {
  const rock = organicSphere(
    0.55 + rng() * 0.85,
    mat(COLORS.stone, { roughness: 0.98, bumpMap: bumps().noise, bumpScale: 0.5 }),
    { bump: 0.22, seed: Math.floor(rng() * 90), detail: 3.2 }
  );
  rock.scale.y = 0.65;
  return rock;
}
