export type UserProfile = {
  readonly id: 'me';
  readonly name: string;
  readonly heightCm: number | null;
  readonly updatedAt: string;
};

export const PROFILE_ID = 'me' as const;

export const defaultProfile: UserProfile = {
  id: PROFILE_ID,
  name: '',
  heightCm: null,
  updatedAt: new Date(0).toISOString(),
};
