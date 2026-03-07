# Tests (tests/)

E2E and integration tests using Node's built-in test runner (`node:test`).

## Running

```bash
npm test   # Requires dev server running: npm run dev
```

## Rules

- **Baseline tests are PROTECTED** — do not delete or reduce assertions in existing test files
- New test files can be added freely to the tests/ directory
- Tests run against live Supabase — the dev server must be running
- Use `{ timeout: 180_000 }` for tests that wait for task completion
