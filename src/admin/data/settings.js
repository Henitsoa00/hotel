import { HOTEL } from "../../utils/booking";

export const seedSettings = {
  hotel: { name: HOTEL.name, address: HOTEL.address, phone: HOTEL.phone, email: HOTEL.email, logo: "" },
  booking: { checkIn: "15:00", checkOut: "12:00", cancellation: "Annulation gratuite jusqu'à 48 heures avant l'arrivée." },
  payments: { currency: "EUR", taxRate: 10, card: true, transfer: true, cash: true },
  notifications: { bookings: true, checkIns: true, payments: true, housekeeping: false, restaurant: true, events: true },
};