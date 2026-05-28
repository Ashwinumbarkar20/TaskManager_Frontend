# Task Manager Frontend

Frontend application for the Task Manager system built with React, Vite, Tailwind CSS, and shadcn-style UI components.

## Features

- User authentication (Login / Signup)
- User dashboard with:
  - Task list
  - Create, update, delete task
  - Mark task as completed/pending
  - Filter by all/completed/pending
  - Search tasks
- Optimized UI behavior (no full list reload on update/delete/status change/create)
- Admin-specific UI with:
  - Dashboard stats
  - User list
  - Activate/deactivate users
  - User search and active/inactive filtering
- Responsive layout for desktop and mobile

## Tech Stack

- React (functional components + hooks)
- Vite
- Tailwind CSS
- shadcn-style component setup
- Axios
- React Router

## Backend API

Base URL used in frontend:

`https://taskmanager-backend-lm8b.onrender.com/api`

## Project Structure

```txt
src/
  components/
    auth/
    tasks/
    ui/
  context/
  lib/
  pages/
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Lint

```bash
npm run lint
```

### 5) End-to-end API test (live backend)

```bash
npm run test:e2e
```

Runs automated checks for auth, tasks CRUD, filters, and admin APIs against the deployed backend.

## User Roles

- **User**: gets task dashboard UI
- **Admin**: gets admin dashboard UI with users/statistics controls

Role-based rendering is handled in `src/App.jsx`.

## Notes

- Auth token is stored in `localStorage` (`task_token`).
- API requests use Axios with auth interceptor from `src/lib/api.js`.
- Admin APIs used:
  - `GET /admin/dashboard`
  - `GET /admin/users`
  - `PATCH /admin/users/:userId/status`
