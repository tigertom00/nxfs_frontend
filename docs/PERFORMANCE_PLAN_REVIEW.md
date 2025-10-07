# Performance Optimization Plan - Review & Adjustments

**Date**: 2025-10-07
**Purpose**: Review optimization plan and make adjustments before implementation

## Current Plan Summary

### Targets Identified

| Route      | Current | Target   | Reduction | Libraries to Optimize                               |
| ---------- | ------- | -------- | --------- | --------------------------------------------------- |
| Blog Admin | 842 kB  | < 400 kB | -52%      | MDEditor (~270 kB)                                  |
| Memo Job   | 538 kB  | < 300 kB | -44%      | Konva (~200 kB), ZXing (~300 kB), Tesseract (~2 MB) |
| Blog Slug  | 327 kB  | < 250 kB | -24%      | React-markdown, syntax highlighter                  |

### Proposed Phases

1. **Phase 1**: Dynamic imports for heavy libraries (5-7 libraries)
2. **Phase 2**: Image optimization (5 files)
3. **Phase 3**: Component-level code splitting
4. **Phase 4**: Bundle analysis & tree shaking
5. **Phase 5**: Advanced optimizations
6. **Phase 6**: Performance monitoring

## Questions for Review

### 1. Priority & Scope

**Q: Should we tackle all routes at once or focus incrementally?**

**Options:**

- **A) Incremental (Recommended)**: Start with blog admin only, measure, then memo job
  - ✅ Easier to debug issues
  - ✅ Can rollback easily
  - ✅ Learn from first implementation
  - ❌ Takes longer overall

- **B) Parallel**: Do blog admin + memo job simultaneously
  - ✅ Faster completion
  - ❌ Harder to isolate issues
  - ❌ More risky

- **C) Blog admin only**: Focus entirely on worst offender
  - ✅ Maximum focus, best results
  - ✅ Proves the approach
  - ❌ Memo job remains slow

**Recommendation**: **Option A** - Start with blog admin, prove the approach, then apply to memo job.

---

### 2. Tesseract.js Handling

**Q: Tesseract.js is 2 MB - should we reconsider its usage?**

**Current State:**

- Used in `barcode-scanner.tsx` for OCR text recognition
- Helps read EL-numbers from product images
- Only used when user explicitly switches to "text mode"

**Options:**

- **A) Keep with dynamic import (Recommended)**
  - Load only when user clicks "text mode" button
  - Most users won't need it
  - Good user experience for those who do

- **B) Remove entirely**
  - Simplify codebase
  - Users must manually type EL-numbers
  - Worse UX for field workers

- **C) Server-side API**
  - Move OCR to backend
  - Better performance
  - ⚠️ Requires backend changes

**Recommendation**: **Option A** - Dynamic import, load only when text mode activated.

**Implementation:**

```typescript
// In barcode-scanner.tsx
const initializeOCR = async () => {
  if (!ocrWorkerRef.current) {
    const Tesseract = await import('tesseract.js');
    ocrWorkerRef.current = await Tesseract.createWorker();
  }
};

// Call only when switching to text mode
const handleTextModeActivation = async () => {
  setIsOCRProcessing(true);
  await initializeOCR();
  // ... rest of OCR logic
};
```

---

### 3. MDEditor - Two Libraries?

**Q: Why use both `@mdxeditor/editor` AND `@uiw/react-md-editor`?**

**Current imports in `blog-editor.tsx`:**

```typescript
import MDEditor from '@uiw/react-md-editor';
```

**Analysis:**

- Only `@uiw/react-md-editor` is actually imported
- `@mdxeditor/editor` might be unused or imported elsewhere

**Action needed:**

1. Search for `@mdxeditor/editor` usage
2. If unused, remove from package.json
3. If used, decide which editor to keep

**Recommendation**: Verify usage and standardize on ONE markdown editor.

---

### 4. Image Optimization Approach

**Q: Should we use Next.js Image component or consider alternatives?**

**Options:**

- **A) Next.js Image component (Recommended)**
  - ✅ Built-in optimization
  - ✅ Automatic AVIF/WebP
  - ✅ Lazy loading by default
  - ⚠️ Requires image size specifications

- **B) Sharp + custom loader**
  - ✅ More control
  - ❌ More maintenance
  - ❌ Reinventing the wheel

- **C) CDN with image service (Cloudinary, imgix)**
  - ✅ Advanced features
  - ✅ Better global performance
  - ❌ External dependency
  - ❌ Potential costs

**Recommendation**: **Option A** - Use Next.js Image, configure remote patterns for api.nxfs.no

**Configuration needed:**

