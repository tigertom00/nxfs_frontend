# Performance Baseline Metrics

**Date**: 2025-10-07
**Build**: Production (Next.js 15.3.5)
**Environment**: Development baseline for optimization

## Bundle Size Analysis

### Critical Routes (Optimization Priority)

| Route                     | Route Size | First Load JS | Status      | Priority |
| ------------------------- | ---------- | ------------- | ----------- | -------- |
| `/blog/admin`             | 496 kB     | **842 kB**    | 🔴 Critical | P0       |
| `/memo/job/[orderNumber]` | 285 kB     | **538 kB**    | 🔴 Critical | P0       |
| `/blog/[slug]`            | 3 kB       | **327 kB**    | 🟡 High     | P1       |
| `/chat`                   | 10.6 kB    | 289 kB        | 🟢 Good     | P2       |
| `/memo/reports`           | 17.7 kB    | 284 kB        | 🟢 Good     | P2       |
| `/` (Homepage)            | 3.86 kB    | 281 kB        | 🟢 Good     | P3       |
| `/tasks`                  | 3.77 kB    | 257 kB        | 🟢 Good     | P3       |
| `/memo/dashboard`         | 9.85 kB    | 270 kB        | 🟢 Good     | P3       |

### Shared Chunks

| Chunk                  | Size       | Description                          |
| ---------------------- | ---------- | ------------------------------------ |
| `chunks/4bd1b696-*.js` | 53.4 kB    | Vendor chunk (React, framework code) |
| `chunks/1684-*.js`     | 46.7 kB    | Shared utilities                     |
| Other shared chunks    | 1.96 kB    | Miscellaneous                        |
| **Total Shared**       | **102 kB** | Loaded on all pages                  |

### Middleware

- **Size**: 25.1 kB
- **Includes**: Authentication, i18n routing, API proxying

## Problem Analysis

### 🔴 Blog Admin Route - 842 kB (496 kB route code)

**Root Causes:**

1. **MDEditor libraries** loaded synchronously (~270 kB):
   - `@mdxeditor/editor` (~150 kB)
   - `@uiw/react-md-editor` (~120 kB)
2. **Media library** with image processing (~50 kB)
3. **Tag management** components (~30 kB)
4. **All components loaded upfront** even when not in use

**Impact:**

- Users wait for ~842 kB before page becomes interactive
- Editor loaded even if user just wants to view post list
- Poor TTI (Time to Interactive)

### 🔴 Memo Job Route - 538 kB (285 kB route code)

**Root Causes:**

1. **Konva/React-Konva** for image editing (~200 kB)
2. **Barcode scanner** with @zxing/library (~300 kB)
3. **Photo gallery** with lightbox (~50 kB)
4. **Material manager** with search (~40 kB)
5. **All tools loaded on page load** regardless of use

**Impact:**

- Heavy initial bundle for features that may not be used immediately
- Timer, materials, photos all loaded synchronously
- Slow page load on mobile connections

### 🟡 Blog Slug Route - 327 kB

**Root Causes:**

1. **React-markdown** with plugins (~80 kB)
2. **Syntax highlighter** for code blocks (~60 kB)
3. **Rich media rendering** libraries

**Impact:**

- Slower blog post reading experience
- Could benefit from dynamic imports for syntax highlighting

## Optimization Targets

### Phase 1: Dynamic Imports (Expected: 50-60% reduction)

**Blog Admin Route: 842 kB → 400 kB**

```typescript
// Lazy load MDEditor (saves ~270 kB initially)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-96" />
});

// Expected result:
// - Initial load: ~570 kB (32% reduction)
// - Editor loaded on-demand when needed
```

**Memo Job Route: 538 kB → 300 kB**

```typescript
// Lazy load heavy tools
const ImageEditor = dynamic(() => import('./image-editor'), { ssr: false });
const BarcodeScanner = dynamic(() => import('./barcode-scanner'), {
  ssr: false,
});
const PhotoGallery = dynamic(() => import('./photo-gallery'), { ssr: false });

// Expected result:
// - Initial load: ~300 kB (44% reduction)
// - Tools loaded only when user clicks respective tabs
```

