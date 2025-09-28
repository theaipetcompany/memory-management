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
- Modal opens with multi-file upload and annotation field
- User selects multiple images and enters annotation
- Clicks "Add X Images" to save all at once

### 3. Submit to OpenAI

- User clicks "Submit to OpenAI" button
- System submits ALL uploaded images to OpenAI API
- Shows success/error message

## Success Metrics

- Upload first image: < 1 minute
- Submit dataset: < 2 minutes
- Upload success rate: > 95%

## Error Handling

- Invalid file format → Show error
- Missing annotation → Highlight field
- Upload failure → Retry option
- No images → Disable submit button
- Less than 10 images → Show warning message

That's it. No authentication, no complex features, just the basics.
