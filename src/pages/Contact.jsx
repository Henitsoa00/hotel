import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "../components/ContactForm";
import { PageHero, Reveal } from "../components/ui";
import { HOTEL } from "../utils/booking";

export default function Contact() {
  const infos = [
    [MapPin, "Adresse", HOTEL.address, "https://maps.google.com/?q=12+Avenue+Montaigne+Paris"],
    [Phone, "Téléphone", HOTEL.phone, `tel:${HOTEL.phone}`],
    [Mail, "Email", HOTEL.email, `mailto:${HOTEL.email}`],
    [Clock, "Réception", "Ouverte 24h/24, 7j/7", null],
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Nous sommes à <em>votre écoute</em></>} subtitle="Une question, une demande particulière ? Notre équipe vous répond avec plaisir." image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=75" />
      <section className="container-x grid gap-10 py-24 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          {infos.map(([I, t, v, href], i) => (
            <Reveal key={t} delay={i * 80} className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-night/5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-gold"><I size={20} /></span>
              <div><div className="label !mb-1">{t}</div>{href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="hover:text-gold">{v}</a> : <span>{v}</span>}</div>
            </Reveal>
          ))}
        </div>
        <Reveal className="rounded-3xl bg-white p-6 ring-1 ring-night/5 md:p-10">
          <h2 className="font-serif text-3xl">Envoyez-nous un message</h2>
          <div className="mt-8"><ContactForm /></div>
        </Reveal>
      </section>
      <section className="container-x pb-24">
        <Reveal className="relative h-[420px] overflow-hidden rounded-[2rem] bg-sand">
          <iframe title="Carte" className="h-full w-full grayscale-[60%]" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=2.2990%2C48.8625%2C2.3130%2C48.8695&layer=mapnik&marker=48.8660%2C2.3060" />
          <div className="pointer-events-none absolute bottom-6 left-6 rounded-2xl bg-white/95 p-5 shadow-lg"><div className="font-serif text-xl">{HOTEL.name}</div><div className="text-sm text-night/60">{HOTEL.address}</div></div>
        </Reveal>
      </section>
    </>
  );
}
