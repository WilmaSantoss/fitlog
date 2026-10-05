import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { exerciseLibraryService } from '../services/exercise-library.service';
import type { LibraryExercise } from '../domain/exercise.types';

type Props = {
  exercise: LibraryExercise;
  // still: só a 1ª foto (miniatura de lista). Senão alterna as duas em loop.
  still?: boolean;
  // contain: foto inteira dentro de um quadro de outra proporção (o fundo
  // branco da foto se mistura com o do quadro). cover (padrão): preenche 3:2.
  fit?: 'cover' | 'contain';
  className?: string;
};

// Fotos do dataset são 3:2. O fundo claro combina com o fundo das fotos
// (estúdio branco) e evita "moldura" escura em volta.
export function ExerciseAnimation({
  exercise,
  still,
  fit = 'cover',
  className,
}: Props) {
  const aspect = fit === 'cover' ? 'aspect-[3/2]' : '';
  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain';
  const [failed, setFailed] = useState(false);
  const [first, second] = exerciseLibraryService.imageUrls(exercise);

  if (!first || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-2 text-fg-subtle',
          aspect,
          className,
        )}
        aria-hidden
      >
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-white', aspect, className)}
      role="img"
      aria-label={exercise.name}
    >
      <img
        src={first}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('absolute inset-0 h-full w-full', objectFit)}
      />
      {!still && second && (
        <img
          src={second}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn('animate-frame-swap absolute inset-0 h-full w-full', objectFit)}
        />
      )}
    </div>
  );
}
