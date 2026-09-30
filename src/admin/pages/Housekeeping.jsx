import { useMemo, useState } from "react";
import { ClipboardCheck, Plus, Sparkles, AlertTriangle, Timer, Trash2 } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { housekeepers } from "../data/rooms";
import { PageHeading, DataTable, StatusBadge, SearchBar, FilterBar, StatCard, Modal, ConfirmDialog, FormField, adminField, adminButton, outlineButton } from "../components/ui";

const statuses = ["dirty", "cleaning", "clean", "inspected", "maintenance"];
const initial = { roomId: "", task: "", assignee: "Non assigné", priority: "normal", time: "", status: "dirty", notes: "" };

export default function Housekeeping() {
  const { data, saveTask, updateRecord, deleteRecord, setTaskStatus } = useAdminData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [inspectId, setInspectId] = useState(null);
  const rows = useMemo(() => data.tasks.filter((t) => (!search || `${t.room} ${t.task} ${t.assignee}`.toLowerCase().includes(search.toLowerCase())) && (status === "all" || t.status === status)), [data.tasks, search, status]);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const submit = (e) => {
    e.preventDefault(); const err = {};
    if (!form.roomId) err.roomId = "Sélectionnez une chambre.";
    if (!form.task.trim()) err.task = "Décrivez la tâche.";
    if (!form.time) err.time = "Heure requise.";
    setErrors(err); if (Object.keys(err).length) return;
    const room = data.rooms.find((r) => r.id === form.roomId);
    saveTask({ ...form, id: form.id || makeId("HK"), room: room.number }, form.id ? `Tâche ${form.id} mise à jour` : `Nouvelle tâche pour la chambre ${room.number}`);
    setFormOpen(false); setForm(initial); setEditId(null);
  };
  const columns = [
    { key: "room", label: "Chambre", render: (t) => <span className="flex items-center gap-2 font-semibold text-night"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sand/50 text-gold"><Sparkles size={15}/></span>{t.room}</span> },
    { key: "task", label: "Tâche", render: (t) => <span className="font-medium text-night">{t.task}</span> },
    { key: "assignee", label: "Responsable", render: (t) => <select aria-label={`Assigner chambre ${t.room}`} value={t.assignee} onChange={(e) => updateRecord("tasks", t.id, { assignee: e.target.value }, `Tâche ${t.id} assignée à ${e.target.value}`)} className="max-w-[165px] rounded-lg border border-night/10 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-gold">{housekeepers.map((h) => <option key={h}>{h}</option>)}</select> },
    { key: "priority", label: "Priorité", render: (t) => <StatusBadge value={t.priority}/> },
    { key: "time", label: "Heure", render: (t) => <span className="flex items-center gap-1"><Timer size={13} className="text-gold"/>{t.time}</span> },
    { key: "status", label: "Statut", render: (t) => <StatusBadge value={t.status}/> },
    { key: "notes", label: "Notes", sortable: false, render: (t) => <span className="block max-w-44 truncate text-[11px] text-night/50" title={t.notes || ""}>{t.notes || "—"}</span> },
    { key: "action", label: "Action", sortable: false, render: (t) => <div className="flex items-center gap-1"><select aria-label={`Statut de la tâche ${t.id}`} value={t.status} onChange={(e) => setTaskStatus(t.id, e.target.value)} className="rounded-lg border border-night/10 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-gold">{statuses.map((s) => <option key={s} value={s}>{({ dirty: "À nettoyer", cleaning: "En cours", clean: "Propre", inspected: "Inspectée", maintenance: "Maintenance" })[s]}</option>)}</select>{t.status === "clean" && <button onClick={() => setTaskStatus(t.id, "inspected")} title="Valider l'inspection" className="rounded-lg border border-gold/40 px-2 py-1.5 text-[11px] text-gold hover:bg-sand/40">Inspecter</button>}<button onClick={() => { setForm({ ...t }); setEditId(t.id); setFormOpen(true); }} title="Modifier (notes, assignation)" className="rounded-lg p-1.5 text-night/40 hover:text-night"><ClipboardCheck size={15}/></button><button onClick={() => setDeleteId(t.id)} title="Supprimer la tâche" className="rounded-lg p-1.5 text-night/35 hover:text-rose-600"><Trash2 size={15}/></button></div> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Opérations / Entretien" title="Housekeeping" subtitle="Coordonnez l'entretien et la disponibilité des chambres en temps réel." action={<button onClick={() => { setForm(initial); setFormOpen(true); }} className={adminButton}><Plus size={15}/> Nouvelle tâche</button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Tâches en attente" value={data.tasks.filter((t) => t.status === "dirty").length} icon={AlertTriangle} hint="À prendre en charge" />
      <StatCard label="En cours" value={data.tasks.filter((t) => t.status === "cleaning").length} icon={Timer} hint="Équipe sur place" />
      <StatCard label="Inspectées" value={data.tasks.filter((t) => t.status === "inspected").length} icon={ClipboardCheck} hint="Prêtes pour l'accueil" />
      <StatCard label="Maintenance" value={data.rooms.filter((r) => r.status === "maintenance").length} icon={Sparkles} hint="Chambres hors service" />
    </div>
    <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Chambre, tâche, membre..." className="w-full sm:w-72"/><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut" className={adminField}><option value="all">Tous les statuts</option>{statuses.map((s) => <option key={s} value={s}>{({ dirty: "À nettoyer", cleaning: "En cours", clean: "Propre", inspected: "Inspectée", maintenance: "Maintenance" })[s]}</option>)}</select><span className="ml-auto text-xs text-night/40">{rows.length} tâche(s)</span></FilterBar>
    <DataTable rows={rows} columns={columns} emptyTitle="Aucune tâche pour ces critères" emptyText="Créez une tâche ou modifiez vos filtres."/>
    <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditId(null); }} title={editId ? "Modifier la tâche" : "Nouvelle tâche"} description="Assignation, notes et inspection" footer={<><button onClick={() => { setFormOpen(false); setEditId(null); }} className={outlineButton}>Annuler</button><button form="task-form" type="submit" className={adminButton}>{editId ? "Enregistrer" : "Créer la tâche"}</button></>}>
      <form id="task-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Chambre *" error={errors.roomId}><select value={form.roomId} disabled={!!editId} onChange={(e) => set("roomId", e.target.value)} className={`${adminField} disabled:opacity-60`}><option value="">Choisir...</option>{data.rooms.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.type}</option>)}</select></FormField>
        <FormField label="Responsable"><select value={form.assignee} onChange={(e) => set("assignee", e.target.value)} className={adminField}>{housekeepers.map((h) => <option key={h}>{h}</option>)}</select></FormField>
        <FormField label="Tâche *" error={errors.task} className="sm:col-span-2"><input value={form.task} onChange={(e) => set("task", e.target.value)} className={adminField} placeholder="Ex. Nettoyage après départ"/></FormField>
        <FormField label="Priorité"><select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={adminField}><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Urgente</option></select></FormField>
        <FormField label="Heure prévue *" error={errors.time}><input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={adminField}/></FormField>
        <FormField label="Statut"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={adminField}>{statuses.map((s) => <option key={s} value={s}>{({ dirty: "À nettoyer", cleaning: "En cours", clean: "Propre", inspected: "Inspectée", maintenance: "Maintenance" })[s]}</option>)}</select></FormField>
        <FormField label="Notes / inspection" className="sm:col-span-2"><textarea rows={2} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Détails, produits utilisés, remarques d'inspection..." className={adminField}/></FormField>
      </form>
    </Modal>
    <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteRecord("tasks", deleteId, "Tâche supprimée")} title="Supprimer cette tâche ?" confirmLabel="Supprimer" destructive/>
  </div>;
}