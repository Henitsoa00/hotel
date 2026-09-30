import { addDaysISO, todayISO } from "../../utils/booking";

export const seedMaintenance = [
  { id: "MT-01", roomId: "rm-305", room: "305", title: "Climatisation bruyante", equipment: "Climatisation", priority: "high", assignee: "Thomas Leroy", cost: 180, date: addDaysISO(undefined, -2), status: "in-progress", notes: "Pièce commandée, intervention prévue demain." },
  { id: "MT-02", roomId: "rm-204", room: "204", title: "Robinet qui fuit", equipment: "Plomberie", priority: "normal", date: addDaysISO(undefined, -1), assignee: "Karim Haddad", cost: 65, status: "open", notes: "" },
  { id: "MT-03", roomId: "rm-402", room: "402", title: "Ampoule salon HS", equipment: "Électricité", priority: "low", date: todayISO(), assignee: "Non assigné", cost: 12, status: "open", notes: "" },
  { id: "MT-04", roomId: "rm-701", room: "701", title: "Joint douche à refaire", equipment: "Salle de bain", priority: "normal", date: addDaysISO(undefined, -6), assignee: "Thomas Leroy", cost: 90, status: "resolved", notes: "Vérifié par l'inspection." },
];

export const seedInventory = [
  { id: "ST-01", name: "Croissants au beurre", category: "Nourriture", qty: 120, min: 60, unit: "pièces", supplier: "Saveurs d'Île-de-France", cost: 0.9, updated: todayISO() },
  { id: "ST-02", name: "Champagne Brut Réserve", category: "Boissons", qty: 48, min: 24, unit: "bouteilles", supplier: "Cave Aurèle", cost: 22, updated: todayISO() },
  { id: "ST-03", name: "Gel douche Verveine 50ml", category: "Toilette", qty: 18, min: 50, unit: "pièces", supplier: "Hygiène Pro Services", cost: 1.4, updated: addDaysISO(undefined, -1) },
  { id: "ST-04", name: "Draps King 300 fils", category: "Linge", qty: 80, min: 40, unit: "pièces", supplier: "Linge Prestige Paris", cost: 34, updated: addDaysISO(undefined, -2) },
  { id: "ST-05", name: "Produit sol éco", category: "Nettoyage", qty: 12, min: 15, unit: "bidons", supplier: "Hygiène Pro Services", cost: 8.5, updated: addDaysISO(undefined, -3) },
  { id: "ST-06", name: "Café arabica grains", category: "Nourriture", qty: 25, min: 10, unit: "kg", supplier: "Saveurs d'Île-de-France", cost: 18, updated: todayISO() },
  { id: "ST-07", name: "Serviettes piscine", category: "Linge", qty: 64, min: 30, unit: "pièces", supplier: "Linge Prestige Paris", cost: 12, updated: todayISO() },
  { id: "ST-08", name: "Eau minérale 50cl", category: "Boissons", qty: 200, min: 100, unit: "bouteilles", supplier: "Cave Aurèle", cost: 0.45, updated: todayISO() },
];

export const seedMovements = [
  { id: "MV-01", itemId: "ST-01", type: "out", qty: 40, date: todayISO(), by: "Restaurant", note: "Service petit-déjeuner" },
  { id: "MV-02", itemId: "ST-03", type: "in", qty: 60, date: addDaysISO(undefined, -2), by: "Réception", note: "Livraison Hygiène Pro" },
  { id: "MV-03", itemId: "ST-05", type: "out", qty: 4, date: addDaysISO(undefined, -1), by: "Housekeeping", note: "Étages 2-4" },
];

export const seedRates = [
  { id: "RT-1", typeId: 1, type: "Chambre Classique", standard: 150, low: 129, high: 189, weekend: 175, promo: 119, promoLabel: "Escapade Parisienne -20%", active: true },
  { id: "RT-2", typeId: 2, type: "Chambre Deluxe", standard: 190, low: 165, high: 239, weekend: 219, promo: 0, promoLabel: "", active: true },
  { id: "RT-3", typeId: 3, type: "Chambre Supérieure Famille", standard: 230, low: 199, high: 289, weekend: 259, promo: 0, promoLabel: "", active: true },
  { id: "RT-4", typeId: 4, type: "Suite Junior", standard: 280, low: 249, high: 349, weekend: 329, promo: 249, promoLabel: "Long séjour -11%", active: true },
  { id: "RT-5", typeId: 5, type: "Suite Executive", standard: 360, low: 319, high: 429, weekend: 399, promo: 0, promoLabel: "", active: true },
  { id: "RT-6", typeId: 6, type: "Suite Présidentielle", standard: 890, low: 790, high: 1090, weekend: 990, promo: 0, promoLabel: "", active: true },
  { id: "RT-7", typeId: 7, type: "Penthouse Aurèle", standard: 1200, low: 1090, high: 1450, weekend: 1350, promo: 0, promoLabel: "", active: true },
];

export const seedRestaurantBookings = [
  { id: "RTB-01", name: "Famille Laurent", phone: "+33 6 12 34 56 78", date: todayISO(), time: "19:30", guests: 4, table: "05", status: "confirmed", note: "Anniversaire — gâteau" },
  { id: "RTB-02", name: "James Whitmore", phone: "+44 7700 900 153", date: todayISO(), time: "20:00", guests: 2, table: "02", status: "pending", note: "" },
  { id: "RTB-03", name: "Groupe Armand", phone: "+33 1 42 00 12 34", date: addDaysISO(undefined, 1), time: "12:30", guests: 8, table: "09", status: "confirmed", note: "Déjeuner d'affaires" },
];

export const seedEventRequests = [
  { id: "EVR-01", name: "Claire Fontaine", email: "claire.f@email.fr", phone: "+33 6 11 22 33 44", type: "Mariage", date: addDaysISO(undefined, 40), guests: 120, budget: 15000, status: "pending", message: "Cérémonie + dîner dans la Grande Salle." },
  { id: "EVR-02", name: "Horizon Conseil", email: "events@horizon.fr", phone: "+33 1 55 66 77 88", type: "Séminaire", date: addDaysISO(undefined, 12), guests: 45, budget: 6000, status: "confirmed", message: "2 jours + hébergement 20 chambres." },
];
