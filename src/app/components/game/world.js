// Procedural builders for the medieval game world: characters, structures
// and props. Sculpted from lathe profiles, capsules and displaced spheres
// with canvas-painted color/bump maps — no external 3D assets.
//
// Every character takes a numeric seed so villagers, knights and creatures
// each get their own face, build, palette and idle behaviour.

import * as THREE from "three";
import { createRng, fbm } from "./terrain";

export const COLORS = {
  trunk: 0x5d3f28,
  stone: 0x8d8d94,
  wood: 0x9c7448,
  woodDark: 0x6b4a2c,
  cloth: 0x8e3a28,
  steel: 0xa2aab4,
  steelDark: 0x6d7681,
  gold: 0xc9982e,
  monster: 0x679c3d,
  dragon: 0x7e2a1e,
  dragonWing: 0xa8542f,
  sail: 0xded2b4,
};

const SKIN_TONES = [0xf0c9a0, 0xe0b189, 0xd9a06b, 0xc98a5b, 0xa8764f];
const HAIR_TONES = [0x2e2018, 0x5a3d22, 0x8a5a2c, 0xb08d54, 0x757575];
const TUNIC_TONES = [0x74659c, 0x5c7a4a, 0x9c5a3c, 0x4a6a8a, 0x8a4a5c, 0x6b5a3c];

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

