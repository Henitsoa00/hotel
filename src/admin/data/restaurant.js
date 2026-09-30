import { menu as publicMenu } from "../../data/restaurant";
import { todayISO } from "../../utils/booking";

export const seedMenu = publicMenu.map((item) => ({ ...item, available: item.id !== 3 && item.id !== 9 }));

export const seedTables = Array.from({ length: 12 }, (_, i) => ({
  id: `tb-${i + 1}`, number: String(i + 1).padStart(2, "0"),
  capacity: i < 4 ? 2 : i < 9 ? 4 : 6,
  status: ["occupied", "available", "occupied", "available", "occupied", "available", "available", "reserved", "available", "available", "available", "available"][i],
  currentOrderId: i === 0 ? "CMD-301" : i === 2 ? "CMD-303" : i === 4 ? "CMD-302" : null,
}));

export const seedOrders = [
  { id: "CMD-301", tableId: "tb-1", table: "01", client: "Camille Laurent", items: [{ id: 1, name: "Carpaccio de Saint-Jacques", quantity: 2, unitPrice: 24 }, { id: 5, name: "Filet de bœuf Rossini", quantity: 2, unitPrice: 46 }], amount: 140, time: "12:35", date: todayISO(), status: "preparing" },
  { id: "CMD-302", tableId: "tb-5", table: "05", client: "James Whitmore", items: [{ id: 4, name: "Filet de bar de ligne", quantity: 2, unitPrice: 38 }, { id: 10, name: "Champagne Brut – coupe", quantity: 2, unitPrice: 18 }], amount: 112, time: "12:50", date: todayISO(), status: "ready" },
  { id: "CMD-303", tableId: "tb-3", table: "03", client: "Sofia Moretti", items: [{ id: 6, name: "Risotto aux cèpes", quantity: 2, unitPrice: 32 }, { id: 8, name: "Tarte au chocolat grand cru", quantity: 2, unitPrice: 14 }], amount: 92, time: "13:10", date: todayISO(), status: "pending" },
  { id: "CMD-304", tableId: "tb-9", table: "09", client: "Chloé Martin", items: [{ id: 2, name: "Velouté de châtaigne", quantity: 2, unitPrice: 16 }, { id: 4, name: "Filet de bar de ligne", quantity: 2, unitPrice: 38 }], amount: 108, time: "12:15", date: todayISO(), status: "completed" },
  { id: "CMD-305", tableId: "tb-2", table: "02", client: "Emma Schneider", items: [{ id: 5, name: "Filet de bœuf Rossini", quantity: 2, unitPrice: 46 }], amount: 92, time: "11:55", date: todayISO(), status: "served" },
];