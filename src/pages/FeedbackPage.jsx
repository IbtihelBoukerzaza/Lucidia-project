import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareHeart, Star, CheckCircle2, AlertCircle, Send, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

const ACCENT = "#C9A84C";

// ─── NPS selector ────────────────────────────────────────────────────────────
function NPSSelector({ value, onChange, isDark, ui }) {
  const [hovered, setHovered] = useState(null);
  const getColor = (n) => {
    if (n <= 6)  return "#E53E3E";
    if (n <= 8)  return "#F59E0B";
    return "#2E8B57";
  };
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", justifyContent:"center", marginBottom:"10px" }}>
        {Array.from({ length:11 }, (_,i) => i).map((n) => {
          const color    = getColor(n);
          const selected = value === n;
          const isHov    = hovered === n;
          return (
            <motion.button
              key={n} type="button"
              onClick={() => onChange(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale:1.12 }} whileTap={{ scale:0.95 }}
              style={{
                width:"42px", height:"42px", borderRadius:"11px",
                fontSize:"14px", fontWeight:800, cursor:"pointer",
                border:`1px solid ${selected || isHov ? color+"60" : ui.inputBorder}`,
                background: selected ? `${color}20` : isHov ? `${color}10` : "transparent",
                color: selected || isHov ? color : ui.muted,
                transition:"all 0.15s",
              }}
            >{n}</motion.button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:ui.muted }}>
        <span>😞 لن أوصي أبداً</span>
        <span>بالتأكيد سأوصي 😍</span>
      </div>
    </div>
  );
}

// ─── Star rater ───────────────────────────────────────────────────────────────
function StarRater({ value, onChange, isDark }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display:"flex", gap:"8px" }}>
      {[1,2,3,4,5].map((star) => {
        const filled = star <= (hovered || value || 0);
        return (
          <motion.button
            key={star} type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
            style={{
              fontSize:"28px", background:"none", border:"none",
              cursor:"pointer", lineHeight:1, padding:0,
              color: filled ? "#F59E0B" : (isDark?"#2A2A2A":"#D1D5DB"),
              transition:"color 0.15s",
            }}
          >★</motion.button>
        );
      })}
      {value > 0 && (
        <span style={{ fontSize:"13px", color:ui_color(value), fontWeight:700, alignSelf:"center", marginRight:"6px" }}>
          {["","ضعيف","مقبول","جيد","جيد جداً","ممتاز"][value]}
        </span>
      )}
    </div>
  );
}

function ui_color(v) {
  if (v <= 2) return "#E53E3E";
  if (v === 3) return "#F59E0B";
  return "#2E8B57";
}

