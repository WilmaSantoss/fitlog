import { supabase, requireUserId } from '@/shared/db/supabase';
import {
  routineFromRow,
  routineToRow,
  type RoutineRow,
} from '@/shared/db/mappers';
import type { Routine } from '../domain/workout.types';

const TABLE = 'routines';

export interface IRoutineRepository {
  listActive(): Promise<Routine[]>;
  getById(id: string): Promise<Routine | undefined>;
  insert(item: Routine): Promise<void>;
  update(id: string, patch: Partial<Routine>): Promise<void>;
  softDelete(id: string, updatedAt: string): Promise<void>;
  nextPosition(): Promise<number>;
}

class SupabaseRoutineRepository implements IRoutineRepository {
  async listActive(): Promise<Routine[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_deleted', false)
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => routineFromRow(row as RoutineRow));
  }

  async getById(id: string): Promise<Routine | undefined> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return routineFromRow(data as RoutineRow);
  }

  async insert(item: Routine): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(TABLE)
      .insert(routineToRow(item, userId));
    if (error) throw error;
  }

  async update(id: string, patch: Partial<Routine>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row['name'] = patch.name;
    if (patch.notes !== undefined) row['notes'] = patch.notes;
    if (patch.position !== undefined) row['position'] = patch.position;
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

  async nextPosition(): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
    if (error) throw error;
    const top = data?.[0]?.position;
    return typeof top === 'number' ? top + 1 : 1;
  }
}

export const routineRepository: IRoutineRepository =
  new SupabaseRoutineRepository();
