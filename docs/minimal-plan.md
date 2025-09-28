# Bare Minimum OpenAI Vision Fine-tuning GUI

## Core Requirements

1. **Image Table**: Display images with filename, annotation, date
2. **Add Image Modal**: Simple form to add new image with annotation
3. **Submit Button**: Send ALL uploaded images to OpenAI API (no selection needed)

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
│   └── [id]/route.ts     # DELETE image
└── jobs/
    └── submit/route.ts   # POST submit to OpenAI
```

## Minimal Components

```
components/
├── image-table.tsx        # Table showing images
├── add-image-modal.tsx     # Modal to add image
└── ui/                   # Basic shadcn components
    ├── table.tsx
    ├── dialog.tsx
    └── button.tsx
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
