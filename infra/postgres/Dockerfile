# infra/postgres/Dockerfile
# PostgreSQL 16 (Debian slim) with pg_cron installed.
# Using the debian variant because pg_cron is packaged as postgresql-16-cron in apt.
FROM postgres:16

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-cron \
    && rm -rf /var/lib/apt/lists/*
