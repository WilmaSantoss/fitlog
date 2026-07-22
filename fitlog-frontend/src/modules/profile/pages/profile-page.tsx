import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, SunMedium } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageTitle } from '@/shared/ui/page-title';
import { useProfileQuery, useUpdateProfile } from '../hooks/use-profile';
import { useCurrentAccount, useLogout } from '@/modules/auth/hooks/use-auth';

const APP_VERSION = '1.3.6';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profileQ = useProfileQuery();
  const updateMutation = useUpdateProfile();
  const { email } = useCurrentAccount();
  const logout = useLogout();

  const [name, setName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    if (profileQ.data) {
      setName(profileQ.data.name);
      setHeightCm(
        profileQ.data.heightCm === null ? '' : String(profileQ.data.heightCm),
      );
    }
  }, [profileQ.data]);

  function handleLogout() {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/login', { replace: true });
  }

  function handleCancel() {
    if (profileQ.data) {
      setName(profileQ.data.name);
      setHeightCm(
        profileQ.data.heightCm === null ? '' : String(profileQ.data.heightCm),
      );
    }
  }

  async function handleSave() {
    const parsed = heightCm.trim();
    const heightNum = parsed === '' ? null : Number(parsed);
    await updateMutation.mutateAsync({
      name,
      heightCm:
        heightNum !== null && Number.isFinite(heightNum) ? heightNum : null,
    });
    setStatusMsg(t('profile.saved'));
  }

  const displayName =
    profileQ.data?.name?.trim() ||
    (email ? email.split('@')[0] : '') ||
    t('home.greetingAnon');
  const initial = displayName.charAt(0).toUpperCase() || 'F';

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle title={t('profile.title')} subtitle={t('profile.subtitle')} />

      {email && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-on-accent shadow-lg shadow-accent/30">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-fg">
                {displayName}
              </p>
              <p className="truncate text-xs text-fg-muted">{email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<LogOut className="h-3.5 w-3.5" />}
            onClick={() => setConfirmLogoutOpen(true)}
            className="rounded-full"
          >
            {t('auth.logout')}
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          {t('profile.settings')}
        </h2>
        <FormField label={t('profile.name')} htmlFor="name">
          <Input
            id="name"
            placeholder="Wilma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label={t('profile.heightCm')} htmlFor="height" optional>
          <Input
            id="height"
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="170"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </FormField>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {t('common.save')}
          </Button>
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/ajustes')}
        className="-mx-2 flex items-center justify-between gap-3 border-t border-line/40 px-2 py-4 text-left transition-colors hover:text-fg"
      >
        <div className="flex items-center gap-3">
          <SunMedium className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-fg">
            {t('nav.settings')}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-fg-subtle" />
      </button>

      {statusMsg && (
        <p className="rounded-xl bg-success/10 px-3 py-2 text-center text-sm text-success">
          {statusMsg}
        </p>
      )}

      <p className="px-1 text-xs">
        <span className="font-medium uppercase tracking-wider text-fg-subtle">
          {t('profile.about')}
        </span>{' '}
        <span className="text-fg-muted">
          {t('profile.aboutBody', { version: APP_VERSION })}
        </span>
      </p>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title={t('auth.logout')}
        confirmLabel={t('auth.logout')}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </div>
  );
}
