// Lightweight XZ-plane collision for the game world.
// Solid props register once at build time as circles or yaw-rotated boxes;
// each frame the player (a circle) is pushed out of anything it overlaps.
// Per-collider push-out makes the player slide along walls instead of
// stopping dead, which suits the exploratory feel of the world.

const EPSILON = 1e-6;

export function createColliderSet() {
  const circles = [];
  const boxes = [];

  const addCircle = (x, z, radius) => {
    if (!(radius > 0)) return;
    circles.push({ x, z, r: radius });
  };

  // halfWidth/halfDepth are half-extents in the box's local frame;
  // yaw matches the object's rotation.y.
  const addBox = (x, z, halfWidth, halfDepth, yaw = 0) => {
    if (!(halfWidth > 0) || !(halfDepth > 0)) return;
    boxes.push({
      x,
      z,
      hw: halfWidth,
      hd: halfDepth,
      cos: Math.cos(yaw),
      sin: Math.sin(yaw),
    });
  };

  // Returns the corrected position for a player circle of `radius` at (x, z).
  // A few relaxation passes settle spots where colliders touch (e.g. a tree
  // beside a house) so one push can't shove the player into a neighbour.
  const resolve = (x, z, radius) => {
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;

      for (const c of circles) {
        const dx = x - c.x;
        const dz = z - c.z;
        const minDist = c.r + radius;
        const distSq = dx * dx + dz * dz;
        if (distSq >= minDist * minDist) continue;
        const dist = Math.sqrt(distSq);
        if (dist > EPSILON) {
          x = c.x + (dx / dist) * minDist;
          z = c.z + (dz / dist) * minDist;
        } else {
          // Dead centre: pick an arbitrary exit direction.
          x = c.x + minDist;
        }
        moved = true;
      }

      for (const b of boxes) {
        // World -> box-local (inverse of a three.js rotation.y = yaw).
        const wx = x - b.x;
        const wz = z - b.z;
        const lx = wx * b.cos - wz * b.sin;
        const lz = wx * b.sin + wz * b.cos;

        const qx = Math.max(-b.hw, Math.min(b.hw, lx));
        const qz = Math.max(-b.hd, Math.min(b.hd, lz));

        let ox;
        let oz;
        if (qx === lx && qz === lz) {
          // Centre is inside the box: exit through the nearest face.
          ox = lx;
          oz = lz;
          if (b.hw - Math.abs(lx) < b.hd - Math.abs(lz)) {
            ox = lx >= 0 ? b.hw + radius : -(b.hw + radius);
          } else {
            oz = lz >= 0 ? b.hd + radius : -(b.hd + radius);
          }
        } else {
          const dx = lx - qx;
          const dz = lz - qz;
          const distSq = dx * dx + dz * dz;
          if (distSq >= radius * radius) continue;
          const dist = Math.sqrt(distSq) || EPSILON;
          ox = qx + (dx / dist) * radius;
          oz = qz + (dz / dist) * radius;
        }

        // Box-local -> world.
        x = b.x + ox * b.cos + oz * b.sin;
        z = b.z - ox * b.sin + oz * b.cos;
        moved = true;
      }

      if (!moved) break;
    }
    return { x, z };
  };

  return { addCircle, addBox, resolve };
}
