import { nowUtcIso } from '@/shared/lib/date';
import {
  profileRepository,
  type IProfileRepository,
} from '../repository/profile.repository';
import { PROFILE_ID, type UserProfile } from '../domain/profile.types';

export type ProfileInput = {
  readonly name: string;
  readonly heightCm: number | null;
};

export interface IProfileService {
  get(): Promise<UserProfile>;
  update(input: ProfileInput): Promise<UserProfile>;
}

class ProfileService implements IProfileService {
  private readonly repo: IProfileRepository;

  constructor(repo: IProfileRepository) {
    this.repo = repo;
  }

  get(): Promise<UserProfile> {
    return this.repo.get();
  }

  async update(input: ProfileInput): Promise<UserProfile> {
    const profile: UserProfile = {
      id: PROFILE_ID,
      name: input.name.trim(),
      heightCm: input.heightCm,
      updatedAt: nowUtcIso(),
    };
    await this.repo.save(profile);
    return profile;
  }
}

export const profileService: IProfileService = new ProfileService(profileRepository);
