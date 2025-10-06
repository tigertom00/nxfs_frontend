# Form Patterns and Best Practices

This document outlines the standardized form patterns used in the NXFS Frontend application, leveraging `react-hook-form` and `zod` for type-safe validation and excellent developer experience.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Form Components](#form-components)
- [Validation Schemas](#validation-schemas)
- [Form Utilities](#form-utilities)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## Overview

### Why react-hook-form + zod?

- **Type Safety**: Full TypeScript support with automatic type inference
- **Performance**: Minimal re-renders and optimized validation
- **Developer Experience**: Simple API with powerful features
- **Validation**: Schema-based validation with zod for consistent patterns
- **Error Handling**: Built-in error handling with user-friendly messages

### Architecture

```
src/
├── lib/
│   └── validations/
│       ├── schemas.ts        # Zod validation schemas
│       └── utils.ts          # Form utilities and helpers
├── components/
│   └── ui/
│       ├── form.tsx          # Base form components (shadcn/ui)
│       └── form-components.tsx # Reusable form field components
```

## Quick Start

### 1. Install Dependencies

```bash
npm install react-hook-form zod @hookform/resolvers
```

### 2. Import Required Components

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
} from '@/components/ui/form-components';
import { createTaskSchema, type CreateTaskFormData } from '@/lib/validations/schemas';
import { handleFormSubmit } from '@/lib/validations/utils';
```

### 3. Create Your Form

```typescript
export function MyForm() {
  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
    },
  });

  const onSubmit = async (data: CreateTaskFormData) => {
    await handleFormSubmit(
      async (validatedData) => {
        // Your API call here
        await api.createTask(validatedData);
      },
      data,
      {
        successMessage: 'Task created successfully',
        errorMessage: 'Failed to create task',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          control={form.control}
          name="title"
          label="Title"
          placeholder="Enter task title"
          required
        />

        <FormTextarea
          control={form.control}
          name="description"
          label="Description"
          rows={4}
          maxLength={2000}
          showCharacterCount
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
```

## Form Components

### FormInput

Text input field with built-in validation and error display.

```typescript
<FormInput
  control={control}
  name="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  autoComplete="email"
  disabled={isSubmitting}
  required
/>
```

**Props:**

- `control`: Form control from `useForm`
- `name`: Field name (typed based on schema)
- `label?`: Field label text
- `description?`: Help text below input
- `placeholder?`: Placeholder text
- `type?`: Input type (text, email, password, number, tel, url, date, time, datetime-local)
- `autoComplete?`: Autocomplete attribute
- `disabled?`: Disabled state
- `required?`: Show required indicator

### FormTextarea

Multi-line text input with character counting.

```typescript
<FormTextarea
  control={control}
  name="description"
  label="Description"
  placeholder="Enter detailed description"
  rows={5}
  maxLength={2000}
  showCharacterCount
  resize="vertical"
  disabled={isSubmitting}
  required
/>
```

**Props:**

- All `FormInput` props
- `rows?`: Number of visible rows (default: 4)
- `maxLength?`: Maximum character length
- `showCharacterCount?`: Show character counter
- `resize?`: Resize behavior (none, vertical, horizontal, both)

### FormSelect

Dropdown select field with options.

```typescript
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

<FormSelect
  control={control}
  name="status"
  label="Status"
  options={statusOptions}
  placeholder="Select status"
  emptyOption="No selection"
  disabled={isSubmitting}
  required
/>;
```

**Props:**

- All base props
- `options`: Array of `SelectOption` objects
- `emptyOption?`: Optional empty/default option text

### FormCheckbox

Checkbox input field.

```typescript
<FormCheckbox
  control={control}
  name="isCompleted"
  label="Completion Status"
  checkboxLabel="Mark as completed"
  description="Check if the task is finished"
  disabled={isSubmitting}
/>
```

**Props:**

- All base props
- `checkboxLabel?`: Label next to checkbox

### FormRadioGroup

Radio button group for single selection.

```typescript
const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

<FormRadioGroup
  control={control}
  name="priority"
  label="Priority"
  options={priorityOptions}
  orientation="horizontal"
  disabled={isSubmitting}
  required
/>;
```

**Props:**

- All base props
- `options`: Array of `SelectOption` objects
- `orientation?`: Layout direction (horizontal, vertical)

### FormFileInput

File upload input with validation.

```typescript
<FormFileInput
  control={control}
  name="attachment"
  label="Attachment"
  accept="image/*,.pdf"
  multiple
  maxSize={10 * 1024 * 1024} // 10MB
  disabled={isSubmitting}
/>
```

**Props:**

- All base props
- `accept?`: File type filter
- `multiple?`: Allow multiple files
- `maxSize?`: Maximum file size in bytes

## Validation Schemas

### Available Schemas

All schemas are defined in `src/lib/validations/schemas.ts`:

#### Authentication

- `loginSchema`
- `registerSchema`
- `changePasswordSchema`
- `resetPasswordSchema`
- `forgotPasswordSchema`
- `updateUserSchema`

#### Task Management

- `createTaskSchema`
- `updateTaskSchema`
- `taskSearchSchema`
- `createProjectSchema`
- `updateProjectSchema`
- `createCategorySchema`
- `updateCategorySchema`

#### Bulk Operations

- `bulkTaskUpdateSchema`
- `bulkTaskDeleteSchema`

#### Common Patterns

- `searchFormSchema`
- `fileUploadSchema`
- `multipleFileUploadSchema`
- `paginationSchema`
- `dateRangeSchema`

### Creating Custom Schemas

```typescript
import { z } from 'zod';

// Define schema
export const myFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema, // Reuse common validators
  age: z.number().min(18, 'Must be 18 or older').optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms',
  }),
});

