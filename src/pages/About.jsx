import { Link } from "react-router-dom";
import { Gem, HeartHandshake, Sofa, Award, Sparkles } from "lucide-react";
import { PageHero, SectionTitle, Reveal } from "../components/ui";

const timeline = [
  ["1924", "La naissance", "Édouard Aurèle ouvre un hôtel particulier de 20 chambres avenue Montaigne."],
  ["1968", "L'âge d'or", "L'hôtel devient le repaire des artistes et créateurs de la haute couture parisienne."],
  ["2004", "Le restaurant", "Ouverture de L'Aurèle, récompensé d'une première étoile trois ans plus tard."],
  ["2019", "La renaissance", "Trois ans de rénovation menés par l'architecte Clara Duval : 64 chambres, spa et piscine."],
  ["2026", "Aujourd'hui", "Distinction Palace et engagement neutre en carbone d'ici 2030."],
];
const team = [
  ["Hélène Aurèle", "Directrice générale", "photo-1573496359142-b8d87734a5a2"],
  ["Antoine Lemaire", "Chef exécutif", "photo-1577219491135-ce391730fb2c"],
  ["Marc Delorme", "Chef concierge", "photo-1560250097-0b93528c311a"],
  ["Inès Benali", "Directrice événements", "photo-1580489944761-15a19d654956"],
];
const values = [[Gem, "Qualité"], [HeartHandshake, "Hospitalité"], [Sofa, "Confort"], [Award, "Excellence"], [Sparkles, "Expérience client"]];

export default function About() {
  return (
    <>
      <PageHero eyebrow="À propos" title={<>Un siècle <em>d'hospitalité</em></>} subtitle="L'histoire d'une maison familiale devenue une adresse incontournable de Paris." image="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=75" />

      <section className="container-x grid gap-14 py-28 md:grid-cols-2">
        <SectionTitle eyebrow="Notre philosophie" title={<>Recevoir comme <em>à la maison</em></>} />
        <Reveal className="space-y-5 text-night/70">
          <p>Chez Maison Aurèle, nous croyons que le luxe véritable réside dans l'attention portée aux détails invisibles : un prénom retenu, un oreiller choisi, un sourire sincère.</p>
          <p>Notre vision : être la maison parisienne de chaque voyageur, en conjuguant héritage, design contemporain et engagement durable.</p>
        </Reveal>
      </section>

      <section className="bg-sand/50 py-28">
        <div className="container-x">
          <SectionTitle center eyebrow="Histoire" title={<>Notre <em>chronologie</em></>} />
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute left-4 top-0 h-full w-px bg-gold/40 md:left-1/2" />
            {timeline.map(([y, t, d], i) => (
              <Reveal key={y} className={`relative mb-12 pl-14 md:w-1/2 md:pl-0 ${i % 2 ? "md:ml-auto md:pl-14" : "md:pr-14 md:text-right"}`}>
                <span className={`absolute left-[9px] top-2 h-3 w-3 rounded-full bg-gold ring-4 ring-sand md:left-auto ${i % 2 ? "md:-left-[6px]" : "md:-right-[6px]"}`} />
                <div className="font-serif text-4xl text-gold">{y}</div>
                <h3 className="mt-1 font-serif text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-night/65">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-28">
        <SectionTitle center eyebrow="Notre engagement" title={<>Cinq valeurs, <em>une promesse</em></>} />
        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-5">
          {values.map(([I, t], i) => (
            <Reveal key={t} delay={i * 80} className="rounded-3xl bg-white p-8 text-center ring-1 ring-night/5"><I className="mx-auto text-gold" size={30} strokeWidth={1.3} /><h3 className="mt-4 font-serif text-xl">{t}</h3></Reveal>
          ))}
        </div>
      </section>

      <section className="bg-night py-28 text-white">
        <div className="container-x">
          <Reveal><p className="eyebrow">L'équipe</p><h2 className="mt-3 font-serif text-5xl">Les visages de la <em>maison</em></h2></Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(([n, r, img], i) => (
              <Reveal key={n} delay={i * 100} className="group">
                <div className="aspect-[3/4] overflow-hidden rounded-3xl"><img src={`https://images.unsplash.com/${img}?auto=format&fit=crop&w=700&q=70`} alt={n} className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /></div>
                <h3 className="mt-4 font-serif text-2xl">{n}</h3><p className="text-sm text-white/55">{r}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-24 text-center">
        <Reveal><h2 className="font-serif text-4xl md:text-5xl">Écrivez le prochain <em>chapitre</em> avec nous.</h2><Link to="/reservation" className="btn-dark mt-8">Réserver un séjour</Link></Reveal>
      </section>
    </>
  );
}
