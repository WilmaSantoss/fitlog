import type { ReactNode } from 'react';
import { useLibraryExerciseQuery } from '../hooks/use-exercise-library';
import { ExerciseAnimation } from './exercise-animation';

type Props = {
  libraryId: string;
  className?: string;
  // Mostrado enquanto carrega ou se o id não existir mais na biblioteca.
  fallback: ReactNode;
};

// Animação da biblioteca a partir do id guardado no exercício do treino.
export function LibraryExerciseMedia({ libraryId, className, fallback }: Props) {
  const q = useLibraryExerciseQuery(libraryId);
  if (!q.data) return <>{fallback}</>;
  return <ExerciseAnimation exercise={q.data} fit="contain" className={className} />;
}
