import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, UtensilsCrossed, Waves, Dumbbell, Car, ConciergeBell } from "lucide-react";
import Hero from "../components/Hero";
import RoomCard from "../components/RoomCard";
import TestimonialCard from "../components/TestimonialCard";
import Gallery from "../components/Gallery";
import { Reveal, SectionTitle, Spinner } from "../components/ui";
import { getRooms } from "../services/api";
import { testimonials } from "../data/testimonials";
import { gallery } from "../data/gallery";

const services = [
  [Sparkles, "Spa & bien-être", "Soins signature et hammam"],
  [UtensilsCrossed, "Gastronomie", "Restaurant du Chef Lemaire"],
  [Waves, "Piscine intérieure", "Bassin chauffé de 20 m"],
  [Dumbbell, "Fitness", "Ouvert 24h/24"],
  [ConciergeBell, "Conciergerie", "Service sur mesure"],
  [Car, "Voiturier", "Transferts aéroport"],
];

export default function Home() {
  const [rooms, setRooms] = useState(null);
  useEffect(() => { getRooms().then((r) => setRooms(r.filter((x) => [2, 4, 6].includes(x.id)))); }, []);

  return (
    <>
      <Hero />

      <section className="container-x grid items-center gap-12 py-28 md:grid-cols-[1fr_1.2fr_1fr]">
        <Reveal><img src={gallery[2].src} alt="" className="aspect-[4/5] w-full rounded-[2rem] object-cover" /></Reveal>
        <Reveal className="text-center" delay={100}>
          <span className="text-2xl text-gold">✦</span>
          <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Là où l'élégance <em>devient</em> un art de vivre.</h2>
          <p className="mt-5 text-night/65">Depuis 1924, Maison Aurèle accueille voyageurs et esthètes dans un écrin haussmannien entièrement repensé. 64 chambres et suites, un restaurant gastronomique et un spa confidentiel.</p>
          <Link to="/a-propos" className="btn-dark mt-8">Notre histoire</Link>
        </Reveal>
        <Reveal delay={200}><img src={gallery[1].src} alt="" className="aspect-[4/5] w-full rounded-[2rem] object-cover md:mt-24" /></Reveal>
      </section>

      <section className="bg-sand/50 py-28">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionTitle eyebrow="Hébergements" title={<>Chambres & <em>suites</em></>} text="Chaque espace a été pensé comme un appartement privé, entre matériaux nobles et lumière naturelle." />
            <Link to="/hebergements" className="btn-outline shrink-0">Toutes les chambres <ArrowRight size={16} /></Link>
          </div>
          {!rooms ? <div className="grid h-64 place-items-center"><Spinner size={28} /></div> : (
            <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">{rooms.map((r, i) => <Reveal key={r.id} delay={i * 120}><RoomCard room={r} /></Reveal>)}</div>
          )}
        </div>
      </section>

      <section className="container-x py-28">
        <SectionTitle center eyebrow="Services" title={<>L'excellence, <em>à chaque instant</em></>} />
        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {services.map(([I, t, d], i) => (
            <Reveal key={t} delay={i * 70} className="rounded-3xl bg-white p-6 text-center ring-1 ring-night/5 transition hover:-translate-y-1 hover:shadow-lg">
              <I className="mx-auto text-gold" size={28} strokeWidth={1.4} /><h3 className="mt-4 font-serif text-xl">{t}</h3><p className="mt-1 text-xs text-night/55">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-night">
          <img src={gallery[4].src} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="relative grid gap-10 p-10 text-white md:grid-cols-2 md:p-20">
            <div>
              <p className="eyebrow !text-beige">Restaurant L'Aurèle</p>
              <h2 className="mt-4 font-serif text-5xl">Une table <em>d'exception</em></h2>
              <p className="mt-5 max-w-md text-white/75">Une cuisine française contemporaine, sublimée par les produits de saison et une cave de 800 références.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link to="/restaurant" className="btn-light">Voir le menu</Link><Link to="/restaurant#table" className="btn-ghost-light">Réserver une table</Link></div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-x py-28">
        <SectionTitle eyebrow="Galerie" title={<>Un avant-goût de <em>votre séjour</em></>} />
        <div className="mt-12"><Gallery /></div>
      </section>

      <section className="bg-sand/50 py-28">
        <div className="container-x">
          <SectionTitle center eyebrow="Témoignages" title={<>Ils nous ont <em>fait confiance</em></>} />
          <div className="mt-14 grid gap-6 md:grid-cols-3">{testimonials.map((t, i) => <Reveal key={t.id} delay={i * 120}><TestimonialCard t={t} /></Reveal>)}</div>
        </div>
      </section>

      <section className="container-x py-24 text-center">
        <Reveal>
          <h2 className="font-serif text-4xl md:text-6xl">Prêt à vivre <em>l'expérience</em> ?</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/reservation" className="btn-dark">Réserver un séjour</Link><Link to="/evenements" className="btn-outline">Organiser un événement</Link></div>
        </Reveal>
      </section>
    </>
  );
}
