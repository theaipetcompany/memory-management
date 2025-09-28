# Phase 1: Foundation & Database Schema

## Overview

This phase establishes the foundational database schema and core types for the AI Pet Memory system. We'll extend the existing PostgreSQL database with pgvector support for storing face embeddings and memory metadata.

## Database Schema Design

### Memory Entries Table

```sql
-- Memory entries table (extends your existing schema)
CREATE TABLE memory_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  embedding VECTOR(768), -- OpenAI vision embedding dimension
  first_met TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 0,
  introduced_by TEXT,
  notes TEXT,
  preferences TEXT[], -- Array of preferences
  tags TEXT[], -- Array of tags
  relationship_type TEXT CHECK (relationship_type IN ('friend', 'family', 'acquaintance')) DEFAULT 'friend',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Interaction History Table

```sql
-- Interaction history table
CREATE TABLE interactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_entry_id TEXT REFERENCES memory_entries(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('meeting', 'recognition', 'conversation')) NOT NULL,
  context TEXT,
  response_generated TEXT,
  emotion TEXT,
  actions TEXT[], -- Array of actions taken
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Create indexes for performance
CREATE INDEX ON memory_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON memory_entries (name);
CREATE INDEX ON memory_entries (last_seen);
CREATE INDEX ON interactions (memory_entry_id);
CREATE INDEX ON interactions (created_at);
```

## Core Types & Interfaces

### MemoryEntry Interface

```typescript
export interface MemoryEntry {
  id: string;
  name: string;
  embedding: number[]; // 768-dimensional vector
  firstMet: Date;
  lastSeen: Date;
  interactionCount: number;
  introducedBy?: string;
  notes?: string;
  preferences: string[];
  tags: string[];
  relationshipType: 'friend' | 'family' | 'acquaintance';
  createdAt: Date;
  updatedAt: Date;
}
```

### InteractionRecord Interface

```typescript
export interface InteractionRecord {
  id: string;
  memoryEntryId: string;
  interactionType: 'meeting' | 'recognition' | 'conversation';
  context?: string;
  responseGenerated?: string;
  emotion?: string;
  actions: string[];
  createdAt: Date;
}
```

### SimilaritySearchResult Interface

```typescript
export interface SimilaritySearchResult {
  id: string;
  similarity: number;
  metadata: MemoryEntry;
}
```

## Database Connection Setup

### Prisma Schema Extension

```prisma
// Add to existing prisma/schema.prisma

model MemoryEntry {
  id               String   @id @default(cuid())
  name             String
  embedding        Unsupported("vector(768)") // pgvector type
  firstMet         DateTime @default(now())
  lastSeen         DateTime @default(now())
  interactionCount Int      @default(0)
  introducedBy     String?
  notes            String?
  preferences      String[]
  tags             String[]
  relationshipType String   @default("friend")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  interactions     Interaction[]

  @@map("memory_entries")
}