### Phase 2: Image Optimization (Expected: 30-50% LCP improvement)

**Files with `<img>` tags (5 files):**

1. `src/app/blog/[slug]/page.tsx:166`
2. `src/app/llm-providers/page.tsx:346`
3. `src/components/features/blog/admin/media-library.tsx:281`
4. `src/components/features/blog/blog-posts.tsx:241`
5. `src/components/features/memo/job-detail/photo-gallery.tsx:393`

**Expected Impact:**

- AVIF/WebP format support → 60-80% smaller images
- Lazy loading → Faster initial page load
- Blur placeholders → Better perceived performance
- Responsive srcSet → Appropriate image sizes per device

### Phase 3: Route-Based Code Splitting

**Component-level splitting:**

- Blog admin tabs (editor, media, tags)
- Memo job tabs (timer, materials, photos, files)
- Dashboard widgets (load charts on demand)

**Expected Impact:**

- 20-30% additional reduction
- Better cache utilization
- Faster route transitions

## Performance Budget

### Current State (Before Optimization)

| Metric            | Blog Admin | Memo Job | Average | Target   |
| ----------------- | ---------- | -------- | ------- | -------- |
| **First Load JS** | 842 kB     | 538 kB   | ~270 kB | < 300 kB |
| **Route Code**    | 496 kB     | 285 kB   | ~50 kB  | < 150 kB |
| **Shared Code**   | 102 kB     | 102 kB   | 102 kB  | < 120 kB |
| **LCP**           | Unknown    | Unknown  | Unknown | < 2.5s   |
| **TTI**           | Unknown    | Unknown  | Unknown | < 3.5s   |
| **CLS**           | Unknown    | Unknown  | Unknown | < 0.1    |

### Target State (After Optimization)

| Metric            | Blog Admin | Memo Job | Average  | Status |
| ----------------- | ---------- | -------- | -------- | ------ |
| **First Load JS** | < 400 kB   | < 300 kB | < 200 kB | 🎯     |
| **Route Code**    | < 150 kB   | < 100 kB | < 50 kB  | 🎯     |
| **Shared Code**   | ~102 kB    | ~102 kB  | ~102 kB  | ✅     |
| **LCP**           | < 2.5s     | < 2.5s   | < 2.0s   | 🎯     |
| **TTI**           | < 3.5s     | < 3.0s   | < 2.5s   | 🎯     |
| **CLS**           | < 0.1      | < 0.1    | < 0.05   | 🎯     |

## Heavy Dependencies Identified

| Library                      | Size    | Used In         | Lazy Load? | Priority |
| ---------------------------- | ------- | --------------- | ---------- | -------- |
| `tesseract.js`               | ~2 MB   | OCR scanner     | ❌ → ✅    | P0       |
| `@zxing/library`             | ~300 kB | Barcode scanner | ❌ → ✅    | P0       |
| `konva` + `react-konva`      | ~200 kB | Image editor    | ❌ → ✅    | P0       |
| `@mdxeditor/editor`          | ~150 kB | Blog editor     | ❌ → ✅    | P0       |
| `@uiw/react-md-editor`       | ~120 kB | Blog editor     | ❌ → ✅    | P0       |
| `recharts`                   | ~100 kB | Charts          | ❌ → ✅    | P1       |
| `react-syntax-highlighter`   | ~60 kB  | Code blocks     | ❌ → ✅    | P1       |
| `yet-another-react-lightbox` | ~50 kB  | Photo gallery   | ❌ → ✅    | P1       |

**Total Potential Savings**: ~3 MB

## Network Performance Considerations

### Development Environment

- **Server**: Custom Node.js server with Socket.IO
- **Port**: 3000 (configured for 0.0.0.0)
- **Hot Reload**: Active (adds overhead to bundle)

