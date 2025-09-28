# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development (custom server with Socket.IO)
npm run dev

# Production build
npm run build
npm start

# Code quality
npm run lint
npm run format      # Format code with Prettier

# Bundle analysis
npm run analyze     # Analyze bundle size and dependencies

# Database operations
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database and run migrations
```

## Architecture Overview

### Custom Server Setup

This project uses a custom Node.js server (`server.ts`) that combines Next.js with Socket.IO for real-time features. The server runs on port 3000 and handles both HTTP requests and WebSocket connections at `/api/socketio`.

**Development URL**: Use `http://10.20.30.202:3000` when testing the development server to avoid CORS issues with the external API.

### API Integration

- **External API**: `https://api.nxfs.no` - Main backend API with JWT authentication
- **N8N Chatbot**: `https://n8n.nxfs.no/webhook/nxfs` - AI chatbot integration with file upload support
- **Authentication**: JWT tokens with automatic refresh via Axios interceptors
- **API Architecture**: Domain-driven structure with specialized API clients for each feature area
- **Type Safety**: Comprehensive TypeScript interfaces within domain-specific API modules
- **Error Handling**: Global error handler with toast notifications and retry mechanisms

#### Domain-Driven API Structure

The API is organized into domain-specific modules for better maintainability and type safety:

```
src/lib/api/
├── auth/           # Authentication & user management
├── blog/           # Blog posts and media
├── chat/           # N8N chatbot integration
├── memo/           # Electrical memo system
├── system/         # System monitoring & stats
├── tasks/          # Task management
├── shared/         # Common utilities & types
└── index.ts        # Centralized exports
```

Each domain contains:
- `types.ts` - TypeScript interfaces for requests/responses
- `index.ts` - API client methods and exports
- Domain-specific error handling and validation

### State Management Architecture

- **Zustand stores** with persistence (centralized exports via `src/stores/index.ts`):
  - `useAuthStore`: JWT authentication, user data, automatic token refresh
  - `useUIStore`: Theme (system/light/dark/purple/pink), language (en/no), UI state
- **Authentication flow**: Auto-initialization on app start, token refresh on 401/403
- **Environment Configuration**: Zod-validated environment variables via `src/lib/env.ts`
  - `NEXT_PUBLIC_N8N_SECRET_KEY`: Authentication key for N8N chatbot integration
  - **Development**: Uses `.env` (ignored by git, copy from `.env.example`)
  - **Production**: Uses `.env.production` (created from `.env.production.example` by deploy script)

### Database & Backend

- **Local Database**: SQLite with Prisma ORM (basic User/Post models)
- **External API**: Main business logic handled by Django backend at api.nxfs.no
- **Hybrid approach**: Local Prisma for development, external API for production features

### Internationalization

- **Languages**: English (en) and Norwegian (no)
- **Implementation**: Hybrid approach combining Next Intl with UI store language management
- **Translation System**:
  - Custom `useIntl()` hook bridges Next Intl with existing UI store (`src/hooks/use-intl.ts`)
  - Translation files in `src/messages/en.json` and `src/messages/no.json`
  - Type-safe translation keys with interpolation support
- **API Translation**: Supports both server-side (API returns pre-translated content) and client-side translation approaches
- **Usage Pattern**: `const { t } = useIntl(); return <h1>{t('home.title')}</h1>`

### Key Integrations

- **shadcn/ui**: Complete UI component library with Radix primitives
- **Socket.IO**: Real-time features integrated with custom server
- **TanStack Query**: Data fetching and caching (ready but not extensively used)
- **Framer Motion**: Animations and transitions
- **Sonner**: Toast notifications with enhanced UX and error handling
- **Prettier**: Code formatting with `.prettierrc` configuration
- **Bundle Analyzer**: Performance monitoring and optimization insights
- **Playwright**: Browser automation and testing via MCP server integration

### Component Architecture

- **Pages**: Next.js 15 App Router structure in `src/app/`
- **Feature Components**: Feature-specific components in `src/components/features/`
  - `features/blog/`: Blog post components
  - `features/chat/`: Chatbot components with file upload, session management, and N8N integration
  - `features/tasks/`: Task management components
