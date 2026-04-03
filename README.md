# Resort AI

Resort AI is a Next.js dashboard for resort operations. It combines forecasting, staff planning, scheduling, promotions, guest feedback, revenue analysis, notifications, audit logs, and an AI assistant in one admin workspace.

## Features

- Revenue and occupancy analytics with forecast charts and export options.
- Staff recommendation workflow with editable overrides and cost comparisons.
- Scheduling tools with generation, editing, publishing, and export support.
- Promotions management with create, edit, delete, and export actions.
- Guest feedback tracking with filters, summaries, and manual entry.
- Live notifications with unread counts, dropdown actions, and a notifications page.
- Settings management for resort configuration, staffing ratios, notification preferences, system health, and backup download.
- Audit log page for operational history and system changes.
- AI chat assistant for forecasting and operations questions.

## Frontend structure

- `app/` - App Router pages and API proxy routes.
- `components/` - Shared UI components, dashboard shell, chat, sidebar, header, and widgets.
- `hooks/` - Local React hooks such as toast and mobile helpers.
- `lib/` - Client-side API wrappers for backend routes and utility helpers.
- `public/` - Static assets.
- `styles/` - Global CSS.

## Backend connection

The frontend talks to the FastAPI backend through same-origin proxy routes under `app/api/`. The target backend URL is configured through `API_BASE_URL` in `.env`.

## Main pages

- Dashboard
- Promotions
- Feedback
- Revenue
- Scheduling
- Staff
- Notifications
- Settings
- Audit Log

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```
