import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  profileService,
  type ProfileInput,
} from '../services/profile.service';

const KEY = ['profile'] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => profileService.get(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => profileService.update(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
