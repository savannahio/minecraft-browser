import * as THREE from 'three';
import { World, SIZE, HEIGHT } from './world.js';
import { makeAtlas, HOTBAR, BLOCKS, TILE, isSolid, WATER, BEDROCK, AIR } from './blocks.js';

export class Game {
  constructor(container, cb = {}) {
const listeners = []; let raf = 0;
const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); listeners.push([t, ev, fn, opt]); };
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
container.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const sky = new THREE.Color(0x87ceeb);
scene.background = sky; scene.fog = new THREE.Fog(sky, 40, 110);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 300);
camera.rotation.order = 'YXZ';

const atlasCanvas = makeAtlas();
const atlas = new THREE.CanvasTexture(atlasCanvas);
atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestFilter; atlas.colorSpace = THREE.SRGBColorSpace;

const world = new World(scene, atlas);
world.buildAll();


// highlight box
const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)), new THREE.LineBasicMaterial({ color: 0x000000 }));
hl.visible = false; scene.add(hl);

// player
const P = { pos: new THREE.Vector3(SIZE / 2 + 0.5, 0, SIZE / 2 + 0.5), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: false };
P.pos.y = world.heightAt(SIZE / 2, SIZE / 2) + 1.01;
const W = 0.3, H = 1.8, EYE = 1.62;

let sel = 0;
const updateHotbar = () => cb.onSelect?.(sel);
// input
const keys = {};
const canvas = renderer.domElement;
const locked = () => document.pointerLockElement === canvas;
on(document, 'pointerlockchange', () => cb.onLock?.(locked()));
on(window, 'keydown', e => {
  keys[e.code] = true;
  if (e.code >= 'Digit1' && e.code <= 'Digit9') { sel = +e.code.slice(5) - 1; updateHotbar(); }
  if (e.code === 'Space') e.preventDefault();
});
on(window, 'keyup', e => { keys[e.code] = false; });
on(window, 'blur', () => { for (const k in keys) keys[k] = false; });
on(window, 'mousemove', e => {
  if (!locked()) return;
  P.yaw -= e.movementX * 0.0022; P.pitch -= e.movementY * 0.0022;
  P.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, P.pitch));
});
on(window, 'wheel', e => { if (!locked()) return; sel = (sel + (e.deltaY > 0 ? 1 : -1) + 9) % 9; updateHotbar(); }, { passive: true });
on(window, 'contextmenu', e => e.preventDefault());
let target = null;
on(window, 'mousedown', e => {
  if (!locked() || !target) return;
  if (e.button === 0) {
    const [x, y, z] = target.pos;
    if (world.get(x, y, z) !== BEDROCK) world.set(x, y, z, AIR);
  } else if (e.button === 2) {
    const x = target.pos[0] + target.normal[0], y = target.pos[1] + target.normal[1], z = target.pos[2] + target.normal[2];
    const cur = world.get(x, y, z);
    if (cur !== AIR && cur !== WATER) return;
    const id = HOTBAR[sel];
    if (isSolid(id) && x + 1 > P.pos.x - W && x < P.pos.x + W && z + 1 > P.pos.z - W && z < P.pos.z + W && y + 1 > P.pos.y && y < P.pos.y + H) return;
    world.set(x, y, z, id);
  }
});
on(window, 'resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// physics
function solidAt(x, y, z) {
  if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) return true; // world border
  if (y < 0) return true;
  return isSolid(world.get(x, y, z));
}
function collides(p) {
  for (let x = Math.floor(p.x - W); x <= Math.floor(p.x + W); x++)
    for (let y = Math.floor(p.y); y <= Math.floor(p.y + H); y++)
      for (let z = Math.floor(p.z - W); z <= Math.floor(p.z + W); z++)
        if (solidAt(x, y, z)) return true;
  return false;
}
function moveAxis(axis, amt) {
  if (!amt) return false;
  const stepN = Math.ceil(Math.abs(amt) / 0.25), d = amt / stepN;
  for (let i = 0; i < stepN; i++) {
    P.pos[axis] += d;
    if (collides(P.pos)) {
      if (axis === 'y') P.pos.y = d > 0 ? Math.floor(P.pos.y + H) - H - 0.001 : Math.floor(P.pos.y) + 1;
      else P.pos[axis] -= d;
      return true;
    }
  }
  return false;
}

let last = performance.now(), fpsT = 0, frames = 0, fps = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const inWater = world.get(Math.floor(P.pos.x), Math.floor(P.pos.y + 0.5), Math.floor(P.pos.z)) === WATER;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 7 : 4.3) * (inWater ? 0.55 : 1);
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const len = Math.hypot(mx, mz) || 1;
  P.vel.x = mx / len * speed; P.vel.z = mz / len * speed;
  if (inWater) {
    P.vel.y = Math.max(P.vel.y - 10 * dt, -3);
    if (keys.Space) P.vel.y = 3.5;
  } else {
    P.vel.y -= 28 * dt;
    if (keys.Space && P.onGround) P.vel.y = 8.6;
  }
  P.vel.y = Math.max(P.vel.y, -40);
  moveAxis('x', P.vel.x * dt); moveAxis('z', P.vel.z * dt);
  const hitY = moveAxis('y', P.vel.y * dt);
  P.onGround = hitY && P.vel.y < 0;
  if (hitY) P.vel.y = 0;
  if (P.pos.y < -20) { P.pos.set(SIZE / 2 + 0.5, HEIGHT, SIZE / 2 + 0.5); P.vel.set(0, 0, 0); }

  camera.position.set(P.pos.x, P.pos.y + EYE, P.pos.z);
  camera.rotation.set(P.pitch, P.yaw, 0);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  target = world.raycast(camera.position, dir, 6);
  hl.visible = !!target;
  if (target) hl.position.set(target.pos[0] + 0.5, target.pos[1] + 0.5, target.pos[2] + 0.5);
  const headWater = world.get(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)) === WATER;
  scene.fog.near = headWater ? 1 : 40; scene.fog.far = headWater ? 18 : 110;
  scene.fog.color.set(headWater ? 0x1d3f8a : 0x87ceeb); scene.background = scene.fog.color;

  renderer.render(scene, camera);
  frames++; fpsT += dt;
  if (fpsT >= 0.5) { fps = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
  cb.onInfo?.(`FPS ${fps}\nXYZ ${P.pos.x.toFixed(1)} ${P.pos.y.toFixed(1)} ${P.pos.z.toFixed(1)}\nBlock: ${BLOCKS[HOTBAR[sel]].name}`);
  raf = requestAnimationFrame(tick);
}
raf = requestAnimationFrame(tick);

this.world = world; this.P = P;
this.lock = () => canvas.requestPointerLock();
this.hotbarIcons = () => HOTBAR.map(id => {
  const c = document.createElement('canvas'); c.width = c.height = TILE;
  c.getContext('2d').drawImage(atlasCanvas, BLOCKS[id].tiles[1] * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);
  return { name: BLOCKS[id].name, url: c.toDataURL() };
});
this.dispose = () => {
  cancelAnimationFrame(raf);
  for (const [t, ev, fn, opt] of listeners) t.removeEventListener(ev, fn, opt);
  renderer.dispose(); canvas.remove();
};
  }
}
