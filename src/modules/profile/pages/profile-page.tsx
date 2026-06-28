import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useProfileQuery, useUpdateProfile } from '../hooks/use-profile';
import {
  useCurrentAccount,
  useLogout,
} from '@/modules/auth/hooks/use-auth';

const APP_VERSION = '0.1.0';

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

  function handleLogout() {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    if (profileQ.data) {
      setName(profileQ.data.name);
      setHeightCm(
        profileQ.data.heightCm === null ? '' : String(profileQ.data.heightCm),
      );
    }
  }, [profileQ.data]);

  async function handleSave() {
    const parsed = heightCm.trim();
    const heightNum = parsed === '' ? null : Number(parsed);
    await updateMutation.mutateAsync({
      name,
      heightCm: heightNum !== null && Number.isFinite(heightNum) ? heightNum : null,
    });
    setStatusMsg(t('profile.saved'));
  }

  return (
    <>
      <PageHeader title={t('profile.title')} />

      {email && (
        <Card className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-fg-subtle">
              {t('auth.loggedInAs')}
            </p>
            <p className="truncate text-base font-medium text-fg">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<LogOut className="h-4 w-4" />}
            onClick={() => setConfirmLogoutOpen(true)}
          >
            {t('auth.logout')}
          </Button>
        </Card>
      )}

      <Card className="mb-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
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
            placeholder="170"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </FormField>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {t('common.save')}
        </Button>
      </Card>

      <Card className="text-sm text-fg-muted">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t('profile.about')}
        </h2>
        {t('profile.aboutBody', { version: APP_VERSION })}
      </Card>

      {statusMsg && (
        <p className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-center text-sm text-success">
          {statusMsg}
        </p>
      )}

      <ConfirmDialog
        open={confirmLogoutOpen}
        title={t('auth.logout')}
        confirmLabel={t('auth.logout')}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </>
  );
}
