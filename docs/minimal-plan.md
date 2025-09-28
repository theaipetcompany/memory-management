# Bare Minimum OpenAI Vision Fine-tuning GUI

## Core Requirements

1. **Image Table**: Display images with filename, annotation (editable), date
2. **Add Images Modal**: Multi-file upload form to add multiple images (no annotation required)
3. **Inline Annotation Editing**: Click-to-edit annotations directly in the table with Tab navigation
4. **Submit Button**: Send ALL uploaded images to OpenAI API (minimum 10 required)

## Minimal Database Schema

```prisma
model Image {
  id          String   @id @default(cuid())
  filename    String
  annotation  String
  createdAt   DateTime @default(now())
}

model Job {
  id          String   @id @default(cuid())
  status      String   @default("pending")
  openaiJobId String?
  createdAt   DateTime @default(now())
}
```

## Minimal API Routes

```
app/api/
├── images/
│   ├── route.ts          # GET all images, POST new image
│   └── [id]/route.ts     # DELETE image, PATCH annotation
└── jobs/
    └── submit/route.ts   # POST submit to OpenAI
```

## Minimal Components

```
components/
├── image-table.tsx        # Table showing images with inline editing
├── add-image-modal.tsx     # Modal to add images (no annotation)
└── ui/                   # Basic shadcn components
    ├── table.tsx
    ├── dialog.tsx
    ├── button.tsx
    └── input.tsx
```

## Minimal Pages

```
app/
├── page.tsx             # Main page with table
└── api/
    └── [routes above]
```

## Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "openai": "^4.20.0"
  }
}
```

That's it. Just a table, a modal, and a submit button.
