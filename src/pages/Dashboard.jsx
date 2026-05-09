import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, activeCompany, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="mt-2 text-slate-400">
              مرحباً {user?.first_name || user?.email}
            </p>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">
                {activeCompany.name} —{" "}
                <span className={isAdmin ? "text-emerald-400" : "text-slate-400"}>
                  {isAdmin ? "مدير" : "محلّل"}
                </span>
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
          >
            تسجيل الخروج
          </button>
        </div>

{/* Cards — visible to everyone */}
<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
  <button
    onClick={() => navigate("/posts")}
    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-right hover:border-sky-500 transition group"
  >
    <p className="text-sm text-slate-400 group-hover:text-sky-400 transition">المنشورات المجمّعة</p>
    <h2 className="mt-2 text-2xl font-bold text-sky-300">عرض</h2>
    <p className="mt-1 text-xs text-slate-500">تصفح المنشورات وفلترتها حسب المصدر</p>
  </button>

  <button
    onClick={() => navigate("/sentiment")}
    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-right hover:border-emerald-500 transition group"
  >
    <p className="text-sm text-slate-400 group-hover:text-emerald-400 transition">تحليل المشاعر</p>
    <h2 className="mt-2 text-2xl font-bold text-emerald-300">عرض</h2>
    <p className="mt-1 text-xs text-slate-500">توزيع المشاعر والكلمات المفتاحية</p>
  </button>

  <button
    onClick={() => navigate("/topics")}
    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-right hover:border-violet-500 transition group"
  >
    <p className="text-sm text-slate-400 group-hover:text-violet-400 transition">تحليل المواضيع</p>
    <h2 className="mt-2 text-2xl font-bold text-violet-300">عرض</h2>
    <p className="mt-1 text-xs text-slate-500">أبرز الكلمات والمواضيع المتكررة</p>
  </button>

  <button
    onClick={() => navigate("/alerts")}
    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-right hover:border-red-500/50 transition group"
  >
    <p className="text-sm text-slate-400 group-hover:text-red-400 transition">التنبيهات والإشعارات</p>
    <h2 className="mt-2 text-2xl font-bold text-red-400">عرض</h2>
    <p className="mt-1 text-xs text-slate-500">قواعد تنبيه تلقائية وسجل الإشعارات</p>
  </button>
</div>

        {/* Admin-only section */}
        {isAdmin && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">
              إدارة الحساب — خاص بالمدير
            </h2>
            <div className="grid gap-6 md:grid-cols-2">

              <button
                onClick={() => navigate("/team")}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-right hover:border-sky-500 transition group"
              >
                <p className="text-sm text-slate-400 group-hover:text-sky-400 transition">
                  إدارة الفريق
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  المحللون والأعضاء
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  دعوة محللين جدد وإدارة الصلاحيات
                </p>
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-right hover:border-sky-500 transition group"
              >
                <p className="text-sm text-slate-400 group-hover:text-sky-400 transition">
                  إعدادات الشركة
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  الكلمات المفتاحية والمصادر
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  إدارة الكلمات المفتاحية وحسابات التواصل الاجتماعي
                </p>
              </button>
              <button
  onClick={() => navigate("/surveys")}
  className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-right hover:border-teal-500 transition group"
>
  <p className="text-sm text-slate-400 group-hover:text-teal-400 transition">
    استطلاعات الرأي
  </p>
  <h2 className="mt-2 text-xl font-bold text-white">
    إنشاء وإدارة الاستطلاعات
  </h2>
  <p className="mt-1 text-xs text-slate-500">
    اجمع آراء العملاء وحلّل نتائجها تلقائياً
  </p>
</button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}