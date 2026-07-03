// Procedural low-poly builders for the medieval game world.
// Everything is generated from three.js primitives — no external 3D assets.

import * as THREE from "three";

export const COLORS = {
  grass: 0x5da24a,
  dirt: 0x8a6a44,
  trunk: 0x6b4a2f,
  leaf: 0x3f7d3a,
  leafDark: 0x2f6330,
  stone: 0x8d8d94,
  snow: 0xf4f6f8,
  wood: 0x9c7448,
  woodDark: 0x704e2c,
  cloth: 0xc9563c,
  steel: 0xb9c0c9,
  steelDark: 0x7d8792,
  gold: 0xd9a441,
  skin: 0xe8b98a,
  monster: 0x6faa3f,
  dragon: 0xb03a2e,
  dragonWing: 0xd97742,
  sail: 0xece2c8,
};

export function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.045) * Math.cos(z * 0.04) * 1.4 +
    Math.sin(z * 0.021 + 1.7) * 1.1 +
    Math.cos(x * 0.017 - 0.6) * 0.8
  );
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.05,
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

// Deterministic pseudo-random generator so the world is identical each visit.
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Text rendered to a canvas texture for signboards.
// ---------------------------------------------------------------------------
export function makeTextTexture(lines, options = {}) {
  const {
    width = 512,
    height = 256,
    background = "#4a3520",
    border = "#2c1e10",
    color = "#f5e6c8",
    accent = "#e8a13c",
    fontScale = 1,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = border;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, width - 14, height - 14);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

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
// Returns { group, panel } — panel is the clickable mesh.
// ---------------------------------------------------------------------------
export function createSignboard(title, subtitle) {
  const group = new THREE.Group();
  const postMat = mat(COLORS.woodDark);

  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.1, 6);
  group.add(mesh(postGeo, postMat, -1.05, 1.05, 0));
  group.add(mesh(postGeo, postMat, 1.05, 1.05, 0));

  const texture = makeTextTexture([
    { text: title, big: true },
    { text: subtitle, big: false },
    { text: "— click to open —", big: false },
  ]);
  const panelMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
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
// Characters. Each returns { group, update(t) } where update animates it.
// ---------------------------------------------------------------------------
export function createKnight({ tunic = COLORS.cloth, isPlayer = false } = {}) {
  const group = new THREE.Group();
  const steel = mat(COLORS.steel, { metalness: 0.5, roughness: 0.5 });
  const steelDark = mat(COLORS.steelDark, { metalness: 0.5, roughness: 0.55 });

  const body = mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.05, 8), steel, 0, 1.25, 0);
  const belt = mesh(new THREE.CylinderGeometry(0.45, 0.47, 0.16, 8), mat(tunic), 0, 0.86, 0);
  const head = mesh(new THREE.SphereGeometry(0.32, 10, 8), mat(COLORS.skin), 0, 2.05, 0);
  const helm = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.3, 8), steelDark, 0, 2.2, 0);
  const helmTop = mesh(new THREE.SphereGeometry(0.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), steelDark, 0, 2.32, 0);
  const plume = mesh(new THREE.ConeGeometry(0.09, 0.5, 6), mat(tunic), 0, 2.7, -0.05);

  const legGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.75, 6);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.75, 0);
  leftLeg.add(mesh(legGeo, steelDark, 0, -0.37, 0));
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.75, 0);
  rightLeg.add(mesh(legGeo, steelDark, 0, -0.37, 0));

  const armGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.52, 1.65, 0);
  leftArm.add(mesh(armGeo, steel, 0, -0.32, 0));
  const rightArm = new THREE.Group();
  rightArm.position.set(0.52, 1.65, 0);
  rightArm.add(mesh(armGeo, steel, 0, -0.32, 0));

  // Sword in the right hand.
  const sword = new THREE.Group();
  sword.position.set(0, -0.68, 0.1);
  sword.add(mesh(new THREE.BoxGeometry(0.06, 0.9, 0.14), steel, 0, 0.45, 0.18));
  sword.add(mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), mat(COLORS.gold, { metalness: 0.6 }), 0, 0.06, 0.18));
  sword.rotation.x = Math.PI / 2.4;
  rightArm.add(sword);

  // Shield on the left arm.
  const shield = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 8), mat(tunic), -0.12, -0.45, 0);
  shield.rotation.z = Math.PI / 2;
  leftArm.add(shield);

  group.add(body, belt, head, helm, helmTop, plume, leftLeg, rightLeg, leftArm, rightArm);

  const phase = Math.random() * Math.PI * 2;
  const parts = { leftLeg, rightLeg, leftArm, rightArm, body: group };

  const update = (t, walkSpeed = 0) => {
    if (isPlayer) {
      const swing = walkSpeed > 0.01 ? Math.sin(t * 9) * 0.55 * Math.min(walkSpeed, 1) : 0;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.7;
      rightArm.rotation.x = swing * 0.7;
    } else {
      // Idle: gentle sway and a slow sword salute.
      leftArm.rotation.x = Math.sin(t * 1.3 + phase) * 0.08;
      rightArm.rotation.x = -0.35 + Math.sin(t * 0.9 + phase) * 0.25;
    }
    plume.rotation.z = Math.sin(t * 2 + phase) * 0.15;
  };

  return { group, update, parts };
}

