# How to use this docker dev container

## What's included

A single `node:22-bullseye` container, running as the `node` user (with passwordless `sudo`). It comes with git, npm and [Claude Code](https://docs.claude.com/en/docs/claude-code) installed.

Global npm packages (`npm install -g ...`) go to `/usr/local/share/npm-global`, which the `node` user can write to, so you don't need `sudo` for them.

## Prerequisites

1. Docker installed on your system (on Windows, use WSL, since running dev containers natively is slow as hell)
2. VSCode with the Dev Containers extension installed
3. These folders must exist on your host, because they are bind-mounted into the container:
   - `~/.ssh`: your SSH keys, so you can push to GitHub from inside the container
   - `~/.claude`: your Claude Code config, credentials and session history

   If either one is missing, the container will fail to start. Create it with `mkdir -p ~/.ssh ~/.claude`.

## Starting the dev container

1. Open this directory (`.../frontend/`) with VSCode
2. Open the command palette and run "Dev Containers: Reopen in Container"

The whole repo (the folder containing `.git`) is mounted at `/workspaces/sesy`, and VSCode opens `/workspaces/sesy/frontend`. This lets git work normally inside the container.

## Initial configuration

When starting the devcontainer for the first time or when regenerating it, install the dependencies:

```bash
npm install
```

## Running the dev server

```bash
npm run dev
```

Vite serves the app on port `5173`, and VSCode forwards it to `http://localhost:5173` on your host.

In dev mode, the app calls the backend at `http://localhost:8000`. So the backend dev container must also be open in another VSCode window, with the Django server running (see `backend/.devcontainer/README.md`). Both containers reach your host through VSCode's port forwarding, so each window has to stay open.

## Regenerating the API client

The API client in `src/api/django` is generated with [orval](https://orval.dev) from the OpenAPI schema at `src/api/schemas/django/schema.yaml`. After updating the schema, run:

```bash
npm run orvalDjango
```