// ─── Question block ───────────────────────────────────────────────────────────
function QuestionBlock({ number, label, hint, children, isDark, ui }) {
  return (
    <div style={{
      padding:"20px 24px", borderRadius:"16px",
      background:ui.panel2, border:`1px solid ${ui.border}`,
      position:"relative",
    }}>
      <div style={{
        position:"absolute", top:0, bottom:0, right:0,
        width:"3px", borderRadius:"0 16px 16px 0",
        background:ACCENT, opacity:0.5,
      }} />
      <div style={{ marginBottom:"14px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"4px" }}>
          <span style={{
            fontSize:"11px", fontWeight:800, color:ACCENT,
            background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`,
            padding:"2px 8px", borderRadius:"6px", flexShrink:0,
          }}>{number}</span>
          <p style={{ fontSize:"14px", fontWeight:700, color:ui.text, margin:0 }}>{label}</p>
        </div>
        {hint && <p style={{ fontSize:"12px", color:ui.muted, margin:"0 0 0 30px" }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { user, activeCompany } = useAuth();
  const { theme }  = useTheme();
  const { t }      = useTranslation();
  const isDark     = theme === "dark";

  const ui = {
    bg:          isDark ? "#0A0A0A" : "#F7F6F2",
    panel:       isDark ? "#111111" : "#FFFFFF",
    panel2:      isDark ? "#161616" : "#F8FAFC",
    border:      isDark ? "#1E1E1E" : "#E5E7EB",
    text:        isDark ? "#E5E7EB" : "#111111",
    muted:       isDark ? "#6B7280" : "#9CA3AF",
    input:       isDark ? "#0D0D0D" : "#F8FAFC",
    inputBorder: isDark ? "#262626" : "#D1D5DB",
  };

  const [nps,         setNps]         = useState(null);
  const [accuracy,    setAccuracy]    = useState(0);
  const [usability,   setUsability]   = useState(0);
  const [coverage,    setCoverage]    = useState(0);
  const [comment,     setComment]     = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");
  const [existing,    setExisting]    = useState(null); // previous submission
  const [loading,     setLoading]     = useState(true);

  // Load existing feedback on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await api.getMyFeedback();
        if (res.ok) {
          const data = await res.json();
          setExisting(data);
          setNps(data.nps_score);
          setAccuracy(data.accuracy_rating);
          setUsability(data.usability_rating);
          setCoverage(data.coverage_rating);
          setComment(data.comment || "");
          setDisplayName(data.display_name || "");
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (nps === null)    { setError(t("feedback.errors.npsRequired"));      return; }
    if (!accuracy)       { setError(t("feedback.errors.accuracyRequired"));  return; }
    if (!usability)      { setError(t("feedback.errors.usabilityRequired")); return; }
    if (!coverage)       { setError(t("feedback.errors.coverageRequired"));  return; }

    setSubmitting(true);
    try {
      const res = await api.submitFeedback({
        nps_score:       nps,
        accuracy_rating:  accuracy,
        usability_rating: usability,
        coverage_rating:  coverage,
        comment:          comment.trim(),
        display_name:     displayName.trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("feedback.errors.submitFailed"));
      setSubmitted(true);
      setExisting(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div dir="rtl" style={{ minHeight:"100vh", background:ui.bg, color:ui.text,
                               display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
        <motion.div
          initial={{ opacity:0, scale:0.9, y:20 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.5 }}
          style={{
            maxWidth:"420px", width:"100%", padding:"48px 32px",
            background:ui.panel, border:`1px solid ${ui.border}`,
            borderRadius:"28px", textAlign:"center",
            boxShadow: isDark ? "0 24px 60px #00000080" : "0 24px 40px rgba(0,0,0,0.1)",
            position:"relative", overflow:"hidden",
          }}
        >
          <div style={{
            position:"absolute", top:0, left:"15%", right:"15%", height:"2px",
            background:"linear-gradient(90deg, transparent, #2E8B57, #C9A84C, transparent)",
          }} />
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
            {t("feedback.submitted.title")}
          </h2>
          <p style={{ fontSize:"14px", color:ui.muted, margin:"0 0 24px", lineHeight:1.6 }}>
            {t("feedback.submitted.message")}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            style={{
              display:"inline-flex", alignItems:"center", gap:"6px",
              padding:"10px 20px", borderRadius:"12px", fontSize:"13px", fontWeight:700,
              background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`,
              color:ACCENT, cursor:"pointer",
            }}
          >
            <RefreshCw size={14} />
            {t("feedback.submitted.edit")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:ui.bg, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
        <div style={{
          width:"32px", height:"32px", borderRadius:"50%",
          border:`2px solid ${ACCENT}`, borderTopColor:"transparent",
          animation:"fbSpin 0.7s linear infinite",
        }} />
        <style>{`@keyframes fbSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:ui.bg, color:ui.text }}>
      {/* BG orbs */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <div style={{
          position:"absolute", top:"-120px", right:"-80px",
          width:"400px", height:"400px", borderRadius:"50%",
          background: isDark
            ? "radial-gradient(circle, #C9A84C12 0%, transparent 70%)"
            : "radial-gradient(circle, #C9A84C08 0%, transparent 70%)",
        }} />
        <div style={{
          position:"absolute", bottom:"-100px", left:"-60px",
          width:"360px", height:"360px", borderRadius:"50%",
          background: isDark
            ? "radial-gradient(circle, #2E8B5710 0%, transparent 70%)"
            : "radial-gradient(circle, #2E8B5708 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"2.5rem 1.5rem 4rem", position:"relative", zIndex:1 }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          style={{
            padding:"28px 32px", borderRadius:"24px",
            background:ui.panel, border:`1px solid ${ui.border}`,
            marginBottom:"24px", position:"relative", overflow:"hidden",
            boxShadow: isDark ? "0 2px 24px #00000060" : "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{
            position:"absolute", top:0, left:"10%", right:"10%", height:"2px",
            background:`linear-gradient(90deg, transparent, ${ACCENT}, #2E8B57, transparent)`,
          }} />
          <div style={{
            position:"absolute", top:"-30px", right:"-30px",
            width:"140px", height:"140px", borderRadius:"50%",
            background:ACCENT, opacity:0.04, filter:"blur(32px)", pointerEvents:"none",
          }} />

          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"4px 12px", borderRadius:"99px", marginBottom:"14px",
            background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`,
            color:ACCENT, fontSize:"11px", fontWeight:700,
          }}>
            <MessageSquareHeart size={12} />
            {t("feedback.badge")}
          </div>

          <h1 style={{ fontSize:"22px", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.02em" }}>
            {t("feedback.title")}
          </h1>
          <p style={{ fontSize:"14px", color:ui.muted, margin:"0 0 12px", lineHeight:1.65 }}>
            {t("feedback.description")}
          </p>

          {/* User pill */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <span style={{
              padding:"5px 14px", borderRadius:"99px", fontSize:"12px", fontWeight:700,
              background:`${ACCENT}0E`, border:`1px solid ${ACCENT}25`, color:ACCENT,
            }}>
              {user?.first_name || user?.email}
            </span>
            {activeCompany && (
              <span style={{
                padding:"5px 14px", borderRadius:"99px", fontSize:"12px", fontWeight:700,
                background:"#2E8B5710", border:"1px solid #2E8B5725", color:"#2E8B57",
              }}>
                {activeCompany.name}
              </span>
            )}
            {existing && (
              <span style={{
                padding:"5px 14px", borderRadius:"99px", fontSize:"11px", fontWeight:600,
                background:"#4A90D910", border:"1px solid #4A90D925", color:"#4A90D9",
              }}>
                {t("feedback.editMode")}
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Questions ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

          {/* Q1 — NPS */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}>
            <QuestionBlock
              number="1" isDark={isDark} ui={ui}
              label={t("feedback.q1.label")}
              hint={t("feedback.q1.hint")}
            >
              <NPSSelector value={nps} onChange={setNps} isDark={isDark} ui={ui} />
            </QuestionBlock>
          </motion.div>

          {/* Q2 — Accuracy */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}>
            <QuestionBlock
              number="2" isDark={isDark} ui={ui}
              label={t("feedback.q2.label")}
              hint={t("feedback.q2.hint")}
            >
              <StarRater value={accuracy} onChange={setAccuracy} isDark={isDark} />
            </QuestionBlock>
          </motion.div>

          {/* Q3 — Usability */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <QuestionBlock
              number="3" isDark={isDark} ui={ui}
              label={t("feedback.q3.label")}
              hint={t("feedback.q3.hint")}
            >
              <StarRater value={usability} onChange={setUsability} isDark={isDark} />
            </QuestionBlock>
          </motion.div>

          {/* Q4 — Coverage */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.26 }}>
            <QuestionBlock
              number="4" isDark={isDark} ui={ui}
              label={t("feedback.q4.label")}
              hint={t("feedback.q4.hint")}
            >
              <StarRater value={coverage} onChange={setCoverage} isDark={isDark} />
            </QuestionBlock>
          </motion.div>

          {/* Q5 — Comment */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}>
            <QuestionBlock
              number="5" isDark={isDark} ui={ui}
              label={t("feedback.q5.label")}
              hint={t("feedback.q5.hint")}
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder={t("feedback.q5.placeholder")}
                style={{
                  width:"100%", padding:"12px 14px", borderRadius:"12px",
                  fontSize:"13px", background:ui.input,
                  border:`1px solid ${ui.inputBorder}`,
                  color:ui.text, outline:"none", resize:"vertical",
                  direction:"rtl", fontFamily:"inherit", boxSizing:"border-box",
                  transition:"border-color 0.2s", lineHeight:1.6,
                }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
              />
            </QuestionBlock>
          </motion.div>

          {/* Q6 — Display name */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }}>
            <QuestionBlock
              number="6" isDark={isDark} ui={ui}
              label={t("feedback.q6.label")}
              hint={t("feedback.q6.hint")}
            >
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("feedback.q6.placeholder")}
                style={{
                  width:"100%", padding:"11px 14px", borderRadius:"12px",
                  fontSize:"13px", background:ui.input,
                  border:`1px solid ${ui.inputBorder}`,
                  color:ui.text, outline:"none",
                  direction:"rtl", fontFamily:"inherit", boxSizing:"border-box",
                  transition:"border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
              />
            </QuestionBlock>
          </motion.div>
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                marginTop:"16px", padding:"12px 16px", borderRadius:"12px",
                background:"#E53E3E12", border:"1px solid #E53E3E30",
                color:"#E53E3E", fontSize:"13px",
                display:"flex", alignItems:"center", gap:"8px",
              }}
            >
              <AlertCircle size={15} />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit ── */}
        <motion.button
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          onClick={handleSubmit} disabled={submitting}
          whileHover={!submitting ? { scale:1.015 } : {}}
          whileTap={!submitting ? { scale:0.985 } : {}}
          style={{
            width:"100%", marginTop:"20px", padding:"15px",
            borderRadius:"16px", fontSize:"15px", fontWeight:800,
            background: submitting
              ? (isDark?"#1A1A1A":"#E5E7EB")
              : `linear-gradient(135deg, ${ACCENT} 0%, #E8C56A 45%, #2E8B57 100%)`,
            color: submitting ? ui.muted : "#060606",
            border:"none", cursor: submitting ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
            boxShadow: submitting ? "none" : `0 6px 24px ${ACCENT}40`,
            letterSpacing:"-0.01em", transition:"box-shadow 0.3s",
          }}
        >
          {submitting ? (
            <>
              <span style={{
                width:"16px", height:"16px",
                border:`2px solid ${ui.muted}`, borderTopColor:"transparent",
                borderRadius:"50%", display:"inline-block",
                animation:"fbSpin 0.7s linear infinite",
              }} />
              {t("feedback.submitting")}
            </>
          ) : (
            <><Send size={16} />{existing ? t("feedback.update") : t("feedback.submit")}</>
          )}
        </motion.button>

        <p style={{ textAlign:"center", fontSize:"11px", color:isDark?"#2A2A2A":"#D1D5DB", margin:"16px 0 0" }}>
          {t("feedback.privacy")}
        </p>
      </div>
      <style>{`@keyframes fbSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}