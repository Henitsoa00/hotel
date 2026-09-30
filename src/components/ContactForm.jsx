import { useState } from "react";
import { Send } from "lucide-react";
import { Field, Spinner, SuccessBox } from "./ui";
import { validateFields } from "../utils/booking";
import { sendContactMessage } from "../services/api";

const empty = { name: "", email: "", phone: "", subject: "", message: "" };
const rules = { name: { required: true }, email: { required: true, email: true }, phone: { phone: true }, subject: { required: true }, message: { required: true, min: 10 } };

export default function ContactForm() {
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); errors[k] && setErrors({ ...errors, [k]: undefined }); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateFields(v, rules);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("loading");
    await sendContactMessage(v);
    setStatus("done");
  };

  if (status === "done") return <SuccessBox title="Votre message a bien été envoyé." text="Notre équipe vous répondra sous 24 heures." onReset={() => { setV(empty); setStatus("idle"); }} />;

  const cls = (k) => `input ${errors[k] ? "input-error" : ""}`;
  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field label="Nom *" error={errors.name}><input className={cls("name")} value={v.name} onChange={set("name")} /></Field>
      <Field label="Email *" error={errors.email}><input type="email" className={cls("email")} value={v.email} onChange={set("email")} /></Field>
      <Field label="Téléphone" error={errors.phone}><input className={cls("phone")} value={v.phone} onChange={set("phone")} /></Field>
      <Field label="Sujet *" error={errors.subject}>
        <select className={cls("subject")} value={v.subject} onChange={set("subject")}>
          <option value="">Sélectionner…</option><option>Réservation</option><option>Restaurant</option><option>Événement</option><option>Réclamation</option><option>Autre</option>
        </select>
      </Field>
      <Field label="Message *" error={errors.message} className="sm:col-span-2"><textarea rows={5} className={cls("message")} value={v.message} onChange={set("message")} /></Field>
      <button disabled={status === "loading"} className="btn-dark sm:col-span-2 sm:justify-self-start">{status === "loading" ? <><Spinner /> Envoi…</> : <><Send size={15} /> Envoyer le message</>}</button>
    </form>
  );
}
