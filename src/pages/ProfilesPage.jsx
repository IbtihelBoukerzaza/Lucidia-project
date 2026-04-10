import { useTranslation } from 'react-i18next'

export default function ProfilesPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-[11px] font-semibold text-amber-300">{t('profiles.tagline')}</p>
        <h1 className="text-2xl font-bold text-slate-50">
          {t('profiles.title')}
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          {t('profiles.description')}
        </p>
      </section>
    </div>
  )
}

