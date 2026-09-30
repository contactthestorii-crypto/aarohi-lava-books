# Project Memory

## Current Status

Phase 0 (planning & setup) in progress.

## Completed

- Next.js 16.3 scaffold moved to `src/`, git initialised
- Planning docs written
- Book cover cropped to `public/books/target-police-cover.jpg` (763×1119)

## Current Task

TASK-004

## Known Issues / Open Questions

- Author spelling: cover prints "Swathylava Neralla", brief says "Swathyalava Neralla".
  Seed uses the cover spelling; confirm with the publisher.
- No Supabase project, Razorpay keys, Shiprocket account or email provider yet. Everything
  is built behind adapters; end-to-end runs need these credentials.
- No Docker on the dev machine: DB tests run on PGlite.
- Price, MRP, ISBN, pages, weight, dimensions, binding, stock for Target Police unknown:
  product ships as "Price to be announced" until the admin fills them.

## Next Step

Env module + test tooling, then Phase 1 foundation.
