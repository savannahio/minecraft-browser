import * as THREE from './three.module.js';
import { createNoise } from './noise.js';
import { AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, WATER, BEDROCK, BLOCKS, NUM_TILES, isOpaque } from './blocks.js';

export const CHUNK = 16, HEIGHT = 64, WORLD_CHUNKS = 10, SIZE = CHUNK * WORLD_CHUNKS, WATER_LEVEL = 20;

const FACES = [
  { dir: [-1, 0, 0], shade: 0.8, tile: 1, c: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
  { dir: [1, 0, 0], shade: 0.8, tile: 1, c: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
  { dir: [0, -1, 0], shade: 0.55, tile: 2, c: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
  { dir: [0, 1, 0], shade: 1.0, tile: 0, c: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
  { dir: [0, 0, -1], shade: 0.7, tile: 1, c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
  { dir: [0, 0, 1], shade: 0.9, tile: 1, c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
];

export class World {
  constructor(scene, atlasTex, seed = 2026) {
    this.scene = scene;
    this.data = new Uint8Array(SIZE * SIZE * HEIGHT);
    this.meshes = new Map();
    this.solidMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, alphaTest: 0.5 });
    this.waterMat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
    this.generate(seed);
  }
  idx(x, y, z) { return (y * SIZE + z) * SIZE + x; }
  inBounds(x, y, z) { return x >= 0 && z >= 0 && y >= 0 && x < SIZE && z < SIZE && y < HEIGHT; }
  get(x, y, z) { return this.inBounds(x, y, z) ? this.data[this.idx(x, y, z)] : AIR; }
  setRaw(x, y, z, v) { if (this.inBounds(x, y, z)) this.data[this.idx(x, y, z)] = v; }
  heightAt(x, z) { for (let y = HEIGHT - 1; y >= 0; y--) { const b = this.get(x, y, z); if (b !== AIR && b !== LEAVES) return y; } return 0; }

  generate(seed) {
    const n = createNoise(seed);
    const heights = new Int16Array(SIZE * SIZE);
    for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
      const base = n.fbm2(x / 90, z / 90, 4) * 18;
      const hills = Math.max(0, n.fbm2(x / 40 + 100, z / 40, 3)) * 22;
      const h = Math.max(3, Math.min(HEIGHT - 10, Math.floor(WATER_LEVEL + 2 + base + hills)));
      heights[z * SIZE + x] = h;
      for (let y = 0; y <= Math.max(h, WATER_LEVEL); y++) {
        let b;
        if (y === 0) b = BEDROCK;
        else if (y > h) b = WATER;
        else if (y === h) b = h <= WATER_LEVEL + 1 ? SAND : GRASS;
        else if (y > h - 4) b = h <= WATER_LEVEL + 1 ? SAND : DIRT;
        else b = STONE;
        // 3D-noise caves (keep a crust under water to avoid draining)
        if (y > 1 && b !== WATER && b !== BEDROCK && !(h <= WATER_LEVEL && y > h - 3)) {
          const c = n.noise3(x / 18, y / 12, z / 18) + 0.5 * n.noise3(x / 8, y / 8, z / 8);
          if (c > 0.42) b = AIR;
        }
        this.setRaw(x, y, z, b);
      }
    }
    // trees
    let s = seed; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let z = 3; z < SIZE - 3; z++) for (let x = 3; x < SIZE - 3; x++) {
      if (rand() > 0.012) continue;
      const h = heights[z * SIZE + x];
      if (this.get(x, h, z) !== GRASS) continue;
      const th = 4 + (rand() * 3 | 0);
      for (let dy = th - 2; dy <= th + 1; dy++) {
        const rad = dy >= th ? 1 : 2;
        for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
          if (rad === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && rand() < 0.6) continue;
          if (this.get(x + dx, h + dy, z + dz) === AIR) this.setRaw(x + dx, h + dy, z + dz, LEAVES);
        }
      }
      for (let dy = 1; dy <= th; dy++) this.setRaw(x, h + dy, z, LOG);
    }
  }

  buildAll() { for (let cx = 0; cx < WORLD_CHUNKS; cx++) for (let cz = 0; cz < WORLD_CHUNKS; cz++) this.buildChunk(cx, cz); }

  buildChunk(cx, cz) {
    const key = cx + ',' + cz;
    const old = this.meshes.get(key);
    if (old) for (const m of old) { this.scene.remove(m); m.geometry.dispose(); }
    const bufs = [{ p: [], uv: [], c: [], i: [] }, { p: [], uv: [], c: [], i: [] }];
    const tw = 1 / NUM_TILES, eps = 0.001;
    for (let y = 0; y < HEIGHT; y++) for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
      const id = this.get(x, y, z);
      if (id === AIR) continue;
      const liquid = id === WATER;
      const B = liquid ? bufs[1] : bufs[0];
      for (const f of FACES) {
        const nb = this.get(x + f.dir[0], y + f.dir[1], z + f.dir[2]);
        if (liquid ? nb !== AIR && nb !== LEAVES : (isOpaque(nb) || (nb === id && id === LEAVES && false))) continue;
        if (liquid && nb === WATER) continue;
        const tile = BLOCKS[id].tiles[f.tile];
        const ndx = B.p.length / 3;
        const top = liquid && f.dir[1] === 1 && this.get(x, y + 1, z) !== WATER ? -0.1 : 0;
        for (const [px, py, pz, u, v] of f.c) {
          B.p.push(x + px, y + py + (py ? top : 0), z + pz);
          B.uv.push((tile + eps + u * (1 - 2 * eps)) * tw, v);
          B.c.push(f.shade, f.shade, f.shade);
        }
        B.i.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
      }
    }
    const meshes = [];
    bufs.forEach((B, k) => {
      if (!B.i.length) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
      g.setIndex(B.i);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, k ? this.waterMat : this.solidMat);
      if (k) m.renderOrder = 1;
      this.scene.add(m); meshes.push(m);
    });
    this.meshes.set(key, meshes);
  }

  set(x, y, z, v) {
    if (!this.inBounds(x, y, z)) return false;
    this.setRaw(x, y, z, v);
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    this.buildChunk(cx, cz);
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0 && cx > 0) this.buildChunk(cx - 1, cz);
    if (lx === CHUNK - 1 && cx < WORLD_CHUNKS - 1) this.buildChunk(cx + 1, cz);
    if (lz === 0 && cz > 0) this.buildChunk(cx, cz - 1);
    if (lz === CHUNK - 1 && cz < WORLD_CHUNKS - 1) this.buildChunk(cx, cz + 1);
    return true;
  }

  // Amanatides & Woo voxel traversal; skips air and water
  raycast(origin, dir, maxDist = 6) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const step = [Math.sign(dir.x), Math.sign(dir.y), Math.sign(dir.z)];
    const o = [origin.x, origin.y, origin.z], d = [dir.x, dir.y, dir.z], pos = [x, y, z];
    const tMax = [], tDelta = [];
    for (let i = 0; i < 3; i++) {
      tDelta[i] = d[i] !== 0 ? Math.abs(1 / d[i]) : Infinity;
      tMax[i] = d[i] > 0 ? (pos[i] + 1 - o[i]) * tDelta[i] : d[i] < 0 ? (o[i] - pos[i]) * tDelta[i] : Infinity;
    }
    let normal = [0, 0, 0], t = 0;
    while (t <= maxDist) {
      const b = this.get(pos[0], pos[1], pos[2]);
      if (b !== AIR && b !== WATER) return { pos: [...pos], normal, id: b };
      const a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2);
      t = tMax[a]; pos[a] += step[a]; tMax[a] += tDelta[a];
      normal = [0, 0, 0]; normal[a] = -step[a];
    }
    return null;
  }
}
