import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, MessageCircle, Users, BookOpen, ChevronDown } from "lucide-react";

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

const ICONS = [
  { Icon: MessageCircle, color: "#4A90D9", colorDim: "#4A90D915", colorBorder: "#4A90D930" },
  { Icon: Users,         color: "#2E8B57", colorDim: "#2E8B5715", colorBorder: "#2E8B5730" },
  { Icon: BookOpen,      color: "#C9A84C", colorDim: "#C9A84C15", colorBorder: "#C9A84C30" },
];

function RotatingBadge({ isDark }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % ICONS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const { Icon, color, colorDim, colorBorder } = ICONS[index];

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: "196px", height: "196px", borderRadius: "50%",
        border: `1px dashed ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      }} />
      {ICONS.map((item, i) => {
        const angle = (i * 120) * (Math.PI / 180);
        const x = Math.cos(angle) * 98;
        const y = Math.sin(angle) * 98;
        const OIcon = item.Icon;
        return (
          <motion.div key={i} animate={{ x, y }} transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              position: "absolute", width: "30px", height: "30px", borderRadius: "9px",
              background: item.colorDim, border: `1px solid ${item.colorBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: item.color, opacity: i === index ? 1 : 0.4, transition: "opacity 0.4s",
            }}>
            <OIcon size={13} />
          </motion.div>
        );
      })}
      <div style={{
        width: "112px", height: "112px", borderRadius: "50%",
        border: `1px solid ${isDark ? "#C9A84C22" : "#C9A84C33"}`,
        background: isDark ? "#111111" : "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isDark ? "0 0 32px #C9A84C08" : "0 0 24px #C9A84C0A",
        position: "relative", zIndex: 1,
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={index}
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1,   rotate: 0   }}
            exit={{   opacity: 0, scale: 0.7, rotate:  20  }}
            transition={{ duration: 0.38 }}
            style={{
              width: "52px", height: "52px", borderRadius: "16px",
              background: colorDim, border: `1px solid ${colorBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", color,
            }}>
            <Icon size={24} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FaqItem({ q, a, index, isDark }) {
  const [open, setOpen] = useState(false);

  const ui = {
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
  };

  const accents = ["#C9A84C", "#4A90D9", "#2E8B57", "#8B5CF6", "#E53E3E", "#F59E0B", "#14B8A6"];
  const accent  = accents[index % accents.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 * index, duration: 0.45 }}
      style={{
        background: ui.panel,
        border: `1px solid ${open ? accent + "44" : ui.border}`,
        borderRadius: "18px", overflow: "hidden",
        transition: "border-color 0.25s",
        position: "relative",
        boxShadow: open
          ? (isDark ? `0 4px 24px ${accent}15` : `0 4px 16px ${accent}12`)
          : (isDark ? "0 2px 12px #00000040" : "0 2px 8px rgba(0,0,0,0.05)"),
      }}>
      <div style={{
        position: "absolute", top: 0, bottom: 0, right: 0, width: "3px",
        background: open ? accent : "transparent",
        transition: "background 0.25s", borderRadius: "0 18px 18px 0",
      }} />

      <button onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%", padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "inherit", color: ui.text, position: "relative",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
            background: open ? accent + "18" : (isDark ? "#1A1A1A" : "#F1F5F9"),
            border: `1px solid ${open ? accent + "40" : (isDark ? "#2A2A2A" : "#E5E7EB")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 900,
            color: open ? accent : ui.muted, transition: "all 0.25s",
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>
          <span style={{
            fontSize: "14px", fontWeight: 700,
            color: open ? ui.text : (isDark ? "#D1D5DB" : "#374151"),
            textAlign: "start", lineHeight: 1.45,
          }}>
            {q}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}
          style={{
            width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
            background: open ? accent + "18" : "transparent",
            border: `1px solid ${open ? accent + "40" : (isDark ? "#2A2A2A" : "#E5E7EB")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: open ? accent : ui.muted,
            transition: "background 0.25s, border-color 0.25s, color 0.25s",
          }}>
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>
            <div style={{
              padding: "0 22px 20px 22px",
              borderTop: `1px solid ${isDark ? "#1A1A1A" : "#F1F5F9"}`,
              paddingTop: "16px",
            }}>
              <div style={{ borderRight: `3px solid ${accent}`, paddingRight: "14px" }}>
                <p style={{ fontSize: "13px", color: ui.muted, lineHeight: 1.8, margin: 0 }}>
                  {a}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqPage() {
  const { t }     = useTranslation();
  const { theme } = useTheme();
  const isDark    = theme === "dark";

  const ui = {
    bg:         isDark ? "#0A0A0A" : "#F7F6F2",
    panel:      isDark ? "#111111" : "#FFFFFF",
    panel2:     isDark ? "#161616" : "#F8FAFC",
    border:     isDark ? "#1E1E1E" : "#E5E7EB",
    borderGold: isDark ? "#C9A84C2A" : "#C9A84C3A",
    text:       isDark ? "#E5E7EB" : "#111111",
    muted:      isDark ? "#6B7280" : "#9CA3AF",
  };

  const faqs = [
    { q: t("faq.questions.q1"), a: t("faq.questions.a1") },
    { q: t("faq.questions.q2"), a: t("faq.questions.a2") },
    { q: t("faq.questions.q3"), a: t("faq.questions.a3") },
    { q: t("faq.questions.q4"), a: t("faq.questions.a4") },
    { q: t("faq.questions.q5"), a: t("faq.questions.a5") },
    { q: t("faq.questions.q6"), a: t("faq.questions.a6") },
    { q: t("faq.questions.q7"), a: t("faq.questions.a7") },
  ];

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: ui.bg, color: ui.text,
      padding: "60px 24px 80px",
      overflow: "hidden",
    }}>
      <Orbs isDark={isDark} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          style={{
            background: ui.panel, border: `1px solid ${ui.border}`,
            borderRadius: "28px", padding: "44px 40px", marginBottom: "28px",
            boxShadow: isDark
              ? "0 0 0 1px #C9A84C08, 0 24px 60px #00000080"
              : "0 0 0 1px #C9A84C08, 0 24px 60px rgba(0,0,0,0.09)",
            position: "relative", overflow: "hidden",
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: "32px", alignItems: "center",
          }}
          className="faq-hero">
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "2px",
            background: "linear-gradient(90deg, transparent, #C9A84C, #4A90D9, transparent)",
          }} />
          <div style={{
            position: "absolute", top: "-50px", right: "-50px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#C9A84C", opacity: 0.03, filter: "blur(60px)", pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: isDark ? "#C9A84C12" : "#C9A84C0E",
              border: `1px solid ${ui.borderGold}`,
              borderRadius: "40px", padding: "5px 14px", marginBottom: "18px",
            }}>
              <HelpCircle size={12} color="#C9A84C" />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#C9A84C", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {t("faq.tagline")}
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(20px, 2.8vw, 30px)", fontWeight: 900,
              color: ui.text, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.3,
            }}>
              {t("faq.title")}
            </h1>
            <p style={{ fontSize: "13px", color: ui.muted, lineHeight: 1.75, margin: 0, maxWidth: "480px" }}>
              {t("faq.description")}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
              {[
                { label: t("faq.stats.questions", { count: faqs.length }), color: "#C9A84C" },
                { label: t("faq.stats.support"),                            color: "#2E8B57" },
                { label: t("faq.stats.updated"),                            color: "#4A90D9" },
              ].map((p) => (
                <div key={p.label} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: isDark ? "#161616" : "#F8FAFC",
                  border: `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
                  borderRadius: "40px", padding: "5px 12px",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, boxShadow: `0 0 5px ${p.color}80` }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: ui.text }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="faq-badge" style={{ flexShrink: 0 }}>
            <RotatingBadge isDark={isDark} />
          </div>
        </motion.div>

        {/* ── FAQ items ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
          {faqs.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} index={i} isDark={isDark} />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            marginTop: "28px", background: ui.panel,
            border: `1px solid ${ui.border}`, borderRadius: "22px",
            padding: "28px 32px", textAlign: "center",
            boxShadow: isDark ? "0 4px 24px #00000060" : "0 4px 16px rgba(0,0,0,0.06)",
            position: "relative", overflow: "hidden",
          }}>
          <div style={{
            position: "absolute", top: 0, left: "20%", right: "20%", height: "2px",
            background: "linear-gradient(90deg, transparent, #2E8B57, transparent)",
          }} />
          <p style={{ fontSize: "14px", fontWeight: 700, color: ui.text, margin: "0 0 6px" }}>
            {t("faq.cta.title")}
          </p>
          <p style={{ fontSize: "12px", color: ui.muted, margin: "0 0 18px" }}>
            {t("faq.cta.subtitle")}
          </p>
          <a href="/contact-us"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 28px", borderRadius: "40px", fontSize: "13px", fontWeight: 800,
              background: "linear-gradient(135deg, #C9A84C 0%, #E8C56A 45%, #2E8B57 100%)",
              color: "#060606", textDecoration: "none",
              boxShadow: "0 4px 16px #C9A84C30", transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {t("faq.cta.button")}
          </a>
        </motion.div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .faq-hero  { grid-template-columns: 1fr !important; }
          .faq-badge { display: none !important; }
        }
      `}</style>
    </div>
  );
}