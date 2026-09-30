import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, BedDouble, UsersRound, Sparkles, Wrench, Package, UtensilsCrossed, CalendarRange, Wallet, ReceiptText, ChartNoAxesCombined, UserRoundCog, Settings2, LogOut, Bell, Search, Menu, X, ExternalLink, ChevronRight, ChevronDown, CheckCheck, Command, ShieldAlert } from "lucide-react";
import { Logo } from "../../components/Navbar";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminData } from "../context/AdminDataContext";
import { roles } from "../data/users";
import { EmptyState, LoadingState, Modal, panel } from "./ui";
import { formatDate } from "../../utils/booking";

const groups = [
  { label: "Hôtel", items: [{ path: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Opérations", items: [
    { path: "reservations", label: "Réservations", icon: CalendarDays },
    { path: "rooms", label: "Chambres", icon: BedDouble },
    { path: "clients", label: "Clients", icon: UsersRound },
  ]},
  { label: "Services", items: [
    { path: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
    { path: "events", label: "Événements", icon: CalendarRange },
  ]},
  { label: "Exploitation", items: [
    { path: "housekeeping", label: "Housekeeping", icon: Sparkles },
    { path: "maintenance", label: "Maintenance", icon: Wrench },
    { path: "inventory", label: "Stocks", icon: Package },
  ]},
  { label: "Finance", items: [
    { path: "finance", label: "Finance", icon: Wallet },
    { path: "invoices", label: "Factures", icon: ReceiptText },
  ]},
  { label: "Pilotage", items: [
    { path: "users", label: "Utilisateurs", icon: UserRoundCog },
    { path: "reports", label: "Rapports", icon: ChartNoAxesCombined },
  ]},
  { label: "Système", items: [
    { path: "notifications", label: "Notifications", icon: Bell },
    { path: "settings", label: "Paramètres", icon: Settings2 },
  ]},
];

const labels = { ...Object.fromEntries(groups.flatMap((g) => g.items.map((x) => [x.path, x.label]))), account: "Mon compte" };

function SidebarContent({ onNavigate, mobile = false }) {
  const { user, logout, can } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data } = useAdminData();
  const role = roles.find((r) => r.key === user?.role)?.label;
  const activeSection = pathname.split("/")[2] || "dashboard";
  const [open, setOpen] = useState(() => Object.fromEntries(groups.map((g) => [g.label, true])));
  const toggle = (label) => setOpen((o) => ({ ...o, [label]: !o[label] }));

  return <>
    <div className="flex h-[94px] shrink-0 items-center border-b border-white/[.09] px-5 xl:px-6">
      <div className={`origin-left ${mobile ? "" : "hidden xl:block"}`}>
        {data?.settings.hotel.logo ? <Link to="/admin/dashboard" className="flex items-center gap-2 text-white"><img src={data.settings.hotel.logo} alt="Logo Maison Aurèle" className="h-10 w-10 rounded-lg object-contain"/><span className="font-serif text-xl">Maison <em>Aurèle</em></span></Link> : <Logo light to="/admin/dashboard" />}
        <span className="mt-2 block text-[9px] uppercase tracking-[.24em] text-gold">Espace administration</span>
      </div>
      {!mobile && <Link to="/admin/dashboard" title="Maison Aurèle" className="mx-auto hidden h-10 w-10 items-center justify-center rounded-xl border border-gold/45 font-serif text-2xl text-beige md:flex xl:hidden">{data?.settings.hotel.logo ? <img src={data.settings.hotel.logo} alt="" className="h-9 w-9 object-contain"/> : "A"}</Link>}
    </div>
    <nav className="admin-scroll flex-1 overflow-y-auto px-3 pb-5 pt-4 xl:px-4" aria-label="Administration">
      {groups.map((group) => {
        const items = group.items.filter((item) => can(item.path));
        if (!items.length) return null;
        const isOpen = open[group.label] !== false;
        const containsActive = items.some((i) => i.path === activeSection);
        return <div key={group.label} className="mb-1.5">
          <button onClick={() => toggle(group.label)} aria-expanded={isOpen} className={`flex w-full items-center justify-between px-3 py-2 text-[9px] font-semibold uppercase tracking-[.21em] transition ${containsActive ? "text-gold" : "text-white/35 hover:text-white/60"} ${mobile ? "" : "hidden xl:flex"}`}>
            <span>{group.label}</span><ChevronDown size={12} className={`transition-transform ${isOpen ? "" : "-rotate-90"}`} />
          </button>
          {!mobile && <div className="mx-auto mb-1 h-px w-7 bg-white/10 xl:hidden" />}
          <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${mobile ? (isOpen ? "max-h-96" : "max-h-0") : "md:max-h-none xl:max-h-none"}`} style={mobile && !isOpen ? { maxHeight: 0 } : undefined}>
            <div className="space-y-0.5 pb-1">{items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={`/admin/${path}`} onClick={onNavigate} title={label} className={({ isActive }) => `group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] transition-all duration-200 ${isActive ? "bg-white/[.12] font-medium text-white shadow-[inset_2px_0_0_#b8975a]" : "text-white/55 hover:bg-white/[.06] hover:text-white"} ${mobile ? "" : "md:justify-center xl:justify-start"}`}>
              <Icon size={17} strokeWidth={1.8} className="shrink-0"/><span className={mobile ? "" : "md:hidden xl:inline"}>{label}</span>
            </NavLink>)}</div>
          </div>
        </div>;
      })}
    </nav>
    <div className="shrink-0 border-t border-white/[.09] p-3 xl:p-4">
      <div className={`flex items-center gap-2.5 rounded-xl bg-white/[.05] p-2.5 ${mobile ? "" : "md:justify-center xl:justify-start"}`}>
        <Link to="/admin/account" onClick={onNavigate} title="Mon compte" className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/20 font-serif text-lg text-beige">{user?.name?.[0]}</div>
          <div className={`min-w-0 flex-1 ${mobile ? "" : "md:hidden xl:block"}`}><p className="truncate text-[11px] font-medium text-white">{user?.name}</p><p className="truncate text-[10px] text-white/40">{role}</p></div>
        </Link>
        <button title="Déconnexion" aria-label="Déconnexion" onClick={() => { logout(); navigate("/admin/login"); onNavigate?.(); }} className={`rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white ${mobile ? "" : "md:hidden xl:block"}`}><LogOut size={16} /></button>
      </div>
      {!mobile && <button title="Déconnexion" aria-label="Déconnexion" onClick={() => { logout(); navigate("/admin/login"); }} className="mx-auto mt-2 hidden h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white md:grid xl:hidden"><LogOut size={16}/></button>}
      {data && <div className={`mt-3 flex items-center gap-1.5 px-2 text-[9px] text-white/35 ${mobile ? "" : "md:hidden xl:flex"}`}><span className="h-1.5 w-1.5 rounded-full bg-gold"/> Mode démonstration <span className="ml-auto text-gold/70">v1.0</span></div>}
    </div>
  </>;
}

function Header({ onMenu }) {
  const { data, markNotificationsRead } = useAdminData();
  const { user, can } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = pathname.split("/")[2] || "dashboard";
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const notificationPreferences = data.settings.notifications;
  const visibleActivity = data.activity.filter((a) => {
    const setting = { booking: "bookings", cancel: "bookings", client: "bookings", checkin: "checkIns", payment: "payments", restaurant: "restaurant", cleaning: "housekeeping", maintenance: "maintenance", inventory: "inventory", event: "events" }[a.type];
    const permission = { booking: "reservations", cancel: "reservations", client: "clients", checkin: "reservations", payment: "finance", restaurant: "restaurant", cleaning: "housekeeping", maintenance: "maintenance", inventory: "inventory", event: "events", settings: "settings" }[a.type];
    return (!setting || notificationPreferences[setting] !== false) && (!permission || can(permission));
  });
  const unread = visibleActivity.filter((a) => !a.read).length;
  useEffect(() => {
    const key = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); } };
    document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const outside = (e) => { if (!notificationsRef.current?.contains(e.target)) setNotificationsOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const results = useMemo(() => {
    const q = query.toLowerCase().trim(); if (!q) return [];
    return [
      ...(can("reservations") ? data.reservations.filter((r) => `${r.id} ${r.clientName}`.toLowerCase().includes(q)).slice(0, 4).map((r) => ({ id: r.id, type: "Réservation", title: `${r.id} · ${r.clientName}`, url: `/admin/reservations?id=${r.id}` })) : []),
      ...(can("clients") ? data.clients.filter((c) => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q)).slice(0, 4).map((c) => ({ id: c.id, type: "Client", title: `${c.firstName} ${c.lastName}`, url: `/admin/clients/${c.id}` })) : []),
      ...(can("rooms") ? data.rooms.filter((r) => `${r.number} ${r.type}`.toLowerCase().includes(q)).slice(0, 4).map((r) => ({ id: r.id, type: "Chambre", title: `${r.number} · ${r.type}`, url: `/admin/rooms?id=${r.id}` })) : []),
    ].slice(0, 9);
  }, [query, data, can]);

  return <header className="admin-header sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-night/[.07] bg-[#faf9f6]/95 px-4 backdrop-blur-xl sm:px-7 xl:px-9">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={onMenu} aria-label="Ouvrir le menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-night/10 text-night/70 md:hidden"><Menu size={19}/></button>
      <div className="min-w-0"><div className="flex items-center gap-1.5 text-[10px] text-night/40"><span>Maison Aurèle</span><ChevronRight size={11}/><span>Administration</span></div><p className="truncate font-serif text-[21px] leading-tight text-night">{labels[current] || "Administration"}</p></div>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="mr-2 hidden text-[11px] text-night/45 lg:block">{formatDate(new Date().toISOString().slice(0,10), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
      <button type="button" onClick={() => { setSearchOpen(true); setQuery(""); }} title="Recherche globale (Ctrl+K)" aria-label="Recherche globale" className="flex h-9 items-center gap-3 rounded-xl border border-night/10 bg-white px-3 text-night/45 transition hover:border-gold/50 sm:w-44"><Search size={16}/><span className="hidden text-[11px] sm:inline">Rechercher...</span><span className="ml-auto hidden text-[9px] text-night/35 sm:inline">⌘K</span></button>
      <div ref={notificationsRef} className="relative">
        <button type="button" title="Notifications" aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative grid h-9 w-9 place-items-center rounded-xl border border-night/10 bg-white text-night/60 hover:border-gold/50"><Bell size={17}/>{unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-0.5 text-[9px] font-semibold text-white">{Math.min(unread, 9)}</span>}</button>
        {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-[min(340px,90vw)] overflow-hidden rounded-2xl border border-night/10 bg-white shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-night/5 px-4 py-3"><strong className="font-serif text-lg">Notifications</strong><button onClick={() => { markNotificationsRead(); setNotificationsOpen(false); }} className="flex items-center gap-1 text-[10px] text-gold hover:underline"><CheckCheck size={13}/> Tout marquer lu</button></div>
          {visibleActivity.slice(0, 5).map((a) => <div key={a.id} className={`border-b border-night/5 px-4 py-3 text-[11px] ${a.read ? "" : "bg-sand/20"}`}><p className="font-medium text-night">{a.text}</p><p className="mt-0.5 text-night/45">{a.detail} · {a.time}</p></div>)}
          {!visibleActivity.length && <p className="px-4 py-8 text-center text-xs text-night/45">Aucune notification à afficher.</p>}
          <button onClick={() => { setNotificationsOpen(false); navigate("/admin/notifications"); }} className="w-full py-3 text-center text-[11px] text-gold hover:bg-ivory">Toutes les notifications</button>
        </div>}
      </div>
      <Link to="/" title="Voir le site public" className="hidden h-9 items-center gap-1.5 rounded-xl border border-night/10 bg-white px-3 text-[11px] text-night/65 transition hover:border-gold/50 sm:flex"><ExternalLink size={14}/><span className="hidden xl:inline">Voir le site</span></Link>
      <Link to="/admin/account" title="Mon compte" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-night font-serif text-lg text-white">{user?.name?.[0]}</Link>
    </div>
    <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Recherche globale" description="Réservations, clients et chambres">
      <div className="flex items-center gap-2 rounded-xl border border-night/10 bg-ivory px-3"><Search size={17} className="text-night/40"/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, numéro de chambre, ID..." className="w-full bg-transparent py-3 text-sm outline-none"/></div>
      {query && (results.length ? <div className="mt-4 space-y-1">{results.map((r) => <button key={r.id} onClick={() => { setSearchOpen(false); navigate(r.url); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-ivory"><div><span className="text-[10px] uppercase tracking-wider text-gold">{r.type}</span><div className="text-sm">{r.title}</div></div><ChevronRight size={15} className="text-night/35"/></button>)}</div> : <EmptyState title="Aucun résultat" text="Essayez une autre recherche." />)}
      {!query && <div className="py-10 text-center text-xs text-night/40"><Command size={20} className="mx-auto mb-2"/>Commencez à saisir pour rechercher</div>}
    </Modal>
  </header>;
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { can, user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { data, loading, toast } = useAdminData();
  const section = pathname.split("/")[2] || "dashboard";
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!loading && user && !data.users.some((u) => u.id === user.id && u.status === "active")) {
      logout(); navigate("/admin/login", { replace: true });
    }
  }, [loading, data, user, logout, navigate]);
  if (loading) return <div className="grid min-h-screen place-items-center bg-ivory"><div className="w-full max-w-md p-5"><LoadingState /></div></div>;

  return <div className="admin-shell min-h-screen bg-[#f8f7f4] font-sans text-night">
    <aside className="admin-sidebar fixed inset-y-0 left-0 z-50 hidden w-20 flex-col bg-night md:flex xl:w-64"><SidebarContent /></aside>
    {mobileOpen && <div className="fixed inset-0 z-[60] bg-night/60 backdrop-blur-[2px] md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}><aside className="flex h-full w-64 flex-col bg-night shadow-2xl animate-[slideFromLeft_.25s_ease-out]"><button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="absolute left-[226px] top-5 text-white"><X size={20}/></button><SidebarContent mobile onNavigate={() => setMobileOpen(false)}/></aside></div>}
    <div className="admin-main min-w-0 md:ml-20 xl:ml-64">
      <Header onMenu={() => setMobileOpen(true)} />
      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-[1580px] px-4 py-7 sm:px-7 sm:py-8 xl:px-9">
        {section === "account" || can(section) ? <Outlet /> : <div className={`${panel} mx-auto mt-12 max-w-lg p-12 text-center`}><ShieldAlert className="mx-auto text-gold" size={36}/><h1 className="mt-4 font-serif text-3xl">Accès restreint</h1><p className="mt-2 text-sm text-night/50">Votre rôle ne permet pas d'accéder à cette rubrique.</p><Link to="/admin/dashboard" className="btn-dark mt-6 !rounded-xl">Retour au dashboard</Link></div>}
      </main>
      <div className="border-t border-night/[.07] px-7 py-4 text-[10px] text-night/35">© {new Date().getFullYear()} Maison Aurèle · Données de démonstration stockées localement</div>
    </div>
    {toast && <div key={toast.id} role="status" className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-xl bg-night px-5 py-3 text-xs text-white shadow-xl animate-fade-up"><span className={`h-2 w-2 shrink-0 rounded-full ${toast.tone === "error" ? "bg-rose-400" : "bg-emerald-400"}`}/>{toast.text}</div>}
  </div>;
}
