import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  setAuthTokens,
  clearAuth,
} from "../utils/auth";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(() => !!getAccessToken());

  const fetchMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.me();

      if (!response.ok) {
        clearAuth();
        setUser(null);
        setCompanies([]);
        setActiveCompany(null);
        return;
      }

      const data = await response.json();

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      const companyList = data.companies || [];
      setCompanies(companyList);

      const savedCompanyId = localStorage.getItem("activeCompanyId");
      const savedCompany = companyList.find(
        (c) => String(c.id) === savedCompanyId
      );
      setActiveCompany(savedCompany || companyList[0] || null);

    } catch (error) {
      console.error("fetchMe failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      fetchMe();
    }
  }, [fetchMe]);

  const login = useCallback(async ({ access, refresh, user: userData }) => {
    setAuthTokens({ access, refresh, user: userData });
    setUser(userData);
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await api.logout(refresh);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuth();
      localStorage.removeItem("activeCompanyId");
      setUser(null);
      setCompanies([]);
      setActiveCompany(null);
    }
  }, []);

  const switchCompany = useCallback((company) => {
    setActiveCompany(company);
    localStorage.setItem("activeCompanyId", String(company.id));
  }, []);

  const isAdmin = activeCompany?.role === "admin";
  const isAnalyst = activeCompany?.role === "analyst";
  const isAuthenticated = !!getAccessToken() && !!user;

  const value = {
    user,
    companies,
    activeCompany,
    loading,
    isAuthenticated,
    isAdmin,
    isAnalyst,
    login,
    logout,
    switchCompany,
    fetchMe,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}