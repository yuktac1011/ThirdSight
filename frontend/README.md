# ThirdSight — Frontend Application Shell

Enterprise-grade Third-Party Risk Management (TPRM) and Cybersecurity Intelligence Platform frontend built with React, TypeScript, Vite, and Tailwind CSS.

---

## Getting Started

### Prerequisites

- Node.js (v20+ or v22+ recommended)
- npm (v10+)

### Installation

1. Navigate to the `frontend/` directory from the repository root:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

---

## Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on `http://localhost:3000` |
| `npm run build` | Performs strict TypeScript typechecking and builds production bundle to `dist/` |
| `npm run typecheck` | Runs `tsc --noEmit` with strict checking across all files |
| `npm run preview` | Previews the production build locally |

---

## Architecture & Folder Structure

The frontend utilizes a feature-oriented, scalable enterprise layout:

```text
frontend/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Root application bootstrapping & providers
│   │   ├── App.tsx             # Root component wrapping providers & router
│   │   ├── providers.tsx       # QueryClientProvider, Router, ErrorBoundary
│   │   └── query-client.ts     # TanStack Query client configuration
│   ├── assets/                 # Icons, brand logos, imagery
│   ├── components/             # Reusable UI & layout elements
│   │   ├── common/             # Breadcrumbs, FeedbackStates (loading/empty/error), ErrorBoundary, PlaceholderView
│   │   └── ui/                 # Design system primitives: Button, Input, Card, Badge, Table
│   ├── features/               # Feature-specific modules
│   │   └── overview/           # Risk posture dashboard, telemetry, mock metrics
│   │       ├── components/     # RiskDistributionCard, VendorSummaryTable, AssessmentSummaryCard, etc.
│   │       ├── data/           # Isolated mock fixtures for Increment 01 prototyping
│   │       └── OverviewPage.tsx
│   ├── hooks/                  # Custom application hooks
│   ├── layouts/                # App shell components: Sidebar, Header, MainLayout
│   ├── lib/                    # Shared utilities (clsx/tailwind-merge cn helper) & validated env
│   ├── routes/                 # Centralized routing with feature placeholders
│   ├── services/               # Centralized Axios client with interceptors
│   ├── styles/                 # Tailwind entrypoints & typography rules
│   ├── types/                  # Shared domain types & severity levels
│   ├── main.tsx                # Application entrypoint
│   └── vite-env.d.ts           # Global Vite type declarations
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── index.html                  # HTML entrypoint
├── package.json
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite configuration with '@' alias & port 3000
```

---

## Environment Configuration

Configuration is validated at runtime via **Zod** in [src/lib/env.ts](file:///c:/Users/HP/OneDrive/Desktop/College/Extra/Personal/ThirdSight/frontend/src/lib/env.ts):

- `VITE_API_BASE_URL`: Base URL for the ThirdSight backend REST API (default: `http://localhost:8000/api/v1`).
- `VITE_APP_NAME`: Platform brand name (default: `ThirdSight`).

---

## Design System & Theme

- **Design Philosophy**: Enterprise security intelligence platform; light-first theme; deep slate typography (`#0f172a`, `#1e293b`); restrained risk severity accents (Critical, High, Medium, Low).
- **Icons**: Lucide React.
- **Custom Components**: Clean, high-contrast, accessible enterprise components without unnecessary glassmorphism or bloated animations.
