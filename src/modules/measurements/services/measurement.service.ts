import { newId } from '@/shared/lib/uuid';
import { nowUtcIso } from '@/shared/lib/date';
import {
  measurementRepository,
  type IMeasurementRepository,
} from '../repository/measurement.repository';
import type {
  Measurement,
  MeasurementInput,
  MeasurementMetric,
} from '../domain/measurement.types';

export type EvolutionPoint = {
  readonly recordedAt: string;
  readonly value: number;
};

export interface IMeasurementService {
  list(): Promise<Measurement[]>;
  get(id: string): Promise<Measurement | undefined>;
  create(input: MeasurementInput): Promise<Measurement>;
  update(id: string, input: MeasurementInput): Promise<void>;
  remove(id: string): Promise<void>;
  evolution(metric: MeasurementMetric): Promise<EvolutionPoint[]>;
}

class MeasurementService implements IMeasurementService {
  private readonly repo: IMeasurementRepository;

  constructor(repo: IMeasurementRepository) {
    this.repo = repo;
  }

  list(): Promise<Measurement[]> {
    return this.repo.listActive();
  }

  get(id: string): Promise<Measurement | undefined> {
    return this.repo.getById(id);
  }

  async create(input: MeasurementInput): Promise<Measurement> {
    const now = nowUtcIso();
    const created: Measurement = {
      id: newId(),
      ...input,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.insert(created);
    return created;
  }

  async update(id: string, input: MeasurementInput): Promise<void> {
    await this.repo.update(id, { ...input, updatedAt: nowUtcIso() });
  }

  remove(id: string): Promise<void> {
    return this.repo.softDelete(id, nowUtcIso());
  }

  async evolution(metric: MeasurementMetric): Promise<EvolutionPoint[]> {
    const all = await this.repo.listActive();
    return all
      .map((m) => ({ recordedAt: m.recordedAt, value: m[metric] }))
      .filter((p): p is EvolutionPoint => p.value !== null)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }
}

export const measurementService: IMeasurementService = new MeasurementService(
  measurementRepository,
);
