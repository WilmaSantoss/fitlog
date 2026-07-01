import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput({ className, invalid, ...rest }, ref) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn(
            'h-11 w-full rounded-sm bg-surface-2 border border-line pl-3 pr-10 text-fg placeholder:text-fg-subtle',
            'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
            invalid && 'border-failure focus:border-failure focus:ring-failure/30',
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          title={show ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setShow((s) => !s)}
          className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
