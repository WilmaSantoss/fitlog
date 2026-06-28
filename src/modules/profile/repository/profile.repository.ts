import { supabase, requireUserId } from '@/shared/db/supabase';
import { profileFromRow, type ProfileRow } from '@/shared/db/mappers';
import {
  defaultProfile,
  PROFILE_ID,
  type UserProfile,
} from '../domain/profile.types';

const TABLE = 'profiles';

export interface IProfileRepository {
  get(): Promise<UserProfile>;
  save(profile: UserProfile): Promise<void>;
}

class SupabaseProfileRepository implements IProfileRepository {
  async get(): Promise<UserProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return defaultProfile;
    return profileFromRow(data as ProfileRow);
  }

  async save(profile: UserProfile): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          id: userId,
          name: profile.name,
          height_cm: profile.heightCm,
          updated_at: profile.updatedAt,
        },
        { onConflict: 'id' },
      );
    if (error) throw error;
    // PROFILE_ID local stays as 'me' — só usado pro cache do React Query
    void PROFILE_ID;
  }
}

export const profileRepository: IProfileRepository =
  new SupabaseProfileRepository();
