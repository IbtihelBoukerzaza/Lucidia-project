import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const SOURCES = [
  { value: "", label: "كل المصادر" },
  { value: "google_news", label: "Google News" },
  { value: "rss", label: "RSS" },
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
//   { value: "manual", label: "يدوي" },
];

const PLATFORMS = [
  { value: "", label: "كل المنصات" },
  { value: "social", label: "اجتماعي" },
  { value: "news", label: "أخبار" },
];

const SOURCE_COLORS = {
  google_news: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rss: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  reddit: "bg-red-500/10 text-red-400 border-red-500/20",
  youtube: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  facebook: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  tiktok: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  manual: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const SOURCE_LABELS = {
  google_news: "Google News",
  rss: "RSS",
  reddit: "Reddit",
  youtube: "YouTube",
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  manual: "يدوي",
};

function SourceBadge({ source }) {
  const color =
    SOURCE_COLORS[source] ||
    "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {SOURCE_LABELS[source] || source}
    </span>
  );
}

function PlatformBadge({ platform }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        platform === "social"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-violet-500/10 text-violet-400 border-violet-500/20"
      }`}
    >
      {platform === "social" ? "اجتماعي" : "أخبار"}
    </span>
  );
}

function PostCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 hover:border-slate-700 transition">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge source={post.source} />
          <PlatformBadge platform={post.platform} />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{date}</span>
      </div>

      <p
        className="text-sm text-slate-200 leading-relaxed line-clamp-4 text-right"
        dir="auto"
      >
        {post.text}
      </p>

      <div className="flex items-center justify-between gap-3">
        {post.author ? (
          <span className="text-xs text-slate-500">@{post.author}</span>
        ) : (
          <span />
        )}
        {post.url && (
            <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 transition shrink-0"
          >
            عرض المصدر ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  const navigate = useNavigate();
  const { activeCompany } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [source, setSource] = useState("");
  const [platform, setPlatform] = useState("");

  const PAGE_SIZE = 20;

  const fetchPosts = async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.getPosts(activeCompany.id, { page, source, platform });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل تحميل المنشورات");
      setPosts(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(err.message || "فشل غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [source, platform, activeCompany]);

  useEffect(() => {
    fetchPosts();
  }, [page, source, platform, activeCompany]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
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
            <h1 className="text-3xl font-bold">المنشورات</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
          </div>
          {totalCount > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400">
              إجمالي المنشورات:{" "}
              <span className="text-white font-semibold">
                {totalCount.toLocaleString("ar-DZ")}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-sky-400 outline-none transition"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-sky-400 outline-none transition"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {(source || platform) && (
            <button
              onClick={() => {
                setSource("");
                setPlatform("");
              }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              مسح الفلاتر ✕
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 text-sm">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <p className="text-slate-400">لا توجد منشورات</p>
            <p className="text-xs text-slate-600 mt-1">
              جرّب تغيير الفلاتر أو تشغيل الاستماع من صفحة الإعدادات
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              السابق ←
            </button>
            <span className="text-sm text-slate-500">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              التالي →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}