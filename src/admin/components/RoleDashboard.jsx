import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, BedDouble, CalendarRange, ClipboardCheck, Clock3, Sparkles, UtensilsCrossed, UsersRound, Wallet, DoorOpen } from "lucide-react";
import { PageHeading, StatCard, ChartCard, DataTable, StatusBadge, adminButton, panel } from "./ui";
import { DonutChart } from "./Charts";
import { formatDate, formatPrice } from "../../utils/booking";

const mapStatus = { available: "Disponibles", occupied: "Occupées", reserved: "Réservées", cleaning: "Nettoyage", maintenance: "Maintenance", pending: "En attente", preparing: "En préparation", ready: "Prêtes", served: "Servies", completed: "Terminées", cancelled: "Annulées", upcoming: "À venir", confirmed: "Confirmés", "in-progress": "En cours" };

export default function RoleDashboard({ data, user, can }) {
  const navigate = useNavigate();
  const firstName = user.name.split(" ")[0];
  const isHousekeeping = can("housekeeping") || can("rooms");
  const isRestaurant = !isHousekeeping && can("restaurant");
  const target = isHousekeeping ? can("housekeeping") ? "housekeeping" : "rooms" : isRestaurant ? "restaurant" : can("events") ? "events" : "account";
  const title = isHousekeeping ? "Entretien des chambres" : isRestaurant ? "Service en salle" : "Événements à venir";
  const subtitle = isHousekeeping ? "Votre équipe et les chambres à préparer aujourd'hui." : isRestaurant ? "La salle, les commandes et la carte en un regard." : "Vos réceptions et vos espaces en un regard.";

  const stats = isHousekeeping ? [
    ["À nettoyer", data.tasks.filter((t) => t.status === "dirty").length, Sparkles, "Tâches en attente"],
    ["En cours", data.tasks.filter((t) => t.status === "cleaning").length, Clock3, "Nettoyages actifs"],
    ["Chambres libres", data.rooms.filter((r) => r.status === "available").length, BedDouble, "Prêtes à accueillir"],
    ["À inspecter", data.tasks.filter((t) => t.status === "clean").length, ClipboardCheck, "Contrôles à réaliser"],
  ] : isRestaurant ? [
    ["Commandes actives", data.orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length, UtensilsCrossed, "Service actuel"],
    ["À servir", data.orders.filter((o) => o.status === "ready").length, Clock3, "Plats prêts"],
    ["Tables libres", data.tables.filter((t) => t.status === "available").length, DoorOpen, "Sur le plan de salle"],
    ["Ventes servies", formatPrice(data.orders.filter((o) => ["served", "completed"].includes(o.status)).reduce((s, o) => s + o.amount, 0)), Wallet, "Commandes du jour"],
  ] : [
    ["À venir", data.events.filter((e) => ["confirmed", "upcoming"].includes(e.status)).length, CalendarRange, "Réceptions prévues"],
    ["Confirmés", data.events.filter((e) => e.status === "confirmed").length, ClipboardCheck, "Dossiers validés"],
    ["Invités attendus", data.events.filter((e) => ["confirmed", "upcoming"].includes(e.status)).reduce((s, e) => s + e.guests, 0), UsersRound, "Prochaines réceptions"],
    ["Espaces", data.spaces.length, BedDouble, "Disponibles à la location"],
  ];

  const distributions = isHousekeeping ? ["occupied", "reserved", "available", "cleaning", "maintenance"].map((s) => ({ label: mapStatus[s], value: data.rooms.filter((r) => r.status === s).length })).filter((x) => x.value) :
    isRestaurant ? ["pending", "preparing", "ready", "served", "completed", "cancelled"].map((s) => ({ label: mapStatus[s], value: data.orders.filter((o) => o.status === s).length })).filter((x) => x.value) :
    ["upcoming", "confirmed", "in-progress", "completed", "cancelled"].map((s) => ({ label: mapStatus[s], value: data.events.filter((e) => e.status === s).length })).filter((x) => x.value);

  const rows = isHousekeeping ? data.tasks : isRestaurant ? data.orders : [...data.events].sort((a, b) => a.date.localeCompare(b.date));
  const columns = isHousekeeping ? [
    { key: "room", label: "Chambre", render: (t) => <span className="font-medium text-night">{t.room}</span> },
    { key: "task", label: "Tâche" }, { key: "assignee", label: "Responsable" },
    { key: "priority", label: "Priorité", render: (t) => <StatusBadge value={t.priority}/> },
    { key: "status", label: "Statut", render: (t) => <StatusBadge value={t.status}/> },
  ] : isRestaurant ? [
    { key: "id", label: "Commande", render: (o) => <span className="font-medium text-night">{o.id}</span> },
    { key: "table", label: "Table" }, { key: "client", label: "Client" },
    { key: "amount", label: "Montant", render: (o) => formatPrice(o.amount) },
    { key: "time", label: "Heure" }, { key: "status", label: "Statut", render: (o) => <StatusBadge value={o.status}/> },
  ] : [
    { key: "title", label: "Événement", render: (e) => <span className="font-medium text-night">{e.title}</span> },
    { key: "client", label: "Client" },
    { key: "date", label: "Date", render: (e) => formatDate(e.date, { day: "numeric", month: "short", year: "numeric" }) },
    { key: "guests", label: "Invités" },
    { key: "status", label: "Statut", render: (e) => <StatusBadge value={e.status}/> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Vue d'ensemble" title={`Bonjour, ${firstName}.`} subtitle={subtitle} action={<Link to={`/admin/${target}`} className={adminButton}>Gérer {isHousekeeping ? "les tâches" : isRestaurant ? "le restaurant" : "les événements"} <ArrowUpRight size={14}/></Link>}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(([label, value, Icon, hint], i) => <StatCard key={label} label={label} value={value} icon={Icon} hint={hint} accent={i === 0} onClick={() => navigate(`/admin/${target}`)}/>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
      <ChartCard title={isHousekeeping ? "État de l'inventaire" : isRestaurant ? "Statut des commandes" : "Avancement des dossiers"} subtitle="Vue en temps réel"><DonutChart data={distributions} centerValue={isHousekeeping ? data.rooms.length : isRestaurant ? data.orders.length : data.events.length} centerLabel={isHousekeeping ? "chambres" : isRestaurant ? "commandes" : "événements"}/></ChartCard>
      <div className={`${panel} flex flex-col justify-center bg-night p-8 text-white`}><p className="text-[10px] uppercase tracking-[.2em] text-beige">Maison Aurèle · Excellence quotidienne</p><h2 className="mt-4 max-w-md font-serif text-4xl leading-[1.1]">{isHousekeeping ? <>Chaque détail compte avant <em>l'arrivée.</em></> : isRestaurant ? <>Le plaisir d'une table <em>impeccable.</em></> : <>Donnez vie aux moments <em>inoubliables.</em></>}</h2><p className="mt-4 max-w-sm text-xs leading-relaxed text-white/55">{isHousekeeping ? "Assignez les tâches, inspectez les chambres et coordonnez les interventions depuis votre espace." : isRestaurant ? "Suivez vos commandes, gérez la salle et maintenez votre carte à jour." : "Suivez les dossiers, les participants et la disponibilité des espaces."}</p><Link to={`/admin/${target}`} className="mt-6 inline-flex items-center gap-2 self-start text-xs text-beige hover:underline">Ouvrir la gestion <ArrowUpRight size={14}/></Link></div>
    </div>
    <div className="mt-8 flex items-end justify-between"><div><h2 className="font-serif text-[29px]">{title}</h2><p className="text-xs text-night/45">Dernières informations enregistrées</p></div><Link to={`/admin/${target}`} className="flex items-center gap-1 text-xs text-gold hover:underline">Tout voir <ArrowUpRight size={14}/></Link></div>
    <div className="mt-4"><DataTable rows={rows.slice(0, 6)} columns={columns} pageSize={6} onRowClick={() => navigate(`/admin/${target}`)}/></div>
  </div>;
}