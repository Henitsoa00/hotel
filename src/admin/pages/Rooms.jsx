import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BedDouble, Grid2X2, List, Plus, Pencil, Trash2, UsersRound, Eye, Layers3, CalendarDays, Moon, Wallet, History } from "lucide-react";
import { rooms as roomTypes } from "../../data/rooms";
import { useAdminData } from "../context/AdminDataContext";
import { PageHeading, StatusBadge, SearchBar, FilterBar, DataTable, Drawer, Modal, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatPrice, formatDate } from "../../utils/booking";
import { roomStayHistory, bookingBalance } from "../utils/finance";

const statusList = ["available", "occupied", "reserved", "cleaning", "maintenance", "out-of-service"];
const statusLabels = { available: "Disponible", occupied: "Occupée", reserved: "Réservée", cleaning: "Nettoyage", maintenance: "Maintenance", "out-of-service": "Hors service" };
const cleaningList = ["clean", "dirty", "cleaning", "inspected", "maintenance"];
const initial = { number: "", typeId: 1, floor: 2, price: 150, capacity: 2, status: "available", cleaning: "clean", notes: "" };

const barColor = (s) => s === "available" ? "bg-emerald-400" : s === "occupied" ? "bg-sky-400" : s === "reserved" ? "bg-amber-400" : s === "cleaning" ? "bg-violet-400" : s === "maintenance" ? "bg-rose-400" : "bg-slate-400";

