import { addDaysISO } from "../../utils/booking";

export const seedSuppliers = [
  { id: "sup-01", name: "Linge Prestige Paris", category: "Linge & blanchisserie", contact: "Karim Haddad", email: "contact@linge-prestige.fr", phone: "+33 1 45 22 18 90" },
  { id: "sup-02", name: "Saveurs d'Île-de-France", category: "Alimentaire", contact: "Marie Dupont", email: "commandes@saveurs-idf.fr", phone: "+33 1 60 11 45 78" },
  { id: "sup-03", name: "EDF Collectivités", category: "Énergie", contact: "Service clients", email: "pro@edf.fr", phone: "3022" },
  { id: "sup-04", name: "Techniclim Maintenance", category: "Maintenance", contact: "Julien Perrot", email: "sav@techniclim.fr", phone: "+33 1 48 90 12 34" },
  { id: "sup-05", name: "Fleurs Aubert", category: "Décoration", contact: "Claire Aubert", email: "bonjour@fleurs-aubert.fr", phone: "+33 6 12 88 45 10" },
  { id: "sup-06", name: "Hygiène Pro Services", category: "Produits d'entretien", contact: "Sofiane Belkacem", email: "devis@hygiene-pro.fr", phone: "+33 1 39 44 20 11" },
];

// amount = montant TTC dû, paidAmount = déjà réglé. Le statut est dérivé (payé / partiel / en attente / en retard).
const invoices = [
  ["sup-01", "FAC-F-2401", "Blanchisserie janvier — draps & peignoirs", 1840, 1840, -28, -58, "Virement"],
  ["sup-02", "FAC-F-2402", "Produits frais — semaine 4", 1320, 0, -6, -36, "Virement"],
  ["sup-03", "FAC-F-2403", "Électricité — régularisation trimestrielle", 2475, 1200, 12, -18, "Prélèvement"],
  ["sup-04", "FAC-F-2404", "Contrat maintenance climatisation T1", 960, 0, -12, -42, "Virement"],
  ["sup-05", "FAC-F-2405", "Compositions florales hall & restaurant", 420, 420, -20, -50, "Carte bancaire"],
  ["sup-02", "FAC-F-2406", "Produits frais — semaine 6", 1485, 0, 9, -5, "Virement"],
  ["sup-06", "FAC-F-2407", "Produits d'entretien — stock trimestriel", 735, 0, -3, -33, "Virement"],
  ["sup-04", "FAC-F-2408", "Intervention chaudière — urgence", 610, 610, -15, -45, "Virement"],
  ["sup-01", "FAC-F-2409", "Blanchisserie février — nappage restaurant", 1290, 500, 20, -2, "Virement"],
  ["sup-03", "FAC-F-2410", "Électricité — acompte mensuel", 890, 0, 25, 0, "Prélèvement"],
];

export const seedSupplierInvoices = invoices.map(([supplierId, number, label, amount, paidAmount, dueOffset, issueOffset, method], i) => {
  const supplier = seedSuppliers.find((s) => s.id === supplierId);
  return {
    id: `SUP-${2401 + i}`,
    supplierId,
    supplier: supplier.name,
    category: supplier.category,
    number,
    label,
    amount,
    paidAmount,
    method,
    issueDate: addDaysISO(undefined, issueOffset),
    dueDate: addDaysISO(undefined, dueOffset),
    notes: i === 3 ? "Relance reçue par email — à régler en priorité." : "",
  };
});
