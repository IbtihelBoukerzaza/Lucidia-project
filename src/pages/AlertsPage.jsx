import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_TYPES = [
  {
    value: "negative_pct_above",
    label: "نسبة السلبي تتجاوز الحد",
    unit: "%",
    hint: "مثال: 40 — يُطلق تنبيهاً إذا تجاوزت نسبة السلبي 40%",
    needsKeyword: false,
  },
  {
    value: "positive_pct_below",
    label: "نسبة الإيجابي تنخفض عن الحد",
    unit: "%",
    hint: "مثال: 30 — يُطلق تنبيهاً إذا انخفضت نسبة الإيجابي عن 30%",
    needsKeyword: false,
  },
  {
    value: "negative_count_above",
    label: "عدد السلبيات يتجاوز الحد اليومي",
    unit: "منشور",
    hint: "مثال: 100 — يُطلق تنبيهاً إذا تجاوز عدد السلبيات 100 منشور يومياً",
    needsKeyword: false,
  },
  {
    value: "volume_spike",
    label: "حجم المنشورات اليومية يتجاوز الحد",
    unit: "منشور",
    hint: "مثال: 500 — يُطلق تنبيهاً إذا تجاوز إجمالي المنشورات 500 يومياً",
    needsKeyword: false,
  },
  {
    value: "keyword_spike",
    label: "كلمة مفتاحية تتجاوز الحد",
    unit: "مرة",
    hint: "مثال: 50 — يُطلق تنبيهاً إذا ظهرت الكلمة أكثر من 50 مرة يومياً",
    needsKeyword: true,
  },
  {
    value: "sentiment_drop",
    label: "انخفاض حاد في الإيجابي مقارنة بالأمس",
    unit: "نقطة",
    hint: "مثال: 20 — يُطلق تنبيهاً إذا انخفض الإيجابي بأكثر من 20 نقطة عن الأمس",
    needsKeyword: false,
  },
  {
    value: "negative_streak",
    label: "السلبي هو الغالب لعدة أيام متتالية",
    unit: "يوم",
    hint: "مثال: 3 — يُطلق تنبيهاً إذا كان السلبي الغالب لمدة 3 أيام متتالية",
    needsKeyword: false,
  },
];

const SEVERITY_OPTIONS = [
  { value: "low",    label: "منخفض",  color: "text-emerald-400" },
  { value: "medium", label: "متوسط",  color: "text-amber-400"   },
  { value: "high",   label: "عالٍ",   color: "text-red-400"     },
];

