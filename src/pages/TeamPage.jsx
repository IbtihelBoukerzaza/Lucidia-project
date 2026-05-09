import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function TeamPage() {
  const navigate = useNavigate();
  const { user, activeCompany, isAdmin, logout } = useAuth();

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetchMembers = async () => {
    if (!activeCompany) return;
    setLoadingMembers(true);
    try {
      const response = await api.getMembers(activeCompany.id);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError("فشل تحميل أعضاء الفريق");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeCompany]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");

    if (!inviteEmail || !inviteFirstName) {
      setInviteError("يرجى ملء جميع الحقول");
      return;
    }

    setInviteLoading(true);
    try {
      const response = await api.inviteMember({
        email: inviteEmail,
        first_name: inviteFirstName,
        company_id: activeCompany.id,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "فشل إرسال الدعوة");
      }

      setInviteSuccess("تم إرسال الدعوة بنجاح ✅");
      setInviteEmail("");
      setInviteFirstName("");
      await fetchMembers();

    } catch (err) {
      setInviteError(err.message || "حدث خطأ أثناء إرسال الدعوة");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeModal = () => {
    setShowModal(false);
    setInviteEmail("");
    setInviteFirstName("");
    setInviteError("");
    setInviteSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-2 text-sm text-slate-400 hover:text-sky-400 transition flex items-center gap-1"
            >
              → لوحة التحكم
            </button>
            <h1 className="text-3xl font-bold">إدارة الفريق</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400"
              >
                + دعوة محلل
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Members list */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold text-slate-200">أعضاء الفريق</h2>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="p-6 text-red-400 text-sm">{error}</p>
          ) : members.length === 0 ? (
            <p className="p-6 text-slate-400 text-sm">لا يوجد أعضاء حتى الآن</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-white">
                      {member.user.first_name || member.user.email}
                    </p>
                    <p className="text-sm text-slate-400">{member.user.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      member.role === "admin"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {member.role === "admin" ? "مدير" : "محلّل"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">دعوة محلل جديد</h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  الاسم الأول
                </label>
                <input
                  type="text"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="مثال: أحمد"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="analyst@company.dz"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
                />
              </div>

              {inviteError && (
                <p className="text-red-400 text-sm">{inviteError}</p>
              )}

              {inviteSuccess && (
                <p className="text-emerald-400 text-sm">{inviteSuccess}</p>
              )}

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 text-slate-950 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading ? "جارٍ الإرسال..." : "إرسال الدعوة"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}