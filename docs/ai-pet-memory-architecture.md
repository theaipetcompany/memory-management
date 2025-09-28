# AI Pet Memory Architecture: Data Flows for Friend Recognition

This document outlines the specific data flows for two key scenarios in an AI pet's memory system:

1. **Meeting a new friend** - First-time encounter and memory creation
2. **Recognizing a returning friend** - Subsequent encounters and memory retrieval

---

## System Overview

The AI pet's memory system operates through two interconnected loops:

- **Perception Loop**: Real-time visual/audio processing and recognition
- **Memory Loop**: Long-term storage, retrieval, and context assembly

---

## Scenario 1: Meeting a New Friend

### New Friend Data Flow

```mermaid
flowchart TD
    A[Camera captures face] --> B[Vision Encoder generates embedding]
    C[User: "This is my friend Anna"] --> D[Speech-to-Text processing]

    B --> E[Similarity Search in Vector DB]
    E --> F{Match Found?}
    F -->|No| G[New Person Detected]
    F -->|Yes| H[Existing Person - Update Context]

    G --> I[Create New Memory Entry]
    D --> J[Extract Name & Context]
    J --> I

    I --> K[Store in Vector Database]
    K --> L[Generate Response: "Nice to meet you, Anna!"]

    H --> M[Update Existing Memory]
    M --> N[Generate Response: "Hello again, Anna!"]

    L --> O[TTS + Visual Response]
    N --> O
```

### New Friend Process

1. Visual Processing

2. Memory Search

   ```json
   {
     "step": "similarity_search",
     "query_embedding": [0.1, -0.3, 0.8, ...],
     "threshold": 0.8,
     "results": []
   }
   ```

3. New Memory Creation

   ```json
   {
     "step": "create_memory",
     "memory_entry": {
       "id": "friend_anna_20250120",
       "embedding": [0.1, -0.3, 0.8, ...],
       "metadata": {
         "name": "Anna",
         "first_met": "2025-01-20T14:30:00Z",
         "introduced_by": "Sang",
         "context": "Met at Sang's place",
         "tags": ["friend", "new_person"]
       }
     }
   }
   ```

4. Response Generation

   ```json
   {
     "step": "generate_response",
     "context": "New friend Anna introduced by Sang",
     "response": "Nice to meet you, Anna! I'm excited to get to know you!",
     "emotion": "happy",
     "actions": ["wave", "smile"]
   }
   ```

---

## Scenario 2: Recognizing a Returning Friend

### Returning Friend Data Flow

```mermaid
flowchart TD
    A[Camera captures face] --> B[Vision Encoder generates embedding]
    C[User: "Say hi to my friend"] --> D[Speech-to-Text processing]

    B --> E[Similarity Search in Vector DB]
    E --> F{Match Found?}
    F -->|Yes| G[Retrieve Memory Context]
    F -->|No| H[Unknown Person - Ask for Introduction]

    G --> I[Assemble RAG Context]
    D --> I

    I --> J[Generate Personalized Response]
    J --> K[Update Interaction History]
    K --> L[TTS + Visual Response]

    H --> M[Request Introduction]
    M --> N[Fallback Response]
    N --> L
```

### Returning Friend Process

1. Visual Processing (Same as Scenario 1)

2. Memory Retrieval

```json
{
  "step": "memory_retrieval",
  "query_embedding": [0.1, -0.3, 0.8, ...],
  "top_k": 3,
  "results": [
    {
      "id": "friend_anna_20250120",
      "similarity": 0.92,
      "metadata": {
        "name": "Anna",
        "first_met": "2025-01-20T14:30:00Z",
        "last_seen": "2025-01-25T10:15:00Z",
        "interaction_count": 5,
        "notes": "Loves sci-fi, met at Sang's place",
        "preferences": ["coffee", "books"]
      }
    }
  ]
}
```

3. RAG Context Assembly

   ```json
   {
     "step": "rag_assembly",
     "user_query": "Say hi to my friend",
     "retrieved_memories": [
       {
         "name": "Anna",
         "relationship": "friend",
         "last_interaction": "5 days ago",
         "personality_notes": "Loves sci-fi, prefers coffee"
       }
     ],
     "assembled_context": "Anna is a friend who was last seen 5 days ago. She loves sci-fi and prefers coffee. She was first introduced by Sang."
   }
   ```

4. Personalized Response Generation

   ```json
   {
     "step": "generate_response",
     "context": "Recognizing returning friend Anna",
     "response": "Hi Anna! Great to see you again! How's your sci-fi reading going?",
     "emotion": "friendly",
     "actions": ["wave", "tail_wag"],
     "personalization": "references_previous_interactions"
   }
   ```

5. Memory Update

   ```json
   {
     "step": "update_memory",
     "memory_id": "friend_anna_20250120",
     "updates": {
       "last_seen": "2025-01-30T16:45:00Z",
       "interaction_count": 6,
       "recent_topics": ["sci-fi", "books"]
     }
   }
   ```

---

## Technical Implementation Details

### Vector Database Schema

```json
{
  "collection": "friend_memories",
  "schema": {
    "id": "string (unique)",
    "embedding": "vector (768 dimensions)",
    "metadata": {
      "name": "string",
      "first_met": "datetime",
      "last_seen": "datetime",
      "interaction_count": "integer",
      "introduced_by": "string",
      "notes": "text",
      "preferences": "array",
      "tags": "array",
      "relationship_type": "enum [friend, family, acquaintance]"
    }
  }
}
```

### Similarity Search Configuration

```json
{
  "search_config": {
    "similarity_threshold": 0.8,
    "top_k": 3,
    "distance_metric": "cosine",
    "filter_conditions": {
      "relationship_type": ["friend", "family"]
    }
  }
}
```

### RAG Prompt Template

```txt
You are an AI pet with a memory system. Here's the context:

User Query: {user_query}

Retrieved Memories:
{retrieved_memories}

Current Situation: {current_situation}

Instructions:
- Use the retrieved memories to personalize your response
- Reference specific details from past interactions when appropriate
- Maintain a friendly, pet-like personality
- If recognizing someone, acknowledge the recognition warmly
- If meeting someone new, express excitement about meeting them

Response:
```

---

## Key Differences Between Scenarios

| Aspect              | New Friend              | Returning Friend             |
| ------------------- | ----------------------- | ---------------------------- |
| **Memory Search**   | No matches found        | High similarity match        |
| **Action**          | Create new memory       | Retrieve & update memory     |
| **Response Style**  | Introduction-focused    | Recognition-focused          |
| **Context Used**    | Basic introduction info | Rich interaction history     |
| **Personalization** | Generic welcome         | References past interactions |

---

## Error Handling & Edge Cases

### Ambiguous Recognition

- **Scenario**: Similarity score between 0.6-0.8
- **Action**: Ask for clarification: "I think I recognize you, but I'm not sure. Could you remind me of your name?"

### Multiple Matches

- **Scenario**: Several people with similar embeddings
- **Action**: Use additional context (location, time, user's current companions) to disambiguate

### Memory Corruption

- **Scenario**: Vector database inconsistency
- **Action**: Fallback to text-based recognition and rebuild embeddings

---

## Performance Considerations

- **Embedding Generation**: ~50ms per face
- **Vector Search**: ~10ms for 1000+ memories
- **RAG Assembly**: ~100ms for context building
- **Response Generation**: ~500ms for LLM processing

**Total Latency Target**: <1 second for recognition + response
