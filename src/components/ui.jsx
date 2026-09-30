import { useEffect, useRef } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

export function Counter({ label, sub, value, onChange, min = 0, max = 10 }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><div className="text-sm font-medium">{label}</div>{sub && <div className="text-xs text-night/50">{sub}</div>}</div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Moins ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-night/20 transition hover:border-night disabled:opacity-30"><Minus size={14} /></button>
        <span className="w-5 text-center font-medium">{value}</span>
        <button type="button" aria-label={`Plus ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-night/20 transition hover:border-night disabled:opacity-30"><Plus size={14} /></button>
      </div>
    </div>
  );
}

export function Field({ label, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export const Spinner = ({ size = 16 }) => <Loader2 size={size} className="animate-spin" />;

export function PageHero({ eyebrow, title, subtitle, image }) {
  return (
    <section className="relative flex h-[62vh] min-h-[420px] items-end overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover animate-fade-in" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/40 to-night/20" />
      <div className="container-x relative pb-16 text-white animate-fade-up">
        <p className="eyebrow !text-beige">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-xl text-white/80">{subtitle}</p>}
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, text, center }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-night/65">{text}</p>}
    </Reveal>
  );
}

export function SuccessBox({ title, text, onReset }) {
  return (
    <div className="animate-fade-up rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-2xl text-white">✓</div>
      <h3 className="mt-4 font-serif text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-night/70">{text}</p>
      {onReset && <button onClick={onReset} className="btn-outline mt-6">Nouvelle demande</button>}
    </div>
  );
}
