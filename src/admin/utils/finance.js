import { todayISO, calculateNights } from "../../utils/booking";

export const PAYMENT_METHODS = ["Carte bancaire", "Virement", "Espèces", "Prélèvement"];

const ACTIVE_BOOKING = (r) => r.status !== "cancelled";

/** Montant déjà encaissé pour une réservation (transactions positives liées). */
export function paidForBooking(bookingId, transactions = []) {
  return transactions
    .filter((t) => t.bookingId === bookingId && t.amount > 0 && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);
}

export function refundedForBooking(bookingId, transactions = []) {
  return -transactions
    .filter((t) => t.bookingId === bookingId && t.amount < 0 && t.type === "refund")
    .reduce((s, t) => s + t.amount, 0);
}

/** Reste à payer d'une réservation. Gère le partiel même si le statut est encore "pending". */
export function bookingBalance(reservation, transactions = []) {
  if (!reservation || reservation.status === "cancelled") {
    return { billed: 0, paid: 0, refunded: 0, due: 0, status: reservation?.payment || "pending", overdue: false, daysOverdue: 0 };
  }
  if (reservation.payment === "refunded") {
    const paid = paidForBooking(reservation.id, transactions);
    return { billed: reservation.amount || 0, paid, refunded: paid, due: 0, status: "refunded", overdue: false, daysOverdue: 0 };
  }
  const billed = reservation.amount || 0;
  // Compat : anciennes données "paid" sans transaction générée (ex. seed) => considéré comme soldé.
  const hasTx = transactions.some((t) => t.bookingId === reservation.id && t.amount > 0);
  const paid = hasTx ? paidForBooking(reservation.id, transactions) : reservation.payment === "paid" ? billed : 0;
  const refunded = refundedForBooking(reservation.id, transactions);
  const netPaid = Math.max(0, paid - refunded);
  const due = Math.max(0, Math.round((billed - netPaid) * 100) / 100);
  const status = due <= 0 ? "paid" : netPaid > 0 ? "partial" : "pending";
  const today = todayISO();
  const overdue = due > 0 && (reservation.checkOut < today || reservation.status === "checked-out");
  const daysOverdue = overdue
    ? Math.max(0, Math.round((new Date(today + "T00:00:00") - new Date(reservation.checkOut + "T00:00:00")) / 86400000))
    : 0;
  return { billed, paid: netPaid, refunded, due, status, overdue, daysOverdue };
}

/** Solde global d'un client : facturé / payé / reste + détail par réservation. */
export function clientBalance(clientId, reservations = [], transactions = []) {
  const list = reservations.filter((r) => r.clientId === clientId && ACTIVE_BOOKING(r));
  let billed = 0, paid = 0, due = 0, overdue = 0;
  const lines = list.map((r) => {
    const b = bookingBalance(r, transactions);
    billed += b.billed; paid += b.paid; due += b.due;
    if (b.overdue) overdue += b.due;
    return { ...r, balance: b };
  });
  const pendingCount = lines.filter((l) => l.balance.due > 0).length;
  const overdueCount = lines.filter((l) => l.balance.overdue).length;
  return {
    billed, paid, due: Math.round(due * 100) / 100, overdue: Math.round(overdue * 100) / 100,
    pendingCount, overdueCount, stays: list.length,
    settled: due <= 0,
    recoveryRate: billed > 0 ? Math.round((paid / billed) * 100) : 100,
    lines: lines.sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
  };
}

/** Créances clients = toutes les réservations avec un reste à payer. */
export function clientReceivables(reservations = [], transactions = []) {
  return reservations
    .filter(ACTIVE_BOOKING)
    .map((r) => ({ ...r, balance: bookingBalance(r, transactions) }))
    .filter((r) => r.balance.due > 0)
    .sort((a, b) => {
      if (a.balance.overdue !== b.balance.overdue) return a.balance.overdue ? -1 : 1;
      return a.checkOut.localeCompare(b.checkOut);
    });
}

export function receivablesSummary(reservations = [], transactions = []) {
  const items = clientReceivables(reservations, transactions);
  const total = items.reduce((s, r) => s + r.balance.due, 0);
  const overdue = items.filter((r) => r.balance.overdue).reduce((s, r) => s + r.balance.due, 0);
  return { items, total, overdue, count: items.length, overdueCount: items.filter((r) => r.balance.overdue).length };
}

// ---------- Fournisseurs ----------

export function supplierInvoiceBalance(invoice) {
  if (!invoice) return { due: 0, status: "paid", overdue: false, daysOverdue: 0 };
  const due = Math.max(0, Math.round(((invoice.amount || 0) - (invoice.paidAmount || 0)) * 100) / 100);
  const today = todayISO();
  const overdue = due > 0 && invoice.dueDate < today;
  const daysOverdue = overdue
    ? Math.max(0, Math.round((new Date(today + "T00:00:00") - new Date(invoice.dueDate + "T00:00:00")) / 86400000))
    : 0;
  const status = due <= 0 ? "paid" : overdue ? "overdue" : (invoice.paidAmount || 0) > 0 ? "partial" : "pending";
  return { due, status, overdue, daysOverdue };
}

export function supplierDebts(invoices = []) {
  return invoices
    .map((inv) => ({ ...inv, balance: supplierInvoiceBalance(inv) }))
    .filter((inv) => inv.balance.due > 0)
    .sort((a, b) => {
      if (a.balance.overdue !== b.balance.overdue) return a.balance.overdue ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate);
    });
}

export function supplierSummary(invoices = []) {
  const items = supplierDebts(invoices);
  const total = items.reduce((s, i) => s + i.balance.due, 0);
  const overdue = items.filter((i) => i.balance.overdue).reduce((s, i) => s + i.balance.due, 0);
  const paid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  return { items, total, overdue, paid, count: items.length, overdueCount: items.filter((i) => i.balance.overdue).length };
}

