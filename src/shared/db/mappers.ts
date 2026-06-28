import type { Measurement } from '@/modules/measurements/domain/measurement.types';
import type {
  Routine,
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
  body_fat_pct: number | null;
  chest_cm: number | null;
  shoulder_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
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
    bodyFatPct: row.body_fat_pct,
    chestCm: row.chest_cm,
    shoulderCm: row.shoulder_cm,
    waistCm: row.waist_cm,
    hipCm: row.hip_cm,
    armCm: row.arm_cm,
    thighCm: row.thigh_cm,
    calfCm: row.calf_cm,
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
    body_fat_pct: m.bodyFatPct,
    chest_cm: m.chestCm,
    shoulder_cm: m.shoulderCm,
    waist_cm: m.waistCm,
    hip_cm: m.hipCm,
    arm_cm: m.armCm,
    thigh_cm: m.thighCm,
    calf_cm: m.calfCm,
    notes: m.notes,
    is_deleted: m.isDeleted,
  };
}

// ------------------- Routines -------------------

export type RoutineRow = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  position: number;
  exercises: Routine['exercises'];
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
    exercises: row.exercises,
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
  exercises: WorkoutSession['exercises'];
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
    exercises: row.exercises,
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
