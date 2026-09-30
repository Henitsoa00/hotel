import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Check, CheckCircle2, DoorOpen, DoorClosed, Eye, Pencil, Plus, XCircle, CreditCard, UserRound, HandCoins, UserX, LayoutList, CalendarRange } from "lucide-react";
import { DataTable, PageHeading, SearchBar, FilterBar, StatusBadge, Drawer, Modal, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { ClientPaymentModal } from "../components/PaymentModal";
import { ReservationCalendar } from "../components/ReservationCalendar";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { calculatePrice, formatDate, formatPrice, todayISO, addDaysISO } from "../../utils/booking";
import { bookingBalance } from "../utils/finance";

const initialForm = { clientId: "", roomId: "", checkIn: "", checkOut: "", guests: 2, payment: "pending", status: "confirmed", services: [], notes: "" };
const extras = ["Petit-déjeuner", "Spa", "Transfert aéroport", "Parking"];
const statuses = ["pending", "confirmed", "checked-in", "checked-out", "completed", "cancelled", "no-show"];
const statusLabels = { pending: "En attente", confirmed: "Confirmée", "checked-in": "Check-in", "checked-out": "Check-out", completed: "Terminée", cancelled: "Annulée", "no-show": "No-show" };

export default function Reservations() {
  const { data, saveReservation, setReservationStatus, recordClientPayment } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") || "all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [date, setDate] = useState(params.get("date") === "today" ? todayISO() : "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [cancelId, setCancelId] = useState(null);
  const [noShowId, setNoShowId] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [checkInFor, setCheckInFor] = useState(null);
  const [checkOutFor, setCheckOutFor] = useState(null);
  const selected = data.reservations.find((r) => r.id === params.get("id"));
  const openDetail = (r) => setParams({ id: r.id });
  const closeDetail = () => { const p = new URLSearchParams(params); p.delete("id"); setParams(p); };

  const rows = useMemo(() => data.reservations.map((r) => ({ ...r, balance: bookingBalance(r, data.transactions) })).filter((r) => {
    const q = search.toLowerCase().trim();
    const matchPay = paymentFilter === "all"
      || (paymentFilter === "paid" && r.balance.due <= 0)
      || (paymentFilter === "pending" && r.balance.due > 0 && !r.balance.overdue)
      || (paymentFilter === "overdue" && r.balance.overdue)
      || (paymentFilter === "partial" && r.balance.status === "partial");
    return (!q || `${r.id} ${r.clientName} ${r.roomNumber} ${r.roomType}`.toLowerCase().includes(q)) && (status === "all" || r.status === status) && matchPay && (!date || (r.checkIn <= date && r.checkOut >= date));
  }), [data.reservations, data.transactions, search, status, paymentFilter, date]);

  const begin = (r = null) => {
    setEditing(r?.id || null);
    setForm(r ? { clientId: r.clientId, roomId: r.roomId || "", checkIn: r.checkIn, checkOut: r.checkOut, guests: r.guests, payment: r.payment, status: r.status, services: r.services || [], notes: r.notes || "" } : { ...initialForm });
    setErrors({}); closeDetail(); setFormOpen(true);
  };
  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value, ...(key === "checkIn" && prev.checkOut <= value ? { checkOut: addDaysISO(value, 1) } : {}) }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  const chosenRoom = data.rooms.find((r) => r.id === form.roomId);
  const estimate = chosenRoom && form.checkIn && form.checkOut > form.checkIn ? calculatePrice(chosenRoom.price, form.checkIn, form.checkOut).total : 0;
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.clientId) err.clientId = "Sélectionnez un client.";
    if (!form.roomId) err.roomId = "Attribuez une chambre.";
    if (!form.checkIn) err.checkIn = "Date requise.";
    else if (!editing && form.checkIn < todayISO()) err.checkIn = "Date passée.";
    if (!form.checkOut || form.checkOut <= form.checkIn) err.checkOut = "Le départ doit suivre l'arrivée.";
    if (+form.guests < 1 || (chosenRoom && +form.guests > chosenRoom.capacity)) err.guests = `Capacité maximum : ${chosenRoom?.capacity || "—"}.`;
    if (["maintenance","out-of-service"].includes(chosenRoom?.status)) err.roomId = "Cette chambre est indisponible (maintenance).";
    if (chosenRoom && form.checkIn && form.checkOut) {
      const conflict = data.reservations.some((r) => r.id !== editing && r.roomId === form.roomId && !["cancelled","no-show"].includes(r.status) && form.checkIn < r.checkOut && form.checkOut > r.checkIn);
      if (conflict) err.roomId = "Chambre déjà réservée sur cette période.";
    }
    setErrors(err); if (Object.keys(err).length) return;
    const client = data.clients.find((c) => c.id === form.clientId);
    const old = data.reservations.find((r) => r.id === editing);
    const id = old?.id || makeId("MA");
    saveReservation({
      ...(old || {}), id, clientId: client.id, clientName: `${client.firstName} ${client.lastName}`,
      roomId: chosenRoom.id, roomNumber: chosenRoom.number, roomType: chosenRoom.type,
      checkIn: form.checkIn, checkOut: form.checkOut, guests: +form.guests,
      amount: estimate, payment: form.payment, status: form.status,
      services: form.services, notes: form.notes,
      createdAt: old?.createdAt || todayISO(), history: [...(old?.history || []), { at: todayISO(), text: old ? "Réservation modifiée" : "Réservation créée par la réception" }],
    }, old ? `Réservation ${id} modifiée` : `Nouvelle réservation ${id}`);
    setFormOpen(false);
  };

  const actions = (r) => [
    { label: "Voir", icon: Eye, onClick: () => openDetail(r) },
    r.balance?.due > 0 && !["cancelled","no-show"].includes(r.status) && { label: `Encaisser ${formatPrice(r.balance.due)}`, icon: HandCoins, onClick: () => setPayFor(r) },
    { label: "Modifier", icon: Pencil, disabled: !["pending", "confirmed"].includes(r.status) || r.payment === "refunded", onClick: () => begin(r) },
    r.status === "pending" && { label: "Confirmer", icon: CheckCircle2, onClick: () => setReservationStatus(r.id, "confirmed") },
    r.status === "confirmed" && { label: "Check-in", icon: DoorOpen, disabled: !r.roomId, onClick: () => setCheckInFor(r) },
    r.status === "checked-in" && { label: "Check-out", icon: DoorClosed, onClick: () => setCheckOutFor(r) },
    ["pending", "confirmed"].includes(r.status) && { label: "No-show", icon: UserX, onClick: () => setNoShowId(r.id) },
    ["pending", "confirmed"].includes(r.status) && { label: "Annuler", icon: XCircle, danger: true, onClick: () => setCancelId(r.id) },
  ];
  const columns = [
    { key: "id", label: "Booking ID", render: (r) => <span className="font-semibold text-night">{r.id}</span> },
    { key: "clientName", label: "Client" },
    { key: "roomNumber", label: "Chambre", render: (r) => <span className="font-medium text-night">{r.roomNumber}</span> },
    { key: "roomType", label: "Type de chambre" },
    { key: "checkIn", label: "Check-in", render: (r) => formatDate(r.checkIn, { day: "numeric", month: "short", year: "numeric" }) },
    { key: "checkOut", label: "Check-out", render: (r) => formatDate(r.checkOut, { day: "numeric", month: "short", year: "numeric" }) },
    { key: "guests", label: "Pers." },
    { key: "amount", label: "Montant", render: (r) => <span className="font-medium text-night">{formatPrice(r.amount)}</span> },
    { key: "due", label: "Reste à payer", sortValue: (r) => r.balance?.due || 0, render: (r) => r.balance?.due > 0 ? <span className={`font-semibold ${r.balance.overdue ? "text-rose-600" : "text-amber-700"}`}>{formatPrice(r.balance.due)}</span> : <span className="text-night/30">—</span> },
    { key: "payment", label: "Paiement", render: (r) => <StatusBadge value={r.balance?.overdue ? "overdue" : r.balance?.status || r.payment} /> },
    { key: "status", label: "Statut", render: (r) => <StatusBadge value={r.status}/> },
    { key: "actions", label: "", sortable: false, render: (r) => <Dropdown items={actions(r)}/> },
  ];
  const client = selected && data.clients.find((c) => c.id === selected.clientId);
  const room = selected && data.rooms.find((r) => r.id === selected.roomId);

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Opérations / Réservations" title="Réservations" subtitle="Cycle complet : réservation → check-in → séjour → check-out." action={<><div className="flex rounded-xl border border-night/10 bg-white p-1"><button onClick={() => setView("list")} title="Vue liste" className={`grid h-8 w-8 place-items-center rounded-lg ${view==="list"?"bg-night text-white":"text-night/50"}`}><LayoutList size={15}/></button><button onClick={() => setView("calendar")} title="Vue calendrier" className={`grid h-8 w-8 place-items-center rounded-lg ${view==="calendar"?"bg-night text-white":"text-night/50"}`}><CalendarRange size={15}/></button></div><button onClick={() => begin()} className={adminButton}><Plus size={15}/> Nouvelle réservation</button></>} />
    {view === "calendar" ? <ReservationCalendar onSelect={openDetail} /> : <>
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[
      ["Toutes", data.reservations.length, "all"], ["Confirmées", data.reservations.filter((r) => r.status === "confirmed").length, "confirmed"], ["En attente", data.reservations.filter((r) => r.status === "pending").length, "pending"], ["En séjour", data.reservations.filter((r) => r.status === "checked-in").length, "checked-in"],
    ].map(([label, count, value]) => <button key={value} onClick={() => setStatus(value)} className={`${panel} flex items-center justify-between p-4 text-left transition hover:border-gold/40 ${status === value ? "!border-gold bg-sand/30" : ""}`}><span className="text-xs text-night/55">{label}</span><span className="font-serif text-2xl">{count}</span></button>)}</div>
    <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="ID, client, chambre..." className="w-full sm:w-56"/>
      <select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value)} className={adminField}><option value="all">Tous les statuts</option>{statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
      <select aria-label="Filtrer par paiement" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={adminField}><option value="all">Tous paiements</option><option value="paid">Soldés</option><option value="pending">En attente</option><option value="partial">Partiels</option><option value="overdue">En retard</option></select>
      <label className="relative flex items-center gap-2"><CalendarDays size={15} className="absolute left-3 text-night/40"/><input type="date" aria-label="Filtrer par date" value={date} onChange={(e) => setDate(e.target.value)} className={`${adminField} !pl-9`}/></label>
      {(search || status !== "all" || paymentFilter !== "all" || date) && <button onClick={() => { setSearch(""); setStatus("all"); setPaymentFilter("all"); setDate(""); setParams({}); }} className="text-xs text-gold hover:underline">Effacer les filtres</button>}
      <span className="ml-auto text-xs text-night/40">{rows.length} résultat(s) · {formatPrice(rows.reduce((s, r) => s + (r.balance?.due || 0), 0))} à encaisser</span>
    </FilterBar>
    <DataTable columns={columns} rows={rows} onRowClick={openDetail} emptyTitle="Aucune réservation trouvée" emptyText="Essayez de modifier la recherche ou les filtres." />
    </>}

    <Drawer open={!!selected} onClose={closeDetail} title={selected?.id || ""} eyebrow="Fiche de réservation" footer={selected && <>
      <button disabled={!["pending", "confirmed"].includes(selected.status) || selected.payment === "refunded"} onClick={() => begin(selected)} className={outlineButton}><Pencil size={14}/> Modifier</button>
      {selected.status === "pending" && <button onClick={() => setReservationStatus(selected.id, "confirmed")} className={adminButton}><Check size={14}/> Confirmer</button>}
      {selected.status === "confirmed" && <button disabled={!selected.roomId} onClick={() => setCheckInFor(selected)} title={!selected.roomId ? "Attribuez d'abord une chambre" : ""} className={adminButton}><DoorOpen size={14}/> Check-in</button>}
      {selected.status === "checked-in" && <button onClick={() => setCheckOutFor(selected)} className={adminButton}><DoorClosed size={14}/> Check-out</button>}
      {["pending", "confirmed"].includes(selected.status) && <button onClick={() => setCancelId(selected.id)} className="ml-auto text-xs text-rose-600 hover:underline">Annuler</button>}
    </>}>
      {selected && (() => {
        const bal = bookingBalance(selected, data.transactions);
        const txs = data.transactions.filter((t) => t.bookingId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
        return <div className="space-y-5 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-white p-4"><span className="text-xs text-night/50">État du séjour</span><StatusBadge value={selected.status}/></div>
        <div className={`${panel} overflow-hidden`}>{room?.image && <img src={room.image} alt="" className="h-36 w-full object-cover"/>}<div className="p-5"><h3 className="font-serif text-2xl">Chambre {selected.roomNumber}</h3><p className="text-xs text-night/50">{selected.roomType} · {room?.floor ? `Étage ${room.floor}` : "Attribution nécessaire"}</p><div className="mt-4 grid grid-cols-2 gap-3"><Detail label="Arrivée" value={formatDate(selected.checkIn)}/><Detail label="Départ" value={formatDate(selected.checkOut)}/><Detail label="Voyageurs" value={`${selected.guests} personne(s)`}/><Detail label="Montant" value={formatPrice(selected.amount)}/></div></div></div>
        <div className={`${panel} p-5`}><h3 className="mb-4 flex items-center gap-2 font-serif text-xl"><UserRound size={17} className="text-gold"/> Informations client</h3><Detail label="Nom" value={selected.clientName}/><Detail label="Email" value={client?.email || "—"}/><Detail label="Téléphone" value={client?.phone || "—"}/><Detail label="Pays" value={client?.country || "—"}/></div>
        <div className={`${panel} p-5`}><h3 className="mb-4 flex items-center gap-2 font-serif text-xl"><CreditCard size={17} className="text-gold"/> Paiement & services</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-ivory p-3"><p className="text-[10px] uppercase text-night/45">Facturé</p><p className="mt-1 text-sm font-semibold">{formatPrice(bal.billed)}</p></div>
            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] uppercase text-emerald-700/70">Payé</p><p className="mt-1 text-sm font-semibold text-emerald-700">{formatPrice(bal.paid)}</p></div>
            <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] uppercase text-amber-700/70">Reste</p><p className="mt-1 text-sm font-semibold text-amber-800">{formatPrice(bal.due)}</p></div>
          </div>
          <div className="mt-3 flex items-center justify-between"><span className="text-xs text-night/50">Statut</span><StatusBadge value={bal.overdue ? "overdue" : bal.status} /></div>
          {bal.due > 0 && selected.status !== "cancelled" && <button onClick={() => setPayFor({ ...selected, balance: bal })} className={`${adminButton} mt-4 w-full`}><HandCoins size={14} /> Encaisser {formatPrice(bal.due)}</button>}
          {txs.length > 0 && <div className="mt-4 space-y-1.5 border-t border-night/[.06] pt-3">{txs.map((t) => <div key={t.id} className="flex items-center justify-between text-[11px]"><span className="text-night/55">{formatDate(t.date, { day: "numeric", month: "short" })} · {t.method} · {t.id}</span><span className={`font-medium ${t.amount < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatPrice(t.amount)}</span></div>)}</div>}
          <div className="mt-3 flex items-center justify-between"><span className="text-xs text-night/50">Services supplémentaires</span><span className="text-xs">{selected.services?.join(", ") || "Aucun"}</span></div></div>
        {selected.notes && <div className={`${panel} p-5`}><h3 className="font-serif text-xl">Notes</h3><p className="mt-2 text-xs leading-relaxed text-night/60">{selected.notes}</p></div>}
      </div>; })()}
    </Drawer>

    <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Modifier la réservation" : "Nouvelle réservation"} description="Les tarifs sont calculés automatiquement." size="lg" footer={<><button onClick={() => setFormOpen(false)} className={outlineButton}>Annuler</button><button form="reservation-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      <form id="reservation-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Client *" error={errors.clientId}><select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} className={adminField}><option value="">Choisir un client</option>{data.clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></FormField>
        <FormField label="Chambre *" error={errors.roomId}><select value={form.roomId} onChange={(e) => set("roomId", e.target.value)} className={adminField}><option value="">Attribuer une chambre</option>{data.rooms.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.type} · {formatPrice(r.price)}/nuit</option>)}</select></FormField>
        <FormField label="Arrivée *" error={errors.checkIn}><input type="date" min={editing ? undefined : todayISO()} value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} className={adminField}/></FormField>
        <FormField label="Départ *" error={errors.checkOut}><input type="date" min={form.checkIn ? addDaysISO(form.checkIn, 1) : todayISO()} value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} className={adminField}/></FormField>
        <FormField label="Voyageurs *" error={errors.guests}><input type="number" min="1" max={chosenRoom?.capacity || 8} value={form.guests} onChange={(e) => set("guests", e.target.value)} className={adminField}/></FormField>
        <FormField label="Paiement"><select value={["pending","paid"].includes(form.payment) ? form.payment : "partial"} onChange={(e) => set("payment", e.target.value)} className={adminField}><option value="pending">En attente</option><option value="partial" disabled={form.payment !== "partial"}>Partiel (acompte versé)</option><option value="paid">Payé (solder)</option></select></FormField>
        <FormField label="Statut"><select value={form.status} disabled={!!editing} onChange={(e) => set("status", e.target.value)} className={`${adminField} disabled:opacity-60`}>
          {(editing ? statuses : ["pending", "confirmed"]).map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select></FormField>
        <div className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-medium text-night/65">Services supplémentaires</span><div className="flex flex-wrap gap-2">{extras.map((x) => <label key={x} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] ${form.services.includes(x) ? "border-gold bg-sand/50" : "border-night/10"}`}><input type="checkbox" className="sr-only" checked={form.services.includes(x)} onChange={() => set("services", form.services.includes(x) ? form.services.filter((s) => s !== x) : [...form.services, x])}/>{x}</label>)}</div></div>
        <FormField label="Notes" className="sm:col-span-2"><textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={adminField}/></FormField>
        <div className="flex items-center justify-between rounded-xl bg-sand/45 p-4 text-xs sm:col-span-2"><span>Estimation TTC (taxes incluses)</span><strong className="font-serif text-2xl">{formatPrice(estimate)}</strong></div>
      </form>
    </Modal>

    <CheckInModal booking={checkInFor} onClose={() => setCheckInFor(null)} />
    <CheckOutModal booking={checkOutFor} onClose={() => setCheckOutFor(null)} />
    <ConfirmDialog open={!!cancelId} onClose={() => setCancelId(null)} title="Annuler cette réservation ?" description="La réservation passera au statut Annulée. Cette opération peut affecter la disponibilité de la chambre." confirmLabel="Annuler la réservation" destructive onConfirm={() => setReservationStatus(cancelId, "cancelled")}/>
    <ConfirmDialog open={!!noShowId} onClose={() => setNoShowId(null)} title="Marquer en no-show ?" description="Le client ne s'est pas présenté. La chambre sera libérée." confirmLabel="Confirmer le no-show" destructive onConfirm={() => setReservationStatus(noShowId, "no-show")}/>
    {payFor && <ClientPaymentModal key={payFor.id} open={!!payFor} onClose={() => setPayFor(null)} reservation={payFor} due={payFor.balance.due} onConfirm={(v, m) => recordClientPayment(payFor.id, v, m)} />}
  </div>;
}

function Detail({ label, value }) { return <div className="mb-2"><p className="text-[10px] uppercase tracking-wider text-night/40">{label}</p><p className="mt-0.5 text-xs font-medium text-night">{value}</p></div>; }

function CheckInModal({ booking, onClose }) {
  const { data, setReservationStatus, recordClientPayment } = useAdminData();
  const [payNow, setPayNow] = useState(false);
  if (!booking) return null;
  const bal = bookingBalance(booking, data.transactions);
  const confirm = () => { if (payNow && bal.due > 0) recordClientPayment(booking.id, bal.due, "Carte bancaire"); setReservationStatus(booking.id, "checked-in"); onClose(); };
  return <Modal open={!!booking} onClose={onClose} title={`Check-in · ${booking.id}`} description="Vérifiez le dossier avant l'arrivée du client." footer={<><button onClick={onClose} className={outlineButton}>Plus tard</button><button onClick={confirm} className={adminButton}><DoorOpen size={14}/> Confirm Check-in</button></>}>
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Detail label="Client" value={booking.clientName} /><Detail label="Chambre" value={`${booking.roomNumber} · ${booking.roomType}`} />
        <Detail label="Arrivée" value={formatDate(booking.checkIn)} /><Detail label="Départ" value={formatDate(booking.checkOut)} />
        <Detail label="Voyageurs" value={`${booking.guests} personne(s)`} /><Detail label="Statut" value={statusLabels[booking.status]} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-ivory p-3"><p className="text-[10px] uppercase text-night/45">Total</p><p className="mt-1 font-semibold">{formatPrice(bal.billed)}</p></div>
        <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] uppercase text-emerald-700/70">Payé</p><p className="mt-1 font-semibold text-emerald-700">{formatPrice(bal.paid)}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] uppercase text-amber-700/70">Reste</p><p className="mt-1 font-semibold text-amber-800">{formatPrice(bal.due)}</p></div>
      </div>
      {bal.due > 0 && <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-night/10 p-3 text-xs"><input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} className="accent-[#0f1b2d]" /> Encaisser le solde maintenant ({formatPrice(bal.due)})</label>}
      {payNow && <p className="text-[11px] text-night/55">Le paiement sera enregistré à la confirmation. Vous pourrez aussi l'encaisser depuis la fiche.</p>}
      <p className="text-[11px] text-night/50">Après confirmation : réservation <strong>Checked-in</strong> · chambre <strong>Occupied</strong>.</p>
    </div>
  </Modal>;
}

function CheckOutModal({ booking, onClose }) {
  const { data, setReservationStatus, recordClientPayment } = useAdminData();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Carte bancaire");
  if (!booking) return null;
  const bal = bookingBalance(booking, data.transactions);
  const confirm = () => {
    if (amount && +amount > 0) recordClientPayment(booking.id, Math.min(+amount, bal.due), method);
    setReservationStatus(booking.id, "checked-out");
    onClose();
  };
  return <Modal open={!!booking} onClose={onClose} title={`Check-out · ${booking.id}`} description="Soldez le séjour avant le départ." footer={<><button onClick={onClose} className={outlineButton}>Plus tard</button><button onClick={confirm} className={adminButton}><DoorClosed size={14}/> Confirmer le départ</button></>}>
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Detail label="Client" value={booking.clientName} /><Detail label="Chambre" value={`${booking.roomNumber}`} />
        <Detail label="Séjour" value={`${formatDate(booking.checkIn, {day:"numeric",month:"short"})} → ${formatDate(booking.checkOut, {day:"numeric",month:"short",year:"numeric"})}`} /><Detail label="Services" value={booking.services?.join(", ") || "Aucun"} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-ivory p-3"><p className="text-[10px] uppercase text-night/45">Total</p><p className="mt-1 font-semibold">{formatPrice(bal.billed)}</p></div>
        <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] uppercase text-emerald-700/70">Payé</p><p className="mt-1 font-semibold text-emerald-700">{formatPrice(bal.paid)}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] uppercase text-amber-700/70">Remaining balance</p><p className="mt-1 font-semibold text-amber-800">{formatPrice(bal.due)}</p></div>
      </div>
      {bal.due > 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-medium text-amber-900">Reste à payer : {formatPrice(bal.due)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2"><input type="number" min="0" max={bal.due} step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={`Montant (max ${bal.due})`} className={adminField}/><select value={method} onChange={(e)=>setMethod(e.target.value)} className={adminField}><option>Carte bancaire</option><option>Espèces</option><option>Virement</option></select></div>
        <button onClick={() => setAmount(String(bal.due))} className="mt-2 text-[11px] text-gold hover:underline">Encaisser la totalité</button>
      </div> : <p className="rounded-xl bg-emerald-50 p-3 text-center text-xs text-emerald-700">Séjour soldé — aucun reste à payer.</p>}
      <p className="text-[11px] text-night/50">Après confirmation : réservation <strong>Checked-out</strong> · chambre <strong>Cleaning</strong> + tâche Housekeeping créée.</p>
    </div>
  </Modal>;
}