- **Shared Components**: Reusable components in `src/components/shared/`
  - `ErrorBoundary`: React error boundary for component-level error handling
- **Layout Components**: Navigation and layout in `src/components/layouts/`
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Centralized Exports**: All components accessible via `src/components/features/index.ts`

### Authentication Pattern

```typescript
// Always check authentication in pages:
const { isAuthenticated, user, isInitialized } = useAuthStore();

useEffect(() => {
  if (isInitialized && !isAuthenticated) {
    router.push('/auth/signin');
  }
}, [isAuthenticated, isInitialized, router]);
```

### API Response Patterns

- **User API**: Returns arrays (user data is `response.data[0]`)
- **Tasks API**: Standard REST endpoints with full CRUD operations
- **Memo API**: Django REST Framework with pagination support
- **Type Safety**: All API responses use domain-specific TypeScript interfaces
- **Error Handling**: Global error handler (`src/lib/api/shared/error-handler.ts`) with toast notifications
- **Payload Types**: Separate request/response types (e.g., `CreateTaskPayload` vs `Task`)

#### Pagination Handling

The API supports multiple pagination patterns from Django REST Framework:

```typescript
// Flexible response types for paginated data
export type GetCategoriesResponse =
  | ElectricalCategory[]  // Direct array
  | PaginatedResponse<ElectricalCategory>;  // Paginated response

// Usage pattern in components
const categoriesArray = Array.isArray(response)
  ? response
  : response.results || [];
```

#### Domain-Specific API Features

- **Auth API**: JWT token management, user CRUD, automatic refresh
- **Tasks API**: Project-based task management with categories and filters
- **Blog API**: Content management with media upload capabilities
- **Memo API**: Electrical industry-specific forms and data management
- **System API**: Real-time monitoring and analytics data
- **Chat API**: N8N integration with file upload and session management

### Chatbot Integration

- **N8N Webhook**: Direct integration with N8N workflow automation at `https://n8n.nxfs.no/webhook/nxfs`
- **File Upload Support**: Multi-file upload with FormData (images, documents, max 10MB per file, 5 files per message)
- **Session Management**: Uses `session_id` from user model for conversation persistence
- **Authentication**: Secured with `NEXT_PUBLIC_N8N_SECRET_KEY` environment variable
- **Real-time UI**: Loading states, typing indicators, file previews, and error handling
- **Multilingual**: Full Norwegian/English translation support
- **API Methods**:
  - `chatbotAPI.sendMessage(sessionId, text)`: Text-only messages
  - `chatbotAPI.sendMessageWithFiles(sessionId, text, files)`: Messages with file attachments
- **File Validation**: Size limits, type checking, and user-friendly error messages

### Styling System

- **Tailwind CSS 4**: Utility-first styling with 2025 design trends
- **Theme system**: 5 comprehensive themes with automatic OS detection
  - **System** 🖥️: Automatically follows OS preference (default)
  - **Light** ☀️: Modern soft cream with digital lavender accents
  - **Dark** 🌙: Rich dark with purple highlights
  - **Purple** 💜: Elegant purple theme
  - **Pink** 💗: Sophisticated rose quartz theme
- **Server Sync**: Theme preferences automatically sync for authenticated users
- **CSS Variables**: All themes use CSS custom properties for dynamic theming
- **Responsive**: Mobile-first approach with standard Tailwind breakpoints

## Page Styling Guidelines

### Standard Page Structure

All new pages should follow this consistent structure for optimal user experience:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore } from '@/stores';

export default function YourPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Your page content */}
      </main>
      <ChatBot />
    </div>
  );
}
```

### Theme-Aware Styling Classes

Use these theme-aware CSS classes for consistent appearance across all themes:

#### Background & Layout

- `bg-background` - Main page background
- `bg-card` - Card/panel backgrounds
- `bg-muted` - Subtle background areas
- `bg-popover` - Modal/dropdown backgrounds

#### Text Colors

- `text-foreground` - Primary text color
- `text-muted-foreground` - Secondary/subtle text
- `text-primary` - Accent/brand text
- `text-destructive` - Error/warning text

#### Borders & Dividers

- `border-border` - Standard borders
- `border-input` - Form input borders
- `ring-ring` - Focus ring colors

#### Interactive Elements

- `hover:bg-muted` - Standard hover background
- `hover-lift` - Subtle lift animation on hover
- `hover-lift-only` - Lift without glow effect

### Component Examples

#### Cards with Theme Support

```typescript
<Card className="bg-card border-border hover-lift">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-foreground">Content goes here</p>
  </CardContent>
