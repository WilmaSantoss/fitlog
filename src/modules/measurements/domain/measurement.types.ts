export type MeasurementMetric =
  | 'weightKg'
  | 'bodyFatPct'
  | 'chestCm'
  | 'shoulderCm'
  | 'waistCm'
  | 'hipCm'
  | 'armCm'
  | 'thighCm'
  | 'calfCm';

export const MEASUREMENT_METRICS: readonly MeasurementMetric[] = [
  'weightKg',
  'bodyFatPct',
  'chestCm',
  'shoulderCm',
  'waistCm',
  'hipCm',
  'armCm',
  'thighCm',
  'calfCm',
] as const;

export type Measurement = {
  readonly id: string;
  readonly recordedAt: string;
  readonly weightKg: number | null;
  readonly bodyFatPct: number | null;
  readonly chestCm: number | null;
  readonly shoulderCm: number | null;
  readonly waistCm: number | null;
  readonly hipCm: number | null;
  readonly armCm: number | null;
  readonly thighCm: number | null;
  readonly calfCm: number | null;
  readonly notes: string | null;
  readonly isDeleted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MeasurementInput = {
  readonly recordedAt: string;
  readonly weightKg: number | null;
  readonly bodyFatPct: number | null;
  readonly chestCm: number | null;
  readonly shoulderCm: number | null;
  readonly waistCm: number | null;
  readonly hipCm: number | null;
  readonly armCm: number | null;
  readonly thighCm: number | null;
  readonly calfCm: number | null;
  readonly notes: string | null;
};
