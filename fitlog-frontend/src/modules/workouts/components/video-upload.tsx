import { useRef, useState } from 'react';
import { Loader2, Play, Trash2, Upload } from 'lucide-react';
import {
  ACCEPTED_VIDEO_MIME,
  deleteExerciseVideoByUrl,
  MAX_VIDEO_BYTES,
  uploadExerciseVideo,
  validateVideoFile,
} from '../lib/exercise-video';

type Props = {
  exerciseId: string;
  videoUrl: string | null;
  onChange: (url: string | null) => void;
};

export function VideoUpload({ exerciseId, videoUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMb = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

  async function handleFile(file: File) {
    setError(null);
    const invalid = validateVideoFile(file);
    if (invalid) {
      if (invalid.kind === 'too-large') {
        setError(`Arquivo muito grande. Máximo ${invalid.maxMb} MB.`);
      } else {
        setError('Formato não suportado. Use MP4, WebM ou MOV.');
      }
      return;
    }

    setBusy(true);
    try {
      const url = await uploadExerciseVideo(exerciseId, file);
      onChange(url);
    } catch (err) {
      setError((err as Error).message || 'Falha no upload.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!videoUrl) return;
    setBusy(true);
    setError(null);
    try {
      await deleteExerciseVideoByUrl(videoUrl);
    } catch {
      // Silencioso — mesmo se o arquivo já não existir, seguimos.
    } finally {
      onChange(null);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_MIME.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {videoUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-line/60 bg-surface-2">
          <video
            key={videoUrl}
            src={videoUrl}
            className="block aspect-[16/10] w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
          <div className="flex items-center justify-between gap-2 border-t border-line/40 bg-surface/60 px-3 py-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Trocar vídeo
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-failure hover:opacity-80 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-2/40 text-fg-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent 0 10px, rgba(255,255,255,0.015) 10px 20px)',
          }}
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Enviando…</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span className="text-xs font-medium">Adicionar vídeo</span>
              <span className="text-[11px] text-fg-subtle">
                MP4 · WebM · MOV · até {maxMb} MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-failure">{error}</p>
      )}
    </div>
  );
}
