import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, UsersRound, MapPin, Plus, Pencil, Trash2, Eye, Maximize2, Clock3 } from "lucide-react";
import { eventTypes } from "../../data/events";
import { eventPackages } from "../data/events";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { PageHeading, StatCard, StatusBadge, SearchBar, FilterBar, DataTable, Modal, Drawer, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatDate, formatPrice, todayISO } from "../../utils/booking";

const statuses = ["upcoming", "confirmed", "in-progress", "completed", "cancelled"];
const labels = { upcoming: "À venir", confirmed: "Confirmé", "in-progress": "En cours", completed: "Terminé", cancelled: "Annulé" };
const emptyEvent = { title: "", type: "Mariages", client: "", spaceId: "", date: "", time: "", guests: "", package: "Sur mesure", price: "", status: "upcoming", notes: "" };

function CalendarView({ events, onEvent }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(null);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = new Date(month.getFullYear(), month.getMonth(), i - offset + 1);
    return { day: d.getDate(), date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, current: d.getMonth() === month.getMonth() };
  });
  const move = (n) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setSelectedDay(null); };
  const selectedEvents = selectedDay ? events.filter((e) => e.date === selectedDay) : [];
  return <div className={`${panel} overflow-hidden`}>
    <div className="flex items-center justify-between border-b border-night/[.07] p-5"><h3 className="font-serif text-2xl capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3><div className="flex gap-1"><button onClick={() => move(-1)} aria-label="Mois précédent" className="grid h-8 w-8 place-items-center rounded-lg border border-night/10 hover:bg-ivory"><ChevronLeft size={16}/></button><button onClick={() => move(1)} aria-label="Mois suivant" className="grid h-8 w-8 place-items-center rounded-lg border border-night/10 hover:bg-ivory"><ChevronRight size={16}/></button></div></div>
    <div className="grid grid-cols-7 border-b border-night/[.07] text-center text-[10px] font-semibold uppercase tracking-wider text-night/40">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <span key={d} className="py-3">{d}</span>)}</div>
    <div className="grid grid-cols-7">{cells.map((d, i) => {
      const daily = events.filter((e) => e.date === d.date && e.status !== "cancelled");
      return <button key={i} onClick={() => setSelectedDay(d.date)} className={`relative min-h-[75px] border-b border-r border-night/[.05] p-2 text-left transition hover:bg-sand/30 sm:min-h-[105px] ${!d.current ? "bg-[#faf9f7] text-night/25" : ""} ${d.date === selectedDay ? "!bg-sand/50" : ""}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${d.date === todayISO() ? "bg-night text-white" : ""}`}>{d.day}</span><div className="mt-1 space-y-1">{daily.slice(0, 2).map((e) => <span key={e.id} className="block truncate rounded bg-gold/15 px-1.5 py-1 text-[9px] text-night max-sm:text-[8px]">{e.title}</span>)}{daily.length > 2 && <span className="text-[9px] text-gold">+{daily.length - 2}</span>}</div></button>;
    })}</div>
    {selectedDay && <div className="border-t border-night/[.07] p-5"><div className="flex items-center justify-between"><h4 className="font-serif text-xl">{formatDate(selectedDay)}</h4><button onClick={() => setSelectedDay(null)} className="text-[11px] text-gold hover:underline">Fermer</button></div>{selectedEvents.length ? <div className="mt-3 space-y-2">{selectedEvents.map((e) => <button key={e.id} onClick={() => onEvent(e.id)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-ivory px-4 py-3 text-left text-xs hover:bg-sand/60"><span><strong>{e.time} · {e.title}</strong><span className="ml-2 text-night/45">{e.client}</span></span><StatusBadge value={e.status}/></button>)}</div> : <p className="mt-2 text-xs text-night/45">Aucun événement prévu ce jour.</p>}</div>}
  </div>;
}

export default function AdminEvents() {
  const { data, saveRecord, updateRecord, deleteRecord } = useAdminData();
  const [tab, setTab] = useState("calendar");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [spaceForm, setSpaceForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const selected = data.events.find((e) => e.id === selectedId);
  const rows = useMemo(() => data.events.filter((e) => (!search || `${e.title} ${e.client} ${e.type}`.toLowerCase().includes(search.toLowerCase())) && (status === "all" || e.status === status)), [data.events, search, status]);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const begin = (e = null) => { setSelectedId(null); setErrors({}); setForm(e ? { ...e } : { ...emptyEvent }); };
  const submit = (e) => {
    e.preventDefault(); const err = {};
    if (!form.title.trim()) err.title = "Titre requis.";
    if (!form.client.trim()) err.client = "Client requis.";
    if (!form.spaceId) err.spaceId = "Choisissez un espace.";
    if (!form.date) err.date = "Date requise.";
    else if (!form.id && form.date < todayISO()) err.date = "La date est passée.";
    if (!form.time) err.time = "Heure requise.";
    const space = data.spaces.find((s) => s.id === form.spaceId);
    if (space?.status === "maintenance") err.spaceId = "Cet espace est en maintenance.";
    if (+form.guests < 1 || (space && +form.guests > space.capacity)) err.guests = `Capacité maximum : ${space?.capacity || "—"}.`;
    if (+form.price <= 0) err.price = "Prix positif requis.";
    if (space && form.date && data.events.some((other) => other.id !== form.id && other.spaceId === form.spaceId && other.date === form.date && !["cancelled", "completed"].includes(other.status))) err.spaceId = "Cet espace est déjà réservé à cette date.";
    setErrors(err); if (Object.keys(err).length) return;
    saveRecord("events", { ...form, id: form.id || makeId("EV"), guests: +form.guests, price: +form.price }, form.id ? `Événement ${form.title} modifié` : `Nouvel événement ${form.title}`);
    setForm(null);
  };
  const saveSpace = (e) => {
    e.preventDefault(); const err = {};
    if (!spaceForm.name.trim()) err.name = "Nom requis.";
    if (+spaceForm.capacity < 1) err.capacity = "Capacité invalide.";
    if (+spaceForm.size < 1) err.size = "Superficie invalide.";
    if (spaceForm.status === "maintenance" && data.events.some((event) => event.spaceId === spaceForm.id && event.date >= todayISO() && ["confirmed", "upcoming", "in-progress"].includes(event.status))) err.status = "Des événements à venir sont prévus dans cet espace.";
    setErrors(err); if (Object.keys(err).length) return;
    saveRecord("spaces", { ...spaceForm, id: spaceForm.id || makeId("SPACE"), capacity: +spaceForm.capacity, size: +spaceForm.size }, `Espace ${spaceForm.name} enregistré`); setSpaceForm(null);
  };
  const columns = [
    { key: "title", label: "Événement", render: (e) => <span className="font-medium text-night">{e.title}</span> },
    { key: "type", label: "Type" }, { key: "client", label: "Client" },
    { key: "date", label: "Date", render: (e) => formatDate(e.date, { day: "numeric", month: "short", year: "numeric" }) },
    { key: "time", label: "Heure" },
    { key: "spaceId", label: "Espace", sortValue: (e) => data.spaces.find((s) => s.id === e.spaceId)?.name, render: (e) => data.spaces.find((s) => s.id === e.spaceId)?.name || "—" },
    { key: "guests", label: "Invités" },
    { key: "price", label: "Montant", render: (e) => <span className="font-medium text-night">{formatPrice(e.price)}</span> },
    { key: "status", label: "Statut", render: (e) => <StatusBadge value={e.status}/> },
    { key: "action", label: "", sortable: false, render: (e) => <Dropdown items={[{ label: "Voir le détail", icon: Eye, onClick: () => setSelectedId(e.id) }, { label: "Modifier", icon: Pencil, onClick: () => begin(e) }, { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDeleteId(e.id) }]}/> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Services / Réceptions" title="Événements" subtitle="Chaque occasion mérite une organisation irréprochable." action={<button onClick={() => tab === "spaces" ? (setErrors({}), setSpaceForm({ name: "", capacity: "", size: "", image: data.spaces[0]?.image, equipment: [], status: "available" })) : begin()} className={adminButton}><Plus size={15}/> {tab === "spaces" ? "Ajouter un espace" : "Nouvel événement"}</button>}/>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard icon={CalendarDays} label="À venir" value={data.events.filter((e) => ["upcoming", "confirmed"].includes(e.status)).length} hint="Événements prévus"/><StatCard icon={UsersRound} label="Participants" value={data.events.filter((e) => ["upcoming", "confirmed"].includes(e.status)).reduce((s, e) => s + e.guests, 0)} hint="Attendus prochainement"/><StatCard icon={MapPin} label="Espaces" value={data.spaces.length} hint="Salles & terrasses"/><StatCard icon={Clock3} label="En cours" value={data.events.filter((e) => e.status === "in-progress").length} hint="Aujourd'hui"/></div>
    <div className="mb-6 flex w-fit max-w-full flex-wrap gap-1 overflow-x-auto rounded-xl border border-night/10 bg-white p-1">{[["events","Events"],["spaces","Venues"],["requests","Requests"],["calendar","Calendar"],["payments","Payments"]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-xs transition ${tab === key ? "bg-night text-white" : "text-night/55 hover:bg-ivory"}`}>{label}</button>)}</div>
    {tab === "calendar" && <CalendarView events={data.events} onEvent={setSelectedId}/>}
    {tab === "events" && <><FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Titre, client, type..." className="w-full sm:w-64"/><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer événements" className={adminField}><option value="all">Tous les statuts</option>{statuses.map((s) => <option key={s} value={s}>{labels[s]}</option>)}</select></FilterBar><DataTable rows={rows} columns={columns} onRowClick={(e) => setSelectedId(e.id)} emptyTitle="Aucun événement trouvé"/></>}
    {tab === "spaces" && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.spaces.map((s) => <button key={s.id} onClick={() => { setErrors({}); setSpaceForm({ ...s }); }} className={`${panel} group overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-lg`}><div className="h-44 overflow-hidden"><img src={s.image} alt={s.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110"/></div><div className="p-5"><h3 className="font-serif text-xl">{s.name}</h3><p className="mt-1 flex items-center gap-2 text-xs text-night/50"><UsersRound size={13}/> {s.capacity} pers. <Maximize2 size={13} className="ml-2"/> {s.size} m²</p><div className="mt-3"><StatusBadge value={s.status}/></div></div></button>)}</div>}
    {tab === "requests" && <DataTable rows={data.eventRequests || []} columns={[
      { key: "name", label: "Demandeur", render: (r) => <span><span className="font-medium text-night">{r.name}</span><span className="block text-[10px] text-night/45">{r.email} · {r.phone}</span></span> },
      { key: "type", label: "Type" }, { key: "date", label: "Date", render: (r) => formatDate(r.date, { day: "numeric", month: "short", year: "numeric" }) },
      { key: "guests", label: "Invités" }, { key: "budget", label: "Budget", render: (r) => formatPrice(r.budget) },
      { key: "status", label: "Statut", render: (r) => <StatusBadge value={r.status === "confirmed" ? "confirmed" : "pending"}/> },
      { key: "act", label: "", sortable: false, render: (r) => <Dropdown items={[{ label: "Accepter → créer l'événement", icon: Pencil, onClick: () => { saveRecord("events", { id: makeId("EV"), title: `${r.type} · ${r.name}`, type: r.type, client: r.name, spaceId: data.spaces[0]?.id, date: r.date, time: "18:00", guests: r.guests, package: "Sur mesure", price: r.budget, status: "confirmed", notes: r.message }, `Demande ${r.id} acceptée`); updateRecord("eventRequests", r.id, { status: "confirmed" }); }, }, { label: "Refuser", icon: Trash2, danger: true, onClick: () => updateRecord("eventRequests", r.id, { status: "cancelled" }) }]} /> },
    ]} emptyTitle="Aucune demande" />}
    {tab === "payments" && <div className="grid gap-5 lg:grid-cols-2"><div className={`${panel} p-6`}><h3 className="font-serif text-2xl">CA événements</h3><p className="mt-1 font-serif text-4xl">{formatPrice(data.events.filter((e)=>e.status!=="cancelled").reduce((s,e)=>s+(+e.price||0),0))}</p><p className="mt-1 text-xs text-night/45">Contrats non annulés · détail dans Finance</p></div><div className={`${panel} p-6`}><h3 className="font-serif text-2xl">À facturer</h3><div className="mt-3 space-y-2">{data.events.filter((e)=>["confirmed","upcoming","in-progress"].includes(e.status)).slice(0,5).map((e)=><div key={e.id} className="flex justify-between rounded-xl bg-ivory px-4 py-2.5 text-xs"><span>{e.title}</span><strong>{formatPrice(e.price)}</strong></div>)}</div></div></div>}

    <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.title || ""} eyebrow="Dossier événement" footer={selected && <button onClick={() => begin(selected)} className={adminButton}><Pencil size={14}/> Modifier</button>}>
      {selected && <div className="space-y-5"><div className={`${panel} p-5`}><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-gold">{selected.type}</p><StatusBadge value={selected.status}/></div><p className="mt-3 font-serif text-3xl">{selected.title}</p><p className="mt-2 text-xs text-night/60">Pour {selected.client}</p></div><div className={`${panel} grid grid-cols-2 gap-5 p-5 text-xs`}>{[["Date", formatDate(selected.date)], ["Heure", selected.time], ["Participants", `${selected.guests} invités`], ["Espace", data.spaces.find((s) => s.id === selected.spaceId)?.name || "—"], ["Formule", selected.package], ["Prix", formatPrice(selected.price)]].map(([k, v]) => <div key={k}><p className="text-night/45">{k}</p><strong className="mt-1 block font-medium">{v}</strong></div>)}</div>{selected.notes && <div className={`${panel} p-5 text-xs text-night/60`}><h3 className="mb-2 font-serif text-xl text-night">Notes</h3>{selected.notes}</div>}<div className={`${panel} p-5`}><label className="text-xs text-night/50">Statut de l'événement</label><select value={selected.status} onChange={(e) => updateRecord("events", selected.id, { status: e.target.value }, `Événement ${selected.title} : ${labels[e.target.value]}`)} className={`${adminField} mt-2`}>{statuses.map((s) => <option key={s} value={s}>{labels[s]}</option>)}</select></div></div>}
    </Drawer>
    <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Modifier l'événement" : "Nouvel événement"} size="lg" footer={<><button onClick={() => setForm(null)} className={outlineButton}>Annuler</button><button form="event-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {form && <form id="event-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><FormField label="Titre *" error={errors.title} className="sm:col-span-2"><input value={form.title} onChange={(e) => set("title", e.target.value)} className={adminField}/></FormField><FormField label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value)} className={adminField}>{eventTypes.map((t) => <option key={t.id}>{t.title}</option>)}</select></FormField><FormField label="Client *" error={errors.client}><input value={form.client} onChange={(e) => set("client", e.target.value)} className={adminField}/></FormField><FormField label="Date *" error={errors.date}><input type="date" min={form.id ? undefined : todayISO()} value={form.date} onChange={(e) => set("date", e.target.value)} className={adminField}/></FormField><FormField label="Heure *" error={errors.time}><input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={adminField}/></FormField><FormField label="Espace *" error={errors.spaceId}><select value={form.spaceId} onChange={(e) => set("spaceId", e.target.value)} className={adminField}><option value="">Choisir un espace</option>{data.spaces.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.capacity} pers.</option>)}</select></FormField><FormField label="Participants *" error={errors.guests}><input type="number" min="1" value={form.guests} onChange={(e) => set("guests", e.target.value)} className={adminField}/></FormField><FormField label="Formule"><select value={form.package} onChange={(e) => set("package", e.target.value)} className={adminField}>{eventPackages.map((p) => <option key={p}>{p}</option>)}</select></FormField><FormField label="Tarif (€) *" error={errors.price}><input type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} className={adminField}/></FormField><FormField label="Statut"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={adminField}>{statuses.map((s) => <option key={s} value={s}>{labels[s]}</option>)}</select></FormField><FormField label="Notes" className="sm:col-span-2"><textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={adminField}/></FormField></form>}
    </Modal>
    <Modal open={!!spaceForm} onClose={() => setSpaceForm(null)} title={spaceForm?.id ? "Modifier l'espace" : "Ajouter un espace"} footer={<><button onClick={() => setSpaceForm(null)} className={outlineButton}>Annuler</button><button form="space-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {spaceForm && <form id="space-form" onSubmit={saveSpace} className="grid gap-4 sm:grid-cols-2"><FormField label="Nom *" error={errors.name} className="sm:col-span-2"><input value={spaceForm.name} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} className={adminField}/></FormField><FormField label="Capacité *" error={errors.capacity}><input type="number" value={spaceForm.capacity} onChange={(e) => setSpaceForm({ ...spaceForm, capacity: e.target.value })} className={adminField}/></FormField><FormField label="Superficie (m²) *" error={errors.size}><input type="number" value={spaceForm.size} onChange={(e) => setSpaceForm({ ...spaceForm, size: e.target.value })} className={adminField}/></FormField><FormField label="URL de l'image" className="sm:col-span-2"><input value={spaceForm.image} onChange={(e) => setSpaceForm({ ...spaceForm, image: e.target.value })} className={adminField}/></FormField><FormField label="Statut" error={errors.status} className="sm:col-span-2"><select value={spaceForm.status} onChange={(e) => setSpaceForm({ ...spaceForm, status: e.target.value })} className={adminField}><option value="available">Disponible</option><option value="maintenance">Maintenance</option></select></FormField></form>}
    </Modal>
    <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteRecord("events", deleteId, "Événement supprimé")} title="Supprimer cet événement ?" confirmLabel="Supprimer" destructive/>
  </div>;
}