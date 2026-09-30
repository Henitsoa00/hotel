import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, FileText, Plus, ReceiptText, RotateCcw, Wallet, Eye, Download, Printer, AlertTriangle, HandCoins, Truck, CheckCircle2 } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { AreaChart, BarChart, DonutChart } from "../components/Charts";
import { PageHeading, StatCard, ChartCard, DataTable, StatusBadge, SearchBar, FilterBar, Modal, Drawer, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { ClientPaymentModal, SupplierPaymentModal } from "../components/PaymentModal";
import { financeSummary, dailySeries, monthlySeries, serviceBreakdown, downloadCsv } from "../utils/analytics";
import { receivablesSummary, supplierSummary, bookingBalance } from "../utils/finance";
import { addDaysISO, todayISO, formatDate, formatPrice } from "../../utils/booking";

const types = { room: "Hébergement", restaurant: "Restaurant", event: "Événement", spa: "Spa", expense: "Dépense", refund: "Remboursement" };
const methods = ["Carte bancaire", "Virement", "Espèces"];
const tabs = [["overview", "Overview"], ["revenue", "Revenue"], ["expenses", "Expenses"], ["payments", "Payments"], ["receivables", "Client Receivables"], ["payables", "Supplier Payables"]];

export default function Finance() {
  const { data, saveRecord, refundTransaction, recordClientPayment, recordSupplierPayment } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [start, setStart] = useState(addDaysISO(undefined, -30));
  const [end, setEnd] = useState(todayISO());
  const legacy = { transactions: "payments", invoices: "payments", refunds: "payments" };
  const [tab, setTab] = useState(legacy[params.get("tab")] || params.get("tab") || "overview");
  useEffect(() => { const raw = params.get("tab"); const t = legacy[raw] || raw; if (t && t !== tab) setTab(t); }, [params]);
  const changeTab = (t) => { setTab(t); setType("all"); setSearch(""); setParams({ tab: t }); };
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [recFilter, setRecFilter] = useState("all");
  const [supFilter, setSupFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [refundId, setRefundId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [supFormOpen, setSupFormOpen] = useState(false);
  const [payClient, setPayClient] = useState(null);
  const [paySupplier, setPaySupplier] = useState(null);
  const [form, setForm] = useState({ client: "", type: "room", amount: "", method: "Carte bancaire", date: todayISO(), status: "completed" });
  const [supForm, setSupForm] = useState({ supplier: "", label: "", amount: "", dueDate: addDaysISO(undefined, 30) });
  const [errors, setErrors] = useState({});
  const [supErrors, setSupErrors] = useState({});

  const selected = data.transactions.find((t) => t.id === selectedId);
  const invoice = data.transactions.find((t) => t.id === invoiceId);
  const hotel = data.settings.hotel;
  const enabledMethods = methods.filter((method) => ({ "Carte bancaire": data.settings.payments.card, Virement: data.settings.payments.transfer, "Espèces": data.settings.payments.cash })[method]);
  const filtered = useMemo(() => data.transactions.filter((t) => (!start || t.date >= start) && (!end || t.date <= end)), [data.transactions, start, end]);
  const stats = financeSummary(filtered);
  const rec = useMemo(() => receivablesSummary(data.reservations, data.transactions), [data.reservations, data.transactions]);
  const sup = useMemo(() => supplierSummary(data.supplierInvoices || []), [data.supplierInvoices]);

  const txRows = useMemo(() => filtered.filter((t) => {
    const q = !search || `${t.id} ${t.client} ${t.method}`.toLowerCase().includes(search.toLowerCase());
    const typeOk = type === "all" || t.type === type;
    if (tab === "revenue") return q && typeOk && t.amount > 0 && t.type !== "refund";
    if (tab === "expenses") return q && (t.type === "expense" || t.amount < 0);
    return q && typeOk;
  }).sort((a, b) => b.date.localeCompare(a.date)), [filtered, type, search, tab]);
  const recRows = useMemo(() => rec.items.filter((r) => {
    const q = search.toLowerCase().trim();
    return (!q || `${r.id} ${r.clientName} ${r.roomNumber}`.toLowerCase().includes(q))
      && (recFilter === "all" || (recFilter === "overdue" && r.balance.overdue) || (recFilter === "partial" && r.balance.status === "partial") || (recFilter === "pending" && r.balance.status === "pending"));
  }), [rec.items, search, recFilter]);
  const supRows = useMemo(() => (sup.items || []).filter((i) => {
    const q = search.toLowerCase().trim();
    return (!q || `${i.number} ${i.supplier} ${i.label}`.toLowerCase().includes(q))
      && (supFilter === "all" || (supFilter === "overdue" && i.balance.overdue) || (supFilter === "partial" && i.balance.status === "partial") || (supFilter === "pending" && i.balance.status === "pending"));
  }), [sup.items, search, supFilter]);

  const revenueByDay = dailySeries(data.transactions, 30, "date", (t) => t.amount > 0 ? t.amount : 0);
  const monthly = monthlySeries(data.transactions.filter((t) => t.amount > 0), 12, "date", (t) => t.amount);
  const serviceData = serviceBreakdown(filtered);
  const methodData = methods.map((m) => ({ label: m, value: filtered.filter((t) => t.method === m && t.amount > 0).reduce((s, t) => s + t.amount, 0) })).filter((d) => d.value);

  const submit = (e) => {
    e.preventDefault(); const err = {};
    if (!form.client.trim()) err.client = "Client requis.";
    if (+form.amount <= 0) err.amount = "Saisissez un montant positif.";
    if (!form.date) err.date = "Date requise.";
    if (!form.method || !enabledMethods.includes(form.method)) err.method = "Activez et choisissez un mode de paiement dans les paramètres.";
    setErrors(err); if (Object.keys(err).length) return;
    const negative = ["expense", "refund"].includes(form.type);
    saveRecord("transactions", { ...form, id: makeId("TRX"), amount: (negative ? -1 : 1) * +form.amount, invoice: negative ? null : makeId("FAC") }, `Transaction ${form.client} enregistrée`);
    setFormOpen(false);
  };

  const submitSupplier = (e) => {
    e.preventDefault(); const err = {};
    if (!supForm.supplier.trim()) err.supplier = "Fournisseur requis.";
    if (!supForm.label.trim()) err.label = "Objet requis.";
    if (+supForm.amount <= 0) err.amount = "Montant positif requis.";
    if (!supForm.dueDate) err.dueDate = "Échéance requise.";
    setSupErrors(err); if (Object.keys(err).length) return;
    const id = makeId("SUP");
    saveRecord("supplierInvoices", { id, supplierId: null, supplier: supForm.supplier.trim(), category: "Divers", number: `FAC-F-${id.slice(-4)}`, label: supForm.label.trim(), amount: +supForm.amount, paidAmount: 0, method: "Virement", issueDate: todayISO(), dueDate: supForm.dueDate, notes: "" }, `Facture fournisseur ${supForm.supplier} enregistrée`);
    setSupFormOpen(false);
  };

  const columns = [
    { key: "id", label: "Transaction ID", render: (t) => <span className="font-medium text-night">{t.id}</span> },
    { key: "client", label: "Client" },
    { key: "type", label: "Type", render: (t) => types[t.type] || t.type },
    { key: "amount", label: "Montant", render: (t) => <span className={`font-medium ${t.amount < 0 ? "text-rose-600" : "text-emerald-700"}`}>{t.amount > 0 ? "+" : ""}{formatPrice(t.amount)}</span> },
    { key: "method", label: "Méthode" },
    { key: "date", label: "Date", render: (t) => formatDate(t.date, { day: "numeric", month: "short", year: "numeric" }) },
    { key: "status", label: "Statut", render: (t) => <StatusBadge value={t.status} /> },
    { key: "action", label: "", sortable: false, render: (t) => <Dropdown items={[{ label: "Voir le détail", icon: Eye, onClick: () => setSelectedId(t.id) }, t.invoice && { label: "Facture", icon: FileText, onClick: () => setInvoiceId(t.id) }, t.amount > 0 && t.status !== "refunded" && { label: "Rembourser", icon: RotateCcw, danger: true, onClick: () => setRefundId(t.id) }]} /> },
  ];

  const recColumns = [
    { key: "id", label: "Réservation", render: (r) => <Link to={`/admin/reservations?id=${r.id}`} className="font-semibold text-gold hover:underline">{r.id}</Link> },
    { key: "clientName", label: "Client", render: (r) => <Link to={`/admin/clients/${r.clientId}?tab=payments`} className="hover:text-gold hover:underline">{r.clientName}</Link> },
    { key: "roomNumber", label: "Chambre" },
    { key: "checkOut", label: "Échéance", render: (r) => <span className={r.balance.overdue ? "font-medium text-rose-600" : ""}>{formatDate(r.checkOut, { day: "numeric", month: "short", year: "numeric" })}{r.balance.overdue && <span className="ml-1 text-[10px]">· J+{r.balance.daysOverdue}</span>}</span> },
    { key: "billed", label: "Facturé", sortValue: (r) => r.balance.billed, render: (r) => formatPrice(r.balance.billed) },
    { key: "paidX", label: "Encaissé", sortValue: (r) => r.balance.paid, render: (r) => <span className="text-emerald-700">{formatPrice(r.balance.paid)}</span> },
    { key: "due", label: "Reste dû", sortValue: (r) => r.balance.due, render: (r) => <span className="font-semibold text-night">{formatPrice(r.balance.due)}</span> },
    { key: "st", label: "Statut", render: (r) => <StatusBadge value={r.balance.overdue ? "overdue" : r.balance.status} /> },
    { key: "act", label: "", sortable: false, render: (r) => <button onClick={() => setPayClient(r)} className="rounded-lg bg-night px-3 py-1.5 text-[11px] text-white hover:bg-night-2">Encaisser</button> },
  ];

  const supColumns = [
    { key: "number", label: "Facture", render: (i) => <span><span className="font-semibold text-night">{i.number}</span><span className="block max-w-56 truncate text-[10px] text-night/45">{i.label}</span></span> },
    { key: "supplier", label: "Fournisseur" },
    { key: "dueDate", label: "Échéance", render: (i) => <span className={i.balance.overdue ? "font-medium text-rose-600" : ""}>{formatDate(i.dueDate, { day: "numeric", month: "short", year: "numeric" })}{i.balance.overdue && <span className="ml-1 text-[10px]">· J+{i.balance.daysOverdue}</span>}</span> },
    { key: "amount", label: "Montant", render: (i) => formatPrice(i.amount) },
    { key: "paidAmount", label: "Réglé", render: (i) => <span className="text-emerald-700">{formatPrice(i.paidAmount || 0)}</span> },
    { key: "due", label: "Reste dû", sortValue: (i) => i.balance.due, render: (i) => <span className="font-semibold text-night">{formatPrice(i.balance.due)}</span> },
    { key: "st", label: "Statut", render: (i) => <StatusBadge value={i.balance.status} /> },
    { key: "act", label: "", sortable: false, render: (i) => <button onClick={() => setPaySupplier(i)} className="rounded-lg bg-night px-3 py-1.5 text-[11px] text-white hover:bg-night-2">Régler</button> },
  ];

  const exportTx = () => downloadCsv("maison-aurele-transactions.csv", ["ID", "Client", "Type", "Montant EUR", "Méthode", "Date", "Statut"], txRows.map((t) => [t.id, t.client, types[t.type], t.amount, t.method, t.date, t.status]));
  const exportRec = () => downloadCsv("creances-clients.csv", ["Réservation", "Client", "Chambre", "Échéance", "Facturé EUR", "Encaissé EUR", "Reste EUR", "Statut"], recRows.map((r) => [r.id, r.clientName, r.roomNumber, r.checkOut, r.balance.billed, r.balance.paid, r.balance.due, r.balance.overdue ? "En retard" : r.balance.status]));
  const exportSup = () => downloadCsv("dettes-fournisseurs.csv", ["Facture", "Fournisseur", "Objet", "Échéance", "Montant EUR", "Réglé EUR", "Reste EUR", "Statut"], supRows.map((i) => [i.number, i.supplier, i.label, i.dueDate, i.amount, i.paidAmount || 0, i.balance.due, i.balance.status]));

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Pilotage / Comptabilité" title="Finance" subtitle="Encaissements, créances clients et dettes fournisseurs." action={<>{tab === "payables" ? <button onClick={() => { setSupForm({ supplier: "", label: "", amount: "", dueDate: addDaysISO(undefined, 30) }); setSupErrors({}); setSupFormOpen(true); }} className={adminButton}><Plus size={15} /> Nouvelle facture fournisseur</button> : <button onClick={() => { setForm({ client: "", type: "room", amount: "", method: enabledMethods[0] || "", date: todayISO(), status: "completed" }); setErrors({}); setFormOpen(true); }} className={adminButton}><Plus size={15} /> Nouvelle transaction</button>}</>} />
    <div className="mb-5 flex flex-wrap items-center gap-3 text-xs"><span className="text-night/50">Période d'analyse</span><input type="date" aria-label="Début" value={start} onChange={(e) => setStart(e.target.value)} className={adminField} /><span className="text-night/35">au</span><input type="date" aria-label="Fin" value={end} onChange={(e) => setEnd(e.target.value)} className={adminField} />{start > end && <span className="text-rose-600">La date de début doit précéder la fin.</span>}</div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard accent icon={Wallet} label="Revenus" value={formatPrice(stats.revenue)} hint="Encaissements sur la période" />
      <StatCard icon={ArrowDownLeft} label="Dépenses" value={formatPrice(stats.expenses)} hint="Charges opérationnelles" />
      <StatCard icon={ArrowUpRight} label="Résultat net" value={formatPrice(stats.net)} hint="Après charges & remboursements" />
      <StatCard icon={RotateCcw} label="Remboursements" value={formatPrice(stats.refunds)} hint="Sur la période" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button onClick={() => changeTab("receivables")} className="text-left"><StatCard icon={HandCoins} label="Créances clients" value={formatPrice(rec.total)} hint={`${rec.count} dossier(s) · ${formatPrice(rec.overdue)} en retard`} /></button>
      <button onClick={() => changeTab("payables")} className="text-left"><StatCard icon={Truck} label="Dettes fournisseurs" value={formatPrice(sup.total)} hint={`${sup.count} facture(s) · ${formatPrice(sup.overdue)} en retard`} /></button>
      <StatCard icon={AlertTriangle} label="Total en retard" value={formatPrice(rec.overdue + sup.overdue)} hint="Clients + fournisseurs" />
      <StatCard icon={CheckCircle2} label="Encaissé (réservations)" value={formatPrice(data.reservations.filter((r) => r.status !== "cancelled").reduce((s, r) => s + bookingBalance(r, data.transactions).paid, 0))} hint="Cumul tous séjours actifs" />
    </div>

    {["overview","revenue","expenses"].includes(tab) && <>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><ChartCard title="Évolution des revenus" subtitle="Recettes journalières · 30 derniers jours"><AreaChart data={revenueByDay} format={(n) => formatPrice(n)} /></ChartCard><ChartCard title="Revenus par service" subtitle="Répartition sur la période"><DonutChart data={serviceData} money size={155} centerValue={formatPrice(stats.revenue)} centerLabel="recettes" /></ChartCard></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><ChartCard title="Revenus mensuels" subtitle="Évolution sur 12 mois"><BarChart data={monthly} /></ChartCard><ChartCard title="Méthodes de paiement" subtitle="Répartition des encaissements"><DonutChart data={methodData} money size={155} centerValue={formatPrice(stats.revenue)} centerLabel="encaissements" /></ChartCard></div>
    </>}

    <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="font-serif text-[29px]">{{ overview: "Registre financier", revenue: "Revenue", expenses: "Expenses", payments: "Payments", receivables: "Créances clients", payables: "Dettes fournisseurs" }[tab]}</h2><p className="text-xs text-night/45">{tab === "receivables" ? "Total / Paid / Remaining / Due date / Status · Encaisser depuis ici" : tab === "payables" ? "Factures à régler aux fournisseurs · cliquez sur Régler" : tab === "expenses" ? "Charges et sorties de trésorerie" : tab === "revenue" ? "Encaissements par service" : "Vue d'ensemble puis détail par onglet. Factures détaillées dans le module Factures."}</p></div>
      <div className="flex gap-2"><button onClick={tab === "receivables" ? exportRec : tab === "payables" ? exportSup : exportTx} className={outlineButton}><Download size={14} /> Exporter CSV</button><Link to="/admin/invoices" className={outlineButton}><FileText size={14}/> Factures</Link></div>
    </div>
    <div className="my-5 flex w-fit max-w-full flex-wrap gap-1 overflow-x-auto rounded-xl border border-night/10 bg-white p-1">{tabs.map(([k, v]) => <button key={k} onClick={() => changeTab(k)} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs ${tab === k ? "bg-night text-white" : "text-night/55 hover:bg-ivory"}`}>{v}{k === "receivables" && rec.count > 0 && <span className={`rounded-full px-1.5 text-[10px] ${tab === k ? "bg-amber-400 text-night" : "bg-amber-100 text-amber-800"}`}>{rec.count}</span>}{k === "payables" && sup.count > 0 && <span className={`rounded-full px-1.5 text-[10px] ${tab === k ? "bg-amber-400 text-night" : "bg-amber-100 text-amber-800"}`}>{sup.count}</span>}</button>)}</div>

    {tab === "receivables" && <>
      {rec.overdue > 0 && <div className="mb-4 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs text-rose-800 ring-1 ring-rose-200"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span><strong>{formatPrice(rec.overdue)} en retard</strong> — relancez en priorité les dossiers affichés « En retard » (séjours terminés non soldés).</span></div>}
      <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Réservation, client, chambre..." className="w-full sm:w-64" /><select value={recFilter} onChange={(e) => setRecFilter(e.target.value)} aria-label="Filtrer créances" className={adminField}><option value="all">Tous les soldes</option><option value="pending">Non payés</option><option value="partial">Partiels (acompte versé)</option><option value="overdue">En retard</option></select><span className="ml-auto text-xs text-night/40">{formatPrice(recRows.reduce((s, r) => s + r.balance.due, 0))} à encaisser</span></FilterBar>
      <DataTable rows={recRows} columns={recColumns} emptyTitle="Aucune créance client" emptyText="Toutes les factures clients sont soldées. Bravo !" />
    </>}

    {tab === "payables" && <>
      {sup.overdue > 0 && <div className="mb-4 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs text-rose-800 ring-1 ring-rose-200"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span><strong>{formatPrice(sup.overdue)} en retard</strong> — réglez en priorité les factures dépassées pour préserver vos relations fournisseurs.</span></div>}
      <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Facture, fournisseur..." className="w-full sm:w-64" /><select value={supFilter} onChange={(e) => setSupFilter(e.target.value)} aria-label="Filtrer dettes" className={adminField}><option value="all">Toutes les dettes</option><option value="pending">Non réglées</option><option value="partial">Partielles</option><option value="overdue">En retard</option></select><span className="ml-auto text-xs text-night/40">{formatPrice(supRows.reduce((s, i) => s + i.balance.due, 0))} à régler</span></FilterBar>
      <DataTable rows={supRows} columns={supColumns} emptyTitle="Aucune dette fournisseur" emptyText="Toutes les factures fournisseurs sont réglées." />
      <div className={`${panel} mt-5 p-5`}><h3 className="font-serif text-xl">Factures déjà réglées</h3><div className="mt-3 space-y-2">{(data.supplierInvoices || []).filter((i) => (i.amount - (i.paidAmount || 0)) <= 0).map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ivory px-4 py-2.5 text-xs"><span>{i.number} · {i.supplier} · {i.label}</span><span className="flex items-center gap-2">{formatPrice(i.amount)}<StatusBadge value="paid" /></span></div>)} {(data.supplierInvoices || []).filter((i) => (i.amount - (i.paidAmount || 0)) <= 0).length === 0 && <p className="text-xs text-night/45">Aucune facture soldée pour le moment.</p>}</div></div>
    </>}

    {(tab === "overview" || tab === "payments" || tab === "revenue" || tab === "expenses") && <>
      <div className="mb-4 flex items-center gap-2 text-xs text-night/50"><span className="font-medium text-night">{tab === "overview" ? "Toutes les opérations" : tab === "revenue" ? "Encaissements uniquement" : tab === "expenses" ? "Dépenses uniquement" : "Paiements & mouvements"}</span><Link to="/admin/invoices" className="text-gold hover:underline">→ Module Factures pour View / Print / Download / Send</Link></div>
      <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="ID, client, méthode..." className="w-full sm:w-64" /><select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtrer par type" className={adminField}><option value="all">Tous les types</option>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><span className="ml-auto text-xs text-night/40">{txRows.length} transaction(s)</span></FilterBar>
      <DataTable rows={txRows} columns={columns} onRowClick={(t) => setSelectedId(t.id)} emptyTitle="Aucune transaction sur cette période" />
    </>}

    <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.id || ""} eyebrow="Détail de transaction" footer={selected && <>{selected.invoice && <button onClick={() => { setInvoiceId(selected.id); setSelectedId(null); }} className={outlineButton}><FileText size={14} /> Voir la facture</button>}{selected.amount > 0 && selected.status !== "refunded" && <button onClick={() => setRefundId(selected.id)} className={adminButton}><RotateCcw size={14} /> Rembourser</button>}</>}>
      {selected && <div className="space-y-5"><div className={`${panel} p-6 text-center`}><div className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${selected.amount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}><ReceiptText size={22} /></div><p className="mt-4 font-serif text-4xl">{formatPrice(selected.amount)}</p><div className="mt-2"><StatusBadge value={selected.status} /></div></div><div className={`${panel} p-5`}>{[["Client", selected.client], ["Type", types[selected.type]], ["Méthode", selected.method], ["Date", formatDate(selected.date)], ["Réservation", selected.bookingId || "—"], ["Facture", selected.invoice || "—"]].map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-night/[.06] py-3 text-xs last:border-0"><span className="text-night/45">{k}</span><strong className="text-right font-medium">{v}</strong></div>)}</div></div>}
    </Drawer>

    <Modal open={!!invoice} onClose={() => setInvoiceId(null)} title={`Facture ${invoice?.invoice || ""}`} size="lg" footer={<><button onClick={() => setInvoiceId(null)} className={outlineButton}>Fermer</button><button onClick={() => window.print()} className={adminButton}><Printer size={14} /> Imprimer / PDF</button></>}>
      {invoice && <div className="print-invoice bg-white p-4 text-sm"><div className="flex items-start justify-between border-b border-night/10 pb-8"><div><h3 className="font-serif text-3xl">Maison <em>Aurèle</em></h3><p className="mt-2 text-xs text-night/55">{hotel.address}<br />{hotel.phone}<br />{hotel.email}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-widest text-gold">Facture</p><p className="font-serif text-2xl">{invoice.invoice}</p><p className="text-xs text-night/50">{formatDate(invoice.date)}</p></div></div><div className="my-8 text-xs"><p className="text-night/40">Facturé à</p><p className="mt-1 font-medium">{invoice.client}</p></div><div className="flex justify-between border-y border-night/10 py-4 text-xs"><span>{types[invoice.type]} · {invoice.id}</span><span>{formatPrice(invoice.amount)}</span></div><div className="mt-8 flex justify-end gap-10 font-serif text-2xl"><span>Total TTC</span><span>{formatPrice(invoice.amount)}</span></div><p className="mt-12 text-center text-[10px] text-night/40">Document de démonstration sans valeur comptable. Merci pour votre confiance.</p></div>}
    </Modal>

    <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nouvelle transaction" description="L'opération sera conservée dans le registre local." footer={<><button onClick={() => setFormOpen(false)} className={outlineButton}>Annuler</button><button form="transaction-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      <form id="transaction-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><FormField label="Client / tiers *" error={errors.client} className="sm:col-span-2"><input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className={adminField} /></FormField><FormField label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={adminField}>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></FormField><FormField label="Montant (€) *" error={errors.amount}><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={adminField} /></FormField><FormField label="Méthode" error={errors.method}><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={adminField}><option value="">Choisir...</option>{enabledMethods.map((m) => <option key={m}>{m}</option>)}</select></FormField><FormField label="Date *" error={errors.date}><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={adminField} /></FormField></form>
    </Modal>

    <Modal open={supFormOpen} onClose={() => setSupFormOpen(false)} title="Nouvelle facture fournisseur" footer={<><button onClick={() => setSupFormOpen(false)} className={outlineButton}>Annuler</button><button form="sup-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      <form id="sup-form" onSubmit={submitSupplier} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fournisseur *" error={supErrors.supplier}><input list="suppliers-list" value={supForm.supplier} onChange={(e) => setSupForm({ ...supForm, supplier: e.target.value })} className={adminField} placeholder="Ex. Linge Prestige Paris" /><datalist id="suppliers-list">{(data.suppliers || []).map((s) => <option key={s.id} value={s.name} />)}</datalist></FormField>
        <FormField label="Montant TTC (€) *" error={supErrors.amount}><input type="number" min="0.01" step="0.01" value={supForm.amount} onChange={(e) => setSupForm({ ...supForm, amount: e.target.value })} className={adminField} /></FormField>
        <FormField label="Objet *" error={supErrors.label} className="sm:col-span-2"><input value={supForm.label} onChange={(e) => setSupForm({ ...supForm, label: e.target.value })} className={adminField} placeholder="Ex. Blanchisserie mars" /></FormField>
        <FormField label="Échéance *" error={supErrors.dueDate}><input type="date" value={supForm.dueDate} onChange={(e) => setSupForm({ ...supForm, dueDate: e.target.value })} className={adminField} /></FormField>
      </form>
    </Modal>

    {payClient && <ClientPaymentModal key={payClient.id} open={!!payClient} onClose={() => setPayClient(null)} reservation={payClient} due={payClient.balance.due} onConfirm={(v, m) => recordClientPayment(payClient.id, v, m)} />}
    {paySupplier && <SupplierPaymentModal key={paySupplier.id} open={!!paySupplier} onClose={() => setPaySupplier(null)} invoice={paySupplier} due={paySupplier.balance.due} onConfirm={(v, m) => recordSupplierPayment(paySupplier.id, v, m)} />}
    <ConfirmDialog open={!!refundId} onClose={() => setRefundId(null)} onConfirm={() => refundTransaction(refundId)} title="Effectuer le remboursement ?" description="Un mouvement négatif sera ajouté au registre et le paiement sera marqué Remboursé. Il s'agit d'une simulation locale, aucun paiement réel n'est effectué." confirmLabel="Confirmer le remboursement" destructive />
  </div>;
}
