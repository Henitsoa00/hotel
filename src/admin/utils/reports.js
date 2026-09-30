import { addDaysISO, calculateNights, formatPrice, todayISO } from "../../utils/booking";
import { dailySeries, financeSummary, serviceBreakdown } from "./analytics";

export const reportKinds = [
  { key: "occupancy", label: "Occupancy Report", description: "Chambres occupées et prévisions" },
  { key: "bookings", label: "Reservation Report", description: "Volume et séjours" },
  { key: "finance", label: "Revenue Report", description: "Encaissements" },
  { key: "expenses", label: "Expense Report", description: "Charges et dépenses" },
  { key: "restaurant", label: "Restaurant Report", description: "Commandes et chiffre d'affaires" },
  { key: "events", label: "Event Report", description: "Réceptions et participants" },
  { key: "clients", label: "Client Report", description: "Fidélité et valeur client" },
];

export function buildReport(kind, data, start, end) {
  const between = (date) => date && date >= start && date <= end;
  const chartLimit = kind === "events" || kind === "occupancy" ? addDaysISO(undefined, 45) : todayISO();
  const chartEnd = end > chartLimit ? chartLimit : end;
  const chartDays = Math.max(1, Math.min(30, Math.round((new Date(chartEnd + "T12:00:00") - new Date(start + "T12:00:00")) / 86400000) + 1));
  const chartStart = addDaysISO(chartEnd, -(chartDays - 1));
  const chart = (list, dateKey, value = () => 1) => Array.from({ length: chartDays }, (_, i) => {
    const date = addDaysISO(chartStart, i);
    return { date, label: new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), value: list.filter((r) => r[dateKey] === date).reduce((s, r) => s + value(r), 0) };
  });

  if (kind === "occupancy") {
    const series = Array.from({ length: chartDays }, (_, i) => {
      const date = addDaysISO(chartStart, i);
      const booked = new Set(data.reservations.filter((r) => r.roomId && r.status !== "cancelled" && r.checkIn <= date && r.checkOut > date).map((r) => r.roomId));
      return { date, label: new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), value: Math.round(booked.size / Math.max(1, data.rooms.length) * 100) };
    });
    const avg = Math.round(series.reduce((s, d) => s + d.value, 0) / series.length);
    return {
      title: "Rapport d'occupation", metrics: [["Taux moyen", `${avg} %`], ["Chambres", data.rooms.length], ["Disponibles aujourd'hui", data.rooms.filter((r) => r.status === "available").length], ["Chambres en maintenance", data.rooms.filter((r) => r.status === "maintenance").length]],
      series, chartType: "area", unit: "%", note: "Le taux passé ou prévisionnel est calculé à partir des réservations attribuées à une chambre.",
      headers: ["Numéro", "Type", "Étage", "Statut", "Nettoyage"],
      rows: data.rooms.map((r) => ({ id: r.id, values: [r.number, r.type, r.floor, r.status, r.cleaning] })),
    };
  }
  if (kind === "bookings") {
    const items = data.reservations.filter((r) => between(r.checkIn));
    return { title: "Rapport des réservations", metrics: [["Réservations", items.length], ["Confirmées", items.filter((r) => r.status === "confirmed").length], ["Annulations", items.filter((r) => r.status === "cancelled").length], ["Durée moyenne", `${items.length ? (items.reduce((s, r) => s + calculateNights(r.checkIn, r.checkOut), 0) / items.length).toFixed(1) : "0"} nuits`]],
      series: chart(items, "checkIn"), chartType: "bar", note: "Réservations comptées à leur date d'arrivée.",
      headers: ["ID", "Client", "Chambre", "Arrivée", "Départ", "Voyageurs", "Montant EUR", "Statut"],
      rows: items.map((r) => ({ id: r.id, values: [r.id, r.clientName, r.roomNumber, r.checkIn, r.checkOut, r.guests, r.amount, r.status] })),
    };
  }
  if (kind === "finance") {
    const items = data.transactions.filter((t) => between(t.date) && t.amount > 0);
    const stats = financeSummary(items);
    return { title: "Revenue Report", metrics: [["Revenus", formatPrice(stats.revenue)], ["Transactions", items.length], ["Panier moyen", formatPrice(items.length ? stats.revenue / items.length : 0)], ["Remboursements", formatPrice(stats.refunds)]],
      series: chart(items, "date", (t) => Math.max(0, t.amount)), chartType: "area", unit: "€", note: "Encaissements uniquement. Dépenses dans Expense Report.",
      headers: ["ID", "Client", "Type", "Montant EUR", "Méthode", "Date", "Statut"],
      rows: items.map((t) => ({ id: t.id, values: [t.id, t.client, t.type, t.amount, t.method, t.date, t.status] })),
    };
  }
  if (kind === "expenses") {
    const items = data.transactions.filter((t) => between(t.date) && (t.type === "expense" || t.amount < 0));
    const total = -items.reduce((s, t) => s + Math.min(0, t.amount), 0);
    const supplierDue = (data.supplierInvoices || []).filter((i) => i.dueDate >= start && i.dueDate <= end).reduce((s, i) => s + Math.max(0, i.amount - (i.paidAmount || 0)), 0);
    return { title: "Expense Report", metrics: [["Dépenses", formatPrice(total)], ["Opérations", items.length], ["Dettes fournisseurs", formatPrice(supplierDue)], ["Maintenance", formatPrice((data.maintenance || []).filter((m) => m.date >= start && m.date <= end).reduce((s, m) => s + (+m.cost || 0), 0))]],
      series: chart(items, "date", (t) => -Math.min(0, t.amount)), chartType: "bar", unit: "€", note: "Charges comptabilisées + dettes fournisseurs sur la période.",
      headers: ["ID", "Tiers", "Type", "Montant EUR", "Méthode", "Date", "Statut"],
      rows: items.map((t) => ({ id: t.id, values: [t.id, t.client, t.type, t.amount, t.method, t.date, t.status] })),
    };
  }
  if (kind === "restaurant") {
    const items = data.orders.filter((o) => between(o.date));
    const served = items.filter((o) => ["served", "completed"].includes(o.status));
    return { title: "Rapport restaurant", metrics: [["Commandes", items.length], ["Servies", served.length], ["Ventes servies", formatPrice(served.reduce((s, o) => s + o.amount, 0))], ["Panier moyen", formatPrice(served.length ? served.reduce((s, o) => s + o.amount, 0) / served.length : 0)]],
      series: chart(items, "date", (o) => o.status === "cancelled" ? 0 : o.amount), chartType: "bar", unit: "€", note: "Les ventes servies excluent les commandes annulées et en préparation.",
      headers: ["Commande", "Table", "Client", "Articles", "Montant EUR", "Date", "Statut"],
      rows: items.map((o) => ({ id: o.id, values: [o.id, o.table, o.client, o.items.map((i) => `${i.quantity}x ${i.name}`).join(", "), o.amount, o.date, o.status] })),
    };
  }
  if (kind === "events") {
    const items = data.events.filter((e) => between(e.date));
    const valid = items.filter((e) => e.status !== "cancelled");
    return { title: "Rapport événements", metrics: [["Événements", items.length], ["Participants", valid.reduce((s, e) => s + e.guests, 0)], ["Valeur des contrats", formatPrice(valid.reduce((s, e) => s + e.price, 0))], ["Confirmés", valid.filter((e) => e.status === "confirmed").length]],
      series: chart(valid, "date", (e) => e.guests), chartType: "bar", note: "Les contrats peuvent être à venir ; leur valeur n'est pas un encaissement réalisé.",
      headers: ["ID", "Événement", "Type", "Client", "Date", "Participants", "Prix EUR", "Statut"],
      rows: items.map((e) => ({ id: e.id, values: [e.id, e.title, e.type, e.client, e.date, e.guests, e.price, e.status] })),
    };
  }
  const items = data.clients.filter((c) => between(c.lastStay));
  return { title: "Rapport clients", metrics: [["Clients actifs", items.length], ["Clients VIP", items.filter((c) => c.status === "vip").length], ["Séjours cumulés", items.reduce((s, c) => s + c.stays, 0)], ["Dépenses cumulées", formatPrice(items.reduce((s, c) => s + c.spent, 0))]],
    series: chart(items, "lastStay"), chartType: "bar", note: "Les clients sont sélectionnés selon la date de leur dernier séjour.",
    headers: ["Nom", "Email", "Pays", "Séjours", "Dernier séjour", "Total dépensé EUR", "Statut"],
    rows: items.map((c) => ({ id: c.id, values: [`${c.firstName} ${c.lastName}`, c.email, c.country, c.stays, c.lastStay, c.spent, c.status] })),
  };
}