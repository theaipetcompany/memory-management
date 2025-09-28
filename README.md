# Memory Management

A web application for managing image datasets and submitting them to OpenAI for vision model fine-tuning. This tool provides an intuitive interface to upload images, add annotations, and generate training data in the format required by OpenAI's fine-tuning API.

## What This Project Does

This application helps you:

- **Upload Images**: Drag and drop or select multiple images for your training dataset
- **Add Annotations**: Edit image descriptions/annotations directly in the interface
- **Manage Dataset**: View, edit, and delete images in a table format
- **Generate Training Data**: Convert your images and annotations into OpenAI-compatible JSONL format
- **Submit to OpenAI**: Send your dataset directly to OpenAI's fine-tuning API
- **Track Jobs**: Monitor fine-tuning job status and access OpenAI platform links

## Features

- 🖼️ **Image Upload**: Support for multiple image formats (PNG, JPG, etc.)
- ✏️ **Inline Editing**: Click to edit annotations directly in the table
- 📊 **Dataset Management**: View file sizes, upload dates, and manage your collection
- 🔄 **Real-time Updates**: Live preview of your dataset
- 📤 **OpenAI Integration**: Direct submission to OpenAI fine-tuning API
- 🎯 **Validation**: Ensures minimum 10 images required for fine-tuning
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL
- **File Storage**: Local file system (configurable)
- **UI Components**: Radix UI with custom styling
- **Testing**: Jest with React Testing Library

## Prerequisites

- Node.js 24+
- PostgreSQL database
- OpenAI API key (for fine-tuning submission)
- pnpm package manager

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fine-tuning
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fine_tuning_db"

# OpenAI API (for fine-tuning submission)
OPENAI_API_KEY="your-openai-api-key"

# Application
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## How to Use

### 1. Upload Images

- Click "Add Images" button or drag and drop files
- Select multiple images at once
- Images are automatically validated (type and size limits)

### 2. Add Annotations

- Click on any annotation cell in the table to edit
- Type your description of what's in the image
- Press Enter to save, Escape to cancel
- Use Tab to move between annotations

### 3. Manage Your Dataset

- View all uploaded images in the table
- See file sizes, upload dates, and previews
- Delete unwanted images
- Edit annotations inline

### 4. Submit for Fine-tuning

- Ensure you have at least 10 images with annotations
- Click "Submit to OpenAI" button
- The app will generate JSONL training data
- Submit directly to OpenAI's fine-tuning API
- Get a link to monitor your job on OpenAI platform

## API Endpoints

- `GET /api/images` - Fetch all images
- `POST /api/images` - Upload new image
- `PUT /api/images/[id]` - Update image annotation
- `DELETE /api/images/[id]` - Delete image
- `POST /api/jobs/submit` - Submit dataset for fine-tuning

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint checking
pnpm format       # Prettier formatting
```

### Testing

The project includes comprehensive tests:

```bash
pnpm test         # Run all tests
pnpm test:watch   # Watch mode for development
```

### Database Management

```bash
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate  # Run migrations
pnpm prisma generate # Generate Prisma client
```

## File Structure

```
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── *.tsx          # Feature components
├── lib/               # Utility libraries
├── prisma/            # Database schema and migrations
├── types/             # TypeScript type definitions
└── uploads/           # Uploaded image storage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
