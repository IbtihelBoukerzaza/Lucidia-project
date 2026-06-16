import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { api } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import gantraLogo from "../assets/gantra-logo (2).png";

const ACCENT = "#8B5CF6";

// ─── Orbs ─────────────────────────────────────────────────────────────────────
function Orbs({ isDark }) {
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{
        position:"absolute", top:"-120px", right:"-80px",
        width:"420px", height:"420px", borderRadius:"50%",
        background: isDark
          ? "radial-gradient(circle, #8B5CF614 0%, transparent 70%)"
          : "radial-gradient(circle, #8B5CF60A 0%, transparent 70%)",
      }} />
      <div style={{
        position:"absolute", bottom:"-100px", left:"-60px",
        width:"360px", height:"360px", borderRadius:"50%",
        background: isDark
          ? "radial-gradient(circle, #C9A84C10 0%, transparent 70%)"
          : "radial-gradient(circle, #C9A84C08 0%, transparent 70%)",
      }} />
    </div>
  );
}

// ─── Language Switcher ────────────────────────────────────────────────────────
function LangSwitcher({ isDark }) {
  const { i18n } = useTranslation();
  return (
    <div style={{ display:"flex", gap:"4px" }}>
      {["ar","en","fr"].map((l) => (
        <button
          key={l}
          onClick={() => { i18n.changeLanguage(l); localStorage.setItem("i18nextLng", l); }}
          style={{
            padding:"4px 9px", borderRadius:"7px", fontSize:"11px", fontWeight:700,
            textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s",
            border:`1px solid ${i18n.language?.startsWith(l) ? "#C9A84C44" : (isDark?"#1E1E1E":"#E5E7EB")}`,
            background: i18n.language?.startsWith(l) ? (isDark?"#C9A84C15":"#C9A84C10") : "transparent",
            color: i18n.language?.startsWith(l) ? "#C9A84C" : (isDark?"#6B7280":"#9CA3AF"),
          }}
        >{l}</button>
      ))}
    </div>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ isDark, toggleTheme, border, panel }) {
  return (
    <button
      onClick={toggleTheme}
      style={{
        width:"34px", height:"34px", borderRadius:"50%",
        background:panel, border:`1px solid ${border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize:"15px",
        boxShadow: isDark ? "0 2px 8px #00000060" : "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, max = 5, isDark }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= (hovered || value || 0);
        return (
          <button
            key={star} type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              fontSize:"28px", background:"none", border:"none",
              cursor:"pointer", transition:"transform 0.15s",
              color: filled ? "#F59E0B" : (isDark?"#2A2A2A":"#D1D5DB"),
              transform: hovered === star ? "scale(1.2)" : "scale(1)",
              lineHeight:1,
            }}
          >★</button>
        );
      })}
    </div>
  );
}

// ─── NPS Rating ───────────────────────────────────────────────────────────────
function NPSRating({ value, onChange, isDark, t }) {
  const getColor = (n) => {
    if (n <= 6)  return { bg:"#E53E3E", dim:"#E53E3E15", border:"#E53E3E40" };
    if (n <= 8)  return { bg:"#F59E0B", dim:"#F59E0B15", border:"#F59E0B40" };
    return              { bg:"#2E8B57", dim:"#2E8B5715", border:"#2E8B5740" };
  };
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", justifyContent:"flex-end", marginBottom:"10px" }}>
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const c = getColor(n);
          const selected = value === n;
          return (
            <motion.button
              key={n} type="button"
              onClick={() => onChange(n)}
              whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
              style={{
                width:"40px", height:"40px", borderRadius:"10px",
                fontSize:"13px", fontWeight:800, cursor:"pointer",
                border:`1px solid ${selected ? c.border : (isDark?"#2A2A2A":"#E5E7EB")}`,
                background: selected ? c.dim : "transparent",
                color: selected ? c.bg : (isDark?"#6B7280":"#9CA3AF"),
                transition:"all 0.2s",
              }}
            >{n}</motion.button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:isDark?"#6B7280":"#9CA3AF" }}>
        <span>{t("publicSurvey.nps.notAtAll")}</span>
        <span>{t("publicSurvey.nps.definitely")}</span>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh" }}>
      <div style={{
        width:"36px", height:"36px", borderRadius:"50%",
        border:`2px solid ${ACCENT}`, borderTopColor:"transparent",
        animation:"publicSpin 0.7s linear infinite",
      }} />
      <style>{`@keyframes publicSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicSurveyPage() {
  const { token }             = useParams();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n }           = useTranslation();
  const isDark                = theme === "dark";
  const isRTL                 = i18n.language?.startsWith("ar");

  const [survey,      setSurvey]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [answers,     setAnswers]     = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await api.getPublicSurvey(token);
        const data = await res.json();
        if (!res.ok) { setError(data.detail || t("publicSurvey.errors.notAvailable")); return; }
        setSurvey(data);
        const init = {};
        data.questions.forEach((q) => {
          init[q.id] = q.question_type === "rating" || q.question_type === "nps" ? null : "";
        });
        setAnswers(init);
      } catch {
        setError(t("publicSurvey.errors.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const setAnswer = (qId, value) => setAnswers((prev) => ({ ...prev, [qId]: value }));

  const handleSubmit = async () => {
    setSubmitError("");
    const payload = survey.questions.map((q) => {
      const val = answers[q.id];
      if (q.question_type === "text" || q.question_type === "multiple_choice") {
        return { question_id: q.id, answer_text: val || "" };
      }
      return { question_id: q.id, rating: val ?? null };
    });
    setSubmitting(true);
    try {
      const res  = await api.submitPublicSurvey(token, { answers: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("publicSurvey.errors.submitFailed"));
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Navbar (shared across all states) ─────────────────────────────────────
  const Navbar = () => (
    <nav style={{
      position:"sticky", top:0, zIndex:10,
      background: isDark ? "rgba(10,10,10,0.85)" : "rgba(247,246,242,0.85)",
      borderBottom:`1px solid ${ui.border}`,
      backdropFilter:"blur(14px)",
    }}>
      <div style={{
        maxWidth:"760px", margin:"0 auto",
        height:"60px", padding:"0 1.5rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <LangSwitcher isDark={isDark} />
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} border={ui.border} panel={ui.panel} />
        </div>
        <img
          src={gantraLogo}
          alt="Gantra"
          style={{ height:"40px", filter: isDark ? "none" : "brightness(0.85)", transition:"filter 0.3s" }}
        />
      </div>
    </nav>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:ui.bg }}>
      <Orbs isDark={isDark} />
      <Spinner />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div dir={isRTL?"rtl":"ltr"} style={{ minHeight:"100vh", background:ui.bg, color:ui.text }}>
      <Orbs isDark={isDark} />
      <Navbar />
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", minHeight:"calc(100vh - 60px)",
        padding:"24px", position:"relative", zIndex:1,
      }}>
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{
            maxWidth:"420px", width:"100%", padding:"40px 32px",
            background:ui.panel, border:"1px solid #E53E3E30",
            borderRadius:"24px", textAlign:"center",
            boxShadow: isDark ? "0 24px 60px #00000080" : "0 24px 40px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{
            width:"56px", height:"56px", borderRadius:"16px",
            background:"#E53E3E12", border:"1px solid #E53E3E30",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 16px", color:"#E53E3E",
          }}>
            <AlertCircle size={26} />
          </div>
          <h2 style={{ fontSize:"17px", fontWeight:800, color:"#E53E3E", margin:"0 0 8px" }}>
            {t("publicSurvey.errors.title")}
          </h2>
          <p style={{ fontSize:"13px", color:ui.muted, margin:0, lineHeight:1.6 }}>{error}</p>
        </motion.div>
      </div>
    </div>
  );

  // ── Submitted ──────────────────────────────────────────────────────────────
  if (submitted) return (
    <div dir={isRTL?"rtl":"ltr"} style={{ minHeight:"100vh", background:ui.bg, color:ui.text }}>
      <Orbs isDark={isDark} />
      <Navbar />
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", minHeight:"calc(100vh - 60px)",
        padding:"24px", position:"relative", zIndex:1,
      }}>
        <motion.div
          initial={{ opacity:0, scale:0.9, y:20 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.5, ease:"easeOut" }}
          style={{
            maxWidth:"420px", width:"100%", padding:"48px 32px",
            background:ui.panel, border:`1px solid ${ui.border}`,
            borderRadius:"24px", textAlign:"center",
            boxShadow: isDark ? "0 24px 60px #00000080" : "0 24px 40px rgba(0,0,0,0.1)",
            position:"relative", overflow:"hidden",
          }}
        >
          {/* top accent */}
          <div style={{
            position:"absolute", top:0, left:"15%", right:"15%", height:"2px",
            background:"linear-gradient(90deg, transparent, #2E8B57, #C9A84C, transparent)",
          }} />

          {/* Checkmark */}
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ delay:0.2, type:"spring", stiffness:200 }}
            style={{
              width:"64px", height:"64px", borderRadius:"50%",
              background:"#2E8B5715", border:"1px solid #2E8B5730",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 20px", color:"#2E8B57",
            }}
          >
            <CheckCircle2 size={32} />
          </motion.div>

          <h2 style={{ fontSize:"22px", fontWeight:900, color:"#2E8B57", margin:"0 0 10px" }}>
            {t("publicSurvey.submitted.title")}
          </h2>
          <p style={{ fontSize:"14px", color:ui.muted, margin:"0 0 24px", lineHeight:1.6 }}>
            {t("publicSurvey.submitted.message")}
          </p>

          {/* Powered by */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"8px",
            padding:"8px 16px", borderRadius:"99px",
            background: isDark ? "#C9A84C0D" : "#C9A84C0A",
            border:`1px solid ${ui.borderGold}`,
          }}>
            <img src={gantraLogo} alt="Gantra" style={{ height:"20px", filter: isDark?"none":"brightness(0.85)" }} />
            <span style={{ fontSize:"11px", color:ui.muted }}>
              {t("publicSurvey.submitted.poweredBy")}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── Survey form ────────────────────────────────────────────────────────────
  return (
    <div dir={isRTL?"rtl":"ltr"} style={{ minHeight:"100vh", background:ui.bg, color:ui.text, position:"relative" }}>
      <Orbs isDark={isDark} />
      <Navbar />

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"2.5rem 1.5rem 4rem", position:"relative", zIndex:1 }}>

        {/* ── Survey header card ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          style={{
            padding:"28px 32px", borderRadius:"24px",
            background:ui.panel, border:`1px solid ${ui.border}`,
            marginBottom:"24px", position:"relative", overflow:"hidden",
            boxShadow: isDark ? "0 2px 24px #00000060" : "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          {/* Top accent line */}
          <div style={{
            position:"absolute", top:0, left:"10%", right:"10%", height:"2px",
            background:`linear-gradient(90deg, transparent, ${ACCENT}, #C9A84C, transparent)`,
          }} />
          {/* Blob */}
          <div style={{
            position:"absolute", top:"-30px", right:"-30px",
            width:"140px", height:"140px", borderRadius:"50%",
            background:ACCENT, opacity:0.04, filter:"blur(32px)", pointerEvents:"none",
          }} />

          {/* Badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"4px 12px", borderRadius:"99px", marginBottom:"14px",
            background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`,
            color:ACCENT, fontSize:"11px", fontWeight:700,
          }}>
            {t("publicSurvey.badge")}
          </div>

          <h1 style={{ fontSize:"22px", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.02em" }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p style={{ fontSize:"14px", color:ui.muted, margin:0, lineHeight:1.65 }}>
              {survey.description}
            </p>
          )}

          {/* Progress info */}
          <div style={{
            display:"flex", alignItems:"center", gap:"8px",
            marginTop:"16px", paddingTop:"16px", borderTop:`1px solid ${ui.border}`,
          }}>
            <span style={{ fontSize:"12px", color:ui.muted }}>
              {survey.questions.length} {t("publicSurvey.questionsCount")}
            </span>
            <span style={{ fontSize:"12px", color:isDark?"#2A2A2A":"#D1D5DB" }}>•</span>
            <span style={{ fontSize:"12px", color:ui.muted }}>
              {t("publicSurvey.anonymous")}
            </span>
          </div>
        </motion.div>

        {/* ── Questions ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {survey.questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.08 * idx, duration:0.4 }}
              style={{
                padding:"24px", borderRadius:"20px",
                background:ui.panel, border:`1px solid ${ui.border}`,
                boxShadow: isDark ? "0 2px 12px #00000040" : "0 2px 8px rgba(0,0,0,0.05)",
                position:"relative", overflow:"hidden",
              }}
            >
              {/* Left/right accent bar */}
              <div style={{
                position:"absolute",
                top:0, bottom:0,
                [isRTL?"right":"left"]: 0,
                width:"3px",
                background: answers[q.id] !== null && answers[q.id] !== "" && answers[q.id] !== undefined
                  ? "#2E8B57"
                  : ACCENT,
                transition:"background 0.3s",
              }} />

              {/* Question number + text */}
              <div style={{ marginBottom:"16px", paddingRight: isRTL?"12px":"0", paddingLeft: isRTL?"0":"12px" }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:"8px" }}>
                  <span style={{
                    fontSize:"11px", fontWeight:800, color:ACCENT,
                    background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`,
                    padding:"2px 8px", borderRadius:"6px", flexShrink:0,
                  }}>
                    {idx + 1}
                  </span>
                  <p style={{ fontSize:"14px", fontWeight:700, color:ui.text, margin:0, lineHeight:1.5 }}>
                    {q.question_text}
                  </p>
                </div>
              </div>

              {/* ── Text answer ── */}
              {q.question_type === "text" && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={3}
                  placeholder={t("publicSurvey.textPlaceholder")}
                  style={{
                    width:"100%", padding:"12px 14px",
                    borderRadius:"12px", fontSize:"13px",
                    background:ui.input, border:`1px solid ${ui.inputBorder}`,
                    color:ui.text, outline:"none", resize:"none",
                    direction:isRTL?"rtl":"ltr", textAlign:isRTL?"right":"left",
                    fontFamily:"inherit", boxSizing:"border-box",
                    transition:"border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                  onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
                />
              )}

              {/* ── Star rating ── */}
              {q.question_type === "rating" && (
                <StarRating
                  value={answers[q.id] || 0}
                  onChange={(val) => setAnswer(q.id, val)}
                  max={5} isDark={isDark}
                />
              )}

              {/* ── NPS ── */}
              {q.question_type === "nps" && (
                <NPSRating
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                  isDark={isDark} t={t}
                />
              )}

              {/* ── Multiple choice ── */}
              {q.question_type === "multiple_choice" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {(q.choices || []).map((choice) => {
                    const selected = answers[q.id] === choice;
                    return (
                      <motion.button
                        key={choice} type="button"
                        onClick={() => setAnswer(q.id, choice)}
                        whileHover={{ x: isRTL ? -3 : 3 }}
                        whileTap={{ scale:0.99 }}
                        style={{
                          width:"100%", textAlign:isRTL?"right":"left",
                          padding:"12px 16px", borderRadius:"12px",
                          border:`1px solid ${selected ? `${ACCENT}50` : ui.inputBorder}`,
                          background: selected ? `${ACCENT}10` : ui.input,
                          color: selected ? ACCENT : ui.text,
                          fontSize:"13px", fontWeight: selected ? 700 : 400,
                          cursor:"pointer", transition:"all 0.2s",
                          display:"flex", alignItems:"center",
                          justifyContent:"space-between",
                        }}
                      >
                        <span>{choice}</span>
                        {selected && (
                          <span style={{
                            width:"18px", height:"18px", borderRadius:"50%",
                            background:ACCENT, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:"10px", color:"#fff", flexShrink:0,
                          }}>✓</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Answered indicator */}
              <AnimatePresence>
                {answers[q.id] !== null && answers[q.id] !== "" && answers[q.id] !== undefined && (
                  <motion.div
                    initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{
                      marginTop:"12px", fontSize:"11px", color:"#2E8B57",
                      display:"flex", alignItems:"center", gap:"4px",
                      justifyContent: isRTL ? "flex-start" : "flex-end",
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {t("publicSurvey.answered")}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ── Submit error ── */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                marginTop:"20px", padding:"12px 16px", borderRadius:"12px",
                background:"#E53E3E12", border:"1px solid #E53E3E30",
                color:"#E53E3E", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px",
              }}
            >
              <AlertCircle size={15} />
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit button ── */}
        <motion.button
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          onClick={handleSubmit} disabled={submitting}
          whileHover={!submitting ? { scale:1.015 } : {}}
          whileTap={!submitting ? { scale:0.985 } : {}}
          style={{
            width:"100%", marginTop:"24px", padding:"15px",
            borderRadius:"16px", fontSize:"15px", fontWeight:800,
            background: submitting
              ? (isDark?"#1A1A1A":"#E5E7EB")
              : `linear-gradient(135deg, ${ACCENT}, #A78BFA 50%, #C9A84C)`,
            color: submitting ? ui.muted : "#fff",
            border:"none", cursor: submitting ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
            boxShadow: submitting ? "none" : `0 6px 24px ${ACCENT}40`,
            letterSpacing:"-0.01em",
            transition:"box-shadow 0.3s",
          }}
        >
          {submitting ? (
            <>
              <span style={{
                width:"16px", height:"16px",
                border:`2px solid ${ui.muted}`, borderTopColor:"transparent",
                borderRadius:"50%", display:"inline-block",
                animation:"publicSpin 0.7s linear infinite",
              }} />
              {t("publicSurvey.submitting")}
            </>
          ) : (
            <><Send size={16} />{t("publicSurvey.submit")}</>
          )}
        </motion.button>

        {/* Powered by footer */}
        <div style={{ textAlign:"center", marginTop:"32px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          <span style={{ fontSize:"12px", color:isDark?"#2A2A2A":"#D1D5DB" }}>
            {t("publicSurvey.poweredBy")}
          </span>
          <img src={gantraLogo} alt="Gantra" style={{ height:"18px", opacity:0.4, filter: isDark?"none":"brightness(0.7)" }} />
        </div>
      </div>

      <style>{`@keyframes publicSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}