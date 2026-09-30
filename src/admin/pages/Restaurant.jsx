import { useMemo, useState } from "react";
import { ChefHat, ClipboardList, Grid2X2, Plus, Pencil, Trash2, Eye, Check, UtensilsCrossed } from "lucide-react";
import { menuCategories } from "../../data/restaurant";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { PageHeading, DataTable, StatusBadge, StatCard, SearchBar, FilterBar, Modal, Drawer, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { formatPrice, todayISO } from "../../utils/booking";

const orderStatuses = ["pending", "preparing", "ready", "served", "completed", "cancelled"];
const statusLabels = { pending: "En attente", preparing: "En préparation", ready: "Prête", served: "Servie", completed: "Terminée", cancelled: "Annulée" };

export default function AdminRestaurant() {
  const { data, saveRecord, updateRecord, deleteRecord, setOrderStatus } = useAdminData();
  const [tab, setTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [menuForm, setMenuForm] = useState(null);
  const [menuEditing, setMenuEditing] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ tableId: "", client: "", items: [], itemId: "", quantity: 1 });
  const [orderErrors, setOrderErrors] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tableForm, setTableForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});
  const [resOpen, setResOpen] = useState(false);
  const [resForm, setResForm] = useState({ name: "", phone: "", date: todayISO(), time: "19:30", guests: 2, table: "", status: "pending", note: "" });
  const [catForm, setCatForm] = useState("");
  const bookings = data.restaurantBookings || [];
  const revenueByCat = menuCategories.map((c) => ({ label: c, value: data.orders.filter((o)=>!["cancelled"].includes(o.status)).flatMap((o)=>o.items).filter((i)=>data.menu.find((m)=>m.id===i.id)?.category===c).reduce((s,i)=>s+i.quantity*i.unitPrice,0) })).filter((x)=>x.value>0);
  const totalRevenue = revenueByCat.reduce((s,x)=>s+x.value,0);
  const selectedOrder = data.orders.find((o) => o.id === selectedOrderId);
  const menuRows = useMemo(() => data.menu.filter((m) => (category === "all" || m.category === category) && (!search || `${m.name} ${m.description}`.toLowerCase().includes(search.toLowerCase()))), [data.menu, category, search]);
  const orderRows = useMemo(() => data.orders.filter((o) => !search || `${o.id} ${o.client} ${o.table}`.toLowerCase().includes(search.toLowerCase())), [data.orders, search]);
  const closeForms = () => { setMenuForm(null); setTableForm(null); setErrors({}); };

  const beginMenu = (m = null) => { setMenuEditing(m?.id || null); setErrors({}); setMenuForm(m ? { ...m } : { name: "", category: "Entrées", description: "", price: "", image: "", available: true }); };
  const saveMenu = (e) => {
    e.preventDefault(); const err = {};
    if (!menuForm.name.trim()) err.name = "Nom requis.";
    if (+menuForm.price <= 0) err.price = "Prix positif requis.";
    setErrors(err); if (Object.keys(err).length) return;
    saveRecord("menu", { ...menuForm, id: menuEditing || makeId("PLAT"), price: +menuForm.price, image: menuForm.image || data.menu[0]?.image }, menuEditing ? "Plat modifié" : "Plat ajouté au menu"); closeForms();
  };

  const addItem = () => {
    const item = data.menu.find((m) => String(m.id) === String(orderForm.itemId));
    if (!item) return;
    const qty = Math.max(1, +orderForm.quantity || 1);
    setOrderForm((f) => ({ ...f, items: [...f.items, { id: item.id, name: item.name, unitPrice: item.price, quantity: qty }], itemId: "", quantity: 1 }));
    setOrderErrors({});
  };
  const orderAmount = orderForm.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const saveOrder = (e) => {
    e.preventDefault(); const err = {};
    if (!orderForm.tableId) err.tableId = "Choisissez une table.";
    if (!orderForm.client.trim()) err.client = "Nom du client requis.";
    if (!orderForm.items.length) err.items = "Ajoutez au moins un plat.";
    setOrderErrors(err); if (Object.keys(err).length) return;
    const table = data.tables.find((t) => t.id === orderForm.tableId);
    const id = makeId("CMD");
    saveRecord("orders", { id, tableId: table.id, table: table.number, client: orderForm.client.trim(), items: orderForm.items, amount: orderAmount, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), date: todayISO(), status: "pending" }, `Nouvelle commande ${id}`);
    updateRecord("tables", table.id, { status: "occupied", currentOrderId: id });
    setOrderOpen(false);
  };

  const saveTable = (e) => {
    e.preventDefault(); const err = {};
    if (!/^\d+$/.test(tableForm.number)) err.number = "Numéro invalide.";
    if (data.tables.some((t) => t.number === tableForm.number.padStart(2, "0") && t.id !== tableForm.id)) err.number = "Numéro déjà utilisé.";
    if (+tableForm.capacity < 1) err.capacity = "Capacité invalide.";
    setErrors(err); if (Object.keys(err).length) return;
    const id = tableForm.id || makeId("TB");
    saveRecord("tables", { ...tableForm, id, number: tableForm.number.padStart(2, "0"), capacity: +tableForm.capacity, currentOrderId: tableForm.currentOrderId || null }, `Table ${tableForm.number.padStart(2, "0")} enregistrée`); closeForms();
  };

  const menuColumns = [
    { key: "name", label: "Plat", render: (m) => <div className="flex items-center gap-3"><img src={m.image} alt="" className="h-11 w-14 rounded-lg object-cover"/><div><span className="font-medium text-night">{m.name}</span><p className="max-w-56 truncate text-[10px] text-night/45">{m.description}</p></div></div> },
    { key: "category", label: "Catégorie" }, { key: "price", label: "Prix", render: (m) => <span className="font-medium text-night">{formatPrice(m.price)}</span> },
    { key: "available", label: "Disponibilité", render: (m) => <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={m.available} onChange={() => updateRecord("menu", m.id, { available: !m.available }, `${m.name} ${m.available ? "indisponible" : "disponible"}`)} className="h-4 w-4 accent-[#0f1b2d]"/><span>{m.available ? "Disponible" : "Épuisé"}</span></label>, sortValue: (m) => Number(m.available) },
    { key: "action", label: "", sortable: false, render: (m) => <Dropdown items={[{ label: "Modifier", icon: Pencil, onClick: () => beginMenu(m) }, { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDeleteId(m.id) }]}/> },
  ];
  const orderColumns = [
    { key: "id", label: "Commande", render: (o) => <span className="font-medium text-night">{o.id}</span> },
    { key: "table", label: "Table", render: (o) => <span className="font-medium">N° {o.table}</span> },
    { key: "client", label: "Client" },
    { key: "items", label: "Articles", sortable: false, render: (o) => <span className="block max-w-44 truncate">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</span> },
    { key: "amount", label: "Montant", render: (o) => <span className="font-medium text-night">{formatPrice(o.amount)}</span> },
    { key: "time", label: "Heure" },
    { key: "status", label: "Statut", render: (o) => <StatusBadge value={o.status}/> },
    { key: "action", label: "Action", sortable: false, render: (o) => <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1"><select aria-label={`Statut commande ${o.id}`} value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} className="rounded-lg border border-night/10 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-gold">{orderStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select><button title="Voir la commande" onClick={() => setSelectedOrderId(o.id)} className="p-1.5 text-gold"><Eye size={15}/></button></div> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Services / Gastronomie" title="Restaurant" subtitle="Menu · Catégories · Tables · Réservations · Commandes · Revenus." action={<button onClick={() => { if (tab === "menu") beginMenu(); else if (tab === "tables") { setErrors({}); setTableForm({ number: "", capacity: 2, status: "available" }); } else if (tab === "reservations") { setErrors({}); setTableForm(null); setResForm({ name: "", phone: "", date: todayISO(), time: "19:30", guests: 2, table: "", status: "pending", note: "" }); setResOpen(true); } else { setOrderForm({ tableId: "", client: "", items: [], itemId: "", quantity: 1 }); setOrderErrors({}); setOrderOpen(true); } }} className={adminButton}><Plus size={15}/> {tab === "menu" ? "Ajouter un plat" : tab === "tables" ? "Ajouter une table" : tab === "reservations" ? "Nouvelle réservation" : tab === "categories" ? "Ajouter un plat" : tab === "revenue" ? "Nouvelle commande" : "Nouvelle commande"}</button>}/>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard icon={ChefHat} label="Plats à la carte" value={data.menu.length} hint={`${data.menu.filter((m) => m.available).length} disponibles`}/><StatCard icon={ClipboardList} label="Commandes en cours" value={data.orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length} hint="Service actuel"/><StatCard icon={Grid2X2} label="Tables libres" value={data.tables.filter((t) => t.status === "available").length} hint={`Sur ${data.tables.length} tables`}/><StatCard icon={UtensilsCrossed} label="CA restaurant" value={formatPrice(data.orders.filter((o)=>!["cancelled"].includes(o.status)).reduce((s,o)=>s+o.amount,0))} hint="Commandes non annulées"/></div>
    <div className="mb-6 flex w-fit max-w-full flex-wrap gap-1 overflow-x-auto rounded-xl border border-night/10 bg-white p-1">{[["orders","Orders"],["menu","Menu"],["categories","Categories"],["tables","Tables"],["reservations","Reservations"],["revenue","Revenue"]].map(([key, label]) => <button key={key} onClick={() => { setTab(key); setSearch(""); }} className={`rounded-lg px-4 py-2 text-xs transition ${tab === key ? "bg-night text-white" : "text-night/55 hover:bg-ivory"}`}>{label}</button>)}</div>
    {tab === "menu" && <><FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Rechercher un plat..." className="w-full sm:w-64"/><select aria-label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} className={adminField}><option value="all">Toutes les catégories</option>{menuCategories.map((c) => <option key={c}>{c}</option>)}</select></FilterBar><DataTable rows={menuRows} columns={menuColumns} emptyTitle="Aucun plat trouvé"/></>}
    {tab === "orders" && <><FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Commande, table ou client..." className="w-full sm:w-72"/><span className="ml-auto text-xs text-night/40">{orderRows.length} commande(s)</span></FilterBar><DataTable rows={orderRows} columns={orderColumns} onRowClick={(o) => setSelectedOrderId(o.id)} emptyTitle="Aucune commande trouvée"/></>}
    {tab === "tables" && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{[...data.tables].sort((a, b) => a.number.localeCompare(b.number)).map((t) => <button key={t.id} onClick={() => { setErrors({}); setTableForm({ ...t }); }} className={`${panel} p-5 text-left transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg`}><div className="flex items-start justify-between"><UtensilsCrossed size={19} className="text-gold"/><span className="font-serif text-3xl">{t.number}</span></div><p className="mt-4 text-xs font-medium">Table {t.number}</p><p className="mt-0.5 text-[11px] text-night/45">{t.capacity} couverts</p><div className="mt-3"><StatusBadge value={t.status}/></div>{t.currentOrderId && <p className="mt-3 text-[10px] text-gold">{t.currentOrderId}</p>}</button>)}</div>}
    {tab === "categories" && <div className={`${panel} overflow-hidden`}><div className="border-b border-night/[.07] p-5"><h3 className="font-serif text-2xl">Catégories de la carte</h3><p className="text-xs text-night/50">Plats par catégorie · disponibilité pilotée depuis l'onglet Menu.</p></div>{menuCategories.map((c) => { const items = data.menu.filter((m)=>m.category===c); return <div key={c} className="flex flex-wrap items-center justify-between gap-2 border-b border-night/[.05] px-5 py-4 last:border-0"><div><p className="font-medium">{c}</p><p className="text-[11px] text-night/45">{items.length} plat(s) · {items.filter((m)=>m.available).length} disponible(s)</p></div><div className="flex gap-2">{items.slice(0,3).map((m)=><img key={m.id} src={m.image} alt="" className="h-8 w-10 rounded-lg object-cover"/>)}</div></div>; })}<div className="p-5"><div className="flex gap-2"><input value={catForm} onChange={(e)=>setCatForm(e.target.value)} placeholder="Nouvelle catégorie (ex. Brunch)" className={adminField}/><button onClick={()=>{ if(!catForm.trim()) return; saveRecord("menu", { id: makeId("PLAT"), name: `Nouveau plat · ${catForm.trim()}`, category: catForm.trim(), description: "À compléter", price: 10, image: data.menu[0]?.image, available: true }, `Catégorie ${catForm.trim()} créée`); setCatForm(""); }} className={outlineButton}>Créer via un plat</button></div><p className="mt-2 text-[11px] text-night/45">Les catégories vivent avec la carte : créez un plat pour ouvrir une nouvelle catégorie.</p></div></div>}
    {tab === "reservations" && <><FilterBar><SearchBar value={search} onChange={setSearch} placeholder="Nom, table..." className="w-full sm:w-64"/><span className="ml-auto text-xs text-night/40">{bookings.length} réservation(s) de table</span></FilterBar><DataTable rows={bookings.filter((b)=>!search||`${b.name} ${b.table}`.toLowerCase().includes(search.toLowerCase()))} columns={[
      { key: "name", label: "Client", render: (b) => <span><span className="font-medium text-night">{b.name}</span><span className="block text-[10px] text-night/45">{b.phone}</span></span> },
      { key: "date", label: "Date" }, { key: "time", label: "Heure" }, { key: "guests", label: "Couverts" }, { key: "table", label: "Table" },
      { key: "status", label: "Statut", render: (b) => <StatusBadge value={b.status==="confirmed"?"confirmed":b.status==="cancelled"?"cancelled":"pending"}/> },
      { key: "act", label: "", sortable: false, render: (b) => <Dropdown items={[{ label: "Confirmer", icon: Check, onClick: () => updateRecord("restaurantBookings", b.id, { status: "confirmed" }, `Réservation table ${b.table} confirmée`) }, { label: "Annuler", icon: Trash2, danger: true, onClick: () => updateRecord("restaurantBookings", b.id, { status: "cancelled" }, `Réservation table ${b.table} annulée`) }]} /> },
    ]} emptyTitle="Aucune réservation de table" /></>}
    {tab === "revenue" && <div className="grid gap-5 lg:grid-cols-2"><div className={`${panel} p-6`}><h3 className="font-serif text-2xl">CA par catégorie</h3><p className="text-xs text-night/50">Total : {formatPrice(totalRevenue)}</p><div className="mt-4 space-y-3">{revenueByCat.map((r)=><div key={r.label}><div className="mb-1 flex justify-between text-xs"><span>{r.label}</span><span className="font-medium">{formatPrice(r.value)}</span></div><div className="h-2 rounded-full bg-ivory"><div className="h-2 rounded-full bg-gold" style={{width:`${totalRevenue?Math.round(r.value/totalRevenue*100):0}%`}}/></div></div>)}{revenueByCat.length===0&&<p className="text-xs text-night/45">Aucune vente enregistrée.</p>}</div></div><div className={`${panel} p-6`}><h3 className="font-serif text-2xl">Top plats</h3><div className="mt-4 space-y-2">{data.orders.flatMap((o)=>o.items).reduce((acc,i)=>{ const f=acc.find((x)=>x.name===i.name); if(f) f.qty+=i.quantity; else acc.push({name:i.name,qty:i.quantity}); return acc; },[]).sort((a,b)=>b.qty-a.qty).slice(0,5).map((p)=><div key={p.name} className="flex justify-between rounded-xl bg-ivory px-4 py-2.5 text-xs"><span>{p.name}</span><strong>{p.qty} servis</strong></div>)}</div></div></div>}

    <Modal open={!!menuForm} onClose={closeForms} title={menuEditing ? "Modifier le plat" : "Ajouter un plat"} footer={<><button onClick={closeForms} className={outlineButton}>Annuler</button><button form="menu-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {menuForm && <form id="menu-form" onSubmit={saveMenu} className="space-y-4"><FormField label="Nom du plat *" error={errors.name}><input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} className={adminField}/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Catégorie"><select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className={adminField}>{menuCategories.map((c) => <option key={c}>{c}</option>)}</select></FormField><FormField label="Prix (€) *" error={errors.price}><input type="number" min="0.01" step="0.01" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className={adminField}/></FormField></div><FormField label="Description"><textarea rows={2} value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className={adminField}/></FormField><FormField label="URL de l'image"><input type="url" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} placeholder="https://..." className={adminField}/></FormField><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={menuForm.available} onChange={(e) => setMenuForm({ ...menuForm, available: e.target.checked })} className="accent-[#0f1b2d]"/> Disponible à la commande</label></form>}
    </Modal>
    <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title="Nouvelle commande" size="lg" footer={<><button onClick={() => setOrderOpen(false)} className={outlineButton}>Annuler</button><button form="order-form" type="submit" className={adminButton}>Enregistrer · {formatPrice(orderAmount)}</button></>}>
      <form id="order-form" onSubmit={saveOrder} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><FormField label="Table *" error={orderErrors.tableId}><select value={orderForm.tableId} onChange={(e) => setOrderForm({ ...orderForm, tableId: e.target.value })} className={adminField}><option value="">Choisir une table</option>{data.tables.filter((t) => t.status !== "occupied").map((t) => <option key={t.id} value={t.id}>Table {t.number} · {t.capacity} couverts</option>)}</select></FormField><FormField label="Client *" error={orderErrors.client}><input value={orderForm.client} onChange={(e) => setOrderForm({ ...orderForm, client: e.target.value })} className={adminField} placeholder="Nom du client"/></FormField></div>
        <div className="rounded-xl bg-ivory p-4"><span className="mb-2 block text-xs font-medium">Ajouter des articles</span><div className="flex flex-wrap gap-2"><select value={orderForm.itemId} onChange={(e) => setOrderForm({ ...orderForm, itemId: e.target.value })} className={`${adminField} min-w-40 flex-1`}><option value="">Choisir un plat</option>{data.menu.filter((m) => m.available).map((m) => <option key={m.id} value={m.id}>{m.name} · {formatPrice(m.price)}</option>)}</select><input type="number" min="1" max="20" aria-label="Quantité" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} className={`${adminField} !w-18`}/><button type="button" onClick={addItem} disabled={!orderForm.itemId} className={adminButton}><Plus size={14}/></button></div>{orderErrors.items && <p className="mt-2 text-xs text-rose-600">{orderErrors.items}</p>}</div>
        <div className="space-y-2">{orderForm.items.map((item, i) => <div key={i} className="flex items-center justify-between rounded-lg border border-night/[.07] px-3 py-2 text-xs"><span>{item.quantity}× {item.name}</span><span className="flex items-center gap-3">{formatPrice(item.quantity * item.unitPrice)}<button type="button" onClick={() => setOrderForm((f) => ({ ...f, items: f.items.filter((_, k) => k !== i) }))} className="text-rose-600"><Trash2 size={13}/></button></span></div>)}</div>
      </form>
    </Modal>
    <Modal open={!!tableForm} onClose={closeForms} title={tableForm?.id ? `Table ${tableForm.number}` : "Ajouter une table"} footer={<><button onClick={closeForms} className={outlineButton}>Annuler</button><button form="table-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {tableForm && <form id="table-form" onSubmit={saveTable} className="grid gap-4 sm:grid-cols-2"><FormField label="Numéro *" error={errors.number}><input value={tableForm.number} disabled={!!tableForm.id} onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })} className={`${adminField} disabled:opacity-60`}/></FormField><FormField label="Capacité *" error={errors.capacity}><input type="number" min="1" value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })} className={adminField}/></FormField><FormField label="Statut" className="sm:col-span-2"><select value={tableForm.status} disabled={!!tableForm.currentOrderId} onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })} className={`${adminField} disabled:opacity-60`}><option value="available">Disponible</option><option value="reserved">Réservée</option><option value="occupied">Occupée</option></select></FormField>{tableForm.currentOrderId && <p className="text-xs text-night/50 sm:col-span-2">Commande en cours : {tableForm.currentOrderId}. Son statut pilote la disponibilité de la table.</p>}</form>}
    </Modal>
    <Modal open={resOpen} onClose={()=>setResOpen(false)} title="Réservation de table" footer={<><button onClick={()=>setResOpen(false)} className={outlineButton}>Annuler</button><button form="res-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      <form id="res-form" onSubmit={(e)=>{ e.preventDefault(); if(!resForm.name.trim()||!resForm.date) return; saveRecord("restaurantBookings", { ...resForm, id: makeId("RTB"), guests: +resForm.guests || 2 }, `Table ${resForm.table||"à attribuer"} réservée pour ${resForm.name}`); setResOpen(false); }} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Client *"><input value={resForm.name} onChange={(e)=>setResForm({...resForm,name:e.target.value})} className={adminField}/></FormField>
        <FormField label="Téléphone"><input value={resForm.phone} onChange={(e)=>setResForm({...resForm,phone:e.target.value})} className={adminField}/></FormField>
        <FormField label="Date"><input type="date" value={resForm.date} onChange={(e)=>setResForm({...resForm,date:e.target.value})} className={adminField}/></FormField>
        <FormField label="Heure"><input type="time" value={resForm.time} onChange={(e)=>setResForm({...resForm,time:e.target.value})} className={adminField}/></FormField>
        <FormField label="Couverts"><input type="number" min="1" value={resForm.guests} onChange={(e)=>setResForm({...resForm,guests:e.target.value})} className={adminField}/></FormField>
        <FormField label="Table"><select value={resForm.table} onChange={(e)=>setResForm({...resForm,table:e.target.value})} className={adminField}><option value="">À attribuer</option>{data.tables.map((t)=><option key={t.id} value={t.number}>Table {t.number} · {t.capacity} couverts</option>)}</select></FormField>
        <FormField label="Note" className="sm:col-span-2"><input value={resForm.note} onChange={(e)=>setResForm({...resForm,note:e.target.value})} className={adminField}/></FormField>
      </form>
    </Modal>
    <Drawer open={!!selectedOrder} onClose={() => setSelectedOrderId(null)} title={selectedOrder?.id || ""} eyebrow="Détail de la commande">
      {selectedOrder && <div className="space-y-5"><div className={`${panel} p-5`}><div className="flex justify-between"><span className="font-serif text-2xl">Table {selectedOrder.table}</span><StatusBadge value={selectedOrder.status}/></div><p className="mt-2 text-xs text-night/50">{selectedOrder.client} · {selectedOrder.date} à {selectedOrder.time}</p></div><div className={`${panel} p-5`}><h3 className="font-serif text-xl">Articles</h3><div className="mt-4 space-y-3">{selectedOrder.items.map((i, k) => <div key={k} className="flex justify-between border-b border-night/[.06] pb-3 text-xs"><span>{i.quantity}× {i.name}</span><span>{formatPrice(i.unitPrice * i.quantity)}</span></div>)}</div><div className="mt-4 flex justify-between font-serif text-2xl"><span>Total</span><span>{formatPrice(selectedOrder.amount)}</span></div></div><div className={`${panel} p-5`}><label className="text-xs text-night/50">Mettre à jour le statut</label><select value={selectedOrder.status} onChange={(e) => setOrderStatus(selectedOrder.id, e.target.value)} className={`${adminField} mt-2`}>{orderStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div></div>}
    </Drawer>
    <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteRecord("menu", deleteId, "Plat supprimé du menu")} title="Supprimer ce plat ?" confirmLabel="Supprimer" destructive/>
  </div>;
}