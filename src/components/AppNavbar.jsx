import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import gantraLogo from "../assets/gantra-logo.png";
import { Sun, Moon, Bell, LogOut } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

const NAV_LINKS = [
  { path: "/dashboard",  key: "navigation.home",       fallback: "الرئيسية"   },
  { path: "/posts",      key: "navigation.posts",      fallback: "المنشورات"  },
  { path: "/sentiment",  key: "navigation.sentiment",  fallback: "المشاعر"    },
  { path: "/topics",     key: "navigation.topics",     fallback: "المواضيع"   },
  { path: "/alerts",     key: "navigation.alerts",     fallback: "التنبيهات"  },
  { path: "/engagement", key: "navigation.engagement", fallback: "التفاعل"    },
  { path: "/feedback", key: "navigation.feedback", fallback: "ملاحظاتك" },
];

const ADMIN_LINKS = [
  { path: "/insights", key: "navigation.insights", fallback: "التقارير الذكية" },
  { path: "/surveys",  key: "navigation.surveys",  fallback: "الاستطلاعات" },
  { path: "/team",     key: "navigation.team",     fallback: "الفريق"      },
  { path: "/settings", key: "navigation.settings", fallback: "الإعدادات"   },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d     = new Date(dateStr);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const hour  = String(d.getHours()).padStart(2, "0");
  const min   = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

function buildAlertMessage(alert, t) {
  if (!alert.rule_type) {
    // fallback to stored message if rule_type missing
    return alert.message || t("alerts.notifications.messages.unknown", "تنبيه");
  }
  return t(`alerts.notifications.messages.${alert.rule_type}`, {
    threshold: alert.threshold ?? "",
    keyword:   alert.keyword   ?? "",
    value:     alert.threshold ?? "",
    // always provide a readable fallback
    defaultValue: alert.message || t("alerts.notifications.messages.unknown", "تنبيه"),
  });
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function AppNavbar() {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { t, i18n }    = useTranslation();
  const { activeCompany, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [unreadCount,  setUnreadCount]  = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDark = theme === "dark";

  const nav = {
    bg:           isDark ? "#0A0A0A"   : "#FAFAF8",
    border:       isDark ? "#C9A84C22" : "#C9A84C44",
    text:         isDark ? "#9CA3AF"   : "#6B7280",
    activeText:   "#C9A84C",
    activeBg:     isDark ? "#C9A84C14" : "#C9A84C18",
    adminText:    "#2E8B57",
    adminBg:      isDark ? "#2E8B5714" : "#2E8B5718",
    divider:      isDark ? "#1E1E1E"   : "#E5E7EB",
    iconBtn:      isDark ? "#1A1A1A"   : "#F0F0EC",
    iconBorder:   isDark ? "#2A2A2A"   : "#E0DDD5",
    iconColor:    isDark ? "#9CA3AF"   : "#6B7280",
    dropBg:       isDark ? "#111111"   : "#FFFFFF",
    dropBorder:   isDark ? "#1E1E1E"   : "#E5E7EB",
    dropText:     isDark ? "#E5E7EB"   : "#111111",
    dropMuted:    isDark ? "#6B7280"   : "#9CA3AF",
    selectBg:     isDark ? "#161616"   : "#F5F4F0",
    selectBorder: isDark ? "#2A2A2A"   : "#D5D2CA",
    selectText:   isDark ? "#E5E7EB"   : "#111111",
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
  };

  const fetchUnread = async () => {
    if (!activeCompany) return;
    try {
      const res  = await api.getUnreadCount(activeCompany.id);
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (_) {}
  };

  const fetchRecent = async () => {
    if (!activeCompany) return;
    try {
      const res  = await api.getAlerts(activeCompany.id);
      const data = await res.json();
      const sorted = [...data].sort((a, b) => a.is_read - b.is_read);
      setRecentAlerts(sorted.slice(0, 5));
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [activeCompany]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = async () => {
    if (!dropdownOpen) await fetchRecent();
    setDropdownOpen((v) => !v);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      dir="rtl"
      style={{
        position:       "sticky",
        top:            0,
        zIndex:         50,
        background:     nav.bg,
        borderBottom:   `1px solid ${nav.border}`,
        backdropFilter: "blur(14px)",
        transition:     "background 0.3s, border-color 0.3s",
      }}
    >
      <div
        style={{
          maxWidth:       "1400px",
          margin:         "0 auto",
          height:         "68px",
          padding:        "0 1.75rem",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            "1rem",
        }}
      >
        {/* ── LOGO ── */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            flexShrink: 0, display: "flex", alignItems: "center",
          }}
        >
          <img
            src={gantraLogo}
            alt="Gantra"
            style={{
              height: "48px",
              filter: isDark ? "none" : "brightness(0.85)",
              transition: "filter 0.3s",
            }}
          />
        </button>

        {/* ── NAV LINKS ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "2px",
          flex: 1, justifyContent: "center",
        }}>
          {NAV_LINKS.map((link) => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  position: "relative", padding: "6px 14px",
                  borderRadius: "10px", border: "none", cursor: "pointer",
                  fontSize: "0.84rem", fontWeight: active ? "700" : "500",
                  background: active ? nav.activeBg : "transparent",
                  color: active ? nav.activeText : nav.text,
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = nav.activeText; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = nav.text; }}
              >
                {t(link.key, link.fallback)}
                {active && (
                  <span style={{
                    position: "absolute", bottom: "3px", left: "50%",
                    transform: "translateX(-50%)", width: "4px", height: "4px",
                    borderRadius: "50%", background: "#C9A84C",
                  }} />
                )}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <span style={{
                width: "1px", height: "20px", background: nav.divider,
                margin: "0 6px", flexShrink: 0,
              }} />
              {ADMIN_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    style={{
                      position: "relative", padding: "6px 14px",
                      borderRadius: "10px", border: "none", cursor: "pointer",
                      fontSize: "0.84rem", fontWeight: active ? "700" : "500",
                      background: active ? nav.adminBg : "transparent",
                      color: active ? nav.adminText : nav.text,
                      transition: "all 0.2s", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = nav.adminText; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = nav.text; }}
                  >
                    {t(link.key, link.fallback)}
                    {active && (
                      <span style={{
                        position: "absolute", bottom: "3px", left: "50%",
                        transform: "translateX(-50%)", width: "4px", height: "4px",
                        borderRadius: "50%", background: "#2E8B57",
                      }} />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* ── RIGHT CONTROLS ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

          {/* LANGUAGE SELECT */}
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            value={i18n.language?.slice(0, 2)}
            style={{
              background: nav.selectBg, color: nav.selectText,
              border: `1px solid ${nav.selectBorder}`, borderRadius: "8px",
              padding: "5px 8px", fontSize: "0.78rem", fontWeight: "600",
              cursor: "pointer", outline: "none", transition: "all 0.2s",
              letterSpacing: "0.03em",
            }}
          >
            <option value="ar">AR</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light" : "Switch to dark"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "10px",
              border: `1px solid ${nav.iconBorder}`, background: nav.iconBtn,
              color: isDark ? "#C9A84C" : "#6B7280", cursor: "pointer",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* BELL */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "36px", height: "36px", borderRadius: "10px",
                border: `1px solid ${nav.iconBorder}`, background: nav.iconBtn,
                color: "#C9A84C", cursor: "pointer", position: "relative",
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", left: "-4px",
                  minWidth: "16px", height: "16px", borderRadius: "8px",
                  background: "#2E8B57", color: "#fff",
                  fontSize: "0.65rem", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px", border: `2px solid ${nav.bg}`,
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* BELL DROPDOWN */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", left: 0,
                minWidth: "300px", background: nav.dropBg,
                border: `1px solid ${nav.dropBorder}`, borderRadius: "14px",
                boxShadow: isDark
                  ? "0 20px 40px rgba(0,0,0,0.5)"
                  : "0 20px 40px rgba(0,0,0,0.12)",
                overflow: "hidden", zIndex: 100,
              }}>
                {/* Header */}
                <div style={{
                  padding: "12px 16px", borderBottom: `1px solid ${nav.dropBorder}`,
                  fontSize: "0.8rem", fontWeight: "700", color: "#C9A84C",
                }}>
                  {t("navigation.alerts", "التنبيهات")}
                </div>

                {/* Alert items */}
                {recentAlerts.length === 0 ? (
                  <div style={{
                    padding: "20px 16px", textAlign: "center",
                    color: nav.dropMuted, fontSize: "0.8rem",
                  }}>
                    {t("alerts.empty", "لا توجد تنبيهات")}
                  </div>
                ) : (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => { setDropdownOpen(false); navigate("/alerts"); }}
                      style={{
                        padding: "10px 16px",
                        borderBottom: `1px solid ${nav.dropBorder}`,
                        display: "flex", alignItems: "flex-start", gap: "8px",
                        cursor: "pointer", transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "#161616" : "#F8FAFC"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: alert.is_read ? nav.dropMuted : "#C9A84C",
                        marginTop: "5px", flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "0.78rem",
                          color: alert.is_read ? nav.dropMuted : nav.dropText,
                          fontWeight: alert.is_read ? "400" : "600",
                          margin: 0, lineHeight: "1.5",
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {buildAlertMessage(alert, t)}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: nav.dropMuted, margin: "3px 0 0" }}>
                          {formatDateTime(alert.triggered_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Footer */}
                <button
                  onClick={() => { setDropdownOpen(false); navigate("/alerts"); }}
                  style={{
                    width: "100%", padding: "10px", background: "transparent",
                    border: "none", color: "#C9A84C", fontSize: "0.78rem",
                    fontWeight: "600", cursor: "pointer", textAlign: "center",
                  }}
                >
                  {t("alerts.viewAll", "عرض الكل")}
                </button>
              </div>
            )}
          </div>

     {/* LOGOUT */}
<button
  onClick={handleLogout}
  title={t("navigation.logout", "خروج")}
  style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "36px", height: "36px", borderRadius: "10px",
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)", color: "#F87171",
    cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background  = "rgba(239,68,68,0.15)";
    e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background  = "rgba(239,68,68,0.08)";
    e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
  }}
>
  <LogOut size={15} />
</button>

        </div>
      </div>
    </nav>
  );
}