// ---------- Chambres ----------

export function roomStayHistory(roomId, reservations = []) {
  const list = reservations
    .filter((r) => r.roomId === roomId)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const valid = list.filter(ACTIVE_BOOKING);
  const nights = valid.reduce((s, r) => s + calculateNights(r.checkIn, r.checkOut), 0);
  const revenue = valid.reduce((s, r) => s + (r.amount || 0), 0);
  const today = todayISO();
  return {
    list,
    total: list.length,
    stays: valid.length,
    cancelled: list.length - valid.length,
    nights,
    revenue,
    avgTicket: valid.length ? revenue / valid.length : 0,
    current: list.find((r) => r.status === "checked-in" && r.checkIn <= today && r.checkOut > today) || null,
    upcoming: list.filter((r) => ["pending", "confirmed"].includes(r.status) && r.checkIn >= today).sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
    past: list.filter((r) => ["checked-out", "cancelled"].includes(r.status) || r.checkOut < today),
  };
}

// ---------- Pilotage propriétaire ----------

export function ownerKpis(data, days = 30) {
  const { reservations = [], transactions = [], rooms = [], supplierInvoices = [] } = data;
  const start = new Date(); start.setDate(start.getDate() - (days - 1));
  const startISO = start.toISOString().slice(0, 10);
  const periodTx = transactions.filter((t) => t.date >= startISO);
  const revenue = periodTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = -periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const refunds = -periodTx.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount, 0);
  const net = revenue - expenses - refunds;

  const roomRevenue = periodTx.filter((t) => t.type === "room" && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const soldNights = reservations
    .filter((r) => ACTIVE_BOOKING(r) && r.checkIn >= startISO)
    .reduce((s, r) => s + calculateNights(r.checkIn, r.checkOut), 0);
  const adr = soldNights > 0 ? roomRevenue / soldNights : 0;
  const availableNights = Math.max(1, rooms.length * days);
  const revpar = roomRevenue / availableNights;
  const periodBookings = reservations.filter((r) => (r.createdAt || r.checkIn) >= startISO);
  const cancelRate = reservations.length ? Math.round((reservations.filter((r) => r.status === "cancelled").length / reservations.length) * 100) : 0;

  const rec = receivablesSummary(reservations, transactions);
  const sup = supplierSummary(supplierInvoices);
  return {
    revenue, expenses, refunds, net,
    margin: revenue > 0 ? Math.round((net / revenue) * 100) : 0,
    adr, revpar, soldNights, cancelRate,
    bookings: periodBookings.length,
    receivables: rec.total, receivablesOverdue: rec.overdue, receivablesCount: rec.count,
    payables: sup.total, payablesOverdue: sup.overdue, payablesCount: sup.count,
    cashOutlook: net - sup.total, // trésorerie prévisionnelle simplifiée
  };
}

/** Occupation prévisionnelle jour par jour (hors annulées). */
export function occupancyForecast(reservations = [], roomsCount = 1, daysAhead = 14) {
  const out = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const occupied = new Set(
      reservations.filter((r) => ACTIVE_BOOKING(r) && r.roomId && r.checkIn <= iso && r.checkOut > iso).map((r) => r.roomId)
    ).size;
    out.push({
      date: iso,
      label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      value: roomsCount ? Math.round((occupied / roomsCount) * 100) : 0,
      occupied,
    });
  }
  return out;
}

/** Alertes actionnables pour le chef / propriétaire. */
export function ownerAlerts(data) {
  const alerts = [];
  const { reservations = [], transactions = [], rooms = [], tasks = [], supplierInvoices = [] } = data;
  const rec = receivablesSummary(reservations, transactions);
  const sup = supplierSummary(supplierInvoices);
  const today = todayISO();

  if (rec.overdue > 0) alerts.push({ id: "rec-overdue", level: "critical", title: "Créances clients en retard", detail: `${rec.overdueCount} dossier(s) · ${rec.overdue.toFixed(2)} € à relancer`, link: "/admin/finance?tab=receivables" });
  if (sup.overdue > 0) alerts.push({ id: "sup-overdue", level: "critical", title: "Factures fournisseurs en retard", detail: `${sup.overdueCount} facture(s) · ${sup.overdue.toFixed(2)} € à régler`, link: "/admin/finance?tab=payables" });
  const noRoom = reservations.filter((r) => ["pending", "confirmed"].includes(r.status) && !r.roomId);
  if (noRoom.length) alerts.push({ id: "no-room", level: "warning", title: "Réservations sans chambre attribuée", detail: `${noRoom.length} réservation(s) à traiter`, link: "/admin/reservations" });
  const unpaidCheckout = reservations.filter((r) => r.checkOut === today && r.status !== "cancelled" && bookingBalance(r, transactions).due > 0);
  if (unpaidCheckout.length) alerts.push({ id: "checkout-unpaid", level: "warning", title: "Départs du jour avec solde dû", detail: `${unpaidCheckout.length} chambre(s) à encaisser avant 12h`, link: "/admin/reservations?date=today" });
  const maintenance = rooms.filter((r) => r.status === "maintenance");
  if (maintenance.length) alerts.push({ id: "maintenance", level: "info", title: "Chambres en maintenance", detail: `${maintenance.map((r) => r.number).join(", ")} hors inventaire`, link: "/admin/rooms" });
  const urgentTasks = tasks.filter((t) => t.priority === "high" && ["dirty", "cleaning"].includes(t.status));
  if (urgentTasks.length) alerts.push({ id: "hk", level: "info", title: "Ménage urgent en attente", detail: `${urgentTasks.length} tâche(s) prioritaire(s)`, link: "/admin/housekeeping" });
  return alerts;
}
