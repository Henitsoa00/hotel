import { useRef, useState } from "react";
import { Users, Maximize } from "lucide-react";
import EventCard from "../components/EventCard";
import { PageHero, SectionTitle, Reveal, Field, Spinner, SuccessBox } from "../components/ui";
import { eventTypes, spaces } from "../data/events";
import { requestEvent } from "../services/api";
import { validateFields, todayISO } from "../utils/booking";

const empty = { name: "", email: "", phone: "", type: "", date: "", guests: "", message: "" };

export default function Events() {
  const formRef = useRef(null);
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [ref, setRef] = useState("");

  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const pick = (type) => { setV((s) => ({ ...s, type })); formRef.current.scrollIntoView({ behavior: "smooth" }); };
  const submit = async (e) => {
    e.preventDefault();
    const errs = validateFields(v, { name: { required: true }, email: { required: true, email: true }, phone: { required: true, phone: true }, type: { required: true }, date: { required: true }, guests: { required: true } });
    if (v.guests && (+v.guests < 1 || +v.guests > 250)) errs.guests = "Entre 1 et 250 personnes.";
    if (v.date && v.date < todayISO()) errs.date = "Date passée.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("loading");
    const r = await requestEvent(v);
    setRef(r.ref); setStatus("done");
  };
  const cls = (k) => `input ${errors[k] ? "input-error" : ""}`;

  return (
    <>
      <PageHero eyebrow="Événements" title={<>Des moments <em>inoubliables</em></>} subtitle="Mariages, séminaires, galas : nos équipes orchestrent chaque détail de vos événements." image="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=2000&q=75" />

      <section className="container-x py-28">
        <SectionTitle eyebrow="Nos offres" title={<>Chaque occasion, <em>sublimée</em></>} />
        <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">{eventTypes.map((e, i) => <Reveal key={e.id} delay={(i % 3) * 100}><EventCard event={e} onRequest={pick} /></Reveal>)}</div>
      </section>

      <section className="bg-night py-28 text-white">
        <div className="container-x">
          <Reveal><p className="eyebrow">Nos espaces</p><h2 className="mt-3 font-serif text-5xl">1 200 m² <em>modulables</em></h2></Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {spaces.map((s, i) => (
              <Reveal key={s.name} delay={i * 100} className="group relative aspect-[3/4] overflow-hidden rounded-3xl">
                <img src={s.image} alt={s.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-night/90 to-transparent p-6">
                  <h3 className="font-serif text-2xl">{s.name}</h3>
                  <div className="mt-2 flex gap-4 text-xs text-white/70"><span className="flex items-center gap-1"><Users size={12} /> {s.capacity} pers.</span><span className="flex items-center gap-1"><Maximize size={12} /> {s.size} m²</span></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section ref={formRef} className="container-x scroll-mt-24 py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <SectionTitle eyebrow="Devis" title={<>Parlons de votre <em>projet</em></>} text="Notre équipe événementielle vous répond sous 24h avec une proposition personnalisée." />
          <div className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-8">
            {status === "done" ? <SuccessBox title="Demande envoyée !" text={`Référence ${ref}. Notre coordinatrice événementielle vous contactera très prochainement.`} onReset={() => { setV(empty); setStatus("idle"); }} /> : (
              <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom *" error={errors.name}><input className={cls("name")} value={v.name} onChange={set("name")} /></Field>
                <Field label="Email *" error={errors.email}><input type="email" className={cls("email")} value={v.email} onChange={set("email")} /></Field>
                <Field label="Téléphone *" error={errors.phone}><input className={cls("phone")} value={v.phone} onChange={set("phone")} /></Field>
                <Field label="Type d'événement *" error={errors.type}><select className={cls("type")} value={v.type} onChange={set("type")}><option value="">Choisir…</option>{eventTypes.map((e) => <option key={e.id}>{e.title}</option>)}</select></Field>
                <Field label="Date souhaitée *" error={errors.date}><input type="date" min={todayISO()} className={cls("date")} value={v.date} onChange={set("date")} /></Field>
                <Field label="Nombre de personnes *" error={errors.guests}><input type="number" min="1" className={cls("guests")} value={v.guests} onChange={set("guests")} /></Field>
                <Field label="Message" className="sm:col-span-2"><textarea rows={4} className="input" value={v.message} onChange={set("message")} /></Field>
                <button disabled={status === "loading"} className="btn-dark sm:col-span-2">{status === "loading" ? <><Spinner /> Envoi…</> : "Demander un devis"}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
