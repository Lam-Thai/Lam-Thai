"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  MILESTONES,
  LANDMARKS,
  WORLD_RADIUS,
  PLAYER_SPAWN,
} from "@/lib/game-data";
import {
  CHARACTER_BUILDERS,
  createCloud,
  createHouse,
  createKnight,
  createMountain,
  createRock,
  createRng,
  createSignboard,
  createTree,
  createWindmill,
  terrainHeight,
} from "./world";

const SKY_COLOR = 0x9ecbe8;
const WALK_SPEED = 9;
const RUN_SPEED = 15;
const MOUNTAIN_KEEP_OUT = 38;

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
    scene.background = new THREE.Color(SKY_COLOR);
    scene.fog = new THREE.Fog(SKY_COLOR, 70, 280);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      600
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // --------------------------------------------------------------- lights
    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6a3a, 0.9));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
    sun.position.set(60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -130;
    sun.shadow.camera.right = 130;
    sun.shadow.camera.top = 130;
    sun.shadow.camera.bottom = -130;
    sun.shadow.camera.far = 300;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    // -------------------------------------------------------------- terrain
    const groundGeo = new THREE.PlaneGeometry(360, 360, 96, 96);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({
        color: 0x5da24a,
        flatShading: true,
        roughness: 1,
      })
    );
    ground.receiveShadow = true;
    scene.add(ground);

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

    // ---------------------------------------------------- milestone characters
    for (const milestone of MILESTONES) {
      const build = CHARACTER_BUILDERS[milestone.character];
      if (!build) continue;
      const [x, z] = milestone.position;

      const npc = build();
      placeOnGround(npc.group, x, z);
      npc.group.userData.baseY = npc.group.position.y;
      // Face the world center where the player roams.
      npc.group.rotation.y = Math.atan2(-x, -z) + Math.PI;
      scene.add(npc.group);
      updaters.push(npc.update);

      // Signboard between the character and the center of the map.
      const toCenter = Math.atan2(-x, -z);
      const signDistance = milestone.character === "dragon" ? 5 : 2.6;
      const signX = x + Math.sin(toCenter) * signDistance;
      const signZ = z + Math.cos(toCenter) * signDistance;
      const board = createSignboard(milestone.title, milestone.subtitle);
      placeOnGround(board.group, signX, signZ);
      board.group.rotation.y = toCenter;
      scene.add(board.group);
      registerInteractable(board.panel, {
        href: milestone.href,
        title: milestone.title,
      });
    }

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

    // --------------------------------------------------------------- scenery
    const rng = createRng(20260703);
    const keepOut = [
      ...MILESTONES.map((m) => ({ x: m.position[0], z: m.position[1], r: 7 })),
      { x: wx, z: wz, r: 10 },
      { x: mx, z: mz, r: 46 },
      { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1], r: 8 },
    ];
    const isClear = (x, z) =>
      keepOut.every((k) => (x - k.x) ** 2 + (z - k.z) ** 2 > k.r * k.r);

    for (let i = 0; i < 70; i++) {
      const x = (rng() - 0.5) * 2 * (WORLD_RADIUS - 6);
      const z = (rng() - 0.5) * 2 * (WORLD_RADIUS - 6);
      if (!isClear(x, z)) continue;
      const tree = createTree(rng);
      placeOnGround(tree, x, z, -0.1);
      tree.rotation.y = rng() * Math.PI * 2;
      scene.add(tree);
    }
    for (let i = 0; i < 14; i++) {
      const x = (rng() - 0.5) * 2 * (WORLD_RADIUS - 10);
      const z = (rng() - 0.5) * 2 * (WORLD_RADIUS - 10);
      if (!isClear(x, z)) continue;
      const rock = createRock(rng);
      placeOnGround(rock, x, z, 0.1);
      scene.add(rock);
    }
    // A little hamlet near the spawn to sell the medieval vibe.
    for (const [hx, hz] of [
      [-8, 16],
      [9, 18],
      [-20, -6],
      [22, -4],
    ]) {
      const house = createHouse(rng);
      placeOnGround(house, hx, hz);
      house.rotation.y = Math.atan2(-hx, -hz);
      scene.add(house);
    }

    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const cloud = createCloud(rng);
      cloud.position.set(
        (rng() - 0.5) * 320,
        34 + rng() * 16,
        (rng() - 0.5) * 320
      );
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
    };

    // ---------------------------------------------------------------- camera
    // yaw 0 puts the camera south of the knight, looking north into the world.
    const cameraState = { yaw: 0, pitch: 0.42, dist: 13 };
    const cameraPos = new THREE.Vector3();
    const cameraTarget = new THREE.Vector3();

    const updateCamera = (delta) => {
      const py = terrainHeight(playerState.x, playerState.z);
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
        // Keep the player off the mountain itself.
        const mdx = nx - mx;
        const mdz = nz - mz;
        const mDist = Math.hypot(mdx, mdz);
        if (mDist < MOUNTAIN_KEEP_OUT && mDist > 0.001) {
          nx = mx + (mdx / mDist) * MOUNTAIN_KEEP_OUT;
          nz = mz + (mdz / mDist) * MOUNTAIN_KEEP_OUT;
        }

        playerState.x = nx;
        playerState.z = nz;
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
        terrainHeight(playerState.x, playerState.z) +
          (playerState.walk > 0.05 ? Math.abs(Math.sin(t * 9)) * 0.12 : 0),
        playerState.z
      );
      player.group.rotation.y = playerState.yaw;
      player.update(t, playerState.walk);

      // --- world animation --------------------------------------------------
      for (const update of updaters) update(t, delta);
      for (const cloud of clouds) {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > 180) cloud.position.x = -180;
      }

      updateCamera(delta);
      renderer.render(scene, camera);
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
        if (object.isMesh) {
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
