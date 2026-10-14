const controls = [
  ['Mouse', 'look around'], ['W A S D', 'move'], ['Space', 'jump / swim'], ['Shift', 'sprint'],
  ['Left click', 'break block'], ['Right click', 'place block'], ['1–9 / scroll', 'select block'], ['Esc', 'release mouse'],
];
export default function Overlay({ ready, onPlay }) {
  return (
    <div onClick={onPlay} className="fixed inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-white">
      <div className="rounded-xl bg-neutral-900/90 px-9 py-6 text-center shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold">Minecraft Browser</h1>
        <p className="mb-3 text-sm text-neutral-300">{ready ? 'World ready.' : 'Generating world…'}</p>
        <p className="mb-4 text-2xl font-bold text-green-400">Click to play</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-left text-sm">
          {controls.map(([k, v]) => <li key={k}><b>{k}</b> {v}</li>)}
        </ul>
      </div>
    </div>
  );
}