const SEVERITY_STYLES = {
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const SEVERITY_DOT = {
  high:   "bg-red-400",
  medium: "bg-amber-400",
  low:    "bg-emerald-400",
};

const SEVERITY_LABELS = {
  high:   "عالٍ",
  medium: "متوسط",
  low:    "منخفض",
};

// ─── Shared ───────────────────────────────────────────────────────────────────

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

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab({ companyId }) {
  const [rules,    setRules]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");
  const [showForm,   setShowForm]   = useState(false);

  // Form state
  const [ruleType,  setRuleType]  = useState(RULE_TYPES[0].value);
  const [threshold, setThreshold] = useState("");
  const [keyword,   setKeyword]   = useState("");
  const [severity,  setSeverity]  = useState("medium");

  const selectedRuleType = RULE_TYPES.find((r) => r.value === ruleType);

  const fetchRules = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getAlertRules(companyId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل التحميل");
      setRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, [companyId]);

  const handleSubmit = async () => {
    setFormError("");
    if (!threshold || isNaN(Number(threshold))) {
      setFormError("يجب إدخال قيمة رقمية صحيحة للحد.");
      return;
    }
    if (selectedRuleType?.needsKeyword && !keyword.trim()) {
      setFormError("يجب إدخال الكلمة المفتاحية لهذا النوع من القواعد.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createAlertRule(companyId, {
        rule_type: ruleType,
        threshold: Number(threshold),
        keyword:   keyword.trim(),
        severity,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(" ") || "فشل الحفظ");
      setRules((prev) => [data, ...prev]);
      setShowForm(false);
      setThreshold("");
      setKeyword("");
      setSeverity("medium");
      setRuleType(RULE_TYPES[0].value);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      const res  = await api.toggleAlertRule(rule.id);
      const data = await res.json();
      setRules((prev) => prev.map((r) => (r.id === rule.id ? data : r)));
    } catch (_) {}
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
    try {
      await api.deleteAlertRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (_) {}
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {rules.length > 0
            ? `${rules.length} قاعدة مُعرَّفة`
            : "لا توجد قواعد بعد"}
        </p>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition border ${
            showForm
              ? "border-slate-600 text-slate-400 hover:text-white"
              : "border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
          }`}
        >
          {showForm ? "إلغاء ✕" : "+ إضافة قاعدة"}
        </button>
      </div>

      {/* Add rule form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 text-right">
            قاعدة جديدة
          </h3>

          {/* Rule type */}
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400 text-right">
              نوع القاعدة
            </label>
            <select
              value={ruleType}
              onChange={(e) => { setRuleType(e.target.value); setKeyword(""); }}
              className="w-full rounded-xl bg-slate-800 border border-slate-700
                         px-3 py-2 text-sm text-slate-200 text-right
                         focus:border-sky-400 outline-none transition"
            >
              {RULE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {selectedRuleType && (
              <p className="text-xs text-slate-500 text-right">
                {selectedRuleType.hint}
              </p>
            )}
          </div>

          {/* Keyword (conditional) */}
          {selectedRuleType?.needsKeyword && (
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 text-right">
                الكلمة المفتاحية
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="مثال: مشكلة"
                dir="auto"
                className="w-full rounded-xl bg-slate-800 border border-slate-700
                           px-3 py-2 text-sm text-slate-200 text-right
                           focus:border-sky-400 outline-none transition"
              />
            </div>
          )}

          {/* Threshold + Severity row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 text-right">
                الحد ({selectedRuleType?.unit || "قيمة"})
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                min="0"
                placeholder="0"
                className="w-full rounded-xl bg-slate-800 border border-slate-700
                           px-3 py-2 text-sm text-slate-200 text-right
                           focus:border-sky-400 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 text-right">
                مستوى الخطورة
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700
                           px-3 py-2 text-sm text-slate-200 text-right
                           focus:border-sky-400 outline-none transition"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <ErrorBox message={formError} />}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-sky-500/20 border border-sky-500/30
                       text-sky-400 hover:bg-sky-500/30 py-2 text-sm font-medium
                       transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ القاعدة"}
          </button>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40
                        px-6 py-12 text-center space-y-2">
          <p className="text-slate-400">لا توجد قواعد تنبيه بعد</p>
          <p className="text-xs text-slate-600">
            أضف قاعدة لتلقّي تنبيهات تلقائية بعد كل عملية جمع بيانات
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const ruleInfo = RULE_TYPES.find((r) => r.value === rule.rule_type);
            return (
              <div
                key={rule.id}
                className={`rounded-2xl border p-4 transition ${
                  rule.is_active
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-800/50 bg-slate-900/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Rule info */}
                  <div className="space-y-1 text-right flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full border
                                   px-2.5 py-0.5 text-xs font-medium
                                   ${SEVERITY_STYLES[rule.severity]}`}
                      >
                        {SEVERITY_LABELS[rule.severity]}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {ruleInfo?.label || rule.rule_type_display}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      الحد:{" "}
                      <span className="text-slate-300 font-medium">
                        {rule.threshold} {ruleInfo?.unit || ""}
                      </span>
                      {rule.keyword && (
                        <>
                          {" — "}الكلمة:{" "}
                          <span className="text-sky-400">{rule.keyword}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-600">
                      أُنشئت بواسطة {rule.created_by_name} —{" "}
                      {new Date(rule.created_at).toLocaleDateString("ar-DZ", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium
                                 border transition ${
                        rule.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {rule.is_active ? "مفعّل" : "معطّل"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium
                                 border border-red-500/20 text-red-400
                                 hover:bg-red-500/10 transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ companyId }) {
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getAlerts(companyId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل التحميل");
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [companyId]);

  const handleMarkRead = async (alert) => {
    if (alert.is_read) return;
    await api.markAlertRead(alert.id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a))
    );
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await api.markAllAlertsRead(companyId);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setMarkingAll(false);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {unreadCount > 0
            ? `${unreadCount} غير مقروء`
            : "كل الإشعارات مقروءة"}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="rounded-xl px-4 py-2 text-sm font-medium border
                       border-slate-700 text-slate-400 hover:text-white
                       transition disabled:opacity-50"
          >
            {markingAll ? "جارٍ..." : "تحديد الكل كمقروء"}
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40
                        px-6 py-12 text-center space-y-2">
          <p className="text-slate-400">لا توجد إشعارات بعد</p>
          <p className="text-xs text-slate-600">
            ستظهر الإشعارات هنا تلقائياً بعد كل عملية جمع بيانات
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const time = new Date(alert.triggered_at).toLocaleDateString(
              "ar-DZ",
              { year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit" }
            );
            return (
              <div
                key={alert.id}
                onClick={() => handleMarkRead(alert)}
                className={`rounded-2xl border p-4 transition cursor-pointer
                            hover:border-slate-700 ${
                  alert.is_read
                    ? "border-slate-800 bg-slate-900/40"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Severity dot */}
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0
                               ${SEVERITY_DOT[alert.severity] || "bg-slate-400"}`}
                  />

                  <div className="flex-1 min-w-0 space-y-1.5 text-right">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full border
                                   px-2 py-0.5 text-xs font-medium
                                   ${SEVERITY_STYLES[alert.severity]}`}
                      >
                        {alert.severity_display}
                      </span>
                      <span className="text-xs text-slate-500">{time}</span>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!alert.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { activeCompany } = useAuth();
  const [activeTab, setActiveTab] = useState("rules");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">التنبيهات</h1>
          {activeCompany && (
            <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            أنشئ قواعد تنبيه تلقائية تُطلَق بعد كل عملية جمع بيانات
          </p>
        </div>

        {!activeCompany ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900
                          px-6 py-12 text-center">
            <p className="text-slate-400">لم يتم تحديد شركة</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-slate-800
                            bg-slate-900 p-1 w-fit">
              {[
                { key: "rules",         label: "القواعد"    },
                { key: "notifications", label: "الإشعارات"  },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "rules" ? (
              <RulesTab companyId={activeCompany.id} />
            ) : (
              <NotificationsTab companyId={activeCompany.id} />
            )}
          </>
        )}

      </div>
    </div>
  );
}