model Interaction {
  id                String   @id @default(cuid())
  memoryEntryId     String
  interactionType   String
  context           String?
  responseGenerated String?
  emotion           String?
  actions           String[]
  createdAt         DateTime @default(now())

  memoryEntry       MemoryEntry @relation(fields: [memoryEntryId], references: [id], onDelete: Cascade)

  @@map("interactions")
}
```

## TDD Test Cases

### Database Operations Tests

**File**: `lib/memory-database.test.ts`

```typescript
describe('Memory Database Operations', () => {
  describe('createMemoryEntry', () => {
    it('should create a new memory entry with embedding', async () => {
      const memoryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new_person'],
        relationshipType: 'friend' as const,
      };

      const result = await createMemoryEntry(memoryData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Anna');
      expect(result.embedding).toEqual(memoryData.embedding);
      expect(result.interactionCount).toBe(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        embedding: new Array(768).fill(0.1),
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        'Name is required'
      );
    });

    it('should handle duplicate names gracefully', async () => {
      const memoryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
      };

      await createMemoryEntry(memoryData);

      // Should allow duplicate names (different people can have same name)
      const result = await createMemoryEntry(memoryData);
      expect(result.id).toBeDefined();
    });
  });

  describe('findSimilarMemories', () => {
    it('should find memories with similarity above threshold', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const threshold = 0.8;

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(Array.isArray(results)).toBe(true);
      results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(threshold);
      });
    });

    it('should return empty array when no matches found', async () => {
      const queryEmbedding = new Array(768).fill(0.9); // Very different embedding
      const threshold = 0.8;

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(results).toEqual([]);
    });

    it('should respect top_k parameter', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const topK = 3;

      const results = await findSimilarMemories(queryEmbedding, 0.5, topK);

      expect(results.length).toBeLessThanOrEqual(topK);
    });
  });

  describe('updateMemoryEntry', () => {
    it('should update last_seen and interaction_count', async () => {
      const memory = await createMemoryEntry({
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
      });

      const updates = {
        lastSeen: new Date(),
        interactionCount: 5,
        notes: 'Updated notes',
      };

      const result = await updateMemoryEntry(memory.id, updates);

      expect(result.lastSeen).toEqual(updates.lastSeen);
      expect(result.interactionCount).toBe(5);
      expect(result.notes).toBe('Updated notes');
    });

    it('should preserve existing data when updating', async () => {
      const memory = await createMemoryEntry({
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        preferences: ['coffee'],
      });

      const result = await updateMemoryEntry(memory.id, {
        interactionCount: 1,
      });

      expect(result.name).toBe('Anna');
      expect(result.preferences).toEqual(['coffee']);
    });
  });
});
```

### Type Validation Tests

**File**: `types/memory.test.ts`

```typescript
describe('Memory Types', () => {
  describe('MemoryEntry interface', () => {
    it('should have all required fields', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(memory.id).toBeDefined();
      expect(memory.name).toBeDefined();
      expect(memory.embedding).toHaveLength(768);
    });

    it('should validate embedding dimensions', () => {
      const invalidEmbedding = new Array(100).fill(0.1); // Wrong dimension

      expect(() => {
        const memory: MemoryEntry = {
          id: 'test-id',
          name: 'Anna',
          embedding: invalidEmbedding,
          firstMet: new Date(),
          lastSeen: new Date(),
          interactionCount: 0,
          preferences: [],
          tags: [],
          relationshipType: 'friend',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }).toThrow();
    });
  });

  describe('InteractionRecord interface', () => {
    it('should track interaction metadata', () => {
      const interaction: InteractionRecord = {
        id: 'test-id',
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
        createdAt: new Date(),
      };

      expect(interaction.id).toBeDefined();
      expect(interaction.memoryEntryId).toBeDefined();
      expect(interaction.interactionType).toBe('meeting');
    });
  });
});
```

## Implementation Steps

### Step 1: Database Migration

1. **Create migration file**:

   ```bash
   pnpm prisma migrate dev --name add_memory_tables
   ```

2. **Update Prisma client**:

   ```bash
   pnpm prisma generate
   ```

### Step 2: Database Service Implementation

**File**: `lib/memory-database.ts`

```typescript
import { PrismaClient } from '@/lib/prisma/client';

const prisma = new PrismaClient();

export async function createMemoryEntry(
  data: CreateMemoryEntryData
): Promise<MemoryEntry> {
  // Implementation
}

export async function findSimilarMemories(
  embedding: number[],
  threshold: number,
  topK: number = 10
): Promise<SimilaritySearchResult[]> {
  // Implementation using pgvector similarity search
}

export async function updateMemoryEntry(
  id: string,
  updates: Partial<MemoryEntry>
): Promise<MemoryEntry> {
  // Implementation
}
```

### Step 3: Environment Configuration

**File**: `.env.local`

```env
# Add pgvector connection
PGVECTOR_URL="postgresql://username:password@localhost:5432/fine_tuning_db?schema=public"
```

## Acceptance Criteria

- [ ] Database schema created with proper indexes
- [ ] All TypeScript interfaces defined and validated
- [ ] Database operations tests pass
- [ ] Type validation tests pass
- [ ] Prisma client generates correctly
- [ ] Migration runs successfully
- [ ] Connection to pgvector database works

## Next Steps

After completing Phase 1, proceed to:

- **Phase 2**: Core Memory Management Components
- **Phase 3**: API Routes
- **Phase 4**: UI Components

Each phase builds upon the foundation established in this phase.
