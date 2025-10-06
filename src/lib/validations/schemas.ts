import { z } from 'zod';

/**
 * Common validation schemas for form patterns across the application
 * Uses zod for runtime validation and type inference
 */

// ============================================================================
// REUSABLE FIELD VALIDATORS
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

export const urlSchema = z.string().url('Invalid URL format').optional();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  username: usernameSchema.optional(),
  display_name: z.string().max(100, 'Display name is too long').optional(),
  first_name: z.string().max(50, 'First name is too long').optional(),
  last_name: z.string().max(50, 'Last name is too long').optional(),
  language: z.enum(['en', 'no']).optional(),
  theme: z.enum(['light', 'dark', 'purple', 'pink', 'system']).optional(),
  profile_picture: z.union([z.instanceof(File), z.string()]).optional(),
});

// ============================================================================
// TASK MANAGEMENT SCHEMAS
// ============================================================================

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'completed']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  due_date: z
    .string()
    .refine(
      (date) => {
        if (!date) {return true;}
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      { message: 'Invalid date format' }
    )
    .optional(),
  estimated_time: z
    .union([
      z.string().transform((val) => (val === '' ? undefined : parseInt(val, 10))),
      z.number(),
    ])
    .optional(),
  category: z.array(z.number()).optional(),
  project: z.number().optional(),
  user_id: z.string().min(1, 'User ID is required'),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ user_id: true });

export const taskSearchSchema = z.object({
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: z
    .union([taskPrioritySchema, z.array(taskPrioritySchema)])
    .optional(),
  category: z.union([z.array(z.number()), z.array(z.string())]).optional(),
  project: z.union([z.number(), z.string()]).optional(),
  user_id: z.string().optional(),
  due_date_start: z.string().optional(),
  due_date_end: z.string().optional(),
  completed: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

// ============================================================================
// PROJECT MANAGEMENT SCHEMAS
// ============================================================================

export const projectStatusSchema = z.enum(['todo', 'in_progress', 'completed']);

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters'),
  name_nb: z.string().max(200, 'Norwegian name is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  description_nb: z.string().max(2000, 'Norwegian description is too long').optional(),
  user_id: z.number().min(1, 'User ID is required'),
  status: projectStatusSchema.optional().default('todo'),
  tasks: z.array(z.number()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ user_id: true });

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  name_nb: z.string().max(100, 'Norwegian name is too long').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
  description: z.string().max(500, 'Description is too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex color)')
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

export const bulkTaskUpdateSchema = z.object({
  task_ids: z.array(z.number()).min(1, 'At least one task must be selected'),
  updates: z.object({
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    category: z.array(z.number()).optional(),
    project: z.number().optional(),
  }),
});

export const bulkTaskDeleteSchema = z.object({
  task_ids: z.array(z.number()).min(1, 'At least one task must be selected'),
});

// ============================================================================
// COMMON FORM PATTERNS
// ============================================================================

export const searchFormSchema = z.object({
  query: z.string().max(500, 'Search query is too long'),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size must be less than 10MB',
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message:
          'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF',
      }
    ),
});

export const multipleFileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, 'At least one file is required')
    .max(5, 'Maximum 5 files allowed')
    .refine(
      (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
      {
        message: 'Each file must be less than 10MB',
      }
    ),
});

export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  page_size: z
    .number()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(10),
});

export const dateRangeSchema = z
  .object({
    start_date: z.string().refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      { message: 'Invalid start date format' }
    ),
    end_date: z.string().refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      { message: 'Invalid end date format' }
    ),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

// ============================================================================
// TYPE INFERENCE HELPERS
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type TaskSearchFormData = z.infer<typeof taskSearchSchema>;

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

export type BulkTaskUpdateFormData = z.infer<typeof bulkTaskUpdateSchema>;
export type BulkTaskDeleteFormData = z.infer<typeof bulkTaskDeleteSchema>;

export type SearchFormData = z.infer<typeof searchFormSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type MultipleFileUploadFormData = z.infer<typeof multipleFileUploadSchema>;
export type PaginationFormData = z.infer<typeof paginationSchema>;
export type DateRangeFormData = z.infer<typeof dateRangeSchema>;
