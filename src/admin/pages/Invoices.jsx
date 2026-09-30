import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Download, Printer, Eye, Send, FileText } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { PageHeading, StatCard, StatusBadge, DataTable, SearchBar, FilterBar, Modal, Drawer, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatDate, formatPrice, todayISO } from "../../utils/booking";
import { bookingBalance, supplierInvoiceBalance } from "../utils/finance";
import { downloadCsv } from "../utils/analytics";

export default function Invoices() {
  const { data, saveRecord, notify } = useAdminData();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [viewId, setViewId] = useState(null);
  const [creditFor, setCreditFor] = useState(null);

  const clientInvoices = useMemo(() => data.transactions.filter((t) => t.amount > 0 && t.invoice).map((t) => ({
    id: t.invoice, kind: "client", number: t.invoice, title: `Facture client · ${t.client}`, party: t.client, link: t.bookingId ? `/admin/reservations?id=${t.bookingId}` : null,
    amount: t.amount, date: t.date, status: t.status === "refunded" ? "refunded" : "paid", ref: t.id,
  })), [data.transactions]);
  const receipts = useMemo(() => data.transactions.filter((t) => t.amount > 0).map((t) => ({
    id: `R-${t.id}`, kind: "receipt", number: `Reçu ${t.id}`, title: `Reçu de paiement · ${t.client}`, party: t.client, link: t.bookingId ? `/admin/reservations?id=${t.bookingId}` : null,
    amount: t.amount, date: t.date, status: "paid", ref: t.id,
  })), [data.transactions]);
  const refunds = useMemo(() => data.transactions.filter((t) => t.type === "refund").map((t) => ({
    id: `A-${t.id}`, kind: "refund", number: `Avoir ${t.id}`, title: `Avoir / remboursement · ${t.client}`, party: t.client, link: null,
    amount: -t.amount, date: t.date, status: "refunded", ref: t.id,
  })), [data.transactions]);
  const supplier = useMemo(() => (data.supplierInvoices || []).map((i) => {
    const b = supplierInvoiceBalance(i);
    return { id: i.id, kind: "supplier", number: i.number, title: `Facture fournisseur · ${i.supplier}`, party: i.supplier, link: "/admin/finance?tab=payables", amount: i.amount, paid: i.paidAmount || 0, due: b.due, date: i.issueDate, dueDate: i.dueDate, status: b.status, ref: i.id, raw: i };
  }), [data.supplierInvoices]);
  const credits = useMemo(() => (data.creditNotes || []).map((c) => ({ id: c.id, kind: "credit", number: c.number, title: `Avoir client · ${c.client}`, party: c.client, link: null, amount: c.amount, date: c.date, status: "sent", ref: c.id })), [data.creditNotes]);

  const all = useMemo(() => [...clientInvoices, ...supplier, ...receipts, ...refunds, ...credits].sort((a, b) => (b.date || "").localeCompare(a.date || "")), [clientInvoices, supplier, receipts, refunds, credits]);
  const rows = all.filter((d) => (kind === "all" || d.kind === kind) && (!search || `${d.number} ${d.party} ${d.title}`.toLowerCase().includes(search.toLowerCase())));
  const viewed = all.find((d) => d.id === viewId);
  const hotel = data.settings.hotel;

  const exportCsv = () => downloadCsv("factures.csv", ["Numéro", "Type", "Tiers", "Montant EUR", "Date", "Statut"], rows.map((r) => [r.number, r.kind, r.party, r.amount, r.date, r.status]));
  const sendMail = () => notify("Document envoyé par email (simulation).");

  const createCredit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const client = String(fd.get("client") || "").trim();
    const amount = +fd.get("amount") || 0;
    if (!client || amount <= 0) return;
    saveRecord("creditNotes", { id: makeId("AV"), number: `AV-${String((data.creditNotes || []).length + 1).padStart(4, "0")}`, client, amount, date: todayISO(), reason: String(fd.get("reason") || "") }, "Avoir client créé");
    setCreditFor(false);
  };

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Finance / Documents" title="Factures" subtitle="Factures clients & fournisseurs, reçus, avoirs et remboursements." action={<><button onClick={exportCsv} className={outlineButton}><Download size={14}/> CSV</button><button onClick={() => setCreditFor(true)} className={adminButton}><Plus size={15}/> Avoir client</button></>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Factures clients" value={clientInvoices.length} hint={formatPrice(clientInvoices.reduce((s, d) => s + d.amount, 0))} />
      <StatCard label="Factures fournisseurs" value={supplier.length} hint={formatPrice(supplier.reduce((s, d) => s + d.amount, 0))} />
      <StatCard label="Reçus émis" value={receipts.length} hint="Preuves de paiement" />
      <StatCard label="Avoirs & remboursements" value={refunds.length + credits.length} hint="Documents d'annulation" />
    </div>
    <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Numéro, tiers..." className="w-full sm:w-64"/><select value={kind} onChange={(e)=>setKind(e.target.value)} aria-label="Type" className={adminField}><option value="all">Tous types</option><option value="client">Factures clients</option><option value="supplier">Factures fournisseurs</option><option value="receipt">Reçus</option><option value="refund">Remboursements</option><option value="credit">Avoirs clients</option></select><span className="ml-auto text-xs text-night/40">{rows.length} document(s)</span></FilterBar>
    <DataTable rows={rows} columns={[
      { key: "number", label: "Document", render: (d) => <span><span className="font-semibold text-night">{d.number}</span><span className="block max-w-64 truncate text-[10px] text-night/45">{d.title}</span></span> },
      { key: "kind", label: "Type", render: (d) => ({ client: "Facture client", supplier: "Facture fournisseur", receipt: "Reçu", refund: "Remboursement", credit: "Avoir" }[d.kind]) },
      { key: "party", label: "Tiers" },
      { key: "amount", label: "Montant", render: (d) => <span className="font-medium">{formatPrice(d.amount)}</span> },
      { key: "date", label: "Date", render: (d) => formatDate(d.date, { day: "numeric", month: "short", year: "numeric" }) },
      { key: "status", label: "Statut", render: (d) => <StatusBadge value={d.status}/> },
      { key: "act", label: "", sortable: false, render: (d) => <div className="flex gap-1"><button title="Voir" onClick={()=>setViewId(d.id)} className="rounded-lg border border-night/10 p-1.5 hover:border-gold"><Eye size={14}/></button>{d.link && <Link title="Ouvrir le dossier" to={d.link} className="rounded-lg border border-night/10 p-1.5 hover:border-gold"><FileText size={14}/></Link>}</div> },
    ]} onRowClick={(d)=>setViewId(d.id)} emptyTitle="Aucun document" />

    <Drawer open={!!viewed} onClose={()=>setViewId(null)} title={viewed?.number || ""} eyebrow="Document · prêt pour PDF" footer={viewed && <><button onClick={()=>window.print()} className={outlineButton}><Printer size={14}/> Imprimer / PDF</button><button onClick={sendMail} className={adminButton}><Send size={14}/> Envoyer</button></>}>
      {viewed && <div className="print-invoice rounded-[20px] border border-night/[.07] bg-white p-6 text-sm">
        <div className="flex items-start justify-between border-b border-night/10 pb-6"><div><h3 className="font-serif text-3xl">Maison <em>Aurèle</em></h3><p className="mt-2 text-xs text-night/55">{hotel.address}<br/>{hotel.phone}<br/>{hotel.email}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-widest text-gold">{{client:"Facture",supplier:"Facture fournisseur",receipt:"Reçu",refund:"Avoir",credit:"Avoir"}[viewed.kind]}</p><p className="font-serif text-2xl">{viewed.number}</p><p className="text-xs text-night/50">{formatDate(viewed.date)}</p></div></div>
        <div className="my-6 text-xs"><p className="text-night/40">{viewed.kind==="supplier"?"Fournisseur":"Facturé à"}</p><p className="mt-1 font-medium">{viewed.party}</p>{viewed.raw && <p className="mt-1 text-night/55">{viewed.raw.label} · Échéance {formatDate(viewed.raw.dueDate)}</p>}</div>
        <div className="flex justify-between border-y border-night/10 py-4 text-xs"><span>{viewed.title}</span><span>{formatPrice(viewed.amount)}</span></div>
        {viewed.kind==="supplier" && <div className="mt-4 space-y-1 text-xs"><div className="flex justify-between"><span>Réglé</span><span>{formatPrice(viewed.paid)}</span></div><div className="flex justify-between font-medium"><span>Reste dû</span><span>{formatPrice(viewed.due)}</span></div></div>}
        <div className="mt-6 flex justify-end gap-8 font-serif text-2xl"><span>Total</span><span>{formatPrice(viewed.amount)}</span></div>
        <p className="mt-8 text-center text-[10px] text-night/40">Document de démonstration — export PDF via Imprimer → Enregistrer en PDF.</p>
      </div>}
    </Drawer>

    <Modal open={!!creditFor} onClose={()=>setCreditFor(false)} title="Créer un avoir client" footer={<><button onClick={()=>setCreditFor(false)} className={outlineButton}>Annuler</button><button form="credit-form" type="submit" className={adminButton}>Créer l'avoir</button></>}>
      <form id="credit-form" onSubmit={createCredit} className="grid gap-4">
        <FormField label="Client *"><input name="client" list="clients-list" className={adminField} placeholder="Nom du client"/><datalist id="clients-list">{data.clients.map((c)=><option key={c.id} value={`${c.firstName} ${c.lastName}`}/>)}</datalist></FormField>
        <div className="grid grid-cols-2 gap-3"><FormField label="Montant (€) *"><input name="amount" type="number" min="0.01" step="0.01" className={adminField}/></FormField><FormField label="Motif"><input name="reason" className={adminField} placeholder="Ex. Geste commercial"/></FormField></div>
      </form>
    </Modal>
  </div>;
}
