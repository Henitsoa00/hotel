import { addDaysISO, calculatePrice, todayISO } from "../../utils/booking";
import { seedRooms } from "./rooms";
import { seedClients } from "./clients";

// Offsets keep the operational dashboard useful regardless of the day it is opened.
const bookings = [
  [0, "501", 0, 3, "confirmed", "paid", 2], [3, "302", 0, 2, "confirmed", "pending", 2],
  [6, "301", -2, 4, "checked-in", "paid", 2], [1, "202", -1, 3, "checked-in", "paid", 1],
  [2, "503", -4, 4, "checked-in", "paid", 2], [4, "402", -3, 3, "checked-in", "paid", 2],
  [5, "303", 2, 3, "confirmed", "paid", 2], [7, "602", 4, 2, "pending", "pending", 2],
  [8, "201", 5, 4, "confirmed", "paid", 2], [9, "701", 7, 3, "confirmed", "pending", 2],
  [10, "304", -8, 2, "checked-out", "paid", 1], [11, "801", -12, 4, "checked-out", "paid", 3],
  [12, "203", -6, 2, "checked-out", "paid", 2], [13, "502", 12, 5, "confirmed", "paid", 2],
  [14, "401", 14, 3, "pending", "pending", 3], [15, "205", 10, 2, "confirmed", "paid", 2],
  [3, "204", -15, 2, "cancelled", "refunded", 2], [1, "601", 18, 3, "confirmed", "paid", 2],
  [0, "502", 22, 2, "pending", "pending", 2], [8, "303", -21, 2, "checked-out", "paid", 2],
];

export const seedReservations = bookings.map(([clientIdx, number, offset, nights, status, payment, guests], i) => {
  const client = seedClients[clientIdx];
  const room = seedRooms.find((r) => r.number === number) || seedRooms[18];
  const checkIn = addDaysISO(undefined, offset);
  const checkOut = addDaysISO(checkIn, nights);
  return {
    id: `MA-${String(2401 + i)}`, clientId: client.id, clientName: `${client.firstName} ${client.lastName}`,
    roomId: room.id, roomNumber: room.number, roomType: room.type,
    checkIn, checkOut, guests, amount: calculatePrice(room.price, checkIn, checkOut).total,
    payment, status, services: i % 3 === 0 ? ["Petit-déjeuner", "Spa"] : i % 3 === 1 ? ["Petit-déjeuner"] : [],
    notes: i === 0 ? "Arrivée tardive. Préparer l'accueil VIP." : "",
    createdAt: addDaysISO(undefined, Math.min(offset - 8, -1)),
    history: [{ at: addDaysISO(undefined, Math.min(offset - 8, -1)), text: "Réservation créée" }],
  };
});

export const seedActivity = [
  { id: "act-1", type: "booking", text: "Nouvelle réservation MA-2401", time: todayISO(), detail: "Camille Laurent · Suite Junior" },
  { id: "act-2", type: "payment", text: "Paiement reçu", time: todayISO(), detail: "MA-2405 · Carte bancaire" },
  { id: "act-3", type: "cleaning", text: "Chambre 701 inspectée", time: todayISO(), detail: "Sophie Bernard" },
  { id: "act-4", type: "client", text: "Nouveau client enregistré", time: addDaysISO(undefined, -1), detail: "Nina Kowalski" },
  { id: "act-5", type: "cancel", text: "Réservation annulée", time: addDaysISO(undefined, -1), detail: "MA-2417" },
];