export function createVillager({ tunic = 0x7a6c9e } = {}) {
  const group = new THREE.Group();

  const body = mesh(new THREE.CylinderGeometry(0.38, 0.55, 1.15, 8), mat(tunic), 0, 1.15, 0);
  const head = mesh(new THREE.SphereGeometry(0.32, 10, 8), mat(COLORS.skin), 0, 2, 0);
  const hat = mesh(new THREE.ConeGeometry(0.5, 0.35, 8), mat(0xd9b45c), 0, 2.3, 0);
  const brim = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 8), mat(0xc9a24c), 0, 2.17, 0);

  const armGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.65, 6);
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.6, 0);
  leftArm.add(mesh(armGeo, mat(tunic), 0, -0.3, 0));
  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.6, 0);
  rightArm.add(mesh(armGeo, mat(tunic), 0, -0.3, 0));

  group.add(body, head, hat, brim, leftArm, rightArm);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    // Friendly wave with the right arm, light bounce.
    rightArm.rotation.z = -2.4 + Math.sin(t * 4 + phase) * 0.35;
    leftArm.rotation.x = Math.sin(t * 1.5 + phase) * 0.1;
    group.position.y = group.userData.baseY + Math.abs(Math.sin(t * 2.2 + phase)) * 0.06;
    head.rotation.y = Math.sin(t * 0.7 + phase) * 0.4;
  };

  return { group, update };
}

export function createMonster({ skin = COLORS.monster } = {}) {
  const group = new THREE.Group();
  const bodyMat = mat(skin);

  const body = mesh(new THREE.SphereGeometry(0.85, 10, 8), bodyMat, 0, 0.95, 0);
  body.scale.set(1, 0.92, 0.95);

  const eyeWhite = mat(0xffffff, { roughness: 0.4 });
  const eyeDark = mat(0x201a14, { roughness: 0.4 });
  for (const side of [-1, 1]) {
    group.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), eyeWhite, side * 0.3, 1.25, 0.68));
    group.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), eyeDark, side * 0.3, 1.25, 0.82));
    const horn = mesh(new THREE.ConeGeometry(0.12, 0.45, 6), mat(0xe8dcc0), side * 0.45, 1.75, 0);
    horn.rotation.z = -side * 0.5;
    group.add(horn);
    group.add(mesh(new THREE.SphereGeometry(0.22, 8, 6), bodyMat, side * 0.5, 0.22, 0.25));
  }
  // Toothy grin.
  for (let i = 0; i < 3; i++) {
    group.add(mesh(new THREE.ConeGeometry(0.06, 0.14, 4), eyeWhite, -0.2 + i * 0.2, 0.82, 0.78));
  }

  group.add(body);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    // Squash-and-stretch hop.
    const hop = Math.abs(Math.sin(t * 3 + phase));
    group.position.y = group.userData.baseY + hop * 0.45;
    const squash = 1 + (1 - hop) * 0.12;
    group.scale.set(squash, 2 - squash, squash);
  };

  return { group, update };
}

