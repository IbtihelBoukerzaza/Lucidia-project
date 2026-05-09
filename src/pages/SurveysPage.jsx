import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-red-400 text-sm text-right">
      {message}
    </div>
  );
}

const SURVEY_TYPE_LABELS = {
  nps:      "NPS",
  csat:     "CSAT",
  feedback: "ملاحظات حرة",
  mixed:    "مختلط",
};

const QUESTION_TYPE_LABELS = {
  text:            "نص حر",
  rating:          "تقييم (1–5)",
  nps:             "NPS (0–10)",
  multiple_choice: "اختيار متعدد",
};

// ─── QR Code (using free API) ─────────────────────────────────────────────────

function QRCode({ url }) {
  const encoded = encodeURIComponent(url);
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}`}
      alt="QR Code"
      className="w-32 h-32 rounded-xl border border-slate-700"
    />
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({ surveyId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getSurveyAnalytics(surveyId);
        const d   = await res.json();
        if (!res.ok) throw new Error(d.detail || "فشل التحميل");
        setData(d);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [surveyId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">نتائج الاستطلاع</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
          <div className="space-y-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-sky-400">{data.total_responses}</p>
                <p className="text-xs text-slate-400 mt-0.5">إجمالي الردود</p>
              </div>
            </div>

            {data.questions.map((q) => (
              <div key={q.question_id} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-200">{q.question_text}</p>
                <p className="text-xs text-slate-500">{q.answer_count} إجابة</p>

                {/* Rating / NPS */}
                {(q.average_rating !== undefined && q.average_rating !== null) && (
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 text-xl font-bold">{q.average_rating}</span>
                    <span className="text-slate-500 text-xs">متوسط التقييم</span>
                    {q.nps_score !== undefined && (
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                        q.nps_score >= 50 ? "text-emerald-400 bg-emerald-500/10" :
                        q.nps_score >= 0  ? "text-amber-400 bg-amber-500/10" :
                                            "text-red-400 bg-red-500/10"
                      }`}>
                        NPS: {q.nps_score}
                      </span>
                    )}
                  </div>
                )}

                {/* Rating distribution */}
                {q.rating_distribution && Object.keys(q.rating_distribution).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.entries(q.rating_distribution)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([rating, count]) => {
                        const pct = q.answer_count > 0
                          ? Math.round((count / q.answer_count) * 100) : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-slate-400 text-right">{rating}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-sky-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-slate-400">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Multiple choice */}
                {q.choice_distribution && Object.keys(q.choice_distribution).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.entries(q.choice_distribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([choice, count]) => {
                        const pct = q.answer_count > 0
                          ? Math.round((count / q.answer_count) * 100) : 0;
                        return (
                          <div key={choice} className="flex items-center gap-2 text-xs">
                            <span className="flex-1 text-slate-300 text-right truncate">{choice}</span>
                            <div className="w-24 bg-slate-700 rounded-full h-2">
                              <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Sentiment breakdown */}
                {q.sentiment_breakdown && (
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: "positive", label: "إيجابي",  color: "text-emerald-400 bg-emerald-500/10" },
                      { key: "neutral",  label: "محايد",   color: "text-slate-400 bg-slate-500/10"    },
                      { key: "negative", label: "سلبي",    color: "text-red-400 bg-red-500/10"        },
                    ].map(({ key, label, color }) => (
                      <div key={key} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${color}`}>
                        {label}: {q.sentiment_breakdown[key] || 0}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Survey Modal ──────────────────────────────────────────────────────

function CreateSurveyModal({ companyId, onCreated, onClose }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [surveyType,  setSurveyType]  = useState("mixed");
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);

  const handleSave = async () => {
    setError("");
    if (!title.trim()) { setError("العنوان مطلوب."); return; }
    setSaving(true);
    try {
      const res  = await api.createSurvey(companyId, {
        title: title.trim(),
        description: description.trim(),
        survey_type: surveyType,
        is_active: true,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل الإنشاء");
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">استطلاع جديد</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">العنوان *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: استطلاع رضا العملاء"
              className="w-full rounded-xl bg-slate-800 border border-slate-700
                         px-3 py-2 text-sm text-slate-200 text-right
                         focus:border-sky-400 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">الوصف (اختياري)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="وصف مختصر للاستطلاع..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700
                         px-3 py-2 text-sm text-slate-200 text-right
                         focus:border-sky-400 outline-none transition resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">نوع الاستطلاع</label>
            <select
              value={surveyType}
              onChange={(e) => setSurveyType(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700
                         px-3 py-2 text-sm text-slate-200 text-right
                         focus:border-sky-400 outline-none transition"
            >
              <option value="mixed">مختلط</option>
              <option value="nps">NPS — Net Promoter Score</option>
              <option value="csat">CSAT — رضا العملاء</option>
              <option value="feedback">ملاحظات حرة</option>
            </select>
          </div>
        </div>

        {error && <ErrorBox message={error} />}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-sky-500/20 border border-sky-500/30
                     text-sky-400 hover:bg-sky-500/30 py-2 text-sm font-medium
                     transition disabled:opacity-50"
        >
          {saving ? "جارٍ الإنشاء..." : "إنشاء الاستطلاع"}
        </button>
      </div>
    </div>
  );
}

// ─── Survey Detail (questions + share) ───────────────────────────────────────

function SurveyDetail({ survey, onClose, onUpdated }) {
  const [questions,   setQuestions]   = useState(survey.questions || []);
  const [showAddQ,    setShowAddQ]    = useState(false);
  const [qType,       setQType]       = useState("text");
  const [qText,       setQText]       = useState("");
  const [qChoices,    setQChoices]    = useState("");
  const [qError,      setQError]      = useState("");
  const [savingQ,     setSavingQ]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [toggling,    setToggling]    = useState(false);

  const publicUrl = survey.public_url || `/s/${survey.token}`;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/s/${survey.token}`;
    navigator.clipboard.writeText(url);
  };

  const handleAddQuestion = async () => {
    setQError("");
    if (!qText.trim()) { setQError("نص السؤال مطلوب."); return; }
    if (qType === "multiple_choice" && !qChoices.trim()) {
      setQError("يجب إدخال الخيارات مفصولة بفاصلة."); return;
    }
    setSavingQ(true);
    try {
      const payload = {
        question_text: qText.trim(),
        question_type: qType,
        order: questions.length + 1,
      };
      if (qType === "multiple_choice") {
        payload.choices = qChoices.split(",").map((c) => c.trim()).filter(Boolean);
      }
      const res  = await api.addSurveyQuestion(survey.id, payload);
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setQuestions((prev) => [...prev, data]);
      setQText(""); setQChoices(""); setQType("text");
      setShowAddQ(false);
    } catch (err) {
      setQError(err.message);
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("حذف هذا السؤال؟")) return;
    await api.deleteSurveyQuestion(survey.id, qId);
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const res  = await api.updateSurvey(survey.id, { is_active: !survey.is_active });
      const data = await res.json();
      if (res.ok) onUpdated(data);
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-6" dir="rtl">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{survey.title}</h2>
              <p className="text-xs text-slate-500">
                {SURVEY_TYPE_LABELS[survey.survey_type]} — {survey.response_count} رد
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                  survey.is_active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {survey.is_active ? "مفعّل" : "معطّل"}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
            </div>
          </div>

          {/* Share section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">مشاركة الاستطلاع</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <QRCode url={`${window.location.origin}/s/${survey.token}`} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-sky-400 break-all">
                  {window.location.origin}/s/{survey.token}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl border border-slate-700 px-3 py-1.5
                             text-xs text-slate-400 hover:text-white transition"
                >
                  نسخ الرابط
                </button>
              </div>
            </div>
          </div>

          {/* Analytics button */}
          <button
            onClick={() => setShowAnalytics(true)}
            className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10
                       text-violet-400 hover:bg-violet-500/20 py-2 text-sm font-medium transition"
          >
            عرض النتائج والتحليلات
          </button>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setShowAddQ((v) => !v); setQError(""); }}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition ${
                  showAddQ
                    ? "border-slate-600 text-slate-400"
                    : "border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                }`}
              >
                {showAddQ ? "إلغاء" : "+ سؤال"}
              </button>
              <h3 className="text-sm font-semibold text-slate-300">
                الأسئلة ({questions.length})
              </h3>
            </div>

            {showAddQ && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">نوع السؤال</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700
                               px-3 py-2 text-sm text-slate-200 text-right
                               focus:border-sky-400 outline-none transition"
                  >
                    {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400">نص السؤال *</label>
                  <input
                    type="text"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700
                               px-3 py-2 text-sm text-slate-200 text-right
                               focus:border-sky-400 outline-none transition"
                  />
                </div>

                {qType === "multiple_choice" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-400">
                      الخيارات (مفصولة بفاصلة)
                    </label>
                    <input
                      type="text"
                      value={qChoices}
                      onChange={(e) => setQChoices(e.target.value)}
                      placeholder="خيار 1, خيار 2, خيار 3"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700
                                 px-3 py-2 text-sm text-slate-200 text-right
                                 focus:border-sky-400 outline-none transition"
                    />
                  </div>
                )}

                {qError && <ErrorBox message={qError} />}

                <button
                  onClick={handleAddQuestion}
                  disabled={savingQ}
                  className="w-full rounded-xl bg-sky-500/20 border border-sky-500/30
                             text-sky-400 hover:bg-sky-500/30 py-2 text-sm font-medium
                             transition disabled:opacity-50"
                >
                  {savingQ ? "جارٍ الإضافة..." : "إضافة السؤال"}
                </button>
              </div>
            )}

            {questions.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-6">
                لا توجد أسئلة بعد — أضف أول سؤال
              </p>
            ) : (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
                    >
                      حذف
                    </button>
                    <div className="text-right flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{q.question_text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {QUESTION_TYPE_LABELS[q.question_type]}
                      </p>
                    </div>
                    <span className="text-slate-600 text-xs shrink-0">{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {showAnalytics && (
        <AnalyticsPanel
          surveyId={survey.id}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const { activeCompany } = useAuth();

  const [surveys,       setSurveys]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const fetchSurveys = async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    try {
      const res  = await api.getSurveys(activeCompany.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل التحميل");
      setSurveys(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurveys(); }, [activeCompany]);

  const handleCreated = (newSurvey) => {
    setSurveys((prev) => [newSurvey, ...prev]);
    setShowCreate(false);
    setSelectedSurvey(newSurvey);
  };

  const handleUpdated = (updated) => {
    setSurveys((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSurvey(updated);
  };

  const handleDelete = async (surveyId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الاستطلاع؟")) return;
    await api.deleteSurvey(surveyId);
    setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
    if (selectedSurvey?.id === surveyId) setSelectedSurvey(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">الاستطلاعات</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              أنشئ استطلاعات رأي واجمع آراء العملاء مع تحليل مشاعر تلقائي
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl border border-sky-500/40 bg-sky-500/10
                       text-sky-400 hover:bg-sky-500/20 px-5 py-2.5
                       text-sm font-medium transition"
          >
            + استطلاع جديد
          </button>
        </div>

        {!activeCompany ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <p className="text-slate-400">لم يتم تحديد شركة</p>
          </div>
        ) : loading ? (
          <Spinner />
        ) : error ? (
          <ErrorBox message={error} />
        ) : surveys.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center space-y-3">
            <p className="text-slate-400 text-lg">لا توجد استطلاعات بعد</p>
            <p className="text-xs text-slate-600">
              انقر على "استطلاع جديد" لإنشاء أول استطلاع رأي
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 hover:border-slate-700 transition"
              >
                {/* Survey header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                      survey.is_active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 text-slate-500"
                    }`}>
                      {survey.is_active ? "مفعّل" : "معطّل"}
                    </span>
                    <span className="text-xs text-slate-500 border border-slate-700 rounded-full px-2 py-0.5">
                      {SURVEY_TYPE_LABELS[survey.survey_type]}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 text-right flex-1 leading-snug">
                    {survey.title}
                  </h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap justify-end">
                  <span>{survey.questions?.length || 0} سؤال</span>
                  <span>{survey.response_count} رد</span>
                  <span>
                    {new Date(survey.created_at).toLocaleDateString("ar-DZ", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="rounded-lg border border-red-500/20 text-red-400
                               hover:bg-red-500/10 px-3 py-1.5 text-xs transition"
                  >
                    حذف
                  </button>
                  <button
                    onClick={() => setSelectedSurvey(survey)}
                    className="rounded-lg border border-slate-700 text-slate-300
                               hover:text-white hover:border-slate-500 px-3 py-1.5 text-xs transition"
                  >
                    إدارة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modals */}
      {showCreate && (
        <CreateSurveyModal
          companyId={activeCompany?.id}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {selectedSurvey && (
        <SurveyDetail
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}