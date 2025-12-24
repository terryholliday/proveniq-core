
# DISCOVERY_BLOCK

## Nested paths found
- `proveniq-core/proveniq-core/backend` (Appears to be a Python backend)
- `src/` (Mixed content: `config`, `genome`, `identity`, `provenance`)
- `app/` (Next.js App Router)
- `components/` (React Components)
- `lib/` (Utilities)

## What will be moved to `archive/`
- `app/` -> `archive/_legacy_ui/app`
- `components/` -> `archive/_legacy_ui/components`
- `hooks/` -> `archive/_legacy_ui/hooks`
- `messages/` -> `archive/_legacy_ui/messages`
- `public/` -> `archive/_legacy_ui/public`
- `styles/` (if exists) -> `archive/_legacy_ui/styles`
- `next.config.*` -> `archive/_legacy_ui/`
- `tailwind.config.ts` -> `archive/_legacy_ui/`
- `postcss.config.js` -> `archive/_legacy_ui/`
- `middleware.ts` -> `archive/_legacy_ui/`
- `mdx-components.tsx` -> `archive/_legacy_ui/`
- `headers.config.js` -> `archive/_legacy_ui/`
- `proveniq-core/` (The nested Python backend) -> `archive/_legacy_python_backend`

## What will be preserved and rehomed into `services/core`
- `src/` content will be reviewed. `src/config`, `src/genome` might be relevant domain logic, but likely needs refactoring for the new "Read-Only" architecture. I will initially move `src` to `archive/_legacy_src` to inspect and cherry-pick, ensuring a clean slate in `services/core/src`.
- `lib/` content will also be moved to `archive/_legacy_ui/lib` as it likely contains frontend-specific code.

## Strategy
- Create `archive/_legacy_ui` and `archive/_legacy_python_backend`.
- Move everything legacy.
- Create `services/core` from scratch.
- Create root `package.json` for workspace or just simple service runner.
