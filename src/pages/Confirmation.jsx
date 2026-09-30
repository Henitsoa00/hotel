import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail, Printer } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { getReservation } from "../services/api";
import { formatDate, formatPrice } from "../utils/booking";
import PriceSummary from "../components/PriceSummary";
import { Spinner } from "../components/ui";

export default function Confirmation() {
  const [params] = useSearchParams();
  const { lastReservation } = useBooking();
  const id = params.get("id") || lastReservation?.id;
  const [res, setRes] = useState(undefined);
  const [details, setDetails] = useState(false);

  useEffect(() => { if (!id) return setRes(null); getReservation(id).then((r) => setRes(r || lastReservation || null)); }, [id]);

  if (res === undefined) return <div className="grid min-h-screen place-items-center"><Spinner size={30} /></div>;
  if (!res) return (
    <div className="container-x grid min-h-screen place-items-center pt-20 text-center"><div>
      <h1 className="font-serif text-4xl">Aucune réservation trouvée</h1>
      <Link to="/reservation" className="btn-dark mt-6">Faire une réservation</Link></div></div>
  );

  const { stay, guest, pricing } = res;
  const rows = [
    ["Numéro de réservation", <span className="font-mono tracking-wider text-gold">{res.id}</span>],
    ["Client", `${guest.firstName} ${guest.lastName}`],
    ["Chambre", res.roomName],
    ["Arrivée", formatDate(stay.checkIn)],
    ["Départ", formatDate(stay.checkOut)],
    ["Nombre de nuits", pricing.nights],
    ["Voyageurs", `${stay.adults} adulte(s), ${stay.children} enfant(s)`],
    ["Montant total", <strong className="font-serif text-2xl">{formatPrice(pricing.total)}</strong>],
  ];

  return (
    <section className="min-h-screen bg-ivory pb-24 pt-32">
      <div className="container-x max-w-3xl animate-fade-up">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={64} strokeWidth={1.3} />
          <h1 className="mt-5 font-serif text-4xl md:text-6xl">Votre réservation est <em>confirmée</em></h1>
          <p className="mt-4 flex items-center justify-center gap-2 text-night/65"><Mail size={16} /> Un email de confirmation sera envoyé à votre adresse{guest.email && <strong className="text-night"> {guest.email}</strong>}.</p>
        </div>
        <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-xl shadow-night/5 ring-1 ring-night/5">
          <img src={res.roomImage} alt="" className="h-48 w-full object-cover" />
          <dl className="divide-y divide-night/5 p-6 md:p-8">
            {rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-night/55">{k}</dt><dd className="text-right">{v}</dd></div>)}
          </dl>
          {details && (
            <div className="border-t border-night/5 bg-ivory p-6 md:p-8 animate-fade-in">
              <h3 className="label">Détail du tarif</h3><PriceSummary pricing={pricing} />
              <p className="mt-5 text-xs text-night/55">Réservée le {new Date(res.createdAt).toLocaleString("fr-FR")} · {guest.phone} · {guest.country}{guest.requests && ` · Demande : ${guest.requests}`}</p>
              <button onClick={() => window.print()} className="btn-outline mt-5 !py-2"><Printer size={14} /> Imprimer</button>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-outline">Retour à l'accueil</Link>
          <button onClick={() => setDetails(!details)} className="btn-dark">{details ? "Masquer les détails" : "Voir ma réservation"}</button>
        </div>
      </div>
    </section>
  );
}
