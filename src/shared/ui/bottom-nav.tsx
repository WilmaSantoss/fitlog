import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, LineChart, User, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/cn';
import { QuickAddSheet } from './quick-add-sheet';

type Item = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

export function BottomNav() {
  const { t } = useTranslation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const left: readonly Item[] = [
    { to: '/', label: t('nav.home'), Icon: Home },
    { to: '/treino', label: t('nav.workouts'), Icon: Dumbbell },
  ];

  const right: readonly Item[] = [
    { to: '/progresso', label: t('nav.progress'), Icon: LineChart },
    { to: '/perfil', label: t('nav.profile'), Icon: User },
  ];

  return (
    <>
      <nav
        className="relative shrink-0 border-t border-line/60 bg-app pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        <ul className="flex items-stretch justify-around">
          {left.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          <li className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label={t('quickAdd.title')}
              className="-mt-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-lg shadow-accent/40 transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </li>

          {right.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </ul>
      </nav>

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
}

function NavItem({ item }: { item: Item }) {
  const { to, label, Icon } = item;
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        end={to === '/'}
        aria-label={label}
        className={({ isActive }) =>
          cn(
            'flex items-center justify-center py-3 transition-colors',
            isActive ? 'text-accent' : 'text-fg-muted hover:text-fg',
          )
        }
      >
        <Icon className="h-5 w-5" />
      </NavLink>
    </li>
  );
}