```typescript
// next.config.ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'api.nxfs.no', pathname: '/media/**' }
  ],
  formats: ['image/avif', 'image/webp'],
}
```

---

### 5. Loading States & UX

**Q: What loading experience should users see during dynamic imports?**

**Options:**

- **A) Skeleton loaders (Recommended)**
  - ✅ Better perceived performance
  - ✅ Matches component shape
  - ✅ Professional feel

- **B) Simple "Loading..." text**
  - ✅ Easy to implement
  - ❌ Less polished

- **C) No loading state**
  - ❌ Confusing for users
  - ❌ Bad UX

**Recommendation**: **Option A** - Use skeleton loaders from shadcn/ui

**Example:**

```typescript
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" /> {/* Toolbar */}
      <Skeleton className="h-96 w-full" /> {/* Editor */}
    </div>
  )
});
```

---

### 6. Testing Strategy

**Q: How should we validate optimizations?**

**Proposed approach:**

1. **Baseline measurement** (✅ Done)
   - Bundle sizes recorded
   - Performance baseline documented

2. **After each optimization:**
   - Run `npm run analyze`
   - Compare bundle sizes
   - Test functionality manually
   - Run E2E tests

3. **Final validation:**
   - Lighthouse audit on all optimized routes
   - Real device testing (mobile, slow connection)
   - Check Core Web Vitals

**Additional testing needed?**

- Visual regression testing?
- Load testing under production-like conditions?
- A/B testing with real users?

**Recommendation**: Start with basic validation (bundle analysis + manual testing), add Lighthouse after Phase 1.

---

### 7. Rollback Plan

**Q: What's our strategy if an optimization causes issues?**

**Proposed approach:**

- **Git branching**: Each phase gets its own branch
- **Feature flags**: Optional, but adds complexity
- **Incremental commits**: Small, atomic changes
- **Quick rollback**: `git revert` if needed

**Additional safety measures:**

- Keep old implementations commented for easy restoration?
- Deploy to staging environment first?
- Gradual rollout to production (10% → 50% → 100%)?

**Recommendation**: Git branching + atomic commits should be sufficient for this project.

---

### 8. Recharts Usage

**Q: Where is recharts used and is it critical?**

**Need to verify:**

- Check usage in Claude monitor dashboard
- Check usage in system monitor
- Check usage in memo dashboards

**Options:**

- **A) Dynamic import per chart type**
- **B) Dynamic import entire recharts module**
- \*\*C) Consider lighter alternative (Chart.js, lightweight charting library)

**Action**: Verify usage before deciding.

---

### 9. Blog [slug] Route Optimization

**Q: Should we prioritize blog slug route (327 kB)?**

**Considerations:**

- Public-facing route (SEO important)
- Simpler to optimize than admin routes
- Could be "quick win" #2 after blog admin

**Options:**

- **A) Include in Phase 1** with blog admin
- **B) Phase 1.5** after blog admin proven
- **C) Phase 2** separate focus

**Recommendation**: **Option B** - Do blog admin first, then blog slug as validation.

---

### 10. Implementation Order

**Q: What's the optimal order within Phase 1?**

**Proposed order:**

1. ✅ Blog admin - MDEditor dynamic import
2. ✅ Blog admin - Test & measure
3. ✅ Memo job - Image editor dynamic import
4. ✅ Memo job - Barcode scanner + ZXing dynamic import
5. ✅ Memo job - Tesseract.js lazy initialization
6. ✅ Memo job - Test & measure
7. ✅ Image optimization (5 files)
8. ✅ Final measurement

**Alternative order:**

1. All dynamic imports at once
2. Test together
3. Image optimization
4. Final measurement

**Recommendation**: **Sequential order** - Safer, easier to debug.

---

## Adjusted Implementation Plan

### Phase 1A: Blog Admin Optimization (Days 1-2)

**Scope:** Blog admin route only (842 kB → target < 400 kB)

**Tasks:**

1. ✅ Verify `@mdxeditor/editor` usage (check if actually used)
2. ✅ Dynamic import `@uiw/react-md-editor` in blog-editor.tsx
3. ✅ Add skeleton loading state
4. ✅ Test editor functionality (create, edit, preview)
5. ✅ Run bundle analysis
6. ✅ Measure improvement
7. ✅ Run E2E tests
8. ✅ Commit changes

**Expected result:** Blog admin < 600 kB (realistic first step)

---

### Phase 1B: Memo Job Optimization (Days 3-4)

**Scope:** Memo job route (538 kB → target < 300 kB)

**Tasks:**

