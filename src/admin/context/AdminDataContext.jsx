import { createContext, useContext, useEffect, useState } from "react";
import { getAdminData, persistAdminData } from "../services/adminApi";
import { todayISO } from "../../utils/booking";

const AdminDataContext = createContext(null);
export const makeId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

const activityType = (collection) => ({
  reservations: "booking", rooms: "cleaning", tasks: "cleaning", clients: "client",
  menu: "restaurant", orders: "restaurant", tables: "restaurant", restaurantBookings: "restaurant",
  events: "event", spaces: "event", eventRequests: "event",
  transactions: "payment", supplierInvoices: "payment", suppliers: "payment",
  maintenance: "maintenance", inventory: "inventory", movements: "inventory", rates: "settings",
  users: "settings", settings: "settings",
})[collection] || "booking";

export function AdminDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    getAdminData().then((result) => { if (active) setData(result); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (data) persistAdminData(data); }, [data]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const notify = (text, tone = "success") => setToast({ text, tone, id: Date.now() });
  const change = (updater, message, type = "booking") => {
    setData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (!message) return next;
      return { ...next, activity: [{ id: makeId("act"), type, text: message, detail: "Mise à jour par l'équipe", time: todayISO(), read: false }, ...next.activity].slice(0, 60) };
    });
    if (message) notify(message);
  };

  const saveRecord = (collection, record, message) => {
    const id = record.id || makeId(collection.slice(0, 3).toUpperCase());
    const item = { ...record, id };
    change((prev) => ({ ...prev, [collection]: prev[collection].some((r) => r.id === id)
      ? prev[collection].map((r) => r.id === id ? item : r)
      : [item, ...prev[collection]] }), message, activityType(collection));
    return id;
  };

  const updateRecord = (collection, id, patch, message) => {
    change((prev) => ({ ...prev, [collection]: prev[collection].map((r) => r.id === id ? { ...r, ...patch } : r) }), message, activityType(collection));
  };

  const deleteRecord = (collection, id, message) => change((prev) => ({ ...prev, [collection]: prev[collection].filter((r) => r.id !== id) }), message, activityType(collection));

  const saveClient = (record, message) => change((prev) => {
    const name = `${record.firstName} ${record.lastName}`;
    const bookingIds = new Set(prev.reservations.filter((r) => r.clientId === record.id).map((r) => r.id));
    return {
      ...prev,
      clients: prev.clients.some((c) => c.id === record.id) ? prev.clients.map((c) => c.id === record.id ? record : c) : [record, ...prev.clients],
      reservations: prev.reservations.map((r) => r.clientId === record.id ? { ...r, clientName: name } : r),
      transactions: prev.transactions.map((t) => bookingIds.has(t.bookingId) ? { ...t, client: name } : t),
    };
  }, message, "client");

  const saveReservation = (record, message) => change((prev) => {
    const old = prev.reservations.find((r) => r.id === record.id);
    const rooms = prev.rooms.map((room) => {
      if (old?.roomId !== record.roomId && room.id === old?.roomId && room.status === "reserved") return { ...room, status: "available" };
      if (room.id === record.roomId && room.status === "available" && ["confirmed", "pending"].includes(record.status)) return { ...room, status: "reserved" };
      return room;
    });
    // Paiements : on raisonne en "reste à payer" pour supporter les acomptes partiels.
    const paidTxs = prev.transactions.filter((t) => t.bookingId === record.id && t.type === "room" && t.amount > 0);
    const totalPaid = paidTxs.reduce((s, t) => s + t.amount, 0);
    let transactions = prev.transactions;
    let payment = record.payment;
    if (record.payment === "paid") {
      const remainder = Math.round(((record.amount || 0) - totalPaid) * 100) / 100;
      if (remainder > 0.009) {
        transactions = [{ id: makeId("TRX"), client: record.clientName, bookingId: record.id, type: "room", amount: remainder, method: "Carte bancaire", date: todayISO(), status: "completed", invoice: makeId("FAC") }, ...transactions];
      } else if (paidTxs.length === 1 && Math.abs(totalPaid - (record.amount || 0)) > 0.009 && totalPaid > 0) {
        // Montant modifié (dates/chambre) : on ajuste l'unique transaction plutôt que d'empiler.
        transactions = transactions.map((t) => t.id === paidTxs[0].id ? { ...t, client: record.clientName, amount: record.amount } : t);
      }
      payment = "paid";
    } else if (record.payment === "pending" || record.payment === "partial") {
      // On conserve l'historique des transactions : le statut réel est dérivé du reste à payer.
      payment = totalPaid <= 0 ? "pending" : totalPaid >= (record.amount || 0) - 0.009 ? "paid" : "partial";
    }
    const finalRecord = { ...record, payment };
    return { ...prev, rooms, transactions, reservations: old ? prev.reservations.map((r) => r.id === record.id ? finalRecord : r) : [finalRecord, ...prev.reservations] };
  }, message, "booking");

  const saveTask = (task, message) => change((prev) => ({
    ...prev,
    tasks: [task, ...prev.tasks],
    rooms: prev.rooms.map((r) => r.id === task.roomId ? {
      ...r, cleaning: task.status,
      status: task.status === "maintenance" ? "maintenance" : ["dirty", "cleaning"].includes(task.status) && r.status !== "occupied" ? "cleaning" : r.status,
    } : r),
  }), message, "cleaning");

  const setReservationStatus = (id, status) => {
    const labels = { confirmed: "confirmée", pending: "en attente", "checked-in": "check-in effectué", "checked-out": "check-out effectué", completed: "terminée", cancelled: "annulée", "no-show": "marquée no-show" };
    change((prev) => {
      const booking = prev.reservations.find((r) => r.id === id);
      if (!booking) return prev;
      let rooms = prev.rooms;
      let tasks = prev.tasks;
      let maintenance = prev.maintenance || [];
      if (booking.roomId) {
        if (status === "checked-in") rooms = rooms.map((r) => r.id === booking.roomId ? { ...r, status: "occupied" } : r);
        if (["checked-out", "completed"].includes(status)) {
          rooms = rooms.map((r) => r.id === booking.roomId ? { ...r, status: "cleaning", cleaning: "dirty" } : r);
          if (!prev.tasks.some((t) => t.roomId === booking.roomId && ["dirty","cleaning"].includes(t.status))) {
            tasks = [{ id: makeId("HK"), roomId: booking.roomId, room: booking.roomNumber, task: "Nettoyage après départ", assignee: "Non assigné", priority: "high", time: "Dès que possible", status: "dirty", notes: `Départ ${booking.clientName}` }, ...tasks];
          }
        }
        if (["cancelled","no-show"].includes(status)) {
          const another = prev.reservations.some((other) => other.id !== id && other.roomId === booking.roomId && ["pending", "confirmed", "checked-in"].includes(other.status) && other.checkOut >= todayISO());
          if (!another) rooms = rooms.map((r) => r.id === booking.roomId && r.status === "reserved" ? { ...r, status: "available" } : r);
        }
      }
      const clients = ["checked-out","completed"].includes(status) ? prev.clients.map((c) => c.id === booking.clientId ? { ...c, stays: c.stays + 1, spent: c.spent + (booking.payment === "paid" ? booking.amount : 0), lastStay: booking.checkOut } : c) : prev.clients;
      return { ...prev, rooms, tasks, maintenance, clients, reservations: prev.reservations.map((r) => r.id === id ? { ...r, status, history: [...(r.history || []), { at: todayISO(), text: `Statut : ${labels[status]}` }] } : r) };
    }, `Réservation ${id} ${labels[status]}`, ["cancelled","no-show"].includes(status) ? "cancel" : ["checked-in","checked-out","completed"].includes(status) ? "checkin" : "booking");
  };

  const setMaintenanceStatus = (id, status) => {
    change((prev) => {
      const item = (prev.maintenance || []).find((m) => m.id === id);
      const rooms = prev.rooms.map((r) => {
        if (r.id !== item?.roomId) return r;
        if (status === "resolved") {
          const upcoming = prev.reservations.some((b) => b.roomId === r.id && ["pending","confirmed"].includes(b.status) && b.checkOut >= todayISO());
          return { ...r, status: upcoming ? "reserved" : "available", cleaning: "inspected" };
        }
        return { ...r, status: "maintenance", cleaning: "maintenance" };
      });
      return { ...prev, rooms, maintenance: (prev.maintenance || []).map((m) => m.id === id ? { ...m, status } : m) };
    }, `Ticket maintenance ${id} : ${status}`, "maintenance");
  };

  const adjustStock = (itemId, delta, note, by = "Réception") => {
    change((prev) => ({
      ...prev,
      inventory: (prev.inventory || []).map((s) => s.id === itemId ? { ...s, qty: Math.max(0, s.qty + delta), updated: todayISO() } : s),
      movements: [{ id: makeId("MV"), itemId, type: delta >= 0 ? "in" : "out", qty: Math.abs(delta), date: todayISO(), by, note: note || "" }, ...(prev.movements || [])].slice(0, 100),
    }), `Stock ${itemId} ${delta >= 0 ? "+" : ""}${delta}`, "inventory");
  };

  const setTaskStatus = (id, status) => {
    change((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      const rooms = prev.rooms.map((r) => {
        if (r.id !== task?.roomId) return r;
        const upcomingBooking = prev.reservations.some((b) => b.roomId === r.id && ["pending", "confirmed"].includes(b.status) && b.checkOut >= todayISO());
        const roomStatus = status === "maintenance" ? "maintenance" :
          (status === "dirty" || status === "cleaning") && r.status !== "occupied" ? "cleaning" :
          (status === "clean" || status === "inspected") && ["cleaning", "maintenance"].includes(r.status) ? upcomingBooking ? "reserved" : "available" : r.status;
        return { ...r, status: roomStatus, cleaning: status };
      });
      return { ...prev, rooms, tasks: prev.tasks.map((t) => t.id === id ? { ...t, status } : t) };
    }, `Chambre ${data?.tasks.find((t) => t.id === id)?.room} : tâche mise à jour`, "cleaning");
  };

  const setOrderStatus = (id, status) => {
    change((prev) => {
      const order = prev.orders.find((o) => o.id === id);
      const finished = ["completed", "cancelled"].includes(status);
      return { ...prev,
        orders: prev.orders.map((o) => o.id === id ? { ...o, status } : o),
        tables: prev.tables.map((t) => t.id === order?.tableId ? { ...t, status: finished ? "available" : "occupied", currentOrderId: finished ? null : id } : t),
      };
    }, `Commande ${id} mise à jour`, "restaurant");
  };

  const refundTransaction = (id) => {
    change((prev) => {
      const tx = prev.transactions.find((t) => t.id === id);
      if (!tx || tx.status === "refunded" || tx.amount <= 0) return prev;
      return { ...prev,
        transactions: [
          { id: makeId("TRX"), client: tx.client, bookingId: tx.bookingId, type: "refund", amount: -tx.amount, method: tx.method, date: todayISO(), status: "completed", invoice: null },
          ...prev.transactions.map((t) => t.id === id ? { ...t, status: "refunded" } : t),
        ],
        reservations: prev.reservations.map((r) => r.id === tx.bookingId ? { ...r, payment: "refunded" } : r),
      };
    }, `Remboursement ${id} effectué`, "payment");
  };

  const recordClientPayment = (reservationId, amount, method = "Carte bancaire") => {
    change((prev) => {
      const booking = prev.reservations.find((r) => r.id === reservationId);
      if (!booking || booking.status === "cancelled") return prev;
      const alreadyPaid = prev.transactions
        .filter((t) => t.bookingId === reservationId && t.amount > 0 && t.status !== "cancelled")
        .reduce((s, t) => s + t.amount, 0);
      // Cas seed "paid" sans transaction : on complète seulement le reste.
      const effectivePaid = alreadyPaid > 0 || prev.transactions.some((t) => t.bookingId === reservationId)
        ? alreadyPaid
        : booking.payment === "paid" ? booking.amount : 0;
      const due = Math.max(0, Math.round(((booking.amount || 0) - effectivePaid) * 100) / 100);
      const value = Math.min(Math.max(0, +amount || 0), due);
      if (value <= 0) return prev;
      const txId = makeId("TRX");
      const newPaid = effectivePaid + value;
      const payment = newPaid >= (booking.amount || 0) - 0.009 ? "paid" : "partial";
      return {
        ...prev,
        transactions: [
          { id: txId, client: booking.clientName, bookingId: booking.id, type: "room", amount: Math.round(value * 100) / 100, method, date: todayISO(), status: "completed", invoice: makeId("FAC") },
          ...prev.transactions,
        ],
        reservations: prev.reservations.map((r) => r.id === reservationId
          ? { ...r, payment, history: [...(r.history || []), { at: todayISO(), text: `Paiement de ${value.toFixed(2)} € (${method})` }] }
          : r),
      };
    }, `Paiement enregistré pour ${reservationId}`, "payment");
  };

  const recordSupplierPayment = (invoiceId, amount, method = "Virement") => {
    change((prev) => {
      const inv = (prev.supplierInvoices || []).find((i) => i.id === invoiceId);
      if (!inv) return prev;
      const due = Math.max(0, Math.round(((inv.amount || 0) - (inv.paidAmount || 0)) * 100) / 100);
      const value = Math.min(Math.max(0, +amount || 0), due);
      if (value <= 0) return prev;
      return {
        ...prev,
        supplierInvoices: prev.supplierInvoices.map((i) => i.id === invoiceId
          ? { ...i, paidAmount: Math.round(((i.paidAmount || 0) + value) * 100) / 100, method }
          : i),
        transactions: [
          { id: makeId("TRX"), client: inv.supplier, bookingId: null, supplierInvoiceId: inv.id, type: "expense", amount: -Math.round(value * 100) / 100, method, date: todayISO(), status: "completed", invoice: inv.number },
          ...prev.transactions,
        ],
      };
    }, `Règlement fournisseur ${invoiceId}`, "payment");
  };

  const saveSettings = (section, patch) => change((prev) => ({ ...prev, settings: { ...prev.settings, [section]: { ...prev.settings[section], ...patch } } }), "Paramètres enregistrés", "settings");
  const markNotificationsRead = () => setData((prev) => ({ ...prev, activity: prev.activity.map((a) => ({ ...a, read: true })) }));

  return <AdminDataContext.Provider value={{ data, loading: !data, toast, notify, saveRecord, updateRecord, deleteRecord, saveClient, saveReservation, saveTask, setReservationStatus, setMaintenanceStatus, adjustStock, setTaskStatus, setOrderStatus, refundTransaction, recordClientPayment, recordSupplierPayment, saveSettings, markNotificationsRead }} >{children}</AdminDataContext.Provider>;
}

export const useAdminData = () => useContext(AdminDataContext);