</Card>
```

#### Buttons with Consistent Styling

```typescript
// Primary action
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>

// Secondary action
<Button variant="outline" className="border-border hover:bg-muted">
  Secondary Action
</Button>
```

#### Form Elements

```typescript
<Input
  className="bg-background border-input focus:ring-ring"
  placeholder="Enter text..."
/>

<Label className="text-foreground font-medium">
  Field Label
</Label>
```

### Animation Guidelines

Use Framer Motion for smooth animations:

```typescript
import { motion } from 'framer-motion';

// Page entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <YourContent />
</motion.div>

// Staggered list animations
<motion.div className="space-y-4">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="hover-lift"
    >
      <ItemComponent item={item} />
    </motion.div>
  ))}
</motion.div>
```

### Required Page Elements

1. **Navbar**: Always include `<Navbar />` at the top
2. **ChatBot**: Always include `<ChatBot />` at the bottom
3. **Authentication**: Use the standard auth check pattern
4. **Loading States**: Provide loading indicators for async operations
5. **Error Handling**: Use toast notifications for errors
6. **Responsive Design**: Ensure mobile-first responsive layouts
7. **Theme Consistency**: Use theme-aware CSS classes throughout

### Accessibility Guidelines

- Use semantic HTML elements
- Provide proper ARIA labels for interactive elements
- Ensure sufficient color contrast across all themes
- Support keyboard navigation
- Include focus indicators with `ring-ring`

### Mobile Optimization

```typescript
// Responsive grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Container with proper spacing
<main className="container mx-auto px-4 py-8 max-w-7xl">
  {/* Page content */}
</main>

// Mobile-friendly navigation
<div className="flex flex-col sm:flex-row gap-4">
  {/* Navigation items */}
</div>
```

## Translation Implementation

### Next Intl Setup

- **Config**: `src/i18n/request.ts` - Next Intl configuration
- **Middleware**: `src/middleware.ts` - Handles locale routing
- **Messages**: Structured translation files in `src/messages/`

### Translation Approaches

1. **Static UI**: Use `t('key')` for interface elements
2. **API Content**: Server returns pre-translated fields (title/title_nb, body_markdown/body_markdown_nb)
3. **Client-side API**: Use translation keys for system-generated content with interpolation
4. **Hybrid**: Combine approaches based on content type (user vs system generated)

### Translation Hook Usage

```typescript
import { useIntl } from '@/hooks/use-intl';

function Component() {
  const { t } = useIntl();
  return <h1>{t('home.title')}</h1>; // Auto-switches based on UI store language
}
```

## Utility Hooks

The project includes a comprehensive set of utility hooks (centralized via `src/hooks/index.ts`):

### Core Hooks

- **`useDebounce`**: Debounce values for search optimization and performance
- **`useLocalStorage`**: Type-safe localStorage integration with React state
- **`useApi`**: Enhanced API calls with loading states and error handling
- **`useAsync`**: Generic async operation handling with loading/error states

### Usage Examples

```typescript
import { useDebounce, useLocalStorage, useApi } from '@/hooks';

// Debounced search
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

// Persistent local storage
const [settings, setSettings] = useLocalStorage(
  'user-settings',
  defaultSettings
);

// API calls with loading states
const { data, loading, error, execute } = useApi(tasksAPI.getTasks);
```

## Error Handling Architecture

### Global Error Handler

- **Location**: `src/lib/error-handler.ts`
- **Features**: Centralized error processing, toast notifications, retry mechanisms
- **Integration**: Automatic handling of Axios errors, network failures, and API errors

### React Error Boundary

- **Location**: `src/components/shared/error-boundary.tsx`
- **Purpose**: Catch component-level errors and provide fallback UI
- **Features**: Error retry functionality, user-friendly error messages

### Error Handling Patterns

```typescript
import { ErrorHandler } from '@/lib/error-handler';

