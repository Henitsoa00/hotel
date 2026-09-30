import { rooms as roomTypes } from "../../data/rooms";

// A room type on the public site can correspond to several physical rooms here.
const inventory = [
  ["201", 1, "available", "clean"], ["202", 1, "occupied", "clean"], ["203", 1, "available", "inspected"],
  ["204", 1, "cleaning", "dirty"], ["205", 1, "reserved", "clean"],
  ["301", 2, "occupied", "clean"], ["302", 2, "available", "clean"], ["303", 2, "reserved", "clean"],
  ["304", 2, "available", "inspected"], ["305", 2, "maintenance", "maintenance"],
  ["401", 3, "available", "clean"], ["402", 3, "occupied", "clean"], ["403", 3, "cleaning", "dirty"],
  ["501", 4, "reserved", "clean"], ["502", 4, "available", "clean"], ["503", 4, "occupied", "clean"],
  ["601", 5, "available", "clean"], ["602", 5, "reserved", "clean"],
  ["701", 6, "available", "inspected"], ["801", 7, "available", "clean"],
];

export const seedRooms = inventory.map(([number, typeId, status, cleaning]) => {
  const type = roomTypes.find((r) => r.id === typeId);
  return {
    id: `rm-${number}`, number, typeId, type: type.name, capacity: type.capacity,
    price: type.price, floor: Number(number[0]), status, cleaning,
    image: type.images[0], amenities: type.amenities, notes: "",
  };
});

export const seedTasks = [
  { id: "HK-101", roomId: "rm-204", room: "204", task: "Nettoyage après départ", assignee: "Sophie Bernard", priority: "high", time: "09:30", status: "dirty" },
  { id: "HK-102", roomId: "rm-403", room: "403", task: "Nettoyage complet", assignee: "Karim Diallo", priority: "high", time: "10:00", status: "cleaning" },
  { id: "HK-103", roomId: "rm-303", room: "303", task: "Préparation arrivée VIP", assignee: "Marie Petit", priority: "normal", time: "11:00", status: "clean" },
  { id: "HK-104", roomId: "rm-701", room: "701", task: "Inspection suite", assignee: "Sophie Bernard", priority: "normal", time: "12:30", status: "inspected" },
  { id: "HK-105", roomId: "rm-305", room: "305", task: "Contrôle climatisation", assignee: "Thomas Leroy", priority: "high", time: "14:00", status: "maintenance" },
  { id: "HK-106", roomId: "rm-202", room: "202", task: "Service de couverture", assignee: "Marie Petit", priority: "low", time: "18:00", status: "clean" },
];

export const housekeepers = ["Sophie Bernard", "Karim Diallo", "Marie Petit", "Thomas Leroy", "Non assigné"];