import { useState } from "react";
import { useAdminData, makeId } from "../context/AdminDataContext";
import { Modal, FormField, adminField, adminButton, outlineButton } from "./ui";
import { validateFields } from "../../utils/booking";

const empty = { firstName: "", lastName: "", email: "", phone: "", country: "France", status: "new", preferences: "", notes: "" };

export default function ClientForm({ open, onClose, client }) {
  const { data, saveClient } = useAdminData();
  const [form, setForm] = useState(client ? { ...client } : { ...empty });
  const [errors, setErrors] = useState({});
  // Remounting with a key in parents resets the draft for another client.
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const submit = (e) => {
    e.preventDefault();
    const err = validateFields(form, { firstName: { required: true }, lastName: { required: true }, email: { required: true, email: true }, phone: { required: true, phone: true }, country: { required: true } });
    if (data.clients.some((c) => c.email.toLowerCase() === form.email.toLowerCase() && c.id !== client?.id)) err.email = "Cet email est déjà utilisé.";
    setErrors(err); if (Object.keys(err).length) return;
    const id = client?.id || makeId("CL");
    saveClient({ ...form, id, stays: client?.stays || 0, spent: client?.spent || 0, lastStay: client?.lastStay || "" }, client ? `Profil de ${form.firstName} ${form.lastName} mis à jour` : `Nouveau client ${form.firstName} ${form.lastName}`);
    onClose();
  };
  return <Modal open={open} onClose={onClose} title={client ? "Modifier le client" : "Ajouter un client"} size="lg" footer={<><button type="button" onClick={onClose} className={outlineButton}>Annuler</button><button type="submit" form="client-form" className={adminButton}>Enregistrer</button></>}>
    <form id="client-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <FormField label="Prénom *" error={errors.firstName}><input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={adminField}/></FormField>
      <FormField label="Nom *" error={errors.lastName}><input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={adminField}/></FormField>
      <FormField label="Email *" error={errors.email}><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={adminField}/></FormField>
      <FormField label="Téléphone *" error={errors.phone}><input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={adminField}/></FormField>
      <FormField label="Pays"><input value={form.country} onChange={(e) => set("country", e.target.value)} className={adminField}/></FormField>
      <FormField label="Statut"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={adminField}><option value="new">Nouveau</option><option value="regular">Fidèle</option><option value="vip">VIP</option></select></FormField>
      <FormField label="Préférences" className="sm:col-span-2"><textarea rows={2} value={form.preferences} onChange={(e) => set("preferences", e.target.value)} className={adminField} placeholder="Ex. Chambre au calme, étage élevé"/></FormField>
      <FormField label="Notes internes" className="sm:col-span-2"><textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={adminField}/></FormField>
    </form>
  </Modal>;
}