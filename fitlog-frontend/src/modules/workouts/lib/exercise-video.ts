import { supabase, requireUserId } from '@/shared/db/supabase';

export const EXERCISE_VIDEO_BUCKET = 'exercise-videos';
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_VIDEO_MIME: readonly string[] = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export type VideoValidationError =
  | { kind: 'too-large'; maxMb: number }
  | { kind: 'bad-format' };

export function validateVideoFile(file: File): VideoValidationError | null {
  if (file.size > MAX_VIDEO_BYTES) {
    return { kind: 'too-large', maxMb: MAX_VIDEO_BYTES / (1024 * 1024) };
  }
  if (!ACCEPTED_VIDEO_MIME.includes(file.type)) {
    return { kind: 'bad-format' };
  }
  return null;
}

function extForFile(file: File): string {
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
  return 'mp4';
}

function storagePath(userId: string, exerciseId: string, ext: string): string {
  return `${userId}/${exerciseId}.${ext}`;
}

export async function uploadExerciseVideo(
  exerciseId: string,
  file: File,
): Promise<string> {
  const userId = await requireUserId();
  const ext = extForFile(file);
  const path = storagePath(userId, exerciseId, ext);

  const { error } = await supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
  if (error) throw error;

  const { data } = supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .getPublicUrl(path);

  // Cache-buster pra forçar reload após overwrite
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function deleteExerciseVideoByUrl(videoUrl: string): Promise<void> {
  const marker = `/${EXERCISE_VIDEO_BUCKET}/`;
  const idx = videoUrl.indexOf(marker);
  if (idx < 0) return;
  const rawPath = videoUrl.slice(idx + marker.length).split('?')[0];
  if (!rawPath) return;

  const { error } = await supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .remove([rawPath]);
  if (error) throw error;
}
