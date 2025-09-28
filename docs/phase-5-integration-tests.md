# Phase 5: Integration & End-to-End Tests

## Overview

This phase focuses on integrating all components from previous phases and implementing comprehensive end-to-end tests. We'll test complete user journeys, performance benchmarks, and system integration to ensure the AI Pet Memory system works seamlessly.

## Integration Architecture

### System Integration Points

```txt
Frontend Components (Phase 4)
    ↓
API Routes (Phase 3)
    ↓
Core Services (Phase 2)
    ↓
Database Layer (Phase 1)
    ↓
External Services (OpenAI, pgvector)
```

### Integration Testing Strategy

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component + API interaction
- **End-to-End Tests**: Complete user journeys
- **Performance Tests**: System performance benchmarks
- **Error Handling Tests**: Failure scenarios and recovery

## End-to-End Test Scenarios

### Scenario 1: New Friend Meeting Flow

**Complete user journey from image upload to memory creation**

```typescript
describe('New Friend Meeting Flow', () => {
  it('should complete new friend meeting flow', async () => {
    // 1. User opens memory dashboard
    render(<MemoryDashboard />);
    expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();

    // 2. User clicks "Add Memory"
    const addButton = screen.getByText('Add Memory');
    await user.click(addButton);

    // 3. Modal opens with form
    expect(screen.getByText('Add New Memory')).toBeInTheDocument();

    // 4. User fills form and uploads image
    await user.type(screen.getByLabelText('Name'), 'Anna');
    await user.type(screen.getByLabelText('Introduced by'), 'Sang');
    await user.type(screen.getByLabelText('Notes'), "Met at Sang's place");

    const fileInput = screen.getByLabelText('Upload image');
    const imageFile = new File(['image data'], 'anna.jpg', {
      type: 'image/jpeg',
    });
    await user.upload(fileInput, imageFile);

    // 5. User submits form
    const submitButton = screen.getByText('Create Memory');
    await user.click(submitButton);

    // 6. System processes image and creates memory
    expect(screen.getByText('Processing image...')).toBeInTheDocument();

    // 7. Memory appears in dashboard
    await waitFor(() => {
      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(
        screen.getByText('Memory created successfully')
      ).toBeInTheDocument();
    });

    // 8. Statistics update
    expect(screen.getByText('Total Memories')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

### Scenario 2: Returning Friend Recognition Flow

**Complete recognition and interaction tracking flow**

```typescript
describe('Returning Friend Recognition Flow', () => {
  it('should recognize returning friend and track interaction', async () => {
    // 1. Setup: Create existing memory
    const existingMemory = await createTestMemory('Anna', {
      embedding: new Array(768).fill(0.1),
      interactionCount: 3,
    });

    // 2. User opens recognition test panel
    render(<RecognitionTestPanel />);
    expect(screen.getByText('Recognition Test')).toBeInTheDocument();

    // 3. User uploads test image
    const fileInput = screen.getByLabelText('Upload test image');
    const testImageFile = new File(['image data'], 'anna-test.jpg', {
      type: 'image/jpeg',
    });
    await user.upload(fileInput, testImageFile);

    // 4. System processes image and finds match
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    // 5. Recognition results displayed
    await waitFor(() => {
      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument(); // similarity score
    });

    // 6. User records interaction
    const recordButton = screen.getByText('Record Interaction');
    await user.click(recordButton);

    // 7. Interaction form opens
    expect(screen.getByText('Record Interaction')).toBeInTheDocument();

    // 8. User fills interaction details
    await user.selectOptions(
      screen.getByLabelText('Interaction Type'),
      'recognition'
    );
    await user.type(screen.getByLabelText('Context'), 'Met at coffee shop');
    await user.type(
      screen.getByLabelText('Response'),
      'Hi Anna! Great to see you!'
    );

    // 9. User submits interaction
    const submitButton = screen.getByText('Record');
    await user.click(submitButton);

    // 10. Interaction recorded and memory updated
    await waitFor(() => {
      expect(screen.getByText('Interaction recorded')).toBeInTheDocument();
    });

    // 11. Verify memory update
    const updatedMemory = await fetch(`/api/memories/${existingMemory.id}`);
    const memoryData = await updatedMemory.json();
    expect(memoryData.interactionCount).toBe(4);
  });
});
```

### Scenario 3: Memory Management Flow

**Complete memory editing and deletion flow**

```typescript
describe('Memory Management Flow', () => {
  it('should edit and delete memory entries', async () => {
    // 1. Setup: Create test memory
    const testMemory = await createTestMemory('Anna', {
      notes: 'Original notes',
      preferences: ['coffee'],
    });

    // 2. User opens memory dashboard
    render(<MemoryDashboard initialMemories={[testMemory]} />);
    expect(screen.getByText('Anna')).toBeInTheDocument();

    // 3. User edits memory
    const editButton = screen.getByLabelText('Edit Anna');
    await user.click(editButton);

    // 4. Edit modal opens with current data
    expect(screen.getByDisplayValue('Anna')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original notes')).toBeInTheDocument();

    // 5. User updates memory
    await user.clear(screen.getByLabelText('Notes'));
    await user.type(screen.getByLabelText('Notes'), 'Updated notes');
    await user.type(screen.getByLabelText('Preferences'), 'books, music');

    // 6. User saves changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // 7. Memory updated in dashboard
    await waitFor(() => {
      expect(
        screen.getByText('Memory updated successfully')
      ).toBeInTheDocument();
      expect(screen.getByText('Updated notes')).toBeInTheDocument();
    });

    // 8. User deletes memory
    const deleteButton = screen.getByLabelText('Delete Anna');
    await user.click(deleteButton);

    // 9. Confirmation dialog appears
    expect(
      screen.getByText('Are you sure you want to delete this memory?')
    ).toBeInTheDocument();

    // 10. User confirms deletion
    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    // 11. Memory removed from dashboard
    await waitFor(() => {
      expect(screen.queryByText('Anna')).not.toBeInTheDocument();
      expect(
        screen.getByText('Memory deleted successfully')
      ).toBeInTheDocument();
    });
  });
});
```

### Scenario 4: Error Handling Flow

**Complete error handling and recovery flow**

```typescript
describe('Error Handling Flow', () => {
  it('should handle API errors gracefully', async () => {
    // 1. Mock API error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    // 2. User opens memory dashboard
    render(<MemoryDashboard />);

    // 3. User tries to add memory
    const addButton = screen.getByText('Add Memory');
    await user.click(addButton);

    // 4. User fills form and submits
    await user.type(screen.getByLabelText('Name'), 'Anna');
    const fileInput = screen.getByLabelText('Upload image');
    const imageFile = new File(['image data'], 'anna.jpg', {
      type: 'image/jpeg',
    });
    await user.upload(fileInput, imageFile);

    const submitButton = screen.getByText('Create Memory');
    await user.click(submitButton);

    // 5. Error message displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create memory')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // 6. User can retry
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // 7. Form resets and user can try again
    expect(screen.getByDisplayValue('Anna')).toBeInTheDocument();
  });
});
```

## Performance Tests

### Performance Benchmarks

**File**: `tests/performance.test.ts`

```typescript
describe('Performance Tests', () => {
  describe('embedding generation', () => {
    it('should complete within 400ms', async () => {
      const startTime = Date.now();

      const result = await generateEmbedding(mockImageBuffer);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(400);
      expect(result.embedding).toHaveLength(768);
    });

    it('should fallback to local model when API is slow', async () => {
      // Mock slow API response
      jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(mockResponse), 500)
            )
        );

      const startTime = Date.now();
      const result = await generateEmbedding(mockImageBuffer);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(400);
      expect(result.method).toBe('local');
    });
  });

  describe('similarity search', () => {
    it('should search 1000+ memories within 100ms', async () => {
      // Create 1000 test memories
      const memories = await createBulkTestMemories(1000);

      const startTime = Date.now();
      const results = await findSimilarMemories(new Array(768).fill(0.1), {
        threshold: 0.8,
        topK: 10,
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(results).toBeDefined();
    });
  });

  describe('end-to-end latency', () => {
    it('should complete recognition within 1 second', async () => {
      // Setup test memory
      await createTestMemory('Anna');

      const startTime = Date.now();

      // Complete recognition flow
      const response = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: createFormDataWithImage(mockImageFile),
      });

      const result = await response.json();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.matches).toBeDefined();
    });
  });

  describe('memory operations', () => {
    it('should create memory within 500ms', async () => {
      const startTime = Date.now();

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: createFormDataWithImage(mockImageFile, { name: 'Anna' }),
      });

      const result = await response.json();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(result.id).toBeDefined();
    });

    it('should retrieve memories within 100ms', async () => {
      // Create test memories
      await createBulkTestMemories(100);

      const startTime = Date.now();

      const response = await fetch('/api/memories');
      const result = await response.json();

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result.memories).toHaveLength(100);
    });
  });
});
```

## Integration Tests

### API Integration Tests

**File**: `tests/api-integration.test.ts`

```typescript
describe('API Integration Tests', () => {
  describe('Memory API Integration', () => {
    it('should create, read, update, and delete memories', async () => {
      // Create memory
      const createResponse = await fetch('/api/memories', {
        method: 'POST',
        body: createFormDataWithImage(mockImageFile, { name: 'Anna' }),
      });

      expect(createResponse.status).toBe(201);
      const createdMemory = await createResponse.json();
      expect(createdMemory.name).toBe('Anna');

      // Read memory
      const readResponse = await fetch(`/api/memories/${createdMemory.id}`);
      expect(readResponse.status).toBe(200);
      const readMemory = await readResponse.json();
      expect(readMemory.id).toBe(createdMemory.id);

      // Update memory
      const updateResponse = await fetch(`/api/memories/${createdMemory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Updated notes' }),
      });

      expect(updateResponse.status).toBe(200);
      const updatedMemory = await updateResponse.json();
      expect(updatedMemory.notes).toBe('Updated notes');

      // Delete memory
      const deleteResponse = await fetch(`/api/memories/${createdMemory.id}`, {
        method: 'DELETE',
      });

      expect(deleteResponse.status).toBe(200);

      // Verify deletion
      const verifyResponse = await fetch(`/api/memories/${createdMemory.id}`);
      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Recognition API Integration', () => {
    it('should identify faces and record interactions', async () => {
      // Create test memory
      const memory = await createTestMemory('Anna');

      // Identify face
      const identifyResponse = await fetch('/api/recognition/identify', {
        method: 'POST',
        body: createFormDataWithImage(mockImageFile),
      });

      expect(identifyResponse.status).toBe(200);
      const identifyResult = await identifyResponse.json();
      expect(identifyResult.matches).toHaveLength(1);
      expect(identifyResult.matches[0].name).toBe('Anna');

      // Record interaction
      const interactionResponse = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryEntryId: memory.id,
          interactionType: 'recognition',
          context: 'Test interaction',
        }),
      });

      expect(interactionResponse.status).toBe(201);
      const interaction = await interactionResponse.json();
      expect(interaction.memoryEntryId).toBe(memory.id);

      // Verify memory update
      const updatedMemoryResponse = await fetch(`/api/memories/${memory.id}`);
      const updatedMemory = await updatedMemoryResponse.json();
      expect(updatedMemory.interactionCount).toBe(1);
    });
  });
});
```

### Component Integration Tests

**File**: `tests/component-integration.test.ts`

```typescript
describe('Component Integration Tests', () => {
  describe('Memory Dashboard Integration', () => {
    it('should integrate all dashboard components', async () => {
      // Mock API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockMemoriesResponse)
        .mockResolvedValueOnce(mockStatsResponse);

      render(<MemoryDashboard />);

      // Verify all components render
      expect(screen.getByText('Memory Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Verify component interactions
      const editButton = screen.getByLabelText('Edit Anna');
      await user.click(editButton);

      expect(screen.getByText('Edit Memory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Anna')).toBeInTheDocument();
    });
  });

  describe('Recognition Test Panel Integration', () => {
    it('should integrate recognition and learning components', async () => {
      // Mock API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockRecognitionResponse)
        .mockResolvedValueOnce(mockLearningResponse);

      render(<RecognitionTestPanel />);

      // Test recognition mode
      const fileInput = screen.getByLabelText('Upload test image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Anna')).toBeInTheDocument();
        expect(screen.getByText('High Confidence')).toBeInTheDocument();
      });

      // Test learning mode
      const learningButton = screen.getByText('Learning Mode');
      await user.click(learningButton);

      expect(screen.getByText('Teach New Face')).toBeInTheDocument();
    });
  });
});
```

## Error Handling Tests

### Error Scenarios

**File**: `tests/error-handling.test.ts`

```typescript
describe('Error Handling Tests', () => {
  describe('API Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<MemoryDashboard />);

      const addButton = screen.getByText('Add Memory');
      await user.click(addButton);

      await user.type(screen.getByLabelText('Name'), 'Anna');
      const submitButton = screen.getByText('Create Memory');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle validation errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Name is required' }),
      });

      render(<MemoryDashboard />);

      const addButton = screen.getByText('Add Memory');
      await user.click(addButton);

      const submitButton = screen.getByText('Create Memory');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Component Error Handling', () => {
    it('should handle invalid image uploads', async () => {
      render(<FaceUpload onImageUpload={jest.fn()} />);

      const fileInput = screen.getByLabelText('Upload image');
      const invalidFile = new File(['invalid'], 'test.txt', {
        type: 'text/plain',
      });
      await user.upload(fileInput, invalidFile);

      expect(
        screen.getByText('Please upload a valid image file')
      ).toBeInTheDocument();
    });

    it('should handle face detection failures', async () => {
      render(
        <FaceUpload onImageUpload={jest.fn()} onFaceDetected={jest.fn()} />
      );

      // Mock face detection failure
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Face detection failed'));

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Face detection failed')).toBeInTheDocument();
      });
    });
  });
});
```

## Load Testing

### Load Test Scenarios

**File**: `tests/load.test.ts`

```typescript
describe('Load Tests', () => {
  describe('Memory Operations Load Test', () => {
    it('should handle 100 concurrent memory creations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        fetch('/api/memories', {
          method: 'POST',
          body: createFormDataWithImage(mockImageFile, { name: `Person${i}` }),
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      expect(responses.every((r) => r.ok)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Recognition Load Test', () => {
    it('should handle 50 concurrent recognition requests', async () => {
      // Create test memories
      await createBulkTestMemories(50);

      const promises = Array.from({ length: 50 }, () =>
        fetch('/api/recognition/identify', {
          method: 'POST',
          body: createFormDataWithImage(mockImageFile),
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      expect(responses.every((r) => r.ok)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
```

## Implementation Steps

### Step 1: End-to-End Test Setup

1. **Set up test environment** with mock data
2. **Create test utilities** for API mocking
3. **Implement user journey tests** for all scenarios
4. **Add error handling tests** for failure cases
5. **Write performance benchmarks** for key operations

### Step 2: Integration Testing

1. **Test API integration** between all endpoints
2. **Test component integration** with API calls
3. **Test database integration** with all operations
4. **Test external service integration** (OpenAI, pgvector)
5. **Add load testing** for concurrent operations

### Step 3: Performance Optimization

1. **Identify performance bottlenecks** from tests
2. **Optimize database queries** and indexes
3. **Implement caching** for frequently accessed data
4. **Optimize API response times** and payload sizes
5. **Add monitoring** and alerting for performance metrics

### Step 4: Error Handling & Recovery

1. **Implement comprehensive error handling** in all layers
2. **Add retry mechanisms** for transient failures
3. **Implement graceful degradation** for service outages
4. **Add user-friendly error messages** and recovery options
5. **Test error scenarios** and recovery procedures

## Performance Requirements

- **End-to-End Recognition**: < 1 second
- **Memory Creation**: < 500ms
- **Memory Retrieval**: < 100ms
- **Similarity Search**: < 100ms for 1000+ memories
- **Concurrent Operations**: Support 100+ concurrent users
- **Error Recovery**: < 2 seconds for retry operations

## Acceptance Criteria

- [ ] All end-to-end tests pass
- [ ] All integration tests pass
- [ ] All performance tests meet requirements
- [ ] Error handling tests pass
- [ ] Load tests pass
- [ ] System handles concurrent operations
- [ ] Recovery mechanisms work correctly
- [ ] Performance benchmarks met

## Next Steps

After completing Phase 5, proceed to:

- **Phase 6**: Advanced Features & Optimization
- **Production Deployment**: System deployment and monitoring
- **User Testing**: Real-world testing and feedback

Each phase builds upon the integration and testing foundation established in this phase.
