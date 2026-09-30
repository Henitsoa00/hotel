import { Link, useNavigate } from "react-router-dom";
import { Users, Maximize, BedDouble, Check } from "lucide-react";
import { formatPrice } from "../utils/booking";
import { useBooking } from "../context/BookingContext";

export default function RoomCard({ room, available = room.available }) {
  const { selectRoom } = useBooking();
  const navigate = useNavigate();
  const book = () => { selectRoom(room.id); navigate("/reservation"); };

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-night/5 transition duration-500 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/hebergements/${room.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <img src={room.images[0]} alt={room.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-widest backdrop-blur">{room.category}</span>
        <span className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur ${available ? "bg-emerald-50/90 text-emerald-700" : "bg-night/80 text-white"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-red-400"}`} />{available ? "Disponible" : "Complet"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl">{room.name}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-night/60">
          <span className="flex items-center gap-1"><Users size={13} /> {room.capacity} pers.</span>
          <span className="flex items-center gap-1"><Maximize size={13} /> {room.size} m²</span>
          <span className="flex items-center gap-1"><BedDouble size={13} /> {room.bed}</span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {room.amenities.slice(0, 4).map((a) => <li key={a} className="flex items-center gap-1 rounded-full bg-ivory px-2.5 py-1 text-[11px] text-night/70"><Check size={11} className="text-gold" />{a}</li>)}
        </ul>
        <div className="mt-auto flex items-end justify-between pt-6">
          <div><span className="font-serif text-3xl">{formatPrice(room.price)}</span><span className="text-xs text-night/50"> / nuit</span></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to={`/hebergements/${room.id}`} className="btn-outline !px-3">Voir détails</Link>
          <button onClick={book} disabled={!available} className="btn-dark !px-3">{available ? "Réserver" : "Complet"}</button>
        </div>
      </div>
    </article>
  );
}
