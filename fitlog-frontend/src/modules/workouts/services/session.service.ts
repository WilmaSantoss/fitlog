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
  ReplacedExercise,
  Routine,
  SessionExercise,
  SessionSet,
  WorkoutSession,
} from '../domain/workout.types';

export type SessionStats = {
  readonly completedExercises: number;
  readonly totalExercises: number;
  readonly totalVolumeKg: number;
  readonly completedSets: number;
  readonly totalSets: number;
  readonly durationSeconds: number | null;
};

export type PreviousSet = {
  readonly weightKg: number;
  readonly reps: number;
};

export type PreviousByExercise = ReadonlyMap<string, readonly PreviousSet[]>;

export type ExercisePr = {
  readonly weightKg: number;
  readonly reps: number;
  readonly sessionId: string;
  readonly recordedAt: string;
};

export type ExerciseSummary = {
  readonly name: string;
  readonly pr: ExercisePr | null;
  readonly sessionsCount: number;
  readonly totalVolumeKg: number;
};

export type ExerciseEvolutionPoint = {
  readonly recordedAt: string;
  readonly maxWeightKg: number;
  readonly volumeKg: number;
};

export type RoutineExerciseAverages = ReadonlyMap<string, number>;

export type ExerciseReplacement = {
  readonly name: string;
  readonly libraryId: string | null;
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
  replaceExercise(
    sessionId: string,
    exerciseId: string,
    replacement: ExerciseReplacement,
  ): Promise<void>;
  updateFinishedAt(sessionId: string, finishedAt: string): Promise<void>;
  finish(sessionId: string): Promise<void>;
  syncRoutineWeights(sessionId: string): Promise<void>;
  remove(id: string): Promise<void>;
  stats(session: WorkoutSession): SessionStats;
  previousByExercise(currentSessionId: string): Promise<PreviousByExercise>;
  exerciseSummaries(): Promise<ExerciseSummary[]>;
  exerciseEvolution(exerciseName: string): Promise<ExerciseEvolutionPoint[]>;
  routineExerciseAverages(
    routineId: string | null,
    excludeSessionId?: string,
  ): Promise<RoutineExerciseAverages>;
}

// Peso por posição de série (null onde a série não foi feita), por nome de
// exercício, tirado do treino finalizado mais recente que tem aquele exercício.
type LastWeightsByExercise = ReadonlyMap<string, readonly (number | null)[]>;

function lastWeightsByExercise(finished: readonly WorkoutSession[]): LastWeightsByExercise {
  const map = new Map<string, (number | null)[]>();
  const sortedDesc = [...finished].sort((a, b) =>
    (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt),
  );
  for (const session of sortedDesc) {
    for (const ex of session.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (map.has(key)) continue;
      const weights = ex.sets.map((s) =>
        s.completed && s.actualWeightKg !== null ? s.actualWeightKg : null,
      );
      if (weights.some((w) => w !== null)) map.set(key, weights);
    }
  }
  return map;
}

