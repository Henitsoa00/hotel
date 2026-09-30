import { useState } from "react";
import { Modal, FormField, adminField, adminButton, outlineButton } from "./ui";
import { PAYMENT_METHODS } from "../utils/finance";
import { formatPrice } from "../../utils/booking";

export function ClientPaymentModal({ open, onClose, reservation, due, onConfirm }) {
  const [amount, setAmount] = useState(due || 0);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const v = +amount;
    if (!v || v <= 0) return setError("Saisissez un montant supérieur à 0.");
    if (v - due > 0.009) return setError(`Le reste à payer est de ${formatPrice(due)}.`);
    onConfirm(v, method);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer un paiement"
      description={reservation ? `${reservation.id} · ${reservation.clientName} · Reste : ${formatPrice(due)}` : ""}
      footer={<><button onClick={onClose} className={outlineButton}>Annuler</button><button form="pay-form" type="submit" className={adminButton}>Encaisser {formatPrice(+amount || 0)}</button></>}
    >
      <form id="pay-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Montant (€) *" error={error}>
          <input type="number" min="0.01" step="0.01" max={due} value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} className={adminField} autoFocus />
        </FormField>
        <FormField label="Mode de paiement">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={adminField}>
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <div className="flex gap-2 sm:col-span-2">
          <button type="button" onClick={() => setAmount(Math.round(due * 100) / 100)} className="rounded-lg bg-sand/60 px-3 py-1.5 text-[11px] hover:bg-sand">Totalité ({formatPrice(due)})</button>
          <button type="button" onClick={() => setAmount(Math.round((due / 2) * 100) / 100)} className="rounded-lg bg-sand/60 px-3 py-1.5 text-[11px] hover:bg-sand">50 % (acompte)</button>
        </div>
        <p className="text-[11px] text-night/45 sm:col-span-2">Un reçu (transaction + facture) est généré automatiquement. Le statut passe à « Payé » si le solde est soldé, sinon « Partiel ».</p>
      </form>
    </Modal>
  );
}

export function SupplierPaymentModal({ open, onClose, invoice, due, onConfirm }) {
  const [amount, setAmount] = useState(due || 0);
  const [method, setMethod] = useState(invoice?.method || "Virement");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const v = +amount;
    if (!v || v <= 0) return setError("Saisissez un montant supérieur à 0.");
    if (v - due > 0.009) return setError(`Le reste dû est de ${formatPrice(due)}.`);
    onConfirm(v, method);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Régler une facture fournisseur"
      description={invoice ? `${invoice.number} · ${invoice.supplier} · Reste : ${formatPrice(due)}` : ""}
      footer={<><button onClick={onClose} className={outlineButton}>Annuler</button><button form="sup-pay-form" type="submit" className={adminButton}>Régler {formatPrice(+amount || 0)}</button></>}
    >
      <form id="sup-pay-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Montant (€) *" error={error}>
          <input type="number" min="0.01" step="0.01" max={due} value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} className={adminField} autoFocus />
        </FormField>
        <FormField label="Mode de règlement">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={adminField}>
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <p className="text-[11px] text-night/45 sm:col-span-2">Le règlement est enregistré en charge et déduit du solde de la facture.</p>
      </form>
    </Modal>
  );
}