1. ✅ Dynamic import image-editor.tsx (konva/react-konva)
2. ✅ Dynamic import barcode-scanner.tsx (@zxing/library)
3. ✅ Lazy initialize tesseract.js (only when text mode activated)
4. ✅ Add skeleton loading states for all
5. ✅ Test all memo job features (timer, materials, photos, scanning)
6. ✅ Run bundle analysis
7. ✅ Measure improvement
8. ✅ Run E2E tests
9. ✅ Commit changes

**Expected result:** Memo job < 350 kB (realistic with all optimizations)

---

### Phase 1C: Image Optimization (Day 5)

**Scope:** Replace 5 `<img>` tags with Next.js `<Image>`

**Tasks:**

1. ✅ Configure Next.js image settings (remote patterns, formats)
2. ✅ Replace `<img>` in blog/[slug]/page.tsx
3. ✅ Replace `<img>` in llm-providers/page.tsx
4. ✅ Replace `<img>` in media-library.tsx
5. ✅ Replace `<img>` in blog-posts.tsx
6. ✅ Replace `<img>` in photo-gallery.tsx
7. ✅ Test all image-heavy pages
8. ✅ Verify lazy loading working
9. ✅ Commit changes

**Expected result:** Faster LCP, better mobile performance

---

### Phase 2: Measurement & Validation (Day 6-7)

**Tasks:**

1. ✅ Run Lighthouse on all optimized routes
2. ✅ Document before/after metrics
3. ✅ Test on slow connection (throttling)
4. ✅ Mobile device testing
5. ✅ Update TODO.md with results
6. ✅ Create summary report

---

### Phase 3: Additional Optimizations (Week 5)

**Based on Phase 1-2 results:**

- Recharts optimization (if needed)
- Blog slug route optimization
- Component-level splitting
- Dependency cleanup

---

## Open Questions

### Before Starting Implementation

1. **@mdxeditor/editor**: Is it actually used? Should we remove it?
2. **Recharts**: Where exactly is it used? Can we lazy load it?
3. **Environment**: Should we test on production build or dev?
4. **Monitoring**: Should we add Web Vitals tracking before optimizing?
5. **Stakeholders**: Should anyone review this plan first?

### Technical Decisions Needed

6. **Skeleton design**: Use existing shadcn/ui skeletons or custom?
7. **Error handling**: What if dynamic import fails? Fallback UI?
8. **SSR**: Keep `ssr: false` for all dynamic imports?
9. **Prefetching**: Should we prefetch heavy components on hover?
10. **Cache strategy**: Any specific caching for dynamic imports?

---

## Risk Assessment

### Low Risk ✅

- Blog admin MDEditor dynamic import (easy rollback)
- Image optimization (Next.js handles gracefully)
- Tesseract.js lazy load (self-contained feature)

### Medium Risk ⚠️

- Image editor dynamic import (complex component with konva)
- Barcode scanner dynamic import (critical memo job feature)
- Multiple changes at once (harder to debug)

### Mitigation Strategies

1. One optimization at a time
2. Thorough testing before moving forward
3. Keep old code commented for quick restoration
4. Have rollback plan ready
5. Test on staging/dev first

---

## Recommendations Summary

### Highest Priority Adjustments

1. **Verify @mdxeditor/editor usage** - May already be unused
2. **Incremental approach** - Do blog admin first, measure, then continue
3. **Skeleton loaders** - Better UX than simple loading text
4. **Tesseract.js lazy init** - Don't load until text mode activated
5. **Next.js Image with proper config** - Standard approach, works well

### Timeline Adjustment

- **Original**: "Week 4" (5 days)
- **Adjusted**: 7 days more realistic
  - Days 1-2: Blog admin
  - Days 3-4: Memo job
  - Day 5: Images
  - Days 6-7: Testing & validation

### Success Criteria (Adjusted)

**Realistic targets after Phase 1:**

- Blog admin: 842 kB → **< 600 kB** (-29%) [Was: < 400 kB]
- Memo job: 538 kB → **< 350 kB** (-35%) [Was: < 300 kB]
- Images: Faster LCP (measurable with Lighthouse)

**Stretch targets for Phase 2+:**

- Blog admin: < 400 kB (-52%)
- Memo job: < 300 kB (-44%)

---

## Next Steps

1. **Review this document** with team/stakeholders
2. **Answer open questions** (#1-10 above)
3. **Create implementation branch**: `feature/performance-optimization-phase-1`
4. **Start with Phase 1A**: Blog admin optimization
5. **Document everything**: Keep notes of what works/doesn't work

---

**Ready to proceed?** Please review and confirm:

- ✅ Incremental approach (blog admin → memo job → images)
- ✅ Adjusted success criteria (realistic targets)
- ✅ 7-day timeline instead of 5
- ✅ Answer any open questions before starting
