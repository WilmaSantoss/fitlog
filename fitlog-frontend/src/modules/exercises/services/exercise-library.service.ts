import {
  exerciseLibraryRepository,
  type IExerciseLibraryRepository,
} from '../repository/exercise-library.repository';
import type {
  Equipment,
  LibraryExercise,
  Muscle,
} from '../domain/exercise.types';

export type ExerciseSearchOptions = {
  readonly limit?: number;
  // Só exercícios com esse músculo como principal.
  readonly muscle?: Muscle | null;
};

// Equipamento de academia comum: na dúvida, aparece antes de kettlebell,
// elástico, bola etc.
const GYM_EQUIPMENT: ReadonlySet<Equipment> = new Set([
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'e-z curl bar',
]);

// Fotos servidas pelo jsDelivr direto do repositório do dataset, travado num
// commit (não muda se eles atualizarem). Etapa seguinte: copiar pro Supabase
// Storage e trocar só esta base.
const DATASET_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const IMAGE_BASE_URL = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${DATASET_COMMIT}/exercises/`;

// Minúsculo, sem acento, só letras/números — "Elevação Pélvica" e
// "elevacao pelvica" batem igual.
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasWordStartingWith(normalized: string, term: string): boolean {
  return (' ' + normalized).includes(' ' + term);
}

export interface IExerciseLibraryService {
  list(): Promise<readonly LibraryExercise[]>;
  get(id: string): Promise<LibraryExercise | undefined>;
  search(
    query: string,
    options?: ExerciseSearchOptions,
  ): Promise<readonly LibraryExercise[]>;
  imageUrls(exercise: LibraryExercise): readonly string[];
}

class ExerciseLibraryService implements IExerciseLibraryService {
  private readonly repo: IExerciseLibraryRepository;
  private index: Promise<
    readonly { exercise: LibraryExercise; pt: string; en: string }[]
  > | null = null;

  constructor(repo: IExerciseLibraryRepository) {
    this.repo = repo;
  }

  list(): Promise<readonly LibraryExercise[]> {
    return this.repo.list();
  }

  get(id: string): Promise<LibraryExercise | undefined> {
    return this.repo.getById(id);
  }

  private getIndex() {
    if (!this.index) {
      this.index = this.repo.list().then((all) =>
        all.map((exercise) => ({
          exercise,
          pt: normalizeSearch(exercise.name),
          en: normalizeSearch(exercise.nameEn),
        })),
      );
    }
    return this.index;
  }

  // Cada palavra digitada tem que ser o COMEÇO de uma palavra do nome (PT ou
  // EN), em qualquer ordem: "sup bar" acha "Supino reto com barra", mas
  // "press" não acha "Leg press" dentro de "Supino… (press)" por acaso no
  // meio de outra palavra. Acento e maiúscula não importam.
  // Ranking: nome PT começando com a busca > resto;
  // somando destaque (treinos reais) e equipamento de academia.
  // Empate: nome mais curto primeiro.
  // Busca vazia: lista inteira em ordem alfabética (navegar a biblioteca).
  async search(
    query: string,
    options: ExerciseSearchOptions = {},
  ): Promise<readonly LibraryExercise[]> {
    const { limit = 50, muscle = null } = options;
    const all = await this.getIndex();
    const index = muscle
      ? all.filter((e) => e.exercise.primaryMuscles.includes(muscle))
      : all;
    const q = normalizeSearch(query);
    if (q === '') return index.slice(0, limit).map((e) => e.exercise);
    const terms = q.split(' ');

    const scored: {
      exercise: LibraryExercise;
      inPt: boolean;
      score: number;
      len: number;
    }[] = [];
    for (const entry of index) {
      const inPt = terms.every((t) => hasWordStartingWith(entry.pt, t));
      const inEn = !inPt && terms.every((t) => hasWordStartingWith(entry.en, t));
      if (!inPt && !inEn) continue;
      let score = 0;
      if (inPt && entry.pt.startsWith(q)) score += 4;
      if (entry.exercise.featured) score += 3;
      if (entry.exercise.equipment && GYM_EQUIPMENT.has(entry.exercise.equipment)) {
        score += 1;
      }
      scored.push({ exercise: entry.exercise, inPt, score, len: entry.pt.length });
    }
    // Nome em inglês é só plano B ("hip thrust" → Elevação pélvica). Se algo
    // bateu em português, resultado que só bate no inglês é ruído.
    const anyPt = scored.some((x) => x.inPt);
    const relevant = anyPt ? scored.filter((x) => x.inPt) : scored;
    relevant.sort((a, b) => b.score - a.score || a.len - b.len);
    return relevant.slice(0, limit).map((x) => x.exercise);
  }

  imageUrls(exercise: LibraryExercise): readonly string[] {
    return exercise.images.map((path) => IMAGE_BASE_URL + path);
  }
}

export const exerciseLibraryService: IExerciseLibraryService =
  new ExerciseLibraryService(exerciseLibraryRepository);
