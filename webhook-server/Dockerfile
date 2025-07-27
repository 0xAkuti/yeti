# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

# Install uv with pinned version
COPY --from=ghcr.io/astral-sh/uv:0.5.1 /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies first (better caching)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

# Copy source code
COPY . .

# Install the project in non-editable mode
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-editable

# Create non-privileged user
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/appuser" \
    --uid "10001" \
    appuser && \
    chown -R appuser:appuser /app

# Switch to non-privileged user
USER appuser

# Set environment variables
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV DSTACK_SIMULATOR_ENDPOINT="http://host.docker.internal:8090"

# Expose port
EXPOSE 3001

# Use the installed Python directly from venv (uv recommendation)
CMD ["/app/.venv/bin/python", "main.py"]