export function createDragon({ skin = COLORS.dragon, wing = COLORS.dragonWing } = {}) {
  const group = new THREE.Group();
  const bodyMat = mat(skin);
  const bellyMat = mat(0xe8c88f);

  const body = mesh(new THREE.SphereGeometry(1.5, 12, 10), bodyMat, 0, 2.6, 0);
  body.scale.set(1, 0.85, 1.5);
  const belly = mesh(new THREE.SphereGeometry(1.2, 10, 8), bellyMat, 0, 2.2, 0.35);
  belly.scale.set(0.8, 0.65, 1.15);

  const neck = mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.9, 8), bodyMat, 0, 3.9, 1.5);
  neck.rotation.x = 0.5;
  const head = new THREE.Group();
  head.position.set(0, 4.75, 2.15);
  head.add(mesh(new THREE.SphereGeometry(0.62, 10, 8), bodyMat));
  head.add(mesh(new THREE.BoxGeometry(0.55, 0.4, 0.9), bodyMat, 0, -0.1, 0.6));
  const eyeMat = mat(0xf5d442, { emissive: 0xf5d442, emissiveIntensity: 0.6 });
  head.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), eyeMat, -0.3, 0.15, 0.42));
  head.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), eyeMat, 0.3, 0.15, 0.42));
  for (const side of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.12, 0.6, 6), mat(0xe8dcc0), side * 0.28, 0.55, -0.25);
    horn.rotation.x = -0.5;
    head.add(horn);
  }

  const wingGeo = new THREE.ConeGeometry(1.15, 3.4, 3);
  const wingMat = mat(wing, { side: THREE.DoubleSide });
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.9, 3.3, 0);
  const leftWingMesh = mesh(wingGeo, wingMat, -1.6, 0, 0);
  leftWingMesh.rotation.z = Math.PI / 2;
  leftWingMesh.scale.set(1, 1, 0.12);
  leftWing.add(leftWingMesh);
  const rightWing = new THREE.Group();
  rightWing.position.set(0.9, 3.3, 0);
  const rightWingMesh = mesh(wingGeo, wingMat, 1.6, 0, 0);
  rightWingMesh.rotation.z = -Math.PI / 2;
  rightWingMesh.scale.set(1, 1, 0.12);
  rightWing.add(rightWingMesh);

  const tail = new THREE.Group();
  tail.position.set(0, 2.5, -1.5);
  let prev = tail;
  for (let i = 0; i < 4; i++) {
    const seg = mesh(
      new THREE.ConeGeometry(0.42 - i * 0.09, 1.1, 6),
      bodyMat,
      0,
      0,
      -0.55
    );
    seg.rotation.x = -Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.position.z = i === 0 ? 0 : -1;
    pivot.add(seg);
    prev.add(pivot);
    prev = pivot;
  }

  group.add(body, belly, neck, head, leftWing, rightWing, tail);

  const phase = Math.random() * Math.PI * 2;
  const update = (t) => {
    const flap = Math.sin(t * 3.2 + phase);
    leftWing.rotation.z = flap * 0.55 + 0.15;
    rightWing.rotation.z = -flap * 0.55 - 0.15;
    group.position.y = group.userData.baseY + Math.sin(t * 1.6 + phase) * 0.35 + 0.6;
    tail.rotation.y = Math.sin(t * 1.2 + phase) * 0.3;
    head.rotation.y = Math.sin(t * 0.6 + phase) * 0.35;
  };

  return { group, update };
}

export const CHARACTER_BUILDERS = {
  knight: () => createKnight({ tunic: 0x3d6db5 }),
  villager: createVillager,
  monster: createMonster,
  dragon: createDragon,
};

// ---------------------------------------------------------------------------
// Landmarks
// ---------------------------------------------------------------------------
export function createWindmill(labelLines) {
  const group = new THREE.Group();

  const tower = mesh(new THREE.CylinderGeometry(2.2, 3.4, 11, 8), mat(0xd8cdb6), 0, 5.5, 0);
  const roof = mesh(new THREE.ConeGeometry(2.8, 2.6, 8), mat(0x9c4a32), 0, 12.2, 0);
  group.add(tower, roof);

  // Door
  group.add(mesh(new THREE.BoxGeometry(1.2, 2, 0.3), mat(COLORS.woodDark), 0, 1.2, 3.15));

  // Rotating blades on the front face.
  const blades = new THREE.Group();
  blades.position.set(0, 10, 2.9);
  const bladeMat = mat(COLORS.sail, { side: THREE.DoubleSide });
  const armMat = mat(COLORS.woodDark);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    arm.add(mesh(new THREE.BoxGeometry(0.22, 4.6, 0.22), armMat, 0, 2.3, 0));
    arm.add(mesh(new THREE.BoxGeometry(1.3, 3.4, 0.08), bladeMat, 0.55, 2.7, 0));
    blades.add(arm);
  }
  const hub = mesh(new THREE.SphereGeometry(0.5, 8, 6), armMat);
  blades.add(hub);
  group.add(blades);

  // Sign mounted on the tower.
  const texture = makeTextTexture(
    labelLines.map((text) => ({ text, big: true })),
    { width: 512, height: 256, fontScale: 1.05 }
  );
  const signMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
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

