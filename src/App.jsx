import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game.js';
import Hotbar from './components/Hotbar.jsx';
import Hud from './components/Hud.jsx';
import Overlay from './components/Overlay.jsx';
import TouchControls from './components/TouchControls.jsx';
import { detectMobile } from './isMobile.js';

export default function App() {
  const mount = useRef(null);
  const game = useRef(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(0);
  const [info, setInfo] = useState('');
  const [icons, setIcons] = useState([]);
  const [mobile] = useState(detectMobile);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const g = new Game(mount.current, { onLock: setLocked, onSelect: setSelected, onInfo: setInfo });
    game.current = g; window.__game = g;
    setIcons(g.hotbarIcons()); setReady(true);
    return () => g.dispose();
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="absolute inset-0" />
      <Hud info={info} />
      <Hotbar icons={icons} selected={selected} onPick={mobile ? i => game.current?.select(i) : undefined} />
      {mobile && started && <TouchControls game={game.current} />}
      {mobile
        ? !started && <Overlay ready={ready} mobile onPlay={() => setStarted(true)} />
        : !locked && <Overlay ready={ready} onPlay={() => game.current?.lock()} />}
    </div>
  );
}
