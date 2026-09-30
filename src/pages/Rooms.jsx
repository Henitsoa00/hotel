import { useEffect, useMemo, useState } from "react";
import { SearchX, SlidersHorizontal, X, CalendarDays } from "lucide-react";
import RoomCard from "../components/RoomCard";
import RoomFilters, { categories, defaultFilters } from "../components/RoomFilters";
import BookingSearch from "../components/BookingSearch";
import { PageHero, Spinner } from "../components/ui";
import { useBooking } from "../context/BookingContext";
import { checkAvailability } from "../services/api";
import { formatDate, calculateNights } from "../utils/booking";

export default function Rooms() {
  const { stay } = useBooking();
  const guests = stay.adults + stay.children;
  const [rooms, setRooms] = useState(null);
  const [filters, setFilters] = useState({ ...defaultFilters, guests: Math.min(Math.max(1, Math.ceil(guests / stay.rooms)), 4) });
  const [mobileFilters, setMobileFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const hasDates = stay.checkIn && stay.checkOut;

  useEffect(() => {
    setRooms(null);
    checkAvailability({ checkIn: stay.checkIn, checkOut: stay.checkOut }).then(setRooms);
  }, [stay.checkIn, stay.checkOut]);

  const filtered = useMemo(() => (rooms || []).filter((r) =>
    (filters.category === "all" || r.category === filters.category) &&
    r.capacity >= filters.guests &&
    (!filters.minPrice || r.price >= +filters.minPrice) &&
    (!filters.maxPrice || r.price <= +filters.maxPrice) &&
    filters.amenities.every((a) => r.amenities.includes(a)) &&
    (!(filters.onlyAvailable || hasDates) || r.isAvailable)
  ), [rooms, filters, hasDates]);

  const reset = () => setFilters(defaultFilters);

  return (
    <>
      <PageHero eyebrow="Hébergements" title={<>Chambres & <em>suites</em></>} subtitle="Sept catégories d'hébergements, du cocon raffiné au penthouse avec piscine privée." image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=75" />

      <section className="container-x py-12">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-night/5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="text-gold" size={20} />
            {hasDates ? <span><strong>{formatDate(stay.checkIn, { day: "numeric", month: "short" })}</strong> → <strong>{formatDate(stay.checkOut, { day: "numeric", month: "short", year: "numeric" })}</strong> · {calculateNights(stay.checkIn, stay.checkOut)} nuit(s) · {guests} voyageur(s) · {stay.rooms} chambre(s)</span>
              : <span className="text-night/60">Indiquez vos dates pour voir les disponibilités en temps réel.</span>}
          </div>
          <button onClick={() => setShowSearch(!showSearch)} className="btn-outline !py-2">{showSearch ? "Fermer" : hasDates ? "Modifier la recherche" : "Choisir des dates"}</button>
        </div>
        {showSearch && <div className="mb-10 animate-fade-up"><BookingSearch onSearch={() => setShowSearch(false)} /></div>}

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button key={c.value} onClick={() => setFilters({ ...filters, category: c.value })} className={`rounded-full px-5 py-2 text-sm transition ${filters.category === c.value ? "bg-night text-white" : "bg-white ring-1 ring-night/10 hover:ring-night/40"}`}>{c.label}</button>
          ))}
          <button onClick={() => setMobileFilters(true)} className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-night/10 lg:hidden"><SlidersHorizontal size={14} /> Filtres</button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block"><div className="sticky top-24"><RoomFilters filters={filters} onChange={setFilters} onReset={reset} /></div></div>
          {mobileFilters && (
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-ivory p-5 animate-fade-in lg:hidden">
              <button onClick={() => setMobileFilters(false)} className="mb-4 ml-auto flex"><X /></button>
              <RoomFilters filters={filters} onChange={setFilters} onReset={reset} />
              <button onClick={() => setMobileFilters(false)} className="btn-dark mt-4 w-full">Voir {filtered.length} résultat(s)</button>
            </div>
          )}
          <div>
            {!rooms ? (
              <div className="grid h-96 place-items-center text-night/50"><div className="flex items-center gap-3"><Spinner size={22} /> Recherche des disponibilités…</div></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl bg-white p-14 text-center ring-1 ring-night/5">
                <SearchX className="mx-auto text-gold" size={40} strokeWidth={1.3} />
                <h3 className="mt-4 font-serif text-3xl">Nous n'avons trouvé aucune chambre disponible pour ces dates.</h3>
                <p className="mt-2 text-sm text-night/60">Essayez d'autres dates ou élargissez vos filtres.</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button onClick={() => { setShowSearch(true); window.scrollTo({ top: 300, behavior: "smooth" }); }} className="btn-dark">Modifier les dates</button>
                  <button onClick={reset} className="btn-outline">Réinitialiser les filtres</button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-5 text-sm text-night/60">{filtered.length} hébergement(s) trouvé(s)</p>
                <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((r, i) => <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}><RoomCard room={r} available={r.isAvailable} /></div>)}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
