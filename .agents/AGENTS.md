# Agent Rules for BeFit Project Restructuring

To ensure clean separation of concerns and correct directory routing, future AI agent operations must adhere to the following directory rules:

## 1. Directory Routing
* **Frontend Requests**: All frontend tasks (React, styles, client assets, component design, routing, state management) must be routed to the `frontend/` subdirectory.
  * Absolute base path: [frontend](file:///c:/Users/Ajay%20kaveti/OneDrive/Desktop/befit/frontend)
  * Example: Create components in `frontend/src/components/`, pages in `frontend/src/pages/`, etc.
* **Backend Requests**: All backend tasks (API server, database schemas, server configuration, route handlers) must be routed to the `backend/` subdirectory.
  * Absolute base path: [backend](file:///c:/Users/Ajay%20kaveti/OneDrive/Desktop/befit/backend)

## 2. Command Execution Working Directory (Cwd)
* Always set the `Cwd` parameter of the `run_command` tool to the specific package directory being operated on:
  * For frontend commands (e.g., `npm install`, `npm run dev`, `npm run build`), use [frontend](file:///c:/Users/Ajay%20kaveti/OneDrive/Desktop/befit/frontend) as the working directory.
  * For backend commands, use [backend](file:///c:/Users/Ajay%20kaveti/OneDrive/Desktop/befit/backend) as the working directory.

## 3. Tool Usage
* When reading, creating, or editing project files, verify that you are referencing paths within the correct subdirectory (`frontend/` or `backend/`). Avoid placing files at the root level of the workspace unless explicitly required (e.g., global configuration updates like root `.gitignore`).
