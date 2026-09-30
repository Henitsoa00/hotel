// Couche service : remplacer les implémentations mockées par des appels fetch() vers l'API REST.
import { rooms } from "../data/rooms";
import { isRoomAvailable, calculatePrice } from "../utils/booking";

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const STORE = "aurele_reservations";
const readStore = () => JSON.parse(localStorage.getItem(STORE) || "{}");

// GET /api/rooms
export async function getRooms() { await delay(); return rooms; }

// GET /api/rooms/:id
export async function getRoomById(id) {
  await delay(300);
  const room = rooms.find((r) => String(r.id) === String(id));
  if (!room) throw new Error("Chambre introuvable");
  return room;
}

// GET /api/rooms/availability?checkIn&checkOut&guests
export async function checkAvailability({ checkIn, checkOut, guests = 1 }) {
  await delay();
  return rooms.map((r) => ({ ...r, isAvailable: isRoomAvailable(r, checkIn, checkOut), fits: r.capacity >= guests }));
}

// POST /api/reservations
export async function createReservation({ room, stay, guest }) {
  await delay(900);
  const id = "MA-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 90 + 10);
  const pricing = calculatePrice(room.price, stay.checkIn, stay.checkOut, stay.rooms);
  const reservation = { id, roomId: room.id, roomName: room.name, roomImage: room.images[0], stay, guest, pricing, createdAt: new Date().toISOString() };
  const s = readStore(); s[id] = reservation; localStorage.setItem(STORE, JSON.stringify(s));
  return reservation;
}

// GET /api/reservations/:id
export async function getReservation(id) { await delay(300); return readStore()[id] || null; }

// POST /api/contact
export async function sendContactMessage(data) { await delay(800); return { ok: true, data }; }
// POST /api/events
export async function requestEvent(data) { await delay(800); return { ok: true, ref: "EV-" + Math.floor(Math.random() * 90000 + 10000), data }; }
// POST /api/restaurant/reservation
export async function reserveRestaurantTable(data) { await delay(800); return { ok: true, ref: "RT-" + Math.floor(Math.random() * 90000 + 10000), data }; }
// POST /api/newsletter
export async function subscribeNewsletter(email) { await delay(500); return { ok: true, email }; }
