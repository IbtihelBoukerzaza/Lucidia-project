import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABELS = {
  google_news: "Google News",
  rss:         "RSS",
  reddit:      "Reddit",
  youtube:     "YouTube",
  twitter:     "X / Twitter",
  facebook:    "Facebook",
  instagram:   "Instagram",
  tiktok:      "TikTok",
  manual:      "يدوي",
};

const SOURCE_COLORS = {
  google_news: "#38bdf8",
  rss:         "#fb923c",
  reddit:      "#f87171",
  youtube:     "#f43f5e",
  twitter:     "#7dd3fc",
  facebook:    "#818cf8",
  instagram:   "#f472b6",
  tiktok:      "#2dd4bf",
  manual:      "#94a3b8",
};

const TREND_COLORS = [
  "#38bdf8", "#34d399", "#f87171", "#fb923c",
  "#a78bfa", "#f472b6", "#2dd4bf", "#facc15",
  "#94a3b8", "#6ee7b7",
];

// ─── Shared small components ──────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 text-sm text-right">
      {message}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100 text-right">{title}</h2>
      {children}
    </div>
  );
}

// ─── Top Keywords Bar Chart ───────────────────────────────────────────────────

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm shadow-xl text-right">
      <p className="text-slate-300 font-medium mb-1" dir="auto">{label}</p>
      <p className="text-sky-400">{payload[0].value.toLocaleString("ar-DZ")} تكرار</p>
    </div>
  );
};