// Infer TypeScript type
export type MyFormData = z.infer<typeof myFormSchema>;
```

### Common Validators

Reusable field validators for consistent patterns:

```typescript
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  urlSchema,
  phoneSchema,
} from '@/lib/validations/schemas';

// Use in your schemas
const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
  website: urlSchema,
});
```

## Form Utilities

### handleFormSubmit

Wrapper for form submission with automatic error handling and toasts.

```typescript
import { handleFormSubmit } from '@/lib/validations/utils';

const onSubmit = async (data: FormData) => {
  await handleFormSubmit(
    async (validatedData) => {
      await api.createResource(validatedData);
    },
    data,
    {
      successMessage: 'Resource created successfully',
      errorMessage: 'Failed to create resource',
      showSuccessToast: true,
      showErrorToast: true,
      onSuccess: () => {
        router.push('/resources');
      },
      onError: (error) => {
        console.error('Custom error handling', error);
      },
    }
  );
};
```

### Validation Helpers

```typescript
import {
  validateWithSchema,
  safeValidate,
  zodErrorsToFieldErrors,
  showValidationErrors,
} from '@/lib/validations/utils';

// Validate data
const result = validateWithSchema(mySchema, formData);
if (result.success) {
  // Use validated data
  console.log(result.data);
} else {
  // Handle errors
  console.error(result.errors);
}

// Safe validation (returns null on error)
const validated = safeValidate(mySchema, formData);
if (validated) {
  // Use data
}

// Show validation errors as toast
showValidationErrors(form.formState.errors);
```

### Data Transformation

```typescript
import {
  cleanFormData,
  toFormData,
  emptyStringsToNull,
} from '@/lib/validations/utils';

// Remove undefined/null values
const cleaned = cleanFormData(formData);

// Convert to FormData for multipart uploads
const formDataObject = toFormData({
  name: 'John',
  avatar: fileObject,
  tags: ['a', 'b', 'c'],
});

// Convert empty strings to null
const normalized = emptyStringsToNull(formData);
```

### File Validation

```typescript
import { validateFiles, formatFileSize } from '@/lib/validations/utils';

const result = validateFiles(selectedFiles, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxFiles: 5,
});

if (!result.valid) {
  console.error(result.errors);
}

// Format file size for display
const sizeText = formatFileSize(file.size); // "2.5 MB"
```

### Password Strength

```typescript
import { calculatePasswordStrength } from '@/lib/validations/utils';

