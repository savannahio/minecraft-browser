export default function Hud({ info }) {
  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-white mix-blend-difference">+</div>
      <pre className="pointer-events-none fixed left-2 top-2 m-0 font-mono text-xs text-white [text-shadow:0_0_2px_#000]">{info}</pre>
    </>
  );
}
