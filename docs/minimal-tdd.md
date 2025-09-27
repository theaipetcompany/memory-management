# Minimal TDD Plan

## Test Structure

```
tests/
├── image-table.test.tsx
├── add-image-modal.test.tsx
└── api/
    ├── images.test.ts
    └── jobs.test.ts
```

## Test Cases

### image-table.test.tsx

```typescript
describe('ImageTable', () => {
  test('should display images', () => {
    render(<ImageTable images={mockImages} />);
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
  });

  test('should delete image', () => {
    render(<ImageTable images={mockImages} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(mockDeleteImage).toHaveBeenCalled();
  });
});
```

### add-image-modal.test.tsx

```typescript
describe('AddImageModal', () => {
  test('should open modal', () => {
    render(<AddImageModal />);
    fireEvent.click(screen.getByText('Add Image'));
    expect(screen.getByText('Add New Image')).toBeInTheDocument();
  });

  test('should submit image', () => {
    render(<AddImageModal />);
    fireEvent.change(screen.getByLabelText('Annotation'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(mockAddImage).toHaveBeenCalled();
  });
});
```

## Implementation Order

1. Write failing tests
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Repeat for each component

That's it. Basic Jest and Testing Library only.