const strength = calculatePasswordStrength(password);
console.log(strength.score); // 0-4
console.log(strength.label); // "Weak" | "Fair" | "Good" | "Strong" | "Very Strong"
console.log(strength.suggestions); // ["Use at least 12 characters", ...]
```

## Examples

### Complete Form Example

See `src/components/features/tasks/task-form-v2.tsx` for a full example implementing:

- ✅ react-hook-form with zod validation
- ✅ All form component types
- ✅ File uploads
- ✅ Conditional fields
- ✅ Loading states
- ✅ Error handling
- ✅ Internationalization
- ✅ Delete confirmation

### Login Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/schemas';

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await handleFormSubmit(
      async (validatedData) => {
        await authAPI.login(validatedData);
      },
      data,
      {
        successMessage: 'Logged in successfully',
        errorMessage: 'Invalid credentials',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />

        <FormInput
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

### Search Form with Filters

```typescript
const searchSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  dateRange: dateRangeSchema.optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

export function SearchForm() {
  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormInput
          control={form.control}
          name="query"
          placeholder="Search..."
        />

        <FormSelect
          control={form.control}
          name="category"
          options={categoryOptions}
          placeholder="All categories"
        />

        <Button type="submit">Search</Button>
      </form>
    </Form>
  );
}
```

## Migration Guide

### From Manual State to react-hook-form

**Before:**

```typescript
const [formData, setFormData] = useState({ title: '', description: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleChange = (field: string, value: string) => {
  setFormData({ ...formData, [field]: value });
};

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.title) newErrors.title = 'Title is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  // Submit...
};
```

**After:**

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(mySchema),
  defaultValues: { title: '', description: '' },
});

const onSubmit = async (data: FormData) => {
  // Data is already validated!
  await api.submit(data);
};
```

### Migration Checklist

- [ ] Create or use existing zod schema for form
- [ ] Replace `useState` with `useForm`
- [ ] Replace manual inputs with form components
- [ ] Replace validation logic with zod schema
- [ ] Use `handleFormSubmit` for error handling
- [ ] Add loading states with `isSubmitting`
- [ ] Test form validation and submission

## Best Practices

### 1. Always Use Schemas

Define schemas for all forms, even simple ones:

```typescript
// ❌ Bad
const form = useForm(); // No validation

// ✅ Good
const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

### 2. Type Safety

Infer types from schemas for consistency:

```typescript
// ✅ Good
export const mySchema = z.object({ /* ... */ });
export type MyFormData = z.infer<typeof mySchema>;

// Use inferred type
const form = useForm<MyFormData>({ /* ... */ });
```

### 3. Reuse Common Validators

```typescript
// ✅ Good - Reuse common patterns
import { emailSchema, passwordSchema } from '@/lib/validations/schemas';

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
```

### 4. Handle Loading States

```typescript
const { isSubmitting } = form.formState;

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}
</Button>;
```

### 5. Provide User Feedback

```typescript
await handleFormSubmit(submitFn, data, {
  successMessage: 'Success!',
  errorMessage: 'Failed!',
  showSuccessToast: true,
  showErrorToast: true,
});
```

### 6. Use Character Counts

```typescript
<FormTextarea
  maxLength={2000}
  showCharacterCount // Shows "500/2000"
/>
```

### 7. Conditional Fields

```typescript
const watchType = form.watch('type');

{
  watchType === 'custom' && (
    <FormInput control={form.control} name="customValue" />
  );
}
```

### 8. Async Validation

```typescript
const checkUsername = createAsyncValidator(
  async (username) => {
    const available = await api.checkUsername(username);
    return available;
  },
  'Username is already taken',
  500 // Debounce 500ms
);

// Use in schema
const schema = z.object({
  username: z.string().refine(checkUsername),
});
```

### 9. Form Reset

```typescript
// Reset to default values
form.reset();

// Reset to specific values
form.reset({ title: 'New Title', description: '' });

// Reset after successful submission
onSuccess: () => {
  form.reset();
};
```

### 10. Error Display

```typescript
// Automatic error display with FormMessage
<FormInput control={control} name="field" />
// Errors shown automatically below input

// Manual error access
const { errors } = form.formState;
console.log(errors.field?.message);

// Show all errors as toast
showValidationErrors(form.formState.errors);
```

## Additional Resources

- [react-hook-form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Form Components](https://ui.shadcn.com/docs/components/form)

## Support

For questions or issues with forms:

1. Check this documentation
2. Review examples in `src/components/features/tasks/task-form-v2.tsx`
3. Consult the validation schemas in `src/lib/validations/schemas.ts`
4. Review utility functions in `src/lib/validations/utils.ts`

---

_Last Updated: 2025-10-06_
_Maintained by: NXFS Frontend Team_
