# Minimal User Journey

## User Persona

**Data Scientist** - Needs to quickly upload images and submit for fine-tuning

## User Journey

### 1. View Images

- User sees table with uploaded images
- Shows filename, annotation, date
- Delete button for each image

### 2. Add Image

- User clicks "Add Image" button
- Modal opens with file upload and annotation field
- User selects image and enters annotation
- Clicks "Add" to save

### 3. Submit to OpenAI

- User clicks "Submit to OpenAI" button
- System submits all images to OpenAI API
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

That's it. No authentication, no complex features, just the basics.
