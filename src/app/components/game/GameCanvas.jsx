"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  MILESTONES,
  LANDMARKS,
  WORLD_RADIUS,
  PLAYER_SPAWN,
} from "@/lib/game-data";
import {
  CHARACTER_BUILDERS,
  createBridge,
  createCloud,
  createHouse,
  createKnight,
  createMountain,
  createRock,
  createSignboard,
  createWell,
  createWindmill,
} from "./world";
import {
  createRng,
  terrainHeight,
  distanceToWater,
  buildTerrainMesh,
} from "./terrain";
import {
  setupSky,
  createRiverWater,
  createWaterfall,
  createVegetation,
  createButterflies,
  createBirds,
  createFireflies,
} from "./environment";
import { createColliderSet } from "./collision";

// Warm golden-hour haze.
const FOG_COLOR = 0xd9a077;
const WALK_SPEED = 9;
const RUN_SPEED = 15;
const MOUNTAIN_KEEP_OUT = 38;
const PLAYER_RADIUS = 0.45;
// Body footprint per character type, for collision.
const CHARACTER_RADII = { knight: 0.7, villager: 0.65, monster: 1.05, dragon: 2.3 };

/**
 * Imperative three.js scene wrapped in a React component.
 *
 * Props:
 * - onInteract({ href, title }): fired when the player clicks a signboard,
 *   the windmill, or the Contact mountain.
 * - inputRef: mutable ref shared with the on-screen D-pad
 *   ({ forward, back, left, right, run }).
 * - pausedRef: mutable ref; while true, keyboard/pointer input is ignored
 *   (a popup is open) but ambient animation keeps running.
 */