function TopKeywordsChart({ companyId }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [top,     setTop]     = useState(20);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getTopKeywords(companyId, top)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json.top || []);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId, top]);

  const maxCount = data[0]?.count || 1;

  return (
    <Section title="أبرز المواضيع والكلمات">
      <div className="flex gap-2 justify-end flex-wrap">
        {[10, 20, 30].map((n) => (
          <button
            key={n}
            onClick={() => setTop(n)}
            className={`rounded-lg px-3 py-1 text-xs font-medium border transition ${
              top === n
                ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                : "text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            أعلى {n}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : data.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Horizontal bar list */}
          <div className="space-y-2">
            {data.slice(0, 15).map((item, i) => (
              <motion.div
                key={item.word}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-slate-600 w-5 shrink-0 text-left">
                  {i + 1}
                </span>
                <div className="flex-1 rounded-full bg-slate-800 h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width:           `${Math.round((item.count / maxCount) * 100)}%`,
                      backgroundColor: "#38bdf8",
                      opacity:         0.7 + (0.3 * (1 - i / data.length)),
                    }}
                  />
                </div>
                <span
                  className="text-sm font-medium w-36 text-right shrink-0 text-slate-200"
                  dir="auto"
                >
                  {item.word}
                </span>
                <span className="text-xs text-slate-500 w-12 text-right shrink-0">
                  {item.count.toLocaleString("ar-DZ")}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Recharts horizontal bar */}
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.slice(0, 15)}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                barSize={10}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="word"
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#1e293b" }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Keyword Trends Line Chart ────────────────────────────────────────────────

const CustomTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm shadow-xl text-right space-y-1">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke }}>
          <span dir="auto">{p.name}</span>: {p.value}
        </p>
      ))}
    </div>
  );
};

function KeywordTrends({ companyId }) {
  const [data,     setData]     = useState({ keywords: [], timeline: [] });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [days,     setDays]     = useState(30);
  const [topCount, setTopCount] = useState(5);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getKeywordTrends(companyId, days, topCount)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const formatted = (json.timeline || []).map((row) => ({
          ...row,
          date: new Date(row.date).toLocaleDateString("ar-DZ", {
            month: "short",
            day:   "numeric",
          }),
        }));
        setData({ keywords: json.keywords || [], timeline: formatted });
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId, days, topCount]);

  return (
    <Section title="تطور الكلمات عبر الزمن">
      <div className="flex gap-2 justify-end flex-wrap">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {[3, 5, 8].map((n) => (
            <button
              key={n}
              onClick={() => setTopCount(n)}
              className={`px-3 py-1 text-xs font-medium transition ${
                topCount === n
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              أعلى {n}
            </button>
          ))}
        </div>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1 text-xs font-medium border transition ${
              days === d
                ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                : "text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {d} يوم
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : data.timeline.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات كافية</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeline} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend
                formatter={(val) => (
                  <span style={{ fontSize: 11, color: "#cbd5e1" }} dir="auto">{val}</span>
                )}
              />
              {data.keywords.map((word, i) => (
                <Line
                  key={word}
                  type="monotone"
                  dataKey={word}
                  stroke={TREND_COLORS[i % TREND_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

// ─── Keywords by Source (tabs) ────────────────────────────────────────────────

function KeywordsBySource({ companyId }) {
  const [bySource,  setBySource]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getKeywordsBySource(companyId, 10)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const src = json.by_source || {};
        const firstKey = Object.keys(src)[0] || null;
        setBySource(src);
        setActiveTab(firstKey);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId]);

  const sources  = Object.keys(bySource);
  const list     = activeTab ? (bySource[activeTab] || []) : [];
  const maxCount = list[0]?.count || 1;
  const color    = SOURCE_COLORS[activeTab] || "#94a3b8";

  return (
    <Section title="الكلمات حسب المصدر">
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : sources.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap justify-end">
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setActiveTab(src)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium border transition"
                style={
                  activeTab === src
                    ? {
                        color:           SOURCE_COLORS[src] || "#94a3b8",
                        backgroundColor: `${SOURCE_COLORS[src] || "#94a3b8"}18`,
                        borderColor:     `${SOURCE_COLORS[src] || "#94a3b8"}40`,
                      }
                    : { color: "#94a3b8", borderColor: "#334155" }
                }
              >
                {SOURCE_LABELS[src] || src}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">لا توجد كلمات</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((item, i) => (
                <motion.div
                  key={item.word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-slate-600 w-4 shrink-0 text-left">{i + 1}</span>
                  <div className="flex-1 rounded-full bg-slate-800 h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:           `${Math.round((item.count / maxCount) * 100)}%`,
                        backgroundColor: color,
                        opacity:         0.75,
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-medium w-36 text-right shrink-0"
                    dir="auto"
                    style={{ color }}
                  >
                    {item.word}
                  </span>
                  <span className="text-xs text-slate-500 w-10 text-right shrink-0">
                    {item.count.toLocaleString("ar-DZ")}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </Section>
  );
}

// ─── Co-occurrence Pairs ──────────────────────────────────────────────────────

function CoOccurrence({ companyId }) {
  const [pairs,   setPairs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getCoOccurrence(companyId, 15)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setPairs(json.pairs || []);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId]);

  const maxCount = pairs[0]?.count || 1;

  return (
    <Section title="الكلمات الأكثر ظهوراً معاً">
      <p className="text-xs text-slate-500 text-right">
        أزواج الكلمات التي تظهر معاً بشكل متكرر في نفس المنشور
      </p>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : pairs.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((pair, i) => {
            const pct = Math.round((pair.count / maxCount) * 100);
            return (
              <motion.div
                key={`${pair.word_a}-${pair.word_b}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-sky-300" dir="auto">
                    {pair.word_a}
                  </span>
                  <span className="text-slate-600 text-xs">+</span>
                  <span className="text-sm font-semibold text-purple-300" dir="auto">
                    {pair.word_b}
                  </span>
                </div>

                <div className="rounded-full bg-slate-800 h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:      `${pct}%`,
                      background: "linear-gradient(to left, #a78bfa, #38bdf8)",
                    }}
                  />
                </div>

                <p className="text-xs text-slate-500 text-center">
                  {pair.count.toLocaleString("ar-DZ")} منشور مشترك
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const navigate          = useNavigate();
  const { activeCompany } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-2 text-sm text-slate-400 hover:text-sky-400 transition"
            >
              → لوحة التحكم
            </button>
            <h1 className="text-3xl font-bold">تحليل المواضيع</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
          </div>
        </div>

        {!activeCompany ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <p className="text-slate-400">لم يتم تحديد شركة</p>
          </div>
        ) : (
          <>
            <TopKeywordsChart  companyId={activeCompany.id} />
            <KeywordTrends     companyId={activeCompany.id} />
            <KeywordsBySource  companyId={activeCompany.id} />
            <CoOccurrence      companyId={activeCompany.id} />
          </>
        )}

      </div>
    </div>
  );
}