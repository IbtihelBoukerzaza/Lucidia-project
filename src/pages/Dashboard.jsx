import { useNavigate } from "react-router-dom";
import { clearAuth, getUser, getAccessToken, getRefreshToken } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    try {
      if (access && refresh) {
        await fetch("http://127.0.0.1:8000/api/accounts/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="mt-2 text-slate-400">
              مرحباً {user?.first_name || user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
          >
            تسجيل الخروج
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">تحليل المشاعر</p>
            <h2 className="mt-2 text-2xl font-bold text-sky-300">قريباً</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">الاستماع الاجتماعي</p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-300">قريباً</h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">تقارير العملاء</p>
            <h2 className="mt-2 text-2xl font-bold text-teal-300">قريباً</h2>
          </div>
        </div>
      </div>
    </div>
  );
}