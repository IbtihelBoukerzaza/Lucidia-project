import { motion } from "framer-motion";
import {
  MessageSquareText,
  HeartPulse,
  BellRing,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  LogOut,
  Sparkles,
  Activity,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ─────────────────────────────────────────
   CARD CONFIG — one place to change colors
───────────────────────────────────────── */
const CARDS = [
  {
    path:       "/posts",
    key:        "posts",
    icon:       MessageSquareText,
    /* Steel blue — data / information */
    color:      "#4A90D9",
    colorDim:   "#4A90D910",
    colorBorder:"#4A90D930",
    colorGlow:  "#4A90D920",
  },
  {
    path:       "/sentiment",
    key:        "sentiment",
    icon:       HeartPulse,
    /* Emerald — matches "positive sentiment" brand color */
    color:      "#2E8B57",
    colorDim:   "#2E8B5710",
    colorBorder:"#2E8B5730",
    colorGlow:  "#2E8B5720",
  },
  {
    path:       "/topics",
    key:        "topics",
    icon:       TrendingUp,
    /* Amber / warm gold variant — distinct from primary gold */
    color:      "#F59E0B",
    colorDim:   "#F59E0B10",
    colorBorder:"#F59E0B30",
    colorGlow:  "#F59E0B20",
  },
  {
    path:       "/alerts",
    key:        "alerts",
    icon:       BellRing,
    /* Rose red — danger / warnings */
    color:      "#E53E3E",
    colorDim:   "#E53E3E10",
    colorBorder:"#E53E3E30",
    colorGlow:  "#E53E3E20",
  },
  {
    path:       "/engagement",
    key:        "engagement",
    icon:       Activity,
    /* Violet / purple — engagement metrics */
    color:      "#8B5CF6",
    colorDim:   "#8B5CF610",
    colorBorder:"#8B5CF630",
    colorGlow:  "#8B5CF620",
  },
];

const ADMIN_CARDS = [
  {
    path:       "/team",
    key:        "team",
    icon:       Users,
    color:      "#4A90D9",
    colorDim:   "#4A90D910",
    colorBorder:"#4A90D930",
    colorGlow:  "#4A90D920",
  },
  {
    path:       "/settings",
    key:        "settings",
    icon:       Settings,
    /* Primary brand gold */
    color:      "#C9A84C",
    colorDim:   "#C9A84C10",
    colorBorder:"#C9A84C30",
    colorGlow:  "#C9A84C20",
  },
  {
    path:       "/surveys",
    key:        "surveys",
    icon:       ClipboardList,
    color:      "#2E8B57",
    colorDim:   "#2E8B5710",
    colorBorder:"#2E8B5730",
    colorGlow:  "#2E8B5720",
  },
];

/* ─────────────────────────────────────────
   DASHBOARD CARD
───────────────────────────────────────── */
function DashboardCard({ card, isDark, t, onClick }) {
  const Icon = card.icon;

  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        position:     "relative",
        overflow:     "hidden",
        borderRadius: "20px",
        border:       `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        background:   isDark ? "#111111" : "#FFFFFF",
        padding:      "1.5rem",
        textAlign:    "right",
        cursor:       "pointer",
        width:        "100%",
        transition:   "border-color 0.25s, box-shadow 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = card.colorBorder;
        e.currentTarget.style.boxShadow   = `0 8px 32px ${card.colorGlow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? "#1E1E1E" : "#E5E7EB";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      {/* top color bar */}
      <div
        style={{
          position:   "absolute",
          insetInlineStart: 0,
          insetInlineEnd:   0,
          top:        0,
          height:     "3px",
          background: card.color,
          borderRadius: "3px 3px 0 0",
        }}
      />

      {/* background blob */}
      <div
        style={{
          position:     "absolute",
          top:          "-20px",
          left:         "-20px",
          width:        "100px",
          height:       "100px",
          borderRadius: "50%",
          background:   card.color,
          opacity:      0.04,
          filter:       "blur(24px)",
          pointerEvents:"none",
        }}
      />

      {/* icon badge */}
      <div
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          "48px",
          height:         "48px",
          borderRadius:   "14px",
          background:     card.colorDim,
          border:         `1px solid ${card.colorBorder}`,
          color:          card.color,
          marginBottom:   "1rem",
        }}
      >
        <Icon size={22} />
      </div>

      {/* label */}
      <p
        style={{
          fontSize:   "0.75rem",
          fontWeight: "600",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:      isDark ? "#6B7280" : "#9CA3AF",
          margin:     "0 0 6px",
        }}
      >
        {t(`dashboard.${card.key}`, card.key)}
      </p>

      {/* heading */}
      <h3
        style={{
          fontSize:   "1.35rem",
          fontWeight: "800",
          color:      card.color,
          margin:     "0 0 8px",
        }}
      >
        {t(`dashboard.${card.key}Heading`, t(`dashboard.${card.key}`, card.key))}
      </h3>

      {/* description */}
      <p
        style={{
          fontSize:   "0.78rem",
          lineHeight: "1.6",
          color:      isDark ? "#6B7280" : "#9CA3AF",
          margin:     0,
        }}
      >
        {t(`dashboard.${card.key}Desc`, "—")}
      </p>

      {/* arrow hint */}
      <div
        style={{
          position: "absolute",
          bottom:   "1.25rem",
          left:     "1.25rem",
          fontSize: "1rem",
          color:    card.colorBorder,
        }}
      >
        ←
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, activeCompany, isAdmin, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight:  "100vh",
        background: isDark ? "var(--bg, #0A0A0A)" : "#F7F6F2",
        color:      isDark ? "#E5E7EB" : "#111111",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ─── HERO ─── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position:     "relative",
            overflow:     "hidden",
            borderRadius: "28px",
            border:       `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
            background:   isDark ? "#111111" : "#FFFFFF",
            padding:      "2rem 2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* ambient blobs */}
          <div style={{
            position: "absolute", left: "-60px", top: "-60px",
            width: "220px", height: "220px", borderRadius: "50%",
            background: "#C9A84C", opacity: 0.04, filter: "blur(48px)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: "-60px", bottom: "-60px",
            width: "220px", height: "220px", borderRadius: "50%",
            background: "#4A90D9", opacity: 0.04, filter: "blur(48px)",
            pointerEvents: "none",
          }} />

          <div
            style={{
              position:       "relative",
              zIndex:         1,
              display:        "flex",
              flexWrap:       "wrap",
              gap:            "1.5rem",
              alignItems:     "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ textAlign: "right" }}>
              {/* brand badge */}
              <div
                style={{
                  display:      "inline-flex",
                  alignItems:   "center",
                  gap:          "6px",
                  padding:      "5px 14px",
                  borderRadius: "99px",
                  border:       `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
                  background:   isDark ? "#C9A84C0D" : "#C9A84C10",
                  color:        "#C9A84C",
                  fontSize:     "0.78rem",
                  fontWeight:   "600",
                  marginBottom: "1rem",
                }}
              >
                <Sparkles size={13} />
                {t("dashboard.brand", "GANTRA Analytics")}
              </div>

              <h1
                style={{
                  fontSize:     "2rem",
                  fontWeight:   "900",
                  lineHeight:   "1.2",
                  margin:       "0 0 0.75rem",
                  letterSpacing:"-0.02em",
                }}
              >
                {t("dashboard.title", "لوحة التحكم")}
              </h1>

              <p style={{ fontSize: "0.88rem", lineHeight: "1.75", color: isDark ? "#6B7280" : "#9CA3AF", margin: 0 }}>
                {t("dashboard.welcome", "مرحباً،")}{" "}
                <span style={{ color: "#C9A84C", fontWeight: "700" }}>
                  {user?.first_name || user?.email}
                </span>{" "}
                {t("dashboard.subtitle", "— منصة GANTRA لرصد وتحليل المشاعر")}
              </p>

              {/* company + role pills */}
              {activeCompany && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "1rem" }}>
                  <span
                    style={{
                      padding:      "5px 14px",
                      borderRadius: "99px",
                      background:   isDark ? "#C9A84C0D" : "#C9A84C10",
                      border:       "1px solid #C9A84C30",
                      color:        "#C9A84C",
                      fontSize:     "0.8rem",
                      fontWeight:   "700",
                    }}
                  >
                    {activeCompany.name}
                  </span>
                  <span
                    style={{
                      padding:      "5px 14px",
                      borderRadius: "99px",
                      background:   isAdmin
                        ? "rgba(46,139,87,0.1)"
                        : "rgba(107,114,128,0.1)",
                      border: isAdmin
                        ? "1px solid rgba(46,139,87,0.3)"
                        : "1px solid rgba(107,114,128,0.3)",
                      color: isAdmin ? "#2E8B57" : "#9CA3AF",
                      fontSize:     "0.8rem",
                      fontWeight:   "700",
                    }}
                  >
                    {isAdmin ? t("dashboard.admin", "مدير") : t("dashboard.analyst", "محلل")}
                  </span>
                </div>
              )}
            </div>

            {/* logout */}
            <button
              onClick={handleLogout}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "8px",
                padding:      "10px 20px",
                borderRadius: "14px",
                border:       "1px solid rgba(239,68,68,0.2)",
                background:   "rgba(239,68,68,0.08)",
                color:        "#F87171",
                cursor:       "pointer",
                fontSize:     "0.85rem",
                fontWeight:   "600",
                transition:   "all 0.2s",
                whiteSpace:   "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background   = "rgba(239,68,68,0.15)";
                e.currentTarget.style.borderColor   = "rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background   = "rgba(239,68,68,0.08)";
                e.currentTarget.style.borderColor   = "rgba(239,68,68,0.2)";
              }}
            >
              <LogOut size={15} />
              {t("dashboard.logout", "تسجيل الخروج")}
            </button>
          </div>
        </motion.div>

        {/* ─── SECTION LABEL ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
            marginBottom: "1.25rem",
            textAlign:    "right",
          }}
        >
          <span
            style={{
              width:        "4px",
              height:       "18px",
              borderRadius: "2px",
              background:   "#C9A84C",
              flexShrink:   0,
            }}
          />
          <h2 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "700", color: isDark ? "#9CA3AF" : "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {t("dashboard.services", "الخدمات")}
          </h2>
        </motion.div>

        {/* ─── MAIN CARDS ─── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap:                 "1.25rem",
            marginBottom:        "2.5rem",
          }}
        >
          {CARDS.map((card) => (
            <DashboardCard
              key={card.path}
              card={card}
              isDark={isDark}
              t={t}
              onClick={() => navigate(card.path)}
            />
          ))}
        </motion.div>

        {/* ─── ADMIN SECTION ─── */}
        {isAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "10px",
                marginBottom: "1.25rem",
                textAlign:    "right",
              }}
            >
              <span
                style={{
                  width:        "4px",
                  height:       "18px",
                  borderRadius: "2px",
                  background:   "#2E8B57",
                  flexShrink:   0,
                }}
              />
              <h2 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "700", color: isDark ? "#9CA3AF" : "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {t("dashboard.administration", "إدارة")}
              </h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap:                 "1.25rem",
              }}
            >
              {ADMIN_CARDS.map((card) => (
                <DashboardCard
                  key={card.path}
                  card={card}
                  isDark={isDark}
                  t={t}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
}