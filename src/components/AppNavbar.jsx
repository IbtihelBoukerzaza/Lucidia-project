import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

// ─── Logo ─────────────────────────────────────────────────────────────────────

function LogoSentivya() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-sky-500/60">
        <span className="absolute inset-[3px] rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-400 to-emerald-400 opacity-80" />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-slate-950">
          <path
            d="M3 13c2-4 4-6 8-6s6 2 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 17c1.2-1.6 2.4-2.4 4-2.4s2.8.8 4 2.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-50">
        Sentivya<span className="text-sky-300">DZ</span>
      </span>
    </div>
  );
}

// ─── Severity colors ──────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  high:   { dot: "bg-red-400",     text: "text-red-400"     },
  medium: { dot: "bg-amber-400",   text: "text-amber-400"   },
  low:    { dot: "bg-emerald-400", text: "text-emerald-400" },
};

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { path: "/dashboard", label: "الرئيسية" },
  { path: "/posts",     label: "المنشورات" },
  { path: "/sentiment", label: "المشاعر"   },
  { path: "/topics",    label: "المواضيع"  },
  { path: "/alerts",    label: "التنبيهات" },
];

const ADMIN_LINKS = [
  { path: "/team",     label: "الفريق"    },
  { path: "/settings", label: "الإعدادات" },
  { path: "/surveys", label: "الاستطلاعات" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AppNavbar() {
  const navigate             = useNavigate();
  const location             = useLocation();
  const { activeCompany, isAdmin, logout } = useAuth();

  const [unreadCount,  setUnreadCount]  = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Fetch unread count ───────────────────────────────────────────────
  const fetchUnread = async () => {
    if (!activeCompany) return;
    try {
      const res  = await api.getUnreadCount(activeCompany.id);
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (_) {}
  };

  // ── Fetch recent alerts for dropdown ────────────────────────────────
  const fetchRecent = async () => {
    if (!activeCompany) return;
    try {
      const res  = await api.getAlerts(activeCompany.id);
      const data = await res.json();
      // Show only last 5 unread first, then read
      const sorted = [...data].sort((a, b) => a.is_read - b.is_read);
      setRecentAlerts(sorted.slice(0, 5));
    } catch (_) {}
  };

  // Poll every 60 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [activeCompany]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = async () => {
    if (!dropdownOpen) await fetchRecent();
    setDropdownOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    if (!activeCompany) return;
    await api.markAllAlertsRead(activeCompany.id);
    setUnreadCount(0);
    setRecentAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const handleAlertClick = async (alert) => {
    if (!alert.is_read) {
      await api.markAlertRead(alert.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecentAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a))
      );
    }
    setDropdownOpen(false);
    navigate("/alerts");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="sticky top-0 z-50 border-b border-slate-800/70
                 bg-slate-950/90 backdrop-blur px-4 md:px-8"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between h-14 gap-4">

        {/* Logo */}
        <button onClick={() => navigate("/dashboard")} className="shrink-0">
          <LogoSentivya />
        </button>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(link.path)
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {link.label}
            </button>
          ))}
          {isAdmin &&
            ADMIN_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(link.path)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {link.label}
              </button>
            ))}
        </div>

        {/* Right side: company name + bell + logout */}
        <div className="flex items-center gap-3 shrink-0">
          {activeCompany && (
            <span className="hidden sm:block text-xs text-sky-400 font-medium">
              {activeCompany.name}
            </span>
          )}

          {/* Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="relative rounded-xl p-2 text-slate-400
                         hover:text-white hover:bg-slate-800 transition"
              title="الإشعارات"
            >
              {/* Bell icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6
                     6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006
                     11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6
                     0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {/* Badge */}
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 w-4
                             items-center justify-center rounded-full
                             bg-red-500 text-white text-[10px] font-bold"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-80 rounded-2xl border
                           border-slate-700 bg-slate-900 shadow-2xl
                           overflow-hidden z-50"
                dir="rtl"
              >
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-3
                                border-b border-slate-800">
                  <span className="text-sm font-semibold text-slate-100">
                    الإشعارات
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-sky-400 hover:text-sky-300 transition"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                {/* Alert list */}
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">
                    لا توجد إشعارات
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {recentAlerts.map((alert) => {
                      const style =
                        SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
                      const time = new Date(alert.triggered_at).toLocaleDateString(
                        "ar-DZ",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      );
                      return (
                        <button
                          key={alert.id}
                          onClick={() => handleAlertClick(alert)}
                          className={`w-full text-right px-4 py-3 hover:bg-slate-800/50
                                     transition flex gap-3 items-start
                                     ${!alert.is_read ? "bg-slate-800/30" : ""}`}
                        >
                          {/* Severity dot */}
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`}
                          />
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
                              {alert.message}
                            </p>
                            <p className="text-[11px] text-slate-500">{time}</p>
                          </div>
                          {!alert.is_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-slate-800 px-4 py-2.5">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/alerts"); }}
                    className="w-full text-center text-xs text-sky-400
                               hover:text-sky-300 transition"
                  >
                    عرض كل الإشعارات ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5
                       text-xs text-slate-400 hover:text-white
                       hover:border-slate-500 transition"
          >
            خروج
          </button>
        </div>

      </div>
    </nav>
  );
}