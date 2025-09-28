# Minimal User Journey

## User Persona

**Data Scientist** - Needs to quickly upload images and submit for fine-tuning

## User Journey

### 1. View Images

- User sees table with uploaded images
- Shows filename, annotation, date
- Delete button for each image

### 2. Add Images

- User clicks "Add Images" button
- Modal opens with multi-file upload (no annotation field)
- User selects multiple images
- Clicks "Add X Images" to save all at once
- Images are uploaded with empty annotations

### 3. Edit Annotations

- User clicks on any annotation cell in the table to edit
- Input field appears for inline editing
- User can type annotation and press Enter to save
- User can press Tab to move to the next annotation input
- User can press Escape to cancel editing
- Empty annotations show "Click to add annotation..." placeholder

### 4. Submit to OpenAI

- User clicks "Submit to OpenAI" button
- System submits ALL uploaded images to OpenAI API
- Shows success/error message

## Success Metrics

- Upload first image: < 1 minute
- Submit dataset: < 2 minutes
- Upload success rate: > 95%

## Error Handling

- Invalid file format → Show error
- Upload failure → Retry option
- No images → Disable submit button
- Less than 10 images → Show warning message
- Annotation update failure → Show error message

That's it. No authentication, no complex features, just the basics.
