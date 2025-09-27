# Active Context - OpenAI Vision Fine-tuning GUI

## Current Project State

### Architecture Overview

- **Framework**: Next.js 14+ with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: shadcn/ui components with Tailwind CSS
- **Language**: TypeScript with strict mode
- **Package Manager**: pnpm

### Current Implementation Status

#### ✅ Completed Components

1. **Main Page (`app/page.tsx`)**

   - Client component with image management
   - State management for images list
   - Integration with all child components
   - Error handling for API calls

2. **Image Table (`components/image-table.tsx`)**

   - Displays images in table format
   - Shows filename, annotation, and creation date
   - Delete functionality for individual images
   - Empty state handling

3. **Add Image Modal (`components/add-image-modal.tsx`)**

   - File upload with image validation
   - Annotation input field
   - Form validation and error handling
   - Loading states and retry functionality

4. **Submit Button (`components/submit-button.tsx`)**

   - Triggers fine-tuning job submission
   - Loading states and error handling
   - Disabled state when no images

5. **API Routes**

   - `GET /api/images` - Fetch all images
   - `POST /api/images` - Upload new image
   - `DELETE /api/images/[id]` - Delete image
   - `POST /api/jobs/submit` - Submit to OpenAI (mock implementation)

6. **Database Schema (`prisma/schema.prisma`)**
   - Image model with id, filename, annotation, createdAt
   - Job model with id, status, openaiJobId, createdAt
   - PostgreSQL provider configured

#### 🔄 Current Limitations

1. **File Storage**: Images are not actually stored, only metadata
2. **OpenAI Integration**: Submit endpoint creates mock jobs only
3. **Job Management**: No job status tracking or monitoring
4. **Data Format**: No JSONL generation for OpenAI API
5. **Image Processing**: No base64 encoding or URL generation

### Required OpenAI Vision Fine-tuning Features

Based on research, the following features are needed for complete OpenAI vision fine-tuning:

#### Data Format Requirements

- **JSONL Format**: Each line must be a JSON object with `messages` array
- **Image Support**: Images as base64 data URIs or public URLs
- **Size Limits**: Max 50,000 examples, 64 images per example, 10MB per image
- **Format Support**: JPEG, PNG, WEBP in RGB/RGBA mode

#### Missing GUI Components Needed

1. **Image Preview Component**

   - Display uploaded images in the table
   - Thumbnail generation
   - Image validation feedback

2. **JSONL Export/Preview**

   - Show generated training data format
   - Validate against OpenAI requirements
   - Download functionality

3. **Job Management Dashboard**

   - Real-time job status tracking
   - Progress monitoring
   - Error handling and retry options

4. **Configuration Panel**

   - Model selection (gpt-4o-2024-08-06)
   - Training parameters
   - Validation settings

5. **File Storage Integration**
   - Actual image file storage (local or cloud)
   - Base64 encoding for API
   - File size validation

### Next Steps Priority

1. **High Priority**

   - Implement actual file storage
   - Add image preview in table
   - Create JSONL generation logic
   - Integrate real OpenAI API calls

2. **Medium Priority**

   - Add job status monitoring
   - Implement configuration panel
   - Add data validation

3. **Low Priority**
   - Advanced monitoring dashboard
   - Batch operations
   - Export/import functionality

### Technical Debt

- Client component in `page.tsx` should be converted to Server Component pattern
- Error handling could be more comprehensive
- No loading states for individual operations
- Missing TypeScript strict type definitions for API responses

### Development Environment

- **Database**: PostgreSQL (configured)
- **Environment**: Development mode
- **Testing**: Jest configured with component tests
- **Linting**: ESLint and Prettier configured
