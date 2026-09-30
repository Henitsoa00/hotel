import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/hebergements", label: "Hébergements" },
  { to: "/restaurant", label: "Restaurant" },
  { to: "/evenements", label: "Événements" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

export function Logo({ light, to = "/" }) {
  return (
    <Link to={to} className={`flex flex-col leading-none ${light ? "text-white" : "text-night"}`}>
      <span className="font-serif text-2xl tracking-wide">Maison <em>Aurèle</em></span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.45em] opacity-70">Hôtel · Paris ★★★★★</span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const overHero = !pathname.startsWith("/reservation");
  const light = overHero && !scrolled && !open;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${light ? "py-6" : "bg-ivory/90 py-3 shadow-[0_1px_0_rgba(15,27,45,.08)] backdrop-blur-lg"}`}>
      <div className="container-x flex items-center justify-between">
        <Logo light={light} />
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) =>
              `relative text-sm tracking-wide transition after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-gold after:transition-all ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"} ${light ? "text-white/90 hover:text-white" : "text-night/80 hover:text-night"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/reservation" className={`hidden sm:inline-flex ${light ? "btn-light" : "btn-dark"} !py-2.5`}>Réserver</Link>
          <button onClick={() => setOpen(!open)} aria-label="Menu" className={`grid h-10 w-10 place-items-center rounded-full lg:hidden ${light ? "text-white" : "text-night"}`}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-500 lg:hidden ${open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="container-x flex flex-col gap-1 py-6">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `border-b border-night/5 py-3 font-serif text-2xl ${isActive ? "text-gold" : ""}`}>{l.label}</NavLink>
          ))}
          <Link to="/reservation" className="btn-dark mt-4 w-full">Réserver</Link>
        </nav>
      </div>
    </header>
  );
}
