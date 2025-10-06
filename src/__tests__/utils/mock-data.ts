import type { User } from '@/lib/api/auth/types';
import type { Task } from '@/lib/api/tasks/types';
import type { BlogPost } from '@/lib/api/blog/types';

/**
 * Mock user data for testing
 */
export const mockUser: User = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  session_id: 'test-session-id',
  is_staff: false,
  is_active: true,
  date_joined: '2025-01-01T00:00:00Z',
};

/**
 * Mock admin user data for testing
 */
export const mockAdminUser: User = {
  ...mockUser,
  id: 'admin-user-id',
  username: 'adminuser',
  email: 'admin@example.com',
  is_staff: true,
};

/**
 * Mock task data for testing
 */
export const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'todo',
  user_id: mockUser.id,
  project_id: 'project-1',
  category_id: 'category-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Mock tasks array for testing
 */
export const mockTasks: Task[] = [
  mockTask,
  {
    id: 'task-2',
    title: 'Another Task',
    description: 'This is another test task',
    status: 'in_progress',
    user_id: mockUser.id,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Completed Task',
    description: 'This task is completed',
    status: 'completed',
    user_id: mockUser.id,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T12:00:00Z',
  },
];

/**
 * Mock blog post data for testing
 */
export const mockBlogPost: BlogPost = {
  id: 1,
  title: 'Test Blog Post',
  title_nb: 'Test Blogginnlegg',
  subtitle: 'A test subtitle',
  subtitle_nb: 'En test undertittel',
  body_markdown: '# Test Content\n\nThis is test content.',
  body_markdown_nb: '# Test Innhold\n\nDette er test innhold.',
  author: mockUser.id,
  tags: ['test', 'blog'],
  is_published: true,
  published_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Mock JWT tokens for testing
 */
export const mockTokens = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
};

/**
 * Mock API error response
 */
export const mockApiError = {
  message: 'Test error message',
  status: 400,
  errors: {
    field: ['This field is required'],
  },
};

/**
 * Create mock paginated response
 */
export function createMockPaginatedResponse<T>(
  results: T[],
  page = 1,
  pageSize = 10
) {
  const totalCount = results.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    count: totalCount,
    next: hasNext ? `?page=${page + 1}` : null,
    previous: hasPrevious ? `?page=${page - 1}` : null,
    results,
  };
}
