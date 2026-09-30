export const modules = [
  { key: "dashboard", label: "Dashboard" },
  { key: "reservations", label: "Réservations" },
  { key: "rooms", label: "Chambres" },
  { key: "clients", label: "Clients" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "maintenance", label: "Maintenance" },
  { key: "inventory", label: "Stocks" },
  { key: "restaurant", label: "Restaurant" },
  { key: "events", label: "Événements" },
  { key: "finance", label: "Finance" },
  { key: "invoices", label: "Factures" },
  { key: "reports", label: "Rapports" },
  { key: "users", label: "Utilisateurs" },
  { key: "notifications", label: "Notifications" },
  { key: "settings", label: "Paramètres" },
];

export const roles = [
  { key: "super-admin", label: "Super Admin", permissions: modules.map((m) => m.key) },
  { key: "admin", label: "Administrateur", permissions: modules.map((m) => m.key) },
  { key: "manager", label: "Manager", permissions: ["dashboard","reservations","rooms","clients","housekeeping","maintenance","inventory","restaurant","events","finance","invoices","reports","notifications"] },
  { key: "reception", label: "Réceptionniste", permissions: ["dashboard","reservations","rooms","clients","housekeeping","notifications"] },
  { key: "housekeeping", label: "Housekeeping", permissions: ["dashboard","rooms","housekeeping","maintenance","notifications"] },
  { key: "restaurant", label: "Responsable restaurant", permissions: ["dashboard","restaurant","inventory","notifications"] },
  { key: "events", label: "Responsable événements", permissions: ["dashboard","events","notifications"] },
  { key: "accounting", label: "Comptable", permissions: ["dashboard","finance","invoices","reports","notifications"] },
];

export const requiredPermissions = {
  "super-admin": modules.map((m) => m.key),
  admin: modules.map((m) => m.key),
  manager: ["dashboard","reservations","rooms","finance"],
  reception: ["dashboard","reservations"],
  housekeeping: ["dashboard","housekeeping"],
  restaurant: ["dashboard","restaurant"],
  events: ["dashboard","events"],
  accounting: ["dashboard","finance"],
};

export const seedUsers = [
  { id: "usr-1", name: "Élise Moreau", email: "admin@maison-aurele.com", role: "super-admin", status: "active", lastLogin: "Aujourd'hui" },
  { id: "usr-2", name: "Hélène Aurèle", email: "helene@maison-aurele.com", role: "admin", status: "active", lastLogin: "Hier" },
  { id: "usr-8", name: "Karim Haddad", email: "manager@maison-aurele.com", role: "manager", status: "active", lastLogin: "Aujourd'hui" },
  { id: "usr-3", name: "Thomas Bernard", email: "reception@maison-aurele.com", role: "reception", status: "active", lastLogin: "Aujourd'hui" },
  { id: "usr-4", name: "Sophie Bernard", email: "housekeeping@maison-aurele.com", role: "housekeeping", status: "active", lastLogin: "Aujourd'hui" },
  { id: "usr-5", name: "Antoine Lemaire", email: "restaurant@maison-aurele.com", role: "restaurant", status: "active", lastLogin: "Hier" },
  { id: "usr-6", name: "Inès Benali", email: "evenements@maison-aurele.com", role: "events", status: "active", lastLogin: "Il y a 2 jours" },
  { id: "usr-7", name: "Marc Delorme", email: "comptabilite@maison-aurele.com", role: "accounting", status: "active", lastLogin: "Il y a 3 jours" },
];

export const DEMO_PASSWORD = "Aurele2026!";
