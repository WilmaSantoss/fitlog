# Fitlog

App pessoal de treinos e medidas.

## Estrutura

```
fitlog/
├── fitlog-frontend/   React + Vite + TS (PWA)
└── fitlog-backend/    Supabase (schema, migrations)
```

## Frontend

```sh
cd fitlog-frontend
npm install
npm run dev
```

Variáveis de ambiente em `fitlog-frontend/.env.local` (ver `.env.example`).

## Backend

Schema em `fitlog-backend/supabase/schema.sql`, aplicado no projeto Supabase (região EU).

## Deploy

Netlify aponta para `fitlog-frontend/` como base directory. Build: `npm run build`, publish: `dist`.
