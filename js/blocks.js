export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, LEAVES = 5, SAND = 6, WATER = 7, PLANKS = 8, COBBLE = 9, BEDROCK = 10;
// tiles: [top, side, bottom]
export const BLOCKS = {
  [GRASS]: { name: 'Grass', tiles: [0, 1, 2] },
  [DIRT]: { name: 'Dirt', tiles: [2, 2, 2] },
  [STONE]: { name: 'Stone', tiles: [3, 3, 3] },
  [LOG]: { name: 'Log', tiles: [5, 4, 5] },
  [LEAVES]: { name: 'Leaves', tiles: [6, 6, 6], transparent: true },
  [SAND]: { name: 'Sand', tiles: [7, 7, 7] },
  [WATER]: { name: 'Water', tiles: [8, 8, 8], liquid: true },
  [PLANKS]: { name: 'Planks', tiles: [9, 9, 9] },
  [COBBLE]: { name: 'Cobblestone', tiles: [10, 10, 10] },
  [BEDROCK]: { name: 'Bedrock', tiles: [11, 11, 11] },
};
export const HOTBAR = [GRASS, DIRT, STONE, COBBLE, LOG, PLANKS, LEAVES, SAND, WATER];
export const TILE = 16, NUM_TILES = 12;
export const isOpaque = id => id !== AIR && !BLOCKS[id].transparent && !BLOCKS[id].liquid;
export const isSolid = id => id !== AIR && !BLOCKS[id].liquid;

// Procedural pixel-art texture atlas
export function makeAtlas() {
  const c = document.createElement('canvas'); c.width = TILE * NUM_TILES; c.height = TILE;
  const g = c.getContext('2d');
  let s = 42; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const px = (t, x, y, col) => { g.fillStyle = col; g.fillRect(t * TILE + x, y, 1, 1); };
  const noisy = (t, [R, G, B], v, a = 1) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const k = (r() - 0.5) * v; px(t, x, y, `rgba(${R + k | 0},${G + k | 0},${B + k | 0},${a})`); } };
  noisy(0, [95, 159, 53], 40);
  noisy(1, [134, 96, 67], 30); for (let x = 0; x < TILE; x++) { const d = 3 + (r() * 3 | 0); for (let y = 0; y < d; y++) px(1, x, y, `rgb(${90 + r() * 20 | 0},${150 + r() * 20 | 0},50)`); }
  noisy(2, [134, 96, 67], 35);
  noisy(3, [125, 125, 125], 30);
  noisy(4, [102, 81, 50], 20); for (let x = 0; x < TILE; x += 4) for (let y = 0; y < TILE; y++) px(4, x, y, 'rgb(70,55,33)');
  noisy(5, [160, 130, 80], 20); g.strokeStyle = 'rgb(110,85,50)'; g.strokeRect(5 * TILE + 3.5, 3.5, 9, 9);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { if (r() < 0.2) continue; const k = r() * 50; px(6, x, y, `rgb(${40 + k | 0},${110 + k | 0},${30 + k / 2 | 0})`); }
  noisy(7, [219, 207, 163], 20);
  noisy(8, [50, 90, 200], 25, 1);
  noisy(9, [170, 135, 85], 15); for (let y = 3; y < TILE; y += 4) for (let x = 0; x < TILE; x++) px(9, x, y, 'rgb(115,90,55)');
  noisy(10, [120, 120, 120], 50); for (let i = 0; i < 20; i++) px(10, r() * 16 | 0, r() * 16 | 0, 'rgb(70,70,70)');
  noisy(11, [60, 60, 60], 60);
  return c;
}
