import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Rooms from "./pages/Rooms";
import Housekeeping from "./pages/Housekeeping";
import Maintenance from "./pages/Maintenance";
import Inventory from "./pages/Inventory";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import Restaurant from "./pages/Restaurant";
import Events from "./pages/Events";
import Finance from "./pages/Finance";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

function RequireAuth() {
  const { user } = useAdminAuth();
  const location = useLocation();
  return user ? <Outlet/> : <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }}/>
}

function AdminRoutes() {
  return <Routes>
    <Route path="login" element={<Login/>}/>
    <Route element={<RequireAuth/>}>
      <Route element={<AdminDataProvider><AdminLayout/></AdminDataProvider>}>
        <Route index element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path="reservations" element={<Reservations/>}/>
        <Route path="rooms" element={<Rooms/>}/>
        <Route path="housekeeping" element={<Housekeeping/>}/>
        <Route path="maintenance" element={<Maintenance/>}/>
        <Route path="inventory" element={<Inventory/>}/>
        <Route path="clients" element={<Clients/>}/>
        <Route path="clients/:id" element={<ClientProfile/>}/>
        <Route path="restaurant" element={<Restaurant/>}/>
        <Route path="events" element={<Events/>}/>
        <Route path="finance" element={<Finance/>}/>
        <Route path="invoices" element={<Invoices/>}/>
        <Route path="reports" element={<Reports/>}/>
        <Route path="users" element={<Users/>}/>
        <Route path="notifications" element={<Notifications/>}/>
        <Route path="settings" element={<Settings key="full-settings"/>}/>
        <Route path="account" element={<Settings key="account-only" accountOnly/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/admin/dashboard" replace/>}/>
  </Routes>;
}

export default function AdminApp() {
  return <AdminAuthProvider><AdminRoutes/></AdminAuthProvider>;
}
