import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  exerciseLibraryService,
  type ExerciseSearchOptions,
} from '../services/exercise-library.service';

// Dado estático: nunca fica "velho" durante a sessão.
const STATIC = { staleTime: Infinity, gcTime: Infinity } as const;

const KEYS = {
  search: (query: string) => ['exerciseLibrary', 'search', query] as const,
  detail: (id: string | null) => ['exerciseLibrary', 'detail', id] as const,
};

export function useExerciseSearchQuery(
  query: string,
  options: ExerciseSearchOptions = {},
) {
  return useQuery({
    queryKey: [...KEYS.search(query), options.muscle ?? null, options.limit ?? null],
    queryFn: () => exerciseLibraryService.search(query, options),
    // Mantém a lista anterior enquanto digita, sem piscar vazio.
    placeholderData: keepPreviousData,
    ...STATIC,
  });
}

export function useLibraryExerciseQuery(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => (id ? exerciseLibraryService.get(id) : undefined),
    enabled: !!id,
    ...STATIC,
  });
}
