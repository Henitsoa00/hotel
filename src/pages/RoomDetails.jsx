import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Maximize, BedDouble, Check, ShieldCheck, AlertCircle } from "lucide-react";
import RoomGallery from "../components/RoomGallery";
import PriceSummary from "../components/PriceSummary";
import { Counter, Spinner } from "../components/ui";
import { getRoomById } from "../services/api";
import { includedServices, bookingPolicy } from "../data/rooms";
import { useBooking } from "../context/BookingContext";
import { calculatePrice, isRoomAvailable, validateStay, todayISO, addDaysISO, formatPrice } from "../utils/booking";

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stay, setStay, selectRoom } = useBooking();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [local, setLocal] = useState(stay);
  const [errors, setErrors] = useState({});

  useEffect(() => { setRoom(null); getRoomById(id).then(setRoom).catch((e) => setError(e.message)); }, [id]);

  const pricing = useMemo(() => room && calculatePrice(room.price, local.checkIn, local.checkOut), [room, local]);
  const available = room && isRoomAvailable(room, local.checkIn, local.checkOut);
  const guests = local.adults + local.children;
  const upd = (p) => setLocal((s) => { const n = { ...s, ...p }; if (p.checkIn && (!n.checkOut || n.checkOut <= p.checkIn)) n.checkOut = addDaysISO(p.checkIn, 1); return n; });

  const book = () => {
    const errs = validateStay(local);
    if (guests > room.capacity) errs.guests = `Cette chambre accueille ${room.capacity} personnes maximum.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStay({ ...local, rooms: 1 });
    selectRoom(room.id);
    navigate("/reservation?step=3");
  };

  if (error) return <div className="container-x grid min-h-[70vh] place-items-center pt-24 text-center"><div><h1 className="font-serif text-4xl">{error}</h1><Link to="/hebergements" className="btn-dark mt-6">Voir les chambres</Link></div></div>;
  if (!room) return <div className="grid min-h-[80vh] place-items-center"><Spinner size={30} /></div>;

  return (
    <section className="container-x pb-24 pt-28 animate-fade-in">
      <Link to="/hebergements" className="inline-flex items-center gap-2 text-sm text-night/60 hover:text-night"><ArrowLeft size={16} /> Retour aux hébergements</Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <RoomGallery images={room.images} name={room.name} />
          <p className="eyebrow mt-10">{room.category}</p>
          <h1 className="mt-2 font-serif text-5xl md:text-6xl">{room.name}</h1>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-night/70">
            <span className="flex items-center gap-2"><Users size={16} className="text-gold" /> {room.capacity} personnes</span>
            <span className="flex items-center gap-2"><Maximize size={16} className="text-gold" /> {room.size} m²</span>
            <span className="flex items-center gap-2"><BedDouble size={16} className="text-gold" /> {room.bed}</span>
          </div>
          <p className="mt-6 text-lg leading-relaxed text-night/75">{room.description}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div><h3 className="font-serif text-2xl">Équipements</h3><ul className="mt-4 space-y-2 text-sm">{room.amenities.map((a) => <li key={a} className="flex gap-2"><Check size={16} className="text-gold" />{a}</li>)}</ul></div>
            <div><h3 className="font-serif text-2xl">Services inclus</h3><ul className="mt-4 space-y-2 text-sm">{includedServices.map((a) => <li key={a} className="flex gap-2"><Check size={16} className="text-gold" />{a}</li>)}</ul></div>
          </div>
          <div className="mt-10 rounded-3xl bg-sand/60 p-7">
            <h3 className="flex items-center gap-2 font-serif text-2xl"><ShieldCheck className="text-gold" /> Politique de réservation</h3>
            <ul className="mt-4 space-y-2 text-sm text-night/75">{bookingPolicy.map((p) => <li key={p}>— {p}</li>)}</ul>
          </div>
        </div>

        <aside>
          <div className="sticky top-24 rounded-3xl bg-white p-7 shadow-xl shadow-night/5 ring-1 ring-night/5">
            <div className="flex items-baseline justify-between"><div><span className="font-serif text-4xl">{formatPrice(room.price)}</span><span className="text-sm text-night/50"> / nuit</span></div>
              <span className={`rounded-full px-3 py-1 text-xs ${available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{available ? "Disponible" : "Complet"}</span></div>
            <h3 className="mt-6 text-sm font-medium">Sélectionner les dates</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label><span className="label">Arrivée</span><input type="date" min={todayISO()} className={`input ${errors.checkIn ? "input-error" : ""}`} value={local.checkIn} onChange={(e) => upd({ checkIn: e.target.value })} /></label>
              <label><span className="label">Départ</span><input type="date" min={local.checkIn ? addDaysISO(local.checkIn, 1) : todayISO()} className={`input ${errors.checkOut ? "input-error" : ""}`} value={local.checkOut} onChange={(e) => upd({ checkOut: e.target.value })} /></label>
            </div>
            {(errors.checkIn || errors.checkOut) && <p className="mt-2 text-xs text-red-500">{errors.checkIn || errors.checkOut}</p>}
            <div className="mt-5 space-y-3 rounded-2xl bg-ivory p-4">
              <Counter label="Adultes" value={local.adults} min={1} max={room.capacity} onChange={(v) => upd({ adults: v })} />
              <Counter label="Enfants" value={local.children} max={room.capacity - 1} onChange={(v) => upd({ children: v })} />
            </div>
            {(errors.guests || guests > room.capacity) && <p className="mt-2 flex items-center gap-1 text-xs text-red-500"><AlertCircle size={12} />{errors.guests || `Capacité maximale : ${room.capacity} personnes.`}</p>}
            <div className="mt-6">
              {pricing.nights > 0 ? <PriceSummary pricing={pricing} /> : <p className="rounded-2xl border border-dashed border-night/15 p-4 text-center text-sm text-night/50">Choisissez vos dates pour calculer le prix du séjour.</p>}
            </div>
            <button onClick={book} disabled={!available} className="btn-dark mt-6 w-full !py-4">{available ? "Réserver cette chambre" : "Indisponible à ces dates"}</button>
            <p className="mt-3 text-center text-xs text-night/50">Annulation gratuite jusqu'à 48h avant l'arrivée</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
