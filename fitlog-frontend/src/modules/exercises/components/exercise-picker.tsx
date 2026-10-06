import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import {
  useExerciseSearchQuery,
  useLibraryExerciseQuery,
} from '../hooks/use-exercise-library';
import type { LibraryExercise } from '../domain/exercise.types';
import { ExerciseAnimation } from './exercise-animation';
import { ExercisePreviewDialog } from './exercise-preview-dialog';

type Props = {
  id?: string;
  name: string;
  libraryId: string | null;
  invalid?: boolean;
  // Ref do input de busca — o formulário usa pra focar/rolar até o campo
  // quando o nome está vazio ao salvar.
  inputRef?: (el: HTMLInputElement | null) => void;
  // Escolheu da biblioteca: nome vira o da biblioteca e guarda o id.
  onSelect: (exercise: LibraryExercise) => void;
  // Digitou livre (ou trocou): nome é o texto, sem vínculo com a biblioteca.
  onFreeName: (name: string) => void;
};

// Lista rola dentro de uma altura fixa; o limite só evita renderizar a
// biblioteca inteira (876) a cada tecla.
const SUGGESTIONS = 60;

// Campo de nome do exercício com busca na biblioteca. Dois estados:
//  - vinculado (libraryId): mostra o exercício escolhido com a animação e
//    botão "Trocar";
//  - livre: input de texto; enquanto digita, sugere da biblioteca. Se não
//    escolher nenhuma, o texto digitado fica como nome livre (sem foto).
export function ExercisePicker({
  id,
  name,
  libraryId,
  invalid,
  inputRef,
  onSelect,
  onFreeName,
}: Props) {
  const { t } = useTranslation();
  const linkedQ = useLibraryExerciseQuery(libraryId);
  const linked = libraryId ? linkedQ.data : undefined;
  // Depois de "Trocar", o campo de busca já abre focado.
  const [focusSearch, setFocusSearch] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (libraryId && linkedQ.isLoading) {
    return <div className="h-[86px] rounded-xl border border-line bg-surface-2" />;
  }

  if (libraryId && linked) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={t('exercises.view')}
          className="shrink-0 overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <ExerciseAnimation exercise={linked} className="w-28" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-fg">{linked.name}</p>
          <p className="mt-0.5 truncate text-xs text-fg-muted">
            {linked.primaryMuscles
              .map((m) => t(`exercises.muscles.${m}`))
              .join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leadingIcon={<Maximize2 className="h-3.5 w-3.5" />}
              onClick={() => setPreviewOpen(true)}
            >
              {t('exercises.view')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setFocusSearch(true);
                onFreeName(linked.name);
              }}
            >
              {t('exercises.change')}
            </Button>
          </div>
        </div>
        <ExercisePreviewDialog
          exercise={previewOpen ? linked : null}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <FreeNameSearch
      id={id}
      name={name}
      invalid={invalid}
      externalRef={inputRef}
      // Vínculo com id que não existe mais na biblioteca cai aqui também:
      // trata como nome livre.
      autoFocus={focusSearch}
      onSelect={onSelect}
      onFreeName={onFreeName}
    />
  );
}

function FreeNameSearch({
  id,
  name,
  invalid,
  externalRef,
  autoFocus,
  onSelect,
  onFreeName,
}: {
  id?: string;
  name: string;
  invalid?: boolean;
  externalRef?: (el: HTMLInputElement | null) => void;
  autoFocus: boolean;
  onSelect: (exercise: LibraryExercise) => void;
  onFreeName: (name: string) => void;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const deferred = useDeferredValue(name);
  const searchQ = useExerciseSearchQuery(deferred, { limit: SUGGESTIONS });
  const suggestions = deferred.trim() === '' ? [] : (searchQ.data ?? []);
  const showList = open && name.trim() !== '';

  // Setas do teclado: mantém a opção ativa visível dentro da lista que rola.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function choose(exercise: LibraryExercise) {
    onSelect(exercise);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showList || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      // Enter escolhe a sugestão em vez de enviar o formulário.
      e.preventDefault();
      const pick = suggestions[active];
      if (pick) choose(pick);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          ref={(el) => {
            inputRef.current = el;
            externalRef?.(el);
          }}
          id={id}
          value={name}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={t('exercises.pickerPlaceholder')}
          invalid={invalid}
          className="pl-10"
          onChange={(e) => {
            onFreeName(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showList && (
        // mousedown + preventDefault em toda a caixa: clicar numa opção ou
        // arrastar a barra de rolagem não tira o foco do input (senão o
        // blur fecha a lista antes do clique contar).
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface-2"
        >
          {suggestions.length > 0 && (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="flex max-h-72 flex-col overflow-y-auto overscroll-contain"
            >
              {suggestions.map((exercise, i) => (
                <li
                  key={exercise.id}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onClick={() => choose(exercise)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-2 py-1.5',
                    i === active && 'bg-accent/10',
                  )}
                >
                  <ExerciseAnimation
                    exercise={exercise}
                    still
                    className="w-14 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{exercise.name}</p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {exercise.primaryMuscles
                        .map((m) => t(`exercises.muscles.${m}`))
                        .join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* Fora da área que rola: sempre visível embaixo da lista. */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              inputRef.current?.blur();
            }}
            className={cn(
              'px-3 py-2 text-left text-xs text-fg-muted hover:text-fg',
              suggestions.length > 0 && 'border-t border-line/60',
            )}
          >
            {suggestions.length === 0
              ? t('exercises.pickerNoMatch', { name: name.trim() })
              : t('exercises.pickerUseFree', { name: name.trim() })}
          </button>
        </div>
      )}

      {!showList && name.trim() !== '' && (
        <p className="text-xs text-fg-subtle">{t('exercises.pickerFreeHint')}</p>
      )}
    </div>
  );
}
