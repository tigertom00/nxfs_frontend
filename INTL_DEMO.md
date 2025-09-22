# Next Intl Implementation Demo

## Overview

This demonstrates how to use Next Intl for internationalization in your Next.js app, including both static UI translation and dynamic API response translation.

## What's Implemented

### 1. Custom Translation Hook (`src/hooks/use-intl.ts`)

- Bridges Next Intl with your existing UI store language system
- Provides type-safe translation keys
- Supports interpolation for dynamic values
- Compatible with your current language switching logic

### 2. Updated Main Page (`src/app/page.tsx`)

- Welcome text now uses `t('home.title')` and `t('home.subtitle')`
- Added demonstration section explaining translation capabilities
- Automatically switches between English/Norwegian based on UI store

### 3. Enhanced Blog Posts (`src/components/blog-posts.tsx`)

- Static UI text uses translation keys (`t('blog.author')`, etc.)
- Added sample translated blog post to demonstrate capabilities
- Shows how API responses can be translated client-side

### 4. Translation Files

- **English**: `src/messages/en.json`
- **Norwegian**: `src/messages/no.json`
- Added `home.*` keys for homepage content
- Added sample blog post content with rich markdown

## Language Switching

The system works with your existing language toggle in the navbar:

1. User clicks language toggle in navbar
2. UI store updates `language` state
3. `useIntl()` hook automatically re-renders with new translations
4. All text updates instantly

## API Response Translation Approaches

### Method 1: Server-Side (Current)

Your API already returns both languages:

```typescript
{
  title: "English Title",
  title_nb: "Norsk Tittel",
  body_markdown: "English content...",
  body_markdown_nb: "Norsk innhold..."
}
```

### Method 2: Client-Side (New Capability)

Using Next Intl for API responses:

```typescript
// Translation keys in JSON files
const post = {
  id: 'api-key-post',
  title: t('blog.posts.introduction.title'),
  body_markdown: t('blog.posts.introduction.content', {
    author: userData.name,
    date: formatDate(post.created_at),
  }),
};
```

### Method 3: Hybrid Approach (Recommended)

- Use server-side for user-generated content (blog posts, comments)
- Use client-side for system-generated content (error messages, UI text)
- Use interpolation for dynamic values in translations

## Benefits of This Approach

1. **Type Safety**: TypeScript knows all available translation keys
2. **Interpolation**: Dynamic values like `{author}` and `{date}`
3. **Rich Text**: Markdown formatting in translation files
4. **Fallback**: Graceful degradation if keys are missing
5. **Performance**: Translations loaded once, cached automatically
6. **Maintenance**: Centralized translation management

## Testing the Implementation

1. Start the development server: `npm run dev`
2. Visit the homepage
3. Click the language toggle in the navbar (🇺🇸/🇳🇴)
4. Watch the welcome text and sample blog post change languages instantly
5. The first blog post is generated from translation files with interpolation

## Next Steps

To fully leverage this system:

1. **Migrate existing components** to use `useIntl()` instead of manual language checks
2. **Add more translation keys** for forms, error messages, etc.
3. **Use interpolation** for dynamic content like usernames, dates, counts
4. **Consider pluralization** for items like "1 task" vs "2 tasks"
5. **Add more sophisticated** markdown/rich text in translations

## Example Usage

```typescript
// In any component
import { useIntl } from '@/hooks/use-intl';

function MyComponent() {
  const { t } = useIntl();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('dashboard.subtitle', { username: user.name })}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

This approach gives you the best of both worlds: compatibility with your existing system while unlocking powerful internationalization capabilities.
