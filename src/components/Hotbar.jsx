export default function Hotbar({ icons, selected }) {
  return (
    <div className="fixed bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-md bg-black/45 p-1">
      {icons.map((ic, i) => (
        <div key={i} title={ic.name}
          className={`relative h-12 w-12 rounded border-[3px] bg-cover [image-rendering:pixelated] ${i === selected ? 'border-white' : 'border-neutral-600'}`}
          style={{ backgroundImage: `url(${ic.url})` }}>
          <span className="absolute left-1 top-0 text-[11px] text-white [text-shadow:0_0_2px_#000]">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
