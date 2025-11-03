## Frontend Context

### Tech stack
- React 19 + Vite
- React Router DOM 7
- Tailwind CSS 3.4
- Framer Motion 12

### Path aliases
- `@` → `frontend/src/` (see `frontend/vite.config.js`)

### Entry points
- `frontend/src/main.jsx` mounts `<App />`
- `frontend/src/App.jsx` defines all routes

### Routing map
- `/` → `pages/LandingPage.jsx` (composed of `components/landing/ActOne..ActFive`)
- `/login` → `pages/auth/LoginPage.jsx`
- `/signup` → `pages/auth/SignupPage.jsx`
- `/verify` → `pages/auth/VerifyPage.jsx`
- `/auth/callback` → `pages/auth/CallbackPage.jsx`
- `/dashboard` (protected by `components/common/ProtectedRoute.jsx`, layout `components/layout/DashboardLayout.jsx`)
  - `/dashboard/overview` → `pages/dashboard/Overview.jsx`
  - `/dashboard/repositories` → `pages/dashboard/Repositories.jsx`
  - `/dashboard/documentation` → `pages/dashboard/Documentation.jsx`
  - `/dashboard/profile` → `pages/dashboard/Profile.jsx`

### Key modules used by routes
- Context: `contexts/AuthContext.jsx`
- Services: `services/api.js`, `services/authService.js`, `services/repositoryService.js`
- Repository workflow components (used in dashboard pages):
  - `components/repository/GitHubConnectionStatus.jsx`
  - `components/repository/RepositorySync.jsx`
  - `components/repository/RepositorySelection.jsx`
  - `components/repository/FileSyncAnalysis.jsx`
  - `components/repository/DocumentationGeneration.jsx`
  - `components/repository/DocumentationViewer.jsx`
- Landing UI utilities (used by Act components):
  - `components/ui/DecodeText.jsx`, `GlowButton.jsx`, `ParallaxElement.jsx`, `FunctionDemo.jsx`, `FeatureCard.jsx`, `EncryptedNumbers.jsx`

### Unused files and safe-to-delete candidates
Based on the current import graph and routes, these are not referenced anywhere:

- Pages
  - `src/pages/Landing.jsx`
  - `src/pages/DarkLanding.jsx`
  - `src/pages/DashBoard.jsx`

- Components (duplicates/legacy)
  - `src/components/ProtectedRoute.jsx` (duplicate; App uses `components/common/ProtectedRoute.jsx`)
  - `src/components/dashboard/Dashboard.jsx`
  - `src/components/common/Header.jsx`
  - `src/components/common/Hero.jsx`
  - `src/components/common/Footer.jsx`

- Legacy landing components (superseded by ActOne..ActFive)
  - `src/components/landing/Hero.jsx`
  - `src/components/landing/Features.jsx`
  - `src/components/landing/HowItWorks.jsx`
  - `src/components/landing/CTA.jsx`
  - `src/components/landing/Footer.jsx`

- Auth components (pages use inline forms)
  - `src/components/auth/LoginForm.jsx`
  - `src/components/auth/SignupForm.jsx`
  - `src/components/auth/EmailVerificationForm.jsx`
  - `src/components/auth/OAuthCallback.jsx`

- UI atoms apparently unused across the app (kept only if you plan to use shadcn-Radix primitives)
  - `src/components/ui/avatar.jsx`
  - `src/components/ui/badge.jsx`
  - `src/components/ui/button.jsx`
  - `src/components/ui/card.jsx`
  - `src/components/ui/input.jsx`
  - `src/components/ui/navigation-menu.jsx`
  - `src/components/ui/separator.jsx`
  - `src/components/ui/CodeBlock.jsx`

Notes:
- `src/hooks/useSyncHeight.js` is referenced by `components/ui/FunctionDemo.jsx` and should be kept.
- All repository-related components listed above are actively used in dashboard pages and should be kept.

### Cleanup checklist
- Remove the files listed in “Unused files and safe-to-delete candidates”.
- After deletion, run the dev server to verify no unresolved imports remain.

### Build tooling
- `frontend/vite.config.js` sets `@` alias to `src/`
- Tailwind + PostCSS configured via `tailwind.config.js` and `postcss.config.cjs`

