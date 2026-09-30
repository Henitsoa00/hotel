import { createContext, useContext, useEffect, useState } from "react";

const BookingContext = createContext(null);
const KEY = "aurele_booking";

const initial = {
  stay: { checkIn: "", checkOut: "", adults: 2, children: 0, rooms: 1 },
  selectedRoomId: null,
  guest: { firstName: "", lastName: "", email: "", phone: "", country: "France", requests: "" },
  lastReservation: null,
};

export function BookingProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return { ...initial, ...JSON.parse(sessionStorage.getItem(KEY) || "{}") }; } catch { return initial; }
  });
  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  const value = {
    ...state,
    setStay: (patch) => setState((s) => ({ ...s, stay: { ...s.stay, ...patch } })),
    selectRoom: (id) => setState((s) => ({ ...s, selectedRoomId: id })),
    setGuest: (patch) => setState((s) => ({ ...s, guest: { ...s.guest, ...patch } })),
    setLastReservation: (r) => setState((s) => ({ ...s, lastReservation: r })),
    resetBooking: () => setState((s) => ({ ...initial, lastReservation: s.lastReservation })),
  };
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export const useBooking = () => useContext(BookingContext);
