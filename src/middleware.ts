// Middleware disabled to maintain existing routing structure
// Internationalization handled via custom useIntl hook + UI store

export function middleware() {
  // No middleware needed - using client-side language switching
  return;
}

export const config = {
  matcher: [],
};
