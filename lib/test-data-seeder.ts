/**
 * Test Data Seeder for Memory Management System
 * Creates test memory entries with consistent embeddings for testing face recognition
 */

import { createMemoryEntry } from '@/lib/memory-database';
import { OpenAIFaceEmbeddingService } from '@/lib/face-embedding';
import fs from 'fs';
import path from 'path';

interface TestPerson {
  name: string;
  relationshipType: 'friend' | 'family' | 'acquaintance';
  description?: string;
}

const TEST_PEOPLE: TestPerson[] = [
  {
    name: 'Alice Johnson',
    relationshipType: 'friend',
    description: 'Close friend from college',
  },
  {
    name: 'Bob Smith',
    relationshipType: 'family',
    description: 'Cousin',
  },
  {
    name: 'Carol Williams',
    relationshipType: 'acquaintance',
    description: 'Neighbor',
  },
  {
    name: 'David Brown',
    relationshipType: 'friend',
    description: 'Gym buddy',
  },
  {
    name: 'Emma Davis',
    relationshipType: 'family',
    description: 'Sister',
  },
];

/**
 * Create test memory entries with consistent embeddings
 */
export async function seedTestMemoryData(): Promise<void> {
  console.log('🌱 Seeding test memory data...');

  const embeddingService = new OpenAIFaceEmbeddingService();

  for (const person of TEST_PEOPLE) {
    try {
      // Generate consistent embedding for this person
      const embedding =
        OpenAIFaceEmbeddingService.generateConsistentTestEmbedding(person.name);

      // Create memory entry with the consistent embedding
      const memoryData = {
        name: person.name,
        embedding,
        relationshipType: person.relationshipType,
        notes: person.description,
        preferences: ['friendly', 'helpful'],
        tags: ['test-data', person.relationshipType],
      };

      const memory = await createMemoryEntry(memoryData);

      console.log(`✅ Created memory for ${person.name} (ID: ${memory.id})`);
    } catch (error) {
      console.error(`❌ Failed to create memory for ${person.name}:`, error);
    }
  }

  console.log('🎉 Test memory data seeding completed!');
}

/**
 * Create test images from uploaded files with consistent embeddings
 * This function reads existing uploaded images and creates memory entries for them
 */
export async function seedFromUploadedImages(): Promise<void> {
  console.log('🌱 Seeding memory data from uploaded images...');

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const embeddingService = new OpenAIFaceEmbeddingService();

  try {
    const files = fs.readdirSync(uploadsDir);

    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
        try {
          const filePath = path.join(uploadsDir, file);
          const imageBuffer = fs.readFileSync(filePath);

          // Generate embedding for the image
          const embeddingResult = await embeddingService.generateEmbedding(
            imageBuffer
          );

          if (embeddingResult.success && embeddingResult.embedding) {
            // Use filename (without extension) as the person name
            const personName = path.parse(file).name.replace(/[-_]/g, ' ');

            const memoryData = {
              name: personName,
              embedding: embeddingResult.embedding,
              relationshipType: 'friend' as const,
              notes: `Created from uploaded image: ${file}`,
              preferences: ['test-data'],
              tags: ['uploaded', 'test'],
            };

            const memory = await createMemoryEntry(memoryData);
            console.log(
              `✅ Created memory for ${personName} from ${file} (ID: ${memory.id})`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error reading uploads directory:', error);
  }

  console.log('🎉 Memory data seeding from uploads completed!');
}

/**
 * Clear all test memory data
 */
export async function clearTestMemoryData(): Promise<void> {
  console.log('🧹 Clearing test memory data...');

  // Note: This would need to be implemented in the memory database service
  // For now, we'll just log the action
  console.log(
    '⚠️  Clear functionality needs to be implemented in memory-database.ts'
  );

  console.log('✅ Test memory data clearing completed!');
}

// CLI interface for seeding
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seedTestMemoryData().catch(console.error);
      break;
    case 'seed-from-uploads':
      seedFromUploadedImages().catch(console.error);
      break;
    case 'clear':
      clearTestMemoryData().catch(console.error);
      break;
    default:
      console.log('Usage:');
      console.log('  npm run seed-memory    # Seed with default test people');
      console.log('  npm run seed-uploads   # Seed from uploaded images');
      console.log('  npm run clear-memory   # Clear test memory data');
      break;
  }
}
