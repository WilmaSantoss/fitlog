import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from './icon-button';
import { cn } from '@/shared/lib/cn';

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean | string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, back, actions, className }: Props) {
  const navigate = useNavigate();

  function handleBack() {
    if (typeof back === 'string') {
      navigate(back);
    } else {
      navigate(-1);
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-20 -mx-5 mb-3 flex items-center gap-3 bg-app px-5 pb-3 pt-5',
        className,
      )}
    >
      {back && (
        <IconButton label="Voltar" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight text-fg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
