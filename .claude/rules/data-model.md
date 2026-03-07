# Data Model (src/data_model/)

Database types and Supabase helpers. All consumers import from `data_model/index.js`.

- `types.ts` — TypeScript interfaces mirroring the DB schema: `Task`, `AgentStep`, `CronJob`, `TaskInput`, `TaskStatus`
- `db.ts` — Supabase client singleton + all CRUD helpers (insertTask, claimTask, completeTask, failTask, insertAgentStep, etc.)
- `index.ts` — Barrel re-export

All DB operations use parameterized Supabase queries (no raw SQL). Functions return typed results or throw on error.
