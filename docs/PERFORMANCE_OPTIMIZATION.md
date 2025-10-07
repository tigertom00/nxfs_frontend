# Performance Optimization Plan

**Generated**: 2025-10-07
**Status**: Implementation Ready
**Priority**: High (Week 4 Focus)

## Executive Summary

Bundle analysis has identified significant optimization opportunities across the application. The current production build totals **842 kB** for the largest route (blog admin) with shared chunks of **102 kB**. Key findings include heavy dependencies, lack of code splitting, and suboptimal image loading.

## Bundle Analysis Results

### Route Sizes (First Load JS)

| Route                     | Size    | First Load | Status      |
| ------------------------- | ------- | ---------- | ----------- |
| `/blog/admin`             | 496 kB  | **842 kB** | 🔴 Critical |
| `/memo/job/[orderNumber]` | 285 kB  | **538 kB** | 🔴 Critical |
| `/blog/[slug]`            | 3 kB    | **327 kB** | 🟡 High     |
| `/`                       | 3.86 kB | 281 kB     | 🟢 Good     |
| `/chat`                   | 10.6 kB | 289 kB     | 🟢 Good     |
| `/tasks`                  | 3.77 kB | 257 kB     | 🟢 Good     |

**Shared Chunks**: 102 kB (acceptable baseline)

### Critical Issues Identified

#### 1. Heavy Dependencies (Not Code-Split)

**Impact**: High bundle sizes for routes using these libraries

| Library                      | Size Impact | Used In          | Current Status   |
| ---------------------------- | ----------- | ---------------- | ---------------- |
| `@mdxeditor/editor`          | ~150 kB     | Blog editor      | ❌ Direct import |
| `@uiw/react-md-editor`       | ~120 kB     | Blog editor      | ❌ Direct import |
| `konva` + `react-konva`      | ~200 kB     | Image editor     | ❌ Direct import |
| `recharts`                   | ~100 kB     | Charts/analytics | ❌ Direct import |
| `tesseract.js`               | ~2 MB       | OCR scanner      | ❌ Direct import |
| `@zxing/library`             | ~300 kB     | Barcode scanner  | ❌ Direct import |
| `yet-another-react-lightbox` | ~50 kB      | Photo gallery    | ❌ Direct import |

**Total Potential Savings**: ~3 MB if properly code-split

#### 2. Image Optimization

**Impact**: Slower LCP and higher bandwidth usage

ESLint warnings detected **5 instances** of `<img>` tags that should use Next.js `<Image>`:

- `src/app/blog/[slug]/page.tsx` (1 instance)
- `src/app/llm-providers/page.tsx` (1 instance)
- `src/components/features/blog/admin/media-library.tsx` (1 instance)
- `src/components/features/blog/blog-posts.tsx` (1 instance)
- `src/components/features/memo/job-detail/photo-gallery.tsx` (1 instance)

#### 3. Component Optimization Opportunities

- **No dynamic imports**: All heavy components loaded synchronously
- **Large admin routes**: Blog admin (842 kB) loads editor even when not in use
- **Memo job detail**: 538 kB includes all tools (timer, materials, photos) upfront

## Optimization Strategy

### Phase 1: Dynamic Imports for Heavy Libraries ⭐ PRIORITY

**Estimated Impact**: Reduce bundle size by 2-3 MB, improve First Load JS by 40-60%

#### 1.1 Blog Editor (`@mdxeditor/editor`, `@uiw/react-md-editor`)

**Current**: `src/components/features/blog/admin/blog-editor.tsx`

```typescript
// ❌ Current (loads ~270 kB upfront)
import MDEditor from '@uiw/react-md-editor';

// ✅ Optimized (lazy load)
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});
```

**Expected Savings**: ~270 kB per route
**Routes Affected**: `/blog/admin`, `/blog/my-posts`

#### 1.2 Image Editor (`konva`, `react-konva`)

**Current**: `src/components/features/memo/shared/image-editor.tsx`

```typescript
// ❌ Current
import { Stage, Layer, Line, Text, Rect, Circle } from 'react-konva';

// ✅ Optimized
const ImageEditor = dynamic(() => import('./image-editor'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />
});
```

**Expected Savings**: ~200 kB
**Routes Affected**: `/memo/job/[orderNumber]`

#### 1.3 Barcode Scanner (`@zxing/library`)

**Current**: `src/components/features/memo/shared/barcode-scanner.tsx`

```typescript
// ❌ Current
import { BrowserMultiFormatReader } from '@zxing/library';

// ✅ Optimized (lazy load scanner library)
const BarcodeScanner = dynamic(() => import('./barcode-scanner'), {
  ssr: false,
  loading: () => <div>Initializing scanner...</div>
});
```

