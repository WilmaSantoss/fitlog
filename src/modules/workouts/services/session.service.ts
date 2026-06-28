import { newId } from '@/shared/lib/uuid';
import { nowUtcIso } from '@/shared/lib/date';
import {
  sessionRepository,
  type ISessionRepository,
} from '../repository/session.repository';
import {
  routineRepository,
  type IRoutineRepository,
} from '../repository/routine.repository';
import type {
  Routine,
  SessionExercise,
  SessionSet,
  WorkoutSession,
} from '../domain/workout.types';

export type SessionStats = {
  readonly totalVolumeKg: number;
  readonly completedSets: number;
  readonly totalSets: number;
  readonly durationSeconds: number | null;
};

export interface ISessionService {
  startFromRoutine(routineId: string): Promise<WorkoutSession | undefined>;
  get(id: string): Promise<WorkoutSession | undefined>;
  listFinished(): Promise<WorkoutSession[]>;
  listActive(): Promise<WorkoutSession[]>;
  updateSet(
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<Pick<SessionSet, 'actualReps' | 'actualWeightKg' | 'completed'>>,
  ): Promise<void>;
  updateNotes(sessionId: string, notes: string | null): Promise<void>;
  finish(sessionId: string): Promise<void>;
  remove(id: string): Promise<void>;
  stats(session: WorkoutSession): SessionStats;
}

function sessionFromRoutine(routine: Routine): WorkoutSession {
  const now = nowUtcIso();
  const exercises: SessionExercise[] = routine.exercises.map((e) => ({
    id: newId(),
    name: e.name,
    notes: e.notes,
    restSeconds: e.restSeconds,
    sets: e.sets.map<SessionSet>((s) => ({
      id: newId(),
      type: s.type,
      plannedReps: s.reps,
      plannedWeightKg: s.weightKg,
      actualReps: s.reps,
      actualWeightKg: s.weightKg,
      completed: false,
    })),
  }));
  return {
    id: newId(),
    routineId: routine.id,
    routineName: routine.name,
    notes: null,
    startedAt: now,
    finishedAt: null,
    exercises,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

class SessionService implements ISessionService {
  private readonly sessions: ISessionRepository;
  private readonly routines: IRoutineRepository;

  constructor(sessions: ISessionRepository, routines: IRoutineRepository) {
    this.sessions = sessions;
    this.routines = routines;
  }

  async startFromRoutine(routineId: string): Promise<WorkoutSession | undefined> {
    const routine = await this.routines.getById(routineId);
    if (!routine) return undefined;
    const session = sessionFromRoutine(routine);
    await this.sessions.insert(session);
    return session;
  }

  get(id: string): Promise<WorkoutSession | undefined> {
    return this.sessions.getById(id);
  }

  listFinished(): Promise<WorkoutSession[]> {
    return this.sessions.listFinished();
  }

  listActive(): Promise<WorkoutSession[]> {
    return this.sessions.listActive();
  }

  async updateSet(
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<Pick<SessionSet, 'actualReps' | 'actualWeightKg' | 'completed'>>,
  ): Promise<void> {
    const session = await this.sessions.getById(sessionId);
    if (!session) return;
    const exercises = session.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const sets = ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s));
      return { ...ex, sets };
    });
    await this.sessions.update(sessionId, {
      exercises,
      updatedAt: nowUtcIso(),
    });
  }

  async updateNotes(sessionId: string, notes: string | null): Promise<void> {
    await this.sessions.update(sessionId, { notes, updatedAt: nowUtcIso() });
  }

  async finish(sessionId: string): Promise<void> {
    const now = nowUtcIso();
    await this.sessions.update(sessionId, {
      finishedAt: now,
      updatedAt: now,
    });
  }

  remove(id: string): Promise<void> {
    return this.sessions.softDelete(id, nowUtcIso());
  }

  stats(session: WorkoutSession): SessionStats {
    let volume = 0;
    let completed = 0;
    let total = 0;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        total += 1;
        if (set.completed) {
          completed += 1;
          if (set.actualWeightKg !== null && set.actualReps !== null) {
            volume += set.actualWeightKg * set.actualReps;
          }
        }
      }
    }
    const end = session.finishedAt ?? session.updatedAt;
    const durationMs =
      new Date(end).getTime() - new Date(session.startedAt).getTime();
    return {
      totalVolumeKg: Math.round(volume * 10) / 10,
      completedSets: completed,
      totalSets: total,
      durationSeconds: Number.isFinite(durationMs)
        ? Math.max(0, Math.round(durationMs / 1000))
        : null,
    };
  }
}

export const sessionService: ISessionService = new SessionService(
  sessionRepository,
  routineRepository,
);
