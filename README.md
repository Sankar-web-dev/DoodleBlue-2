# DoodleBlue-2

A full-stack campus/community management application with a Next.js frontend (`Client/`) and an Express + MongoDB backend (`Server/`).

**Live frontend:** https://doodle-blue-2.vercel.app

## What this project does

DoodleBlue-2 provides role-aware workflows for campus operations, including:

- Authentication and session-based access
- Role and user management
- Club and club membership management
- Event creation and approval workflows
- Event registrations and attendance tracking
- Certificate request and issuance flows

## Tech summary

| Layer | Stack |
| --- | --- |
| Frontend (`Client`) | Next.js App Router, React 19, TypeScript, Tailwind CSS, Radix UI + shadcn-style components, TanStack Query/Table, React Hook Form, Zod, Zustand, Sonner |
| Backend (`Server`) | Express 5, TypeScript, Mongoose/MongoDB, express-session + connect-mongo, Helmet, CORS, multer, Resend, Zod, Swagger UI/JSDoc |
| Repo tooling | pnpm, Husky, lint-staged |

## Architecture overview

### Responsibilities

- **Client (`Client/`)**
  - UI, route rendering, forms, and API consumption
  - API modules in `Client/api/` (`auth`, `roles`, `users`, `clubs`, `club-memberships`, `events`, `event-registrations`, `attendance`, `certificates`)
  - Route protection in `Client/middleware.ts` via session cookie (`sms.sid` by default, or `SESSION_COOKIE_NAME`)
- **Server (`Server/`)**
  - REST API under `/api/v1/*`
  - Session management, authentication, authorization, validation, persistence, and Swagger docs

### Request and auth/session flow

1. Browser loads protected frontend routes.
2. Next.js middleware checks for the session cookie (`sms.sid` unless overridden).
3. Missing cookie -> redirect to `/login`.
4. Present cookie -> frontend proceeds and calls backend endpoints.
5. Backend validates the session and authorization for protected API routes.
6. API responses drive frontend state/views.

## Repository layout

```text
.
├── Client/
│   ├── app/
│   │   ├── (mainapp)/
│   │   │   ├── dashboard/ roles/ users/
│   │   │   ├── clubs/ club-membership/
│   │   │   ├── events/ event-registration/
│   │   │   ├── attendances/ certificates/ profile/
│   │   └── login/
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── roles.api.ts / users.api.ts
│   │   ├── clubs.api.ts / club-memberships.api.ts
│   │   ├── events.api.ts / event-registrations.api.ts
│   │   └── attendance.api.ts / certificates.api.ts
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── middleware.ts
├── Server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── models/
│   │   ├── modules/
│   │   │   ├── auth/ users/ role/
│   │   │   ├── club/ club-membership/
│   │   │   ├── event/ event-registration/
│   │   │   ├── attendance/ certificate/
│   │   └── scripts/
├── .husky/
├── lint-staged.config.js
└── package.json
```

## Prerequisites

- **Node.js:** a current version compatible with project dependencies
- **pnpm:** `12.11.2` (required by `Server/package.json`)
- **MongoDB:** local instance or MongoDB Atlas
- Environment variables configured for backend (and optional frontend rewrites/cookie overrides)

## Local setup (fresh clone)

From the repository root:

```bash
# 1) Install root tooling (husky/lint-staged)
pnpm install

# 2) Install frontend dependencies
cd Client
pnpm install

# 3) Install backend dependencies
cd ../Server
pnpm install
```

Create backend env file (Server loads `.env.local` first, then `.env`):

```bash
cd /home/runner/work/DoodleBlue-2/DoodleBlue-2/Server
cp .env.example .env.local 2>/dev/null || true
```

If no `.env.example` exists, create `.env.local` manually using the variables below.

### Run in separate terminals

**Terminal 1: backend**

```bash
cd /home/runner/work/DoodleBlue-2/DoodleBlue-2/Server
pnpm dev
```

Backend runs on `http://localhost:5000` by default (or `PORT`).

**Terminal 2: frontend**

```bash
cd /home/runner/work/DoodleBlue-2/DoodleBlue-2/Client
pnpm dev
```

Frontend runs on `http://localhost:3000` by default.

## Environment variables

