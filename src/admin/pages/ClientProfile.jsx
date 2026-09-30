import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Pencil, BedDouble, CreditCard, Heart, StickyNote, Wallet, CheckCircle2, AlertTriangle, Plus, Download } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import ClientForm from "../components/ClientForm";
import { ClientPaymentModal } from "../components/PaymentModal";
import { PageHeading, StatusBadge, DataTable, StatCard, adminField, adminButton, panel } from "../components/ui";
import { formatDate, formatPrice } from "../../utils/booking";
import { clientBalance } from "../utils/finance";
import { downloadCsv } from "../utils/analytics";

const tabs = [{ key: "history", label: "Historique", icon: BedDouble }, { key: "payments", label: "Paiements", icon: CreditCard }, { key: "preferences", label: "Préférences", icon: Heart }, { key: "notes", label: "Notes", icon: StickyNote }];

export default function ClientProfile() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { data, updateRecord, recordClientPayment } = useAdminData();
  const client = data.clients.find((c) => c.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const tab = params.get("tab") || "history";

  const balance = useMemo(() => client ? clientBalance(id, data.reservations, data.transactions) : null, [client, id, data.reservations, data.transactions]);
  const payments = useMemo(() => {
    if (!balance) return [];
    const ids = new Set(balance.lines.map((r) => r.id));
    return data.transactions.filter((t) => ids.has(t.bookingId)).sort((a, b) => b.date.localeCompare(a.date));
  }, [balance, data.transactions]);

  if (!client) return <div className={`${panel} p-10 text-center`}><h1 className="font-serif text-3xl">Client introuvable</h1><Link to="/admin/clients" className={`${adminButton} mt-5`}>Retour aux clients</Link></div>;

  const pendingLines = balance.lines.filter((l) => l.balance.due > 0);
  const saveText = (field) => { updateRecord("clients", id, { [field]: draft ?? client[field] }, `${field === "notes" ? "Notes" : "Préférences"} du client mises à jour`); setDraft(null); };
  const exportHistory = () => downloadCsv(`historique-paiements-${client.lastName}.csv`,
    ["Réservation", "Chambre", "Arrivée", "Départ", "Facturé EUR", "Payé EUR", "Reste EUR", "Statut paiement", "Statut séjour"],
    balance.lines.map((r) => [r.id, r.roomNumber, r.checkIn, r.checkOut, r.balance.billed.toFixed(2), r.balance.paid.toFixed(2), r.balance.due.toFixed(2), r.balance.status, r.status]));

  return <div className="animate-fade-in">
    <Link to="/admin/clients" className="mb-5 inline-flex items-center gap-2 text-xs text-night/50 hover:text-night"><ArrowLeft size={14} /> Retour aux clients</Link>
    <PageHeading eyebrow="Opérations / Profil client" title={`${client.firstName} ${client.lastName}`} subtitle="Séjours, paiements effectués et reste à payer." action={<><button onClick={exportHistory} className="hidden sm:inline-flex btn-outline !rounded-xl !px-4 !py-2.5 !text-[13px]"><Download size={14} /> Export</button><button onClick={() => setEditOpen(true)} className={adminButton}><Pencil size={14} /> Modifier le profil</button></>} />
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className={`${panel} h-fit p-6`}>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-sand font-serif text-3xl text-night">{client.firstName[0]}{client.lastName[0]}</div>
        <h2 className="mt-4 font-serif text-2xl">{client.firstName} {client.lastName}</h2>
        <div className="mt-2 flex flex-wrap gap-2"><StatusBadge value={client.status} /><StatusBadge value={balance.overdue > 0 ? "overdue" : balance.due > 0 ? "pending" : "settled"} /></div>
        <div className="mt-6 space-y-3 border-t border-night/[.07] pt-5 text-xs text-night/60"><p className="flex items-center gap-2"><Mail size={15} className="text-gold" />{client.email}</p><p className="flex items-center gap-2"><Phone size={15} className="text-gold" />{client.phone}</p><p className="flex items-center gap-2"><MapPin size={15} className="text-gold" />{client.country}</p></div>
        <div className={`mt-6 rounded-2xl p-4 text-center ${balance.due > 0 ? "bg-amber-50 ring-1 ring-amber-200" : "bg-emerald-50 ring-1 ring-emerald-200"}`}>
          <p className="text-[10px] font-medium uppercase tracking-widest text-night/50">Reste à payer</p>
          <p className={`mt-1 font-serif text-3xl ${balance.due > 0 ? "text-amber-800" : "text-emerald-700"}`}>{formatPrice(balance.due)}</p>
          {balance.overdue > 0 && <p className="mt-1 text-[11px] text-rose-600">dont {formatPrice(balance.overdue)} en retard</p>}
          {balance.due <= 0 && <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-emerald-700"><CheckCircle2 size={12} /> Compte soldé</p>}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-night/[.07] pt-5">
          <div><p className="text-[10px] text-night/45">Séjours</p><p className="mt-1 font-serif text-2xl">{balance.stays}</p></div>
          <div><p className="text-[10px] text-night/45">Recouvrement</p><p className="mt-1 font-serif text-2xl">{balance.recoveryRate} %</p></div>
          <div><p className="text-[10px] text-night/45">Total facturé</p><p className="mt-1 text-sm font-medium">{formatPrice(balance.billed)}</p></div>
          <div><p className="text-[10px] text-night/45">Total payé</p><p className="mt-1 text-sm font-medium text-emerald-700">{formatPrice(balance.paid)}</p></div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mb-5 flex overflow-x-auto rounded-xl border border-night/[.07] bg-white p-1">{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => { setParams({ tab: key }); setDraft(null); }} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs transition ${tab === key ? "bg-night text-white" : "text-night/55 hover:bg-ivory"}`}><Icon size={14} />{label}{key === "payments" && balance.due > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === key ? "bg-amber-400 text-night" : "bg-amber-100 text-amber-800"}`}>{pendingLines.length}</span>}</button>)}</div>

        {tab === "history" && <div>
          <h3 className="mb-3 font-serif text-2xl">Historique des réservations</h3>
          <DataTable rows={balance.lines} columns={[
            { key: "id", label: "Réservation", render: (r) => <Link to={`/admin/reservations?id=${r.id}`} className="font-medium text-gold hover:underline">{r.id}</Link> },
            { key: "roomNumber", label: "Chambre" },
            { key: "checkIn", label: "Arrivée", render: (r) => formatDate(r.checkIn, { day: "numeric", month: "short", year: "numeric" }) },
            { key: "checkOut", label: "Départ", render: (r) => formatDate(r.checkOut, { day: "numeric", month: "short", year: "numeric" }) },
            { key: "amount", label: "Facturé", render: (r) => formatPrice(r.balance.billed) },
            { key: "paid", label: "Payé", render: (r) => <span className="text-emerald-700">{formatPrice(r.balance.paid)}</span> },
            { key: "due", label: "Reste", render: (r) => r.balance.due > 0 ? <span className="font-semibold text-amber-700">{formatPrice(r.balance.due)}</span> : <span className="text-night/30">—</span> },
            { key: "payStatus", label: "Paiement", render: (r) => <StatusBadge value={r.balance.overdue ? "overdue" : r.balance.status} /> },
            { key: "status", label: "Séjour", render: (r) => <StatusBadge value={r.status} /> },
          ]} emptyTitle="Pas encore de réservations" emptyText="Ses séjours apparaîtront ici." />
        </div>}

        {tab === "payments" && <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Total facturé" value={formatPrice(balance.billed)} hint={`${balance.stays} séjour(s)`} />
            <StatCard icon={CheckCircle2} label="Payé" value={formatPrice(balance.paid)} hint={`${balance.recoveryRate} % recouvré`} />
            <StatCard icon={CreditCard} label="Reste à payer" value={formatPrice(balance.due)} hint={`${pendingLines.length} facture(s) ouverte(s)`} />
            <StatCard icon={AlertTriangle} label="En retard" value={formatPrice(balance.overdue)} hint={balance.overdue > 0 ? "À relancer" : "Aucun retard"} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-serif text-2xl">En attente de paiement</h3><span className="text-xs text-night/45">{pendingLines.length} réservation(s)</span></div>
            {pendingLines.length === 0
              ? <div className={`${panel} flex items-center gap-3 p-5 text-sm text-emerald-700`}><CheckCircle2 size={18} /> Toutes les factures de ce client sont soldées.</div>
              : <DataTable rows={pendingLines} columns={[
                { key: "id", label: "Réservation", render: (r) => <Link to={`/admin/reservations?id=${r.id}`} className="font-medium text-gold hover:underline">{r.id}</Link> },
                { key: "roomNumber", label: "Chambre" },
                { key: "checkOut", label: "Échéance", render: (r) => <span className={r.balance.overdue ? "font-medium text-rose-600" : ""}>{formatDate(r.checkOut, { day: "numeric", month: "short", year: "numeric" })}{r.balance.overdue && <span className="ml-1 text-[10px]">· J+{r.balance.daysOverdue}</span>}</span> },
                { key: "billed", label: "Facturé", render: (r) => formatPrice(r.balance.billed) },
                { key: "paidA", label: "Déjà payé", render: (r) => formatPrice(r.balance.paid) },
                { key: "dueA", label: "Reste dû", render: (r) => <span className="font-semibold text-night">{formatPrice(r.balance.due)}</span> },
                { key: "st", label: "Statut", render: (r) => <StatusBadge value={r.balance.overdue ? "overdue" : r.balance.status} /> },
                { key: "act", label: "", sortable: false, render: (r) => <button onClick={() => setPayFor(r)} className="rounded-lg bg-night px-3 py-1.5 text-[11px] text-white hover:bg-night-2"><Plus size={12} className="mr-1 inline" />Encaisser</button> },
              ]} emptyTitle="Aucune facture en attente" />}
          </div>

          <div>
            <h3 className="mb-3 font-serif text-2xl">Paiements effectués</h3>
            <DataTable rows={payments} columns={[
              { key: "id", label: "Transaction", render: (t) => <span className="font-medium text-night">{t.id}</span> },
              { key: "bookingId", label: "Réservation", render: (t) => <Link to={`/admin/reservations?id=${t.bookingId}`} className="text-gold hover:underline">{t.bookingId || "—"}</Link> },
              { key: "date", label: "Date", render: (t) => formatDate(t.date, { day: "numeric", month: "short", year: "numeric" }) },
              { key: "method", label: "Méthode" },
              { key: "amount", label: "Montant", render: (t) => <span className={`font-medium ${t.amount < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatPrice(t.amount)}</span> },
              { key: "status", label: "Statut", render: (t) => <StatusBadge value={t.status} /> },
            ]} emptyTitle="Aucun paiement enregistré" emptyText="Les encaissements liés à ses réservations apparaîtront ici." />
          </div>
        </div>}

        {(tab === "preferences" || tab === "notes") && <div className={`${panel} p-6`}>
          <h3 className="font-serif text-2xl">{tab === "notes" ? "Notes internes" : "Préférences du client"}</h3>
          <p className="mt-1 text-xs text-night/45">{tab === "notes" ? "Informations réservées à votre équipe." : "Personnalisez chaque séjour à partir de ses préférences."}</p>
          <textarea rows={6} value={draft ?? client[tab] ?? ""} onChange={(e) => setDraft(e.target.value)} className={`${adminField} mt-5`} placeholder={tab === "notes" ? "Ajouter une note..." : "Oreillers, étage, allergies..."} />
          <button disabled={draft === null} onClick={() => saveText(tab)} className={`${adminButton} mt-3`}>Enregistrer</button>
        </div>}
      </div>
    </div>
    {editOpen && <ClientForm key={client.id} client={client} open={editOpen} onClose={() => setEditOpen(false)} />}
    {payFor && <ClientPaymentModal key={payFor.id} open={!!payFor} onClose={() => setPayFor(null)} reservation={payFor} due={payFor.balance.due} onConfirm={(v, m) => recordClientPayment(payFor.id, v, m)} />}
  </div>;
}
