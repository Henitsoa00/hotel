import { Star, Quote } from "lucide-react";

export default function TestimonialCard({ t }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-white p-8 ring-1 ring-night/5">
      <Quote className="text-gold" size={28} />
      <blockquote className="mt-4 flex-1 font-serif text-xl leading-relaxed">« {t.text} »</blockquote>
      <div className="mt-6 flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-gold text-gold" />)}</div>
      <figcaption className="mt-3"><div className="font-medium">{t.name}</div><div className="text-xs text-night/50">{t.origin}</div></figcaption>
    </figure>
  );
}
