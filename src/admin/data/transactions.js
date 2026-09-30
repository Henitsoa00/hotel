import { addDaysISO, todayISO } from "../../utils/booking";
import { seedReservations } from "./reservations";

const reservationPayments = seedReservations
  .filter((r) => r.payment === "paid")
  .map((r, i) => ({
    id: `TRX-${String(8001 + i)}`, client: r.clientName, bookingId: r.id,
    type: "room", amount: r.amount, method: i % 4 === 0 ? "Virement" : "Carte bancaire",
    date: r.createdAt, status: "completed", invoice: `FAC-${String(3001 + i)}`,
  }));

const extras = [
  ["Restaurant L'Aurèle", "restaurant", 1340, "Carte bancaire", 0],
  ["Fournisseur linge", "expense", -820, "Virement", -1],
  ["Spa Maison Aurèle", "spa", 570, "Carte bancaire", -2],
  ["Groupe Armand", "event", 2100, "Virement", -3],
  ["Fournisseur alimentaire", "expense", -1320, "Virement", -5],
  ["Maison Bellamy", "event", 4600, "Virement", -7],
  ["Frais de maintenance", "expense", -460, "Virement", -11],
  ["Restaurant L'Aurèle", "restaurant", 980, "Espèces", -13],
  ["Sophie Moreau", "refund", -380, "Carte bancaire", -15],
];

const recentTransactions = extras.map(([client, type, amount, method, offset], i) => ({
  id: `TRX-${8201 + i}`, client, type, amount, method,
  date: addDaysISO(undefined, offset), status: "completed",
  invoice: amount > 0 ? `FAC-${3201 + i}` : null,
}));

// Historical entries provide a meaningful twelve-month series in the demo.
const historicalTransactions = Array.from({ length: 12 }, (_, i) => {
  const date = new Date();
  date.setDate(15);
  date.setMonth(date.getMonth() - (11 - i));
  const day = date.toISOString().slice(0, 10);
  return [
    { id: `TRX-H${i}A`, client: "Séjours & suites", type: "room", amount: 9800 + i * 480 + (i % 3) * 1350, method: "Carte bancaire", date: day, status: "completed", invoice: null },
    { id: `TRX-H${i}B`, client: "Restaurant L'Aurèle", type: "restaurant", amount: 2600 + i * 140, method: "Carte bancaire", date: day, status: "completed", invoice: null },
    { id: `TRX-H${i}C`, client: "Charges opérationnelles", type: "expense", amount: -(4900 + i * 110), method: "Virement", date: day, status: "completed", invoice: null },
  ];
}).flat();

export const seedTransactions = [...reservationPayments, ...recentTransactions, ...historicalTransactions];