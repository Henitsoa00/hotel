import { Link } from "react-router-dom";
import { heroImage } from "../data/gallery";
import BookingSearch from "./BookingSearch";

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <img src={heroImage} alt="Maison Aurèle" className="absolute inset-0 h-full w-full object-cover animate-fade-in" style={{ animationDuration: "1.6s" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-night/30 to-night/80" />
      <div className="container-x relative flex flex-1 flex-col justify-center pb-10 pt-36 text-white">
        <p className="eyebrow !text-beige animate-fade-up">Bienvenue à Maison Aurèle</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[1.02] animate-fade-up sm:text-7xl lg:text-8xl" style={{ animationDelay: ".15s" }}>
          Votre séjour <em className="text-beige">commence</em> ici.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/80 animate-fade-up" style={{ animationDelay: ".3s" }}>
          Découvrez une expérience unique où confort, élégance et hospitalité se rencontrent.
        </p>
        <div className="mt-9 flex flex-col gap-3 animate-fade-up sm:flex-row" style={{ animationDelay: ".45s" }}>
          <Link to="/a-propos" className="btn-ghost-light">Découvrir l'hôtel</Link>
          <Link to="/reservation" className="btn-light">Réserver maintenant</Link>
        </div>
      </div>
      <div className="container-x relative pb-10 animate-fade-up" style={{ animationDelay: ".6s" }}>
        <BookingSearch />
      </div>
    </section>
  );
}