### Backend (`Server/.env.local` or `Server/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Required to start the server and session store. |
| `SESSION_SECRET` | Yes | Required by `express-session`. |
| `PORT` | No | Defaults to `5000`. |
| `CLIENT_URL` | No | Preferred CORS/client origin value. |
| `CLIENT_ORIGIN` | No | Fallback when `CLIENT_URL` is not set. |
| `NODE_ENV` | No | Affects trust proxy, secure cookies, and docs behavior. |
| `API_DOCS_ENABLED` | No | In production, set `true` to expose `/api-docs` and `/api-docs.json`. |
| `SESSION_COOKIE_NAME` | No | Session cookie name. Defaults to `sms.sid`. |
| `SESSION_SAME_SITE` | No | `none` or `lax` behavior (`lax` fallback). |
| `API_PUBLIC_URL` | No | Adds production server URL to Swagger spec. |
| `RESEND_API_KEY` | No | Enables email sending via Resend. |
| `MAIL_FROM` | No | Sender identity for outbound email. |
| `DNS_SERVERS` | No | Comma-separated DNS resolvers for runtime DNS setup. |
| `SUPER_ADMIN_NAME` | No | Used by seed/reset scripts. |
| `SUPER_ADMIN_EMAIL` | No | Used by seed/reset scripts. |
| `SUPER_ADMIN_PASSWORD` | No | Used by seed/reset scripts. |

### Frontend (`Client`)

| Variable | Required | Notes |
| --- | --- | --- |
| `API_INTERNAL_URL` | No | Rewrite target for `/api/*` and `/uploads/*`; defaults to `http://localhost:5000`. |
| `SESSION_COOKIE_NAME` | No | Must match backend cookie name if overridden; default `sms.sid`. |

Example backend `.env.local`:

```env
MONGODB_URI=mongodb+srv://.../...
SESSION_SECRET=replace-with-a-strong-secret
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
API_DOCS_ENABLED=true
SESSION_COOKIE_NAME=sms.sid
```

## Scripts

### Root

| Command | Purpose |
| --- | --- |
| `pnpm lint` | Runs lint/type checks for both Client and Server. |
| `pnpm test` | Currently not implemented; exits with `Error: no test specified`. |
| `pnpm prepare` | Installs Husky hooks. |

### Frontend (`Client`)

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Next.js dev server. |
| `pnpm build` | Production build. |
| `pnpm start` | Start production server. |
| `pnpm lint` | Run Next.js lint. |

### Backend (`Server`)

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run API with `tsx watch`. |
| `pnpm build` | Compile TypeScript (`src/**/*.ts`) to `dist/`. |
| `pnpm start` | Start compiled server from `dist/server.js`. |
| `pnpm test` | Run Vitest (`vitest run`). |
| `pnpm lint` | Type-check with `tsc --noEmit`. |
| `pnpm seed:super-admin` | Seed super admin user from env vars. |
| `pnpm reset:super-admin` | Reset super admin credentials from env vars. |

## API reference

Default local base URL:

- `http://localhost:5000`

Useful endpoints:

- Health: `GET /api/v1/health`
- Swagger UI (when enabled): `GET /api-docs`
- Swagger JSON (when enabled): `GET /api-docs.json`

Route groups exposed by `Server/src/app.ts`:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/clubs`
- `/api/v1/club-memberships`
- `/api/v1/events`
- `/api/v1/event-registrations`
- `/api/v1/attendance`
- `/api/v1/certificates`

## Authentication and session behavior

- Login creates an HttpOnly session cookie (`sms.sid` by default).
- Frontend middleware guards protected page routes by checking cookie presence before render.
- Backend session/auth middleware remains the source of truth for API authorization and rejects invalid/expired sessions.
- Role-based authorization is enforced server-side per protected resource/action.

## Testing, linting, and pre-commit checks

- Root lint command checks both packages: `pnpm lint`
- Backend tests use Vitest: `cd Server && pnpm test`
- Husky pre-commit runs:
  - `pnpm lint-staged`
  - `pnpm --filter ./Server build`
  - `pnpm --filter ./Client build`
- `lint-staged` enforces:
  - Client changed TS/JS files -> `pnpm --filter ./Client lint`
  - Server changed TS/JS files -> `pnpm --filter ./Server lint`

## Deployment notes

### Frontend (Next.js)

- Deploy `Client/` as a Next.js app.
- Set frontend env vars (for example `API_INTERNAL_URL` where applicable).
- The current deployed homepage is: https://doodle-blue-2.vercel.app

### Backend (Express + MongoDB)

- Deploy `Server/` as a Node.js service.
- Ensure MongoDB connectivity (`MONGODB_URI`) from the hosting environment.
- Configure session/security env vars (`SESSION_SECRET`, cookie settings, CORS origin values).
- Enable API docs in production only when needed via `API_DOCS_ENABLED=true`.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and small.
3. Run lint/tests for affected packages.
4. Open a pull request with clear scope and context.

## License

No root `LICENSE` file is currently present (package manifests include `ISC` metadata).
