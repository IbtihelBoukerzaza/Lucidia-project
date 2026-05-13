import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sparkles, MessageSquareText, HeartPulse, TrendingUp, BellRing, Activity } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import gantraLogo from "../assets/gantra-logo.png";

// ─── Language Switcher ────────────────────────────────────────────────────────
function LangSwitcher({ isDark }) {
  const { i18n } = useTranslation();
  const langs = ["ar", "en", "fr"];
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => {
            i18n.changeLanguage(l);
            localStorage.setItem("i18nextLng", l);
          }}
          style={{
            padding: "5px 10px", borderRadius: "8px",
            border: `1px solid ${i18n.language?.startsWith(l) ? "#C9A84C44" : (isDark ? "#1E1E1E" : "#E5E7EB")}`,
            background: i18n.language?.startsWith(l)
              ? (isDark ? "#C9A84C15" : "#C9A84C10")
              : "transparent",
            color: i18n.language?.startsWith(l) ? "#C9A84C" : (isDark ? "#6B7280" : "#9CA3AF"),
            fontSize: "12px", fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s", textTransform: "uppercase",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ─── Floating orbs ────────────────────────────────────────────────────────────
function Orbs({ isDark }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: "-140px", right: "-80px",
        width: "480px", height: "480px", borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, #C9A84C14 0%, transparent 70%)"
          : "radial-gradient(circle, #C9A84C0E 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-120px", left: "-80px",
        width: "420px", height: "420px", borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, #2E8B5712 0%, transparent 70%)"
          : "radial-gradient(circle, #2E8B570C 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: "45%", left: "25%",
        width: "260px", height: "260px", borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, #4A90D908 0%, transparent 70%)"
          : "radial-gradient(circle, #4A90D906 0%, transparent 70%)",
      }} />
    </div>
  );
}

// ─── Feature pills (left panel) ───────────────────────────────────────────────
const FEATURES = [
  { icon: MessageSquareText, color: "#4A90D9", colorDim: "#4A90D912", colorBorder: "#4A90D930", key: "posts" },
  { icon: HeartPulse,        color: "#2E8B57", colorDim: "#2E8B5712", colorBorder: "#2E8B5730", key: "sentiment" },
  { icon: TrendingUp,        color: "#F59E0B", colorDim: "#F59E0B12", colorBorder: "#F59E0B30", key: "topics" },
  { icon: BellRing,          color: "#E53E3E", colorDim: "#E53E3E12", colorBorder: "#E53E3E30", key: "alerts" },
  { icon: Activity,          color: "#8B5CF6", colorDim: "#8B5CF612", colorBorder: "#8B5CF630", key: "engagement" },
];

