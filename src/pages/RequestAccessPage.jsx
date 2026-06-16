import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, User, Briefcase, Users, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { api } from "../services/api";
import gantraLogo from "../assets/gantra-logo (2).png";

// ─── Floating orbs (same as Login) ───────────────────────────────────────────
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

// ─── Language Switcher ────────────────────────────────────────────────────────
function LangSwitcher({ isDark }) {
  const { i18n } = useTranslation();
  const langs = ["ar", "en", "fr"];
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => { i18n.changeLanguage(l); localStorage.setItem("i18nextLng", l); }}
          style={{
            padding: "5px 10px", borderRadius: "8px",
            border: `1px solid ${i18n.language?.startsWith(l) ? "#C9A84C44" : (isDark ? "#1E1E1E" : "#E5E7EB")}`,
            background: i18n.language?.startsWith(l) ? (isDark ? "#C9A84C15" : "#C9A84C10") : "transparent",
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

// ─── Rotating service badge (same as Login) ──────────────────────────────────
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ total, current, isDark }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "4px",
            width: i === current ? "24px" : "8px",
            borderRadius: "99px",
            background: i === current ? "#C9A84C" : (i < current ? "#2E8B57" : (isDark ? "#2A2A2A" : "#E5E7EB")),
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children, error, isDark }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "12px", fontWeight: 700,
        color: isDark ? "#6B7280" : "#9CA3AF", marginBottom: "7px",
      }}>
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
      {error && (
        <p style={{ color: "#E53E3E", fontSize: "11px", margin: "5px 0 0" }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RequestAccessPage() {
  const { t, i18n }            = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const isDark                 = theme === "dark";
  const isRTL                  = i18n.language?.startsWith("ar");

  const [step,         setStep]        = useState(0); // 0 = personal, 1 = company, 2 = goal
  const [serviceIndex, setServiceIndex] = useState(0);
  const [loading,      setLoading]     = useState(false);
  const [success,      setSuccess]     = useState(false);
  const [apiError,     setApiError]    = useState("");
  const [errors,       setErrors]      = useState({});

  const [formData, setFormData] = useState({
    full_name: "", professional_email: "",
    company_name: "", sector: "", company_size: "", goal: "",
  });

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
    t("requestAccess.services.sentiment", "تحليل المشاعر"),
    t("requestAccess.services.listening", "الاستماع الاجتماعي"),
    t("requestAccess.services.reputation", "سمعة العلامة"),
    t("requestAccess.services.reports",   "تقارير ذكية"),
    t("requestAccess.services.dialect",   "الدارجة الجزائرية"),
  ];

  useEffect(() => {
    const id = setInterval(() => setServiceIndex(p => (p + 1) % services.length), 2600);
    return () => clearInterval(id);
  }, [services.length]);

  const inputStyle = (hasError) => ({
    width: "100%", padding: "12px 14px",
    borderRadius: "12px", fontSize: "14px",
    background: ui.input,
    border: `1px solid ${hasError ? "#E53E3E" : ui.inputBorder}`,
    color: ui.text, outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
    direction: isRTL ? "rtl" : "ltr",
  });

  const selectStyle = (hasError) => ({
    ...inputStyle(hasError),
    cursor: "pointer",
    appearance: "none",
  });

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: "" }));
  };

  // Validate each step
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!formData.full_name.trim())               e.full_name           = t("requestAccess.errors.nameRequired",   "الاسم مطلوب");
      if (!formData.professional_email.trim())       e.professional_email  = t("requestAccess.errors.emailRequired",  "البريد مطلوب");
      else if (!/\S+@\S+\.\S+/.test(formData.professional_email))
                                                     e.professional_email  = t("requestAccess.errors.emailInvalid",   "بريد غير صالح");
    }
    if (s === 1) {
      if (!formData.company_name.trim())  e.company_name  = t("requestAccess.errors.companyRequired", "اسم الشركة مطلوب");
      if (!formData.sector)               e.sector        = t("requestAccess.errors.sectorRequired",  "القطاع مطلوب");
      if (!formData.company_size)         e.company_size  = t("requestAccess.errors.sizeRequired",    "الحجم مطلوب");
    }
    if (s === 2) {
      if (!formData.goal.trim())          e.goal          = t("requestAccess.errors.goalRequired",    "الهدف مطلوب");
    }
    return e;
  };

  const handleNext = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const e = validateStep(2);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setApiError("");
    try {
      const response = await api.requestAccess(formData);
      const data     = await response.json();
      if (!response.ok) {
        if (data.errors) {
          const key = Object.keys(data.errors)[0];
          throw new Error(data.errors[key]?.[0] || t("requestAccess.errors.failed", "فشل الإرسال"));
        }
        throw new Error(data.message || t("requestAccess.errors.failed", "فشل الإرسال"));
      }
      setSuccess(true);
    } catch (err) {
      setApiError(err.message || t("requestAccess.errors.unexpected", "حدث خطأ غير متوقع"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step content ──────────────────────────────────────────────────────────
  const STEPS = [
    // Step 0 — Personal info
    <div key="step0" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Field label={t("requestAccess.fields.fullName", "الاسم الكامل")} icon={User} error={errors.full_name} isDark={isDark}>
        <input
          name="full_name" type="text" value={formData.full_name}
          onChange={handleChange} placeholder={t("requestAccess.placeholders.fullName", "أدخل اسمك الكامل")}
          style={inputStyle(errors.full_name)}
          onFocus={e => e.target.style.borderColor = "#C9A84C"}
          onBlur={e  => e.target.style.borderColor = errors.full_name ? "#E53E3E" : ui.inputBorder}
        />
      </Field>
      <Field label={t("requestAccess.fields.email", "البريد الإلكتروني المهني")} icon={Mail} error={errors.professional_email} isDark={isDark}>
        <input
          name="professional_email" type="email" value={formData.professional_email}
          onChange={handleChange} placeholder="example@company.dz"
          style={{ ...inputStyle(errors.professional_email), direction: "ltr", textAlign: isRTL ? "right" : "left" }}
          onFocus={e => e.target.style.borderColor = "#C9A84C"}
          onBlur={e  => e.target.style.borderColor = errors.professional_email ? "#E53E3E" : ui.inputBorder}
        />
      </Field>
    </div>,

    // Step 1 — Company info
    <div key="step1" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Field label={t("requestAccess.fields.companyName", "اسم الشركة")} icon={Building2} error={errors.company_name} isDark={isDark}>
        <input
          name="company_name" type="text" value={formData.company_name}
          onChange={handleChange} placeholder={t("requestAccess.placeholders.companyName", "اسم شركتك")}
          style={inputStyle(errors.company_name)}
          onFocus={e => e.target.style.borderColor = "#C9A84C"}
          onBlur={e  => e.target.style.borderColor = errors.company_name ? "#E53E3E" : ui.inputBorder}
        />
      </Field>
      <Field label={t("requestAccess.fields.sector", "قطاع النشاط")} icon={Briefcase} error={errors.sector} isDark={isDark}>
        <select name="sector" value={formData.sector} onChange={handleChange} style={selectStyle(errors.sector)}>
          <option value="">{t("requestAccess.placeholders.sector", "اختر القطاع")}</option>
          <option value="ecommerce">{t("requestAccess.sectors.ecommerce", "تجارة إلكترونية")}</option>
          <option value="finance">{t("requestAccess.sectors.finance",   "بنك / مالية")}</option>
          <option value="telecom">{t("requestAccess.sectors.telecom",   "اتصالات")}</option>
          <option value="services">{t("requestAccess.sectors.services", "خدمات")}</option>
          <option value="other">{t("requestAccess.sectors.other",       "أخرى")}</option>
        </select>
      </Field>
      <Field label={t("requestAccess.fields.companySize", "حجم الشركة")} icon={Users} error={errors.company_size} isDark={isDark}>
        <select name="company_size" value={formData.company_size} onChange={handleChange} style={selectStyle(errors.company_size)}>
          <option value="">{t("requestAccess.placeholders.companySize", "اختر الحجم")}</option>
          <option value="1-10">1–10 {t("requestAccess.employees", "موظفين")}</option>
          <option value="10-50">10–50 {t("requestAccess.employees", "موظف")}</option>
          <option value="50-200">50–200 {t("requestAccess.employees", "موظف")}</option>
          <option value="200+">200+ {t("requestAccess.employees", "موظف")}</option>
        </select>
      </Field>
    </div>,

    // Step 2 — Goal
    <div key="step2" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Field label={t("requestAccess.fields.goal", "ما الهدف من استخدام المنصة؟")} icon={Target} error={errors.goal} isDark={isDark}>
        <textarea
          name="goal" value={formData.goal} onChange={handleChange} rows={5}
          placeholder={t("requestAccess.placeholders.goal", "مثلاً: مراقبة سمعة العلامة التجارية وتحليل مشاعر الزبائن...")}
          style={{ ...inputStyle(errors.goal), resize: "vertical", lineHeight: 1.7 }}
          onFocus={e => e.target.style.borderColor = "#C9A84C"}
          onBlur={e  => e.target.style.borderColor = errors.goal ? "#E53E3E" : ui.inputBorder}
        />
      </Field>
    </div>,
  ];

  const stepTitles = [
    t("requestAccess.steps.personal", "معلوماتك الشخصية"),
    t("requestAccess.steps.company",  "معلومات الشركة"),
    t("requestAccess.steps.goal",     "هدفك من المنصة"),
  ];

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

      {/* ── Top bar ── */}
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

      {/* ════════ LEFT PANEL ════════ */}
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="ra-left-panel"
        style={{
          width: "48%", display: "none",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 48px", position: "relative",
          borderLeft:  isRTL ? `1px solid ${ui.border}` : "none",
          borderRight: isRTL ? "none" : `1px solid ${ui.border}`,
          gap: "32px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{ textAlign: "center" }}
        >
          <img
            src={gantraLogo} alt="Gantra"
            style={{
              height: "64px",
              filter: isDark ? "none" : "brightness(0.85)",
              transition: "filter 0.3s", display: "block", margin: "0 auto 16px",
            }}
          />
          <h1 style={{
            fontSize: "22px", fontWeight: 900, lineHeight: 1.25,
            color: ui.text, margin: "0 0 8px", letterSpacing: "-0.02em",
          }}>
            {t("requestAccess.panel.headline", "منصة الاستماع الذكي للسوق الجزائري")}
          </h1>
          <p style={{ fontSize: "13px", color: ui.muted, lineHeight: 1.7, margin: 0 }}>
            {t("requestAccess.panel.subheadline", "تحليل المشاعر بالدارجة، مراقبة السمعة، تقارير تنفيذية فورية")}
          </p>
        </motion.div>

        <ServiceBadge services={services} index={serviceIndex} isDark={isDark} />

        {/* Trust pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {[
            { label: t("requestAccess.trust.accuracy", "دقة 94%"),    color: "#2E8B57" },
            { label: t("requestAccess.trust.sources",  "8+ مصادر"),   color: "#C9A84C" },
            { label: t("requestAccess.trust.dialect",  "دارجة جزائرية"), color: "#4A90D9" },
            { label: t("requestAccess.trust.realtime", "مباشر 24/7"), color: "#8B5CF6" },
          ].map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                background: isDark ? "#111111" : "#FFFFFF",
                border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                borderRadius: "40px", padding: "6px 14px 6px 10px",
                boxShadow: isDark ? "0 2px 10px #00000050" : "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: p.color, boxShadow: `0 0 5px ${p.color}80`,
              }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: ui.text }}>{p.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          style={{
            padding: "16px 20px", borderRadius: "14px",
            background: ui.panel2, border: `1px solid ${ui.border}`,
            borderRight: isRTL ? `3px solid #C9A84C` : `1px solid ${ui.border}`,
            borderLeft:  isRTL ? `1px solid ${ui.border}` : `3px solid #C9A84C`,
            maxWidth: "300px", width: "100%",
          }}
        >
          <p style={{ fontSize: "12px", color: ui.muted, margin: "0 0 6px", lineHeight: 1.65 }}>
            {t("requestAccess.panel.quote", "\"نحوّل كل تعليق، ردّ فعل، وكلمة في الفضاء الرقمي إلى معلومة قابلة للتنفيذ.\"")}
          </p>
          <span style={{ fontSize: "11px", color: "#C9A84C", fontWeight: 700 }}>
            — {t("requestAccess.panel.quoteAuthor", "فريق Gantra")}
          </span>
        </motion.div>
      </motion.div>

      {/* ════════ RIGHT PANEL — Multi-step form ════════ */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "80px 24px 40px",
        position: "relative",
      }}>
        <AnimatePresence mode="wait">
          {success ? (
            // ── SUCCESS STATE ──
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                width: "100%", maxWidth: "420px", textAlign: "center",
                background: ui.panel, border: `1px solid ${ui.border}`,
                borderRadius: "28px", padding: "52px 36px",
                boxShadow: isDark
                  ? "0 0 0 1px #2E8B5710, 0 32px 80px #00000090"
                  : "0 0 0 1px #2E8B5712, 0 32px 80px rgba(0,0,0,0.14)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: "12%", right: "12%", height: "2px",
                background: "linear-gradient(90deg, transparent, #2E8B57, #C9A84C, transparent)",
              }} />
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "#2E8B5715", border: "1px solid #2E8B5730",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", color: "#2E8B57",
              }}>
                <CheckCircle2 size={34} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: ui.text, margin: "0 0 10px" }}>
                {t("requestAccess.success.title", "تم إرسال الطلب!")}
              </h2>
              <p style={{ fontSize: "13px", color: ui.muted, lineHeight: 1.7, margin: "0 0 28px" }}>
                {t("requestAccess.success.message", "شكراً لاهتمامك بمنصة Gantra. سيتواصل معك فريقنا خلال 24–48 ساعة.")}
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "12px 28px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #C9A84C 0%, #E8C56A 45%, #2E8B57 100%)",
                  color: "#060606", fontWeight: 800, fontSize: "14px",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px #C9A84C30",
                }}
              >
                {t("requestAccess.success.backToLogin", "العودة إلى تسجيل الدخول")}
              </button>
            </motion.div>
          ) : (
            // ── FORM STATE ──
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              style={{
                width: "100%", maxWidth: "440px",
                background: ui.panel, border: `1px solid ${ui.border}`,
                borderRadius: "28px", padding: "40px 36px",
                boxShadow: isDark
                  ? "0 0 0 1px #C9A84C08, 0 32px 80px #00000090"
                  : "0 0 0 1px #C9A84C10, 0 32px 80px rgba(0,0,0,0.14)",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Accent top line */}
              <div style={{
                position: "absolute", top: 0, left: "12%", right: "12%", height: "2px",
                background: "linear-gradient(90deg, transparent, #C9A84C, #2E8B57, transparent)",
              }} />
              {/* Ambient blob */}
              <div style={{
                position: "absolute", top: "-40px", right: "-40px",
                width: "160px", height: "160px", borderRadius: "50%",
                background: "#C9A84C", opacity: 0.04, filter: "blur(40px)", pointerEvents: "none",
              }} />

              {/* ── Header ── */}
              <div style={{ textAlign: "center", marginBottom: "24px", position: "relative" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 18px",
                  background: isDark ? "#C9A84C08" : "#C9A84C06",
                  border: `1px solid ${ui.borderGold}`, borderRadius: "14px", marginBottom: "16px",
                }}>
                  <img
                    src={gantraLogo} alt="Gantra"
                    style={{ height: "32px", filter: isDark ? "none" : "brightness(0.85)", transition: "filter 0.3s" }}
                  />
                </div>
                <h2 style={{
                  fontSize: "20px", fontWeight: 900, margin: "0 0 4px",
                  color: ui.text, letterSpacing: "-0.02em",
                }}>
                  {t("requestAccess.title", "طلب الوصول إلى المنصة")}
                </h2>
                <p style={{ fontSize: "12px", color: ui.muted, margin: 0 }}>
                  {t("requestAccess.subtitle", "أكمل الخطوات التالية للانضمام إلى Gantra")}
                </p>
              </div>

              {/* ── Step dots ── */}
              <StepDots total={3} current={step} isDark={isDark} />

              {/* ── Step label ── */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "18px",
              }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "#C9A84C15", border: "1px solid #C9A84C44",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 900, color: "#C9A84C", flexShrink: 0,
                }}>
                  {step + 1}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: ui.text }}>
                  {stepTitles[step]}
                </span>
              </div>

              {/* ── Animated step content ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: isRTL ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 16 : -16 }}
                  transition={{ duration: 0.28 }}
                >
                  {STEPS[step]}
                </motion.div>
              </AnimatePresence>

              {/* ── API error ── */}
              <AnimatePresence>
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      marginTop: "12px", padding: "10px 14px", borderRadius: "10px",
                      background: "#E53E3E12", border: "1px solid #E53E3E30",
                      color: "#E53E3E", fontSize: "12px", textAlign: "center",
                    }}
                  >
                    {apiError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Navigation buttons ── */}
              <div style={{
                display: "flex", gap: "10px", marginTop: "20px",
                flexDirection: isRTL ? "row-reverse" : "row",
              }}>
                {/* Back button */}
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    style={{
                      flex: 1, padding: "12px",
                      borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                      background: "transparent",
                      border: `1px solid ${ui.border}`,
                      color: ui.muted, cursor: "pointer",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = "#C9A84C44"; e.target.style.color = ui.text; }}
                    onMouseLeave={e => { e.target.style.borderColor = ui.border;   e.target.style.color = ui.muted; }}
                  >
                    {t("requestAccess.nav.back", "رجوع")}
                  </button>
                )}

                {/* Next / Submit button */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={step < 2 ? handleNext : handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2, padding: "13px",
                    borderRadius: "12px", fontSize: "14px", fontWeight: 800,
                    background: loading
                      ? (isDark ? "#1A1A1A" : "#E5E7EB")
                      : "linear-gradient(135deg, #C9A84C 0%, #E8C56A 45%, #2E8B57 100%)",
                    color: loading ? ui.muted : "#060606",
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: loading ? "none" : "0 4px 20px #C9A84C30",
                    transition: "box-shadow 0.3s",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: "14px", height: "14px",
                        border: `2px solid ${ui.muted}`, borderTopColor: "transparent",
                        borderRadius: "50%", display: "inline-block",
                        animation: "raSpin 0.7s linear infinite",
                      }} />
                      {t("requestAccess.nav.sending", "جارٍ الإرسال...")}
                    </>
                  ) : (
                    <>
                      {step < 2
                        ? t("requestAccess.nav.next", "التالي")
                        : t("requestAccess.nav.submit", "إرسال الطلب")}
                      <ArrowRight size={15} style={{ transform: isRTL ? "rotate(180deg)" : "none" }} />
                    </>
                  )}
                </motion.button>
              </div>

              {/* ── Divider + back to login ── */}
              <div style={{
                marginTop: "20px", paddingTop: "18px",
                borderTop: `1px solid ${ui.border}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: "13px", color: ui.muted }}>
                  {t("requestAccess.haveAccount", "لديك حساب بالفعل؟")}{" "}
                </span>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    fontSize: "13px", fontWeight: 800, color: "#C9A84C",
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, fontFamily: "inherit",
                  }}
                >
                  {t("requestAccess.backToLogin", "تسجيل الدخول")}
                </button>
              </div>

              <p style={{
                textAlign: "center", fontSize: "11px",
                color: isDark ? "#2A2A2A" : "#D1D5DB",
                margin: "14px 0 0",
              }}>
                {t("requestAccess.secureNote", "معلوماتك محمية ومشفّرة بالكامل")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes raSpin { to { transform: rotate(360deg); } }
        .ra-left-panel { display: none; }
        @media (min-width: 1024px) { .ra-left-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}