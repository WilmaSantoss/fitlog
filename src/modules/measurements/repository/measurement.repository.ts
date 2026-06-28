import { supabase, requireUserId } from '@/shared/db/supabase';
import {
  measurementFromRow,
  measurementToRow,
  type MeasurementRow,
} from '@/shared/db/mappers';
import type { Measurement } from '../domain/measurement.types';

const TABLE = 'measurements';

export interface IMeasurementRepository {
  listActive(): Promise<Measurement[]>;
  getById(id: string): Promise<Measurement | undefined>;
  insert(item: Measurement): Promise<void>;
  update(id: string, patch: Partial<Measurement>): Promise<void>;
  softDelete(id: string, updatedAt: string): Promise<void>;
}

class SupabaseMeasurementRepository implements IMeasurementRepository {
  async listActive(): Promise<Measurement[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_deleted', false)
      .order('recorded_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => measurementFromRow(row as MeasurementRow));
  }

  async getById(id: string): Promise<Measurement | undefined> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return measurementFromRow(data as MeasurementRow);
  }

  async insert(item: Measurement): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(TABLE)
      .insert(measurementToRow(item, userId));
    if (error) throw error;
  }

  async update(id: string, patch: Partial<Measurement>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.recordedAt !== undefined) row['recorded_at'] = patch.recordedAt;
    if (patch.weightKg !== undefined) row['weight_kg'] = patch.weightKg;
    if (patch.bodyFatPct !== undefined) row['body_fat_pct'] = patch.bodyFatPct;
    if (patch.chestCm !== undefined) row['chest_cm'] = patch.chestCm;
    if (patch.shoulderCm !== undefined) row['shoulder_cm'] = patch.shoulderCm;
    if (patch.waistCm !== undefined) row['waist_cm'] = patch.waistCm;
    if (patch.hipCm !== undefined) row['hip_cm'] = patch.hipCm;
    if (patch.armCm !== undefined) row['arm_cm'] = patch.armCm;
    if (patch.thighCm !== undefined) row['thigh_cm'] = patch.thighCm;
    if (patch.calfCm !== undefined) row['calf_cm'] = patch.calfCm;
    if (patch.notes !== undefined) row['notes'] = patch.notes;
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

export const measurementRepository: IMeasurementRepository =
  new SupabaseMeasurementRepository();
