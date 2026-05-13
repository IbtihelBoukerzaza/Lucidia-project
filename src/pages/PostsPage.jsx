import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Newspaper, Search, ChevronLeft, ChevronRight,
  Sparkles, ExternalLink, Building2, Layers3,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

const SOURCES = [
  { value: "", labelKey: "posts.filters.allSources", fallback: "كل المصادر" },
  { value: "google_news", label: "Google News" },
  { value: "rss", label: "RSS" },
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

const PLATFORMS = [
  { value: "", labelKey: "posts.filters.allPlatforms", fallback: "كل المنصات" },
  { value: "social", labelKey: "posts.platforms.social", fallback: "اجتماعي" },
  { value: "news", labelKey: "posts.platforms.news", fallback: "أخبار" },
];

const SOURCE_LABELS = {
  google_news: "Google News",
  rss: "RSS",
  reddit: "Reddit",
  youtube: "YouTube",
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const SOURCE_COLORS = {
  google_news: "#4A90D9",
  rss:         "#F59E0B",
  reddit:      "#E53E3E",
  youtube:     "#FF0000",
  twitter:     "#38BDF8",
  facebook:    "#4F46E5",
  instagram:   "#EC4899",
  tiktok:      "#14B8A6",
};

const PAGE_SIZE = 20;

/* ─────────────────────────────────────────
   POST CARD
───────────────────────────────────────── */

function PostCard({ post, isDark, t, searchQuery }) {
  const sourceColor = SOURCE_COLORS[post.source] || "#C9A84C";

  const ui = {
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    text:   isDark ? "#E5E7EB" : "#111111",
  };

  const date = new Date(post.created_at).toLocaleDateString("ar-DZ");

  // Highlight matching search term in text
  function highlight(text) {
    if (!searchQuery || !searchQuery.trim()) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: "#C9A84C33",
            color: "#C9A84C",
            borderRadius: "3px",
            padding: "0 2px",
          }}
        >
          {part}
        </mark>
      ) : part
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "22px",
        border: `1px solid ${ui.border}`,
        background: ui.panel,
        padding: "1.4rem",
      }}
    >
      {/* top color line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          insetInline: 0,
          height: "3px",
          background: sourceColor,
        }}
      />

      {/* background glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          left: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: sourceColor,
          opacity: 0.06,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              background: `${sourceColor}15`,
              border: `1px solid ${sourceColor}30`,
              color: sourceColor,
              fontSize: "0.72rem",
              fontWeight: "700",
            }}
          >
            {SOURCE_LABELS[post.source] || post.source}
          </span>

          <span
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              background:
                post.platform === "social"
                  ? "rgba(46,139,87,0.1)"
                  : "rgba(139,92,246,0.1)",
              border:
                post.platform === "social"
                  ? "1px solid rgba(46,139,87,0.3)"
                  : "1px solid rgba(139,92,246,0.3)",
              color:
                post.platform === "social" ? "#2E8B57" : "#8B5CF6",
              fontSize: "0.72rem",
              fontWeight: "700",
            }}
          >
            {post.platform === "social"
              ? t("posts.platforms.social", "اجتماعي")
              : t("posts.platforms.news", "أخبار")}
          </span>
        </div>

        <span style={{ fontSize: "0.75rem", color: ui.muted }}>
          {date}
        </span>
      </div>

      {/* post text with highlight */}
      <p
        dir="auto"
        style={{
          color: ui.text,
          fontSize: "0.92rem",
          lineHeight: "1.9",
          marginBottom: "1.25rem",
        }}
      >
        {highlight(post.text)}
      </p>

      {/* footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: ui.muted, fontSize: "0.76rem" }}>
          {post.author ? `@${post.author}` : "—"}
        </div> 
        
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#C9A84C",
              textDecoration: "none",
              fontSize: "0.78rem",
              fontWeight: "600",
            }}
          >
            <ExternalLink size={14} />
            {t("posts.viewSource", "عرض المصدر")}
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */

function SkeletonCard({ isDark }) {
  return (
    <div
      style={{
        height: "220px",
        borderRadius: "22px",
        background: isDark ? "#111111" : "#FFFFFF",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${
            isDark ? "#ffffff08" : "#00000008"
          } 50%, transparent 100%)`,
          animation: "shimmer 1.5s infinite",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function PostsPage() {
  const { activeCompany } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === "dark";

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F7F6F2",
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    text:   isDark ? "#E5E7EB" : "#111111",
    gold:   "#C9A84C",
  };

  // Data state
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext]       = useState(false);
  const [hasPrev, setHasPrev]       = useState(false);

  // Filter state
  const [page, setPage]         = useState(1);
  const [source, setSource]     = useState("");
  const [platform, setPlatform] = useState("");

  // Search: two values — what user is typing (immediate) and what we send to API (debounced)
  const [searchInput, setSearchInput]   = useState("");
  const [searchQuery, setSearchQuery]   = useState("");

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Debounce search — wait 400ms after user stops typing before hitting API
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [source, platform]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.getPosts(activeCompany.id, {
        page,
        source,
        platform,
        search: searchQuery,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || t("posts.errors.loadFailed", "فشل تحميل المنشورات"));
      setPosts(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, page, source, platform, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <div style={{ maxWidth: "1250px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            border: `1px solid ${ui.border}`,
            background: ui.panel,
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-60px", left: "-60px",
              width: "220px", height: "220px",
              borderRadius: "50%",
              background: "#C9A84C",
              opacity: 0.05,
              filter: "blur(48px)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              gap: "1.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${ui.border}`,
                  background: isDark ? "#C9A84C10" : "#C9A84C15",
                  color: ui.gold,
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                <Sparkles size={13} />
                {t("posts.badge", "الرصد الاجتماعي")}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.75rem" }}>
                {t("posts.title", "المنشورات")}
              </h1>

              <p style={{ color: ui.muted, fontSize: "0.9rem", lineHeight: "1.8", maxWidth: "700px" }}>
                {t("posts.description", "تابع كل المنشورات والتعليقات المتعلقة بعلامتك التجارية عبر مختلف المنصات.")}
              </p>

              {activeCompany && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "1rem",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    background: isDark ? "#161616" : "#F5F4F0",
                    border: `1px solid ${ui.border}`,
                    color: ui.gold,
                    fontSize: "0.8rem",
                    fontWeight: "700",
                  }}
                >
                  <Building2 size={14} />
                  {activeCompany.name}
                </div>
              )}
            </div>

            {/* total counter */}
            <div
              style={{
                minWidth: "180px",
                borderRadius: "22px",
                border: `1px solid ${ui.border}`,
                background: isDark ? "#161616" : "#FAFAF8",
                padding: "1.2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "0.5rem",
                  color: ui.gold,
                }}
              >
                <Layers3 size={16} />
                <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>
                  {searchQuery
                    ? t("posts.searchResults", "نتائج البحث")
                    : t("posts.totalPosts", "إجمالي المنشورات")}
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "900" }}>
                {totalCount.toLocaleString()}
              </div>
              {searchQuery && (
                <div style={{ fontSize: "0.72rem", color: ui.muted, marginTop: "4px" }}>
                  {t("posts.searchFor", "بحث عن:")} "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── FILTER BAR ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "22px",
            border: `1px solid ${ui.border}`,
            background: ui.panel,
          }}
        >
          {/* Search input */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                right: "14px",
                color: searchInput ? ui.gold : ui.muted,
                transition: "color 0.2s",
              }}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("posts.search", "ابحث داخل المنشورات...")}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "14px",
                border: `1px solid ${searchInput ? "#C9A84C55" : ui.border}`,
                background: isDark ? "#161616" : "#FAFAF8",
                color: ui.text,
                padding: "0 42px 0 14px",
                outline: "none",
                fontSize: "0.85rem",
                transition: "border-color 0.2s",
              }}
            />
            {/* Clear button */}
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: ui.muted,
                  fontSize: "1rem",
                  lineHeight: 1,
                  padding: "2px 6px",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Source filter */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{
              height: "44px",
              borderRadius: "14px",
              border: `1px solid ${source ? "#C9A84C55" : ui.border}`,
              background: isDark ? "#161616" : "#FAFAF8",
              color: ui.text,
              padding: "0 14px",
              fontSize: "0.84rem",
              outline: "none",
            }}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label || t(s.labelKey, s.fallback)}
              </option>
            ))}
          </select>

          {/* Platform filter */}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={{
              height: "44px",
              borderRadius: "14px",
              border: `1px solid ${platform ? "#C9A84C55" : ui.border}`,
              background: isDark ? "#161616" : "#FAFAF8",
              color: ui.text,
              padding: "0 14px",
              fontSize: "0.84rem",
              outline: "none",
            }}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label || t(p.labelKey, p.fallback)}
              </option>
            ))}
          </select>

          {/* Active filters indicator */}
          {(source || platform || searchQuery) && (
            <button
              onClick={() => {
                setSource("");
                setPlatform("");
                setSearchInput("");
              }}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "14px",
                border: "1px solid rgba(229,62,62,0.3)",
                background: "rgba(229,62,62,0.08)",
                color: "#F87171",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {t("posts.clearFilters", "مسح الفلاتر")}
            </button>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} isDark={isDark} />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              borderRadius: "22px",
              padding: "1.2rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#F87171",
            }}
          >
            {error}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "5rem 2rem",
              borderRadius: "28px",
              border: `1px solid ${ui.border}`,
              background: ui.panel,
            }}
          >
            <Newspaper size={42} style={{ color: ui.gold, marginBottom: "1rem" }} />
            <h3 style={{ marginBottom: "0.5rem" }}>
              {searchQuery
                ? t("posts.noResults", "لا توجد نتائج")
                : t("posts.emptyTitle", "لا توجد منشورات")}
            </h3>
            <p style={{ color: ui.muted }}>
              {searchQuery
                ? `${t("posts.noResultsFor", "لا توجد منشورات تحتوي على")} "${searchQuery}"`
                : t("posts.emptyDescription", "جرّب تغيير الفلاتر أو تشغيل الاستماع الاجتماعي.")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1rem",
            }}
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isDark={isDark}
                t={t}
                searchQuery={searchQuery}
              />
            ))}
          </motion.div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && totalPages > 1 && (
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{
                height: "42px",
                padding: "0 18px",
                borderRadius: "14px",
                border: `1px solid ${ui.border}`,
                background: ui.panel,
                color: ui.text,
                cursor: hasPrev ? "pointer" : "not-allowed",
                opacity: hasPrev ? 1 : 0.4,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.84rem",
              }}
            >
              <ChevronRight size={16} />
              {t("posts.prev", "السابق")}
            </button>

            <span
              style={{
                padding: "0 16px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                borderRadius: "14px",
                border: `1px solid ${ui.border}`,
                background: isDark ? "#161616" : "#F5F4F0",
                color: ui.gold,
                fontSize: "0.84rem",
                fontWeight: "700",
              }}
            >
              {page} / {totalPages}
            </span>

            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              style={{
                height: "42px",
                padding: "0 18px",
                borderRadius: "14px",
                border: `1px solid ${ui.border}`,
                background: ui.panel,
                color: ui.text,
                cursor: hasNext ? "pointer" : "not-allowed",
                opacity: hasNext ? 1 : 0.4,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.84rem",
              }}
            >
              {t("posts.next", "التالي")}
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}