// Smoothly turn a group's yaw toward the player when they are close,
// otherwise back to the home yaw. Gives NPCs a lifelike awareness.
function facePlayer(group, delta, playerPos, range = 9, rate = 3) {
  const home = group.userData.homeYaw;
  if (home === undefined) return;
  let target = home;
  if (playerPos) {
    const dx = playerPos.x - group.position.x;
    const dz = playerPos.z - group.position.z;
    if (dx * dx + dz * dz < range * range) target = Math.atan2(dx, dz);
  }
  let d = target - group.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  group.rotation.y += d * Math.min(1, (delta || 0.016) * rate);
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

// A unique painted face: expression, eyes, brows, optional facial hair.
// Returns the texture; callers pick the matching skin tone separately.
function makeFaceTexture(rng, skinColor, { stern = false } = {}) {
  const skinCss = `#${new THREE.Color(skinColor).getHexString()}`;
  const mouthKind = stern ? (rng() > 0.5 ? "line" : "frown") : ["smile", "open", "smile", "line"][Math.floor(rng() * 4)];
  const browKind = stern ? "angry" : ["calm", "raised", "calm", "angry"][Math.floor(rng() * 4)];
  const eyeKind = ["round", "wide", "sleepy"][Math.floor(rng() * 3)];
  const hasBeard = rng() > 0.62;
  const hasFreckles = rng() > 0.7;
  const hairColor = `#${new THREE.Color(HAIR_TONES[Math.floor(rng() * HAIR_TONES.length)]).getHexString()}`;

  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = skinCss;
    ctx.fillRect(0, 0, s, s);
    drawNoise(ctx, s, createRng(Math.floor(rng() * 1e6)), 0.03);

    const eyeY = 116;
    const drawEye = (cx) => {
      ctx.fillStyle = "#f7f2ea";
      ctx.beginPath();
      if (eyeKind === "sleepy") ctx.ellipse(cx, eyeY, 12, 5.5, 0, 0, Math.PI * 2);
      else if (eyeKind === "wide") ctx.ellipse(cx, eyeY, 11, 10, 0, 0, Math.PI * 2);
      else ctx.ellipse(cx, eyeY, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a3018";
      ctx.beginPath();
      ctx.arc(cx, eyeY + (eyeKind === "sleepy" ? 1 : 0), 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c120c";
      ctx.beginPath();
      ctx.arc(cx, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(cx + 2, eyeY - 2.5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = hairColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      const lift = browKind === "raised" ? -6 : 0;
      const tilt = browKind === "angry" ? (cx < 128 ? 4 : -4) : 0;
      ctx.moveTo(cx - 13, eyeY - 14 + lift - tilt);
      ctx.quadraticCurveTo(cx, eyeY - 20 + lift, cx + 13, eyeY - 14 + lift + tilt);
      ctx.stroke();
    };
    drawEye(104);
    drawEye(152);

    // mouth
    ctx.strokeStyle = "#7a3a28";
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (mouthKind === "smile") {
      ctx.arc(128, 150, 16, Math.PI * 0.15, Math.PI * 0.85);
    } else if (mouthKind === "open") {
      ctx.fillStyle = "#5c2418";
      ctx.ellipse(128, 158, 9, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (mouthKind === "frown") {
      ctx.arc(128, 172, 14, Math.PI * 1.2, Math.PI * 1.8);
    } else {
      ctx.moveTo(114, 160);
      ctx.lineTo(142, 160);
    }
    ctx.stroke();

    if (hasBeard) {
      ctx.strokeStyle = hairColor;
      ctx.lineWidth = 3;
      for (let i = 0; i < 26; i++) {
        const bx = 96 + Math.random() * 64;
        const by = 168 + Math.random() * 26;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (Math.random() - 0.5) * 5, by + 9);
        ctx.stroke();
      }
    }
    if (hasFreckles) {
      ctx.fillStyle = "rgba(120,70,40,0.4)";
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(92 + Math.random() * 24, 136 + Math.random() * 10, 1.4, 0, Math.PI * 2);
        ctx.arc(140 + Math.random() * 24, 136 + Math.random() * 10, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // blush
    ctx.fillStyle = "rgba(214,120,90,0.22)";
    ctx.beginPath();
    ctx.ellipse(88, 140, 9, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(168, 140, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Half-timbered plaster wall — tint and beam layout vary per house.
function makePlasterTexture(seed, tintCss) {
  const rng = createRng(seed);
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = tintCss;
    ctx.fillRect(0, 0, s, s);
    drawNoise(ctx, s, rng, 0.05);
    ctx.strokeStyle = "#5f452c";
    ctx.lineWidth = 12 + rng() * 5;
    ctx.strokeRect(7, 7, s - 14, s - 14);
    ctx.beginPath();
    if (rng() > 0.35) {
      ctx.moveTo(s / 2, 0);
      ctx.lineTo(s / 2, s);
    }
    ctx.moveTo(0, s * (0.45 + rng() * 0.2));
    ctx.lineTo(s, s * (0.45 + rng() * 0.2));
    const diagonals = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < diagonals; i++) {
      const x0 = rng() * s;
      ctx.moveTo(x0, s * 0.1);
      ctx.lineTo(x0 + (rng() > 0.5 ? 1 : -1) * s * 0.35, s * 0.55);
    }
    ctx.stroke();
  });
}

// Weathered wooden planks.
function makePlankTexture(seed = 23, repeatX = 1, repeatY = 1) {
  const rng = createRng(seed);
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

// Roof tiles with a per-house hue (terracotta, slate, moss…).
function makeRoofTexture(seed, baseColor, repeatX = 3, repeatY = 2) {
  const rng = createRng(seed);
  const base = new THREE.Color(baseColor);
  return canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = `#${base.clone().multiplyScalar(0.55).getHexString()}`;
      ctx.fillRect(0, 0, s, s);
      const rows = 6;
      const cols = 6;
      const tile = new THREE.Color();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offset = r % 2 === 0 ? 0 : s / cols / 2;
          tile.copy(base).multiplyScalar(0.75 + rng() * 0.5);
          ctx.fillStyle = `#${tile.getHexString()}`;
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
function makeStoneTexture(seed = 53, repeatX = 3, repeatY = 3) {
  const rng = createRng(seed);
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

// Shared bump instances (avoid rebuilding per NPC).
let sharedBumps = null;
function bumps() {
  if (!sharedBumps) {
    sharedBumps = {
      noise: makeNoiseBump(),
      chainmail: makeChainmailBump(),
      scales: makeScalesBump(),
      cloth: makeClothBump(),
      straw: makeStrawBump(),
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
// Signboard placed beside every milestone character.
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
// Characters — sculpted, seeded for individuality.
// Each returns { group, update(t, delta, playerPos) }.
// ---------------------------------------------------------------------------

// Limb: capsule segments with a joint sphere, pivoting from the top.
// The lower segment hangs from its own pivot at the joint (exposed as
// userData.knee) so characters can articulate knees and elbows; it rests
// at zero rotation, so limbs that never bend it look exactly as before.
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
  const knee = new THREE.Group();
  knee.position.y = -upperLen;
  const lower = mesh(
    new THREE.CapsuleGeometry(lowerR, lowerLen, 4, 12),
    material,
    0,
    -lowerLen / 2,
    0
  );
  knee.add(lower);
  pivot.add(upper, joint, knee);
  pivot.userData.knee = knee;
  return pivot;
}

export function createKnight({ tunic = COLORS.cloth, isPlayer = false, seed = 7 } = {}) {
  const group = new THREE.Group();
  const rng = createRng(seed * 2654435761);
  const b = bumps();
  const steel = metalMat(COLORS.steel);
  const chain = metalMat(COLORS.steelDark, {
    roughness: 0.55,
    bumpMap: b.chainmail,
    bumpScale: 0.5,
  });
  const clothMat = mat(tunic, { roughness: 0.92, bumpMap: b.cloth, bumpScale: 0.25 });

  // Torso: waist → chest → shoulders profile.
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

  // Open-faced helm with a nasal guard so the painted face shows.
  const skinColor = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const faceTex = makeFaceTexture(rng, skinColor, { stern: true });
  const head = mesh(
    new THREE.SphereGeometry(0.28, 24, 18),
    mat(0xffffff, { map: faceTex, roughness: 0.65 }),
    0,
    2.0,
    0.02
  );
  head.rotation.y = -Math.PI / 2; // face texture centre → +z
  const helm = lathe(
    [
      [0.315, 0],
      [0.33, 0.1],
      [0.3, 0.22],
      [0.18, 0.32],
      [0.01, 0.36],
    ],
    steel
  );
  helm.position.y = 2.06;
  const nasal = mesh(new THREE.BoxGeometry(0.05, 0.22, 0.04), steel, 0, 2.06, 0.3);
  // cheek guards
  const cheekGeo = new THREE.BoxGeometry(0.06, 0.2, 0.16);
  const leftCheek = mesh(cheekGeo, steel, -0.27, 1.98, 0.12);
  const rightCheek = mesh(cheekGeo, steel, 0.27, 1.98, 0.12);
  const plume = mesh(new THREE.ConeGeometry(0.08, 0.5, 10), clothMat, 0, 2.6, -0.06);

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
  const cape = new THREE.Mesh(
    capeGeo,
    mat(tunic, { roughness: 0.95, bumpMap: b.cloth, bumpScale: 0.3, side: THREE.DoubleSide })
  );
  cape.castShadow = true;
  const capePivot = new THREE.Group();
  capePivot.position.set(0, 1.72, -0.3);
  cape.position.y = -0.64;
  capePivot.add(cape);
  capePivot.rotation.x = 0.14;

  // Legs / arms. Boots, gauntlets and gear hang from the knee/elbow pivots
  // so they follow the lower limb when it bends.
  const leftLeg = limb(chain, 0.14, 0.12, 0.36, 0.34);
  leftLeg.position.set(-0.19, 0.78, 0);
  const rightLeg = limb(chain, 0.14, 0.12, 0.36, 0.34);
  rightLeg.position.set(0.19, 0.78, 0);
  const leftKnee = leftLeg.userData.knee;
  const rightKnee = rightLeg.userData.knee;
  const bootGeo = new THREE.SphereGeometry(0.14, 12, 8);
  for (const knee of [leftKnee, rightKnee]) {
    const boot = mesh(bootGeo, steel, 0, -0.36, 0.06);
    boot.scale.set(1, 0.7, 1.5);
    knee.add(boot);
  }

  const leftArm = limb(chain, 0.11, 0.09, 0.3, 0.3);
  leftArm.position.set(-0.52, 1.62, 0);
  const rightArm = limb(chain, 0.11, 0.09, 0.3, 0.3);
  rightArm.position.set(0.52, 1.62, 0);
  const leftElbow = leftArm.userData.knee;
  const rightElbow = rightArm.userData.knee;
  const gauntletGeo = new THREE.SphereGeometry(0.11, 12, 8);
  leftElbow.add(mesh(gauntletGeo, steel, 0, -0.32, 0));
  rightElbow.add(mesh(gauntletGeo, steel, 0, -0.32, 0));

  // Sword: tapered blade with tip, guard, wrapped grip, pommel.
  const sword = new THREE.Group();
  sword.position.set(0, -0.32, 0.08); // hangs from the elbow pivot
  const bladeGeo = new THREE.BoxGeometry(0.075, 0.85, 0.02);
  {
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
  sword.add(mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.16, 8), mat(0x3d2817, { bumpMap: b.cloth, bumpScale: 0.3 }), 0, -0.03, 0.16));
  sword.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), metalMat(COLORS.gold), 0, -0.13, 0.16));
  sword.rotation.x = Math.PI / 2.4;
  rightElbow.add(sword);

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
  shieldFace.position.y = 0.3; // strapped to the forearm, pivoting at the elbow
  leftElbow.add(shieldFace);

  group.add(
    torso, ridge, skirt, tabard, belt, head, helm, nasal, leftCheek, rightCheek, plume,
    leftPauldron, rightPauldron, capePivot,
    leftLeg, rightLeg, leftArm, rightArm
  );

  const phase = rng() * Math.PI * 2;
  const parts = { leftLeg, rightLeg, leftArm, rightArm, body: group };

  const update = (t, a, c) => {
    if (isPlayer) {
      // The movement loop drives the player with { walk, run, phase }:
      // walk/run are eased 0..1 blends and phase is the accumulated gait
      // angle, so cadence can change between walk and sprint without pops.
      const s = typeof a === "object" && a !== null ? a : { walk: a || 0 };
      const walk = Math.min(s.walk ?? 0, 1);
      const run = Math.min(s.run ?? 0, 1);
      const phase = s.phase ?? t * 9;

      const stride = Math.sin(phase);
      const strideEase = stride * Math.abs(stride); // softened reversal
      // Hips swing wider at a sprint...
      const hipAmp = (0.5 + run * 0.34) * walk;
      leftLeg.rotation.x = strideEase * hipAmp;
      rightLeg.rotation.x = -strideEase * hipAmp;
      // ...and the knees lift much higher, bending only through the swing
      // phase of each leg's cycle (a knee never bends backwards).
      const kneeAmp = (0.55 + run * 0.8) * walk;
      leftKnee.rotation.x = Math.max(0, Math.sin(phase + 2.3)) * kneeAmp;
      rightKnee.rotation.x = Math.max(0, Math.sin(phase + Math.PI + 2.3)) * kneeAmp;

      // Arms counter-swing the legs; elbows hang loose on a walk and pump
      // high at a sprint, flaring slightly outward.
      const armAmp = (0.4 + run * 0.42) * walk;
      leftArm.rotation.x = -strideEase * armAmp;
      rightArm.rotation.x = strideEase * armAmp;
      const elbowBend =
        0.18 + walk * 0.14 + run * 0.85;
      leftElbow.rotation.x =
        -(elbowBend + Math.max(0, Math.sin(phase + Math.PI)) * 0.18 * walk);
      rightElbow.rotation.x =
        -(elbowBend + Math.max(0, Math.sin(phase)) * 0.18 * walk);
      leftArm.rotation.z = run * 0.18;
      rightArm.rotation.z = -run * 0.18;

      // Posture: light lean walking, a committed forward lean sprinting,
      // with a gait-synced weight roll that flattens out at speed.
      group.rotation.x = walk * (0.05 + run * 0.13);
      group.rotation.z = stride * 0.028 * walk * (1 - run * 0.45);
      head.rotation.x = -walk * (0.03 + run * 0.06); // keep the chin up

      capePivot.rotation.x =
        0.14 +
        walk * 0.32 +
        run * 0.5 +
        Math.sin(t * 3) * 0.04 +
        Math.abs(stride) * 0.06 * walk;

      // Airborne: blend over the gait into a jump pose — lead leg forward,
      // trail knee up, arms spread. A double jump pulls both knees into a
      // tight mid-air tuck while rising.
      const air = Math.min(s.air ?? 0, 1);
      if (air > 0.01) {
        const lerp = THREE.MathUtils.lerp;
        const rising = THREE.MathUtils.clamp((s.vy ?? 0) / 8, -1, 1);
        const tuck = (s.jumps ?? 0) >= 2 ? Math.max(rising, 0) : 0;
        leftLeg.rotation.x = lerp(
          leftLeg.rotation.x,
          -0.5 - rising * 0.25 - tuck * 0.5,
          air
        );
        rightLeg.rotation.x = lerp(rightLeg.rotation.x, 0.4 - tuck * 0.9, air);
        leftKnee.rotation.x = lerp(leftKnee.rotation.x, 0.5 + tuck * 0.9, air);
        rightKnee.rotation.x = lerp(rightKnee.rotation.x, 1.25 + tuck * 0.35, air);
        leftArm.rotation.x = lerp(leftArm.rotation.x, -0.55, air);
        rightArm.rotation.x = lerp(rightArm.rotation.x, -0.75, air);
        leftElbow.rotation.x = lerp(leftElbow.rotation.x, -0.5, air);
        rightElbow.rotation.x = lerp(rightElbow.rotation.x, -0.6, air);
        leftArm.rotation.z = lerp(leftArm.rotation.z, -0.5, air); // spread wide
        rightArm.rotation.z = lerp(rightArm.rotation.z, 0.5, air);
        group.rotation.x = lerp(group.rotation.x, 0.18 - rising * 0.12, air);
        capePivot.rotation.x = lerp(
          capePivot.rotation.x,
          0.85 - rising * 0.25,
          air
        );
      }

      // idle breathing
      const breathe = 1 + Math.sin(t * 1.4) * 0.012 * (1 - walk);
      torso.scale.set(1, breathe, 1);
    } else {
      const delta = a;
      const playerPos = c;
      facePlayer(group, delta, playerPos);
      leftArm.rotation.x = Math.sin(t * 1.3 + phase) * 0.08;
      rightArm.rotation.x = -0.35 + Math.sin(t * 0.9 + phase) * 0.25;
      capePivot.rotation.x = 0.14 + Math.sin(t * 1.1 + phase) * 0.05;
      // weight shift between feet
      group.rotation.z = Math.sin(t * 0.6 + phase) * 0.02;
      torso.scale.set(1, 1 + Math.sin(t * 1.4 + phase) * 0.014, 1);
    }
    plume.rotation.z = Math.sin(t * 2 + phase) * 0.15;
  };

  return { group, update, parts };
}

export function createVillager(seed = 1) {
  const group = new THREE.Group();
  const rng = createRng((seed + 11) * 1103515245);
  const b = bumps();

  // Individual build, palette and behaviour.
  const skinColor = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const tunic = TUNIC_TONES[Math.floor(rng() * TUNIC_TONES.length)];
  const hairColor = HAIR_TONES[Math.floor(rng() * HAIR_TONES.length)];
  const build = 0.85 + rng() * 0.4; // width
  const stature = 0.92 + rng() * 0.16; // height
  const headwear = ["straw", "hood", "bare"][Math.floor(rng() * 3)];
  const behaviour = ["wave", "chat", "gaze"][Math.floor(rng() * 3)];

  const tunicMat = mat(tunic, { roughness: 0.95, bumpMap: b.cloth, bumpScale: 0.35 });
  const skinMat = mat(skinColor, { roughness: 0.7 });

  const body = lathe(
    [
      [0.4 * build, 0],
      [0.52 * build, 0.06],
      [0.44 * build, 0.5],
      [0.36 * build, 0.95],
      [0.3 * build, 1.12],
      [0.14, 1.2],
    ],
    tunicMat
  );
  body.position.y = 0.46;
  const rope = mesh(
    new THREE.TorusGeometry(0.4 * build, 0.035, 8, 22),
    mat(0xa8905e, { bumpMap: b.straw, bumpScale: 0.4 }),
    0,
    1.0,
    0
  );
  rope.rotation.x = Math.PI / 2;

  // Head with its own painted face.
  const faceTex = makeFaceTexture(rng, skinColor);
  const head = mesh(
    new THREE.SphereGeometry(0.3, 24, 18),
    mat(0xffffff, { map: faceTex, roughness: 0.65 }),
    0,
    1.95,
    0
  );
  head.rotation.y = -Math.PI / 2;
  const nose = mesh(new THREE.SphereGeometry(0.05, 10, 8), skinMat, 0, 1.93, 0.29);

  const hairMat = mat(hairColor, { roughness: 0.95, bumpMap: b.noise, bumpScale: 0.4 });
  if (headwear === "straw") {
    group.add(
      mesh(
        new THREE.SphereGeometry(0.31, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.4),
        hairMat, 0, 1.97, 0
      ),
      mesh(new THREE.ConeGeometry(0.48, 0.32, 18), mat(0xcaa958, { roughness: 0.98, bumpMap: b.straw, bumpScale: 0.5 }), 0, 2.28, 0),
      mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.045, 18), mat(0xba9848, { roughness: 0.98, bumpMap: b.straw, bumpScale: 0.5 }), 0, 2.15, 0)
    );
  } else if (headwear === "hood") {
    const hood = lathe(
      [
        [0.34, 0],
        [0.36, 0.14],
        [0.3, 0.34],
        [0.14, 0.46],
        [0.01, 0.48],
      ],
      mat(new THREE.Color(tunic).multiplyScalar(0.75).getHex(), {
        roughness: 0.95,
        bumpMap: b.cloth,
        bumpScale: 0.35,
      })
    );
    hood.position.y = 1.86;
    // drape over the shoulders
    const drape = lathe(
      [
        [0.42, 0],
        [0.3, 0.18],
      ],
      mat(new THREE.Color(tunic).multiplyScalar(0.75).getHex(), { roughness: 0.95 })
    );
    drape.position.y = 1.6;
    group.add(hood, drape);
  } else {
    // bare head: hair cap + a small bun or side part
    group.add(
      mesh(
        new THREE.SphereGeometry(0.315, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.1),
        hairMat, 0, 1.98, -0.02
      )
    );
    if (rng() > 0.5) group.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), hairMat, 0, 2.16, -0.24));
  }

  const leftArm = limb(tunicMat, 0.09, 0.075, 0.26, 0.26);
  leftArm.position.set(-0.44 * build, 1.58, 0);
  leftArm.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat, 0, -0.54, 0));
  const rightArm = limb(tunicMat, 0.09, 0.075, 0.26, 0.26);
  rightArm.position.set(0.44 * build, 1.58, 0);
  rightArm.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat, 0, -0.54, 0));

  const shoeGeo = new THREE.SphereGeometry(0.11, 10, 8);
  for (const side of [-1, 1]) {
    const shoe = mesh(shoeGeo, mat(0x4a3018), side * 0.16, 0.08, 0.1);
    shoe.scale.set(1, 0.6, 1.5);
    group.add(shoe);
  }

  group.add(body, rope, head, nose, leftArm, rightArm);
  group.scale.setScalar(stature);

  const phase = rng() * Math.PI * 2;
  const update = (t, delta, playerPos) => {
    facePlayer(group, delta, playerPos);
    // breathing + weight shift
    body.scale.x = 1 + Math.sin(t * 1.6 + phase) * 0.015;
    group.rotation.z = Math.sin(t * 0.7 + phase) * 0.02;

    if (behaviour === "wave") {
      rightArm.rotation.z = -2.4 + Math.sin(t * 4 + phase) * 0.35;
      leftArm.rotation.x = Math.sin(t * 1.5 + phase) * 0.1;
      group.position.y = group.userData.baseY + Math.abs(Math.sin(t * 2.2 + phase)) * 0.05;
    } else if (behaviour === "chat") {
      // animated talking gestures
      rightArm.rotation.x = -0.6 + Math.sin(t * 3.1 + phase) * 0.3;
      leftArm.rotation.x = -0.4 + Math.sin(t * 2.6 + phase + 1.5) * 0.25;
      group.position.y = group.userData.baseY;
    } else {
      // gazing around, hands settled
      rightArm.rotation.x = Math.sin(t * 1.2 + phase) * 0.06;
      leftArm.rotation.x = Math.sin(t * 1.2 + phase + 2) * 0.06;
      group.position.y = group.userData.baseY;
      head.rotation.y = -Math.PI / 2 + Math.sin(t * 0.5 + phase) * 0.55;
    }
    if (behaviour !== "gaze") {
      head.rotation.y = -Math.PI / 2 + Math.sin(t * 0.7 + phase) * 0.3;
    }
  };

  return { group, update };
}

