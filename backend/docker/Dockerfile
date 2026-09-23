FROM python:3.11-bullseye

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/

# Use the system Python and put the project venv on the PATH so python, gunicorn and celery resolve to it
ENV UV_PYTHON_DOWNLOADS=never \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# Copy only dependency files first (for better cache efficiency)
COPY pyproject.toml uv.lock .python-version /app/backend/

# Install dependencies (this layer will be cached unless pyproject.toml or uv.lock change)
RUN uv sync --locked --no-dev --no-install-project

# Create directories and volumes (these rarely change)
RUN mkdir -p /app/backend/media

VOLUME /app/backend/media
VOLUME /app/backend/django_static

# Copy all the code (this should be last to maximize cache hits)
COPY . .

# Set permissions on entrypoint scripts (after copying code)
RUN chmod +x /app/backend/docker/entrypoint-django.sh && \
    chmod +x /app/backend/docker/entrypoint-worker.sh && \
    chmod +x /app/backend/docker/entrypoint-beat.sh

ENTRYPOINT ["/app/backend/docker/entrypoint-django.sh"]