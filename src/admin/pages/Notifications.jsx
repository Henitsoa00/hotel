import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, CalendarCheck2, DoorOpen, CreditCard, Sparkles, UserPlus, XCircle, UtensilsCrossed, CalendarRange, Wrench, Package, TriangleAlert } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { PageHeading, SearchBar, FilterBar, adminField, panel } from "../components/ui";

const icons = { booking: CalendarCheck2, checkin: DoorOpen, payment: CreditCard, cleaning: Sparkles, client: UserPlus, cancel: XCircle, restaurant: UtensilsCrossed, event: CalendarRange, maintenance: Wrench, inventory: Package, settings: Bell };
const typeLabels = { booking: "Réservation", checkin: "Séjour", payment: "Paiement", cleaning: "Ménage", client: "Client", cancel: "Annulation", restaurant: "Restaurant", event: "Événement", maintenance: "Maintenance", inventory: "Stock", settings: "Système" };

export default function Notifications() {
  const { data, markNotificationsRead } = useAdminData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const rows = useMemo(() => {
    // Notifications système dérivées + activité existante
    const derived = [];
    const low = (data.inventory || []).filter((s) => s.qty <= s.min);
    low.forEach((s) => derived.push({ id: `nt-stock-${s.id}`, type: "inventory", text: `Stock faible : ${s.name}`, detail: `Reste ${s.qty} ${s.unit} (seuil ${s.min})`, time: s.updated, read: false }));
    (data.maintenance || []).filter((m) => m.status !== "resolved").forEach((m) => derived.push({ id: `nt-mt-${m.id}`, type: "maintenance", text: `Maintenance Ch. ${m.room} : ${m.title}`, detail: `${m.equipment} · ${m.assignee}`, time: m.date, read: false }));
    return [...derived, ...data.activity].filter((a) =>
      (!search || `${a.text} ${a.detail}`.toLowerCase().includes(search.toLowerCase())) &&
      (filter === "all" || a.type === filter) && (!onlyUnread || !a.read)
    ).slice(0, 60);
  }, [data, search, filter, onlyUnread]);

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Système / Alertes" title="Notifications" subtitle="Nouvelles réservations, paiements, ménage, maintenance, stocks et événements." action={<button onClick={markNotificationsRead} className="btn-outline !rounded-xl !px-4 !py-2.5 !text-[13px]"><CheckCheck size={14}/> Tout marquer comme lu</button>} />
    <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." className="w-full sm:w-64"/><select value={filter} onChange={(e)=>setFilter(e.target.value)} aria-label="Type" className={adminField}><option value="all">Tous types</option>{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><label className="flex cursor-pointer items-center gap-2 text-xs text-night/60"><input type="checkbox" checked={onlyUnread} onChange={(e)=>setOnlyUnread(e.target.checked)} className="h-4 w-4 accent-[#0f1b2d]"/> Non lues uniquement</label><span className="ml-auto text-xs text-night/40">{rows.length} notification(s)</span></FilterBar>
    <div className={`${panel} divide-y divide-night/[.05]`}>
      {rows.map((a) => { const Icon = icons[a.type] || Bell; return <div key={a.id} className={`flex items-start gap-3 px-5 py-4 ${a.read ? "" : "bg-sand/20"}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand/60 text-gold"><Icon size={16}/></span>
        <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{a.text}</p><p className="mt-0.5 truncate text-[11px] text-night/45">{a.detail} · {a.time}</p></div>
        <span className="shrink-0 rounded-full bg-ivory px-2 py-1 text-[10px] text-night/50">{typeLabels[a.type] || a.type}</span>
        {!a.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold"/>}
      </div>; })}
      {rows.length === 0 && <p className="px-5 py-12 text-center text-xs text-night/45">Aucune notification pour ces critères.</p>}
    </div>
    <p className="mt-4 text-[11px] text-night/40">Astuce : retrouvez les alertes actionnables (paiements en retard, chambres à nettoyer, stocks faibles) sur le <Link to="/admin/dashboard" className="text-gold hover:underline">dashboard</Link>.</p>
  </div>;
}
