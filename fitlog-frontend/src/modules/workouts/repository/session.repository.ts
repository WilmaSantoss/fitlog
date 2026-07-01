import { supabase, requireUserId } from '@/shared/db/supabase';
import {
  sessionFromRow,
  sessionToRow,
  type WorkoutSessionRow,
} from '@/shared/db/mappers';
import type { WorkoutSession } from '../domain/workout.types';

const TABLE = 'workout_sessions';

export interface ISessionRepository {
  listFinished(): Promise<WorkoutSession[]>;
  listActive(): Promise<WorkoutSession[]>;
  getById(id: string): Promise<WorkoutSession | undefined>;
  insert(item: WorkoutSession): Promise<void>;
  update(id: string, patch: Partial<WorkoutSession>): Promise<void>;
  softDelete(id: string, updatedAt: string): Promise<void>;
}

class SupabaseSessionRepository implements ISessionRepository {
  async listFinished(): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_deleted', false)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => sessionFromRow(row as WorkoutSessionRow));
  }

  async listActive(): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_deleted', false)
      .is('finished_at', null)
      .order('started_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => sessionFromRow(row as WorkoutSessionRow));
  }

  async getById(id: string): Promise<WorkoutSession | undefined> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return sessionFromRow(data as WorkoutSessionRow);
  }

  async insert(item: WorkoutSession): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(TABLE)
      .insert(sessionToRow(item, userId));
    if (error) throw error;
  }

  async update(id: string, patch: Partial<WorkoutSession>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.routineId !== undefined) row['routine_id'] = patch.routineId;
    if (patch.routineName !== undefined) row['routine_name'] = patch.routineName;
    if (patch.notes !== undefined) row['notes'] = patch.notes;
    if (patch.startedAt !== undefined) row['started_at'] = patch.startedAt;
    if (patch.finishedAt !== undefined) row['finished_at'] = patch.finishedAt;
    if (patch.exercises !== undefined) row['exercises'] = patch.exercises;
    if (patch.isDeleted !== undefined) row['is_deleted'] = patch.isDeleted;
    if (patch.updatedAt !== undefined) row['updated_at'] = patch.updatedAt;

    const { error } = await supabase.from(TABLE).update(row).eq('id', id);
    if (error) throw error;
  }

  async softDelete(id: string, updatedAt: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_deleted: true, updated_at: updatedAt })
      .eq('id', id);
    if (error) throw error;
  }
}

export const sessionRepository: ISessionRepository =
  new SupabaseSessionRepository();
