import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('') // 'success', 'error', or ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus('')

    try {
      const response = await fetch('http://localhost:8000/api/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-[11px] font-semibold text-sky-300">{t('contact.tagline')}</p>
        <h1 className="text-2xl font-bold text-slate-50">
          {t('contact.title')}
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          {t('contact.description')}
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-2">
                  {t('contact.form.fullName')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  placeholder={t('contact.form.fullNamePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-2">
                  {t('contact.form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  placeholder={t('contact.form.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className="block text-xs font-medium text-slate-300 mb-2">
                  {t('contact.form.company')}
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  placeholder={t('contact.form.companyPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-300 mb-2">
                  {t('contact.form.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20"
                  placeholder={t('contact.form.phonePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-medium text-slate-300 mb-2">
                {t('contact.form.message')}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 resize-none"
                placeholder={t('contact.form.messagePlaceholder')}
              />
            </div>

            {/* Status Message */}
            {submitStatus && (
              <div className={`p-4 rounded-xl text-sm ${
                submitStatus === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {submitStatus === 'success' 
                  ? t('contact.form.success')
                  : t('contact.form.error')
                }
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-700/40 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                  {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('contact.form.sending')}
                </span>
              ) : (
                t('contact.form.sendMessage')
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">{t('contact.contactInfo.title')}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-sky-300 mt-1">📧</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t('contact.contactInfo.email')}</p>
                  <p className="text-xs text-slate-400">ibtihelpro0@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sky-300 mt-1">📱</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t('contact.contactInfo.phone')}</p>
                  <p className="text-xs text-slate-400">+213 123 456 789</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sky-300 mt-1">📍</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{t('contact.contactInfo.address')}</p>
                  <p className="text-xs text-slate-400">الجزائر، الجزائر</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">{t('contact.whyChooseUs.title')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <p className="text-xs text-slate-300">{t('contact.whyChooseUs.deepUnderstanding')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <p className="text-xs text-slate-300">{t('contact.whyChooseUs.support247')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <p className="text-xs text-slate-300">{t('contact.whyChooseUs.customSolutions')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <p className="text-xs text-slate-300">{t('contact.whyChooseUs.competitivePrices')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

