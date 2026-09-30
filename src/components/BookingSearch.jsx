import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, BedDouble, Search } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { Counter } from "./ui";
import { validateStay, todayISO, addDaysISO } from "../utils/booking";

export default function BookingSearch({ compact = false, onSearch }) {
  const { stay, setStay } = useBooking();
  const navigate = useNavigate();
  const [local, setLocal] = useState(stay);
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => setLocal(stay), [stay]);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const upd = (p) => setLocal((s) => {
    const n = { ...s, ...p };
    if (p.checkIn && (!n.checkOut || n.checkOut <= p.checkIn)) n.checkOut = addDaysISO(p.checkIn, 1);
    return n;
  });

  const submit = (e) => {
    e.preventDefault();
    const errs = validateStay(local);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStay(local);
    onSearch ? onSearch(local) : navigate("/hebergements?search=1");
  };

  const cell = "flex-1 px-5 py-3 text-left";
  return (
    <form onSubmit={submit} className={`relative rounded-3xl bg-white/95 p-2 text-night shadow-2xl shadow-night/20 backdrop-blur ${compact ? "" : "md:rounded-full"}`}>
      <div className={`flex flex-col divide-y divide-night/10 ${compact ? "" : "md:flex-row md:items-center md:divide-x md:divide-y-0"}`}>
        <label className={cell}>
          <span className="label flex items-center gap-1.5"><Calendar size={12} /> Arrivée</span>
          <input type="date" min={todayISO()} value={local.checkIn} onChange={(e) => upd({ checkIn: e.target.value })} className="w-full bg-transparent text-sm font-medium outline-none" />
          {errors.checkIn && <span className="text-xs text-red-500">{errors.checkIn}</span>}
        </label>
        <label className={cell}>
          <span className="label flex items-center gap-1.5"><Calendar size={12} /> Départ</span>
          <input type="date" min={local.checkIn ? addDaysISO(local.checkIn, 1) : todayISO()} value={local.checkOut} onChange={(e) => upd({ checkOut: e.target.value })} className="w-full bg-transparent text-sm font-medium outline-none" />
          {errors.checkOut && <span className="text-xs text-red-500">{errors.checkOut}</span>}
        </label>
        <div className={`${cell} relative`} ref={ref}>
          <button type="button" onClick={() => setOpen(!open)} className="w-full text-left">
            <span className="label flex items-center gap-1.5"><Users size={12} /> Voyageurs</span>
            <span className="text-sm font-medium">{local.adults} adulte{local.adults > 1 && "s"}, {local.children} enfant{local.children > 1 && "s"}</span>
          </button>
          {errors.guests && <span className="block text-xs text-red-500">{errors.guests}</span>}
          {open && (
            <div className="absolute left-0 top-full z-20 mt-3 w-72 space-y-4 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-night/5 animate-fade-in">
              <Counter label="Adultes" sub="13 ans et +" value={local.adults} min={1} max={8} onChange={(v) => upd({ adults: v })} />
              <Counter label="Enfants" sub="0 – 12 ans" value={local.children} max={6} onChange={(v) => upd({ children: v })} />
              <button type="button" onClick={() => setOpen(false)} className="btn-dark w-full !py-2">Valider</button>
            </div>
          )}
        </div>
        <div className={cell}>
          <span className="label flex items-center gap-1.5"><BedDouble size={12} /> Chambres</span>
          <select value={local.rooms} onChange={(e) => upd({ rooms: +e.target.value })} className="w-full bg-transparent text-sm font-medium outline-none">
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} chambre{n > 1 && "s"}</option>)}
          </select>
        </div>
        <div className="p-2">
          <button className={`btn-dark w-full ${compact ? "" : "md:w-auto md:!px-8 md:!py-4"}`}><Search size={16} /> Rechercher</button>
        </div>
      </div>
    </form>
  );
}