export function createMonster(seed = 3) {
  const group = new THREE.Group();
  const rng = createRng((seed + 5) * 69069);
  const b = bumps();
  const stature = 2.0; // towering brute — applied in update (which owns group.scale)
  const hue = 0.22 + rng() * 0.14; // mossy green → swamp olive
  const skinColor = new THREE.Color().setHSL(hue, 0.5, 0.26).getHex();
  const bodyMat = mat(skinColor, { roughness: 0.78, bumpMap: b.noise, bumpScale: 0.65 });
  const hideMat = mat(new THREE.Color(skinColor).multiplyScalar(0.8).getHex(), {
    roughness: 0.85,
    bumpMap: b.noise,
    bumpScale: 0.5,
  });
  const boneMat = mat(0xd8ccae, { roughness: 0.5, bumpMap: b.noise, bumpScale: 0.3 });

  // Hunched ogre body: heavy pear silhouette leaning forward.
  const body = organicSphere(0.95, bodyMat, { bump: 0.08, seed: seed + 3 });
  body.position.set(0, 1.05, -0.05);
  body.scale.set(1, 1.05, 0.92);
  body.rotation.x = 0.3;
  const gut = mesh(new THREE.SphereGeometry(0.66, 18, 14), mat(0xb9c08a, { roughness: 0.85, bumpMap: b.noise, bumpScale: 0.4 }), 0, 0.78, 0.42);
  gut.scale.set(0.85, 0.8, 0.6);

  // Head sits low between the shoulders: heavy jaw on its own pivot so it
  // can roar open, a wall of underbite fangs, upper teeth, curled horns.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.74, 0.48);
  const skull = organicSphere(0.42, bodyMat, { bump: 0.06, seed: seed + 9 });
  skull.scale.set(1.05, 0.9, 0.95);
  headGroup.add(skull);
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.06, 0.06);
  headGroup.add(jawGroup);
  const jaw = mesh(new THREE.SphereGeometry(0.34, 16, 12), hideMat, 0, -0.16, 0.1);
  jaw.scale.set(1.05, 0.55, 1.05);
  jawGroup.add(jaw);
  // underbite fangs point up from the lower jaw
  for (const side of [-1, 1]) {
    jawGroup.add(mesh(new THREE.ConeGeometry(0.055, 0.28, 6), boneMat, side * 0.2, 0.02, 0.32));
    jawGroup.add(mesh(new THREE.ConeGeometry(0.045, 0.18, 6), boneMat, side * 0.09, -0.02, 0.36));
  }
  // upper teeth hanging from the skull
  for (const side of [-1, 1]) {
    for (let tth = 0; tth < 3; tth++) {
      const tooth = mesh(
        new THREE.ConeGeometry(0.03, 0.1 + (tth % 2) * 0.05, 5),
        boneMat,
        side * (0.08 + tth * 0.09),
        -0.22,
        0.36 - tth * 0.03
      );
      tooth.rotation.x = Math.PI;
      headGroup.add(tooth);
    }
  }
  // burning red eyes sunk under a heavier, angrier brow
  const eyeMat = mat(0xff3820, { emissive: 0xc41808, emissiveIntensity: 1.7, roughness: 0.3 });
  for (const side of [-1, 1]) {
    headGroup.add(mesh(new THREE.SphereGeometry(0.065, 10, 8), eyeMat, side * 0.16, 0.07, 0.36));
    const brow = mesh(new THREE.CapsuleGeometry(0.06, 0.22, 3, 8), hideMat, side * 0.17, 0.17, 0.36);
    brow.rotation.z = Math.PI / 2 + side * 0.45;
    headGroup.add(brow);
    // torn ears
    const ear = mesh(new THREE.ConeGeometry(0.09, 0.3, 6), hideMat, side * 0.46, 0.12, -0.08);
    ear.rotation.z = -side * 1.35;
    headGroup.add(ear);
    // stubby curled horns above the ears
    let hx = side * 0.3;
    let hy = 0.3;
    let hz = -0.05;
    let tilt = -0.5;
    for (let s = 0; s < 2; s++) {
      const segLen = 0.24 - s * 0.07;
      const hornSeg = mesh(new THREE.ConeGeometry(0.07 - s * 0.02, segLen, 7), boneMat, hx, hy, hz);
      hornSeg.rotation.x = tilt;
      hornSeg.rotation.z = -side * 0.35;
      headGroup.add(hornSeg);
      hx += side * 0.05;
      hy += Math.cos(tilt) * segLen * 0.65;
      hz += Math.sin(tilt) * segLen * 0.65;
      tilt -= 0.55;
    }
  }
  // flat nose nostrils
  headGroup.add(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(0x1c140c), -0.05, -0.02, 0.44));
  headGroup.add(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(0x1c140c), 0.05, -0.02, 0.44));

  // Bone spikes down the hunched spine and bursting from the shoulders.
  for (let i = 0; i < 6; i++) {
    const spike = mesh(
      new THREE.ConeGeometry(0.12 - i * 0.012, 0.42 - i * 0.04, 6),
      boneMat,
      0,
      1.92 - i * 0.24,
      -0.48 - i * 0.11
    );
    spike.rotation.x = -0.5;
    group.add(spike);
  }
  for (const side of [-1, 1]) {
    for (let s = 0; s < 2; s++) {
      const shoulderSpike = mesh(
        new THREE.ConeGeometry(0.07 - s * 0.02, 0.3 - s * 0.08, 6),
        boneMat,
        side * (0.6 + s * 0.14),
        1.92 - s * 0.05,
        -0.02 + s * 0.1
      );
      shoulderSpike.rotation.z = -side * (0.7 + s * 0.3);
      group.add(shoulderSpike);
    }
  }
  // stub tail
  const tail = mesh(new THREE.ConeGeometry(0.14, 0.45, 8), hideMat, 0, 0.55, -0.75);
  tail.rotation.x = 1.25;

  // Long hanging arms with clawed hands; thick legs with flat feet.
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = limb(bodyMat, 0.18, 0.14, 0.42, 0.4);
    // Pivot outside the torso and flared outward — tucked inward they
    // disappear into the body's bulk.
    arm.position.set(side * 0.92, 1.68, 0.12);
    arm.rotation.z = side * 0.3;
    const hand = mesh(new THREE.SphereGeometry(0.16, 12, 9), hideMat, 0, -0.9, 0.02);
    hand.scale.set(1, 0.8, 1.2);
    arm.add(hand);
    for (let c = 0; c < 4; c++) {
      const claw = mesh(
        new THREE.ConeGeometry(0.04, 0.22, 6),
        boneMat,
        (c - 1.5) * 0.075,
        -1.03,
        0.15
      );
      claw.rotation.x = 2.6;
      arm.add(claw);
    }
    group.add(arm);
    arms.push(arm);

    // Deltoid mass bridging torso and arm so the shoulder reads as one piece.
    const shoulder = mesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      bodyMat,
      side * 0.8,
      1.78,
      0.1
    );
    shoulder.scale.set(1.15, 0.9, 1);
    group.add(shoulder);

    const leg = limb(bodyMat, 0.18, 0.15, 0.3, 0.26);
    leg.position.set(side * 0.34, 0.62, 0);
    const foot = mesh(new THREE.SphereGeometry(0.19, 12, 9), hideMat, 0, -0.6, 0.1);
    foot.scale.set(1.1, 0.5, 1.6);
    leg.add(foot);
    for (let c = 0; c < 3; c++) {
      const claw = mesh(new THREE.ConeGeometry(0.045, 0.17, 6), boneMat, (c - 1) * 0.09, -0.66, 0.38);
      claw.rotation.x = 1.4;
      leg.add(claw);
    }
    group.add(leg);
  }

  group.add(body, gut, headGroup, tail);

  const phase = rng() * Math.PI * 2;
  const update = (t, delta, playerPos) => {
    facePlayer(group, delta, playerPos, 12, 2.2);
    // Heavy idle: breathing gut, shoulder roll, knuckle sway, an occasional
    // intimidating stomp-hop, and a rare jaw-wide roar with the head thrown
    // back.
    const breathe = 1 + Math.sin(t * 1.1 + phase) * 0.03;
    gut.scale.set(0.85 * breathe, 0.8, 0.6 * breathe);
    body.rotation.z = Math.sin(t * 0.9 + phase) * 0.04;
    const roar = Math.max(0, Math.sin(t * 0.5 + phase + 2)) ** 8;
    jawGroup.rotation.x = 0.06 + roar * 0.6;
    headGroup.rotation.y = Math.sin(t * 0.55 + phase) * 0.4 * (1 - roar);
    headGroup.rotation.x = Math.sin(t * 1.3 + phase) * 0.06 - roar * 0.3;
    arms[0].rotation.x = Math.sin(t * 1.15 + phase) * 0.1 - roar * 0.5;
    arms[1].rotation.x = Math.sin(t * 1.15 + phase + Math.PI) * 0.1 - roar * 0.5;
    const hopWave = Math.sin(t * 0.9 + phase);
    const hop = Math.max(0, hopWave) ** 6; // rare, punchy hop
    group.position.y = group.userData.baseY + hop * 0.4 * stature;
    const squash = 1 - hop * 0.06 + (1 - Math.abs(hopWave)) * 0.015;
    group.scale.set(
      (2 - squash) * stature,
      squash * stature,
      (2 - squash) * stature
    );
  };

  return { group, update };
}

