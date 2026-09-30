import { Users, Maximize, Check } from "lucide-react";

export default function EventCard({ event, onRequest }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-night/5 transition duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden"><img src={event.image} alt={event.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /></div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-3xl">{event.title}</h3>
        <p className="mt-2 text-sm text-night/60">{event.description}</p>
        <div className="mt-4 flex gap-4 text-xs text-night/60">
          <span className="flex items-center gap-1"><Users size={13} /> Jusqu'à {event.capacity} pers.</span>
          <span className="flex items-center gap-1"><Maximize size={13} /> {event.size} m²</span>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">{event.equipment.map((e) => <li key={e} className="flex items-center gap-2"><Check size={13} className="text-gold" />{e}</li>)}</ul>
        <button onClick={() => onRequest(event.title)} className="btn-outline mt-auto w-full translate-y-0 !mt-6">Demander un devis</button>
      </div>
    </article>
  );
}
