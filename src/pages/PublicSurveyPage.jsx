import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

function LogoSentivya() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-sky-500/60">
        <span className="absolute inset-[3px] rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-400 to-emerald-400 opacity-80" />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-slate-950">
          <path d="M3 13c2-4 4-6 8-6s6 2 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 17c1.2-1.6 2.4-2.4 4-2.4s2.8.8 4 2.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-50">
        Sentivya<span className="text-sky-300">DZ</span>
      </span>
    </div>
  );
}

function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-2 justify-end">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition ${
            star <= value ? "text-amber-400" : "text-slate-600 hover:text-amber-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function NPSRating({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-xl text-sm font-bold border transition ${
            value === n
              ? "bg-sky-500 border-sky-400 text-white"
              : "border-slate-700 text-slate-400 hover:border-sky-400 hover:text-white"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function PublicSurveyPage() {
  const { token } = useParams();

  const [survey,    setSurvey]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [answers,   setAnswers]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await api.getPublicSurvey(token);
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "الاستطلاع غير متاح.");
        } else {
          setSurvey(data);
          // Initialize answers
          const init = {};
          data.questions.forEach((q) => {
            init[q.id] = q.question_type === "rating" ? null
                       : q.question_type === "nps"    ? null
                       : "";
          });
          setAnswers(init);
        }
      } catch {
        setError("حدث خطأ أثناء تحميل الاستطلاع.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitError("");

    // Build answers array
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
      if (!res.ok) throw new Error(data.detail || "فشل الإرسال.");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
        <LogoSentivya />
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-8 text-center max-w-md w-full">
          <p className="text-red-400 text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
        <LogoSentivya />
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-12 text-center max-w-md w-full space-y-3">
          <div className="text-5xl">✓</div>
          <h2 className="text-xl font-bold text-emerald-400">شكراً لك!</h2>
          <p className="text-slate-400 text-sm">تم إرسال إجاباتك بنجاح.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur px-6 py-4 flex justify-end">
        <LogoSentivya />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        {/* Survey title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          {survey.description && (
            <p className="text-slate-400 text-sm leading-relaxed">{survey.description}</p>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <p className="text-sm font-medium text-slate-200">
                <span className="text-sky-400 ml-2">{idx + 1}.</span>
                {q.question_text}
              </p>

              {q.question_type === "text" && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={3}
                  placeholder="اكتب إجابتك هنا..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700
                             px-4 py-2.5 text-sm text-slate-200 text-right
                             focus:border-sky-400 outline-none transition resize-none"
                />
              )}

              {q.question_type === "rating" && (
                <StarRating
                  value={answers[q.id] || 0}
                  onChange={(val) => setAnswer(q.id, val)}
                  max={5}
                />
              )}

              {q.question_type === "nps" && (
                <div className="space-y-2">
                  <NPSRating
                    value={answers[q.id]}
                    onChange={(val) => setAnswer(q.id, val)}
                  />
                  <div className="flex justify-between text-xs text-slate-500 px-1">
                    <span>لن أوصي أبداً</span>
                    <span>بالتأكيد سأوصي</span>
                  </div>
                </div>
              )}

              {q.question_type === "multiple_choice" && (
                <div className="space-y-2">
                  {(q.choices || []).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setAnswer(q.id, choice)}
                      className={`w-full text-right rounded-xl border px-4 py-2.5
                                 text-sm transition ${
                        answers[q.id] === choice
                          ? "border-sky-400 bg-sky-500/10 text-sky-300"
                          : "border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {submitError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-red-400 text-sm text-right">
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 text-white
                     font-semibold py-3 text-sm transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "جارٍ الإرسال..." : "إرسال الإجابات"}
        </button>
      </div>
    </div>
  );
}