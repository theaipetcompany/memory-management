# Phase 3: API Routes (New Structure)

## Overview

This phase implements the RESTful API routes for the AI Pet Memory system. The API follows a new structure separate from the existing fine-tuning APIs, providing endpoints for memory management, face recognition, and interaction tracking.

## API Structure

### Base URL Structure

```txt
/api/memories/*     - Memory management endpoints
/api/recognition/*   - Face recognition endpoints
/api/interactions/*  - Interaction tracking endpoints
```

### Authentication & Authorization

- **Current Phase**: No authentication required
- **Future Phase**: Multi-user support with memory isolation

## Memory Management API

### Endpoints

#### POST /api/memories

Create a new memory entry from uploaded face image.

**Request Body:**

```typescript
{
  name: string;
  image: File; // Multipart form data
  introducedBy?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}
```

**Response:**

```typescript
{
  id: string;
  name: string;
  embedding: number[];
  firstMet: string; // ISO date
  lastSeen: string; // ISO date
  interactionCount: number;
  introducedBy?: string;
  notes?: string;
  preferences: string[];
  tags: string[];
  relationshipType: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

#### GET /api/memories

List all memory entries with pagination and filtering.

**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `relationshipType`: string (filter by relationship type)
- `search`: string (search by name)
- `sortBy`: 'name' | 'firstMet' | 'lastSeen' | 'interactionCount'
- `sortOrder`: 'asc' | 'desc'

**Response:**

```typescript
{
  memories: MemoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/memories/[id]

Get a specific memory entry by ID.

**Response:**

```typescript
MemoryEntry;
```

#### PUT /api/memories/[id]

Update an existing memory entry.

**Request Body:**

```typescript
{
  name?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}
```

**Response:**

```typescript
MemoryEntry;
```

#### DELETE /api/memories/[id]

Delete a memory entry and all associated interactions.

**Response:**

```typescript
{
  success: boolean;
  message: string;
}
```

## Recognition API

### Endpoints

#### POST /api/recognition/identify

Identify faces in uploaded images and find matching memories.

**Request Body:**

```typescript
{
  image: File; // Multipart form data
  threshold?: number; // Similarity threshold (default: 0.8)
  topK?: number; // Maximum results (default: 5)
}
```

**Response:**

```typescript
{
  matches: Array<{
    memoryId: string;
    name: string;
    similarity: number;
    confidence: 'high' | 'medium' | 'low';
    metadata: {
      relationshipType: string;
      lastSeen: string;
      interactionCount: number;
    };
  }>;
  processingTime: number;
  method: 'openai' | 'local';
}
```

#### POST /api/recognition/learn

Learn new faces from uploaded images and create memory entries.

**Request Body:**

```typescript
{
  image: File; // Multipart form data
  name: string;
  introducedBy?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}
```

**Response:**

```typescript
{
  memory: MemoryEntry;
  processingTime: number;
  method: 'openai' | 'local';
}
```

#### POST /api/recognition/search

Search for similar faces using existing embeddings.

**Request Body:**

```typescript
{
  embedding: number[]; // 768-dimensional vector
  threshold?: number; // Similarity threshold (default: 0.8)
  topK?: number; // Maximum results (default: 10)
  relationshipTypes?: string[]; // Filter by relationship types
  excludeIds?: string[]; // Exclude specific memory IDs
}
```

**Response:**

```typescript
{
  results: Array<{
    id: string;
    similarity: number;
    metadata: MemoryEntry;
  }>;
  processingTime: number;
}
```

## Interaction API

### Endpoints

#### POST /api/interactions

Record a new interaction with a memory entry.

**Request Body:**

```typescript
{
  memoryEntryId: string;
  interactionType: 'meeting' | 'recognition' | 'conversation';
  context?: string;
  responseGenerated?: string;
  emotion?: string;
  actions?: string[];
}
```

**Response:**

```typescript
{
  id: string;
  memoryEntryId: string;
  interactionType: string;
  context?: string;
  responseGenerated?: string;
  emotion?: string;
  actions: string[];
  createdAt: string; // ISO date
}
```

#### GET /api/interactions/[memoryId]

Get interaction history for a specific memory entry.

**Query Parameters:**

- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `interactionType`: string (filter by interaction type)
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

**Response:**

```typescript
{
  interactions: InteractionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## TDD Test Cases

### Memory Management API Tests

**File**: `app/api/memories/route.test.ts`

```typescript
describe('Memory Management API', () => {
  describe('POST /api/memories', () => {
    it('should create new memory entry', async () => {
      const formData = new FormData();
      formData.append('name', 'Anna');
      formData.append('image', mockImageFile);
      formData.append('introducedBy', 'Sang');
      formData.append('notes', "Met at Sang's place");

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.name).toBe('Anna');
      expect(result.embedding).toHaveLength(768);
      expect(result.introducedBy).toBe('Sang');
    });

    it('should validate required fields', async () => {
      const formData = new FormData();
      formData.append('image', mockImageFile);
      // Missing name

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Name is required');
    });

    it('should validate image format', async () => {
      const formData = new FormData();
      formData.append('name', 'Anna');
      formData.append('image', mockInvalidFile);

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Invalid image format');
    });

    it('should generate embedding from uploaded image', async () => {
      const formData = new FormData();
      formData.append('name', 'Anna');
      formData.append('image', mockImageFile);

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      expect(result.embedding).toBeDefined();
      expect(result.embedding).toHaveLength(768);
    });
  });

  describe('GET /api/memories', () => {
    it('should return all memory entries', async () => {
      // Create test memories
      await createTestMemory('Anna');
      await createTestMemory('Bob');

      const response = await fetch('/api/memories');
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.memories).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create 25 test memories
      for (let i = 0; i < 25; i++) {
        await createTestMemory(`Person${i}`);
      }

      const response = await fetch('/api/memories?page=2&limit=10');
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.memories).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should filter by relationship type', async () => {
      await createTestMemory('Anna', { relationshipType: 'friend' });
      await createTestMemory('Bob', { relationshipType: 'family' });

      const response = await fetch('/api/memories?relationshipType=friend');
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].name).toBe('Anna');
    });

    it('should search by name', async () => {
      await createTestMemory('Anna Smith');
      await createTestMemory('Bob Jones');

      const response = await fetch('/api/memories?search=Anna');
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].name).toBe('Anna Smith');
    });
  });

  describe('GET /api/memories/[id]', () => {
    it('should return specific memory entry', async () => {
      const memory = await createTestMemory('Anna');

      const response = await fetch(`/api/memories/${memory.id}`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.id).toBe(memory.id);
      expect(result.name).toBe('Anna');
    });

    it('should return 404 for non-existent memory', async () => {
      const response = await fetch('/api/memories/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/memories/[id]', () => {
    it('should update memory entry', async () => {
      const memory = await createTestMemory('Anna');

      const response = await fetch(`/api/memories/${memory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Updated notes',
          preferences: ['coffee', 'books'],
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.notes).toBe('Updated notes');
      expect(result.preferences).toEqual(['coffee', 'books']);
    });

    it('should preserve existing data when updating', async () => {
      const memory = await createTestMemory('Anna', {
        notes: 'Original notes',
        preferences: ['tea'],
      });

      const response = await fetch(`/api/memories/${memory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Updated notes',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.notes).toBe('Updated notes');
      expect(result.preferences).toEqual(['tea']); // Preserved
    });
  });

  describe('DELETE /api/memories/[id]', () => {
    it('should delete memory entry', async () => {
      const memory = await createTestMemory('Anna');

      const response = await fetch(`/api/memories/${memory.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify deletion
      const getResponse = await fetch(`/api/memories/${memory.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should delete associated interactions', async () => {
      const memory = await createTestMemory('Anna');
      await createTestInteraction(memory.id);

      const response = await fetch(`/api/memories/${memory.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);

      // Verify interactions are deleted
      const interactionsResponse = await fetch(
        `/api/interactions/${memory.id}`
      );
      const interactions = await interactionsResponse.json();
      expect(interactions.interactions).toHaveLength(0);
    });
  });
});
```

### Recognition API Tests

**File**: `app/api/recognition/route.test.ts`

```typescript
describe('Recognition API', () => {
  describe('POST /api/recognition/identify', () => {
    it('should identify known faces', async () => {
      // Create test memory with known face
      const memory = await createTestMemory('Anna');

      const formData = new FormData();
      formData.append('image', mockImageFile);

      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].name).toBe('Anna');
      expect(result.matches[0].similarity).toBeGreaterThan(0.8);
    });

    it('should return confidence scores', async () => {
      const memory = await createTestMemory('Anna');

      const formData = new FormData();
      formData.append('image', mockImageFile);

      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      expect(result.matches[0].confidence).toMatch(/high|medium|low/);
    });

    it('should handle unknown faces', async () => {
      const formData = new FormData();
      formData.append('image', mockUnknownFaceFile);

      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.matches).toHaveLength(0);
    });

    it('should respect similarity threshold', async () => {
      const memory = await createTestMemory('Anna');

      const formData = new FormData();
      formData.append('image', mockSimilarFaceFile);
      formData.append('threshold', '0.9'); // High threshold

      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      result.matches.forEach((match) => {
        expect(match.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should respect topK parameter', async () => {
      // Create multiple test memories
      await createTestMemory('Anna');
      await createTestMemory('Bob');
      await createTestMemory('Charlie');

      const formData = new FormData();
      formData.append('image', mockImageFile);
      formData.append('topK', '2');

      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      expect(result.matches.length).toBeLessThanOrEqual(2);
    });
  });

  describe('POST /api/recognition/learn', () => {
    it('should learn new faces from uploaded images', async () => {
      const formData = new FormData();
      formData.append('image', mockImageFile);
      formData.append('name', 'Anna');
      formData.append('introducedBy', 'Sang');

      const response = await fetch('/api/recognition/learn', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.memory.name).toBe('Anna');
      expect(result.memory.embedding).toHaveLength(768);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should update existing memories', async () => {
      const existingMemory = await createTestMemory('Anna');

      const formData = new FormData();
      formData.append('image', mockImageFile);
      formData.append('name', 'Anna');
      formData.append('notes', 'Updated notes');

      const response = await fetch('/api/recognition/learn', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      expect(result.memory.notes).toBe('Updated notes');
    });
  });

  describe('POST /api/recognition/search', () => {
    it('should search similar faces using embeddings', async () => {
      const memory = await createTestMemory('Anna');

      const response = await fetch('/api/recognition/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding: new Array(768).fill(0.1),
          threshold: 0.8,
          topK: 5,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.results).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should filter by relationship types', async () => {
      await createTestMemory('Anna', { relationshipType: 'friend' });
      await createTestMemory('Bob', { relationshipType: 'family' });

      const response = await fetch('/api/recognition/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding: new Array(768).fill(0.1),
          relationshipTypes: ['friend'],
        }),
      });

      const result = await response.json();
      result.results.forEach((result) => {
        expect(result.metadata.relationshipType).toBe('friend');
      });
    });
  });
});
```

### Interaction API Tests

**File**: `app/api/interactions/route.test.ts`

```typescript
describe('Interaction API', () => {
  describe('POST /api/interactions', () => {
    it('should record new interaction', async () => {
      const memory = await createTestMemory('Anna');

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryEntryId: memory.id,
          interactionType: 'meeting',
          context: 'First meeting',
          responseGenerated: 'Nice to meet you!',
          emotion: 'happy',
          actions: ['wave', 'smile'],
        }),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.memoryEntryId).toBe(memory.id);
      expect(result.interactionType).toBe('meeting');
      expect(result.context).toBe('First meeting');
    });

    it('should update memory interaction count', async () => {
      const memory = await createTestMemory('Anna');

      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryEntryId: memory.id,
          interactionType: 'recognition',
        }),
      });

      const updatedMemory = await fetch(`/api/memories/${memory.id}`);
      const result = await updatedMemory.json();
      expect(result.interactionCount).toBe(1);
    });
  });

  describe('GET /api/interactions/[memoryId]', () => {
    it('should return interaction history for memory', async () => {
      const memory = await createTestMemory('Anna');
      await createTestInteraction(memory.id, { interactionType: 'meeting' });
      await createTestInteraction(memory.id, {
        interactionType: 'recognition',
      });

      const response = await fetch(`/api/interactions/${memory.id}`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.interactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const memory = await createTestMemory('Anna');

      // Create 25 interactions
      for (let i = 0; i < 25; i++) {
        await createTestInteraction(memory.id);
      }

      const response = await fetch(
        `/api/interactions/${memory.id}?page=2&limit=10`
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.interactions).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
    });

    it('should filter by interaction type', async () => {
      const memory = await createTestMemory('Anna');
      await createTestInteraction(memory.id, { interactionType: 'meeting' });
      await createTestInteraction(memory.id, {
        interactionType: 'recognition',
      });

      const response = await fetch(
        `/api/interactions/${memory.id}?interactionType=meeting`
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.interactions).toHaveLength(1);
      expect(result.interactions[0].interactionType).toBe('meeting');
    });
  });
});
```

## Implementation Steps

### Step 1: Memory Management API

1. **Create route handlers** for CRUD operations
2. **Add file upload handling** for images
3. **Implement validation** for request data
4. **Add error handling** and status codes
5. **Write comprehensive tests**

### Step 2: Recognition API

1. **Create recognition endpoints** for identify/learn/search
2. **Integrate face embedding service** from Phase 2
3. **Add similarity search** functionality
4. **Implement confidence scoring**
5. **Write comprehensive tests**

### Step 3: Interaction API

1. **Create interaction tracking** endpoints
2. **Add interaction history** retrieval
3. **Implement memory updates** on interactions
4. **Add pagination and filtering**
5. **Write comprehensive tests**

## Error Handling

### Standard Error Responses

```typescript
// 400 Bad Request
{
  error: string;
  details?: string[];
}

// 404 Not Found
{
  error: string;
}

// 500 Internal Server Error
{
  error: string;
  message?: string;
}
```

### Common Error Scenarios

- Invalid image format
- Missing required fields
- Memory not found
- Database connection errors
- OpenAI API errors
- File upload errors

## Performance Requirements

- **Memory Creation**: < 500ms (including embedding generation)
- **Memory Retrieval**: < 100ms
- **Face Recognition**: < 1 second end-to-end
- **Interaction Recording**: < 50ms

## Acceptance Criteria

- [ ] All memory management API tests pass
- [ ] All recognition API tests pass
- [ ] All interaction API tests pass
- [ ] Error handling implemented
- [ ] Performance requirements met
- [ ] API documentation complete
- [ ] Integration with Phase 2 components working

## Next Steps

After completing Phase 3, proceed to:

- **Phase 4**: UI Components
- **Phase 5**: Integration & End-to-End Tests
- **Phase 6**: Advanced Features & Optimization

Each phase builds upon the API foundation established in this phase.
