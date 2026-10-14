# Minecraft Browser

A Minecraft-like voxel sandbox that runs entirely in the browser. Built with [Three.js](https://threejs.org/) (r160, vendored in `js/three.module.js`). It has no backend and no build step.

**Play live:** https://savannahio.github.io/minecraft-browser/

## Features
- A 160×160×64 world split into 16×16 chunks. Each chunk is one merged mesh with hidden faces culled.
- Blocks: grass, dirt, stone, cobblestone, log, planks, leaves, sand, semi-transparent water, and bedrock.
- Terrain from inline Perlin noise: hills, beaches near the water level, trees, and caves carved with 3D noise.
- Textures are drawn on a canvas in code, so there are no external assets.
- First-person controls with pointer lock, gravity, jumping, swimming, and AABB collision.
- Voxel raycasting with a highlight on the targeted block, plus block breaking and placing.
- A hotbar HUD and a crosshair.

## Controls
| Input | Action |
|---|---|
| Mouse | Look |
| W A S D | Move |
| Shift | Sprint |
| Space | Jump / swim up |
| Left click | Break block |
| Right click | Place block |
| 1–9 / scroll wheel | Select block |
| Esc | Release mouse |

## Run locally
ES modules need a web server, so `file://` won't work:
```
python3 -m http.server 8000
```
Then open http://localhost:8000.
