# Homepro Enhancement TODO

## Phase 1: Foundation
- [ ] Update `src/lib/types.ts` — add chat types, helpful votes
- [ ] Update `src/lib/storage.ts` — add chat history & review vote helpers
- [ ] Create `src/hooks/use-scroll-reveal.ts`
- [ ] Update `src/index.css` — dark mode vars + scroll reveal keyframes

## Phase 2: Core Components
- [ ] Create `src/components/ThemeProvider.tsx`
- [ ] Create `src/components/ThemeToggle.tsx`
- [ ] Create `src/components/ToastProvider.tsx`
- [ ] Create `src/components/ServiceFilters.tsx`
- [ ] Create `src/components/ServiceDetailDialog.tsx`
- [ ] Create `src/components/ReviewsSection.tsx`
- [ ] Create `src/components/SupportChatBot.tsx`

## Phase 3: Integration
- [ ] Update `src/main.tsx` — wrap with ThemeProvider + ToastProvider
- [ ] Update `src/App.tsx` — integrate all new components, add toasts

## Phase 4: Testing
- [ ] Run `npm run dev` and verify on localhost

