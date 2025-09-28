// Re-export the base API instance
export { default as api } from './base';

// Re-export shared utilities and types
export * from './shared/types';
export * from './shared/error-handler';
export * from './shared/utils';

// ============================================================================
// DOMAIN-DRIVEN API EXPORTS
// ============================================================================

// Authentication domain
export * from './auth/types';
export { authAPI } from './auth/auth';
export { usersAPI } from './auth/users';

// Blog domain
export * from './blog/types';
export { postsAPI } from './blog/posts';
export { tagsAPI } from './blog/tags';
export { mediaAPI } from './blog/media';

// Tasks domain
export * from './tasks/types';
export { tasksAPI } from './tasks/tasks';
export { categoriesAPI } from './tasks/categories';
export { categoriesAPI as taskCategoriesAPI } from './tasks/categories';
export { projectsAPI } from './tasks/projects';

// Docker domain
export * from './docker/types';
export { hostsAPI } from './docker/hosts';
export { containersAPI } from './docker/containers';

// System monitoring domain
export * from './system/types';
export { monitoringAPI } from './system/monitoring';
export { healthAPI } from './system/health';

// LLM providers domain
export * from './llm/types';
export { providersAPI } from './llm/providers';
export { providersAPI as llmProvidersAPI } from './llm/providers';

// Chatbot integration domain
export * from './chatbot/types';
export { n8nAPI as chatbotAPI } from './chatbot/n8n';

// Admin domain
export * from './admin/types';
// Admin API methods will be exported here when implemented

// Memo app domain (already migrated)
export * from './memo/types';
export { materialsAPI } from './memo/materials';
export { jobsAPI, jobMaterialsAPI } from './memo/jobs';
export { jobImagesAPI } from './memo/job-images';
export { suppliersAPI } from './memo/suppliers';
export { categoriesAPI as memoCategoriesAPI } from './memo/categories';
export { timeTrackingAPI } from './memo/time-tracking';
export { dashboardAPI } from './memo/dashboard';
export { elNumberLookupAPI } from './memo/n8n-lookup';

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================
// These maintain the existing API structure to prevent breaking changes
// TODO: Can be deprecated in future versions after migration is complete

// Legacy infrastructure exports with different names to avoid conflicts
export { monitoringAPI as systemAPI } from './system/monitoring';
export { healthAPI as systemHealthAPI } from './system/health';

// Combined Docker API for backward compatibility
import { hostsAPI } from './docker/hosts';
import { containersAPI } from './docker/containers';
export const dockerAPI = {
  // Host methods
  ...hostsAPI,
  // Container methods
  ...containersAPI,
};

// Legacy memo aliases
export { timeTrackingAPI as timeEntriesAPI } from './memo/time-tracking';

// Legacy task aliases for backward compatibility