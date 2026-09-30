import { addDaysISO } from "../../utils/booking";

const people = [
  ["Camille", "Laurent", "camille.laurent@email.fr", "+33 6 12 34 56 78", "France", 8, 6240, "vip", -18],
  ["James", "Whitmore", "j.whitmore@email.co.uk", "+44 7700 900 153", "Royaume-Uni", 5, 4150, "vip", -32],
  ["Sofia", "Moretti", "sofia.moretti@email.it", "+39 348 123 4567", "Italie", 4, 3280, "vip", -55],
  ["Martin", "Dubois", "martin.dubois@email.fr", "+33 6 78 90 12 34", "France", 3, 1460, "regular", -42],
  ["Emma", "Schneider", "emma.schneider@email.de", "+49 170 1234567", "Allemagne", 2, 980, "regular", -90],
  ["Youssef", "Benali", "youssef.benali@email.ma", "+212 612 345 678", "Maroc", 1, 760, "regular", -74],
  ["Chloé", "Martin", "chloe.martin@email.fr", "+33 6 23 45 67 89", "France", 6, 3820, "vip", -11],
  ["Oliver", "Bennett", "o.bennett@email.co.uk", "+44 7700 900 245", "Royaume-Uni", 1, 570, "new", -5],
  ["Léa", "Rousseau", "lea.rousseau@email.fr", "+33 6 34 56 78 90", "France", 2, 1120, "regular", -21],
  ["Isabella", "Garcia", "isabella.garcia@email.es", "+34 612 345 678", "Espagne", 3, 2340, "regular", -61],
  ["Noah", "Lefebvre", "noah.lefebvre@email.fr", "+33 6 45 67 89 01", "France", 1, 380, "new", -3],
  ["Amira", "Haddad", "amira.haddad@email.fr", "+33 6 56 78 90 12", "France", 4, 2890, "vip", -46],
  ["Lucas", "Petit", "lucas.petit@email.fr", "+33 6 67 89 01 23", "France", 2, 910, "regular", -83],
  ["Mia", "Johnson", "mia.johnson@email.com", "+1 212 555 0148", "États-Unis", 1, 840, "new", -12],
  ["Gabriel", "Mercier", "gabriel.mercier@email.fr", "+33 6 89 01 23 45", "France", 3, 1790, "regular", -27],
  ["Nina", "Kowalski", "nina.kowalski@email.pl", "+48 501 234 567", "Pologne", 1, 420, "new", -6],
];

export const seedClients = people.map(([firstName, lastName, email, phone, country, stays, spent, status, last], i) => ({
  id: `cl-${String(i + 1).padStart(3, "0")}`, firstName, lastName, email, phone, country,
  stays, spent, status, lastStay: addDaysISO(undefined, last),
  preferences: i % 3 === 0 ? "Chambre calme, étage élevé" : i % 3 === 1 ? "Oreillers hypoallergéniques" : "",
  notes: i === 0 ? "Cliente fidèle. Accueil personnalisé souhaité." : "",
}));