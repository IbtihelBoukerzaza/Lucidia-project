import { NavLink } from 'react-router-dom'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { TrendingUp, Users, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, Brain, Globe, Zap, Shield, BarChart3, Clock, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-3 text-center shadow-sm shadow-slate-950/60">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-sky-300">{value}</p>
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const { currentLang } = useLanguage()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  
  const slides = [
    {
      id: 1,
      icon: Brain,
      title: t('home.features.aiAnalysis.title'),
      description: t('home.features.aiAnalysis.description'),
      gradient: "from-sky-500/20 to-emerald-500/20",
      iconColor: "text-sky-400"
    },
    {
      id: 2,
      icon: Globe,
      title: t('home.features.multiPlatform.title'),
      description: t('home.features.multiPlatform.description'),
      gradient: "from-emerald-500/20 to-amber-500/20",
      iconColor: "text-emerald-400"
    },
    {
      id: 3,
      icon: Zap,
      title: t('home.features.realTimeAlerts.title'),
      description: t('home.features.realTimeAlerts.description'),
      gradient: "from-amber-500/20 to-rose-500/20",
      iconColor: "text-amber-400"
    },
    {
      id: 4,
      icon: Shield,
      title: t('home.features.brandProtection.title'),
      description: t('home.features.brandProtection.description'),
      gradient: "from-rose-500/20 to-violet-500/20",
      iconColor: "text-rose-400"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    setIsVisible(true)
    const statsTimer = setTimeout(() => setStatsVisible(true), 800)
    return () => clearTimeout(statsTimer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-6">
          <p className={`inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-200 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
             style={{ transitionDelay: '200ms' }}>
             {t('home.tagline')}
          </p>
          <h1 className={`text-3xl font-bold leading-relaxed text-slate-50 sm:text-4xl lg:text-[2.7rem] transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}
              style={{ transitionDelay: '400ms' }}>
            {t('home.title')}
            <span className="text-sky-300"> {t('home.subtitle')}</span>
          </h1>
          <p className={`max-w-xl text-sm leading-relaxed text-slate-300 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}
             style={{ transitionDelay: '600ms' }}>
            {t('home.description')}
          </p>
          <div className={`flex flex-wrap items-center gap-3 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
               style={{ transitionDelay: '800ms' }}>
            <NavLink
              to="/products/social-listening"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-sky-500/60 hover:text-sky-200 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20"
            >
              {t('home.getStarted')}
            </NavLink>
          </div>
        </div>

        {/* Dynamic Feature Carousel */}
        <div className={`relative h-80 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 shadow-xl shadow-slate-950/70 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-8'}`}
             style={{ transitionDelay: '1000ms' }}>
          <div className="relative h-full">
            {slides.map((slide, index) => {
              const Icon = slide.icon
              const isActive = index === currentSlide
              const isPrev = index === (currentSlide - 1 + slides.length) % slides.length
              const isNext = index === (currentSlide + 1) % slides.length
              
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ease-in-out ${
                    isActive 
                      ? 'opacity-100 scale-100 translate-x-0' 
                      : isPrev 
                      ? 'opacity-0 scale-95 translate-x-full'
                      : isNext
                      ? 'opacity-0 scale-95 -translate-x-full'
                      : 'opacity-0 scale-90 translate-x-full'
                  }`}
                >
                  <div className={`rounded-2xl bg-gradient-to-br ${slide.gradient} p-4 mb-4`}>
                    <Icon className={`h-12 w-12 ${slide.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 text-center mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-slate-300 text-center leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-2 text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-700/80 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-2 text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-700/80 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-sky-400' 
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section with Line Chart */}
      <section className={`rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ transitionDelay: '1200ms' }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-400" />
            {t('home.analytics.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {t('home.analytics.description')}
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Line Chart - Sentiment Trends */}
          <div className={`lg:col-span-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
               style={{ transitionDelay: '1400ms' }}>
            <p className="text-sm font-semibold text-slate-200 mb-4">
              {t('home.analytics.sentimentEvolution')}
            </p>
            <div className="h-64">
              <Line
                data={{
                  labels: currentLang === 'ar' ? ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [
                    {
                      label: t('home.analytics.positive'),
                      data: [45, 52, 58, 62, 65, 68],
                      borderColor: 'rgba(16, 185, 129, 1)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: t('home.analytics.neutral'),
                      data: [30, 28, 25, 23, 22, 22],
                      borderColor: 'rgba(251, 191, 36, 1)',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: t('home.analytics.negative'),
                      data: [25, 20, 17, 15, 13, 10],
                      borderColor: 'rgba(239, 68, 68, 1)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#cbd5e1',
                        font: {
                          size: 12,
                        },
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: '#f1f5f9',
                      bodyColor: '#cbd5e1',
                      borderColor: '#475569',
                      borderWidth: 1,
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + context.parsed.y + '%'
                        }
                      }
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                      },
                      ticks: {
                        color: '#cbd5e1',
                        font: {
                          size: 11,
                        },
                      },
                    },
                    y: {
                      grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                      },
                      ticks: {
                        color: '#cbd5e1',
                        font: {
                          size: 11,
                        },
                        callback: function(value) {
                          return value + '%'
                        }
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          
          {/* Model Output Metrics Cards */}
          <div className="space-y-4">
            <div className={`rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                 style={{ transitionDelay: '1600ms' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-500/20 p-2">
                  <MessageSquare className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t('home.analytics.totalComments')}</p>
                  <p className="text-lg font-semibold text-slate-100" id="total-comments">0</p>
                  <p className="text-xs text-sky-400">{t('home.analytics.thisMonth')}</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                 style={{ transitionDelay: '1700ms' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/20 p-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t('home.analytics.positiveRate')}</p>
                  <p className="text-lg font-semibold text-slate-100" id="positive-rate">0%</p>
                  <p className="text-xs text-emerald-400">{t('home.analytics.ofTotalComments')}</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                 style={{ transitionDelay: '1800ms' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/20 p-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t('home.analytics.lastUpdate')}</p>
                  <p className="text-lg font-semibold text-slate-100" id="last-update">--:--</p>
                  <p className="text-xs text-amber-400">{t('home.analytics.realTime')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* كيفاش تخدم SentivyaDZ */}
      <section className={`rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ transitionDelay: '2000ms' }}>
        <h2 className="text-xl font-bold text-slate-50">
        {t('home.howItWorks.title')}        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {t('home.howItWorks.description')}        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className={`flex flex-col rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 transition-all duration-1000 hover:scale-105 hover:border-sky-500/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
               style={{ transitionDelay: '2200ms' }}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-lg font-bold text-sky-300">1</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.howItWorks.step1.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {t('home.howItWorks.step1.description')}
            </p>
          </div>
          <div className={`flex flex-col rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 transition-all duration-1000 hover:scale-105 hover:border-emerald-500/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
               style={{ transitionDelay: '2400ms' }}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-lg font-bold text-emerald-300">2</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.howItWorks.step2.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {t('home.howItWorks.step2.description')}
            </p>
          </div>
          <div className={`flex flex-col rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 transition-all duration-1000 hover:scale-105 hover:border-amber-500/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
               style={{ transitionDelay: '2600ms' }}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-lg font-bold text-amber-300">3</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.howItWorks.step3.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
{t('home.howItWorks.step3.description')}            </p>
          </div>
        </div>
      </section>

      {/* ماذا نقدم */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-50">{t('home.whatWeOffer.title')}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {t('home.whatWeOffer.description')}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NavLink
            to="/products/social-listening"
            className="group flex flex-col rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5 transition hover:border-sky-500/50"
          >
            <span className="text-2xl">📊</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.whatWeOffer.sentimentAnalysis.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {t('home.whatWeOffer.sentimentAnalysis.description')}
            </p>
            <span className="mt-3 text-[11px] font-semibold text-sky-300 group-hover:translate-x-1">{t('home.getStarted')} →</span>
          </NavLink>
          <div className="flex flex-col rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
            <span className="text-2xl">🇩🇿</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.whatWeOffer.dialectAnalysis.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {t('home.whatWeOffer.dialectAnalysis.description')}
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
            <span className="text-2xl">⚠</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-50">{t('home.whatWeOffer.reputationIndicator.title')}</h3>
            <p className="mt-1 text-xs text-slate-300">
{t('home.whatWeOffer.reputationIndicator.description')}            </p>
          </div>
        </div>
      </section>

      {/* لمن نقدّم خدماتنا؟ */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6">
        <h2 className="text-xl font-bold text-slate-50">{t('home.whoWeServe.title')}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {t('home.whoWeServe.description')}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-200">
            {t('home.whoWeServe.localBrands')}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-200">
            {t('home.whoWeServe.smes')}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-200">
            {t('home.whoWeServe.customerService')}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-200">
            {t('home.whoWeServe.agencies')}
          </span>
        </div>
      </section>
      {/* Connected to the platforms you use - Lucidya-style */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6">
        <h2 className="text-lg font-bold text-slate-50">
          {t('home.platforms.title')}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {t('home.platforms.description')}
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 px-6 py-4 transition-all duration-300 hover:border-sky-500/60 hover:bg-slate-900/80 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20">
            <svg className="h-8 w-8 text-slate-200 transition-colors duration-300 group-hover:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="mt-2 text-sm font-medium text-slate-200 transition-colors duration-300 group-hover:text-sky-300">{t('home.platforms.twitter')}</span>
          </div>
          <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 px-6 py-4 transition-all duration-300 hover:border-blue-500/60 hover:bg-slate-900/80 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
            <svg className="h-8 w-8 text-slate-200 transition-colors duration-300 group-hover:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="mt-2 text-sm font-medium text-slate-200 transition-colors duration-300 group-hover:text-blue-300">{t('home.platforms.facebook')}</span>
          </div>
          <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/60 px-6 py-4 transition-all duration-300 hover:border-pink-500/60 hover:bg-slate-900/80 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20">
            <svg className="h-8 w-8 text-slate-200 transition-colors duration-300 group-hover:text-pink-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
            </svg>
            <span className="mt-2 text-sm font-medium text-slate-200 transition-colors duration-300 group-hover:text-pink-300">{t('home.platforms.instagram')}</span>
          </div>
        </div>
      </section>
      {/* CTA final */}
      <section className="rounded-3xl border border-sky-500/30 bg-gradient-to-l from-sky-500/10 to-slate-950 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-50">
          {t('home.cta.title')}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
         {t('home.cta.description')}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <NavLink
            to="/contact-us"
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-700/30 hover:bg-sky-400"
          >
            {t('home.cta.contactUs')}
          </NavLink>
        </div>
      </section>
    
    </div>
  )
}

