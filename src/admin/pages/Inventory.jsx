import { useMemo, useState } from "react";
import { Plus, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { PageHeading, StatCard, StatusBadge, DataTable, SearchBar, FilterBar, Modal, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatDate, formatPrice } from "../../utils/booking";

const categories = ["Nourriture", "Boissons", "Nettoyage", "Linge", "Toilette", "Fournitures"];

export default function Inventory() {
  const { data, saveRecord, adjustStock } = useAdminData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [tab, setTab] = useState("stock");
  const [moveFor, setMoveFor] = useState(null);
  const [moveQty, setMoveQty] = useState(1);
  const [moveDir, setMoveDir] = useState("out");
  const [moveNote, setMoveNote] = useState("");
  const [form, setForm] = useState(null);

  const items = data.inventory || [];
  const rows = useMemo(() => items.filter((s) =>
    (!search || `${s.name} ${s.supplier}`.toLowerCase().includes(search.toLowerCase())) && (cat === "all" || s.category === cat)
  ), [items, search, cat]);
  const low = items.filter((s) => s.qty <= s.min);
  const value = items.reduce((s, i) => s + i.qty * (i.cost || 0), 0);

  const submitProduct = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveRecord("inventory", { ...form, id: form.id || makeId("ST"), qty: +form.qty || 0, min: +form.min || 0, cost: +form.cost || 0, updated: new Date().toISOString().slice(0, 10) }, form.id ? "Article mis à jour" : "Article ajouté au stock");
    setForm(null);
  };

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Exploitation / Stocks" title="Stocks" subtitle="Nourriture, boissons, linge, produits d'entretien et fournitures." action={<button onClick={() => setForm({ name: "", category: "Nourriture", qty: 0, min: 10, unit: "pièces", supplier: "", cost: 0 })} className={adminButton}><Plus size={15}/> Nouvel article</button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={Package} label="Articles" value={items.length} hint={`${categories.length} catégories`} />
      <StatCard icon={AlertTriangle} label="Stock faible" value={low.length} hint="Sous le seuil minimum" />
      <StatCard icon={History} label="Mouvements" value={(data.movements || []).length} hint="Entrées / sorties" />
      <StatCard icon={Package} label="Valeur du stock" value={formatPrice(value)} hint="Coût total estimé" />
    </div>
    {low.length > 0 && <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-200"><AlertTriangle size={16} className="mt-0.5 shrink-0"/><span><strong>Low Stock :</strong> {low.map((s) => `${s.name} (${s.qty} ${s.unit})`).join(" · ")}</span></div>}
    <div className="mb-5 flex w-fit gap-1 rounded-xl border border-night/10 bg-white p-1">{[["stock","Stock"],["moves","Mouvements"]].map(([k,l]) => <button key={k} onClick={()=>setTab(k)} className={`rounded-lg px-4 py-2 text-xs ${tab===k?"bg-night text-white":"text-night/55"}`}>{l}</button>)}</div>
    {tab === "stock" ? <>
      <FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Article, fournisseur..." className="w-full sm:w-64"/><select value={cat} onChange={(e)=>setCat(e.target.value)} aria-label="Catégorie" className={adminField}><option value="all">Toutes catégories</option>{categories.map((c)=><option key={c}>{c}</option>)}</select></FilterBar>
      <DataTable rows={rows} columns={[
        { key: "name", label: "Produit", render: (s) => <span><span className="font-medium text-night">{s.name}</span><span className="block text-[10px] text-night/45">{s.category} · {s.supplier}</span></span> },
        { key: "qty", label: "Quantité", render: (s) => <span className={`font-semibold ${s.qty <= s.min ? "text-rose-600" : ""}`}>{s.qty} {s.unit}</span> },
        { key: "min", label: "Seuil min", render: (s) => `${s.min} ${s.unit}` },
        { key: "status", label: "État", render: (s) => <StatusBadge value={s.qty <= 0 ? "out-of-service" : s.qty <= s.min ? "pending" : "available"} /> },
        { key: "cost", label: "Coût unit.", render: (s) => formatPrice(s.cost) },
        { key: "updated", label: "Maj", render: (s) => formatDate(s.updated, { day: "numeric", month: "short" }) },
        { key: "act", label: "", sortable: false, render: (s) => <div className="flex gap-1"><button title="Entrée" onClick={()=>{setMoveFor(s); setMoveDir("in"); setMoveQty(1); setMoveNote("");}} className="rounded-lg border border-night/10 p-1.5 hover:border-gold"><ArrowDownToLine size={14}/></button><button title="Sortie" onClick={()=>{setMoveFor(s); setMoveDir("out"); setMoveQty(1); setMoveNote("");}} className="rounded-lg border border-night/10 p-1.5 hover:border-gold"><ArrowUpFromLine size={14}/></button><button onClick={()=>setForm({...s})} className="rounded-lg border border-night/10 px-2 py-1.5 text-[11px] hover:border-gold">Modifier</button></div> },
      ]} emptyTitle="Aucun article" />
    </> : <DataTable rows={[...(data.movements || [])].sort((a,b)=>b.date.localeCompare(a.date))} columns={[
      { key: "date", label: "Date", render: (m) => formatDate(m.date, { day: "numeric", month: "short", year: "numeric" }) },
      { key: "itemId", label: "Article", render: (m) => items.find((i)=>i.id===m.itemId)?.name || m.itemId },
      { key: "type", label: "Mouvement", render: (m) => <span className={`font-medium ${m.type==="in"?"text-emerald-700":"text-amber-700"}`}>{m.type==="in"?`+${m.qty} entrée`:`-${m.qty} sortie`}</span> },
      { key: "by", label: "Par" },
      { key: "note", label: "Motif" },
    ]} emptyTitle="Aucun mouvement" />}

    <Modal open={!!moveFor} onClose={()=>setMoveFor(null)} title={`${moveDir==="in"?"Entrée":"Sortie"} · ${moveFor?.name}`} footer={<><button onClick={()=>setMoveFor(null)} className={outlineButton}>Annuler</button><button onClick={()=>{ adjustStock(moveFor.id, moveDir==="in"?+moveQty:-Math.min(+moveQty, moveFor.qty), moveNote || (moveDir==="in"?"Réassort":"Consommation")); setMoveFor(null); }} className={adminButton}>Valider</button></>}>
      <div className="grid gap-3">
        <div className="flex gap-2">{[["in","Entrée"],["out","Sortie"]].map(([k,l])=><button key={k} onClick={()=>setMoveDir(k)} className={`flex-1 rounded-xl border px-3 py-2 text-xs ${moveDir===k?"border-gold bg-sand/40":"border-night/10"}`}>{l}</button>)}</div>
        <FormField label="Quantité"><input type="number" min="1" max={moveDir==="out"?moveFor?.qty:9999} value={moveQty} onChange={(e)=>setMoveQty(e.target.value)} className={adminField}/></FormField>
        <FormField label="Motif"><input value={moveNote} onChange={(e)=>setMoveNote(e.target.value)} placeholder="Ex. Service petit-déjeuner" className={adminField}/></FormField>
      </div>
    </Modal>

    <Modal open={!!form} onClose={()=>setForm(null)} title={form?.id?"Modifier l'article":"Nouvel article"} footer={<><button onClick={()=>setForm(null)} className={outlineButton}>Annuler</button><button form="st-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {form && <form id="st-form" onSubmit={submitProduct} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nom *"><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className={adminField}/></FormField>
        <FormField label="Catégorie"><select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className={adminField}>{categories.map((c)=><option key={c}>{c}</option>)}</select></FormField>
        <FormField label="Quantité"><input type="number" min="0" value={form.qty} onChange={(e)=>setForm({...form,qty:e.target.value})} className={adminField}/></FormField>
        <FormField label="Seuil minimum"><input type="number" min="0" value={form.min} onChange={(e)=>setForm({...form,min:e.target.value})} className={adminField}/></FormField>
        <FormField label="Unité"><input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})} className={adminField}/></FormField>
        <FormField label="Coût unitaire (€)"><input type="number" min="0" step="0.01" value={form.cost} onChange={(e)=>setForm({...form,cost:e.target.value})} className={adminField}/></FormField>
        <FormField label="Fournisseur" className="sm:col-span-2"><input value={form.supplier} onChange={(e)=>setForm({...form,supplier:e.target.value})} className={adminField}/></FormField>
      </form>}
    </Modal>
  </div>;
}
