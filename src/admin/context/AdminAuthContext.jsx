import { createContext, useContext, useState } from "react";
import { loginAdmin } from "../services/adminApi";
import { roles, requiredPermissions } from "../data/users";

const AdminAuthContext = createContext(null);
const SESSION = "aurele_admin_session";
const ROLES_KEY = "aurele_admin_role_rules";

function readUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION) || "null"); }
  catch { return null; }
}

function readRoles() {
  try {
    const saved = JSON.parse(localStorage.getItem(ROLES_KEY) || "null");
    if (!saved) return roles;
    return roles.map((role) => ({ ...role, permissions: [...new Set([...(requiredPermissions[role.key] || []), ...(saved.find((r) => r.key === role.key)?.permissions || role.permissions)])] }));
  }
  catch { return roles; }
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [roleRules, setRoleRules] = useState(readRoles);

  const login = async (email, password, remember) => {
    const found = await loginAdmin(email, password);
    const store = remember ? localStorage : sessionStorage;
    localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
    store.setItem(SESSION, JSON.stringify(found));
    setUser(found);
    return found;
  };

  const logout = () => {
    localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
    setUser(null);
  };

  const syncUser = (updated) => {
    if (updated.id !== user?.id) return;
    setUser(updated);
    const store = localStorage.getItem(SESSION) ? localStorage : sessionStorage;
    store.setItem(SESSION, JSON.stringify(updated));
  };

  const setRolePermissions = (roleKey, permissions) => {
    if (roleKey === "super-admin") return;
    setRoleRules((current) => {
      const next = current.map((r) => r.key === roleKey ? { ...r, permissions: [...new Set([...(requiredPermissions[roleKey] || []), ...permissions])] } : r);
      localStorage.setItem(ROLES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const can = (module) => !!user && (roleRules.find((r) => r.key === user.role)?.permissions.includes(module) || false);
  return <AdminAuthContext.Provider value={{ user, login, logout, syncUser, can, roleRules, setRolePermissions }} >{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);