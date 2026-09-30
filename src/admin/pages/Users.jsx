import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, ShieldCheck, Trash2, UserRoundCog, UsersRound } from "lucide-react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { modules, requiredPermissions, DEMO_PASSWORD } from "../data/users";
import { updateMockPassword } from "../services/adminApi";
import { PageHeading, StatCard, StatusBadge, SearchBar, DataTable, Modal, Drawer, ConfirmDialog, Dropdown, FormField, adminField, adminButton, outlineButton, panel } from "../components/ui";
import { validateFields } from "../../utils/booking";

const empty = { name: "", email: "", role: "reception", status: "active", lastLogin: "Jamais" };

export default function Users() {
  const { data, saveRecord, deleteRecord, notify } = useAdminData();
  const { user, syncUser, roleRules, setRolePermissions } = useAdminAuth();
  const [tab, setTab] = useState("team");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const selected = data.users.find((u) => u.id === selectedId);
  const rows = useMemo(() => data.users.filter((u) => !search || `${u.name} ${u.email} ${roleRules.find((r) => r.key === u.role)?.label}`.toLowerCase().includes(search.toLowerCase())), [data.users, search, roleRules]);
  const begin = (u = null) => { setSelectedId(null); setForm(u ? { ...u } : { ...empty }); setNewPassword(""); setErrors({}); };
  const submit = (e) => {
    e.preventDefault();
    const err = validateFields(form, { name: { required: true }, email: { required: true, email: true } });
    if (data.users.some((u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== form.id)) err.email = "Cet email est déjà utilisé.";
    if (newPassword && newPassword.length < 8) err.password = "Au moins 8 caractères.";
    if (form.id === user.id && form.status === "inactive") err.status = "Vous ne pouvez pas désactiver votre propre compte.";
    setErrors(err); if (Object.keys(err).length) return;
    const id = form.id || makeId("USR");
    const updated = { ...form, id };
    saveRecord("users", updated, `Compte ${form.name} enregistré`);
    if (newPassword) updateMockPassword(id, newPassword);
    syncUser(updated); setForm(null);
  };
  const togglePermission = (role, module) => {
    const existing = role.permissions;
    setRolePermissions(role.key, existing.includes(module) ? existing.filter((p) => p !== module) : [...existing, module]);
    notify(`Permissions du rôle ${role.label} mises à jour`);
  };
  const columns = [
    { key: "name", label: "Utilisateur", render: (u) => <span className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sand/70 font-serif text-lg text-night">{u.name[0]}</span><span><strong className="font-medium text-night">{u.name}</strong><span className="block text-[10px] text-night/45">{u.email}</span></span></span> },
    { key: "email", label: "Email" },
    { key: "role", label: "Rôle", render: (u) => roleRules.find((r) => r.key === u.role)?.label },
    { key: "lastLogin", label: "Dernière connexion" },
    { key: "status", label: "Statut", render: (u) => <StatusBadge value={u.status}/> },
    { key: "action", label: "", sortable: false, render: (u) => <Dropdown items={[{ label: "Voir le profil", icon: Eye, onClick: () => setSelectedId(u.id) }, { label: "Modifier", icon: Pencil, onClick: () => begin(u) }, u.id !== user.id && { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDeleteId(u.id) }]}/> },
  ];

  return <div className="animate-fade-in">
    <PageHeading eyebrow="Système / Accès" title="Utilisateurs" subtitle="Une équipe, des accès adaptés à chaque métier." action={<button onClick={() => begin()} className={adminButton}><Plus size={15}/> Ajouter un membre</button>}/>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3"><StatCard label="Membres de l'équipe" value={data.users.length} icon={UsersRound} hint="Comptes enregistrés"/><StatCard label="Comptes actifs" value={data.users.filter((u) => u.status === "active").length} icon={UserRoundCog} hint="Peuvent se connecter"/><StatCard label="Rôles disponibles" value={roleRules.length} icon={ShieldCheck} hint="Avec permissions dédiées"/></div>
    <div className="mb-5 flex w-fit gap-1 rounded-xl border border-night/10 bg-white p-1">{[["team", "Équipe"], ["roles", "Rôles & permissions"]].map(([k, v]) => <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-5 py-2 text-xs ${tab === k ? "bg-night text-white" : "text-night/55 hover:bg-ivory"}`}>{v}</button>)}</div>
    {tab === "team" && <><div className="mb-5"><SearchBar value={search} onChange={setSearch} placeholder="Rechercher un membre ou un rôle..." className="max-w-sm"/></div><DataTable rows={rows} columns={columns} onRowClick={(u) => setSelectedId(u.id)} emptyTitle="Aucun membre trouvé"/></>}
    {tab === "roles" && <div className={`${panel} overflow-hidden`}><div className="p-5"><h2 className="font-serif text-2xl">Matrice des accès</h2><p className="mt-1 text-xs text-night/45">Les changements s'appliquent immédiatement. Les permissions essentielles de chaque métier restent protégées.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-[#faf9f6] text-[10px] uppercase tracking-wider text-night/50"><tr><th className="px-5 py-3">Module</th>{roleRules.map((r) => <th key={r.key} className="px-3 py-3 text-center">{r.label}</th>)}</tr></thead><tbody className="divide-y divide-night/[.06]">{modules.map((m) => <tr key={m.key}><th className="px-5 py-3 font-medium">{m.label}</th>{roleRules.map((r) => <td key={r.key} className="px-3 py-3 text-center"><input type="checkbox" aria-label={`${r.label} : ${m.label}`} checked={r.permissions.includes(m.key)} disabled={r.key === "super-admin" || requiredPermissions[r.key]?.includes(m.key)} onChange={() => togglePermission(r, m.key)} className="h-4 w-4 cursor-pointer accent-[#b8975a] disabled:cursor-not-allowed"/></td>)}</tr>)}</tbody></table></div></div>}

    <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name || ""} eyebrow="Profil membre de l'équipe" footer={selected && <button onClick={() => begin(selected)} className={adminButton}><Pencil size={14}/> Modifier le compte</button>}>
      {selected && <div className="space-y-5"><div className={`${panel} p-6`}><div className="grid h-14 w-14 place-items-center rounded-xl bg-sand font-serif text-3xl">{selected.name[0]}</div><h3 className="mt-4 font-serif text-2xl">{selected.name}</h3><p className="text-xs text-night/50">{selected.email}</p><div className="mt-4 flex gap-2"><StatusBadge value={selected.status}/><span className="rounded-full bg-sand/50 px-3 py-1 text-[11px]">{roleRules.find((r) => r.key === selected.role)?.label}</span></div></div><div className={`${panel} p-5`}><h3 className="font-serif text-xl">Accès autorisés</h3><div className="mt-3 flex flex-wrap gap-2">{modules.filter((m) => roleRules.find((r) => r.key === selected.role)?.permissions.includes(m.key)).map((m) => <span key={m.key} className="rounded-lg bg-ivory px-3 py-1.5 text-[11px]">{m.label}</span>)}</div></div></div>}
    </Drawer>
    <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Modifier l'utilisateur" : "Ajouter un utilisateur"} footer={<><button onClick={() => setForm(null)} className={outlineButton}>Annuler</button><button form="user-form" type="submit" className={adminButton}>Enregistrer</button></>}>
      {form && <form id="user-form" onSubmit={submit} noValidate className="space-y-4"><FormField label="Nom complet *" error={errors.name}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={adminField}/></FormField><FormField label="Email *" error={errors.email}><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={adminField}/></FormField><div className="grid gap-3 sm:grid-cols-2"><FormField label="Rôle"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={adminField}>{roleRules.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select></FormField><FormField label="Statut" error={errors.status}><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={adminField}><option value="active">Actif</option><option value="inactive">Inactif</option></select></FormField></div><FormField label={form.id ? "Nouveau mot de passe (facultatif)" : "Mot de passe (facultatif)"} error={errors.password}><input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Au moins 8 caractères" className={adminField}/></FormField><p className="rounded-xl bg-sand/40 p-3 text-[11px] text-night/60">{form.id ? "Laissez vide pour conserver le mot de passe actuel." : `Sans mot de passe saisi, l'accès de démonstration utilise ${DEMO_PASSWORD}.`}</p></form>}
    </Modal>
    <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteRecord("users", deleteId, "Compte utilisateur supprimé")} title="Supprimer cet utilisateur ?" description="Il ne pourra plus se connecter avec ce compte de démonstration." confirmLabel="Supprimer" destructive/>
  </div>;
}