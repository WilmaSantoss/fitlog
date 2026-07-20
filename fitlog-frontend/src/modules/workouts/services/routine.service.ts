import { newId } from '@/shared/lib/uuid';
import { nowUtcIso } from '@/shared/lib/date';
import {
  routineRepository,
  type IRoutineRepository,
} from '../repository/routine.repository';
import type {
  PlannedSet,
  Routine,
  RoutineExercise,
  SetType,
} from '../domain/workout.types';

export type PlannedSetInput = {
  readonly id?: string;
  readonly type: SetType;
  readonly reps: string | null;
  readonly weightKg: number | null;
};

export type RoutineExerciseInput = {
  readonly id?: string;
  readonly name: string;
  readonly notes: string | null;
  readonly restSeconds: number | null;
  readonly videoUrl: string | null;
  readonly sets: readonly PlannedSetInput[];
};

export type RoutineInput = {
  readonly name: string;
  readonly notes: string | null;
  readonly exercises: readonly RoutineExerciseInput[];
};

export interface IRoutineService {
  list(): Promise<Routine[]>;
  get(id: string): Promise<Routine | undefined>;
  create(input: RoutineInput): Promise<Routine>;
  update(id: string, input: RoutineInput): Promise<void>;
  duplicate(id: string): Promise<Routine | undefined>;
  remove(id: string): Promise<void>;
}

function materializeSet(s: PlannedSetInput): PlannedSet {
  return {
    id: s.id ?? newId(),
    type: s.type,
    reps: s.reps,
    weightKg: s.weightKg,
  };
}

function materializeExercise(e: RoutineExerciseInput): RoutineExercise {
  return {
    id: e.id ?? newId(),
    name: e.name,
    notes: e.notes,
    restSeconds: e.restSeconds,
    videoUrl: e.videoUrl,
    sets: e.sets.map(materializeSet),
  };
}

class RoutineService implements IRoutineService {
  private readonly repo: IRoutineRepository;

  constructor(repo: IRoutineRepository) {
    this.repo = repo;
  }

  list(): Promise<Routine[]> {
    return this.repo.listActive();
  }

  get(id: string): Promise<Routine | undefined> {
    return this.repo.getById(id);
  }

  async create(input: RoutineInput): Promise<Routine> {
    const now = nowUtcIso();
    const position = await this.repo.nextPosition();
    const routine: Routine = {
      id: newId(),
      name: input.name,
      notes: input.notes,
      position,
      exercises: input.exercises.map(materializeExercise),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.insert(routine);
    return routine;
  }

  async update(id: string, input: RoutineInput): Promise<void> {
    const existing = await this.repo.getById(id);
    if (!existing) return;
    await this.repo.update(id, {
      name: input.name,
      notes: input.notes,
      exercises: input.exercises.map(materializeExercise),
      updatedAt: nowUtcIso(),
    });
  }

  async duplicate(id: string): Promise<Routine | undefined> {
    const source = await this.repo.getById(id);
    if (!source) return undefined;
    return this.create({
      name: `${source.name} (cópia)`,
      notes: source.notes,
      exercises: source.exercises.map((e) => ({
        name: e.name,
        notes: e.notes,
        restSeconds: e.restSeconds,
        videoUrl: e.videoUrl,
        sets: e.sets.map((s) => ({
          type: s.type,
          reps: s.reps,
          weightKg: s.weightKg,
        })),
      })),
    });
  }

  remove(id: string): Promise<void> {
    return this.repo.softDelete(id, nowUtcIso());
  }
}

export const routineService: IRoutineService = new RoutineService(
  routineRepository,
);