function FeaturePill({ feature, delay, isDark, label }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: isDark ? "#111111" : "#FFFFFF",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        borderRadius: "14px", padding: "10px 16px",
        boxShadow: isDark ? "0 2px 16px #00000055" : "0 2px 10px rgba(0,0,0,0.06)",
        borderRight: `3px solid ${feature.color}`,
      }}
    >
      <div style={{
        width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
        background: feature.colorDim, border: `1px solid ${feature.colorBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: feature.color,
      }}>
        <Icon size={17} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#E5E7EB" : "#111111" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ─── Rotating service badge ───────────────────────────────────────────────────
function ServiceBadge({ services, index, isDark }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: "196px", height: "196px", borderRadius: "50%",
        border: `1px dashed ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      }} />
      <div style={{
        width: "160px", height: "160px", borderRadius: "50%",
        border: `1px solid ${isDark ? "#C9A84C22" : "#C9A84C33"}`,
        background: isDark ? "#111111" : "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        boxShadow: isDark ? "0 0 32px #C9A84C08" : "0 0 24px #C9A84C0A",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -6 }}
            transition={{ duration: 0.45 }}
            style={{
              textAlign: "center", padding: "8px 16px",
              color: "#C9A84C", fontWeight: 800, fontSize: "14px", lineHeight: 1.4,
            }}
          >
            {services[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, delay, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: isDark ? "#111111" : "#FFFFFF",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        borderRadius: "40px", padding: "6px 14px 6px 10px",
        boxShadow: isDark ? "0 2px 10px #00000050" : "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{
        width: "7px", height: "7px", borderRadius: "50%",
        background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}80`,
      }} />
      <span style={{ fontSize: "13px", fontWeight: 700, color: isDark ? "#E5E7EB" : "#111111" }}>
        {value}
      </span>
      <span style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF" }}>{label}</span>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Login() {
  const { t, i18n }             = useTranslation();
  const { theme, toggleTheme }  = useTheme();
  const navigate                = useNavigate();
  const auth                    = useAuth();
  const isDark                  = theme === "dark";
  const isRTL                   = i18n.language?.startsWith("ar");

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [errors,       setErrors]       = useState({});
  const [serviceIndex, setServiceIndex] = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [apiError,     setApiError]     = useState("");

  const ui = {
    bg:          isDark ? "#0A0A0A" : "#F7F6F2",
    panel:       isDark ? "#111111" : "#FFFFFF",
    panel2:      isDark ? "#161616" : "#F8FAFC",
    border:      isDark ? "#1E1E1E" : "#E5E7EB",
    borderGold:  isDark ? "#C9A84C2A" : "#C9A84C3A",
    text:        isDark ? "#E5E7EB" : "#111111",
    muted:       isDark ? "#6B7280" : "#9CA3AF",
    input:       isDark ? "#0D0D0D" : "#F8FAFC",
    inputBorder: isDark ? "#262626" : "#D1D5DB",
  };

  const services = [
    t("login.services.sentiment"),
    t("login.services.opinion"),
    t("login.services.reports"),
    t("login.services.intelligence"),
  ];

  const stats = [
    { label: t("login.stats.accuracy"), value: "94%",  color: "#2E8B57", delay: 0.3  },
    { label: t("login.stats.sources"),  value: "8+",   color: "#C9A84C", delay: 0.45 },
    { label: t("login.stats.realtime"), value: "Live", color: "#4A90D9", delay: 0.6  },
  ];

  const featureLabels = {
    posts:      t("dashboard.posts",      "المنشورات"),
    sentiment:  t("dashboard.sentiment",  "المشاعر"),
    topics:     t("dashboard.topics",     "المواضيع"),
    alerts:     t("dashboard.alerts",     "التنبيهات"),
    engagement: t("dashboard.engagement", "التفاعل"),
  };

  useEffect(() => {
    if (isAuthenticated()) navigate("/dashboard");
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setServiceIndex((p) => (p + 1) % services.length);
    }, 2500);
    return () => clearInterval(id);
  }, [services.length]);

  const validate = () => {
    const e = {};
    if (!email)                        e.email    = t("login.errors.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t("login.errors.emailInvalid");
    if (!password)                     e.password = t("login.errors.passwordRequired");
    else if (password.length < 6)      e.password = t("login.errors.passwordMinLength");
    return e;
  };

  const handleLogin = async (ev) => {
    ev.preventDefault();
    const ve = validate();
    setErrors(ve);
    setApiError("");
    if (Object.keys(ve).length > 0) return;
    setLoading(true);
    try {
      const response = await api.login(email, password);
      const data     = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "فشل تسجيل الدخول.");
      }
      await auth.login({ access: data.access, refresh: data.refresh, user: data.user });
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "13px 16px",
    borderRadius: "12px", fontSize: "14px",
    background: ui.input,
    border: `1px solid ${hasError ? "#E53E3E" : ui.inputBorder}`,
    color: ui.text, outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    direction: "ltr", textAlign: isRTL ? "right" : "left",
    fontFamily: "inherit",
  });

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh", display: "flex",
        background: ui.bg, color: ui.text,
        position: "relative", overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      }}
    >
      <Orbs isDark={isDark} />

      {/* ── Top bar: lang switcher + theme toggle ── */}
      <div style={{
        position: "fixed", top: "18px",
        left:  isRTL ? "20px" : "auto",
        right: isRTL ? "auto" : "20px",
        zIndex: 50,
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <LangSwitcher isDark={isDark} />
        <button
          onClick={toggleTheme}
          style={{
            width: "38px", height: "38px", borderRadius: "50%",
            background: ui.panel, border: `1px solid ${ui.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "16px",
            boxShadow: isDark ? "0 2px 12px #00000060" : "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* ════════ LEFT PANEL — Branding ════════ */}
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="login-left-panel"
        style={{
          width: "48%", display: "none",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 48px", position: "relative",
          borderLeft:  isRTL ? `1px solid ${ui.border}` : "none",
          borderRight: isRTL ? "none" : `1px solid ${ui.border}`,
          gap: "28px",
        }}
      >
        {/* ── Logo — same img tag as AppNavbar ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{ textAlign: "center" }}
        >
          <img
            src={gantraLogo}
            alt="Gantra"
            style={{
              height: "64px",
              filter: isDark ? "none" : "brightness(0.85)",
              transition: "filter 0.3s",
              display: "block",
              margin: "0 auto 16px",
            }}
          />
          <h1 style={{
            fontSize: "22px", fontWeight: 900, lineHeight: 1.25,
            color: ui.text, margin: "0 0 8px", letterSpacing: "-0.02em",
          }}>
            {t("login.panel.headline")}
          </h1>
          <p style={{ fontSize: "13px", color: ui.muted, lineHeight: 1.7, margin: 0 }}>
            {t("login.panel.subheadline")}
          </p>
        </motion.div>

        {/* Rotating badge */}
        <ServiceBadge services={services} index={serviceIndex} isDark={isDark} />

        {/* Stat pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {stats.map((s) => <StatPill key={s.label} {...s} isDark={isDark} />)}
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "280px" }}>
          {FEATURES.map((f, i) => (
            <FeaturePill
              key={f.key} feature={f} delay={0.12 * i}
              isDark={isDark} label={featureLabels[f.key]}
            />
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{
            padding: "16px 20px", borderRadius: "14px",
            background: ui.panel2, border: `1px solid ${ui.border}`,
            borderRight: isRTL ? `3px solid #C9A84C` : `1px solid ${ui.border}`,
            borderLeft:  isRTL ? `1px solid ${ui.border}` : `3px solid #C9A84C`,
            maxWidth: "280px", width: "100%",
          }}
        >
          <p style={{ fontSize: "12px", color: ui.muted, margin: "0 0 6px", lineHeight: 1.65 }}>
            {t("login.panel.quote")}
          </p>
          <span style={{ fontSize: "11px", color: "#C9A84C", fontWeight: 700 }}>
            — {t("login.panel.quoteAuthor")}
          </span>
        </motion.div>
      </motion.div>

      {/* ════════ RIGHT PANEL — Form ════════ */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "80px 24px 40px",
        position: "relative",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          style={{
            width: "100%", maxWidth: "420px",
            background: ui.panel,
            border: `1px solid ${ui.border}`,
            borderRadius: "28px", padding: "44px 36px",
            boxShadow: isDark
              ? "0 0 0 1px #C9A84C08, 0 32px 80px #00000090"
              : "0 0 0 1px #C9A84C10, 0 32px 80px rgba(0,0,0,0.14)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Accent gradient top line */}
          <div style={{
            position: "absolute", top: 0, left: "12%", right: "12%", height: "2px",
            background: "linear-gradient(90deg, transparent, #C9A84C, #2E8B57, transparent)",
          }} />

          {/* Ambient blob */}
          <div style={{
            position: "absolute", top: "-40px", right: "-40px",
            width: "160px", height: "160px", borderRadius: "50%",
            background: "#C9A84C", opacity: 0.04, filter: "blur(40px)",
            pointerEvents: "none",
          }} />

          {/* ── Card header: logo image ── */}
          <div style={{ textAlign: "center", marginBottom: "32px", position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "10px 20px",
              background: isDark ? "#C9A84C08" : "#C9A84C06",
              border: `1px solid ${ui.borderGold}`,
              borderRadius: "16px", marginBottom: "18px",
            }}>
              <img
                src={gantraLogo}
                alt="Gantra"
                style={{
                  height: "36px",
                  filter: isDark ? "none" : "brightness(0.85)",
                  transition: "filter 0.3s",
                  display: "block",
                }}
              />
            </div>

            <h2 style={{
              fontSize: "22px", fontWeight: 900, margin: "0 0 6px",
              color: ui.text, letterSpacing: "-0.02em",
            }}>
              {t("login.title")}
            </h2>
            <p style={{ fontSize: "13px", color: ui.muted, margin: 0 }}>
              {t("login.welcome")}
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 700,
                color: ui.muted, marginBottom: "7px",
              }}>
                {t("login.emailLabel")}
              </label>
              <input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle(errors.email)}
                onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; }}
                onBlur={(e)  => { e.target.style.borderColor = errors.email ? "#E53E3E" : ui.inputBorder; }}
              />
              {errors.email && (
                <p style={{ color: "#E53E3E", fontSize: "11px", margin: "5px 0 0" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 700,
                color: ui.muted, marginBottom: "7px",
              }}>
                {t("login.passwordLabel")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle(errors.password), paddingLeft: "44px" }}
                  onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; }}
                  onBlur={(e)  => { e.target.style.borderColor = errors.password ? "#E53E3E" : ui.inputBorder; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", left: "14px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: ui.muted, display: "flex", padding: 0, lineHeight: 1,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: "#E53E3E", fontSize: "11px", margin: "5px 0 0" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* API error */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    padding: "11px 14px", borderRadius: "10px",
                    background: "#E53E3E12", border: "1px solid #E53E3E30",
                    color: "#E53E3E", fontSize: "12px", textAlign: "center",
                  }}
                >
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.015 } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
              style={{
                width: "100%", padding: "14px",
                borderRadius: "14px", fontSize: "15px", fontWeight: 800,
                background: loading
                  ? (isDark ? "#1A1A1A" : "#E5E7EB")
                  : "linear-gradient(135deg, #C9A84C 0%, #E8C56A 45%, #2E8B57 100%)",
                color: loading ? ui.muted : "#060606",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                marginTop: "4px", letterSpacing: "-0.01em",
                boxShadow: loading ? "none" : "0 4px 20px #C9A84C30",
                transition: "box-shadow 0.3s",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "15px", height: "15px",
                    border: `2px solid ${ui.muted}`, borderTopColor: "transparent",
                    borderRadius: "50%", display: "inline-block",
                    animation: "loginSpin 0.7s linear infinite",
                  }} />
                  {t("login.loading")}
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {t("login.submit")}
                </>
              )}
            </motion.button>
          </form>

          {/* Divider + request access */}
          <div style={{
            marginTop: "24px", paddingTop: "22px",
            borderTop: `1px solid ${ui.border}`,
            textAlign: "center",
          }}>
            <span style={{ fontSize: "13px", color: ui.muted }}>
              {t("login.noAccount")}{" "}
            </span>
            <NavLink
              to="/request-access"
              style={{ fontSize: "13px", fontWeight: 800, color: "#C9A84C", textDecoration: "none" }}
            >
              {t("login.createAccount")}
            </NavLink>
          </div>

          <p style={{
            textAlign: "center", fontSize: "11px",
            color: isDark ? "#2A2A2A" : "#D1D5DB",
            margin: "16px 0 0",
          }}>
            {t("login.secureNote")}
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .login-left-panel { display: none; }
        @media (min-width: 1024px) { .login-left-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}