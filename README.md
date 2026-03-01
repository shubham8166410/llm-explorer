# LLM Explorer

An exploratory full-stack application for submitting prompts to an LLM, reviewing structured output, and iterating through regeneration.

---

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key

# 3. Run in development
npm run dev

# 4. Or build and run in production
npm run build
npm start
```

Open http://localhost:3000

---

## What It Does

- Submit prompts → the LLM generates 4-8 structured items (title, description, tags)
- Review & edit items inline — changes persist immediately
- Delete individual items (soft delete, preserves history)
- Regenerate with a modified prompt — old generation is archived, new one takes over
- View history of previous generations per session

---

## Design Decisions & Trade-offs

### Data Model

Three tables capture the full lifecycle:

```
prompt_sessions          → top-level container for a thread of exploration
  └── generations        → one row per prompt submission (active or superseded)
        └── generated_items  → the LLM output, stored as discrete editable entities
```

**Why this structure?**
Separating session from generation allows multiple iterations within one conceptual thread without losing history. Storing items as individual rows (rather than a JSON blob) enables granular edits and deletes at the row level. Drizzle gives us type-safe queries and an easy migration path to Postgres with minimal config change.

### Lifecycle on Regeneration

When the user regenerates, all currently `active` generations for that session are flipped to `superseded`. The new generation becomes `active`. This behavior is explicitly shown in the UI — the prompt bar explains it before you submit, and you can expand "View history" to see what each previous generation produced.

**Why not hard-delete?** Keeping history lets the user compare what changed across iterations. It also makes the system auditable — you can see exactly which prompt produced which output.

Trade-off: the DB grows over time, but for a single-user app this is negligible.

### Soft Delete for Items

Items are marked `status: 'deleted'` rather than removed from the DB. This maintains referential integrity and means history views accurately reflect what existed in each generation at the time.

### Structured LLM Output

The LLM is prompted to return a JSON array of `{title, description, tags[]}`. This is parsed and validated server-side before persisting. If parsing fails, the generation is marked `failed` with the error message surfaced in the UI for actionable feedback.

Trade-offs considered:
- A more complex schema (nested sub-items, priority fields) was considered but adds tight coupling between the prompt format and the DB schema — simpler is more robust and easier to extend
- Streaming was considered but synchronous fetch fits the API route pattern cleanly and latency is acceptable for this payload size

### Technology Choices

| Decision | Choice | Rationale |
|---|---|---|
| DB | SQLite via better-sqlite3 | Zero infra for single-user; swap to Postgres via Drizzle config |
| LLM | Claude Haiku (Anthropic) | Fast and cost-effective for structured output |
| AI SDK | Vercel ai + @ai-sdk/anthropic | Clean provider abstraction |
| State | Local React state + fetch | No Redux needed at this scope |
| IDs | nanoid | URL-safe, compact, no DB round-trip |

### What I'd Add With More Time

- Streaming generation — show items appearing as the LLM responds
- Optimistic UI updates — don't wait for server round-trip on edits
- Prompt templates — save and reuse effective prompts
- Export — download session items as JSON/CSV
- Tag-based filtering on the item grid

---

## Project Structure

```
app/
  api/
    sessions/          GET list, POST create
    sessions/[id]/     GET detail, DELETE
    generate/          POST trigger LLM generation
    items/[id]/        PATCH edit, DELETE soft-delete
  layout.tsx
  page.tsx

components/
  AppShell.tsx         Root layout: sidebar + main panel
  SessionSidebar.tsx   Session list with status indicators
  NewSessionPanel.tsx  Initial prompt entry
  SessionView.tsx      Active session detail
  ItemCard.tsx         Individual item with inline editing
  PromptBar.tsx        Regeneration prompt input
  GenerationHistory.tsx  Collapsed view of superseded generations

lib/
  db/
    schema.ts          Drizzle ORM schema
    client.ts          DB singleton + inline migrations
  llm.ts               Anthropic API call + output parsing
  types.ts             Shared TypeScript interfaces

data/
  app.db               SQLite database (auto-created on first run)
```
