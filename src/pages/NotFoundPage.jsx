import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-slate-50">404</h1>
      <p className="max-w-md text-sm text-slate-300">
        {t('notFound.description')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <NavLink
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          {t('notFound.backToHome')}
        </NavLink>
        <NavLink
          to="/products/social-listening"
          className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-5 py-2 text-sm font-semibold text-slate-100 hover:border-sky-400"
        >
          {t('notFound.analyzeSentiments')}
        </NavLink>
      </div>
    </div>
  )
}