export function createDragon(seed = 4) {
  const group = new THREE.Group();
  const rng = createRng((seed + 13) * 40503);
  const b = bumps();
  // Darker, blood-and-ash hide reads far more menacing at golden hour.
  const bodyMat = mat(0x521812, {
    roughness: 0.5,
    metalness: 0.18,
    bumpMap: b.scales,
    bumpScale: 0.75,
  });
  const bellyMat = mat(0x9c7f52, {
    roughness: 0.7,
    bumpMap: b.scales,
    bumpScale: 0.45,
  });
  const boneMat = mat(0xd8ccae, { roughness: 0.5, bumpMap: b.noise, bumpScale: 0.3 });

  // Grounded quadruped: horizontal body, deep chest.
  const body = organicSphere(1.35, bodyMat, { bump: 0.05, seed: seed + 7, detail: 1.6 });
  body.position.set(0, 1.85, -0.2);
  body.scale.set(1.0, 0.9, 1.85);
  const chest = mesh(new THREE.SphereGeometry(1.05, 20, 14), bodyMat, 0, 1.8, 1.15);
  chest.scale.set(0.95, 0.95, 1.0);
  // belly scutes: stacked plates under chest → tail root
  for (let i = 0; i < 6; i++) {
    const scute = mesh(new THREE.CylinderGeometry(0.52 - i * 0.03, 0.56 - i * 0.03, 0.16, 14), bellyMat, 0, 1.12, 1.1 - i * 0.5);
    scute.rotation.x = Math.PI / 2 - 0.08;
    group.add(scute);
  }

  // S-curved neck of shrinking rings up to the head.
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.2, 1.6),
    new THREE.Vector3(0, 2.9, 2.15),
    new THREE.Vector3(0, 3.7, 2.3),
    new THREE.Vector3(0, 4.25, 2.2),
  ]);
  for (let i = 0; i < 7; i++) {
    const p = neckCurve.getPoint(i / 6);
    const seg = mesh(new THREE.SphereGeometry(0.52 - i * 0.045, 16, 12), bodyMat, p.x, p.y, p.z);
    seg.scale.set(1, 0.9, 1.1);
    group.add(seg);
    if (i > 0 && i < 6) {
      const plate = mesh(new THREE.CylinderGeometry(0.3 - i * 0.02, 0.34 - i * 0.02, 0.12, 12), bellyMat, p.x, p.y - 0.12, p.z + 0.3);
      plate.rotation.x = Math.PI / 2 - 0.5;
      group.add(plate);
    }
  }

  // Head: long tapered skull with brow ridges, frills, horns and smoke.
  const head = new THREE.Group();
  head.position.set(0, 4.45, 2.25);
  const skull = mesh(new THREE.SphereGeometry(0.48, 20, 14), bodyMat);
  skull.scale.set(0.9, 0.78, 1.1);
  head.add(skull);
  const upperSnout = mesh(new THREE.SphereGeometry(0.3, 16, 12), bodyMat, 0, -0.04, 0.62);
  upperSnout.scale.set(0.78, 0.5, 1.7);
  head.add(upperSnout);
  const lowerJaw = mesh(new THREE.SphereGeometry(0.24, 14, 10), bellyMat, 0, -0.22, 0.5);
  lowerJaw.scale.set(0.7, 0.35, 1.5);
  head.add(lowerJaw);
  // nostril ridges + dark nostrils
  for (const side of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), bodyMat, side * 0.1, 0.08, 1.05));
    head.add(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(0x140c08), side * 0.1, 0.09, 1.1));
    // ragged double row of teeth, alternating long sabers and short cutters
    for (let tth = 0; tth < 6; tth++) {
      const tooth = mesh(
        new THREE.ConeGeometry(0.026, tth % 2 === 0 ? 0.16 : 0.09, 5),
        boneMat,
        side * (0.09 + tth * 0.028),
        -0.17,
        0.42 + tth * 0.1
      );
      tooth.rotation.x = Math.PI;
      head.add(tooth);
    }
    // up-curving fangs from the lower jaw
    const upFang = mesh(new THREE.ConeGeometry(0.035, 0.2, 5), boneMat, side * 0.16, -0.15, 0.78);
    upFang.rotation.x = 0.25;
    head.add(upFang);
    // brow ridge over the eye
    const ridge = mesh(new THREE.CapsuleGeometry(0.05, 0.2, 3, 8), bodyMat, side * 0.24, 0.22, 0.3);
    ridge.rotation.z = Math.PI / 2 + side * 0.3;
    head.add(ridge);
    // cheek frill fins
    const frillShape = new THREE.Shape();
    frillShape.moveTo(0, 0);
    frillShape.lineTo(-0.34, 0.16);
    frillShape.lineTo(-0.22, 0);
    frillShape.lineTo(-0.34, -0.18);
    frillShape.closePath();
    const frill = new THREE.Mesh(
      new THREE.ShapeGeometry(frillShape),
      mat(COLORS.dragonWing, { roughness: 0.8, side: THREE.DoubleSide })
    );
    frill.position.set(side * 0.4, 0.02, -0.05);
    frill.rotation.y = side * 0.5;
    head.add(frill);
    // long swept-back segmented horns
    let hx = side * 0.2;
    let hy = 0.32;
    let hz = -0.2;
    let tilt = -0.7;
    for (let s = 0; s < 4; s++) {
      const segLen = 0.34 - s * 0.05;
      const hornSeg = mesh(new THREE.ConeGeometry(0.095 - s * 0.02, segLen, 8), boneMat, hx, hy, hz);
      hornSeg.rotation.x = tilt;
      head.add(hornSeg);
      hy += Math.cos(tilt) * segLen * 0.7;
      hz += Math.sin(tilt) * segLen * 0.7;
      tilt -= 0.38;
    }
  }
  // Furnace eyes: hot orange-red coals under the brow ridges.
  const eyeMat = mat(0xff6a1e, { emissive: 0xff3a08, emissiveIntensity: 2.1, roughness: 0.25 });
  head.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat, -0.22, 0.12, 0.42));
  head.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat, 0.22, 0.12, 0.42));
  // slit pupils
  for (const side of [-1, 1]) {
    const pupil = mesh(new THREE.BoxGeometry(0.015, 0.1, 0.02), mat(0x140c08), side * 0.22, 0.12, 0.5);
    head.add(pupil);
  }
  // Ember glow smouldering between the jaws, pulsing like a furnace.
  const throatMat = mat(0xff7a1e, {
    emissive: 0xff5a10,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  const throatGlow = mesh(new THREE.SphereGeometry(0.12, 10, 8), throatMat, 0, -0.13, 0.6);
  throatGlow.scale.set(1.2, 0.45, 1.6);
  head.add(throatGlow);

  // Smoke wisps drifting from the nostrils.
  const smokeCount = 14;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeSeed = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    smokeSeed[i] = rng();
    smokePos[i * 3] = (i % 2 === 0 ? -0.1 : 0.1);
    smokePos[i * 3 + 1] = 0.1 + rng() * 0.6;
    smokePos[i * 3 + 2] = 1.1 + rng() * 0.3;
  }
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
  const smokeCanvas = document.createElement("canvas");
  smokeCanvas.width = 32;
  smokeCanvas.height = 32;
  {
    const ctx = smokeCanvas.getContext("2d");
    const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    g.addColorStop(0, "rgba(200,200,200,0.7)");
    g.addColorStop(1, "rgba(200,200,200,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  const smokeTex = new THREE.CanvasTexture(smokeCanvas);
  const smoke = new THREE.Points(
    smokeGeo,
    new THREE.PointsMaterial({
      map: smokeTex,
      size: 0.62,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );
  smoke.renderOrder = 3;
  head.add(smoke);

  // Spine plates from neck to tail — taller, like a saw-backed ridge.
  for (let i = 0; i < 10; i++) {
    const spike = mesh(
      new THREE.ConeGeometry(0.16 - i * 0.009, 0.58 - i * 0.03, 6),
      boneMat,
      0,
      2.95 - i * 0.1 - (i > 5 ? (i - 5) * 0.12 : 0),
      1.3 - i * 0.55
    );
    spike.rotation.x = -0.3;
    group.add(spike);
  }

  // Webbed wings: membrane + finger bones, folded at rest, slow stretches.
  const membraneShape = new THREE.Shape();
  membraneShape.moveTo(0, 0);
  membraneShape.lineTo(1.35, 0.5);
  membraneShape.lineTo(2.65, 0.72);
  membraneShape.quadraticCurveTo(2.25, -0.35, 1.85, -0.52);
  membraneShape.quadraticCurveTo(1.5, -0.3, 1.15, -0.72);
  membraneShape.quadraticCurveTo(0.8, -0.45, 0.42, -0.8);
  membraneShape.quadraticCurveTo(0.18, -0.45, 0, 0);
  const membraneGeo = new THREE.ShapeGeometry(membraneShape, 8);
  const membraneMat = mat(COLORS.dragonWing, {
    roughness: 0.8,
    side: THREE.DoubleSide,
    bumpMap: b.cloth,
    bumpScale: 0.25,
  });

  const buildWing = (mirror) => {
    const pivot = new THREE.Group();
    pivot.position.set(mirror * 0.8, 2.6, 0.4);
    const wingGroup = new THREE.Group();
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    membrane.castShadow = true;
    wingGroup.add(membrane);
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
    wingGroup.rotation.x = -Math.PI / 2;
    wingGroup.rotation.z = mirror < 0 ? Math.PI : 0;
    pivot.scale.setScalar(1.2); // broader wingspan
    pivot.add(wingGroup);
    return pivot;
  };
  const leftWing = buildWing(-1);
  const rightWing = buildWing(1);

  // Four legs planted on the ground.
  for (const [side, zPos, size] of [
    [-1, 1.05, 0.9],
    [1, 1.05, 0.9],
    [-1, -1.15, 1.15],
    [1, -1.15, 1.15],
  ]) {
    const haunch = mesh(new THREE.SphereGeometry(0.5 * size, 16, 12), bodyMat, side * 0.95, 1.55, zPos);
    haunch.scale.set(0.75, 1, 1.05);
    group.add(haunch);
    const shin = mesh(new THREE.CapsuleGeometry(0.14 * size, 0.7, 4, 10), bodyMat, side * 1.0, 0.7, zPos + 0.08);
    group.add(shin);
    const foot = mesh(new THREE.SphereGeometry(0.24 * size, 12, 9), bodyMat, side * 1.0, 0.18, zPos + 0.2);
    foot.scale.set(1, 0.5, 1.5);
    group.add(foot);
    for (let c = 0; c < 3; c++) {
      const claw = mesh(new THREE.ConeGeometry(0.05, 0.16, 6), boneMat, side * (0.85 + c * 0.14), 0.12, zPos + 0.55);
      claw.rotation.x = 1.25;
      group.add(claw);
    }
  }

  // Long tail curving behind, with a fin at the tip.
  const tail = new THREE.Group();
  tail.position.set(0, 1.75, -2.3);
  let prev = tail;
  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group();
    pivot.position.z = i === 0 ? 0 : -0.55;
    const seg = mesh(new THREE.SphereGeometry(0.36 - i * 0.038, 14, 10), bodyMat, 0, -i * 0.02, -0.28);
    pivot.add(seg);
    prev.add(pivot);
    prev = pivot;
  }
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.5, 0.42);
  finShape.lineTo(-0.34, 0);
  finShape.lineTo(-0.5, -0.42);
  finShape.closePath();
  const fin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), membraneMat);
  fin.castShadow = true;
  fin.rotation.y = Math.PI / 2;
  fin.position.set(0, 0, -0.4);
  prev.add(fin);

  group.add(body, chest, head, leftWing, rightWing, tail);
  group.scale.setScalar(2.1); // a true colossus beside the knight

  const phase = rng() * Math.PI * 2;
  const update = (t, delta) => {
    // Grounded idle: breathing ribcage, tail lash, head survey; wings rest
    // half-raised for a spikier silhouette and stretch open every few
    // seconds; the throat ember smoulders in and out.
    const breathe = 1 + Math.sin(t * 0.9 + phase) * 0.025;
    body.scale.set(1.0 * breathe, 0.9, 1.85);
    throatMat.emissiveIntensity = 1.5 + Math.sin(t * 2.1 + phase) * 0.7;
    const stretch = Math.max(0, Math.sin(t * 0.45 + phase)) ** 3;
    const flutter = Math.sin(t * 6 + phase) * 0.05 * stretch;
    leftWing.rotation.z = -0.72 + stretch * 0.95 + flutter;
    rightWing.rotation.z = 0.72 - stretch * 0.95 - flutter;
    tail.rotation.y = Math.sin(t * 0.7 + phase) * 0.35;
    tail.rotation.x = Math.sin(t * 1.1 + phase) * 0.05;
    head.rotation.y = Math.sin(t * 0.4 + phase) * 0.5;
    head.rotation.x = Math.sin(t * 0.9 + phase) * 0.07;

    // smoke drift
    const attr = smoke.geometry.attributes.position;
    for (let i = 0; i < smokeCount; i++) {
      let y = attr.getY(i) + (delta || 0.016) * (0.25 + smokeSeed[i] * 0.3);
      let z = attr.getZ(i) + (delta || 0.016) * 0.15;
      if (y > 0.9) {
        y = 0.08;
        z = 1.1;
      }
      attr.setY(i, y);
      attr.setZ(i, z);
    }
    attr.needsUpdate = true;
  };

  return { group, update };
}