### Production Recommendations

1. **Enable compression**: Gzip/Brotli for static assets
2. **CDN deployment**: For faster global delivery
3. **HTTP/2**: Multiplexing for parallel downloads
4. **Cache headers**: Aggressive caching for immutable chunks

## Testing Methodology

### Bundle Analysis

```bash
npm run analyze
# Generates reports in .next/analyze/
# - client.html (most important)
# - nodejs.html (server components)
# - edge.html (middleware)
```

### Performance Testing (Recommended)

Due to port conflicts, recommend the following testing approach:

1. **Production build** on separate environment
2. **Chrome DevTools** → Performance tab
3. **Lighthouse CI** for automated testing
4. **Real-user monitoring** with Web Vitals

### Tools Available

- ✅ Bundle Analyzer (configured, working)
- ✅ Chrome DevTools MCP (configured)
- ✅ Playwright E2E (configured)
- ⏳ Lighthouse (can be added)
- ⏳ Web Vitals library (can be added)

## Next Steps

### Immediate Actions (Week 4)

1. **Implement dynamic imports** for blog editor (P0)
2. **Implement dynamic imports** for memo job tools (P0)
3. **Replace `<img>` with `<Image>`** (5 files, P0)
4. **Configure Next.js image optimization** (P0)

### Follow-up Actions (Week 5)

5. **Add performance monitoring** (Web Vitals)
6. **Run Lighthouse audits** on key routes
7. **Implement route prefetching** strategy
8. **Review and remove unused dependencies**

### Success Criteria

- ✅ Blog admin < 400 kB First Load JS
- ✅ Memo job < 300 kB First Load JS
- ✅ All routes < 300 kB average
- ✅ LCP < 2.5s (measured with Lighthouse)
- ✅ No layout shift (CLS < 0.1)

## Monitoring Plan

### Pre-Optimization Baseline

```bash
# Run bundle analysis
npm run analyze

# Measure current bundle sizes
npm run build | grep "First Load JS"

# Document results
# ✅ DONE - see above tables
```

### Post-Optimization Validation

```bash
# 1. After each optimization phase
npm run analyze
npm run build

# 2. Compare bundle sizes
# - Blog admin: 842 kB → target < 400 kB
# - Memo job: 538 kB → target < 300 kB

# 3. Run Lighthouse
npx lighthouse http://localhost:3000/blog/admin --view

# 4. Verify Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

## Risk Assessment

### Low Risk Optimizations

- ✅ Dynamic imports (easy to rollback)
- ✅ Image optimization (Next.js handles gracefully)
- ✅ Bundle analysis (no runtime impact)

### Medium Risk Optimizations

- ⚠️ Route-based code splitting (test SSR behavior)
- ⚠️ Dependency removal (verify no breaking changes)
- ⚠️ Webpack config changes (thorough testing needed)

### Mitigation Strategies

1. **Git branches** for each optimization phase
2. **Incremental rollout** (one route at a time)
3. **Automated testing** (E2E tests catch regressions)
4. **Feature flags** for toggling optimizations

## Conclusion

The baseline bundle analysis reveals **significant optimization opportunities**:

1. **Blog admin** is 3x larger than it needs to be (842 kB vs target 400 kB)
2. **Memo job** is 2x larger than optimal (538 kB vs target 300 kB)
3. **Heavy libraries** (~3 MB total) loaded without code splitting
4. **Image optimization** not used (5 files with `<img>` tags)

**Implementing Phase 1 and 2 optimizations will deliver**:

- **50-60% reduction** in bundle sizes for heavy routes
- **30-50% improvement** in LCP times
- **Better user experience** on slow connections
- **Improved SEO** through better Core Web Vitals scores

See `docs/PERFORMANCE_OPTIMIZATION.md` for detailed implementation plan.

---

**Last Updated**: 2025-10-07
**Next Review**: After Phase 1 implementation
**Owner**: Development Team
