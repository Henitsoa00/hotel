import { addDaysISO, todayISO } from "../../utils/booking";

export function financeSummary(transactions, start = "", end = "") {
  const filtered = transactions.filter((t) => (!start || t.date >= start) && (!end || t.date <= end) && t.status !== "cancelled");
  const revenue = filtered.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = -filtered.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const refunds = -filtered.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amount, 0);
  return { revenue, expenses, refunds, net: revenue - expenses - refunds, count: filtered.length };
}

export function dailySeries(records, days, dateKey = "date", value = () => 1) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(undefined, i - days + 1);
    return { date, label: new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), value: records.filter((r) => r[dateKey]?.slice(0, 10) === date).reduce((s, r) => s + value(r), 0) };
  });
}

export function monthlySeries(records, months = 12, dateKey = "date", value = () => 1) {
  return Array.from({ length: months }, (_, i) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (months - i - 1));
    const key = date.toISOString().slice(0, 7);
    return { date: key, label: date.toLocaleDateString("fr-FR", { month: "short" }), value: records.filter((r) => r[dateKey]?.slice(0, 7) === key).reduce((s, r) => s + value(r), 0) };
  });
}

export function serviceBreakdown(transactions, start = "", end = "") {
  const names = { room: "Hébergement", restaurant: "Restaurant", event: "Événements", spa: "Spa & bien-être" };
  return Object.entries(names).map(([key, label]) => ({
    label, value: transactions.filter((t) => t.type === key && t.amount > 0 && (!start || t.date >= start) && (!end || t.date <= end)).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.value > 0);
}

export function occupancyRate(rooms) {
  return rooms.length ? Math.round(rooms.filter((r) => r.status === "occupied").length / rooms.length * 100) : 0;
}

export function todayCounts(reservations) {
  const today = todayISO();
  return {
    arrivals: reservations.filter((r) => r.checkIn === today && r.status !== "cancelled").length,
    departures: reservations.filter((r) => r.checkOut === today && r.status !== "cancelled").length,
  };
}

export function downloadCsv(filename, headers, rows) {
  const escape = (value) => {
    const str = String(value ?? "");
    const safe = /^[=+@-]/.test(str) && !/^-?\d+(\.\d+)?$/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escape).join(";"), ...rows.map((r) => r.map(escape).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}