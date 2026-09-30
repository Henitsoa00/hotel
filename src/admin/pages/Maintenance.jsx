import { useMemo, useState } from "react";
import { Plus, Wrench, AlertTriangle, Clock3, CheckCircle2, Eye, Pencil, Trash2 } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { PageHeading, StatCard, StatusBadge, DataTable, SearchBar, FilterBar, Modal, Drawer, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatDate, formatPrice, todayISO } from "../../utils/booking";

const statuses = ["open", "in-progress", "resolved"];
const labels = { open: "Ouvert", "in-progress": "En cours", resolved: "Résolu" };
const empty = { roomId: "", title: "", equipment: "", priority: "normal", assignee: "Non assigné", cost: "", date: todayISO(), status: "open", notes: "" };

export default function Maintenance() {
  const { data, saveRecord, updateRecord, deleteRecord, setMaintenanceStatus } = useAdminData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const items = data.maintenance || [];
  const selected = items.find((m) => m.id === selectedId);

  const rows = useMemo(() => items.filter((m) =>
    (!search || `${m.title} ${m.room} ${m.equipment} ${m.assignee}`.toLowerCase().includes(search.toLowerCase())) &&
    (status === "all" || m.status === status)
  ).sort((a, b) => b.date.localeCompare(a.date)), [items, search, status]);

  const begin = (m = null) => { setErrors({}); setForm(m ? { ...m } : { ...empty }); setSelectedId(null); };
  const submit = (e) => {
    e.preventDefault(); const err = {};
    if (!form.roomId) err.roomId = "Chambre requise.";
    if (!form.title.trim()) err.title = "Décrivez le problème.";
    if (!form.equipment.trim()) err.equipment = "Équipement requis.";
    if (+form.cost < 0) err.cost = "Coût invalide.";
    setErrors(err); if (Object.keys(err).length) return;
    const room = data.rooms.find((r) => r.id === form.roomId);
    const isNew = !form.id;
    saveRecord("maintenance", { ...form, id: form.id || makeId("MT"), room: room.number, cost: +form.cost || 0 }, form.id ? `Ticket ${form.id} mis à jour` : `Ticket maintenance chambre ${room.number} créé`);
    if (isNew && room && room.status !== "maintenance") updateRecord("rooms", room.id, { status: "maintenance", cleaning: "maintenance" });
    setForm(null);
  };

  const openCount = items.filter((m) => m.status === "open").length;
  const progressCount = items.filter((m) => m.status === "in-progress").length;
  const totalCost = items.filter((m) => m.status !== "resolved").reduce((s, m) => s + (+m.cost || 0), 0);

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Exploitation / Technique" title="Maintenance" subtitle="Tickets, coûts et indisponibilités. Une chambre en maintenance est automatiquement indisponible." action={<button onClick={() => begin()} className={adminButton}><Plus size={15}/> Nouveau ticket</button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={AlertTriangle} label="Tickets ouverts" value={openCount} hint="À traiter" />
      <StatCard icon={Clock3} label="En cours" value={progressCount} hint="Interventions actives" />
      <StatCard icon={CheckCircle2} label="Résolus" value={items.filter((m)=>m.status==="resolved").length} hint="Historique" />
      <StatCard icon={Wrench} label="Coût en cours" value={formatPrice(totalCost)} hint="Tickets non résolus" />
    </div>
    <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Problème, chambre, équipement..." className="w-full sm:w-72"/><select value={status} onChange={(e)=>setStatus(e.target.value)} aria-label="Filtrer" className={adminField}><option value="all">Tous statuts</option>{statuses.map((s)=><option key={s} value={s}>{labels[s]}</option>)}</select><span className="ml-auto text-xs text-night/40">{rows.length} ticket(s)</span></FilterBar>
    <DataTable rows={rows} columns={[
      { key: "id", label: "Ticket", render: (m) => <span className="font-semibold text-night">{m.id}</span> },
      { key: "room", label: "Chambre", render: (m) => <span className="font-medium">Ch. {m.room}</span> },
      { key: "title", label: "Problème", render: (m) => <span><span className="font-medium text-night">{m.title}</span><span className="block text-[10px] text-night/45">{m.equipment}</span></span> },
      { key: "priority", label: "Priorité", render: (m) => <StatusBadge value={m.priority}/> },
      { key: "assignee", label: "Responsable" },
      { key: "cost", label: "Coût", render: (m) => formatPrice(m.cost) },
      { key: "date", label: "Date", render: (m) => formatDate(m.date, { day: "numeric", month: "short" }) },
      { key: "status", label: "Statut", render: (m) => <StatusBadge value={m.status}/> },
      { key: "act", label: "", sortable: false, render: (m) => <Dropdown items={[{ label: "Voir", icon: Eye, onClick: () => setSelectedId(m.id) }, { label: "Modifier", icon: Pencil, onClick: () => begin(m) }, m.status !== "resolved" && { label: "Marquer résolu", icon: CheckCircle2, onClick: () => setMaintenanceStatus(m.id, "resolved") }, { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDeleteId(m.id) }]} /> },
    ]} onRowClick={(m)=>setSelectedId(m.id)} emptyTitle="Aucun ticket" />

    <Drawer open={!!selected} onClose={()=>setSelectedId(null)} title={selected?.id || ""} eyebrow="Ticket maintenance" footer={selected && <><button onClick={()=>begin(selected)} className={outlineButton}><Pencil size={14}/> Modifier</button>{selected.status!=="resolved" && <button onClick={()=>{setMaintenanceStatus(selected.id,"resolved"); setSelectedId(null);}} className={adminButton}><CheckCircle2 size={14}/> Marquer résolu</button>}</>}>
      {selected && <div className="space-y-5"><div className={`${panel} p-5`}><div className="flex items-center justify-between"><h3 className="font-serif text-2xl">{selected.title}</h3><StatusBadge value={selected.status}/></div><p className="mt-1 text-xs text-night/50">Chambre {selected.room} · {selected.equipment} · {formatDate(selected.date)}</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-night/45">Responsable</p><strong>{selected.assignee}</strong></div><div><p className="text-night/45">Coût estimé</p><strong>{formatPrice(selected.cost)}</strong></div><div><p className="text-night/45">Priorité</p><StatusBadge value={selected.priority}/></div></div></div>{selected.notes && <div className={`${panel} p-5 text-xs`}><h3 className="mb-2 font-serif text-xl">Notes</h3>{selected.notes}</div>}<div className={`${panel} p-5`}><label className="text-xs text-night/50">Statut du ticket</label><select value={selected.status} onChange={(e)=>setMaintenanceStatus(selected.id, e.target.value)} className={`${adminField} mt-2`}>{statuses.map((s)=><option key={s} value={s}>{labels[s]}</option>)}</select><p className="mt-2 text-[11px] text-night/45">Résolu → chambre à nouveau disponible (ou réservée si une arrivée est prévue).</p></div></div>}
    </Drawer>

    <Modal open={!!form} onClose={()=>setForm(null)} title={form?.id ? "Modifier le ticket" : "Nouveau ticket"} footer={<><button onClick={()=>setForm(null)} className={outlineButton}>Annuler</button><button form="mt-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {form && <form id="mt-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Chambre *" error={errors.roomId}><select value={form.roomId} onChange={(e)=>setForm({...form,roomId:e.target.value})} className={adminField}><option value="">Choisir...</option>{data.rooms.map((r)=><option key={r.id} value={r.id}>{r.number} · {r.type}</option>)}</select></FormField>
        <FormField label="Équipement *" error={errors.equipment}><input value={form.equipment} onChange={(e)=>setForm({...form,equipment:e.target.value})} placeholder="Ex. Climatisation" className={adminField}/></FormField>
        <FormField label="Problème *" error={errors.title} className="sm:col-span-2"><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className={adminField}/></FormField>
        <FormField label="Priorité"><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})} className={adminField}><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Urgente</option></select></FormField>
        <FormField label="Responsable"><select value={form.assignee} onChange={(e)=>setForm({...form,assignee:e.target.value})} className={adminField}>{["Non assigné","Thomas Leroy","Karim Haddad","Sophie Bernard","Marie Petit"].map((p)=><option key={p}>{p}</option>)}</select></FormField>
        <FormField label="Coût estimé (€)"><input type="number" min="0" value={form.cost} onChange={(e)=>setForm({...form,cost:e.target.value})} className={adminField}/></FormField>
        <FormField label="Date"><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} className={adminField}/></FormField>
        <FormField label="Notes" className="sm:col-span-2"><textarea rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} className={adminField}/></FormField>
      </form>}
    </Modal>
    <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>deleteRecord("maintenance", deleteId, "Ticket supprimé")} title="Supprimer ce ticket ?" confirmLabel="Supprimer" destructive />
  </div>;
}
