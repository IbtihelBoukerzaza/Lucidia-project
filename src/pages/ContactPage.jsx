import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, User, Building2, MessageSquare } from "lucide-react";

// ─── Floating orbs (same as Login / RequestAccess) ────────────────────────────
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
          ? "radial-gradient(circle, #4A90D910 0%, transparent 70%)"
          : "radial-gradient(circle, #4A90D908 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "30%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, #2E8B5708 0%, transparent 70%)"
          : "radial-gradient(circle, #2E8B5706 0%, transparent 70%)",
      }} />
    </div>
  );
}

// ─── Info card row ─────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, color, colorDim, colorBorder, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
        background: colorDim, border: `1px solid ${colorBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color,
      }}>
        <Icon size={16} />
      </div>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Why-choose-us check row ──────────────────────────────────────────────────
function CheckRow({ text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
    >
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        background: "#2E8B5715", border: "1px solid #2E8B5730",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#2E8B57", fontSize: "11px", fontWeight: 900,
      }}>
        ✓
      </div>
      <span style={{ fontSize: "13px", lineHeight: 1.6 }}>{text}</span>
    </motion.div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children, isDark }) {
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
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const { t }                      = useTranslation();
  const { theme }                  = useTheme();
  const isDark                     = theme === "dark";

  const [formData, setFormData]    = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [isLoading, setIsLoading]  = useState(false);
  const [status, setStatus]        = useState(""); // "success" | "error" | ""
  const [focused, setFocused]      = useState("");

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

  const inputStyle = (name) => ({
    width: "100%", padding: "12px 14px",
    borderRadius: "12px", fontSize: "14px",
    background: ui.input,
    border: `1px solid ${focused === name ? "#C9A84C" : ui.inputBorder}`,
    color: ui.text, outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "none",
  });

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch("http://localhost:8000/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStatus("success");
        setFormData({ name: "", email: "", company: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const infoItems = [
    {
      icon: Mail, color: "#C9A84C", colorDim: "#C9A84C12", colorBorder: "#C9A84C30",
      label: t("contact.contactInfo.email", "البريد الإلكتروني"),
      value: "ibtihelpro0@gmail.com",
    },
    {
      icon: Phone, color: "#4A90D9", colorDim: "#4A90D912", colorBorder: "#4A90D930",
      label: t("contact.contactInfo.phone", "الهاتف"),
      value: "+213 123 456 789",
    },
    {
      icon: MapPin, color: "#2E8B57", colorDim: "#2E8B5712", colorBorder: "#2E8B5730",
      label: t("contact.contactInfo.address", "العنوان"),
      value: t("contact.contactInfo.addressValue", "الجزائر، الجزائر"),
    },
  ];

  const whyItems = [
    t("contact.whyChooseUs.deepUnderstanding", "فهم عميق للسوق الجزائري والدارجة المحلية"),
    t("contact.whyChooseUs.support247",        "دعم فني متاح على مدار الساعة"),
    t("contact.whyChooseUs.customSolutions",   "حلول مخصصة لكل شركة وقطاع"),
    t("contact.whyChooseUs.competitivePrices", "أسعار تنافسية مع ضمان الجودة"),
  ];

  return (
    <div
      style={{
        minHeight: "100vh", position: "relative",
        background: ui.bg, color: ui.text,
        padding: "60px 24px 80px",
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <Orbs isDark={isDark} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: "48px" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: isDark ? "#C9A84C12" : "#C9A84C0E",
            border: `1px solid ${ui.borderGold}`,
            borderRadius: "40px", padding: "5px 14px",
            marginBottom: "16px",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C9A84C", boxShadow: "0 0 6px #C9A84C80" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#C9A84C", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t("contact.tagline", "تواصل معنا")}
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900,
            color: ui.text, margin: "0 0 10px", letterSpacing: "-0.02em",
          }}>
            {t("contact.title", "نسعد بسماعك")}
          </h1>
          <p style={{ fontSize: "14px", color: ui.muted, lineHeight: 1.75, maxWidth: "520px", margin: 0 }}>
            {t("contact.description", "هل لديك سؤال أو تريد معرفة المزيد عن منصة Gantra؟ فريقنا جاهز للإجابة.")}
          </p>
        </motion.div>

        {/* ── Grid: form + side cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
          className="contact-grid"
        >

          {/* ══ FORM CARD ══ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            style={{
              background: ui.panel,
              border: `1px solid ${ui.border}`,
              borderRadius: "24px", padding: "36px 32px",
              boxShadow: isDark
                ? "0 0 0 1px #C9A84C08, 0 24px 60px #00000080"
                : "0 0 0 1px #C9A84C08, 0 24px 60px rgba(0,0,0,0.10)",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* accent top line */}
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "2px",
              background: "linear-gradient(90deg, transparent, #C9A84C, #4A90D9, transparent)",
            }} />
            {/* ambient blob */}
            <div style={{
              position: "absolute", top: "-40px", right: "-40px",
              width: "180px", height: "180px", borderRadius: "50%",
              background: "#C9A84C", opacity: 0.03, filter: "blur(50px)", pointerEvents: "none",
            }} />

            <h2 style={{ fontSize: "17px", fontWeight: 900, margin: "0 0 24px", color: ui.text }}>
              {t("contact.form.title", "أرسل لنا رسالة")}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Row: name + email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="contact-row">
                <Field label={t("contact.form.fullName", "الاسم الكامل")} icon={User} isDark={isDark}>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleChange}
                    placeholder={t("contact.form.fullNamePlaceholder", "اسمك الكامل")}
                    style={inputStyle("name")} required
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
                <Field label={t("contact.form.email", "البريد الإلكتروني")} icon={Mail} isDark={isDark}>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange}
                    placeholder={t("contact.form.emailPlaceholder", "example@company.dz")}
                    style={{ ...inputStyle("email"), direction: "ltr" }} required
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
              </div>

              {/* Row: company + phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="contact-row">
                <Field label={t("contact.form.company", "الشركة")} icon={Building2} isDark={isDark}>
                  <input
                    type="text" name="company" value={formData.company}
                    onChange={handleChange}
                    placeholder={t("contact.form.companyPlaceholder", "اسم شركتك")}
                    style={inputStyle("company")}
                    onFocus={() => setFocused("company")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
                <Field label={t("contact.form.phone", "رقم الهاتف")} icon={Phone} isDark={isDark}>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("contact.form.phonePlaceholder", "+213 ...")}
                    style={{ ...inputStyle("phone"), direction: "ltr" }}
                    onFocus={() => setFocused("phone")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
              </div>

              {/* Message */}
              <Field label={t("contact.form.message", "الرسالة")} icon={MessageSquare} isDark={isDark}>
                <textarea
                  name="message" value={formData.message}
                  onChange={handleChange} rows={5} required
                  placeholder={t("contact.form.messagePlaceholder", "اكتب رسالتك هنا...")}
                  style={inputStyle("message")}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused("")}
                />
              </Field>

              {/* Status banner */}
              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      padding: "11px 14px", borderRadius: "12px", fontSize: "13px",
                      background: status === "success" ? "#2E8B5712" : "#E53E3E12",
                      border: `1px solid ${status === "success" ? "#2E8B5730" : "#E53E3E30"}`,
                      color: status === "success" ? "#2E8B57" : "#E53E3E",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}
                  >
                    {status === "success" && <CheckCircle2 size={15} />}
                    {status === "success"
                      ? t("contact.form.success", "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.")
                      : t("contact.form.error",   "حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً.")}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit" disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.015 } : {}}
                whileTap={!isLoading ? { scale: 0.985 } : {}}
                style={{
                  width: "100%", padding: "14px",
                  borderRadius: "14px", fontSize: "15px", fontWeight: 800,
                  background: isLoading
                    ? (isDark ? "#1A1A1A" : "#E5E7EB")
                    : "linear-gradient(135deg, #C9A84C 0%, #E8C56A 45%, #2E8B57 100%)",
                  color: isLoading ? ui.muted : "#060606",
                  border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: isLoading ? "none" : "0 4px 20px #C9A84C30",
                  transition: "box-shadow 0.3s", letterSpacing: "-0.01em",
                  marginTop: "4px",
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{
                      width: "15px", height: "15px",
                      border: `2px solid ${ui.muted}`, borderTopColor: "transparent",
                      borderRadius: "50%", display: "inline-block",
                      animation: "contactSpin 0.7s linear infinite",
                    }} />
                    {t("contact.form.sending", "جارٍ الإرسال...")}
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    {t("contact.form.sendMessage", "إرسال الرسالة")}
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* ══ SIDE CARDS ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              style={{
                background: ui.panel,
                border: `1px solid ${ui.border}`,
                borderRadius: "22px", padding: "28px 26px",
                boxShadow: isDark ? "0 4px 24px #00000060" : "0 4px 16px rgba(0,0,0,0.07)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "2px",
                background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
              }} />
              <h3 style={{ fontSize: "15px", fontWeight: 900, margin: "0 0 20px", color: ui.text }}>
                {t("contact.contactInfo.title", "معلومات التواصل")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {infoItems.map((item) => (
                  <InfoRow key={item.label} {...item} />
                ))}
              </div>
            </motion.div>

            {/* Why us */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6 }}
              style={{
                background: ui.panel,
                border: `1px solid ${ui.border}`,
                borderRadius: "22px", padding: "28px 26px",
                boxShadow: isDark ? "0 4px 24px #00000060" : "0 4px 16px rgba(0,0,0,0.07)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "2px",
                background: "linear-gradient(90deg, transparent, #2E8B57, transparent)",
              }} />
              {/* ambient blob */}
              <div style={{
                position: "absolute", bottom: "-30px", left: "-30px",
                width: "120px", height: "120px", borderRadius: "50%",
                background: "#2E8B57", opacity: 0.04, filter: "blur(30px)", pointerEvents: "none",
              }} />
              <h3 style={{ fontSize: "15px", fontWeight: 900, margin: "0 0 18px", color: ui.text }}>
                {t("contact.whyChooseUs.title", "لماذا Gantra؟")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: ui.text }}>
                {whyItems.map((text, i) => (
                  <CheckRow key={i} text={text} delay={0.32 + i * 0.08} />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes contactSpin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-row  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}