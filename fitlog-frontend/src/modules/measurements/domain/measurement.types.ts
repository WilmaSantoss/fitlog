export type MeasurementMetric =
  | 'weightKg'
  | 'bicepLeftCm'
  | 'bicepRightCm'
  | 'forearmLeftCm'
  | 'forearmRightCm'
  | 'bellyCm'
  | 'waistCm'
  | 'glutesCm'
  | 'thighLeftCm'
  | 'thighRightCm'
  | 'calfLeftCm'
  | 'calfRightCm';

export const MEASUREMENT_METRICS: readonly MeasurementMetric[] = [
  'weightKg',
  'bicepLeftCm',
  'bicepRightCm',
  'forearmLeftCm',
  'forearmRightCm',
  'bellyCm',
  'waistCm',
  'glutesCm',
  'thighLeftCm',
  'thighRightCm',
  'calfLeftCm',
  'calfRightCm',
] as const;

export type Measurement = {
  readonly id: string;
  readonly recordedAt: string;
  readonly weightKg: number | null;
  readonly bicepLeftCm: number | null;
  readonly bicepRightCm: number | null;
  readonly forearmLeftCm: number | null;
  readonly forearmRightCm: number | null;
  readonly bellyCm: number | null;
  readonly waistCm: number | null;
  readonly glutesCm: number | null;
  readonly thighLeftCm: number | null;
  readonly thighRightCm: number | null;
  readonly calfLeftCm: number | null;
  readonly calfRightCm: number | null;
  readonly notes: string | null;
  readonly isDeleted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MeasurementInput = {
  readonly recordedAt: string;
  readonly weightKg: number | null;
  readonly bicepLeftCm: number | null;
  readonly bicepRightCm: number | null;
  readonly forearmLeftCm: number | null;
  readonly forearmRightCm: number | null;
  readonly bellyCm: number | null;
  readonly waistCm: number | null;
  readonly glutesCm: number | null;
  readonly thighLeftCm: number | null;
  readonly thighRightCm: number | null;
  readonly calfLeftCm: number | null;
  readonly calfRightCm: number | null;
  readonly notes: string | null;
};
