export const TAX_RATE = 0.1;

export const HOTEL = {
  name: "Maison Aurèle",
  address: "12 Avenue Montaigne, 75008 Paris",
  phone: "+33 1 42 00 12 34",
  email: "contact@maison-aurele.com",
};

const toDate = (s) => (s ? new Date(s + "T00:00:00") : null);

export function calculateNights(checkIn, checkOut) {
  const a = toDate(checkIn), b = toDate(checkOut);
  if (!a || !b) return 0;
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : 0;
}

export function calculatePrice(pricePerNight, checkIn, checkOut, roomsCount = 1) {
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = pricePerNight * nights * roomsCount;
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { pricePerNight, nights, roomsCount, subtotal, taxes, total: subtotal + taxes };
}

export const formatPrice = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);

export const formatDate = (s, opts = { weekday: "short", day: "numeric", month: "long", year: "numeric" }) =>
  s ? toDate(s).toLocaleDateString("fr-FR", opts) : "—";

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDaysISO = (s, n) => {
  const d = toDate(s || todayISO());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function validateStay({ checkIn, checkOut, adults, children }) {
  const errors = {};
  if (!checkIn) errors.checkIn = "Veuillez choisir une date d'arrivée.";
  else if (checkIn < todayISO()) errors.checkIn = "La date d'arrivée ne peut pas être passée.";
  if (!checkOut) errors.checkOut = "Veuillez choisir une date de départ.";
  else if (checkIn && checkOut <= checkIn) errors.checkOut = "Le départ doit être après l'arrivée.";
  if (adults < 1) errors.guests = "Au moins un adulte est requis.";
  if (adults + children > 8) errors.guests = "Maximum 8 voyageurs par réservation.";
  return errors;
}

export function isRoomAvailable(room, checkIn, checkOut) {
  if (!room.available) return false;
  if (!checkIn || !checkOut) return true;
  return !room.bookedRanges.some(([s, e]) => checkIn < e && checkOut > s);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{7,}$/;
export const isEmail = (v) => EMAIL_RE.test(v.trim());
export const isPhone = (v) => PHONE_RE.test(v.trim());

export function validateFields(values, rules) {
  const errors = {};
  for (const [k, r] of Object.entries(rules)) {
    const v = (values[k] ?? "").toString();
    if (r.required && !v.trim()) errors[k] = "Ce champ est obligatoire.";
    else if (r.email && v && !isEmail(v)) errors[k] = "Adresse email invalide.";
    else if (r.phone && v && !isPhone(v)) errors[k] = "Numéro de téléphone invalide.";
    else if (r.min && v.trim().length < r.min) errors[k] = `Minimum ${r.min} caractères.`;
  }
  return errors;
}
