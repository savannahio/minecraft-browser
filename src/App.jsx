import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game.js';
import Hotbar from './components/Hotbar.jsx';
import Hud from './components/Hud.jsx';
import Overlay from './components/Overlay.jsx';

export default function App() {
  const mount = useRef(null);
  const game = useRef(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(0);
  const [info, setInfo] = useState('');
  const [icons, setIcons] = useState([]);

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
      <Hotbar icons={icons} selected={selected} />
      {!locked && <Overlay ready={ready} onPlay={() => game.current?.lock()} />}
    </div>
  );
}
