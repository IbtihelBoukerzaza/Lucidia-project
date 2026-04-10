import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loadingVerify, setLoadingVerify] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setApiError("رابط التفعيل غير صالح أو لا يحتوي على رمز التفعيل.");
        setLoadingVerify(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/accounts/activation/verify/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const firstKey = data?.errors ? Object.keys(data.errors)[0] : null;
          const firstMessage = firstKey ? data.errors[firstKey]?.[0] : null;
          throw new Error(firstMessage || data.message || "رمز التفعيل غير صالح.");
        }

        setTokenValid(true);
        setUserInfo({
          email: data.email,
          first_name: data.first_name,
        });
      } catch (error) {
        setTokenValid(false);
        setApiError(error.message || "تعذر التحقق من رمز التفعيل.");
      } finally {
        setLoadingVerify(false);
      }
    };

    verifyToken();
  }, [token]);

  const validate = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل";
    }

    if (!confirmPassword) {
      newErrors.confirm_password = "تأكيد كلمة المرور مطلوب";
    } else if (password !== confirmPassword) {
      newErrors.confirm_password = "كلمتا المرور غير متطابقتين";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError("");
    setSuccess("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoadingSubmit(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/activation/set-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const firstKey = data?.errors ? Object.keys(data.errors)[0] : null;
        const firstMessage = firstKey ? data.errors[firstKey]?.[0] : null;
        throw new Error(firstMessage || data.message || "فشل في تعيين كلمة المرور.");
      }

      setSuccess("تم تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setApiError(error.message || "حدث خطأ أثناء تعيين كلمة المرور.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md rounded-3xl bg-slate-900/70 border border-slate-800 p-10 backdrop-blur-xl shadow-[0_0_45px_rgba(56,189,248,0.15)]"
      >
        <h2 className="text-3xl font-bold text-center mb-2">تفعيل الحساب</h2>

        <p className="text-center text-slate-400 text-sm mb-8">
          أنشئ كلمة المرور الخاصة بك لإكمال تفعيل حسابك
        </p>

        {loadingVerify ? (
          <div className="text-center text-slate-300 py-8">
            جارٍ التحقق من رابط التفعيل...
          </div>
        ) : !tokenValid ? (
          <div className="space-y-4">
            <p className="text-center text-red-400 text-sm">
              {apiError || "رابط التفعيل غير صالح أو منتهي الصلاحية."}
            </p>

            <div className="text-center text-sm text-slate-400">
              يمكنك العودة إلى{" "}
              <NavLink
                to="/login"
                className="text-sky-400 font-semibold hover:underline"
              >
                تسجيل الدخول
              </NavLink>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">الحساب</p>
              <p className="mt-1 font-semibold text-sky-300">
                {userInfo?.first_name || "مستخدم جديد"}
              </p>
              <p className="text-sm text-slate-300">{userInfo?.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="password"
                  placeholder="كلمة المرور الجديدة"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="تأكيد كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
                />
                {errors.confirm_password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirm_password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 text-slate-950 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSubmit ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
              </button>

              {apiError && (
                <p className="text-red-400 text-sm text-center">{apiError}</p>
              )}

              {success && (
                <p className="text-green-400 text-sm text-center">{success}</p>
              )}
            </form>

            <div className="text-center text-sm text-slate-400 mt-6">
              لديك حساب بالفعل؟{" "}
              <NavLink
                to="/login"
                className="text-sky-400 font-semibold hover:underline"
              >
                تسجيل الدخول
              </NavLink>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}