import { Play } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';
import { IconButton } from '@/shared/ui/icon-button';
import { useSoundPrefsStore } from '@/shared/state/sound-prefs.store';
import {
  DEFAULT_SOUND_ID,
  EVENTS,
  SOUND_OPTIONS,
} from '@/shared/lib/sound-options';
import { previewSoundOption } from '@/shared/lib/sound';

export function SoundPreferences() {
  const prefs = useSoundPrefsStore((s) => s.prefs);
  const setPref = useSoundPrefsStore((s) => s.setPref);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          Sons
        </h2>
        <p className="mt-1 text-xs text-fg-muted">
          Escolha o som tocado em cada evento. Padrão é sintetizado.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {EVENTS.map((evt) => {
          const current = prefs[evt.id] ?? DEFAULT_SOUND_ID;
          const options = SOUND_OPTIONS[evt.id];
          return (
            <div key={evt.id} className="flex flex-col gap-1.5">
              <label
                htmlFor={`sound-${evt.id}`}
                className="text-sm font-medium text-fg"
              >
                {evt.label}
              </label>
              <div className="flex items-center gap-2">
                <Select
                  id={`sound-${evt.id}`}
                  value={current}
                  onChange={(e) => setPref(evt.id, e.target.value)}
                  className="flex-1"
                >
                  <option value={DEFAULT_SOUND_ID}>{evt.defaultLabel}</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <IconButton
                  label="Pré-ouvir"
                  onClick={() => previewSoundOption(current, evt.id)}
                >
                  <Play className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          );
        })}

        {EVENTS.every((evt) => SOUND_OPTIONS[evt.id].length === 0) && (
          <p className="rounded-lg border border-dashed border-line/60 bg-surface-2/30 px-3 py-2 text-xs text-fg-muted">
            Sem sons personalizados ainda. Adicione mp3 em{' '}
            <code className="font-mono text-fg">public/sounds/&lt;evento&gt;/</code>{' '}
            e registre em{' '}
            <code className="font-mono text-fg">sound-options.ts</code>.
          </p>
        )}
      </div>
    </Card>
  );
}
