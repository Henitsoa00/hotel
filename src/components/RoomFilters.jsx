import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { allAmenities } from "../data/rooms";

export const categories = [
  { value: "all", label: "Toutes" },
  { value: "Chambre", label: "Chambres" },
  { value: "Suite", label: "Suites" },
  { value: "Premium", label: "Premium" },
];

export const defaultFilters = { category: "all", guests: 1, minPrice: "", maxPrice: "", amenities: [], onlyAvailable: false };

export default function RoomFilters({ filters, onChange, onReset }) {
  const set = (p) => onChange({ ...filters, ...p });
  const toggle = (a) => set({ amenities: filters.amenities.includes(a) ? filters.amenities.filter((x) => x !== a) : [...filters.amenities, a] });

  return (
    <aside className="space-y-7 rounded-3xl bg-white p-6 ring-1 ring-night/5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-serif text-xl"><SlidersHorizontal size={18} /> Filtres</h3>
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-night/50 hover:text-night"><RotateCcw size={12} /> Réinitialiser</button>
      </div>
      <div>
        <span className="label">Voyageurs minimum</span>
        <select className="input" value={filters.guests} onChange={(e) => set({ guests: +e.target.value })}>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} personne{n > 1 && "s"}{n > 1 ? " et +" : ""}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Prix par nuit (€)</span>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" placeholder="Min" className="input" value={filters.minPrice} onChange={(e) => set({ minPrice: e.target.value })} />
          <input type="number" min="0" placeholder="Max" className="input" value={filters.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} />
        </div>
      </div>
      <div>
        <span className="label">Équipements</span>
        <div className="space-y-2">
          {allAmenities.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={filters.amenities.includes(a)} onChange={() => toggle(a)} className="h-4 w-4 accent-[#0f1b2d]" />{a}
            </label>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 border-t border-night/10 pt-5 text-sm">
        <input type="checkbox" checked={filters.onlyAvailable} onChange={(e) => set({ onlyAvailable: e.target.checked })} className="h-4 w-4 accent-[#0f1b2d]" />Disponibles uniquement
      </label>
    </aside>
  );
}
