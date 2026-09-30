import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, History, Pencil, Plus, UsersRound, Star, Wallet, AlertTriangle, CreditCard, Download } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import ClientForm from "../components/ClientForm";
import { PageHeading, StatCard, StatusBadge, DataTable, SearchBar, FilterBar, Dropdown, adminButton, adminField, outlineButton } from "../components/ui";
import { formatDate, formatPrice } from "../../utils/booking";
import { clientBalance } from "../utils/finance";
import { downloadCsv } from "../utils/analytics";

export default function Clients() {
  const { data } = useAdminData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const enriched = useMemo(() => data.clients.map((c) => ({ ...c, balance: clientBalance(c.id, data.reservations, data.transactions) })), [data.clients, data.reservations, data.transactions]);

  const totals = useMemo(() => ({
    due: enriched.reduce((s, c) => s + c.balance.due, 0),
    overdue: enriched.reduce((s, c) => s + c.balance.overdue, 0),
    debtors: enriched.filter((c) => c.balance.due > 0).length,
    overdueCount: enriched.filter((c) => c.balance.overdue > 0).length,
  }), [enriched]);

  const rows = useMemo(() => enriched.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q);
    const matchS = status === "all" || c.status === status;
    const matchB = balanceFilter === "all"
      || (balanceFilter === "due" && c.balance.due > 0)
      || (balanceFilter === "overdue" && c.balance.overdue > 0)
      || (balanceFilter === "settled" && c.balance.due <= 0);
    return matchQ && matchS && matchB;
  }), [enriched, search, status, balanceFilter]);

  const begin = (c = null) => { setEditing(c); setFormOpen(true); };

  const exportDebtors = () => {
    const debtors = rows.filter((c) => c.balance.due > 0);
    downloadCsv("creances-clients.csv",
      ["Client", "Email", "Téléphone", "Total facturé EUR", "Payé EUR", "Reste à payer EUR", "Dont en retard EUR", "Factures en attente"],
      debtors.map((c) => [`${c.firstName} ${c.lastName}`, c.email, c.phone, c.balance.billed.toFixed(2), c.balance.paid.toFixed(2), c.balance.due.toFixed(2), c.balance.overdue.toFixed(2), c.balance.pendingCount]));
  };

  const columns = [
    { key: "firstName", label: "Client", sortValue: (c) => `${c.lastName} ${c.firstName}`, render: (c) => <span className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand/70 font-serif text-lg text-night">{c.firstName[0]}{c.lastName[0]}</span><span><span className="font-medium text-night">{c.firstName} {c.lastName}</span><span className="block text-[10px] text-night/45">{c.balance.stays} séjour(s)</span></span></span> },
    { key: "email", label: "Email" },
    { key: "billed", label: "Facturé", sortValue: (c) => c.balance.billed, render: (c) => <span>{formatPrice(c.balance.billed)}</span> },
    { key: "paid", label: "Payé", sortValue: (c) => c.balance.paid, render: (c) => <span className="font-medium text-emerald-700">{formatPrice(c.balance.paid)}</span> },
    {
      key: "due", label: "Reste à payer", sortValue: (c) => c.balance.due,
      render: (c) => c.balance.due > 0
        ? <span className={`font-semibold ${c.balance.overdue > 0 ? "text-rose-600" : "text-amber-700"}`}>{formatPrice(c.balance.due)}{c.balance.overdue > 0 && <span className="ml-1 text-[10px] font-normal">· {formatPrice(c.balance.overdue)} en retard</span>}</span>
        : <span className="text-night/35">—</span>
    },
    {
      key: "payStatus", label: "Solde", sortValue: (c) => c.balance.overdue > 0 ? 2 : c.balance.due > 0 ? 1 : 0,
      render: (c) => <StatusBadge value={c.balance.overdue > 0 ? "overdue" : c.balance.due > 0 ? "pending" : "settled"} />
    },
    { key: "status", label: "Statut", render: (c) => <StatusBadge value={c.status} /> },
    { key: "lastStay", label: "Dernier séjour", render: (c) => c.lastStay ? formatDate(c.lastStay, { day: "numeric", month: "short", year: "numeric" }) : "—" },
    { key: "action", label: "", sortable: false, render: (c) => <Dropdown items={[{ label: "Voir le profil", icon: Eye, onClick: () => navigate(`/admin/clients/${c.id}`) }, { label: "Historique paiements", icon: CreditCard, onClick: () => navigate(`/admin/clients/${c.id}?tab=payments`) }, { label: "Modifier", icon: Pencil, onClick: () => begin(c) }, { label: "Historique séjours", icon: History, onClick: () => navigate(`/admin/clients/${c.id}?tab=history`) }]} /> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Opérations / Relations clients" title="Clients" subtitle="Soldes, historique des paiements et restes à payer par client." action={<><button onClick={exportDebtors} className={outlineButton}><Download size={14} /> Export créances</button><button onClick={() => begin()} className={adminButton}><Plus size={15} /> Ajouter un client</button></>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={UsersRound} label="Total clients" value={data.clients.length} hint={`${totals.debtors} avec un solde dû`} />
      <StatCard icon={Wallet} label="Reste à encaisser" value={formatPrice(totals.due)} hint="Toutes créances clients" />
      <StatCard icon={AlertTriangle} label="En retard" value={formatPrice(totals.overdue)} hint={`${totals.overdueCount} client(s) à relancer`} />
      <StatCard icon={Star} label="Clients VIP" value={data.clients.filter((c) => c.status === "vip").length} hint="Fidélité distinguée" />
    </div>
    <FilterBar>
      <SearchBar value={search} onChange={setSearch} placeholder="Nom, email, téléphone..." className="w-full sm:w-64" />
      <select aria-label="Filtrer les clients" value={status} onChange={(e) => setStatus(e.target.value)} className={adminField}><option value="all">Tous statuts</option><option value="vip">VIP</option><option value="regular">Fidèles</option><option value="new">Nouveaux</option></select>
      <select aria-label="Filtrer par solde" value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value)} className={adminField}><option value="all">Tous soldes</option><option value="due">Avec reste à payer</option><option value="overdue">En retard</option><option value="settled">Soldés</option></select>
      {(search || status !== "all" || balanceFilter !== "all") && <button onClick={() => { setSearch(""); setStatus("all"); setBalanceFilter("all"); }} className="text-xs text-gold hover:underline">Effacer</button>}
      <span className="ml-auto text-xs text-night/40">{rows.length} client(s) · {formatPrice(rows.reduce((s, c) => s + c.balance.due, 0))} à encaisser</span>
    </FilterBar>
    <DataTable rows={rows} columns={columns} onRowClick={(c) => navigate(`/admin/clients/${c.id}?tab=payments`)} emptyTitle="Aucun client trouvé" />
    {formOpen && <ClientForm key={editing?.id || "new"} open={formOpen} onClose={() => setFormOpen(false)} client={editing} />}
  </div>;
}
