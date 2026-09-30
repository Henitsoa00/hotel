import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { gallery } from "../data/gallery";

export default function Gallery() {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const spans = ["md:col-span-2 md:row-span-2", "", "", "", "md:col-span-2", ""];
  return (
    <>
      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
        {gallery.map((g, i) => (
          <button key={g.src} onClick={() => setOpen(g)} className={`group relative overflow-hidden rounded-3xl ${spans[i]}`}>
            <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <span className="absolute inset-0 flex items-end bg-gradient-to-t from-night/60 to-transparent p-4 text-sm text-white opacity-0 transition group-hover:opacity-100">{g.alt}</span>
          </button>
        ))}
      </div>
      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-[60] grid place-items-center bg-night/90 p-5 animate-fade-in">
          <button className="absolute right-5 top-5 text-white" aria-label="Fermer"><X size={28} /></button>
          <img src={open.src.replace("w=1000", "w=1800")} alt={open.alt} className="max-h-[85vh] rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