export const CHARACTER_BUILDERS = {
  knight: (seed) => createKnight({ tunic: 0x35619e, seed }),
  villager: (seed) => createVillager(seed),
  monster: (seed) => createMonster(seed),
  dragon: (seed) => createDragon(seed),
};

// ---------------------------------------------------------------------------
// Landmarks
// ---------------------------------------------------------------------------
export function createWindmill(labelLines) {
  const group = new THREE.Group();
  const b = bumps();

  const stoneTex = makeStoneTexture(53, 3, 4);
  const towerMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.6,
    roughness: 0.9,
  });
  const tower = mesh(new THREE.CylinderGeometry(2.2, 3.4, 11, 24), towerMat, 0, 5.5, 0);
  const roofTex = makeRoofTexture(37, 0x8f4030, 4, 2);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    bumpMap: roofTex,
    bumpScale: 0.5,
    roughness: 0.85,
  });
  const roof = mesh(new THREE.ConeGeometry(2.8, 2.6, 24), roofMat, 0, 12.2, 0);
  group.add(tower, roof);

  const plankTex = makePlankTexture(23, 1, 1);
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

  // Torches flanking the banner, with real warm light for dusk.
  const flames = [];
  for (const side of [-1, 1]) {
    const pole = mesh(new THREE.CylinderGeometry(0.18, 0.24, 5, 8), trim, side * 17.5, 21.5, 22.2);
    const flame = mesh(
      new THREE.ConeGeometry(0.65, 1.6, 8),
      mat(0xffa028, { emissive: 0xff8c1a, emissiveIntensity: 2.6 }),
      side * 17.5,
      24.8,
      22.2
    );
    const glow = new THREE.PointLight(0xff9a3c, 26, 40, 2);
    glow.position.set(side * 17.5, 25.2, 23);
    flames.push(flame);
    group.add(pole, flame, glow);
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
const ROOF_COLORS = [0x8f4030, 0x5c6470, 0x6d5638, 0x7a4a5a];
const PLASTER_TINTS = ["#ddd2ba", "#d8cdb0", "#cfd2b8", "#dcc8b4", "#d4cabc"];

export function createHouse(rng) {
  const group = new THREE.Group();
  const seed = Math.floor(rng() * 1e6) + 7;
  const w = 2.8 + rng() * 1.9;
  const d = 2.4 + rng() * 1.5;
  const h = 2.1 + rng() * 0.9;
  const stoneBase = rng() > 0.6;
  const gable = rng() > 0.45;

  // Walls: unique plaster tint + beam layout, or a stone-block cottage.
  let wallMat;
  if (stoneBase) {
    const stoneTex = makeStoneTexture(seed, 2, 2);
    wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      bumpMap: stoneTex,
      bumpScale: 0.55,
      roughness: 0.92,
    });
  } else {
    const plasterTex = makePlasterTexture(seed, PLASTER_TINTS[Math.floor(rng() * PLASTER_TINTS.length)]);
    wallMat = new THREE.MeshStandardMaterial({
      map: plasterTex,
      bumpMap: plasterTex,
      bumpScale: 0.5,
      roughness: 0.92,
    });
  }
  group.add(mesh(new THREE.BoxGeometry(w, h, d), wallMat, 0, h / 2, 0));

  const roofColor = ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];
  const roofTex = makeRoofTexture(seed + 1, roofColor, 4, 1);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    bumpMap: roofTex,
    bumpScale: 0.5,
    roughness: 0.85,
  });

  if (gable) {
    // Triangular prism roof with overhang.
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 0.35, 0);
    shape.lineTo(w / 2 + 0.35, 0);
    shape.lineTo(0, 1.3 + rng() * 0.5);
    shape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.5, bevelEnabled: false });
    roofGeo.translate(0, 0, -(d + 0.5) / 2);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.castShadow = true;
    roof.position.y = h;
    group.add(roof);
  } else {
    const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.6 + rng() * 0.5, 4), roofMat, 0, h + 0.85, 0);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  }

  const plankTex = makePlankTexture(seed + 2, 1, 1);
  const doorMat = new THREE.MeshStandardMaterial({
    map: plankTex,
    bumpMap: plankTex,
    bumpScale: 0.4,
    roughness: 0.9,
  });
  const doorX = (rng() - 0.5) * w * 0.4;
  group.add(mesh(new THREE.BoxGeometry(0.7, 1.3, 0.15), doorMat, doorX, 0.65, d / 2 + 0.02));

  // Warm windows glowing at dusk (1–2, varied placement).
  const windowMat = mat(0xf5d08a, { emissive: 0xe89a3c, emissiveIntensity: 1.4 });
  const windowCount = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < windowCount; i++) {
    const side = rng() > 0.5 ? 1 : -1;
    group.add(
      mesh(new THREE.BoxGeometry(0.48, 0.48, 0.1), windowMat, side * w * (0.2 + rng() * 0.12), h * (0.45 + rng() * 0.2), d / 2 + 0.02)
    );
  }

  // Chimney on a random corner.
  group.add(
    mesh(
      new THREE.BoxGeometry(0.4, 1.1 + rng() * 0.5, 0.4),
      mat(0x83838a, { roughness: 0.95, bumpMap: bumps().noise, bumpScale: 0.4 }),
      (rng() > 0.5 ? 1 : -1) * w * 0.3,
      h + 0.9,
      -d * 0.2
    )
  );

  return group;
}

