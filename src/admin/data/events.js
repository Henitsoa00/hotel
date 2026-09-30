import { eventTypes, spaces } from "../../data/events";
import { addDaysISO } from "../../utils/booking";

export const seedSpaces = spaces.map((space, i) => ({
  id: `space-${i + 1}`, name: space.name, capacity: space.capacity, size: space.size,
  image: space.image, equipment: eventTypes[i]?.equipment || [], status: "available",
}));

export const seedEvents = [
  { id: "EV-5001", title: "Mariage Laurent & Perrin", type: "Mariages", client: "Famille Laurent", spaceId: "space-1", date: addDaysISO(undefined, 5), time: "17:00", guests: 180, package: "Prestige", price: 18500, status: "confirmed", notes: "Menu végétarien pour 12 convives." },
  { id: "EV-5002", title: "Séminaire Horizon", type: "Séminaires", client: "Horizon Conseil", spaceId: "space-2", date: addDaysISO(undefined, 2), time: "09:00", guests: 65, package: "Journée d'étude", price: 6400, status: "confirmed", notes: "Projection et visioconférence requises." },
  { id: "EV-5003", title: "Cocktail maison Bellamy", type: "Événements privés", client: "Maison Bellamy", spaceId: "space-4", date: addDaysISO(undefined, 12), time: "19:30", guests: 100, package: "Signature", price: 9200, status: "upcoming", notes: "" },
  { id: "EV-5004", title: "Comité de direction", type: "Réunions", client: "Groupe Armand", spaceId: "space-3", date: addDaysISO(undefined, 0), time: "10:00", guests: 16, package: "Business", price: 2100, status: "in-progress", notes: "Déjeuner servi à 12h45." },
  { id: "EV-5005", title: "Anniversaire de Sophie", type: "Anniversaires", client: "Sophie Mercier", spaceId: "space-3", date: addDaysISO(undefined, 20), time: "20:00", guests: 28, package: "Privé", price: 3200, status: "upcoming", notes: "" },
  { id: "EV-5006", title: "Conférence Architecture & Design", type: "Conférences", client: "Atelier AD", spaceId: "space-2", date: addDaysISO(undefined, -8), time: "09:30", guests: 140, package: "Conférence", price: 11800, status: "completed", notes: "" },
];

export const eventPackages = ["Prestige", "Journée d'étude", "Signature", "Business", "Privé", "Conférence", "Sur mesure"];