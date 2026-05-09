import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X / Twitter" },
  { value: "youtube_channel", label: "YouTube" },
  { value: "rss", label: "RSS Feed" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { activeCompany, isAdmin, logout } = useAuth();

  // Keywords state
  const [keywords, setKeywords] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordError, setKeywordError] = useState("");
  const [keywordSuccess, setKeywordSuccess] = useState("");

  // Social profiles state
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [newPlatform, setNewPlatform] = useState("facebook");
  const [newUrl, setNewUrl] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
// Ingestion state
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestError, setIngestError] = useState("");
  const fetchKeywords = async () => {
    if (!activeCompany) return;
    setLoadingKeywords(true);
    try {
      const res = await api.getKeywords(activeCompany.id);
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch {
      setKeywordError("فشل تحميل الكلمات المفتاحية");
    } finally {
      setLoadingKeywords(false);
    }
  };

  const fetchProfiles = async () => {
    if (!activeCompany) return;
    setLoadingProfiles(true);
    try {
      const res = await api.getSocialProfiles(activeCompany.id);
      const data = await res.json();
      setProfiles(data.social_profiles || []);
    } catch {
      setProfileError("فشل تحميل الحسابات الاجتماعية");
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchProfiles();
  }, [activeCompany]);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    setKeywordError("");
    setKeywordSuccess("");
    if (!newKeyword.trim()) return;

    try {
      const res = await api.addKeyword(activeCompany.id, newKeyword.trim());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setKeywordSuccess("تمت الإضافة");
      setNewKeyword("");
      await fetchKeywords();
    } catch (err) {
      setKeywordError(err.message || "فشل إضافة الكلمة");
    }
    setTimeout(() => setKeywordSuccess(""), 3000);
  };

  const handleDeleteKeyword = async (keywordId) => {
    try {
      await api.deleteKeyword(activeCompany.id, keywordId);
      setKeywords((prev) => prev.filter((k) => k.id !== keywordId));
    } catch {
      setKeywordError("فشل حذف الكلمة");
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!newUrl.trim()) return;

    try {
      const res = await api.addSocialProfile(activeCompany.id, newPlatform, newUrl.trim());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfileSuccess("تمت الإضافة");
      setNewUrl("");
      await fetchProfiles();
    } catch (err) {
      setProfileError(err.message || "فشل إضافة الحساب");
    }
    setTimeout(() => setProfileSuccess(""), 3000);
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      await api.deleteSocialProfile(activeCompany.id, profileId);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch {
      setProfileError("فشل حذف الحساب");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  const handleIngest = async () => {
  setIngesting(true);
  setIngestResult(null);
  setIngestError("");
  try {
    const res = await api.triggerIngestion(activeCompany.id);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "فشل جمع البيانات");
    setIngestResult(data.stats);
  } catch (err) {
    setIngestError(err.message || "فشل غير متوقع");
  } finally {
    setIngesting(false);
  }
};
  const platformLabel = (value) =>
    PLATFORMS.find((p) => p.value === value)?.label || value;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-2 text-sm text-slate-400 hover:text-sky-400 transition"
            >
              → لوحة التحكم
            </button>
            <h1 className="text-3xl font-bold">إعدادات الشركة</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
          >
            تسجيل الخروج
          </button>
        </div>
        {/* Ingestion Trigger — admin only */}
{isAdmin && (
  <div className="rounded-2xl border border-slate-800 bg-slate-900">
    <div className="border-b border-slate-800 px-6 py-4">
      <h2 className="font-semibold text-slate-200">جمع البيانات</h2>
      <p className="text-xs text-slate-500 mt-1">
        اجلب أحدث المنشورات والتعليقات من جميع المصادر المضافة
      </p>
    </div>
    <div className="px-6 py-5 space-y-4">
      <button
        onClick={handleIngest}
        disabled={ingesting}
        className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {ingesting && (
          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block" />
        )}
        {ingesting ? "جارٍ جمع البيانات..." : "تشغيل الاستماع"}
      </button>

      {ingestError && (
        <p className="text-red-400 text-sm">{ingestError}</p>
      )}

      {ingestResult && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 px-5 py-4 text-sm space-y-2">
          <p className="text-emerald-400 font-medium">اكتمل جمع البيانات ✓</p>
          <div className="flex gap-6 text-slate-300">
            <span>جديد: <span className="text-white font-semibold">{ingestResult.created}</span></span>
            <span>موجود: <span className="text-white font-semibold">{ingestResult.existing}</span></span>
            <span>متخطى: <span className="text-white font-semibold">{ingestResult.skipped}</span></span>
          </div>
          <div className="pt-2 space-y-1">
            {Object.entries(ingestResult.sources).map(([source, s]) => (
              <div key={source} className="flex justify-between text-xs text-slate-400">
                <span className="text-slate-300">{source}</span>
                {s.skipped
                  ? <span className="text-slate-600">متخطى</span>
                  : s.error
                  ? <span className="text-red-400">خطأ</span>
                  : <span>↑{s.created} جديد / {s.fetched} إجمالي</span>
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* Keywords Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold text-slate-200">الكلمات المفتاحية</h2>
            <p className="text-xs text-slate-500 mt-1">
              تُستخدم للبحث في Google News وReddit وYouTube
            </p>
          </div>

          {/* Add keyword form — admin only */}
          {isAdmin && (
            <form onSubmit={handleAddKeyword} className="flex gap-3 px-6 py-4 border-b border-slate-800">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="أضف كلمة مفتاحية جديدة..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 transition"
              >
                إضافة
              </button>
            </form>
          )}

          {keywordError && <p className="px-6 py-2 text-red-400 text-sm">{keywordError}</p>}
          {keywordSuccess && <p className="px-6 py-2 text-emerald-400 text-sm">{keywordSuccess}</p>}

          {loadingKeywords ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : keywords.length === 0 ? (
            <p className="px-6 py-4 text-slate-400 text-sm">لا توجد كلمات مفتاحية</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {keywords.map((k) => (
                <li key={k.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-slate-200">{k.keyword}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteKeyword(k.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      حذف
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Social Profiles Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold text-slate-200">حسابات التواصل الاجتماعي</h2>
            <p className="text-xs text-slate-500 mt-1">
              روابط الصفحات التي يتم جمع البيانات منها
            </p>
          </div>

          {/* Add profile form — admin only */}
          {isAdmin && (
            <form onSubmit={handleAddProfile} className="flex gap-3 px-6 py-4 border-b border-slate-800 flex-wrap">
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-400 outline-none transition"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 transition"
              >
                إضافة
              </button>
            </form>
          )}

          {profileError && <p className="px-6 py-2 text-red-400 text-sm">{profileError}</p>}
          {profileSuccess && <p className="px-6 py-2 text-emerald-400 text-sm">{profileSuccess}</p>}

          {loadingProfiles ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="px-6 py-4 text-slate-400 text-sm">لا توجد حسابات مضافة</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {profiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-sky-400 shrink-0">
                      {platformLabel(p.platform)}
                    </span>
                    <span className="text-sm text-slate-300 truncate">{p.url}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
                    >
                      حذف
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}