import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, Check, Pencil, CalendarDays, Lock } from "lucide-react";
import BookingSteps from "../components/BookingSteps";
import PriceSummary from "../components/PriceSummary";
import { Counter, Field, Spinner } from "../components/ui";
import { useBooking } from "../context/BookingContext";
import { checkAvailability, createReservation } from "../services/api";
import { rooms as allRooms } from "../data/rooms";
import { calculatePrice, validateStay, validateFields, todayISO, addDaysISO, formatDate, formatPrice, calculateNights } from "../utils/booking";

const countries = ["France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc", "Sénégal", "Côte d'Ivoire", "Royaume-Uni", "Allemagne", "Italie", "Espagne", "États-Unis", "Autre"];
const guestRules = { firstName: { required: true }, lastName: { required: true }, email: { required: true, email: true }, phone: { required: true, phone: true }, country: { required: true } };

export default function Reservation() {
  const { stay, setStay, selectedRoomId, selectRoom, guest, setGuest, setLastReservation, resetBooking } = useBooking();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const room = allRooms.find((r) => r.id === selectedRoomId);
  const datesOk = Object.keys(validateStay(stay)).length === 0;

  const initialStep = () => {
    const want = +params.get("step") || 1;
    if (want >= 3 && datesOk && room) return 3;
    if (datesOk) return want >= 2 ? 2 : 1;
    return 1;
  };
  const [step, setStep] = useState(initialStep);
  const [maxReached, setMaxReached] = useState(step);
  const go = (n) => { setStep(n); setMaxReached((m) => Math.max(m, n)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // Step 1
  const [local, setLocal] = useState(stay);
  const [stayErrors, setStayErrors] = useState({});
  const updStay = (p) => setLocal((s) => { const n = { ...s, ...p }; if (p.checkIn && (!n.checkOut || n.checkOut <= p.checkIn)) n.checkOut = addDaysISO(p.checkIn, 1); return n; });
  const submitDates = (e) => {
    e.preventDefault();
    const errs = validateStay(local);
    setStayErrors(errs);
    if (Object.keys(errs).length) return;
    setStay(local);
    go(2);
  };

  // Step 2
  const [available, setAvailable] = useState(null);
  const guests = stay.adults + stay.children;
  useEffect(() => {
    if (step !== 2) return;
    setAvailable(null);
    checkAvailability({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: Math.ceil(guests / stay.rooms) }).then((list) => setAvailable(list.filter((r) => r.fits)));
  }, [step, stay.checkIn, stay.checkOut, guests, stay.rooms]);

  // Step 3
  const [form, setForm] = useState(guest);
  const [gErrors, setGErrors] = useState({});
  const setF = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); gErrors[k] && setGErrors({ ...gErrors, [k]: undefined }); };
  const submitGuest = (e) => {
    e.preventDefault();
    const errs = validateFields(form, guestRules);
    setGErrors(errs);
    if (Object.keys(errs).length) return;
    setGuest(form);
    go(4);
  };

  // Step 4
  const [submitting, setSubmitting] = useState(false);
  const [accept, setAccept] = useState(false);
  const pricing = useMemo(() => room && calculatePrice(room.price, stay.checkIn, stay.checkOut, stay.rooms), [room, stay]);
  const confirm = async () => {
    setSubmitting(true);
    const res = await createReservation({ room, stay, guest });
    setLastReservation(res);
    resetBooking();
    navigate(`/reservation/confirmation?id=${res.id}`);
  };

  const nights = calculateNights(stay.checkIn, stay.checkOut);
  const cls = (k) => `input ${gErrors[k] ? "input-error" : ""}`;

  return (
    <section className="min-h-screen bg-ivory pb-24 pt-28">
      <div className="container-x">
        <p className="eyebrow">Réservation</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Réservez votre <em>séjour</em></h1>
        <div className="mt-8 rounded-3xl bg-white p-5 ring-1 ring-night/5"><BookingSteps current={step} maxReached={maxReached} onStep={go} /></div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div key={step} className="animate-fade-up">
            {step === 1 && (
              <form onSubmit={submitDates} className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-10">
                <h2 className="font-serif text-3xl">Quand souhaitez-vous séjourner ?</h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field label="Arrivée *" error={stayErrors.checkIn}><input type="date" min={todayISO()} className={`input ${stayErrors.checkIn ? "input-error" : ""}`} value={local.checkIn} onChange={(e) => updStay({ checkIn: e.target.value })} /></Field>
                  <Field label="Départ *" error={stayErrors.checkOut}><input type="date" min={local.checkIn ? addDaysISO(local.checkIn, 1) : todayISO()} className={`input ${stayErrors.checkOut ? "input-error" : ""}`} value={local.checkOut} onChange={(e) => updStay({ checkOut: e.target.value })} /></Field>
                </div>
                <div className="mt-6 space-y-4 rounded-2xl bg-ivory p-5">
                  <Counter label="Adultes" sub="13 ans et +" value={local.adults} min={1} max={8} onChange={(v) => updStay({ adults: v })} />
                  <Counter label="Enfants" sub="0 – 12 ans" value={local.children} max={6} onChange={(v) => updStay({ children: v })} />
                  <Counter label="Chambres" value={local.rooms} min={1} max={4} onChange={(v) => updStay({ rooms: v })} />
                </div>
                {stayErrors.guests && <p className="mt-2 text-xs text-red-500">{stayErrors.guests}</p>}
                {local.checkIn && local.checkOut > local.checkIn && <p className="mt-4 text-sm text-night/60">{calculateNights(local.checkIn, local.checkOut)} nuit(s) sélectionnée(s)</p>}
                <button className="btn-dark mt-8 w-full sm:w-auto">Voir les chambres disponibles <ArrowRight size={16} /></button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Choisissez votre chambre</h2><button onClick={() => go(1)} className="text-sm text-night/60 underline">Modifier les dates</button></div>
                {!available ? <div className="grid h-64 place-items-center rounded-3xl bg-white"><div className="flex gap-3 text-night/50"><Spinner /> Vérification des disponibilités…</div></div>
                  : available.length === 0 ? (
                    <div className="rounded-3xl bg-white p-12 text-center">
                      <h3 className="font-serif text-2xl">Nous n'avons trouvé aucune chambre disponible pour ces dates.</h3>
                      <button onClick={() => go(1)} className="btn-dark mt-6">Modifier les dates</button>
                    </div>
                  ) : available.map((r) => {
                    const sel = r.id === selectedRoomId;
                    return (
                      <div key={r.id} className={`flex flex-col overflow-hidden rounded-3xl bg-white ring-2 transition sm:flex-row ${sel ? "ring-gold" : "ring-transparent"} ${!r.isAvailable ? "opacity-60" : ""}`}>
                        <img src={r.images[0]} alt={r.name} className="h-48 w-full object-cover sm:h-auto sm:w-64" />
                        <div className="flex flex-1 flex-col p-6">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div><p className="text-xs uppercase tracking-widest text-gold">{r.category}</p><h3 className="font-serif text-2xl">{r.name}</h3></div>
                            <span className={`rounded-full px-3 py-1 text-xs ${r.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{r.isAvailable ? "Disponible" : "Complet"}</span>
                          </div>
                          <p className="mt-2 flex items-center gap-2 text-sm text-night/60"><Users size={14} /> {r.capacity} pers. · {r.size} m² · {r.bed}</p>
                          <p className="mt-2 text-xs text-night/55">{r.amenities.slice(0, 5).join(" · ")}</p>
                          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                            <div><span className="font-serif text-2xl">{formatPrice(r.price)}</span><span className="text-xs text-night/50"> / nuit</span>
                              <div className="text-xs text-night/50">{formatPrice(calculatePrice(r.price, stay.checkIn, stay.checkOut, stay.rooms).total)} au total</div></div>
                            <button disabled={!r.isAvailable} onClick={() => selectRoom(r.id)} className={sel ? "btn bg-gold text-white" : "btn-outline"}>{sel ? <><Check size={15} /> Sélectionnée</> : "Choisir"}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className="flex justify-between pt-2">
                  <button onClick={() => go(1)} className="btn-outline"><ArrowLeft size={16} /> Retour</button>
                  <button disabled={!room || !available?.find((r) => r.id === selectedRoomId && r.isAvailable)} onClick={() => go(3)} className="btn-dark">Continuer <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={submitGuest} noValidate className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-10">
                <h2 className="font-serif text-3xl">Vos informations</h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field label="Prénom *" error={gErrors.firstName}><input className={cls("firstName")} value={form.firstName} onChange={setF("firstName")} autoComplete="given-name" /></Field>
                  <Field label="Nom *" error={gErrors.lastName}><input className={cls("lastName")} value={form.lastName} onChange={setF("lastName")} autoComplete="family-name" /></Field>
                  <Field label="Email *" error={gErrors.email}><input type="email" className={cls("email")} value={form.email} onChange={setF("email")} autoComplete="email" /></Field>
                  <Field label="Téléphone *" error={gErrors.phone}><input type="tel" className={cls("phone")} value={form.phone} onChange={setF("phone")} placeholder="+33 6 12 34 56 78" autoComplete="tel" /></Field>
                  <Field label="Pays *" error={gErrors.country} className="sm:col-span-2"><select className={cls("country")} value={form.country} onChange={setF("country")}>{countries.map((c) => <option key={c}>{c}</option>)}</select></Field>
                  <Field label="Demandes particulières" className="sm:col-span-2"><textarea rows={4} className="input" value={form.requests} onChange={setF("requests")} placeholder="Heure d'arrivée, lit bébé, allergies…" /></Field>
                </div>
                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={() => go(2)} className="btn-outline"><ArrowLeft size={16} /> Retour</button>
                  <button className="btn-dark">Voir le récapitulatif <ArrowRight size={16} /></button>
                </div>
              </form>
            )}

            {step === 4 && room && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-10">
                <h2 className="font-serif text-3xl">Récapitulatif</h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {[
                    ["Séjour", <><div>Arrivée : <strong>{formatDate(stay.checkIn)}</strong></div><div>Départ : <strong>{formatDate(stay.checkOut)}</strong></div><div className="text-night/60">{nights} nuit(s)</div></>, 1],
                    ["Voyageurs", <><div>{stay.adults} adulte{stay.adults > 1 && "s"}</div><div>{stay.children} enfant{stay.children > 1 && "s"}</div><div className="text-night/60">{stay.rooms} chambre(s)</div></>, 1],
                    ["Chambre", <><div className="font-serif text-xl">{room.name}</div><div className="text-night/60">{room.size} m² · {room.bed}</div></>, 2],
                    ["Client", <><div>{guest.firstName} {guest.lastName}</div><div className="text-night/60">{guest.email} · {guest.phone}</div><div className="text-night/60">{guest.country}</div>{guest.requests && <div className="mt-1 italic text-night/60">« {guest.requests} »</div>}</>, 3],
                  ].map(([t, c, s]) => (
                    <div key={t} className="rounded-2xl bg-ivory p-5 text-sm">
                      <div className="mb-2 flex items-center justify-between"><h3 className="label !mb-0">{t}</h3><button onClick={() => go(s)} className="flex items-center gap-1 text-xs text-gold hover:underline"><Pencil size={11} /> Modifier</button></div>{c}
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-night/10 p-5"><h3 className="label">Tarif</h3><PriceSummary pricing={pricing} /></div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-night/70">
                  <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0f1b2d]" />J'accepte les conditions générales de vente et la politique d'annulation.
                </label>
                <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                  <button onClick={() => go(3)} className="btn-outline"><Pencil size={15} /> Modifier</button>
                  <button disabled={!accept || submitting} onClick={confirm} className="btn-dark !py-4">{submitting ? <><Spinner /> Confirmation en cours…</> : <><Lock size={15} /> Confirmer la réservation</>}</button>
                </div>
              </div>
            )}
          </div>

          <aside>
            <div className="sticky top-24 overflow-hidden rounded-3xl bg-night text-white">
              {room ? <img src={room.images[0]} alt="" className="h-40 w-full object-cover opacity-90" /> : null}
              <div className="p-6">
                <h3 className="font-serif text-2xl">Votre séjour</h3>
                <div className="mt-4 space-y-2 text-sm text-white/75">
                  <p className="flex items-center gap-2"><CalendarDays size={15} className="text-gold" />{stay.checkIn ? `${formatDate(stay.checkIn, { day: "numeric", month: "short" })} → ${formatDate(stay.checkOut, { day: "numeric", month: "short" })}` : "Dates à définir"}</p>
                  <p className="flex items-center gap-2"><Users size={15} className="text-gold" />{stay.adults} adulte(s), {stay.children} enfant(s)</p>
                  <p className="font-serif text-xl text-white">{room ? room.name : "Aucune chambre sélectionnée"}</p>
                </div>
                {room && nights > 0 && <div className="mt-6 border-t border-white/15 pt-5"><PriceSummary dark pricing={pricing} /></div>}
                {!room && <Link to="/hebergements" className="mt-5 inline-block text-xs text-gold underline">Parcourir les hébergements</Link>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
