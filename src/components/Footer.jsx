import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera as Instagram, Share2 as Facebook, Music2, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { Logo } from "./Navbar";
import { HOTEL, isEmail } from "../utils/booking";
import { subscribeNewsletter } from "../services/api";
import { Spinner } from "./ui";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setErr("Adresse email invalide.");
    setErr(""); setStatus("loading");
    await subscribeNewsletter(email);
    setStatus("done"); setEmail("");
  };

  const col = "space-y-3 text-sm text-white/60";
  const a = "transition hover:text-white";
  return (
    <footer className="bg-night text-white">
      <div className="container-x grid gap-12 py-20 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo light />
          <p className="mt-6 text-sm text-white/55">Un refuge d'élégance au cœur de Paris depuis 1924.</p>
          <div className="mt-6 flex gap-3">
            {[[Instagram, "Instagram"], [Facebook, "Facebook"], [Music2, "TikTok"]].map(([I, n]) => (
              <a key={n} href="#" aria-label={n} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:border-gold hover:text-gold"><I size={16} /></a>
            ))}
          </div>
        </div>
        <div><h4 className="mb-5 font-serif text-xl">Hôtel</h4><ul className={col}>
          <li><Link className={a} to="/">Accueil</Link></li><li><Link className={a} to="/a-propos">À propos</Link></li><li><Link className={a} to="/hebergements">Hébergements</Link></li></ul></div>
        <div><h4 className="mb-5 font-serif text-xl">Services</h4><ul className={col}>
          <li><Link className={a} to="/restaurant">Restaurant</Link></li><li><Link className={a} to="/evenements">Événements</Link></li><li><Link className={a} to="/reservation">Réservation</Link></li></ul></div>
        <div><h4 className="mb-5 font-serif text-xl">Contact</h4><ul className={col}>
          <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" />{HOTEL.address}</li>
          <li className="flex gap-2"><Phone size={16} className="text-gold" /><a className={a} href={`tel:${HOTEL.phone}`}>{HOTEL.phone}</a></li>
          <li className="flex gap-2"><Mail size={16} className="text-gold" /><a className={a} href={`mailto:${HOTEL.email}`}>{HOTEL.email}</a></li></ul></div>
        <div><h4 className="mb-5 font-serif text-xl">Newsletter</h4>
          <p className="text-sm text-white/60">Recevez nos offres exclusives</p>
          {status === "done" ? <p className="mt-4 text-sm text-gold">Merci ! Vous êtes inscrit(e).</p> : (
            <form onSubmit={submit} className="mt-4">
              <div className="flex overflow-hidden rounded-full border border-white/20 focus-within:border-gold">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre email" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/40" />
                <button disabled={status === "loading"} className="grid w-12 place-items-center bg-gold text-night" aria-label="S'inscrire">{status === "loading" ? <Spinner /> : <ArrowRight size={16} />}</button>
              </div>
              {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-white/10"><div className="container-x flex flex-col justify-between gap-2 py-6 text-xs text-white/40 sm:flex-row">
        <span>© {new Date().getFullYear()} {HOTEL.name}. Tous droits réservés.</span><span>Mentions légales · Confidentialité · CGV</span></div></div>
    </footer>
  );
}
