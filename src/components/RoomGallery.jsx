import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RoomGallery({ images, name }) {
  const [i, setI] = useState(0);
  const go = (d) => setI((x) => (x + d + images.length) % images.length);
  return (
    <div>
      <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-sand">
        <img key={i} src={images[i]} alt={`${name} ${i + 1}`} className="h-full w-full object-cover animate-fade-in" />
        <button onClick={() => go(-1)} aria-label="Précédente" className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 opacity-0 transition group-hover:opacity-100 max-md:opacity-100"><ChevronLeft size={18} /></button>
        <button onClick={() => go(1)} aria-label="Suivante" className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 opacity-0 transition group-hover:opacity-100 max-md:opacity-100"><ChevronRight size={18} /></button>
        <span className="absolute bottom-4 right-4 rounded-full bg-night/70 px-3 py-1 text-xs text-white">{i + 1} / {images.length}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {images.map((src, k) => (
          <button key={src} onClick={() => setI(k)} className={`aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition ${k === i ? "ring-gold" : "ring-transparent opacity-70 hover:opacity-100"}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
