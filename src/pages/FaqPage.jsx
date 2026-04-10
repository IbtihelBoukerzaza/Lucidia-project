import { HelpCircle, MessageCircle, Users, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function FaqPage() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [currentIcon, setCurrentIcon] = useState(0)
  
  const icons = [
    { Icon: MessageCircle, color: 'text-sky-400', delay: 0 },
    { Icon: Users, color: 'text-emerald-400', delay: 200 },
    { Icon: BookOpen, color: 'text-amber-400', delay: 400 }
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  const faqs = [
    {
      q: t('faq.questions.q1'),
      a: t('faq.questions.a1'),
    },
    {
      q: t('faq.questions.q2'),
      a: t('faq.questions.a2'),
    },
    {
      q: t('faq.questions.q3'),
      a: t('faq.questions.a3'),
    },
    {
      q: t('faq.questions.q4'),
      a: t('faq.questions.a4'),
    },
    {
      q: t('faq.questions.q5'),
      a: t('faq.questions.a5'),
    },
  ]

  return (
    <div className="space-y-10">
      {/* Hero Banner Section */}
      <section className={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 p-8 lg:p-12 shadow-xl shadow-slate-950/70 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
           style={{
             backgroundImage: `
               linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%),
               radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 40% 40%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
               repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(148, 163, 184, 0.02) 35px, rgba(148, 163, 184, 0.02) 70px)
             `,
             backgroundSize: 'cover, auto, auto, auto, auto'
           }}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-6">
            <div className={`inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-200 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <HelpCircle className="ml-2 h-4 w-4" />
              {t('faq.tagline')}
            </div>
            <h1 className={`text-3xl font-bold leading-relaxed text-slate-50 sm:text-4xl lg:text-[2.7rem] transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            {t('faq.title')}
            </h1>
              <p className="max-w-2xl text-sm text-slate-300">
          {t('faq.description')}
        </p>
          </div>
          
          {/* Animated Visual Elements */}
          <div className="relative h-64 lg:h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Central animated icon */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                  {icons.map(({ Icon, color }, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                        currentIcon === index ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-180'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="rounded-3xl border border-slate-700/50 bg-slate-800/30 p-8 backdrop-blur-sm shadow-2xl">
                        <Icon className={`h-16 w-16 ${color} transition-all duration-300 hover:scale-110`} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Orbiting elements */}
                <div className={`h-32 w-32 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  {icons.map(({ Icon, color }, index) => {
                    const angle = (index * 120 + currentIcon * 30) * Math.PI / 180
                    const x = Math.cos(angle) * 60
                    const y = Math.sin(angle) * 60
                    return (
                      <div
                        key={index}
                        className="absolute top-1/2 left-1/2 transition-all duration-1000 ease-in-out"
                        style={{
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        }}
                      >
                        <div className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-3 backdrop-blur-sm">
                          <Icon className={`h-6 w-6 ${color} opacity-60`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Animated decorative elements */}
            <div className={`absolute -top-4 -right-4 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
            <div className={`absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
            <div className={`absolute top-1/2 -left-8 h-16 w-16 rounded-full bg-amber-500/10 blur-xl transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[11px] font-semibold text-sky-300">{t('faq.tagline')}</p>
        <h1 className="text-2xl font-bold text-slate-50">{t('faq.title')}</h1>
     
      </section>

      <section className="grid gap-4">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-50">{item.q}</h2>
              <span className="text-xs text-sky-300 group-open:rotate-90 transition">→</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  )
}