**Expected Savings**: ~300 kB
**Routes Affected**: `/memo/job/[orderNumber]`

#### 1.4 Charts (`recharts`)

**Current**: `src/components/ui/chart.tsx`

```typescript
// ❌ Current
import { ResponsiveContainer, LineChart, BarChart, PieChart } from 'recharts';

// ✅ Optimized (per-chart lazy loading)
const LineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { ssr: false }
);
```

**Expected Savings**: ~100 kB
**Routes Affected**: `/claude-monitor`, `/system-monitor`, dashboards

#### 1.5 Photo Gallery (`yet-another-react-lightbox`)

**Current**: `src/components/features/memo/job-detail/photo-gallery.tsx`

```typescript
// ❌ Current
import Lightbox from 'yet-another-react-lightbox';

// ✅ Optimized
const Lightbox = dynamic(() => import('yet-another-react-lightbox'), {
  ssr: false,
});
```

**Expected Savings**: ~50 kB

### Phase 2: Next.js Image Optimization ⭐ PRIORITY

**Estimated Impact**: Improve LCP by 30-50%, reduce bandwidth by 60-80%

#### Implementation

Replace all `<img>` tags with Next.js `<Image>`:

```typescript
// ❌ Before
<img src={imageUrl} alt="Description" />

// ✅ After
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

#### Files to Update (5 total)

1. **`src/app/blog/[slug]/page.tsx:166`** - Blog post images
2. **`src/app/llm-providers/page.tsx:346`** - Provider logos
3. **`src/components/features/blog/admin/media-library.tsx:281`** - Media previews
4. **`src/components/features/blog/blog-posts.tsx:241`** - Post thumbnails
5. **`src/components/features/memo/job-detail/photo-gallery.tsx:393`** - Job photos

#### Next.js Image Configuration

Add to `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.nxfs.no',
      pathname: '/media/**',
    },
    {
      protocol: 'https',
      hostname: 'n8n.nxfs.no',
      pathname: '/**',
    }
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### Phase 3: Component-Level Code Splitting

**Estimated Impact**: Reduce initial bundle by 20-30%, improve TTI

#### 3.1 Admin Route Components

Split blog admin dashboard into tabs:

```typescript
// src/app/blog/admin/page.tsx
const BlogEditor = dynamic(
  () => import('@/components/features/blog/admin/blog-editor'),
  { ssr: false }
);

const MediaLibrary = dynamic(
  () => import('@/components/features/blog/admin/media-library'),
  { ssr: false }
);

const TagManager = dynamic(
  () => import('@/components/features/blog/admin/tag-manager'),
  { ssr: false }
);
```

**Expected Savings**: Load editor only when needed (~300 kB)

#### 3.2 Memo Job Detail Tabs

```typescript
// src/app/memo/job/[orderNumber]/page.tsx
const MaterialManager = dynamic(() =>
  import('@/components/features/memo/job-detail/material-manager'),
  { loading: () => <Skeleton /> }
);

const PhotoGallery = dynamic(() =>
  import('@/components/features/memo/job-detail/photo-gallery'),
  { loading: () => <Skeleton /> }
);
```

**Expected Savings**: ~200 kB initial load

#### 3.3 Feature Flags for Heavy Features

Consider feature flags for rarely-used features:

```typescript
const BarcodeScanner = dynamic(() =>
  import('./barcode-scanner').catch(() => {
    toast.error('Barcode scanner not available');
    return { default: () => null };
  })
);
```

### Phase 4: Bundle Analysis & Tree Shaking

**Estimated Impact**: Reduce bundle by 10-15%

#### 4.1 Analyze Import Patterns

Most frequently imported modules (optimization candidates):

| Import          | Usage Count    | Optimization                          |
| --------------- | -------------- | ------------------------------------- |
| `Button`        | 77             | ✅ Already optimized (tree-shakeable) |
| `lucide-react`  | ~50 icons      | ⚠️ Consider icon bundling             |
| `framer-motion` | 8              | ✅ Good (only used where needed)      |
| Radix UI        | ~30 components | ✅ Tree-shakeable by design           |

#### 4.2 Lucide Icons Optimization

Current: Importing individual icons (good practice)

```typescript
// ✅ Already optimized
import { Plus, Edit, Trash } from 'lucide-react';
```

No changes needed - already following best practices.

#### 4.3 Review Unused Dependencies

Check for packages that might be unused:

```bash
npx depcheck
```

Candidates for review:

- `@reactuses/core` - Check if used
- `embla-carousel-react` - Verify usage
- `cmdk` - Command palette (check if implemented)
- `input-otp` - OTP input (check if used)
- `vaul` - Drawer component (check usage)

