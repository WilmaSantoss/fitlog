import type { Measurement } from '@/modules/measurements/domain/measurement.types';
import type {
  PlannedSet,
  RestByType,
  Routine,
  RoutineExercise,
  SessionExercise,
  SessionSet,
  SetType,
  WorkoutSession,
} from '@/modules/workouts/domain/workout.types';
import type { UserProfile } from '@/modules/profile/domain/profile.types';

// =====================================================
// Postgres usa snake_case, domínio usa camelCase.
// Mappers convertem nos dois sentidos por entidade.
// =====================================================

// ------------------- Measurements -------------------

export type MeasurementRow = {
  id: string;
  user_id: string;
  recorded_at: string;
  weight_kg: number | null;
  bicep_left_cm: number | null;
  bicep_right_cm: number | null;
  forearm_left_cm: number | null;
  forearm_right_cm: number | null;
  belly_cm: number | null;
  waist_cm: number | null;
  glutes_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export function measurementFromRow(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    weightKg: row.weight_kg,
    bicepLeftCm: row.bicep_left_cm,
    bicepRightCm: row.bicep_right_cm,
    forearmLeftCm: row.forearm_left_cm,
    forearmRightCm: row.forearm_right_cm,
    bellyCm: row.belly_cm,
    waistCm: row.waist_cm,
    glutesCm: row.glutes_cm,
    thighLeftCm: row.thigh_left_cm,
    thighRightCm: row.thigh_right_cm,
    calfLeftCm: row.calf_left_cm,
    calfRightCm: row.calf_right_cm,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function measurementToRow(
  m: Measurement,
  userId: string,
): Omit<MeasurementRow, 'created_at' | 'updated_at'> {
  return {
    id: m.id,
    user_id: userId,
    recorded_at: m.recordedAt,
    weight_kg: m.weightKg,
    bicep_left_cm: m.bicepLeftCm,
    bicep_right_cm: m.bicepRightCm,
    forearm_left_cm: m.forearmLeftCm,
    forearm_right_cm: m.forearmRightCm,
    belly_cm: m.bellyCm,
    waist_cm: m.waistCm,
    glutes_cm: m.glutesCm,
    thigh_left_cm: m.thighLeftCm,
    thigh_right_cm: m.thighRightCm,
    calf_left_cm: m.calfLeftCm,
    calf_right_cm: m.calfRightCm,
    notes: m.notes,
    is_deleted: m.isDeleted,
  };
}

// ------------------- Routines -------------------

// Tipos "crus" pra tolerar exercícios salvos antes da mudança de SetType/rest.
// Não removemos suporte por enquanto — usuárias existentes têm dados no formato antigo.
type LegacySetType =
  | 'warmup'
  | 'normal'
  | 'failure'
  | 'dropset'
  | 'cluster'
  | 'restPause'
  | SetType;

type StoredPlannedSet = Omit<PlannedSet, 'type'> & { type: LegacySetType };
type StoredSessionSet = Omit<SessionSet, 'type'> & { type: LegacySetType };

type StoredExerciseCommon = {
  rests?: Partial<RestByType> | null;
  restSeconds?: number | null;
};

type StoredRoutineExercise = Omit<RoutineExercise, 'rests' | 'sets'> &
  StoredExerciseCommon & { sets: readonly StoredPlannedSet[] };

type StoredSessionExercise = Omit<SessionExercise, 'rests' | 'sets'> &
  StoredExerciseCommon & { sets: readonly StoredSessionSet[] };

function migrateSetType(t: LegacySetType | string | null | undefined): SetType {
  if (t === 'WU' || t === 'FS' || t === 'WS') return t;
  if (t === 'warmup') return 'WU';
  return 'WS';
}

function migrateRests(
  rests: Partial<RestByType> | null | undefined,
  legacy: number | null | undefined,
): RestByType {
  const fallback = legacy ?? null;
  return {
    WU: rests?.WU ?? fallback,
    FS: rests?.FS ?? fallback,
    WS: rests?.WS ?? fallback,
  };
}

function migrateRoutineExercise(e: StoredRoutineExercise): RoutineExercise {
  return {
    id: e.id,
    name: e.name,
    notes: e.notes,
    rests: migrateRests(e.rests, e.restSeconds),
    videoUrl: e.videoUrl ?? null,
    sets: e.sets.map((s) => ({
      id: s.id,
      type: migrateSetType(s.type),
      reps: s.reps,
      weightKg: s.weightKg,
    })),
  };
}

function migrateSessionExercise(e: StoredSessionExercise): SessionExercise {
  return {
    id: e.id,
    name: e.name,
    notes: e.notes,
    rests: migrateRests(e.rests, e.restSeconds),
    videoUrl: e.videoUrl ?? null,
    sets: e.sets.map((s) => ({
      id: s.id,
      type: migrateSetType(s.type),
      plannedReps: s.plannedReps,
      plannedWeightKg: s.plannedWeightKg,
      actualReps: s.actualReps,
      actualWeightKg: s.actualWeightKg,
      completed: s.completed,
    })),
    completedAt: e.completedAt,
  };
}

export type RoutineRow = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  position: number;
  exercises: readonly StoredRoutineExercise[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export function routineFromRow(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    position: row.position,
    exercises: row.exercises.map(migrateRoutineExercise),
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function routineToRow(
  r: Routine,
  userId: string,
): Omit<RoutineRow, 'created_at' | 'updated_at'> {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    notes: r.notes,
    position: r.position,
    exercises: r.exercises,
    is_deleted: r.isDeleted,
  };
}

// ------------------- Workout Sessions -------------------

export type WorkoutSessionRow = {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine_name: string;
  notes: string | null;
  started_at: string;
  finished_at: string | null;
  exercises: readonly StoredSessionExercise[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export function sessionFromRow(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    routineId: row.routine_id,
    routineName: row.routine_name,
    notes: row.notes,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    exercises: row.exercises.map(migrateSessionExercise),
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sessionToRow(
  s: WorkoutSession,
  userId: string,
): Omit<WorkoutSessionRow, 'created_at' | 'updated_at'> {
  return {
    id: s.id,
    user_id: userId,
    routine_id: s.routineId,
    routine_name: s.routineName,
    notes: s.notes,
    started_at: s.startedAt,
    finished_at: s.finishedAt,
    exercises: s.exercises,
    is_deleted: s.isDeleted,
  };
}

// ------------------- Profile -------------------

export type ProfileRow = {
  id: string;
  name: string;
  height_cm: number | null;
  updated_at: string;
};

export function profileFromRow(row: ProfileRow): UserProfile {
  return {
    id: 'me',
    name: row.name,
    heightCm: row.height_cm,
    updatedAt: row.updated_at,
  };
}
