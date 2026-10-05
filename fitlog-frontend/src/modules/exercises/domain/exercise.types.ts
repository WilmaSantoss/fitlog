// Biblioteca de exercícios (free-exercise-db, domínio público).
// Valores dos enums são as chaves originais do dataset em inglês — estáveis,
// append-only. Rótulo em PT vem do i18n (exercises.muscles.*, etc.).

export type Muscle =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export const MUSCLES: readonly Muscle[] = [
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower back',
  'middle back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
] as const;

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'body only'
  | 'kettlebells'
  | 'bands'
  | 'e-z curl bar'
  | 'medicine ball'
  | 'exercise ball'
  | 'foam roll'
  | 'other';

export type ExerciseCategory =
  | 'strength'
  | 'stretching'
  | 'plyometrics'
  | 'powerlifting'
  | 'olympic weightlifting'
  | 'strongman'
  | 'cardio';

export type LibraryExercise = {
  // Id do dataset (ex.: "Barbell_Hip_Thrust"). Estável — é o que a rotina guarda.
  readonly id: string;
  readonly name: string;
  readonly nameEn: string;
  readonly category: ExerciseCategory;
  // null = sem equipamento informado no dataset
  readonly equipment: Equipment | null;
  readonly primaryMuscles: readonly Muscle[];
  readonly secondaryMuscles: readonly Muscle[];
  // Caminhos relativos no dataset (ex.: "Barbell_Hip_Thrust/0.jpg"):
  // 0 = posição inicial, 1 = posição final. Vazio em 3 exercícios.
  readonly images: readonly string[];
  // Exercício comum nos treinos reais — sobe na busca.
  readonly featured: boolean;
};
