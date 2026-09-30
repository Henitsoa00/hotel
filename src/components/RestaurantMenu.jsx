import { useState } from "react";
import { menu, menuCategories } from "../data/restaurant";
import { formatPrice } from "../utils/booking";

export default function RestaurantMenu() {
  const [cat, setCat] = useState(menuCategories[0]);
  const items = menu.filter((m) => m.category === cat);
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {menuCategories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-6 py-2.5 text-sm transition ${c === cat ? "bg-night text-white" : "bg-white text-night/70 ring-1 ring-night/10 hover:ring-night/40"}`}>{c}</button>
        ))}
      </div>
      <div key={cat} className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((m, i) => (
          <article key={m.id} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-night/5 animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="aspect-[4/3] overflow-hidden"><img src={m.image} alt={m.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /></div>
            <div className="p-6">
              <div className="flex items-baseline justify-between gap-3"><h4 className="font-serif text-2xl">{m.name}</h4><span className="font-serif text-xl text-gold">{formatPrice(m.price)}</span></div>
              <p className="mt-2 text-sm text-night/60">{m.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
