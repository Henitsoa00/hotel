import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Restaurant from "./pages/Restaurant";
import Events from "./pages/Events";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Reservation from "./pages/Reservation";
import Confirmation from "./pages/Confirmation";
import AdminApp from "./admin/AdminApp";

function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  useEffect(() => { if (!location.hash) window.scrollTo(0, 0); }, [location.pathname]);
  return (
    <>
      {!isAdmin && <Navbar />}
      <main key={isAdmin ? "admin" : location.pathname} className={isAdmin ? "" : "animate-fade-in"}>
        <Routes location={location}>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Home />} />
          <Route path="/hebergements" element={<Rooms />} />
          <Route path="/hebergements/:id" element={<RoomDetails />} />
          <Route path="/restaurant" element={<Restaurant />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/reservation/confirmation" element={<Confirmation />} />
          <Route path="*" element={<div className="grid min-h-screen place-items-center text-center"><div><h1 className="font-serif text-6xl">404</h1><Link to="/" className="btn-dark mt-6">Accueil</Link></div></div>} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <HashRouter><Layout /></HashRouter>
    </BookingProvider>
  );
}
