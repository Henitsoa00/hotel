import { useState } from "react";
import { Building2, CalendarClock, CreditCard, Bell, UserRound, Upload, Save, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { updateMockPassword, loginAdmin } from "../services/adminApi";
import { PageHeading, FormField, Busy, adminField, adminButton, panel } from "../components/ui";
import { validateFields } from "../../utils/booking";

const tabs = [
  { key: "hotel", label: "L'hôtel", icon: Building2 }, { key: "booking", label: "Réservations", icon: CalendarClock },
  { key: "payments", label: "Paiements", icon: CreditCard }, { key: "notifications", label: "Notifications", icon: Bell },
  { key: "account", label: "Mon compte", icon: UserRound },
];

export default function Settings({ accountOnly = false }) {
  const { data, saveSettings, saveRecord } = useAdminData();
  const { user, syncUser } = useAdminAuth();
  const [tab, setTab] = useState(accountOnly ? "account" : "hotel");
  const [draft, setDraft] = useState(accountOnly ? { name: user.name, email: user.email } : { ...data.settings.hotel });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "" });

  const changeTab = (key) => { setTab(key); setDraft(key === "account" ? { name: user.name, email: user.email } : { ...data.settings[key] }); setErrors({}); setPasswords({ current: "", next: "" }); };
  const set = (key, value) => { setDraft((d) => ({ ...d, [key]: value })); setErrors((e) => ({ ...e, [key]: "" })); };
  const upload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 400_000) return setErrors({ ...errors, logo: "Image de moins de 400 Ko requise." });
    const reader = new FileReader(); reader.onload = () => set("logo", reader.result); reader.readAsDataURL(file);
  };
  const save = async (e) => {
    e.preventDefault(); const err = {};
    if (tab === "hotel") Object.assign(err, validateFields(draft, { name: { required: true }, address: { required: true }, phone: { required: true, phone: true }, email: { required: true, email: true } }));
    if (tab === "booking") {
      if (!draft.checkIn) err.checkIn = "Heure requise.";
      if (!draft.checkOut) err.checkOut = "Heure requise.";
      if (!draft.cancellation.trim()) err.cancellation = "Politique requise.";
    }
    if (tab === "payments" && (+draft.taxRate < 0 || +draft.taxRate > 50)) err.taxRate = "Entre 0 et 50 %.";
    if (tab === "account") {
      Object.assign(err, validateFields(draft, { name: { required: true }, email: { required: true, email: true } }));
      if (data.users.some((u) => u.email.toLowerCase() === draft.email.toLowerCase() && u.id !== user.id)) err.email = "Cet email est déjà utilisé.";
      if (passwords.next && passwords.next.length < 8) err.next = "Au moins 8 caractères.";
      if (passwords.next && !passwords.current) err.current = "Mot de passe actuel requis.";
    }
    setErrors(err); if (Object.keys(err).length) return;
    setSaving(true);
    if (tab === "account") {
      if (passwords.next) {
        try { await loginAdmin(user.email, passwords.current); }
        catch { setErrors({ current: "Mot de passe actuel incorrect." }); setSaving(false); return; }
        updateMockPassword(user.id, passwords.next);
      }
      const updated = { ...user, name: draft.name, email: draft.email };
      saveRecord("users", updated, "Informations du compte enregistrées"); syncUser(updated);
      setPasswords({ current: "", next: "" });
    } else saveSettings(tab, draft);
    setSaving(false);
  };

  return <div className="animate-fade-in">
    <PageHeading eyebrow={accountOnly ? "Mon espace / Profil" : "Système / Configuration"} title={accountOnly ? "Mon compte" : "Paramètres"} subtitle={accountOnly ? "Gérez vos informations personnelles et votre accès." : "Les détails de la Maison et les préférences de gestion."}/>
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <nav className={`${panel} h-fit p-2`} aria-label="Rubriques des paramètres">{(accountOnly ? tabs.filter((t) => t.key === "account") : tabs).map(({ key, label, icon: Icon }) => <button key={key} onClick={() => changeTab(key)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs transition ${tab === key ? "bg-night text-white" : "text-night/60 hover:bg-ivory hover:text-night"}`}><Icon size={17}/>{label}</button>)}</nav>
      <form onSubmit={save} className={`${panel} min-w-0 overflow-hidden`}>
        <div className="border-b border-night/[.07] px-6 py-5"><h2 className="font-serif text-[27px]">{tabs.find((t) => t.key === tab)?.label}</h2><p className="mt-1 text-xs text-night/45">{tab === "hotel" ? "Identité et coordonnées de la Maison." : tab === "booking" ? "Horaires et politique d'accueil." : tab === "payments" ? "Modes acceptés et fiscalité." : tab === "notifications" ? "Choisissez les alertes affichées dans l'administration." : "Vos informations personnelles et accès."}</p></div>
        <div className="space-y-5 p-6">
          {tab === "hotel" && <>
            <div className="flex flex-wrap items-center gap-5 rounded-xl bg-sand/40 p-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-night text-beige">{draft.logo ? <img src={draft.logo} alt="Logo de l'hôtel" className="h-full w-full object-contain"/> : <span className="font-serif text-4xl">A</span>}</div><div><p className="text-xs font-medium">Logo de la Maison</p><p className="mt-0.5 text-[11px] text-night/45">Le logo typographique public est conservé. Ajoutez ici une variante pour l'administration.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-night/15 bg-white px-3 py-2 text-xs hover:border-gold"><Upload size={14}/> Importer une image<input type="file" accept="image/*" onChange={upload} className="sr-only"/></label>{errors.logo && <p className="mt-1 text-xs text-rose-600">{errors.logo}</p>}</div></div>
            <FormField label="Nom de l'hôtel *" error={errors.name}><input value={draft.name} onChange={(e) => set("name", e.target.value)} className={adminField}/></FormField>
            <FormField label="Adresse *" error={errors.address}><input value={draft.address} onChange={(e) => set("address", e.target.value)} className={adminField}/></FormField>
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Téléphone *" error={errors.phone}><input value={draft.phone} onChange={(e) => set("phone", e.target.value)} className={adminField}/></FormField><FormField label="Email *" error={errors.email}><input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className={adminField}/></FormField></div>
          </>}
          {tab === "booking" && <><div className="grid gap-4 sm:grid-cols-2"><FormField label="Heure de check-in *" error={errors.checkIn}><input type="time" value={draft.checkIn} onChange={(e) => set("checkIn", e.target.value)} className={adminField}/></FormField><FormField label="Heure de check-out *" error={errors.checkOut}><input type="time" value={draft.checkOut} onChange={(e) => set("checkOut", e.target.value)} className={adminField}/></FormField></div><FormField label="Politique d'annulation *" error={errors.cancellation}><textarea rows={5} value={draft.cancellation} onChange={(e) => set("cancellation", e.target.value)} className={adminField}/></FormField><p className="rounded-xl bg-sand/40 p-3 text-[11px] text-night/55">Paramètres conservés localement. La synchronisation avec les règles du site public nécessitera l'API.</p></>}
          {tab === "payments" && <><div className="grid gap-4 sm:grid-cols-2"><FormField label="Devise"><select value={draft.currency} onChange={(e) => set("currency", e.target.value)} className={adminField}><option value="EUR">Euro (EUR)</option></select></FormField><FormField label="Taux de taxe (%)" error={errors.taxRate}><input type="number" min="0" max="50" step="0.1" value={draft.taxRate} onChange={(e) => set("taxRate", e.target.value)} className={adminField}/></FormField></div><div className="border-t border-night/[.07] pt-5"><h3 className="font-serif text-xl">Moyens de paiement acceptés</h3>{[["card", "Carte bancaire"], ["transfer", "Virement"], ["cash", "Espèces"]].map(([key, label]) => <label key={key} className="mt-4 flex cursor-pointer items-center justify-between text-xs"><span>{label}</span><input type="checkbox" checked={!!draft[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[#0f1b2d]"/></label>)}</div><p className="rounded-xl bg-sand/40 p-3 text-[11px] text-night/55">La taxe du moteur de réservation public reste à 10 % jusqu'à connexion à une API partagée.</p></>}
          {tab === "notifications" && <div className="space-y-0">{[["bookings", "Réservations", "Nouvelles demandes et annulations"], ["checkIns", "Check-in / Check-out", "Mouvements d'arrivée et de départ"], ["payments", "Paiements", "Encaissements et remboursements"], ["housekeeping", "Housekeeping", "Entretien des chambres"], ["restaurant", "Restaurant", "Commandes et mise à jour de la carte"], ["events", "Événements", "Nouveaux événements et changements"]].map(([key, label, hint]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 border-b border-night/[.06] py-4 last:border-0"><span><strong className="block text-xs font-medium">{label}</strong><span className="mt-1 block text-[11px] text-night/45">{hint}</span></span><input type="checkbox" checked={!!draft[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[#0f1b2d]"/></label>)}</div>}
          {tab === "account" && <><div className="flex items-center gap-4 rounded-xl bg-sand/40 p-4"><span className="grid h-14 w-14 place-items-center rounded-xl bg-night font-serif text-2xl text-white">{user.name[0]}</span><span><strong className="block font-serif text-xl">{user.name}</strong><span className="text-xs text-night/50">{user.email}</span></span></div><FormField label="Nom complet *" error={errors.name}><input value={draft.name} onChange={(e) => set("name", e.target.value)} className={adminField}/></FormField><FormField label="Email *" error={errors.email}><input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className={adminField}/></FormField><div className="border-t border-night/[.07] pt-5"><h3 className="mb-4 font-serif text-xl">Changer de mot de passe</h3><div className="grid gap-4 sm:grid-cols-2"><FormField label="Mot de passe actuel" error={errors.current}><input type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className={adminField}/></FormField><FormField label="Nouveau mot de passe" error={errors.next}><input type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className={adminField}/></FormField></div></div></>}
        </div>
        <div className="flex justify-end border-t border-night/[.07] bg-[#faf9f6] px-6 py-4"><button disabled={saving} className={adminButton}>{saving ? <Busy/> : <Save size={14}/>} Enregistrer les modifications</button></div>
      </form>
    </div>
    <div className={`${panel} mt-5 flex items-start gap-3 p-5 text-xs text-night/55`}><ShieldCheck className="shrink-0 text-gold" size={18}/><div><strong className="font-medium text-night">Mode démonstration</strong><p className="mt-1">Vos changements sont stockés localement dans ce navigateur. Seule une connexion à un backend sécurisé pourra les appliquer à l'ensemble des équipes et au site public.</p></div></div>
  </div>;
}