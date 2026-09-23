# How to use this docker dev container

## What's included

The dev container is a Docker Compose project (`sesy-backend`) with three services:

| Service    | Image                  | Notes                                                         |
| ---------- | ---------------------- | ------------------------------------------------------------- |
| `django`   | `python:3.11-bullseye` | The container VSCode attaches to. Runs as the `vscode` user.  |
| `postgres` | `postgres:16-bullseye` | User/password `django`/`django`. Exposed on host port `5432`. |
| `redis`    | `redis:alpine`         | Only reachable from inside the dev network.                   |

The `django` container also comes with git, [uv](https://docs.astral.sh/uv/) and [Claude Code](https://docs.claude.com/en/docs/claude-code) installed.

All services share the `django-dev` Docker network, which the frontend dev container also joins so it can reach the backend.

## Prerequisites

1. Docker installed on your system (on Windows, use WSL, since running dev containers natively is slow as hell)
2. VSCode with the Dev Containers extension installed
3. These folders must exist on your host, because they are bind-mounted into the container:
   - `~/.ssh`: your SSH keys, so you can push to GitHub from inside the container
   - `~/.claude`: your Claude Code config, credentials and session history

   If either one is missing, the container will fail to start. Create it with `mkdir -p ~/.ssh ~/.claude`.

## Starting the dev container

1. Open this directory (`.../backend/`) with VSCode
2. Open the command palette and run "Dev Containers: Reopen in Container"

The whole repo (the folder containing `.git`) is mounted at `/workspaces/sesy`, and VSCode opens `/workspaces/sesy/backend`. This lets git work normally inside the container.

## Initial configuration

When starting the devcontainer for the first time or when regenerating it, you will need to:

1. Create your env file: `cp .env.template .env`. The defaults already match the compose services.
2. Install dependencies: `uv sync`
3. Run migrations: `uv run python manage.py migrate`

## Running the server

```bash
uv run python manage.py runserver 0.0.0.0:8000
```

VSCode forwards the port automatically. The frontend (at `http://localhost:5173`) expects the backend on `localhost:8000`.

## Rebuild vs. reopen

- **Reopen in Container** is enough after code or `.env` changes.
- **Rebuild Container** is needed after changing anything in this `.devcontainer` folder: the `Dockerfile`, `devcontainer.json` (features, mounts, env) or `docker-compose.yml`.

## Resetting the database

Sometimes the django migrations and the database can get messed up.

The easiest way out is to reset the database:

1. Close VSCode and stop the dev containers
2. Delete the postgres container and remove the `sesy-backend_postgresdata` volume
3. Restart VSCode and reopen in container (no need to rebuild)
4. A clean database will be created automatically
5. Run `uv run python manage.py migrate`