export function createMountain(label) {
  const group = new THREE.Group();

  // Jagged main peak with two shoulders and snow caps.
  const rock = mat(COLORS.stone);
  const snow = mat(COLORS.snow, { roughness: 0.7 });

  const main = mesh(new THREE.ConeGeometry(34, 52, 9), rock, 0, 26, 0);
  main.rotation.y = 0.4;
  const cap = mesh(new THREE.ConeGeometry(13, 20, 9), snow, 0, 43, 0);
  cap.rotation.y = 0.4;
  const left = mesh(new THREE.ConeGeometry(20, 30, 8), rock, -26, 15, -6);
  left.rotation.y = 1.1;
  const leftCap = mesh(new THREE.ConeGeometry(7.5, 11, 8), snow, -26, 25, -6);
  leftCap.rotation.y = 1.1;
  const right = mesh(new THREE.ConeGeometry(17, 24, 8), rock, 24, 12, -4);
  right.rotation.y = 2.2;
  const rightCap = mesh(new THREE.ConeGeometry(6.5, 9, 8), snow, 24, 20, -4);
  rightCap.rotation.y = 2.2;
  group.add(main, cap, left, leftCap, right, rightCap);

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
  const bannerMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
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
    const pole = mesh(new THREE.CylinderGeometry(0.18, 0.24, 5, 6), trim, side * 17.5, 21.5, 22.2);
    const flame = mesh(
      new THREE.ConeGeometry(0.65, 1.6, 6),
      mat(0xffa028, { emissive: 0xff8c1a, emissiveIntensity: 1.4 }),
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

  return { group, sign, mountainMeshes: [main, left, right], update };
}

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------
export function createTree(rng) {
  const group = new THREE.Group();
  const height = 2.2 + rng() * 2.2;
  group.add(mesh(new THREE.CylinderGeometry(0.18, 0.28, height, 6), mat(COLORS.trunk), 0, height / 2, 0));
  const leafMat = mat(rng() > 0.5 ? COLORS.leaf : COLORS.leafDark);
  let radius = 1.5 + rng() * 0.7;
  let y = height + 0.2;
  for (let i = 0; i < 3; i++) {
    group.add(mesh(new THREE.ConeGeometry(radius, 1.9, 7), leafMat, 0, y, 0));
    radius *= 0.72;
    y += 1.05;
  }
  return group;
}

export function createHouse(rng) {
  const group = new THREE.Group();
  const w = 3 + rng() * 1.5;
  const d = 2.6 + rng() * 1.2;
  const h = 2.2 + rng() * 0.6;
  group.add(mesh(new THREE.BoxGeometry(w, h, d), mat(0xdcd0b8), 0, h / 2, 0));
  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.8, 4), mat(0x9c4a32), 0, h + 0.9, 0);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);
  group.add(mesh(new THREE.BoxGeometry(0.7, 1.3, 0.15), mat(COLORS.woodDark), 0, 0.65, d / 2 + 0.02));
  return group;
}

export function createCloud(rng) {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    flatShading: true,
    roughness: 1,
    transparent: true,
    opacity: 0.92,
  });
  const puffs = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < puffs; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + rng() * 1.6, 8, 6), cloudMat);
    puff.position.set(i * 2.2 - puffs, rng() * 0.8, rng() * 1.6 - 0.8);
    puff.scale.y = 0.55;
    group.add(puff);
  }
  return group;
}

export function createRock(rng) {
  const rock = mesh(
    new THREE.DodecahedronGeometry(0.5 + rng() * 0.9, 0),
    mat(COLORS.stone)
  );
  rock.scale.y = 0.7;
  return rock;
}
