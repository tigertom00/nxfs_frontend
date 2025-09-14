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

# Database operations
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database and run migrations
```

## Architecture Overview

### Custom Server Setup
This project uses a custom Node.js server (`server.ts`) that combines Next.js with Socket.IO for real-time features. The server runs on port 3000 and handles both HTTP requests and WebSocket connections at `/api/socketio`.

### API Integration
- **External API**: `https://api.nxfs.no` - Main backend API with JWT authentication
- **N8N Chatbot**: `https://n8n.nxfs.no/webhook/nxfs` - AI chatbot integration
- **Authentication**: JWT tokens with automatic refresh via Axios interceptors
- **API Structure**: All API calls go through centralized API client in `src/lib/api.ts`

### State Management Architecture
- **Zustand stores** with persistence:
  - `useAuthStore`: JWT authentication, user data, automatic token refresh
  - `useUIStore`: Theme (light/dark/purple), language (en/no), UI state
- **Authentication flow**: Auto-initialization on app start, token refresh on 401/403

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

### Component Architecture
- **Pages**: Next.js 15 App Router structure in `src/app/`
- **Shared Components**: Reusable components in `src/components/`
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Layout**: Global navbar and chatbot components

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
- **Tasks API**: Standard REST endpoints with full CRUD
- **Error handling**: Centralized in API client with automatic token refresh

### Styling System
- **Tailwind CSS 4**: Utility-first styling
- **Theme system**: Custom light/dark/purple themes via CSS classes
- **Responsive**: Mobile-first approach with standard Tailwind breakpoints

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