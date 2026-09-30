import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ArrowLeft } from "lucide-react";
import { Logo } from "../../components/Navbar";
import { heroImage } from "../../data/gallery";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Busy, adminButton, adminField } from "../components/ui";
import { DEMO_PASSWORD } from "../data/users";

export default function Login() {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  if (user) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!email.trim() || !password) return setError("Renseignez votre email et votre mot de passe.");
    setLoading(true);
    try { await login(email, password, remember); navigate(location.state?.from || "/admin/dashboard", { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div className="admin-shell grid min-h-screen bg-ivory lg:grid-cols-[1fr_1fr]">
    <div className="relative hidden min-h-screen overflow-hidden bg-night text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <img src={heroImage} alt="Maison Aurèle" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-night/45" />
      <div className="relative"><Logo light /><div className="mt-3 h-px w-16 bg-gold"/></div>
      <div className="relative max-w-xl animate-fade-up"><p className="text-[11px] font-medium uppercase tracking-[.3em] text-beige">Espace réservé à l'équipe</p><h1 className="mt-5 font-serif text-6xl leading-[1.04] xl:text-[76px]">L'excellence se cultive <em>chaque jour.</em></h1><p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">Un espace unique pour orchestrer l'hospitalité, soigner chaque détail et offrir une expérience inoubliable.</p></div>
      <p className="relative text-xs text-white/50">Maison Aurèle · Paris · Depuis 1924</p>
    </div>
    <div className="flex min-h-screen flex-col px-5 py-8 sm:px-12 lg:px-16 xl:px-24">
      <div className="flex items-center justify-between"><div className="lg:hidden"><Logo /></div><span className="hidden text-[10px] font-medium uppercase tracking-[.2em] text-gold lg:block">Maison Aurèle · Administration</span><Link to="/" className="flex items-center gap-1 text-xs text-night/50 hover:text-night"><ArrowLeft size={13}/> Site public</Link></div>
      <div className="my-auto w-full max-w-md self-center py-12 animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-night text-beige"><LockKeyhole size={21} strokeWidth={1.5}/></div>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[.22em] text-gold">Bienvenue</p>
        <h2 className="mt-2 font-serif text-5xl">Accédez à votre <em>espace</em></h2>
        <p className="mt-3 text-sm text-night/55">Connectez-vous pour retrouver votre tableau de bord.</p>
        <form onSubmit={submit} noValidate className="mt-9 space-y-5">
          <label className="block"><span className="mb-2 block text-xs font-medium">Adresse email</span><div className="relative"><Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-night/40"/><input autoComplete="username" type="email" className={`${adminField} !py-3.5 !pl-11`} placeholder="nom@maison-aurele.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
          <label className="block"><span className="mb-2 block text-xs font-medium">Mot de passe</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-night/40"/><input autoComplete="current-password" type={visible ? "text" : "password"} className={`${adminField} !py-3.5 !pl-11 !pr-11`} placeholder="Votre mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setVisible(!visible)} title={visible ? "Masquer" : "Afficher"} className="absolute right-3 top-1/2 -translate-y-1/2 text-night/40 hover:text-night">{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          <div className="flex items-center justify-between gap-3 text-xs"><label className="flex cursor-pointer items-center gap-2 text-night/60"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#0f1b2d]"/> Se souvenir de moi</label><button type="button" onClick={() => setForgot(!forgot)} className="text-gold hover:underline">Mot de passe oublié ?</button></div>
          {forgot && <p className="rounded-xl bg-sand/55 p-3 text-xs text-night/70">Cette démonstration ne peut pas envoyer d'email. Contactez le Super Admin pour réinitialiser votre accès.</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <button disabled={loading} className={`${adminButton} w-full !py-3.5`}>{loading ? <><Busy/> Connexion...</> : <>Se connecter <ArrowRight size={16}/></>}</button>
        </form>
        <div className="mt-8 rounded-2xl border border-gold/20 bg-sand/40 p-4 text-xs text-night/65"><span className="mb-2 block font-medium text-night">Accès de démonstration</span><span className="block">Email : <code className="select-all text-night">admin@maison-aurele.com</code></span><span className="mt-1 block">Mot de passe : <code className="select-all text-night">{DEMO_PASSWORD}</code></span><p className="mt-2 text-[10px] text-night/45">Connexion mockée, non sécurisée pour la production.</p></div>
      </div>
      <p className="text-center text-[11px] text-night/35">© {new Date().getFullYear()} Maison Aurèle. Réservé au personnel.</p>
    </div>
  </div>;
}