function sessionFromRoutine(
  routine: Routine,
  lastWeights: LastWeightsByExercise,
): WorkoutSession {
  const now = nowUtcIso();
  const exercises: SessionExercise[] = routine.exercises.map((e) => {
    const last = lastWeights.get(e.name.trim().toLowerCase()) ?? [];
    return {
      id: newId(),
      name: e.name,
      libraryId: e.libraryId,
      replacedFrom: null,
      notes: e.notes,
      rests: e.rests,
      videoUrl: e.videoUrl,
      sets: e.sets.map<SessionSet>((s, idx) => {
        // Peso salvo na rotina (atualizado ao finalizar ou editado à mão) tem
        // prioridade; sem ele, cai pro último treino finalizado.
        const weightKg = s.weightKg ?? last[idx] ?? null;
        return {
          id: newId(),
          type: s.type,
          plannedReps: s.reps,
          plannedWeightKg: weightKg,
          // Reps do plano são faixa ("5-9") → viram placeholder e a usuária
          // digita o inteiro feito no dia. O peso já vem preenchido e ela só
          // edita se mudar.
          actualReps: null,
          actualWeightKg: weightKg,
          completed: false,
        };
      }),
      completedAt: null,
    };
  });
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
    const finished = await this.sessions.listFinished();
    const session = sessionFromRoutine(routine, lastWeightsByExercise(finished));
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
    const now = nowUtcIso();
    const exercises = session.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const sets = ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s));
      const allCompleted =
        sets.length > 0 && sets.every((s) => s.completed);
      const completedAt = allCompleted
        ? (ex.completedAt ?? now)
        : null;
      return { ...ex, sets, completedAt };
    });
    await this.sessions.update(sessionId, {
      exercises,
      updatedAt: now,
    });
  }

  // Troca o exercício só nesta sessão — a rotina não é tocada (e o
  // saveLastWeightsToRoutine casa por nome, então o peso do substituto não
  // vai parar no exercício original). Séries mantêm tipo e reps planejadas;
  // o que foi feito é zerado e o peso vem do histórico do exercício novo.
  async replaceExercise(
    sessionId: string,
    exerciseId: string,
    replacement: ExerciseReplacement,
  ): Promise<void> {
    const session = await this.sessions.getById(sessionId);
    if (!session) return;
    const finished = await this.sessions.listFinished();
    const last =
      lastWeightsByExercise(finished).get(replacement.name.trim().toLowerCase()) ?? [];
    const now = nowUtcIso();
    const exercises = session.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      // Original é sempre o da rotina, mesmo se trocar duas vezes. Voltar pro
      // original desfaz a marcação de substituído.
      const original: ReplacedExercise = ex.replacedFrom ?? {
        name: ex.name,
        libraryId: ex.libraryId,
      };
      const backToOriginal =
        original.name.trim().toLowerCase() === replacement.name.trim().toLowerCase();
      return {
        ...ex,
        name: replacement.name,
        libraryId: replacement.libraryId,
        // Vídeo próprio era do exercício original.
        videoUrl: backToOriginal ? ex.videoUrl : null,
        replacedFrom: backToOriginal ? null : original,
        sets: ex.sets.map((s, idx) => {
          const weightKg = last[idx] ?? null;
          return {
            ...s,
            plannedWeightKg: weightKg,
            actualWeightKg: weightKg,
            actualReps: null,
            completed: false,
          };
        }),
        completedAt: null,
      };
    });
    await this.sessions.update(sessionId, { exercises, updatedAt: now });
  }

  async updateNotes(sessionId: string, notes: string | null): Promise<void> {
    await this.sessions.update(sessionId, { notes, updatedAt: nowUtcIso() });
  }

  async updateFinishedAt(sessionId: string, finishedAt: string): Promise<void> {
    await this.sessions.update(sessionId, {
      finishedAt,
      updatedAt: nowUtcIso(),
    });
  }

  async finish(sessionId: string): Promise<void> {
    const now = nowUtcIso();
    await this.sessions.update(sessionId, {
      finishedAt: now,
      updatedAt: now,
    });
    const session = await this.sessions.getById(sessionId);
    if (session) await this.saveLastWeightsToRoutine(session);
  }

  // Depois de editar um treino já concluído. Só mexe na rotina se este for o
  // treino mais recente dela — corrigir um treino antigo não pode sobrescrever
  // pesos de treinos que vieram depois.
  async syncRoutineWeights(sessionId: string): Promise<void> {
    const session = await this.sessions.getById(sessionId);
    if (!session?.finishedAt || !session.routineId) return;
    const finished = await this.sessions.listFinished();
    const newer = finished.some(
      (s) =>
        s.routineId === session.routineId &&
        s.id !== session.id &&
        (s.finishedAt ?? s.startedAt) > session.finishedAt!,
    );
    if (newer) return;
    await this.saveLastWeightsToRoutine(session);
  }

  // Grava na rotina o peso de cada série concluída, pra próxima sessão já
  // começar com ele. Casa exercício por nome (a rotina pode ter sido editada
  // durante o treino) e série por posição.
  private async saveLastWeightsToRoutine(session: WorkoutSession): Promise<void> {
    if (!session.routineId) return;
    const routine = await this.routines.getById(session.routineId);
    if (!routine) return;
    const sessionByName = new Map<string, SessionExercise>();
    for (const ex of session.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (!sessionByName.has(key)) sessionByName.set(key, ex);
    }
    let changed = false;
    const exercises = routine.exercises.map((ex) => {
      const done = sessionByName.get(ex.name.trim().toLowerCase());
      if (!done) return ex;
      const sets = ex.sets.map((s, idx) => {
        const actual = done.sets[idx];
        if (
          !actual?.completed ||
          actual.actualWeightKg === null ||
          actual.actualWeightKg === s.weightKg
        ) {
          return s;
        }
        changed = true;
        return { ...s, weightKg: actual.actualWeightKg };
      });
      return { ...ex, sets };
    });
    if (!changed) return;
    await this.routines.update(routine.id, {
      exercises,
      updatedAt: nowUtcIso(),
    });
  }

  remove(id: string): Promise<void> {
    return this.sessions.softDelete(id, nowUtcIso());
  }

  async previousByExercise(currentSessionId: string): Promise<PreviousByExercise> {
    const all = await this.sessions.listFinished();
    const map = new Map<string, readonly PreviousSet[]>();
    const sortedDesc = [...all].sort((a, b) =>
      (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt),
    );
    for (const session of sortedDesc) {
      if (session.id === currentSessionId) continue;
      for (const ex of session.exercises) {
        const key = ex.name.trim().toLowerCase();
        if (map.has(key)) continue;
        const sets: PreviousSet[] = [];
        for (const s of ex.sets) {
          if (
            s.completed &&
            s.actualWeightKg !== null &&
            s.actualReps !== null
          ) {
            sets.push({ weightKg: s.actualWeightKg, reps: s.actualReps });
          }
        }
        if (sets.length > 0) map.set(key, sets);
      }
    }
    return map;
  }

  async exerciseSummaries(): Promise<ExerciseSummary[]> {
    const all = await this.sessions.listFinished();
    const byName = new Map<
      string,
      {
        name: string;
        pr: ExercisePr | null;
        sessionIds: Set<string>;
        totalVolumeKg: number;
      }
    >();

    for (const session of all) {
      const recordedAt = session.finishedAt ?? session.startedAt;
      for (const ex of session.exercises) {
        const key = ex.name.trim().toLowerCase();
        if (key === '') continue;
        let entry = byName.get(key);
        if (!entry) {
          entry = {
            name: ex.name.trim(),
            pr: null,
            sessionIds: new Set(),
            totalVolumeKg: 0,
          };
          byName.set(key, entry);
        }
        let hadCompletedSet = false;
        for (const set of ex.sets) {
          if (
            !set.completed ||
            set.actualWeightKg === null ||
            set.actualReps === null
          ) {
            continue;
          }
          hadCompletedSet = true;
          entry.totalVolumeKg += set.actualWeightKg * set.actualReps;
          if (
            entry.pr === null ||
            set.actualWeightKg > entry.pr.weightKg ||
            (set.actualWeightKg === entry.pr.weightKg &&
              set.actualReps > entry.pr.reps)
          ) {
            entry.pr = {
              weightKg: set.actualWeightKg,
              reps: set.actualReps,
              sessionId: session.id,
              recordedAt,
            };
          }
        }
        if (hadCompletedSet) entry.sessionIds.add(session.id);
      }
    }

    return [...byName.values()]
      .map((e) => ({
        name: e.name,
        pr: e.pr,
        sessionsCount: e.sessionIds.size,
        totalVolumeKg: Math.round(e.totalVolumeKg * 10) / 10,
      }))
      .sort((a, b) => (b.pr?.weightKg ?? 0) - (a.pr?.weightKg ?? 0));
  }

  async exerciseEvolution(
    exerciseName: string,
  ): Promise<ExerciseEvolutionPoint[]> {
    const all = await this.sessions.listFinished();
    const key = exerciseName.trim().toLowerCase();
    const points: ExerciseEvolutionPoint[] = [];
    for (const session of all) {
      const recordedAt = session.finishedAt ?? session.startedAt;
      let maxWeight = 0;
      let volume = 0;
      let hadAny = false;
      for (const ex of session.exercises) {
        if (ex.name.trim().toLowerCase() !== key) continue;
        for (const set of ex.sets) {
          if (
            !set.completed ||
            set.actualWeightKg === null ||
            set.actualReps === null
          ) {
            continue;
          }
          hadAny = true;
          if (set.actualWeightKg > maxWeight) maxWeight = set.actualWeightKg;
          volume += set.actualWeightKg * set.actualReps;
        }
      }
      if (hadAny) {
        points.push({
          recordedAt,
          maxWeightKg: maxWeight,
          volumeKg: Math.round(volume * 10) / 10,
        });
      }
    }
    return points.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }

  async routineExerciseAverages(
    routineId: string | null,
    excludeSessionId?: string,
  ): Promise<RoutineExerciseAverages> {
    const map = new Map<string, number>();
    if (!routineId) return map;
    const all = await this.sessions.listFinished();
    const sums = new Map<string, { total: number; count: number }>();
    for (const session of all) {
      if (session.routineId !== routineId) continue;
      if (excludeSessionId && session.id === excludeSessionId) continue;
      let prevEnd = session.startedAt;
      for (const ex of session.exercises) {
        if (ex.completedAt) {
          const startMs = new Date(prevEnd).getTime();
          const endMs = new Date(ex.completedAt).getTime();
          const durationSec = Math.max(0, Math.round((endMs - startMs) / 1000));
          if (durationSec > 0) {
            const key = ex.name.trim().toLowerCase();
            const entry = sums.get(key) ?? { total: 0, count: 0 };
            entry.total += durationSec;
            entry.count += 1;
            sums.set(key, entry);
          }
          prevEnd = ex.completedAt;
        }
      }
    }
    for (const [key, entry] of sums.entries()) {
      if (entry.count > 0) {
        map.set(key, Math.round(entry.total / entry.count));
      }
    }
    return map;
  }

  stats(session: WorkoutSession): SessionStats {
    let volume = 0;
    let completed = 0;
    let total = 0;
    let completedExercises = 0;
    for (const ex of session.exercises) {
      let exHasSet = false;
      let exAllCompleted = true;
      for (const set of ex.sets) {
        total += 1;
        exHasSet = true;
        if (set.completed) {
          completed += 1;
          if (set.actualWeightKg !== null && set.actualReps !== null) {
            volume += set.actualWeightKg * set.actualReps;
          }
        } else {
          exAllCompleted = false;
        }
      }
      if (exHasSet && exAllCompleted) completedExercises += 1;
    }
    const endMs = session.finishedAt
      ? new Date(session.finishedAt).getTime()
      : Date.now();
    const durationMs = endMs - new Date(session.startedAt).getTime();
    return {
      totalVolumeKg: Math.round(volume * 10) / 10,
      completedSets: completed,
      totalSets: total,
      completedExercises,
      totalExercises: session.exercises.length,
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
