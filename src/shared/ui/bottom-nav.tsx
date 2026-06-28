import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Ruler, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { ComponentType } from 'react';

type Item = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

export function BottomNav() {
  const { t } = useTranslation();

  const items: readonly Item[] = [
    { to: '/', label: t('nav.home'), Icon: Home },
    { to: '/treino', label: t('nav.workouts'), Icon: Dumbbell },
    { to: '/medidas', label: t('nav.measurements'), Icon: Ruler },
    { to: '/perfil', label: t('nav.profile'), Icon: User },
  ];

  return (
    <nav
      className="shrink-0 border-t border-line/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-accent' : 'text-fg-muted hover:text-fg',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