export default function GameCanvas({ onInteract, inputRef, pausedRef }) {
  const containerRef = useRef(null);
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // ---------------------------------------------------------------- scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_COLOR, 80, 340);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      4000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.42;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // -------------------------------------------- sky, IBL ambient + lights
    const sky = setupSky(renderer, scene);

    // Dusky ambient: mauve sky bounce over shadowed ground.
    scene.add(new THREE.HemisphereLight(0xb78a72, 0x3a4030, 0.3));
    // Low, warm sun.
    const sun = new THREE.DirectionalLight(0xff9e58, 1.7);
    sun.position.copy(sky.sunDir).multiplyScalar(120);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -140;
    sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140;
    sun.shadow.camera.bottom = -140;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 3;
    scene.add(sun);

    // ------------------------------------------------------ post-processing
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.14,
      0.5,
      0.88
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // -------------------------------------------------------------- terrain
    const ground = buildTerrainMesh();
    scene.add(ground);

    // ------------------------------------------------------ water + wildlife
    const river = createRiverWater();
    scene.add(river.group);
    const waterfall = createWaterfall();
    scene.add(waterfall.group);
    const butterflies = createButterflies();
    scene.add(butterflies.group);
    const birds = createBirds();
    scene.add(birds.group);
    const fireflies = createFireflies();
    scene.add(fireflies.group);

    const placeOnGround = (object, x, z, lift = 0) => {
      object.position.set(x, terrainHeight(x, z) + lift, z);
    };

    // ------------------------------------------------- interactable registry
    const interactables = [];
    const registerInteractable = (object, payload) => {
      // traverse() visits the object itself as well as all descendants.
      object.traverse((child) => {
        if (child.isMesh) {
          child.userData.interact = payload;
          interactables.push(child);
        }
      });
    };

    // Animated entities: fn(elapsedTime, delta)
    const updaters = [];

    // Solid props the player cannot walk through (characters, buildings,
    // trees, rocks…). Registered once as the world is built.
    const colliders = createColliderSet();

    // ---------------------------------------------------- milestone characters
    MILESTONES.forEach((milestone, index) => {
      const build = CHARACTER_BUILDERS[milestone.character];
      if (!build) return;
      const [x, z] = milestone.position;
      const toCenter = Math.atan2(-x, -z);

      // Signboard at the milestone spot, facing the approaching player.
      const board = createSignboard(milestone.title, milestone.subtitle);
      placeOnGround(board.group, x, z);
      board.group.rotation.y = toCenter;
      scene.add(board.group);
      registerInteractable(board.panel, {
        href: milestone.href,
        title: milestone.title,
      });
      // Posts sit at local x = ±1.05 under a 2.6-wide panel.
      colliders.addBox(x, z, 1.35, 0.3, toCenter);

      // Character stands beside the board (alternating sides), facing the
      // same way as the sign — like a herald presenting their quest.
      const side = index % 2 === 0 ? 1 : -1;
      const gap = milestone.character === "dragon" ? 4.6 : 2.4;
      const nx = x + Math.sin(toCenter + (Math.PI / 2) * side) * gap;
      const nz = z + Math.cos(toCenter + (Math.PI / 2) * side) * gap;
      const npc = build(index + 1);
      placeOnGround(npc.group, nx, nz);
      npc.group.userData.baseY = npc.group.position.y;
      npc.group.rotation.y = toCenter;
      npc.group.userData.homeYaw = toCenter;
      scene.add(npc.group);
      updaters.push(npc.update);
      colliders.addCircle(nx, nz, CHARACTER_RADII[milestone.character] ?? 0.8);
    });

    // -------------------------------------------------------------- windmill
    const windmill = createWindmill(LANDMARKS.windmill.label.split("\n"));
    const [wx, wz] = LANDMARKS.windmill.position;
    placeOnGround(windmill.group, wx, wz);
    windmill.group.rotation.y = Math.atan2(-wx, -wz);
    scene.add(windmill.group);
    updaters.push(windmill.update);
    registerInteractable(windmill.group, {
      href: LANDMARKS.windmill.href,
      title: LANDMARKS.windmill.title,
    });
    // Tower base is 3.4 wide; keep clear of the door/sign side too.
    colliders.addCircle(wx, wz, 3.7);

    // -------------------------------------------------------------- mountain
    const mountain = createMountain(LANDMARKS.mountain.label);
    const [mx, mz] = LANDMARKS.mountain.position;
    placeOnGround(mountain.group, mx, mz, -1.5);
    scene.add(mountain.group);
    updaters.push(mountain.update);
    registerInteractable(mountain.group, {
      href: LANDMARKS.mountain.href,
      title: LANDMARKS.mountain.title,
    });
    colliders.addCircle(mx, mz, MOUNTAIN_KEEP_OUT);

    // ---------------------------------------------------------------- bridge
    // Stone arch bridge over the river ford toward the western knight.
    // The deck runs along local x, perpendicular to the river's flow at the
    // crossing.
    const bridgeSpanDir = new THREE.Vector2(22, -5).normalize();
    const BRIDGE_POS = { x: -30.3, z: -16 };
    const BRIDGE_HALF_SPAN = 7.5;
    const BRIDGE_HALF_WIDTH = 1.7;
    const bridgeYaw = Math.atan2(-bridgeSpanDir.y, bridgeSpanDir.x);
    const bridgeCos = Math.cos(bridgeYaw);
    const bridgeSin = Math.sin(bridgeYaw);
    const bridgeEndA = {
      x: BRIDGE_POS.x + bridgeSpanDir.x * BRIDGE_HALF_SPAN,
      z: BRIDGE_POS.z + bridgeSpanDir.y * BRIDGE_HALF_SPAN,
    };
    const bridgeEndB = {
      x: BRIDGE_POS.x - bridgeSpanDir.x * BRIDGE_HALF_SPAN,
      z: BRIDGE_POS.z - bridgeSpanDir.y * BRIDGE_HALF_SPAN,
    };
    const bridgeEndAY = terrainHeight(bridgeEndA.x, bridgeEndA.z);
    const bridgeEndBY = terrainHeight(bridgeEndB.x, bridgeEndB.z);
    const bridgeBaseY = (bridgeEndAY + bridgeEndBY) / 2;
    const bridge = createBridge({
      span: BRIDGE_HALF_SPAN * 2,
      width: BRIDGE_HALF_WIDTH * 2,
      arch: 1.2,
      tilt: (bridgeEndAY - bridgeEndBY) / 2,
    });
    bridge.group.position.set(BRIDGE_POS.x, bridgeBaseY, BRIDGE_POS.z);
    bridge.group.rotation.y = bridgeYaw;
    scene.add(bridge.group);
    const bridgeDeckWorldY = (lx) => bridgeBaseY + bridge.deckYAt(lx);

    // --------------------------------------------------------------- scenery
    const rng = createRng(20260703);
    const keepOut = [
      // bridge approaches
      { x: bridgeEndA.x, z: bridgeEndA.z, r: 3.2 },
      { x: bridgeEndB.x, z: bridgeEndB.z, r: 3.2 },
      ...MILESTONES.map((m) => ({ x: m.position[0], z: m.position[1], r: 7 })),
      { x: wx, z: wz, r: 10 },
      { x: mx, z: mz, r: 46 },
      { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1], r: 8 },
      // hamlet houses + well (placed below)
      { x: -8, z: 16, r: 5 },
      { x: 9, z: 18, r: 5 },
      { x: -20, z: -6, r: 5 },
      { x: 22, z: -4, r: 5 },
      { x: 6, z: 9, r: 4 },
    ];
    const isClear = (x, z) =>
      keepOut.every((k) => (x - k.x) ** 2 + (z - k.z) ** 2 > k.r * k.r);

    const vegetation = createVegetation(
      isClear,
      WORLD_RADIUS - 6,
      colliders.addCircle
    );
    scene.add(vegetation.group);
    updaters.push(
      vegetation.update,
      river.update,
      waterfall.update,
      butterflies.update,
      birds.update,
      fireflies.update
    );

    // Village well beside the trail.
    const well = createWell();
    placeOnGround(well, 6, 9);
    well.rotation.y = 0.6;
    scene.add(well);
    colliders.addCircle(6, 9, 1.15);

    const footprint = new THREE.Box3();
    for (let i = 0; i < 16; i++) {
      const x = (rng() - 0.5) * 2 * (WORLD_RADIUS - 10);
      const z = (rng() - 0.5) * 2 * (WORLD_RADIUS - 10);
      if (!isClear(x, z) || distanceToWater(x, z) < 3) continue;
      const rock = createRock(rng);
      footprint.setFromObject(rock);
      placeOnGround(rock, x, z, 0.1);
      scene.add(rock);
      colliders.addCircle(
        x,
        z,
        Math.max(
          footprint.max.x - footprint.min.x,
          footprint.max.z - footprint.min.z
        ) * 0.42
      );
    }

    // A little hamlet near the spawn to sell the medieval vibe.
    for (const [hx, hz] of [
      [-8, 16],
      [9, 18],
      [-20, -6],
      [22, -4],
    ]) {
      const house = createHouse(rng);
      // Measure while still axis-aligned at the origin, then register an
      // oriented box matching the final yaw.
      footprint.setFromObject(house);
      placeOnGround(house, hx, hz);
      house.rotation.y = Math.atan2(-hx, -hz);
      scene.add(house);
      colliders.addBox(
        hx,
        hz,
        (footprint.max.x - footprint.min.x) / 2,
        (footprint.max.z - footprint.min.z) / 2,
        house.rotation.y
      );
    }

    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const cloud = createCloud(rng);
      cloud.position.set(
        (rng() - 0.5) * 320,
        42 + rng() * 20,
        (rng() - 0.5) * 320
      );
      cloud.scale.setScalar(1.3 + rng() * 0.9);
      cloud.userData.speed = 0.9 + rng() * 1.3;
      scene.add(cloud);
      clouds.push(cloud);
    }

    // ---------------------------------------------------------------- player
    const player = createKnight({ tunic: 0xc9563c, isPlayer: true });
    placeOnGround(player.group, PLAYER_SPAWN[0], PLAYER_SPAWN[1]);
    scene.add(player.group);

    const playerState = {
      x: PLAYER_SPAWN[0],
      z: PLAYER_SPAWN[1],
      yaw: Math.PI, // face the world (negative z)
      walk: 0,
      groundY: terrainHeight(PLAYER_SPAWN[0], PLAYER_SPAWN[1]),
    };

    // ---------------------------------------------------------------- camera
    // yaw 0 puts the camera south of the knight, looking north into the world.
    const cameraState = { yaw: 0, pitch: 0.42, dist: 13 };
    const cameraPos = new THREE.Vector3();
    const cameraTarget = new THREE.Vector3();

    const updateCamera = (delta) => {
      const py = playerState.groundY;
      const { yaw, pitch, dist } = cameraState;
      const horiz = Math.cos(pitch) * dist;
      cameraPos.set(
        playerState.x + Math.sin(yaw) * horiz,
        py + Math.sin(pitch) * dist + 2,
        playerState.z + Math.cos(yaw) * horiz
      );
      // Keep the camera above the terrain.
      const camGround = terrainHeight(cameraPos.x, cameraPos.z);
      if (cameraPos.y < camGround + 1.5) cameraPos.y = camGround + 1.5;
      camera.position.lerp(cameraPos, Math.min(1, delta * 6));
      cameraTarget.set(playerState.x, py + 2.2, playerState.z);
      camera.lookAt(cameraTarget);
    };
    // Snap the camera to its start position on the first frame.
    updateCamera(10);

    // ----------------------------------------------------------------- input
    const keys = inputRef.current;
    const KEYMAP = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "back",
      ArrowDown: "back",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      ShiftLeft: "run",
      ShiftRight: "run",
    };

    const isTypingTarget = (event) => {
      const tag = event.target?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
    };

    const onKeyDown = (event) => {
      if (pausedRef.current || isTypingTarget(event)) return;
      const action = KEYMAP[event.code];
      if (!action) return;
      event.preventDefault();
      keys[action] = true;
    };
    const onKeyUp = (event) => {
      const action = KEYMAP[event.code];
      if (action) keys[action] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Pointer: drag to orbit, plain click/tap to interact.
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const drag = { active: false, moved: false, x: 0, y: 0, id: null };

    const canvas = renderer.domElement;

    const onPointerDown = (event) => {
      if (pausedRef.current) return;
      drag.active = true;
      drag.moved = false;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.id = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!drag.active || event.pointerId !== drag.id) {
        updateHoverCursor(event);
        return;
      }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && dx * dx + dy * dy < 36) return;
      drag.moved = true;
      cameraState.yaw -= dx * 0.0055;
      cameraState.pitch = THREE.MathUtils.clamp(
        cameraState.pitch + dy * 0.0035,
        0.12,
        1.15
      );
      drag.x = event.clientX;
      drag.y = event.clientY;
    };

    const raycastFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      return hits.length > 0 ? hits[0].object.userData.interact : null;
    };

    const onPointerUp = (event) => {
      if (!drag.active || event.pointerId !== drag.id) return;
      const wasClick = !drag.moved;
      drag.active = false;
      drag.id = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      if (!wasClick || pausedRef.current) return;
      const payload = raycastFromEvent(event);
      if (payload) onInteractRef.current?.(payload);
    };

    let lastHoverCheck = 0;
    const updateHoverCursor = (event) => {
      const now = performance.now();
      if (now - lastHoverCheck < 90) return;
      lastHoverCheck = now;
      canvas.style.cursor = raycastFromEvent(event) ? "pointer" : "grab";
    };

    const onWheel = (event) => {
      event.preventDefault();
      cameraState.dist = THREE.MathUtils.clamp(
        cameraState.dist + event.deltaY * 0.012,
        6,
        28
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ------------------------------------------------------------ game loop
    const timer = new THREE.Timer();
    const moveDir = new THREE.Vector3();
    let rafId = 0;

    const step = () => {
      rafId = requestAnimationFrame(step);
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.1);
      const t = timer.getElapsed();

      // --- movement -------------------------------------------------------
      let fz = 0;
      let fx = 0;
      if (!pausedRef.current) {
        fz = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
        fx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      }
      const moving = fz !== 0 || fx !== 0;
      if (moving) {
        const yaw = cameraState.yaw;
        // Camera-relative forward/right on the ground plane.
        moveDir
          .set(
            -Math.sin(yaw) * fz + Math.cos(yaw) * fx,
            0,
            -Math.cos(yaw) * fz - Math.sin(yaw) * fx
          )
          .normalize();
        const speed = keys.run ? RUN_SPEED : WALK_SPEED;
        let nx = playerState.x + moveDir.x * speed * delta;
        let nz = playerState.z + moveDir.z * speed * delta;

        // World boundary.
        const fromCenter = Math.hypot(nx, nz);
        if (fromCenter > WORLD_RADIUS - 4) {
          const scale = (WORLD_RADIUS - 4) / fromCenter;
          nx *= scale;
          nz *= scale;
        }
        // Push out of solid props (characters, buildings, trees, the
        // mountain…) so the player slides along them instead of clipping.
        const resolved = colliders.resolve(nx, nz, PLAYER_RADIUS);
        nx = resolved.x;
        nz = resolved.z;

        // Bridge: walk over the deck, wade under the main arch bay — but
        // never through the stonework. Whichever surface (deck or terrain)
        // is closer to the player's current ground height wins, so passing
        // under the arch never teleports them on top; a small step-up rule
        // makes boarding at the low ends reliable.
        let groundY = terrainHeight(nx, nz);
        const bdx = nx - BRIDGE_POS.x;
        const bdz = nz - BRIDGE_POS.z;
        const blx = bdx * bridgeCos - bdz * bridgeSin;
        let blz = bdx * bridgeSin + bdz * bridgeCos;
        if (
          Math.abs(blx) < BRIDGE_HALF_SPAN &&
          Math.abs(blz) < BRIDGE_HALF_WIDTH + PLAYER_RADIUS
        ) {
          const deckY = bridgeDeckWorldY(blx);
          const stepUp = deckY - groundY;
          const onDeck =
            stepUp <= 0.9 ||
            Math.abs(deckY - playerState.groundY) <=
              Math.abs(groundY - playerState.groundY);
          if (onDeck) {
            groundY = deckY;
            // Parapets: keep the player from stepping off the side.
            const railLimit = BRIDGE_HALF_WIDTH - 0.45;
            const clamped = THREE.MathUtils.clamp(blz, -railLimit, railLimit);
            if (clamped !== blz) {
              blz = clamped;
              nx = BRIDGE_POS.x + blx * bridgeCos + blz * bridgeSin;
              nz = BRIDGE_POS.z - blx * bridgeSin + blz * bridgeCos;
            }
          } else {
            // Below deck level: solid stone unless this is the arch bay
            // (enough headroom, clear of the piers).
            let solidCx = null;
            let solidHx = 0;
            if (stepUp < 2.2) {
              solidCx = 0; // low-clearance slice: the whole span blocks
              solidHx = BRIDGE_HALF_SPAN;
            } else if (
              Math.abs(Math.abs(blx) - bridge.pierX) <
              0.65 + PLAYER_RADIUS
            ) {
              solidCx = Math.sign(blx) * bridge.pierX;
              solidHx = 0.65;
            }
            if (solidCx !== null) {
              // Push out through the nearest face, in bridge-local space.
              const dx = blx - solidCx;
              const px = solidHx + PLAYER_RADIUS - Math.abs(dx);
              const pz = BRIDGE_HALF_WIDTH + PLAYER_RADIUS - Math.abs(blz);
              let outLx = blx;
              if (px < pz) {
                outLx = solidCx + Math.sign(dx || 1) * (solidHx + PLAYER_RADIUS);
              } else {
                blz = Math.sign(blz || 1) * (BRIDGE_HALF_WIDTH + PLAYER_RADIUS);
              }
              nx = BRIDGE_POS.x + outLx * bridgeCos + blz * bridgeSin;
              nz = BRIDGE_POS.z - outLx * bridgeSin + blz * bridgeCos;
              groundY = terrainHeight(nx, nz);
            }
          }
        }

        playerState.x = nx;
        playerState.z = nz;
        playerState.groundY = groundY;
        const targetYaw = Math.atan2(moveDir.x, moveDir.z);
        let dyaw = targetYaw - playerState.yaw;
        while (dyaw > Math.PI) dyaw -= Math.PI * 2;
        while (dyaw < -Math.PI) dyaw += Math.PI * 2;
        playerState.yaw += dyaw * Math.min(1, delta * 12);
        playerState.walk = Math.min(1, playerState.walk + delta * 6);
      } else {
        playerState.walk = Math.max(0, playerState.walk - delta * 8);
      }

      player.group.position.set(
        playerState.x,
        playerState.groundY +
          (playerState.walk > 0.05 ? Math.abs(Math.sin(t * 9)) * 0.12 : 0),
        playerState.z
      );
      player.group.rotation.y = playerState.yaw;
      player.update(t, playerState.walk);

      // --- world animation --------------------------------------------------
      // NPC updates receive the player position for look-at behaviour.
      for (const update of updaters) update(t, delta, player.group.position);
      for (const cloud of clouds) {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > 180) cloud.position.x = -180;
      }

      updateCamera(delta);
      composer.render(delta);
    };

    const startLoop = () => {
      if (!rafId) {
        timer.reset(); // discard time spent hidden
        rafId = requestAnimationFrame(step);
      }
    };
    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    startLoop();

    // ---------------------------------------------------------------- resize
    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      composer.setSize(clientWidth, clientHeight);
    });
    resizeObserver.observe(container);

    // --------------------------------------------------------------- cleanup
    return () => {
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);

      scene.traverse((object) => {
        if (object.isMesh || object.isPoints) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const material of materials) {
            material?.map?.dispose();
            material?.dispose();
          }
        }
      });
      sky.dispose();
      composer.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // The scene is built once; props are consumed through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="3D adventure world. Use WASD or arrow keys to move, drag to look around, click signs to open project details."
      role="application"
    />
  );
}