### Phase 5: Advanced Optimizations

#### 5.1 Route Prefetching Strategy

Configure selective prefetching:

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    '@radix-ui/react-*',
    'lucide-react',
    'framer-motion',
  ];
}
```

#### 5.2 Webpack Bundle Analysis Insights

From the generated reports (`.next/analyze/*.html`):

**Top Chunks to Investigate**:

1. `chunks/4bd1b696-*.js` (53.4 kB) - Shared vendor chunk
2. `chunks/1684-*.js` (46.7 kB) - Framework chunk
3. Blog admin chunk (496 kB) - Needs splitting

#### 5.3 Middleware Optimization

Current middleware: 25.1 kB

```typescript
// Consider splitting middleware by functionality
// - Auth checks
// - i18n routing
// - API proxying
```

### Phase 6: Performance Monitoring

#### 6.1 Core Web Vitals Tracking

Add performance monitoring:

```typescript
// src/lib/performance-monitor.ts
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric);
  // Send to analytics
}

// src/app/layout.tsx
export { reportWebVitals };
```

#### 6.2 Chrome DevTools MCP Testing

Use existing Chrome DevTools MCP integration:

```bash
# Start performance trace
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})

# Analyze Core Web Vitals
mcp__chrome-devtools__performance_analyze_insight({
  insightName: 'LCPBreakdown'
})
```

**Target Metrics**:

- LCP < 2.5s (currently unknown)
- FID < 100ms
- CLS < 0.1
- TTI < 3.5s

## Implementation Priority

### Week 4 - Sprint 1 (Days 1-3)

**Focus**: Quick wins with highest impact

- [x] ✅ Run bundle analysis
- [ ] 🟡 Implement dynamic imports for blog editor
- [ ] 🟡 Implement dynamic imports for image editor
- [ ] 🟡 Replace `<img>` with `<Image>` (5 files)
- [ ] 🟡 Configure Next.js image optimization

**Expected Impact**: 50-60% reduction in blog admin bundle, 30% reduction in memo job bundle

### Week 4 - Sprint 2 (Days 4-5)

**Focus**: Component-level optimizations

- [ ] 🟡 Dynamic import barcode scanner
- [ ] 🟡 Dynamic import charts
- [ ] 🟡 Dynamic import photo gallery lightbox
- [ ] 🟡 Split blog admin into lazy-loaded tabs
- [ ] 🟡 Split memo job detail tabs

**Expected Impact**: Additional 20-30% reduction across admin routes

### Week 5 - Sprint 1 (Days 1-2)

**Focus**: Advanced optimizations

- [ ] 🟢 Run `depcheck` and remove unused dependencies
- [ ] 🟢 Implement route prefetching strategy
- [ ] 🟢 Add performance monitoring
- [ ] 🟢 Test with Chrome DevTools MCP

**Expected Impact**: 10-15% additional reduction, performance visibility

## Success Metrics

### Before Optimization (Current)

- **Blog Admin**: 842 kB First Load JS
- **Memo Job**: 538 kB First Load JS
- **Average Route**: ~270 kB First Load JS
- **LCP**: Unknown (needs measurement)
- **Build Time**: ~14 seconds

### After Optimization (Target)

- **Blog Admin**: < 400 kB First Load JS (52% reduction)
- **Memo Job**: < 300 kB First Load JS (44% reduction)
- **Average Route**: < 200 kB First Load JS (26% reduction)
- **LCP**: < 2.5s (Good)
- **CLS**: < 0.1 (Good)
- **TTI**: < 3.5s (Good)

## Validation Steps

1. **Run bundle analysis before/after each phase**

   ```bash
   npm run analyze
   ```

2. **Test Core Web Vitals with Chrome DevTools MCP**

   ```bash
   # Start trace, navigate to route, analyze results
   ```

3. **Verify lazy loading behavior**
   - Open Network tab
   - Navigate to routes
   - Confirm chunks load on-demand

4. **Test user experience**
   - Ensure loading states are smooth
   - Verify no broken images
   - Check that dynamic imports don't cause layout shift

## Rollback Plan

If issues occur:

1. **Git branches for each phase** - Easy rollback
2. **Feature flags** - Toggle optimizations
3. **Gradual rollout** - Test one route at a time

## Additional Resources

- **Bundle Reports**: `.next/analyze/*.html`
- **Chrome DevTools MCP**: See `CHROME_DEVTOOLS_MCP.md`
- **Next.js Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing
- **Image Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing/images

---

**Last Updated**: 2025-10-07
**Next Review**: After Phase 1 completion
**Owner**: Development Team