// Stone arch bridge spanning the river. The deck runs along local x;
// `tilt` raises the +x end so the ends can meet banks of slightly different
// heights. Returns `deckYAt(lx)` — the walkable surface height in local
// space — and `pierX` (pier offset from center) so gameplay can walk the
// player over the deck and collide them with the stonework below.
export function createBridge({ span = 15, width = 3.4, arch = 1.2, tilt = 0 } = {}) {
  const group = new THREE.Group();
  const half = span / 2;
  const deckYAt = (lx) => {
    const u = THREE.MathUtils.clamp(lx / half, -1, 1);
    return arch * (1 - u * u) + tilt * u;
  };
  const slopeAt = (lx) =>
    Math.atan2(deckYAt(lx + 0.01) - deckYAt(lx - 0.01), 0.02);

  const stoneMaterial = (seed, repeatX, repeatY) => {
    const texture = makeStoneTexture(seed, repeatX, repeatY);
    return new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.55,
      roughness: 0.95,
    });
  };
  const deckMat = stoneMaterial(311, 8, 2);
  const wallMat = stoneMaterial(313, 5, 1);
  const pierMat = stoneMaterial(317, 2, 3);

  // Deck: stone slabs following the arch, with low parapet walls topped by
  // slightly proud capstones on both sides.
  const SLABS = 15;
  const step = span / SLABS;
  for (let i = 0; i < SLABS; i++) {
    const lx = -half + (i + 0.5) * step;
    const py = deckYAt(lx);
    const slope = slopeAt(lx);
    const slab = mesh(
      new THREE.BoxGeometry(step * 1.08, 0.26, width),
      deckMat,
      lx,
      py - 0.13,
      0
    );
    slab.rotation.z = slope;
    group.add(slab);
    for (const side of [-1, 1]) {
      const rz = (width / 2 - 0.14) * side;
      const wall = mesh(
        new THREE.BoxGeometry(step * 1.08, 0.52, 0.28),
        wallMat,
        lx,
        py + 0.26,
        rz
      );
      wall.rotation.z = slope;
      const cap = mesh(
        new THREE.BoxGeometry(step * 1.08, 0.12, 0.4),
        wallMat,
        lx,
        py + 0.56,
        rz
      );
      cap.rotation.z = slope;
      group.add(wall, cap);
    }
  }

  // Portal pillars at the four corners.
  for (const ex of [-1, 1]) {
    const lx = ex * (half - 0.25);
    for (const side of [-1, 1]) {
      group.add(
        mesh(
          new THREE.BoxGeometry(0.6, 1.15, 0.5),
          pierMat,
          lx,
          deckYAt(lx) + 0.4,
          (width / 2 - 0.14) * side
        )
      );
    }
  }

  // Piers flanking the main arch bay, a shallow vault ring under the deck
  // between them, and abutments burying the ends into the banks.
  const pierX = span * 0.22;
  for (const px of [-pierX, pierX]) {
    group.add(
      mesh(
        new THREE.BoxGeometry(1.3, 4.6, width * 0.92),
        pierMat,
        px,
        deckYAt(px) - 2.4,
        0
      )
    );
  }
  const RING = 7;
  const ringStep = (pierX * 2) / RING;
  for (let i = 0; i < RING; i++) {
    const lx = -pierX + (i + 0.5) * ringStep;
    const seg = mesh(
      new THREE.BoxGeometry(ringStep * 1.15, 0.3, width * 0.9),
      pierMat,
      lx,
      deckYAt(lx) - 0.45,
      0
    );
    seg.rotation.z = slopeAt(lx);
    group.add(seg);
  }
  for (const ex of [-1, 1]) {
    const lx = ex * (half - 0.7);
    group.add(
      mesh(
        new THREE.BoxGeometry(1.8, 2.4, width * 0.98),
        pierMat,
        lx,
        deckYAt(lx) - 1.5,
        0
      )
    );
  }

  return { group, deckYAt, pierX };
}

