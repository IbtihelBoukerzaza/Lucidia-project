import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function RequestAccessPage() {
  const services = [
    "تحليل مشاعر الزبائن",
    "الاستماع الاجتماعي",
    "مؤشر سمعة العلامة",
    "تقارير ذكية للإدارة",
    "تحليل الدارجة الجزائرية",
  ];

  const [index, setIndex] = useState(0);

  const [formData, setFormData] = useState({
    full_name: "",
    professional_email: "",
    company_name: "",
    sector: "",
    company_size: "",
    goal: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % services.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [services.length]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/request-access/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          const firstErrorMessage = data.errors[firstErrorKey]?.[0];
          throw new Error(firstErrorMessage || "فشل في إرسال الطلب");
        }

        throw new Error(data.message || "حدث خطأ أثناء إرسال الطلب");
      }

      setSuccess(true);
      setFormData({
        full_name: "",
        professional_email: "",
        company_name: "",
        sector: "",
        company_size: "",
        goal: "",
      });
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* ================= LEFT VISUAL SIDE ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-400/10" />

        {/* Rotating Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute w-80 h-80 rounded-full border border-slate-700/60"
        >
          <div className="absolute inset-0 rounded-full border-t-4 border-emerald-400/70" />
          <div className="absolute inset-0 rounded-full border-r-4 border-sky-400/70" />
          <div className="absolute inset-0 rounded-full border-b-4 border-rose-400/70" />
        </motion.div>

        {/* Center AI Core */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="relative w-56 h-56 rounded-full bg-slate-900 
                     border border-sky-400/40 shadow-2xl shadow-sky-500/20
                     flex items-center justify-center text-center p-6"
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr 
                          from-sky-400 via-emerald-400 to-rose-400 
                          opacity-20 blur-2xl"
          />

          <div className="relative z-10">
            <h2 className="text-sm text-slate-400 mb-2">خدماتنا</h2>

            <AnimatePresence mode="wait">
              <motion.p
                key={services[index]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="text-lg font-semibold text-sky-300"
              >
                {services[index]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Floating Mini Stats */}
        {[
          { text: "+72% رضا", top: "15%", left: "20%" },
          { text: "−14% شكاوى", top: "70%", left: "15%" },
          { text: "98K تعليق", top: "20%", right: "15%" },
          { text: "24/7 مراقبة", bottom: "20%", right: "20%" },
          { text: "دارجة ✓", top: "45%", left: "5%" },
          { text: "تقارير ذكية", top: "55%", right: "5%" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 + i }}
            className="absolute bg-slate-900/80 border border-slate-700 
                       px-3 py-1 rounded-lg text-xs text-slate-200 shadow-lg"
            style={stat}
          >
            {stat.text}
          </motion.div>
        ))}
      </div>

      {/* ================= RIGHT FORM SIDE ================= */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-10">
        <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-sky-300 mb-2">
            طلب إنشاء حساب مؤسسي
          </h1>

          <p className="text-sm text-slate-400 mb-6">
            املأ المعلومات التالية وسيتواصل معك فريق SentivyaDZ في أقرب وقت.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                الاسم الكامل
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
                placeholder="الاسم الكامل"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                البريد الإلكتروني المهني
              </label>
              <input
                type="email"
                name="professional_email"
                value={formData.professional_email}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
                placeholder="example@company.dz"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                اسم الشركة
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
                placeholder="اسم الشركة"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                قطاع النشاط
              </label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
              >
                <option value="">اختر القطاع</option>
                <option value="ecommerce">تجارة إلكترونية</option>
                <option value="finance">بنك / مالية</option>
                <option value="telecom">اتصالات</option>
                <option value="services">خدمات</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                حجم الشركة
              </label>
              <select
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
              >
                <option value="">اختر الحجم</option>
                <option value="1-10">1-10 موظفين</option>
                <option value="10-50">10-50 موظف</option>
                <option value="50-200">50-200 موظف</option>
                <option value="200+">200+ موظف</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ما الهدف من استخدام المنصة؟
              </label>
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
                placeholder="مثلاً: مراقبة سمعة العلامة التجارية وتحليل مشاعر الزبائن..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-sky-500 hover:bg-sky-400 transition rounded-full py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </button>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            {success && (
              <p className="text-green-400 text-sm mt-2">
                تم إرسال الطلب بنجاح 🎉
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}