try {
  const result = await api.someOperation();
  return result;
} catch (error) {
  ErrorHandler.handle(error, 'Operation context');
  throw error; // Re-throw if needed for component handling
}
```

## Type Safety

### API Types Architecture

- **Location**: Domain-specific type definitions within each API module
- **Structure**: `src/lib/api/{domain}/types.ts` for each feature area
- **Coverage**: Complete TypeScript interfaces for all API operations
- **Pattern**: Separate request payloads and response types for clarity
- **Migration**: Legacy `/src/types/` directory has been replaced with domain-driven structure

### Domain-Specific Type Organization

```typescript
// Example: Tasks domain types (src/lib/api/tasks/types.ts)
export interface CreateTaskPayload {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  user_id: string;
  project_id?: string;
  category_id?: string;
}

export interface Task extends CreateTaskPayload {
  id: string;
  created_at: string;
  updated_at: string;
}

export type CreateTaskResponse = Task;
export type GetTasksResponse = Task[];

// Example: Memo domain types (src/lib/api/memo/types.ts)
export interface ElectricalCategory {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type GetCategoriesResponse =
  | ElectricalCategory[]
  | PaginatedResponse<ElectricalCategory>;
```

### Type Safety Best Practices

- **Domain Isolation**: Each API domain maintains its own type definitions
- **Response Flexibility**: Support for both direct arrays and paginated responses
- **Null Safety**: Comprehensive null checks for optional properties
- **Type Guards**: Runtime type validation for API responses
- **Generic Patterns**: Reusable pagination and error types across domains

## Development Tools

### Bundle Analysis

```bash
npm run analyze  # Generate bundle analysis report
```

### Code Formatting

```bash
npm run format   # Format all code with Prettier
```

### Browser Testing with Playwright

The project includes Playwright MCP server integration for browser automation and testing:

- **Setup**: Playwright MCP server configured with `npx @playwright/mcp@latest --caps vision`
- **Browser Access**: Use `http://10.20.30.202:3000` when testing the development server
- **Capabilities**: Screenshot capture, page interaction, form filling, navigation testing
- **Usage**: Available through Claude Code's MCP integration for automated testing and UI verification

### Environment Configuration

- **Validation**: Zod schema validation for environment variables
- **Location**: `src/lib/env.ts`
- **Type Safety**: Compile-time validation of required environment variables

#### Environment Files

- **`.env.example`**: Template for development environment (tracked in git)
- **`.env`**: Local development environment (ignored by git, copy from `.env.example`)
- **`.env.production.example`**: Template for production environment (tracked in git)
- **`.env.production`**: Production environment (ignored by git, created by deploy script)

#### Required Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: https://api.nxfs.no)
- `NEXT_PUBLIC_N8N_URL`: N8N webhook URL (default: https://n8n.nxfs.no/webhook/nxfs)
- `NEXT_PUBLIC_N8N_SECRET_KEY`: Authentication key for N8N integration
- `NEXT_PUBLIC_API_TOKEN`: Django API authentication token (format: "Token xxx#")
- `PLAYWRIGHT_TEST_EMAIL`: Email for Playwright frontend testing (claude@nxfs.no)
- `PLAYWRIGHT_TEST_PASSWORD`: Password for Playwright frontend testing
- `NODE_ENV`: Environment mode (development/production/test)

#### API Schema and Testing

- **Backend API Schema**: https://api.nxfs.no/schema/ - Django REST API documentation
- **Frontend Testing**: Use `http://10.20.30.202:3000` with Playwright to avoid CORS issues
- **API Authentication**: Token-based authentication for Django backend integration

#### Setup Instructions

**Development:**

```bash
cp .env.example .env
# Edit .env with your development values
```

**Production:**
The `deploy.sh` script automatically:

1. Creates `.env.production` from `.env.production.example`
2. Opens editor to set production values
3. Reminds to never commit environment files