// Village well: stone ring, A-frame posts, little roof, rope and bucket.
export function createWell() {
  const group = new THREE.Group();
  const stoneTex = makeStoneTexture(777, 3, 1);
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.6,
    roughness: 0.95,
  });
  const ring = mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.8, 16, 1, true), stoneMat, 0, 0.4, 0);
  ring.material.side = THREE.DoubleSide;
  const rim = mesh(new THREE.TorusGeometry(0.92, 0.1, 8, 20), stoneMat, 0, 0.82, 0);
  rim.rotation.x = Math.PI / 2;
  const water = mesh(
    new THREE.CircleGeometry(0.82, 20),
    mat(0x1c4657, { roughness: 0.1, metalness: 0, envMapIntensity: 1.4 }),
    0,
    0.35,
    0
  );
  water.rotation.x = -Math.PI / 2;

  const woodMat = mat(COLORS.woodDark, { roughness: 0.95, bumpMap: bumps().noise, bumpScale: 0.4 });
  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, 1.9, 8);
  group.add(mesh(postGeo, woodMat, -0.85, 1.3, 0));
  group.add(mesh(postGeo, woodMat, 0.85, 1.3, 0));
  const crossbar = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), woodMat, 0, 2.1, 0);
  crossbar.rotation.z = Math.PI / 2;
  group.add(crossbar);
  const roofTex = makeRoofTexture(778, 0x6d5638, 3, 1);
  const wellRoof = mesh(
    new THREE.ConeGeometry(1.35, 0.75, 4),
    new THREE.MeshStandardMaterial({ map: roofTex, bumpMap: roofTex, bumpScale: 0.4, roughness: 0.9 }),
    0,
    2.75,
    0
  );
  wellRoof.rotation.y = Math.PI / 4;
  const rope = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), mat(0xa8905e), 0, 1.65, 0);
  const bucket = mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.22, 10), woodMat, 0, 1.1, 0);

  group.add(ring, rim, water, wellRoof, rope, bucket);
  return group;
}

export function createCloud(rng) {
  const group = new THREE.Group();
  // Sunset-lit puffs: warm tint with a faint ember glow on the underside.
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf5cdae,
    emissive: 0xb45a2e,
    emissiveIntensity: 0.12,
    roughness: 1,
    transparent: true,
    opacity: 0.78,
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
