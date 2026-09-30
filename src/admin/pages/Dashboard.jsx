import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, BedDouble, CalendarCheck2, DoorOpen, DoorClosed, UsersRound, CircleDollarSign, TriangleAlert, ChevronRight } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { AreaChart, BarChart } from "../components/Charts";
import RoleDashboard from "../components/RoleDashboard";
import { ChartCard, PageHeading, StatusBadge, panel } from "../components/ui";
import { dailySeries, monthlySeries, occupancyRate, todayCounts } from "../utils/analytics";
import { receivablesSummary, supplierSummary, bookingBalance } from "../utils/finance";
import { formatDate, formatPrice, todayISO } from "../../utils/booking";

function Kpi({ label, value, sub, icon: Icon, onClick }) {
  return <button onClick={onClick} className={`${panel} group flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md`}>
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand/60 text-gold transition group-hover:bg-night group-hover:text-beige"><Icon size={19} strokeWidth={1.7} /></span>
    <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-[.14em] text-night/45">{label}</span>
    <span className="mt-1 block truncate font-serif text-[30px] leading-none text-night">{value}</span>
    {sub && <span className="mt-1 block truncate text-[11px] text-night/45">{sub}</span>}</span>
  </button>;
}

export default function Dashboard() {
  const { data } = useAdminData();
  const { user, can } = useAdminAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const today = todayISO();

  const revenueToday = useMemo(() => data.transactions.filter((t) => t.date === today && t.amount > 0).reduce((s, t) => s + t.amount, 0), [data, today]);
  const { arrivals, departures } = todayCounts(data.reservations);
  const occupancy = occupancyRate(data.rooms);
  const available = data.rooms.filter((r) => ["available"].includes(r.status)).length;
  const totalReservations = data.reservations.filter((r) => !["cancelled","no-show"].includes(r.status)).length;

  const chartData = useMemo(() => {
    if (range === "7d") return dailySeries(data.transactions, 7, "date", (t) => t.amount > 0 ? t.amount : 0);
    if (range === "12m") return monthlySeries(data.transactions.filter((t) => t.amount > 0), 12, "date", (t) => t.amount);
    return dailySeries(data.transactions, 30, "date", (t) => t.amount > 0 ? t.amount : 0);
  }, [data, range]);
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const todayActivity = useMemo(() => {
    const items = [];
    data.reservations.filter((r) => r.checkIn === today && !["cancelled","no-show"].includes(r.status)).slice(0, 3).forEach((r) =>
      items.push({ id: `in-${r.id}`, kind: "Arrivée", title: `${r.clientName} · Ch. ${r.roomNumber}`, time: "15:00", link: `/admin/reservations?id=${r.id}`, tone: "text-sky-700 bg-sky-50" }));
    data.reservations.filter((r) => r.checkOut === today && !["cancelled","no-show"].includes(r.status)).slice(0, 3).forEach((r) =>
      items.push({ id: `out-${r.id}`, kind: "Départ", title: `${r.clientName} · Ch. ${r.roomNumber}`, time: "12:00", link: `/admin/reservations?id=${r.id}`, tone: "text-violet-700 bg-violet-50" }));
    [...data.reservations].sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||"")).slice(0, 2).forEach((r) =>
      items.push({ id: `new-${r.id}`, kind: "Réservation", title: `${r.id} · ${r.clientName}`, time: formatDate(r.createdAt || r.checkIn, { day: "numeric", month: "short" }), link: `/admin/reservations?id=${r.id}`, tone: "text-emerald-700 bg-emerald-50" }));
    data.transactions.filter((t) => t.date === today && t.amount > 0).slice(0, 2).forEach((t) =>
      items.push({ id: `pay-${t.id}`, kind: "Paiement", title: `${t.client} · ${formatPrice(t.amount)}`, time: t.method, link: "/admin/finance", tone: "text-amber-700 bg-amber-50" }));
    return items.slice(0, 6);
  }, [data, today]);

  const alerts = useMemo(() => {
    const list = [];
    const pendingPay = data.reservations.filter((r) => !["cancelled","no-show"].includes(r.status) && bookingBalance(r, data.transactions).due > 0 && !bookingBalance(r, data.transactions).overdue);
    const rec = receivablesSummary(data.reservations, data.transactions);
    const sup = supplierSummary(data.supplierInvoices || []);
    const toClean = data.rooms.filter((r) => r.status === "cleaning").length;
    const inMaint = data.rooms.filter((r) => ["maintenance","out-of-service"].includes(r.status)).length;
    const lowStock = (data.inventory || []).filter((s) => s.qty <= s.min).length;
    if (pendingPay.length) list.push({ id: "pay", label: `${pendingPay.length} paiement${pendingPay.length>1?"s":""} client${pendingPay.length>1?"s":""} en attente`, link: "/admin/finance?tab=receivables" });
    if (rec.overdueCount) list.push({ id: "rec", label: `${rec.overdueCount} créance${rec.overdueCount>1?"s":""} client${rec.overdueCount>1?"s":""} en retard`, link: "/admin/finance?tab=receivables" });
    if (sup.count) list.push({ id: "sup", label: `${sup.count} facture${sup.count>1?"s":""} fournisseur${sup.count>1?"s":""} à payer`, link: "/admin/finance?tab=payables" });
    if (toClean) list.push({ id: "clean", label: `${toClean} chambre${toClean>1?"s":""} à nettoyer`, link: "/admin/housekeeping" });
    if (inMaint) list.push({ id: "maint", label: `${inMaint} chambre${inMaint>1?"s":""} en maintenance`, link: "/admin/maintenance" });
    if (lowStock) list.push({ id: "stock", label: `${lowStock} article${lowStock>1?"s":""} en stock faible`, link: "/admin/inventory" });
    return list.slice(0, 6);
  }, [data]);

  const canFinance = can("finance"), canReservations = can("reservations"), canRooms = can("rooms");
  if (!canReservations && !canFinance) return <RoleDashboard data={data} user={user} can={can} />;

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Vue d'ensemble" title={`Bonjour, ${user?.name?.split(" ")[0] || "vous"}.`} subtitle="Voici la situation de votre hôtel aujourd'hui." />

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      <Kpi label="Taux d'occupation" value={`${occupancy} %`} sub={`${data.rooms.filter((r)=>r.status==="occupied").length} / ${data.rooms.length} chambres`} icon={UsersRound} onClick={() => navigate("/admin/rooms")} />
      <Kpi label="Revenu du jour" value={formatPrice(revenueToday)} sub="Encaissé aujourd'hui" icon={CircleDollarSign} onClick={() => navigate("/admin/finance")} />
      <Kpi label="Réservations" value={totalReservations} sub="Séjours actifs" icon={CalendarCheck2} onClick={() => navigate("/admin/reservations")} />
      <Kpi label="Arrivées du jour" value={arrivals} sub="Check-in attendus" icon={DoorOpen} onClick={() => navigate("/admin/reservations?date=today")} />
      <Kpi label="Départs du jour" value={departures} sub="Check-out prévus" icon={DoorClosed} onClick={() => navigate("/admin/reservations?date=today")} />
      <Kpi label="Chambres libres" value={available} sub="Disponibles maintenant" icon={BedDouble} onClick={() => navigate("/admin/rooms")} />
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <ChartCard title="Revenue Overview" subtitle={`Total période : ${formatPrice(chartTotal)}`}
        action={<div className="flex rounded-xl border border-night/10 bg-ivory p-1">{[["7d","7 jours"],["30d","30 jours"],["12m","12 mois"]].map(([k,l]) => <button key={k} onClick={() => setRange(k)} className={`rounded-lg px-3 py-1.5 text-[11px] transition ${range===k ? "bg-night text-white" : "text-night/55 hover:text-night"}`}>{l}</button>)}</div>}>
        {range === "12m" ? <BarChart data={chartData} format={(n)=>`${Math.round(n/1000)}k`} height={230}/> : <AreaChart data={chartData} format={(n)=>formatPrice(n)} height={230} />}
        <p className="mt-2 text-[11px] text-night/40">Analyse détaillée disponible dans <Link to="/admin/reports" className="text-gold hover:underline">Rapports</Link>.</p>
      </ChartCard>

      <div className="flex flex-col gap-5">
        <section className={`${panel} flex-1 p-6`}>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-[22px]">Attention Required</h2><span className="rounded-full bg-sand/70 px-2.5 py-1 text-[11px]">{alerts.length}</span></div>
          {alerts.length === 0 && <p className="py-6 text-center text-xs text-night/45">Rien ne nécessite votre attention. Belle journée.</p>}
          <div className="space-y-2">{alerts.map((a) => <Link key={a.id} to={a.link} className="flex items-center gap-3 rounded-xl border border-night/[.07] px-4 py-3 text-[13px] transition hover:border-gold/50 hover:bg-sand/25"><TriangleAlert size={15} className="shrink-0 text-amber-600" /><span className="flex-1">{a.label}</span><ChevronRight size={15} className="text-night/30" /></Link>)}</div>
        </section>
      </div>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <section className={`${panel} p-6`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-[22px]">Today's Activity</h2><Link to="/admin/reservations" className="text-[11px] font-medium text-gold hover:underline">Voir toutes les réservations</Link></div>
        <div className="divide-y divide-night/[.05]">{todayActivity.map((a) => <Link key={a.id} to={a.link} className="flex items-center gap-3 py-3 transition hover:bg-ivory/60"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${a.tone}`}>{a.kind}</span><span className="min-w-0 flex-1 truncate text-[13px]">{a.title}</span><span className="text-[11px] text-night/40">{a.time}</span></Link>)}</div>
        {todayActivity.length === 0 && <p className="py-6 text-center text-xs text-night/45">Aucune activité enregistrée aujourd'hui.</p>}
      </section>
      <section className={`${panel} relative flex flex-col justify-center overflow-hidden bg-night p-8 text-white`}>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-[.08]" style={{ background: "radial-gradient(circle at top right,#d9ccb6,transparent 65%)" }} />
        <p className="relative text-[10px] font-medium uppercase tracking-[.22em] text-beige">Maison Aurèle</p>
        <h2 className="relative mt-3 font-serif text-3xl leading-tight">L'essentiel, <em>en un regard.</em></h2>
        <p className="relative mt-3 text-xs leading-relaxed text-white/55">Le détail par métier reste disponible dans chaque module de la sidebar.</p>
        <div className="relative mt-5 flex gap-2">
          {canReservations && <Link to="/admin/reservations?date=today" className="rounded-xl bg-white px-4 py-2.5 text-[11px] font-medium text-night hover:bg-sand">Planning du jour</Link>}
          {canFinance && <Link to="/admin/finance?tab=receivables" className="rounded-xl border border-white/25 px-4 py-2.5 text-[11px] text-white hover:bg-white/10">Créances</Link>}
          {canRooms && <Link to="/admin/rooms" className="rounded-xl border border-white/25 px-4 py-2.5 text-[11px] text-white hover:bg-white/10">Chambres</Link>}
        </div>
      </section>
    </div>

    {canReservations && <section className="mt-7">
      <div className="mb-3 flex items-end justify-between"><div><h2 className="font-serif text-[24px]">Dernières réservations</h2><p className="text-xs text-night/45">Accès rapide aux dossiers récents</p></div><Link to="/admin/reservations" className="flex items-center gap-1 text-xs font-medium text-gold hover:underline">Tout voir <ArrowUpRight size={14}/></Link></div>
      <div className={`${panel} divide-y divide-night/[.05]`}>
        {[...data.reservations].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,4).map((r) => <button key={r.id} onClick={() => navigate(`/admin/reservations?id=${r.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-ivory/70"><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{r.id} · {r.clientName}</span><span className="text-[11px] text-night/45">Ch. {r.roomNumber} · {formatDate(r.checkIn,{day:"numeric",month:"short"})} → {formatDate(r.checkOut,{day:"numeric",month:"short"})}</span></span><span className="flex shrink-0 items-center gap-2"><span className="text-[13px] font-medium">{formatPrice(r.amount)}</span><StatusBadge value={r.status}/></span></button>)}
      </div>
    </section>}
  </div>;
}
