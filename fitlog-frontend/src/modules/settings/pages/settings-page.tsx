import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/shared/ui/page-title';
import { SoundPreferences } from '../components/sound-preferences';
import { PushPreferences } from '../components/push-preferences';

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />
      <PushPreferences />
      <SoundPreferences />
    </div>
  );
}
