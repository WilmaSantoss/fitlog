// Gera src/modules/exercises/data/exercise-library.data.ts a partir do
// free-exercise-db (travado no commit abaixo) + nomes em PT (names.pt.json).
//
// Rodar: node scripts/exercise-library/build.mjs
//
// Só precisa rodar de novo se mudar a tradução ou o commit do dataset.
// names.pt.json: { "<id do dataset>": "<nome em PT>" } — fonte da verdade dos
// nomes; edite lá e rode o script.
// featured.json: ids que sobem na busca (exercícios dos treinos reais).

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Manter igual ao DATASET_COMMIT de exercise-library.service.ts
const DATASET_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const DATASET_URL = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${DATASET_COMMIT}/dist/exercises.json`;

const here = dirname(fileURLToPath(import.meta.url));
const namesPath = resolve(here, 'names.pt.json');
const featuredPath = resolve(here, 'featured.json');
const outPath = resolve(here, '../../src/modules/exercises/data/exercise-library.data.ts');

const res = await fetch(DATASET_URL);
if (!res.ok) throw new Error(`dataset: HTTP ${res.status}`);
const dataset = await res.json();
const names = JSON.parse(await readFile(namesPath, 'utf-8'));
const featured = new Set(JSON.parse(await readFile(featuredPath, 'utf-8')));
const unknownFeatured = [...featured].filter((id) => !dataset.some((e) => e.id === id));
if (unknownFeatured.length > 0) {
  throw new Error(`featured.json com id inexistente: ${unknownFeatured.join(', ')}`);
}

const missing = dataset.filter((e) => !names[e.id]).map((e) => e.id);
if (missing.length > 0) {
  throw new Error(`Sem tradução: ${missing.join(', ')}`);
}
const seen = new Map();
for (const e of dataset) {
  const key = names[e.id].toLowerCase();
  if (seen.has(key)) {
    throw new Error(`Nome repetido "${names[e.id]}": ${seen.get(key)} e ${e.id}`);
  }
  seen.set(key, e.id);
}

const library = dataset
  .map((e) => ({
    id: e.id,
    name: names[e.id],
    nameEn: e.name,
    category: e.category,
    equipment: e.equipment ?? null,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    images: e.images,
    featured: featured.has(e.id),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const body = `// GERADO por scripts/exercise-library/build.mjs — não editar à mão.
// Fonte: yuhonas/free-exercise-db@${DATASET_COMMIT} (Unlicense, domínio público).
import type { LibraryExercise } from '../domain/exercise.types';

export const EXERCISE_LIBRARY: readonly LibraryExercise[] = ${JSON.stringify(library, null, 1)};
`;

await writeFile(outPath, body, 'utf-8');
console.log(`${library.length} exercícios → ${outPath}`);
