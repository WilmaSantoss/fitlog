export type SetType = 'WU' | 'FS' | 'WS';

export const SET_TYPES: readonly SetType[] = ['WU', 'FS', 'WS'] as const;

export type RestByType = {
  readonly WU: number | null;
  readonly FS: number | null;
  readonly WS: number | null;
};

export const EMPTY_RESTS: RestByType = { WU: null, FS: null, WS: null };

export type PlannedSet = {
  readonly id: string;
  readonly type: SetType;
  readonly reps: string | null;
  readonly weightKg: number | null;
};

export type RoutineExercise = {
  readonly id: string;
  readonly name: string;
  // Id na biblioteca de exercícios (módulo exercises). null = nome livre,
  // sem foto da biblioteca.
  readonly libraryId: string | null;
  readonly notes: string | null;
  readonly rests: RestByType;
  readonly videoUrl: string | null;
  readonly sets: readonly PlannedSet[];
};

export type Routine = {
  readonly id: string;
  readonly name: string;
  readonly notes: string | null;
  readonly position: number;
  readonly exercises: readonly RoutineExercise[];
  readonly isDeleted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SessionSet = {
  readonly id: string;
  readonly type: SetType;
  readonly plannedReps: string | null;
  readonly plannedWeightKg: number | null;
  readonly actualReps: number | null;
  readonly actualWeightKg: number | null;
  readonly completed: boolean;
};

// Exercício do treino que foi trocado só naquele dia (academia cheia etc.).
export type ReplacedExercise = {
  readonly name: string;
  readonly libraryId: string | null;
};

export type SessionExercise = {
  readonly id: string;
  readonly name: string;
  readonly libraryId: string | null;
  // Preenchido quando o exercício foi substituído durante o treino: guarda o
  // original da rotina. A rotina em si nunca muda por causa disso.
  readonly replacedFrom: ReplacedExercise | null;
  readonly notes: string | null;
  readonly rests: RestByType;
  readonly videoUrl: string | null;
  readonly sets: readonly SessionSet[];
  readonly completedAt: string | null;
};

export type WorkoutSession = {
  readonly id: string;
  readonly routineId: string | null;
  readonly routineName: string;
  readonly notes: string | null;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly exercises: readonly SessionExercise[];
  readonly isDeleted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};
