import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Clock, ChefHat, Wine, Leaf } from "lucide-react";
import RestaurantMenu from "../components/RestaurantMenu";
import { PageHero, SectionTitle, Reveal, Field, Spinner, SuccessBox } from "../components/ui";
import { openingHours, timeSlots } from "../data/restaurant";
import { reserveRestaurantTable } from "../services/api";
import { validateFields, todayISO, formatDate } from "../utils/booking";

const empty = { date: "", time: "", people: 2, name: "", phone: "" };

export default function Restaurant() {
  const { hash } = useLocation();
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [ref, setRef] = useState("");
  useEffect(() => { if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 300); }, [hash]);

  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const submit = async (e) => {
    e.preventDefault();
    const errs = validateFields(v, { date: { required: true }, time: { required: true }, name: { required: true }, phone: { required: true, phone: true } });
    if (v.date && v.date < todayISO()) errs.date = "Date passée.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("loading");
    const r = await reserveRestaurantTable(v);
    setRef(r.ref); setStatus("done");
  };
  const cls = (k) => `input ${errors[k] ? "input-error" : ""}`;

  return (
    <>
      <PageHero eyebrow="Restaurant L'Aurèle" title={<>L'art de la <em>table française</em></>} subtitle="Une cuisine de saison, créative et généreuse, signée par le Chef Antoine Lemaire." image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=75" />

      <section className="container-x grid items-center gap-14 py-28 md:grid-cols-2">
        <Reveal><img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=75" alt="Chef" className="aspect-[4/5] w-full rounded-[2rem] object-cover" /></Reveal>
        <Reveal delay={120}>
          <p className="eyebrow">Le Chef</p>
          <h2 className="mt-3 font-serif text-5xl">Antoine <em>Lemaire</em></h2>
          <p className="mt-5 text-night/70">Formé auprès des plus grandes maisons, le Chef Lemaire imagine une cuisine d'instinct, respectueuse du produit et des producteurs d'Île-de-France. Chaque assiette raconte une saison.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[[ChefHat, "Concept", "Bistronomie étoilée"], [Wine, "Ambiance", "Feutrée & lumineuse"], [Leaf, "Produits", "Locaux & de saison"]].map(([I, t, d]) => (
              <div key={t} className="rounded-2xl bg-white p-5 ring-1 ring-night/5"><I className="text-gold" size={22} strokeWidth={1.5} /><div className="mt-3 font-serif text-lg">{t}</div><div className="text-xs text-night/55">{d}</div></div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-night p-6 text-white">
            <h3 className="flex items-center gap-2 font-serif text-xl"><Clock size={18} className="text-gold" /> Horaires</h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">{openingHours.map((h) => <li key={h.label}><span className="text-white/55">{h.label}</span><br />{h.hours}</li>)}</ul>
          </div>
        </Reveal>
      </section>

      <section className="bg-sand/50 py-28">
        <div className="container-x">
          <SectionTitle center eyebrow="La carte" title={<>Notre <em>menu</em></>} text="Une carte courte, renouvelée au fil des saisons." />
          <div className="mt-12"><RestaurantMenu /></div>
        </div>
      </section>

      <section id="table" className="container-x scroll-mt-24 py-28">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionTitle eyebrow="Réservation" title={<>Réserver une <em>table</em></>} text="Réservez en ligne en quelques secondes. Pour les groupes de plus de 10 personnes, contactez-nous directement." />
          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-8">
            {status === "done" ? <SuccessBox title="Table réservée !" text={`Référence ${ref} — ${v.people} pers. le ${formatDate(v.date)} à ${v.time}. Nous vous attendons, ${v.name}.`} onReset={() => { setV(empty); setStatus("idle"); }} /> : (
              <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                <Field label="Date *" error={errors.date}><input type="date" min={todayISO()} className={cls("date")} value={v.date} onChange={set("date")} /></Field>
                <Field label="Heure *" error={errors.time}><select className={cls("time")} value={v.time} onChange={set("time")}><option value="">Choisir…</option>{timeSlots.map((t) => <option key={t}>{t}</option>)}</select></Field>
                <Field label="Nombre de personnes" className="sm:col-span-2"><select className="input" value={v.people} onChange={set("people")}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} personne{n > 1 && "s"}</option>)}</select></Field>
                <Field label="Nom *" error={errors.name}><input className={cls("name")} value={v.name} onChange={set("name")} /></Field>
                <Field label="Téléphone *" error={errors.phone}><input className={cls("phone")} value={v.phone} onChange={set("phone")} /></Field>
                <button disabled={status === "loading"} className="btn-dark sm:col-span-2">{status === "loading" ? <><Spinner /> Réservation…</> : "Réserver une table"}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
