import { useRef, useState } from 'react';

const R = 50; // joystick radius in px

function Joystick({ game }) {
  const base = useRef(null);
  const id = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const update = t => {
    const r = base.current.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    setKnob({ x: dx, y: dy });
    game.touch.mx = dx / R; game.touch.my = dy / R;
  };
  const find = e => [...e.changedTouches].find(t => t.identifier === id.current);
  return (
    <div ref={base} data-testid="joystick"
      className="pointer-events-auto fixed bottom-24 left-8 h-32 w-32 rounded-full border-2 border-white/40 bg-white/15"
      onTouchStart={e => { const t = e.changedTouches[0]; id.current = t.identifier; update(t); }}
      onTouchMove={e => { const t = find(e); if (t) update(t); }}
      onTouchEnd={e => { if (find(e)) { id.current = null; setKnob({ x: 0, y: 0 }); game.touch.mx = 0; game.touch.my = 0; } }}
      onTouchCancel={() => { id.current = null; setKnob({ x: 0, y: 0 }); game.touch.mx = 0; game.touch.my = 0; }}>
      <div className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/60"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  );
}

function LookPad({ game }) {
  const last = useRef(null);
  return (
    <div data-testid="lookpad" className="pointer-events-auto fixed inset-y-0 right-0 w-1/2"
      onTouchStart={e => { const t = e.changedTouches[0]; last.current = { id: t.identifier, x: t.clientX, y: t.clientY }; }}
      onTouchMove={e => {
        const t = [...e.changedTouches].find(t => t.identifier === last.current?.id);
        if (!t) return;
        game.look(t.clientX - last.current.x, t.clientY - last.current.y);
        last.current.x = t.clientX; last.current.y = t.clientY;
      }}
      onTouchEnd={e => { if ([...e.changedTouches].some(t => t.identifier === last.current?.id)) last.current = null; }} />
  );
}

function Btn({ label, className = '', ...h }) {
  return (
    <button className={`pointer-events-auto flex h-16 w-16 select-none items-center justify-center rounded-full border-2 border-white/50 bg-black/40 text-sm font-bold text-white active:bg-white/40 ${className}`}
      onContextMenu={e => e.preventDefault()} {...h}>{label}</button>
  );
}

export default function TouchControls({ game }) {
  if (!game) return null;
  const tap = fn => ({ onTouchStart: () => fn() });
  return (
    <div data-testid="touch-controls" className="pointer-events-none fixed inset-0 touch-none">
      <LookPad game={game} />
      <Joystick game={game} />
      <div className="fixed bottom-24 right-6 grid grid-cols-2 gap-3">
        <Btn label="Break" {...tap(() => game.breakBlock())} />
        <Btn label="Place" {...tap(() => game.placeBlock())} />
        <Btn label="Jump" className="col-span-2 mx-auto"
          onTouchStart={() => { game.touch.jump = true; }}
          onTouchEnd={() => { game.touch.jump = false; }} onTouchCancel={() => { game.touch.jump = false; }} />
      </div>
    </div>
  );
}
