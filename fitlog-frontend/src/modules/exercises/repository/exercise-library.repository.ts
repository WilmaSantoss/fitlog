import type { LibraryExercise } from '../domain/exercise.types';

export interface IExerciseLibraryRepository {
  list(): Promise<readonly LibraryExercise[]>;
  getById(id: string): Promise<LibraryExercise | undefined>;
}

// Biblioteca é estática (só leitura, ~880 itens) e vai junto do app: busca
// instantânea e funciona offline. Import dinâmico pra não pesar no bundle
// inicial — só carrega quando alguém abre a biblioteca ou o seletor.
class StaticExerciseLibraryRepository implements IExerciseLibraryRepository {
  private cache: Promise<{
    list: readonly LibraryExercise[];
    byId: ReadonlyMap<string, LibraryExercise>;
  }> | null = null;

  private load() {
    if (!this.cache) {
      this.cache = import('../data/exercise-library.data').then((m) => ({
        list: m.EXERCISE_LIBRARY,
        byId: new Map(m.EXERCISE_LIBRARY.map((e) => [e.id, e])),
      }));
    }
    return this.cache;
  }

  async list(): Promise<readonly LibraryExercise[]> {
    return (await this.load()).list;
  }

  async getById(id: string): Promise<LibraryExercise | undefined> {
    return (await this.load()).byId.get(id);
  }
}

export const exerciseLibraryRepository: IExerciseLibraryRepository =
  new StaticExerciseLibraryRepository();
