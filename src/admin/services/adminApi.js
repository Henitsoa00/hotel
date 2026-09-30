import { rooms as publicRoomTypes } from "../../data/rooms";
import { seedRooms, seedTasks } from "../data/rooms";
import { seedClients } from "../data/clients";
import { seedReservations, seedActivity } from "../data/reservations";
import { seedMenu, seedOrders, seedTables } from "../data/restaurant";
import { seedEvents, seedSpaces } from "../data/events";
import { seedTransactions } from "../data/transactions";
import { seedUsers, DEMO_PASSWORD } from "../data/users";
import { seedSettings } from "../data/settings";
import { seedSuppliers, seedSupplierInvoices } from "../data/suppliers";
import { seedMaintenance, seedInventory, seedMovements, seedRates, seedRestaurantBookings, seedEventRequests } from "../data/operations";

// API seam for a future Node/Express service: /api/admin/auth/login and
// /api/admin/{reservations,rooms,clients,tasks,orders,events,transactions,users,settings}.
// Keep JWT/token handling here; the pages consume only the data/auth contexts.
const DATA_KEY = "aurele_admin_data_v1";
const PASSWORD_KEY = "aurele_admin_demo_passwords";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}

export function getSeedData() {
  return {
    rooms: seedRooms, reservations: seedReservations, clients: seedClients, tasks: seedTasks,
    menu: seedMenu, orders: seedOrders, tables: seedTables, restaurantBookings: seedRestaurantBookings,
    events: seedEvents, spaces: seedSpaces, eventRequests: seedEventRequests,
    transactions: seedTransactions, users: seedUsers, settings: seedSettings, activity: seedActivity,
    suppliers: seedSuppliers, supplierInvoices: seedSupplierInvoices,
    maintenance: seedMaintenance, inventory: seedInventory, movements: seedMovements, rates: seedRates,
  };
}

// GET /api/admin/overview (future). Public bookings are merged rather than replacing admin records.
export async function getAdminData() {
  await delay(420);
  const seed = getSeedData();
  const stored = read(DATA_KEY, {});
  const state = { ...seed, ...stored };
  // Migration douce : garantit les nouvelles collections même avec un snapshot v1 en local.
  for (const k of ["suppliers","supplierInvoices","transactions","reservations","maintenance","inventory","movements","rates","restaurantBookings","eventRequests","tasks","rooms","clients","orders","tables","events","spaces","users"]) {
    if (!Array.isArray(state[k])) state[k] = seed[k];
  }
  if (!state.settings) state.settings = seed.settings;
  if (!Array.isArray(state.activity)) state.activity = seed.activity;
  const publicBookings = read("aurele_reservations", {});
  for (const booking of Object.values(publicBookings)) {
    if (state.reservations.some((r) => r.id === booking.id)) continue;
    const type = publicRoomTypes.find((r) => r.id === booking.roomId);
    const clientId = `cl-web-${booking.id}`;
    if (!state.clients.some((c) => c.email?.toLowerCase() === booking.guest.email?.toLowerCase())) {
      state.clients = [{
        id: clientId, firstName: booking.guest.firstName, lastName: booking.guest.lastName,
        email: booking.guest.email, phone: booking.guest.phone, country: booking.guest.country,
        stays: 0, spent: 0, status: "new", lastStay: "",
        preferences: "", notes: booking.guest.requests || "",
      }, ...state.clients];
    }
    const client = state.clients.find((c) => c.email?.toLowerCase() === booking.guest.email?.toLowerCase());
    state.reservations = [{
      id: booking.id, clientId: client?.id || clientId,
      clientName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      roomId: null, roomNumber: "À attribuer", roomType: type?.name || booking.roomName,
      checkIn: booking.stay.checkIn, checkOut: booking.stay.checkOut,
      guests: booking.stay.adults + booking.stay.children, amount: booking.pricing.total,
      payment: "pending", status: "confirmed", services: [],
      notes: booking.guest.requests || "", createdAt: booking.createdAt?.slice(0, 10) || booking.stay.checkIn,
      history: [{ at: booking.createdAt?.slice(0, 10), text: "Réservation effectuée en ligne" }],
    }, ...state.reservations];
    state.activity = [{ id: `act-web-${booking.id}`, type: "booking", text: `Nouvelle réservation ${booking.id}`, detail: "Depuis le site public", time: booking.createdAt?.slice(0, 10) }, ...state.activity];
  }
  return state;
}

// PUT /api/admin/... (future). One local snapshot keeps modules in sync in this frontend demo.
export function persistAdminData(data) { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }

// POST /api/admin/auth/login (future). Client-side demo auth is NOT a security boundary.
export async function loginAdmin(email, password) {
  await delay(650);
  const data = read(DATA_KEY, {});
  const user = (data.users || seedUsers).find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  const passwords = read(PASSWORD_KEY, {});
  if (!user || user.status !== "active" || password !== (passwords[user.id] || DEMO_PASSWORD)) {
    throw new Error("Identifiants incorrects ou compte désactivé.");
  }
  return user;
}

export function updateMockPassword(userId, password) {
  const passwords = read(PASSWORD_KEY, {});
  persistPassword({ ...passwords, [userId]: password });
}

function persistPassword(passwords) { localStorage.setItem(PASSWORD_KEY, JSON.stringify(passwords)); }