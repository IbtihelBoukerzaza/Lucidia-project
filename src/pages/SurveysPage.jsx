import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, X, Copy, BarChart3, Trash2, Settings2, Link2, CheckCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const ACCENT = "#8B5CF6";

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
      <div style={{
        width:"32px", height:"32px", borderRadius:"50%",
        border:`2px solid ${ACCENT}`, borderTopColor:"transparent",
        animation:"surveySpin 0.7s linear infinite",
      }} />
    </div>
  );
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

function QRCode({ url, isDark }) {
  const encoded = encodeURIComponent(url);
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}&bgcolor=${isDark?"0a0a0a":"ffffff"}&color=${isDark?"C9A84C":"111111"}`}
      alt="QR"
      style={{ width:"100px", height:"100px", borderRadius:"12px",
               border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}` }}
    />
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ children, onClose, isDark, maxWidth = "480px" }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"16px",
      background: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.4)",
      backdropFilter:"blur(6px)",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity:0, scale:0.95, y:16 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:16 }}
        transition={{ duration:0.25 }}
        style={{
          width:"100%", maxWidth, maxHeight:"90vh", overflowY:"auto",
          background: isDark ? "#111111" : "#FFFFFF",
          border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
          borderRadius:"24px", padding:"32px 28px",
          boxShadow: isDark ? "0 24px 80px #00000090" : "0 24px 60px rgba(0,0,0,0.15)",
          position:"relative",
        }}
      >
        {/* top accent */}
        <div style={{
          position:"absolute", top:0, left:"15%", right:"15%", height:"2px",
          background:`linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
        }} />
        {children}
      </motion.div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ children, isDark, accent = ACCENT }) {
  return (
    <div style={{
      background: isDark ? "#111111" : "#FFFFFF",
      border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
      borderRadius:"20px", overflow:"hidden",
      boxShadow: isDark ? "0 2px 16px #00000050" : "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{ height:"3px", background:accent }} />
      <div style={{ padding:"24px" }}>{children}</div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({ surveyId, onClose, isDark, t }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const ui = {
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    panel:  isDark ? "#161616" : "#F8FAFC",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getSurveyAnalytics(surveyId);
        const d   = await res.json();
        if (!res.ok) throw new Error(d.detail || t("surveys.errors.loadFailed"));
        setData(d);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [surveyId]);

  return (
    <AnimatePresence>
      <Modal onClose={onClose} isDark={isDark} maxWidth="600px">
        <div dir="rtl">
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{
                width:"36px", height:"36px", borderRadius:"10px",
                background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`,
                display:"flex", alignItems:"center", justifyContent:"center", color:ACCENT,
              }}>
                <BarChart3 size={18} />
              </div>
              <h2 style={{ fontSize:"17px", fontWeight:800, color:ui.text, margin:0 }}>
                {t("surveys.analytics.title")}
              </h2>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:ui.muted, display:"flex" }}>
              <X size={20} />
            </button>
          </div>

          {loading ? <Spinner /> : error ? (
            <div style={{ padding:"12px 16px", borderRadius:"10px", background:"#E53E3E12",
                          border:"1px solid #E53E3E30", color:"#E53E3E", fontSize:"13px" }}>
              {error}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {/* total */}
              <div style={{
                padding:"16px 20px", borderRadius:"14px",
                background:ui.panel, border:`1px solid ${ui.border}`,
                display:"inline-flex", flexDirection:"column", alignSelf:"flex-start",
              }}>
                <span style={{ fontSize:"28px", fontWeight:900, color:ACCENT }}>
                  {data.total_responses}
                </span>
                <span style={{ fontSize:"12px", color:ui.muted }}>
                  {t("surveys.analytics.totalResponses")}
                </span>
              </div>

              {/* per question */}
              {data.questions.map((q) => (
                <div key={q.question_id} style={{
                  padding:"16px", borderRadius:"14px",
                  background:ui.panel, border:`1px solid ${ui.border}`,
                  display:"flex", flexDirection:"column", gap:"10px",
                }}>
                  <p style={{ fontSize:"13px", fontWeight:700, color:ui.text, margin:0 }}>
                    {q.question_text}
                  </p>
                  <p style={{ fontSize:"11px", color:ui.muted, margin:0 }}>
                    {q.answer_count} {t("surveys.analytics.answers")}
                  </p>

                  {/* Average rating */}
                  {q.average_rating != null && (
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <span style={{ fontSize:"22px", fontWeight:900, color:"#F59E0B" }}>
                        {q.average_rating}
                      </span>
                      <span style={{ fontSize:"12px", color:ui.muted }}>
                        {t("surveys.analytics.avgRating")}
                      </span>
                      {q.nps_score != null && (
                        <span style={{
                          fontSize:"12px", fontWeight:700, padding:"3px 10px", borderRadius:"8px",
                          background: q.nps_score >= 50 ? "#2E8B5715" : q.nps_score >= 0 ? "#F59E0B15" : "#E53E3E15",
                          color:      q.nps_score >= 50 ? "#2E8B57"   : q.nps_score >= 0 ? "#F59E0B"   : "#E53E3E",
                        }}>
                          NPS: {q.nps_score}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating distribution bars */}
                  {q.rating_distribution && Object.keys(q.rating_distribution).length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {Object.entries(q.rating_distribution)
                        .sort(([a],[b]) => Number(b)-Number(a))
                        .map(([rating, count]) => {
                          const pct = q.answer_count > 0 ? Math.round((count/q.answer_count)*100) : 0;
                          return (
                            <div key={rating} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"12px" }}>
                              <span style={{ width:"18px", color:ui.muted, textAlign:"right" }}>{rating}</span>
                              <div style={{ flex:1, background:isDark?"#1E1E1E":"#F0F0F0", borderRadius:"99px", height:"6px" }}>
                                <div style={{ width:`${pct}%`, background:ACCENT, borderRadius:"99px", height:"6px", transition:"width 0.4s" }} />
                              </div>
                              <span style={{ width:"30px", color:ui.muted }}>{pct}%</span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Choice distribution */}
                  {q.choice_distribution && Object.keys(q.choice_distribution).length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {Object.entries(q.choice_distribution)
                        .sort(([,a],[,b]) => b-a)
                        .map(([choice, count]) => {
                          const pct = q.answer_count > 0 ? Math.round((count/q.answer_count)*100) : 0;
                          return (
                            <div key={choice} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"12px" }}>
                              <span style={{ flex:1, color:ui.text, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{choice}</span>
                              <div style={{ width:"80px", background:isDark?"#1E1E1E":"#F0F0F0", borderRadius:"99px", height:"6px" }}>
                                <div style={{ width:`${pct}%`, background:"#C9A84C", borderRadius:"99px", height:"6px" }} />
                              </div>
                              <span style={{ width:"24px", color:ui.muted }}>{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Sentiment breakdown */}
                  {q.sentiment_breakdown && (
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      {[
                        { key:"positive", label:t("sentiment.distribution.positive"), color:"#2E8B57" },
                        { key:"neutral",  label:t("sentiment.distribution.neutral"),  color:"#4A90D9" },
                        { key:"negative", label:t("sentiment.distribution.negative"), color:"#E53E3E" },
                      ].map(({ key, label, color }) => (
                        <span key={key} style={{
                          padding:"3px 10px", borderRadius:"8px", fontSize:"12px", fontWeight:600,
                          background:`${color}15`, color,
                        }}>
                          {label}: {q.sentiment_breakdown[key] || 0}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AnimatePresence>
  );
}

// ─── Create Survey Modal ──────────────────────────────────────────────────────

function CreateSurveyModal({ companyId, onCreated, onClose, isDark, t }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [surveyType,  setSurveyType]  = useState("mixed");
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);

  const ui = {
    text:        isDark ? "#E5E7EB" : "#111111",
    muted:       isDark ? "#6B7280" : "#9CA3AF",
    input:       isDark ? "#0D0D0D" : "#F8FAFC",
    inputBorder: isDark ? "#262626" : "#D1D5DB",
    label:       isDark ? "#9CA3AF" : "#6B7280",
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:"12px",
    background:ui.input, border:`1px solid ${ui.inputBorder}`,
    color:ui.text, fontSize:"14px", outline:"none",
    direction:"rtl", fontFamily:"inherit", boxSizing:"border-box",
    transition:"border-color 0.2s",
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim()) { setError(t("surveys.errors.titleRequired")); return; }
    setSaving(true);
    try {
      const res  = await api.createSurvey(companyId, {
        title: title.trim(), description: description.trim(),
        survey_type: surveyType, is_active: true,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("surveys.errors.createFailed"));
      onCreated(data);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <Modal onClose={onClose} isDark={isDark}>
        <div dir="rtl">
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{
                width:"36px", height:"36px", borderRadius:"10px",
                background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`,
                display:"flex", alignItems:"center", justifyContent:"center", color:ACCENT,
              }}>
                <ClipboardList size={18} />
              </div>
              <h2 style={{ fontSize:"17px", fontWeight:800, color:ui.text, margin:0 }}>
                {t("surveys.create.title")}
              </h2>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:ui.muted, display:"flex" }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {/* Title */}
            <div>
              <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:ui.label, marginBottom:"7px" }}>
                {t("surveys.create.titleLabel")} *
              </label>
              <input
                type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("surveys.create.titlePlaceholder")}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:ui.label, marginBottom:"7px" }}>
                {t("surveys.create.descLabel")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t("surveys.create.descPlaceholder")}
                style={{ ...inputStyle, resize:"none" }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
              />
            </div>

            {/* Type */}
            <div>
              <label style={{ display:"block", fontSize:"12px", fontWeight:700, color:ui.label, marginBottom:"7px" }}>
                {t("surveys.create.typeLabel")}
              </label>
              <select
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value)}
                style={{ ...inputStyle, cursor:"pointer" }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
              >
                <option value="mixed">{t("surveys.types.mixed")}</option>
                <option value="nps">{t("surveys.types.nps")}</option>
                <option value="csat">{t("surveys.types.csat")}</option>
                <option value="feedback">{t("surveys.types.feedback")}</option>
              </select>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", borderRadius:"10px",
                            background:"#E53E3E12", border:"1px solid #E53E3E30",
                            color:"#E53E3E", fontSize:"12px" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale:1.015 }} whileTap={{ scale:0.985 }}
              onClick={handleSave} disabled={saving}
              style={{
                width:"100%", padding:"13px",
                borderRadius:"12px", fontSize:"14px", fontWeight:800,
                background: saving ? (isDark?"#1A1A1A":"#E5E7EB") : `linear-gradient(135deg, ${ACCENT}, #A78BFA)`,
                color: saving ? ui.muted : "#fff",
                border:"none", cursor: saving ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                boxShadow: saving ? "none" : `0 4px 20px ${ACCENT}40`,
              }}
            >
              {saving ? (
                <><span style={{ width:"14px", height:"14px", border:`2px solid ${ui.muted}`,
                  borderTopColor:"transparent", borderRadius:"50%", display:"inline-block",
                  animation:"surveySpin 0.7s linear infinite" }} />
                  {t("surveys.create.saving")}</>
              ) : (
                <><Plus size={15} />{t("surveys.create.submit")}</>
              )}
            </motion.button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  );
}

// ─── Survey Detail Modal ──────────────────────────────────────────────────────

const QUESTION_TYPE_KEYS = {
  text:            "surveys.questionTypes.text",
  rating:          "surveys.questionTypes.rating",
  nps:             "surveys.questionTypes.nps",
  multiple_choice: "surveys.questionTypes.multiple_choice",
};

function SurveyDetail({ survey, onClose, onUpdated, isDark, t }) {
  const [questions,     setQuestions]     = useState(survey.questions || []);
  const [showAddQ,      setShowAddQ]      = useState(false);
  const [qType,         setQType]         = useState("text");
  const [qText,         setQText]         = useState("");
  const [qChoices,      setQChoices]      = useState("");
  const [qError,        setQError]        = useState("");
  const [savingQ,       setSavingQ]       = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [toggling,      setToggling]      = useState(false);
  const [copied,        setCopied]        = useState(false);

  const ui = {
    text:        isDark ? "#E5E7EB" : "#111111",
    muted:       isDark ? "#6B7280" : "#9CA3AF",
    panel:       isDark ? "#161616" : "#F8FAFC",
    border:      isDark ? "#1E1E1E" : "#E5E7EB",
    input:       isDark ? "#0D0D0D" : "#F8FAFC",
    inputBorder: isDark ? "#262626" : "#D1D5DB",
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:"12px",
    background:ui.input, border:`1px solid ${ui.inputBorder}`,
    color:ui.text, fontSize:"13px", outline:"none",
    direction:"rtl", fontFamily:"inherit", boxSizing:"border-box",
    transition:"border-color 0.2s",
  };

  const publicUrl = `${window.location.origin}/s/${survey.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const res  = await api.updateSurvey(survey.id, { is_active: !survey.is_active });
      const data = await res.json();
      if (res.ok) onUpdated(data);
    } finally { setToggling(false); }
  };

  const handleAddQuestion = async () => {
    setQError("");
    if (!qText.trim()) { setQError(t("surveys.questions.errorText")); return; }
    if (qType === "multiple_choice" && !qChoices.trim()) {
      setQError(t("surveys.questions.errorChoices")); return;
    }
    setSavingQ(true);
    try {
      const payload = {
        question_text: qText.trim(), question_type: qType, order: questions.length + 1,
      };
      if (qType === "multiple_choice") {
        payload.choices = qChoices.split(",").map((c) => c.trim()).filter(Boolean);
      }
      const res  = await api.addSurveyQuestion(survey.id, payload);
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setQuestions((prev) => [...prev, data]);
      setQText(""); setQChoices(""); setQType("text"); setShowAddQ(false);
    } catch (err) { setQError(err.message); }
    finally { setSavingQ(false); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm(t("surveys.questions.deleteConfirm"))) return;
    await api.deleteSurveyQuestion(survey.id, qId);
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const SURVEY_TYPE_KEYS = {
    nps:"surveys.types.nps", csat:"surveys.types.csat",
    feedback:"surveys.types.feedback", mixed:"surveys.types.mixed",
  };

  return (
    <>
      <AnimatePresence>
        <Modal onClose={onClose} isDark={isDark} maxWidth="580px">
          <div dir="rtl">
            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontSize:"17px", fontWeight:800, color:ui.text, margin:"0 0 4px" }}>
                  {survey.title}
                </h2>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{
                    padding:"3px 10px", borderRadius:"99px", fontSize:"11px", fontWeight:700,
                    background: survey.is_active ? "#2E8B5715" : (isDark?"#1E1E1E":"#F0F0F0"),
                    color:      survey.is_active ? "#2E8B57"   : ui.muted,
                    border:     `1px solid ${survey.is_active ? "#2E8B5730" : ui.border}`,
                  }}>
                    {survey.is_active ? t("surveys.card.active") : t("surveys.card.inactive")}
                  </span>
                  <span style={{ fontSize:"11px", color:ui.muted }}>
                    {t(SURVEY_TYPE_KEYS[survey.survey_type])} — {survey.response_count} {t("surveys.card.responses")}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                <button
                  onClick={handleToggleActive} disabled={toggling}
                  style={{
                    padding:"6px 12px", borderRadius:"10px", fontSize:"12px", fontWeight:700,
                    border:`1px solid ${survey.is_active ? "#2E8B5730" : ui.border}`,
                    background: survey.is_active ? "#2E8B5712" : "transparent",
                    color: survey.is_active ? "#2E8B57" : ui.muted,
                    cursor:"pointer", transition:"all 0.2s",
                  }}
                >
                  {toggling ? "..." : (survey.is_active ? t("surveys.detail.deactivate") : t("surveys.detail.activate"))}
                </button>
                <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:ui.muted, display:"flex" }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Share section */}
            <div style={{
              padding:"16px 20px", borderRadius:"16px",
              background:ui.panel, border:`1px solid ${ui.border}`,
              marginBottom:"16px",
            }}>
              <p style={{ fontSize:"13px", fontWeight:700, color:ui.text, margin:"0 0 14px", display:"flex", alignItems:"center", gap:"6px" }}>
                <Link2 size={14} color={ACCENT} />
                {t("surveys.detail.share")}
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
                <QRCode url={publicUrl} isDark={isDark} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px", minWidth:"0" }}>
                  <div style={{
                    padding:"10px 14px", borderRadius:"10px",
                    background: isDark?"#0A0A0A":"#F0F0F0",
                    border:`1px solid ${ui.border}`,
                    fontSize:"12px", color:ACCENT,
                    overflowWrap:"break-word", wordBreak:"break-all",
                  }}>
                    {publicUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:"6px",
                      alignSelf:"flex-start", padding:"7px 14px",
                      borderRadius:"10px", fontSize:"12px", fontWeight:700,
                      background: copied ? "#2E8B5715" : `${ACCENT}15`,
                      border:`1px solid ${copied ? "#2E8B5730" : `${ACCENT}30`}`,
                      color: copied ? "#2E8B57" : ACCENT,
                      cursor:"pointer", transition:"all 0.25s",
                    }}
                  >
                    {copied ? <><CheckCheck size={13}/>{t("surveys.detail.copied")}</> : <><Copy size={13}/>{t("surveys.detail.copyLink")}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics button */}
            <motion.button
              whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              onClick={() => setShowAnalytics(true)}
              style={{
                width:"100%", padding:"12px",
                borderRadius:"12px", fontSize:"13px", fontWeight:700,
                background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`,
                color:ACCENT, cursor:"pointer", marginBottom:"20px",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
                transition:"all 0.2s",
              }}
            >
              <BarChart3 size={15} />
              {t("surveys.detail.analytics")}
            </motion.button>

            {/* Questions */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                <button
                  onClick={() => { setShowAddQ((v) => !v); setQError(""); }}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:"5px",
                    padding:"7px 13px", borderRadius:"10px", fontSize:"12px", fontWeight:700,
                    background: showAddQ ? "transparent" : `${ACCENT}12`,
                    border:`1px solid ${showAddQ ? ui.border : `${ACCENT}30`}`,
                    color: showAddQ ? ui.muted : ACCENT,
                    cursor:"pointer", transition:"all 0.2s",
                  }}
                >
                  {showAddQ ? <><X size={12}/>{t("surveys.questions.cancel")}</> : <><Plus size={12}/>{t("surveys.questions.add")}</>}
                </button>
                <span style={{ fontSize:"13px", fontWeight:700, color:ui.text }}>
                  {t("surveys.questions.count", { count: questions.length })}
                </span>
              </div>

              {/* Add question form */}
              <AnimatePresence>
                {showAddQ && (
                  <motion.div
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                    exit={{ opacity:0, height:0 }} transition={{ duration:0.25 }}
                    style={{
                      overflow:"hidden", marginBottom:"14px",
                      padding:"16px", borderRadius:"14px",
                      background:ui.panel, border:`1px solid ${ui.border}`,
                    }}
                  >
                    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:ui.muted, marginBottom:"6px" }}>
                          {t("surveys.questions.typeLabel")}
                        </label>
                        <select value={qType} onChange={(e) => setQType(e.target.value)}
                          style={{ ...inputStyle, cursor:"pointer" }}
                          onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                          onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
                        >
                          {Object.entries(QUESTION_TYPE_KEYS).map(([val, key]) => (
                            <option key={val} value={val}>{t(key)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:ui.muted, marginBottom:"6px" }}>
                          {t("surveys.questions.textLabel")} *
                        </label>
                        <input type="text" value={qText}
                          onChange={(e) => setQText(e.target.value)}
                          placeholder={t("surveys.questions.textPlaceholder")}
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                          onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
                        />
                      </div>
                      {qType === "multiple_choice" && (
                        <div>
                          <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:ui.muted, marginBottom:"6px" }}>
                            {t("surveys.questions.choicesLabel")}
                          </label>
                          <input type="text" value={qChoices}
                            onChange={(e) => setQChoices(e.target.value)}
                            placeholder={t("surveys.questions.choicesPlaceholder")}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                            onBlur={(e)  => { e.target.style.borderColor = ui.inputBorder; }}
                          />
                        </div>
                      )}
                      {qError && (
                        <div style={{ padding:"9px 12px", borderRadius:"9px",
                                      background:"#E53E3E12", border:"1px solid #E53E3E30",
                                      color:"#E53E3E", fontSize:"12px" }}>
                          {qError}
                        </div>
                      )}
                      <motion.button
                        whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                        onClick={handleAddQuestion} disabled={savingQ}
                        style={{
                          width:"100%", padding:"11px",
                          borderRadius:"10px", fontSize:"13px", fontWeight:700,
                          background: savingQ ? (isDark?"#1A1A1A":"#E5E7EB") : `${ACCENT}20`,
                          border:`1px solid ${ACCENT}30`, color: savingQ ? ui.muted : ACCENT,
                          cursor: savingQ ? "not-allowed" : "pointer",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                        }}
                      >
                        {savingQ ? (
                          <><span style={{ width:"13px", height:"13px", border:`2px solid ${ui.muted}`,
                            borderTopColor:"transparent", borderRadius:"50%", display:"inline-block",
                            animation:"surveySpin 0.7s linear infinite" }} />
                            {t("surveys.questions.saving")}</>
                        ) : (
                          <><Plus size={14} />{t("surveys.questions.save")}</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question list */}
              {questions.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 0", color:ui.muted, fontSize:"13px" }}>
                  {t("surveys.questions.empty")}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {questions.map((q, idx) => (
                    <div key={q.id} style={{
                      display:"flex", alignItems:"center", gap:"10px",
                      padding:"12px 14px", borderRadius:"12px",
                      background:ui.panel, border:`1px solid ${ui.border}`,
                    }}>
                      <span style={{ fontSize:"11px", color:ui.muted, flexShrink:0 }}>{idx+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:"13px", color:ui.text, margin:"0 0 2px",
                                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {q.question_text}
                        </p>
                        <p style={{ fontSize:"11px", color:ui.muted, margin:0 }}>
                          {t(QUESTION_TYPE_KEYS[q.question_type])}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{ background:"none", border:"none", cursor:"pointer",
                                 color:"#E53E3E", display:"flex", padding:"2px", flexShrink:0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      </AnimatePresence>

      {showAnalytics && (
        <AnalyticsPanel
          surveyId={survey.id}
          onClose={() => setShowAnalytics(false)}
          isDark={isDark} t={t}
        />
      )}
    </>
  );
}

// ─── Survey Card ──────────────────────────────────────────────────────────────

function SurveyCard({ survey, onManage, onDelete, isDark, t }) {
  const SURVEY_TYPE_KEYS = {
    nps:"surveys.types.nps", csat:"surveys.types.csat",
    feedback:"surveys.types.feedback", mixed:"surveys.types.mixed",
  };
  const ui = {
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    panel:  isDark ? "#111111" : "#FFFFFF",
  };

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y:-3, transition:{ duration:0.2 } }}
      style={{
        background:ui.panel, border:`1px solid ${ui.border}`,
        borderRadius:"18px", overflow:"hidden",
        boxShadow: isDark ? "0 2px 16px #00000050" : "0 2px 10px rgba(0,0,0,0.06)",
        transition:"border-color 0.25s, box-shadow 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${ACCENT}44`;
        e.currentTarget.style.boxShadow = `0 8px 32px ${ACCENT}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ui.border;
        e.currentTarget.style.boxShadow = isDark ? "0 2px 16px #00000050" : "0 2px 10px rgba(0,0,0,0.06)";
      }}
    >
      {/* Top color bar */}
      <div style={{ height:"3px", background:ACCENT }} />

      <div style={{ padding:"20px" }}>
        {/* Badges row */}
        <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px", flexWrap:"wrap" }}>
          <span style={{
            padding:"3px 10px", borderRadius:"99px", fontSize:"11px", fontWeight:700,
            background: survey.is_active ? "#2E8B5715" : (isDark?"#1E1E1E":"#F0F0F0"),
            color:      survey.is_active ? "#2E8B57"   : ui.muted,
            border:     `1px solid ${survey.is_active ? "#2E8B5730" : ui.border}`,
          }}>
            {survey.is_active ? t("surveys.card.active") : t("surveys.card.inactive")}
          </span>
          <span style={{
            padding:"3px 10px", borderRadius:"99px", fontSize:"11px", fontWeight:600,
            background:`${ACCENT}12`, color:ACCENT, border:`1px solid ${ACCENT}25`,
          }}>
            {t(SURVEY_TYPE_KEYS[survey.survey_type])}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize:"15px", fontWeight:800, color:ui.text, margin:"0 0 8px", lineHeight:1.35 }}>
          {survey.title}
        </h3>

        {/* Stats row */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap", marginBottom:"16px" }}>
          <span style={{ fontSize:"12px", color:ui.muted }}>
            {survey.questions?.length || 0} {t("surveys.card.questions")}
          </span>
          <span style={{ fontSize:"12px", color:ui.muted }}>
            {survey.response_count} {t("surveys.card.responses")}
          </span>
          <span style={{ fontSize:"12px", color:ui.muted }}>
            {formatDate(survey.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <motion.button
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => onManage(survey)}
            style={{
              flex:1, padding:"8px 0", borderRadius:"10px", fontSize:"12px", fontWeight:700,
              background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, color:ACCENT,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"5px",
              transition:"all 0.2s",
            }}
          >
            <Settings2 size={13} />
            {t("surveys.card.manage")}
          </motion.button>
          <button
            onClick={() => onDelete(survey.id)}
            style={{
              padding:"8px 12px", borderRadius:"10px", fontSize:"12px",
              background:"transparent", border:"1px solid #E53E3E30", color:"#E53E3E",
              cursor:"pointer", display:"flex", alignItems:"center", gap:"4px",
              transition:"all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E53E3E12"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Trash2 size={13} />
            {t("surveys.card.delete")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const { activeCompany }       = useAuth();
  const { theme }               = useTheme();
  const { t }                   = useTranslation();
  const isDark                  = theme === "dark";

  const [surveys,        setSurveys]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [showCreate,     setShowCreate]     = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F7F6F2",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    panel:  isDark ? "#111111" : "#FFFFFF",
  };

  const fetchSurveys = async () => {
    if (!activeCompany) return;
    setLoading(true); setError("");
    try {
      const res  = await api.getSurveys(activeCompany.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("surveys.errors.loadFailed"));
      setSurveys(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSurveys(); }, [activeCompany]);

  const handleCreated = (s) => { setSurveys((p) => [s, ...p]); setShowCreate(false); setSelectedSurvey(s); };
  const handleUpdated = (s) => { setSurveys((p) => p.map((x) => x.id === s.id ? s : x)); setSelectedSurvey(s); };
  const handleDelete  = async (id) => {
    if (!window.confirm(t("surveys.card.deleteConfirm"))) return;
    await api.deleteSurvey(id);
    setSurveys((p) => p.filter((s) => s.id !== id));
    if (selectedSurvey?.id === id) setSelectedSurvey(null);
  };

  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:ui.bg, color:ui.text }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2.5rem 1.5rem" }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          style={{
            position:"relative", overflow:"hidden",
            borderRadius:"24px", border:`1px solid ${ui.border}`,
            background:ui.panel, padding:"2rem 2.5rem", marginBottom:"2rem",
          }}
        >
          {/* Blobs */}
          <div style={{ position:"absolute", left:"-50px", top:"-50px", width:"200px", height:"200px",
            borderRadius:"50%", background:ACCENT, opacity:0.04, filter:"blur(48px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", right:"-50px", bottom:"-50px", width:"200px", height:"200px",
            borderRadius:"50%", background:"#C9A84C", opacity:0.04, filter:"blur(48px)", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap",
                        gap:"1.5rem", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              {/* Badge */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                padding:"5px 14px", borderRadius:"99px",
                border:`1px solid ${isDark?"#2A2A2A":"#E5E7EB"}`,
                background:`${ACCENT}0E`, color:ACCENT,
                fontSize:"0.78rem", fontWeight:700, marginBottom:"12px",
              }}>
                <ClipboardList size={13} />
                {t("surveys.badge")}
              </div>

              <h1 style={{ fontSize:"2rem", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.02em" }}>
                {t("surveys.title")}
              </h1>
              <p style={{ fontSize:"0.88rem", color:ui.muted, margin:"0 0 12px", lineHeight:1.6 }}>
                {t("surveys.description")}
              </p>

              {/* Company pill */}
              {activeCompany && (
                <span style={{
                  display:"inline-block", padding:"5px 14px", borderRadius:"99px",
                  background:`${ACCENT}0E`, border:`1px solid ${ACCENT}25`,
                  color:ACCENT, fontSize:"0.8rem", fontWeight:700,
                }}>
                  {activeCompany.name}
                </span>
              )}
            </div>

            {/* Create button */}
            <motion.button
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              onClick={() => setShowCreate(true)}
              style={{
                display:"inline-flex", alignItems:"center", gap:"7px",
                padding:"12px 22px", borderRadius:"14px",
                background:`linear-gradient(135deg, ${ACCENT}, #A78BFA)`,
                border:"none", color:"#fff", fontSize:"14px", fontWeight:800,
                cursor:"pointer", boxShadow:`0 4px 20px ${ACCENT}40`,
                whiteSpace:"nowrap",
              }}
            >
              <Plus size={16} />
              {t("surveys.create.button")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Content ── */}
        {!activeCompany ? (
          <SectionCard isDark={isDark}>
            <p style={{ textAlign:"center", color:ui.muted, padding:"40px 0" }}>
              {t("surveys.noCompany")}
            </p>
          </SectionCard>
        ) : loading ? (
          <Spinner />
        ) : error ? (
          <div style={{ padding:"12px 16px", borderRadius:"12px",
                        background:"#E53E3E12", border:"1px solid #E53E3E30",
                        color:"#E53E3E", fontSize:"13px" }}>
            {error}
          </div>
        ) : surveys.length === 0 ? (
          <SectionCard isDark={isDark}>
            <div style={{ textAlign:"center", padding:"48px 0", display:"flex",
                          flexDirection:"column", alignItems:"center", gap:"12px" }}>
              <div style={{
                width:"56px", height:"56px", borderRadius:"16px",
                background:`${ACCENT}12`, border:`1px solid ${ACCENT}25`,
                display:"flex", alignItems:"center", justifyContent:"center", color:ACCENT,
              }}>
                <ClipboardList size={26} />
              </div>
              <p style={{ fontSize:"15px", fontWeight:700, color:ui.text, margin:0 }}>
                {t("surveys.empty.title")}
              </p>
              <p style={{ fontSize:"13px", color:ui.muted, margin:0 }}>
                {t("surveys.empty.desc")}
              </p>
            </div>
          </SectionCard>
        ) : (
          <motion.div
            variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.07 } } }}
            initial="hidden" animate="visible"
            style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",
              gap:"1.25rem",
            }}
          >
            {surveys.map((survey) => (
              <SurveyCard
                key={survey.id} survey={survey}
                onManage={setSelectedSurvey}
                onDelete={handleDelete}
                isDark={isDark} t={t}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateSurveyModal
            companyId={activeCompany?.id}
            onCreated={handleCreated}
            onClose={() => setShowCreate(false)}
            isDark={isDark} t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSurvey && (
          <SurveyDetail
            survey={selectedSurvey}
            onClose={() => setSelectedSurvey(null)}
            onUpdated={handleUpdated}
            isDark={isDark} t={t}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes surveySpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}