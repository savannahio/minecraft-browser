# Minecraft Browser

A Minecraft-like voxel sandbox that runs entirely in the browser. It's built with **React**, **Tailwind CSS**, **Three.js** and **Vite**, and needs no backend.

**Play live:** https://savannahio.github.io/minecraft-browser/

## Features
- A 160×160×64 world split into 16×16 chunks. Each chunk is one merged mesh with hidden faces culled.
- Blocks: grass, dirt, stone, cobblestone, log, planks, leaves, sand, semi-transparent water, and bedrock.
- Terrain from inline Perlin noise: hills, beaches near the water level, trees, and caves carved with 3D noise.
- Textures are drawn on a canvas in code, so there are no external assets.
- First-person controls with pointer lock, gravity, jumping, swimming, and AABB collision.
- Voxel raycasting with a highlight on the targeted block, plus block breaking and placing.
- The HUD, hotbar and click-to-play overlay are React components styled with Tailwind.

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

## Local development
```
npm install
npm run dev        # http://localhost:5173/minecraft-browser/
npm run build      # production build into dist/
npm run preview    # serve the build
```

## Structure
- `src/game/`: the engine (`Game.js`, `world.js`, `blocks.js`, `noise.js`)
- `src/components/`: `Hud`, `Hotbar` and `Overlay` (React + Tailwind)
- `.github/workflows/deploy.yml`: a GitHub Actions workflow that builds the app and deploys `dist/` to GitHub Pages on every push to `main`