export default function Rooms() {
  const { data, saveRecord, updateRecord, deleteRecord, notify } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("rooms");
  const [view, setView] = useState("visual");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const selected = data.rooms.find((r) => r.id === params.get("id"));
  const close = () => { const p = new URLSearchParams(params); p.delete("id"); setParams(p); setHistoryFilter("all"); };
  const open = (r) => setParams({ id: r.id });

  const enriched = useMemo(() => data.rooms.map((r) => ({ ...r, history: roomStayHistory(r.id, data.reservations) })), [data.rooms, data.reservations]);
  const rows = useMemo(() => enriched.filter((r) =>
    (!search || `${r.number} ${r.type}`.toLowerCase().includes(search.toLowerCase())) &&
    (status === "all" || r.status === status) && (typeId === "all" || r.typeId === +typeId)
  ), [enriched, search, status, typeId]);

  const type = roomTypes.find((r) => r.id === +form.typeId);
  const begin = (r = null) => { setEditing(r?.id || null); setForm(r ? { ...r } : { ...initial }); setErrors({}); close(); setFormOpen(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const changeType = (value) => {
    const t = roomTypes.find((r) => r.id === +value);
    setForm((f) => ({ ...f, typeId: +value, price: t.price, capacity: t.capacity }));
  };
  const submit = (e) => {
    e.preventDefault(); const err = {};
    if (!/^\d{3,4}$/.test(form.number)) err.number = "Numéro de 3 ou 4 chiffres.";
    if (data.rooms.some((r) => r.number === form.number && r.id !== editing)) err.number = "Ce numéro est déjà utilisé.";
    if (+form.price <= 0) err.price = "Saisissez un prix positif.";
    if (+form.capacity < 1) err.capacity = "Capacité invalide.";
    if (+form.floor < 0) err.floor = "Étage invalide.";
    setErrors(err); if (Object.keys(err).length) return;
    saveRecord("rooms", { ...form, id: editing || `rm-${form.number}`, typeId: +form.typeId, type: type.name, image: type.images[0], amenities: type.amenities, capacity: +form.capacity, floor: +form.floor, price: +form.price }, editing ? `Chambre ${form.number} modifiée` : `Chambre ${form.number} ajoutée`);
    setFormOpen(false);
  };
  const remove = () => {
    const r = data.rooms.find((x) => x.id === deleteId);
    if (!r) return;
    const activeBooking = data.reservations.some((b) => b.roomId === r.id && !["cancelled", "checked-out"].includes(b.status));
    if (activeBooking) return notify("Impossible : cette chambre est liée à une réservation active.", "error");
    deleteRecord("rooms", r.id, `Chambre ${r.number} supprimée`);
  };

  const selHistory = useMemo(() => selected ? roomStayHistory(selected.id, data.reservations) : null, [selected, data.reservations]);
  const selHistoryRows = useMemo(() => {
    if (!selHistory) return [];
    let list = selHistory.list.map((r) => ({ ...r, balance: bookingBalance(r, data.transactions) }));
    if (historyFilter === "upcoming") list = list.filter((r) => ["pending", "confirmed"].includes(r.status) && r.checkIn >= new Date().toISOString().slice(0, 10));
    if (historyFilter === "past") list = list.filter((r) => ["checked-out", "cancelled"].includes(r.status) || r.checkOut < new Date().toISOString().slice(0, 10));
    if (historyFilter === "current") list = list.filter((r) => r.status === "checked-in");
    return list;
  }, [selHistory, historyFilter, data.transactions]);

  const columns = [
    { key: "number", label: "Numéro", render: (r) => <span className="font-semibold text-night">{r.number}</span> },
    { key: "type", label: "Type", render: (r) => <div className="flex items-center gap-2"><img src={r.image} alt="" className="h-9 w-12 rounded-lg object-cover" />{r.type}</div> },
    { key: "stays", label: "Séjours", sortValue: (r) => r.history.stays, render: (r) => <span>{r.history.stays} <span className="text-night/35">· {r.history.nights} nuits</span></span> },
    { key: "revenue", label: "CA généré", sortValue: (r) => r.history.revenue, render: (r) => <span className="font-medium text-night">{formatPrice(r.history.revenue)}</span> },
    { key: "price", label: "Tarif / nuit", render: (r) => <span>{formatPrice(r.price)}</span> },
    { key: "status", label: "Statut", render: (r) => <StatusBadge value={r.status} /> },
    { key: "cleaning", label: "Nettoyage", render: (r) => <StatusBadge value={r.cleaning} /> },
    { key: "actions", label: "", sortable: false, render: (r) => <Dropdown items={[{ label: "Voir + historique", icon: Eye, onClick: () => open(r) }, { label: "Modifier", icon: Pencil, onClick: () => begin(r) }, { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDeleteId(r.id) }]} /> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Opérations / Inventaire" title="Chambres" subtitle="État en temps réel, performance, historique et tarifs." action={<button onClick={() => begin()} className={adminButton}><Plus size={15} /> Ajouter une chambre</button>} />
    <div className="mb-5 flex w-fit gap-1 rounded-xl border border-night/10 bg-white p-1">{[["rooms","Chambres"],["rates","Tarifs & promos"]].map(([k,l]) => <button key={k} onClick={()=>setTab(k)} className={`rounded-lg px-4 py-2 text-xs ${tab===k?"bg-night text-white":"text-night/55"}`}>{l}</button>)}</div>
    {tab === "rates" ? <RatesTab /> : <>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">{statusList.map((s) => <button key={s} onClick={() => setStatus(status === s ? "all" : s)} className={`${panel} flex items-center justify-between gap-2 p-4 text-left transition hover:border-gold/40 ${status === s ? "!border-gold bg-sand/30" : ""}`}><StatusBadge value={s} /><span className="font-serif text-2xl">{data.rooms.filter((r) => r.status === s).length}</span></button>)}</div>
    <FilterBar>
      <SearchBar value={search} onChange={setSearch} placeholder="Numéro ou type..." className="w-full sm:w-56" />
      <select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value)} className={adminField}><option value="all">Tous les statuts</option>{statusList.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
      <select aria-label="Filtrer par type" value={typeId} onChange={(e) => setTypeId(e.target.value)} className={adminField}><option value="all">Tous les types</option>{roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <span className="ml-auto hidden text-xs text-night/40 lg:block">{rows.reduce((s, r) => s + r.history.revenue, 0) > 0 && <>{formatPrice(rows.reduce((s, r) => s + r.history.revenue, 0))} de CA · {rows.reduce((s, r) => s + r.history.nights, 0)} nuits vendues</>}</span>
      <div className="ml-auto flex rounded-xl border border-night/10 bg-white p-1 lg:ml-0"><button title="Vue visuelle" aria-label="Vue visuelle" onClick={() => setView("visual")} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "visual" ? "bg-night text-white" : "text-night/50"}`}><Grid2X2 size={16} /></button><button title="Vue tableau" aria-label="Vue tableau" onClick={() => setView("list")} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "list" ? "bg-night text-white" : "text-night/50"}`}><List size={16} /></button></div>
    </FilterBar>
    {view === "list" ? <DataTable rows={rows} columns={columns} onRowClick={open} emptyTitle="Aucune chambre trouvée" /> : rows.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{[...rows].sort((a, b) => a.number.localeCompare(b.number)).map((r) => <button key={r.id} onClick={() => open(r)} className={`${panel} group relative overflow-hidden p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-lg`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${barColor(r.status)}`} />
      <div className="flex items-start justify-between gap-1"><span className="font-serif text-[30px] leading-none">{r.number}</span><BedDouble size={18} className="text-gold/70" strokeWidth={1.5} /></div>
      <div className="mt-3 truncate text-xs font-medium">{r.type}</div><p className="mt-0.5 text-[10px] text-night/45">Étage {r.floor} · {r.capacity} pers.</p>
      <div className="mt-3 flex flex-wrap gap-1"><StatusBadge value={r.status} /></div>
      <div className="mt-3 flex items-center justify-between border-t border-night/[.06] pt-3 text-[11px] text-night/50"><span>{formatPrice(r.price)} / nuit</span><span className="font-medium text-night/60">{r.history.stays} séj. · {r.history.nights} n.</span></div>
    </button>)}</div> : <div className={panel}><div className="p-12 text-center font-serif text-2xl">Aucune chambre trouvée</div></div>}

    <Drawer open={!!selected} onClose={close} title={selected ? `Chambre ${selected.number}` : ""} eyebrow="Fiche chambre · historique des réservations" footer={selected && <><button onClick={() => begin(selected)} className={adminButton}><Pencil size={14} /> Modifier</button><button onClick={() => { setDeleteId(selected.id); close(); }} className={`${outlineButton} !text-rose-600`}><Trash2 size={14} /> Supprimer</button></>}>
      {selected && selHistory && <div className="space-y-5">
        <div className={`${panel} overflow-hidden`}><img src={selected.image} alt={selected.type} className="h-44 w-full object-cover" /><div className="p-5"><p className="font-serif text-2xl">{selected.type}</p><p className="mt-1 text-xs text-night/50">Étage {selected.floor} · {formatPrice(selected.price)} par nuit · {selected.capacity} pers.</p><div className="mt-4 flex gap-2"><StatusBadge value={selected.status} /><StatusBadge value={selected.cleaning} /></div></div></div>

        <div className="grid grid-cols-3 gap-3">
          {[[CalendarDays, "Séjours", selHistory.stays], [Moon, "Nuits vendues", selHistory.nights], [Wallet, "CA généré", formatPrice(selHistory.revenue)]].map(([Icon, label, value]) => (
            <div key={label} className={`${panel} p-4 text-center`}><Icon size={16} className="mx-auto text-gold" /><p className="mt-2 font-serif text-2xl">{value}</p><p className="text-[10px] uppercase tracking-wider text-night/45">{label}</p></div>
          ))}
        </div>

        <div className={`${panel} p-5`}>
          <h3 className="font-serif text-xl">Current Reservation</h3>
          {selHistory.current ? <Link to={`/admin/reservations?id=${selHistory.current.id}`} className="mt-3 block rounded-xl bg-sky-50 p-4 text-xs text-sky-900 ring-1 ring-sky-200 transition hover:bg-sky-100"><strong>{selHistory.current.clientName}</strong> · {selHistory.current.id}<span className="mt-1 block">{formatDate(selHistory.current.checkIn, {day:"numeric",month:"short"})} → {formatDate(selHistory.current.checkOut, {day:"numeric",month:"short",year:"numeric"})} · {selHistory.current.guests} pers. · {formatPrice(selHistory.current.amount)}</span></Link>
          : <p className="mt-2 text-xs text-night/50">Aucun occupant actuellement. {selHistory.upcoming[0] ? `Prochaine arrivée : ${selHistory.upcoming[0].clientName} le ${formatDate(selHistory.upcoming[0].checkIn, { day: "numeric", month: "short", year: "numeric" })}.` : "Aucune arrivée prévue."}</p>}
        </div>}

        <div className={`${panel} p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-serif text-xl"><History size={17} className="text-gold" /> Historique des réservations</h3>
            <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} aria-label="Filtrer l'historique" className="rounded-lg border border-night/10 bg-white px-2 py-1.5 text-[11px] outline-none"><option value="all">Toutes ({selHistory.total})</option><option value="current">En séjour</option><option value="upcoming">À venir ({selHistory.upcoming.length})</option><option value="past">Passées ({selHistory.past.length})</option></select>
          </div>
          {selHistoryRows.length === 0 ? <p className="py-6 text-center text-xs text-night/45">Aucune réservation dans cette catégorie.</p> : (
            <div className="space-y-2">
              {selHistoryRows.map((r) => (
                <Link key={r.id} to={`/admin/reservations?id=${r.id}`} className="block rounded-xl border border-night/[.06] p-3 transition hover:border-gold/50 hover:bg-sand/20">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-night">{r.id} · {r.clientName}</span><StatusBadge value={r.status} /></div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-night/55">
                    <span>{formatDate(r.checkIn, { day: "numeric", month: "short" })} → {formatDate(r.checkOut, { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>{r.guests} pers.</span>
                    <span className="font-medium text-night">{formatPrice(r.amount)}</span>
                    <StatusBadge value={r.balance.due > 0 ? (r.balance.overdue ? "overdue" : "pending") : "paid"} />
                    {r.balance.due > 0 && <span className="text-amber-700">Reste {formatPrice(r.balance.due)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={`${panel} p-5`}><h3 className="font-serif text-xl">Équipements</h3><div className="mt-3 flex flex-wrap gap-2">{selected.amenities?.map((a) => <span key={a} className="rounded-full bg-ivory px-3 py-1 text-[11px] text-night/60">{a}</span>)}</div></div>
        {selected.notes && <div className={`${panel} p-5 text-xs text-night/60`}><h3 className="mb-2 font-serif text-xl text-night">Notes internes</h3>{selected.notes}</div>}
      </div>}
    </Drawer>

    <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Modifier la chambre" : "Ajouter une chambre"} footer={<><button onClick={() => setFormOpen(false)} className={outlineButton}>Annuler</button><button form="room-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      <form id="room-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Numéro *" error={errors.number}><input value={form.number} disabled={!!editing} onChange={(e) => set("number", e.target.value)} className={`${adminField} disabled:opacity-60`} placeholder="Ex. 306" /></FormField>
        <FormField label="Type de chambre"><select value={form.typeId} onChange={(e) => changeType(e.target.value)} className={adminField}>{roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></FormField>
        <FormField label="Prix par nuit (€) *" error={errors.price}><input type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} className={adminField} /></FormField>
        <FormField label="Capacité *" error={errors.capacity}><input type="number" min="1" max="8" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className={adminField} /></FormField>
        <FormField label="Étage" error={errors.floor}><input type="number" min="0" value={form.floor} onChange={(e) => set("floor", e.target.value)} className={adminField} /></FormField>
        <FormField label="Statut"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={adminField}>{statusList.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></FormField>
        <FormField label="Nettoyage"><select value={form.cleaning} onChange={(e) => set("cleaning", e.target.value)} className={adminField}>{cleaningList.map((s) => <option key={s} value={s}>{({ clean: "Propre", dirty: "À nettoyer", cleaning: "En cours", inspected: "Inspectée", maintenance: "Maintenance" })[s]}</option>)}</select></FormField>
        <FormField label="Notes" className="sm:col-span-2"><textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={adminField} /></FormField>
      </form>
    </Modal>
    </>}
    <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Supprimer cette chambre ?" description="Une chambre liée à une réservation active ne peut pas être supprimée." confirmLabel="Supprimer" destructive />
  </div>;
}

function RatesTab() {
  const { data, updateRecord } = useAdminData();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const startEdit = (r) => { setEditing(r.id); setDraft({ ...r }); };
  const save = () => {
    const err = ["standard","low","high","weekend"].some((k) => +draft[k] <= 0);
    if (err) return;
    updateRecord("rates", editing, { standard: +draft.standard, low: +draft.low, high: +draft.high, weekend: +draft.weekend, promo: +draft.promo || 0, promoLabel: draft.promoLabel || "", active: draft.active }, `Tarifs ${draft.type} mis à jour`);
    setEditing(null);
  };
  return <div className={`${panel} overflow-hidden`}>
    <div className="border-b border-night/[.07] p-5"><h3 className="font-serif text-2xl">Tarifs par type de chambre</h3><p className="mt-1 text-xs text-night/50">Standard · Basse saison · Haute saison · Weekend · Promo. Le prix standard alimente les nouvelles réservations.</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-[12px]">
      <thead className="bg-[#faf9f6] text-[10px] uppercase tracking-wider text-night/45"><tr><th className="px-4 py-3">Type</th><th className="px-3 py-3">Standard</th><th className="px-3 py-3">Basse</th><th className="px-3 py-3">Haute</th><th className="px-3 py-3">Weekend</th><th className="px-3 py-3">Promo</th><th className="px-3 py-3">Actif</th><th className="px-3 py-3"></th></tr></thead>
      <tbody className="divide-y divide-night/[.05]">
        {(data.rates || []).map((r) => <tr key={r.id}>
          <td className="px-4 py-3 font-medium">{r.type}</td>
          {editing === r.id ? <>
            <td className="px-2 py-2"><input type="number" value={draft.standard} onChange={(e)=>setDraft({...draft,standard:e.target.value})} className="w-20 rounded-lg border border-night/10 px-2 py-1.5"/></td>
            <td className="px-2 py-2"><input type="number" value={draft.low} onChange={(e)=>setDraft({...draft,low:e.target.value})} className="w-20 rounded-lg border border-night/10 px-2 py-1.5"/></td>
            <td className="px-2 py-2"><input type="number" value={draft.high} onChange={(e)=>setDraft({...draft,high:e.target.value})} className="w-20 rounded-lg border border-night/10 px-2 py-1.5"/></td>
            <td className="px-2 py-2"><input type="number" value={draft.weekend} onChange={(e)=>setDraft({...draft,weekend:e.target.value})} className="w-20 rounded-lg border border-night/10 px-2 py-1.5"/></td>
            <td className="px-2 py-2"><div className="flex gap-1"><input type="number" value={draft.promo} onChange={(e)=>setDraft({...draft,promo:e.target.value})} placeholder="0" className="w-16 rounded-lg border border-night/10 px-2 py-1.5"/><input value={draft.promoLabel} onChange={(e)=>setDraft({...draft,promoLabel:e.target.value})} placeholder="Offre" className="w-28 rounded-lg border border-night/10 px-2 py-1.5"/></div></td>
            <td className="px-2 py-2"><input type="checkbox" checked={draft.active} onChange={(e)=>setDraft({...draft,active:e.target.checked})} className="h-4 w-4 accent-[#0f1b2d]"/></td>
            <td className="px-2 py-2"><div className="flex gap-1"><button onClick={save} className="rounded-lg bg-night px-2.5 py-1.5 text-[11px] text-white">OK</button><button onClick={()=>setEditing(null)} className="rounded-lg border border-night/10 px-2.5 py-1.5 text-[11px]">X</button></div></td>
          </> : <>
            <td className="px-3 py-3 font-semibold">{formatPrice(r.standard)}</td>
            <td className="px-3 py-3">{formatPrice(r.low)}</td>
            <td className="px-3 py-3">{formatPrice(r.high)}</td>
            <td className="px-3 py-3">{formatPrice(r.weekend)}</td>
            <td className="px-3 py-3">{r.promo > 0 ? <span>{formatPrice(r.promo)}<span className="block text-[10px] text-gold">{r.promoLabel}</span></span> : <span className="text-night/30">—</span>}</td>
            <td className="px-3 py-3">{r.active ? <StatusBadge value="active"/> : <StatusBadge value="inactive"/>}</td>
            <td className="px-3 py-3"><button onClick={()=>startEdit(r)} className="rounded-lg border border-night/10 px-3 py-1.5 text-[11px] hover:border-gold">Modifier</button></td>
          </>}
        </tr>)}
      </tbody>
    </table></div>
  </div>;
}
